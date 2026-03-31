'use client'

import { useState, useTransition } from 'react'
import { UserRole } from '@prisma/client'
import { toggleUserActive, updateUserRole, updateUserDepartment, changeUserPassword } from '@/app/(app)/settings/actions'

interface Department { id: string; name: string }
interface User {
  id: string
  name: string
  email: string
  role: UserRole
  active: boolean
  department: Department | null
}

interface Props {
  users: User[]
  departments: Department[]
  currentUserId: string
}

const ROLE_OPTIONS: { value: UserRole; label: string; color: string; bg: string }[] = [
  { value: 'COLABORADOR', label: 'Colaborador',  color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
  { value: 'AUXILIAR_TI', label: 'Auxiliar TI',  color: '#818cf8', bg: 'rgba(129,140,248,0.1)' },
  { value: 'TECNICO',     label: 'Técnico TI',   color: '#00d9b8', bg: 'rgba(0,217,184,0.1)'   },
  { value: 'ADMIN',       label: 'Admin TI',     color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
]

function roleCfg(role: UserRole) {
  return ROLE_OPTIONS.find(r => r.value === role) ?? ROLE_OPTIONS[0]
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

const sel: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 6, padding: '4px 8px', fontSize: 12, color: '#c8d6e5',
  cursor: 'pointer', outline: 'none',
}

const inp: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 7, padding: '8px 12px', fontSize: 13, color: '#c8d6e5',
  outline: 'none', boxSizing: 'border-box', width: '100%',
}

// ── Password row ─────────────────────────────────────────────────────────────
function PasswordRow({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [pw, setPw]         = useState('')
  const [pw2, setPw2]       = useState('')
  const [show, setShow]     = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [pending, start]    = useTransition()

  function handleSave() {
    setError(null)
    if (pw.length < 6)           { setError('A senha deve ter pelo menos 6 caracteres'); return }
    if (pw !== pw2)              { setError('As senhas não coincidem'); return }
    start(async () => {
      const r = await changeUserPassword(userId, pw)
      if (r.ok) {
        setSuccess(true)
        setPw(''); setPw2('')
        setTimeout(() => { setSuccess(false); onClose() }, 1500)
      } else {
        setError(r.error ?? 'Erro ao salvar')
      }
    })
  }

  const strength = pw.length === 0 ? 0 : pw.length < 6 ? 1 : pw.length < 10 ? 2 : 3
  const strengthColor = ['transparent', '#f87171', '#fbbf24', '#34d399'][strength]
  const strengthLabel = ['', 'Fraca', 'Média', 'Forte'][strength]

  return (
    <div style={{
      gridColumn: '1 / -1',
      background: 'rgba(56,189,248,0.04)',
      border: '1px solid rgba(56,189,248,0.15)',
      borderRadius: 10,
      padding: '14px 16px',
      marginTop: 4,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: '#38bdf8', letterSpacing: '0.1em' }}>
          🔑 TROCAR SENHA
        </span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2d4060', padding: 2, lineHeight: 0 }}
          onMouseEnter={e => (e.currentTarget.style.color = '#7e9bb5')}
          onMouseLeave={e => (e.currentTarget.style.color = '#2d4060')}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        {/* Nova senha */}
        <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#3d5068', fontWeight: 700 }}>NOVA SENHA</label>
          <div style={{ position: 'relative' }}>
            <input
              type={show ? 'text' : 'password'}
              value={pw}
              onChange={e => setPw(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              style={{ ...inp, paddingRight: 36 }}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShow(s => !s)}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#3d5068', lineHeight: 0, padding: 0 }}
              onMouseEnter={e => (e.currentTarget.style.color = '#7e9bb5')}
              onMouseLeave={e => (e.currentTarget.style.color = '#3d5068')}
              title={show ? 'Ocultar' : 'Mostrar'}
            >
              {show
                ? <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                : <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              }
            </button>
          </div>
          {/* Strength bar */}
          {pw.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
              <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(strength / 3) * 100}%`, background: strengthColor, transition: 'width 0.2s, background 0.2s', borderRadius: 2 }} />
              </div>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: strengthColor, width: 36, textAlign: 'right' }}>{strengthLabel}</span>
            </div>
          )}
        </div>

        {/* Confirmar */}
        <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#3d5068', fontWeight: 700 }}>CONFIRMAR SENHA</label>
          <div style={{ position: 'relative' }}>
            <input
              type={show ? 'text' : 'password'}
              value={pw2}
              onChange={e => setPw2(e.target.value)}
              placeholder="Repita a senha"
              style={{
                ...inp,
                borderColor: pw2 && pw !== pw2 ? 'rgba(248,113,113,0.4)' : pw2 && pw === pw2 ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.1)',
              }}
              autoComplete="new-password"
            />
            {pw2 && (
              <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13 }}>
                {pw === pw2 ? '✓' : '✗'}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', paddingBottom: 1 }}>
          <button
            onClick={handleSave}
            disabled={pending || !pw || !pw2}
            style={{
              padding: '8px 20px', borderRadius: 7, fontSize: 12, fontWeight: 700,
              cursor: pending || !pw || !pw2 ? 'not-allowed' : 'pointer',
              background: success ? 'rgba(52,211,153,0.15)' : 'rgba(56,189,248,0.12)',
              border: `1px solid ${success ? 'rgba(52,211,153,0.4)' : 'rgba(56,189,248,0.3)'}`,
              color: success ? '#34d399' : '#38bdf8',
              fontFamily: "'JetBrains Mono', monospace",
              opacity: !pw || !pw2 ? 0.4 : 1,
              transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}
          >
            {success ? '✓ Salvo!' : pending ? 'Salvando…' : 'Salvar senha'}
          </button>
        </div>
      </div>

      {error && (
        <p style={{ fontSize: 12, color: '#f87171', fontFamily: "'JetBrains Mono', monospace" }}>⚠ {error}</p>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function UsersTab({ users, departments, currentUserId }: Props) {
  const [isPending, startTransition] = useTransition()
  const [search, setSearch]           = useState('')
  const [filterRole, setFilterRole]   = useState<string>('all')
  const [filterActive, setFilterActive] = useState<string>('all')
  const [pwOpenId, setPwOpenId]       = useState<string | null>(null)

  const filtered = users.filter(u => {
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false
    if (filterRole !== 'all' && u.role !== filterRole) return false
    if (filterActive === 'active' && !u.active) return false
    if (filterActive === 'inactive' && u.active) return false
    return true
  })

  function handleToggleActive(userId: string) {
    startTransition(() => toggleUserActive(userId))
  }

  function handleRoleChange(userId: string, role: string) {
    startTransition(() => updateUserRole(userId, role as UserRole))
  }

  function handleDeptChange(userId: string, deptId: string) {
    startTransition(() => updateUserDepartment(userId, deptId || null))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome ou e-mail..."
          style={{ ...sel, padding: '7px 12px', minWidth: 200, flex: '1 1 200px', fontSize: 13 }}
        />
        <select style={sel} value={filterRole} onChange={e => setFilterRole(e.target.value)}>
          <option value="all">Todos os perfis</option>
          {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <select style={sel} value={filterActive} onChange={e => setFilterActive(e.target.value)}>
          <option value="all">Ativos e inativos</option>
          <option value="active">Somente ativos</option>
          <option value="inactive">Somente inativos</option>
        </select>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#2d4060', marginLeft: 4 }}>
          {filtered.length} usuário{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div style={{ background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 180px 180px 100px 32px 80px', columnGap: 10, padding: '0 16px', height: 36, alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
          <div />
          {['NOME / E-MAIL', 'PERFIL', 'DEPARTAMENTO', 'STATUS', '', ''].map((h, i) => (
            <div key={i} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: '#2d4060', letterSpacing: '0.08em' }}>{h}</div>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#2d4060' }}>
            Nenhum usuário encontrado
          </div>
        ) : filtered.map((u, i) => {
          const rc     = roleCfg(u.role)
          const isSelf = u.id === currentUserId
          const pwOpen = pwOpenId === u.id
          return (
            <div
              key={u.id}
              style={{
                borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                transition: 'background 0.1s',
                background: pwOpen ? 'rgba(56,189,248,0.02)' : 'transparent',
              }}
            >
              {/* Main row */}
              <div style={{
                display: 'grid', gridTemplateColumns: '36px 1fr 180px 180px 100px 32px 80px',
                columnGap: 10, padding: '10px 16px', alignItems: 'center',
                opacity: u.active ? 1 : 0.5,
              }}>
                {/* Avatar */}
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${rc.bg}`, border: `1px solid ${rc.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: rc.color }}>{initials(u.name)}</span>
                </div>

                {/* Name + email */}
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#c8d6e5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {u.name}{isSelf && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#00d9b8', marginLeft: 6, background: 'rgba(0,217,184,0.1)', padding: '1px 5px', borderRadius: 3 }}>você</span>}
                  </p>
                  <p style={{ fontSize: 11, color: '#2d4060', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{u.email}</p>
                </div>

                {/* Role */}
                <select
                  value={u.role}
                  disabled={isPending || isSelf}
                  onChange={e => handleRoleChange(u.id, e.target.value)}
                  style={{ ...sel, color: rc.color, borderColor: `${rc.color}40`, fontSize: 11, fontFamily: "'JetBrains Mono', monospace", opacity: isSelf ? 0.5 : 1 }}
                >
                  {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>

                {/* Department */}
                <select
                  value={u.department?.id ?? ''}
                  disabled={isPending}
                  onChange={e => handleDeptChange(u.id, e.target.value)}
                  style={{ ...sel, fontSize: 11 }}
                >
                  <option value="">— sem departamento —</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>

                {/* Active badge */}
                <div>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '3px 8px', borderRadius: 5,
                    background: u.active ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)',
                    border: `1px solid ${u.active ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)'}`,
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700,
                    color: u.active ? '#34d399' : '#f87171',
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
                    {u.active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                {/* Password button */}
                <button
                  onClick={() => setPwOpenId(pwOpen ? null : u.id)}
                  title="Trocar senha"
                  style={{
                    width: 28, height: 28, borderRadius: 6, border: `1px solid ${pwOpen ? 'rgba(56,189,248,0.35)' : 'rgba(255,255,255,0.08)'}`,
                    background: pwOpen ? 'rgba(56,189,248,0.1)' : 'transparent',
                    color: pwOpen ? '#38bdf8' : '#3d5068',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s', flexShrink: 0,
                  }}
                  onMouseEnter={e => { if (!pwOpen) { e.currentTarget.style.color = '#7e9bb5'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)' } }}
                  onMouseLeave={e => { if (!pwOpen) { e.currentTarget.style.color = '#3d5068'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' } }}
                >
                  <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </button>

                {/* Toggle active */}
                <button
                  onClick={() => handleToggleActive(u.id)}
                  disabled={isPending || isSelf}
                  title={u.active ? 'Desativar usuário' : 'Ativar usuário'}
                  style={{
                    padding: '4px 10px', borderRadius: 6, fontSize: 11, cursor: isSelf ? 'not-allowed' : 'pointer',
                    background: u.active ? 'rgba(248,113,113,0.08)' : 'rgba(52,211,153,0.08)',
                    border: `1px solid ${u.active ? 'rgba(248,113,113,0.2)' : 'rgba(52,211,153,0.2)'}`,
                    color: u.active ? '#f87171' : '#34d399',
                    fontFamily: "'JetBrains Mono', monospace", fontWeight: 600,
                    opacity: isSelf ? 0.3 : 1, transition: 'all 0.1s',
                  }}
                >
                  {u.active ? 'Desativar' : 'Ativar'}
                </button>
              </div>

              {/* Password change row — expands inline below */}
              {pwOpen && (
                <div style={{ padding: '0 16px 14px' }}>
                  <PasswordRow userId={u.id} onClose={() => setPwOpenId(null)} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
