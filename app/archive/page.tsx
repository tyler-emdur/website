'use client'
import { useState, useRef } from 'react'
import AreaLayout from '@/components/shared/AreaLayout'
import { memories } from '@/lib/data/memories'
import type { Memory } from '@/lib/types'
import { useCursor } from '@/components/cursor/CursorContext'

function PhotoPlaceholder({ memory, active }: { memory: Memory; active: boolean }) {
  const [developed, setDeveloped] = useState(false)
  const { setMode } = useCursor()
  return (
    <div
      onMouseEnter={() => { setDeveloped(true); setMode('hover') }}
      onMouseLeave={() => { setMode('default') }}
      className="relative border border-[rgba(200,168,130,0.15)] overflow-hidden cursor-none"
      style={{ height: memory.width * 0.72, background: developed ? 'rgba(200,168,130,0.06)' : 'rgba(200,168,130,0.02)', transition: 'background 1.2s ease, opacity 0.8s ease', opacity: developed ? 1 : 0.4 }}
    >
      {/* Film grain */}
      <div className="absolute inset-0 opacity-20"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }}
      />
      {/* Vignette */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(13,10,7,0.7) 100%)' }} />

      {developed ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="font-serif text-[#C8A882] text-lg opacity-40 italic">{memory.title}</div>
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="font-mono text-[8px] tracking-[0.2em] text-[rgba(200,168,130,0.3)] uppercase">hover to develop</div>
        </div>
      )}
    </div>
  )
}

function MemoryItem({ memory }: { memory: Memory }) {
  const [lifted, setLifted] = useState(false)
  const { setMode } = useCursor()

  return (
    <div
      className="absolute select-none"
      style={{
        left: `${memory.x}%`, top: `${memory.y}%`,
        width: memory.width,
        transform: `rotate(${memory.rotation + (lifted ? -0.5 : 0)}deg) translateY(${lifted ? -8 : 0}px)`,
        transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1), z-index 0s',
        zIndex: lifted ? 20 : 1,
        cursor: 'none',
      }}
      onMouseEnter={() => { setLifted(true); setMode('hover') }}
      onMouseLeave={() => { setLifted(false); setMode('default') }}
    >
      {memory.type === 'photo' ? (
        <div>
          {/* White photo border */}
          <div className="p-2 bg-[rgba(200,168,130,0.06)] border border-[rgba(200,168,130,0.12)]">
            <PhotoPlaceholder memory={memory} active={lifted} />
          </div>
          <div className="font-serif text-[10px] text-[rgba(200,168,130,0.5)] mt-1.5 px-2 italic">{memory.title}</div>
        </div>
      ) : memory.type === 'note' ? (
        <div className="p-4 border border-[rgba(200,168,130,0.15)] bg-[rgba(200,168,130,0.03)]" style={{ background: 'linear-gradient(rgba(200,168,130,0.04),rgba(200,168,130,0.02))' }}>
          <div className="font-mono text-[8px] tracking-[0.2em] text-[rgba(200,168,130,0.35)] uppercase mb-2">{memory.title} · {memory.year}</div>
          <div className="font-serif text-sm text-[rgba(200,168,130,0.7)] leading-relaxed italic">&ldquo;{memory.content}&rdquo;</div>
          {/* Ruled lines */}
          {Array.from({length:4}).map((_,i) => (
            <div key={i} className="mt-4 border-b border-[rgba(200,168,130,0.06)]" />
          ))}
        </div>
      ) : (
        <div className="p-3 border border-[rgba(200,168,130,0.2)] bg-[rgba(200,168,130,0.05)]">
          <div className="font-mono text-[9px] tracking-[0.15em] text-[rgba(200,168,130,0.6)] uppercase">{memory.title}</div>
          <div className="font-serif text-xs text-[rgba(200,168,130,0.4)] mt-1">{memory.content}</div>
        </div>
      )}
    </div>
  )
}

export default function ArchivePage() {
  const years = [...new Set(memories.map(m => m.year))].sort((a,b) => b-a)

  return (
    <AreaLayout area="archive" className="bg-area-archive grain-warm">
      {/* Header */}
      <div className="px-8 pt-20 pb-6 border-b border-[rgba(200,168,130,0.08)]">
        <div className="font-mono text-[10px] tracking-[0.25em] text-[#C8A882] uppercase mb-3">Area 03</div>
        <h1 className="font-serif text-[clamp(3rem,10vw,8rem)] leading-[0.88] tracking-tight text-[#C8A882]">ARCHIVE</h1>
        <div className="font-mono text-xs text-[rgba(200,168,130,0.3)] mt-4 tracking-[0.15em]">
          {memories.length} items · {years[years.length-1]}–{years[0]}
        </div>
      </div>

      {/* Attic space */}
      <div className="relative w-full overflow-hidden" style={{ height: 'max(70vh,600px)' }}>
        {memories.map(m => <MemoryItem key={m.id} memory={m} />)}

        {/* Year watermarks */}
        {years.map((y,i) => (
          <div key={y} className="absolute font-serif pointer-events-none"
            style={{ right: `${5 + i*8}%`, bottom: '5%', fontSize: 'clamp(4rem,8vw,7rem)', color: `rgba(200,168,130,${0.03 + i*0.01})`, transform: `rotate(${(i%2?1:-1)*2}deg)` }}
          >{y}</div>
        ))}
      </div>

      {/* Scroll hint */}
      <div className="text-center py-8 font-mono text-[9px] tracking-[0.2em] text-[rgba(200,168,130,0.2)] uppercase">
        hover items to reveal
      </div>
    </AreaLayout>
  )
}
