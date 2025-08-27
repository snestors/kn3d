'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils'
import { useSession } from 'next-auth/react'
import Header from '@/components/layout/header'

interface CartItem {
  id: string
  quantity: number
  product: {
    id: string
    name: string
    slug: string
    price: string
    images: string[]
    stock: number
    category: {
      name: string
    }
  }
}

interface Cart {
  items: CartItem[]
  total: number
  itemCount: number
}

export default function CartPage() {
  const { data: session, status } = useSession()
  const [cart, setCart] = useState<Cart>({ items: [], total: 0, itemCount: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    if (session) {
      fetchCart()
    } else {
      setLoading(false)
    }
  }, [session, status])

  const fetchCart = async () => {
    try {
      const response = await fetch('/api/cart')
      if (response.ok) {
        const data = await response.json()
        setCart(data)
      }
    } catch (error) {
      console.error('Error fetching cart:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity }),
      })

      if (response.ok) {
        fetchCart()
      }
    } catch (error) {
      console.error('Error updating quantity:', error)
    }
  }

  const removeItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchCart()
      }
    } catch (error) {
      console.error('Error removing item:', error)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Cargando carrito...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />

        <div className="container mx-auto px-4 py-16 text-center">
          <div className="text-xl text-gray-600 mb-4">
            Debes iniciar sesión para ver tu carrito
          </div>
          <Link
            href="/auth/signin"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Iniciar Sesión
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Carrito de Compras</h1>

        {cart.items.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-gray-500 mb-4 text-xl">
              🛒 Tu carrito está vacío
            </div>
            <p className="text-gray-600 mb-6">
              Explora nuestro catálogo y encuentra los mejores productos para impresión 3D
            </p>
            <Link
              href="/products"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ver Productos
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Items del carrito */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm">
                {cart.items.map((item) => (
                  <div key={item.id} className="p-6 border-b border-gray-200 last:border-b-0">
                    <div className="flex items-center gap-4">
                      {/* Imagen del producto */}
                      <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        {item.product.images.length > 0 ? (
                          <Image
                            src={item.product.images[0]}
                            alt={item.product.name}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-500 text-xs">
                            📦
                          </div>
                        )}
                      </div>

                      {/* Información del producto */}
                      <div className="flex-1">
                        <div className="text-sm text-gray-500 mb-1">
                          {item.product.category.name}
                        </div>
                        <Link
                          href={`/products/${item.product.slug}`}
                          className="font-semibold hover:text-blue-600"
                        >
                          {item.product.name}
                        </Link>
                        <div className="text-lg font-bold text-blue-600 mt-1">
                          {formatPrice(item.product.price)}
                        </div>
                      </div>

                      {/* Controles de cantidad */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-sm font-medium"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, Math.min(item.product.stock, item.quantity + 1))}
                            className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-sm font-medium"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 hover:text-red-700 p-2"
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumen del pedido */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                <h2 className="text-xl font-bold mb-4">Resumen del pedido</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span>Subtotal ({cart.itemCount} items)</span>
                    <span>{formatPrice(cart.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Envío</span>
                    <span>
                      {cart.total >= 200 ? (
                        <span className="text-green-600">Gratis</span>
                      ) : (
                        formatPrice(15)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>IGV (18%)</span>
                    <span>{formatPrice(cart.total * 0.18)}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-blue-600">
                        {formatPrice(cart.total + (cart.total >= 200 ? 0 : 15) + (cart.total * 0.18))}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Link
                    href="/checkout"
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors text-center block font-medium"
                  >
                    Proceder al Checkout
                  </Link>
                  <Link
                    href="/products"
                    className="w-full bg-gray-200 text-gray-800 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors text-center block"
                  >
                    Seguir Comprando
                  </Link>
                </div>

                {cart.total < 200 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                    💡 Añade {formatPrice(200 - cart.total)} más para obtener envío gratis
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}