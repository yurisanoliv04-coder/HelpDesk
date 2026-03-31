import { auth } from '@/lib/auth/config'
import { NextResponse } from 'next/server'
import { addClient, removeClient } from '@/lib/realtime/clients'

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
