import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'
import GearAnimation from '@/components/settings/GearAnimation'

// Count helpers
async function getCounts() {
  const [users, departments, ticketCategories, assetCategories, hardwareParts] = await Promise.all([
    prisma.user.count({ where: { active: true } }),
    prisma.department.count({ where: { active: true } }),
    prisma.ticketCategory.count({ where: { parentId: null } }),
    prisma.assetCategory.count(),
    prisma.hardwarePart.count(),
  ])
  const [equipment, accessories, disposables] = await Promise.all([
    prisma.assetCategory.count({ where: { kind: 'EQUIPMENT' } }),
    prisma.assetCategory.count({ where: { kind: 'ACCESSORY' } }),
    prisma.assetCategory.count({ where: { kind: 'DISPOSABLE' } }),
  ])
  return { users, departments, ticketCategories, assetCategories, hardwareParts, equipment, accessories, disposables }
}

interface CardDef {
  href: string
  icon: React.ReactNode
  title: string
  description: string
  count?: number
  accent: string
  subItems?: string[]
}

function SettingsCard({ href, icon, title, description, count, accent, subItems }: CardDef) {
  return (
    <Link
      href={href}
      style={{
        display: 'flex', flexDirection: 'column', gap: 16,
        padding: '28px 26px',
        background: '#0d1422',
        border: `1px solid rgba(255,255,255,0.07)`,
        borderRadius: 14,
        textDecoration: 'none',
        transition: 'border-color 0.15s, background 0.15s',
        position: 'relative', overflow: 'hidden',
      }}
      className="settings-card"
    >
      {/* Accent top line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: accent, borderRadius: '14px 14px 0 0', opacity: 0.6 }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 11, flexShrink: 0,
          background: `${accent}14`, border: `1px solid ${accent}28`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {icon}
        </div>
        {count !== undefined && (
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700,
            color: accent, background: `${accent}12`, border: `1px solid ${accent}28`,
            borderRadius: 6, padding: '3px 9px', flexShrink: 0,
          }}>{count}</span>
        )}
      </div>

      <div>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#c8d6e5', marginBottom: 5 }}>{title}</p>
        <p style={{ fontSize: 12, color: '#3d5068', lineHeight: 1.5 }}>{description}</p>
      </div>

      {/* Sub-item chips */}
      {subItems && subItems.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: -4 }}>
          {subItems.map(item => (
            <span key={item} style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600,
              color: `${accent}cc`, background: `${accent}0a`, border: `1px solid ${accent}1a`,
              borderRadius: 4, padding: '2px 7px', letterSpacing: '0.04em',
            }}>{item}</span>
          ))}
        </div>
      )}

      {/* Arrow */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto' }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: accent, opacity: 0.6 }}>
          <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </Link>
  )
}

export default async function SettingsPage() {
  const counts = await getCounts()

  const cards: CardDef[] = [
    {
      href: '/settings/usuarios',
      accent: '#38bdf8',
      title: 'Usuários',
      description: 'Cadastro, permissões e departamentos dos colaboradores.',
      count: counts.users,
      subItems: ['Cadastro', 'Permissões', 'Departamento'],
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      href: '/settings/departamentos',
      accent: '#818cf8',
      title: 'Departamentos',
      description: 'Estrutura de departamentos e pontuação por setor.',
      count: counts.departments,
      subItems: ['Estrutura', 'Pontuação'],
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
    },
    {
      href: '/settings/chamados',
      accent: '#f59e0b',
      title: 'Chamados',
      description: 'Políticas de SLA, pontuação por categoria e prioridade.',
      count: counts.ticketCategories,
      subItems: ['Políticas SLA', 'Prioridade', 'Pontuação'],
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      href: '/settings/categorias',
      accent: '#34d399',
      title: 'Categorias de Chamados',
      description: 'Árvore de categorias e subcategorias para tickets.',
      count: counts.ticketCategories,
      subItems: ['Categorias', 'Subcategorias'],
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" />
        </svg>
      ),
    },
    {
      href: '/settings/patrimonio',
      accent: '#38bdf8',
      title: 'Patrimônio',
      description: 'Categorias de equipamentos, locais, campos e modelos.',
      count: counts.equipment,
      subItems: ['Categorias', 'Locais', 'Campos', 'Modelos'],
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path d="M8 21h8m-4-4v4" />
        </svg>
      ),
    },
    {
      href: '/settings/acessorios',
      accent: '#a78bfa',
      title: 'Acessórios',
      description: 'Categorias de periféricos: mouses, teclados, headsets, etc.',
      count: counts.accessories,
      subItems: ['Categorias', 'Estoque', 'Mínimo'],
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="4" width="12" height="16" rx="2" />
          <path d="M10 8h4M10 12h4M10 16h4" />
        </svg>
      ),
    },
    {
      href: '/settings/descartaveis',
      accent: '#fb923c',
      title: 'Consumíveis',
      description: 'Itens de uso único: fones descartáveis, cabos avulsos, etc.',
      count: counts.disposables,
      subItems: ['Categorias', 'Estoque', 'Mínimo'],
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 10H4l3-7h10l3 7h-5" />
          <path d="M12 10v11" />
          <path d="M9 10l3 3 3-3" />
        </svg>
      ),
    },
    {
      href: '/settings/hardware',
      accent: '#00d9b8',
      title: 'Hardware',
      description: 'Peças de computador e geração de CPU para pontuação automática.',
      count: counts.hardwareParts,
      subItems: ['Peças CPU', 'Gerações', 'Pontuação'],
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00d9b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <rect x="9" y="9" width="6" height="6" />
          <path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2" />
        </svg>
      ),
    },
  ]

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2d4060', letterSpacing: '0.1em' }}>SISTEMA</span>
            <span style={{ color: '#1e3048', fontSize: 10 }}>/</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#00d9b8', letterSpacing: '0.1em' }}>CONFIGURAÇÕES</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <GearAnimation />
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#e2eaf4', letterSpacing: '-0.01em', lineHeight: 1 }}>
              Configurações
            </h1>
          </div>
          <p style={{ fontSize: 13, color: '#3d5068', marginTop: 8 }}>
            Gerenciamento do sistema — acesso restrito a administradores
          </p>
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '5px 12px', borderRadius: 6,
          background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
          fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: '#f87171',
        }}>
          Admin TI
        </span>
      </div>

      {/* Card grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 20,
      }}>
        {cards.map(card => (
          <SettingsCard key={card.href} {...card} />
        ))}
      </div>

      <style>{`
        .settings-card:hover {
          border-color: rgba(255,255,255,0.14) !important;
          background: #111b2a !important;
        }
      `}</style>
    </div>
  )
}
