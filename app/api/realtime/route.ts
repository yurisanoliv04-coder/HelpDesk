import { auth } from '@/lib/auth/config'
import { NextResponse } from 'next/server'

// Mapa global de escritores SSE (por userId)
// Em produção, use Redis Pub/Sub ou similar
const clients = new Map<string, Set<ReadableStreamDefaultController>>()

// Mapa userId → role (para filtrar broadcasts por papel)
const clientRoles = new Map<string, string>()

export function addClient(
  userId: string,
  role: string,
  controller: ReadableStreamDefaultController,
) {
  if (!clients.has(userId)) clients.set(userId, new Set())
  clients.get(userId)!.add(controller)
  clientRoles.set(userId, role)
}

export function removeClient(userId: string, controller: ReadableStreamDefaultController) {
  const set = clients.get(userId)
  if (set) {
    set.delete(controller)
    if (set.size === 0) {
      clients.delete(userId)
      clientRoles.delete(userId)
    }
  }
}

/**
 * Emite um evento SSE para todos os usuários conectados.
 * Se targetRoles for informado, envia apenas para usuários com aquele role.
 */
export function broadcastEvent(event: {
  type: string
  payload: unknown
  targetRoles?: string[]
}) {
  const message = `data: ${JSON.stringify({ type: event.type, payload: event.payload })}\n\n`
  clients.forEach((controllers, userId) => {
    // Filtro por role quando targetRoles é especificado
    if (event.targetRoles && event.targetRoles.length > 0) {
      const role = clientRoles.get(userId)
      if (!role || !event.targetRoles.includes(role)) return
    }
    controllers.forEach((ctrl) => {
      try {
        ctrl.enqueue(message)
      } catch {
        // cliente desconectado
      }
    })
  })
}

/**
 * Emite um evento SSE para um usuário específico (por userId).
 */
export function broadcastToUser(userId: string, event: { type: string; payload: unknown }) {
  const controllers = clients.get(userId)
  if (!controllers) return
  const message = `data: ${JSON.stringify(event)}\n\n`
  controllers.forEach((ctrl) => {
    try {
      ctrl.enqueue(message)
    } catch {
      // cliente desconectado
    }
  })
}

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const role = session.user.role
  let controller: ReadableStreamDefaultController

  const stream = new ReadableStream({
    start(ctrl) {
      controller = ctrl
      addClient(userId, role, controller)

      // Heartbeat a cada 25s para manter conexão viva
      const heartbeat = setInterval(() => {
        try {
          ctrl.enqueue(': heartbeat\n\n')
        } catch {
          clearInterval(heartbeat)
        }
      }, 25000)
    },
    cancel() {
      removeClient(userId, controller)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
