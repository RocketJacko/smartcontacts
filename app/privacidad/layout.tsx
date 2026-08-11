import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidad & Tratamiento de Datos Personales',
  description: 'Política de Tratamiento de Datos Personales de SmartContacts en cumplimiento con la Ley 1581 de 2012, Decreto 1377 de 2013 y regulación de Habeas Data en Colombia.',
  alternates: {
    canonical: 'https://smartcontacts.cloud/privacidad',
  },
  openGraph: {
    title: 'Política de Privacidad — SmartContacts',
    description: 'Cumplimiento normativo de protección de datos personales y Habeas Data en Colombia.',
    url: 'https://smartcontacts.cloud/privacidad',
  },
}

export default function PrivacidadLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
