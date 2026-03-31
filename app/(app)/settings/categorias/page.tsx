import { prisma } from '@/lib/db/prisma'
import CategoriesTab from '@/components/settings/CategoriesTab'
import SettingsSubHeader from '@/components/settings/SettingsSubHeader'

export default async function CategoriasPage() {
  const ticketCategories = await prisma.ticketCategory.findMany({
    where: { parentId: null },
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { tickets: true } },
      children: {
        orderBy: { name: 'asc' },
        include: { _count: { select: { tickets: true } } },
      },
    },
  })

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SettingsSubHeader
        title="Categorias de Chamados"
        description="Gerencie a árvore de categorias e subcategorias para tickets."
        accent="#34d399"
      />
      <CategoriesTab
        ticketCategories={ticketCategories as Parameters<typeof CategoriesTab>[0]['ticketCategories']}
      />
    </div>
  )
}
