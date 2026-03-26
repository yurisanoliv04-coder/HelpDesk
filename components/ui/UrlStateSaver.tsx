'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

/**
 * Invisível. Ao montar (ou quando searchParams mudar), salva os parâmetros
 * da URL atual no cookie indicado, para que o servidor redirecione
 * automaticamente na próxima vez que o usuário acessar a página sem params.
 *
 * Se a URL não tiver params relevantes, apaga o cookie (clearOnEmpty=true).
 */
export function UrlStateSaver({
  cookieKey,
  watchParams,
  clearOnEmpty = true,
}: {
  cookieKey: string
  /** Lista de parâmetros a observar. Somente esses são salvos no cookie. */
  watchParams: string[]
  clearOnEmpty?: boolean
}) {
  const searchParams = useSearchParams()

  useEffect(() => {
    const parts: string[] = []
    for (const key of watchParams) {
      const val = searchParams.get(key)
      if (val) parts.push(`${key}=${encodeURIComponent(val)}`)
    }

    const value = parts.join('&')

    if (value) {
      document.cookie = `${cookieKey}=${value}; path=/; max-age=31536000; SameSite=Lax`
    } else if (clearOnEmpty) {
      document.cookie = `${cookieKey}=; path=/; max-age=0`
    }
  }, [searchParams, cookieKey, watchParams, clearOnEmpty])

  return null
}
