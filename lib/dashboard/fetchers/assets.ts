import { prisma } from '@/lib/db/prisma'

export interface AssetKpis {
  total: number
  deployed: number
  stock: number
  maintenance: number
  ruim: number
}

export async function getAssetKpis(): Promise<AssetKpis> {
  const [total, deployed, stock, maintenance, ruim] = await Promise.all([
    prisma.asset.count(),
    prisma.asset.count({ where: { status: 'DEPLOYED' } }),
    prisma.asset.count({ where: { status: 'STOCK' } }),
    prisma.asset.count({ where: { status: 'MAINTENANCE' } }),
    prisma.asset.count({ where: { performanceLabel: 'RUIM' } }),
  ])
  return { total, deployed, stock, maintenance, ruim }
}

export interface LocationStat {
  name: string
  BOM: number
  INTERMEDIARIO: number
  RUIM: number
  NONE: number
}

export async function getAssetLocationData(): Promise<LocationStat[]> {
  const assets = await prisma.asset.findMany({
    where: { location: { not: null } },
    select: { performanceLabel: true, location: true },
  })

  const locMap: Record<string, LocationStat> = {}
  for (const asset of assets) {
    const loc = asset.location ?? 'Sem local'
    if (!locMap[loc]) {
      locMap[loc] = { name: loc, BOM: 0, INTERMEDIARIO: 0, RUIM: 0, NONE: 0 }
    }
    const label = asset.performanceLabel ?? 'NONE'
    if (label === 'BOM') locMap[loc].BOM++
    else if (label === 'INTERMEDIARIO') locMap[loc].INTERMEDIARIO++
    else if (label === 'RUIM') locMap[loc].RUIM++
    else locMap[loc].NONE++
  }

  return Object.values(locMap).sort((a, b) => {
    const ta = a.BOM + a.INTERMEDIARIO + a.RUIM + a.NONE
    const tb = b.BOM + b.INTERMEDIARIO + b.RUIM + b.NONE
    return tb - ta
  })
}

export interface LowStockCategory {
  id: string
  name: string
  kind: string
  stockQuantity: number
  stockMinQty: number
}

export async function getLowStockAlerts(): Promise<LowStockCategory[]> {
  const categories = await prisma.assetCategory.findMany({
    where: {
      kind: { in: ['ACCESSORY', 'DISPOSABLE'] },
      active: true,
      stockMinQty: { gt: 0 },
    },
    select: { id: true, name: true, kind: true, stockQuantity: true, stockMinQty: true },
  })
  return categories.filter((c) => c.stockQuantity <= c.stockMinQty)
}

export interface RecentMovement {
  id: string
  type: string
  createdAt: Date
  asset: { tag: string; name: string }
  actor: { name: string }
  toUser: { name: string } | null
  toLocation: string | null
  fromLocation: string | null
}

export async function getRecentMovements(): Promise<RecentMovement[]> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  return prisma.assetMovement.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true, type: true, createdAt: true,
      toLocation: true, fromLocation: true,
      asset: { select: { tag: true, name: true } },
      actor: { select: { name: true } },
      toUser: { select: { name: true } },
    },
  })
}
