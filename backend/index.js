const path = require('path')
const express = require('express')
const cors = require('cors')

require('dotenv').config({ path: path.join(__dirname, '.env') })
require('./db')

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

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})