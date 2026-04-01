'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  getSystemIdentity, saveSystemIdentity,
  getEmailToTicketConfig, saveEmailToTicketConfig,
  getNotificationsConfig, saveNotificationsConfig,
  type SystemIdentity, type EmailToTicketConfig, type NotificationsConfig,
} from '@/app/(app)/settings/system-actions'

type Tab = 'identity' | 'email' | 'notifications'

// ── Helpers ───────────────────────────────────────────────────────────────────
const iS: React.CSSProperties = {
  width: '100%', padding: '8px 11px', borderRadius: 7, fontSize: 13,
  background: 'var(--bg-input)', border: '1px solid var(--border)',
  color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box',
}
const labelS: React.CSSProperties = {
  display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
  color: 'var(--text-muted)', marginBottom: 5,
  fontFamily: "'JetBrains Mono', monospace",
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelS}>{label}</label>
      {children}
    </div>
  )
}
function Toggle({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 14px', borderRadius: 8,
      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
      marginBottom: 10,
    }}>
      <div>
        <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>{label}</p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{desc}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
          background: checked ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.1)',
          position: 'relative', transition: 'background 0.2s', flexShrink: 0,
        }}
      >
        <span style={{
          position: 'absolute', top: 3, left: checked ? 23 : 3,
          width: 18, height: 18, borderRadius: '50%', background: '#fff',
          transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        }} />
      </button>
    </div>
  )
}

// ── Aba: Identidade ───────────────────────────────────────────────────────────
function IdentityTab({ onSaved }: { onSaved: (data: SystemIdentity) => void }) {
  const [data, setData] = useState<SystemIdentity>({ systemName: 'HelpDesk', companyName: 'Itamarathy', systemLogo: null })
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getSystemIdentity().then(d => { setData(d); setLoading(false) })
  }, [])

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setData(d => ({ ...d, systemLogo: ev.target?.result as string ?? null }))
    reader.readAsDataURL(file)
  }

  function save() {
    startTransition(async () => {
      await saveSystemIdentity(data)
      setSaved(true)
      onSaved(data)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  if (loading) return <p style={{ color: 'var(--text-muted)', fontSize: 13, padding: 8 }}>Carregando…</p>

  return (
    <div>
      <Field label="NOME DO SISTEMA">
        <input style={iS} value={data.systemName} onChange={e => setData(d => ({ ...d, systemName: e.target.value }))} placeholder="HelpDesk" />
      </Field>
      <Field label="EMPRESA">
        <input style={iS} value={data.companyName} onChange={e => setData(d => ({ ...d, companyName: e.target.value }))} placeholder="Itamarathy" />
      </Field>
      <Field label="LOGO (PNG/SVG — aparece na sidebar)">
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {data.systemLogo && (
            <img src={data.systemLogo} alt="logo" style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 6, background: 'rgba(255,255,255,0.06)', padding: 4 }} />
          )}
          <button
            onClick={() => fileRef.current?.click()}
            style={{ ...iS, cursor: 'pointer', width: 'auto', padding: '8px 14px', color: 'var(--accent-cyan)', borderColor: 'var(--accent-cyan)', background: 'var(--accent-cyan-dim)' }}
          >
            {data.systemLogo ? 'Trocar imagem' : 'Enviar imagem'}
          </button>
          {data.systemLogo && (
            <button
              onClick={() => setData(d => ({ ...d, systemLogo: null }))}
              style={{ ...iS, cursor: 'pointer', width: 'auto', padding: '8px 10px', color: '#f87171', borderColor: 'rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.05)' }}
            >
              Remover
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
        </div>
        <p style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 5 }}>Recomendado: PNG 64×64px ou SVG. Fundo transparente.</p>
      </Field>
      <button
        onClick={save}
        disabled={isPending}
        style={{
          padding: '9px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
          background: saved ? 'rgba(52,211,153,0.15)' : 'var(--accent-cyan)',
          color: saved ? '#34d399' : '#000',
          fontWeight: 700, fontSize: 13, transition: 'all 0.15s',
          display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        {saved ? '✓ Salvo' : isPending ? 'Salvando…' : 'Salvar identidade'}
      </button>
    </div>
  )
}

// ── Aba: E-mail → Chamado ─────────────────────────────────────────────────────
function EmailTab() {
  const [data, setData] = useState<EmailToTicketConfig>({ enabled: false, address: '', provider: 'smtp', host: '', port: 587, user: '', pass: '' })
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getEmailToTicketConfig().then(d => { setData(d); setLoading(false) })
  }, [])

  function save() {
    startTransition(async () => {
      await saveEmailToTicketConfig(data)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  if (loading) return <p style={{ color: 'var(--text-muted)', fontSize: 13, padding: 8 }}>Carregando…</p>

  return (
    <div>
      <Toggle
        label="Receber chamados por e-mail"
        desc="Mensagens recebidas neste endereço serão convertidas em chamados"
        checked={data.enabled}
        onChange={v => setData(d => ({ ...d, enabled: v }))}
      />

      {data.enabled && (
        <div style={{ marginTop: 16 }}>
          <Field label="ENDEREÇO DE ENTRADA">
            <input style={iS} type="email" value={data.address} onChange={e => setData(d => ({ ...d, address: e.target.value }))} placeholder="chamados@empresa.com" />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 10 }}>
            <Field label="SERVIDOR SMTP/IMAP">
              <input style={iS} value={data.host} onChange={e => setData(d => ({ ...d, host: e.target.value }))} placeholder="mail.empresa.com" />
            </Field>
            <Field label="PORTA">
              <input style={iS} type="number" value={data.port} onChange={e => setData(d => ({ ...d, port: +e.target.value }))} />
            </Field>
          </div>
          <Field label="USUÁRIO">
            <input style={iS} value={data.user} onChange={e => setData(d => ({ ...d, user: e.target.value }))} placeholder="chamados@empresa.com" />
          </Field>
          <Field label="SENHA">
            <input style={iS} type="password" value={data.pass} onChange={e => setData(d => ({ ...d, pass: e.target.value }))} placeholder="••••••••" autoComplete="new-password" />
          </Field>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14, padding: '8px 12px', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 6 }}>
            ⚠ A integração de e-mail → chamado requer configuração adicional do servidor. Esta tela salva as credenciais; o processamento será ativado quando o serviço de polling estiver em execução.
          </p>
        </div>
      )}

      <button
        onClick={save}
        disabled={isPending}
        style={{
          padding: '9px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
          background: saved ? 'rgba(52,211,153,0.15)' : 'var(--accent-cyan)',
          color: saved ? '#34d399' : '#000',
          fontWeight: 700, fontSize: 13, transition: 'all 0.15s',
        }}
      >
        {saved ? '✓ Salvo' : isPending ? 'Salvando…' : 'Salvar configuração'}
      </button>
    </div>
  )
}

