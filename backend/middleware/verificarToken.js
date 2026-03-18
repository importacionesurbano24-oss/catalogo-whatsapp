const jwt = require('jsonwebtoken')

function verificarToken(req, res, next) {
  // El token viene en el header: Authorization: Bearer <token>
  const authHeader = req.headers['authorization']

  if (!authHeader) {
    return res.status(401).json({ error: 'Token no proporcionado' })
  }

  const token = authHeader.split(' ')[1] // Quitar "Bearer "

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.admin = decoded // Ahora req.admin tiene { id, email, rol }
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' })
  }
}

module.exports = verificarToken