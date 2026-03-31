'use client'

import { useAssetSelection } from './AssetSelectionProvider'

export function AssetSelectAll({ allIds }: { allIds: string[] }) {
  const { selected, toggleAll } = useAssetSelection()
  const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id))
  const someSelected = allIds.some(id => selected.has(id))

  return (
    <div
      onClick={e => {
        e.preventDefault()
        e.stopPropagation()
        toggleAll(allIds)
      }}
      title={allSelected ? 'Desmarcar todos' : 'Selecionar todos'}
      style={{
        width: 16, height: 16, borderRadius: 4, flexShrink: 0, cursor: 'pointer',
        border: allSelected
          ? '1.5px solid #00d9b8'
          : someSelected
          ? '1.5px solid rgba(0,217,184,0.5)'
          : '1.5px solid rgba(255,255,255,0.15)',
        background: allSelected
          ? '#00d9b8'
          : someSelected
          ? 'rgba(0,217,184,0.15)'
          : 'rgba(255,255,255,0.03)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.1s',
      }}
    >
      {allSelected && (
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
          <path d="M2 6l3 3 5-5" stroke="#0a1628" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {someSelected && !allSelected && (
        <div style={{ width: 8, height: 2, background: '#00d9b8', borderRadius: 1 }} />
      )}
    </div>
  )
}
