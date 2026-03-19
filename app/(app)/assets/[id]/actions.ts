'use server'

import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/config'
import { revalidatePath } from 'next/cache'
import { AssetStatus, StorageType, CpuBrand } from '@prisma/client'
import { promises as fs } from 'fs'
import path from 'path'
import { redirect } from 'next/navigation'
import { scoreComputer, scoreFromCatalog } from '@/lib/scoring/computer'

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

/** Retorna true se a tag estiver disponível (excluindo o próprio ativo) */
export async function checkTagUniqueForEdit(tag: string, excludeAssetId: string): Promise<boolean> {
  if (!tag?.trim()) return true
  const exists = await prisma.asset.findFirst({
    where: { tag: tag.trim().toUpperCase(), NOT: { id: excludeAssetId } },
    select: { id: true },
  })
  return !exists
}

// ─── Update asset (full form — from edit page) ───────────────────────────────
export interface UpdateAssetInput {
  tag: string
  name: string
  categoryId: string
  status: AssetStatus
  location?: string
  serialNumber?: string
  assignedToUserId?: string
  notes?: string
  // Hardware — catálogo (scoring)
  cpuPartId?: string
  ramPartId?: string
  storagePartId?: string
  // Hardware — campos legados (descrição)
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

export async function updateAssetFull(
  assetId: string,
  input: UpdateAssetInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const session = await requireEditor()

    if (!input.tag?.trim()) return { ok: false, error: 'Tag é obrigatória' }
    if (!input.name?.trim()) return { ok: false, error: 'Nome é obrigatório' }
    if (!input.categoryId) return { ok: false, error: 'Categoria é obrigatória' }

    // Check tag uniqueness (allow same asset to keep its tag)
    const existing = await prisma.asset.findFirst({
      where: { tag: input.tag.trim(), NOT: { id: assetId } },
    })
    if (existing) return { ok: false, error: `Tag "${input.tag}" já está em uso por outro ativo` }

    // Fetch current state to detect changes (including relation names for readable audit log)
    const current = await prisma.asset.findUnique({
      where: { id: assetId },
      select: {
        assignedToUserId: true, status: true, location: true,
        name: true, tag: true, serialNumber: true, categoryId: true,
        ramGb: true, storageType: true, storageGb: true,
        cpuBrand: true, cpuModel: true, cpuGeneration: true,
        cpuPartId: true, ramPartId: true, storagePartId: true,
        category:    { select: { name: true } },
        cpuPart:     { select: { brand: true, model: true } },
        ramPart:     { select: { brand: true, model: true } },
        storagePart: { select: { brand: true, model: true } },
      },
    })
    if (!current) return { ok: false, error: 'Ativo não encontrado' }

    // Fetch new hardware parts (for scoring AND change-log display)
    const [newCpuPart, newRamPart, newStoragePart] = await Promise.all([
      input.cpuPartId    ? prisma.hardwarePart.findUnique({ where: { id: input.cpuPartId    }, select: { id: true, scorePoints: true, model: true, notes: true, brand: true } }) : null,
      input.ramPartId    ? prisma.hardwarePart.findUnique({ where: { id: input.ramPartId    }, select: { id: true, scorePoints: true, model: true, notes: true, brand: true } }) : null,
      input.storagePartId? prisma.hardwarePart.findUnique({ where: { id: input.storagePartId}, select: { id: true, scorePoints: true, model: true, notes: true, brand: true } }) : null,
    ])

    // Compute performance score — catálogo tem prioridade sobre heurística
    let scored = null
    if (input.cpuPartId || input.ramPartId || input.storagePartId) {
      scored = scoreFromCatalog({ cpuPart: newCpuPart, ramPart: newRamPart, storagePart: newStoragePart, cpuGeneration: input.cpuGeneration ?? null })
    } else {
      scored = scoreComputer({
        ramGb: input.ramGb ?? null,
        storageType: input.storageType ?? null,
        cpuModel: input.cpuModel ?? null,
        cpuGeneration: input.cpuGeneration ?? null,
      })
    }

    const newAssignee = input.assignedToUserId || null
    const newStatus   = input.status as AssetStatus
    const assigneeChanged = newAssignee !== current.assignedToUserId
    const statusChanged   = newStatus !== current.status

    // Detect which fields changed — changedFields used for movement type, changedLines for audit log
    const changedFields: string[] = []
    const changedLines: string[] = []

    const STATUS_LABEL: Record<string, string> = { STOCK: 'Estoque', DEPLOYED: 'Implantado', MAINTENANCE: 'Manutenção', LOANED: 'Emprestado', DISCARDED: 'Descartado' }

    function track(field: string, oldVal: string | number | null | undefined, newVal: string | number | null | undefined) {
      const o = oldVal ?? '—'
      const n = newVal ?? '—'
      if (o !== n) { changedFields.push(field); changedLines.push(`${field}: ${o} → ${n}`) }
    }

    track('tag',          current.tag,                                 input.tag?.trim())
    track('nome',         current.name,                                input.name?.trim())
    track('nº série',     current.serialNumber,                        input.serialNumber?.trim() || null)
    track('localização',  current.location,                            input.location?.trim() || null)

    if (input.categoryId !== current.categoryId) {
      const newCat = await prisma.assetCategory.findUnique({ where: { id: input.categoryId }, select: { name: true } })
      changedFields.push('categoria')
      changedLines.push(`categoria: ${current.category?.name ?? '—'} → ${newCat?.name ?? input.categoryId}`)
    }

    if (newStatus !== current.status)
      changedLines.push(`situação: ${STATUS_LABEL[current.status] ?? current.status} → ${STATUS_LABEL[newStatus] ?? newStatus}`)

    // Hardware — catálogo
    if ((input.cpuPartId ?? null) !== current.cpuPartId) {
      const o = current.cpuPart ? `${current.cpuPart.brand} ${current.cpuPart.model}` : '—'
      const n = newCpuPart       ? `${newCpuPart.brand} ${newCpuPart.model}`           : '—'
      changedFields.push('CPU'); changedLines.push(`CPU: ${o} → ${n}`)
    }
    if ((input.ramPartId ?? null) !== current.ramPartId) {
      const o = current.ramPart ? `${current.ramPart.brand} ${current.ramPart.model}` : '—'
      const n = newRamPart       ? `${newRamPart.brand} ${newRamPart.model}`           : '—'
      changedFields.push('RAM'); changedLines.push(`RAM: ${o} → ${n}`)
    }
    if ((input.storagePartId ?? null) !== current.storagePartId) {
      const o = current.storagePart ? `${current.storagePart.brand} ${current.storagePart.model}` : '—'
      const n = newStoragePart       ? `${newStoragePart.brand} ${newStoragePart.model}`           : '—'
      changedFields.push('armazenamento'); changedLines.push(`armazenamento: ${o} → ${n}`)
    }

    // Hardware — legado
    track('modelo CPU',    current.cpuModel,      input.cpuModel?.trim() || null)
    track('geração CPU',   current.cpuGeneration, input.cpuGeneration ?? null)
    track('RAM (GB)',      current.ramGb,          input.ramGb ?? null)
    track('disco (GB)',    current.storageGb,      input.storageGb ?? null)

    // Determine movement type
    let movementType: 'CHECK_OUT' | 'CHECK_IN' | 'TRANSFER' | 'MAINT_START' | 'MAINT_END' | 'DISCARD' | 'UPDATE' | null = null
    if (assigneeChanged || statusChanged) {
      if (newStatus === 'MAINTENANCE' && current.status !== 'MAINTENANCE') movementType = 'MAINT_START'
      else if (current.status === 'MAINTENANCE' && newStatus !== 'MAINTENANCE') movementType = 'MAINT_END'
      else if (newStatus === 'DISCARDED') movementType = 'DISCARD'
      else if (newAssignee && !current.assignedToUserId) movementType = 'CHECK_OUT'
      else if (!newAssignee && current.assignedToUserId) movementType = 'CHECK_IN'
      else if (newAssignee && current.assignedToUserId && newAssignee !== current.assignedToUserId) movementType = 'TRANSFER'
      else movementType = 'UPDATE'
    } else if (changedFields.length > 0) {
      movementType = 'UPDATE'
    }

    const assetData = {
      tag: input.tag.trim(),
      name: input.name.trim(),
      categoryId: input.categoryId,
      status: newStatus,
      location: input.location?.trim() || null,
      serialNumber: input.serialNumber?.trim() || null,
      assignedToUserId: newAssignee,
      notes: input.notes?.trim() || null,
      // Hardware — catálogo
      cpuPartId: input.cpuPartId ?? null,
      ramPartId: input.ramPartId ?? null,
      storagePartId: input.storagePartId ?? null,
      // Hardware — legado (descrição)
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
    }

    await prisma.asset.update({ where: { id: assetId }, data: assetData })

    // Handle custom field values
    if (input.customFieldValues) {
      const entries = Object.entries(input.customFieldValues).filter(([, v]) => v !== '')

      // Validate uniqueness constraints before upserting (exclude current asset)
      for (const [fieldDefId, value] of entries) {
        const fieldDef = await prisma.assetCustomFieldDef.findUnique({ where: { id: fieldDefId }, select: { isUnique: true, label: true } })
        if (fieldDef?.isUnique) {
          const clash = await prisma.assetCustomFieldValue.findFirst({ where: { fieldDefId, value, assetId: { not: assetId } } })
          if (clash) return { ok: false, error: `O campo "${fieldDef.label}" exige um valor único. O valor "${value}" já está em uso.` }
        }
      }

      for (const [fieldDefId, value] of entries) {
        await prisma.assetCustomFieldValue.upsert({
          where: { assetId_fieldDefId: { assetId, fieldDefId } },
          update: { value },
          create: { assetId, fieldDefId, value },
        })
      }
      const emptyKeys = Object.entries(input.customFieldValues)
        .filter(([, v]) => v === '')
        .map(([k]) => k)
      if (emptyKeys.length > 0) {
        await prisma.assetCustomFieldValue.deleteMany({
          where: { assetId, fieldDefId: { in: emptyKeys } },
        })
      }
    }

    if (movementType) {
      const movNotes = changedLines.length > 0 ? changedLines.join('\n') : undefined
      try {
        await prisma.assetMovement.create({
          data: {
            assetId,
            actorId: session.user.id,
            type: movementType,
            fromUserId: current.assignedToUserId ?? undefined,
            toUserId: newAssignee ?? undefined,
            fromStatus: current.status,
            toStatus: newStatus,
            toLocation: input.location?.trim() || undefined,
            notes: movNotes,
          },
        })
      } catch {
        // Movement logging may fail if the server was started before the UPDATE
        // migration was applied. The asset update itself succeeded. Restart the
        // dev server once to reload the Prisma client and restore movement logging.
      }
    }

    revalidatePath(`/assets/${assetId}`)
    revalidatePath('/assets')
    revalidatePath('/movements')
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erro desconhecido'
    return { ok: false, error: msg }
  }
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
export async function checkInAsset(assetId: string, location?: string, notes?: string) {
  const session = await requireEditor()

  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    select: { id: true, status: true, assignedToUserId: true, location: true },
  })
  if (!asset) throw new Error('Ativo não encontrado')

  const toLocation = location?.trim() || asset.location || null

  await prisma.$transaction([
    prisma.asset.update({
      where: { id: assetId },
      data: {
        status: 'STOCK',
        assignedToUserId: null,
        ...(toLocation !== undefined && { location: toLocation }),
      },
    }),
    prisma.assetMovement.create({
      data: {
        assetId,
        actorId: session.user.id,
        type: 'CHECK_IN',
        fromUserId: asset.assignedToUserId ?? undefined,
        fromStatus: asset.status,
        toStatus: 'STOCK',
        toLocation: toLocation ?? undefined,
        notes: notes?.trim() || undefined,
      },
    }),
  ])

  revalidatePath(`/assets/${assetId}`)
  revalidatePath('/assets')
  revalidatePath('/movements')
}

// ─── Check-out (allocate to user) ─────────────────────────────────────────────
export async function checkOutAsset(assetId: string, toUserId: string, location?: string, notes?: string) {
  const session = await requireEditor()

  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    select: { id: true, status: true, assignedToUserId: true, location: true },
  })
  if (!asset) throw new Error('Ativo não encontrado')

  const toLocation = location?.trim() || null

  await prisma.$transaction([
    prisma.asset.update({
      where: { id: assetId },
      data: {
        status: 'DEPLOYED',
        assignedToUserId: toUserId,
        ...(toLocation !== null && { location: toLocation }),
      },
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
        toLocation: toLocation ?? undefined,
        notes: notes?.trim() || undefined,
      },
    }),
  ])

  revalidatePath(`/assets/${assetId}`)
  revalidatePath('/assets')
  revalidatePath('/movements')
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
