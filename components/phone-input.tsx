"use client"

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { COUNTRIES, Country, DEFAULT_COUNTRY, getCountryByCode } from '@/lib/data/countries'
import { ChevronDown, Search, Phone as PhoneIcon } from 'lucide-react'

interface PhoneInputProps {
  value: string
  onChange: (fullNumber: string, countryCode: string, dialCode: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function PhoneInput({
  value,
  onChange,
  placeholder,
  disabled = false,
  className = '',
}: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country>(DEFAULT_COUNTRY)
  const [phoneNumber, setPhoneNumber] = useState<string>('')
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Auto-detect GeoIP on mount
  useEffect(() => {
    fetch('/api/geo')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.countryCode) {
          const detected = getCountryByCode(data.countryCode)
          setSelectedCountry(detected)
        }
      })
      .catch(() => {
        // Fallback al país por defecto
      })
  }, [])

  // Sync internal state when value prop changes or country changes
  useEffect(() => {
    // If value already starts with dial code or +, clean it
    if (value) {
      let clean = value.trim()
      if (clean.startsWith(selectedCountry.dialCode)) {
        clean = clean.substring(selectedCountry.dialCode.length).trim()
      }
      setPhoneNumber(clean)
    }
  }, [value, selectedCountry.dialCode])

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter countries by search query
  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return COUNTRIES
    const q = searchQuery.toLowerCase().trim()
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.code.toLowerCase().includes(q)
    )
  }, [searchQuery])

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country)
    setIsOpen(false)
    setSearchQuery('')

    const fullNum = phoneNumber ? `${country.dialCode} ${phoneNumber}` : ''
    onChange(fullNum, country.code, country.dialCode)
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value
    // Clean to allow numbers, spaces, hyphens
    const cleaned = rawVal.replace(/[^\d\s-]/g, '')
    setPhoneNumber(cleaned)

    const fullNum = cleaned.trim() ? `${selectedCountry.dialCode} ${cleaned.trim()}` : ''
    onChange(fullNum, selectedCountry.code, selectedCountry.dialCode)
  }

  return (
    <div className={`relative flex items-center w-full ${className}`} ref={dropdownRef}>
      {/* Country Flag & Dial Code Selector Button */}
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 h-11 px-3.5 rounded-l-xl border border-r-0 border-black/10 bg-black/[0.02] hover:bg-black/[0.05] transition-colors cursor-pointer select-none text-xs font-mono font-medium text-[#111] focus:outline-none focus:ring-1 focus:ring-black/20"
        >
          {/* Real Visual Flag Image */}
          <img
            src={selectedCountry.flagUrl}
            alt={selectedCountry.name}
            className="w-5 h-3.5 object-cover rounded-xs border border-black/10 shadow-2xs shrink-0"
            loading="lazy"
          />
          <span className="font-mono text-xs text-black/80">{selectedCountry.dialCode}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-black/40 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute left-0 top-full mt-1.5 w-72 max-h-72 rounded-xl border border-black/10 bg-white shadow-xl z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Search Filter Bar */}
            <div className="p-2 border-b border-black/[0.06] bg-[#FAF9F6]">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 absolute left-2.5 text-black/40 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar país o prefijo..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs font-sans rounded-lg bg-white border border-black/10 text-[#111] placeholder:text-black/40 focus:outline-none focus:border-black/30"
                  autoFocus
                />
              </div>
            </div>

            {/* Country List */}
            <div className="overflow-y-auto flex-1 p-1 space-y-0.5 max-h-56 scrollbar-thin">
              {filteredCountries.length === 0 ? (
                <div className="py-4 text-center text-xs text-black/40 font-sans">
                  No se encontraron países
                </div>
              ) : (
                filteredCountries.map((c) => {
                  const isSelected = c.code === selectedCountry.code
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => handleCountrySelect(c)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-sans transition-colors cursor-pointer text-left ${
                        isSelected
                          ? 'bg-black/[0.06] text-[#111] font-medium'
                          : 'hover:bg-black/[0.03] text-black/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Visual SVG Flag Image */}
                        <img
                          src={c.flagUrl}
                          alt={c.name}
                          className="w-5 h-3.5 object-cover rounded-xs border border-black/10 shadow-2xs shrink-0"
                          loading="lazy"
                        />
                        <span className="truncate font-normal text-xs text-[#111]">{c.name}</span>
                      </div>
                      <span className="font-mono text-[11px] text-black/50 ml-2 shrink-0">{c.dialCode}</span>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Phone Number Input Field */}
      <div className="relative flex-1">
        <input
          type="tel"
          disabled={disabled}
          value={phoneNumber}
          onChange={handlePhoneChange}
          placeholder={placeholder || selectedCountry.placeholder}
          className="w-full h-11 pl-3.5 pr-4 rounded-r-xl border border-black/10 bg-white text-xs font-mono text-[#111] placeholder:text-black/30 focus:outline-none focus:border-black/30 focus:ring-1 focus:ring-black/20 transition-all"
        />
      </div>
    </div>
  )
}
