'use client'
import { useState } from 'react'

export default function Recuperar() {
  const [paso, setPaso] = useState(1)
  const [email, setEmail] = useState('')
  const [codigo, setCodigo] = useState('')
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [confirmarPassword, setConfirmarPassword] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function enviarCodigo(e: React.FormEvent) {
    e.preventDefault()
    setCargando(true)
    setError('')
    setMensaje('')
    try {
      const res = await fetch('https://catalogo-whatsapp-production.up.railway.app/api/auth/recuperar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      if (res.ok) {
        setMensaje('Código enviado a tu email. Revisa tu bandeja de entrada.')
        setPaso(2)
      } else {
        setError(data.error || 'Error al enviar código')
      }
    } catch {
      setError('No se pudo conectar al servidor')
    } finally {
      setCargando(false)
    }
  }

  async function cambiarPassword(e: React.FormEvent) {
    e.preventDefault()
    if (nuevaPassword !== confirmarPassword) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (nuevaPassword.length < 6) {
      setError('La contraseña debe tener mínimo 6 caracteres')
      return
    }
    setCargando(true)
    setError('')
    setMensaje('')
    try {
      const res = await fetch('https://catalogo-whatsapp-production.up.railway.app/api/auth/cambiar-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, codigo, nuevaPassword })
      })
      const data = await res.json()
      if (res.ok) {
        setMensaje('¡Contraseña actualizada! Ya puedes iniciar sesión.')
        setPaso(3)
      } else {
        setError(data.error || 'Error al cambiar contraseña')
      }
    } catch {
      setError('No se pudo conectar al servidor')
    } finally {
      setCargando(false)
    }
  }

  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-white text-2xl font-bold text-center mb-2">Recuperar contraseña</h1>
        <p className="text-gray-500 text-center text-sm mb-8">
          {paso === 1 && 'Ingresa tu email para recibir un código'}
          {paso === 2 && 'Ingresa el código y tu nueva contraseña'}
          {paso === 3 && '¡Listo! Tu contraseña fue actualizada'}
        </p>

        {paso === 1 && (
          <form onSubmit={enviarCodigo} className="bg-gray-950 border border-gray-800 rounded-2xl p-6 space-y-4">
            <div>
              <label className="text-gray-400 text-sm">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="mt-1 w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-3 focus:outline-none focus:border-gray-500"
                placeholder="tucorreo@email.com" />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            {mensaje && <p className="text-green-400 text-sm">{mensaje}</p>}
            <button type="submit" disabled={cargando}
              className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition disabled:opacity-50">
              {cargando ? 'Enviando...' : 'Enviar código'}
            </button>
          </form>
        )}

        {paso === 2 && (
          <form onSubmit={cambiarPassword} className="bg-gray-950 border border-gray-800 rounded-2xl p-6 space-y-4">
            <div>
              <label className="text-gray-400 text-sm">Código de verificación</label>
              <input type="text" value={codigo} onChange={e => setCodigo(e.target.value)} required
                className="mt-1 w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-3 focus:outline-none focus:border-gray-500 text-center text-2xl tracking-widest"
                placeholder="000000" maxLength={6} />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Nueva contraseña</label>
              <input type="password" value={nuevaPassword} onChange={e => setNuevaPassword(e.target.value)} required
                className="mt-1 w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-3 focus:outline-none focus:border-gray-500"
                placeholder="Mínimo 6 caracteres" />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Confirmar contraseña</label>
              <input type="password" value={confirmarPassword} onChange={e => setConfirmarPassword(e.target.value)} required
                className="mt-1 w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-3 focus:outline-none focus:border-gray-500"
                placeholder="Repite tu contraseña" />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            {mensaje && <p className="text-green-400 text-sm">{mensaje}</p>}
            <button type="submit" disabled={cargando}
              className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition disabled:opacity-50">
              {cargando ? 'Cambiando...' : 'Cambiar contraseña'}
            </button>
          </form>
        )}

        {paso === 3 && (
          <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6 text-center space-y-4">
            <p className="text-green-400 text-lg">✅ ¡Contraseña actualizada!</p>
            <a href="/admin" className="block w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition text-center">
              Ir a iniciar sesión
            </a>
          </div>
        )}

        <p className="text-center text-gray-600 text-sm mt-6">
          <a href="/admin" className="text-white underline">Volver al login</a>
        </p>
      </div>
    </main>
  )
}