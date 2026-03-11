import { auth } from '@/lib/auth/config'

export default async function AcessoNegadoPage() {
  const session = await auth()
  const name = session?.user?.name ?? 'Usuário'

  async function handleSignOut() {
    'use server'
    const { signOut } = await import('@/lib/auth/config')
    await signOut({ redirectTo: '/login' })
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#070c14',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        maxWidth: 440,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24,
        textAlign: 'center',
      }}>

        {/* Icon */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'rgba(248,113,113,0.08)',
          border: '1px solid rgba(248,113,113,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#f87171" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>

        {/* Logo */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 16px', borderRadius: 10,
          background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)',
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: 'linear-gradient(135deg, #00d9b8 0%, #0ea5e9 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
            fontWeight: 600, color: '#e2e8f0',
          }}>
            HelpDesk
          </span>
        </div>

        {/* Title */}
        <div>
          <h1 style={{
            fontSize: 22, fontWeight: 700, color: '#e2eaf4', marginBottom: 8,
          }}>
            Acesso não autorizado
          </h1>
          <p style={{
            fontSize: 14, color: '#4a6580', lineHeight: 1.7,
          }}>
            Olá, <strong style={{ color: '#7a9bbc' }}>{name}</strong>. Sua conta não tem permissão
            para acessar este sistema. Entre em contato com a equipe de T.I. para solicitar acesso.
          </p>
        </div>

        {/* Divider */}
        <div style={{
          width: '100%', height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)',
        }} />

        {/* Contact card */}
        <div style={{
          width: '100%', padding: '14px 18px',
          background: '#0d1422', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 10, textAlign: 'left',
        }}>
          <p style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
            fontWeight: 700, color: '#3d5068', letterSpacing: '0.08em', marginBottom: 10,
          }}>
            CONTATO T.I.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(0,217,184,0.15) 0%, rgba(14,165,233,0.15) 100%)',
              border: '1px solid rgba(0,217,184,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#00d9b8" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500, lineHeight: 1 }}>
                Suporte T.I. — Itamarathy
              </p>
              <p style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
                color: '#3d5068', marginTop: 3,
              }}>
                ti@itamarathy.com.br
              </p>
            </div>
          </div>
        </div>

        {/* Sign out button */}
        <form action={handleSignOut}>
          <button
            type="submit"
            style={{
              padding: '10px 28px', borderRadius: 8,
              background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
              fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700,
              color: '#f87171', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
            }}
          >
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sair da conta
          </button>
        </form>
      </div>
    </div>
  )
}
