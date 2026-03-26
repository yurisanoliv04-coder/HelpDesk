'use server'

import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/config'
import { revalidatePath } from 'next/cache'

export interface PurchaseData {
  id: string
  title: string
  supplier: string | null
  quantity: number
  unitPrice: number | null
  invoiceNumber: string | null
  purchaseDate: string | null
  categoryId: string | null
  categoryName: string | null
  categoryKind: string | null
  status: 'PENDING' | 'RECEIVED' | 'CANCELED'
  notes: string | null
  imageData: string | null
  specifications: string | null
  buyerId: string | null
  buyerName: string | null
  orderedById: string | null
  orderedByName: string | null
  createdById: string
  createdByName: string
  createdAt: string
  updatedAt: string
}

function mapPurchase(p: {
  id: string; title: string; supplier: string | null; quantity: number
  unitPrice: { toNumber(): number } | null; invoiceNumber: string | null; purchaseDate: Date | null
  categoryId: string | null; status: string; notes: string | null
  imageData: string | null; specifications: string | null
  buyerId: string | null; orderedById: string | null
  createdById: string; createdAt: Date; updatedAt: Date
  category: { name: string; kind: string } | null
  buyer: { name: string } | null
  orderedBy: { name: string } | null
  createdBy: { name: string }
}): PurchaseData {
  return {
    id: p.id,
    title: p.title,
    supplier: p.supplier,
    quantity: p.quantity,
    unitPrice: p.unitPrice ? Number(p.unitPrice) : null,
    invoiceNumber: p.invoiceNumber,
    purchaseDate: p.purchaseDate?.toISOString() ?? null,
    categoryId: p.categoryId,
    categoryName: p.category?.name ?? null,
    categoryKind: p.category?.kind ?? null,
    status: p.status as PurchaseData['status'],
    notes: p.notes,
    imageData: p.imageData,
    specifications: p.specifications,
    buyerId: p.buyerId,
    buyerName: p.buyer?.name ?? null,
    orderedById: p.orderedById,
    orderedByName: p.orderedBy?.name ?? null,
    createdById: p.createdById,
    createdByName: p.createdBy.name,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }
}

const INCLUDE = {
  category: { select: { name: true, kind: true } },
  buyer: { select: { name: true } },
  orderedBy: { select: { name: true } },
  createdBy: { select: { name: true } },
} as const

export async function getPurchaseById(id: string): Promise<PurchaseData | null> {
  const p = await prisma.purchase.findUnique({ where: { id }, include: INCLUDE })
  if (!p) return null
  return mapPurchase(p)
}

export interface PurchasePage {
  data: PurchaseData[]
  total: number      // total after all filters (for pagination UI)
  page: number
  pageSize: number
  totalPages: number
}

