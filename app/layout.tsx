import type { Metadata } from 'next'
import './globals.css'
import { IDENTITY } from '@/lib/identity'
import WorldManager from '@/components/worlds/WorldManager'

const DESCRIPTION = 'A digital universe.'

export const metadata: Metadata = {
  title: IDENTITY.name,
  description: DESCRIPTION,
  authors: [{ name: IDENTITY.name, url: `https://${IDENTITY.domain}` }],
  openGraph: { title: IDENTITY.name, description: DESCRIPTION, type: 'website' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* One font per world — no sharing */}
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IM+Fell+English:ital@0;1&family=VT323&family=Oxanium:wght@300;400;700&family=Space+Mono:ital,wght@0,400;0,700;1,400&family=JetBrains+Mono:wght@400;500&family=Press+Start+2P&display=swap" rel="stylesheet" />
      </head>
      <body>
        {/* For whoever reads the source. A JSX comment gets compiled away —
            this is the only way the note actually survives into the HTML.
            Same address the front door shows: a source-only inbox that
            disagreed with the visible one just looked like a stale site. */}
        <div hidden dangerouslySetInnerHTML={{ __html: `<!-- hello: ${IDENTITY.email} -->` }} />
        {/* The worlds render from here, not from a page, so that moving between
            /map and /garage never unmounts them — the store survives, and the
            portal animation runs over a live scene instead of a remount. Pages
            under app/[world]/ only declare *which* world; app/page.tsx only
            lays the front door on top of it. */}
        <WorldManager />
        {children}
      </body>
    </html>
  )
}
