'use server'

import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/config'
import { revalidatePath } from 'next/cache'
import { AssetStatus, StorageType, CpuBrand } from '@prisma/client'
import { promises as fs } from 'fs'
import path from 'path'
import { redirect } from 'next/navigation'

// ─── Auth helper ────────────────────────────────────────────────────────────
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
  if (session.user.role !== 'ADMIN') throw new Error('Forbidden')
  return session
}

// ─── Update asset ────────────────────────────────────────────────────────────
export async function updateAsset(
  assetId: string,
  data: {
    name?: string
    location?: string | null
    serialNumber?: string | null
    status?: AssetStatus
    assignedToUserId?: string | null
    notes?: string | null
    // Hardware
    ramGb?: number | null
    storageType?: StorageType | null
    storageGb?: number | null
    cpuBrand?: CpuBrand | null
    cpuModel?: string | null
    cpuGeneration?: number | null
    // Financial
    acquisitionCost?: number | null
    currentValue?: number | null
    acquisitionDate?: string | null
    warrantyUntil?: string | null
    acquisitionDateRaw?: Date | null
    warrantyUntilRaw?: Date | null
  },
) {
  await requireEditor()

  await prisma.asset.update({
    where: { id: assetId },
    data: {
      ...(data.name !== undefined       && { name: data.name }),
      ...(data.location !== undefined   && { location: data.location }),
      ...(data.serialNumber !== undefined && { serialNumber: data.serialNumber }),
      ...(data.status !== undefined     && { status: data.status }),
      ...(data.assignedToUserId !== undefined && { assignedToUserId: data.assignedToUserId }),
      ...(data.notes !== undefined      && { notes: data.notes }),
      // Hardware
      ...(data.ramGb !== undefined      && { ramGb: data.ramGb }),
      ...(data.storageType !== undefined && { storageType: data.storageType }),
      ...(data.storageGb !== undefined  && { storageGb: data.storageGb }),
      ...(data.cpuBrand !== undefined   && { cpuBrand: data.cpuBrand }),
      ...(data.cpuModel !== undefined   && { cpuModel: data.cpuModel }),
      ...(data.cpuGeneration !== undefined && { cpuGeneration: data.cpuGeneration }),
      // Financial
      ...(data.acquisitionCost !== undefined && { acquisitionCost: data.acquisitionCost }),
      ...(data.currentValue !== undefined    && { currentValue: data.currentValue }),
      ...(data.acquisitionDate !== undefined && {
        acquisitionDate: data.acquisitionDate ? new Date(data.acquisitionDate) : null,
      }),
      ...(data.warrantyUntil !== undefined && {
        warrantyUntil: data.warrantyUntil ? new Date(data.warrantyUntil) : null,
      }),
    },
  })

  revalidatePath(`/assets/${assetId}`)
  revalidatePath('/assets')
}

// ─── Notes ───────────────────────────────────────────────────────────────────
export async function addAssetNote(assetId: string, body: string) {
  const session = await requireEditor()

  await prisma.assetNote.create({
    data: {
      assetId,
      authorId: session.user.id,
      body: body.trim(),
    },
  })

  revalidatePath(`/assets/${assetId}`)
}

export async function deleteAssetNote(assetId: string, noteId: string) {
  const session = await requireEditor()

  const note = await prisma.assetNote.findUnique({ where: { id: noteId } })
  if (!note) return

  if (note.authorId !== session.user.id && session.user.role !== 'ADMIN') {
    throw new Error('Forbidden')
  }

  await prisma.assetNote.delete({ where: { id: noteId } })
  revalidatePath(`/assets/${assetId}`)
}

// ─── Files ───────────────────────────────────────────────────────────────────
export async function uploadAssetFile(assetId: string, formData: FormData) {
  const session = await requireEditor()

  const file = formData.get('file') as File | null
  if (!file || file.size === 0) throw new Error('Arquivo inválido')
  if (file.size > 50 * 1024 * 1024) throw new Error('Arquivo muito grande (máx. 50 MB)')

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const ext = file.name.includes('.') ? file.name.split('.').pop()! : 'bin'
  const uuid = crypto.randomUUID()
  const filename = `${uuid}.${ext}`

  const dir = path.join(process.cwd(), 'public', 'uploads', 'assets', assetId)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(path.join(dir, filename), buffer)

  await prisma.assetFile.create({
    data: {
      assetId,
      uploadedById: session.user.id,
      filename,
      originalName: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      url: `/uploads/assets/${assetId}/${filename}`,
    },
  })

  revalidatePath(`/assets/${assetId}`)
}

