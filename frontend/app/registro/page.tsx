'use client'
import { useState } from 'react'

export default function Registro() {
  const [form, setForm] = useState({ nombre: '', email: '', password: '', whatsapp: '' })
  const [confirmarPassword, setConfirmarPassword] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== confirmarPassword) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener mínimo 6 caracteres')
      return
    }
    setCargando(true)
    setMensaje('')
    setError('')

    try {
      const res = await fetch('https://catalogo-whatsapp-production.up.railway.app/api/auth/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Error al registrarse')
      } else {
        setMensaje('¡Cuenta creada! Ya puedes iniciar sesión en /admin')
        setForm({ nombre: '', email: '', password: '', whatsapp: '' })
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
        <h1 className="text-white text-2xl font-bold text-center mb-2">Crear cuenta</h1>
        <p className="text-gray-500 text-center text-sm mb-8">Registra tu tienda en el catálogo</p>

        <form onSubmit={handleSubmit} className="bg-gray-950 border border-gray-800 rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-gray-400 text-sm">Nombre de tu tienda</label>
            <input
              type="text"
              value={form.nombre}
              onChange={e => setForm({ ...form, nombre: e.target.value })}
              required
              className="mt-1 w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-3 focus:outline-none focus:border-gray-500"
              placeholder="Ej: Importaciones Urbano"
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
              className="mt-1 w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-3 focus:outline-none focus:border-gray-500"
              placeholder="tucorreo@email.com"
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm">Contraseña</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
              className="mt-1 w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-3 focus:outline-none focus:border-gray-500"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm">Confirmar contraseña</label>
            <input
              type="password"
              value={confirmarPassword}
              onChange={e => setConfirmarPassword(e.target.value)}
              required
              className="mt-1 w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-3 focus:outline-none focus:border-gray-500"
              placeholder="Repite tu contraseña"
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm">Número celular / WhatsApp</label>
            <input
              type="tel"
              value={form.whatsapp}
              onChange={e => setForm({ ...form, whatsapp: e.target.value })}
              required
              className="mt-1 w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-3 focus:outline-none focus:border-gray-500"
              placeholder="Ej: 573001234567"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
          {mensaje && <p className="text-green-400 text-sm">{mensaje}</p>}

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition disabled:opacity-50"
          >
            {cargando ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>

          <p className="text-center text-gray-600 text-sm">
            ¿Ya tienes cuenta? <a href="/admin" onClick={() => { localStorage.removeItem('admin_token'); localStorage.removeItem('token'); localStorage.removeItem('admin') }} className="text-white underline">Ir al admin</a>
          </p>
        </form>
      </div>
    </main>
  )
}
