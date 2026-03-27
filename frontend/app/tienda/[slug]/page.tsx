'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

function formatearPrecio(precio: any) {
  return Number(precio).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })
}

function ProductoCard({ producto, onAgregar, slug }: any) {
  const [colorSel, setColorSel] = useState('')
  const [tallaSel, setTallaSel] = useState('')
  const [agregado, setAgregado] = useState(false)

  function handleAgregar() {
    onAgregar(producto, colorSel, tallaSel)
    setAgregado(true)
    setTimeout(() => setAgregado(false), 1500)
  }

  return (
    <div className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 hover:border-gray-600 transition-all duration-300 flex flex-col">
      <a href={`/tienda/${slug}/producto/${producto.id}`} onClick={() => localStorage.setItem('producto_detalle', JSON.stringify(producto))} className="relative w-full aspect-square bg-gray-800 overflow-hidden block cursor-pointer">
        {producto.imagen ? (
          <img src={producto.imagen} alt={producto.nombre} className="w-full h-full object-contain p-2 transition-transform duration-300 hover:scale-110" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-600 text-6xl">📦</span>
          </div>
        )}
      </a>
      <div className="p-4 flex flex-col flex-1">
        <h2 className="text-white text-base font-semibold leading-tight">{producto.nombre}</h2>
        {producto.descripcion && (
          <p className="text-gray-500 text-sm mt-1 line-clamp-2">{producto.descripcion}</p>
        )}
        
        <div className="mt-auto pt-4">
          <p className="text-white font-bold text-xl">
            {producto.precio_descuento ? (
              <>
                <span className="line-through text-gray-500 text-sm mr-2">{formatearPrecio(producto.precio)}</span>
                <span className="text-green-400">{formatearPrecio(producto.precio_descuento)}</span>
              </>
            ) : (
              formatearPrecio(producto.precio)
            )}
          </p>
          <button
            onClick={handleAgregar}
            className={`mt-2 w-full font-bold py-2.5 rounded-xl transition-all duration-300 text-sm ${
              agregado ? 'bg-green-500 text-white' : 'bg-white hover:bg-gray-200 text-black'
            }`}
          >
            {agregado ? '✅ Agregado!' : '🛒 Agregar al carrito'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TiendaPage() {
  const params = useParams()
  const slug = params.slug
  const [tienda, setTienda] = useState<any>(null)
  const [productos, setProductos] = useState<any[]>([])
  const [carrito, setCarrito] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('carrito_' + slug)
      return saved ? JSON.parse(saved) : []
    }
    return []
  })
  const [mostrarCarrito, setMostrarCarrito] = useState(false)

  useEffect(() => {
    fetch(`https://catalogo-whatsapp-production.up.railway.app/api/tienda/${slug}`)
      .then(res => res.json())
      .then(data => {
        if (data.tienda) {
          setTienda(data.tienda)
          setProductos(data.productos || [])
        } else {
          setTienda({ error: true })
        }
      })
      .catch(() => setTienda({ error: true }))
  }, [slug])

  function agregarAlCarrito(producto: any, color: string, talla: string) {
    const nuevo = [...carrito, { ...producto, colorSeleccionado: color, tallaSeleccionada: talla }]
    setCarrito(nuevo)
    localStorage.setItem('carrito_' + slug, JSON.stringify(nuevo))
  }

  function eliminarDelCarrito(index: number) {
    const nuevo = carrito.filter((_, i) => i !== index)
    setCarrito(nuevo)
    localStorage.setItem('carrito_' + slug, JSON.stringify(nuevo))
  }
  function totalCarrito() {
    return carrito.reduce((sum, p) => sum + Number(p.precio_descuento || p.precio), 0)
  }

  function comprarWhatsApp() {
    const numero = tienda?.whatsapp || '573028663986'
    const items = carrito.map(p =>
      `• ${p.nombre} | Color: ${p.colorSeleccionado || 'N/A'} | Talla: ${p.tallaSeleccionada || 'N/A'} | ${formatearPrecio(p.precio_descuento || p.precio)}`
    ).join('\n')
    const total = formatearPrecio(totalCarrito())
    const mensaje = `¡Hola! Quiero comprar:\n\n${items}\n\n💰 Total: ${total}`
    const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`
    window.open(url, '_blank')
  }

  if (!tienda) return <div className="min-h-screen bg-black flex items-center justify-center text-white text-lg">Cargando tienda...</div>
  if (tienda.error) return <div className="min-h-screen bg-black flex items-center justify-center text-white text-lg">Tienda no encontrada</div>

  return (
    <main className="min-h-screen bg-black">
      <nav className="bg-gray-950 border-b border-gray-800 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div>
          <h1 className="text-white text-lg font-bold tracking-wide">{tienda.nombre}</h1>
          <p className="text-gray-500 text-xs">Catálogo oficial</p>
        </div>
        <button
          onClick={() => setMostrarCarrito(!mostrarCarrito)}
          className="relative bg-white text-black font-bold px-4 py-2 rounded-xl flex items-center gap-2 text-sm hover:bg-gray-200 transition"
        >
          🛒 Carrito
          {carrito.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {carrito.length}
            </span>
          )}
        </button>
      </nav>

      {mostrarCarrito && (
        <div className="bg-gray-950 border-b border-gray-800 px-6 py-5">
          {carrito.length === 0 ? (
            <p className="text-gray-500 text-sm">Tu carrito está vacío</p>
          ) : (
            <>
              <h2 className="text-white font-bold text-lg mb-3">Tu pedido ({carrito.length})</h2>
              <div className="space-y-2 mb-4">
                {carrito.map((p, i) => (
                  <div key={i} className="flex justify-between items-center bg-gray-900 rounded-lg px-4 py-2 border border-gray-800">
                    <div>
                      <p className="text-white text-sm font-medium">{p.nombre}</p>
                      <p className="text-gray-500 text-xs">
                        {p.colorSeleccionado && `Color: ${p.colorSeleccionado}`}
                        {p.colorSeleccionado && p.tallaSeleccionada && ' | '}
                        {p.tallaSeleccionada && `Talla: ${p.tallaSeleccionada}`}
                        {' — '}{formatearPrecio(p.precio_descuento || p.precio)}
                      </p>
                    </div>
                    <button onClick={() => eliminarDelCarrito(i)} className="text-red-400 hover:text-red-300 text-sm ml-3">✕</button>
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-center">
                <p className="text-white font-bold text-lg">Total: {formatearPrecio(totalCarrito())}</p>
                <button onClick={comprarWhatsApp}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-2.5 rounded-xl transition flex items-center gap-2 text-sm">
                  💬 Enviar pedido por WhatsApp
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="px-6 py-8">
        {productos.length === 0 ? (
          <p className="text-gray-500 text-center py-20">Esta tienda aún no tiene productos</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {productos.map(producto => (
              <ProductoCard key={producto.id} producto={producto} onAgregar={agregarAlCarrito} slug={slug} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}