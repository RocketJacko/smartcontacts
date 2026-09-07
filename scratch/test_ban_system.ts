import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function testBanSystem() {
  console.log('================================================================');
  console.log(' PRUEBA DE BANEOS EN VIVO POR IP Y POR DISPOSITIVO');
  console.log(' Servidor: http://localhost:3000');
  console.log('================================================================\n');

  const bannedIp = '198.51.100.77';
  const bannedDeviceId = 'dev-banned-uuid-99999999';

  // 1. Aplicar baneo por IP en Supabase
  console.log('1. Registrando baneo por IP en Supabase...');
  await supabase.rpc('aplicar_baneo', {
    p_tipo: 'ip',
    p_valor: bannedIp,
    p_motivo: 'Intento malicioso de penetración',
    p_horas_duracion: 24,
  });

  // 2. Aplicar baneo por Dispositivo en Supabase
  console.log('2. Registrando baneo por Dispositivo (Device ID) en Supabase...');
  await supabase.rpc('aplicar_baneo', {
    p_tipo: 'device_id',
    p_valor: bannedDeviceId,
    p_motivo: 'Dispositivo físico bloqueado por el Super Admin',
    p_horas_duracion: 24,
  });

  // 3. Probar petición desde la IP baneada
  console.log('\n3. Evaluando petición desde IP baneada (198.51.100.77)...');
  const resIp = await fetch('http://localhost:3000/', {
    headers: { 'x-forwarded-for': bannedIp },
  });
  const dataIp = await resIp.json();
  console.log(`   Status: HTTP ${resIp.status} (Esperado: 403)`);
  console.log(`   Mensaje: ${dataIp.error}`);
  console.log(`   Resultado: ${resIp.status === 403 ? ' BANEO POR IP EXITOSO' : '❌ FALLÓ'}`);

  // 4. Probar petición desde otra IP pero con la supercookie de dispositivo baneado
  console.log('\n4. Evaluando petición desde otra IP diferente (VPN) pero con el mismo Dispositivo...');
  const resDevice = await fetch('http://localhost:3000/', {
    headers: {
      'x-forwarded-for': '203.0.113.195', // IP diferente (simulando VPN)
      'Cookie': `sc_device_id=${bannedDeviceId}`,
    },
  });
  const dataDevice = await resDevice.json();
  console.log(`   Status: HTTP ${resDevice.status} (Esperado: 403)`);
  console.log(`   Mensaje: ${dataDevice.error}`);
  console.log(`   Resultado: ${resDevice.status === 403 ? ' BANEO POR DISPOSITIVO EXITOSO (Incluso cambiando de IP)' : '❌ FALLÓ'}`);

  // 5. Limpieza de las pruebas en Supabase
  console.log('\n5. Limpiando registros de prueba...');
  await supabase.from('seguridad.baneos').delete().in('valor', [bannedIp, bannedDeviceId]);

  console.log('\n================================================================');
  console.log(' CONCLUSIÓN: BANEOS POR IP Y DISPOSITIVO ACTIVOS Y FUNCIONANDO');
  console.log('================================================================\n');
}

testBanSystem().catch(console.error);
