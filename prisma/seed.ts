import { PrismaClient, UserRole, TicketPriority, TicketStatus, TicketEventType, AssetStatus, MovementType } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Iniciando seed...')

  // ─── Departamentos ───────────────────────────────────────────
  const departments = await Promise.all([
    prisma.department.upsert({ where: { name: 'Tecnologia da Informação' }, update: {}, create: { name: 'Tecnologia da Informação', code: 'TI' } }),
    prisma.department.upsert({ where: { name: 'Administrativo' }, update: {}, create: { name: 'Administrativo', code: 'ADM' } }),
    prisma.department.upsert({ where: { name: 'Financeiro' }, update: {}, create: { name: 'Financeiro', code: 'FIN' } }),
    prisma.department.upsert({ where: { name: 'Recursos Humanos' }, update: {}, create: { name: 'Recursos Humanos', code: 'RH' } }),
    prisma.department.upsert({ where: { name: 'Operações' }, update: {}, create: { name: 'Operações', code: 'OPS' } }),
  ])
  const [deptTI, deptADM, deptFIN, deptRH, deptOPS] = departments
  console.log('✅ Departamentos criados')

  // ─── Usuários ────────────────────────────────────────────────
  const hash = (pw: string) => bcrypt.hashSync(pw, 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@helpdesk.local' }, update: {},
    create: { name: 'Admin TI', email: 'admin@helpdesk.local', passwordHash: hash('admin123'), role: UserRole.ADMIN, departmentId: deptTI.id },
  })
  const tecnico1 = await prisma.user.upsert({
    where: { email: 'tecnico1@helpdesk.local' }, update: {},
    create: { name: 'João Técnico', email: 'tecnico1@helpdesk.local', passwordHash: hash('tecnico123'), role: UserRole.TECNICO, departmentId: deptTI.id },
  })
  const tecnico2 = await prisma.user.upsert({
    where: { email: 'tecnico2@helpdesk.local' }, update: {},
    create: { name: 'Maria Técnica', email: 'tecnico2@helpdesk.local', passwordHash: hash('tecnico123'), role: UserRole.TECNICO, departmentId: deptTI.id },
  })
  const auxiliarTI = await prisma.user.upsert({
    where: { email: 'auxiliar@helpdesk.local' }, update: {},
    create: { name: 'Carlos Auxiliar TI', email: 'auxiliar@helpdesk.local', passwordHash: hash('auxiliar123'), role: UserRole.AUXILIAR_TI, departmentId: deptADM.id },
  })
  const colab1 = await prisma.user.upsert({
    where: { email: 'colaborador1@helpdesk.local' }, update: {},
    create: { name: 'Ana Colaboradora', email: 'colaborador1@helpdesk.local', passwordHash: hash('colab123'), role: UserRole.COLABORADOR, departmentId: deptADM.id },
  })
  const colab2 = await prisma.user.upsert({
    where: { email: 'colaborador2@helpdesk.local' }, update: {},
    create: { name: 'Pedro Colaborador', email: 'colaborador2@helpdesk.local', passwordHash: hash('colab123'), role: UserRole.COLABORADOR, departmentId: deptFIN.id },
  })
  const colab3 = await prisma.user.upsert({
    where: { email: 'colaborador3@helpdesk.local' }, update: {},
    create: { name: 'Fernanda RH', email: 'colaborador3@helpdesk.local', passwordHash: hash('colab123'), role: UserRole.COLABORADOR, departmentId: deptRH.id },
  })
  const colab4 = await prisma.user.upsert({
    where: { email: 'colaborador4@helpdesk.local' }, update: {},
    create: { name: 'Ricardo Operações', email: 'colaborador4@helpdesk.local', passwordHash: hash('colab123'), role: UserRole.COLABORADOR, departmentId: deptOPS.id },
  })
  console.log('✅ Usuários criados')

  // ─── Categorias de Ticket ────────────────────────────────────
  const ticketCategories = await Promise.all([
    prisma.ticketCategory.upsert({ where: { name: 'Troca de Equipamentos' }, update: {}, create: { name: 'Troca de Equipamentos', description: 'Solicitação de troca de equipamento (computador, monitor, teclado, etc.)', requiresMovement: true, icon: 'monitor', sortOrder: 1 } }),
    prisma.ticketCategory.upsert({ where: { name: 'Email' }, update: {}, create: { name: 'Email', description: 'Problemas com conta de email, configuração, acesso.', requiresMovement: false, icon: 'mail', sortOrder: 2 } }),
    prisma.ticketCategory.upsert({ where: { name: 'Internet / Rede' }, update: {}, create: { name: 'Internet / Rede', description: 'Problemas de conectividade, lentidão, sem acesso à rede.', requiresMovement: false, icon: 'wifi', sortOrder: 3 } }),
    prisma.ticketCategory.upsert({ where: { name: 'Windows' }, update: {}, create: { name: 'Windows', description: 'Problemas com sistema operacional Windows.', requiresMovement: false, icon: 'laptop', sortOrder: 4 } }),
    prisma.ticketCategory.upsert({ where: { name: 'Programas' }, update: {}, create: { name: 'Programas', description: 'Instalação, atualização ou problemas com softwares.', requiresMovement: false, icon: 'app-window', sortOrder: 5 } }),
    prisma.ticketCategory.upsert({ where: { name: 'Solicitação / Devolução de Equipamento' }, update: {}, create: { name: 'Solicitação / Devolução de Equipamento', description: 'Empréstimo ou devolução de equipamento patrimonial.', requiresMovement: true, icon: 'package', sortOrder: 6 } }),
    prisma.ticketCategory.upsert({ where: { name: 'Ar Condicionado' }, update: {}, create: { name: 'Ar Condicionado', description: 'Manutenção ou problemas com ar condicionado.', requiresMovement: false, icon: 'thermometer', sortOrder: 7 } }),
    prisma.ticketCategory.upsert({ where: { name: 'Outros' }, update: {}, create: { name: 'Outros', description: 'Solicitações diversas não contempladas nas categorias acima.', requiresMovement: false, icon: 'help-circle', sortOrder: 8 } }),
  ])
  const [catTroca, catEmail, catRede, catWindows, catProgramas, catSolicitacao, catAr, catOutros] = ticketCategories
  console.log('✅ Categorias de ticket criadas')

  // ─── Políticas de SLA ────────────────────────────────────────
  await Promise.all([
    prisma.slaPolicy.upsert({ where: { id: 'sla-urgent' }, update: {}, create: { id: 'sla-urgent', name: 'SLA Urgente', priority: TicketPriority.URGENT, responseMinutes: 30, resolutionMinutes: 240 } }),
    prisma.slaPolicy.upsert({ where: { id: 'sla-high' }, update: {}, create: { id: 'sla-high', name: 'SLA Alta', priority: TicketPriority.HIGH, responseMinutes: 60, resolutionMinutes: 480 } }),
    prisma.slaPolicy.upsert({ where: { id: 'sla-medium' }, update: {}, create: { id: 'sla-medium', name: 'SLA Média', priority: TicketPriority.MEDIUM, responseMinutes: 120, resolutionMinutes: 1440 } }),
    prisma.slaPolicy.upsert({ where: { id: 'sla-low' }, update: {}, create: { id: 'sla-low', name: 'SLA Baixa', priority: TicketPriority.LOW, responseMinutes: 240, resolutionMinutes: 4320 } }),
  ])
  console.log('✅ Políticas de SLA criadas')

  // ─── Categorias de Ativo ─────────────────────────────────────
  const assetCategories = await Promise.all([
    prisma.assetCategory.upsert({ where: { name: 'Notebook' }, update: {}, create: { name: 'Notebook', icon: 'laptop' } }),
    prisma.assetCategory.upsert({ where: { name: 'Desktop' }, update: {}, create: { name: 'Desktop', icon: 'monitor' } }),
    prisma.assetCategory.upsert({ where: { name: 'Monitor' }, update: {}, create: { name: 'Monitor', icon: 'monitor' } }),
    prisma.assetCategory.upsert({ where: { name: 'Impressora' }, update: {}, create: { name: 'Impressora', icon: 'printer' } }),
    prisma.assetCategory.upsert({ where: { name: 'Teclado' }, update: {}, create: { name: 'Teclado', icon: 'keyboard' } }),
    prisma.assetCategory.upsert({ where: { name: 'Mouse' }, update: {}, create: { name: 'Mouse', icon: 'mouse-pointer' } }),
    prisma.assetCategory.upsert({ where: { name: 'Headset' }, update: {}, create: { name: 'Headset', icon: 'headphones' } }),
    prisma.assetCategory.upsert({ where: { name: 'Nobreak / UPS' }, update: {}, create: { name: 'Nobreak / UPS', icon: 'battery' } }),
    prisma.assetCategory.upsert({ where: { name: 'Switch / Roteador' }, update: {}, create: { name: 'Switch / Roteador', icon: 'network' } }),
    prisma.assetCategory.upsert({ where: { name: 'Celular' }, update: {}, create: { name: 'Celular', icon: 'smartphone' } }),
    prisma.assetCategory.upsert({ where: { name: 'Outros' }, update: {}, create: { name: 'Outros', icon: 'package' } }),
  ])
  const [catNotebook, catDesktop, catMonitor, catImpressora, catTeclado, catMouse, catHeadset, catNobreak, catSwitch, catCelular] = assetCategories
  console.log('✅ Categorias de ativo criadas')

  // ─── Ativos ──────────────────────────────────────────────────
  const assets = await Promise.all([
    prisma.asset.upsert({ where: { tag: 'PAT-0001' }, update: {}, create: { tag: 'PAT-0001', name: 'Dell Latitude 5520', categoryId: catNotebook.id, status: AssetStatus.DEPLOYED, assignedToUserId: colab1.id, location: 'Administrativo - Mesa 05', serialNumber: 'DL5520-BR001', acquisitionDate: new Date('2022-03-15'), warrantyUntil: new Date('2025-03-15'), acquisitionCost: 4800, currentValue: 2800, ramGb: 8, storageType: 'SSD_SATA', storageGb: 256, cpuBrand: 'INTEL', cpuModel: 'Core i5-1135G7', cpuGeneration: 11, performanceScore: 60, performanceLabel: 'INTERMEDIARIO', performanceNotes: 'RAM abaixo do ideal (8GB). SSD SATA ok. Substituição de RAM recomendada.' } }),
    prisma.asset.upsert({ where: { tag: 'PAT-0002' }, update: {}, create: { tag: 'PAT-0002', name: 'Lenovo ThinkPad X1 Carbon', categoryId: catNotebook.id, status: AssetStatus.STOCK, location: 'Almoxarifado TI', serialNumber: 'TP-X1C-BR002', acquisitionDate: new Date('2023-06-01'), warrantyUntil: new Date('2026-06-01'), acquisitionCost: 8500, currentValue: 7200, ramGb: 16, storageType: 'SSD_NVME', storageGb: 512, cpuBrand: 'INTEL', cpuModel: 'Core i7-1265U', cpuGeneration: 12, performanceScore: 88, performanceLabel: 'BOM', performanceNotes: 'Excelente configuração. NVMe + 16GB RAM + CPU recente.' } }),
    prisma.asset.upsert({ where: { tag: 'PAT-0003' }, update: {}, create: { tag: 'PAT-0003', name: 'HP Compaq 6200 Pro', categoryId: catDesktop.id, status: AssetStatus.DEPLOYED, assignedToUserId: colab2.id, location: 'Financeiro - Sala 2', serialNumber: 'HP6200-BR003', acquisitionDate: new Date('2014-08-10'), acquisitionCost: 1800, currentValue: 100, ramGb: 4, storageType: 'HDD', storageGb: 500, cpuBrand: 'INTEL', cpuModel: 'Core i3-2120', cpuGeneration: 2, performanceScore: 8, performanceLabel: 'RUIM', performanceNotes: 'RAM insuficiente (4GB). HDD muito lento. CPU extremamente antiga (2ª geração). Substituição urgente.' } }),
    prisma.asset.upsert({ where: { tag: 'PAT-0004' }, update: {}, create: { tag: 'PAT-0004', name: 'Dell OptiPlex 7090', categoryId: catDesktop.id, status: AssetStatus.DEPLOYED, assignedToUserId: colab3.id, location: 'RH - Mesa 03', serialNumber: 'OPX7090-BR004', acquisitionDate: new Date('2022-11-20'), warrantyUntil: new Date('2025-11-20'), acquisitionCost: 3900, currentValue: 3000, ramGb: 16, storageType: 'SSD_NVME', storageGb: 256, cpuBrand: 'INTEL', cpuModel: 'Core i5-10500', cpuGeneration: 10, performanceScore: 72, performanceLabel: 'BOM', performanceNotes: 'Boa performance para tarefas do dia a dia. NVMe garante agilidade.' } }),
    prisma.asset.upsert({ where: { tag: 'PAT-0005' }, update: {}, create: { tag: 'PAT-0005', name: 'Acer Aspire 5', categoryId: catNotebook.id, status: AssetStatus.MAINTENANCE, location: 'Bancada TI', serialNumber: 'ACR-A5-BR005', acquisitionDate: new Date('2020-05-12'), acquisitionCost: 3200, currentValue: 900, ramGb: 8, storageType: 'SSD_SATA', storageGb: 256, cpuBrand: 'AMD', cpuModel: 'Ryzen 5 3500U', cpuGeneration: 3, performanceScore: 50, performanceLabel: 'INTERMEDIARIO', performanceNotes: 'Em manutenção — teclado com defeito. Performance razoável para o ano.' } }),
    prisma.asset.upsert({ where: { tag: 'PAT-0006' }, update: {}, create: { tag: 'PAT-0006', name: 'Samsung 24" FHD', categoryId: catMonitor.id, status: AssetStatus.DEPLOYED, assignedToUserId: colab1.id, location: 'Administrativo - Mesa 05', serialNumber: 'SAM24-BR006', acquisitionDate: new Date('2022-03-15'), warrantyUntil: new Date('2025-03-15'), acquisitionCost: 900, currentValue: 550, notes: 'Monitor secundário da Ana Colaboradora.' } }),
    prisma.asset.upsert({ where: { tag: 'PAT-0007' }, update: {}, create: { tag: 'PAT-0007', name: 'HP LaserJet Pro M404n', categoryId: catImpressora.id, status: AssetStatus.DEPLOYED, location: 'Administrativo - Corredor', serialNumber: 'HPLJ-BR007', acquisitionDate: new Date('2021-09-01'), warrantyUntil: new Date('2024-09-01'), acquisitionCost: 2100, currentValue: 1200, notes: 'Impressora compartilhada do setor administrativo.' } }),
    prisma.asset.upsert({ where: { tag: 'PAT-0008' }, update: {}, create: { tag: 'PAT-0008', name: 'Nobreak APC 1500VA', categoryId: catNobreak.id, status: AssetStatus.DEPLOYED, location: 'Sala de Servidores', serialNumber: 'APC1500-BR008', acquisitionDate: new Date('2020-01-10'), acquisitionCost: 1400, currentValue: 700, notes: 'Proteção do servidor principal. Bateria trocada em 2023.' } }),
    prisma.asset.upsert({ where: { tag: 'PAT-0009' }, update: {}, create: { tag: 'PAT-0009', name: 'Switch TP-Link 24p Gigabit', categoryId: catSwitch.id, status: AssetStatus.DEPLOYED, location: 'Rack - Sala de TI', serialNumber: 'TPLINK24-BR009', acquisitionDate: new Date('2021-04-15'), warrantyUntil: new Date('2024-04-15'), acquisitionCost: 1800, currentValue: 1200, notes: 'Switch principal da rede corporativa.' } }),
    prisma.asset.upsert({ where: { tag: 'PAT-0010' }, update: {}, create: { tag: 'PAT-0010', name: 'iPhone 13 Pro', categoryId: catCelular.id, status: AssetStatus.DEPLOYED, assignedToUserId: admin.id, location: 'TI', serialNumber: 'IPH13P-BR010', acquisitionDate: new Date('2022-02-01'), warrantyUntil: new Date('2024-02-01'), acquisitionCost: 7800, currentValue: 5000, notes: 'Celular corporativo do gestor de TI.' } }),
    prisma.asset.upsert({ where: { tag: 'PAT-0011' }, update: {}, create: { tag: 'PAT-0011', name: 'Dell Latitude 3420', categoryId: catNotebook.id, status: AssetStatus.DEPLOYED, assignedToUserId: colab4.id, location: 'Operações - Mesa 01', serialNumber: 'DL3420-BR011', acquisitionDate: new Date('2023-01-10'), warrantyUntil: new Date('2026-01-10'), acquisitionCost: 3600, currentValue: 3100, ramGb: 8, storageType: 'SSD_SATA', storageGb: 256, cpuBrand: 'INTEL', cpuModel: 'Core i5-1135G7', cpuGeneration: 11, performanceScore: 58, performanceLabel: 'INTERMEDIARIO', performanceNotes: 'Configuração básica. Adequada para tarefas de escritório.' } }),
    prisma.asset.upsert({ where: { tag: 'PAT-0012' }, update: {}, create: { tag: 'PAT-0012', name: 'HP EliteBook 840 G8', categoryId: catNotebook.id, status: AssetStatus.STOCK, location: 'Almoxarifado TI', serialNumber: 'HPEB840-BR012', acquisitionDate: new Date('2023-08-22'), warrantyUntil: new Date('2026-08-22'), acquisitionCost: 6200, currentValue: 5500, ramGb: 16, storageType: 'SSD_NVME', storageGb: 512, cpuBrand: 'INTEL', cpuModel: 'Core i7-1165G7', cpuGeneration: 11, performanceScore: 82, performanceLabel: 'BOM', performanceNotes: 'Alto desempenho. Disponível para entrega a novo colaborador.' } }),
    prisma.asset.upsert({ where: { tag: 'PAT-0013' }, update: {}, create: { tag: 'PAT-0013', name: 'LG 27" 4K UHD', categoryId: catMonitor.id, status: AssetStatus.STOCK, location: 'Almoxarifado TI', serialNumber: 'LG27-BR013', acquisitionDate: new Date('2023-03-05'), warrantyUntil: new Date('2026-03-05'), acquisitionCost: 2800, currentValue: 2500, notes: 'Monitor premium aguardando alocação.' } }),
    prisma.asset.upsert({ where: { tag: 'PAT-0014' }, update: {}, create: { tag: 'PAT-0014', name: 'Positivo Master D570', categoryId: catDesktop.id, status: AssetStatus.RETIRED, location: 'Depósito TI', serialNumber: 'POS-D570-BR014', acquisitionDate: new Date('2013-05-20'), acquisitionCost: 1600, currentValue: 0, ramGb: 4, storageType: 'HDD', storageGb: 320, cpuBrand: 'INTEL', cpuModel: 'Core i3-3220', cpuGeneration: 3, performanceScore: 5, performanceLabel: 'RUIM', performanceNotes: 'Desativado. Hardware obsoleto. Aguardando descarte.' } }),
    prisma.asset.upsert({ where: { tag: 'PAT-0015' }, update: {}, create: { tag: 'PAT-0015', name: 'Headset Jabra Evolve 65', categoryId: catHeadset.id, status: AssetStatus.DEPLOYED, assignedToUserId: tecnico1.id, location: 'TI - Mesa João', serialNumber: 'JAB65-BR015', acquisitionDate: new Date('2022-07-11'), warrantyUntil: new Date('2024-07-11'), acquisitionCost: 1200, currentValue: 750, notes: 'Headset Bluetooth corporativo.' } }),
  ])
  console.log('✅ Ativos criados')

  // ─── Função para gerar código de ticket ──────────────────────
  let ticketCounter = 0
  const nextCode = () => {
    ticketCounter++
    return `HD-2026-${String(ticketCounter).padStart(6, '0')}`
  }

  // ─── Helper para criar ticket com mensagens e eventos ────────
  async function createTicket(data: {
    code: string
    title: string
    description: string
    priority: TicketPriority
    status: TicketStatus
    categoryId: string
    requesterId: string
    assigneeId?: string
    departmentId: string
    messages?: { authorId: string; body: string; internal?: boolean; daysAgo?: number }[]
    events?: { actorId: string; type: TicketEventType; payload?: object; daysAgo?: number }[]
    daysAgo?: number
  }) {
    const createdAt = new Date(Date.now() - (data.daysAgo ?? 0) * 86400000)

    // Check if ticket already exists
    const existing = await prisma.ticket.findUnique({ where: { code: data.code } })
    if (existing) return existing

    const isClosed = data.status === TicketStatus.DONE || data.status === TicketStatus.CANCELED
    const closedAt = isClosed ? new Date(createdAt.getTime() + 3600000) : null // closed ~1h after creation

    const ticket = await prisma.ticket.create({
      data: {
        code: data.code,
        title: data.title,
        description: data.description,
        priority: data.priority,
        status: data.status,
        categoryId: data.categoryId,
        requesterId: data.requesterId,
        assigneeId: data.assigneeId,
        departmentId: data.departmentId,
        createdAt,
        updatedAt: createdAt,
        closedAt,
      },
    })

    if (data.events) {
      for (const ev of data.events) {
        const evDate = new Date(Date.now() - (ev.daysAgo ?? 0) * 86400000)
        await prisma.ticketEvent.create({
          data: { ticketId: ticket.id, actorId: ev.actorId, type: ev.type, payload: ev.payload ?? {}, createdAt: evDate },
        })
      }
    }

    if (data.messages) {
      for (const msg of data.messages) {
        const msgDate = new Date(Date.now() - (msg.daysAgo ?? 0) * 86400000)
        await prisma.ticketMessage.create({
          data: { ticketId: ticket.id, authorId: msg.authorId, body: msg.body, internal: msg.internal ?? false, createdAt: msgDate },
        })
      }
    }

    return ticket
  }

  // ─── Chamados ─────────────────────────────────────────────────

  // 1. Aberto, sem atribuição
  await createTicket({
    code: nextCode(), title: 'Computador não liga', description: 'Meu computador não está ligando desde esta manhã. Aperto o botão de power mas nada acontece. Já verifiquei o cabo de energia e está conectado.', priority: TicketPriority.HIGH, status: TicketStatus.OPEN, categoryId: catTroca.id, requesterId: colab1.id, departmentId: deptADM.id, daysAgo: 1,
    events: [{ actorId: colab1.id, type: TicketEventType.CREATED, daysAgo: 1 }],
  })

  // 2. Em andamento, atribuído ao técnico
  await createTicket({
    code: nextCode(), title: 'Lentidão extrema no sistema', description: 'O computador está muito lento para abrir qualquer programa. Leva mais de 5 minutos para iniciar o Windows. Já tentei reiniciar várias vezes sem sucesso.', priority: TicketPriority.MEDIUM, status: TicketStatus.IN_PROGRESS, categoryId: catWindows.id, requesterId: colab2.id, assigneeId: tecnico1.id, departmentId: deptFIN.id, daysAgo: 3,
    events: [
      { actorId: colab2.id, type: TicketEventType.CREATED, daysAgo: 3 },
      { actorId: tecnico1.id, type: TicketEventType.ASSIGNED, payload: { assigneeId: tecnico1.id }, daysAgo: 2 },
      { actorId: tecnico1.id, type: TicketEventType.STATUS_CHANGED, payload: { from: 'OPEN', to: 'IN_PROGRESS' }, daysAgo: 2 },
    ],
    messages: [
      { authorId: tecnico1.id, body: 'Olá Pedro, já analisei o chamado. O computador PAT-0003 tem HD muito antigo e apenas 4GB de RAM, o que explica a lentidão extrema. Vou verificar se há equipamento disponível para substituição.', daysAgo: 2 },
      { authorId: tecnico1.id, body: 'Verificado: temos um HD SSD disponível no estoque. Vou agendar a troca para amanhã pela manhã.', internal: true, daysAgo: 1 },
      { authorId: colab2.id, body: 'Ok, estarei disponível a partir das 8h. Obrigado!', daysAgo: 1 },
    ],
  })

  // 3. Resolvido
  await createTicket({
    code: nextCode(), title: 'Sem acesso ao email corporativo', description: 'Não consigo acessar meu email. Aparece uma mensagem de erro "credenciais inválidas" mesmo com a senha correta.', priority: TicketPriority.HIGH, status: TicketStatus.RESOLVED, categoryId: catEmail.id, requesterId: colab3.id, assigneeId: tecnico2.id, departmentId: deptRH.id, daysAgo: 7,
    events: [
      { actorId: colab3.id, type: TicketEventType.CREATED, daysAgo: 7 },
      { actorId: tecnico2.id, type: TicketEventType.ASSIGNED, payload: { assigneeId: tecnico2.id }, daysAgo: 7 },
      { actorId: tecnico2.id, type: TicketEventType.STATUS_CHANGED, payload: { from: 'OPEN', to: 'IN_PROGRESS' }, daysAgo: 6 },
      { actorId: tecnico2.id, type: TicketEventType.STATUS_CHANGED, payload: { from: 'IN_PROGRESS', to: 'RESOLVED' }, daysAgo: 6 },
    ],
    messages: [
      { authorId: tecnico2.id, body: 'Fernanda, identifiquei o problema. Sua conta expirou por inatividade. Vou reativá-la agora.', daysAgo: 6 },
      { authorId: tecnico2.id, body: 'Conta reativada! Você deve conseguir acessar agora. Caso o problema persista, me avise.', daysAgo: 6 },
      { authorId: colab3.id, body: 'Funcionou! Muito obrigada Maria, acesso normalizado.', daysAgo: 6 },
    ],
  })

  // 4. Urgente, aberto hoje
  await createTicket({
    code: nextCode(), title: 'Servidor de arquivos inacessível', description: 'O servidor de arquivos compartilhados está fora do ar. Toda a equipe de operações não consegue acessar os documentos necessários para o trabalho. Situação crítica.', priority: TicketPriority.URGENT, status: TicketStatus.IN_PROGRESS, categoryId: catRede.id, requesterId: colab4.id, assigneeId: admin.id, departmentId: deptOPS.id, daysAgo: 0,
    events: [
      { actorId: colab4.id, type: TicketEventType.CREATED, daysAgo: 0 },
      { actorId: admin.id, type: TicketEventType.ASSIGNED, payload: { assigneeId: admin.id }, daysAgo: 0 },
      { actorId: admin.id, type: TicketEventType.STATUS_CHANGED, payload: { from: 'OPEN', to: 'IN_PROGRESS' }, daysAgo: 0 },
    ],
    messages: [
      { authorId: admin.id, body: 'Chamado recebido com prioridade máxima. Já estou verificando o servidor. Identificado: serviço SMB parou após atualização automática.', daysAgo: 0 },
      { authorId: admin.id, body: 'Reiniciando o serviço. Aguardem aproximadamente 5 minutos.', daysAgo: 0 },
    ],
  })

  // 5. Em espera
  await createTicket({
    code: nextCode(), title: 'Instalação do Office 365', description: 'Preciso do Microsoft Office instalado no meu computador para realizar as planilhas do departamento financeiro. Atualmente estou usando o LibreOffice mas há incompatibilidades com os arquivos recebidos.', priority: TicketPriority.LOW, status: TicketStatus.ON_HOLD, categoryId: catProgramas.id, requesterId: colab2.id, assigneeId: tecnico1.id, departmentId: deptFIN.id, daysAgo: 5,
    events: [
      { actorId: colab2.id, type: TicketEventType.CREATED, daysAgo: 5 },
      { actorId: tecnico1.id, type: TicketEventType.ASSIGNED, payload: { assigneeId: tecnico1.id }, daysAgo: 4 },
      { actorId: tecnico1.id, type: TicketEventType.STATUS_CHANGED, payload: { from: 'OPEN', to: 'ON_HOLD' }, daysAgo: 4 },
    ],
    messages: [
      { authorId: tecnico1.id, body: 'Olá Pedro, recebemos a solicitação. A licença do Office 365 precisa ser aprovada pelo gestor financeiro. Já enviei o pedido para aprovação.', daysAgo: 4 },
      { authorId: tecnico1.id, body: 'Aguardando resposta do setor de compras sobre disponibilidade de licença.', internal: true, daysAgo: 3 },
    ],
  })

  // 6. Aberto, prioridade média
  await createTicket({
    code: nextCode(), title: 'Internet lenta no setor de RH', description: 'A internet no setor de RH está muito lenta desde segunda-feira. Download muito baixo, impossível fazer videoconferências. O restante do prédio parece estar normal.', priority: TicketPriority.MEDIUM, status: TicketStatus.OPEN, categoryId: catRede.id, requesterId: colab3.id, departmentId: deptRH.id, daysAgo: 2,
    events: [{ actorId: colab3.id, type: TicketEventType.CREATED, daysAgo: 2 }],
  })

  // 7. Fechado/Cancelado
  await createTicket({
    code: nextCode(), title: 'Troca de mouse com defeito', description: 'O scroll do meu mouse não está funcionando corretamente. Rola para cima sozinho às vezes.', priority: TicketPriority.LOW, status: TicketStatus.CLOSED, categoryId: catTroca.id, requesterId: colab1.id, assigneeId: tecnico2.id, departmentId: deptADM.id, daysAgo: 14,
    events: [
      { actorId: colab1.id, type: TicketEventType.CREATED, daysAgo: 14 },
      { actorId: tecnico2.id, type: TicketEventType.ASSIGNED, payload: { assigneeId: tecnico2.id }, daysAgo: 13 },
      { actorId: tecnico2.id, type: TicketEventType.STATUS_CHANGED, payload: { from: 'OPEN', to: 'RESOLVED' }, daysAgo: 13 },
      { actorId: colab1.id, type: TicketEventType.STATUS_CHANGED, payload: { from: 'RESOLVED', to: 'CLOSED' }, daysAgo: 12 },
    ],
    messages: [
      { authorId: tecnico2.id, body: 'Troca realizada! Separei um mouse novo do estoque (PAT-0006 reserva). Vou passar na sua mesa para entregar.', daysAgo: 13 },
      { authorId: colab1.id, body: 'Recebido, obrigada! Está funcionando perfeitamente.', daysAgo: 12 },
    ],
  })

  // 8. Urgente resolvido
  await createTicket({
    code: nextCode(), title: 'Ransomware detectado em estação de trabalho', description: 'O antivírus alertou sobre uma ameaça de ransomware no computador da sala de reuniões. O equipamento foi isolado da rede imediatamente. Necessita análise urgente.', priority: TicketPriority.URGENT, status: TicketStatus.RESOLVED, categoryId: catWindows.id, requesterId: auxiliarTI.id, assigneeId: admin.id, departmentId: deptTI.id, daysAgo: 10,
    events: [
      { actorId: auxiliarTI.id, type: TicketEventType.CREATED, daysAgo: 10 },
      { actorId: admin.id, type: TicketEventType.ASSIGNED, payload: { assigneeId: admin.id }, daysAgo: 10 },
      { actorId: admin.id, type: TicketEventType.STATUS_CHANGED, payload: { from: 'OPEN', to: 'IN_PROGRESS' }, daysAgo: 10 },
      { actorId: admin.id, type: TicketEventType.STATUS_CHANGED, payload: { from: 'IN_PROGRESS', to: 'RESOLVED' }, daysAgo: 9 },
    ],
    messages: [
      { authorId: admin.id, body: 'Análise concluída. Falso positivo confirmado — o antivírus interpretou um script legítimo de atualização como ameaça. Equipamento limpo, reconectado à rede.', daysAgo: 9 },
      { authorId: admin.id, body: 'Atualizada a regra de exceção no antivírus para o script de atualização. Relatório de incidente gerado.', internal: true, daysAgo: 9 },
    ],
  })

  // 9. Em andamento, técnico 2
  await createTicket({
    code: nextCode(), title: 'Configurar impressora HP no setor ADM', description: 'A impressora HP LaserJet Pro M404n (PAT-0007) parou de aparecer na rede. Nenhum computador do setor administrativo consegue imprimir.', priority: TicketPriority.MEDIUM, status: TicketStatus.IN_PROGRESS, categoryId: catProgramas.id, requesterId: colab1.id, assigneeId: tecnico2.id, departmentId: deptADM.id, daysAgo: 1,
    events: [
      { actorId: colab1.id, type: TicketEventType.CREATED, daysAgo: 1 },
      { actorId: tecnico2.id, type: TicketEventType.ASSIGNED, payload: { assigneeId: tecnico2.id }, daysAgo: 1 },
      { actorId: tecnico2.id, type: TicketEventType.STATUS_CHANGED, payload: { from: 'OPEN', to: 'IN_PROGRESS' }, daysAgo: 0 },
    ],
    messages: [
      { authorId: tecnico2.id, body: 'Verificando: a impressora perdeu o IP após reinicialização do roteador. Configurando IP fixo para evitar o problema novamente.', daysAgo: 0 },
    ],
  })

  // 10. Aberto, baixa prioridade
  await createTicket({
    code: nextCode(), title: 'Solicitar webcam para home office', description: 'Preciso de uma webcam para participar das videoconferências quando estiver trabalhando em home office. O notebook não possui câmera integrada de boa qualidade.', priority: TicketPriority.LOW, status: TicketStatus.OPEN, categoryId: catSolicitacao.id, requesterId: colab4.id, departmentId: deptOPS.id, daysAgo: 3,
    events: [{ actorId: colab4.id, type: TicketEventType.CREATED, daysAgo: 3 }],
  })

  // 11. Alta prioridade, atribuído
  await createTicket({
    code: nextCode(), title: 'Notebook não conecta ao Wi-Fi corporativo', description: 'Meu notebook Dell Latitude 3420 (PAT-0011) não aparece mais a rede Wi-Fi corporativa. Outras redes aparecem normalmente. O problema começou após uma atualização do Windows.', priority: TicketPriority.HIGH, status: TicketStatus.IN_PROGRESS, categoryId: catRede.id, requesterId: colab4.id, assigneeId: tecnico1.id, departmentId: deptOPS.id, daysAgo: 2,
    events: [
      { actorId: colab4.id, type: TicketEventType.CREATED, daysAgo: 2 },
      { actorId: tecnico1.id, type: TicketEventType.ASSIGNED, payload: { assigneeId: tecnico1.id }, daysAgo: 2 },
      { actorId: tecnico1.id, type: TicketEventType.STATUS_CHANGED, payload: { from: 'OPEN', to: 'IN_PROGRESS' }, daysAgo: 1 },
    ],
    messages: [
      { authorId: tecnico1.id, body: 'Ricardo, verifiquei remotamente. O driver da placa Wi-Fi foi corrompido na atualização KB5034441. Vou reinstalar o driver correto.', daysAgo: 1 },
      { authorId: colab4.id, body: 'Ok, aguardando. Estou usando cabo de rede por enquanto.', daysAgo: 1 },
    ],
  })

  // 12. Resolvido, Ar Condicionado
  await createTicket({
    code: nextCode(), title: 'Ar condicionado da sala de servidores desligou', description: 'O ar condicionado da sala de servidores parou de funcionar. A temperatura está subindo e pode danificar os equipamentos. Situação crítica.', priority: TicketPriority.URGENT, status: TicketStatus.CLOSED, categoryId: catAr.id, requesterId: admin.id, assigneeId: admin.id, departmentId: deptTI.id, daysAgo: 20,
    events: [
      { actorId: admin.id, type: TicketEventType.CREATED, daysAgo: 20 },
      { actorId: admin.id, type: TicketEventType.STATUS_CHANGED, payload: { from: 'OPEN', to: 'RESOLVED' }, daysAgo: 20 },
      { actorId: admin.id, type: TicketEventType.STATUS_CHANGED, payload: { from: 'RESOLVED', to: 'CLOSED' }, daysAgo: 19 },
    ],
    messages: [
      { authorId: admin.id, body: 'Acionada equipe de manutenção predial em emergência. Servidores críticos desligados preventivamente. Temperatura controlada com ventiladores portáteis.', daysAgo: 20 },
      { authorId: admin.id, body: 'Manutenção concluída — capacitor do compressor substituído. Ar condicionado operacional. Servidores religados, todos normais.', daysAgo: 19 },
    ],
  })

  // 13. Aberto, médio
  await createTicket({
    code: nextCode(), title: 'Erro ao abrir planilha Excel "Orçamento 2026"', description: 'Ao tentar abrir o arquivo "Orçamento_2026.xlsx" aparece o erro "O arquivo está corrompido e não pode ser aberto". O arquivo estava funcionando ontem.', priority: TicketPriority.MEDIUM, status: TicketStatus.OPEN, categoryId: catProgramas.id, requesterId: colab2.id, departmentId: deptFIN.id, daysAgo: 0,
    events: [{ actorId: colab2.id, type: TicketEventType.CREATED, daysAgo: 0 }],
  })

  // 14. Solicitação de equipamento, em andamento
  await createTicket({
    code: nextCode(), title: 'Solicitação de notebook para novo colaborador', description: 'Novo colaborador inicia na segunda-feira no departamento de RH. Necessário provisionar notebook, acesso ao email corporativo e configuração de acesso aos sistemas.', priority: TicketPriority.HIGH, status: TicketStatus.IN_PROGRESS, categoryId: catSolicitacao.id, requesterId: colab3.id, assigneeId: tecnico2.id, departmentId: deptRH.id, daysAgo: 4,
    events: [
      { actorId: colab3.id, type: TicketEventType.CREATED, daysAgo: 4 },
      { actorId: tecnico2.id, type: TicketEventType.ASSIGNED, payload: { assigneeId: tecnico2.id }, daysAgo: 3 },
      { actorId: tecnico2.id, type: TicketEventType.STATUS_CHANGED, payload: { from: 'OPEN', to: 'IN_PROGRESS' }, daysAgo: 3 },
    ],
    messages: [
      { authorId: tecnico2.id, body: 'Separei o HP EliteBook 840 G8 (PAT-0012) para este colaborador. Excelente equipamento, 16GB RAM + NVMe. Vou iniciar a configuração.', internal: true, daysAgo: 3 },
      { authorId: tecnico2.id, body: 'Fernanda, já tenho o notebook separado e configurado com Windows 11 e aplicativos padrão. Faltam apenas as credenciais do novo colaborador. Pode me enviar o nome completo e cargo?', daysAgo: 2 },
      { authorId: colab3.id, body: 'Claro! Será Lucas Mendes, Analista de RH Jr. Obrigada pela agilidade!', daysAgo: 2 },
    ],
  })

  // 15. Baixa prioridade, outros
  await createTicket({
    code: nextCode(), title: 'Solicitar segundo monitor para estação de trabalho', description: 'Para aumentar a produtividade no desenvolvimento de planilhas e relatórios, solicito um segundo monitor para minha estação de trabalho. Já verificado que meu notebook possui saída HDMI disponível.', priority: TicketPriority.LOW, status: TicketStatus.OPEN, categoryId: catOutros.id, requesterId: colab2.id, departmentId: deptFIN.id, daysAgo: 1,
    events: [{ actorId: colab2.id, type: TicketEventType.CREATED, daysAgo: 1 }],
  })

  console.log('✅ Chamados de exemplo criados (15)')

  console.log('\n🎉 Seed concluído com sucesso!\n')
  console.log('📋 Usuários de acesso:')
  console.log('  admin@helpdesk.local        / admin123    (ADMIN)')
  console.log('  tecnico1@helpdesk.local     / tecnico123  (TÉCNICO)')
  console.log('  tecnico2@helpdesk.local     / tecnico123  (TÉCNICO)')
  console.log('  auxiliar@helpdesk.local     / auxiliar123 (AUXILIAR TI)')
  console.log('  colaborador1@helpdesk.local / colab123    (COLABORADOR)')
  console.log('  colaborador2@helpdesk.local / colab123    (COLABORADOR)')
  console.log('  colaborador3@helpdesk.local / colab123    (COLABORADOR - RH)')
  console.log('  colaborador4@helpdesk.local / colab123    (COLABORADOR - Operações)')
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
