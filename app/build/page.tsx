'use client'
import { useState } from 'react'
import BackToUniverse from '@/components/shared/BackToUniverse'
import { projects } from '@/lib/data/projects'
import type { Project } from '@/lib/types'

function ProjectNode({ project, onClick, active }: { project: Project; onClick: () => void; active: boolean }) {
  return (
    <button onClick={onClick} style={{ textAlign: 'left', cursor: 'none', padding: '20px 24px', borderBottom: '1px solid rgba(59,130,246,0.05)', background: active ? 'rgba(59,130,246,0.05)' : 'transparent', width: '100%', transition: 'background 0.2s', display: 'block' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.2em', color: 'rgba(59,130,246,0.5)', marginBottom: 4 }}>{project.year} · {project.status.toUpperCase()}</div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 300, color: active ? '#3B82F6' : 'rgba(255,255,255,0.75)', marginBottom: 4 }}>{project.title}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,255,255,0.25)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {project.tech.slice(0, 3).map(t => <span key={t}>{t}</span>)}
          </div>
        </div>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: project.status === 'shipped' ? '#22C55E' : project.status === 'wip' ? '#F97316' : 'rgba(255,255,255,0.2)', flexShrink: 0, marginTop: 4 }} />
      </div>
    </button>
  )
}

function ProjectDetail({ project }: { project: Project }) {
  return (
    <div style={{ padding: '32px 40px' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.25em', color: 'rgba(59,130,246,0.5)', marginBottom: 12 }}>{project.year} · {project.status.toUpperCase()}</div>
      <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(1.8rem,4vw,3.2rem)', fontWeight: 300, color: '#fff', marginBottom: 8, letterSpacing: '-0.01em' }}>{project.title}</h2>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, lineHeight: 1.75, color: 'rgba(255,255,255,0.45)', fontWeight: 300, maxWidth: 520, marginBottom: 32 }}>{project.description}</p>

      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.2)', marginBottom: 10 }}>TECHNOLOGY</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {project.tech.map(t => (
            <span key={t} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', padding: '3px 8px', border: '1px solid rgba(59,130,246,0.2)', color: 'rgba(59,130,246,0.7)' }}>{t}</span>
          ))}
        </div>
      </div>

      {project.links && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {project.links.live && (
            <a href={project.links.live} target="_blank" rel="noreferrer" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', padding: '8px 16px', border: '1px solid rgba(59,130,246,0.3)', color: 'rgba(59,130,246,0.8)', textDecoration: 'none', cursor: 'none', transition: 'all 0.2s' }}>LAUNCH ↗</a>
          )}
          {project.links.github && (
            <a href={project.links.github} target="_blank" rel="noreferrer" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', padding: '8px 16px', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.35)', textDecoration: 'none', cursor: 'none', transition: 'all 0.2s' }}>SOURCE ↗</a>
          )}
        </div>
      )}
    </div>
  )
}

export default function BuildPage() {
  const [active, setActive] = useState<Project>(projects[0])

  return (
    <div className="area-page" style={{ background: '#050814' }}>
      <BackToUniverse />

      <div style={{ padding: '88px 32px 24px', borderBottom: '1px solid rgba(59,130,246,0.08)', backgroundImage: 'linear-gradient(rgba(59,130,246,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,0.025) 1px,transparent 1px)', backgroundSize: '48px 48px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.25em', color: 'rgba(59,130,246,0.6)', marginBottom: 8 }}>SECTOR 01-A · PROJECTS</div>
        <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(3rem,10vw,7rem)', fontWeight: 300, lineHeight: 0.9, color: '#fff' }}>BUILD</h1>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.18)', marginTop: 16, letterSpacing: '0.12em' }}>
          {projects.length} PROJECTS · {projects.filter(p=>p.status==='shipped').length} SHIPPED
        </div>
      </div>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 200px)' }}>
        <div style={{ width: 300, borderRight: '1px solid rgba(59,130,246,0.06)', overflowY: 'auto', flexShrink: 0 }}>
          {projects.map(p => <ProjectNode key={p.id} project={p} onClick={() => setActive(p)} active={active.id === p.id} />)}
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <ProjectDetail project={active} />
        </div>
      </div>
    </div>
  )
}
