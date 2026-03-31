'use client'

import { useEffect, useRef, useState } from 'react'

/* ─── Sequência de linhas do terminal ────────────────────────────────────── */
const LINES = [
  { text: '> HELPDESK SYSTEM v2.0 — ITAMARATHY CORP', delay: 0,    color: '#00ff88', bold: true },
  { text: '> Inicializando módulos do sistema...', delay: 420,  color: '#00d9b8' },
  { text: '> Carregando configurações de rede...', delay: 780,  color: '#00d9b8' },
  { text: '> Verificando integridade do banco de dados...', delay: 1100, color: '#00d9b8' },
  { text: '[OK] Conexão estabelecida — 192.168.1.1:5432', delay: 1460, color: '#4ade80' },
  { text: '> Autenticando sessão...', delay: 1700, color: '#00d9b8' },
  { text: '[OK] Token JWT validado com sucesso', delay: 1980, color: '#4ade80' },
  { text: '> Carregando permissões RBAC...', delay: 2200, color: '#00d9b8' },
  { text: '[OK] Perfil de acesso carregado', delay: 2450, color: '#4ade80' },
  { text: '> Sincronizando módulo de chamados...', delay: 2650, color: '#00d9b8' },
  { text: '[OK] HelpDesk pronto.', delay: 2900, color: '#4ade80' },
  { text: '', delay: 3100, color: '#00d9b8' },
  { text: '██████████████████████████  ACESSO CONCEDIDO', delay: 3200, color: '#00ff88', bold: true },
]

const TOTAL_DURATION = 3900 // ms até começar a sair

/* ─── Canvas Matrix ──────────────────────────────────────────────────────── */
function MatrixCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEF<>{}[]|/\\'
    const fontSize = 13
    let cols = Math.floor(canvas.width / fontSize)
    const drops: number[] = Array.from({ length: cols }, () => Math.random() * -50)

    function resize() {
      canvas!.width = window.innerWidth
      canvas!.height = window.innerHeight
      cols = Math.floor(canvas!.width / fontSize)
      drops.length = 0
      for (let i = 0; i < cols; i++) drops.push(Math.random() * -50)
    }
    resize()
    window.addEventListener('resize', resize)

    function draw() {
      ctx!.fillStyle = 'rgba(0,0,0,0.045)'
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height)
      ctx!.font = `${fontSize}px monospace`

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)]
        const y = drops[i] * fontSize
        // Head char — brighter
        ctx!.fillStyle = drops[i] > 2 ? 'rgba(0,255,136,0.9)' : 'rgba(0,217,184,0.5)'
        ctx!.fillText(char, i * fontSize, y)
        if (y > canvas!.height && Math.random() > 0.975) drops[i] = 0
        drops[i] += 0.5
      }
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, opacity: 0.18, pointerEvents: 'none' }}
    />
  )
}

/* ─── Linha digitada ─────────────────────────────────────────────────────── */
function TypedLine({ text, color, bold, speed = 28 }: { text: string; color: string; bold?: boolean; speed?: number }) {
  const [displayed, setDisplayed] = useState('')

  useEffect(() => {
    if (!text) { setDisplayed(''); return }
    let i = 0
    setDisplayed('')
    const id = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) clearInterval(id)
    }, speed)
    return () => clearInterval(id)
  }, [text, speed])

  return (
    <div style={{
      color,
      fontWeight: bold ? 700 : 400,
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: 13,
      lineHeight: '1.7',
      letterSpacing: '0.03em',
      minHeight: '1.7em',
    }}>
      {displayed}
      {displayed.length < text.length && (
        <span style={{ animation: 'blink 0.6s step-end infinite', color: '#00ff88' }}>█</span>
      )}
    </div>
  )
}

