import type { Metadata, Viewport } from 'next'
import './globals.css'
import Header from '@/components/Header'
import { HeaderProvider } from '@/contexts/HeaderContext'
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration'

export const metadata: Metadata = {
  title: 'Bank It - Online Dice Game',
  description: 'Play Bank It dice game with your friends online',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Bank It',
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  themeColor: '#A3E635',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-display bg-background-dark text-gray-100">
        <ServiceWorkerRegistration />
        <HeaderProvider>
          <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
            {/* Background gradients */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#120023] via-[#051412] to-[#0a0a0a]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(139,92,246,0.15),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(20,184,166,0.15),_transparent_40%)]"></div>

            {/* Content */}
            <div className="relative flex h-full grow flex-col">
              <Header />

              <main className="flex-1">
                {children}
              </main>
            </div>
          </div>
        </HeaderProvider>
      </body>
    </html>
  )
}
