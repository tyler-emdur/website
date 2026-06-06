'use client'
import { useState } from 'react'
import AreaLayout from '@/components/shared/AreaLayout'
import { projects } from '@/lib/data/projects'
import type { Project } from '@/lib/types'
import { useCursor } from '@/components/cursor/CursorContext'

const STATUS_LABELS: Record<string, string> = {
  shipped: '● Shipped', wip: '◌ In progress', archived: '× Archived',
}
const STATUS_COLORS: Record<string, string> = {
  shipped: '#3B82F6', wip: '#60A5FA', archived: 'rgba(59,130,246,0.35)',
}

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  const { setMode } = useCursor()
  return (
    <button onClick={onClick}
      onMouseEnter={() => setMode('hover')} onMouseLeave={() => setMode('default')}
      className="group absolute text-left cursor-none"
      style={{ left: `${project.x}%`, top: `${project.y}%`, transform: `rotate(${project.rotation}deg)`, transformOrigin: 'top left' }}
    >
      <div className="relative border border-[rgba(59,130,246,0.25)] bg-[rgba(7,10,20,0.9)] p-5 w-64 transition-all duration-300 group-hover:border-[rgba(59,130,246,0.7)] group-hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]">
        {/* Blueprint corner marks */}
        {['top-0 left-0','top-0 right-0','bottom-0 left-0','bottom-0 right-0'].map((pos,i) => (
          <div key={i} className={`absolute ${pos} w-2 h-2`}
            style={{ borderTop: i<2?'1px solid rgba(59,130,246,0.6)':undefined, borderBottom: i>=2?'1px solid rgba(59,130,246,0.6)':undefined, borderLeft: i%2===0?'1px solid rgba(59,130,246,0.6)':undefined, borderRight: i%2===1?'1px solid rgba(59,130,246,0.6)':undefined }}
          />
        ))}

        <div className="font-mono text-[9px] tracking-[0.22em] uppercase mb-2" style={{ color: STATUS_COLORS[project.status] }}>
          {STATUS_LABELS[project.status]} · {project.year}
        </div>
        <div className="font-serif text-lg leading-tight text-white mb-2">{project.title}</div>
        <div className="font-sans text-xs text-white/40 leading-relaxed">{project.description}</div>

        {project.tech.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {project.tech.slice(0,4).map(t => (
              <span key={t} className="font-mono text-[8px] tracking-[0.1em] px-1.5 py-0.5 border border-[rgba(59,130,246,0.2)] text-[rgba(59,130,246,0.7)]">{t}</span>
            ))}
          </div>
        )}

        <div className="absolute top-3 right-3 font-mono text-[8px] text-[rgba(59,130,246,0.3)] opacity-0 group-hover:opacity-100 transition-opacity">
          open ↗
        </div>
      </div>
    </button>
  )
}

function ProjectDetail({ project, onClose }: { project: Project; onClose: () => void }) {
  const { setMode } = useCursor()
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative w-full max-w-2xl border border-[rgba(59,130,246,0.3)] bg-[#070a14] p-8 animate-[slideUp_0.35s_cubic-bezier(0.16,1,0.3,1)_forwards]"
        onClick={e => e.stopPropagation()}
        style={{ '--color': '#3B82F6' } as React.CSSProperties}
      >
        <button onClick={onClose}
          onMouseEnter={() => setMode('hover')} onMouseLeave={() => setMode('default')}
          className="absolute top-4 right-4 font-mono text-[10px] tracking-[0.15em] text-white/30 hover:text-white cursor-none transition-colors"
        >close ×</button>

        <div className="font-mono text-[9px] tracking-[0.22em] uppercase mb-2" style={{ color: STATUS_COLORS[project.status] }}>
          {STATUS_LABELS[project.status]} · {project.year}
        </div>
        <h2 className="font-serif text-4xl mb-4">{project.title}</h2>
        <p className="font-sans text-sm text-white/55 leading-relaxed mb-6">{project.description}</p>

        {project.tech.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {project.tech.map(t => (
              <span key={t} className="font-mono text-[9px] tracking-[0.1em] px-2 py-1 border border-[rgba(59,130,246,0.3)] text-[rgba(59,130,246,0.8)]">{t}</span>
            ))}
          </div>
        )}

        <div className="flex gap-4">
          {project.links.live   && <a href={project.links.live}   target="_blank" rel="noopener" className="font-mono text-[10px] tracking-[0.15em] text-[#3B82F6] border-b border-[rgba(59,130,246,0.3)] hover:border-[#3B82F6] cursor-none transition-colors">↗ Live site</a>}
          {project.links.github && <a href={project.links.github} target="_blank" rel="noopener" className="font-mono text-[10px] tracking-[0.15em] text-[#3B82F6] border-b border-[rgba(59,130,246,0.3)] hover:border-[#3B82F6] cursor-none transition-colors">↗ GitHub</a>}
        </div>
      </div>
    </div>
  )
}

export default function BuildPage() {
  const [active, setActive] = useState<Project | null>(null)

  return (
    <AreaLayout area="build" className="bg-area-build blueprint-grid">
      {/* Header */}
      <div className="px-8 pt-20 pb-6 border-b border-[rgba(59,130,246,0.1)]">
        <div className="font-mono text-[10px] tracking-[0.25em] text-[#3B82F6] uppercase mb-3">Area 02</div>
        <h1 className="font-serif text-[clamp(3rem,10vw,8rem)] leading-[0.88] tracking-tight">BUILD</h1>
        <div className="font-mono text-xs text-white/20 mt-4 tracking-[0.15em]">
          {projects.filter(p=>p.status==='shipped').length} shipped · {projects.filter(p=>p.status==='wip').length} in progress
        </div>
      </div>

      {/* Workbench */}
      <div className="relative w-full" style={{ height: 'calc(100vh - 12rem)', minHeight: 500 }}>
        <div className="absolute top-6 left-8 font-mono text-[9px] tracking-[0.2em] text-white/15 uppercase">
          click a project to open
        </div>
        {projects.map(p => (
          <ProjectCard key={p.id} project={p} onClick={() => setActive(p)} />
        ))}
      </div>

      {active && <ProjectDetail project={active} onClose={() => setActive(null)} />}

      <style jsx global>{`
        @keyframes slideUp {
          from { transform: translateY(40px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </AreaLayout>
  )
}
