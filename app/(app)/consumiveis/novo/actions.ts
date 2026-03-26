'use server'

import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/config'
import { revalidatePath } from 'next/cache'
import { AssetStatus } from '@prisma/client'

async function requireEditor() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const role = session.user.role
  if (role === 'COLABORADOR' || role === 'AUXILIAR_TI') throw new Error('Forbidden')
  return session
}

/** Gera tag automática no formato ACC-XXXX ou CSM-XXXX */
async function nextConsumTag(kind: 'ACCESSORY' | 'DISPOSABLE'): Promise<string> {
  const prefix = kind === 'ACCESSORY' ? 'ACC' : 'CSM'
  const last = await prisma.asset.findFirst({
    where: { tag: { startsWith: `${prefix}-` } },
    orderBy: { tag: 'desc' },
    select: { tag: true },
  })
  let n = 1
  if (last?.tag) {
    const parsed = parseInt(last.tag.replace(`${prefix}-`, ''), 10)
    if (!isNaN(parsed)) n = parsed + 1
  }
  return `${prefix}-${String(n).padStart(4, '0')}`
}

export interface CreateConsumívelInput {
  categoryId: string
  kind: 'ACCESSORY' | 'DISPOSABLE'
  status: AssetStatus
  location?: string
  assignedToUserId?: string
  notes?: string
  acquisitionCost?: number
  acquisitionDate?: string
  warrantyUntil?: string
  customFieldValues?: Record<string, string>
}

export async function createConsumível(
  input: CreateConsumívelInput,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    await requireEditor()

    if (!input.categoryId) return { ok: false, error: 'Categoria é obrigatória' }

    const category = await prisma.assetCategory.findUnique({
      where: { id: input.categoryId },
      select: { name: true },
    })
    if (!category) return { ok: false, error: 'Categoria não encontrada' }

    const tag = await nextConsumTag(input.kind)

    const asset = await prisma.asset.create({
      data: {
        tag,
        name: category.name,
        categoryId: input.categoryId,
        status: input.status ?? 'STOCK',
        location: input.location?.trim() || null,
        assignedToUserId: input.assignedToUserId || null,
        notes: input.notes?.trim() || null,
        acquisitionCost: input.acquisitionCost ?? null,
        acquisitionDate: input.acquisitionDate ? new Date(input.acquisitionDate) : null,
        warrantyUntil: input.warrantyUntil ? new Date(input.warrantyUntil) : null,
      },
    })

    // Custom field values
    if (input.customFieldValues) {
      const entries = Object.entries(input.customFieldValues).filter(([, v]) => v !== '')
      for (const [fieldDefId, value] of entries) {
        const fieldDef = await prisma.assetCustomFieldDef.findUnique({
          where: { id: fieldDefId },
          select: { isUnique: true, label: true },
        })
        if (fieldDef?.isUnique) {
          const clash = await prisma.assetCustomFieldValue.findFirst({ where: { fieldDefId, value } })
          if (clash) return { ok: false, error: `O campo "${fieldDef.label}" já tem o valor "${value}" em uso.` }
        }
        await prisma.assetCustomFieldValue.create({
          data: { assetId: asset.id, fieldDefId, value },
        })
      }
    }

    // Register creation movement
    const session2 = await auth()
    await prisma.assetMovement.create({
      data: {
        assetId:    asset.id,
        type:       'CREATED',
        actorId:    session2!.user.id,
        toLocation: input.location?.trim() || null,
        toStatus:   input.status ?? 'STOCK',
        notes:      input.notes?.trim() || null,
      },
    })

    revalidatePath('/consumiveis')
    revalidatePath('/assets')
    revalidatePath('/movements')
    return { ok: true, id: asset.id }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro desconhecido' }
  }
}
