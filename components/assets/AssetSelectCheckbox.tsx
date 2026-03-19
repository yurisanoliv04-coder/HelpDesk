'use client'

import { useAssetSelection } from './AssetSelectionProvider'

export function AssetSelectCheckbox({ assetId }: { assetId: string }) {
  const { isSelected, toggle } = useAssetSelection()
  const checked = isSelected(assetId)

  return (
    <div
      onClick={e => {
        e.preventDefault()
        e.stopPropagation()
        toggle(assetId)
      }}
      style={{
        width: 16, height: 16, borderRadius: 4, flexShrink: 0, cursor: 'pointer',
        border: checked ? '1.5px solid #00d9b8' : '1.5px solid rgba(255,255,255,0.15)',
        background: checked ? '#00d9b8' : 'rgba(255,255,255,0.03)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.1s',
        position: 'relative', zIndex: 3,
      }}
    >
      {checked && (
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
          <path d="M2 6l3 3 5-5" stroke="#0a1628" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  )
}
