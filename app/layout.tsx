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
