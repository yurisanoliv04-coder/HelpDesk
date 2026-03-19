import { PerformanceLabel } from '@prisma/client'

// ─── Tipos para scoring baseado em catálogo ────────────────────────────────────

export interface CatalogPart {
  id: string
  scorePoints: number
  model: string
  notes?: string | null
}

export interface CatalogScoreInput {
  cpuPart?: CatalogPart | null
  ramPart?: CatalogPart | null
  storagePart?: CatalogPart | null
  /** Geração do processador (ex: 11 para 11ª geração) — aplica ajuste de pontuação na CPU */
  cpuGeneration?: number | null
}

export interface ScoreResult {
  score: number
  label: PerformanceLabel
  notes: string[]
  breakdown: { cpu: number; ram: number; storage: number }
}

// ─── Ajuste de geração do CPU ──────────────────────────────────────────────────

export interface GenTierConfig {
  minGen: number
  label:  string
  adj:    number
  note?:  string | null
}

/** Tiers padrão — usados como fallback quando não há config no DB */
export const DEFAULT_GEN_TIERS: GenTierConfig[] = [
  { minGen: 13, label: '≥ 13ª geração',   adj:  4, note: 'Geração mais recente — máximo desempenho' },
  { minGen: 10, label: '10ª–12ª geração',  adj:  2, note: 'Geração moderna — excelente custo-benefício' },
  { minGen:  6, label: '6ª–9ª geração',    adj:  0, note: 'Adequado para uso corporativo' },
  { minGen:  4, label: '4ª–5ª geração',    adj: -4, note: 'Envelhecendo — planeje substituição' },
  { minGen:  1, label: '1ª–3ª geração',    adj: -8, note: 'Obsoleto — risco de incompatibilidade' },
]

/**
 * Calcula o ajuste de pontuação baseado na geração do processador.
 * Aceita tiers customizados (do DB) ou usa fallback hardcoded.
 */
export function cpuGenAdjustment(
  generation: number | null | undefined,
  tiers: GenTierConfig[] = DEFAULT_GEN_TIERS,
): number {
  const gen = generation ?? 0
  if (gen <= 0) return 0
  const sorted = [...tiers].sort((a, b) => b.minGen - a.minGen)
  const tier = sorted.find(t => gen >= t.minGen)
  return tier?.adj ?? 0
}

export function cpuGenAdjLabel(
  generation: number | null | undefined,
  tiers: GenTierConfig[] = DEFAULT_GEN_TIERS,
): string {
  const gen = generation ?? 0
  if (gen <= 0) return ''
  const sorted = [...tiers].sort((a, b) => b.minGen - a.minGen)
  const tier = sorted.find(t => gen >= t.minGen)
  if (!tier) return ''
  const sign = tier.adj > 0 ? '+' : ''
  return `${sign}${tier.adj} pts (${gen}ª geração — ${tier.note ?? tier.label})`
}

/**
 * Scoring baseado no catálogo de hardware.
 *
 * CPU = base do catálogo + ajuste de geração (min 0, max 30 pts)
 * RAM = pontuação do catálogo (0–40 pts)
 * Storage = pontuação do catálogo (0–30 pts)
 * Total = CPU + RAM + Storage (máx. 100 pts)
 *
 * BOM ≥ 65 | INTERMEDIÁRIO ≥ 38 | RUIM < 38
 */
export function scoreFromCatalog(input: CatalogScoreInput): ScoreResult | null {
  if (!input.cpuPart && !input.ramPart && !input.storagePart) return null

  const cpuBase    = input.cpuPart?.scorePoints     ?? 0
  const genAdj     = input.cpuPart ? cpuGenAdjustment(input.cpuGeneration) : 0
  const cpuPts     = Math.min(Math.max(0, cpuBase + genAdj), 30)
  const ramPts     = Math.min(input.ramPart?.scorePoints     ?? 0, 40)
  const storagePts = Math.min(input.storagePart?.scorePoints ?? 0, 30)

  const total = Math.min(cpuPts + ramPts + storagePts, 100)
  const notes: string[] = []

  if (input.cpuPart?.notes)     notes.push(input.cpuPart.notes)
  if (input.ramPart?.notes)     notes.push(input.ramPart.notes)
  if (input.storagePart?.notes) notes.push(input.storagePart.notes)
  const genAdjL = input.cpuPart ? cpuGenAdjLabel(input.cpuGeneration) : ''
  if (genAdjL) notes.push(`Geração: ${genAdjL}`)

  let label: PerformanceLabel
  if (total >= 65)      label = 'BOM'
  else if (total >= 38) label = 'INTERMEDIARIO'
  else                  label = 'RUIM'

  return {
    score: total,
    label,
    notes,
    breakdown: { cpu: cpuPts, ram: ramPts, storage: storagePts },
  }
}

// ─── Legacy: scoring heurístico (mantido para compatibilidade) ────────────────

interface LegacySpecs {
  ramGb?: number | null
  storageType?: string | null
  cpuModel?: string | null
  cpuGeneration?: number | null
}

export interface RamTier        { label: string; minGb: number; pts: number; note?: string }
export interface StorageTier    { type: string; label: string; pts: number; note?: string }
export interface CpuTier        { patterns: string[]; label: string; pts: number; note?: string }
export interface CpuGenTier     { minGen: number; label: string; adj: number; note?: string }

export interface ComputerScoringConfig {
  maxRamPts: number
  maxStoragePts: number
  maxCpuPts: number
  ram: RamTier[]
  storage: StorageTier[]
  cpu: CpuTier[]
  cpuGen: CpuGenTier[]
}

