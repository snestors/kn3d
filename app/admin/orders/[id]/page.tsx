'use client'

import AdminHeader from '@/components/admin/header'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft,
  Save,
  Package,
  User,
  MapPin,
  CreditCard,
  FileText,
  Calendar,
  DollarSign
} from 'lucide-react'

interface OrderItem {
  id: string
  quantity: number
  price: number
  product: {
    id: string
    name: string
    slug: string
    images: string[]
    sku: string
  }
}

interface OrderDetail {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string | null
  status: string
  paymentStatus: string
  paymentMethod: string | null
  paymentId: string | null
  shippingAddress: any
  billingAddress: any | null
  subtotal: number
  shippingCost: number
  tax: number
  discount: number
  total: number
  notes: string | null
  internalNotes: string | null
  createdAt: string
  updatedAt: string
  shippedAt: string | null
  deliveredAt: string | null
  user: {
    id: string
    name: string
    email: string
    phone: string | null
  }
  items: OrderItem[]
}

const orderStatusOptions = [
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'CONFIRMED', label: 'Confirmado' },
  { value: 'PROCESSING', label: 'Procesando' },
  { value: 'PRODUCTION', label: 'En Producción' },
  { value: 'SHIPPED', label: 'Enviado' },
  { value: 'DELIVERED', label: 'Entregado' },
  { value: 'CANCELLED', label: 'Cancelado' },
  { value: 'RETURNED', label: 'Devuelto' }
]

const paymentStatusOptions = [
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'COMPLETED', label: 'Completado' },
  { value: 'FAILED', label: 'Fallido' },
  { value: 'REFUNDED', label: 'Reembolsado' },
  { value: 'PARTIALLY_REFUNDED', label: 'Reembolso Parcial' }
]

interface OrderDetailProps {
  params: Promise<{
    id: string
  }>
}

export default function OrderDetail({ params }: OrderDetailProps) {
  const router = useRouter()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('')
  const [internalNotes, setInternalNotes] = useState('')

  useEffect(() => {
    const init = async () => {
      const { id } = await params
      fetchOrder(id)
    }
    init()
  }, [params])

  const fetchOrder = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${id}`)
      if (response.ok) {
        const orderData = await response.json()
        setOrder(orderData)
        setStatus(orderData.status)
        setPaymentStatus(orderData.paymentStatus)
        setInternalNotes(orderData.internalNotes || '')
      } else {
        alert('Pedido no encontrado')
        router.push('/admin/orders')
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      alert('Error al cargar el pedido')
      router.push('/admin/orders')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!order) return

    setSaving(true)
    try {
      const { id } = await params
      const response = await fetch(`/api/admin/orders/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          paymentStatus,
          internalNotes
        }),
      })

      if (response.ok) {
        const result = await response.json()
        alert('Pedido actualizado correctamente')
        fetchOrder(id)
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error updating order:', error)
      alert('Error al actualizar el pedido')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
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

  if (loading) {
    return (
      <div>
        <AdminHeader 
          title="Detalle del Pedido" 
          subtitle="Cargando información del pedido"
        />
        <div className="p-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Cargando pedido...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div>
        <AdminHeader 
          title="Pedido no encontrado" 
          subtitle="El pedido solicitado no existe"
        />
        <div className="p-6">
          <Link
            href="/admin/orders"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver a pedidos
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <AdminHeader 
        title={`Pedido #${order.orderNumber}`}
        subtitle={`Cliente: ${order.customerName}`}
      />
      
      <div className="p-6">
        <div className="mb-6">
          <Link
            href="/admin/orders"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver a pedidos
          </Link>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details - Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Productos del Pedido
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
                          target="_blank"
                        >
                          {item.product.name}
                        </Link>
                        <p className="text-sm text-gray-500">SKU: {item.product.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {item.quantity} × S/ {item.price.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Subtotal: S/ {(item.quantity * item.price).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Información del Cliente
                </h3>
              </div>
              <div className="p-6">
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Nombre</dt>
                    <dd className="mt-1 text-sm text-gray-900">{order.customerName}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">{order.customerEmail}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
                    <dd className="mt-1 text-sm text-gray-900">{order.customerPhone || 'No especificado'}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Dirección de Envío
                </h3>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-900">{formatAddress(order.shippingAddress)}</p>
                {order.billingAddress && (
                  <>
                    <h4 className="text-sm font-medium text-gray-500 mt-4 mb-2">Dirección de Facturación</h4>
                    <p className="text-sm text-gray-900">{formatAddress(order.billingAddress)}</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Estado del Pedido</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado del Pedido
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {orderStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado del Pago
                  </label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {paymentStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas Internas
                  </label>
                  <textarea
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Notas internas (no visibles para el cliente)"
                  />
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Información de Pago
                </h3>
              </div>
              <div className="p-6">
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Método de Pago</dt>
                    <dd className="mt-1 text-sm text-gray-900">{order.paymentMethod || 'No especificado'}</dd>
                  </div>
                  {order.paymentId && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">ID de Transacción</dt>
                      <dd className="mt-1 text-sm text-gray-900 font-mono">{order.paymentId}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Resumen del Pedido
                </h3>
              </div>
              <div className="p-6">
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Subtotal</dt>
                    <dd className="text-sm text-gray-900">S/ {order.subtotal.toFixed(2)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Envío</dt>
                    <dd className="text-sm text-gray-900">S/ {order.shippingCost.toFixed(2)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">IGV (18%)</dt>
                    <dd className="text-sm text-gray-900">S/ {order.tax.toFixed(2)}</dd>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Descuento</dt>
                      <dd className="text-sm text-red-600">-S/ {order.discount.toFixed(2)}</dd>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between">
                      <dt className="text-base font-medium text-gray-900">Total</dt>
                      <dd className="text-base font-bold text-gray-900">S/ {order.total.toFixed(2)}</dd>
                    </div>
                  </div>
                </dl>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Cronología
                </h3>
              </div>
              <div className="p-6">
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="font-medium text-gray-600">Pedido creado</dt>
                    <dd className="text-gray-900">{formatDate(order.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-gray-600">Última actualización</dt>
                    <dd className="text-gray-900">{formatDate(order.updatedAt)}</dd>
                  </div>
                  {order.shippedAt && (
                    <div>
                      <dt className="font-medium text-gray-600">Enviado</dt>
                      <dd className="text-gray-900">{formatDate(order.shippedAt)}</dd>
                    </div>
                  )}
                  {order.deliveredAt && (
                    <div>
                      <dt className="font-medium text-gray-600">Entregado</dt>
                      <dd className="text-gray-900">{formatDate(order.deliveredAt)}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>

            {/* Customer Notes */}
            {order.notes && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Notas del Cliente
                  </h3>
                </div>
                <div className="p-6">
                  <p className="text-sm text-gray-900">{order.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}