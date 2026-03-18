const express = require('express')
const router = express.Router()
const pool = require('../db')
const verificarToken = require('../middleware/verificarToken')

// Middleware: verificar que sea superadmin
function soloSuperadmin(req, res, next) {
  if (req.admin.rol !== 'superadmin') {
    return res.status(403).json({ error: 'No tienes permiso. Solo superadmin.' })
  }
  next()
}

// GET estadísticas generales
router.get('/estadisticas', verificarToken, soloSuperadmin, async (req, res) => {
  try {
    const totalTiendas = await pool.query("SELECT COUNT(*) FROM admins WHERE rol = 'admin'")
    const totalProductos = await pool.query('SELECT COUNT(*) FROM productos')
    const totalActivos = await pool.query("SELECT COUNT(*) FROM admins WHERE rol = 'admin' AND activo = true")
    const totalBloqueados = await pool.query("SELECT COUNT(*) FROM admins WHERE rol = 'admin' AND activo = false")

    res.json({
      tiendas: Number(totalTiendas.rows[0].count),
      productos: Number(totalProductos.rows[0].count),
      activos: Number(totalActivos.rows[0].count),
      bloqueados: Number(totalBloqueados.rows[0].count)
    })
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener estadísticas' })
  }
})

// GET todas las tiendas con cantidad de productos
router.get('/tiendas', verificarToken, soloSuperadmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        a.id, a.nombre, a.email, a.rol, a.activo, a.plan, a.created_at,
        COUNT(p.id) AS total_productos
      FROM admins a
      LEFT JOIN productos p ON p.admin_id = a.id
      WHERE a.rol = 'admin'
      GROUP BY a.id
      ORDER BY a.created_at DESC
    `)
    res.json(result.rows)
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener tiendas' })
  }
})

// PUT bloquear o activar una tienda
router.put('/tiendas/:id/toggle', verificarToken, soloSuperadmin, async (req, res) => {
  try {
    const { id } = req.params
    const admin = await pool.query('SELECT activo FROM admins WHERE id = $1', [id])

    if (admin.rows.length === 0) {
      return res.status(404).json({ error: 'Tienda no encontrada' })
    }

    const nuevoEstado = !admin.rows[0].activo
    await pool.query('UPDATE admins SET activo = $1 WHERE id = $2', [nuevoEstado, id])

    res.json({ mensaje: nuevoEstado ? 'Tienda activada' : 'Tienda bloqueada', activo: nuevoEstado })
  } catch (error) {
    res.status(500).json({ error: 'Error al cambiar estado de la tienda' })
  }
})

module.exports = router