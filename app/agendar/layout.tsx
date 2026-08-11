import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Agendar Asesoría Estratégica — Reserva tu Sesión',
  description: 'Reserva una sesión de diagnóstico comercial para diseñar tu Unidad de Crecimiento con Inteligencia Artificial, Agentes de IA y automatizaciones a medida.',
  alternates: {
    canonical: 'https://smartcontacts.cloud/agendar',
  },
  openGraph: {
    title: 'Agendar Asesoría Estratégica — SmartContacts',
    description: 'Reserva tu espacio para evaluar la integración de una unidad de crecimiento agéntica en tu empresa.',
    url: 'https://smartcontacts.cloud/agendar',
  },
}

export default function AgendarLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