export const DEFAULT_SCORING_CONFIG: ComputerScoringConfig = {
  maxRamPts: 40,
  maxStoragePts: 30,
  maxCpuPts: 30,
  ram: [
    { label: '≥ 32 GB', minGb: 32, pts: 40, note: 'Máximo — workstation' },
    { label: '≥ 16 GB', minGb: 16, pts: 30, note: 'Ideal para uso corporativo' },
    { label: '≥ 8 GB',  minGb: 8,  pts: 18, note: 'Mínimo confortável para ERP + navegador' },
    { label: '≥ 4 GB',  minGb: 4,  pts: 5,  note: 'Limitado — troca para SSD pode compensar parcialmente' },
    { label: '< 4 GB',  minGb: 0,  pts: 0,  note: 'Inviável para uso corporativo' },
  ],
  storage: [
    { type: 'SSD_NVME', label: 'SSD NVMe', pts: 30, note: 'Máximo desempenho' },
    { type: 'SSD_SATA', label: 'SSD SATA', pts: 22, note: 'Boa performance para escritório' },
    { type: 'HDD',      label: 'HDD',      pts: 5,  note: 'Penalidade severa — gargalo em toda a operação' },
  ],
  cpu: [
    { patterns: ['i9', 'ryzen 9'],                  label: 'i9 / Ryzen 9',               pts: 30, note: 'Superdimensionado, mas ótimo' },
    { patterns: ['i7', 'ryzen 7'],                  label: 'i7 / Ryzen 7',               pts: 24, note: 'Alto desempenho' },
    { patterns: ['i5', 'ryzen 5'],                  label: 'i5 / Ryzen 5',               pts: 20, note: 'Ponto ideal para contabilidade/ERP' },
    { patterns: ['i3', 'ryzen 3'],                  label: 'i3 / Ryzen 3',               pts: 14, note: 'Adequado para tarefas típicas' },
    { patterns: ['celeron', 'pentium', 'athlon'],   label: 'Celeron / Pentium / Athlon',  pts: 5,  note: 'Muito limitado para uso corporativo' },
  ],
  cpuGen: [
    { minGen: 13, label: '≥ 13ª geração', adj: 4,   note: 'Geração mais recente' },
    { minGen: 10, label: '10ª–12ª geração', adj: 2, note: 'Geração recente' },
    { minGen: 6,  label: '6ª–9ª geração', adj: 0,   note: 'Adequado, sem penalidade' },
    { minGen: 4,  label: '4ª–5ª geração', adj: -5,  note: 'Envelhecendo — planeje substituição' },
    { minGen: 1,  label: '≤ 3ª geração',  adj: -12, note: 'Obsoleto — risco de incompatibilidade' },
  ],
}

/**
 * Scoring heurístico legado — usado quando o ativo não possui peças do catálogo vinculadas.
 * BOM ≥ 65 | INTERMEDIÁRIO ≥ 38 | RUIM < 38
 */
export function scoreComputer(
  specs: LegacySpecs,
  config: ComputerScoringConfig = DEFAULT_SCORING_CONFIG,
): ScoreResult | null {
  if (!specs.ramGb && !specs.storageType && !specs.cpuModel) return null

  let score = 0
  const notes: string[] = []
  let cpuPts = 0, ramPts = 0, storagePts = 0

  // ── RAM ─────────────────────────────────────────────────────────────────────
  const ram = specs.ramGb ?? 0
  const ramTiers = [...config.ram].sort((a, b) => b.minGb - a.minGb)
  const ramTier = ramTiers.find(t => ram >= t.minGb)
  if (ramTier) {
    ramPts = Math.min(ramTier.pts, config.maxRamPts)
    score += ramPts
    if (ramTier.pts < config.maxRamPts && ramTier.note) notes.push(ramTier.note)
  }

  // ── STORAGE ─────────────────────────────────────────────────────────────────
  const storageTier = config.storage.find(t => t.type === specs.storageType)
  if (storageTier) {
    storagePts = Math.min(storageTier.pts, config.maxStoragePts)
    score += storagePts
    if (storageTier.pts < config.maxStoragePts && storageTier.note) notes.push(storageTier.note)
  }

  // ── CPU ─────────────────────────────────────────────────────────────────────
  const model = (specs.cpuModel ?? '').toLowerCase()
  const gen   = specs.cpuGeneration ?? 0

  let cpuScore = 0
  const cpuTiers = [...config.cpu].sort((a, b) => b.pts - a.pts)
  const cpuTier = cpuTiers.find(t => t.patterns.some(p => model.includes(p.toLowerCase())))
  if (cpuTier) {
    cpuScore = cpuTier.pts
    if (cpuTier.pts <= 5 && cpuTier.note) notes.push(cpuTier.note)
  } else if (model.length > 0) {
    cpuScore = 10
  }

  const genTiers = [...config.cpuGen].sort((a, b) => b.minGen - a.minGen)
  const genTier = gen > 0 ? genTiers.find(t => gen >= t.minGen) : null
  if (genTier) {
    cpuScore = Math.max(0, cpuScore + genTier.adj)
    if (genTier.adj < 0 && genTier.note) notes.push(`CPU de ${gen}ª geração — ${genTier.note}`)
  }

  cpuPts = Math.min(cpuScore, config.maxCpuPts)
  score += cpuPts

  // ── FINAL ───────────────────────────────────────────────────────────────────
  const finalScore = Math.min(score, 100)

  let label: PerformanceLabel
  if (finalScore >= 65)      label = 'BOM'
  else if (finalScore >= 38) label = 'INTERMEDIARIO'
  else                       label = 'RUIM'

  return {
    score: finalScore,
    label,
    notes,
    breakdown: { cpu: cpuPts, ram: ramPts, storage: storagePts },
  }
}
