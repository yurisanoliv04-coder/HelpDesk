import HardwarePartsTab from '@/components/settings/HardwarePartsTab'
import SettingsSubHeader from '@/components/settings/SettingsSubHeader'
import { getHardwareParts, getCpuGenerationConfigs } from '@/app/(app)/settings/actions'

export default async function HardwarePage() {
  const [hardwareParts, cpuGenConfigs] = await Promise.all([
    getHardwareParts(),
    getCpuGenerationConfigs(),
  ])

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SettingsSubHeader
        title="Hardware"
        description="Peças de computador e geração de CPU para pontuação automática de ativos."
        accent="#00d9b8"
      />
      <HardwarePartsTab
        initialParts={hardwareParts as Parameters<typeof HardwarePartsTab>[0]['initialParts']}
        initialGenConfigs={cpuGenConfigs as Parameters<typeof HardwarePartsTab>[0]['initialGenConfigs']}
      />
    </div>
  )
}
