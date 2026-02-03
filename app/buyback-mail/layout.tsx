import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'スマホ買取申請フォーム',
  description: 'スマホ買取の事前査定・申請フォーム',
}

export default function BuybackMailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
