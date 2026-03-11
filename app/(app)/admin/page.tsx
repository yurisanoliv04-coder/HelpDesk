import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminPage() {
  const session = await auth()
  if (session?.user.role !== 'ADMIN') redirect('/dashboard')

  const sections = [
    {
      href: '/admin/users',
      title: 'Usuários',
      description: 'Gerenciar contas, perfis e departamentos.',
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    },
    {
      href: '/admin/categories',
      title: 'Categorias de Chamado',
      description: 'Criar e editar categorias do catálogo de chamados.',
      icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
    },
    {
      href: '/admin/sla',
      title: 'Políticas de SLA',
      description: 'Definir prazos de resposta e resolução por prioridade.',
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    },
  ]

  return (
    <div className="w-full space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Administração</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Configurações e gestão do sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 hover:shadow-md dark:hover:shadow-slate-900/50 hover:border-blue-200 dark:hover:border-blue-800 transition-all group shadow-sm"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-4 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
              </svg>
            </div>
            <h2 className="text-sm font-semibold text-slate-800 dark:text-white">{s.title}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{s.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
