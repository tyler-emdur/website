'use client'
import { useEffect, useState } from 'react'
import { useWorldStore } from '@/lib/world-store'
import HomeButton from './HomeButton'

export default function World9Contact() {
  const navigateTo = useWorldStore(s => s.navigateTo)
  const findSecret = useWorldStore(s => s.findSecret)
  const [submitted, setSubmitted] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [footerClicks, setFooterClicks] = useState(0)

  useEffect(() => {
    // Update title for World 9
    document.title = 'Tyler Emdur — tyleremdur.com'
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Form collects data but sends nothing
    setSubmitted(true)
  }

  return (
    <div
      data-world="9"
      style={{
        position: 'fixed', inset: 0,
        background: '#fff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        overflowY: 'auto',
      }}
    >
      <div style={{ width: '100%', maxWidth: 560, padding: '80px 32px 40px' }}>

        {/* Clean header */}
        <div style={{ marginBottom: 64 }}>
          <h1 style={{ fontSize: 32, fontWeight: 300, color: '#1a1a1a', letterSpacing: '-0.02em', marginBottom: 8 }}>
            Tyler Emdur
          </h1>
          <p style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.7, maxWidth: 420 }}>
            Software engineer in Boulder, Colorado. I build web applications and interactive experiences.
          </p>
        </div>

        {/* Contact details */}
        <div style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>Get in touch</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <a
              href="mailto:healthreinvented@gmail.com"
              style={{ fontSize: 16, color: '#1a1a1a', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}
            >
              <span style={{ width: 20, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>@</span>
              healthreinvented@gmail.com
            </a>
            <a
              href="https://github.com/tyler-emdur"
              target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 16, color: '#1a1a1a', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}
            >
              <span style={{ width: 20, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>↗</span>
              github.com/tyler-emdur
            </a>
            <a
              href="https://linkedin.com/in/tyler-emdur"
              target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 16, color: '#1a1a1a', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}
            >
              <span style={{ width: 20, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>↗</span>
              linkedin.com/in/tyler-emdur
            </a>
          </div>
        </div>

        {/* Message form — collects nothing */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>Send a message</h2>

          {submitted ? (
            <div style={{ padding: '20px 0', fontSize: 15, color: '#6b7280', lineHeight: 1.7 }}>
              Thanks. I'll be in touch.
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 6, letterSpacing: '0.05em' }}>Name</label>
                <input
                  value={name} onChange={e => setName(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 4, fontSize: 15, color: '#1a1a1a', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 6, letterSpacing: '0.05em' }}>Email</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 4, fontSize: 15, color: '#1a1a1a', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#9ca3af', marginBottom: 6, letterSpacing: '0.05em' }}>Message</label>
                <textarea
                  value={message} onChange={e => setMessage(e.target.value)}
                  rows={4}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 4, fontSize: 15, color: '#1a1a1a', outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>
              <button
                type="submit"
                style={{
                  padding: '10px 24px', background: '#1a1a1a', color: '#fff', border: 'none',
                  borderRadius: 4, fontSize: 14, cursor: 'pointer', alignSelf: 'flex-start',
                  fontFamily: 'inherit', letterSpacing: '0.02em',
                }}
              >
                Send
              </button>
            </form>
          )}
        </div>

        {/* Location */}
        <div style={{ fontSize: 13, color: '#d1d5db', lineHeight: 1.6 }}>
          Boulder, CO · Available for interesting problems.
        </div>
      </div>

      {/* The found-it footer — almost invisible */}
      <div
        onClick={() => {
          const c = footerClicks + 1
          setFooterClicks(c)
          if (c === 3) findSecret('contact-footer')
          if (c >= 5) navigateTo(16, { type: 'expand-white', origin: { x: window.innerWidth / 2, y: window.innerHeight - 20 } })
        }}
        style={{
        position: 'fixed', bottom: 8, left: 0, right: 0,
        textAlign: 'center',
        fontFamily: 'monospace', fontSize: 9,
        color: footerClicks > 0 ? 'rgba(200,200,200,0.35)' : 'rgba(200,200,200,0.18)',
        userSelect: 'none',
        cursor: 'default',
      }}>
        you found it.{footerClicks > 0 && footerClicks < 5 ? ' keep going.' : ''}
      </div>
      <HomeButton />
    </div>
  )
}
