const express = require('express')
const router = express.Router()
const pool = require('../db')

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
    res.json({ tienda: tienda.rows[0], productos: productos.rows })
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener tienda' })
  }
})

module.exports = router