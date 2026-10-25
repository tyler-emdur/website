'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useUniverseStore, getAllObjects, REGIONS, type UniverseObject } from '@/lib/universe-store'
import { useWorldStore, type WorldId, type PortalType } from '@/lib/world-store'

function pad(n: number, w = 5) { return String(Math.abs(Math.round(n))).padStart(w, '0') }

function CoordinateDisplay() {
  const [coords, setCoords] = useState({ x: 0, y: 0, z: 1200 })

  useEffect(() => {
    const id = setInterval(() => {
      const cam = (window as any).__universeCamera
      if (cam) setCoords({ x: cam.x, y: cam.y, z: cam.z })
    }, 80)
    return () => clearInterval(id)
  }, [])

  // This readout used to corrupt itself every 8-30 seconds and swap the zone
  // for one of ['ERR_0','NULL','???','LOST']. The camera position is real and
  // the zone follows from it; faking a fault on top of a true number only made
  // the true number look invented too.
  const zone = coords.z > 800 ? 'UNIVERSE' : coords.z > 300 ? 'APPROACH' : coords.z > 100 ? 'SYSTEM' : 'SURFACE'

  return (
    <div className="hud-coords">
      <div className="hud-label">COORDINATES</div>
      <div className="hud-value">
        X:{coords.x > 0 ? '+' : '-'}{pad(coords.x)} &nbsp;
        Y:{coords.y > 0 ? '+' : '-'}{pad(coords.y)} &nbsp;
        Z:{pad(coords.z, 4)}
      </div>
      <div className="hud-label mt-1">ZONE</div>
      <div className="hud-accent">{zone}</div>
    </div>
  )
}

function RegionProximity() {
  const [nearRegion, setNearRegion] = useState<string | null>(null)

  useEffect(() => {
    const id = setInterval(() => {
      const cam = (window as any).__universeCamera
      if (!cam) return
      let closest = null, minDist = 600
      for (const r of REGIONS) {
        const dist = Math.hypot(cam.x - r.position[0], cam.y - r.position[1], cam.z - r.position[2])
        if (dist < minDist) { minDist = dist; closest = r.label }
      }
      setNearRegion(closest)
    }, 200)
    return () => clearInterval(id)
  }, [])

  if (!nearRegion) return null
  return (
    <div className="hud-region">
      <div className="hud-label">SECTOR SIGNAL</div>
      <div className="hud-region-name">{nearRegion}</div>
    </div>
  )
}

function DiscoveryNotification() {
  const recentDiscovery = useUniverseStore(s => s.recentDiscovery)
  const [show, setShow] = useState(false)
  const [obj, setObj] = useState<UniverseObject | null>(null)

  useEffect(() => {
    if (recentDiscovery) {
      setObj(recentDiscovery)
      setShow(true)
    } else {
      const t = setTimeout(() => setShow(false), 300)
      return () => clearTimeout(t)
    }
  }, [recentDiscovery])

  if (!obj) return null

  return (
    <div className={`hud-discovery ${show ? 'hud-discovery-in' : 'hud-discovery-out'}`}>
      <div className="hud-label">NEW DISCOVERY</div>
      <div className="hud-discovery-name">{obj.label}</div>
      <div className="hud-discovery-desc">{obj.description}</div>
    </div>
  )
}

// What the panel stamps on an object used to be a switch on `obj.type`, so
// every anomaly read CORRUPTED and every station read STABLE — the type
// restated in scarier letters, carrying no information the label didn't.
//
// It now reads the one piece of state the hub actually has and has never
// shown: `visited` in the world store, which persists across sessions. The map
// marks which doors you have already been through. (PLAN.md P3 — `visited_worlds`
// has persisted for months with nothing consuming it.)
type Stamp = 'VISITED' | 'OPEN' | 'NEVER BUILT' | 'NO EXIT'

function getStamp(obj: UniverseObject, visited: WorldId[]): Stamp {
  if (obj.worldId === 4) return 'NEVER BUILT'   // the socket that was never wired to anything
  if (obj.worldId == null && !obj.href) return 'NO EXIT'
  if (obj.worldId != null && visited.includes(obj.worldId as WorldId)) return 'VISITED'
  return 'OPEN'
}

