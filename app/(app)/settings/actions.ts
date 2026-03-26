'use server'

import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/config'
import { revalidatePath } from 'next/cache'
import { UserRole } from '@prisma/client'
import { scoreComputer, DEFAULT_SCORING_CONFIG, ComputerScoringConfig } from '@/lib/scoring/computer'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  if (session.user.role !== 'ADMIN') throw new Error('Forbidden')
  return session
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function toggleUserActive(userId: string) {
  await requireAdmin()
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { active: true } })
  if (!user) throw new Error('Usuário não encontrado')
  await prisma.user.update({ where: { id: userId }, data: { active: !user.active } })
  revalidatePath('/settings')
}

export async function updateUserRole(userId: string, role: UserRole) {
  await requireAdmin()
  await prisma.user.update({ where: { id: userId }, data: { role } })
  revalidatePath('/settings')
}

export async function updateUserDepartment(userId: string, departmentId: string | null) {
  await requireAdmin()
  await prisma.user.update({ where: { id: userId }, data: { departmentId } })
  revalidatePath('/settings')
}

// ─── Departments ──────────────────────────────────────────────────────────────
export async function createDepartment(name: string, code: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin()
    if (!name.trim()) return { ok: false, error: 'Nome é obrigatório' }
    const exists = await prisma.department.findFirst({ where: { name: { equals: name.trim(), mode: 'insensitive' } } })
    if (exists) return { ok: false, error: 'Já existe um departamento com este nome' }
    await prisma.department.create({ data: { name: name.trim(), code: code.trim() || null } })
    revalidatePath('/settings')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro desconhecido' }
  }
}

export async function updateDepartment(id: string, name: string, code: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin()
    if (!name.trim()) return { ok: false, error: 'Nome é obrigatório' }
    const exists = await prisma.department.findFirst({
      where: { name: { equals: name.trim(), mode: 'insensitive' }, NOT: { id } },
    })
    if (exists) return { ok: false, error: 'Já existe um departamento com este nome' }
    await prisma.department.update({
      where: { id },
      data: { name: name.trim(), code: code.trim() || null },
    })
    revalidatePath('/settings')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro desconhecido' }
  }
}

export async function deleteDepartment(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin()
    const dept = await prisma.department.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    })
    if (!dept) return { ok: false, error: 'Departamento não encontrado' }
    if (dept._count.users > 0)
      return { ok: false, error: `Este departamento possui ${dept._count.users} usuário(s). Reassine-os antes de excluir.` }
    await prisma.department.delete({ where: { id } })
    revalidatePath('/settings')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro desconhecido' }
  }
}

export async function updateDepartmentScoringPoints(id: string, pts: number): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin()
    await prisma.department.update({ where: { id }, data: { scoringPoints: Math.max(0, pts) } })
    revalidatePath('/settings')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro desconhecido' }
  }
}

export async function toggleDepartmentActive(deptId: string) {
  await requireAdmin()
  const dept = await prisma.department.findUnique({ where: { id: deptId }, select: { active: true } })
  if (!dept) throw new Error('Departamento não encontrado')
  await prisma.department.update({ where: { id: deptId }, data: { active: !dept.active } })
  revalidatePath('/settings')
}

// ─── Ticket categories ────────────────────────────────────────────────────────
export async function createTicketCategory(name: string, description: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin()
    if (!name.trim()) return { ok: false, error: 'Nome é obrigatório' }
    const exists = await prisma.ticketCategory.findUnique({ where: { name: name.trim() } })
    if (exists) return { ok: false, error: 'Já existe uma categoria com este nome' }
    await prisma.ticketCategory.create({ data: { name: name.trim(), description: description.trim() || null } })
    revalidatePath('/settings')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro desconhecido' }
  }
}

export async function createTicketSubcategory(parentId: string, name: string, description: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin()
    if (!name.trim()) return { ok: false, error: 'Nome é obrigatório' }
    const exists = await prisma.ticketCategory.findUnique({ where: { name: name.trim() } })
    if (exists) return { ok: false, error: 'Já existe uma categoria com este nome' }
    await prisma.ticketCategory.create({
      data: { name: name.trim(), description: description.trim() || null, parentId },
    })
    revalidatePath('/settings')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro desconhecido' }
  }
}

export async function updateCategoryScoringPoints(id: string, pts: number): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin()
    await prisma.ticketCategory.update({ where: { id }, data: { scoringPoints: Math.max(0, pts) } })
    revalidatePath('/settings')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro desconhecido' }
  }
}

