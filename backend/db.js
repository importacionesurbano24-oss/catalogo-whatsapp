const path = require('path')
const { Pool } = require('pg')

require('dotenv').config({ path: path.join(__dirname, '.env') })

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })
  : new Pool({
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'catalogo_whatsapp',
      password: process.env.DB_PASSWORD || '',
      port: Number(process.env.DB_PORT) || 5432,
    })

pool.on('error', (error) => {
  console.error('Error inesperado en PostgreSQL:', error.message)
})

pool.connect()
  .then((client) => {
    console.log('Conectado a PostgreSQL')
    client.release()
  })
  .catch((error) => {
    console.error('Error conectando a PostgreSQL:', error.message)
  })

module.exports = pool
