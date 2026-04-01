'use server'

import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'

async function requireAdmin() {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') redirect('/dashboard')
}

// ── Tipos ──────────────────────────────────────────────────────────────────────

export interface SystemIdentity {
  systemName: string
  companyName: string
  systemLogo: string | null  // base64 data URL ou null
}

export interface EmailToTicketConfig {
  enabled: boolean
  address: string
  provider: 'smtp' | 'imap'
  host: string
  port: number
  user: string
  pass: string
}

export interface NotificationsConfig {
  pushEnabled: boolean
  csatEnabled: boolean
}

// ── Leitura ────────────────────────────────────────────────────────────────────

export async function getSystemIdentity(): Promise<SystemIdentity> {
  const rows = await prisma.systemConfig.findMany({
    where: { key: { in: ['system_name', 'company_name', 'system_logo'] } },
  })
  const map = Object.fromEntries(rows.map(r => [r.key, r.value as string | null]))
  return {
    systemName:  (map.system_name  as string) ?? 'HelpDesk',
    companyName: (map.company_name as string) ?? 'Itamarathy',
    systemLogo:  (map.system_logo  as string | null) ?? null,
  }
}

export async function getEmailToTicketConfig(): Promise<EmailToTicketConfig> {
  const row = await prisma.systemConfig.findUnique({ where: { key: 'email_to_ticket' } })
  const v = (row?.value ?? {}) as Record<string, unknown>
  return {
    enabled:  (v.enabled  as boolean)  ?? false,
    address:  (v.address  as string)   ?? '',
    provider: (v.provider as 'smtp' | 'imap') ?? 'smtp',
    host:     (v.host     as string)   ?? '',
    port:     (v.port     as number)   ?? 587,
    user:     (v.user     as string)   ?? '',
    pass:     (v.pass     as string)   ?? '',
  }
}

export async function getNotificationsConfig(): Promise<NotificationsConfig> {
  const rows = await prisma.systemConfig.findMany({
    where: { key: { in: ['push_enabled', 'csat_enabled'] } },
  })
  const map = Object.fromEntries(rows.map(r => [r.key, r.value]))
  return {
    pushEnabled: (map.push_enabled as boolean) ?? false,
    csatEnabled: (map.csat_enabled as boolean) ?? false,
  }
}

// ── Escrita ────────────────────────────────────────────────────────────────────

export async function saveSystemIdentity(data: SystemIdentity): Promise<{ ok: boolean }> {
  await requireAdmin()
  await Promise.all([
    prisma.systemConfig.upsert({ where: { key: 'system_name'  }, create: { key: 'system_name',  value: data.systemName  }, update: { value: data.systemName  } }),
    prisma.systemConfig.upsert({ where: { key: 'company_name' }, create: { key: 'company_name', value: data.companyName }, update: { value: data.companyName } }),
    prisma.systemConfig.upsert({ where: { key: 'system_logo'  }, create: { key: 'system_logo',  value: data.systemLogo as string ?? '' }, update: { value: data.systemLogo as string ?? '' } }),
  ])
  return { ok: true }
}

export async function saveEmailToTicketConfig(data: EmailToTicketConfig): Promise<{ ok: boolean }> {
  await requireAdmin()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const v = data as any
  await prisma.systemConfig.upsert({
    where:  { key: 'email_to_ticket' },
    create: { key: 'email_to_ticket', value: v },
    update: { value: v },
  })
  return { ok: true }
}

export async function saveNotificationsConfig(data: NotificationsConfig): Promise<{ ok: boolean }> {
  await requireAdmin()
  await Promise.all([
    prisma.systemConfig.upsert({ where: { key: 'push_enabled'  }, create: { key: 'push_enabled',  value: data.pushEnabled }, update: { value: data.pushEnabled } }),
    prisma.systemConfig.upsert({ where: { key: 'csat_enabled'  }, create: { key: 'csat_enabled',  value: data.csatEnabled }, update: { value: data.csatEnabled } }),
  ])
  return { ok: true }
}
