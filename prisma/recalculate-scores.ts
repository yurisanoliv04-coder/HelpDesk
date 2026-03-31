/**
 * Recalcula performanceScore / performanceLabel / performanceNotes
 * de todos os ativos que possuem dados de hardware.
 *
 * Execução:
 *   npx tsx prisma/recalculate-scores.ts
 */

import { PrismaClient, StorageType, CpuBrand } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'
import { scoreComputer } from '../lib/scoring/computer'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const assets = await prisma.asset.findMany({
    where: {
      OR: [
        { ramGb: { not: null } },
        { storageType: { not: null } },
        { cpuModel: { not: null } },
      ],
    },
    select: {
      id: true, tag: true, name: true,
      ramGb: true, storageType: true, storageGb: true,
      cpuBrand: true, cpuModel: true, cpuGeneration: true,
    },
  })

  console.log(`\n🔄 Recalculando scores para ${assets.length} ativos...\n`)

  let updated = 0
  for (const asset of assets) {
    const result = scoreComputer({
      ramGb:         asset.ramGb,
      storageType:   asset.storageType as StorageType | null,
      cpuModel:      asset.cpuModel,
      cpuGeneration: asset.cpuGeneration,
    })

    if (!result) {
      console.log(`  ⏭  ${asset.tag} — ${asset.name}: sem dados suficientes, ignorado`)
      continue
    }

    await prisma.asset.update({
      where: { id: asset.id },
      data: {
        performanceScore:  result.score,
        performanceLabel:  result.label,
        performanceNotes:  result.notes.join(' ') || null,
      },
    })

    const icon = result.label === 'BOM' ? '🟢' : result.label === 'INTERMEDIARIO' ? '🟡' : '🔴'
    console.log(`  ${icon} ${asset.tag} — ${asset.name}: ${result.score}/100 (${result.label})`)
    if (result.notes.length > 0) {
      result.notes.forEach(n => console.log(`       ↳ ${n}`))
    }
    updated++
  }

  console.log(`\n✅ ${updated} ativos atualizados.\n`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
