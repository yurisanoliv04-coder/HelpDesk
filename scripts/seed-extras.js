const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { Pool } = require('pg')
require('dotenv').config({ path: '.env' })
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const CAT = {
  desktop:   'cmmjms9qo000j6saplhmfxuzq',
  notebook:  'cmmjms9qo000k6saperaflaxk',
  monitor:   'cmmjms9qo000l6sapdyue6pyz',
  nobreak:   'cmmjms9qp000m6sapxqsxpb5v',
  impressora:'cmmjms9qp000n6sapivef1g2e',
  teclado:   'cmmjms9qq000p6sapow8r27q1',
  mouse:     'cmmjms9qq000o6sapp8rqs8yy',
  headset:   'cmmjms9qq000q6sappuetv71i',
  celular:   'cmmjms9r6000s6sapw9whcql9',
  switch:    'cmmjms9r6000t6sapmaof9df9',
}
const USR = {
  admin:    'cmmjms9do00056sape6699qhj',
  joao:     'cmmjms9fw00066sapgaipptg3',
  maria:    'cmmjms9hz00076sapc19lmyvr',
  carlos:   'cmmjms9k200086sapna3o904g',
  ana:      'cmmjms9m900096sapg5a6rs2f',
  pedro:    'cmmjms9oa000a6sapx595y9bp',
  fernanda: 'cmmkjjpis00009capne2f08kw',
  ricardo:  'cmmkjjpl900019capm0xq6u8y',
}

