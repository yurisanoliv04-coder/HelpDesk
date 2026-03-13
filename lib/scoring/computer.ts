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

// ─── Configurable scoring types ───────────────────────────────────────────────

export interface RamTier {
  label: string
  minGb: number
  pts: number
  note?: string
}

export interface StorageTier {
  type: string // HDD | SSD_SATA | SSD_NVME
  label: string
  pts: number
  note?: string
}

export interface CpuTier {
  patterns: string[]
  label: string
  pts: number
  note?: string
}

export interface CpuGenTier {
  minGen: number
  label: string
  adj: number
  note?: string
}

export interface ComputerScoringConfig {
  maxRamPts: number
  maxStoragePts: number
  maxCpuPts: number
  ram: RamTier[]
  storage: StorageTier[]
  cpu: CpuTier[]
  cpuGen: CpuGenTier[]
}

// ─── Default config (hardcoded, mirrors original logic) ───────────────────────

export const DEFAULT_SCORING_CONFIG: ComputerScoringConfig = {
  maxRamPts: 40,
  maxStoragePts: 30,
  maxCpuPts: 30,
  ram: [
    { label: '≥ 16 GB', minGb: 16, pts: 40, note: 'Ideal — sem restrições' },
    { label: '8 GB',    minGb: 8,  pts: 30, note: 'Confortável, pequeno bônus ao upgrade para 16 GB' },
    { label: '4 GB',    minGb: 4,  pts: 12, note: 'Limitado para ERP + navegador + e-mail simultâneos' },
    { label: '< 4 GB',  minGb: 0,  pts: 0,  note: 'Inviável para uso corporativo' },
  ],
  storage: [
    { type: 'SSD_NVME', label: 'SSD NVMe', pts: 30, note: 'Máximo desempenho' },
    { type: 'SSD_SATA', label: 'SSD SATA', pts: 28, note: 'Praticamente idêntico para tarefas de escritório' },
    { type: 'HDD',      label: 'HDD',      pts: 5,  note: 'Penalidade severa — substituição recomendada' },
  ],
  cpu: [
    { patterns: ['i9', 'ryzen 9'],                              label: 'i9 / Ryzen 9',            pts: 28, note: 'Superdimensionado, mas ótimo' },
    { patterns: ['i7', 'ryzen 7'],                              label: 'i7 / Ryzen 7',            pts: 26, note: 'Excelente para escritório' },
    { patterns: ['i5', 'ryzen 5'],                              label: 'i5 / Ryzen 5',            pts: 24, note: 'Ponto ideal para contabilidade/ERP' },
    { patterns: ['i3', 'ryzen 3'],                              label: 'i3 / Ryzen 3',            pts: 20, note: 'Suficiente para tarefas típicas' },
    { patterns: ['celeron', 'pentium', 'athlon'],               label: 'Celeron / Pentium / Athlon', pts: 8, note: 'Pode travar em ERPs pesados' },
  ],
  cpuGen: [
    { minGen: 10, label: '≥ 10ª geração', adj: 2,   note: 'Bônus simbólico — geração recente' },
    { minGen: 6,  label: '6ª–9ª geração', adj: 0,   note: 'Ainda adequado, sem penalidade' },
    { minGen: 4,  label: '4ª–5ª geração', adj: -5,  note: 'Envelhecendo — planeje substituição' },
    { minGen: 1,  label: '≤ 3ª geração',  adj: -12, note: 'Obsoleto — risco de incompatibilidade' },
  ],
}

// ─── Core scoring function (accepts optional config) ──────────────────────────

/**
 * Scoring calibrado para uso corporativo de escritório.
 * Aceita config opcional; usa DEFAULT_SCORING_CONFIG se não informado.
 *
 * Pesos padrão:  RAM 40pts  |  Armazenamento 30pts  |  CPU 30pts  =  100pts
 * BOM ≥ 60  |  INTERMEDIÁRIO ≥ 35  |  RUIM < 35
 */
export function scoreComputer(
  specs: ComputerSpecs,
  config: ComputerScoringConfig = DEFAULT_SCORING_CONFIG,
): ScoreResult | null {
  if (!specs.ramGb && !specs.storageType && !specs.cpuModel) {
    return null
  }

  let score = 0
  const notes: string[] = []

  // ── RAM ───────────────────────────────────────────────────────────────────
  const ram = specs.ramGb ?? 0
  const ramTiers = [...config.ram].sort((a, b) => b.minGb - a.minGb)
  const ramTier = ramTiers.find(t => ram >= t.minGb)
  if (ramTier) {
    score += Math.min(ramTier.pts, config.maxRamPts)
    if (ramTier.pts < config.maxRamPts && ramTier.note) notes.push(ramTier.note)
  }

  // ── STORAGE ───────────────────────────────────────────────────────────────
  const storageTier = config.storage.find(t => t.type === specs.storageType)
  if (storageTier) {
    score += Math.min(storageTier.pts, config.maxStoragePts)
    if (storageTier.pts < config.maxStoragePts && storageTier.note) notes.push(storageTier.note)
  }

  // ── CPU ───────────────────────────────────────────────────────────────────
  const model = (specs.cpuModel ?? '').toLowerCase()
  const gen = specs.cpuGeneration ?? 0

  let cpuScore = 0

  // Model tier
  const cpuTiers = [...config.cpu].sort((a, b) => b.pts - a.pts)
  const cpuTier = cpuTiers.find(t => t.patterns.some(p => model.includes(p.toLowerCase())))
  if (cpuTier) {
    cpuScore = cpuTier.pts
    if (cpuTier.note && cpuTier.pts <= 10) notes.push(cpuTier.note)
  } else if (model.length > 0) {
    cpuScore = 14 // unknown model, conservative estimate
  }

  // Generation adjustment
  const genTiers = [...config.cpuGen].sort((a, b) => b.minGen - a.minGen)
  const genTier = gen > 0 ? genTiers.find(t => gen >= t.minGen) : null
  if (genTier) {
    cpuScore = Math.max(0, cpuScore + genTier.adj)
    if (genTier.adj < 0 && genTier.note) {
      notes.push(`CPU de ${gen}ª geração — ${genTier.note}`)
    }
  }

  score += Math.min(cpuScore, config.maxCpuPts)

  // ── FINAL ─────────────────────────────────────────────────────────────────
  const finalScore = Math.min(score, 100)

  let label: PerformanceLabel
  if (finalScore >= 60) {
    label = 'BOM'
  } else if (finalScore >= 35) {
    label = 'INTERMEDIARIO'
  } else {
    label = 'RUIM'
  }

  return { score: finalScore, label, notes }
}
