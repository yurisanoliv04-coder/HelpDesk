'use server'

import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/config'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { AssetStatus, StorageType, CpuBrand } from '@prisma/client'
import { scoreComputer, scoreFromCatalog } from '@/lib/scoring/computer'

async function requireEditor() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const role = session.user.role
  if (role === 'COLABORADOR' || role === 'AUXILIAR_TI') throw new Error('Forbidden')
  return session
}

// Generate next available PAT-XXXX tag
async function nextTag(): Promise<string> {
  const last = await prisma.asset.findFirst({
    where: { tag: { startsWith: 'PAT-' } },
    orderBy: { tag: 'desc' },
    select: { tag: true },
  })
  let n = 1
  if (last?.tag) {
    const parsed = parseInt(last.tag.replace('PAT-', ''), 10)
    if (!isNaN(parsed)) n = parsed + 1
  }
  return `PAT-${String(n).padStart(4, '0')}`
}

export async function getNextTag(): Promise<string> {
  await requireEditor()
  return nextTag()
}

/** Retorna true se a tag estiver disponível (não existe em nenhum ativo) */
export async function checkTagUnique(tag: string): Promise<boolean> {
  if (!tag?.trim()) return true
  const exists = await prisma.asset.findFirst({
    where: { tag: tag.trim().toUpperCase() },
    select: { id: true },
  })
  return !exists
}

/**
 * Returns a price/date suggestion based on the most recent RECEIVED purchase
 * for a category, but only if there are still "unfilled" units (i.e., fewer
 * assets have been created since that purchase than its quantity).
 */
export async function getPurchaseSuggestion(categoryId: string): Promise<{
  acquisitionCost: string   // formatted "1500,00"
  acquisitionDate: string | null  // "YYYY-MM-DD" or null
} | null> {
  if (!categoryId) return null

  // Most recent received purchase with a price for this category
  const purchase = await prisma.purchase.findFirst({
    where: { categoryId, status: 'RECEIVED', unitPrice: { not: null } },
    orderBy: { updatedAt: 'desc' },
    select: { quantity: true, unitPrice: true, purchaseDate: true, updatedAt: true },
  })
  if (!purchase?.unitPrice) return null

  // Count assets of this category registered since the purchase was received
  const usedSlots = await prisma.asset.count({
    where: { categoryId, createdAt: { gte: purchase.updatedAt } },
  })

  // All purchase units already "consumed" by previously created assets
  if (usedSlots >= purchase.quantity) return null

  return {
    acquisitionCost: Number(purchase.unitPrice).toFixed(2), // plain "15.00" — works for both number and text inputs
    acquisitionDate: purchase.purchaseDate
      ? purchase.purchaseDate.toISOString().split('T')[0]
      : null,
  }
}

export interface CreateAssetInput {
  tag: string
  name: string
  categoryId: string
  modelId?: string
  status: AssetStatus
  location?: string
  serialNumber?: string
  assignedToUserId?: string
  notes?: string
  // Hardware — catálogo (scoring)
  cpuPartId?: string
  ramPartId?: string
  storagePartId?: string
  // Hardware — legado (descrição)
  ramGb?: number
  storageType?: StorageType
  storageGb?: number
  cpuBrand?: CpuBrand
  cpuModel?: string
  cpuGeneration?: number
  // Financial
  acquisitionCost?: number
  currentValue?: number
  acquisitionDate?: string
  warrantyUntil?: string
  // Custom fields
  customFieldValues?: Record<string, string>
}