export async function updateTicketCategory(id: string, name: string, description: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin()
    if (!name.trim()) return { ok: false, error: 'Nome é obrigatório' }
    const exists = await prisma.ticketCategory.findFirst({
      where: { name: { equals: name.trim() }, NOT: { id } },
    })
    if (exists) return { ok: false, error: 'Já existe uma categoria com este nome' }
    await prisma.ticketCategory.update({
      where: { id },
      data: { name: name.trim(), description: description.trim() || null },
    })
    revalidatePath('/settings')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro desconhecido' }
  }
}

export async function deleteTicketCategory(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin()
    const cat = await prisma.ticketCategory.findUnique({
      where: { id },
      include: {
        _count: { select: { tickets: true, children: true } },
      },
    })
    if (!cat) return { ok: false, error: 'Categoria não encontrada' }
    if (cat._count.tickets > 0)
      return { ok: false, error: `Esta categoria possui ${cat._count.tickets} chamado(s) vinculado(s). Não é possível excluir.` }
    if (cat._count.children > 0)
      return { ok: false, error: `Esta categoria possui ${cat._count.children} subcategoria(s). Exclua-as primeiro.` }
    await prisma.ticketCategory.delete({ where: { id } })
    revalidatePath('/settings')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro desconhecido' }
  }
}

export async function toggleTicketCategoryActive(categoryId: string) {
  await requireAdmin()
  const cat = await prisma.ticketCategory.findUnique({ where: { id: categoryId }, select: { active: true } })
  if (!cat) throw new Error('Categoria não encontrada')
  await prisma.ticketCategory.update({ where: { id: categoryId }, data: { active: !cat.active } })
  revalidatePath('/settings')
}

// ─── Asset categories ─────────────────────────────────────────────────────────
export async function createAssetCategory(
  name: string,
  icon: string,
  kind: 'EQUIPMENT' | 'ACCESSORY' | 'DISPOSABLE' = 'EQUIPMENT',
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin()
    if (!name.trim()) return { ok: false, error: 'Nome é obrigatório' }
    const exists = await prisma.assetCategory.findUnique({ where: { name: name.trim() } })
    if (exists) return { ok: false, error: 'Já existe uma categoria com este nome' }
    await prisma.assetCategory.create({ data: { name: name.trim(), icon: icon.trim() || null, kind } })
    revalidatePath('/settings')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro desconhecido' }
  }
}

export async function updateAssetCategory(
  id: string,
  name: string,
  icon: string,
  kind: 'EQUIPMENT' | 'ACCESSORY' | 'DISPOSABLE' = 'EQUIPMENT',
  stockQuantity?: number,
  stockMinQty?: number,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin()
    if (!name.trim()) return { ok: false, error: 'Nome é obrigatório' }
    const exists = await prisma.assetCategory.findFirst({
      where: { name: { equals: name.trim() }, NOT: { id } },
    })
    if (exists) return { ok: false, error: 'Já existe uma categoria com este nome' }
    const data: Record<string, unknown> = { name: name.trim(), icon: icon.trim() || null, kind }
    if (kind === 'ACCESSORY' || kind === 'DISPOSABLE') {
      if (stockQuantity !== undefined) data.stockQuantity = Math.max(0, Math.floor(stockQuantity))
      if (stockMinQty  !== undefined) data.stockMinQty   = Math.max(0, Math.floor(stockMinQty))
    }
    await prisma.assetCategory.update({ where: { id }, data })
    revalidatePath('/settings')
    revalidatePath('/consumiveis')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro desconhecido' }
  }
}

export interface CategoryDeleteImpact {
  assetCount: number
  modelCount: number
  fieldCount: number
  movementCount: number
}

export async function getAssetCategoryDeleteImpact(
  id: string,
): Promise<{ ok: boolean; data?: CategoryDeleteImpact; error?: string }> {
  try {
    await requireAdmin()
    const [assetCount, modelCount, fieldCount, movementCount] = await Promise.all([
      prisma.asset.count({ where: { categoryId: id } }),
      prisma.assetModel.count({ where: { categoryId: id } }),
      prisma.assetCustomFieldDef.count({ where: { categoryId: id } }),
      prisma.assetMovement.count({ where: { asset: { categoryId: id } } }),
    ])
    return { ok: true, data: { assetCount, modelCount, fieldCount, movementCount } }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro' }
  }
}

