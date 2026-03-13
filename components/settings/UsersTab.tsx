'use client'

import { useState, useTransition } from 'react'
import { UserRole } from '@prisma/client'
import { toggleUserActive, updateUserRole, updateUserDepartment } from '@/app/(app)/settings/actions'

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

export default function UsersTab({ users, departments, currentUserId }: Props) {
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [filterActive, setFilterActive] = useState<string>('all')

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
        <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 180px 180px 100px 80px', columnGap: 10, padding: '0 16px', height: 36, alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
          <div />
          {['NOME / E-MAIL', 'PERFIL', 'DEPARTAMENTO', 'STATUS', ''].map((h, i) => (
            <div key={i} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, color: '#2d4060', letterSpacing: '0.08em' }}>{h}</div>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#2d4060' }}>
            Nenhum usuário encontrado
          </div>
        ) : filtered.map((u, i) => {
          const rc = roleCfg(u.role)
          const isSelf = u.id === currentUserId
          return (
            <div
              key={u.id}
              style={{
                display: 'grid', gridTemplateColumns: '36px 1fr 180px 180px 100px 80px',
                columnGap: 10, padding: '10px 16px', alignItems: 'center',
                borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                opacity: u.active ? 1 : 0.5, transition: 'opacity 0.15s',
              }}
            >
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

              {/* Toggle */}
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
          )
        })}
      </div>
    </div>
  )
}
