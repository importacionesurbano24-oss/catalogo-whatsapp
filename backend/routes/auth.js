const express = require('express')
const router = express.Router()
const pool = require('../db')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

// Registro
router.post('/registro', async (req, res) => {
  try {
    const { nombre, email, password, whatsapp } = req.body
    
    // Verificar si el email ya existe
    const existe = await pool.query('SELECT * FROM admins WHERE email = $1', [email])
    if (existe.rows.length > 0) {
      return res.status(400).json({ error: 'El email ya está registrado' })
    }

    // Encriptar contraseña
    const passwordEncriptado = await bcrypt.hash(password, 10)

    // Crear admin
    const result = await pool.query(
      'INSERT INTO admins (nombre, email, password, whatsapp, rol, plan) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [nombre, email, passwordEncriptado, whatsapp || null, 'admin', 'gratis']
    )

    res.json({ mensaje: 'Cuenta creada exitosamente', admin: result.rows[0] })
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar' })
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    // Buscar admin
    const result = await pool.query('SELECT * FROM admins WHERE email = $1', [email])
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Email o contraseña incorrectos' })
    }

    const admin = result.rows[0]

    // Verificar contraseña
    const passwordValido = await bcrypt.compare(password, admin.password)
    if (!passwordValido) {
      return res.status(400).json({ error: 'Email o contraseña incorrectos' })
    }

    // Crear token
    const token = jwt.sign(
      { id: admin.id, email: admin.email, rol: admin.rol },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({ token, admin: { id: admin.id, nombre: admin.nombre, email: admin.email, rol: admin.rol, plan: admin.plan } })
  } catch (error) {
    res.status(500).json({ error: 'Error al iniciar sesión' })
  }
})

module.exports = router