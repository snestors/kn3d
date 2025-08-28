'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  CheckCircle,
  Package,
  MapPin,
  CreditCard,
  Calendar,
  ArrowLeft,
  Download
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
  paymentMethod: string
  customerName: string
  customerEmail: string
  customerPhone: string
  shippingAddress: any
  subtotal: number
  shippingCost: number
  tax: number
  total: number
  notes: string
  createdAt: string
  items: OrderItem[]
}

const orderStatusConfig = {
  PENDING: { label: 'Pendiente', color: 'text-yellow-600 bg-yellow-100' },
  CONFIRMED: { label: 'Confirmado', color: 'text-blue-600 bg-blue-100' },
  PROCESSING: { label: 'Procesando', color: 'text-purple-600 bg-purple-100' },
  PRODUCTION: { label: 'En Producción', color: 'text-orange-600 bg-orange-100' },
  SHIPPED: { label: 'Enviado', color: 'text-indigo-600 bg-indigo-100' },
  DELIVERED: { label: 'Entregado', color: 'text-green-600 bg-green-100' },
  CANCELLED: { label: 'Cancelado', color: 'text-red-600 bg-red-100' },
}

const paymentStatusConfig = {
  PENDING: { label: 'Pendiente', color: 'text-yellow-600 bg-yellow-100' },
  COMPLETED: { label: 'Completado', color: 'text-green-600 bg-green-100' },
  FAILED: { label: 'Fallido', color: 'text-red-600 bg-red-100' },
}

interface OrderDetailProps {
  params: Promise<{
    id: string
  }>
}

export default function OrderDetail({ params }: OrderDetailProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const isSuccess = searchParams?.get('success') === 'true'

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    
    const init = async () => {
      const { id } = await params
      fetchOrder(id)
    }
    init()
  }, [session, status, router, params])

  const fetchOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`)
      if (response.ok) {
        const data = await response.json()
        setOrder(data)
      } else if (response.status === 404) {
        router.push('/profile/orders')
      } else {
        console.error('Error fetching order')
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatAddress = (address: any) => {
    if (!address) return 'No especificada'
    return `${address.street}, ${address.city}, ${address.state} ${address.zipCode}, ${address.country}`
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Cargando pedido...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!session || !order) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900">Pedido no encontrado</h3>
            <p className="mt-1 text-sm text-gray-500">
              El pedido que buscas no existe o no tienes permisos para verlo.
            </p>
            <div className="mt-6">
              <Link
                href="/profile/orders"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Ver mis pedidos
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const statusConfig = orderStatusConfig[order.status as keyof typeof orderStatusConfig]
  const paymentConfig = paymentStatusConfig[order.paymentStatus as keyof typeof paymentStatusConfig]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header con confirmación de éxito si es necesario */}
        {isSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-green-800">
                  ¡Pedido realizado exitosamente!
                </h3>
                <p className="text-sm text-green-600">
                  Tu pedido #{order.orderNumber} ha sido creado. Te enviaremos actualizaciones por email.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navegación */}
        <div className="mb-6">
          <Link
            href="/profile/orders"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver a mis pedidos
          </Link>
        </div>

        {/* Título */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Pedido #{order.orderNumber}</h1>
          <p className="text-sm text-gray-500">
            Realizado el {formatDate(order.createdAt)}
          </p>
        </div>

        {/* Estados */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Estado del Pedido</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">Estado del Pago</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentConfig.color}`}>
                {paymentConfig.label}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Detalles principales */}
          <div className="lg:col-span-2 space-y-6">
            {/* Productos */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Productos
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                      <div className="flex-shrink-0">
                        {item.product.images.length > 0 ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="h-16 w-16 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="h-16 w-16 rounded-lg bg-gray-200 flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/products/${item.product.slug}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                          {item.product.name}
                        </Link>
                        <p className="text-sm text-gray-500">
                          Cantidad: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          S/ {item.price.toFixed(2)} c/u
                        </p>
                        <p className="text-sm text-gray-500">
                          Total: S/ {(item.quantity * item.price).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Dirección de envío */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Dirección de Envío
                </h3>
              </div>
              <div className="p-6">
                <div className="text-sm text-gray-900">
                  <p className="font-medium">{order.customerName}</p>
                  <p className="mt-1">{formatAddress(order.shippingAddress)}</p>
                  <p className="mt-1">{order.customerPhone}</p>
                  <p className="mt-1">{order.customerEmail}</p>
                </div>
              </div>
            </div>

            {/* Notas del pedido */}
            {order.notes && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Notas del Pedido</h3>
                </div>
                <div className="p-6">
                  <p className="text-sm text-gray-700">{order.notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Resumen de pago */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Resumen de Pago
                </h3>
              </div>
              <div className="p-6">
                <dl className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <dt className="text-gray-600">Subtotal</dt>
                    <dd className="text-gray-900">S/ {order.subtotal.toFixed(2)}</dd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <dt className="text-gray-600">Envío</dt>
                    <dd className="text-gray-900">S/ {order.shippingCost.toFixed(2)}</dd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <dt className="text-gray-600">IGV (18%)</dt>
                    <dd className="text-gray-900">S/ {order.tax.toFixed(2)}</dd>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <dt className="text-gray-900">Total</dt>
                      <dd className="text-gray-900">S/ {order.total.toFixed(2)}</dd>
                    </div>
                  </div>
                </dl>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Método de pago:</span> {order.paymentMethod}
                  </p>
                </div>
              </div>
            </div>

            {/* Información adicional */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Información
                </h3>
              </div>
              <div className="p-6">
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="font-medium text-gray-600">Número de pedido</dt>
                    <dd className="text-gray-900 font-mono">{order.orderNumber}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-600">Fecha de pedido</dt>
                    <dd className="text-gray-900">{formatDate(order.createdAt)}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Acciones */}
            <div className="space-y-3">
              <Link
                href="/products"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-center block"
              >
                Seguir Comprando
              </Link>
              <Link
                href="/profile/orders"
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors text-center block"
              >
                Ver Todos mis Pedidos
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}