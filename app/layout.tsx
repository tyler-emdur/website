import type { Metadata } from 'next'
import './globals.css'
import CustomCursor from '@/components/cursor/CustomCursor'
import { CursorProvider } from '@/components/cursor/CursorContext'

export const metadata: Metadata = {
  title: 'Tyler Emdur',
  description: 'A digital universe.',
  openGraph: { title: 'Tyler Emdur', description: 'A digital universe.', type: 'website' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* One font per world — no sharing */}
        <link href="https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=VT323&family=Special+Elite&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Oxanium:wght@300;400;700&family=Playfair+Display:ital,wght@0,400;1,400&family=Unna:ital,wght@0,400;1,400&family=Pirata+One&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
        {/* Source code comment — Tyler's email */}
        {/* <!-- hello: healthreinvented@gmail.com --> */}
      </head>
      <body>
        <CursorProvider>
          <CustomCursor />
          {children}
        </CursorProvider>
      </body>
    </html>
  )
}
