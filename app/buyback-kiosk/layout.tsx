import { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'ONE STOP 買取',
  description: 'ONE STOP 買取キオスク',
  manifest: '/manifest-kiosk.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ONE STOP 買取',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#004AAD',
}

export default function KioskLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
