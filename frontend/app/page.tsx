'use client'
import { useEffect, useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || ''

function ProductoCard({ producto, onAgregar }) {
  const [colorSel, setColorSel] = useState('')
  const [tallaSel, setTallaSel] = useState('')

  return (
    <div className="bg-gray-900 rounded-2xl overflow-hidden hover:scale-105 transition-transform duration-300 border border-gray-700">
      {producto.imagen ? (
        <img
          src={`${API}${producto.imagen}`}
          alt={producto.nombre}
          className="w-full h-56 object-cover"
        />
      ) : (
        <div className="h-56 bg-gray-800 flex items-center justify-center">
          <span className="text-gray-600 text-5xl">📦</span>
        </div>
      )}
      <div className="p-5">
        <h2 className="text-white text-lg font-bold">{producto.nombre}</h2>
        <p className="text-gray-400 text-sm mt-1">{producto.descripcion}</p>
        {producto.colores && (
          <select value={colorSel} onChange={e => setColorSel(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg p-2 mt-3 text-sm">
            <option value="">🎨 Color</option>
            {producto.colores.split(',').map((color, i) => (
              <option key={i} value={color.trim()}>{color.trim()}</option>
            ))}
          </select>
        )}
        {producto.tallas && (
          <select value={tallaSel} onChange={e => setTallaSel(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg p-2 mt-2 text-sm">
            <option value="">📏 Talla</option>
            {producto.tallas.split(',').map((talla, i) => (
              <option key={i} value={talla.trim()}>{talla.trim()}</option>
            ))}
          </select>
        )}
        <p className="text-white font-bold text-xl mt-3">${producto.precio}</p>
        <button
          onClick={() => onAgregar(producto, colorSel, tallaSel)}
          className="mt-3 w-full bg-white hover:bg-gray-200 text-black font-bold py-2 rounded-lg transition"
        >
          🛒 Agregar al carrito
        </button>
      </div>
    </div>
  )
}

export default function Home() {
  const [productos, setProductos] = useState([])
  const [carrito, setCarrito] = useState([])
  const [mostrarCarrito, setMostrarCarrito] = useState(false)

  useEffect(() => {
    fetch(`${API}/api/productos`)
      .then(res => res.json())
      .then(data => setProductos(data))
  }, [])

  function agregarAlCarrito(producto, color, talla) {
    setCarrito([...carrito, { ...producto, colorSeleccionado: color, tallaSeleccionada: talla }])
  }

  function comprarWhatsApp() {
    const numero = '573028663986'
    const items = carrito.map(p =>
      `- ${p.nombre} | Color: ${p.colorSeleccionado || 'N/A'} | Talla: ${p.tallaSeleccionada || 'N/A'} | $${p.precio}`
    ).join('\n')
    const mensaje = `Hola, quiero comprar:\n${items}`
    const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`
    window.open(url, '_blank')
  }

  return (
    <main className="min-h-screen bg-black">
      {/* NAVBAR */}
      <nav className="bg-gray-900 border-b border-gray-800 px-8 py-4 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h1 className="text-white text-xl font-bold">IMPORTACIONES URBANO</h1>
          <p className="text-gray-500 text-xs">De todo un poco</p>
        </div>
        <button
          onClick={() => setMostrarCarrito(!mostrarCarrito)}
          className="bg-white text-black font-bold px-4 py-2 rounded-lg flex items-center gap-2"
        >
          🛒 {carrito.length}
        </button>
      </nav>

      {/* CARRITO */}
      {mostrarCarrito && carrito.length > 0 && (
        <div className="bg-gray-900 border-b border-gray-800 px-8 py-4">
          <h2 className="text-white font-bold mb-3">Tu pedido:</h2>
          {carrito.map((p, i) => (
            <p key={i} className="text-gray-400 text-sm">
              • {p.nombre} | {p.colorSeleccionado} | {p.tallaSeleccionada} | ${p.precio}
            </p>
          ))}
          <button
            onClick={comprarWhatsApp}
            className="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-2 rounded-lg"
          >
            💬 Enviar pedido por WhatsApp
          </button>
        </div>
      )}

      {/* CATALOGO */}
      <div className="px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {productos.map(producto => (
            <ProductoCard key={producto.id} producto={producto} onAgregar={agregarAlCarrito} />
          ))}
        </div>
      </div>
    </main>
  )
}