'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Star, Package, DollarSign, Clock, Image, Palette } from 'lucide-react'

interface ProductVariant {
  id: string
  name: string
  color: string
  material: string | null
  basePrice: number
  comparePrice: number | null
  stock: number
  minStock: number
  weight: number | null
  dimensions: any
  images: string[]
  productionTime: number | null
  materialUsage: any
  printSettings: any
  isActive: boolean
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

interface ProductVariantsProps {
  productId: string
  productName: string
  onVariantChange?: () => void
}

export default function ProductVariants({ productId, productName, onVariantChange }: ProductVariantsProps) {
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    color: '',
    material: '',
    basePrice: '',
    comparePrice: '',
    stock: '',
    minStock: '5',
    weight: '',
    productionTime: '',
    isActive: true,
    isDefault: false
  })

  // Predefined colors
  const colorOptions = [
    { name: 'Negro', value: 'negro', hex: '#000000' },
    { name: 'Blanco', value: 'blanco', hex: '#FFFFFF' },
    { name: 'Rojo', value: 'rojo', hex: '#EF4444' },
    { name: 'Azul', value: 'azul', hex: '#3B82F6' },
    { name: 'Verde', value: 'verde', hex: '#10B981' },
    { name: 'Amarillo', value: 'amarillo', hex: '#F59E0B' },
    { name: 'Naranja', value: 'naranja', hex: '#F97316' },
    { name: 'Púrpura', value: 'purpura', hex: '#8B5CF6' },
    { name: 'Rosa', value: 'rosa', hex: '#EC4899' },
    { name: 'Gris', value: 'gris', hex: '#6B7280' },
    { name: 'Transparente', value: 'transparente', hex: 'rgba(255,255,255,0.3)' },
    { name: 'Multicolor', value: 'multicolor', hex: 'linear-gradient(45deg, #FF0000, #00FF00, #0000FF)' }
  ]

  useEffect(() => {
    fetchVariants()
  }, [productId])

  const fetchVariants = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/products/${productId}/variants?includeInactive=true`)
      const data = await response.json()
      setVariants(data || [])
    } catch (error) {
      console.error('Error fetching variants:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      color: '',
      material: '',
      basePrice: '',
      comparePrice: '',
      stock: '',
      minStock: '5',
      weight: '',
      productionTime: '',
      isActive: true,
      isDefault: false
    })
    setEditingVariant(null)
  }

  const handleEdit = (variant: ProductVariant) => {
    setEditingVariant(variant)
    setFormData({
      name: variant.name,
      color: variant.color,
      material: variant.material || '',
      basePrice: variant.basePrice.toString(),
      comparePrice: variant.comparePrice?.toString() || '',
      stock: variant.stock.toString(),
      minStock: variant.minStock.toString(),
      weight: variant.weight?.toString() || '',
      productionTime: variant.productionTime?.toString() || '',
      isActive: variant.isActive,
      isDefault: variant.isDefault
    })
    setShowAddForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.color || !formData.basePrice) {
      alert('Por favor completa los campos obligatorios')
      return
    }

    try {
      const url = editingVariant 
        ? `/api/admin/products/variants/${editingVariant.id}`
        : `/api/admin/products/${productId}/variants`
      
      const method = editingVariant ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al guardar variante')
      }

      resetForm()
      setShowAddForm(false)
      await fetchVariants()
      onVariantChange?.()
      
    } catch (error) {
      console.error('Error saving variant:', error)
      alert('Error al guardar la variante')
    }
  }

  const handleDelete = async (variantId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta variante?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/products/variants/${variantId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al eliminar variante')
      }

      await fetchVariants()
      onVariantChange?.()
      
    } catch (error) {
      console.error('Error deleting variant:', error)
      alert('Error al eliminar la variante')
    }
  }

  const getColorDisplay = (colorValue: string) => {
    const color = colorOptions.find(c => c.value === colorValue)
    return color || { name: colorValue, hex: '#6B7280' }
  }

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-600">Cargando variantes...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Variantes del Producto</h3>
          <p className="text-sm text-gray-600">{productName}</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          {editingVariant ? 'Cancelar' : 'Nueva Variante'}
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-gray-50 p-6 rounded-lg">
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            {editingVariant ? 'Editar Variante' : 'Nueva Variante'}
          </h4>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Dragon Rojo PLA"
                  required
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color *
                </label>
                <select
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Seleccionar color...</option>
                  {colorOptions.map((color) => (
                    <option key={color.value} value={color.value}>
                      {color.name}
                    </option>
                  ))}
                </select>
                {formData.color && (
                  <div className="mt-2 flex items-center">
                    <div 
                      className="w-6 h-6 rounded-full border border-gray-300 mr-2"
                      style={{ 
                        backgroundColor: getColorDisplay(formData.color).hex.includes('gradient') 
                          ? undefined 
                          : getColorDisplay(formData.color).hex,
                        background: getColorDisplay(formData.color).hex.includes('gradient') 
                          ? getColorDisplay(formData.color).hex 
                          : undefined
                      }}
                    />
                    <span className="text-sm text-gray-600">{getColorDisplay(formData.color).name}</span>
                  </div>
                )}
              </div>

              {/* Material */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Material
                </label>
                <input
                  type="text"
                  value={formData.material}
                  onChange={(e) => setFormData(prev => ({ ...prev, material: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: PLA, ABS, PETG"
                />
              </div>

              {/* Base Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio Base *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={formData.basePrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, basePrice: e.target.value }))}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                    required
                  />
                  <span className="absolute left-3 top-2 text-gray-500">S/.</span>
                </div>
              </div>

              {/* Compare Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio Comparación
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={formData.comparePrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, comparePrice: e.target.value }))}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                  <span className="absolute left-3 top-2 text-gray-500">S/.</span>
                </div>
              </div>

              {/* Stock */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock
                </label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>

              {/* Production Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiempo de Producción (horas)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.productionTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, productionTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.0"
                />
              </div>
            </div>

            {/* Checkboxes */}
            <div className="flex space-x-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Activa</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Variante por defecto</span>
              </label>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  resetForm()
                  setShowAddForm(false)
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingVariant ? 'Actualizar' : 'Crear'} Variante
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Variants List */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <h4 className="font-medium text-gray-900">Variantes Existentes</h4>
        </div>
        
        {variants.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {variants.map((variant) => {
              const colorDisplay = getColorDisplay(variant.color)
              return (
                <div key={variant.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h5 className="text-lg font-medium text-gray-900">{variant.name}</h5>
                        {variant.isDefault && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Star className="h-3 w-3 mr-1" />
                            Por defecto
                          </span>
                        )}
                        {!variant.isActive && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Inactiva
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
                        <div className="flex items-center">
                          <Palette className="h-4 w-4 text-gray-400 mr-2" />
                          <div className="flex items-center">
                            <div 
                              className="w-4 h-4 rounded-full border border-gray-300 mr-2"
                              style={{ 
                                backgroundColor: colorDisplay.hex.includes('gradient') 
                                  ? undefined 
                                  : colorDisplay.hex,
                                background: colorDisplay.hex.includes('gradient') 
                                  ? colorDisplay.hex 
                                  : undefined
                              }}
                            />
                            <span>{colorDisplay.name}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                          <span>S/. {variant.basePrice.toFixed(2)}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <Package className="h-4 w-4 text-gray-400 mr-2" />
                          <span>{variant.stock} unidades</span>
                        </div>
                        
                        {variant.productionTime && (
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 text-gray-400 mr-2" />
                            <span>{variant.productionTime}h</span>
                          </div>
                        )}
                        
                        {variant.material && (
                          <div className="flex items-center">
                            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                              {variant.material}
                            </span>
                          </div>
                        )}
                        
                        {variant.images.length > 0 && (
                          <div className="flex items-center">
                            <Image className="h-4 w-4 text-gray-400 mr-2" />
                            <span>{variant.images.length} imagen(es)</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(variant)}
                        className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(variant.id)}
                        className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg mb-2">No hay variantes creadas</p>
            <p className="text-sm">Crea la primera variante para este producto con diferentes colores y precios</p>
          </div>
        )}
      </div>
    </div>
  )
}