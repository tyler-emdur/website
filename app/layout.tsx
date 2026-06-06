import type { Metadata } from 'next'
import './globals.css'
import CustomCursor from '@/components/cursor/CustomCursor'
import { CursorProvider } from '@/components/cursor/CursorContext'

export const metadata: Metadata = {
  title: 'Tyler Emdur',
  description: 'A digital world.',
  openGraph: {
    title: 'Tyler Emdur',
    description: 'A digital world.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="grain">
        <CursorProvider>
          <CustomCursor />
          {children}
        </CursorProvider>
      </body>
    </html>
  )
}
