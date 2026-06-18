'use client'
import { useState, useEffect } from 'react'
import { useWorldStore, type PortalType, type WorldId } from '@/lib/world-store'
import HomeButton from './HomeButton'

// ── Types ────────────────────────────────────────────────────────────────────
type Screen = 'lobby' | 'ticket' | 'form-b7' | 'form-a3' | 'form-c12' | 'waiting' | 'clerk' | 'maintenance' | 'exit'

// ── Fluorescent flicker ──────────────────────────────────────────────────────
function Fluorescent() {
  const [on, setOn] = useState(true)
  useEffect(() => {
    let t1: ReturnType<typeof setTimeout>, t2: ReturnType<typeof setTimeout>
    let alive = true
    const flicker = () => {
      if (!alive) return
      t1 = setTimeout(() => {
        if (!alive) return
        setOn(false)
        t2 = setTimeout(() => {
          if (!alive) return
          setOn(true); flicker()
        }, 80 + Math.random() * 120)
      }, 8000 + Math.random() * 20000)
    }
    flicker()
    return () => { alive = false; clearTimeout(t1); clearTimeout(t2) }
  }, [])
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: 6,
      background: on ? 'rgba(220,230,210,0.15)' : 'rgba(0,0,0,0.4)',
      transition: 'background 0.05s',
      boxShadow: on ? '0 0 40px rgba(210,230,200,0.2)' : 'none',
    }} />
  )
}

// ── Shared layout wrapper ────────────────────────────────────────────────────
function Building({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#c8c4b0',
      backgroundImage: 'repeating-linear-gradient(90deg, rgba(0,0,0,0.02) 0px, rgba(0,0,0,0.02) 1px, transparent 1px, transparent 40px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      fontFamily: 'Arial, Helvetica, sans-serif',
      overflow: 'auto',
    }}>
      <Fluorescent />
      {/* Header */}
      <div style={{
        width: '100%', background: '#2c4a7a', color: '#fff',
        padding: '8px 20px', fontSize: 10, letterSpacing: '0.2em',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexShrink: 0,
      }}>
        <span>DEPARTMENT OF UNRESOLVED MATTERS</span>
        <span style={{ opacity: 0.5 }}>PUBLIC SERVICES DIVISION</span>
      </div>
      {/* Room title */}
      <div style={{
        width: '100%', background: '#d4cdb8', borderBottom: '2px solid #aaa7a0',
        padding: '6px 20px', fontSize: 9, letterSpacing: '0.15em', color: '#444',
        flexShrink: 0,
      }}>CURRENT LOCATION: {title}</div>
      {/* Content */}
      <div style={{ flex: 1, width: '100%', maxWidth: 560, padding: 20 }}>
        {children}
      </div>
    </div>
  )
}

// ── Form component ───────────────────────────────────────────────────────────
function FormField({ label, hint }: { label: string; hint?: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ display: 'block', fontSize: 10, color: '#555', marginBottom: 3, letterSpacing: '0.06em' }}>
        {label} {hint && <span style={{ color: '#888', fontStyle: 'italic' }}>{hint}</span>}
      </label>
      <input style={{
        width: '100%', padding: '5px 8px', background: '#fff',
        border: '1px solid #aaa', fontSize: 11, color: '#222',
        boxSizing: 'border-box', fontFamily: 'inherit',
      }} />
    </div>
  )
}

function FormBox({ title, number, children, onSubmit, submitLabel = 'SUBMIT FORM' }: {
  title: string; number: string; children: React.ReactNode; onSubmit: () => void; submitLabel?: string
}) {
  return (
    <div style={{ background: '#f0ece0', border: '1px solid #bbb', padding: 16, marginBottom: 12 }}>
      <div style={{ borderBottom: '2px solid #2c4a7a', paddingBottom: 8, marginBottom: 12 }}>
        <div style={{ fontSize: 9, color: '#666', letterSpacing: '0.15em' }}>FORM {number}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#2c4a7a', marginTop: 2 }}>{title}</div>
      </div>
      {children}
      <button onClick={onSubmit} style={{
        marginTop: 12, padding: '7px 18px', background: '#2c4a7a', color: '#fff',
        border: 'none', fontSize: 10, letterSpacing: '0.12em', cursor: 'pointer', fontFamily: 'inherit',
      }}>{submitLabel}</button>
    </div>
  )
}

