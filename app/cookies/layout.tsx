import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Cookies & Almacenamiento Local',
  description: 'Conoce cómo utilizamos cookies esenciales y técnicas de analítica en SmartContacts para garantizar una navegación rápida, segura y funcional.',
  alternates: {
    canonical: 'https://smartcontacts.cloud/cookies',
  },
  openGraph: {
    title: 'Política de Cookies — SmartContacts',
    description: 'Información sobre el uso de cookies y almacenamiento de sesión en nuestra plataforma.',
    url: 'https://smartcontacts.cloud/cookies',
  },
}

export default function CookiesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
