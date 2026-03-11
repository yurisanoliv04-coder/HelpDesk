import type { NextAuthConfig } from 'next-auth'

/**
 * Config edge-safe: sem bcryptjs, sem Prisma adapter.
 * Usada pelo middleware (edge runtime) apenas para verificar o JWT.
 */
export const baseAuthConfig: NextAuthConfig = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [], // providers com bcrypt ficam só no config.ts completo
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.departmentId = (user as any).departmentId
        token.departmentName = (user as any).departmentName
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
        ;(session.user as any).role = token.role
        ;(session.user as any).departmentId = token.departmentId
        ;(session.user as any).departmentName = token.departmentName
      }
      return session
    },
  },
}
