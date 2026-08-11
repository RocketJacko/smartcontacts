import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cobertura de Datos B2B por Departamento en Colombia',
  description: 'Explora nuestra red nacional de datos comerciales B2B con más de 200,000 contactos verificados y segmentados en los 32 departamentos de Colombia.',
  keywords: [
    'Base de Datos B2B Colombia',
    'Contactos Empresariales Colombia',
    'Directorio B2B por Departamento',
    'Prospección Regional Colombia',
    'SmartContacts Cobertura',
  ],
  alternates: {
    canonical: 'https://smartcontacts.cloud/cobertura',
  },
  openGraph: {
    title: 'Cobertura de Datos B2B — Colombia | SmartContacts',
    description: 'Acceso a +200,000 contactos comerciales verificados en los 32 departamentos de Colombia.',
    url: 'https://smartcontacts.cloud/cobertura',
  },
}

export default function CoberturaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
