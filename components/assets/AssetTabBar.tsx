'use client'

import Link from 'next/link'
import { LayoutGrid, ArrowLeftRight, StickyNote, Paperclip } from 'lucide-react'

const TABS = [
  { key: 'geral',      label: 'Geral',      Icon: LayoutGrid     },
  { key: 'historico',  label: 'Histórico',  Icon: ArrowLeftRight },
  { key: 'notas',      label: 'Notas',      Icon: StickyNote     },
  { key: 'arquivos',   label: 'Arquivos',   Icon: Paperclip      },
] as const

type TabKey = typeof TABS[number]['key']

interface Props {
  assetId: string
  activeTab: TabKey
  counts?: { notas?: number; arquivos?: number }
}

export default function AssetTabBar({ assetId, activeTab, counts = {} }: Props) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4,
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      marginBottom: 20,
    }}>
      {TABS.map(({ key, label, Icon }) => {
        const isActive = key === activeTab
        const count = key === 'notas' ? counts.notas : key === 'arquivos' ? counts.arquivos : undefined

        return (
          <Link
            key={key}
            href={`/assets/${assetId}?tab=${key}`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '11px 16px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
              textDecoration: 'none', whiteSpace: 'nowrap',
              borderBottom: isActive ? '2px solid #00d9b8' : '2px solid transparent',
              color: isActive ? '#00d9b8' : '#3d5068',
              transition: 'color 0.12s, border-color 0.12s',
              marginBottom: -1,
            }}
          >
            <Icon size={13} />
            {label}
            {count !== undefined && count > 0 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                minWidth: 17, height: 17, borderRadius: 10,
                background: isActive ? 'rgba(0,217,184,0.15)' : 'rgba(255,255,255,0.07)',
                border: `1px solid ${isActive ? 'rgba(0,217,184,0.3)' : 'rgba(255,255,255,0.1)'}`,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9, fontWeight: 700,
                color: isActive ? '#00d9b8' : '#4a6080',
                padding: '0 4px',
              }}>
                {count}
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )
}
