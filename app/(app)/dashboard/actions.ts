'use server'

import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { revalidatePath } from 'next/cache'
import { WidgetInstance } from '@/lib/dashboard/types'

async function requireAuth() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Não autenticado')
  return session.user.id
}

async function requireOwnership(dashboardId: string, userId: string) {
  const db = await prisma.userDashboard.findFirst({
    where: { id: dashboardId, userId },
    select: { id: true },
  })
  if (!db) throw new Error('Dashboard não encontrado')
}

// ── Save layout ────────────────────────────────────────────────────────────────

export async function saveDashboardLayout(dashboardId: string, layout: WidgetInstance[]) {
  const userId = await requireAuth()
  await requireOwnership(dashboardId, userId)

  await prisma.userDashboard.update({
    where: { id: dashboardId },
    data: { layout: layout as object[] },
  })
  revalidatePath('/dashboard')
}

// ── Create dashboard ───────────────────────────────────────────────────────────

export async function createDashboard(name: string, copyFromId?: string) {
  const userId = await requireAuth()

  let layout: object[] = []
  if (copyFromId) {
    const source = await prisma.userDashboard.findFirst({
      where: { id: copyFromId, userId },
      select: { layout: true },
    })
    if (source?.layout) {
      layout = source.layout as object[]
    }
  }

  const created = await prisma.userDashboard.create({
    data: {
      userId,
      name: name.trim() || 'Novo Dashboard',
      isDefault: false,
      layout,
    },
    select: { id: true, name: true, isDefault: true, layout: true, updatedAt: true },
  })

  revalidatePath('/dashboard')
  return {
    ...created,
    updatedAt: created.updatedAt.toISOString(),
  }
}

// ── Rename dashboard ───────────────────────────────────────────────────────────

export async function renameDashboard(dashboardId: string, name: string) {
  const userId = await requireAuth()
  await requireOwnership(dashboardId, userId)

  await prisma.userDashboard.update({
    where: { id: dashboardId },
    data: { name: name.trim() || 'Dashboard' },
  })
  revalidatePath('/dashboard')
}

// ── Delete dashboard ───────────────────────────────────────────────────────────

export async function deleteDashboard(dashboardId: string) {
  const userId = await requireAuth()
  await requireOwnership(dashboardId, userId)

  const count = await prisma.userDashboard.count({ where: { userId } })
  if (count <= 1) throw new Error('Não é possível excluir o único dashboard')

  const target = await prisma.userDashboard.findFirst({
    where: { id: dashboardId, userId },
    select: { isDefault: true },
  })

  await prisma.userDashboard.delete({ where: { id: dashboardId } })

  // Se era o default, promover o mais antigo restante
  if (target?.isDefault) {
    const oldest = await prisma.userDashboard.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    })
    if (oldest) {
      await prisma.userDashboard.update({
        where: { id: oldest.id },
        data: { isDefault: true },
      })
    }
  }

  revalidatePath('/dashboard')
}

// ── Set default dashboard ──────────────────────────────────────────────────────

export async function setDefaultDashboard(dashboardId: string) {
  const userId = await requireAuth()
  await requireOwnership(dashboardId, userId)

  // Remover default de todos, depois setar no escolhido
  await prisma.userDashboard.updateMany({
    where: { userId },
    data: { isDefault: false },
  })
  await prisma.userDashboard.update({
    where: { id: dashboardId },
    data: { isDefault: true },
  })

  revalidatePath('/dashboard')
}