export async function getPurchases(filters?: {
  status?: string
  categoryId?: string
  q?: string
  dateFrom?: string
  dateTo?: string
  supplier?: string
  minTotal?: string
  maxTotal?: string
  page?: number
  pageSize?: number
}): Promise<PurchasePage> {
  const page     = Math.max(1, filters?.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, filters?.pageSize ?? 20))

  const where: Record<string, unknown> = {}
  if (filters?.status) where.status = filters.status
  if (filters?.categoryId) where.categoryId = filters.categoryId
  if (filters?.q) {
    where.OR = [
      { title:    { contains: filters.q, mode: 'insensitive' } },
      { supplier: { contains: filters.q, mode: 'insensitive' } },
      { invoiceNumber: { contains: filters.q, mode: 'insensitive' } },
    ]
  }
  if (filters?.supplier) where.supplier = { contains: filters.supplier, mode: 'insensitive' }
  if (filters?.dateFrom || filters?.dateTo) {
    where.purchaseDate = {
      ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
      ...(filters.dateTo   ? { lte: new Date(filters.dateTo + 'T23:59:59') } : {}),
    }
  }

  const hasValueFilter = !!(filters?.minTotal || filters?.maxTotal)

  if (hasValueFilter) {
    // Fetch all matching rows, apply JS total-price filter, then slice
    const rows = await prisma.purchase.findMany({ where, include: INCLUDE, orderBy: { createdAt: 'desc' } })
    let result = rows.map(mapPurchase)
    if (filters?.minTotal) {
      const min = parseFloat(filters.minTotal)
      if (!isNaN(min)) result = result.filter(p => p.unitPrice != null && p.unitPrice * p.quantity >= min)
    }
    if (filters?.maxTotal) {
      const max = parseFloat(filters.maxTotal)
      if (!isNaN(max)) result = result.filter(p => p.unitPrice != null && p.unitPrice * p.quantity <= max)
    }
    const total = result.length
    const data  = result.slice((page - 1) * pageSize, page * pageSize)
    return { data, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) }
  }

  // Fast path: DB-level pagination + count
  const [rows, total] = await Promise.all([
    prisma.purchase.findMany({
      where,
      include: INCLUDE,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.purchase.count({ where }),
  ])

  return {
    data: rows.map(mapPurchase),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}

/**
 * Creates a purchase and — when status is RECEIVED and a category is selected —
 * automatically handles stock/asset creation:
 *  - ACCESSORY/DISPOSABLE → increments stockQuantity by quantity
 *  - EQUIPMENT + deferAsset=true → creates IRREGULAR placeholder asset(s)
 *  - EQUIPMENT + deferAsset=false → returns { ok: true, redirectTo: '/assets/new?...' }
 */
export async function createPurchase(data: {
  title: string
  supplier?: string
  quantity: number
  unitPrice?: number
  invoiceNumber?: string
  purchaseDate?: string
  categoryId?: string
  status?: 'PENDING' | 'RECEIVED' | 'CANCELED'
  notes?: string
  imageData?: string
  specifications?: string
  buyerId?: string
  orderedById?: string
  deferAsset?: boolean        // EQUIPMENT only: true = IRREGULAR placeholder
}): Promise<{ ok: boolean; error?: string; id?: string; redirectTo?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }
  if (!data.title?.trim()) return { ok: false, error: 'Título obrigatório' }

  try {
    const p = await prisma.purchase.create({
      data: {
        title: data.title.trim(),
        supplier: data.supplier?.trim() || null,
        quantity: data.quantity ?? 1,
        unitPrice: data.unitPrice != null ? data.unitPrice : null,
        invoiceNumber: data.invoiceNumber?.trim() || null,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
        categoryId: data.categoryId || null,
        status: data.status ?? 'PENDING',
        notes: data.notes?.trim() || null,
        imageData: data.imageData || null,
        specifications: data.specifications?.trim() || null,
        buyerId: data.buyerId || null,
        orderedById: data.orderedById || null,
        createdById: session.user.id,
      },
    })

    // ── Auto-stock / asset logic ─────────────────────────────────────────────
    if (data.status === 'RECEIVED' && data.categoryId) {
      const category = await prisma.assetCategory.findUnique({
        where: { id: data.categoryId },
        select: { kind: true, name: true },
      })

      if (category?.kind === 'ACCESSORY' || category?.kind === 'DISPOSABLE') {
        // Increment stock quantity
        await prisma.assetCategory.update({
          where: { id: data.categoryId },
          data: { stockQuantity: { increment: data.quantity ?? 1 } },
        })
        await prisma.categoryStockMovement.create({
          data: {
            categoryId: data.categoryId,
            type: 'PURCHASE',
            quantity: data.quantity ?? 1,
            notes: `Compra registrada: ${data.title.trim()}`,
            createdById: session.user.id,
          },
        })
        revalidatePath('/consumiveis')
        revalidatePath('/settings/acessorios')
        revalidatePath('/settings/descartaveis')
        revalidatePath('/dashboard')
      } else if (category?.kind === 'EQUIPMENT') {
        if (data.deferAsset) {
          // Create IRREGULAR placeholder asset(s)
          const qty = data.quantity ?? 1
          for (let i = 0; i < qty; i++) {
            // Generate a sequential tag
            const lastAsset = await prisma.asset.findFirst({
              orderBy: { tag: 'desc' },
              select: { tag: true },
            })
            const lastNum = lastAsset
              ? parseInt(lastAsset.tag.replace(/\D/g, '') || '0', 10)
              : 0
            const tag = `PAT-${String(lastNum + 1).padStart(4, '0')}`

            const asset = await prisma.asset.create({
              data: {
                tag,
                name: data.title.trim(),
                categoryId: data.categoryId,
                status: 'IRREGULAR',
                acquisitionCost: data.unitPrice != null ? data.unitPrice : null,
                acquisitionDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
                notes: `Cadastro incompleto — originado da compra #${p.id.slice(-6).toUpperCase()}`,
              },
            })
            // Register CREATED movement
            await prisma.assetMovement.create({
              data: {
                assetId: asset.id,
                type: 'CREATED',
                actorId: session.user.id,
                toStatus: 'IRREGULAR',
                notes: 'Ativo criado via registro de compra (incompleto)',
              },
            })
          }
          revalidatePath('/assets')
          revalidatePath('/movements')
        } else {
          // Signal to redirect to assets/new with pre-filled data
          revalidatePath('/consumiveis/compras')
          const params = new URLSearchParams({
            fromPurchase: p.id,
            name: data.title.trim(),
            categoryId: data.categoryId,
            ...(data.unitPrice != null ? { acquisitionCost: String(data.unitPrice) } : {}),
            ...(data.purchaseDate ? { acquisitionDate: data.purchaseDate } : {}),
          })
          return { ok: true, id: p.id, redirectTo: `/assets/new?${params.toString()}` }
        }
      }
    }

    revalidatePath('/consumiveis/compras')
    return { ok: true, id: p.id }
  } catch (e) {
    console.error(e)
    return { ok: false, error: 'Erro ao criar compra' }
  }
}

export async function updatePurchase(
  id: string,
  data: Partial<{
    title: string; supplier: string; quantity: number; unitPrice: number
    invoiceNumber: string; purchaseDate: string; categoryId: string
    status: 'PENDING' | 'RECEIVED' | 'CANCELED'; notes: string
    imageData: string; specifications: string
    buyerId: string; orderedById: string
  }> & { deferAsset?: boolean }
): Promise<{ ok: boolean; error?: string; redirectTo?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  try {
    // Fetch current state to detect status transition
    const current = await prisma.purchase.findUnique({
      where: { id },
      select: { status: true, categoryId: true, quantity: true, title: true, unitPrice: true, purchaseDate: true },
    })
    if (!current) return { ok: false, error: 'Compra não encontrada' }

    await prisma.purchase.update({
      where: { id },
      data: {
        ...(data.title !== undefined       && { title: data.title.trim() }),
        ...(data.supplier !== undefined    && { supplier: data.supplier.trim() || null }),
        ...(data.quantity !== undefined    && { quantity: data.quantity }),
        ...(data.unitPrice !== undefined   && { unitPrice: data.unitPrice != null ? data.unitPrice : null }),
        ...(data.invoiceNumber !== undefined && { invoiceNumber: data.invoiceNumber.trim() || null }),
        ...(data.purchaseDate !== undefined  && { purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null }),
        ...(data.categoryId !== undefined    && { categoryId: data.categoryId || null }),
        ...(data.status !== undefined        && { status: data.status }),
        ...(data.notes !== undefined         && { notes: data.notes.trim() || null }),
        ...(data.imageData !== undefined     && { imageData: data.imageData || null }),
        ...(data.specifications !== undefined && { specifications: data.specifications.trim() || null }),
        ...(data.buyerId !== undefined       && { buyerId: data.buyerId || null }),
        ...(data.orderedById !== undefined   && { orderedById: data.orderedById || null }),
      },
    })

    // ── Auto-stock / asset logic on RECEIVED transition ──────────────────────
    if (data.status === 'RECEIVED' && current.status !== 'RECEIVED') {
      const effectiveCategoryId = data.categoryId !== undefined
        ? (data.categoryId || null) : current.categoryId
      const effectiveQuantity = data.quantity !== undefined ? data.quantity : current.quantity
      const effectiveTitle    = (data.title !== undefined ? data.title.trim() : current.title)
      const effectivePrice    = data.unitPrice !== undefined
        ? data.unitPrice
        : (current.unitPrice ? Number(current.unitPrice) : null)
      const effectiveDate     = data.purchaseDate !== undefined
        ? (data.purchaseDate || null)
        : (current.purchaseDate?.toISOString().slice(0, 10) ?? null)

      if (effectiveCategoryId) {
        const category = await prisma.assetCategory.findUnique({
          where: { id: effectiveCategoryId },
          select: { kind: true, name: true },
        })

        if (category?.kind === 'ACCESSORY' || category?.kind === 'DISPOSABLE') {
          await prisma.assetCategory.update({
            where: { id: effectiveCategoryId },
            data: { stockQuantity: { increment: effectiveQuantity } },
          })
          await prisma.categoryStockMovement.create({
            data: {
              categoryId: effectiveCategoryId,
              type: 'PURCHASE',
              quantity: effectiveQuantity,
              notes: `Compra recebida: ${effectiveTitle}`,
              createdById: session.user.id,
            },
          })
          revalidatePath('/consumiveis')
          revalidatePath('/settings/acessorios')
          revalidatePath('/settings/descartaveis')
          revalidatePath('/dashboard')
        } else if (category?.kind === 'EQUIPMENT') {
          if (data.deferAsset !== false) {
            // Default: create IRREGULAR placeholder asset(s)
            const qty = effectiveQuantity
            for (let i = 0; i < qty; i++) {
              const lastAsset = await prisma.asset.findFirst({
                orderBy: { tag: 'desc' },
                select: { tag: true },
              })
              const lastNum = lastAsset
                ? parseInt(lastAsset.tag.replace(/\D/g, '') || '0', 10)
                : 0
              const tag = `PAT-${String(lastNum + 1).padStart(4, '0')}`

              const asset = await prisma.asset.create({
                data: {
                  tag,
                  name: effectiveTitle,
                  categoryId: effectiveCategoryId,
                  status: 'IRREGULAR',
                  acquisitionCost: effectivePrice != null ? effectivePrice : null,
                  acquisitionDate: effectiveDate ? new Date(effectiveDate) : null,
                  notes: `Cadastro incompleto — originado da compra #${id.slice(-6).toUpperCase()}`,
                },
              })
              await prisma.assetMovement.create({
                data: {
                  assetId: asset.id,
                  type: 'CREATED',
                  actorId: session.user.id,
                  toStatus: 'IRREGULAR',
                  notes: 'Ativo criado via registro de compra (incompleto)',
                },
              })
            }
            revalidatePath('/assets')
            revalidatePath('/movements')
          } else {
            // deferAsset=false: redirect to full asset form
            revalidatePath('/consumiveis/compras')
            const params = new URLSearchParams({
              fromPurchase: id,
              name: effectiveTitle,
              categoryId: effectiveCategoryId,
              ...(effectivePrice != null ? { acquisitionCost: String(effectivePrice) } : {}),
              ...(effectiveDate ? { acquisitionDate: effectiveDate } : {}),
            })
            return { ok: true, redirectTo: `/assets/new?${params.toString()}` }
          }
        }
      }
    }

    revalidatePath('/consumiveis/compras')
    return { ok: true }
  } catch (e) {
    console.error(e)
    return { ok: false, error: 'Erro ao atualizar compra' }
  }
}

export async function deletePurchase(id: string): Promise<{ ok: boolean; error?: string }> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, error: 'Não autenticado' }

  try {
    await prisma.purchase.delete({ where: { id } })
    revalidatePath('/consumiveis/compras')
    return { ok: true }
  } catch (e) {
    console.error(e)
    return { ok: false, error: 'Erro ao excluir' }
  }
}
