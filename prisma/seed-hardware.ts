/**
 * Seed: Peças de hardware padrão para o catálogo.
 * Execute com: npx tsx prisma/seed-hardware.ts
 *
 * Arquitetura de pontuação de CPU:
 *   score_final_cpu = min(base + ajuste_geracao, 30)
 *
 *   Ajuste de geração (aplicado pelo sistema na hora do cálculo):
 *     ≥ 13ª geração → +4
 *     10ª–12ª        → +2
 *     6ª–9ª          → 0
 *     4ª–5ª          → -4
 *     1ª–3ª          → -8
 *     sem geração    →  0
 *
 * Pontuação por componente (total = CPU 30 + RAM 40 + STORAGE 30 = 100):
 *   ≥ 65 → BOM  |  ≥ 38 → INTERMEDIÁRIO  |  < 38 → RUIM
 */

import { PrismaClient, HardwarePartType } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const cpus: Array<{ brand: string; model: string; scorePoints: number; notes: string }> = [
  // ── Intel ───────────────────────────────────────────────────────────────────
  { brand: 'Intel', model: 'Celeron',  scorePoints: 3,  notes: 'Inviável para ERP + navegador simultâneo' },
  { brand: 'Intel', model: 'Pentium',  scorePoints: 5,  notes: 'Muito limitado para uso corporativo' },
  { brand: 'Intel', model: 'Core i3',  scorePoints: 10, notes: 'Adequado para tarefas simples de escritório' },
  { brand: 'Intel', model: 'Core i5',  scorePoints: 17, notes: 'Ponto ideal para contabilidade/ERP' },
  { brand: 'Intel', model: 'Core i7',  scorePoints: 22, notes: 'Alto desempenho para uso intenso' },
  { brand: 'Intel', model: 'Core i9',  scorePoints: 28, notes: 'Superdimensionado — máximo Intel' },

  // ── AMD ─────────────────────────────────────────────────────────────────────
  { brand: 'AMD', model: 'Athlon',   scorePoints: 4,  notes: 'Muito limitado para uso corporativo' },
  { brand: 'AMD', model: 'Ryzen 3',  scorePoints: 10, notes: 'Adequado para tarefas simples de escritório' },
  { brand: 'AMD', model: 'Ryzen 5',  scorePoints: 17, notes: 'Excelente custo-benefício para escritório' },
  { brand: 'AMD', model: 'Ryzen 7',  scorePoints: 22, notes: 'Alto desempenho para uso intenso' },
  { brand: 'AMD', model: 'Ryzen 9',  scorePoints: 28, notes: 'Superdimensionado — máximo AMD' },
]

// RAM: brand = "DDR" (sem "Genérico")
const rams: Array<{ brand: string; model: string; scorePoints: number; notes: string; specs: object }> = [
  { brand: 'DDR', model: '2 GB',  scorePoints: 0,  notes: 'Inviável para qualquer uso corporativo',                       specs: { capacityGb: 2 } },
  { brand: 'DDR', model: '4 GB',  scorePoints: 5,  notes: 'Muito limitado — troca para SSD pode compensar parcialmente',  specs: { capacityGb: 4 } },
  { brand: 'DDR', model: '6 GB',  scorePoints: 12, notes: 'Abaixo do ideal para ERP',                                    specs: { capacityGb: 6 } },
  { brand: 'DDR', model: '8 GB',  scorePoints: 18, notes: 'Mínimo confortável para contabilidade + navegador',            specs: { capacityGb: 8 } },
  { brand: 'DDR', model: '12 GB', scorePoints: 25, notes: 'Boa folga para multitarefa',                                   specs: { capacityGb: 12 } },
  { brand: 'DDR', model: '16 GB', scorePoints: 30, notes: 'Ideal — sem restrições para uso de escritório',                specs: { capacityGb: 16 } },
  { brand: 'DDR', model: '24 GB', scorePoints: 36, notes: 'Confortável até para cargas pesadas',                         specs: { capacityGb: 24 } },
  { brand: 'DDR', model: '32 GB', scorePoints: 40, notes: 'Máximo — superdimensionado para escritório',                  specs: { capacityGb: 32 } },
  { brand: 'DDR', model: '64 GB', scorePoints: 40, notes: 'Workstation — máximo de pontuação aplicado',                  specs: { capacityGb: 64 } },
]