export async function deleteAssetFile(assetId: string, fileId: string) {
  await requireEditor()

  const record = await prisma.assetFile.findUnique({ where: { id: fileId } })
  if (!record) return

  const filePath = path.join(process.cwd(), 'public', record.url)
  try { await fs.unlink(filePath) } catch { /* already gone */ }

  await prisma.assetFile.delete({ where: { id: fileId } })
  revalidatePath(`/assets/${assetId}`)
}

// ─── Check-in (return to stock) ──────────────────────────────────────────────
export async function checkInAsset(assetId: string) {
  const session = await requireEditor()

  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    select: { id: true, status: true, assignedToUserId: true },
  })
  if (!asset) throw new Error('Ativo não encontrado')

  await prisma.$transaction([
    prisma.asset.update({
      where: { id: assetId },
      data: { status: 'STOCK', assignedToUserId: null },
    }),
    prisma.assetMovement.create({
      data: {
        assetId,
        actorId: session.user.id,
        type: 'CHECK_IN',
        fromUserId: asset.assignedToUserId ?? undefined,
        fromStatus: asset.status,
        toStatus: 'STOCK',
      },
    }),
  ])

  revalidatePath(`/assets/${assetId}`)
  revalidatePath('/assets')
}

// ─── Check-out (allocate to user) ─────────────────────────────────────────────
export async function checkOutAsset(assetId: string, toUserId: string) {
  const session = await requireEditor()

  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    select: { id: true, status: true, assignedToUserId: true },
  })
  if (!asset) throw new Error('Ativo não encontrado')

  await prisma.$transaction([
    prisma.asset.update({
      where: { id: assetId },
      data: { status: 'DEPLOYED', assignedToUserId: toUserId },
    }),
    prisma.assetMovement.create({
      data: {
        assetId,
        actorId: session.user.id,
        type: 'CHECK_OUT',
        fromUserId: asset.assignedToUserId ?? undefined,
        toUserId,
        fromStatus: asset.status,
        toStatus: 'DEPLOYED',
      },
    }),
  ])

  revalidatePath(`/assets/${assetId}`)
  revalidatePath('/assets')
}

// ─── Clone asset ──────────────────────────────────────────────────────────────
export async function cloneAsset(assetId: string): Promise<string> {
  await requireEditor()

  const source = await prisma.asset.findUnique({ where: { id: assetId } })
  if (!source) throw new Error('Ativo não encontrado')

  // Generate a new tag: PAT-XXXX (next available)
  const last = await prisma.asset.findFirst({
    where: { tag: { startsWith: 'PAT-' } },
    orderBy: { tag: 'desc' },
    select: { tag: true },
  })
  let nextNum = 1
  if (last?.tag) {
    const n = parseInt(last.tag.replace('PAT-', ''), 10)
    if (!isNaN(n)) nextNum = n + 1
  }
  const newTag = `PAT-${String(nextNum).padStart(4, '0')}`

  const created = await prisma.asset.create({
    data: {
      tag: newTag,
      name: `${source.name} (cópia)`,
      categoryId: source.categoryId,
      status: 'STOCK',
      location: source.location,
      serialNumber: null,
      // Hardware
      ramGb: source.ramGb,
      storageType: source.storageType,
      storageGb: source.storageGb,
      cpuBrand: source.cpuBrand,
      cpuModel: source.cpuModel,
      cpuGeneration: source.cpuGeneration,
      // Scores
      performanceScore: source.performanceScore,
      performanceLabel: source.performanceLabel,
      performanceNotes: source.performanceNotes,
      // Financial (reset)
      acquisitionCost: null,
      currentValue: null,
      acquisitionDate: null,
      warrantyUntil: null,
    },
  })

  revalidatePath('/assets')
  return created.id
}

// ─── Delete asset ─────────────────────────────────────────────────────────────
export async function deleteAsset(assetId: string) {
  await requireAdmin()

  // Delete physical files
  const files = await prisma.assetFile.findMany({
    where: { assetId },
    select: { url: true },
  })
  for (const f of files) {
    try { await fs.unlink(path.join(process.cwd(), 'public', f.url)) } catch { /* ok */ }
  }

  // Cascade: notes, files, movements are deleted via DB cascade (or explicit)
  await prisma.assetNote.deleteMany({ where: { assetId } })
  await prisma.assetFile.deleteMany({ where: { assetId } })
  await prisma.assetMovement.deleteMany({ where: { assetId } })
  await prisma.asset.delete({ where: { id: assetId } })

  revalidatePath('/assets')
}