export async function deleteAssetCategory(
  id: string,
  force = false,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin()
    const cat = await prisma.assetCategory.findUnique({
      where: { id },
      include: { _count: { select: { assets: true } } },
    })
    if (!cat) return { ok: false, error: 'Categoria não encontrada' }

    if (cat._count.assets > 0 && !force) {
      return { ok: false, error: `Esta categoria possui ${cat._count.assets} ativo(s).` }
    }

    if (force && cat._count.assets > 0) {
      const assets = await prisma.asset.findMany({
        where: { categoryId: id },
        select: { id: true },
      })
      const assetIds = assets.map((a) => a.id)

      await prisma.$transaction([
        // MovementOrderItem não tem cascade a partir de Asset
        prisma.movementOrderItem.deleteMany({ where: { assetId: { in: assetIds } } }),
        // AssetMovement não tem cascade a partir de Asset
        prisma.assetMovement.deleteMany({ where: { assetId: { in: assetIds } } }),
        // Demais relações com cascade (explícito para garantir ordem)
        prisma.assetCustomFieldValue.deleteMany({ where: { assetId: { in: assetIds } } }),
        prisma.assetNote.deleteMany({ where: { assetId: { in: assetIds } } }),
        prisma.assetFile.deleteMany({ where: { assetId: { in: assetIds } } }),
        // Exclui os ativos
        prisma.asset.deleteMany({ where: { id: { in: assetIds } } }),
        // Exclui a categoria (cascade: AssetCustomFieldDef + AssetModel)
        prisma.assetCategory.delete({ where: { id } }),
      ])
    } else {
      await prisma.assetCategory.delete({ where: { id } })
    }

    revalidatePath('/settings')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro desconhecido' }
  }
}

export async function toggleAssetCategoryActive(categoryId: string) {
  await requireAdmin()
  const cat = await prisma.assetCategory.findUnique({ where: { id: categoryId }, select: { active: true } })
  if (!cat) throw new Error('Categoria não encontrada')
  await prisma.assetCategory.update({ where: { id: categoryId }, data: { active: !cat.active } })
  revalidatePath('/settings')
}

// ─── Stock movements (ACCESSORY / DISPOSABLE) ──────────────────────────────────

export interface StockMovementRow {
  id: string
  type: string
  quantity: number
  notes: string | null
  createdAt: Date
  createdBy: string
}

export async function getCategoryStockMovements(
  categoryId: string,
  take = 10,
): Promise<StockMovementRow[]> {
  await requireAdmin()
  const rows = await prisma.categoryStockMovement.findMany({
    where: { categoryId },
    orderBy: { createdAt: 'desc' },
    take,
    select: {
      id: true, type: true, quantity: true, notes: true, createdAt: true,
      createdBy: { select: { name: true } },
    },
  })
  return rows.map(r => ({ ...r, createdBy: r.createdBy.name }))
}

export async function addStockEntry(
  categoryId: string,
  quantity: number,
  notes?: string,
): Promise<{ ok: boolean; error?: string; newQty?: number }> {
  try {
    const session = await requireAdmin()
    if (quantity <= 0) return { ok: false, error: 'Quantidade deve ser maior que zero' }

    const cat = await prisma.assetCategory.findUnique({ where: { id: categoryId }, select: { stockQuantity: true } })
    if (!cat) return { ok: false, error: 'Categoria não encontrada' }

    const newQty = cat.stockQuantity + quantity

    await prisma.$transaction([
      prisma.assetCategory.update({ where: { id: categoryId }, data: { stockQuantity: newQty } }),
      prisma.categoryStockMovement.create({
        data: { categoryId, type: 'ENTRY', quantity, notes: notes?.trim() || null, createdById: session.user.id },
      }),
    ])

    revalidatePath('/settings')
    revalidatePath('/consumiveis')
    return { ok: true, newQty }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro' }
  }
}

export async function addStockExit(
  categoryId: string,
  quantity: number,
  notes?: string,
): Promise<{ ok: boolean; error?: string; newQty?: number }> {
  try {
    const session = await requireAdmin()
    if (quantity <= 0) return { ok: false, error: 'Quantidade deve ser maior que zero' }

    const cat = await prisma.assetCategory.findUnique({ where: { id: categoryId }, select: { stockQuantity: true } })
    if (!cat) return { ok: false, error: 'Categoria não encontrada' }
    if (cat.stockQuantity < quantity)
      return { ok: false, error: `Estoque insuficiente. Disponível: ${cat.stockQuantity}` }

    const newQty = cat.stockQuantity - quantity

    await prisma.$transaction([
      prisma.assetCategory.update({ where: { id: categoryId }, data: { stockQuantity: newQty } }),
      prisma.categoryStockMovement.create({
        data: { categoryId, type: 'EXIT', quantity, notes: notes?.trim() || null, createdById: session.user.id },
      }),
    ])

    revalidatePath('/settings')
    revalidatePath('/consumiveis')
    return { ok: true, newQty }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro' }
  }
}

