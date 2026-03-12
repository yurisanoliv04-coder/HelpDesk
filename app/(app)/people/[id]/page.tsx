import { prisma } from '@/lib/db/prisma'
import { auth } from '@/lib/auth/config'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import {
  Laptop, Monitor, Printer, Keyboard, MousePointer,
  Headphones, Battery, Network, Smartphone, Package,
  Cpu, HardDrive, Server, Tablet, Camera, type LucideProps,
} from 'lucide-react'
import SystemAccessGrid from '@/components/people/SystemAccessGrid'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  laptop: Laptop, monitor: Monitor, printer: Printer, keyboard: Keyboard,
  'mouse-pointer': MousePointer, headphones: Headphones, battery: Battery,
  network: Network, smartphone: Smartphone, package: Package,
  cpu: Cpu, 'hard-drive': HardDrive, server: Server, tablet: Tablet, camera: Camera,
}

function CategoryIcon({ name }: { name: string | null }) {
  if (!name) return <Package size={14} color="#3d5068" />
  const Icon = iconMap[name]
  return Icon ? <Icon size={14} color="#3d5068" /> : <Package size={14} color="#3d5068" />
}

const roleLabel: Record<string, string> = {
  COLABORADOR: 'Colaborador',
  AUXILIAR_TI: 'Auxiliar TI',
  TECNICO: 'Técnico TI',
  ADMIN: 'Admin TI',
}
const roleColor: Record<string, { text: string; bg: string; border: string }> = {
  COLABORADOR: { text: '#94a3b8', bg: 'rgba(148,163,184,0.1)',  border: 'rgba(148,163,184,0.2)'  },
  AUXILIAR_TI: { text: '#818cf8', bg: 'rgba(129,140,248,0.1)',  border: 'rgba(129,140,248,0.2)'  },
  TECNICO:     { text: '#00d9b8', bg: 'rgba(0,217,184,0.1)',    border: 'rgba(0,217,184,0.2)'    },
  ADMIN:       { text: '#f87171', bg: 'rgba(248,113,113,0.1)',  border: 'rgba(248,113,113,0.2)'  },
}

const statusConfig = {
  OPEN:        { label: 'Aberto',       color: '#38bdf8' },
  IN_PROGRESS: { label: 'Em andamento', color: '#fbbf24' },
  ON_HOLD:     { label: 'Aguardando',   color: '#a78bfa' },
  DONE:        { label: 'Concluído',    color: '#34d399' },
  CANCELED:    { label: 'Cancelado',    color: '#64748b' },
} as Record<string, { label: string; color: string }>

const assetStatusConfig = {
  DEPLOYED:    { label: 'Implantado', color: '#34d399' },
  STOCK:       { label: 'Estoque',    color: '#94a3b8' },
  MAINTENANCE: { label: 'Manutenção', color: '#fbbf24' },
  LOANED:      { label: 'Emprestado', color: '#38bdf8' },
  DISCARDED:   { label: 'Descartado', color: '#f87171' },
} as Record<string, { label: string; color: string }>

function fmt(d: Date | null | undefined): string {
  if (!d) return '—'
  return format(d, "dd/MM/yyyy", { locale: ptBR })
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', letterSpacing: '0.08em', fontWeight: 700 }}>
        {label}
      </span>
      <span style={{ fontSize: 13, color: '#c8d6e5' }}>{value}</span>
    </div>
  )
}

