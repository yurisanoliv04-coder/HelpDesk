import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const dashboards = await prisma.userDashboard.findMany()
  for (const db of dashboards) {
    const layout = db.layout as Array<Record<string, unknown>>
    if (!Array.isArray(layout) || layout.length === 0) continue
    const first = layout[0] as { h: number }
    if (first.h >= 8) {
      console.log('skip (already scaled):', db.name)
      continue
    }
    const scaled = layout.map((inst) => ({
      ...inst,
      h: (inst.h as number) * 4,
      y: (inst.y as number) * 4,
    }))
    await prisma.userDashboard.update({ where: { id: db.id }, data: { layout: scaled } })
    console.log('scaled:', db.name)
  }
  await prisma.$disconnect()
}

main()
