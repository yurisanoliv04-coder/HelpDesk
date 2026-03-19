'use server'

import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/config'
import { revalidatePath } from 'next/cache'
import { promises as fs } from 'fs'
import path from 'path'

async function requireEditor() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const role = session.user.role
  if (role === 'COLABORADOR' || role === 'AUXILIAR_TI') throw new Error('Forbidden')
  return session
}

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  if (session.user.role !== 'ADMIN' && session.user.role !== 'TECNICO') throw new Error('Forbidden')
  return session
}

// ─── Bulk Check-in ────────────────────────────────────────────────────────────
export async function bulkCheckIn(
  assetIds: string[],
  location: string,
  notes?: string,
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  try {
    const session = await requireEditor()
    if (!assetIds.length) return { ok: false, error: 'Nenhum ativo selecionado' }

    const assets = await prisma.asset.findMany({
      where: { id: { in: assetIds } },
      select: { id: true, status: true, assignedToUserId: true },
    })

    await prisma.$transaction(
      assets.flatMap(asset => [
        prisma.asset.update({
          where: { id: asset.id },
          data: {
            status: 'STOCK',
            assignedToUserId: null,
            location: location || null,
          },
        }),
        prisma.assetMovement.create({
          data: {
            assetId: asset.id,
            actorId: session.user.id,
            type: 'CHECK_IN',
            fromUserId: asset.assignedToUserId ?? undefined,
            fromStatus: asset.status,
            toStatus: 'STOCK',
            toLocation: location || undefined,
            notes: notes?.trim() || undefined,
          },
        }),
      ])
    )

    revalidatePath('/assets')
    revalidatePath('/movements')
    return { ok: true, count: assets.length }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro desconhecido'
    return { ok: false, error: msg }
  }
}

// ─── Bulk Check-out ───────────────────────────────────────────────────────────
export async function bulkCheckOut(
  assetIds: string[],
  userId: string,
  location: string,
  notes?: string,
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  try {
    const session = await requireEditor()
    if (!assetIds.length) return { ok: false, error: 'Nenhum ativo selecionado' }
    if (!userId) return { ok: false, error: 'Usuário não selecionado' }

    const assets = await prisma.asset.findMany({
      where: { id: { in: assetIds } },
      select: { id: true, status: true, assignedToUserId: true },
    })

    await prisma.$transaction(
      assets.flatMap(asset => [
        prisma.asset.update({
          where: { id: asset.id },
          data: {
            status: 'DEPLOYED',
            assignedToUserId: userId,
            ...(location ? { location } : {}),
          },
        }),
        prisma.assetMovement.create({
          data: {
            assetId: asset.id,
            actorId: session.user.id,
            type: 'CHECK_OUT',
            fromUserId: asset.assignedToUserId ?? undefined,
            toUserId: userId,
            fromStatus: asset.status,
            toStatus: 'DEPLOYED',
            toLocation: location || undefined,
            notes: notes?.trim() || undefined,
          },
        }),
      ])
    )

    revalidatePath('/assets')
    revalidatePath('/movements')
    return { ok: true, count: assets.length }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro desconhecido'
    return { ok: false, error: msg }
  }
}

// ─── Bulk Delete ──────────────────────────────────────────────────────────────
export async function bulkDeleteAssets(
  assetIds: string[],
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  try {
    await requireAdmin()
    if (!assetIds.length) return { ok: false, error: 'Nenhum ativo selecionado' }

    // Delete physical files for each asset
    const files = await prisma.assetFile.findMany({
      where: { assetId: { in: assetIds } },
      select: { url: true },
    })
    for (const f of files) {
      try { await fs.unlink(path.join(process.cwd(), 'public', f.url)) } catch { /* ok */ }
    }

    // Delete related records and assets
    await prisma.assetNote.deleteMany({ where: { assetId: { in: assetIds } } })
    await prisma.assetFile.deleteMany({ where: { assetId: { in: assetIds } } })
    await prisma.assetMovement.deleteMany({ where: { assetId: { in: assetIds } } })
    const deleted = await prisma.asset.deleteMany({ where: { id: { in: assetIds } } })

    revalidatePath('/assets')
    return { ok: true, count: deleted.count }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro desconhecido'
    return { ok: false, error: msg }
  }
}
