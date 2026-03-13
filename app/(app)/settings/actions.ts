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
export async function createAssetCategory(name: string, icon: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin()
    if (!name.trim()) return { ok: false, error: 'Nome é obrigatório' }
    const exists = await prisma.assetCategory.findUnique({ where: { name: name.trim() } })
    if (exists) return { ok: false, error: 'Já existe uma categoria com este nome' }
    await prisma.assetCategory.create({ data: { name: name.trim(), icon: icon.trim() || null } })
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

// ─── Computer Scoring Config ──────────────────────────────────────────────────
const SCORING_CONFIG_KEY = 'computer_scoring'

export async function getComputerScoringConfig(): Promise<ComputerScoringConfig> {
  const row = await prisma.systemConfig.findUnique({ where: { key: SCORING_CONFIG_KEY } })
  if (!row) return DEFAULT_SCORING_CONFIG
  return row.value as ComputerScoringConfig
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
        cpuBrand: asset.cpuBrand,
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
