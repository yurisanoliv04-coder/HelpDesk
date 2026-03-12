'use server'

import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/config'
import { revalidatePath } from 'next/cache'
import { SystemKey, AccessStatus } from '@prisma/client'

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
      entryDate:    data.entryDate    ? new Date(data.entryDate)    : null,
      exitDate:     data.exitDate     ? new Date(data.exitDate)      : null,
      birthday:     data.birthday     ? new Date(data.birthday)      : null,
      phone:        data.phone        ?? null,
      windowsUser:  data.windowsUser  ?? null,
      domainAccount:data.domainAccount ?? null,
    },
  })

  revalidatePath(`/people/${userId}`)
  revalidatePath('/people')
}
