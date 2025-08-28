'use client'
// Checkout page with Peru tax compliance

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft,
  ShoppingCart,
  Package,
  MapPin,
  CreditCard,
  Lock,
  CheckCircle,
  X,
  AlertCircle
} from 'lucide-react'

interface CartItem {
  id: string
  quantity: number
  product: {
    id: string
    name: string
    slug: string
    price: number
    images: string[]
    stock: number
  }
  category: {
    name: string
  }
}

interface CheckoutForm {
  // Información del cliente
  customerName: string
  customerEmail: string
  customerPhone: string
  
  // Comprobante de pago (Peru tax compliance)
  documentType: 'boleta' | 'factura'
  documentNumber: string // DNI para boleta, RUC para factura
  businessName?: string // Razón social para facturas
  
  // Direcciones
  shippingAddress: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
    district: string // Distrito (requerido en Perú)
    reference?: string // Referencia de dirección
  }
  billingAddress: {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
    district: string
    reference?: string
  }
  useSameAddress: boolean
  paymentMethod: string
  notes: string
}

export default function Checkout() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [errorMessages, setErrorMessages] = useState<string[]>([])
  const [formData, setFormData] = useState<CheckoutForm>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    documentType: 'boleta',
    documentNumber: '',
    businessName: '',
    shippingAddress: {
      street: '',
      city: '',
      state: 'Lima',
      zipCode: '',
      country: 'Perú',
      district: '',
      reference: ''
    },
    billingAddress: {
      street: '',
      city: '',
      state: 'Lima',
      zipCode: '',
      country: 'Perú',
      district: '',
      reference: ''
    },
    useSameAddress: true,
    paymentMethod: 'transfer',
    notes: ''
  })

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin?callbackUrl=/checkout')
      return
    }
    fetchCart()
  }, [session, status, router])

  useEffect(() => {
    if (session?.user) {
      setFormData(prev => ({
        ...prev,
        customerName: session.user.name || '',
        customerEmail: session.user.email || ''
      }))
    }
  }, [session])

  const fetchCart = async () => {
    try {
      const response = await fetch('/api/cart')
      if (response.ok) {
        const data = await response.json()
        setCartItems(data.items || [])
      }
    } catch (error) {
      console.error('Error fetching cart:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else if (name.startsWith('shippingAddress.')) {
      const field = name.replace('shippingAddress.', '')
      setFormData(prev => ({
        ...prev,
        shippingAddress: { ...prev.shippingAddress, [field]: value }
      }))
    } else if (name.startsWith('billingAddress.')) {
      const field = name.replace('billingAddress.', '')
      setFormData(prev => ({
        ...prev,
        billingAddress: { ...prev.billingAddress, [field]: value }
      }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const calculateSubtotal = () => {
    if (!Array.isArray(cartItems)) return 0
    return cartItems.reduce((sum, item) => sum + (parseFloat(item.product.price.toString()) * item.quantity), 0)
  }

  const calculateTax = (subtotal: number) => {
    return subtotal * 0.18 // IGV 18%
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const tax = calculateTax(subtotal)
    const shipping = 15.00 // Costo fijo de envío
    return subtotal + tax + shipping
  }

  const validateForm = () => {
    const errors = []
    
    // Campos básicos requeridos
    if (!formData.customerName.trim()) errors.push('Nombre completo es requerido')
    if (!formData.customerEmail.trim()) errors.push('Email es requerido')
    if (!formData.customerPhone.trim()) errors.push('Teléfono es requerido')
    
    // Validación de documento según tipo de comprobante
    if (formData.documentType === 'factura') {
      if (!formData.documentNumber.trim()) errors.push('RUC es requerido para facturas')
      if (formData.documentNumber.length !== 11) errors.push('RUC debe tener 11 dígitos')
      if (!formData.businessName?.trim()) errors.push('Razón Social es requerida para facturas')
    }
    
    // Validación de dirección
    if (!formData.shippingAddress.street.trim()) errors.push('Dirección es requerida')
    if (!formData.shippingAddress.city.trim()) errors.push('Ciudad es requerida')
    if (!formData.shippingAddress.district.trim()) errors.push('Distrito es requerido')
    if (!formData.shippingAddress.state.trim()) errors.push('Departamento es requerido')
    
    // Validación de teléfono peruano
    const phoneRegex = /^(\+51)?[9][0-9]{8}$/
    if (formData.customerPhone && !phoneRegex.test(formData.customerPhone.replace(/\s/g, ''))) {
      errors.push('Teléfono debe ser un número peruano válido (ej: 987654321)')
    }
    
    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar formulario
    const validationErrors = validateForm()
    if (validationErrors.length > 0) {
      setErrorMessages(validationErrors)
      setShowErrorModal(true)
      return
    }
    
    setProcessing(true)

    try {
      const orderData = {
        items: cartItems.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price
        })),
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        documentType: formData.documentType,
        documentNumber: formData.documentNumber,
        businessName: formData.businessName,
        shippingAddress: formData.shippingAddress,
        billingAddress: formData.useSameAddress ? formData.shippingAddress : formData.billingAddress,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      if (response.ok) {
        const result = await response.json()
        // Limpiar carrito después de crear la orden
        await fetch('/api/cart', { method: 'DELETE' })
        // Redirigir a página de confirmación
        router.push(`/orders/${result.order.id}?success=true`)
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Error al procesar el pedido')
    } finally {
      setProcessing(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Cargando checkout...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null // Se redirige automáticamente
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Tu carrito está vacío</h3>
            <p className="mt-1 text-sm text-gray-500">
              Agrega algunos productos para continuar con el checkout.
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
        </div>
      </div>
    )
  }

  const subtotal = calculateSubtotal()
  const tax = calculateTax(subtotal)
  const shipping = 15.00
  const total = calculateTotal()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/cart"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver al carrito
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulario de Checkout */}
          <div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Información del Cliente */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Información del Cliente
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="customerEmail"
                      value={formData.customerEmail}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      name="customerPhone"
                      value={formData.customerPhone}
                      onChange={handleInputChange}
                      required
                      placeholder="987654321"
                      pattern="(\+51)?[9][0-9]{8}"
                      title="Formato: 987654321 (celular peruano)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  {/* Comprobante de Pago */}
                  <div className="border-t pt-4">
                    <h3 className="text-md font-medium text-gray-900 mb-3">Comprobante de Pago</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tipo de Comprobante *
                        </label>
                        <div className="flex gap-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="documentType"
                              value="boleta"
                              checked={formData.documentType === 'boleta'}
                              onChange={handleInputChange}
                              className="mr-2"
                            />
                            Boleta de Venta
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="documentType"
                              value="factura"
                              checked={formData.documentType === 'factura'}
                              onChange={handleInputChange}
                              className="mr-2"
                            />
                            Factura
                          </label>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {formData.documentType === 'factura' ? 'RUC *' : 'DNI (Opcional)'}
                        </label>
                        <input
                          type="text"
                          name="documentNumber"
                          value={formData.documentNumber}
                          onChange={handleInputChange}
                          required={formData.documentType === 'factura'}
                          maxLength={formData.documentType === 'factura' ? 11 : 8}
                          minLength={formData.documentType === 'factura' ? 11 : 8}
                          pattern={formData.documentType === 'factura' ? '[0-9]{11}' : '[0-9]{8}'}
                          placeholder={formData.documentType === 'factura' ? '20123456789' : '12345678'}
                          title={formData.documentType === 'factura' ? 'RUC debe tener exactamente 11 dígitos' : 'DNI debe tener 8 dígitos'}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      {formData.documentType === 'factura' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Razón Social *
                          </label>
                          <input
                            type="text"
                            name="businessName"
                            value={formData.businessName || ''}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Nombre de la empresa"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dirección de Envío */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Dirección de Envío
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección *
                    </label>
                    <input
                      type="text"
                      name="shippingAddress.street"
                      value={formData.shippingAddress.street}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ciudad *
                      </label>
                      <input
                        type="text"
                        name="shippingAddress.city"
                        value={formData.shippingAddress.city}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Departamento *
                      </label>
                      <input
                        type="text"
                        name="shippingAddress.state"
                        value={formData.shippingAddress.state}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Distrito *
                      </label>
                      <input
                        type="text"
                        name="shippingAddress.district"
                        value={formData.shippingAddress.district}
                        onChange={handleInputChange}
                        required
                        placeholder="Ej: Miraflores, San Isidro"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Código Postal
                      </label>
                      <input
                        type="text"
                        name="shippingAddress.zipCode"
                        value={formData.shippingAddress.zipCode}
                        onChange={handleInputChange}
                        placeholder="15074"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Referencia
                    </label>
                    <input
                      type="text"
                      name="shippingAddress.reference"
                      value={formData.shippingAddress.reference || ''}
                      onChange={handleInputChange}
                      placeholder="Ej: Al frente del parque, casa azul"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Método de Pago */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Método de Pago
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selecciona tu método de pago
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="transfer"
                          checked={formData.paymentMethod === 'transfer'}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-blue-600"
                        />
                        <span className="ml-3 text-sm font-medium text-gray-900">
                          Transferencia Bancaria
                        </span>
                      </label>
                      <label className="flex items-center p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="yape"
                          checked={formData.paymentMethod === 'yape'}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-blue-600"
                        />
                        <span className="ml-3 text-sm font-medium text-gray-900">
                          Yape / Plin
                        </span>
                      </label>
                      <label className="flex items-center p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="cash"
                          checked={formData.paymentMethod === 'cash'}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-blue-600"
                        />
                        <span className="ml-3 text-sm font-medium text-gray-900">
                          Pago Contraentrega
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notas */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas del Pedido (Opcional)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Instrucciones especiales para el pedido..."
                />
              </div>
            </form>
          </div>

          {/* Resumen del Pedido */}
          <div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumen del Pedido</h2>
              
              {/* Items */}
              <div className="space-y-3 mb-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3">
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
                      <h4 className="text-sm font-medium text-gray-900">
                        {item.product.name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        Cantidad: {item.quantity}
                      </p>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      S/ {(item.product.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Totales */}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">S/ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Envío</span>
                  <span className="text-gray-900">S/ {shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">IGV (18%)</span>
                  <span className="text-gray-900">S/ {tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">S/ {total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Botón de Checkout */}
              <button
                type="submit"
                form="checkout-form"
                onClick={handleSubmit}
                disabled={processing}
                className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Confirmar Pedido
                  </>
                )}
              </button>

              <div className="mt-4 text-xs text-gray-500 text-center">
                <Lock className="h-3 w-3 inline mr-1" />
                Transacción segura y protegida
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Errores de Validación */}
      {showErrorModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Overlay */}
            <div 
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => setShowErrorModal(false)}
            />

            {/* Modal */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Errores en el Formulario
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 mb-3">
                        Por favor corrige los siguientes errores antes de continuar:
                      </p>
                      <ul className="text-sm text-red-600 space-y-1">
                        {errorMessages.map((error, index) => (
                          <li key={index} className="flex items-start">
                            <span className="w-2 h-2 bg-red-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                            {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowErrorModal(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setShowErrorModal(false)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}