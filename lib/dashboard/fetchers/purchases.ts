import { prisma } from '@/lib/db/prisma'

export interface PendingPurchase {
  id: string
  title: string
  supplier: string | null
  quantity: number
  unitPrice: string | null
  createdAt: Date
  category: { name: string } | null
}

export interface PendingPurchasesSummary {
  count: number
  items: PendingPurchase[]
}

export async function getPendingPurchasesSummary(): Promise<PendingPurchasesSummary> {
  const items = await prisma.purchase.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    take: 6,
    select: {
      id: true, title: true, supplier: true,
      quantity: true, unitPrice: true, createdAt: true,
      category: { select: { name: true } },
    },
  })

  const count = await prisma.purchase.count({ where: { status: 'PENDING' } })

  return {
    count,
    items: items.map((p) => ({
      ...p,
      unitPrice: p.unitPrice ? p.unitPrice.toString() : null,
    })),
  }
}
