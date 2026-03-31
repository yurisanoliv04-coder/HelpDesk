'use client'

/**
 * Wrapper que desabilita SSR para ReportsClient.
 * Recharts usa elementos SVG (<defs>, <linearGradient>, <stop>) que não possuem
 * namespace SVG no servidor, causando erros de hidratação no Next.js.
 * Com ssr: false o componente só renderiza no cliente, eliminando os erros.
 */
import dynamic from 'next/dynamic'
import type { ComponentProps } from 'react'

// Importamos o tipo apenas para inferir as props
import type { ReportsClient as ReportsClientType } from './ReportsClient'

const ReportsClientDynamic = dynamic(
  () => import('./ReportsClient').then((m) => ({ default: m.ReportsClient })),
  {
    ssr: false,
    loading: () => (
      <div style={{
        minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#3d5068', fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
      }}>
        Carregando relatórios...
      </div>
    ),
  }
)

export function ReportsNoSSR(props: ComponentProps<typeof ReportsClientType>) {
  return <ReportsClientDynamic {...props} />
}
