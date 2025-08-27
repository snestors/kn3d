'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils'
import { useToast } from '@/components/ui/toast'
import { useSession } from 'next-auth/react'
import Header from '@/components/layout/header'

interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: string
  stock: number
  images: string[]
  category: {
    name: string
    slug: string
  }
  material?: string
  color?: string
  brand?: string
  diameter?: string
  printTemp?: string
  bedTemp?: string
  weight?: number
  dimensions?: any
}

export default function ProductPage() {
  const params = useParams()
  const { showToast } = useToast()
  const { data: session } = useSession()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [addingToCart, setAddingToCart] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    if (params.slug) {
      fetchProduct(params.slug as string)
    }
  }, [params.slug])

  const fetchProduct = async (slug: string) => {
    try {
      const response = await fetch(`/api/products/${slug}`)
      if (response.ok) {
        const data = await response.json()
        setProduct(data)
      } else {
        console.error('Product not found')
      }
    } catch (error) {
      console.error('Error fetching product:', error)
    } finally {
      setLoading(false)
    }
  }

  const addToCart = async () => {
    if (!product) return

    if (!session) {
      showToast('Debes iniciar sesión para agregar productos al carrito', 'warning')
      return
    }

    setAddingToCart(true)

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          quantity,
        }),
      })

      if (response.ok) {
        showToast(`${product.name} agregado al carrito (${quantity} unidades)`, 'success')
      } else {
        const errorData = await response.json()
        showToast(errorData.error || 'Error al agregar al carrito', 'error')
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      showToast('Error de conexión. Inténtalo de nuevo.', 'error')
    } finally {
      setAddingToCart(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Cargando producto...</div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-gray-600 mb-4">Producto no encontrado</div>
          <Link href="/products" className="text-blue-600 hover:underline">
            Volver al catálogo
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm">
          <Link href="/" className="text-gray-500 hover:text-blue-600">
            Inicio
          </Link>
          <span className="mx-2 text-gray-300">/</span>
          <Link href="/products" className="text-gray-500 hover:text-blue-600">
            Productos
          </Link>
          <span className="mx-2 text-gray-300">/</span>
          <Link href={`/categories/${product.category.slug}`} className="text-gray-500 hover:text-blue-600">
            {product.category.name}
          </Link>
          <span className="mx-2 text-gray-300">/</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Galería de imágenes */}
          <div>
            {/* Imagen principal */}
            <div className="aspect-square bg-gray-200 rounded-lg mb-4 overflow-hidden">
              {product.images.length > 0 ? (
                <Image
                  src={product.images[selectedImage] || product.images[0]}
                  alt={product.name}
                  width={600}
                  height={600}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  📦 Sin imagen disponible
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      selectedImage === index ? 'border-blue-600' : 'border-gray-200'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Información del producto */}
          <div>
            <div className="text-sm text-blue-600 font-medium mb-2">
              {product.category.name}
            </div>
            
            <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
            
            <div className="text-3xl font-bold text-blue-600 mb-6">
              {formatPrice(product.price)}
            </div>

            {/* Tags del producto */}
            <div className="flex flex-wrap gap-2 mb-6">
              {product.material && (
                <span className="bg-blue-100 text-blue-800 px-3 py-1 text-sm rounded">
                  Material: {product.material}
                </span>
              )}
              {product.color && (
                <span className="bg-green-100 text-green-800 px-3 py-1 text-sm rounded">
                  Color: {product.color}
                </span>
              )}
              {product.brand && (
                <span className="bg-purple-100 text-purple-800 px-3 py-1 text-sm rounded">
                  Marca: {product.brand}
                </span>
              )}
              {product.diameter && (
                <span className="bg-orange-100 text-orange-800 px-3 py-1 text-sm rounded">
                  Diámetro: {product.diameter}
                </span>
              )}
            </div>

            {/* Descripción */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Descripción</h3>
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            </div>

            {/* Especificaciones técnicas */}
            {(product.printTemp || product.bedTemp || product.weight) && (
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Especificaciones</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {product.printTemp && (
                    <div>
                      <span className="text-gray-500">Temp. Impresión:</span>
                      <span className="ml-2 font-medium">{product.printTemp}</span>
                    </div>
                  )}
                  {product.bedTemp && (
                    <div>
                      <span className="text-gray-500">Temp. Cama:</span>
                      <span className="ml-2 font-medium">{product.bedTemp}</span>
                    </div>
                  )}
                  {product.weight && (
                    <div>
                      <span className="text-gray-500">Peso:</span>
                      <span className="ml-2 font-medium">{product.weight} kg</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Stock */}
            <div className="mb-6">
              {product.stock > 0 ? (
                <div className="text-green-600 font-medium">
                  ✓ En stock ({product.stock} disponibles)
                </div>
              ) : (
                <div className="text-red-600 font-medium">
                  ✗ Sin stock
                </div>
              )}
            </div>

            {/* Selector de cantidad y botón de compra */}
            {product.stock > 0 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Cantidad</label>
                  <select
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Array.from({ length: Math.min(product.stock, 10) }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={addToCart}
                    disabled={addingToCart}
                    className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {addingToCart ? (
                      <>⏳ Agregando...</>
                    ) : (
                      <>🛒 Agregar al carrito</>
                    )}
                  </button>
                  <Link
                    href="/cart"
                    className="bg-gray-200 text-gray-800 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors font-medium text-center"
                  >
                    Ver carrito
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}