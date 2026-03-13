'use server'

import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/config'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { AssetStatus, StorageType, CpuBrand } from '@prisma/client'
import { scoreComputer } from '@/lib/scoring/computer'

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

export interface CreateAssetInput {
  tag: string
  name: string
  categoryId: string
  status: AssetStatus
  location?: string
  serialNumber?: string
  assignedToUserId?: string
  notes?: string
  // Hardware
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

    // Compute performance score
    const scored = scoreComputer({
      ramGb: input.ramGb ?? null,
      storageType: input.storageType ?? null,
      cpuBrand: input.cpuBrand ?? null,
      cpuModel: input.cpuModel ?? null,
      cpuGeneration: input.cpuGeneration ?? null,
    })

    const asset = await prisma.asset.create({
      data: {
        tag: input.tag.trim(),
        name: input.name.trim(),
        categoryId: input.categoryId,
        status: input.status ?? 'STOCK',
        location: input.location?.trim() || null,
        serialNumber: input.serialNumber?.trim() || null,
        assignedToUserId: input.assignedToUserId || null,
        notes: input.notes?.trim() || null,
        // Hardware
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

    revalidatePath('/assets')
    return { ok: true, id: asset.id }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro desconhecido'
    return { ok: false, error: msg }
  }
}
