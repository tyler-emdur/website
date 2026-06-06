'use client'
import { useState } from 'react'
import BackToUniverse from '@/components/shared/BackToUniverse'
import { memories } from '@/lib/data/memories'
import type { Memory } from '@/lib/types'

function MemoryCard({ memory, onClick, active }: { memory: Memory; onClick: () => void; active: boolean }) {
  return (
    <button onClick={onClick} style={{ width: '100%', textAlign: 'left', padding: '18px 22px', borderBottom: '1px solid rgba(180,83,9,0.06)', background: active ? 'rgba(180,83,9,0.05)' : 'transparent', cursor: 'none', transition: 'background 0.2s', display: 'block' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.18em', color: 'rgba(180,83,9,0.6)', marginBottom: 4 }}>{memory.year} · {memory.type.toUpperCase()}</div>
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 300, color: active ? '#B45309' : 'rgba(255,255,255,0.65)', marginBottom: 2 }}>{memory.title}</div>
    </button>
  )
}

export default function ArchivePage() {
  const [active, setActive] = useState<Memory>(memories[0])

  return (
    <div className="area-page" style={{ background: '#060402' }}>
      <BackToUniverse />

      <div style={{ padding: '88px 32px 24px', borderBottom: '1px solid rgba(180,83,9,0.08)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.25em', color: 'rgba(180,83,9,0.6)', marginBottom: 8 }}>SECTOR 03-Ω · ARCHIVES</div>
        <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(3rem,10vw,7rem)', fontWeight: 300, lineHeight: 0.9, color: '#fff' }}>ARCHIVE</h1>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.15)', marginTop: 16, letterSpacing: '0.12em' }}>
          {memories.length} RECORDS · PARTIALLY CORRUPTED
        </div>
      </div>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 200px)' }}>
        <div style={{ width: 280, borderRight: '1px solid rgba(180,83,9,0.06)', overflowY: 'auto', flexShrink: 0 }}>
          {memories.map(m => <MemoryCard key={m.id} memory={m} onClick={() => setActive(m)} active={active.id === m.id} />)}
        </div>

        <div style={{ flex: 1, padding: '32px 40px', overflowY: 'auto' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.2em', color: 'rgba(180,83,9,0.5)', marginBottom: 12 }}>{active.year} · {active.type.toUpperCase()} · RECORD {active.id}</div>
          <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(1.6rem,3vw,2.8rem)', fontWeight: 300, color: '#fff', marginBottom: 24, letterSpacing: '-0.01em' }}>{active.title}</h2>

          <div style={{ height: 1, background: 'rgba(180,83,9,0.12)', marginBottom: 24 }} />

          {active.type === 'note' && active.content && (
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 15, lineHeight: 2, color: 'rgba(255,255,255,0.45)', fontStyle: 'italic', maxWidth: 560 }}>
              {active.content}
            </div>
          )}

          {active.type === 'photo' && (
            <div style={{ width: '100%', maxWidth: 480, aspectRatio: '4/3', background: 'rgba(180,83,9,0.06)', border: '1px solid rgba(180,83,9,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.15em', color: 'rgba(180,83,9,0.3)' }}>PHOTO · DEVELOPING</div>
            </div>
          )}

          <div style={{ marginTop: 40, fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.12)' }}>
            INTEGRITY: {Math.floor(60 + Math.random() * 40)}% · LAST ACCESSED: UNKNOWN
          </div>
        </div>
      </div>
    </div>
  )
}
