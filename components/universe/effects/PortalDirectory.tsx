'use client'
import type { CSSProperties } from 'react'
import { useMemo, useState } from 'react'
import { getAllObjects, useUniverseStore } from '@/lib/universe-store'

export default function PortalDirectory() {
  const [open, setOpen] = useState(true)
  const selectObject = useUniverseStore(s => s.selectObject)
  const portals = useMemo(() => getAllObjects()
    .filter(obj => obj.region === 'void' && obj.worldId != null)
    .sort((a, b) => (a.worldId ?? 0) - (b.worldId ?? 0)), [])

  return (
    <div className={`portal-directory ${open ? 'portal-directory--open' : 'portal-directory--closed'}`}>
      <button className="portal-directory__tab" type="button" onClick={() => setOpen(v => !v)}>
        {open ? 'MISFILE GATES' : 'GATES ?'}
      </button>
      {open && (
        <div className="portal-directory__body">
          <div className="portal-directory__heading">
            <span>DEFINED PORTALS</span>
            <span>{portals.length} / ??</span>
          </div>
          <div className="portal-directory__grid">
            {portals.map(portal => (
              <button
                key={portal.id}
                className="portal-directory__gate"
                type="button"
                onClick={() => selectObject(portal)}
                style={{ '--gate-color': portal.color } as CSSProperties}
              >
                <span>{String(portal.worldId).padStart(2, '0')}</span>
                <em>{portal.label.split('/')[1]?.trim() ?? portal.label}</em>
              </button>
            ))}
          </div>
          <div className="portal-directory__note">
            click a gate to focus it; enter still means enter, unless it does not
          </div>
        </div>
      )}
    </div>
  )
}
