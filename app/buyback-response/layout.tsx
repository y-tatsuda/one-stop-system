import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ONE STOP - 本査定結果確認',
  description: 'スマホ買取の本査定結果を確認し、承諾または返却を選択できます',
  openGraph: {
    title: 'ONE STOP - 本査定結果確認',
    description: 'スマホ買取の本査定結果を確認し、承諾または返却を選択できます',
    siteName: 'ONE STOP',
    type: 'website',
  },
}

export default function BuybackResponseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
