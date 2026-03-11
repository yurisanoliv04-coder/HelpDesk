import { CpuBrand, PerformanceLabel, StorageType } from '@prisma/client'

interface ComputerSpecs {
  ramGb?: number | null
  storageType?: StorageType | null
  cpuBrand?: CpuBrand | null
  cpuModel?: string | null
  cpuGeneration?: number | null
}

interface ScoreResult {
  score: number
  label: PerformanceLabel
  notes: string[]
}

export function scoreComputer(specs: ComputerSpecs): ScoreResult | null {
  if (!specs.ramGb && !specs.storageType && !specs.cpuModel) {
    return null // sem dados
  }

  let score = 0
  const notes: string[] = []

  // ── RAM ──────────────────────────────────────────────────────
  const ram = specs.ramGb ?? 0
  if (ram >= 32) {
    score += 45
  } else if (ram >= 16) {
    score += 35
  } else if (ram >= 8) {
    score += 20
    notes.push('RAM de 8GB — upgrade para 16GB recomendado.')
  } else if (ram >= 4) {
    score += 5
    notes.push('RAM de 4GB — insuficiente. Upgrade urgente para 16GB.')
  } else if (ram > 0) {
    score += 0
    notes.push('RAM muito baixa. Substitua o equipamento.')
  }

  // ── ARMAZENAMENTO ─────────────────────────────────────────────
  switch (specs.storageType) {
    case 'SSD_NVME':
      score += 30
      break
    case 'SSD_SATA':
      score += 20
      break
    case 'HDD':
      score += 0
      notes.push('Disco HDD — substituição por SSD fortemente recomendada.')
      break
  }

  // ── CPU ───────────────────────────────────────────────────────
  const model = (specs.cpuModel ?? '').toLowerCase()
  const gen = specs.cpuGeneration ?? 0

  let cpuScore = 0
  if (model.includes('i9') || model.includes('ryzen 9')) {
    cpuScore = 30
  } else if (model.includes('i7') || model.includes('ryzen 7')) {
    cpuScore = 25
  } else if (model.includes('i5') || model.includes('ryzen 5')) {
    cpuScore = 20
  } else if (model.includes('i3') || model.includes('ryzen 3')) {
    cpuScore = 10
  } else if (model.length > 0) {
    cpuScore = 5
  }

  // Bônus por geração recente
  if (gen >= 12) {
    cpuScore += 10
  } else if (gen >= 10) {
    cpuScore += 5
  } else if (gen > 0 && gen <= 5) {
    notes.push(`CPU de ${gen}ª geração — equipamento muito antigo.`)
  }

  score += Math.min(cpuScore, 40)

  // ── CAP E LABEL ───────────────────────────────────────────────
  const finalScore = Math.min(score, 100)

  let label: PerformanceLabel
  if (finalScore >= 70) {
    label = 'BOM'
  } else if (finalScore >= 40) {
    label = 'INTERMEDIARIO'
  } else {
    label = 'RUIM'
  }

  return {
    score: finalScore,
    label,
    notes,
  }
}
