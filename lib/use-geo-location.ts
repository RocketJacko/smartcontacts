"use client"

import { useState, useEffect } from "react"

const FALLBACK_EXCHANGE_RATE_COP = 3700

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

  const platziPriceCop = 90000
  const platziPriceUsd = Math.round((platziPriceCop / exchangeRate) * 10) / 10 || 25

  useEffect(() => {
    let active = true

    const detectGeo = async () => {
      // 1. URL search param check (?country=XX)
      try {
        const params = new URLSearchParams(window.location.search)
        const countryParam = params.get("country")
        if (countryParam) {
          const codeUpper = countryParam.toUpperCase()
          const isCo = codeUpper === "CO"
          if (active) {
            setCountryCode(codeUpper)
            setIsColombia(isCo)
            setUserCurrency(isCo ? "COP" : "USD")
            setIsLoading(false)
          }
          return
        }
      } catch (e) {
        console.warn("Error reading URL search params for country:", e)
      }

      // 2. Fetch internal /api/geo endpoint
      try {
        const res = await fetch("/api/geo")
        if (res.ok) {
          const data = await res.json()
          if (data && active && data.countryCode) {
            const isCo = data.countryCode === "CO"
            setCountryCode(data.countryCode)
            setCountryName(data.countryName || "Colombia")
            setDialCode(data.dialCode || "+57")
            setFlagUrl(data.flagUrl || "https://flagcdn.com/w40/co.png")
            setIsColombia(isCo)
            setUserCurrency(isCo ? "COP" : "USD")
            setIsLoading(false)
            return
          }
        }
      } catch (err) {
        console.warn("Error fetching /api/geo:", err)
      }

      // 3. Fallback to ipapi.co
      try {
        const geoRes = await fetch("https://ipapi.co/json/")
        if (geoRes.ok) {
          const geoData = await geoRes.json()
          if (geoData && active && geoData.country_code) {
            const code = String(geoData.country_code).toUpperCase()
            const isCo = code === "CO"
            setCountryCode(code)
            setCountryName(geoData.country_name || "Colombia")
            setDetectedCity(geoData.city || "")
            setIsColombia(isCo)
            setUserCurrency(isCo ? "COP" : "USD")
            setIsLoading(false)
            return
          }
        }
      } catch (err) {
        console.warn("Error fetching ipapi.co fallback:", err)
      }

      if (active) {
        setIsLoading(false)
      }
    }

    detectGeo()

    return () => {
      active = false
    }
  }, [])

  const formattedPlatziPrice =
    userCurrency === "COP"
      ? new Intl.NumberFormat("es-CO", {
          style: "currency",
          currency: "COP",
          maximumFractionDigits: 0,
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
  }
}
