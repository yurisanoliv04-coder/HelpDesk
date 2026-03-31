const { PrismaPg } = require('@prisma/adapter-pg')
const { PrismaClient } = require('@prisma/client')
const { Pool } = require('pg')

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://helpdesk:helpdesk_secret@localhost:5432/helpdesk_db' })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
  const actorId = admin?.id ?? null

  const users = await prisma.user.findMany({
    include: { department: { select: { name: true } } },
    orderBy: { createdAt: 'asc' },
  })

  console.log('Seeding events for', users.length, 'users...')
  await prisma.userEvent.deleteMany({})

  const events = []
  for (const u of users) {
    events.push({
      userId: u.id,
      actorId,
      type: 'PROFILE_CREATED',
      description: u.department
        ? `Perfil criado no departamento ${u.department.name}`
        : 'Perfil criado',
      meta: { role: u.role, department: u.department?.name ?? null },
      createdAt: u.createdAt,
    })

    if (u.active === false) {
      events.push({
        userId: u.id,
        actorId,
        type: 'PROFILE_DEACTIVATED',
        description: 'Perfil desativado',
        meta: { exitDate: u.exitDate ?? null },
        createdAt: u.exitDate ?? u.updatedAt,
      })
    }
  }

  await prisma.userEvent.createMany({ data: events })
  console.log('Created', events.length, 'user events')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect(); pool.end() })