// ─── Asset Locations ───────────────────────────────────────────────────────────
const LOCATIONS_KEY = 'asset_locations'

export async function getAssetLocations(): Promise<string[]> {
  const row = await prisma.systemConfig.findUnique({ where: { key: LOCATIONS_KEY } })
  if (!row) return []
  return row.value as string[]
}

export async function createAssetLocation(name: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin()
    if (!name.trim()) return { ok: false, error: 'Nome é obrigatório' }
    const row = await prisma.systemConfig.findUnique({ where: { key: LOCATIONS_KEY } })
    const current = (row?.value as string[] | null) ?? []
    if (current.some(l => l.toLowerCase() === name.trim().toLowerCase()))
      return { ok: false, error: 'Local já cadastrado' }
    const updated = [...current, name.trim()].sort()
    await prisma.systemConfig.upsert({
      where: { key: LOCATIONS_KEY },
      create: { key: LOCATIONS_KEY, value: updated },
      update: { value: updated },
    })
    revalidatePath('/settings')
    revalidatePath('/assets')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro desconhecido' }
  }
}

export async function deleteAssetLocation(name: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin()
    const row = await prisma.systemConfig.findUnique({ where: { key: LOCATIONS_KEY } })
    const current = (row?.value as string[] | null) ?? []
    const updated = current.filter(l => l !== name)
    await prisma.systemConfig.upsert({
      where: { key: LOCATIONS_KEY },
      create: { key: LOCATIONS_KEY, value: updated },
      update: { value: updated },
    })
    revalidatePath('/settings')
    revalidatePath('/assets')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro desconhecido' }
  }
}

export async function updateAssetLocation(oldName: string, newName: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin()
    if (!newName.trim()) return { ok: false, error: 'Nome é obrigatório' }
    const row = await prisma.systemConfig.findUnique({ where: { key: LOCATIONS_KEY } })
    const current = (row?.value as string[] | null) ?? []
    if (!current.includes(oldName)) return { ok: false, error: 'Local não encontrado' }
    if (current.some(l => l.toLowerCase() === newName.trim().toLowerCase() && l !== oldName))
      return { ok: false, error: 'Já existe um local com este nome' }
    const updated = current.map(l => l === oldName ? newName.trim() : l).sort()
    await prisma.systemConfig.upsert({
      where: { key: LOCATIONS_KEY },
      create: { key: LOCATIONS_KEY, value: updated },
      update: { value: updated },
    })
    // Atualiza ativos que usam este local
    await prisma.asset.updateMany({
      where: { location: oldName },
      data: { location: newName.trim() },
    })
    revalidatePath('/settings')
    revalidatePath('/assets')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro desconhecido' }
  }
}

// ─── Asset Custom Fields ───────────────────────────────────────────────────────
const CUSTOM_FIELDS_KEY = 'asset_custom_fields'

export interface AssetCustomField {
  id: string
  label: string
  type: 'text' | 'number' | 'date' | 'boolean'
  required: boolean
}

export async function getAssetCustomFields(): Promise<AssetCustomField[]> {
  const row = await prisma.systemConfig.findUnique({ where: { key: CUSTOM_FIELDS_KEY } })
  if (!row) return []
  return row.value as unknown as AssetCustomField[]
}

export async function saveAssetCustomFields(fields: AssetCustomField[]): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin()
    await prisma.systemConfig.upsert({
      where: { key: CUSTOM_FIELDS_KEY },
      create: { key: CUSTOM_FIELDS_KEY, value: fields as unknown as object },
      update: { value: fields as unknown as object },
    })
    revalidatePath('/settings')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro desconhecido' }
  }
}

// ─── Computer Scoring Config ──────────────────────────────────────────────────
const SCORING_CONFIG_KEY = 'computer_scoring'

export async function getComputerScoringConfig(): Promise<ComputerScoringConfig> {
  const row = await prisma.systemConfig.findUnique({ where: { key: SCORING_CONFIG_KEY } })
  if (!row) return DEFAULT_SCORING_CONFIG
  return row.value as unknown as ComputerScoringConfig
}

