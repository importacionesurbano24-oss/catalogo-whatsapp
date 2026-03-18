'use client'
import { useState, useEffect } from 'react'

export default function SuperAdmin() {
  const [token, setToken] = useState('')
  const [adminInfo, setAdminInfo] = useState(null)
  const [stats, setStats] = useState<any>(null)
  const [tiendas, setTiendas] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const tokenGuardado = localStorage.getItem('token')
    const adminGuardado = localStorage.getItem('admin')
    if (tokenGuardado && adminGuardado) {
      const admin = JSON.parse(adminGuardado)
      if (admin.rol !== 'superadmin') {
        setError('No tienes permiso para ver esta página')
        setCargando(false)
        return
      }
      setToken(tokenGuardado)
      setAdminInfo(admin)
    } else {
      setError('Debes iniciar sesión primero')
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    if (token) {
      cargarDatos()
    }
  }, [token])

  async function cargarDatos() {
    try {
      const [statsRes, tiendasRes] = await Promise.all([
        fetch('http://localhost:3000/api/superadmin/estadisticas', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:3000/api/superadmin/tiendas', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      if (!statsRes.ok || !tiendasRes.ok) {
        setError('Error al cargar datos')
        setCargando(false)
        return
      }

      const statsData = await statsRes.json()
      const tiendasData = await tiendasRes.json()
      setStats(statsData)
      setTiendas(tiendasData)
      setCargando(false)
    } catch (err) {
      setError('Error de conexión con el servidor')
      setCargando(false)
    }
  }

  async function toggleTienda(id: number) {
    const res = await fetch(`http://localhost:3000/api/superadmin/tiendas/${id}/toggle`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (res.ok) {
      cargarDatos()
    }
  }

  function formatearFecha(fecha: string) {
    return new Date(fecha).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  if (error) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 text-center">
          <p className="text-red-400 text-lg mb-4">{error}</p>
          <a href="/admin" className="text-white underline hover:text-gray-300">Ir a iniciar sesión</a>
        </div>
      </main>
    )
  }

  if (cargando) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white text-lg">Cargando panel superadmin...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-white text-3xl font-bold">👑 Panel Superadmin</h1>
          <p className="text-gray-500 mt-1">Gestión de todas las tiendas</p>
        </div>
        <a href="/admin" className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm border border-gray-600">
          ← Volver al panel
        </a>
      </div>

      {/* ESTADÍSTICAS */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 text-center">
            <p className="text-gray-400 text-sm">Tiendas registradas</p>
            <p className="text-white text-3xl font-bold mt-1">{stats.tiendas}</p>
          </div>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 text-center">
            <p className="text-gray-400 text-sm">Total productos</p>
            <p className="text-white text-3xl font-bold mt-1">{stats.productos}</p>
          </div>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 text-center">
            <p className="text-gray-400 text-sm">Tiendas activas</p>
            <p className="text-green-400 text-3xl font-bold mt-1">{stats.activos}</p>
          </div>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 text-center">
            <p className="text-gray-400 text-sm">Tiendas bloqueadas</p>
            <p className="text-red-400 text-3xl font-bold mt-1">{stats.bloqueados}</p>
          </div>
        </div>
      )}

      {/* LISTA DE TIENDAS */}
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6">
        <h2 className="text-white text-xl font-bold mb-4">🏪 Todas las tiendas ({tiendas.length})</h2>

        {tiendas.length === 0 ? (
          <p className="text-gray-500">No hay tiendas registradas aún</p>
        ) : (
          <div className="space-y-3">
            {tiendas.map(tienda => (
              <div key={tienda.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-gray-800 rounded-xl p-4 border border-gray-700">
                <div className="mb-3 sm:mb-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-bold">{tienda.nombre}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${tienda.activo ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>
                      {tienda.activo ? 'Activa' : 'Bloqueada'}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
                      {tienda.plan}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">{tienda.email}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    📦 {tienda.total_productos} productos — Registrada: {formatearFecha(tienda.created_at)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`/tienda/${tienda.nombre.toLowerCase().replace(/ /g, '-')}`}
                    target="_blank"
                    className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm"
                  >
                    👁️ Ver tienda
                  </a>
                  <button
                    onClick={() => toggleTienda(tienda.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-bold ${
                      tienda.activo
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {tienda.activo ? '🚫 Bloquear' : '✅ Activar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}