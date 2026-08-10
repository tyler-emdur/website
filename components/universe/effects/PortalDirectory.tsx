'use client'
import type { CSSProperties } from 'react'
import { useMemo, useState, useEffect } from 'react'
import { getAllObjects, useUniverseStore } from '@/lib/universe-store'

// Deliberately glitched/partial gate label shown in the panel
function mangle(label: string, seed: number): string {
  if (Math.sin(seed * 47.3) > 0.4) return label
  const chars = label.split('')
  const idx = Math.floor(Math.abs(Math.sin(seed * 31.7)) * chars.length)
  chars[idx] = ['_', '?', '░', '·'][Math.floor(Math.abs(Math.cos(seed * 11)) * 4)]
  return chars.join('')
}

export default function PortalDirectory() {
  const [open, setOpen] = useState(false)
  const [glitchSeed, setGlitchSeed] = useState(0)
  const selectObject = useUniverseStore(s => s.selectObject)
  const discoveredIds = useUniverseStore(s => s.discoveredIds)

  // Slowly cycle glitch seed so labels subtly change while panel is open
  useEffect(() => {
    if (!open) return
    const iv = setInterval(() => setGlitchSeed(s => s + 1), 2800)
    return () => clearInterval(iv)
  }, [open])

  const portals = useMemo(() => getAllObjects()
    .filter(obj => obj.region === 'void' && obj.worldId != null)
    .sort((a, b) => (a.worldId ?? 0) - (b.worldId ?? 0)), [])

  const discovered = discoveredIds.length

  // This used to stay locked until three objects had been discovered, and a
  // discovery registers by clicking one — so the only route to nine worlds was
  // held shut by a mechanic whose input a first-time visitor had no way to know
  // existed. A map that refuses to open isn't mysterious, it's broken. The
  // index opens from the first second; the labels stay mangled, so what's
  // behind each gate is still unknown. Mystery in the contents, not the door.

  return (
    <div className={`portal-directory ${open ? 'portal-directory--open' : 'portal-directory--closed'}`}>
      <button
        className="portal-directory__tab"
        type="button"
        onClick={() => setOpen(v => !v)}
      >
        {open ? 'GATE INDEX' : 'GATES ?'}
      </button>

      {open && (
        <div className="portal-directory__body">
          <div className="portal-directory__heading">
            <span>GATE INDEX [PARTIAL]</span>
            <span style={{ opacity: 0.4 }}>{portals.length} entries · {portals.length - 1} confirmed</span>
          </div>
          <div className="portal-directory__grid">
            {portals.map((portal, i) => (
              <button
                key={portal.id}
                className="portal-directory__gate"
                type="button"
                onClick={() => selectObject(portal)}
                style={{ '--gate-color': portal.color } as CSSProperties}
              >
                <span>{String(portal.worldId).padStart(2, '0')}</span>
                <em>{mangle(
                  portal.label.split('/')[1]?.trim() ?? portal.label,
                  i + glitchSeed * 0.1
                )}</em>
              </button>
            ))}
          </div>
          <div className="portal-directory__note" style={{ opacity: 0.35 }}>
            {discovered} discovered · {portals.length} gates · 1 unresolved
          </div>
        </div>
      )}
    </div>
  )
}
