import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono, IBM_Plex_Sans } from 'next/font/google'
import { Courier_Prime } from 'next/font/google'
import './globals.css'

const _geist = Geist({ subsets: ["latin"], display: "swap" });
const _geistMono = Geist_Mono({ subsets: ["latin"], display: "swap" });
const _courierPrime = Courier_Prime({ weight: ["400", "700"], subsets: ["latin"], display: "swap" });
const _ibmPlexSans = IBM_Plex_Sans({ weight: ["300", "400", "500", "600"], subsets: ["latin"], display: "swap" });

import type { Viewport } from 'next'

export const viewport: Viewport = {
  themeColor: '#F5F4F0',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = {
  metadataBase: new URL('https://smartcontacts.cloud'),
  title: {
    default: 'SmartContacts — Unidad de Crecimiento & Agentes de IA para Ventas',
    template: '%s | SmartContacts',
  },
  description: 'Convertimos la tecnología en ventas reales. Escalamos tu fuerza comercial con Agentes de Inteligencia Artificial, automatizaciones operativas y bases de datos B2B segmentadas por departamento.',
  keywords: [
    'SmartContacts',
    'Unidad de Crecimiento Comercial',
    'Agentes de IA Ventas Colombia',
    'Prospección B2B Automatizada',
    'Inteligencia Comercial IA',
    'Base de Datos Empresas Colombia',
    'Automatización de Ventas B2B',
    'CRM Inteligencia Artificial',
    'Generación de Leads B2B',
  ],
  authors: [{ name: 'SmartContacts', url: 'https://smartcontacts.cloud' }],
  creator: 'SmartContacts',
  publisher: 'SmartContacts',
  alternates: {
    canonical: 'https://smartcontacts.cloud',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'googlea8c27253a63b1bd5',
  },
  openGraph: {
    title: 'SmartContacts — Unidad de Crecimiento & Agentes de IA para Ventas',
    description: 'Convertimos la tecnología en ventas reales. Escalamos tu capacidad comercial con IA, prospección activa y datos B2B por departamento.',
    type: 'website',
    url: 'https://smartcontacts.cloud',
    siteName: 'SmartContacts',
    locale: 'es_CO',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SmartContacts — Unidad de Crecimiento & Agentes de IA para Ventas',
    description: 'Convertimos la tecnología en ventas reales con Agentes de IA y datos B2B.',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png?v=2',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png?v=2',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg?v=2',
        type: 'image/svg+xml',
      },
      {
        url: '/favicon.ico?v=2',
      },
    ],
    shortcut: '/favicon.ico?v=2',
    apple: '/apple-icon.png?v=2',
  },
}

import { LanguageProvider } from '@/lib/language-context'

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://smartcontacts.cloud/#organization',
      name: 'SmartContacts',
      url: 'https://smartcontacts.cloud',
      logo: 'https://smartcontacts.cloud/icon.svg',
      slogan: 'Flujo sin pausas — Convertimos la tecnología en ventas reales',
      description: 'SmartContacts crea unidades de crecimiento comercial para empresas B2B combinando consultoría, prospección activa, inteligencia de datos con +200k contactos, Agentes de IA, RAG y automatizaciones a medida.',
      sameAs: ['https://smartcontacts.cloud'],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://smartcontacts.cloud/#website',
      url: 'https://smartcontacts.cloud',
      name: 'SmartContacts',
      description: 'Unidad de Crecimiento & Inteligencia Comercial con Inteligencia Artificial B2B',
      publisher: {
        '@id': 'https://smartcontacts.cloud/#organization',
      },
      inLanguage: 'es',
    },
    {
      '@type': 'ProfessionalService',
      '@id': 'https://smartcontacts.cloud/#service',
      name: 'SmartContacts Growth Unit',
      url: 'https://smartcontacts.cloud',
      provider: {
        '@id': 'https://smartcontacts.cloud/#organization',
      },
      areaServed: ['Colombia', 'Latinoamérica'],
      serviceType: ['Agentes de IA para Ventas', 'Prospección B2B', 'Inteligencia Comercial', 'Automatización CRM'],
      description: 'Infraestructura autónoma de prospección y agentes inteligentes para acelerar el embudo comercial B2B.',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://smartcontacts.cloud/#software',
      name: 'SmartContacts Commercial Growth Engine',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'All',
      url: 'https://smartcontacts.cloud',
      description: 'Motor agéntico autónomo de prospección B2B, calificación RAG y automatización comercial para empresas.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://smartcontacts.cloud/#faq',
      mainEntity: [
        {
          '@type': 'Question',
          name: '¿Qué es una Unidad de Crecimiento Comercial con IA en SmartContacts?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Una Unidad de Crecimiento Comercial con IA en SmartContacts es una infraestructura agéntica autónoma que ejecuta la labor comercial completa de una empresa (prospección en base propia perfilada, contacto outbound por WhatsApp/Voz, calificación de leads, manejo de objeciones y agendamiento o cierre de ventas) sin inflar la nómina fija ni sumar pasivos laborales.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Cómo funcionan los Agentes de Inteligencia Artificial para ventas B2B?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Los Agentes de Inteligencia Artificial B2B operan mediante arquitecturas RAG (Retrieval-Augmented Generation) entrenadas con el conocimiento comercial, catálogo de productos y políticas exactas de tu marca. Prospectan en nuestra base de datos nacional de empresas y personas perfiladas, presentan ofertas personalizadas y gestionan oportunidades en tiempo real.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Cuál es la cobertura de la base de datos de empresas en Colombia?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'SmartContacts cuenta con una base de datos propia perfilada con cobertura nacional en los 33 departamentos de Colombia, segmentada por más de 5 variables clave: ubicación geográfica, actividad económica, rango de edad, género y nivel de ingresos o capacidad de compra.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Qué diferencia existe entre un CRM tradicional y SmartContacts?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Un CRM tradicional es un software pasivo donde tus empleados deben ingresar datos manualmente. SmartContacts es un canal activo de ventas con agentes agénticos de IA que prospectan proactivamente, inician conversaciones, responden objeciones y cierran acuerdos automáticamente.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Qué modalidades de implementación ofrecen (In-House vs Delegado)?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Ofrecemos 2 modalidades: 1) Comercialización Delegada (operamos directamente sobre nuestra propia base de datos como un canal de ventas externo a comisión/resultados) y 2) Instalación In-House (diseñamos, entrenamos e instalamos el sistema agéntico dentro de la operación de tu empresa con transferencia total de conocimiento).',
          },
        },
      ],
    },
  ],
}

import { FloatingWhatsApp } from '@/components/floating-whatsapp'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://hebbkx1anhila5yf.public.blob.vercel-storage.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`font-sans antialiased w-full max-w-full overflow-x-hidden`}>
        <LanguageProvider>
          <main id="main-content" className="w-full max-w-full overflow-x-hidden">
            {children}
          </main>
          <FloatingWhatsApp />
        </LanguageProvider>
      </body>
    </html>
  )
}