export async function createAsset(input: CreateAssetInput): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    await requireEditor()

    // Validate required
    if (!input.tag?.trim()) return { ok: false, error: 'Tag é obrigatória' }
    if (!input.name?.trim()) return { ok: false, error: 'Nome é obrigatório' }
    if (!input.categoryId) return { ok: false, error: 'Categoria é obrigatória' }

    // Check tag uniqueness
    const existing = await prisma.asset.findUnique({ where: { tag: input.tag.trim() } })
    if (existing) return { ok: false, error: `Tag "${input.tag}" já está em uso` }

    // Compute performance score — catálogo tem prioridade
    let scored = null
    if (input.cpuPartId || input.ramPartId || input.storagePartId) {
      const [cpuPart, ramPart, storagePart] = await Promise.all([
        input.cpuPartId ? prisma.hardwarePart.findUnique({ where: { id: input.cpuPartId }, select: { id: true, scorePoints: true, model: true, notes: true } }) : null,
        input.ramPartId ? prisma.hardwarePart.findUnique({ where: { id: input.ramPartId }, select: { id: true, scorePoints: true, model: true, notes: true } }) : null,
        input.storagePartId ? prisma.hardwarePart.findUnique({ where: { id: input.storagePartId }, select: { id: true, scorePoints: true, model: true, notes: true } }) : null,
      ])
      scored = scoreFromCatalog({ cpuPart, ramPart, storagePart, cpuGeneration: input.cpuGeneration ?? null })
    } else {
      scored = scoreComputer({
        ramGb: input.ramGb ?? null,
        storageType: input.storageType ?? null,
        cpuModel: input.cpuModel ?? null,
        cpuGeneration: input.cpuGeneration ?? null,
      })
    }

    const asset = await prisma.asset.create({
      data: {
        tag: input.tag.trim(),
        name: input.name.trim(),
        categoryId: input.categoryId,
        modelId: input.modelId ?? null,
        status: input.status ?? 'STOCK',
        location: input.location?.trim() || null,
        serialNumber: input.serialNumber?.trim() || null,
        assignedToUserId: input.assignedToUserId || null,
        notes: input.notes?.trim() || null,
        // Hardware — catálogo
        cpuPartId: input.cpuPartId ?? null,
        ramPartId: input.ramPartId ?? null,
        storagePartId: input.storagePartId ?? null,
        // Hardware — legado
        ramGb: input.ramGb ?? null,
        storageType: input.storageType ?? null,
        storageGb: input.storageGb ?? null,
        cpuBrand: input.cpuBrand ?? null,
        cpuModel: input.cpuModel?.trim() || null,
        cpuGeneration: input.cpuGeneration ?? null,
        // Financial
        acquisitionCost: input.acquisitionCost ?? null,
        currentValue: input.currentValue ?? null,
        acquisitionDate: input.acquisitionDate ? new Date(input.acquisitionDate) : null,
        warrantyUntil: input.warrantyUntil ? new Date(input.warrantyUntil) : null,
        // Performance
        performanceScore: scored?.score ?? null,
        performanceLabel: scored?.label ?? null,
        performanceNotes: scored ? scored.notes.join('\n') : null,
      },
    })

    // Handle custom field values
    if (input.customFieldValues) {
      const entries = Object.entries(input.customFieldValues).filter(([, v]) => v !== '')

      // Validate uniqueness constraints before inserting
      for (const [fieldDefId, value] of entries) {
        const fieldDef = await prisma.assetCustomFieldDef.findUnique({ where: { id: fieldDefId }, select: { isUnique: true, label: true } })
        if (fieldDef?.isUnique) {
          const clash = await prisma.assetCustomFieldValue.findFirst({ where: { fieldDefId, value } })
          if (clash) return { ok: false, error: `O campo "${fieldDef.label}" exige um valor único. O valor "${value}" já está em uso.` }
        }
      }

      for (const [fieldDefId, value] of entries) {
        await prisma.assetCustomFieldValue.create({
          data: { assetId: asset.id, fieldDefId, value },
        })
      }
    }

    // Register creation movement
    const session2 = await auth()
    await prisma.assetMovement.create({
      data: {
        assetId:     asset.id,
        type:        'CREATED',
        actorId:     session2!.user.id,
        toLocation:  input.location?.trim() || null,
        toStatus:    input.status ?? 'STOCK',
        notes:       input.notes?.trim() || null,
      },
    })

    revalidatePath('/assets')
    revalidatePath('/consumiveis')
    revalidatePath('/movements')
    return { ok: true, id: asset.id }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro desconhecido'
    return { ok: false, error: msg }
  }
}
