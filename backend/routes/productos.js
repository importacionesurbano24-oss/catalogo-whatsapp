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

// GET todos los productos (para el catálogo público — no necesita token)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM productos')
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener productos' })
  }
})

// GET productos del admin logueado
router.get('/mis-productos', verificarToken, async (req, res) => {
  try {
    const adminId = req.admin.id
    const result = await pool.query(
      'SELECT * FROM productos WHERE admin_id = $1 ORDER BY created_at DESC',
      [adminId]
    )
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener tus productos' })
  }
})

// POST crear producto (protegido con token)
router.post('/', verificarToken, upload.single('imagen'), async (req, res) => {
  try {
    const { nombre, descripcion, precio, colores, tallas } = req.body
    const admin_id = req.admin.id
    let imagenUrl = null

    if (req.file) {
      const resultado = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ folder: 'catalogo-whatsapp' }, (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }).end(req.file.buffer)
      })
      imagenUrl = resultado.secure_url
    }

    const result = await pool.query(
      'INSERT INTO productos (nombre, descripcion, precio, imagen, colores, tallas, admin_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [nombre, descripcion, precio, imagenUrl, colores, tallas, admin_id]
    )
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: 'Error al crear producto' })
  }
})

// DELETE eliminar producto
router.delete('/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params
    const adminId = req.admin.id

    const producto = await pool.query(
      'SELECT * FROM productos WHERE id = $1 AND admin_id = $2',
      [id, adminId]
    )

    if (producto.rows.length === 0) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar este producto' })
    }

    await pool.query('DELETE FROM productos WHERE id = $1', [id])
    res.json({ mensaje: 'Producto eliminado' })
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar producto' })
  }
})

module.exports = router
