export interface Country {
  code: string          // ISO 2-letter code (e.g. 'CO', 'MX')
  name: string          // Country Name in Spanish
  dialCode: string      // International dial code (e.g. '+57')
  flagUrl: string       // High-res SVG flag URL
  placeholder: string   // Phone input format example
}

export const COUNTRIES: Country[] = [
  {
    code: 'CO',
    name: 'Colombia',
    dialCode: '+57',
    flagUrl: 'https://flagcdn.com/w40/co.png',
    placeholder: '300 123 4567',
  },
  {
    code: 'MX',
    name: 'México',
    dialCode: '+52',
    flagUrl: 'https://flagcdn.com/w40/mx.png',
    placeholder: '55 1234 5678',
  },
  {
    code: 'US',
    name: 'Estados Unidos',
    dialCode: '+1',
    flagUrl: 'https://flagcdn.com/w40/us.png',
    placeholder: '202 555 0123',
  },
  {
    code: 'ES',
    name: 'España',
    dialCode: '+34',
    flagUrl: 'https://flagcdn.com/w40/es.png',
    placeholder: '612 345 678',
  },
  {
    code: 'AR',
    name: 'Argentina',
    dialCode: '+54',
    flagUrl: 'https://flagcdn.com/w40/ar.png',
    placeholder: '9 11 1234 5678',
  },
  {
    code: 'CL',
    name: 'Chile',
    dialCode: '+56',
    flagUrl: 'https://flagcdn.com/w40/cl.png',
    placeholder: '9 1234 5678',
  },
  {
    code: 'PE',
    name: 'Perú',
    dialCode: '+51',
    flagUrl: 'https://flagcdn.com/w40/pe.png',
    placeholder: '912 345 678',
  },
  {
    code: 'EC',
    name: 'Ecuador',
    dialCode: '+593',
    flagUrl: 'https://flagcdn.com/w40/ec.png',
    placeholder: '91 234 5678',
  },
  {
    code: 'VE',
    name: 'Venezuela',
    dialCode: '+58',
    flagUrl: 'https://flagcdn.com/w40/ve.png',
    placeholder: '412 123 4567',
  },
  {
    code: 'BR',
    name: 'Brasil',
    dialCode: '+55',
    flagUrl: 'https://flagcdn.com/w40/br.png',
    placeholder: '11 91234 5678',
  },
  {
    code: 'PA',
    name: 'Panamá',
    dialCode: '+507',
    flagUrl: 'https://flagcdn.com/w40/pa.png',
    placeholder: '6123 4567',
  },
  {
    code: 'CR',
    name: 'Costa Rica',
    dialCode: '+506',
    flagUrl: 'https://flagcdn.com/w40/cr.png',
    placeholder: '8123 4567',
  },
  {
    code: 'DO',
    name: 'República Dominicana',
    dialCode: '+1',
    flagUrl: 'https://flagcdn.com/w40/do.png',
    placeholder: '809 123 4567',
  },
  {
    code: 'GT',
    name: 'Guatemala',
    dialCode: '+502',
    flagUrl: 'https://flagcdn.com/w40/gt.png',
    placeholder: '5123 4567',
  },
  {
    code: 'UY',
    name: 'Uruguay',
    dialCode: '+598',
    flagUrl: 'https://flagcdn.com/w40/uy.png',
    placeholder: '91 234 567',
  },
  {
    code: 'BO',
    name: 'Bolivia',
    dialCode: '+591',
    flagUrl: 'https://flagcdn.com/w40/bo.png',
    placeholder: '7123 4567',
  },
  {
    code: 'PY',
    name: 'Paraguay',
    dialCode: '+595',
    flagUrl: 'https://flagcdn.com/w40/py.png',
    placeholder: '981 123 456',
  },
  {
    code: 'SV',
    name: 'El Salvador',
    dialCode: '+503',
    flagUrl: 'https://flagcdn.com/w40/sv.png',
    placeholder: '7123 4567',
  },
  {
    code: 'HN',
    name: 'Honduras',
    dialCode: '+504',
    flagUrl: 'https://flagcdn.com/w40/hn.png',
    placeholder: '9123 4567',
  },
  {
    code: 'NI',
    name: 'Nicaragua',
    dialCode: '+505',
    flagUrl: 'https://flagcdn.com/w40/ni.png',
    placeholder: '8123 4567',
  },
  {
    code: 'CA',
    name: 'Canadá',
    dialCode: '+1',
    flagUrl: 'https://flagcdn.com/w40/ca.png',
    placeholder: '416 555 0123',
  },
  {
    code: 'GB',
    name: 'Reino Unido',
    dialCode: '+44',
    flagUrl: 'https://flagcdn.com/w40/gb.png',
    placeholder: '7123 456789',
  },
]

export const DEFAULT_COUNTRY = COUNTRIES[0] // Colombia (+57)

export function getCountryByCode(code?: string): Country {
  if (!code) return DEFAULT_COUNTRY
  const upper = code.toUpperCase()
  return COUNTRIES.find((c) => c.code === upper) || DEFAULT_COUNTRY
}
