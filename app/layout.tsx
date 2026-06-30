import type { Metadata } from 'next'
import './globals.css'

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
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IM+Fell+English:ital@0;1&family=VT323&family=Oxanium:wght@300;400;700&family=Space+Mono:ital,wght@0,400;0,700;1,400&family=JetBrains+Mono:wght@400;500&family=Press+Start+2P&display=swap" rel="stylesheet" />
        {/* Source code comment — Tyler's email */}
        {/* <!-- hello: healthreinvented@gmail.com --> */}
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
