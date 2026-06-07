'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useWorldStore } from '@/lib/world-store'
import HomeButton from './HomeButton'

const EMAIL_PAGE = Math.floor(Math.random() * 52) + 1

// Pages with content (1, 4, 7, 13, 19, 27, 33, 40, 47, 52)
const CONTENT_PAGES: Record<number, { title?: string; body: string; footnotes?: string[] }> = {
  1: {
    title: 'Preliminary Observations',
    body: `The individual in question presents as someone who builds things. Not merely assembles — builds. There is a distinction which the committee has noted but which resists easy articulation.

Subject was observed in a state of Boulder, Colorado, at an altitude of approximately 5,430 feet above sea level. Whether the altitude is relevant to the observed behaviors remains an open question.

Initial review suggests the subject operates across a range of domains which, in another context, might appear contradictory. The committee reserves judgment on this matter.¹

What can be confirmed: the work exists. The commits have timestamps. The trails have been run. These are facts.`,
    footnotes: ['¹ Ref. Section 7, "The Problem of Coherence in Generalist Practice," unpublished.'],
  },
  4: {
    title: 'On the Question of Software',
    body: `The subject has been observed building applications. Primary instruments: Next.js, TypeScript, Three.js, React Three Fiber, Zustand. Secondary instruments: patience, insomnia, version control.

Of particular note is the application designated "Digger" (ref. production deployment, 23:47, 2024-11-09). This application concerns itself with music discovery — with the problem of finding things you did not know you were looking for.

The committee finds this thematically significant.¹

The deployment occurred without incident. There were 47 objects in the universe at the time of launch. One of the users online was the subject himself.²`,
    footnotes: [
      '¹ Cross-reference with Section 47, "The Methodology of Making Things For Their Own Sake."',
      '² This information was provided by the subject and cannot be independently verified.',
    ],
  },
  7: {
    title: 'Notes on Physical Activity',
    body: `Running appears to serve a function for the subject which is distinct from athletic performance. The distances recorded — Pikes Peak (14,115 ft), Mt. Elbert (14,439 ft), Boulder Marathon (3:41:22), Golden Gate Canyon 25K — suggest a pattern of voluntary difficulty.

The committee hypothesizes that running provides something the subject cannot articulate. This is common. Many forms of physical exertion do. The inability to articulate a thing does not diminish its function.

The subject was observed looking down into the Black Canyon of the Gunnison for a period of time that was longer than necessary.¹ The canyon is 2,722 feet deep at the rim. The sense of scale did not register correctly, and the subject continued anyway.`,
    footnotes: ['¹ Duration not recorded. "Too long" was the subject\'s own characterization.'],
  },
  13: {
    title: 'Behavioral Annotations: Creation',
    body: `The subject demonstrates what the committee has termed "compulsive building." This is not pathological. Projects are completed. Some are shipped. The distinction between a project that is done and a project that is good enough to ship is one the subject appears to have resolved, at least partially.

Observed: subject remained awake until 3 a.m. on a work product nobody had requested. The response from the first person who saw it was: "wait, how did you do that?" The subject found this sufficient.

This is noted without judgment. The committee has seen worse definitions of enough.

The email address is: healthreinvented@gmail.com¹`,
    footnotes: [`¹ Current as of this filing, page ${EMAIL_PAGE} of this document.`],
  },
  19: {
    title: 'Colorado, Generally',
    body: `The subject relocated to Colorado in 2022. The specific mechanism of this relocation — what was left, what was moved toward — falls outside the committee's mandate to evaluate.

What can be observed: the subject runs trails in the Rocky Mountains with some regularity. The light above treeline is different, though this too resists description. The subject has noted that "you can't photograph it correctly. You have to be there."

The committee accepts this. Some things are not archivable.

The Maroon Bells were visited in September 2023, at 5 a.m., before the crowds. Red rock that appeared to be lit from the inside.¹`,
    footnotes: ['¹ This is how the subject described it. The committee has not independently confirmed the phenomenon.'],
  },
  27: {
    title: 'A Note on Process',
    body: `The subject appears to operate under a set of working principles which are not written down anywhere but which are nonetheless consistent across observed behaviors:

1. Start because not starting feels worse.
2. The first version is always wrong. This is the process.
3. Build for the next person who reads it, who is usually you, six months later.
4. The best line of code deletes four hundred lines.

These are not unusual. The committee notes that they are also not commonly practiced. There is a gap between knowing and doing that the subject has, on balance, managed.¹`,
    footnotes: ['¹ This is not a complete accounting. The gap remains.'],
  },
  33: {
    title: 'Technical Inventory (Partial)',
    body: `As of this filing, the subject maintains the following:

Primary: Next.js 15, TypeScript (strict), Three.js, React Three Fiber, Zustand, Tailwind CSS

Secondary: Python (data analysis), SQLite (lightweight persistence), Web Audio API (sound design)

Explored: WebGL shader programming, audio synthesis, procedural generation, parametric design

Preferred environment: terminal, dark theme, JetBrains Mono, a problem that isn't solved yet.

The committee notes that this list is incomplete by design. The subject does not believe in pinning a skill level to a technology. Things learned. Things being learned. Things not yet known. The categories are permeable.`,
    footnotes: [],
  },
  40: {
    title: 'On the Subject of Work',
    body: `The subject is currently available.

"Available" is a word that hides a great deal. What the subject means: if you have an interesting problem, and you care about how it's solved, and you want someone who will stay up too late thinking about it — the subject is available for that.

What the subject is not available for: things that don't matter to anyone, problems defined by committee, work where quality is optional.

This is not arrogance. It is a description of where the subject's best work comes from.¹

Contact: healthreinvented@gmail.com`,
    footnotes: ['¹ Subject acknowledges this is also a description of where the best arguments come from.'],
  },
  47: {
    title: 'The Number Forty-Seven',
    body: `The committee has noted the recurrence of the number 47 in the subject's work and documentation:

— 47 objects in the Digger universe at launch
— Page 47 of this document
— A specific shade of green used in interface work (#22C55E → values sum to 47 in some implementations)
— Section 47 appears as a cross-reference in earlier footnotes

The subject, when asked, denied that this was intentional. The committee finds this response interesting.¹

Either the number 47 is a coincidence, or it is not. The committee declines to adjudicate. We note only that the subject pays attention. What it notices is not random, even when it claims to be.`,
    footnotes: ['¹ All subjects claim their patterns are unintentional.'],
  },
  52: {
    title: 'Final Page',
    body: `This document was assembled from observations that were never meant to be organized.

The committee's conclusion, such as it is: the subject builds things because something in the process of building them teaches something that can't be taught any other way. This is true of running as well. And of going up past treeline where the wind is horizontal and personal.

Whether this is sufficient is not the committee's determination to make.

What we can confirm: the work is real. The commits have timestamps. The trails have been run.

You got here. That's something.`,
    footnotes: [],
  },
}

