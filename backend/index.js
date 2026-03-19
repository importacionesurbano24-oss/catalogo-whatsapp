const path = require('path')
const express = require('express')
const cors = require('cors')

require('dotenv').config({ path: path.join(__dirname, '.env') })
const pool = require('./db')

const productosRoutes = require('./routes/productos')
const authRoutes = require('./routes/auth')
const tiendaRoutes = require('./routes/tienda')
const superadminRoutes = require('./routes/superadmin')

const app = express()
const PORT = Number(process.env.PORT) || 3000

app.use(cors())
app.use(express.json())
app.use('/imagenes', express.static(path.join(__dirname, 'public/imagenes')))
app.use('/api/productos', productosRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/tienda', tiendaRoutes)
app.use('/api/superadmin', superadminRoutes)

app.get('/', (req, res) => {
  res.json({ mensaje: 'Servidor funcionando' })
})

async function initTables() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        rol VARCHAR(20) DEFAULT 'admin',
        plan VARCHAR(20) DEFAULT 'gratis',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS productos (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(200) NOT NULL,
        descripcion TEXT,
        precio NUMERIC(10,2) NOT NULL,
        imagen VARCHAR(500),
        colores TEXT,
        tallas TEXT,
        admin_id INTEGER REFERENCES admins(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log('Tablas verificadas/creadas correctamente')
  } catch (error) {
    console.error('Error creando tablas:', error.message)
  }
}

app.listen(PORT, async () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
  await initTables()
})