import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import './globals.css'
import { AuthProvider } from '@/app/contexts/AuthContext'
import ClientLayout from './client-layout'

export const metadata: Metadata = {
  title: 'ONE STOP',
  description: 'スマホ買取・修理サービス',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.png',
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ONE STOP',
  },
  openGraph: {
    title: 'ONE STOP - スマホ買取・修理',
    description: 'スマホ買取・修理サービス',
    siteName: 'ONE STOP',
    type: 'website',
  },
}

export const viewport: Viewport = {
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
    <html lang="ja">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <Suspense fallback={
          <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3F4F6' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '48px', height: '48px', border: '4px solid #E5E7EB', borderTopColor: '#3B82F6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
            </div>
          </div>
        }>
          <AuthProvider>
            <ClientLayout>{children}</ClientLayout>
          </AuthProvider>
        </Suspense>
      </body>
    </html>
  )
}