// ── Notice box ───────────────────────────────────────────────────────────────
function Notice({ type, children }: { type: 'info' | 'error' | 'warning'; children: React.ReactNode }) {
  const colors = {
    info: { bg: '#d4e4f0', border: '#2c4a7a', text: '#1a3a6a' },
    error: { bg: '#f0d4d4', border: '#aa2222', text: '#7a1a1a' },
    warning: { bg: '#f0e8c8', border: '#8a7a22', text: '#6a5a12' },
  }
  const c = colors[type]
  return (
    <div style={{
      background: c.bg, border: `1px solid ${c.border}`,
      padding: '8px 12px', fontSize: 11, color: c.text, lineHeight: 1.6, marginBottom: 12,
    }}>{children}</div>
  )
}

// ── Main world ───────────────────────────────────────────────────────────────
export default function World4Corridor() {
  const navigateTo = useWorldStore(s => s.navigateTo)
  const [screen, setScreen] = useState<Screen>('lobby')
  const [ticketNumber] = useState(() => Math.floor(Math.random() * 900) + 100)
  const [waitProgress, setWaitProgress] = useState(0)
  const [visitedForms, setVisitedForms] = useState<Set<string>>(new Set())
  const [loopCount, setLoopCount] = useState(0)

  const visit = (s: Screen) => {
    setVisitedForms(prev => new Set([...prev, s]))
    setScreen(s)
  }

  useEffect(() => {
    if (screen !== 'waiting') return
    const iv = setInterval(() => {
      setWaitProgress(p => {
        if (p >= 100) {
          clearInterval(iv)
          setScreen('clerk')
          return 100
        }
        return p + 2
      })
    }, 80)
    return () => clearInterval(iv)
  }, [screen])

  return (
    <div data-world="4">
      <HomeButton />
      <Building title={
        screen === 'lobby' ? 'MAIN LOBBY — FLOOR 1' :
        screen === 'ticket' ? 'RECEPTION — WINDOW 3' :
        screen === 'form-b7' ? 'FORM PROCESSING — ROOM 114' :
        screen === 'form-a3' ? 'FORM PROCESSING — ROOM 108' :
        screen === 'form-c12' ? 'FORM PROCESSING — ROOM 122' :
        screen === 'waiting' ? 'WAITING AREA — FLOOR 2' :
        screen === 'clerk' ? 'CLERK WINDOW — WINDOW 3' :
        screen === 'maintenance' ? 'MAINTENANCE CORRIDOR' :
        'EXIT'
      }>

        {/* LOBBY */}
        {screen === 'lobby' && (
          <div>
            <div style={{ background: '#e8e2ce', border: '1px solid #c4be9e', padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#333', marginBottom: 8, letterSpacing: '0.1em' }}>
                DEPARTMENT OF UNRESOLVED MATTERS
              </div>
              <div style={{ fontSize: 10, color: '#555', lineHeight: 1.7 }}>
                HOURS: 9:00 AM – 4:30 PM (CLOSED 4:31 PM – 8:59 AM)<br />
                SERVICES: Forms, Requests, Referrals, Re-Referrals<br />
                <span style={{ color: '#888' }}>Parking validation not available. Parking not available.</span>
              </div>
            </div>
            <Notice type="info">
              All visitors must obtain a ticket from Window 3 before proceeding.
              Please have your Form B-7 ready. If you do not have Form B-7,
              proceed to Window 3 to obtain instructions for obtaining Form B-7.
            </Notice>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => visit('ticket')} style={{
                padding: '8px 16px', background: '#2c4a7a', color: '#fff',
                border: 'none', fontSize: 10, cursor: 'pointer', letterSpacing: '0.1em', fontFamily: 'inherit',
              }}>PROCEED TO WINDOW 3</button>
            </div>
            {/* Hidden maintenance door — always there, discovered after loops */}
            {loopCount >= 2 && (
              <div style={{ marginTop: 28, paddingTop: 16, borderTop: '1px dashed #aaa' }}>
                <div style={{ fontSize: 9, color: '#aaa', marginBottom: 8, letterSpacing: '0.1em' }}>
                  [A door, previously unnoticed.]
                </div>
                <button onClick={() => visit('maintenance')} style={{
                  padding: '6px 14px', background: '#555', color: '#ccc',
                  border: '1px solid #888', fontSize: 10, cursor: 'pointer', letterSpacing: '0.08em', fontFamily: 'inherit',
                }}>⚠ MAINTENANCE — DO NOT ENTER</button>
              </div>
            )}
          </div>
        )}

        {/* TICKET */}
        {screen === 'ticket' && (
          <div>
            <div style={{ background: '#fff', border: '1px solid #ccc', padding: 12, marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 9, color: '#888', letterSpacing: '0.1em' }}>YOUR NUMBER</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#2c4a7a', letterSpacing: '0.2em' }}>{ticketNumber}</div>
              </div>
              <div style={{ textAlign: 'right', fontSize: 9, color: '#aaa', lineHeight: 1.8 }}>
                <div>NOW SERVING: {Math.max(1, ticketNumber - 3)}</div>
                <div>EST. WAIT: INDETERMINATE</div>
                <div>PRIORITY: STANDARD</div>
              </div>
            </div>
            <Notice type="info">
              To be served, you will need <strong>Form B-7</strong> (Current Year, Section 4).
              Form B-7 is available in Room 114.
            </Notice>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => visit('form-b7')} style={{
                padding: '8px 16px', background: '#2c4a7a', color: '#fff',
                border: 'none', fontSize: 10, cursor: 'pointer', letterSpacing: '0.1em', fontFamily: 'inherit',
              }}>GO TO ROOM 114 — FORM B-7</button>
              <button onClick={() => visit('lobby')} style={{
                padding: '8px 16px', background: 'none', color: '#666',
                border: '1px solid #aaa', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit',
              }}>← BACK</button>
            </div>
          </div>
        )}

        {/* FORM B-7 */}
        {screen === 'form-b7' && (
          <div>
            {visitedForms.has('form-b7') && (
              <Notice type="warning">You have visited this form before. Your previous submission was not retained.</Notice>
            )}
            <FormBox
              title="APPLICATION FOR GENERAL SERVICES ACCESS"
              number="B-7 (SECTION 4)"
              onSubmit={() => { setLoopCount(c => c + 1); visit('form-a3') }}
              submitLabel="SUBMIT FOR REVIEW"
            >
              <FormField label="FULL LEGAL NAME (as it appears on Form A-3)" />
              <FormField label="REFERENCE NUMBER FROM FORM C-12" hint="(see Section 2, Subsection 4b)" />
              <FormField label="DATE OF LAST FORM COMPLETION" hint="(not including this form)" />
              <FormField label="PURPOSE OF VISIT" hint="(if known)" />
              <div style={{ fontSize: 9, color: '#888', lineHeight: 1.7, marginTop: 8, padding: '6px', background: '#e8e0cc', borderLeft: '2px solid #bbb' }}>
                REQUIRED ATTACHMENTS:<br />
                · Completed Form A-3 (notarized)<br />
                · Current Form C-12, Section 2<br />
                · One (1) valid form of identification (Form A-3b)
              </div>
            </FormBox>
            <Notice type="error">
              INCOMPLETE: This form requires a completed <strong>Form A-3</strong> and <strong>Form C-12</strong>.
              You have not submitted these forms.
            </Notice>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => visit('form-a3')} style={{ padding: '8px 16px', background: '#2c4a7a', color: '#fff', border: 'none', fontSize: 10, cursor: 'pointer', letterSpacing: '0.1em', fontFamily: 'inherit' }}>
                GET FORM A-3 — ROOM 108
              </button>
              <button onClick={() => visit('form-c12')} style={{ padding: '8px 16px', background: '#2c4a7a', color: '#fff', border: 'none', fontSize: 10, cursor: 'pointer', letterSpacing: '0.1em', fontFamily: 'inherit' }}>
                GET FORM C-12 — ROOM 122
              </button>
              <button onClick={() => visit('lobby')} style={{ padding: '8px 16px', background: 'none', color: '#666', border: '1px solid #aaa', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}>← LOBBY</button>
            </div>
          </div>
        )}

        {/* FORM A-3 */}
        {screen === 'form-a3' && (
          <div>
            <FormBox
              title="PROOF OF PRIOR FORM COMPLETION"
              number="A-3"
              onSubmit={() => { setLoopCount(c => c + 1); visit('form-b7') }}
              submitLabel="SUBMIT A-3"
            >
              <FormField label="FORM B-7 CONFIRMATION NUMBER" hint="(from Form B-7, Section 4)" />
              <FormField label="NOTARIZATION REFERENCE" hint="(see Form A-3b for notarization)" />
              <FormField label="ORIGINAL DATE OF ORIGINAL REQUEST" />
              <div style={{ fontSize: 9, color: '#888', lineHeight: 1.7, marginTop: 8, padding: '6px', background: '#e8e0cc', borderLeft: '2px solid #bbb' }}>
                NOTE: This form requires a completed Form B-7 (Section 4) to process.
                Form B-7 is available in Room 114.
              </div>
            </FormBox>
            <Notice type="error">
              Form A-3 cannot be processed without first completing <strong>Form B-7, Section 4</strong>.
              Return to Room 114.
            </Notice>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => visit('form-b7')} style={{ padding: '8px 16px', background: '#2c4a7a', color: '#fff', border: 'none', fontSize: 10, cursor: 'pointer', letterSpacing: '0.1em', fontFamily: 'inherit' }}>BACK TO FORM B-7</button>
              <button onClick={() => visit('lobby')} style={{ padding: '8px 16px', background: 'none', color: '#666', border: '1px solid #aaa', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}>← LOBBY</button>
            </div>
          </div>
        )}

        {/* FORM C-12 */}
        {screen === 'form-c12' && (
          <div>
            <FormBox
              title="SUPPLEMENTARY CROSS-REFERENCE FORM"
              number="C-12 (SECTION 2)"
              onSubmit={() => { setLoopCount(c => c + 1); visit('form-b7') }}
              submitLabel="SUBMIT C-12"
            >
              <FormField label="ATTACHED FORM A-3 REFERENCE NUMBER" />
              <FormField label="FORM B-7 SECTION 3 CHECKBOX CONFIRMATION" hint="(tick all that apply)" />
              <FormField label="REASON FOR REQUIRING THIS FORM" />
              <div style={{ fontSize: 9, color: '#888', lineHeight: 1.7, marginTop: 8, padding: '6px', background: '#e8e0cc', borderLeft: '2px solid #bbb' }}>
                THIS FORM IS VOID WITHOUT:<br />
                · Form A-3 (notarized, current year)<br />
                · Form B-7, Section 3 (pre-approval)<br />
                · Request-C (available at the desk that requires Form C-12)
              </div>
            </FormBox>
            <Notice type="warning">
              This form depends on Form A-3, which depends on Form B-7, which depends on this form.
              <br /><span style={{ fontSize: 10, color: '#8a7a22' }}>This is a known issue. Estimated resolution: pending.</span>
            </Notice>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => visit('waiting')} style={{ padding: '8px 16px', background: '#2c4a7a', color: '#fff', border: 'none', fontSize: 10, cursor: 'pointer', letterSpacing: '0.1em', fontFamily: 'inherit' }}>ESCALATE TO SUPERVISOR</button>
              <button onClick={() => visit('lobby')} style={{ padding: '8px 16px', background: 'none', color: '#666', border: '1px solid #aaa', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}>← LOBBY</button>
            </div>
          </div>
        )}

        {/* WAITING ROOM */}
        {screen === 'waiting' && (
          <div>
            <Notice type="info">
              Your escalation request has been received.<br />
              <span style={{ color: '#666' }}>A supervisor has been notified. Please wait.</span>
            </Notice>
            <div style={{ background: '#e8e2ce', border: '1px solid #c4be9e', padding: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: '#666', marginBottom: 6, letterSpacing: '0.08em' }}>QUEUE PROGRESS</div>
              <div style={{ background: '#c4be9e', height: 8, borderRadius: 2 }}>
                <div style={{ height: '100%', background: '#2c4a7a', borderRadius: 2, transition: 'width 0.2s', width: `${waitProgress}%` }} />
              </div>
              <div style={{ fontSize: 9, color: '#888', marginTop: 4 }}>
                {waitProgress < 100 ? `Processing... (${waitProgress}%)` : 'Supervisor is available.'}
              </div>
            </div>
          </div>
        )}

        {/* CLERK */}
        {screen === 'clerk' && (
          <div>
            <div style={{ background: '#e8e2ce', border: '1px solid #c4be9e', padding: 12, marginBottom: 12, borderLeft: '3px solid #2c4a7a' }}>
              <div style={{ fontSize: 10, color: '#444', lineHeight: 1.8 }}>
                <em>&ldquo;I see the issue. You need Form B-7, Section 4. Which requires Form A-3.
                Which requires Form B-7, Section 3. Which requires Form C-12.
                Which requires Form A-3.&rdquo;</em>
              </div>
              <div style={{ fontSize: 9, color: '#888', marginTop: 4 }}>— CLERK, WINDOW 3</div>
            </div>
            <div style={{ background: '#e8e2ce', border: '1px solid #c4be9e', padding: 12, marginBottom: 12, borderLeft: '3px solid #cc8822' }}>
              <div style={{ fontSize: 10, color: '#444', lineHeight: 1.8 }}>
                <em>&ldquo;There is another option. I should have mentioned this earlier.
                There is a door at the back of the building that has never required any forms.
                It has been open the whole time. I apologize for the inconvenience.&rdquo;</em>
              </div>
              <div style={{ fontSize: 9, color: '#888', marginTop: 4 }}>— CLERK, WINDOW 3</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setLoopCount(2); visit('lobby') }} style={{ padding: '8px 16px', background: '#2c4a7a', color: '#fff', border: 'none', fontSize: 10, cursor: 'pointer', letterSpacing: '0.1em', fontFamily: 'inherit' }}>RETURN TO LOBBY</button>
            </div>
          </div>
        )}

        {/* MAINTENANCE */}
        {screen === 'maintenance' && (
          <div>
            <Notice type="warning">
              AUTHORIZED PERSONNEL ONLY.<br />
              <span style={{ color: '#6a5a12' }}>No forms required.</span>
            </Notice>
            <div style={{ background: '#e8e2ce', border: '1px solid #c4be9e', padding: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: '#555', lineHeight: 1.7 }}>
                The corridor is unlabeled. It leads somewhere.<br />
                You do not need to fill anything out to proceed.<br />
                This is unusual.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => navigateTo(1 as WorldId, { type: 'fold' as PortalType })} style={{
                padding: '10px 20px', background: '#444', color: '#ccc',
                border: '1px solid #888', fontSize: 10, cursor: 'pointer', letterSpacing: '0.1em', fontFamily: 'inherit',
              }}>PROCEED THROUGH DOOR</button>
              <button onClick={() => visit('lobby')} style={{ padding: '8px 16px', background: 'none', color: '#666', border: '1px solid #aaa', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}>← LOBBY</button>
            </div>
          </div>
        )}

      </Building>
    </div>
  )
}
