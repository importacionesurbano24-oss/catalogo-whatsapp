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
// Olvidé mi contraseña - enviar código por email
const { Resend } = require('resend')
const resend = new Resend(process.env.RESEND_API_KEY)

router.post('/recuperar', async (req, res) => {
  try {
    const { email } = req.body
    const result = await pool.query('SELECT * FROM admins WHERE email = $1', [email])
    
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'No existe una cuenta con ese email' })
    }

    // Generar código de 6 dígitos
    const codigo = Math.floor(100000 + Math.random() * 900000).toString()
    const expira = new Date(Date.now() + 15 * 60 * 1000) // 15 minutos

    // Guardar código en la base de datos
    await pool.query(
      'UPDATE admins SET codigo_recuperacion = $1, codigo_expira = $2 WHERE email = $3',
      [codigo, expira, email]
    )

    // Enviar email
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Recuperar contraseña - Catálogo WhatsApp',
      html: `<h2>Recuperar contraseña</h2><p>Tu código de recuperación es:</p><h1 style="color: #22c55e; font-size: 36px;">${codigo}</h1><p>Este código expira en 15 minutos.</p>`
    })

    res.json({ mensaje: 'Código enviado a tu email' })
  } catch (error) {
    console.log('Error recuperar:', error.message)
    res.status(500).json({ error: 'Error al enviar código' })
  }
})

// Cambiar contraseña con código
router.post('/cambiar-password', async (req, res) => {
  try {
    const { email, codigo, nuevaPassword } = req.body
    const result = await pool.query(
      'SELECT * FROM admins WHERE email = $1 AND codigo_recuperacion = $2 AND codigo_expira > NOW()',
      [email, codigo]
    )

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Código inválido o expirado' })
    }

    const passwordEncriptado = await bcrypt.hash(nuevaPassword, 10)
    await pool.query(
      'UPDATE admins SET password = $1, codigo_recuperacion = NULL, codigo_expira = NULL WHERE email = $2',
      [passwordEncriptado, email]
    )

    res.json({ mensaje: 'Contraseña actualizada correctamente' })
  } catch (error) {
    res.status(500).json({ error: 'Error al cambiar contraseña' })
  }
})

module.exports = router