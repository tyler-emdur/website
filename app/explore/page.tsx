'use client'
import { useState } from 'react'
import AreaLayout from '@/components/shared/AreaLayout'
import { adventures } from '@/lib/data/adventures'
import type { Adventure } from '@/lib/types'
import { useCursor } from '@/components/cursor/CursorContext'

function ElevationBadge({ ft }: { ft: number }) {
  return (
    <div className="font-mono text-[8px] tracking-[0.15em] text-[rgba(34,197,94,0.6)] border border-[rgba(34,197,94,0.2)] px-1.5 py-0.5">
      {ft.toLocaleString()} ft
    </div>
  )
}

function AdventureCard({ adv, onClick, active }: { adv: Adventure; onClick: () => void; active: boolean }) {
  const { setMode } = useCursor()
  return (
    <button onClick={onClick}
      onMouseEnter={() => setMode('hover')} onMouseLeave={() => setMode('default')}
      className={`text-left w-full border-b border-[rgba(34,197,94,0.08)] p-5 transition-all duration-300 cursor-none ${active ? 'bg-[rgba(34,197,94,0.05)]' : 'hover:bg-[rgba(34,197,94,0.03)]'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-mono text-[9px] tracking-[0.2em] text-[rgba(34,197,94,0.5)] uppercase mb-1">{adv.state} · {adv.date}</div>
          <div className={`font-serif text-xl transition-colors ${active ? 'text-[#22C55E]' : 'text-white/80'}`}>{adv.location}</div>
          <div className="font-sans text-xs text-white/35 mt-1 leading-relaxed">{adv.description}</div>
        </div>
        <ElevationBadge ft={adv.elevation_ft} />
      </div>
      {active && (
        <div className="mt-3 font-mono text-[8px] tracking-[0.15em] text-[rgba(34,197,94,0.4)]">
          {adv.lat.toFixed(4)}°N, {Math.abs(adv.lng).toFixed(4)}°W
        </div>
      )}
    </button>
  )
}

function TopoMap({ active }: { active: Adventure | null }) {
  const rings = 7
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Topo rings */}
      {Array.from({length: rings}).map((_,i) => {
        const size = 120 + i * 55
        const color = active?.color ?? '#22C55E'
        return (
          <div key={i} className="absolute rounded-full border transition-all duration-700"
            style={{
              width: size, height: size * 0.62,
              borderColor: `rgba(${active ? '34,197,94' : '34,197,94'},${0.06 + (rings-i)*0.015})`,
              borderWidth: 1,
              transform: `scale(${active ? 1 + i * 0.06 : 1})`,
              transition: `transform ${0.4 + i*0.05}s cubic-bezier(0.16,1,0.3,1)`,
            }}
          />
        )
      })}

      {/* Center marker */}
      <div className="relative z-10 flex flex-col items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[#22C55E]" style={{ boxShadow: '0 0 12px #22C55E' }} />
        {active && (
          <div className="text-center">
            <div className="font-serif text-[#22C55E] text-xl">{active.location}</div>
            <div className="font-mono text-[9px] tracking-[0.2em] text-white/30 mt-1">{active.elevation_ft.toLocaleString()} ft elevation</div>
          </div>
        )}
      </div>

      {/* Elevation label rings */}
      {active && [active.elevation_ft, Math.round(active.elevation_ft*0.7), Math.round(active.elevation_ft*0.4)].map((elev,i) => (
        <div key={i} className="absolute font-mono text-[7px] tracking-[0.1em] text-[rgba(34,197,94,0.25)]"
          style={{ top: `${28 + i*18}%`, right: '15%' }}
        >{elev.toLocaleString()} ft</div>
      ))}
    </div>
  )
}

export default function ExplorePage() {
  const [active, setActive] = useState<Adventure | null>(null)

  return (
    <AreaLayout area="explore" className="bg-area-explore topo-bg">
      {/* Header */}
      <div className="px-8 pt-20 pb-6 border-b border-[rgba(34,197,94,0.1)]">
        <div className="font-mono text-[10px] tracking-[0.25em] text-[#22C55E] uppercase mb-3">Area 04</div>
        <h1 className="font-serif text-[clamp(3rem,10vw,8rem)] leading-[0.88] tracking-tight text-white">EXPLORE</h1>
        <div className="font-mono text-xs text-white/20 mt-4 tracking-[0.15em]">
          Colorado · {Math.max(...adventures.map(a=>a.elevation_ft)).toLocaleString()} ft max · {adventures.length} locations
        </div>
      </div>

      {/* Layout */}
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-12rem)]">

        {/* Location list */}
        <div className="lg:w-80 xl:w-96 border-r border-[rgba(34,197,94,0.08)] overflow-y-auto">
          {adventures.map(adv => (
            <AdventureCard key={adv.id} adv={adv}
              onClick={() => setActive(active?.id === adv.id ? null : adv)}
              active={active?.id === adv.id}
            />
          ))}
        </div>

        {/* Topo map visualization */}
        <div className="flex-1 relative min-h-[50vh] lg:min-h-0">
          <TopoMap active={active} />

          {!active && (
            <div className="absolute bottom-8 left-0 right-0 text-center font-mono text-[9px] tracking-[0.2em] text-white/15 uppercase">
              select a location
            </div>
          )}
        </div>
      </div>
    </AreaLayout>
  )
}