export async function saveComputerScoringConfig(config: ComputerScoringConfig): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin()
    await prisma.systemConfig.upsert({
      where: { key: SCORING_CONFIG_KEY },
      create: { key: SCORING_CONFIG_KEY, value: config as object },
      update: { value: config as object },
    })
    revalidatePath('/settings')
    revalidatePath('/assets')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro desconhecido' }
  }
}

// ─── Scoring: recalculate all assets ─────────────────────────────────────────
export async function recalculateAllScores(): Promise<{ ok: boolean; updated: number; error?: string }> {
  try {
    await requireAdmin()
    const config = await getComputerScoringConfig()
    const assets = await prisma.asset.findMany({
      select: {
        id: true, ramGb: true, storageType: true, storageGb: true,
        cpuBrand: true, cpuModel: true, cpuGeneration: true,
      },
    })
    let updated = 0
    for (const asset of assets) {
      const scored = scoreComputer({
        ramGb: asset.ramGb,
        storageType: asset.storageType,
        cpuModel: asset.cpuModel,
        cpuGeneration: asset.cpuGeneration,
      }, config)
      await prisma.asset.update({
        where: { id: asset.id },
        data: {
          performanceScore: scored?.score ?? null,
          performanceLabel: scored?.label ?? null,
          performanceNotes: scored ? scored.notes.join('\n') : null,
        },
      })
      updated++
    }
    revalidatePath('/assets')
    revalidatePath('/settings')
    return { ok: true, updated }
  } catch (e) {
    return { ok: false, updated: 0, error: e instanceof Error ? e.message : 'Erro desconhecido' }
  }
}

// ─── Ticket Scoring Rules ─────────────────────────────────────────────────────
export async function createTicketScoringRule(
  criterion: string, value: string, label: string, points: number,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin()
    if (!criterion || !value || !label) return { ok: false, error: 'Todos os campos são obrigatórios' }
    const exists = await prisma.ticketScoringRule.findUnique({ where: { criterion_value: { criterion, value } } })
    if (exists) return { ok: false, error: 'Já existe uma regra com este critério e valor' }
    await prisma.ticketScoringRule.create({ data: { criterion, value, label, points } })
    revalidatePath('/settings')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro desconhecido' }
  }
}

export async function updateTicketScoringRule(
  id: string, label: string, points: number,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin()
    await prisma.ticketScoringRule.update({ where: { id }, data: { label, points } })
    revalidatePath('/settings')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro desconhecido' }
  }
}

export async function deleteTicketScoringRule(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin()
    await prisma.ticketScoringRule.delete({ where: { id } })
    revalidatePath('/settings')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro desconhecido' }
  }
}

export async function toggleTicketScoringRuleActive(id: string) {
  await requireAdmin()
  const rule = await prisma.ticketScoringRule.findUnique({ where: { id }, select: { active: true } })
  if (!rule) throw new Error('Regra não encontrada')
  await prisma.ticketScoringRule.update({ where: { id }, data: { active: !rule.active } })
  revalidatePath('/settings')
}

// ─── Asset Custom Field Defs ───────────────────────────────────────────────────
export interface AssetCustomFieldDefData {
  id: string
  categoryId: string
  label: string
  fieldType: 'text' | 'checkbox_group' | 'alert'
  options: string[]
  sortOrder: number
  required: boolean
  isUnique: boolean
}

export async function getAssetCustomFieldDefs(): Promise<AssetCustomFieldDefData[]> {
  const rows = await prisma.assetCustomFieldDef.findMany({
    orderBy: [{ categoryId: 'asc' }, { sortOrder: 'asc' }],
  })
  return rows.map(r => ({
    id: r.id,
    categoryId: r.categoryId,
    label: r.label,
    fieldType: r.fieldType as 'text' | 'checkbox_group' | 'alert',
    options: r.options as string[],
    sortOrder: r.sortOrder,
    required: r.required,
    isUnique: r.isUnique,
  }))
}

export async function createAssetCustomFieldDef(
  categoryId: string, label: string, fieldType: string, options: string[],
  required: boolean, isUnique: boolean,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin()
    if (!categoryId || !label.trim()) return { ok: false, error: 'Categoria e nome são obrigatórios' }
    const count = await prisma.assetCustomFieldDef.count({ where: { categoryId } })
    await prisma.assetCustomFieldDef.create({
      data: { categoryId, label: label.trim(), fieldType, options, sortOrder: count, required, isUnique: fieldType === 'text' ? isUnique : false },
    })
    revalidatePath('/settings')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro desconhecido' }
  }
}

