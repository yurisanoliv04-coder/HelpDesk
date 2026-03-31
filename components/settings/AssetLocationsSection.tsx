'use client'

import { useState, useTransition } from 'react'
import {
  createAssetLocation, deleteAssetLocation, updateAssetLocation,
} from '@/app/(app)/settings/actions'

interface Props {
  locations: string[]
  departments: { id: string; name: string }[]
}

const iStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, padding: '7px 10px', fontSize: 13, color: '#c8d6e5',
  outline: 'none', boxSizing: 'border-box',
}

export default function AssetLocationsSection({ locations, departments }: Props) {
  const [isPending, startTransition] = useTransition()

  const [locName, setLocName] = useState('')
  const [locError, setLocError] = useState<string | null>(null)
  const [locSuccess, setLocSuccess] = useState(false)
  const [confirmDeleteLoc, setConfirmDeleteLoc] = useState<string | null>(null)
  const [editLocOld, setEditLocOld] = useState<string | null>(null)
  const [editLocValue, setEditLocValue] = useState('')
  const [editLocError, setEditLocError] = useState<string | null>(null)

  function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setLocError(null); setLocSuccess(false)
    startTransition(async () => {
      const r = await createAssetLocation(locName)
      if (r.ok) { setLocName(''); setLocSuccess(true); setTimeout(() => setLocSuccess(false), 3000) }
      else setLocError(r.error ?? 'Erro')
    })
  }

  function handleDelete(name: string) {
    startTransition(async () => {
      await deleteAssetLocation(name)
      setConfirmDeleteLoc(null)
    })
  }

  function handleRename(e: React.FormEvent) {
    e.preventDefault(); setEditLocError(null)
    if (!editLocOld) return
    startTransition(async () => {
      const r = await updateAssetLocation(editLocOld, editLocValue)
      if (r.ok) setEditLocOld(null)
      else setEditLocError(r.error ?? 'Erro')
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Department locations (automatic) */}
      {departments.length > 0 && (
        <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(56,189,248,0.04)', border: '1px solid rgba(56,189,248,0.12)' }}>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: '#2d4060', letterSpacing: '0.1em', marginBottom: 10 }}>
            LOCAIS DE DEPARTAMENTO (automáticos)
          </p>
          <p style={{ fontSize: 11, color: '#5a8db0', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.5, marginBottom: 10 }}>
            ℹ Ativos atribuídos a usuários de um departamento herdam automaticamente o departamento como local.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {departments.map(d => (
              <span key={d.id} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 7,
                background: 'rgba(56,189,248,0.04)', border: '1px solid rgba(56,189,248,0.12)',
                fontSize: 11, color: '#4a7d9a', fontFamily: "'JetBrains Mono', monospace",
              }}>
                🏢 {d.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Custom locations */}
      <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '18px 22px' }}>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: '#3d5068', letterSpacing: '0.1em', marginBottom: 14 }}>
          LOCAIS PERSONALIZADOS
        </p>
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ flex: '1 1 220px', display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', fontWeight: 700 }}>NOME DO LOCAL *</label>
            <input value={locName} onChange={e => setLocName(e.target.value)} placeholder="Ex: Sala do Servidor, Andar 2..." style={iStyle} required />
          </div>
          <button type="submit" disabled={isPending || !locName.trim()} style={{
            padding: '9px 22px', borderRadius: 8, height: 38, flexShrink: 0,
            background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.25)',
            color: '#38bdf8', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            fontFamily: "'JetBrains Mono', monospace", opacity: !locName.trim() ? 0.4 : 1,
          }}>+ Adicionar</button>
        </form>
        {locError && <p style={{ fontSize: 12, color: '#f87171', marginBottom: 10 }}>⚠ {locError}</p>}
        {locSuccess && <p style={{ fontSize: 12, color: '#34d399', marginBottom: 10 }}>✓ Local adicionado</p>}

        {locations.length === 0 ? (
          <div style={{ padding: '20px 0', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#2d4060' }}>
            Nenhum local personalizado cadastrado
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {locations.map(loc => (
              <div key={loc}>
                {editLocOld === loc ? (
                  <form onSubmit={handleRename} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input value={editLocValue} onChange={e => setEditLocValue(e.target.value)} autoFocus required style={{ ...iStyle, flex: 1, padding: '5px 10px' }} />
                    <button type="submit" disabled={isPending || !editLocValue.trim()} style={{ padding: '5px 14px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', color: '#38bdf8', fontFamily: "'JetBrains Mono', monospace" }}>✓ Salvar</button>
                    <button type="button" onClick={() => setEditLocOld(null)} style={{ padding: '5px 10px', borderRadius: 7, fontSize: 11, cursor: 'pointer', background: 'none', border: '1px solid rgba(255,255,255,0.08)', color: '#3d5068' }}>✕</button>
                    {editLocError && <span style={{ fontSize: 11, color: '#f87171' }}>{editLocError}</span>}
                  </form>
                ) : (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px 5px 12px', borderRadius: 8,
                    background: confirmDeleteLoc === loc ? 'rgba(248,113,113,0.08)' : 'rgba(56,189,248,0.06)',
                    border: `1px solid ${confirmDeleteLoc === loc ? 'rgba(248,113,113,0.3)' : 'rgba(56,189,248,0.2)'}`,
                    transition: 'all 0.15s',
                  }}>
                    <span style={{ fontSize: 12, color: confirmDeleteLoc === loc ? '#f87171' : '#38bdf8', flex: 1 }}>📍 {loc}</span>
                    {confirmDeleteLoc === loc ? (
                      <>
                        <button onClick={() => handleDelete(loc)} disabled={isPending} style={{ fontSize: 10, cursor: 'pointer', background: 'none', border: 'none', color: '#f87171', padding: '0 4px', fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>✓ Excluir</button>
                        <button onClick={() => setConfirmDeleteLoc(null)} style={{ fontSize: 10, cursor: 'pointer', background: 'none', border: 'none', color: '#3d5068', padding: '0 2px' }}>✕</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { setEditLocOld(loc); setEditLocValue(loc); setEditLocError(null); setConfirmDeleteLoc(null) }} disabled={isPending} title="Renomear" style={{ width: 22, height: 22, borderRadius: 5, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.18)', color: '#38bdf8' }}>✎</button>
                        <button onClick={() => setConfirmDeleteLoc(loc)} disabled={isPending} title="Excluir" style={{ width: 22, height: 22, borderRadius: 5, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.18)', color: '#f87171' }}>✕</button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
