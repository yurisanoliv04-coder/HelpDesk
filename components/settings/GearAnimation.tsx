'use client'

import { useEffect, useRef } from 'react'

// Two interlocking SVG gears — big rotates CW, small rotates CCW
// Big: 8 teeth, body r=14, outer r=18 → 36×36 container
// Small: 5 teeth, body r=9, outer r=12 → 24×24 container
// Ratio: 8/5 so if big = 10s, small = 10*(5/8) = 6.25s

function gearPath(
  teeth: number,
  innerR: number,
  outerR: number,
  toothWidth = 0.35,
): string {
  const points: string[] = []
  for (let i = 0; i < teeth; i++) {
    const baseAngle = (i / teeth) * Math.PI * 2
    const halfTooth = (Math.PI / teeth) * toothWidth
    const angles = [
      baseAngle - halfTooth * 1.6,
      baseAngle - halfTooth,
      baseAngle + halfTooth,
      baseAngle + halfTooth * 1.6,
    ]
    points.push(
      `${(Math.cos(angles[0]) * innerR).toFixed(3)},${(Math.sin(angles[0]) * innerR).toFixed(3)}`,
      `${(Math.cos(angles[1]) * outerR).toFixed(3)},${(Math.sin(angles[1]) * outerR).toFixed(3)}`,
      `${(Math.cos(angles[2]) * outerR).toFixed(3)},${(Math.sin(angles[2]) * outerR).toFixed(3)}`,
      `${(Math.cos(angles[3]) * innerR).toFixed(3)},${(Math.sin(angles[3]) * innerR).toFixed(3)}`,
    )
  }
  return `M ${points.join(' L ')} Z`
}

const BIG_PATH = gearPath(8, 14, 18)
const SMALL_PATH = gearPath(5, 9, 12)

export default function GearAnimation() {
  const bigRef = useRef<HTMLDivElement>(null)
  const smallRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const big = bigRef.current
    const small = smallRef.current
    if (!big || !small) return

    let startTime: number | null = null
    let rafId: number

    function animate(ts: number) {
      if (startTime === null) startTime = ts
      const elapsed = ts - startTime

      // Big: full rotation every 10000ms CW
      const bigDeg = (elapsed / 10000) * 360
      // Small: CCW, ratio 8/5 → faster
      const smallDeg = -(elapsed / 10000) * 360 * (8 / 5)

      big!.style.transform = `rotate(${bigDeg}deg)`
      small!.style.transform = `rotate(${smallDeg}deg)`

      rafId = requestAnimationFrame(animate)
    }

    rafId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafId)
  }, [])

  return (
    <div
      style={{
        position: 'relative',
        width: 58,
        height: 36,
        flexShrink: 0,
      }}
    >
      {/* Big gear — center (18, 18) */}
      <div
        ref={bigRef}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width={36} height={36} viewBox="-18 -18 36 36">
          <path d={BIG_PATH} fill="var(--accent-cyan)" opacity={0.85} />
          <circle r={7} fill="var(--bg-primary)" />
          <circle r={3} fill="var(--accent-cyan)" opacity={0.5} />
        </svg>
      </div>

      {/* Small gear — center (46, 18) → offset left=28, top=6 */}
      <div
        ref={smallRef}
        style={{
          position: 'absolute',
          left: 28,
          top: 6,
          width: 24,
          height: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width={24} height={24} viewBox="-12 -12 24 24">
          <path d={SMALL_PATH} fill="var(--accent-cyan)" opacity={0.65} />
          <circle r={4.5} fill="var(--bg-primary)" />
          <circle r={1.8} fill="var(--accent-cyan)" opacity={0.4} />
        </svg>
      </div>
    </div>
  )
}
