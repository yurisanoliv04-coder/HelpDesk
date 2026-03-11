import { UserRole } from '@prisma/client'
import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      role: UserRole
      departmentId: string | null
      departmentName: string | null
    }
  }

  interface User {
    role: UserRole
    departmentId: string | null
    departmentName: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole
    departmentId: string | null
    departmentName: string | null
  }
}
