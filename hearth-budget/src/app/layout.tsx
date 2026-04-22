import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Budget',
  description: 'Track every dollar together',
  applicationName: 'Budget',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Budget',
  },
}

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
          <Providers>
            {children}
            <Toaster />
          </Providers>
        </body>
    </html>
  )
}
