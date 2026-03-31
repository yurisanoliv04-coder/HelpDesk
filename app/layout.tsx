import type { Metadata } from 'next'
import './globals.css'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { ThemeProvider } from '@/lib/context/theme'

export const metadata: Metadata = {
  title: 'HelpDesk — Itamarathy',
  description: 'Sistema unificado de chamados e gestão de patrimônio',
}

// CSS de temas injetado como <style> — vem DEPOIS do globals.css no cascade
// Isso garante que os [data-theme="..."] sobrescrevem o :root do globals.css.
// TailwindCSS v4 remove [data-theme] durante compilação, então não pode ficar em globals.css.
const THEME_CSS = `
:root,[data-theme="meianoite"]{
  --bg-base:#070c14;--bg-sidebar:#080d18;--bg-surface:#0d1422;--bg-elevated:#111927;--bg-hover:#161f30;--bg-input:#0a1019;
  --border:rgba(255,255,255,0.07);--border-hover:rgba(255,255,255,0.14);
  --accent-cyan:#00d9b8;--accent-cyan-dim:rgba(0,217,184,0.1);--accent-glow:rgba(0,217,184,0.18);
  --text-primary:#e2e8f0;--text-muted:#64748b;--text-dim:#3d4f66;
}
[data-theme="aurora"]{
  --bg-base:#0b0814;--bg-sidebar:#0d091a;--bg-surface:#130d1e;--bg-elevated:#1a1228;--bg-hover:#201630;--bg-input:#0f0a1a;
  --border:rgba(255,255,255,0.07);--border-hover:rgba(255,255,255,0.14);
  --accent-cyan:#a78bfa;--accent-cyan-dim:rgba(167,139,250,0.1);--accent-glow:rgba(167,139,250,0.18);
  --text-primary:#e2e8f0;--text-muted:#64748b;--text-dim:#4d3a6a;
}
[data-theme="oceano"]{
  --bg-base:#030c18;--bg-sidebar:#040e1e;--bg-surface:#071828;--bg-elevated:#0c2038;--bg-hover:#102840;--bg-input:#050f1e;
  --border:rgba(255,255,255,0.07);--border-hover:rgba(255,255,255,0.14);
  --accent-cyan:#38bdf8;--accent-cyan-dim:rgba(56,189,248,0.1);--accent-glow:rgba(56,189,248,0.18);
  --text-primary:#e2e8f0;--text-muted:#64748b;--text-dim:#2a4a6a;
}
[data-theme="brasa"]{
  --bg-base:#0a0a0a;--bg-sidebar:#0d0d0d;--bg-surface:#141414;--bg-elevated:#1a1a1a;--bg-hover:#202020;--bg-input:#0f0f0f;
  --border:rgba(255,255,255,0.07);--border-hover:rgba(255,255,255,0.14);
  --accent-cyan:#f59e0b;--accent-cyan-dim:rgba(245,158,11,0.1);--accent-glow:rgba(245,158,11,0.18);
  --text-primary:#e2e8f0;--text-muted:#64748b;--text-dim:#4a3a1a;
}
[data-theme="quartzo"]{
  --bg-base:#120810;--bg-sidebar:#140910;--bg-surface:#1d0d19;--bg-elevated:#261224;--bg-hover:#30172e;--bg-input:#180b14;
  --border:rgba(255,255,255,0.07);--border-hover:rgba(255,255,255,0.14);
  --accent-cyan:#f472b6;--accent-cyan-dim:rgba(244,114,182,0.1);--accent-glow:rgba(244,114,182,0.18);
  --text-primary:#e2e8f0;--text-muted:#64748b;--text-dim:#5a2a4a;
}
[data-theme="neve"]{
  --bg-base:#f5f8fc;--bg-sidebar:#eaf0f8;--bg-surface:#ffffff;--bg-elevated:#f0f5fb;--bg-hover:#e4ecf6;--bg-input:#ffffff;
  --border:rgba(0,0,0,0.09);--border-hover:rgba(0,0,0,0.18);
  --accent-cyan:#0284c7;--accent-cyan-dim:rgba(2,132,199,0.09);--accent-glow:rgba(2,132,199,0.14);
  --text-primary:#1e293b;--text-muted:#64748b;--text-dim:#94a3b8;
}

/* ── Select / option legibility across themes ───────────────────────────────
 * color-scheme: dark/light  →  tells the browser to render the native
 * OS dropdown popup in the correct mode (fixes white-on-white / dark-on-dark).
 * background/color overrides with !important beat inline style attributes.
 * ──────────────────────────────────────────────────────────────────────── */
:root select,[data-theme] select{
  color-scheme:dark;
  background-color:var(--bg-input)!important;
  color:var(--text-primary)!important;
}
:root select option,:root select optgroup,
[data-theme] select option,[data-theme] select optgroup{
  background-color:var(--bg-surface);
  color:var(--text-primary);
}
[data-theme="neve"] select{color-scheme:light;}
[data-theme="neve"] select option,[data-theme="neve"] select optgroup{
  background-color:#f8fafc;color:#1e293b;
}

/* Neve (light) — fix hardcoded dark inline styles on inputs & textareas */
[data-theme="neve"] input:not([type=checkbox]):not([type=radio]):not([type=range]),
[data-theme="neve"] textarea{
  background-color:var(--bg-input)!important;
  color:var(--text-primary)!important;
  border-color:var(--border)!important;
}
[data-theme="neve"] input::placeholder,
[data-theme="neve"] textarea::placeholder{color:var(--text-muted)!important;}
`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Aplica data-theme antes da renderização para evitar flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var v=['meianoite','aurora','oceano','brasa','quartzo','neve'];var t=localStorage.getItem('hd_theme');document.documentElement.setAttribute('data-theme',(t&&v.indexOf(t)!==-1)?t:'meianoite')}catch(e){}})();`,
          }}
        />
        {/* CSS de temas — injected after globals.css in the cascade */}
        <style dangerouslySetInnerHTML={{ __html: THEME_CSS }} />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
