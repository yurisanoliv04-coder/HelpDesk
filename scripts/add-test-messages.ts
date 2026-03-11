/**
 * Script temporário para inserir mensagens de teste
 * em tickets do admin (para testar "Mensagens Recentes")
 * Uso: npx tsx scripts/add-test-messages.ts
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  // Busca o admin
  const admin = await prisma.user.findUnique({ where: { email: 'admin@helpdesk.local' } })
  if (!admin) throw new Error('Admin não encontrado')

  // Busca os outros usuários
  const colab1    = await prisma.user.findUnique({ where: { email: 'colaborador1@helpdesk.local' } })
  const tecnico1  = await prisma.user.findUnique({ where: { email: 'tecnico1@helpdesk.local' } })
  const auxiliar  = await prisma.user.findUnique({ where: { email: 'auxiliar@helpdesk.local' } })

  if (!colab1 || !tecnico1 || !auxiliar) throw new Error('Usuário não encontrado')

  // Busca tickets onde admin é assignee ou requester
  const adminTickets = await prisma.ticket.findMany({
    where: {
      OR: [{ assigneeId: admin.id }, { requesterId: admin.id }],
      status: { notIn: ['CANCELED', 'DONE'] },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { id: true, code: true, title: true, status: true },
  })

  if (adminTickets.length === 0) {
    console.log('Nenhum ticket ativo do admin encontrado.')
    return
  }

  console.log(`📋 Tickets do admin encontrados: ${adminTickets.map(t => t.code).join(', ')}`)

  // Insere mensagens variadas nos tickets
  const messages = [
    {
      ticketId: adminTickets[0]?.id,
      authorId: colab1.id,
      body: 'Olá! Conseguiu verificar o problema? Estamos aguardando a resolução com urgência.',
    },
    {
      ticketId: adminTickets[0]?.id,
      authorId: colab1.id,
      body: 'Atualização: o problema continua. Já afetou mais dois colegas do setor.',
    },
    {
      ticketId: adminTickets[1]?.id ?? adminTickets[0]?.id,
      authorId: tecnico1.id,
      body: 'Admin, passei aqui e vi que o equipamento ainda está com o mesmo erro. Posso ajudar com alguma coisa?',
    },
    {
      ticketId: adminTickets[1]?.id ?? adminTickets[0]?.id,
      authorId: auxiliar.id,
      body: 'Trouxe as informações do inventário que você pediu. O equipamento está no estoque B2.',
    },
    {
      ticketId: adminTickets[2]?.id ?? adminTickets[0]?.id,
      authorId: colab1.id,
      body: 'Bom dia! Só confirmando se o chamado ainda está em análise ou se já tem previsão de resolução.',
    },
  ]

  let count = 0
  for (const msg of messages) {
    if (!msg.ticketId) continue
    await prisma.ticketMessage.create({
      data: {
        ticketId: msg.ticketId,
        authorId: msg.authorId,
        body: msg.body,
        internal: false,
      },
    })
    count++
    console.log(`✅ Mensagem ${count} criada no ticket ${adminTickets.find(t => t.id === msg.ticketId)?.code}`)
  }

  console.log(`\n🎉 ${count} mensagens inseridas com sucesso!`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
