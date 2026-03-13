'use client'

import { useState, useTransition } from 'react'
import { createDepartment, toggleDepartmentActive } from '@/app/(app)/settings/actions'

interface Department {
  id: string
  name: string
  code: string | null
  active: boolean
  _count: { users: number }
}

interface Props { departments: Department[] }

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#c8d6e5',
  outline: 'none', width: '100%', boxSizing: 'border-box',
}

export default function DepartmentsTab({ departments }: Props) {
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const result = await createDepartment(name, code)
      if (result.ok) { setName(''); setCode(''); setSuccess(true); setTimeout(() => setSuccess(false), 3000) }
      else setError(result.error ?? 'Erro desconhecido')
    })
  }

  function handleToggle(deptId: string) {
    startTransition(() => toggleDepartmentActive(deptId))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Add form */}
      <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '18px 20px' }}>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: '#3d5068', letterSpacing: '0.1em', marginBottom: 14 }}>NOVO DEPARTAMENTO</p>
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: '2 1 180px' }}>
            <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', fontWeight: 700, letterSpacing: '0.08em' }}>NOME *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Recursos Humanos" style={inputStyle} required />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: '1 1 100px' }}>
            <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#2d4060', fontWeight: 700, letterSpacing: '0.08em' }}>CÓDIGO</label>
            <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="Ex: RH" maxLength={10} style={inputStyle} />
          </div>
          <button type="submit" disabled={isPending || !name.trim()} style={{
            padding: '9px 20px', borderRadius: 8, height: 38,
            background: 'rgba(0,217,184,0.12)', border: '1px solid rgba(0,217,184,0.3)',
            color: '#00d9b8', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap',
            opacity: !name.trim() ? 0.4 : 1,
          }}>
            + Adicionar
          </button>
        </form>
        {error && <p style={{ fontSize: 12, color: '#f87171', marginTop: 8 }}>⚠ {error}</p>}
        {success && <p style={{ fontSize: 12, color: '#34d399', marginTop: 8 }}>✓ Departamento criado com sucesso</p>}
      </div>

      {/* List */}
      <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 90px', columnGap: 10, padding: '0 16px', height: 36, alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
          {['NOME', 'CÓDIGO', 'USUÁRIOS', 'STATUS', ''].map((h, i) => (
            <div key={i} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: '#2d4060', letterSpacing: '0.08em' }}>{h}</div>
          ))}
        </div>
        {departments.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#2d4060' }}>Nenhum departamento cadastrado</div>
        ) : departments.map((d, i) => (
          <div key={d.id} style={{
            display: 'grid', gridTemplateColumns: '1fr 80px 80px 80px 90px',
            columnGap: 10, padding: '12px 16px', alignItems: 'center',
            borderBottom: i < departments.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            opacity: d.active ? 1 : 0.5,
          }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#c8d6e5' }}>{d.name}</p>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#4a6580' }}>{d.code ?? '—'}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#38bdf8' }}>{d._count.users}</span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700,
              color: d.active ? '#34d399' : '#f87171',
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
              {d.active ? 'Ativo' : 'Inativo'}
            </span>
            <button onClick={() => handleToggle(d.id)} disabled={isPending} style={{
              padding: '4px 10px', borderRadius: 6, fontSize: 10, cursor: 'pointer',
              background: d.active ? 'rgba(248,113,113,0.08)' : 'rgba(52,211,153,0.08)',
              border: `1px solid ${d.active ? 'rgba(248,113,113,0.2)' : 'rgba(52,211,153,0.2)'}`,
              color: d.active ? '#f87171' : '#34d399',
              fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, transition: 'all 0.1s',
            }}>
              {d.active ? 'Desativar' : 'Ativar'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
