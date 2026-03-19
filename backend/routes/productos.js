const express = require('express')
const router = express.Router()
const pool = require('../db')
const multer = require('multer')
const path = require('path')
const verificarToken = require('../middleware/verificarToken')

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/imagenes/'))
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
})

const upload = multer({ storage })

// GET todos los productos (para el catálogo público — no necesita token)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM productos')
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener productos' })
  }
})

// GET productos del admin logueado (NUEVA RUTA — necesita token)
router.get('/mis-productos', verificarToken, async (req, res) => {
  try {
    const adminId = req.admin.id // Viene del token decodificado
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
    const admin_id = req.admin.id // Ya no viene del body, viene del token
    const imagen = req.file ? `/imagenes/${req.file.filename}` : null
    const result = await pool.query(
      'INSERT INTO productos (nombre, descripcion, precio, imagen, colores, tallas, admin_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [nombre, descripcion, precio, imagen, colores, tallas, admin_id]
    )
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: 'Error al crear producto' })
  }
})

// DELETE eliminar producto (protegido — solo el dueño puede eliminar)
router.delete('/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params
    const adminId = req.admin.id

    // Verificar que el producto pertenece a este admin
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