export default function World6Document() {
  const navigateTo = useWorldStore(s => s.navigateTo)
  const [page, setPage] = useState(1)
  const [inputPage, setInputPage] = useState('1')
  const [blankClicks, setBlankClicks] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)

  const content = CONTENT_PAGES[page]

  const goToPage = useCallback((p: number) => {
    const clamped = Math.max(1, Math.min(52, p))
    setPage(clamped)
    setInputPage(clamped.toString())
    if (contentRef.current) contentRef.current.scrollTop = 0
  }, [])

  return (
    <div
      data-world="6"
      style={{
        position: 'fixed', inset: 0,
        background: '#fafaf7',
        fontFamily: '"Unna", Georgia, serif',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Document header */}
      <div style={{
        borderBottom: '1px solid rgba(0,0,0,0.08)',
        padding: '12px 40px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: '#f5f0eb',
      }}>
        <div style={{ fontSize: 11, letterSpacing: '0.15em', color: 'rgba(0,0,0,0.3)', textTransform: 'uppercase' }}>
          Confidential Review · Internal Document
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => goToPage(page - 1)} disabled={page <= 1} style={{ background: 'none', border: 'none', cursor: page <= 1 ? 'default' : 'pointer', color: page <= 1 ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.4)', fontFamily: '"Unna", serif', fontSize: 16 }}>‹</button>
          <input
            value={inputPage}
            onChange={e => setInputPage(e.target.value)}
            onBlur={() => goToPage(parseInt(inputPage) || 1)}
            onKeyDown={e => e.key === 'Enter' && goToPage(parseInt(inputPage) || 1)}
            style={{ width: 40, textAlign: 'center', border: 'none', borderBottom: '1px solid rgba(0,0,0,0.15)', background: 'transparent', fontFamily: '"Unna", serif', fontSize: 12, color: 'rgba(0,0,0,0.5)', outline: 'none', padding: '2px 4px' }}
          />
          <span style={{ fontFamily: '"Unna", serif', fontSize: 12, color: 'rgba(0,0,0,0.3)' }}>of 52</span>
          <button onClick={() => goToPage(page + 1)} disabled={page >= 52} style={{ background: 'none', border: 'none', cursor: page >= 52 ? 'default' : 'pointer', color: page >= 52 ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.4)', fontFamily: '"Unna", serif', fontSize: 16 }}>›</button>
        </div>
      </div>

      {/* Document body */}
      <div ref={contentRef} style={{ flex: 1, overflowY: 'auto', padding: '60px 0' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 40px' }}>
          {/* Page number */}
          <div style={{ fontSize: 10, letterSpacing: '0.2em', color: 'rgba(0,0,0,0.2)', marginBottom: 40, textTransform: 'uppercase' }}>
            Page {page}
          </div>

          {content ? (
            <>
              {content.title && (
                <h2 style={{ fontSize: 24, fontWeight: 400, color: 'rgba(0,0,0,0.75)', marginBottom: 32, lineHeight: 1.3, letterSpacing: '-0.01em' }}>
                  {content.title}
                </h2>
              )}
              <div style={{ fontSize: 16, lineHeight: 2.1, color: 'rgba(0,0,0,0.6)', whiteSpace: 'pre-wrap' }}>
                {content.body}
              </div>
              {content.footnotes && content.footnotes.length > 0 && (
                <div style={{ marginTop: 48, paddingTop: 20, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                  {content.footnotes.map((fn, i) => (
                    <div key={i} style={{ fontSize: 12, lineHeight: 1.8, color: 'rgba(0,0,0,0.35)', marginBottom: 8, fontStyle: 'italic' }}>
                      {fn}
                    </div>
                  ))}
                </div>
              )}

              {/* Social links as archival citations on specific pages */}
              {page === 40 && (
                <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                  <div style={{ fontSize: 11, letterSpacing: '0.15em', color: 'rgba(0,0,0,0.25)', marginBottom: 12, textTransform: 'uppercase' }}>Archival References</div>
                  {[
                    { label: 'GitHub: tyler-emdur', href: 'https://github.com/tyler-emdur' },
                    { label: 'LinkedIn: tyleremdur', href: 'https://linkedin.com/in/tyler-emdur' },
                  ].map(link => (
                    <div key={link.label} style={{ fontSize: 13, lineHeight: 2, color: 'rgba(0,0,0,0.35)', fontStyle: 'italic' }}>
                      <a href={link.href} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(0,0,0,0.4)', textDecoration: 'none', borderBottom: '1px solid rgba(0,0,0,0.15)' }}>
                        {link.label}
                      </a>
                    </div>
                  ))}
                </div>
              )}

              {/* Continue reading on page 52 → World 8 */}
              {page === 52 && (
                <button
                  onClick={() => navigateTo(8, { type: 'slide-right' })}
                  style={{
                    marginTop: 48, background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: '"Unna", serif', fontSize: 14, color: 'rgba(0,0,0,0.35)',
                    letterSpacing: '0.05em', textDecoration: 'underline', padding: 0,
                    fontStyle: 'italic',
                  }}
                >
                  continue reading →
                </button>
              )}
            </>
          ) : (
            <div
              onClick={() => {
                const c = blankClicks + 1
                setBlankClicks(c)
                if (c >= 7) navigateTo(16, { type: 'fold' })
              }}
              style={{ fontSize: 13, color: blankClicks > 0 ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.15)', fontStyle: 'italic', lineHeight: 2, cursor: 'default' }}
            >
              [This page is intentionally left blank.{blankClicks > 2 ? ` (${7 - blankClicks})` : ''}]
            </div>
          )}
        </div>
      </div>

      {/* Page navigation strip */}
      <div style={{
        borderTop: '1px solid rgba(0,0,0,0.06)',
        padding: '10px 40px',
        display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center',
        background: '#f5f0eb',
      }}>
        {Array.from({ length: 52 }, (_, i) => i + 1).map(p => (
          <button
            key={p}
            onClick={() => goToPage(p)}
            style={{
              width: 18, height: 18, border: 'none',
              background: page === p ? 'rgba(0,0,0,0.15)' : CONTENT_PAGES[p] ? 'rgba(0,0,0,0.06)' : 'transparent',
              cursor: 'pointer', borderRadius: 1,
              fontFamily: 'monospace', fontSize: 7,
              color: page === p ? 'rgba(0,0,0,0.6)' : CONTENT_PAGES[p] ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.1s',
            }}
          >
            {CONTENT_PAGES[p] ? '•' : ''}
          </button>
        ))}
      </div>
      <HomeButton />
    </div>
  )
}
