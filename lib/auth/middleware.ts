import { auth } from '@/lib/auth/config'
import { UserRole } from '@prisma/client'
import { NextResponse } from 'next/server'

export function withAuth(
  handler: Function,
  options?: { roles?: UserRole[] },
) {
  return async function (req: Request, ctx: any) {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { ok: false, error: { code: 'UNAUTHORIZED', message: 'Não autenticado' } },
        { status: 401 },
      )
    }

    if (options?.roles && !options.roles.includes(session.user.role)) {
      return NextResponse.json(
        { ok: false, error: { code: 'FORBIDDEN', message: 'Sem permissão' } },
        { status: 403 },
      )
    }

    return handler(req, ctx, session)
  }
}
