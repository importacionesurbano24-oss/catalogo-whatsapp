const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
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
