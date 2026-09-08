import { NextResponse } from 'next/server'
import { getCountryByCode } from '@/lib/data/countries'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function isPrivateOrLocalIp(ip: string): boolean {
  if (!ip) return true
  const clean = ip.trim().toLowerCase()
  return (
    clean === '127.0.0.1' ||
    clean === '::1' ||
    clean === 'localhost' ||
    clean.startsWith('10.') ||
    clean.startsWith('192.168.') ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(clean) ||
    clean.startsWith('169.254.')
  )
}

export async function GET(request: Request) {
  try {
    // 1. Cabeceras edge de CDN / Proxy (Cloudflare, Vercel, Traefik custom)
    const headerCountry =
      request.headers.get('cf-ipcountry') ||
      request.headers.get('x-vercel-ip-country') ||
      request.headers.get('x-country-code') ||
      request.headers.get('x-real-ip-country')

    if (headerCountry && headerCountry !== 'XX' && headerCountry.length === 2) {
      const country = getCountryByCode(headerCountry.toUpperCase())
      return NextResponse.json(
        {
          countryCode: country.code,
          dialCode: country.dialCode,
          countryName: country.name,
          flagUrl: country.flagUrl,
          isCertain: true,
          provider: 'edge-header',
        },
        { status: 200 }
      )
    }

    // 2. Extraer IP pública del cliente
    const rawForwarded = request.headers.get('x-forwarded-for')
    let clientIp =
      rawForwarded?.split(',')[0]?.trim() ||
      request.headers.get('cf-connecting-ip')?.trim() ||
      request.headers.get('x-real-ip')?.trim() ||
      ''

    // Limpiar delimitadores o puertos IPv4 (ej. 1.2.3.4:5678)
    if (clientIp) {
      clientIp = clientIp.replace(/^\[|\]$/g, '').trim()
      if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/.test(clientIp)) {
        clientIp = clientIp.split(':')[0]
      }
    }

    if (clientIp && !isPrivateOrLocalIp(clientIp)) {
      // Proveedor 1: api.country.is (Alta velocidad sobre Cloudflare Workers)
      try {
        const res1 = await fetch(`https://api.country.is/${clientIp}`, {
          signal: AbortSignal.timeout(1800),
          cache: 'no-store',
        })
        if (res1.ok) {
          const data1 = await res1.json()
          const detectedCode = data1?.country?.toUpperCase()
          if (detectedCode && detectedCode.length === 2 && detectedCode !== 'XX') {
            const country = getCountryByCode(detectedCode)
            return NextResponse.json(
              {
                countryCode: country.code,
                dialCode: country.dialCode,
                countryName: country.name,
                flagUrl: country.flagUrl,
                isCertain: true,
                provider: 'api.country.is',
              },
              { status: 200 }
            )
          }
        }
      } catch {
        // Fallback a proveedor 2
      }

      // Proveedor 2: ipwho.is (Servicio resiliente sin api-key)
      try {
        const res2 = await fetch(`https://ipwho.is/${clientIp}`, {
          signal: AbortSignal.timeout(2000),
          cache: 'no-store',
        })
        if (res2.ok) {
          const data2 = await res2.json()
          const detectedCode = (data2?.country_code || '').toUpperCase()
          if (data2?.success && detectedCode && detectedCode.length === 2) {
            const country = getCountryByCode(detectedCode)
            return NextResponse.json(
              {
                countryCode: country.code,
                dialCode: data2.calling_code ? `+${data2.calling_code}` : country.dialCode,
                countryName: data2.country || country.name,
                flagUrl: country.flagUrl,
                isCertain: true,
                provider: 'ipwho.is',
              },
              { status: 200 }
            )
          }
        }
      } catch {
        // Fallback a proveedor 3
      }

      // Proveedor 3: ipapi.co
      try {
        const res3 = await fetch(`https://ipapi.co/${clientIp}/json/`, {
          signal: AbortSignal.timeout(1500),
          cache: 'no-store',
        })
        if (res3.ok) {
          const data3 = await res3.json()
          const detectedCode = (data3?.country_code || '').toUpperCase()
          if (detectedCode && detectedCode.length === 2 && !data3.error) {
            const country = getCountryByCode(detectedCode)
            return NextResponse.json(
              {
                countryCode: country.code,
                dialCode: country.dialCode,
                countryName: country.name,
                flagUrl: country.flagUrl,
                isCertain: true,
                provider: 'ipapi.co',
              },
              { status: 200 }
            )
          }
        }
      } catch {
        // Fallback continuo
      }
    }

    // 3. Fallback de contingencia: Devuelve isCertain: false para que el navegador del cliente lo resuelva
    const defaultCountry = getCountryByCode('CO')
    return NextResponse.json(
      {
        countryCode: defaultCountry.code,
        dialCode: defaultCountry.dialCode,
        countryName: defaultCountry.name,
        flagUrl: defaultCountry.flagUrl,
        isCertain: false,
        provider: 'fallback-default',
      },
      { status: 200 }
    )
  } catch {
    const defaultCountry = getCountryByCode('CO')
    return NextResponse.json(
      {
        countryCode: defaultCountry.code,
        dialCode: defaultCountry.dialCode,
        countryName: defaultCountry.name,
        flagUrl: defaultCountry.flagUrl,
        isCertain: false,
        provider: 'fallback-error',
      },
      { status: 200 }
    )
  }
}
