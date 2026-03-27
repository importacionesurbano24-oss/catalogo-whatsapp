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
  const [precioDescuento, setPrecioDescuento] = useState('')
  const [colores, setColores] = useState('')
  const [tallas, setTallas] = useState('')
  const [imagenes, setImagenes] = useState<File[]>([])
  const [categoriaId, setCategoriaId] = useState('')
  const [marcaId, setMarcaId] = useState('')
  const [editando, setEditando] = useState<any | null>(null)
  const [imagenEditar, setImagenEditar] = useState<any>(null) // Cambiado a any para soportar FileList
  const [adminInfo, setAdminInfo] = useState<any>(null)
  const [mostrarConfig, setMostrarConfig] = useState(false)
  const [config, setConfig] = useState({ nombre: '', slug: '', whatsapp: '', color: '#ffffff', descripcion_tienda: '' })
  const [logoConfig, setLogoConfig] = useState<File | null>(null)
  const [mensajeConfig, setMensajeConfig] = useState('')

  const [categorias, setCategorias] = useState<any[]>([])
  const [marcas, setMarcas] = useState<any[]>([])
  const [mostrarCatMarcas, setMostrarCatMarcas] = useState(false)
  const [nuevaCategoria, setNuevaCategoria] = useState('')
  const [nuevaMarca, setNuevaMarca] = useState('')
  const [mostrarSubProductos, setMostrarSubProductos] = useState(false)
  const [mostrarListaProductos, setMostrarListaProductos] = useState(false)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [tabLogin, setTabLogin] = useState<'login' | 'registro'>('registro')
  const [regNombre, setRegNombre] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirmar, setRegConfirmar] = useState('')
  const [regWhatsapp, setRegWhatsapp] = useState('')
  const [regError, setRegError] = useState('')
  const [regMensaje, setRegMensaje] = useState('')
  const [regCargando, setRegCargando] = useState(false)

  useEffect(() => {
    const t = localStorage.getItem('admin_token')
    if (t) {
      setToken(t)
      const a = localStorage.getItem('admin')
      if (a) {
        try {
          setAdminInfo(JSON.parse(a))
        } catch {}
      }
      cargarConfig(t)
      cargarProductos(t)
      cargarCategorias(t)
      cargarMarcas(t)
    }
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
      setAdminInfo(data.admin)
      setConfig({ nombre: '', slug: '', whatsapp: '', color: '#ffffff', descripcion_tienda: '' })
      cargarProductos(data.token)
      await cargarConfig(data.token)
      cargarCategorias(data.token)
      cargarMarcas(data.token)
    } else {
      setErrorLogin(data.error || 'Credenciales incorrectas')
    }
  }

  async function cargarProductos(t: string) {
    const res = await fetch(`${API}/api/productos/mis-productos`, { headers: { Authorization: `Bearer ${t}` } })
    const data = await res.json()
    setProductos(Array.isArray(data) ? data : [])
  }

  async function cargarCategorias(t: string) {
    const res = await fetch(`${API}/api/categorias`, { headers: { Authorization: `Bearer ${t}` } })
    const data = await res.json()
    setCategorias(Array.isArray(data) ? data : [])
  }

  async function cargarMarcas(t: string) {
    const res = await fetch(`${API}/api/marcas`, { headers: { Authorization: `Bearer ${t}` } })
    const data = await res.json()
    setMarcas(Array.isArray(data) ? data : [])
  }

  async function crearCategoria() {
    if (!nuevaCategoria.trim()) return
    setCargando(true)
    const res = await fetch(`${API}/api/categorias`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ nombre: nuevaCategoria.trim() })
    })
    if (res.ok) { setNuevaCategoria(''); cargarCategorias(token!) }
    setCargando(false)
  }

  async function eliminarCategoria(id: number) {
    if (!confirm('Eliminar esta categoria?')) return
    await fetch(`${API}/api/categorias/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    cargarCategorias(token!)
    cargarProductos(token!)
  }

  async function crearMarca() {
    if (!nuevaMarca.trim()) return
    setCargando(true)
    const res = await fetch(`${API}/api/marcas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ nombre: nuevaMarca.trim() })
    })
    if (res.ok) { setNuevaMarca(''); cargarMarcas(token!) }
    setCargando(false)
  }

  async function eliminarMarca(id: number) {
    if (!confirm('Eliminar esta marca?')) return
    await fetch(`${API}/api/marcas/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    cargarMarcas(token!)
    cargarProductos(token!)
  }

  async function agregarProducto(e: any) {
    e.preventDefault()
    setCargando(true)
    const form = new FormData()
    form.append('nombre', nombre)
    form.append('descripcion', descripcion)
    form.append('precio', precio)
    form.append('precio_descuento', precioDescuento)
    form.append('colores', colores)
    form.append('tallas', tallas)
    form.append('categoria_id', categoriaId || '')
    form.append('marca_id', marcaId || '')
    imagenes.forEach(img => form.append('imagenes', img))
    const res = await fetch(`${API}/api/productos`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form })
    if (res.ok) {
      setNombre(''); setDescripcion(''); setPrecio(''); setPrecioDescuento('')
      setColores(''); setTallas(''); setImagenes([])
      setCategoriaId(''); setMarcaId('')
      setMostrarForm(false)
      cargarProductos(token!)
    }
    setCargando(false)
  }

  async function eliminar(id: number) {
    if (!confirm('Eliminar este producto?')) return
    await fetch(`${API}/api/productos/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    cargarProductos(token!)
  }

  function iniciarEdicion(p: any) {
    setEditando({ ...p, categoria_id: p.categoria_id || '', marca_id: p.marca_id || '', precio_descuento: p.precio_descuento || '', imagenes_eliminar: [] })
    setImagenEditar(null)
  }

  async function guardarEdicion(e: any) {
    e.preventDefault()
    setCargando(true)
    const form = new FormData()
    form.append('nombre', editando.nombre)
    form.append('descripcion', editando.descripcion || '')
    form.append('precio', editando.precio)
    form.append('precio_descuento', editando.precio_descuento || '')
    if (editando.imagenes_eliminar) form.append('imagenes_eliminar', JSON.stringify(editando.imagenes_eliminar))
    form.append('colores', editando.colores || '')
    form.append('tallas', editando.tallas || '')
    form.append('categoria_id', editando.categoria_id || '')
    form.append('marca_id', editando.marca_id || '')
    if (imagenEditar) {
      for (let i = 0; i < imagenEditar.length; i++) {
        form.append('imagenes', imagenEditar[i])
      }
    }
    const res = await fetch(`${API}/api/productos/${editando.id}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: form })
    if (res.ok) { setEditando(null); cargarProductos(token!) }
    setCargando(false)
  }

  async function cargarConfig(t: string) {
    const res = await fetch(`${API}/api/tienda/configuracion`, { headers: { Authorization: `Bearer ${t}` } })
    const data = await res.json()
    if (data) {
      setConfig({ nombre: data.nombre || '', slug: data.slug || '', whatsapp: data.whatsapp || '', color: data.color || '#ffffff', descripcion_tienda: data.descripcion_tienda || '' })
      setAdminInfo((prev: any) => ({ ...prev, id: data.id, nombre: data.nombre, rol: data.rol, plan: data.plan }))
    }
  }

  async function guardarConfig(e: any) {
    e.preventDefault()
    setCargando(true)
    setMensajeConfig('')
    const form = new FormData()
    form.append('nombre', config.nombre)
    form.append('whatsapp', config.whatsapp)
    form.append('color', config.color)
    form.append('descripcion_tienda', config.descripcion_tienda)
    if (logoConfig) form.append('logo', logoConfig)
    const res = await fetch(`${API}/api/tienda/configuracion`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: form })
    if (res.ok) { setMensajeConfig('Configuracion guardada!'); setLogoConfig(null) } else { setMensajeConfig('Error al guardar') }
    setCargando(false)
  }

  function cerrarSesion() {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('token')
    localStorage.removeItem('admin')
    setToken(null); setProductos([]); setAdminInfo(null)
    setConfig({ nombre: '', slug: '', whatsapp: '', color: '#ffffff', descripcion_tienda: '' })
  }

  function slugSeguro() {
    const base = (config.slug || config.nombre || '').trim().toLowerCase()
    return base.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
  }

  function navegarYCerrarMenu(accion: () => void) {
    accion()
    setMenuAbierto(false)
  }

  async function registro(e: any) {
    e.preventDefault()
    setRegError('')
    setRegMensaje('')
    if (regPassword !== regConfirmar) {
      setRegError('Las contraseñas no coinciden')
      return
    }
    if (regPassword.length < 6) {
      setRegError('La contraseña debe tener mínimo 6 caracteres')
      return
    }
    setRegCargando(true)
    try {
      const res = await fetch(`${API}/api/auth/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: regNombre, email: regEmail, password: regPassword, whatsapp: regWhatsapp })
      })
      const data = await res.json()
      if (!res.ok) {
        setRegError(data.error || 'Error al registrarse')
      } else {
        setRegMensaje('¡Cuenta creada! Ahora inicia sesión.')
        setRegNombre(''); setRegEmail(''); setRegPassword(''); setRegConfirmar(''); setRegWhatsapp('')
        setTimeout(() => setTabLogin('login'), 2000)
      }
    } catch {
      setRegError('No se pudo conectar al servidor')
    } finally {
      setRegCargando(false)
    }
  }
  

  if (editando) return (
    <main className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-4">
        <h2 className="text-white font-bold text-lg">Editar producto</h2>
        <form onSubmit={guardarEdicion} className="space-y-4">
          <input placeholder="Nombre *" value={editando.nombre} onChange={e => setEditando({ ...editando, nombre: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-gray-500" required />
          <textarea placeholder="Descripcion" value={editando.descripcion || ''} onChange={e => setEditando({ ...editando, descripcion: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-gray-500 resize-none" rows={3} />
          <input placeholder="Precio *" type="number" value={editando.precio} onChange={e => setEditando({ ...editando, precio: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-gray-500" required />
          <input placeholder="Precio con descuento (opcional)" type="number" value={editando.precio_descuento} onChange={e => setEditando({ ...editando, precio_descuento: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-gray-500" />
          <div className="grid grid-cols-2 gap-3">
            <select value={editando.categoria_id} onChange={e => setEditando({ ...editando, categoria_id: e.target.value })}
              className="bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-gray-500">
              <option value="">Sin categoria</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
            <select value={editando.marca_id} onChange={e => setEditando({ ...editando, marca_id: e.target.value })}
              className="bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-gray-500">
              <option value="">Sin marca</option>
              {marcas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
          </div>
          <input placeholder="Colores (separados por coma)" value={editando.colores || ''} onChange={e => setEditando({ ...editando, colores: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-gray-500" />
          <input placeholder="Tallas (separadas por coma)" value={editando.tallas || ''} onChange={e => setEditando({ ...editando, tallas: e.target.value })}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-gray-500" />
          <div>
            {editando.imagenes && editando.imagenes.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {editando.imagenes.map((img: any) => (
                  <div key={img.id} className="relative">
                    <img src={img.imagen_url} alt="producto" className="w-20 h-20 object-cover rounded-xl" />
                    <button type="button" onClick={() => {
                      const eliminar = editando.imagenes_eliminar || []
                      setEditando({ ...editando, imagenes: editando.imagenes.filter((i: any) => i.id !== img.id), imagenes_eliminar: [...eliminar, img.id] })
                    }} className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">✕</button>
                  </div>
                ))}
              </div>
            )}
            {!editando.imagenes?.length && editando.imagen && (
              <img src={editando.imagen} alt="actual" className="w-20 h-20 object-cover rounded-xl mb-2" />
            )}
            <label className="text-gray-400 text-sm block mb-2">Agregar imágenes</label>
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-700 rounded-xl cursor-pointer hover:border-gray-500 transition">
              <span className="text-gray-400 text-2xl">📷</span>
              <span className="text-gray-500 text-xs mt-1">{imagenEditar ? `${imagenEditar.length || 1} nueva(s)` : 'Toca para agregar imágenes'}</span>
              <input type="file" accept="image/*" multiple onChange={e => setImagenEditar(e.target.files)} className="hidden" />
            </label>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={cargando} className="flex-1 bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition disabled:opacity-50">
              {cargando ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <button type="button" onClick={() => setEditando(null)} className="flex-1 border border-gray-700 text-gray-400 font-bold py-3 rounded-xl hover:text-white transition">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </main>
  )

  if (!token) return (
    <main className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="text-white text-2xl font-bold text-center mb-6">Panel Admin</h1>
        <div className="flex mb-6 bg-gray-900 rounded-xl p-1 border border-gray-800">
          <button onClick={() => setTabLogin('login')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition ${tabLogin === 'login' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}>
            Iniciar sesión
          </button>
          <button onClick={() => setTabLogin('registro')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition ${tabLogin === 'registro' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}>
            Crear cuenta
          </button>
        </div>

        {tabLogin === 'login' ? (
          <form onSubmit={login} className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-4">
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-gray-500" required />
            <input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-gray-500" required />
            {errorLogin && <p className="text-red-400 text-sm">{errorLogin}</p>}
            <button type="submit" className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition">Ingresar</button>
            <p className="text-center text-sm mt-2">
              <a href="/recuperar" className="text-green-400 hover:text-green-300 underline">¿Olvidaste tu contraseña?</a>
            </p>
          </form>
        ) : (
          <form onSubmit={registro} className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-4">
            <div>
              <label className="text-gray-400 text-sm">Nombre de tu tienda</label>
              <input type="text" value={regNombre} onChange={e => setRegNombre(e.target.value)} required
                className="mt-1 w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-gray-500"
                placeholder="Ej: Importaciones Urbano" />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Email</label>
              <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} required
                className="mt-1 w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-gray-500"
                placeholder="tucorreo@email.com" />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Contraseña</label>
              <input type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} required
                className="mt-1 w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-gray-500"
                placeholder="Mínimo 6 caracteres" />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Confirmar contraseña</label>
              <input type="password" value={regConfirmar} onChange={e => setRegConfirmar(e.target.value)} required
                className="mt-1 w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-gray-500"
                placeholder="Repite tu contraseña" />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Número celular / WhatsApp</label>
              <input type="tel" value={regWhatsapp} onChange={e => setRegWhatsapp(e.target.value)} required
                className="mt-1 w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-gray-500"
                placeholder="Ej: 573001234567" />
            </div>
            {regError && <p className="text-red-400 text-sm">{regError}</p>}
            {regMensaje && <p className="text-green-400 text-sm">{regMensaje}</p>}
            <button type="submit" disabled={regCargando}
              className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition disabled:opacity-50">
              {regCargando ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>
        )}
      </div>
    </main>
  )

  return (
    <main className="min-h-screen bg-black">
      {/* BOTON HAMBURGUESA - solo en móvil */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-gray-950 border-b border-gray-800 px-4 py-3 flex justify-start gap-4 items-center z-50">
        <button onClick={() => setMenuAbierto(!menuAbierto)} className="text-white text-2xl">
          {menuAbierto ? '✕' : '☰'}
        </button>
        <h1 className="text-white font-bold text-lg">Panel Admin</h1>
      </div>

      {/* OVERLAY - solo en móvil cuando el menú está abierto */}
      {menuAbierto && (
        <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setMenuAbierto(false)} />
      )}

      <div className="flex">
        {/* SIDEBAR */}
        <aside className={`w-56 min-h-screen bg-gray-950 border-r border-gray-800 p-4 flex flex-col gap-1 fixed z-50 transition-transform duration-300 ${menuAbierto ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
          <h1 className="text-white font-bold text-lg mb-6 px-3 hidden md:block">Panel Admin</h1>
          <div className="mt-12 md:mt-0">
            <button onClick={() => setMostrarSubProductos(!mostrarSubProductos)}
              className="flex items-center justify-between text-gray-400 hover:text-white hover:bg-gray-800 px-3 py-2.5 rounded-xl text-sm transition text-left w-full">
              <span className="flex items-center gap-3">📦 Productos</span>
              <span className="text-xs">{mostrarSubProductos ? '▲' : '▼'}</span>
            </button>
            {mostrarSubProductos && (
              <div className="space-y-1 mt-1">
                <button onClick={() => navegarYCerrarMenu(() => { setMostrarForm(true); setMostrarCatMarcas(false); setMostrarConfig(false); setMostrarListaProductos(false) })}
                  className="text-gray-500 hover:text-white hover:bg-gray-800 px-3 py-2 rounded-xl text-xs transition text-left w-full pl-10">
                  + Crear producto
                </button>
                <button onClick={() => navegarYCerrarMenu(() => { setMostrarListaProductos(true); setMostrarForm(false); setMostrarCatMarcas(false); setMostrarConfig(false) })}
                  className="text-gray-500 hover:text-white hover:bg-gray-800 px-3 py-2 rounded-xl text-xs transition text-left w-full pl-10">
                  📋 Lista de productos
                </button>
              </div>
            )}
          </div>
          <button onClick={() => navegarYCerrarMenu(() => { setMostrarCatMarcas(true); setMostrarConfig(false); setMostrarListaProductos(false) })}
            className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-gray-800 px-3 py-2.5 rounded-xl text-sm transition text-left w-full">
            🏷️ Marcas
          </button>
          <button onClick={() => navegarYCerrarMenu(() => { setMostrarCatMarcas(true); setMostrarConfig(false); setMostrarListaProductos(false) })}
            className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-gray-800 px-3 py-2.5 rounded-xl text-sm transition text-left w-full">
            📂 Categorías
          </button>
          <button onClick={() => navegarYCerrarMenu(() => { setMostrarConfig(true); setMostrarCatMarcas(false); setMostrarListaProductos(false) })}
            className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-gray-800 px-3 py-2.5 rounded-xl text-sm transition text-left w-full">
            ⚙️ Configuración
          </button>
          
          {/* BOTON DE VER TIENDA YA CORREGIDO */}
          <button
            onClick={() => {
              const s = config.slug || slugSeguro()
              if (!s) {
                alert('Primero configura el nombre de tu tienda en Configuración')
                return
              }
              window.open(`/tienda/${s}`, '_blank')
            }}
            className="flex items-center gap-3 text-green-400 hover:text-green-300 hover:bg-gray-800 px-3 py-2.5 rounded-xl text-sm transition text-left w-full">
            🏪 Ver Tienda
          </button>

          {adminInfo?.rol === 'superadmin' && (
            <a href="/superadmin" className="flex items-center gap-3 text-yellow-500 hover:text-yellow-400 hover:bg-gray-800 px-3 py-2.5 rounded-xl text-sm transition">
              👑 Superadmin
            </a>
          )}
          <div className="mt-auto">
            <button onClick={cerrarSesion} className="flex items-center gap-3 text-gray-500 hover:text-red-400 hover:bg-gray-800 px-3 py-2.5 rounded-xl text-sm transition w-full text-left">
              🚪 Cerrar sesión
            </button>
          </div>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <div className="w-full md:ml-56 px-4 md:px-6 py-8 pt-16 md:pt-8 max-w-4xl mx-auto space-y-8">
          {mostrarCatMarcas && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 space-y-4">
                <h2 className="text-white font-bold text-lg">📂 Categorias</h2>
                <div className="flex gap-2">
                  <input placeholder="Nueva categoria" value={nuevaCategoria} onChange={e => setNuevaCategoria(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), crearCategoria())}
                    className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gray-500" />
                  <button onClick={crearCategoria} disabled={!slugSeguro()}
                    className="bg-white text-black font-bold px-4 py-2 rounded-xl text-sm hover:bg-gray-200 transition disabled:opacity-50">+</button>
                </div>
                {categorias.length === 0 ? (
                  <p className="text-gray-500 text-sm">No tienes categorias aun</p>
                ) : (
                  <div className="space-y-2">
                    {categorias.map(c => (
                      <div key={c.id} className="flex justify-between items-center bg-gray-800 rounded-lg px-3 py-2">
                        <span className="text-white text-sm">{c.nombre}</span>
                        <button onClick={() => eliminarCategoria(c.id)} className="text-red-400 hover:text-red-300 text-xs">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 space-y-4">
                <h2 className="text-white font-bold text-lg">🏷️ Marcas</h2>
                <div className="flex gap-2">
                  <input placeholder="Nueva marca" value={nuevaMarca} onChange={e => setNuevaMarca(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), crearMarca())}
                    className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gray-500" />
                  <button onClick={crearMarca} disabled={cargando}
                    className="bg-white text-black font-bold px-4 py-2 rounded-xl text-sm hover:bg-gray-200 transition disabled:opacity-50">+</button>
                </div>
                {marcas.length === 0 ? (
                  <p className="text-gray-500 text-sm">No tienes marcas aun</p>
                ) : (
                  <div className="space-y-2">
                    {marcas.map(m => (
                      <div key={m.id} className="flex justify-between items-center bg-gray-800 rounded-lg px-3 py-2">
                        <span className="text-white text-sm">{m.nombre}</span>
                        <button onClick={() => eliminarMarca(m.id)} className="text-red-400 hover:text-red-300 text-xs">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {mostrarConfig && (
            <form onSubmit={guardarConfig} className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-4">
              <h2 className="text-white font-bold text-lg">⚙️ Configuracion de mi tienda</h2>
              <input placeholder="Nombre de la tienda" value={config.nombre} onChange={e => setConfig({ ...config, nombre: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-gray-500" />
              <input placeholder="Numero WhatsApp (ej: 573001234567)" value={config.whatsapp} onChange={e => setConfig({ ...config, whatsapp: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-gray-500" />
              <textarea placeholder="Descripcion de la tienda" value={config.descripcion_tienda} onChange={e => setConfig({ ...config, descripcion_tienda: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-gray-500 resize-none" rows={2} />
              <div className="flex items-center gap-4">
                <label className="text-gray-400 text-sm">Color principal:</label>
                <input type="color" value={config.color} onChange={e => setConfig({ ...config, color: e.target.value })}
                  className="w-12 h-10 rounded cursor-pointer border border-gray-700 bg-transparent" />
                <span className="text-gray-500 text-sm">{config.color}</span>
              </div>
              <div>
                <label className="text-gray-400 text-sm block mb-2">Logo de la tienda</label>
                <input type="file" accept="image/*" onChange={e => setLogoConfig(e.target.files?.[0] || null)} className="text-gray-400 text-sm" />
              </div>
              {mensajeConfig && <p className="text-green-400 text-sm">{mensajeConfig}</p>}
              <button type="submit" disabled={cargando}
                className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition disabled:opacity-50">
                {cargando ? 'Guardando...' : 'Guardar configuracion'}
              </button>
            </form>
          )}

          {mostrarForm && (
            <form onSubmit={agregarProducto} className="bg-gray-900 rounded-2xl p-6 border border-gray-800 space-y-4">
              <h2 className="text-white font-bold text-lg">Nuevo producto</h2>
              <input placeholder="Nombre *" value={nombre} onChange={e => setNombre(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-gray-500" required />
              <textarea placeholder="Descripcion" value={descripcion} onChange={e => setDescripcion(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-gray-500 resize-none" rows={3} />
              <input placeholder="Precio *" type="number" value={precio} onChange={e => setPrecio(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-gray-500" required />
              <input placeholder="Precio con descuento (opcional)" type="number" value={precioDescuento} onChange={e => setPrecioDescuento(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-gray-500" />
              <div className="grid grid-cols-2 gap-3">
                <select value={categoriaId} onChange={e => setCategoriaId(e.target.value)}
                  className="bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-gray-500">
                  <option value="">📂 Categoria</option>
                  {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
                <select value={marcaId} onChange={e => setMarcaId(e.target.value)}
                  className="bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-gray-500">
                  <option value="">🏷️ Marca</option>
                  {marcas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                </select>
              </div>
              <input placeholder="Colores (separados por coma)" value={colores} onChange={e => setColores(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-gray-500" />
              <input placeholder="Tallas (separadas por coma)" value={tallas} onChange={e => setTallas(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-gray-500" />
            <div>
                <label className="text-gray-400 text-sm block mb-2">Imágenes del producto (máx. 10)</label>
                {imagenes.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {imagenes.map((img, i) => (
                      <div key={i} className="relative">
                        <img src={URL.createObjectURL(img)} alt="preview" className="w-20 h-20 object-cover rounded-xl" />
                        <button type="button" onClick={() => setImagenes(imagenes.filter((_, idx) => idx !== i))}
                          className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">✕</button>
                      </div>
                    ))}
                  </div>
                )}
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-700 rounded-xl cursor-pointer hover:border-gray-500 transition">
                  <span className="text-gray-400 text-2xl">📷</span>
                  <span className="text-gray-500 text-xs mt-1">{imagenes.length > 0 ? '+ Agregar más imágenes' : 'Toca para subir imágenes'}</span>
                  <input type="file" accept="image/*" multiple onChange={e => {
                    const nuevas = Array.from(e.target.files || [])
                    setImagenes([...imagenes, ...nuevas])
                  }} className="hidden" />
                </label>
              </div>
              <button type="submit" disabled={cargando}
                className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition disabled:opacity-50">
                {cargando ? 'Guardando...' : 'Guardar producto'}
              </button>
            </form>
          )}

          {mostrarListaProductos && (
            <div>
              <h2 className="text-white font-bold text-lg mb-4">Mis productos ({productos.length})</h2>
              {productos.length === 0 ? (
                <p className="text-gray-500 text-center py-12">No tienes productos aun</p>
              ) : (
                <div className="space-y-3">
                  {productos.map(p => (
                    <div key={p.id} className="bg-gray-900 rounded-2xl border border-gray-800 p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                      {p.imagen ? (
                        <img src={p.imagen} alt={p.nombre} className="w-16 h-16 object-cover rounded-xl flex-shrink-0" />
                      ) : (
                        <div className="w-16 h-16 bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0">
                          <span className="text-2xl">📦</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold">{p.nombre}</p>
                        <p className="text-gray-400 text-sm">
                          {p.precio_descuento ? (
                            <>
                              <span className="line-through text-gray-600 mr-2">{Number(p.precio).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</span>
                              <span className="text-green-400">{Number(p.precio_descuento).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })}</span>
                            </>
                          ) : (
                            Number(p.precio).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })
                          )}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {p.categoria_nombre && <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full">📂 {p.categoria_nombre}</span>}
                          {p.marca_nombre && <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full">🏷️ {p.marca_nombre}</span>}
                          {p.colores && <span className="text-gray-500 text-xs">Colores: {p.colores}</span>}
                          {p.tallas && <span className="text-gray-500 text-xs">Tallas: {p.tallas}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => iniciarEdicion(p)}
                          className="text-blue-400 hover:text-blue-300 text-sm border border-blue-900 px-3 py-1.5 rounded-lg transition">Editar</button>
                        <button onClick={() => eliminar(p.id)}
                          className="text-red-400 hover:text-red-300 text-sm border border-red-900 px-3 py-1.5 rounded-lg transition">Eliminar</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}