export async function updateAssetCustomFieldDef(
  id: string, label: string, fieldType: string, options: string[],
  required: boolean, isUnique: boolean,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin()
    if (!label.trim()) return { ok: false, error: 'Nome é obrigatório' }
    await prisma.assetCustomFieldDef.update({
      where: { id },
      data: { label: label.trim(), fieldType, options, required, isUnique: fieldType === 'text' ? isUnique : false },
    })
    revalidatePath('/settings')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro desconhecido' }
  }
}

export async function deleteAssetCustomFieldDef(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin()
    await prisma.assetCustomFieldDef.delete({ where: { id } })
    revalidatePath('/settings')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro desconhecido' }
  }
}

// ─── Asset Alert Instances ─────────────────────────────────────────────────────

export interface AssetAlertInstanceData {
  id: string
  assetId: string
  assetTag: string
  assetName: string
  label: string       // alert message (from fieldDef.label)
  dueAt: Date
  dismissed: boolean
  triggerType: string  // options[0]
  delayDays: number    // options[1] parsed
  categoryName: string
}

/** Triggered after a movement is created — spawns alert instances for matching rules */
export async function triggerAssetAlerts(
  assetId: string,
  categoryId: string,
  movementType: string,
): Promise<void> {
  // Find alert rules for this category + trigger type
  const rules = await prisma.assetCustomFieldDef.findMany({
    where: { categoryId, fieldType: 'alert' },
  })
  const matching = rules.filter(r => r.options[0] === movementType)
  if (matching.length === 0) return

  const now = new Date()
  for (const rule of matching) {
    const delayDays = parseInt(rule.options[1] ?? '0', 10) || 0
    const dueAt = new Date(now.getTime() + delayDays * 24 * 60 * 60 * 1000)
    // Avoid duplicate — if there's already a pending (non-dismissed) instance for same rule+asset, skip
    const existing = await prisma.assetAlertInstance.findFirst({
      where: { fieldDefId: rule.id, assetId, dismissed: false },
    })
    if (!existing) {
      await prisma.assetAlertInstance.create({
        data: { fieldDefId: rule.id, assetId, dueAt },
      })
    }
  }
}

/** Get all due (non-dismissed) alerts visible to any TI user */
export async function getPendingAlerts(): Promise<AssetAlertInstanceData[]> {
  const rows = await prisma.assetAlertInstance.findMany({
    where: { dismissed: false, dueAt: { lte: new Date() } },
    orderBy: { dueAt: 'asc' },
    take: 20,
    include: {
      fieldDef: { include: { category: { select: { name: true } } } },
      asset:    { select: { id: true, tag: true, name: true } },
    },
  })
  return rows.map(r => ({
    id: r.id,
    assetId: r.assetId,
    assetTag: r.asset.tag,
    assetName: r.asset.name,
    label: r.fieldDef.label,
    dueAt: r.dueAt,
    dismissed: r.dismissed,
    triggerType: r.fieldDef.options[0] ?? '',
    delayDays: parseInt(r.fieldDef.options[1] ?? '0', 10) || 0,
    categoryName: r.fieldDef.category.name,
  }))
}

/** Get upcoming alerts (due within next 7 days, not yet dismissed) */
export async function getUpcomingAlerts(): Promise<AssetAlertInstanceData[]> {
  const soon = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  const rows = await prisma.assetAlertInstance.findMany({
    where: { dismissed: false, dueAt: { lte: soon } },
    orderBy: { dueAt: 'asc' },
    take: 20,
    include: {
      fieldDef: { include: { category: { select: { name: true } } } },
      asset:    { select: { id: true, tag: true, name: true } },
    },
  })
  return rows.map(r => ({
    id: r.id,
    assetId: r.assetId,
    assetTag: r.asset.tag,
    assetName: r.asset.name,
    label: r.fieldDef.label,
    dueAt: r.dueAt,
    dismissed: r.dismissed,
    triggerType: r.fieldDef.options[0] ?? '',
    delayDays: parseInt(r.fieldDef.options[1] ?? '0', 10) || 0,
    categoryName: r.fieldDef.category.name,
  }))
}

export async function dismissAlertInstance(id: string): Promise<{ ok: boolean }> {
  try {
    const session = await auth()
    if (!session?.user?.id) return { ok: false }
    await prisma.assetAlertInstance.update({ where: { id }, data: { dismissed: true } })
    revalidatePath('/dashboard')
    revalidatePath('/assets')
    return { ok: true }
  } catch {
    return { ok: false }
  }
}