// STORAGE: brand = tipo (HDD / SSD SATA / SSD NVMe), model = capacidade
// Capacidade influencia a pontuação dentro do mesmo tipo (máx. 30 pts)
const storages: Array<{ brand: string; model: string; scorePoints: number; notes: string; specs: object }> = [
  // ── HDD (penalidade severa — gargalo de toda a operação) ─────────────────
  { brand: 'HDD', model: '80 GB',  scorePoints: 2,  notes: 'Capacidade crítica — substituição urgente',       specs: { storageType: 'HDD', capacityGb: 80 } },
  { brand: 'HDD', model: '120 GB', scorePoints: 2,  notes: 'Penalidade severa — gargalo em toda a operação',  specs: { storageType: 'HDD', capacityGb: 120 } },
  { brand: 'HDD', model: '250 GB', scorePoints: 3,  notes: 'Penalidade severa — gargalo em toda a operação',  specs: { storageType: 'HDD', capacityGb: 250 } },
  { brand: 'HDD', model: '320 GB', scorePoints: 4,  notes: 'Penalidade severa — gargalo em toda a operação',  specs: { storageType: 'HDD', capacityGb: 320 } },
  { brand: 'HDD', model: '500 GB', scorePoints: 5,  notes: 'Penalidade severa — gargalo em toda a operação',  specs: { storageType: 'HDD', capacityGb: 500 } },
  { brand: 'HDD', model: '1 TB',   scorePoints: 5,  notes: 'Penalidade severa — gargalo em toda a operação',  specs: { storageType: 'HDD', capacityGb: 1000 } },
  { brand: 'HDD', model: '2 TB',   scorePoints: 6,  notes: 'Penalidade severa — gargalo em toda a operação',  specs: { storageType: 'HDD', capacityGb: 2000 } },

  // ── SSD SATA (boa performance para escritório) ─────────────────────────────
  { brand: 'SSD SATA', model: '120 GB', scorePoints: 17, notes: 'Boa performance — capacidade limitada',       specs: { storageType: 'SSD_SATA', capacityGb: 120 } },
  { brand: 'SSD SATA', model: '240 GB', scorePoints: 19, notes: 'Boa performance para uso de escritório',      specs: { storageType: 'SSD_SATA', capacityGb: 240 } },
  { brand: 'SSD SATA', model: '480 GB', scorePoints: 22, notes: 'Boa performance para uso de escritório',      specs: { storageType: 'SSD_SATA', capacityGb: 480 } },
  { brand: 'SSD SATA', model: '512 GB', scorePoints: 22, notes: 'Boa performance para uso de escritório',      specs: { storageType: 'SSD_SATA', capacityGb: 512 } },
  { brand: 'SSD SATA', model: '1 TB',   scorePoints: 24, notes: 'Boa performance com espaço generoso',         specs: { storageType: 'SSD_SATA', capacityGb: 1000 } },

  // ── SSD NVMe (máximo desempenho) ───────────────────────────────────────────
  { brand: 'SSD NVMe', model: '256 GB', scorePoints: 25, notes: 'Alta velocidade — leitura/escrita ultrarrápida', specs: { storageType: 'SSD_NVME', capacityGb: 256 } },
  { brand: 'SSD NVMe', model: '512 GB', scorePoints: 28, notes: 'Alta velocidade — leitura/escrita ultrarrápida', specs: { storageType: 'SSD_NVME', capacityGb: 512 } },
  { brand: 'SSD NVMe', model: '1 TB',   scorePoints: 30, notes: 'Máximo desempenho — leitura/escrita ultrarrápida', specs: { storageType: 'SSD_NVME', capacityGb: 1000 } },
  { brand: 'SSD NVMe', model: '2 TB',   scorePoints: 30, notes: 'Máximo desempenho — leitura/escrita ultrarrápida', specs: { storageType: 'SSD_NVME', capacityGb: 2000 } },
]

async function main() {
  console.log('🔧 Resetando catálogo de hardware...\n')

  // ── CPUs: apaga todas e recria ──────────────────────────────────────────────
  const deletedCpu = await prisma.hardwarePart.deleteMany({ where: { type: HardwarePartType.CPU } })
  console.log(`  🗑  ${deletedCpu.count} CPUs antigas removidas`)

  let created = 0
  for (const cpu of cpus) {
    await prisma.hardwarePart.create({
      data: { type: HardwarePartType.CPU, brand: cpu.brand, model: cpu.model, scorePoints: cpu.scorePoints, notes: cpu.notes, specs: { genAdjustable: true } },
    })
    console.log(`  ✅ CPU: ${cpu.brand} ${cpu.model} (base: ${cpu.scorePoints} pts)`)
    created++
  }

  // ── Storage: apaga todos e recria com capacidade ────────────────────────────
  console.log()
  const deletedSt = await prisma.hardwarePart.deleteMany({ where: { type: HardwarePartType.STORAGE } })
  console.log(`  🗑  ${deletedSt.count} Storages antigos removidos`)

  for (const st of storages) {
    await prisma.hardwarePart.create({
      data: { type: HardwarePartType.STORAGE, brand: st.brand, model: st.model, scorePoints: st.scorePoints, notes: st.notes, specs: st.specs },
    })
    console.log(`  ✅ Storage: ${st.brand} ${st.model} (${st.scorePoints} pts)`)
    created++
  }

  // ── RAM: atualiza brand de "Genérico" para "DDR", cria novas se necessário ─
  console.log()
  await prisma.hardwarePart.updateMany({
    where: { type: HardwarePartType.RAM, brand: 'Genérico' },
    data: { brand: 'DDR' },
  })
  console.log('  🔄 RAM: brand atualizado de "Genérico" → "DDR"')

  for (const ram of rams) {
    const exists = await prisma.hardwarePart.findFirst({ where: { type: HardwarePartType.RAM, model: ram.model } })
    if (!exists) {
      await prisma.hardwarePart.create({
        data: { type: HardwarePartType.RAM, brand: ram.brand, model: ram.model, scorePoints: ram.scorePoints, notes: ram.notes, specs: ram.specs },
      })
      console.log(`  ✅ RAM: ${ram.model} (${ram.scorePoints} pts)`)
      created++
    } else {
      console.log(`  ⏭  RAM: ${ram.model} — já existe`)
    }
  }

  console.log(`\n🎉 Concluído: ${created} peças criadas/atualizadas.`)
  console.log('\n📐 Tabela de ajuste por geração da CPU (aplicada automaticamente):')
  console.log('   ≥ 13ª geração → +4 pts')
  console.log('   10ª–12ª       → +2 pts')
  console.log('    6ª–9ª        →  0 pts (neutro)')
  console.log('    4ª–5ª        → -4 pts')
  console.log('    1ª–3ª        → -8 pts')

  console.log('\n📦 Tabela de pontuação de Storage:')
  console.log('   HDD (qualquer capacidade)  →  2–6 pts')
  console.log('   SSD SATA 120–1 TB          → 17–24 pts')
  console.log('   SSD NVMe 256 GB–2 TB       → 25–30 pts')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
