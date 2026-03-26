import { prisma } from '@/lib/db/prisma'
import Link from 'next/link'
import SettingsSubHeader from '@/components/settings/SettingsSubHeader'
import { getAssetLocations, getAssetCustomFieldDefs, getAssetModels } from '@/app/(app)/settings/actions'

export default async function PatrimonioPage() {
  const [catCount, locCount, fieldCount, modelCount] = await Promise.all([
    prisma.assetCategory.count({ where: { kind: 'EQUIPMENT' } }),
    getAssetLocations().then(l => l.length),
    getAssetCustomFieldDefs().then(f => f.length),
    getAssetModels().then(m => m.length),
  ])

  const sections = [
    {
      href: '/settings/patrimonio/categorias',
      accent: '#00d9b8',
      title: 'Categorias de Ativo',
      description: 'Tipos de equipamentos cadastrados no patrimônio.',
      count: catCount,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00d9b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" />
        </svg>
      ),
    },
    {
      href: '/settings/patrimonio/locais',
      accent: '#38bdf8',
      title: 'Locais',
      description: 'Locais físicos onde os ativos são instalados.',
      count: locCount,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      ),
    },
    {
      href: '/settings/patrimonio/campos',
      accent: '#a78bfa',
      title: 'Campos Personalizados',
      description: 'Campos adicionais por categoria de ativo.',
      count: fieldCount,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      ),
    },
    {
      href: '/settings/patrimonio/modelos',
      accent: '#fbbf24',
      title: 'Modelos de Equipamento',
      description: 'Modelos predefinidos com imagem e fabricante.',
      count: modelCount,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path d="M8 21h8m-4-4v4" />
        </svg>
      ),
    },
  ]

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 28 }}>
      <SettingsSubHeader
        title="Patrimônio"
        description="Gerencie categorias de equipamentos, locais, campos e modelos."
        accent="#38bdf8"
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {sections.map(s => (
          <Link
            key={s.href}
            href={s.href}
            style={{
              display: 'flex', flexDirection: 'column', gap: 14,
              padding: '24px 22px',
              background: '#0d1422',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14,
              textDecoration: 'none',
              transition: 'border-color 0.15s, background 0.15s',
              position: 'relative', overflow: 'hidden',
            }}
            className="settings-card"
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: s.accent, borderRadius: '14px 14px 0 0', opacity: 0.6 }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ width: 44, height: 44, borderRadius: 11, flexShrink: 0, background: `${s.accent}14`, border: `1px solid ${s.accent}28`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {s.icon}
              </div>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: s.accent, background: `${s.accent}12`, border: `1px solid ${s.accent}28`, borderRadius: 6, padding: '3px 9px', flexShrink: 0 }}>{s.count}</span>
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#c8d6e5', marginBottom: 5 }}>{s.title}</p>
              <p style={{ fontSize: 12, color: '#3d5068', lineHeight: 1.5 }}>{s.description}</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: s.accent, opacity: 0.6 }}>
                <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      <style>{`.settings-card:hover { border-color: rgba(255,255,255,0.14) !important; background: #111b2a !important; }`}</style>
    </div>
  )
}
