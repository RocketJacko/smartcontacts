import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Propuesta de Valor — Unidad de Crecimiento & Sistema Agéntico',
  description: 'Descubre nuestra metodología agéntica: prospección activa, inteligencia de datos B2B, Agentes de IA autónomos y software a medida para escalar ventas.',
  alternates: {
    canonical: 'https://smartcontacts.cloud/propuesta',
  },
  openGraph: {
    title: 'Propuesta de Valor — SmartContacts',
    description: 'No reemplazamos tu equipo de ventas. Creamos una nueva unidad de crecimiento agéntica.',
    url: 'https://smartcontacts.cloud/propuesta',
  },
}

export default function PropuestaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
