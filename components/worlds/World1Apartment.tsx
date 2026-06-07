'use client'
import { useEffect, useState } from 'react'
import { useWorldStore, type PortalType } from '@/lib/world-store'
import { projects } from '@/lib/data/projects'
import { runs } from '@/lib/data/runs'

const PORTALS: {
  id: number
  label: string
  hint: string
  color: string
  portal: PortalType
}[] = [
  { id: 3, label: 'The Broadcast',    hint: 'Public access television. 6 channels.',         color: '#92400E', portal: 'expand-white' },
  { id: 4, label: 'The Corridor',     hint: 'A hallway that takes a while to walk.',          color: '#1E3A5F', portal: 'slide-right' },
  { id: 5, label: 'Field Station',    hint: 'Something is being monitored.',                  color: '#14532D', portal: 'rotate' },
  { id: 6, label: 'The Document',     hint: '52 pages. Most of them are blank.',              color: '#3B1F0A', portal: 'nothing' },
  { id: 7, label: 'The Mall',         hint: 'Four stores. Closed Sundays. Permanently.',      color: '#1A1410', portal: 'cursor-flood' },
  { id: 2, label: 'The Depth',        hint: 'Things drift in and out. Some of them are doors.', color: '#0A0A14', portal: 'scatter' },
  { id: 8, label: 'The Signal',       hint: 'The actual portfolio is in there somewhere.',    color: '#0F0F0F', portal: 'fold' },
  { id: 9, label: 'Contact',          hint: 'Normal page. You found it.',                     color: '#F5F5F4', portal: 'expand-white' },
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 48 }}>
      <div style={{
        fontFamily: 'Georgia, serif',
        fontSize: 10,
        letterSpacing: '0.18em',
        color: 'rgba(255,255,255,0.2)',
        textTransform: 'uppercase',
        marginBottom: 20,
      }}>
        {title}
      </div>
      {children}
    </div>
  )
}

export default function World1Apartment() {
  const navigateTo = useWorldStore(s => s.navigateTo)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  const go = (worldId: number, portal: PortalType, e: React.MouseEvent) => {
    navigateTo(worldId as 0|1|2|3|4|5|6|7|8|9, {
      type: portal,
      origin: { x: e.clientX, y: e.clientY },
    })
  }

  return (
    <div
      data-world="1"
      style={{
        position: 'fixed', inset: 0,
        background: '#0f0e0c',
        overflowY: 'auto',
        fontFamily: '"IM Fell English", Georgia, serif',
      }}
    >
      <div style={{
        maxWidth: 640,
        margin: '0 auto',
        padding: 'clamp(56px, 10vh, 96px) 32px 96px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : 'translateY(10px)',
        transition: 'opacity 1s ease, transform 1s ease',
      }}>

        {/* Name + bio */}
        <div style={{ marginBottom: 64 }}>
          <h1 style={{
            fontSize: 'clamp(1.6rem, 4vw, 2.6rem)',
            fontWeight: 400,
            color: 'rgba(255,255,255,0.88)',
            letterSpacing: '-0.02em',
            marginBottom: 20,
          }}>
            Tyler Emdur
          </h1>
          <p style={{
            fontFamily: 'Georgia, serif',
            fontSize: 15,
            lineHeight: 1.95,
            color: 'rgba(255,255,255,0.4)',
            maxWidth: 460,
            fontStyle: 'italic',
          }}>
            Software engineer in Boulder, Colorado. I build web applications and things that are harder to describe. I also run trails, mostly up.
          </p>
        </div>

        {/* Work */}
        <Section title="Work">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {projects.slice(0, 4).map((p, i) => (
              <div
                key={p.id}
                style={{
                  padding: '14px 0',
                  borderTop: i === 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  gap: 16,
                }}
              >
                <div>
                  <div style={{
                    fontFamily: '"IM Fell English", Georgia, serif',
                    fontSize: 15,
                    color: 'rgba(255,255,255,0.7)',
                    marginBottom: 4,
                  }}>
                    {p.title}
                  </div>
                  <div style={{
                    fontFamily: 'Georgia, serif',
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.28)',
                    fontStyle: 'italic',
                    lineHeight: 1.5,
                  }}>
                    {p.description}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                  {p.links.live && (
                    <a href={p.links.live} target="_blank" rel="noreferrer"
                      style={{ fontFamily: 'Georgia, serif', fontSize: 11, color: 'rgba(255,255,255,0.25)', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      live
                    </a>
                  )}
                  {p.links.github && (
                    <a href={p.links.github} target="_blank" rel="noreferrer"
                      style={{ fontFamily: 'Georgia, serif', fontSize: 11, color: 'rgba(255,255,255,0.2)', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      code
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Running */}
        <Section title="Running">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {runs.slice(0, 4).map((r, i) => (
              <div
                key={r.id}
                style={{
                  padding: '12px 0',
                  borderTop: i === 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                }}
              >
                <div style={{
                  fontFamily: '"IM Fell English", Georgia, serif',
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.65)',
                }}>
                  {r.name}
                </div>
                <div style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.25)',
                  fontStyle: 'italic',
                }}>
                  {r.distance_mi} mi · {r.date}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Contact */}
        <Section title="Contact">
          <a href="mailto:healthreinvented@gmail.com"
            style={{
              fontFamily: '"IM Fell English", Georgia, serif',
              fontSize: 15,
              color: 'rgba(255,255,255,0.55)',
              textDecoration: 'none',
              borderBottom: '1px solid rgba(255,255,255,0.12)',
              paddingBottom: 1,
            }}>
            healthreinvented@gmail.com
          </a>
          <div style={{ marginTop: 12, display: 'flex', gap: 20 }}>
            {[
              { label: 'GitHub', href: 'https://github.com/tyler-emdur' },
              { label: 'LinkedIn', href: 'https://linkedin.com/in/tyler-emdur' },
            ].map(l => (
              <a key={l.label} href={l.href} target="_blank" rel="noreferrer"
                style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.25)',
                  textDecoration: 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  fontStyle: 'italic',
                }}>
                {l.label}
              </a>
            ))}
          </div>
        </Section>

        {/* Divider */}
        <div style={{
          margin: '56px 0 48px',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
          <div style={{
            fontFamily: 'Georgia, serif',
            fontSize: 11,
            color: 'rgba(255,255,255,0.15)',
            fontStyle: 'italic',
            letterSpacing: '0.08em',
            whiteSpace: 'nowrap',
          }}>
            there is also this
          </div>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
        </div>

        {/* World portals */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 1,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          {PORTALS.map(p => (
            <button
              key={p.id}
              onClick={e => go(p.id, p.portal, e)}
              style={{
                background: '#0f0e0c',
                border: 'none',
                padding: '20px 24px',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = p.id === 9 ? '#1a1a18' : 'rgba(255,255,255,0.03)')}
              onMouseLeave={e => (e.currentTarget.style.background = '#0f0e0c')}
            >
              <div style={{
                fontFamily: '"IM Fell English", Georgia, serif',
                fontSize: 14,
                color: p.id === 9 ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.6)',
                marginBottom: 6,
                letterSpacing: '-0.01em',
              }}>
                {p.label}
              </div>
              <div style={{
                fontFamily: 'Georgia, serif',
                fontSize: 11,
                color: 'rgba(255,255,255,0.22)',
                lineHeight: 1.5,
                fontStyle: 'italic',
              }}>
                {p.hint}
              </div>
            </button>
          ))}
        </div>

      </div>
    </div>
  )
}
