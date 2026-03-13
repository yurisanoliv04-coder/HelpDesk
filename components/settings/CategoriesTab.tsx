'use client'

import { useState, useTransition } from 'react'
import {
  createTicketCategory, toggleTicketCategoryActive,
  createAssetCategory, toggleAssetCategoryActive,
} from '@/app/(app)/settings/actions'

interface TicketCategory {
  id: string; name: string; description: string | null
  active: boolean; _count: { tickets: number }
}
interface AssetCategory {
  id: string; name: string; icon: string | null
  active: boolean; _count: { assets: number }
}
interface Props { ticketCategories: TicketCategory[]; assetCategories: AssetCategory[] }

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#c8d6e5',
  outline: 'none', width: '100%', boxSizing: 'border-box',
}

const ICON_OPTIONS = ['laptop', 'monitor', 'printer', 'keyboard', 'mouse-pointer', 'headphones', 'battery', 'network', 'smartphone', 'package', 'cpu', 'hard-drive', 'server', 'tablet', 'camera']

export default function CategoriesTab({ ticketCategories, assetCategories }: Props) {
  const [sub, setSub] = useState<'chamados' | 'ativos'>('chamados')
  const [isPending, startTransition] = useTransition()

  // Ticket form
  const [tName, setTName] = useState('')
  const [tDesc, setTDesc] = useState('')
  const [tError, setTError] = useState<string | null>(null)
  const [tSuccess, setTSuccess] = useState(false)

  // Asset form
  const [aName, setAName] = useState('')
  const [aIcon, setAIcon] = useState('')
  const [aError, setAError] = useState<string | null>(null)
  const [aSuccess, setASuccess] = useState(false)

  function handleCreateTicket(e: React.FormEvent) {
    e.preventDefault(); setTError(null); setTSuccess(false)
    startTransition(async () => {
      const r = await createTicketCategory(tName, tDesc)
      if (r.ok) { setTName(''); setTDesc(''); setTSuccess(true); setTimeout(() => setTSuccess(false), 3000) }
      else setTError(r.error ?? 'Erro')
    })
  }
  function handleCreateAsset(e: React.FormEvent) {
    e.preventDefault(); setAError(null); setASuccess(false)
    startTransition(async () => {
      const r = await createAssetCategory(aName, aIcon)
      if (r.ok) { setAName(''); setAIcon(''); setASuccess(true); setTimeout(() => setASuccess(false), 3000) }
      else setAError(r.error ?? 'Erro')
    })
  }

  const subTabStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 16px', borderRadius: 7, fontSize: 12, fontWeight: active ? 700 : 500, cursor: 'pointer',
    background: active ? 'rgba(0,217,184,0.12)' : 'transparent',
    border: `1px solid ${active ? 'rgba(0,217,184,0.3)' : 'rgba(255,255,255,0.07)'}`,
    color: active ? '#00d9b8' : '#3d5068', fontFamily: "'JetBrains Mono', monospace",
    transition: 'all 0.1s',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Sub-tab switcher */}
      <div style={{ display: 'flex', gap: 6 }}>
        <button style={subTabStyle(sub === 'chamados')} onClick={() => setSub('chamados')}>Chamados</button>
        <button style={subTabStyle(sub === 'ativos')} onClick={() => setSub('ativos')}>Ativos / Patrimônio</button>
      </div>

      {/* ── CHAMADOS ── */}
      {sub === 'chamados' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '18px 20px' }}>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: '#3d5068', letterSpacing: '0.1em', marginBottom: 14 }}>NOVA CATEGORIA DE CHAMADO</p>
            <form onSubmit={handleCreateTicket} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', fontWeight: 700, letterSpacing: '0.08em' }}>NOME *</label>
                <input value={tName} onChange={e => setTName(e.target.value)} placeholder="Ex: Suporte de Hardware" style={inputStyle} required />
              </div>
              <div style={{ flex: '2 1 240px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', fontWeight: 700, letterSpacing: '0.08em' }}>DESCRIÇÃO</label>
                <input value={tDesc} onChange={e => setTDesc(e.target.value)} placeholder="Breve descrição da categoria" style={inputStyle} />
              </div>
              <button type="submit" disabled={isPending || !tName.trim()} style={{ padding: '9px 20px', borderRadius: 8, height: 38, background: 'rgba(0,217,184,0.12)', border: '1px solid rgba(0,217,184,0.3)', color: '#00d9b8', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap', opacity: !tName.trim() ? 0.4 : 1 }}>
                + Adicionar
              </button>
            </form>
            {tError && <p style={{ fontSize: 12, color: '#f87171', marginTop: 8 }}>⚠ {tError}</p>}
            {tSuccess && <p style={{ fontSize: 12, color: '#34d399', marginTop: 8 }}>✓ Categoria criada com sucesso</p>}
          </div>

          <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 80px 90px', columnGap: 10, padding: '0 16px', height: 36, alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
              {['NOME', 'DESCRIÇÃO', 'CHAMADOS', 'STATUS', ''].map((h, i) => (
                <div key={i} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: '#2d4060', letterSpacing: '0.08em' }}>{h}</div>
              ))}
            </div>
            {ticketCategories.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#2d4060' }}>Nenhuma categoria cadastrada</div>
            ) : ticketCategories.map((c, i) => (
              <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 80px 90px', columnGap: 10, padding: '11px 16px', alignItems: 'center', borderBottom: i < ticketCategories.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', opacity: c.active ? 1 : 0.5 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#c8d6e5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</p>
                <p style={{ fontSize: 12, color: '#3d5068', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.description ?? '—'}</p>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#38bdf8' }}>{c._count.tickets}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: c.active ? '#34d399' : '#f87171', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />{c.active ? 'Ativa' : 'Inativa'}
                </span>
                <button onClick={() => startTransition(() => toggleTicketCategoryActive(c.id))} disabled={isPending} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 10, cursor: 'pointer', background: c.active ? 'rgba(248,113,113,0.08)' : 'rgba(52,211,153,0.08)', border: `1px solid ${c.active ? 'rgba(248,113,113,0.2)' : 'rgba(52,211,153,0.2)'}`, color: c.active ? '#f87171' : '#34d399', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
                  {c.active ? 'Desativar' : 'Ativar'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ATIVOS ── */}
      {sub === 'ativos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '18px 20px' }}>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: '#3d5068', letterSpacing: '0.1em', marginBottom: 14 }}>NOVA CATEGORIA DE ATIVO</p>
            <form onSubmit={handleCreateAsset} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: '2 1 180px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', fontWeight: 700, letterSpacing: '0.08em' }}>NOME *</label>
                <input value={aName} onChange={e => setAName(e.target.value)} placeholder="Ex: Impressora" style={inputStyle} required />
              </div>
              <div style={{ flex: '1 1 140px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', fontWeight: 700, letterSpacing: '0.08em' }}>ÍCONE</label>
                <select value={aIcon} onChange={e => setAIcon(e.target.value)} style={{ ...inputStyle, padding: '8px 10px' }}>
                  <option value="">— nenhum —</option>
                  {ICON_OPTIONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                </select>
              </div>
              <button type="submit" disabled={isPending || !aName.trim()} style={{ padding: '9px 20px', borderRadius: 8, height: 38, background: 'rgba(0,217,184,0.12)', border: '1px solid rgba(0,217,184,0.3)', color: '#00d9b8', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap', opacity: !aName.trim() ? 0.4 : 1 }}>
                + Adicionar
              </button>
            </form>
            {aError && <p style={{ fontSize: 12, color: '#f87171', marginTop: 8 }}>⚠ {aError}</p>}
            {aSuccess && <p style={{ fontSize: 12, color: '#34d399', marginTop: 8 }}>✓ Categoria criada com sucesso</p>}
          </div>

          <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 80px 80px 90px', columnGap: 10, padding: '0 16px', height: 36, alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
              {['NOME', 'ÍCONE', 'ATIVOS', 'STATUS', ''].map((h, i) => (
                <div key={i} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: '#2d4060', letterSpacing: '0.08em' }}>{h}</div>
              ))}
            </div>
            {assetCategories.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#2d4060' }}>Nenhuma categoria cadastrada</div>
            ) : assetCategories.map((c, i) => (
              <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 80px 80px 90px', columnGap: 10, padding: '11px 16px', alignItems: 'center', borderBottom: i < assetCategories.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', opacity: c.active ? 1 : 0.5 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#c8d6e5' }}>{c.name}</p>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#4a6580' }}>{c.icon ?? '—'}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#38bdf8' }}>{c._count.assets}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: c.active ? '#34d399' : '#f87171', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />{c.active ? 'Ativa' : 'Inativa'}
                </span>
                <button onClick={() => startTransition(() => toggleAssetCategoryActive(c.id))} disabled={isPending} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 10, cursor: 'pointer', background: c.active ? 'rgba(248,113,113,0.08)' : 'rgba(52,211,153,0.08)', border: `1px solid ${c.active ? 'rgba(248,113,113,0.2)' : 'rgba(52,211,153,0.2)'}`, color: c.active ? '#f87171' : '#34d399', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
                  {c.active ? 'Desativar' : 'Ativar'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
