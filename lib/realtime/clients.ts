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