const STAMP_COLOR: Record<Stamp, string> = {
  VISITED: 'rgba(255,255,255,0.45)',
  OPEN: '#fde047',
  'NEVER BUILT': '#dc2626',
  'NO EXIT': 'rgba(255,255,255,0.3)',
}

function ObjectPanel() {
  const router = useRouter()
  const { selectedId, selectObject, mode } = useUniverseStore()
  const beginNullDescent = useUniverseStore(s => s.beginNullDescent)
  const navigateTo = useWorldStore(s => s.navigateTo)
  const findSecret = useWorldStore(s => s.findSecret)
  const visited = useWorldStore(s => s.visited)
  const [transitioning, setTransitioning] = useState(false)

  const allObjects = getAllObjects()
  const obj = allObjects.find(o => o.id === selectedId)

  const handleEnter = useCallback(() => {
    if (!obj) return
    // CORRIDOR-A points at world 4. There is no world 4. Don't navigate into a
    // world that was never built (that route lands on the Surface with an
    // undefined title and poisons the visited-worlds tally) — hand off to the
    // descent, which tries to resolve it, fails, and lets you back out.
    if (obj.worldId === 4) {
      findSecret('universe-there-is-no-world-4')
      beginNullDescent()
      return
    }
    if (obj.worldId != null) {
      setTransitioning(true)
      setTimeout(() => navigateTo(obj.worldId as WorldId, { type: (obj.worldPortal ?? 'fold') as PortalType }), 400)
      return
    }
    if (!obj.href) return
    setTransitioning(true)
    setTimeout(() => router.push(obj.href!), 600)
  }, [obj, router, navigateTo, beginNullDescent, findSecret])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') selectObject(null)
      if (e.key === 'Enter' || e.key === 'e') handleEnter()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectObject, handleEnter])

  if (!obj || mode === 'exploring') return null

  const region = REGIONS.find(r => r.id === obj.region)
  const stamp = getStamp(obj, visited)
  const stampColor = STAMP_COLOR[stamp]

  return (
    <>
      {/* Black hole entry overlay */}
      {transitioning && <div className="hud-transition" />}

      <div className="hud-panel">
        <div className="hud-panel-type">
          {obj.type.toUpperCase()} · {region?.designation ?? 'UNKNOWN'}
          <span style={{
            display: 'inline-block',
            padding: '1px 5px',
            fontSize: '8px',
            letterSpacing: '0.1em',
            border: `1px dashed ${stampColor}`,
            color: stampColor,
            background: 'rgba(0,0,0,0.5)',
            marginLeft: '10px',
            fontWeight: 'bold',
            lineHeight: 1.2
          }}>
            {stamp}
          </span>
        </div>
        <h2 className="hud-panel-name">{obj.label}</h2>
        <p className="hud-panel-desc">{obj.description}</p>

        <div className="hud-panel-coords">
          X:{(obj.position[0] > 0 ? '+' : '') + obj.position[0].toFixed(0)} / 
          Y:{(obj.position[1] > 0 ? '+' : '') + obj.position[1].toFixed(0)} / 
          Z:{(obj.position[2] > 0 ? '+' : '') + obj.position[2].toFixed(0)}
        </div>

        <div className="hud-panel-actions">
          {(obj.href || obj.worldId != null) && (
            <button className="hud-btn-enter" onClick={handleEnter}>
              ENTER
              <span className="hud-btn-key">⏎</span>
            </button>
          )}
          <button className="hud-btn-close" onClick={() => selectObject(null)}>
            CLOSE <span className="hud-btn-key">ESC</span>
          </button>
        </div>
      </div>
    </>
  )
}

export default function HUD() {
  return (
    <div className="hud-root">
      <CoordinateDisplay />
      <RegionProximity />
      <DiscoveryNotification />
      <ObjectPanel />
      
      {/* Exploration guide footer */}
      <div style={{
        position: 'fixed',
        bottom: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        fontFamily: 'var(--font-mono)',
        fontSize: '7px',
        letterSpacing: '0.24em',
        color: 'rgba(255,255,255,0.18)',
        textAlign: 'center',
        pointerEvents: 'none',
        textTransform: 'uppercase',
        width: '100%'
      }}>
        [ drag map to pan · scroll to zoom · click objects to inspect · wait to reveal connections ]
      </div>
    </div>
  )
}
