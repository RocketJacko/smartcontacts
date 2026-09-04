import { getSupabaseConfig } from '../lib/infrastructure/supabase/supabase-client'
import { SupabaseReferralRepository } from '../lib/infrastructure/repositories/supabase-referral-repository'

async function runReferralsTest() {
  console.log('==============================================================================')
  console.log('INICIANDO SUITE DE PRUEBAS AUTOMATIZADA: SISTEMA DE REFERIDOS & LIQUIDACIONES')
  console.log('==============================================================================')

  const repo = new SupabaseReferralRepository()
  const timestamp = Date.now()
  const testEmail = `aliado.test.${timestamp}@smartcontacts.cloud`
  const testNombre = `Carlos Aliado ${timestamp}`
  const codigoDeseado = `TEST-${Math.floor(1000 + Math.random() * 9000)}`

  // TEST 1: Crear nuevo afiliado y generar enlace único
  console.log('\n[TEST 1] Creando nuevo afiliado y enlace de referido...')
  const createRes = await repo.crearAfiliado(
    testNombre,
    testEmail,
    '+57 300 999 8888',
    codigoDeseado,
    {
      banco: 'Bancolombia',
      tipoCuenta: 'ahorros',
      numeroCuenta: '123-456789-00',
      titularCuenta: testNombre,
      numeroDocumento: '1098765432',
    }
  )

  if (!createRes.success || !createRes.afiliado) {
    console.error('❌ Falló la creación del afiliado:', createRes.error)
    process.exit(1)
  }
  const afiliado = createRes.afiliado
  const codigoGenerado = afiliado.enlacePrincipal?.codigoReferido || codigoDeseado
  console.log(`✅ Afiliado creado exitosamente. ID: ${afiliado.id}, Código: ${codigoGenerado}`)

  // TEST 2: Consultar afiliado por código
  console.log('\n[TEST 2] Consultando afiliado por código para portal público...')
  const fetchedAfiliado = await repo.obtenerAfiliadoPorCodigo(codigoGenerado)
  if (!fetchedAfiliado || fetchedAfiliado.email !== testEmail.toLowerCase()) {
    console.error('❌ No se pudo recuperar el afiliado por código.')
    process.exit(1)
  }
  console.log(`✅ Consulta por código exitosa: ${fetchedAfiliado.nombre} (${fetchedAfiliado.email})`)

  // TEST 3: Registrar Clic con Token de Sesión
  console.log('\n[TEST 3] Registrando clic de enlace de referido mediante RPC...')
  const sessionToken = `test-sess-${timestamp}`
  const clickRes = await repo.registrarClic(codigoGenerado, sessionToken, 'hash123', 'Playwright/Chrome')
  if (!clickRes.success) {
    console.error('❌ Error registrando clic:', clickRes.error)
    process.exit(1)
  }
  console.log('✅ Clic y atribución de sesión registrados exitosamente.')

  // TEST 4: Verificación de Clics Incrementados
  console.log('\n[TEST 4] Verificando incremento de métricas...')
  const updatedAfiliado = await repo.obtenerAfiliadoPorCodigo(codigoGenerado)
  const clics = updatedAfiliado?.enlacePrincipal?.clicsTotales || 0
  if (clics < 1) {
    console.error(`❌ El contador de clics no incrementó (clics: ${clics}).`)
    process.exit(1)
  }
  console.log(`✅ Contador de clics verificado: ${clics} clic(s) registrado(s).`)

  // TEST 5: Atribución Manual B2B desde el CRM
  console.log('\n[TEST 5] Probando atribución manual B2B y cálculo de comisiones...')
  // Crear un prospecto de prueba rápido en Supabase para vincular
  const { url, anonKey } = getSupabaseConfig()
  const prospectoRes = await fetch(`${url}/rest/v1/prospectos`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      name: `Cliente Referido ${timestamp}`,
      email: `cliente.${timestamp}@empresa.com`,
      company: 'Empresa Aliada S.A.S.',
      phone: '+57 311 000 0000',
      topic: 'Consultoría Agéntica B2B',
    }),
  })

  const prospectoJson = await prospectoRes.json()
  const prospectoId = Array.isArray(prospectoJson) ? prospectoJson[0]?.id : prospectoJson?.id

  const valorContrato = 2000000
  const comisionEsperada = 200000
  const manualRes = await repo.atribucionManual(
    afiliado.id,
    prospectoId,
    valorContrato,
    'Presentación directa en junta directiva',
    'porcentaje',
    10,
    comisionEsperada,
    'Director Comercial Smartcontacts'
  )

  if (!manualRes.success) {
    console.error('❌ Falló la atribución manual:', manualRes.error)
    process.exit(1)
  }
  console.log(`✅ Atribución manual B2B registrada. Comisión asignada: $${comisionEsperada.toLocaleString()} COP`)

  // TEST 6: Verificar saldo pendiente acumulado
  console.log('\n[TEST 6] Verificando saldo pendiente en cuenta del afiliado...')
  const postAtribucion = await repo.obtenerAfiliadoPorCodigo(codigoGenerado)
  if (postAtribucion?.saldoPendiente !== comisionEsperada) {
    console.error(`❌ Saldo pendiente inconsistente: esperado ${comisionEsperada}, obtenido ${postAtribucion?.saldoPendiente}`)
    process.exit(1)
  }
  console.log(`✅ Saldo pendiente verificado: $${postAtribucion.saldoPendiente.toLocaleString()} COP`)

  // TEST 7: Liquidar Comisiones y Verificar Saldo Final
  console.log('\n[TEST 7] Procesando liquidación de comisiones acumuladas...')
  const payoutRes = await repo.liquidarAfiliado(
    afiliado.id,
    comisionEsperada,
    `TRANSF-TEST-${timestamp}`,
    'https://storage.smartcontacts.cloud/comprobante-test.pdf'
  )

  if (!payoutRes.success) {
    console.error('❌ Falló la liquidación:', payoutRes.error)
    process.exit(1)
  }

  const postLiquidacion = await repo.obtenerAfiliadoPorCodigo(codigoGenerado)
  if (postLiquidacion?.saldoPendiente !== 0) {
    console.error(`❌ El saldo pendiente debería ser 0 tras liquidar, pero es: ${postLiquidacion?.saldoPendiente}`)
    process.exit(1)
  }
  console.log('✅ Liquidación procesada exitosamente. Saldo pendiente = $0 COP')

  console.log('\n==============================================================================')
  console.log('🎉 TODAS LAS 7 PRUEBAS AUTOMATIZADAS PASARON CON ÉXITO AL 100%')
  console.log('==============================================================================')
}

runReferralsTest().catch((err) => {
  console.error('Error no controlado en la prueba:', err)
  process.exit(1)
})
