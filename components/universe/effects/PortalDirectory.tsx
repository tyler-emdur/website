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
  // Panel only unlocks after 3 discoveries — before that show a locked state
  const unlocked = discovered >= 3

  return (
    <div className={`portal-directory ${open ? 'portal-directory--open' : 'portal-directory--closed'}`}>
      <button
        className="portal-directory__tab"
        type="button"
        onClick={() => setOpen(v => !v)}
      >
        {open ? 'MISFILE GATES' : 'GATES ?'}
      </button>

      {open && (
        <div className="portal-directory__body">
          {!unlocked ? (
            <>
              <div className="portal-directory__heading">
                <span>GATE INDEX</span>
                <span style={{ opacity: 0.4 }}>LOCKED</span>
              </div>
              <div style={{
                fontFamily: 'monospace', fontSize: 9,
                color: 'rgba(255,255,255,0.2)', lineHeight: 2.2,
                padding: '12px 0', letterSpacing: '0.12em',
              }}>
                <div>INSUFFICIENT DISCOVERIES</div>
                <div style={{ opacity: 0.5 }}>({discovered} / 3 required)</div>
                <div style={{ marginTop: 10, opacity: 0.3 }}>explore the field first</div>
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      )}
    </div>
  )
}
