async function testLocalOAuth() {
  const res = await fetch('http://localhost:3000/api/auth/google', { redirect: 'manual' })
  console.log('Status:', res.status)
  console.log('Location:', res.headers.get('location'))
}

testLocalOAuth().catch(console.error)
