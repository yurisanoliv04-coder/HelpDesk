'use server'

import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/config'
import { revalidatePath } from 'next/cache'
import { SystemKey, AccessStatus } from '@prisma/client'
import { promises as fs } from 'fs'
import path from 'path'

// ─── Auth helper ────────────────────────────────────────────────────────────
async function requireEditor() {
  const session = await auth()
  if (!session?.user?.id) throw new Error('Unauthorized')
  const role = session.user.role
  if (role === 'COLABORADOR' || role === 'AUXILIAR_TI') throw new Error('Forbidden')
  return session
}

// ─── System Access ───────────────────────────────────────────────────────────
export async function upsertSystemAccess(
  userId: string,
  system: SystemKey,
  status: AccessStatus,
  notes: string,
) {
  const session = await auth()
  if (!session || (session.user.role !== 'TECNICO' && session.user.role !== 'ADMIN')) {
    throw new Error('Unauthorized')
  }

  await prisma.userSystemAccess.upsert({
    where: { userId_system: { userId, system } },
    create: { userId, system, status, notes: notes || null },
    update: { status, notes: notes || null },
  })

  revalidatePath(`/people/${userId}`)
}

// ─── User Profile ────────────────────────────────────────────────────────────
export async function updateUserProfile(
  userId: string,
  data: {
    entryDate?: string | null
    exitDate?: string | null
    birthday?: string | null
    phone?: string | null
    windowsUser?: string | null
    domainAccount?: string | null
  },
) {
  const session = await auth()
  if (!session || (session.user.role !== 'TECNICO' && session.user.role !== 'ADMIN')) {
    throw new Error('Unauthorized')
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      entryDate:     data.entryDate     ? new Date(data.entryDate)     : null,
      exitDate:      data.exitDate      ? new Date(data.exitDate)      : null,
      birthday:      data.birthday      ? new Date(data.birthday)      : null,
      phone:         data.phone         ?? null,
      windowsUser:   data.windowsUser   ?? null,
      domainAccount: data.domainAccount ?? null,
    },
  })

  revalidatePath(`/people/${userId}`)
  revalidatePath('/people')
}

// ─── Notes ───────────────────────────────────────────────────────────────────
export async function addUserNote(userId: string, body: string) {
  const session = await requireEditor()

  await prisma.userNote.create({
    data: {
      userId,
      authorId: session.user.id,
      body: body.trim(),
    },
  })

  revalidatePath(`/people/${userId}`)
}

export async function deleteUserNote(userId: string, noteId: string) {
  const session = await requireEditor()

  const note = await prisma.userNote.findUnique({ where: { id: noteId } })
  if (!note) return

  // Only author or ADMIN can delete
  if (note.authorId !== session.user.id && session.user.role !== 'ADMIN') {
    throw new Error('Forbidden')
  }

  await prisma.userNote.delete({ where: { id: noteId } })
  revalidatePath(`/people/${userId}`)
}

// ─── Files ───────────────────────────────────────────────────────────────────
export async function uploadUserFile(userId: string, formData: FormData) {
  const session = await requireEditor()

  const file = formData.get('file') as File | null
  if (!file || file.size === 0) throw new Error('Arquivo inválido')
  if (file.size > 50 * 1024 * 1024) throw new Error('Arquivo muito grande (máx. 50 MB)')

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const ext = file.name.includes('.') ? file.name.split('.').pop()! : 'bin'
  const uuid = crypto.randomUUID()
  const filename = `${uuid}.${ext}`

  const dir = path.join(process.cwd(), 'public', 'uploads', 'people', userId)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(path.join(dir, filename), buffer)

  await prisma.userFile.create({
    data: {
      userId,
      uploadedById: session.user.id,
      filename,
      originalName: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      url: `/uploads/people/${userId}/${filename}`,
    },
  })

  revalidatePath(`/people/${userId}`)
}

export async function deleteUserFile(userId: string, fileId: string) {
  await requireEditor()

  const record = await prisma.userFile.findUnique({ where: { id: fileId } })
  if (!record) return

  const filePath = path.join(process.cwd(), 'public', record.url)
  try { await fs.unlink(filePath) } catch { /* already gone */ }

  await prisma.userFile.delete({ where: { id: fileId } })
  revalidatePath(`/people/${userId}`)
}