async function main() {
  // ── 1. NOVOS MODELOS ──────────────────────────────────────────────────────
  console.log('Criando modelos...')
  const modelDefs = [
    { categoryId: CAT.notebook,  name: 'Dell Latitude 5530',     manufacturer: 'Dell' },
    { categoryId: CAT.notebook,  name: 'HP EliteBook 840 G9',    manufacturer: 'HP' },
    { categoryId: CAT.desktop,   name: 'Dell OptiPlex 7090',     manufacturer: 'Dell' },
    { categoryId: CAT.desktop,   name: 'HP ProDesk 600 G6',      manufacturer: 'HP' },
    { categoryId: CAT.monitor,   name: 'Samsung S27A600U 27',    manufacturer: 'Samsung' },
    { categoryId: CAT.monitor,   name: 'Dell U2722D 27',         manufacturer: 'Dell' },
    { categoryId: CAT.switch,    name: 'Cisco SG110-24',          manufacturer: 'Cisco' },
    { categoryId: CAT.teclado,   name: 'Logitech MX Keys',        manufacturer: 'Logitech' },
    { categoryId: CAT.mouse,     name: 'Logitech MX Master 3',    manufacturer: 'Logitech' },
    { categoryId: CAT.celular,   name: 'iPhone 14',               manufacturer: 'Apple' },
    { categoryId: CAT.celular,   name: 'Samsung Galaxy A54',      manufacturer: 'Samsung' },
    { categoryId: CAT.headset,   name: 'Jabra Evolve2 55',        manufacturer: 'Jabra' },
  ]
  const models = []
  for (const d of modelDefs) {
    const m = await prisma.assetModel.create({ data: d })
    models.push(m)
    console.log('  Modelo:', m.name)
  }
  const mByName = Object.fromEntries(models.map(m => [m.name, m.id]))

  // ── 2. NOVOS ATIVOS ───────────────────────────────────────────────────────
  console.log('\nCriando ativos...')
  const assetDefs = [
    {
      tag: 'PAT-0017', name: 'Dell Latitude 5530', categoryId: CAT.notebook,
      modelId: mByName['Dell Latitude 5530'],
      status: 'DEPLOYED', location: 'Pessoal', assignedToUserId: USR.fernanda,
      serialNumber: 'DL5530-FRH-001', ramGb: 16, storageType: 'SSD_NVME', storageGb: 512,
      cpuBrand: 'INTEL', cpuModel: 'Core i5', cpuGeneration: 12,
      acquisitionDate: new Date('2024-03-10'), acquisitionCost: 4200,
    },
    {
      tag: 'PAT-0018', name: 'HP EliteBook 840 G9', categoryId: CAT.notebook,
      modelId: mByName['HP EliteBook 840 G9'],
      status: 'STOCK', location: 'T.I',
      serialNumber: 'HP840G9-TI-002', ramGb: 16, storageType: 'SSD_NVME', storageGb: 256,
      cpuBrand: 'INTEL', cpuModel: 'Core i7', cpuGeneration: 12,
      acquisitionDate: new Date('2024-06-15'), acquisitionCost: 5800,
    },
    {
      tag: 'PAT-0019', name: 'Dell OptiPlex 7090', categoryId: CAT.desktop,
      modelId: mByName['Dell OptiPlex 7090'],
      status: 'DEPLOYED', location: 'Operacoes', assignedToUserId: USR.ricardo,
      serialNumber: 'OPX7090-ROP-001', ramGb: 8, storageType: 'SSD_NVME', storageGb: 256,
      cpuBrand: 'INTEL', cpuModel: 'Core i5', cpuGeneration: 11,
      acquisitionDate: new Date('2023-11-20'), acquisitionCost: 3100,
    },
    {
      tag: 'PAT-0020', name: 'HP ProDesk 600 G6', categoryId: CAT.desktop,
      modelId: mByName['HP ProDesk 600 G6'],
      status: 'MAINTENANCE', location: 'T.I',
      serialNumber: 'HPD600G6-MNT-001', ramGb: 8, storageType: 'HDD', storageGb: 500,
      cpuBrand: 'INTEL', cpuModel: 'Core i3', cpuGeneration: 10,
      acquisitionDate: new Date('2022-05-01'), acquisitionCost: 2200,
      notes: 'HD com setores defeituosos - aguardando substituicao',
    },
    {
      tag: 'PAT-0021', name: 'Samsung S27A600U 27"', categoryId: CAT.monitor,
      modelId: mByName['Samsung S27A600U 27'],
      status: 'DEPLOYED', location: 'Financeiro', assignedToUserId: USR.pedro,
      serialNumber: 'SSG27A-FIN-001',
      acquisitionDate: new Date('2024-01-08'), acquisitionCost: 1350,
    },
    {
      tag: 'PAT-0022', name: 'Dell U2722D 27"', categoryId: CAT.monitor,
      modelId: mByName['Dell U2722D 27'],
      status: 'STOCK', location: 'T.I',
      serialNumber: 'DEL-U2722D-002',
      acquisitionDate: new Date('2024-02-14'), acquisitionCost: 1890,
    },
    {
      tag: 'PAT-0023', name: 'Cisco SG110-24', categoryId: CAT.switch,
      modelId: mByName['Cisco SG110-24'],
      status: 'DEPLOYED', location: 'T.I',
      serialNumber: 'CSC-SG110-001',
      acquisitionDate: new Date('2023-08-22'), acquisitionCost: 980,
    },
    {
      tag: 'PAT-0024', name: 'Logitech MX Keys', categoryId: CAT.teclado,
      modelId: mByName['Logitech MX Keys'],
      status: 'DEPLOYED', location: 'Administrativo',
      serialNumber: 'LGT-MXKEYS-001',
      acquisitionDate: new Date('2024-04-03'), acquisitionCost: 420,
    },
    {
      tag: 'PAT-0025', name: 'Logitech MX Master 3', categoryId: CAT.mouse,
      modelId: mByName['Logitech MX Master 3'],
      status: 'DEPLOYED', location: 'Administrativo',
      serialNumber: 'LGT-MXM3-001',
      acquisitionDate: new Date('2024-04-03'), acquisitionCost: 380,
    },
    {
      tag: 'PAT-0026', name: 'iPhone 14', categoryId: CAT.celular,
      modelId: mByName['iPhone 14'],
      status: 'DEPLOYED', location: 'Diretoria', assignedToUserId: USR.ana,
      serialNumber: 'APL-IP14-DIR-001',
      acquisitionDate: new Date('2023-12-01'), acquisitionCost: 5200,
    },
    {
      tag: 'PAT-0027', name: 'Samsung Galaxy A54', categoryId: CAT.celular,
      modelId: mByName['Samsung Galaxy A54'],
      status: 'DEPLOYED', location: 'Operacoes', assignedToUserId: USR.ricardo,
      serialNumber: 'SSG-A54-OP-001',
      acquisitionDate: new Date('2024-05-10'), acquisitionCost: 1600,
    },
    {
      tag: 'PAT-0028', name: 'Jabra Evolve2 55', categoryId: CAT.headset,
      modelId: mByName['Jabra Evolve2 55'],
      status: 'DEPLOYED', location: 'T.I', assignedToUserId: USR.joao,
      serialNumber: 'JBR-EV255-TI-001',
      acquisitionDate: new Date('2023-09-15'), acquisitionCost: 1200,
    },
  ]

  const newAssets = []
  for (const d of assetDefs) {
    const a = await prisma.asset.create({ data: d })
    newAssets.push(a)
    console.log('  Ativo:', a.tag, a.name)
  }
  const aByTag = Object.fromEntries(newAssets.map(a => [a.tag, a.id]))

  // ── 3. ORDENS DE MOVIMENTAÇÃO ─────────────────────────────────────────────
  // Enums corretos:
  // MovementOrderStatus: DRAFT | IN_PROGRESS | DONE | CANCELED
  // OrderItemAction: REMOVE_ASSET | ASSIGN_ASSET | SEND_MAINTENANCE | RETURN_STOCK | DISCARD_ASSET | LOAN_ASSET | RETURN_LOAN
  // OrderItemStatus: PENDING | DONE | CANCELED
  // MovementType: CHECK_IN | CHECK_OUT | TRANSFER | SWAP | MAINT_START | MAINT_END | DISCARD | LOAN | RETURN
  console.log('\nCriando ordens de movimentacao...')

  // Ordem 1: DONE — Implantacao notebook Fernanda
  await prisma.movementOrder.create({ data: {
    status: 'DONE',
    actorId: USR.joao,
    notes: 'Implantacao de equipamento para nova colaboradora RH',
    completedAt: new Date('2024-03-11T14:30:00'),
    createdAt: new Date('2024-03-11T09:00:00'),
    items: { create: [{
      action: 'ASSIGN_ASSET', status: 'DONE',
      assetId: aByTag['PAT-0017'],
      targetUserId: USR.fernanda,
      targetLocation: 'Pessoal',
      notes: 'Notebook novo para Fernanda RH',
    }]},
    movements: { create: [{
      assetId: aByTag['PAT-0017'], actorId: USR.joao, type: 'CHECK_OUT',
      fromLocation: 'T.I', toLocation: 'Pessoal',
      toUserId: USR.fernanda,
      fromStatus: 'STOCK', toStatus: 'DEPLOYED',
      notes: 'Implantacao autorizada pelo Admin TI',
    }]},
  }})
  console.log('  Ordem 1 (DONE): Implantacao notebook Fernanda')

  // Ordem 2: DRAFT — Modernizacao Financeiro
  await prisma.movementOrder.create({ data: {
    status: 'DRAFT',
    actorId: USR.admin,
    notes: 'Modernizacao estacoes Financeiro - Q2 2025',
    items: { create: [
      {
        action: 'ASSIGN_ASSET', status: 'PENDING',
        assetId: aByTag['PAT-0018'],
        targetUserId: USR.pedro,
        targetLocation: 'Financeiro',
        notes: 'Substituir notebook antigo de Pedro',
      },
      {
        action: 'ASSIGN_ASSET', status: 'PENDING',
        assetId: aByTag['PAT-0022'],
        targetUserId: USR.pedro,
        targetLocation: 'Financeiro',
        notes: 'Monitor adicional para estacao dupla',
      },
    ]},
  }})
  console.log('  Ordem 2 (DRAFT): Modernizacao Financeiro')

  // Ordem 3: IN_PROGRESS — Perifericos para Administrativo
  await prisma.movementOrder.create({ data: {
    status: 'IN_PROGRESS',
    actorId: USR.carlos,
    notes: 'Reorganizacao de perifericos - setor Administrativo',
    movements: { create: [
      {
        assetId: aByTag['PAT-0024'], actorId: USR.carlos, type: 'TRANSFER',
        fromLocation: 'T.I', toLocation: 'Administrativo',
        fromStatus: 'STOCK', toStatus: 'DEPLOYED',
      },
    ]},
    items: { create: [
      {
        action: 'ASSIGN_ASSET', status: 'DONE',
        assetId: aByTag['PAT-0024'],
        targetLocation: 'Administrativo',
      },
      {
        action: 'ASSIGN_ASSET', status: 'PENDING',
        assetId: aByTag['PAT-0025'],
        targetLocation: 'Administrativo',
        notes: 'Aguardando retirada do tecnico',
      },
    ]},
  }})
  console.log('  Ordem 3 (IN_PROGRESS): Perifericos Administrativo')

  // Ordem 4: DONE — Coleta para manutencao HP ProDesk
  await prisma.movementOrder.create({ data: {
    status: 'DONE',
    actorId: USR.maria,
    notes: 'Coleta para manutencao corretiva - HD defeituoso',
    completedAt: new Date('2025-02-20T16:00:00'),
    createdAt: new Date('2025-02-18T08:00:00'),
    movements: { create: [{
      assetId: aByTag['PAT-0020'], actorId: USR.maria, type: 'MAINT_START',
      fromLocation: 'Administrativo', toLocation: 'T.I',
      fromStatus: 'DEPLOYED', toStatus: 'MAINTENANCE',
      notes: 'Coletado para diagnostico - HD com setores defeituosos',
    }]},
    items: { create: [{
      action: 'SEND_MAINTENANCE', status: 'DONE',
      assetId: aByTag['PAT-0020'],
      targetLocation: 'T.I',
      notes: 'HP ProDesk com HD defeituoso',
    }]},
  }})
  console.log('  Ordem 4 (COMPLETED): Manutencao HP ProDesk')

  console.log('\n=== CONCLUIDO ===')
  console.log('Modelos criados:', models.length)
  console.log('Ativos criados: ', newAssets.length, '(PAT-0017 a PAT-0028)')
  console.log('Ordens criadas: 4')
  await prisma.$disconnect()
}

main().catch(e => { console.error(e.message); process.exit(1) })