// ─── Asset Models ──────────────────────────────────────────────────────────────
export interface AssetModelData {
  id: string
  categoryId: string
  name: string
  manufacturer: string | null
  imageData: string | null
  specs: Record<string, unknown> | null
}

export async function getAssetModels(): Promise<AssetModelData[]> {
  const rows = await prisma.assetModel.findMany({
    orderBy: [{ categoryId: 'asc' }, { name: 'asc' }],
  })
  return rows.map(r => ({
    id: r.id,
    categoryId: r.categoryId,
    name: r.name,
    manufacturer: r.manufacturer,
    imageData: r.imageData,
    specs: r.specs as Record<string, unknown> | null,
  }))
}

export async function createAssetModel(
  categoryId: string, name: string, manufacturer: string, imageData: string | null,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin()
    if (!categoryId || !name.trim()) return { ok: false, error: 'Categoria e nome são obrigatórios' }
    await prisma.assetModel.create({
      data: {
        categoryId,
        name: name.trim(),
        manufacturer: manufacturer.trim() || null,
        imageData: imageData || null,
      },
    })
    revalidatePath('/settings')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro desconhecido' }
  }
}

export async function updateAssetModel(
  id: string, name: string, manufacturer: string, imageData: string | null,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin()
    if (!name.trim()) return { ok: false, error: 'Nome é obrigatório' }
    await prisma.assetModel.update({
      where: { id },
      data: {
        name: name.trim(),
        manufacturer: manufacturer.trim() || null,
        ...(imageData !== undefined ? { imageData } : {}),
      },
    })
    revalidatePath('/settings')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro desconhecido' }
  }
}

export async function deleteAssetModel(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin()
    const model = await prisma.assetModel.findUnique({
      where: { id },
      include: { _count: { select: { assets: true } } },
    })
    if (!model) return { ok: false, error: 'Modelo não encontrado' }
    if (model._count.assets > 0)
      return { ok: false, error: `Este modelo possui ${model._count.assets} ativo(s) vinculado(s). Desvincule-os antes de excluir.` }
    await prisma.assetModel.delete({ where: { id } })
    revalidatePath('/settings')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro desconhecido' }
  }
}

// ─── Hardware Parts ────────────────────────────────────────────────────────────

import { HardwarePartType } from '@prisma/client'

export async function getHardwareParts() {
  return prisma.hardwarePart.findMany({
    orderBy: [{ type: 'asc' }, { scorePoints: 'desc' }],
  })
}

export type HardwarePartPayload = {
  type: HardwarePartType
  brand: string
  model: string
  scorePoints: number
  notes?: string
}

export async function createHardwarePart(data: HardwarePartPayload): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin()
    if (!data.brand.trim() || !data.model.trim()) return { ok: false, error: 'Marca e modelo são obrigatórios' }
    const maxPts = data.type === 'RAM' ? 40 : 30
    if (data.scorePoints < -maxPts || data.scorePoints > maxPts) return { ok: false, error: `Pontuação deve ser entre -${maxPts} e ${maxPts} pts` }
    await prisma.hardwarePart.create({
      data: {
        type: data.type,
        brand: data.brand.trim(),
        model: data.model.trim(),
        scorePoints: data.scorePoints,
        notes: data.notes?.trim() || null,
      },
    })
    revalidatePath('/settings')
    revalidatePath('/assets')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro desconhecido' }
  }
}

export async function updateHardwarePart(id: string, data: HardwarePartPayload): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin()
    if (!data.brand.trim() || !data.model.trim()) return { ok: false, error: 'Marca e modelo são obrigatórios' }
    const maxPts = data.type === 'RAM' ? 40 : 30
    if (data.scorePoints < -maxPts || data.scorePoints > maxPts) return { ok: false, error: `Pontuação deve ser entre -${maxPts} e ${maxPts} pts` }
    await prisma.hardwarePart.update({
      where: { id },
      data: {
        brand: data.brand.trim(),
        model: data.model.trim(),
        scorePoints: data.scorePoints,
        notes: data.notes?.trim() || null,
      },
    })
    revalidatePath('/settings')
    revalidatePath('/assets')
    return { ok: true }
  } catch (e: unknown) {
    // P2025 = record not found (e.g. page loaded before a seed re-run deleted this entry)
    if (typeof e === 'object' && e !== null && 'code' in e && (e as { code: string }).code === 'P2025') {
      return { ok: false, error: 'Peça não encontrada no banco. Recarregue a página (F5) e tente novamente.' }
    }
    return { ok: false, error: e instanceof Error ? e.message : 'Erro desconhecido' }
  }
}

