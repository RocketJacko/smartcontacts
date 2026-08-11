import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Marco Legal & Cumplimiento Normativo Colombia',
  description: 'Marco Legal y Cumplimiento Normativo de SmartContacts en Colombia: Ley 1581/2012, Ley 1273/2009 de Delitos Informáticos, Ley 1480/2011 y supervisión de la SIC.',
  alternates: {
    canonical: 'https://smartcontacts.cloud/legal',
  },
  openGraph: {
    title: 'Marco Legal & Normativa — SmartContacts',
    description: 'Cumplimiento normativo y seguridad en servicios de inteligencia comercial B2B.',
    url: 'https://smartcontacts.cloud/legal',
  },
}

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
