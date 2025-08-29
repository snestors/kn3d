'use client'

import { useState, useEffect } from 'react'
import { X, Package, Calendar, DollarSign, FileText, Building } from 'lucide-react'

interface Material {
  id: string
  name: string
  unit: string
  type: string
}

interface BatchModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: BatchFormData) => Promise<void>
}

interface BatchFormData {
  materialId: string
  purchaseDate: string
  supplier: string
  invoiceNumber: string
  originalQty: string
  unitCost: string
  expiryDate: string
}

export default function BatchModal({ isOpen, onClose, onSubmit }: BatchModalProps) {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState<BatchFormData>({
    materialId: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    supplier: '',
    invoiceNumber: '',
    originalQty: '',
    unitCost: '',
    expiryDate: ''
  })

  useEffect(() => {
    if (isOpen) {
      fetchMaterials()
    }
  }, [isOpen])

  const fetchMaterials = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/inventory/materials')
      const data = await response.json()
      setMaterials(data || [])
    } catch (error) {
      console.error('Error fetching materials:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof BatchFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.materialId || !formData.originalQty || !formData.unitCost) {
      alert('Por favor completa los campos obligatorios')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit(formData)
      // Reset form
      setFormData({
        materialId: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        supplier: '',
        invoiceNumber: '',
        originalQty: '',
        unitCost: '',
        expiryDate: ''
      })
      onClose()
    } catch (error) {
      console.error('Error creating batch:', error)
      alert('Error al crear el lote')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedMaterial = materials.find(m => m.id === formData.materialId)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Nuevo Lote de Material</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Material */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Package className="inline h-4 w-4 mr-1" />
                Material *
              </label>
              <select
                value={formData.materialId}
                onChange={(e) => handleInputChange('materialId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={loading}
              >
                <option value="">Seleccionar material...</option>
                {materials.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.name} ({material.type}) - {material.unit}
                  </option>
                ))}
              </select>
              {loading && (
                <p className="text-sm text-gray-500 mt-1">Cargando materiales...</p>
              )}
            </div>

            {/* Purchase Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Fecha de Compra *
              </label>
              <input
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Expiry Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Fecha de Vencimiento
              </label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Package className="inline h-4 w-4 mr-1" />
                Cantidad Original *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.001"
                  value={formData.originalQty}
                  onChange={(e) => handleInputChange('originalQty', e.target.value)}
                  className="w-full px-3 py-2 pr-16 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.000"
                  required
                />
                <span className="absolute right-3 top-2 text-gray-500 text-sm">
                  {selectedMaterial?.unit || 'unidad'}
                </span>
              </div>
            </div>

            {/* Unit Cost */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="inline h-4 w-4 mr-1" />
                Costo Unitario *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.0001"
                  value={formData.unitCost}
                  onChange={(e) => handleInputChange('unitCost', e.target.value)}
                  className="w-full px-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.0000"
                  required
                />
                <span className="absolute left-3 top-2 text-gray-500">S/.</span>
              </div>
            </div>

            {/* Supplier */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Building className="inline h-4 w-4 mr-1" />
                Proveedor
              </label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => handleInputChange('supplier', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nombre del proveedor"
              />
            </div>

            {/* Invoice Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="inline h-4 w-4 mr-1" />
                N° Factura
              </label>
              <input
                type="text"
                value={formData.invoiceNumber}
                onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Número de factura"
              />
            </div>
          </div>

          {/* Total Cost Preview */}
          {formData.originalQty && formData.unitCost && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Costo Total:</span>
                <span className="text-lg font-semibold text-gray-900">
                  S/. {(parseFloat(formData.originalQty || '0') * parseFloat(formData.unitCost || '0')).toFixed(2)}
                </span>
              </div>
              {selectedMaterial && (
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-600">Material:</span>
                  <span className="text-sm text-gray-900">
                    {formData.originalQty} {selectedMaterial.unit} de {selectedMaterial.name}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? 'Creando...' : 'Crear Lote'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}