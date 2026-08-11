import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Términos y Condiciones del Servicio',
  description: 'Términos y Condiciones de Uso de las Unidades de Crecimiento Comercial y servicios agénticos de SmartContacts.',
  alternates: {
    canonical: 'https://smartcontacts.cloud/terminos',
  },
  openGraph: {
    title: 'Términos y Condiciones — SmartContacts',
    description: 'Condiciones operativas y de contratación de servicios comerciales.',
    url: 'https://smartcontacts.cloud/terminos',
  },
}

export default function TerminosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
