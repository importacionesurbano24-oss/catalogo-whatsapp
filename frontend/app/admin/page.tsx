'use client'
import { useEffect, useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'https://catalogo-whatsapp-production.up.railway.app'

export default function Admin() {
  const [token, setToken] = useState<string | null>(null)
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [loginError, setLoginError] = useState('')
  const [productos, setProductos] = useState<any[]>([])
  const [form, setForm] = useState({ nombre: '', descripcion: '', precio: '', colores: '', tallas: '' })
  const [imagen, setImagen] = useState<File | null>(null)
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)
  const [perfil, setPerfil] = useState<any>(null)
  const [perfilForm, setPerfilForm] = useState({ nombre: '', whatsapp: '' })
  const [mensajePerfil, setMensajePerfil] = useState('')
  const [tab, setTab] = useState<'productos' | 'tienda'>('productos')

  useEffect(() => {
    const t = localStorage.getItem('token')
    if (t) {
      setToken(t)
      cargarProductos(t)
      cargarPerfil(t)
    }
  }, [])

  async function cargarProductos(t: string) {
    const res = await fetch(`${API}/api/productos/mis-productos`, {
      headers: { Authorization: `Bearer ${t}` }
    })
    const data = await res.json()
    setProductos(Array.isArray(data) ? data : [])
  }

  async function cargarPerfil(t: string) {
    const res = await fetch(`${API}/api/auth/perfil`, {
      headers: { Authorization: `Bearer ${t}` }
    })
    const data = await res.json()
    if (data.id) {
      setPerfil(data)
      setPerfilForm({ nombre: data.nombre || '', whatsapp: data.whatsapp || '' })
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginError('')
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginForm)
    })
    const data = await res.json()
    if (!res.ok) {
      setLoginError(data.error || 'Error al iniciar sesión')
    } else {
      localStorage.setItem('token', data.token)
      setToken(data.token)
      cargarProductos(data.token)
      cargarPerfil(data.token)
    }
  }

  function handleLogout() {
    localStorage.removeItem('token')
    setToken(null)
    setProductos([])
    setPerfil(null)
  }

  async function handleCrearProducto(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setCargando(true)
    setMensaje('')

    const formData = new FormData()
    formData.append('nombre', form.nombre)
    formData.append('descripcion', form.descripcion)
    formData.append('precio', form.precio)
    formData.append('colores', form.colores)
    formData.append('tallas', form.tallas)
    if (imagen) formData.append('imagen', imagen)

    const res = await fetch(`${API}/api/productos`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    })
    const data = await res.json()
    if (res.ok) {
      setMensaje('Producto creado!')
      setForm({ nombre: '', descripcion: '', precio: '', colores: '', tallas: '' })
      setImagen(null)
      cargarProductos(token)
    } else {
      setMensaje(data.error || 'Error al crear producto')
    }
    setCargando(false)
  }

  async function handleEliminar(id: number) {
    if (!token || !confirm('¿Eliminar este producto?')) return
    await fetch(`${API}/api/productos/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    cargarProductos(token)
  }

  async function handleGuardarPerfil(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    setMensajePerfil('')
    const res = await fetch(`${API}/api/auth/perfil`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(perfilForm)
    })
    const data = await res.json()
    if (res.ok) {
      setPerfil(data)
      setMensajePerfil('Guardado correctamente')
      setTimeout(() => setMensajePerfil(''), 3000)
    } else {
      setMensajePerfil(data.error || 'Error al guardar')
    }
  }

  if (!token) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <h1 className="text-white text-2xl font-bold text-center mb-2">Panel Admin</h1>
          <p className="text-gray-500 text-center text-sm mb-8">Inicia sesión para gestionar tus productos</p>
          <form onSubmit={handleLogin} className="bg-gray-950 border border-gray-800 rounded-2xl p-6 space-y-4">
            <div>
              <label className="text-gray-400 text-sm">Email</label>
              <input type="email" value={loginForm.email} onChange={e => setLoginForm({ ...loginForm, email: e.target.value })} required
                className="mt-1 w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-3 focus:outline-none focus:border-gray-500"
                placeholder="tucorreo@email.com" />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Contraseña</label>
              <input type="password" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} required
                className="mt-1 w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-3 focus:outline-none focus:border-gray-500"
                placeholder="Tu contraseña" />
            </div>
            {loginError && <p className="text-red-400 text-sm">{loginError}</p>}
            <button type="submit" className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition">
              Iniciar sesión
            </button>
            <p className="text-center text-gray-600 text-sm">
              ¿No tienes cuenta? <a href="/registro" className="text-white underline">Regístrate</a>
            </p>
          </form>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-white text-2xl font-bold">Panel Admin</h1>
            {perfil && <p className="text-gray-500 text-sm">{perfil.nombre}</p>}
          </div>
          <button onClick={handleLogout} className="text-gray-400 hover:text-white text-sm border border-gray-700 px-4 py-2 rounded-lg transition">
            Cerrar sesión
          </button>
        </div>

        {/* TABS */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab('productos')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'productos' ? 'bg-white text-black' : 'border border-gray-700 text-gray-400 hover:text-white'}`}>
            Mis productos
          </button>
          <button onClick={() => setTab('tienda')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === 'tienda' ? 'bg-white text-black' : 'border border-gray-700 text-gray-400 hover:text-white'}`}>
            Mi tienda
          </button>
        </div>

        {tab === 'productos' && (
          <>
            {/* FORM NUEVO PRODUCTO */}
            <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6 mb-6">
              <h2 className="text-white font-bold text-lg mb-4">Agregar producto</h2>
              <form onSubmit={handleCrearProducto} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required
                    placeholder="Nombre" className="bg-gray-900 border border-gray-700 text-white rounded-lg p-3 text-sm focus:outline-none" />
                  <input value={form.precio} onChange={e => setForm({ ...form, precio: e.target.value })} required type="number"
                    placeholder="Precio" className="bg-gray-900 border border-gray-700 text-white rounded-lg p-3 text-sm focus:outline-none" />
                </div>
                <textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Descripción (opcional)" rows={2}
                  className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-3 text-sm focus:outline-none" />
                <div className="grid grid-cols-2 gap-3">
                  <input value={form.colores} onChange={e => setForm({ ...form, colores: e.target.value })}
                    placeholder="Colores (ej: rojo, azul)" className="bg-gray-900 border border-gray-700 text-white rounded-lg p-3 text-sm focus:outline-none" />
                  <input value={form.tallas} onChange={e => setForm({ ...form, tallas: e.target.value })}
                    placeholder="Tallas (ej: S, M, L)" className="bg-gray-900 border border-gray-700 text-white rounded-lg p-3 text-sm focus:outline-none" />
                </div>
                <input type="file" accept="image/*" onChange={e => setImagen(e.target.files?.[0] || null)}
                  className="w-full text-gray-400 text-sm" />
                {mensaje && <p className={`text-sm ${mensaje.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>{mensaje}</p>}
                <button type="submit" disabled={cargando}
                  className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition disabled:opacity-50">
                  {cargando ? 'Guardando...' : 'Agregar producto'}
                </button>
              </form>
            </div>

            {/* LISTA PRODUCTOS */}
            <h2 className="text-white font-bold text-lg mb-4">Productos ({productos.length})</h2>
            {productos.length === 0 ? (
              <p className="text-gray-500 text-center py-10">No tienes productos aún</p>
            ) : (
              <div className="space-y-3">
                {productos.map(p => (
                  <div key={p.id} className="bg-gray-950 border border-gray-800 rounded-xl p-4 flex gap-4 items-center">
                    {p.imagen ? (
                      <img src={p.imagen} alt={p.nombre} className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />
                    ) : (
                      <div className="w-14 h-14 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-xl">📦</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium">{p.nombre}</p>
                      <p className="text-gray-500 text-sm">{Number(p.precio).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</p>
                      {p.colores && <p className="text-gray-600 text-xs">Colores: {p.colores}</p>}
                    </div>
                    <button onClick={() => handleEliminar(p.id)}
                      className="text-red-400 hover:text-red-300 text-sm border border-red-900 px-3 py-1.5 rounded-lg transition flex-shrink-0">
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'tienda' && (
          <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-white font-bold text-lg mb-1">Configuración de mi tienda</h2>
            <p className="text-gray-500 text-sm mb-6">Este número de WhatsApp recibirá los pedidos de tus clientes</p>
            <form onSubmit={handleGuardarPerfil} className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm">Nombre de la tienda</label>
                <input value={perfilForm.nombre} onChange={e => setPerfilForm({ ...perfilForm, nombre: e.target.value })} required
                  className="mt-1 w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-3 focus:outline-none focus:border-gray-500"
                  placeholder="Ej: Importaciones Urbano" />
              </div>
              <div>
                <label className="text-gray-400 text-sm">Número de WhatsApp</label>
                <input value={perfilForm.whatsapp} onChange={e => setPerfilForm({ ...perfilForm, whatsapp: e.target.value })} required
                  className="mt-1 w-full bg-gray-900 border border-gray-700 text-white rounded-lg p-3 focus:outline-none focus:border-gray-500"
                  placeholder="Ej: 573001234567" />
                <p className="text-gray-600 text-xs mt-1">Con código de país, sin espacios ni +</p>
              </div>
              {mensajePerfil && <p className={`text-sm ${mensajePerfil.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>{mensajePerfil}</p>}
              <button type="submit" className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition">
                Guardar cambios
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  )
}
