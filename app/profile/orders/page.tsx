'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/header'
import { 
  Package,
  Eye,
  Calendar,
  DollarSign,
  ShoppingBag
} from 'lucide-react'

interface OrderItem {
  id: string
  quantity: number
  price: number
  product: {
    name: string
    slug: string
    images: string[]
  }
}

interface Order {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  total: number
  createdAt: string
  items: OrderItem[]
}

const orderStatusConfig = {
  PENDING: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  CONFIRMED: { label: 'Confirmado', color: 'bg-blue-100 text-blue-800' },
  PROCESSING: { label: 'Procesando', color: 'bg-purple-100 text-purple-800' },
  PRODUCTION: { label: 'En Producción', color: 'bg-orange-100 text-orange-800' },
  SHIPPED: { label: 'Enviado', color: 'bg-indigo-100 text-indigo-800' },
  DELIVERED: { label: 'Entregado', color: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Cancelado', color: 'bg-red-100 text-red-800' },
}

export default function OrderHistory() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin?callbackUrl=/profile/orders')
      return
    }
    fetchOrders()
  }, [session, status, router])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders')
      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Cargando pedidos...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null // Se redirige automáticamente
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Mis Pedidos</h1>
          <p className="mt-2 text-gray-600">
            Aquí puedes ver el historial de todos tus pedidos
          </p>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No tienes pedidos</h3>
            <p className="mt-1 text-sm text-gray-500">
              Cuando realices tu primer pedido, aparecerá aquí.
            </p>
            <div className="mt-6">
              <Link
                href="/products"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Ir a productos
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const statusConfig = orderStatusConfig[order.status as keyof typeof orderStatusConfig]
              
              return (
                <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  {/* Order Header */}
                  <div className="p-6 bg-gray-50 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            Pedido #{order.orderNumber}
                          </h3>
                          <div className="flex items-center mt-1 text-sm text-gray-500">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(order.createdAt)}
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                      </div>
                      <div className="mt-4 sm:mt-0 flex items-center space-x-4">
                        <div className="flex items-center text-lg font-bold text-gray-900">
                          <DollarSign className="h-5 w-5 mr-1" />
                          S/ {order.total.toFixed(2)}
                        </div>
                        <Link
                          href={`/orders/${order.id}`}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalles
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {order.items.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0">
                            {item.product.images.length > 0 ? (
                              <img
                                src={item.product.images[0]}
                                alt={item.product.name}
                                className="h-12 w-12 rounded-md object-cover"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-md bg-gray-200 flex items-center justify-center">
                                <Package className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {item.product.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              Cantidad: {item.quantity}
                            </p>
                          </div>
                        </div>
                      ))}
                      
                      {order.items.length > 3 && (
                        <div className="flex items-center justify-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-500">
                            +{order.items.length - 3} productos más
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
                      <div className="text-sm text-gray-500">
                        Total de {order.items.length} {order.items.length === 1 ? 'producto' : 'productos'}
                      </div>
                      <div className="flex space-x-3">
                        {(order.status === 'DELIVERED' || order.status === 'CANCELLED') && (
                          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                            Volver a Comprar
                          </button>
                        )}
                        {order.status === 'PENDING' && (
                          <button className="text-sm text-orange-600 hover:text-orange-800 font-medium">
                            Completar Pago
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Call to Action */}
        {orders.length > 0 && (
          <div className="mt-8 text-center">
            <Link
              href="/products"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Seguir Comprando
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}