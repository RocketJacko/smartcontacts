async function testWebhook() {
  const url = 'https://ventusn8n.smartcontacts.cloud/webhook/smartcontacts-booking'
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      test: true,
      timestamp: new Date().toISOString()
    })
  })
  console.log('Status:', res.status)
  console.log('Response:', await res.text())
}

testWebhook().catch(console.error)
