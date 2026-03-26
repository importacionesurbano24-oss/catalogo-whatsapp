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
// Función para subir imagen a Cloudinary
async function subirImagen(file) {
  const resultado = await new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream({ folder: 'catalogo-whatsapp' }, (error, result) => {
      if (error) reject(error)
      else resolve(result)
    }).end(file.buffer)
  })
  return resultado.secure_url
}

// GET todos los productos con categoría y marca (catálogo público)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, c.nombre AS categoria_nombre, m.nombre AS marca_nombre
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      LEFT JOIN marcas m ON p.marca_id = m.id
    `)
     // Agregar imágenes adicionales a cada producto
    for (let producto of result.rows) {
      const imagenes = await pool.query(
        'SELECT id, imagen_url, orden FROM producto_imagenes WHERE producto_id = $1 ORDER BY orden',
        [producto.id]
      )
      producto.imagenes = imagenes.rows
    }
    res.json(result.rows)

  } catch (error) {
    res.status(500).json({ error: 'Error al obtener productos' })
  }
})

// GET productos del admin logueado con categoría y marca
router.get('/mis-productos', verificarToken, async (req, res) => {
  try {
    const adminId = req.admin.id
    const result = await pool.query(`
      SELECT p.*, c.nombre AS categoria_nombre, m.nombre AS marca_nombre
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      LEFT JOIN marcas m ON p.marca_id = m.id
      WHERE p.admin_id = $1
      ORDER BY p.created_at DESC
    `, [adminId])
      // Agregar imágenes adicionales a cada producto
    for (let producto of result.rows) {
      const imagenes = await pool.query(
        'SELECT id, imagen_url, orden FROM producto_imagenes WHERE producto_id = $1 ORDER BY orden',
        [producto.id]
      )
      producto.imagenes = imagenes.rows
    }


    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener tus productos' })
  }
})

// POST crear producto con categoría y marca
router.post('/', verificarToken, upload.array('imagenes', 10), async (req, res) => {
  try {
    const { nombre, descripcion, precio, precio_descuento, colores, tallas, categoria_id, marca_id } = req.body
    const admin_id = req.admin.id
   let imagenPrincipal = null

    if (req.files && req.files.length > 0) {
      imagenPrincipal = await subirImagen(req.files[0])
    }
      // Validar que el admin no tenga más de 20 productos activos
    const result = await pool.query(
      'INSERT INTO productos (nombre, descripcion, precio, precio_descuento, imagen, colores, tallas, admin_id, categoria_id, marca_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [nombre, descripcion, precio, precio_descuento || null, imagenPrincipal, colores, tallas, admin_id, categoria_id || null, marca_id || null]
    )
      
    const productoId = result.rows[0].id

    // Subir imágenes adicionales a la tabla producto_imagenes
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const url = i === 0 ? imagenPrincipal : await subirImagen(req.files[i])
        await pool.query(
          'INSERT INTO producto_imagenes (producto_id, imagen_url, orden) VALUES ($1, $2, $3)',
          [productoId, url, i]
        )
      }
    }

    // Devolver producto con imágenes
    const imagenes = await pool.query(
      'SELECT id, imagen_url, orden FROM producto_imagenes WHERE producto_id = $1 ORDER BY orden',
      [productoId]
    )
    result.rows[0].imagenes = imagenes.rows

    res.json(result.rows[0])
  } catch (error) {
    console.log('Error al crear producto:', error.message)
    res.status(500).json({ error: 'Error al crear producto: ' + error.message })
  }
})

// PUT editar producto con categoría y marca
router.put('/:id', verificarToken, upload.array('imagenes', 10), async (req, res) => {
  try {
    const { id } = req.params
    const adminId = req.admin.id
    const { nombre, descripcion, precio, precio_descuento, colores, tallas, categoria_id, marca_id, imagenes_eliminar } = req.body

    const producto = await pool.query(
      'SELECT * FROM productos WHERE id = $1 AND admin_id = $2',
      [id, adminId]
    )

    if (producto.rows.length === 0) {
      return res.status(403).json({ error: 'No tienes permiso para editar este producto' })
    }

    // Eliminar imágenes seleccionadas
    if (imagenes_eliminar) {
      const idsEliminar = JSON.parse(imagenes_eliminar)
      for (const imgId of idsEliminar) {
        await pool.query('DELETE FROM producto_imagenes WHERE id = $1 AND producto_id = $2', [imgId, id])
      }
    }

    // Subir nuevas imágenes
    if (req.files && req.files.length > 0) {
      const maxOrden = await pool.query(
        'SELECT COALESCE(MAX(orden), -1) as max_orden FROM producto_imagenes WHERE producto_id = $1',
        [id]
      )
      let orden = maxOrden.rows[0].max_orden + 1

      for (let i = 0; i < req.files.length; i++) {
        const url = await subirImagen(req.files[i])
        await pool.query(
          'INSERT INTO producto_imagenes (producto_id, imagen_url, orden) VALUES ($1, $2, $3)',
          [id, url, orden + i]
        )
      }
    }

    // Actualizar imagen principal con la primera imagen de la galería
    const primeraImagen = await pool.query(
      'SELECT imagen_url FROM producto_imagenes WHERE producto_id = $1 ORDER BY orden LIMIT 1',
      [id]
    )
    const imagenUrl = primeraImagen.rows.length > 0 ? primeraImagen.rows[0].imagen_url : producto.rows[0].imagen

 const result = await pool.query(
      'UPDATE productos SET nombre=$1, descripcion=$2, precio=$3, precio_descuento=$4, imagen=$5, colores=$6, tallas=$7, categoria_id=$8, marca_id=$9 WHERE id=$10 AND admin_id=$11 RETURNING *',
      [nombre, descripcion, precio, precio_descuento || null, imagenUrl, colores, tallas, categoria_id || null, marca_id || null, id, adminId]
    )
    // Devolver producto con imágenes
    const imagenes = await pool.query(
      'SELECT id, imagen_url, orden FROM producto_imagenes WHERE producto_id = $1 ORDER BY orden',
      [id]
    )
    result.rows[0].imagenes = imagenes.rows

    res.json(result.rows[0])
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