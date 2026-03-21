const express = require('express')
const router = express.Router()
const pool = require('../db')
const verificarToken = require('../middleware/verificarToken')

// ==================== CATEGORÍAS ====================

// GET categorías del admin logueado
router.get('/categorias', verificarToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM categorias WHERE admin_id = $1 ORDER BY nombre ASC',
      [req.admin.id]
    )
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener categorías' })
  }
})

// POST crear categoría
router.post('/categorias', verificarToken, async (req, res) => {
  try {
    const { nombre } = req.body
    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({ error: 'El nombre es obligatorio' })
    }
    const result = await pool.query(
      'INSERT INTO categorias (nombre, admin_id) VALUES ($1, $2) RETURNING *',
      [nombre.trim(), req.admin.id]
    )
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: 'Error al crear categoría' })
  }
})

// PUT editar categoría
router.put('/categorias/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params
    const { nombre } = req.body
    const result = await pool.query(
      'UPDATE categorias SET nombre = $1 WHERE id = $2 AND admin_id = $3 RETURNING *',
      [nombre.trim(), id, req.admin.id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada' })
    }
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: 'Error al editar categoría' })
  }
})

// DELETE eliminar categoría
router.delete('/categorias/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params
    // Quitar la categoría de los productos que la tengan
    await pool.query(
      'UPDATE productos SET categoria_id = NULL WHERE categoria_id = $1 AND admin_id = $2',
      [id, req.admin.id]
    )
    const result = await pool.query(
      'DELETE FROM categorias WHERE id = $1 AND admin_id = $2',
      [id, req.admin.id]
    )
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Categoría no encontrada' })
    }
    res.json({ mensaje: 'Categoría eliminada' })
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar categoría' })
  }
})

// ==================== MARCAS ====================

// GET marcas del admin logueado
router.get('/marcas', verificarToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM marcas WHERE admin_id = $1 ORDER BY nombre ASC',
      [req.admin.id]
    )
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener marcas' })
  }
})

// POST crear marca
router.post('/marcas', verificarToken, async (req, res) => {
  try {
    const { nombre } = req.body
    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({ error: 'El nombre es obligatorio' })
    }
    const result = await pool.query(
      'INSERT INTO marcas (nombre, admin_id) VALUES ($1, $2) RETURNING *',
      [nombre.trim(), req.admin.id]
    )
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: 'Error al crear marca' })
  }
})

// PUT editar marca
router.put('/marcas/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params
    const { nombre } = req.body
    const result = await pool.query(
      'UPDATE marcas SET nombre = $1 WHERE id = $2 AND admin_id = $3 RETURNING *',
      [nombre.trim(), id, req.admin.id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Marca no encontrada' })
    }
    res.json(result.rows[0])
  } catch (error) {
    res.status(500).json({ error: 'Error al editar marca' })
  }
})

// DELETE eliminar marca
router.delete('/marcas/:id', verificarToken, async (req, res) => {
  try {
    const { id } = req.params
    await pool.query(
      'UPDATE productos SET marca_id = NULL WHERE marca_id = $1 AND admin_id = $2',
      [id, req.admin.id]
    )
    const result = await pool.query(
      'DELETE FROM marcas WHERE id = $1 AND admin_id = $2',
      [id, req.admin.id]
    )
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Marca no encontrada' })
    }
    res.json({ mensaje: 'Marca eliminada' })
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar marca' })
  }
})

module.exports = router