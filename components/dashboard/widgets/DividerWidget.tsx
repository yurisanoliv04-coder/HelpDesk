'use client'

import { useRef, useState, useEffect } from 'react'

export default function DividerWidget() {
  const ref = useRef<HTMLDivElement>(null)
  const [isVertical, setIsVertical] = useState(false)

  useEffect(() => {
    if (!ref.current) return
    function measure() {
      if (!ref.current) return
      const { width, height } = ref.current.getBoundingClientRect()
      // Treat as vertical when height is significantly taller than wide
      setIsVertical(height > 0 && height > width * 0.8)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{
        width: '100%',
        height: '100%',
        minHeight: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4px 6px',
      }}
    >
      {isVertical ? (
        /* Vertical separator */
        <div
          style={{
            width: 1,
            height: '100%',
            minHeight: 40,
            alignSelf: 'stretch',
            background:
              'linear-gradient(to bottom, transparent, rgba(255,255,255,0.1) 20%, rgba(255,255,255,0.1) 80%, transparent)',
          }}
        />
      ) : (
        /* Horizontal separator */
        <div
          style={{
            height: 1,
            width: '100%',
            background:
              'linear-gradient(to right, transparent, rgba(255,255,255,0.1) 15%, rgba(255,255,255,0.1) 85%, transparent)',
          }}
        />
      )}
    </div>
  )
}
