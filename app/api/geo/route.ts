import { NextResponse } from 'next/server'
import { getCountryByCode } from '@/lib/data/countries'

export async function GET(request: Request) {
  try {
    // 1. Try Vercel / Cloudflare edge country headers
    const headerCountry = request.headers.get('x-vercel-ip-country') ||
                          request.headers.get('cf-ipcountry') ||
                          request.headers.get('x-country-code')

    if (headerCountry && headerCountry !== 'XX' && headerCountry.length === 2) {
      const country = getCountryByCode(headerCountry)
      return NextResponse.json({
        countryCode: country.code,
        dialCode: country.dialCode,
        countryName: country.name,
        flagUrl: country.flagUrl,
        isCertain: true,
      }, { status: 200 })
    }

    // 2. Fallback to free GeoIP API lookup for local or non-edge environments
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     request.headers.get('cf-connecting-ip') ||
                     request.headers.get('x-real-ip')

    if (clientIp && clientIp !== '127.0.0.1' && clientIp !== '::1') {
      try {
        const geoRes = await fetch(`https://ipapi.co/${clientIp}/json/`, {
          signal: AbortSignal.timeout(2000),
          cache: 'no-store',
        })
        if (geoRes.ok) {
          const geoData = await geoRes.json()
          if (geoData && geoData.country_code && geoData.country_code.length === 2) {
            const country = getCountryByCode(geoData.country_code)
            return NextResponse.json({
              countryCode: country.code,
              dialCode: country.dialCode,
              countryName: country.name,
              flagUrl: country.flagUrl,
              isCertain: true,
            }, { status: 200 })
          }
        }
      } catch (e) {
        // Silent fallback
      }
    }

    // Default fallback to Colombia (CO / +57)
    const defaultCountry = getCountryByCode('CO')
    return NextResponse.json({
      countryCode: defaultCountry.code,
      dialCode: defaultCountry.dialCode,
      countryName: defaultCountry.name,
      flagUrl: defaultCountry.flagUrl,
      isCertain: false,
    }, { status: 200 })

  } catch {
    const defaultCountry = getCountryByCode('CO')
    return NextResponse.json({
      countryCode: defaultCountry.code,
      dialCode: defaultCountry.dialCode,
      countryName: defaultCountry.name,
      flagUrl: defaultCountry.flagUrl,
      isCertain: false,
    }, { status: 200 })
  }
}
