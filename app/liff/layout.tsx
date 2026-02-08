import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ONE STOP - スマホ買取',
  description: 'LINEからスマホ買取の査定・申込ができます',
  openGraph: {
    title: 'ONE STOP - スマホ買取',
    description: 'LINEからスマホ買取の査定・申込ができます',
    siteName: 'ONE STOP',
    type: 'website',
  },
}

export default function LiffLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
