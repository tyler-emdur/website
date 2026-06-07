'use client'
import { useEffect, useState } from 'react'
import { useWorldStore } from '@/lib/world-store'

const SECTIONS = [
  {
    id: 'work',
    label: 'Work',
    content: 'Software engineer. I build web applications and whatever else needs building. Recent projects: Digger (music discovery), Faraday (construction tools), this site.',
    link: null,
    world: null as null | number,
  },
  {
    id: 'running',
    label: 'Running',
    content: 'Boulder Marathon in October. Pikes Peak in August. Mt. Elbert at 4am. Golden Gate 25K in September. I run trails mostly.',
    link: null,
    world: null as null | number,
  },
  {
    id: 'contact',
    label: 'Contact',
    content: 'healthreinvented@gmail.com',
    link: 'mailto:healthreinvented@gmail.com',
    world: null as null | number,
  },
]

export default function World1Apartment() {
  const navigateTo = useWorldStore(s => s.navigateTo)
  const [visible, setVisible] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [deepHover, setDeepHover] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  const goDeeper = (e: React.MouseEvent) => {
    navigateTo(2, { type: 'fold' })
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
        maxWidth: 560,
        margin: '0 auto',
        padding: 'clamp(48px, 10vh, 100px) 32px 80px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 1.1s ease, transform 1.1s ease',
      }}>

        {/* Name */}
        <div style={{
          fontSize: 'clamp(1.4rem, 3.5vw, 2.2rem)',
          fontWeight: 400,
          color: 'rgba(255,255,255,0.9)',
          letterSpacing: '-0.02em',
          marginBottom: 40,
        }}>
          Tyler Emdur
        </div>

        {/* Bio */}
        <p style={{
          fontSize: 15,
          lineHeight: 1.9,
          color: 'rgba(255,255,255,0.45)',
          marginBottom: 56,
          maxWidth: 440,
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
        }}>
          I build software and run trails in Boulder, Colorado. I care about how things work and how they feel, which are usually the same problem.
        </p>

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {SECTIONS.map((section, i) => (
            <div
              key={section.id}
              style={{
                borderTop: i === 0 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <button
                onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
                style={{
                  width: '100%', textAlign: 'left',
                  padding: '18px 0',
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}
              >
                <span style={{
                  fontFamily: '"IM Fell English", Georgia, serif',
                  fontSize: 16,
                  color: activeSection === section.id ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.55)',
                  transition: 'color 0.2s',
                  letterSpacing: '-0.01em',
                }}>
                  {section.label}
                </span>
                <span style={{
                  fontSize: 18,
                  color: 'rgba(255,255,255,0.2)',
                  transform: activeSection === section.id ? 'rotate(45deg)' : 'rotate(0)',
                  transition: 'transform 0.25s ease',
                  display: 'inline-block',
                  lineHeight: 1,
                }}>
                  +
                </span>
              </button>

              {activeSection === section.id && (
                <div style={{
                  paddingBottom: 20,
                  fontFamily: 'Georgia, serif',
                  fontSize: 13.5,
                  lineHeight: 1.85,
                  color: 'rgba(255,255,255,0.38)',
                  maxWidth: 420,
                  fontStyle: 'italic',
                }}>
                  {section.link ? (
                    <a href={section.link} style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                      {section.content}
                    </a>
                  ) : section.content}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Go deeper */}
        <div style={{ marginTop: 64 }}>
          <button
            onClick={goDeeper}
            onMouseEnter={() => setDeepHover(true)}
            onMouseLeave={() => setDeepHover(false)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              fontFamily: 'Georgia, serif',
              fontSize: 13,
              color: deepHover ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.15)',
              letterSpacing: '0.06em',
              fontStyle: 'italic',
              transition: 'color 0.4s',
            }}
          >
            there's more →
          </button>
        </div>

      </div>
    </div>
  )
}
