'use client'

import { useEffect } from 'react'

/**
 * Sets the consumiveis section cookie to "__compras__" whenever the Compras
 * page is rendered (including direct navigation, not just tab-click).
 * This ensures the tab-memory redirect in consumiveis/page.tsx knows where
 * to send the user back when they return to the section.
 */
export default function SetComprasCookie() {
  useEffect(() => {
    document.cookie = 'hd_consumiveis_filter=__compras__; path=/; max-age=31536000; SameSite=Lax'
  }, [])
  return null
}
