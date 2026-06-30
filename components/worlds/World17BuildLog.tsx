'use client'
import { useState, useMemo } from 'react'
import HomeButton from './HomeButton'
import { projects } from '@/lib/data/projects'
import type { Project } from '@/lib/types'

const GRAY = '#c0c0c0'
const NAVY = '#000080'
const GREEN = '#008000'

function hashSize(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 9000
  const kb = 280 + h
  return kb > 999 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`
}

const STATUS_BADGE: Record<Project['status'], { label: string; color: string }> = {
  shipped: { label: 'FULL VERSION', color: GREEN },
  wip: { label: 'BETA', color: '#aa6600' },
  archived: { label: 'DISCONTINUED', color: '#888' },
}

function ProgramRow({ p, isNew }: { p: Project; isNew: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const badge = STATUS_BADGE[p.status]
  return (
    <div style={{ border: '2px solid #808080', borderTopColor: '#fff', borderLeftColor: '#fff', background: '#fff', marginBottom: 10 }}>
      <button onClick={() => setExpanded(e => !e)} style={{
        width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10,
        background: 'none', border: 'none', cursor: 'pointer', padding: '8px 10px', fontFamily: 'inherit',
      }}>
        <div style={{
          width: 32, height: 32, flexShrink: 0, background: 'linear-gradient(135deg,#ffe066,#ffaa00)',
          border: '2px outset #fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, color: '#553300',
        }}>💾</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>{p.title}</span>
            <span style={{ fontSize: 9, color: '#666' }}>v{p.year}.{(p.id.length % 9) + 1}</span>
            {isNew && <span className="w17-blink" style={{ fontSize: 9, fontWeight: 900, color: '#cc0000' }}>NEW!</span>}
          </div>
          <div style={{ fontSize: 10, color: '#444', marginTop: 2 }}>{p.description}</div>
        </div>
        <div style={{ flexShrink: 0, textAlign: 'right', fontSize: 9, color: '#666' }}>
          <div style={{ color: badge.color, fontWeight: 700 }}>{badge.label}</div>
          <div>{hashSize(p.id)}</div>
        </div>
      </button>
      {expanded && (
        <div style={{ padding: '0 10px 10px 52px' }}>
          <div style={{ fontSize: 9, color: '#666', marginBottom: 6 }}>
            REQUIRES: {p.tech.join(' · ')}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {p.links.live && (
              <a href={p.links.live} target="_blank" rel="noopener noreferrer" className="w17-btn">DOWNLOAD NOW &darr;</a>
            )}
            {p.links.github && (
              <a href={p.links.github} target="_blank" rel="noopener noreferrer" className="w17-btn" style={{ background: GRAY, color: '#000' }}>VIEW SOURCE</a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function World17BuildLog() {
  const sorted = useMemo(() => [...projects].sort((a, b) => b.year - a.year), [])
  const newestYear = sorted[0]?.year
  const shippedCount = projects.filter(p => p.status === 'shipped').length

  return (
    <div data-world="17" style={{
      position: 'fixed', inset: 0, overflow: 'auto', background: '#008080',
      fontFamily: '"MS Sans Serif", Tahoma, Arial, sans-serif', fontSize: 12,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');
        @keyframes w17-blink { 50% { opacity: 0 } }
        .w17-blink { animation: w17-blink 0.8s step-end infinite; }
        .w17-btn {
          display: inline-block; padding: 5px 12px; background: ${NAVY}; color: #fff;
          border: 2px outset #6688cc; font-size: 10px; font-weight: 700; text-decoration: none;
          cursor: pointer; letter-spacing: 0.5px;
        }
        .w17-btn:active { border-style: inset; }
      `}</style>
      <HomeButton />

      <div style={{ maxWidth: 640, margin: '24px auto 80px', border: '3px outset #fff', background: GRAY }}>
        {/* Title bar */}
        <div style={{
          background: `linear-gradient(90deg, ${NAVY}, #1144aa)`, color: '#fff', padding: '4px 8px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, fontWeight: 700,
        }}>
          <span>📁 C:\TYLER\SOFTWARE\LIBRARY.EXE</span>
          <span style={{ display: 'flex', gap: 4 }}>
            <span style={{ width: 16, height: 14, background: GRAY, color: '#000', textAlign: 'center', fontSize: 9, lineHeight: '14px' }}>_</span>
            <span style={{ width: 16, height: 14, background: GRAY, color: '#000', textAlign: 'center', fontSize: 9, lineHeight: '14px' }}>□</span>
            <span style={{ width: 16, height: 14, background: GRAY, color: '#000', textAlign: 'center', fontSize: 9, lineHeight: '14px' }}>✕</span>
          </span>
        </div>

        <div style={{ padding: 16 }}>
          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <div style={{ fontFamily: 'VT323, monospace', fontSize: 30, color: NAVY, letterSpacing: 1 }}>
              TYLER&apos;S SOFTWARE LIBRARY
            </div>
            <div style={{ fontSize: 10, color: '#444' }}>
              {projects.length} programs &middot; {shippedCount} full versions &middot; updated {newestYear}
            </div>
            <div style={{
              display: 'inline-block', marginTop: 6, background: '#fff', border: '2px inset #888',
              padding: '2px 10px', fontSize: 9, color: '#444',
            }}>
              ✓ ALL FILES SCANNED &middot; 0 VIRUSES FOUND &middot; 100% FREEWARE
            </div>
          </div>

          <div style={{ background: '#fff', border: '2px inset #888', padding: 10 }}>
            {sorted.map(p => (
              <ProgramRow key={p.id} p={p} isNew={p.year === newestYear} />
            ))}
          </div>

          <div style={{ marginTop: 14, fontSize: 9, color: '#003300', background: '#dff0df', border: '1px solid #99cc99', padding: 8, lineHeight: 1.6 }}>
            All programs above were written, tested, and (mostly) finished by one person.
            Some of them still have bugs. None of them have ads. Click a program to expand it.
          </div>

          <div style={{ textAlign: 'center', fontSize: 9, color: '#444', marginTop: 14 }}>
            downloads since launch: 028,441 &middot; mirror status: <span style={{ color: GREEN }}>ONLINE</span>
          </div>
        </div>
      </div>
    </div>
  )
}