/* ─── Componente principal ───────────────────────────────────────────────── */
export default function SplashScreen() {
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)
  const [visibleLines, setVisibleLines] = useState<number[]>([])
  const [barWidth, setBarWidth] = useState(0)

  useEffect(() => {
    // Mostra apenas uma vez por sessão
    const shown = sessionStorage.getItem('hd-splash-shown')
    if (shown) return
    sessionStorage.setItem('hd-splash-shown', '1')
    setVisible(true)

    // Revela cada linha no tempo correto
    LINES.forEach((line, idx) => {
      setTimeout(() => {
        setVisibleLines(prev => [...prev, idx])
      }, line.delay)
    })

    // Barra de progresso
    const barStart = 400
    const barEnd = 3000
    const barDuration = barEnd - barStart
    const barInterval = setInterval(() => {
      setBarWidth(prev => {
        const next = prev + (100 / (barDuration / 30))
        return next >= 100 ? 100 : next
      })
    }, 30)
    setTimeout(() => clearInterval(barInterval), barEnd)

    // Inicia a saída
    setTimeout(() => setExiting(true), TOTAL_DURATION)
    // Remove do DOM
    setTimeout(() => setVisible(false), TOTAL_DURATION + 700)

    return () => clearInterval(barInterval)
  }, [])

  if (!visible) return null

  return (
    <>
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes scanline {
          0%   { transform: translateY(-100%) }
          100% { transform: translateY(100vh) }
        }
        @keyframes glitch {
          0%,94%,100%  { clip-path: none; transform: none }
          95%  { clip-path: inset(30% 0 40% 0); transform: translateX(-4px) }
          97%  { clip-path: inset(60% 0 20% 0); transform: translateX(4px) }
          99%  { clip-path: inset(10% 0 70% 0); transform: translateX(-2px) }
        }
        @keyframes fadeIn {
          from { opacity:0; transform: translateY(8px) }
          to   { opacity:1; transform: translateY(0) }
        }
        @keyframes logoAppear {
          0%   { opacity:0; letter-spacing: 0.8em; filter: blur(8px) }
          60%  { opacity:1; letter-spacing: 0.12em; filter: blur(0) }
          100% { letter-spacing: 0.12em }
        }
        .hd-splash-exit {
          animation: splashExit 0.65s cubic-bezier(0.4,0,0.6,1) forwards !important;
        }
        @keyframes splashExit {
          0%   { opacity:1; transform: scale(1) }
          40%  { opacity:1; transform: scale(1.012) }
          100% { opacity:0; transform: scale(0.96) }
        }
      `}</style>

      <div
        className={exiting ? 'hd-splash-exit' : ''}
        style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: '#000',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {/* Matrix background */}
        <MatrixCanvas />

        {/* Scanline */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
        }} />
        <div style={{
          position: 'absolute', left: 0, right: 0, height: 120,
          background: 'linear-gradient(transparent, rgba(0,255,136,0.025), transparent)',
          animation: 'scanline 3.5s linear infinite',
          pointerEvents: 'none',
        }} />

        {/* Vignette */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.65) 100%)',
        }} />

        {/* Conteúdo central */}
        <div style={{
          position: 'relative', zIndex: 2,
          width: '100%', maxWidth: 640,
          padding: '0 24px',
        }}>
          {/* Logo */}
          <div style={{
            textAlign: 'center', marginBottom: 36,
            animation: 'logoAppear 0.9s ease-out forwards',
          }}>
            <div style={{
              fontFamily: '"Courier New", Courier, monospace',
              fontSize: 11, letterSpacing: '0.4em',
              color: '#00d9b8', opacity: 0.7,
              marginBottom: 8,
            }}>
              ITAMARATHY CORP — SISTEMA INTERNO
            </div>
            <div style={{
              fontFamily: '"Courier New", Courier, monospace',
              fontSize: 32, fontWeight: 900,
              color: '#00ff88',
              letterSpacing: '0.12em',
              textShadow: '0 0 20px rgba(0,255,136,0.6), 0 0 60px rgba(0,255,136,0.2)',
              animation: 'glitch 4s infinite',
            }}>
              HELPDESK
            </div>
            <div style={{
              width: 200, height: 1,
              background: 'linear-gradient(90deg, transparent, #00ff88, transparent)',
              margin: '10px auto 0',
              boxShadow: '0 0 8px rgba(0,255,136,0.5)',
            }} />
          </div>

          {/* Terminal box */}
          <div style={{
            background: 'rgba(0,20,10,0.85)',
            border: '1px solid rgba(0,255,136,0.25)',
            borderRadius: 6,
            padding: '16px 20px',
            boxShadow: '0 0 40px rgba(0,255,136,0.08), inset 0 0 20px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            minHeight: 260,
          }}>
            {/* Barra título terminal */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              marginBottom: 14, paddingBottom: 10,
              borderBottom: '1px solid rgba(0,255,136,0.12)',
            }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
              <span style={{
                marginLeft: 8, fontFamily: '"Courier New", Courier, monospace',
                fontSize: 11, color: 'rgba(0,217,184,0.5)', letterSpacing: '0.1em',
              }}>
                hd-bootstrap — zsh
              </span>
            </div>

            {/* Linhas de terminal */}
            {LINES.map((line, idx) =>
              visibleLines.includes(idx) ? (
                <div key={idx} style={{ animation: 'fadeIn 0.2s ease-out' }}>
                  <TypedLine
                    text={line.text}
                    color={line.color}
                    bold={line.bold}
                    speed={line.text.length > 30 ? 18 : 22}
                  />
                </div>
              ) : null
            )}
          </div>

          {/* Barra de progresso */}
          <div style={{ marginTop: 16 }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 6,
            }}>
              <span style={{
                fontFamily: '"Courier New", Courier, monospace',
                fontSize: 10, color: 'rgba(0,217,184,0.5)',
                letterSpacing: '0.1em',
              }}>
                CARREGANDO SISTEMA
              </span>
              <span style={{
                fontFamily: '"Courier New", Courier, monospace',
                fontSize: 10, color: '#00ff88',
                letterSpacing: '0.05em',
              }}>
                {Math.round(barWidth)}%
              </span>
            </div>
            <div style={{
              height: 3, background: 'rgba(0,255,136,0.1)',
              borderRadius: 2, overflow: 'hidden',
              border: '1px solid rgba(0,255,136,0.15)',
            }}>
              <div style={{
                height: '100%', width: `${barWidth}%`,
                background: 'linear-gradient(90deg, #00d9b8, #00ff88)',
                boxShadow: '0 0 10px rgba(0,255,136,0.6)',
                borderRadius: 2,
                transition: 'width 0.1s linear',
              }} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
