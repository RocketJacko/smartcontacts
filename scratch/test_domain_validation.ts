import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { isDomainBlocked } from '../lib/blocked-domains';
import { verificarDominioCorreoValido } from '../lib/email-validator';

async function test() {
  console.log('--- TEST 1: Dominios bloqueados conocidos (lista estática) ---');
  const t1 = await isDomainBlocked('test@mailinator.com');
  console.log('mailinator.com bloqueado?:', t1); // esperado: true

  const t2 = await isDomainBlocked('persona@tempmail.com');
  console.log('tempmail.com bloqueado?:', t2); // esperado: true

  console.log('\n--- TEST 2: Dominios bloqueados en la Base de Datos (119.900) ---');
  const t3 = await isDomainBlocked('persona@0-mail.com');
  console.log('0-mail.com bloqueado?:', t3); // esperado: true

  const t4 = await isDomainBlocked('alguien@10minutemail.com');
  console.log('10minutemail.com bloqueado?:', t4); // esperado: true

  console.log('\n--- TEST 3: Dominios corporativos legítimos ---');
  const t5 = await isDomainBlocked('contacto@google.com');
  console.log('google.com bloqueado?:', t5); // esperado: false

  const t6 = await isDomainBlocked('ventas@microsoft.com');
  console.log('microsoft.com bloqueado?:', t6); // esperado: false

  console.log('\n--- TEST 4: Flujo completo de verificarDominioCorreoValido ---');
  const v1 = await verificarDominioCorreoValido('test@mailinator.com');
  console.log('mailinator.com resultado:', v1);

  const v2 = await verificarDominioCorreoValido('persona@0-mail.com');
  console.log('0-mail.com resultado:', v2);

  const v3 = await verificarDominioCorreoValido('contacto@google.com');
  console.log('google.com resultado:', v3);

  const v4 = await verificarDominioCorreoValido('alguien@dominioquenoexistepara_nada_123456789.com');
  console.log('dominio inexistente resultado:', v4);
}

test().catch(console.error);
