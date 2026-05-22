import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'FruiTrack',
    template: '%s | FruiTrack',   // ← các page con có metadata riêng sẽ hiển thị "Tổng quan | FruiTrack"
  },
  description: 'Hệ thống quản lý cửa hàng trái cây',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full flex flex-col">  {/* ← đổi min-h-full → h-full cho khớp với html */}
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}