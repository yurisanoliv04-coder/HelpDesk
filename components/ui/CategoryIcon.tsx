import {
  Laptop, Monitor, Printer, Keyboard, MousePointer, Headphones,
  Battery, Network, Smartphone, Package, Cpu, HardDrive, Server,
  Tablet, Camera, Wifi, Mail, Thermometer, HelpCircle, AppWindow,
} from 'lucide-react'
import type { LucideProps } from 'lucide-react'

// Maps Lucide icon name string → component
// Used for both ticket categories and asset categories
const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  laptop:          Laptop,
  monitor:         Monitor,
  printer:         Printer,
  keyboard:        Keyboard,
  'mouse-pointer': MousePointer,
  headphones:      Headphones,
  battery:         Battery,
  network:         Network,
  smartphone:      Smartphone,
  package:         Package,
  cpu:             Cpu,
  'hard-drive':    HardDrive,
  server:          Server,
  tablet:          Tablet,
  camera:          Camera,
  wifi:            Wifi,
  mail:            Mail,
  thermometer:     Thermometer,
  'help-circle':   HelpCircle,
  'app-window':    AppWindow,
}

export function CategoryIcon({
  name,
  size = 16,
  color = '#3d5068',
}: {
  name: string | null | undefined
  size?: number
  color?: string
}) {
  if (!name) return <Package size={size} color={color} />
  const Icon = ICON_MAP[name]
  // Known Lucide name → render as SVG icon
  if (Icon) return <Icon size={size} color={color} />
  // Unknown string (e.g. emoji entered by user) → render as text
  return <span style={{ fontSize: Math.max(size - 2, 10), lineHeight: 1 }}>{name}</span>
}
