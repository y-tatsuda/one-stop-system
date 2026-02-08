import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ONE STOP - スマホ買取申込',
  description: 'スマホ買取の事前査定・申込フォーム',
  openGraph: {
    title: 'ONE STOP - スマホ買取申込',
    description: 'スマホ買取の事前査定・申込フォーム',
    siteName: 'ONE STOP',
    type: 'website',
  },
}

export default function BuybackMailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
