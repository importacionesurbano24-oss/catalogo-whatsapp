'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

function formatearPrecio(precio: any) {
  return Number(precio).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })
}

function ProductoCard({ producto, slug, onAgregar }: { producto: any; slug: string; onAgregar: any }) {
  const [colorSel, setColorSel] = useState('')
  const [tallaSel, setTallaSel] = useState('')

  function verDetalle() {
    localStorage.setItem('producto_detalle', JSON.stringify(producto))
    window.location.href = `/tienda/${slug}/producto/${producto.id}`
  }

  return (
    <div className="bg-gray-900 rounded-2xl overflow-hidden hover:scale-105 transition-transform duration-300 border border-gray-700">
      <div onClick={verDetalle} className="cursor-pointer">
        {producto.imagen ? (
          <img src={producto.imagen} alt={producto.nombre} className="w-full h-56 object-cover" />
        ) : (
          <div className="h-56 bg-gray-800 flex items-center justify-center">
            <span className="text-gray-600 text-5xl">📦</span>
          </div>
        )}
      </div>
      <div className="p-5">
        <h2 onClick={verDetalle} className="text-white text-lg font-bold cursor-pointer hover:text-gray-300 transition">{producto.nombre}</h2>
        {producto.descripcion && <p className="text-gray-400 text-sm mt-1 line-clamp-2">{producto.descripcion}</p>}
        
        {producto.categoria_nombre && (
          <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full mt-2 inline-block">📂 {producto.categoria_nombre}</span>
        )}

        {producto.colores && producto.colores.trim() !== '' && (
          <select value={colorSel} onChange={e => setColorSel(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg p-2 mt-3 text-sm">
            <option value="">🎨 Color</option>
            {producto.colores.split(',').map((color: string, i: number) => (
              <option key={i} value={color.trim()}>{color.trim()}</option>
            ))}
          </select>
        )}
        {producto.tallas && producto.tallas.trim() !== '' && (
          <select value={tallaSel} onChange={e => setTallaSel(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg p-2 mt-2 text-sm">
            <option value="">📏 Talla</option>
            {producto.tallas.split(',').map((talla: string, i: number) => (
              <option key={i} value={talla.trim()}>{talla.trim()}</option>
            ))}
          </select>
        )}

        <div className="mt-3">
          {producto.precio_descuento ? (
            <div className="flex items-center gap-2">
              <span className="line-through text-gray-500 text-sm">{formatearPrecio(producto.precio)}</span>
              <span className="text-green-400 font-bold text-xl">{formatearPrecio(producto.precio_descuento)}</span>
            </div>
          ) : (
            <p className="text-white font-bold text-xl">{formatearPrecio(producto.precio)}</p>
          )}
        </div>

        <button
          onClick={() => onAgregar(producto, colorSel, tallaSel)}
          className="mt-3 w-full bg-white hover:bg-gray-200 text-black font-bold py-2 rounded-lg transition text-sm"
        >
          🛒 Agregar al carrito
        </button>
      </div>
    </div>
  )
}

export default function TiendaPublica() {
  const params = useParams()
  const slug = params.slug as string

  const [tienda, setTienda] = useState<any>(null)
  const [productos, setProductos] = useState<any[]>([])
  const [carrito, setCarrito] = useState<any[]>([])
  const [mostrarCarrito, setMostrarCarrito] = useState(false)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('')
  const [agregadoId, setAgregadoId] = useState<number | null>(null)

  useEffect(() => {
    if (!slug) return

    // Cargar carrito guardado
    const carritoGuardado = localStorage.getItem('carrito_' + slug)
    if (carritoGuardado) {
      try { setCarrito(JSON.parse(carritoGuardado)) } catch {}
    }

    // Cargar tienda por slug
    fetch(`https://catalogo-whatsapp-production.up.railway.app/api/tienda/${slug}`)
      .then(res => res.json())
      .then(data => {
        if (data.error || !data.tienda) {
          setError(true)
        } else {
          setTienda(data.tienda)
          setProductos(Array.isArray(data.productos) ? data.productos : [])
        }
        setCargando(false)
      })
      .catch(() => {
        setError(true)
        setCargando(false)
      })
  }, [slug])

  function agregarAlCarrito(producto: any, color: string, talla: string) {
    const nuevoCarrito = [...carrito, { ...producto, colorSeleccionado: color, tallaSeleccionada: talla }]
    setCarrito(nuevoCarrito)
    localStorage.setItem('carrito_' + slug, JSON.stringify(nuevoCarrito))
    setAgregadoId(producto.id)
    setTimeout(() => setAgregadoId(null), 1500)
  }

  function eliminarDelCarrito(index: number) {
    const nuevoCarrito = carrito.filter((_, i) => i !== index)
    setCarrito(nuevoCarrito)
    localStorage.setItem('carrito_' + slug, JSON.stringify(nuevoCarrito))
  }

  function comprarWhatsApp() {
    const numero = tienda?.whatsapp || '573028663986'
    const items = carrito.map(p => {
      const precio = p.precio_descuento || p.precio
      return `• ${p.nombre}${p.colorSeleccionado ? ` | Color: ${p.colorSeleccionado}` : ''}${p.tallaSeleccionada ? ` | Talla: ${p.tallaSeleccionada}` : ''} | ${formatearPrecio(precio)}`
    }).join('\n')
    const total = carrito.reduce((sum, p) => sum + Number(p.precio_descuento || p.precio), 0)
    const mensaje = `¡Hola ${tienda?.nombre || ''}! Quiero comprar:\n\n${items}\n\n💰 Total: ${formatearPrecio(total)}`
    const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`
    window.open(url, '_blank')
  }

  // Filtrar productos
  const productosFiltrados = productos.filter(p => {
    const coincideBusqueda = !busqueda || p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || (p.descripcion && p.descripcion.toLowerCase().includes(busqueda.toLowerCase()))
    const coincideCategoria = !categoriaFiltro || String(p.categoria_id) === categoriaFiltro
    return coincideBusqueda && coincideCategoria
  })

  // Obtener categorías únicas
  const categoriasUnicas = productos.reduce((acc: any[], p) => {
    if (p.categoria_id && p.categoria_nombre && !acc.find(c => c.id === p.categoria_id)) {
      acc.push({ id: p.categoria_id, nombre: p.categoria_nombre })
    }
    return acc
  }, [])

  if (cargando) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400">Cargando tienda...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <p className="text-6xl mb-4">🏪</p>
        <h1 className="text-white text-2xl font-bold mb-2">Tienda no encontrada</h1>
        <p className="text-gray-400">La tienda que buscas no existe o fue eliminada.</p>
      </div>
    </div>
  )

  const colorTienda = tienda?.color || '#ffffff'

  return (
    <main className="min-h-screen bg-black">
      {/* NAVBAR */}
      <nav className="bg-gray-950 border-b border-gray-800 px-4 md:px-8 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          {tienda?.logo && (
            <img src={tienda.logo} alt={tienda.nombre} className="w-10 h-10 rounded-full object-cover border border-gray-700" />
          )}
          <div>
            <h1 className="text-white text-lg font-bold tracking-wide">{tienda?.nombre}</h1>
            {tienda?.descripcion_tienda && <p className="text-gray-500 text-xs">{tienda.descripcion_tienda}</p>}
          </div>
        </div>
        <button
          onClick={() => setMostrarCarrito(!mostrarCarrito)}
          className="font-bold px-4 py-2 rounded-xl flex items-center gap-2 text-sm transition"
          style={{ backgroundColor: colorTienda, color: '#000' }}
        >
          🛒 {carrito.length}
        </button>
      </nav>

      {/* CARRITO */}
      {mostrarCarrito && (
        <div className="bg-gray-950 border-b border-gray-800 px-4 md:px-8 py-4">
          {carrito.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">Tu carrito está vacío</p>
          ) : (
            <>
              <h2 className="text-white font-bold mb-3">Tu pedido ({carrito.length}):</h2>
              <div className="space-y-2 mb-4">
                {carrito.map((p, i) => (
                  <div key={i} className="flex justify-between items-center bg-gray-900 rounded-lg px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{p.nombre}</p>
                      <p className="text-gray-500 text-xs">
                        {p.colorSeleccionado && `Color: ${p.colorSeleccionado}`}
                        {p.colorSeleccionado && p.tallaSeleccionada && ' | '}
                        {p.tallaSeleccionada && `Talla: ${p.tallaSeleccionada}`}
                        {' | '}{formatearPrecio(p.precio_descuento || p.precio)}
                      </p>
                    </div>
                    <button onClick={() => eliminarDelCarrito(i)} className="text-red-400 hover:text-red-300 text-xs ml-2">✕</button>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <p className="text-white font-bold">
                  Total: {formatearPrecio(carrito.reduce((sum, p) => sum + Number(p.precio_descuento || p.precio), 0))}
                </p>
                <button onClick={comprarWhatsApp}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-2.5 rounded-xl transition text-sm flex items-center gap-2">
                  💬 Enviar pedido por WhatsApp
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* BUSQUEDA Y FILTROS */}
      <div className="px-4 md:px-8 pt-6 pb-2">
        <div className="flex flex-col sm:flex-row gap-3 max-w-4xl mx-auto">
          <input
            type="text"
            placeholder="🔍 Buscar productos..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="flex-1 bg-gray-900 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-500"
          />
          {categoriasUnicas.length > 0 && (
            <select value={categoriaFiltro} onChange={e => setCategoriaFiltro(e.target.value)}
              className="bg-gray-900 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gray-500">
              <option value="">📂 Todas las categorías</option>
              {categoriasUnicas.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* CATALOGO */}
      <div className="px-4 md:px-8 py-6">
        {productosFiltrados.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">📦</p>
            <p className="text-gray-400">{busqueda || categoriaFiltro ? 'No se encontraron productos con esos filtros' : 'Esta tienda aún no tiene productos'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {productosFiltrados.map(producto => (
              <ProductoCard key={producto.id} producto={producto} slug={slug} onAgregar={agregarAlCarrito} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}