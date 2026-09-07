import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { POST } from '../app/api/check-domain/route';

async function testEndpoint() {
  // Caso 1: Dominio bloqueado por la BD (0-mail.com)
  const req1 = new Request('http://localhost:3000/api/check-domain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'spammer@0-mail.com' }),
  });
  const res1 = await POST(req1);
  const data1 = await res1.json();
  console.log('Caso 1 (0-mail.com - BD Bloqueado):', data1);

  // Caso 2: Dominio temporal estatico (mailinator.com)
  const req2 = new Request('http://localhost:3000/api/check-domain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'usuario@mailinator.com' }),
  });
  const res2 = await POST(req2);
  const data2 = await res2.json();
  console.log('Caso 2 (mailinator.com - Bloqueado Estático):', data2);

  // Caso 3: Dominio empresarial legítimo (smartcontacts.cloud o google.com)
  const req3 = new Request('http://localhost:3000/api/check-domain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'contacto@google.com' }),
  });
  const res3 = await POST(req3);
  const data3 = await res3.json();
  console.log('Caso 3 (google.com - Permitido):', data3);

}

testEndpoint().catch(console.error);
