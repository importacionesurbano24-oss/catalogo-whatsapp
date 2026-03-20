'use client'
import { useEffect, useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || ''

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorLogin, setErrorLogin] = useState('')
  const [productos, setProductos] = useState<any[]>([])
  const [mostrarForm, setMostrarForm] = useState(false)
  const [cargando, setCargando] = useState(false)

  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [precio, setPrecio] = useState('')
  const [colores, setColores] = useState('')
  const [tallas, setTallas] = useState('')
  const [imagen, setImagen] = useState<File | null>(null)
  const [editando, setEditando] = useState<any | null>(null)
  const [imagenEditar, setImagenEditar] = useState<File | null>(null)

  useEffect(() => {
    const t = localStorage.getItem('admin_token')
    if (t) { setToken(t); cargarProductos(t) }
  }, [])

  async function login(e: any) {
    e.preventDefault()
    setErrorLogin('')
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const data = await res.json()
    if (data.token) {
      localStorage.setItem('admin_token', data.token)
      localStorage.setItem('token', data.token)
      localStorage.setItem('admin', JSON.stringify(data.admin))
      setToken(data.token)
      cargarProductos(data.token)
    } else {
      setErrorLogin(data.error || 'Credenciales incorrectas')
    }
  }

  async function cargarProductos(t: string) {
    const res = await fetch(`${API}/api/productos/mis-productos`, {
      headers: { Authorization: `Bearer ${t}` }
    })
    const data = await res.json()
    setProductos(Array.isArray(data) ? data : [])
  }

  async function agregarProducto(e: any) {
    e.preventDefault()
    setCargando(true)
    const form = new FormData()
    form.append('nombre', nombre)
    form.append('descripcion', descripcion)
    form.append('precio', precio)
    form.append('colores', colores)
    form.append('tallas', tallas)
    if (imagen) form.append('imagen', imagen)

    const res = await fetch(`${API}/api/productos`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form
    })
    if (res.ok) {
      setNombre(''); setDescripcion(''); setPrecio('')
      setColores(''); setTallas(''); setImagen(null)
      setMostrarForm(false)
      cargarProductos(token!)
    }
    setCargando(false)
  }

  async function eliminar(id: number) {
    if (!confirm('¿Eliminar este producto?')) return
    await fetch(`${API}/api/productos/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    cargarProductos(token!)
  }

  function iniciarEdicion(p: any) {
    setEditando(p)
    setImagenEditar(null)
  }

  async function guardarEdicion(e: any) {
    e.preventDefault()
    setCargando(true)
    const form = new FormData()
    form.append('nombre', editando.nombre)
    form.append('descripcion', editando.descripcion || '')
    form.append('precio', editando.precio)
    form.append('colores', editando.colores || '')
    form.append('tallas', editando.tallas || '')
    if (imagenEditar) form.append('imagen', imagenEditar)

    const res = await fetch(`${API}/api/productos/${editando.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: form
    })
    if (res.ok) {
      setEditando(null)
      cargarProductos(token!)
    }
    setCargando(false)
  }

  function cerrarSesion() {
    localStorage.removeItem('admin_token')
    setToken(null)
    setProductos([])
  }

  if (editando) return (
    <main className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-4">
        <h2 className="text-white font-bold text-lg">Editar producto</h2>
        <form onSubmit={guardarEdicion} className="space-y-4">
          <input placeholder="Nombre *" value={editando.nombre} onChange={e => setEditando({ ...editando, nombre: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-gray-500" required />
          <textarea placeholder="Descripción" value={editando.descripcion || ''} onChange={e => setEditando({ ...editando, descripcion: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-gray-500 resize-none" rows={3} />
          <input placeholder="Precio *" type="number" value={editando.precio} onChange={e => setEditando({ ...editando, precio: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-gray-500" required />
          <input placeholder="Colores (separados por coma)" value={editando.colores || ''} onChange={e => setEditando({ ...editando, colores: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-gray-500" />
          <input placeholder="Tallas (separadas por coma)" value={editando.tallas || ''} onChange={e => setEditando({ ...editando, tallas: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-gray-500" />
          <div>
            {editando.imagen && <img src={editando.imagen} alt="actual" className="w-20 h-20 object-cover rounded-xl mb-2" />}
            <label className="text-gray-400 text-sm block mb-2">Nueva imagen (opcional)</label>
            <input type="file" accept="image/*" onChange={e => setImagenEditar(e.target.files?.[0] || null)} className="text-gray-400 text-sm" />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={cargando}
              className="flex-1 bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition disabled:opacity-50">
              {cargando ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button type="button" onClick={() => setEditando(null)}
              className="flex-1 border border-gray-700 text-gray-400 font-bold py-3 rounded-xl hover:text-white transition">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </main>
  )

  if (!token) return (
    <main className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-white text-2xl font-bold text-center mb-8">Panel Admin</h1>
        <form onSubmit={login} className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-4">
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-gray-500" required />
          <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-gray-500" required />
          {errorLogin && <p className="text-red-400 text-sm">{errorLogin}</p>}
          <button type="submit" className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition">
            Ingresar
          </button>
        </form>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen bg-black">
      <nav className="bg-gray-950 border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <h1 className="text-white font-bold text-lg">Panel Admin</h1>
        <div className="flex gap-3">
          <button onClick={() => setMostrarForm(!mostrarForm)}
            className="bg-white text-black font-bold px-4 py-2 rounded-xl text-sm hover:bg-gray-200 transition">
            {mostrarForm ? 'Cancelar' : '+ Agregar producto'}
          </button>
          <button onClick={cerrarSesion}
            className="border border-gray-700 text-gray-400 px-4 py-2 rounded-xl text-sm hover:border-gray-500 transition">
            Salir
          </button>
        </div>
      </nav>

      <div className="px-6 py-8 max-w-4xl mx-auto space-y-8">
        {mostrarForm && (
          <form onSubmit={agregarProducto} className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-4">
            <h2 className="text-white font-bold text-lg">Nuevo producto</h2>
            <input placeholder="Nombre *" value={nombre} onChange={e => setNombre(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-gray-500" required />
            <textarea placeholder="Descripción" value={descripcion} onChange={e => setDescripcion(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-gray-500 resize-none" rows={3} />
            <input placeholder="Precio *" type="number" value={precio} onChange={e => setPrecio(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-gray-500" required />
            <input placeholder="Colores (separados por coma)" value={colores} onChange={e => setColores(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-gray-500" />
            <input placeholder="Tallas (separadas por coma)" value={tallas} onChange={e => setTallas(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-gray-500" />
            <div>
              <label className="text-gray-400 text-sm block mb-2">Imagen del producto</label>
              <input type="file" accept="image/*" onChange={e => setImagen(e.target.files?.[0] || null)}
                className="text-gray-400 text-sm" />
            </div>
            <button type="submit" disabled={cargando}
              className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition disabled:opacity-50">
              {cargando ? 'Guardando...' : 'Guardar producto'}
            </button>
          </form>
        )}

        <div>
          <h2 className="text-white font-bold text-lg mb-4">Mis productos ({productos.length})</h2>
          {productos.length === 0 ? (
            <p className="text-gray-500 text-center py-12">No tienes productos aún</p>
          ) : (
            <div className="space-y-3">
              {productos.map(p => (
                <div key={p.id} className="bg-gray-900 rounded-2xl border border-gray-800 p-4 flex gap-4 items-center">
                  {p.imagen ? (
                    <img src={p.imagen} alt={p.nombre} className="w-16 h-16 object-cover rounded-xl flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">📦</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold">{p.nombre}</p>
                    <p className="text-gray-400 text-sm">{Number(p.precio).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</p>
                    {p.colores && <p className="text-gray-500 text-xs mt-1">Colores: {p.colores}</p>}
                    {p.tallas && <p className="text-gray-500 text-xs">Tallas: {p.tallas}</p>}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => iniciarEdicion(p)}
                      className="text-blue-400 hover:text-blue-300 text-sm border border-blue-900 px-3 py-1.5 rounded-lg transition">
                      Editar
                    </button>
                    <button onClick={() => eliminar(p.id)}
                      className="text-red-400 hover:text-red-300 text-sm border border-red-900 px-3 py-1.5 rounded-lg transition">
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
