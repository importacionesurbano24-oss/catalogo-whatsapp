'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

function formatearPrecio(precio: any) {
  return Number(precio).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 })
}

export default function ProductoDetalle() {
  const params = useParams()
  const slug = params.slug
  const id = params.id
  const [producto, setProducto] = useState<any>(null)
  const [tienda, setTienda] = useState<any>(null)
  const [colorSel, setColorSel] = useState('')
  const [tallaSel, setTallaSel] = useState('')
  const [agregado, setAgregado] = useState(false)
  const [imagenActiva, setImagenActiva] = useState('')
  const [imagenZoom, setImagenZoom] = useState('')
  // Cargar producto desde localStorage (instantáneo)
  useEffect(() => {
    const cached = localStorage.getItem('producto_detalle')
    if (cached) {
      try {
        const p = JSON.parse(cached)
        if (String(p.id) === String(id)) {
          setProducto(p)
        }
      } catch {}
    }
  }, [id])

  useEffect(() => {
    // Cargar tienda
    fetch(`https://catalogo-whatsapp-production.up.railway.app/api/tienda/${slug}`)
      .then(res => res.json())
      .then(data => {
        if (data.tienda) setTienda(data.tienda)
      })
      .catch(() => {})

    // Cargar producto individual (más rápido)
    fetch(`https://catalogo-whatsapp-production.up.railway.app/api/productos/detalle/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) setProducto(data)
      })
      .catch(() => {})
  }, [slug, id])

  function precioFinal() {
    return producto.precio_descuento || producto.precio
  }

  function comprarWhatsApp() {
    const numero = tienda?.whatsapp || '573028663986'
    const mensaje = `¡Hola! Me interesa este producto:\n\n• ${producto.nombre}\n${colorSel ? `Color: ${colorSel}\n` : ''}${tallaSel ? `Talla: ${tallaSel}\n` : ''}💰 Precio: ${formatearPrecio(precioFinal())}`
    const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`
    window.open(url, '_blank')
  }

  function agregarYVolver() {
    const carritoActual = JSON.parse(localStorage.getItem('carrito_' + slug) || '[]')
    carritoActual.push({
      ...producto,
      colorSeleccionado: colorSel,
      tallaSeleccionada: tallaSel
    })
    localStorage.setItem('carrito_' + slug, JSON.stringify(carritoActual))
    setAgregado(true)
    setTimeout(() => setAgregado(false), 1500)
  }

  if (!producto) return <div className="min-h-screen bg-black flex items-center justify-center text-white text-lg">Cargando producto...</div>

  return (
    <main className="min-h-screen bg-black">
      <nav className="bg-gray-950 border-b border-gray-800 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div>
          <h1 className="text-white text-lg font-bold tracking-wide">{tienda?.nombre}</h1>
          <p className="text-gray-500 text-xs">Catálogo oficial</p>
        </div>
        <a href={`/tienda/${slug}`} className="text-gray-400 hover:text-white text-sm transition">
          ← Volver al catálogo
        </a>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden aspect-square flex items-center justify-center">
              {producto.imagen ? (
                <img src={imagenActiva || producto.imagen} alt={producto.nombre} className="w-full h-full object-contain p-4 cursor-pointer" onClick={() => setImagenZoom(imagenActiva || producto.imagen)} />
              ) : (
                <span className="text-gray-600 text-8xl">📦</span>
              )}
            </div>
            {producto.imagenes && producto.imagenes.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto">
                {producto.imagenes.map((img: any) => (
                  <img
                    key={img.id}
                    src={img.imagen_url}
                    alt="producto"
                    onClick={() => setImagenActiva(img.imagen_url)}
                    className={`w-16 h-16 object-cover rounded-lg cursor-pointer border-2 flex-shrink-0 ${imagenActiva === img.imagen_url ? 'border-white' : 'border-gray-700'}`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="text-white text-2xl font-bold">{producto.nombre}</h2>
            {producto.referencia && <p className="text-gray-500 text-sm">SKU: {producto.referencia}</p>}

            {producto.categoria_nombre && (
              <span className="text-xs bg-gray-800 text-gray-300 px-3 py-1 rounded-full w-fit">📂 {producto.categoria_nombre}</span>
            )}

            {producto.marca_nombre && (
              <span className="text-xs bg-gray-800 text-gray-300 px-3 py-1 rounded-full w-fit">🏷️ {producto.marca_nombre}</span>
            )}

            {producto.descripcion && (
              <p className="text-gray-400 text-sm leading-relaxed">{producto.descripcion}</p>
            )}

            <div className="mt-2">
              {producto.precio_descuento ? (
                <div className="flex items-center gap-3">
                  <span className="line-through text-gray-500 text-lg">{formatearPrecio(producto.precio)}</span>
                  <span className="text-green-400 text-3xl font-bold">{formatearPrecio(producto.precio_descuento)}</span>
                </div>
              ) : (
                <span className="text-white text-3xl font-bold">{formatearPrecio(producto.precio)}</span>
              )}
            </div>

            {producto.colores && producto.colores.trim() !== '' && (
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Color</label>
                <select value={colorSel} onChange={e => setColorSel(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl p-3 text-sm focus:outline-none focus:border-gray-500">
                  <option value="">🎨 Elegir color</option>
                  {producto.colores.split(',').map((color: string, i: number) => (
                    <option key={i} value={color.trim()}>{color.trim()}</option>
                  ))}
                </select>
              </div>
            )}

            {producto.tallas && producto.tallas.trim() !== '' && (
              <div>
                <label className="text-gray-400 text-sm mb-1 block">Talla</label>
                <select value={tallaSel} onChange={e => setTallaSel(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl p-3 text-sm focus:outline-none focus:border-gray-500">
                  <option value="">📏 Elegir talla</option>
                  {producto.tallas.split(',').map((talla: string, i: number) => (
                    <option key={i} value={talla.trim()}>{talla.trim()}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-col gap-3 mt-4">
              <button
                onClick={agregarYVolver}
                className={`w-full font-bold py-3 rounded-xl transition-all duration-300 text-sm ${
                  agregado
                    ? 'bg-green-500 text-white'
                    : 'bg-white hover:bg-gray-200 text-black'
                }`}
              >
                {agregado ? '✅ Agregado al carrito!' : '🛒 Agregar al carrito'}
              </button>
              <button
                onClick={comprarWhatsApp}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition text-sm flex items-center justify-center gap-2"
              >
                💬 Comprar por WhatsApp
              </button>
              <a href={`/tienda/${slug}`}
                className="w-full text-center border border-gray-700 text-gray-400 hover:text-white font-bold py-3 rounded-xl transition text-sm block">
                ← Volver al catálogo
              </a>
            </div>
          </div>
        </div>
      </div>
      {imagenZoom && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4" onClick={() => setImagenZoom('')}>
          <button className="absolute top-4 right-4 text-white text-3xl" onClick={() => setImagenZoom('')}>✕</button>
          <img src={imagenZoom} alt="zoom" className="max-w-full max-h-full object-contain rounded-xl" />
        </div>
      )}
    </main>
  )
}