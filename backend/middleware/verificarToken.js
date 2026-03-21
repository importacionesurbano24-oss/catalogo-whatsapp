const jwt = require('jsonwebtoken')   // const jwt = require('jsonwebtoken') es una biblioteca para crear y verificar JSON Web Tokens (JWTs).

function verificarToken(req, res, next) {
  // El token viene en el header: Authorization: Bearer <token>
  const authHeader = req.headers['authorization']

  if (!authHeader) {  //authHeader es el encabezado de autorización que se espera que contenga el token JWT. Si no se proporciona este encabezado, la función devuelve una respuesta con un estado 401 (No autorizado) y un mensaje de error indicando que el token no fue proporcionado.
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