export async function toggleHardwarePartActive(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin()
    const part = await prisma.hardwarePart.findUnique({ where: { id }, select: { active: true } })
    if (!part) return { ok: false, error: 'Peça não encontrada' }
    await prisma.hardwarePart.update({ where: { id }, data: { active: !part.active } })
    revalidatePath('/settings')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro desconhecido' }
  }
}

export async function deleteHardwarePart(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin()
    const part = await prisma.hardwarePart.findUnique({
      where: { id },
      include: {
        _count: { select: { cpuAssets: true, ramAssets: true, storageAssets: true } },
      },
    })
    if (!part) return { ok: false, error: 'Peça não encontrada' }
    const total = part._count.cpuAssets + part._count.ramAssets + part._count.storageAssets
    if (total > 0) return { ok: false, error: `Esta peça está vinculada a ${total} ativo(s). Desvincule antes de excluir.` }
    await prisma.hardwarePart.delete({ where: { id } })
    revalidatePath('/settings')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro desconhecido' }
  }
}

// ─── CPU Generation Config ─────────────────────────────────────────────────────

export type CpuGenConfigRow = {
  id: string
  minGen: number
  label: string
  adj: number
  note: string | null
}

export async function getCpuGenerationConfigs(): Promise<CpuGenConfigRow[]> {
  const rows = await prisma.cpuGenerationConfig.findMany({ orderBy: { minGen: 'desc' } })
  // Se não houver registros no DB, retorna os defaults
  if (rows.length === 0) {
    const { DEFAULT_GEN_TIERS } = await import('@/lib/scoring/computer')
    return DEFAULT_GEN_TIERS.map((t, i) => ({ id: String(i), minGen: t.minGen, label: t.label, adj: t.adj, note: t.note ?? null }))
  }
  return rows
}

export async function updateCpuGenerationAdj(
  id: string,
  adj: number,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin()
    if (adj < -20 || adj > 15) return { ok: false, error: 'Ajuste deve ser entre -20 e +15 pts' }
    await prisma.cpuGenerationConfig.update({ where: { id }, data: { adj } })
    revalidatePath('/settings')
    revalidatePath('/assets')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro desconhecido' }
  }
}

export async function updateCpuGenerationNote(
  id: string,
  note: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin()
    await prisma.cpuGenerationConfig.update({ where: { id }, data: { note: note.trim() || null } })
    revalidatePath('/settings')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro desconhecido' }
  }
}

export async function createCpuGenerationConfig(data: {
  minGen: number
  label: string
  adj: number
  note?: string
}): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin()
    if (!data.label.trim()) return { ok: false, error: 'Rótulo é obrigatório' }
    if (data.minGen < 1 || data.minGen > 30) return { ok: false, error: 'Geração mínima deve ser entre 1 e 30' }
    if (data.adj < -20 || data.adj > 15) return { ok: false, error: 'Ajuste deve ser entre -20 e +15 pts' }
    await prisma.cpuGenerationConfig.create({
      data: {
        minGen: data.minGen,
        label: data.label.trim(),
        adj: data.adj,
        note: data.note?.trim() || null,
      },
    })
    revalidatePath('/settings')
    revalidatePath('/assets')
    return { ok: true }
  } catch (e: unknown) {
    if (typeof e === 'object' && e !== null && 'code' in e && (e as { code: string }).code === 'P2002') {
      return { ok: false, error: 'Já existe uma faixa com esta geração mínima' }
    }
    return { ok: false, error: e instanceof Error ? e.message : 'Erro desconhecido' }
  }
}

export async function deleteCpuGenerationConfig(id: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin()
    await prisma.cpuGenerationConfig.delete({ where: { id } })
    revalidatePath('/settings')
    revalidatePath('/assets')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro desconhecido' }
  }
}

export async function saveCpuGenerationRow(
  id: string,
  data: { adj: number; note: string },
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin()
    if (data.adj < -20 || data.adj > 15) return { ok: false, error: 'Ajuste deve ser entre -20 e +15 pts' }
    await prisma.cpuGenerationConfig.update({
      where: { id },
      data: { adj: data.adj, note: data.note.trim() || null },
    })
    revalidatePath('/settings')
    revalidatePath('/assets')
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro desconhecido' }
  }
}
