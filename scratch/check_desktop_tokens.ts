import fs from 'fs'

const paths = [
  'C:\\Users\\JesusAlexisCarmonaCa\\Desktop\\Correos Universidad\\pascualbravo\\token.json',
  'C:\\Users\\JesusAlexisCarmonaCa\\Desktop\\Correos Universidad\\amigo\\token.json'
]

for (const p of paths) {
  if (fs.existsSync(p)) {
    const data = JSON.parse(fs.readFileSync(p, 'utf8'))
    console.log(`\nArchivo: ${p}`)
    console.log('Scopes:', data.scopes || data.scope)
    console.log('Has refresh_token:', !!data.refresh_token)
  }
}
