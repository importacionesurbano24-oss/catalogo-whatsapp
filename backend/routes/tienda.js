const express = require('express')
const router = express.Router()
const pool = require('../db')
const multer = require('multer')
const cloudinary = require('cloudinary').v2
const verificarToken = require('../middleware/verificarToken')

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

const upload = multer({ storage: multer.memoryStorage() })

// PUT actualizar configuracion de la tienda
router.put('/configuracion', verificarToken, upload.single('logo'), async (req, res) => {
  try {
    const adminId = req.admin.id
    const { nombre, whatsapp, color, descripcion_tienda } = req.body

    let logoUrl = null
    if (req.file) {
      const resultado = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ folder: 'catalogo-whatsapp/logos' }, (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }).end(req.file.buffer)
      })
      logoUrl = resultado.secure_url
    }

    const campos = ['nombre=$1', 'whatsapp=$2', 'color=$3', 'descripcion_tienda=$4']
    const valores = [nombre, whatsapp, color, descripcion_tienda, adminId]

    if (logoUrl) {
      campos.push('logo=$6')
      valores.splice(4, 0, logoUrl)
      valores[valores.length - 1] = adminId
    }

    await pool.query(
      `UPDATE admins SET nombre=$1, whatsapp=$2, color=$3, descripcion_tienda=$4${logoUrl ? ', logo=$5' : ''} WHERE id=$${logoUrl ? 6 : 5}`,
      logoUrl ? [nombre, whatsapp, color, descripcion_tienda, logoUrl, adminId] : [nombre, whatsapp, color, descripcion_tienda, adminId]
    )

    const result = await pool.query('SELECT id, nombre, email, rol, plan, whatsapp, color, logo, descripcion_tienda FROM admins WHERE id=$1', [adminId])
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar configuración' })
  }
})

// GET configuracion de la tienda del admin logueado
router.get('/configuracion', verificarToken, async (req, res) => {
  try {
    const adminId = req.admin.id
    const result = await pool.query(
      'SELECT id, nombre, email, rol, plan, whatsapp, color, logo, descripcion_tienda FROM admins WHERE id=$1',
      [adminId]
    )
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener configuración' })
  }
})

// GET tienda pública por slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params
    const tienda = await pool.query(
      "SELECT * FROM admins WHERE LOWER(REPLACE(nombre, ' ', '-')) = $1",
      [slug]
    )
    if (tienda.rows.length === 0) {
      return res.status(404).json({ error: 'Tienda no encontrada' })
    }
    const productos = await pool.query(
      'SELECT * FROM productos WHERE admin_id = $1',
      [tienda.rows[0].id]
    )
    const { password, ...tiendaSegura } = tienda.rows[0]
    res.json({ tienda: tiendaSegura, productos: productos.rows })
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener tienda' })
  }
})

module.exports = router