export default async function PersonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const myRole = session?.user.role
  if (myRole === 'COLABORADOR' || myRole === 'AUXILIAR_TI') redirect('/dashboard')

  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      department: true,
      systemAccesses: { orderBy: { system: 'asc' } },
      assignedAssets: {
        include: { category: true },
        orderBy: { updatedAt: 'desc' },
      },
      ticketsAsRequester: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { category: { select: { name: true } } },
      },
    },
  })

  if (!user) notFound()

  const canEdit = myRole === 'TECNICO' || myRole === 'ADMIN'
  const rc = roleColor[user.role] ?? roleColor.COLABORADOR
  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const deployedAssets = user.assignedAssets.filter(a => a.status === 'DEPLOYED')
  const otherAssets    = user.assignedAssets.filter(a => a.status !== 'DEPLOYED')

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Breadcrumb ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Link href="/people" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2d4060', textDecoration: 'none', letterSpacing: '0.1em' }}>
          PESSOAS
        </Link>
        <span style={{ color: '#1e3048', fontSize: 10 }}>/</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#00d9b8', letterSpacing: '0.1em' }}>
          {user.name.split(' ')[0].toUpperCase()}
        </span>
      </div>

      {/* ── Profile header ───────────────────────────────────────────────── */}
      <div style={{
        background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16, padding: '28px 32px',
        display: 'flex', alignItems: 'flex-start', gap: 24,
      }}>
        {/* Avatar grande */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
          background: rc.bg, border: `2px solid ${rc.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 0 24px ${rc.border}`,
        }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: rc.text }}>
            {initials}
          </span>
        </div>

        {/* Nome + status + info primária */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e2eaf4', lineHeight: 1 }}>
              {user.name}
            </h1>
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '3px 10px', borderRadius: 5,
              background: rc.bg, border: `1px solid ${rc.border}`,
              fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: rc.text,
            }}>
              {roleLabel[user.role]}
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '3px 10px', borderRadius: 5,
              background: user.active ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
              border: `1px solid ${user.active ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)'}`,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: user.active ? '#34d399' : '#f87171', boxShadow: `0 0 5px ${user.active ? '#34d39988' : '#f8717188'}` }} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: user.active ? '#34d399' : '#f87171' }}>
                {user.active ? 'Ativo' : 'Inativo'}
              </span>
            </span>
          </div>

          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#3d5068', marginTop: 6 }}>
            {user.email}
          </p>

          {/* Info grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px 24px', marginTop: 20 }}>
            <InfoRow label="DEPARTAMENTO" value={user.department?.name ?? '—'} />
            <InfoRow label="ENTRADA" value={fmt(user.entryDate)} />
            {user.exitDate && <InfoRow label="SAÍDA" value={fmt(user.exitDate)} />}
            {user.birthday && <InfoRow label="ANIVERSÁRIO" value={fmt(user.birthday)} />}
            {user.phone && <InfoRow label="TELEFONE" value={user.phone} />}
            {user.windowsUser && (
              <InfoRow label="USUÁRIO WINDOWS" value={
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{user.windowsUser}</span>
              } />
            )}
            {user.domainAccount && (
              <InfoRow label="DOMÍNIO (AD)" value={
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{user.domainAccount}</span>
              } />
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
          {[
            { value: deployedAssets.length, label: 'Equipamentos', color: '#34d399' },
            { value: user.ticketsAsRequester.length, label: 'Chamados', color: '#38bdf8' },
            { value: user.systemAccesses.filter(a => a.status === 'OK').length, label: 'Acessos OK', color: '#00d9b8' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 10, padding: '14px 18px', textAlign: 'center',
            }}>
              <p style={{ fontSize: 28, fontWeight: 700, color: s.color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                {s.value}
              </p>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#3d5068', marginTop: 4, letterSpacing: '0.05em' }}>
                {s.label.toUpperCase()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main content — 2 columns ─────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'start' }}>

        {/* LEFT — Acessos + Equipamentos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Acessos aos sistemas */}
          <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '20px 24px' }}>
            <SystemAccessGrid
              userId={user.id}
              accesses={user.systemAccesses.map(a => ({ system: a.system, status: a.status, notes: a.notes }))}
              canEdit={canEdit}
            />
          </div>

          {/* Equipamentos */}
          <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', letterSpacing: '0.1em', fontWeight: 700 }}>
                EQUIPAMENTOS ALOCADOS
              </span>
              <Link
                href={`/assets?userId=${user.id}`}
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#00d9b8', textDecoration: 'none', letterSpacing: '0.05em' }}
              >
                VER TODOS →
              </Link>
            </div>

            {user.assignedAssets.length === 0 ? (
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#1e3048', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
                Nenhum equipamento alocado
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {user.assignedAssets.map((asset, i) => {
                  const st = assetStatusConfig[asset.status]
                  return (
                    <Link
                      key={asset.id}
                      href={`/assets/${asset.id}`}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 12px', borderRadius: 8,
                        background: i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                        border: '1px solid rgba(255,255,255,0.04)',
                        textDecoration: 'none', transition: 'background 0.1s',
                      }}
                      className="hover-row"
                    >
                      <div style={{
                        width: 28, height: 28, borderRadius: 6,
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <CategoryIcon name={asset.category.icon} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#c8d6e5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {asset.name}
                        </p>
                        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#3d5068', marginTop: 1 }}>
                          {asset.tag}{asset.serialNumber ? ` · S/N: ${asset.serialNumber}` : ''}
                        </p>
                      </div>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: st.color, flexShrink: 0 }}>
                        {st.label}
                      </span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Histórico de chamados */}
        <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', letterSpacing: '0.1em', fontWeight: 700 }}>
              HISTÓRICO DE CHAMADOS
            </span>
            <Link
              href={`/tickets?requesterId=${user.id}`}
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#00d9b8', textDecoration: 'none', letterSpacing: '0.05em' }}
            >
              VER TODOS →
            </Link>
          </div>

          {user.ticketsAsRequester.length === 0 ? (
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#1e3048', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
              Nenhum chamado aberto
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {user.ticketsAsRequester.map(ticket => {
                const st = statusConfig[ticket.status] ?? statusConfig.OPEN
                return (
                  <Link
                    key={ticket.id}
                    href={`/tickets/${ticket.id}`}
                    style={{
                      display: 'flex', flexDirection: 'column', gap: 4,
                      padding: '10px 12px', borderRadius: 8,
                      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                      textDecoration: 'none', transition: 'background 0.1s',
                    }}
                    className="hover-row"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#3d5068', flexShrink: 0 }}>
                        {ticket.code}
                      </span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: st.color, flexShrink: 0 }}>
                        {st.label}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: '#c8d6e5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
                      {ticket.title}
                    </p>
                    <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060' }}>
                      {ticket.category.name} · {fmt(ticket.createdAt)}
                    </p>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
