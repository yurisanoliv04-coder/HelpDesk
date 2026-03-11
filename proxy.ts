import NextAuth from 'next-auth'
import { baseAuthConfig } from '@/lib/auth/base.config'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(baseAuthConfig)

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth
  const role = (req.auth?.user as any)?.role as string | undefined

  const isPublicPath =
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth') ||
    pathname === '/acesso-negado'

  // Not logged in → redirect to login
  if (!isLoggedIn && !isPublicPath) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Already logged in and hitting /login → redirect to appropriate home
  if (isLoggedIn && pathname === '/login') {
    if (role === 'AUXILIAR_TI') {
      return NextResponse.redirect(new URL('/aux', req.url))
    }
    if (role === 'COLABORADOR') {
      return NextResponse.redirect(new URL('/acesso-negado', req.url))
    }
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // COLABORADOR — completely blocked from the app (except auth routes for signout)
  if (isLoggedIn && role === 'COLABORADOR') {
    if (pathname === '/acesso-negado' || pathname.startsWith('/api/auth')) return NextResponse.next()
    return NextResponse.redirect(new URL('/acesso-negado', req.url))
  }

  // AUXILIAR_TI — cannot access dashboard or root
  if (isLoggedIn && role === 'AUXILIAR_TI') {
    if (pathname === '/dashboard' || pathname === '/') {
      return NextResponse.redirect(new URL('/aux', req.url))
    }
  }

  // TI / ADMIN — redirect root to dashboard
  if (isLoggedIn && ['TECNICO', 'ADMIN'].includes(role ?? '') && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
}
