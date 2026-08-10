import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono, IBM_Plex_Sans } from 'next/font/google'
import { Courier_Prime } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"], display: "swap" });
const _geistMono = Geist_Mono({ subsets: ["latin"], display: "swap" });
const _courierPrime = Courier_Prime({ weight: ["400", "700"], subsets: ["latin"], display: "swap" });
const _ibmPlexSans = IBM_Plex_Sans({ weight: ["300", "400", "500", "600"], subsets: ["latin"], display: "swap" });

export const viewport = {
  themeColor: '#F5F4F0',
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: 'SmartContacts — Unidad de Crecimiento & Inteligencia Comercial',
  description: 'Convertimos la tecnología en ventas reales. Amplificamos tu capacidad comercial mediante estrategia, Agentes de IA, automatización y una infraestructura propia de contactos segmentados.',
  keywords: ['SmartContacts', 'unidades de crecimiento', 'agentes IA', 'inteligencia comercial', 'prospección automatizada'],
  authors: [{ name: 'SmartContacts' }],
  verification: {
    google: 'googlea8c27253a63b1bd5',
  },
  openGraph: {
    title: 'SmartContacts — Unidad de Crecimiento & Inteligencia Comercial',
    description: 'Convertimos la tecnología en ventas reales. Amplificamos tu capacidad comercial con IA y automatizaciones sobre datos segmentados por departamento.',
    type: 'website',
    url: 'https://smartcontacts.cloud',
    siteName: 'SmartContacts',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SmartContacts — Unidad de Crecimiento & Inteligencia Comercial',
    description: 'Convertimos la tecnología en ventas reales.',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

import { LanguageProvider } from '@/lib/language-context'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`font-sans antialiased`}>
        <LanguageProvider>
          <main id="main-content">
            {children}
          </main>
          <Analytics />
          <SpeedInsights />
        </LanguageProvider>
      </body>
    </html>
  )
}
