import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Modalidades de Operación — In-House vs Crecimiento Delegado',
  description: 'Conoce nuestras dos modalidades de servicio: Unidad en Tu Infraestructura (In-House) o Unidad de Crecimiento Delegada (Full Service). Soluciones adaptadas a tu modelo de negocio.',
  alternates: {
    canonical: 'https://smartcontacts.cloud/modalidades',
  },
  openGraph: {
    title: 'Modalidades de Operación — SmartContacts',
    description: 'Flexibilidad operativa total: implementa tu unidad de crecimiento in-house o delégala por completo.',
    url: 'https://smartcontacts.cloud/modalidades',
  },
}

export default function ModalidadesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