// ── Aba: Notificações ─────────────────────────────────────────────────────────
function NotificationsTab() {
  const [data, setData] = useState<NotificationsConfig>({ pushEnabled: false, csatEnabled: false })
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getNotificationsConfig().then(d => { setData(d); setLoading(false) })
  }, [])

  function save() {
    startTransition(async () => {
      await saveNotificationsConfig(data)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  if (loading) return <p style={{ color: 'var(--text-muted)', fontSize: 13, padding: 8 }}>Carregando…</p>

  return (
    <div>
      <Toggle
        label="Push Notifications (Windows)"
        desc="Notificações nativas do Windows quando um chamado for aberto"
        checked={data.pushEnabled}
        onChange={v => setData(d => ({ ...d, pushEnabled: v }))}
      />
      <Toggle
        label="Pesquisa de Satisfação (CSAT)"
        desc="Exibe avaliação de 1–5 estrelas ao solicitante após o fechamento do chamado"
        checked={data.csatEnabled}
        onChange={v => setData(d => ({ ...d, csatEnabled: v }))}
      />
      {data.csatEnabled && (
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14, padding: '8px 12px', background: 'rgba(0,217,184,0.04)', border: '1px solid rgba(0,217,184,0.15)', borderRadius: 6 }}>
          ℹ Quando ativo, o solicitante verá o modal de avaliação na próxima vez que acessar o sistema após o fechamento de um chamado.
        </p>
      )}
      <button
        onClick={save}
        disabled={isPending}
        style={{
          padding: '9px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
          background: saved ? 'rgba(52,211,153,0.15)' : 'var(--accent-cyan)',
          color: saved ? '#34d399' : '#000',
          fontWeight: 700, fontSize: 13, transition: 'all 0.15s',
        }}
      >
        {saved ? '✓ Salvo' : isPending ? 'Salvando…' : 'Salvar'}
      </button>
    </div>
  )
}

// ── Modal principal ───────────────────────────────────────────────────────────
interface Props {
  open: boolean
  onClose: () => void
  onIdentitySaved: (data: SystemIdentity) => void
}

export default function SystemConfigModal({ open, onClose, onIdentitySaved }: Props) {
  const [tab, setTab] = useState<Tab>('identity')
  const router = useRouter()

  function handleIdentitySaved(data: SystemIdentity) {
    onIdentitySaved(data)
    router.refresh()
  }

  if (!open) return null

  const TABS: { id: Tab; label: string }[] = [
    { id: 'identity',      label: '🏢 Identidade'    },
    { id: 'email',         label: '✉ E-mail'          },
    { id: 'notifications', label: '🔔 Notificações'   },
  ]

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 9999, width: '100%', maxWidth: 520,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-hover)',
        borderRadius: 14,
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        overflow: 'hidden',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-elevated)',
        }}>
          <div>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: 'var(--accent-cyan)', letterSpacing: '0.1em' }}>
              CONFIGURAÇÕES DO SISTEMA
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              Identidade, e-mail e notificações globais
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, display: 'flex' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 2, padding: '10px 16px 0',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-elevated)',
        }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '7px 14px', border: 'none', cursor: 'pointer',
                background: 'none', fontSize: 12, fontWeight: tab === t.id ? 700 : 400,
                color: tab === t.id ? 'var(--accent-cyan)' : 'var(--text-muted)',
                borderBottom: tab === t.id ? '2px solid var(--accent-cyan)' : '2px solid transparent',
                marginBottom: -1, transition: 'all 0.12s', borderRadius: '4px 4px 0 0',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {tab === 'identity'      && <IdentityTab onSaved={handleIdentitySaved} />}
          {tab === 'email'         && <EmailTab />}
          {tab === 'notifications' && <NotificationsTab />}
        </div>
      </div>
    </>
  )
}
