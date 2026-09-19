#!/usr/bin/env node
/**
 * Suite de Pruebas de Geolocalización y Formateo de Precios Multimoneda (SmartContacts)
 * Ejecutable vía: npm run test:geo
 */

import assert from 'node:assert/strict'
import { getCountryByCode } from '../lib/data/countries.ts'

const FALLBACK_EXCHANGE_RATE_COP = 3900 // 1 USD ≈ 3.900 COP
const platziPriceCop = 400909.75
const platziPriceUsd = Math.round((platziPriceCop / FALLBACK_EXCHANGE_RATE_COP) * 10) / 10 || 105

function simulateUserGeoPricing(countryInput, forcedCurrency) {
  const country = getCountryByCode(countryInput ? countryInput.toUpperCase().trim() : 'CO')
  const isColombia = country.code === 'CO'
  const userCurrency = forcedCurrency || (isColombia ? 'COP' : 'USD')

  const formattedPrice = userCurrency === 'COP'
    ? new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(platziPriceCop)
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(platziPriceUsd)

  const formatPlanPriceDynamic = (copPrice, baseCurrency = 'COP') => {
    if (userCurrency === 'USD') {
      const usdValue = baseCurrency === 'USD'
        ? copPrice
        : Math.max(1, Math.round(copPrice / FALLBACK_EXCHANGE_RATE_COP))

      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(usdValue)
    }

    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(copPrice)
  }

  return {
    paisIngresado: countryInput,
    paisDetectado: country.name,
    codigo: country.code,
    dialCode: country.dialCode,
    isColombia,
    userCurrency,
    formattedPrice,
    formatPlanPriceDynamic,
  }
}

console.log('=================================================================')
console.log('🧪 SMARTCONTACTS: TEST SUITE DE PRECIOS POR PAÍS & GEOLOCALIZACIÓN')
console.log('=================================================================\n')

let passedTests = 0
let totalTests = 0

function runTest(testName, testFn) {
  totalTests++
  try {
    testFn()
    console.log(`  ✓ [PASÓ] ${testName}`)
    passedTests++
  } catch (err) {
    console.error(`  ✗ [FALLÓ] ${testName}`)
    console.error(`    Motivo: ${err.message}\n`)
  }
}

// ── TEST 1: Detección y Moneda Colombia ──────────────────────────────────────
runTest('Colombia (CO) debe asignar moneda COP y formato en pesos colombianos', () => {
  const res = simulateUserGeoPricing('CO')
  assert.equal(res.codigo, 'CO')
  assert.equal(res.isColombia, true)
  assert.equal(res.userCurrency, 'COP')
  assert.equal(res.dialCode, '+57')
  assert.match(res.formattedPrice, /400\.909,75/)
})

// ── TEST 2: Detección y Moneda Estados Unidos ────────────────────────────────
runTest('Estados Unidos (US) debe asignar moneda USD y formato en dólares ($103)', () => {
  const res = simulateUserGeoPricing('US')
  assert.equal(res.codigo, 'US')
  assert.equal(res.isColombia, false)
  assert.equal(res.userCurrency, 'USD')
  assert.equal(res.dialCode, '+1')
  assert.match(res.formattedPrice, /\$103/)
})

// ── TEST 3: Detección y Moneda México ────────────────────────────────────────
runTest('México (MX) debe asignar moneda USD para pagos internacionales', () => {
  const res = simulateUserGeoPricing('MX')
  assert.equal(res.codigo, 'MX')
  assert.equal(res.isColombia, false)
  assert.equal(res.userCurrency, 'USD')
  assert.equal(res.dialCode, '+52')
  assert.match(res.formattedPrice, /\$103/)
})

// ── TEST 4: Detección y Moneda España (Europa) ───────────────────────────────
runTest('España (ES) debe asignar moneda USD y dial +34', () => {
  const res = simulateUserGeoPricing('ES')
  assert.equal(res.codigo, 'ES')
  assert.equal(res.isColombia, false)
  assert.equal(res.userCurrency, 'USD')
  assert.equal(res.dialCode, '+34')
  assert.match(res.formattedPrice, /\$103/)
})

// ── TEST 5: Detección y Moneda Países Sudamérica (Argentina y Chile) ─────────
runTest('Sudamérica no-CO (Argentina AR, Chile CL) debe asignar USD', () => {
  const resAR = simulateUserGeoPricing('AR')
  const resCL = simulateUserGeoPricing('CL')
  assert.equal(resAR.userCurrency, 'USD')
  assert.equal(resCL.userCurrency, 'USD')
})

// ── TEST 6: Cambio Manual de Moneda (Toggle / URL Override) ──────────────────
runTest('Cambio manual de moneda (Toggle) debe respetar la selección forzada', () => {
  // Usuario en USA que cambia a COP
  const resUsCop = simulateUserGeoPricing('US', 'COP')
  assert.equal(resUsCop.userCurrency, 'COP')
  assert.match(resUsCop.formattedPrice, /400\.909,75/)

  // Usuario en Colombia que cambia a USD
  const resCoUsd = simulateUserGeoPricing('CO', 'USD')
  assert.equal(resCoUsd.userCurrency, 'USD')
  assert.match(resCoUsd.formattedPrice, /\$103/)
})

// ── TEST 7: Conversión Dinámica de Tarifas de Planes ─────────────────────────
runTest('Conversión dinámica de planes (Plan 120.000 COP y Plan 180.000 COP)', () => {
  const resCO = simulateUserGeoPricing('CO')
  const resUS = simulateUserGeoPricing('US')

  // En Colombia se muestra el valor original en pesos
  const price120Cop = resCO.formatPlanPriceDynamic(120000)
  assert.match(price120Cop, /120\.000/)

  // En el extranjero se convierte con la TRM (120.000 / 3.900 ≈ $31 USD)
  const price120Usd = resUS.formatPlanPriceDynamic(120000)
  assert.match(price120Usd, /\$31/)

  // Plan 180.000 COP (180.000 / 3.900 ≈ $46 USD)
  const price180Usd = resUS.formatPlanPriceDynamic(180000)
  assert.match(price180Usd, /\$46/)
})

// ── TEST 8: Fallback de Seguridad para Países Desconocidos ───────────────────
runTest('País vacío o inválido aplica fallback por defecto sin quebrar la app', () => {
  const resEmpty = simulateUserGeoPricing('')
  assert.ok(resEmpty.codigo)
  assert.ok(resEmpty.formattedPrice)
})

console.log('\n-----------------------------------------------------------------')
console.log(`📊 RESULTADO: ${passedTests} de ${totalTests} pruebas superadas exitosamente.`)
console.log('-----------------------------------------------------------------\n')

if (passedTests !== totalTests) {
  process.exit(1)
} else {
  process.exit(0)
}
