import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ZeroCost - Discover Free Events',
  description: 'Find free food, events, giveaways, and community opportunities near you',
  keywords: ['free food', 'free events', 'giveaways', 'community', 'campus events'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full w-full overflow-hidden`}>
        {children}
      </body>
    </html>
  )
}


