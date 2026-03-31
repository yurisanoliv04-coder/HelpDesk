'use client'

/**
 * Link que salva o estado da aba ativa em um cookie ao clicar.
 * Permite que o servidor redirecione automaticamente para a última aba usada
 * quando o usuário navega para a página sem um parâmetro de aba explícito.
 */
import Link from 'next/link'
import type { ComponentProps } from 'react'

interface TabSaverLinkProps extends ComponentProps<typeof Link> {
  /** Nome do cookie (ex: "hd_settings_tab") */
  cookieKey: string
  /** Valor a ser salvo (ex: "hardware") */
  cookieValue: string
}

export function TabSaverLink({ cookieKey, cookieValue, onClick, ...props }: TabSaverLinkProps) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        try {
          // encodeURIComponent so query-string chars (=, &, ?) survive cookie parsing
          const encoded = cookieValue ? encodeURIComponent(cookieValue) : ''
          document.cookie = `${cookieKey}=${encoded}; path=/; max-age=31536000; SameSite=Lax`
        } catch {}
        onClick?.(e as React.MouseEvent<HTMLAnchorElement>)
      }}
    />
  )
}
