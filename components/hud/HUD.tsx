'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useUniverseStore, getAllObjects, REGIONS, type UniverseObject } from '@/lib/universe-store'
import { useWorldStore, type WorldId, type PortalType } from '@/lib/world-store'

function pad(n: number, w = 5) { return String(Math.abs(Math.round(n))).padStart(w, '0') }

function CoordinateDisplay() {
  const [coords, setCoords] = useState({ x: 0, y: 0, z: 1200 })
  const [glitching, setGlitching] = useState(false)
  const [glitchCoords, setGlitchCoords] = useState({ x: 0, y: 0, z: 0 })

  useEffect(() => {
    const id = setInterval(() => {
      const cam = (window as any).__universeCamera
      if (cam) setCoords({ x: cam.x, y: cam.y, z: cam.z })
    }, 80)
    return () => clearInterval(id)
  }, [])

  // Randomly corrupt the display for 200–800ms
  useEffect(() => {
    const schedule = () => {
      const delay = 8000 + Math.random() * 22000
      return setTimeout(() => {
        setGlitchCoords({ x: (Math.random() - 0.5) * 9999, y: (Math.random() - 0.5) * 9999, z: Math.random() * 1400 })
        setGlitching(true)
        setTimeout(() => setGlitching(false), 200 + Math.random() * 600)
        schedule()
      }, delay)
    }
    const t = schedule()
    return () => clearTimeout(t)
  }, [])

  const display = glitching ? glitchCoords : coords
  const zone = coords.z > 800 ? 'UNIVERSE' : coords.z > 300 ? 'APPROACH' : coords.z > 100 ? 'SYSTEM' : 'SURFACE'
  const glitchZones = ['ERR_0', 'NULL', '???', 'LOST']

  return (
    <div className="hud-coords" style={{ opacity: glitching ? 0.7 : 1 }}>
      <div className="hud-label">COORDINATES</div>
      <div className="hud-value" style={{ color: glitching ? 'rgba(168,85,247,0.9)' : undefined }}>
        X:{display.x > 0 ? '+' : '-'}{pad(display.x)} &nbsp;
        Y:{display.y > 0 ? '+' : '-'}{pad(display.y)} &nbsp;
        Z:{pad(display.z, 4)}
      </div>
      <div className="hud-label mt-1">ZONE</div>
      <div className="hud-accent">{glitching ? glitchZones[Math.floor(Math.random() * glitchZones.length)] : zone}</div>
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

function getClassificationStamp(obj: UniverseObject) {
  if (obj.id.startsWith('forgotten-')) return 'LOST'
  if (obj.id === 'void-dark-anomaly') return 'DO NOT CATALOG'
  switch (obj.type) {
    case 'anomaly': return 'CORRUPTED'
    case 'fragment': return 'ARCHIVED'
    case 'signal': return 'UNRESOLVED'
    case 'wormhole': return 'UNKNOWN'
    case 'station': return 'STABLE'
    default: return 'CLASSIFIED'
  }
}

function redact(text?: string, isUnstable = false) {
  if (!text) return ''
  if (!isUnstable) return text
  const words = text.split(' ')
  return words.map((w, i) => {
    // 20% chance to redact word if it's an unstable/corrupted object
    if (Math.sin(i * 4.3 + w.length) > 0.6) {
      return '██████'
    }
    return w
  }).join(' ')
}

function ObjectPanel() {
  const router = useRouter()
  const { selectedId, selectObject, mode } = useUniverseStore()
  const navigateTo = useWorldStore(s => s.navigateTo)
  const [transitioning, setTransitioning] = useState(false)

  const allObjects = getAllObjects()
  const obj = allObjects.find(o => o.id === selectedId)

  const handleEnter = useCallback(() => {
    if (!obj) return
    if (obj.worldId != null) {
      setTransitioning(true)
      setTimeout(() => navigateTo(obj.worldId as WorldId, { type: (obj.worldPortal ?? 'fold') as PortalType }), 400)
      return
    }
    if (!obj.href) return
    setTransitioning(true)
    setTimeout(() => router.push(obj.href!), 600)
  }, [obj, router, navigateTo])

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
  const stamp = getClassificationStamp(obj)
  
  const stampColor = () => {
    switch (stamp) {
      case 'CORRUPTED': return '#ef4444'
      case 'LOST': return '#f59e0b'
      case 'ARCHIVED': return '#b45309'
      case 'UNRESOLVED': return '#10b981'
      case 'UNKNOWN': return '#a855f7'
      case 'DO NOT CATALOG': return '#dc2626'
      default: return 'rgba(255,255,255,0.4)'
    }
  }

  const isUnstable = obj.type === 'anomaly' || obj.id.startsWith('forgotten-') || stamp === 'DO NOT CATALOG'

  return (
    <>
      {/* Black hole entry overlay */}
      {transitioning && <div className="hud-transition" />}

      <div className="hud-panel">
        <div className="hud-panel-type">
          {obj.type.toUpperCase()} · {region?.designation ?? 'UNKNOWN'}
          {obj.worldId != null && (
            <span style={{ marginLeft: 10, color: 'rgba(253,224,71,0.7)', letterSpacing: '0.1em' }}>▼ DEEP</span>
          )}
          <span style={{
            display: 'inline-block',
            padding: '1px 5px',
            fontSize: '8px',
            letterSpacing: '0.1em',
            border: `1px dashed ${stampColor()}`,
            color: stampColor(),
            background: 'rgba(0,0,0,0.5)',
            marginLeft: '10px',
            fontWeight: 'bold',
            lineHeight: 1.2
          }}>
            {stamp}
          </span>
        </div>
        <h2 className="hud-panel-name">{obj.label}</h2>
        <p className="hud-panel-desc">{redact(obj.description, isUnstable)}</p>
        {obj.lore && <p className="hud-panel-lore">{redact(obj.lore, isUnstable)}</p>}

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
