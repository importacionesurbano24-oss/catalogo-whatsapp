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

// GET todos los productos con imágenes y variantes
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT p.*, c.nombre AS categoria_nombre, m.nombre AS marca_nombre,
      COALESCE(
        (SELECT json_agg(json_build_object('id', pi.id, 'imagen_url', pi.imagen_url, 'orden', pi.orden, 'color', pi.color) ORDER BY pi.orden)
         FROM producto_imagenes pi 
         WHERE pi.producto_id = p.id), 
        '[]'
      ) AS imagenes,
      COALESCE(
        (SELECT json_agg(json_build_object('id', pv.id, 'color', pv.color, 'talla', pv.talla, 'precio', pv.precio, 'precio_descuento', pv.precio_descuento, 'stock', pv.stock) ORDER BY pv.id)
         FROM producto_variantes pv 
         WHERE pv.producto_id = p.id), 
        '[]'
      ) AS variantes
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      LEFT JOIN marcas m ON p.marca_id = m.id
    `;
    
    const result = await pool.query(query);
    res.json(result.rows);

  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// GET productos del admin logueado con variantes
router.get('/mis-productos', verificarToken, async (req, res) => {
  try {
    const adminId = req.admin.id;
    const query = `
      SELECT p.*, c.nombre AS categoria_nombre, m.nombre AS marca_nombre,
      COALESCE(
        (SELECT json_agg(json_build_object('id', pi.id, 'imagen_url', pi.imagen_url, 'orden', pi.orden) ORDER BY pi.orden)
         FROM producto_imagenes pi 
         WHERE pi.producto_id = p.id), 
        '[]'
      ) AS imagenes,
      COALESCE(
        (SELECT json_agg(json_build_object('id', pv.id, 'color', pv.color, 'talla', pv.talla, 'precio', pv.precio, 'precio_descuento', pv.precio_descuento, 'stock', pv.stock) ORDER BY pv.id)
         FROM producto_variantes pv 
         WHERE pv.producto_id = p.id), 
        '[]'
      ) AS variantes
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      LEFT JOIN marcas m ON p.marca_id = m.id
      WHERE p.admin_id = $1
      ORDER BY p.created_at DESC
    `;
    
    const result = await pool.query(query, [adminId]);
    res.json(result.rows);

  } catch (error) {
    console.error('Error al obtener tus productos:', error);
    res.status(500).json({ error: 'Error al obtener tus productos' });
  }
});

// POST crear producto con variantes
router.post('/', verificarToken, upload.array('imagenes', 10), async (req, res) => {
  try {
    const { nombre, descripcion, precio, precio_descuento, referencia, colores, tallas, categoria_id, marca_id, variantes } = req.body
    const admin_id = req.admin.id
    let imagenPrincipal = null

    if (req.files && req.files.length > 0) {
      imagenPrincipal = await subirImagen(req.files[0])
    }

    const result = await pool.query(
      'INSERT INTO productos (nombre, descripcion, precio, precio_descuento, referencia, imagen, colores, tallas, admin_id, categoria_id, marca_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
      [nombre, descripcion, precio, precio_descuento || null, referencia || null, imagenPrincipal, colores, tallas, admin_id, categoria_id || null, marca_id || null]
    )
      
    const productoId = result.rows[0].id

    // Subir imágenes
    if (req.files && req.files.length > 0) {
      let coloresImg = []
      try { coloresImg = req.body.imagenes_colores ? JSON.parse(req.body.imagenes_colores) : [] } catch(e) { coloresImg = [] }
      for (let i = 0; i < req.files.length; i++) {
        const url = i === 0 ? imagenPrincipal : await subirImagen(req.files[i])
        const colorImg = coloresImg[i] || null
        await pool.query(
          'INSERT INTO producto_imagenes (producto_id, imagen_url, orden, color) VALUES ($1, $2, $3, $4)',
          [productoId, url, i, colorImg]
        )
      }
    }

    // Guardar variantes
    if (variantes) {
      const variantesArr = JSON.parse(variantes)
      for (const v of variantesArr) {
        await pool.query(
          'INSERT INTO producto_variantes (producto_id, color, talla, precio, precio_descuento, stock) VALUES ($1, $2, $3, $4, $5, $6)',
          [productoId, v.color || null, v.talla || null, v.precio, v.precio_descuento || null, v.stock || 0]
        )
      }
    }

    // Devolver producto completo
    const imagenes = await pool.query(
      'SELECT id, imagen_url, orden, color FROM producto_imagenes WHERE producto_id = $1 ORDER BY orden',
      [productoId]
    )
    const variantesResult = await pool.query(
      'SELECT id, color, talla, precio, precio_descuento, stock FROM producto_variantes WHERE producto_id = $1 ORDER BY id',
      [productoId]
    )
    result.rows[0].imagenes = imagenes.rows
    result.rows[0].variantes = variantesResult.rows

    res.json(result.rows[0])
  } catch (error) {
    console.log('Error al crear producto:', error.message)
    res.status(500).json({ error: 'Error al crear producto: ' + error.message })
  }
})

// PUT editar producto con variantes
router.put('/:id', verificarToken, upload.array('imagenes', 10), async (req, res) => {
  try {
    const { id } = req.params
    const adminId = req.admin.id
    const { nombre, descripcion, precio, precio_descuento, referencia, colores, tallas, categoria_id, marca_id, imagenes_eliminar, variantes } = req.body

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

      let coloresImg = []
      try { coloresImg = req.body.imagenes_colores ? JSON.parse(req.body.imagenes_colores) : [] } catch(e) { coloresImg = [] }
      for (let i = 0; i < req.files.length; i++) {
        const url = await subirImagen(req.files[i])
        const colorImg = coloresImg[i] || null
        await pool.query(
          'INSERT INTO producto_imagenes (producto_id, imagen_url, orden, color) VALUES ($1, $2, $3, $4)',
          [id, url, orden + i, colorImg]
        )
      }
    }

    // Actualizar imagen principal
    const primeraImagen = await pool.query(
      'SELECT imagen_url FROM producto_imagenes WHERE producto_id = $1 ORDER BY orden LIMIT 1',
      [id]
    )
    const imagenUrl = primeraImagen.rows.length > 0 ? primeraImagen.rows[0].imagen_url : producto.rows[0].imagen

    const result = await pool.query(
      'UPDATE productos SET nombre=$1, descripcion=$2, precio=$3, precio_descuento=$4, referencia=$5, imagen=$6, colores=$7, tallas=$8, categoria_id=$9, marca_id=$10 WHERE id=$11 AND admin_id=$12 RETURNING *',
      [nombre, descripcion, precio, precio_descuento || null, referencia || null, imagenUrl, colores, tallas, categoria_id || null, marca_id || null, id, adminId]
    )

    // Actualizar variantes: eliminar las viejas y crear las nuevas
    if (variantes) {
      await pool.query('DELETE FROM producto_variantes WHERE producto_id = $1', [id])
      const variantesArr = JSON.parse(variantes)
      for (const v of variantesArr) {
        await pool.query(
          'INSERT INTO producto_variantes (producto_id, color, talla, precio, precio_descuento, stock) VALUES ($1, $2, $3, $4, $5, $6)',
          [id, v.color || null, v.talla || null, v.precio, v.precio_descuento || null, v.stock || 0]
        )
      }
    }

    // Devolver producto completo
    const imagenes = await pool.query(
      'SELECT id, imagen_url, orden, color FROM producto_imagenes WHERE producto_id = $1 ORDER BY orden',
      [id]
    )
    const variantesResult = await pool.query(
      'SELECT id, color, talla, precio, precio_descuento, stock FROM producto_variantes WHERE producto_id = $1 ORDER BY id',
      [id]
    )
    result.rows[0].imagenes = imagenes.rows
    result.rows[0].variantes = variantesResult.rows

    res.json(result.rows[0])

  } catch (error) {
    console.error('Error al editar producto:', error.message)
    res.status(500).json({ error: 'Error al editar producto: ' + error.message })
  }
})

// GET producto individual por ID (público) con variantes
router.get('/detalle/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query(`
      SELECT p.*, c.nombre AS categoria_nombre, m.nombre AS marca_nombre
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      LEFT JOIN marcas m ON p.marca_id = m.id
      WHERE p.id = $1
    `, [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' })
    }

    const producto = result.rows[0]
    const imagenes = await pool.query(
      'SELECT id, imagen_url, orden, color FROM producto_imagenes WHERE producto_id = $1 ORDER BY orden',
      [id]
    )
    const variantes = await pool.query(
      'SELECT id, color, talla, precio, precio_descuento, stock FROM producto_variantes WHERE producto_id = $1 ORDER BY id',
      [id]
    )
    producto.imagenes = imagenes.rows
    producto.variantes = variantes.rows

    res.json(producto)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener producto' })
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