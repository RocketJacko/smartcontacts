"use client"

import { useState, useEffect, useCallback } from "react"
import { getCountryByCode, DEFAULT_COUNTRY } from "@/lib/data/countries"

export const FALLBACK_EXCHANGE_RATE_COP = 3900 // 1 USD ≈ 3.900 COP

export interface GeoLocationState {
  countryCode: string
  countryName: string
  dialCode: string
  flagUrl: string
  isColombia: boolean
  detectedCity: string
  userCurrency: "COP" | "USD"
  exchangeRate: number
  platziPriceCop: number
  platziPriceUsd: number
  formattedPlatziPrice: string
  isLoading: boolean
  setUserCurrency: (currency: "COP" | "USD") => void
  toggleCurrency: () => void
  formatPlanPriceDynamic: (copPrice: number, baseCurrency?: string) => string
}

export function useGeoLocation(): GeoLocationState {
  const [countryCode, setCountryCode] = useState<string>("CO")
  const [countryName, setCountryName] = useState<string>("Colombia")
  const [dialCode, setDialCode] = useState<string>("+57")
  const [flagUrl, setFlagUrl] = useState<string>("https://flagcdn.com/w40/co.png")
  const [isColombia, setIsColombia] = useState<boolean>(true)
  const [detectedCity, setDetectedCity] = useState<string>("")
  const [userCurrency, setUserCurrency] = useState<"COP" | "USD">("COP")
  const [exchangeRate, setExchangeRate] = useState<number>(FALLBACK_EXCHANGE_RATE_COP)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const platziPriceCop = 400909.75
  const platziPriceUsd = Math.round((platziPriceCop / exchangeRate) * 10) / 10 || 105

  const applyDetectedCountry = useCallback((code: string, city: string = "") => {
    const upper = (code || "CO").toUpperCase().trim()
    const country = getCountryByCode(upper)
    const isCo = country.code === "CO"

    setCountryCode(country.code)
    setCountryName(country.name)
    setDialCode(country.dialCode)
    setFlagUrl(country.flagUrl)
    setIsColombia(isCo)
    setDetectedCity(city)
    setUserCurrency(isCo ? "COP" : "USD")
    setIsLoading(false)

    try {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("sc_geo_country", country.code)
      }
    } catch {}
  }, [])

  useEffect(() => {
    let active = true

    const detectGeo = async () => {
      // 0. Cache de sesión para carga instantánea sin latencia
      try {
        if (typeof window !== "undefined") {
          const cached = sessionStorage.getItem("sc_geo_country")
          const hasUrlOverride = window.location.search.includes("country=") || window.location.search.includes("pais=")
          if (cached && active && !hasUrlOverride) {
            applyDetectedCountry(cached)
            return
          }
        }
      } catch {}
      // 1. Verificación por parámetro URL (?country=US o ?country=MX o ?currency=USD)
      try {
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search)
          const countryParam = params.get("country") || params.get("pais")
          const currencyParam = params.get("currency") || params.get("moneda")

          if (countryParam && active) {
            applyDetectedCountry(countryParam)
            if (currencyParam && (currencyParam.toUpperCase() === "USD" || currencyParam.toUpperCase() === "COP")) {
              setUserCurrency(currencyParam.toUpperCase() as "COP" | "USD")
            }
            return
          }

          if (currencyParam && active) {
            if (currencyParam.toUpperCase() === "USD") {
              setUserCurrency("USD")
              setIsColombia(false)
            }
          }
        }
      } catch {
        // Continuar
      }

      // 2. Consulta al backend interno /api/geo
      try {
        const res = await fetch("/api/geo")
        if (res.ok) {
          const data = await res.json()
          // Si el backend resolvió con certeza (isCertain: true), aplicar de inmediato
          if (data && active && data.isCertain && data.countryCode) {
            applyDetectedCountry(data.countryCode)
            return
          }
        }
      } catch {
        // Fallback a detección del navegador
      }

      // 3. Respaldo Nivel 1 del Navegador (api.country.is desde la IP real del cliente)
      try {
        const directRes = await fetch("https://api.country.is/", {
          signal: AbortSignal.timeout(2200),
        })
        if (directRes.ok) {
          const directData = await directRes.json()
          const code = directData?.country?.toUpperCase()
          if (directData && active && code && code.length === 2 && code !== "XX") {
            applyDetectedCountry(code)
            return
          }
        }
      } catch {
        // Fallback al siguiente proveedor
      }

      // 4. Respaldo Nivel 2 del Navegador (ipwho.is)
      try {
        const ipWhoRes = await fetch("https://ipwho.is/", {
          signal: AbortSignal.timeout(2500),
        })
        if (ipWhoRes.ok) {
          const ipWhoData = await ipWhoRes.json()
          const code = ipWhoData?.country_code?.toUpperCase()
          if (ipWhoData && active && ipWhoData.success && code && code.length === 2) {
            applyDetectedCountry(code, ipWhoData.city || "")
            return
          }
        }
      } catch {
        // Fallback final
      }

      // 5. Fallback por defecto (Colombia)
      if (active) {
        applyDetectedCountry("CO")
      }
    }

    detectGeo()

    return () => {
      active = false
    }
  }, [applyDetectedCountry])

  // Formateador de precios de planes según la moneda activa del usuario (COP o USD)
  const formatPlanPriceDynamic = useCallback(
    (copPrice: number, baseCurrency: string = "COP"): string => {
      if (userCurrency === "USD") {
        // Si ya viene en USD, no dividir
        const usdValue =
          baseCurrency === "USD"
            ? copPrice
            : Math.max(1, Math.round(copPrice / exchangeRate))

        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }).format(usdValue)
      }

      // Moneda COP (Colombia)
      return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
      }).format(copPrice)
    },
    [userCurrency, exchangeRate]
  )

  const formattedPlatziPrice =
    userCurrency === "COP"
      ? new Intl.NumberFormat("es-CO", {
          style: "currency",
          currency: "COP",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(platziPriceCop)
      : new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }).format(platziPriceUsd)

  const toggleCurrency = () => {
    setUserCurrency((prev) => (prev === "COP" ? "USD" : "COP"))
  }

  return {
    countryCode,
    countryName,
    dialCode,
    flagUrl,
    isColombia,
    detectedCity,
    userCurrency,
    exchangeRate,
    platziPriceCop,
    platziPriceUsd,
    formattedPlatziPrice,
    isLoading,
    setUserCurrency,
    toggleCurrency,
    formatPlanPriceDynamic,
  }
}
