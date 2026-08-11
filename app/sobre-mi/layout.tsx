import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sobre Nosotros — Liderazgo & Visión Comercial con IA',
  description: 'Conoce al equipo detrás de SmartContacts. Desarrollamos arquitectura de software, inteligencia artificial agéntica y estrategias avanzadas de crecimiento B2B.',
  alternates: {
    canonical: 'https://smartcontacts.cloud/sobre-mi',
  },
  openGraph: {
    title: 'Sobre Nosotros — SmartContacts',
    description: 'Arquitectura tecnológica y visión estratégica orientada al crecimiento comercial acelerado.',
    url: 'https://smartcontacts.cloud/sobre-mi',
  },
}

export default function SobreMiLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
