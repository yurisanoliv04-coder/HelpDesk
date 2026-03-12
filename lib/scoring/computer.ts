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

/**
 * Scoring calibrado para uso corporativo de escritório:
 * planilhas, ERP contábil (Totvs, Domínio, Alterdata), PDF, e-mail, navegador.
 *
 * Pesos:  RAM 40pts  |  Armazenamento 30pts  |  CPU 30pts  =  100pts
 *
 * Thresholds:
 *   BOM          ≥ 60  — atende bem o dia-a-dia sem ressalvas
 *   INTERMEDIÁRIO ≥ 35  — funcional, mas com alguma limitação
 *   RUIM          < 35  — impacto visível na produtividade
 */
export function scoreComputer(specs: ComputerSpecs): ScoreResult | null {
  if (!specs.ramGb && !specs.storageType && !specs.cpuModel) {
    return null // sem dados suficientes
  }

  let score = 0
  const notes: string[] = []

  // ── RAM (40 pts) ──────────────────────────────────────────────
  // Para escritório, 8 GB é o mínimo confortável; 16 GB é o ideal.
  // 32 GB é supérfluo para o perfil de uso, mas não penaliza.
  const ram = specs.ramGb ?? 0
  if (ram >= 16) {
    score += 40                          // ideal — sem restrições
  } else if (ram >= 8) {
    score += 30                          // confortável para uso típico
    notes.push('RAM de 8 GB atende o uso atual, mas um upgrade para 16 GB daria mais fôlego para múltiplas abas e ERPs pesados.')
  } else if (ram >= 4) {
    score += 12
    notes.push('RAM de 4 GB é limitada para uso diário com ERP + navegador + e-mail simultâneos. Recomenda-se upgrade para 8 GB.')
  } else if (ram > 0) {
    score += 0
    notes.push('RAM insuficiente. Equipamento inviável para uso corporativo.')
  }

  // ── ARMAZENAMENTO (30 pts) ────────────────────────────────────
  // SSD faz diferença real no tempo de boot e abertura de arquivos.
  // A diferença entre NVMe e SATA é imperceptível em tarefas de escritório.
  switch (specs.storageType) {
    case 'SSD_NVME':
      score += 30
      break
    case 'SSD_SATA':
      score += 28                        // praticamente idêntico para este perfil
      break
    case 'HDD':
      score += 5
      notes.push('Disco HDD torna o sistema visivelmente mais lento. Substituição por SSD recomendada como prioridade.')
      break
  }

  // ── CPU (30 pts) ──────────────────────────────────────────────
  // Para escritório, um Core i3 ou Ryzen 3 recente é perfeitamente capaz.
  // A linha de modelo importa menos que a geração para este perfil.
  const model = (specs.cpuModel ?? '').toLowerCase()
  const gen = specs.cpuGeneration ?? 0

  let cpuScore = 0

  // Tier pelo modelo (capacidade bruta)
  if (model.includes('i9') || model.includes('ryzen 9')) {
    cpuScore = 28                        // superdimensionado, mas ótimo
  } else if (model.includes('i7') || model.includes('ryzen 7')) {
    cpuScore = 26
  } else if (model.includes('i5') || model.includes('ryzen 5')) {
    cpuScore = 24                        // ponto ideal para escritório
  } else if (model.includes('i3') || model.includes('ryzen 3')) {
    cpuScore = 20                        // suficiente para tarefas típicas
  } else if (model.includes('celeron') || model.includes('pentium') || model.includes('athlon')) {
    cpuScore = 8
    notes.push('Processador de entrada (Celeron/Pentium/Athlon) — pode travar em ERPs mais pesados ou com muitas abas abertas.')
  } else if (model.length > 0) {
    cpuScore = 14                        // modelo desconhecido, estimativa conservadora
  }

  // Fator de geração: modernidade importa (segurança, drivers, eficiência)
  // Para escritório, 6ª–7ª gen ainda é funcional; abaixo de 5ª começa a ser problemático
  if (gen >= 10) {
    cpuScore += 2                        // bônus simbólico — geração recente
  } else if (gen >= 6) {
    cpuScore += 0                        // ainda adequado, sem penalidade
  } else if (gen >= 4 && gen <= 5) {
    cpuScore = Math.max(0, cpuScore - 5)
    notes.push(`CPU de ${gen}ª geração — equipamento envelhecendo. Considere planejar substituição nos próximos 1-2 anos.`)
  } else if (gen > 0 && gen <= 3) {
    cpuScore = Math.max(0, cpuScore - 12)
    notes.push(`CPU de ${gen}ª geração — equipamento obsoleto. Risco de incompatibilidade com software atualizado e sem suporte de segurança.`)
  }

  score += Math.min(cpuScore, 30)

  // ── RESULTADO FINAL ───────────────────────────────────────────
  const finalScore = Math.min(score, 100)

  let label: PerformanceLabel
  if (finalScore >= 60) {
    label = 'BOM'
  } else if (finalScore >= 35) {
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
