'use client'

import { useState, useEffect } from 'react'
import AdminHeader from '@/components/admin/header'
import { 
  Package, 
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Search,
  Filter,
  Eye,
  Edit,
  Plus,
  Printer,
  Zap
} from 'lucide-react'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  sku: string
  stock: number
  minStock: number
  maxStock?: number
  price: number
  category: {
    name: string
  }
  material?: string
  color?: string
  isActive: boolean
  stockStatus: 'normal' | 'low' | 'critical' | 'overstock'
}

interface Material {
  id: string
  name: string
  type: string
  stock: number
  minStock: number
  maxStock?: number
  unit: string
  costPerUnit: number
  supplier?: string
  location?: string
  stockStatus: 'normal' | 'low' | 'critical' | 'overstock'
}

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<'products' | 'materials'>('products')
  const [products, setProducts] = useState<Product[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    if (activeTab === 'products') {
      fetchProducts()
    } else {
      fetchMaterials()
    }
  }, [activeTab])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/inventory/products')
      const data = await response.json()
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

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

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-red-600 bg-red-100'
      case 'low': return 'text-orange-600 bg-orange-100'
      case 'overstock': return 'text-purple-600 bg-purple-100'
      default: return 'text-green-600 bg-green-100'
    }
  }

  const getStockStatusText = (status: string) => {
    switch (status) {
      case 'critical': return 'Crítico'
      case 'low': return 'Bajo'
      case 'overstock': return 'Exceso'
      default: return 'Normal'
    }
  }

  const filteredProducts = Array.isArray(products) ? products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || product.stockStatus === statusFilter
    return matchesSearch && matchesStatus
  }) : []

  const filteredMaterials = Array.isArray(materials) ? materials.filter(material => {
    const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.type.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || material.stockStatus === statusFilter
    return matchesSearch && matchesStatus
  }) : []

  const getInventoryStats = () => {
    const items = activeTab === 'products' ? products : materials
    if (!Array.isArray(items)) {
      return { total: 0, critical: 0, low: 0, normal: 0, overstock: 0 }
    }
    return {
      total: items.length,
      critical: items.filter(item => item.stockStatus === 'critical').length,
      low: items.filter(item => item.stockStatus === 'low').length,
      normal: items.filter(item => item.stockStatus === 'normal').length,
      overstock: items.filter(item => item.stockStatus === 'overstock').length,
    }
  }

  const stats = getInventoryStats()

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventario</h1>
            <p className="text-gray-600 mt-1">
              Gestión de stock de productos y materiales
            </p>
          </div>
          <div className="flex space-x-4">
            <Link 
              href="/admin/inventory/batches"
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
            >
              <Package className="h-5 w-5 mr-2" />
              Ver Lotes
            </Link>
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center">
              <Printer className="h-5 w-5 mr-2" />
              Generar Producción
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center">
              <Plus className="h-5 w-5 mr-2" />
              Agregar {activeTab === 'products' ? 'Producto' : 'Lote'}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Stock Crítico</p>
                <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Stock Bajo</p>
                <p className="text-2xl font-bold text-orange-600">{stats.low}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Stock Normal</p>
                <p className="text-2xl font-bold text-green-600">{stats.normal}</p>
              </div>
              <Zap className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Sobrestock</p>
                <p className="text-2xl font-bold text-purple-600">{stats.overstock}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('products')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'products'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Package className="inline h-5 w-5 mr-2" />
                Productos Terminados
              </button>
              <button
                onClick={() => setActiveTab('materials')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'materials'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Zap className="inline h-5 w-5 mr-2" />
                Materiales de Producción
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder={`Buscar ${activeTab === 'products' ? 'productos' : 'materiales'}...`}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Todos los estados</option>
                  <option value="critical">Stock Crítico</option>
                  <option value="low">Stock Bajo</option>
                  <option value="normal">Stock Normal</option>
                  <option value="overstock">Sobrestock</option>
                </select>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="text-gray-600">Cargando...</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                {activeTab === 'products' ? (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 text-sm font-medium text-gray-900">Producto</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-900">SKU</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-900">Stock</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-900">Estado</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-900">Precio</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-900">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="py-4">
                            <div>
                              <p className="font-medium text-gray-900">{product.name}</p>
                              <p className="text-sm text-gray-500">{product.category.name}</p>
                              {(product.material || product.color) && (
                                <div className="flex gap-2 mt-1">
                                  {product.material && (
                                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                      {product.material}
                                    </span>
                                  )}
                                  {product.color && (
                                    <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                                      {product.color}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-4 text-sm text-gray-900">{product.sku}</td>
                          <td className="py-4">
                            <div className="text-sm">
                              <p className="font-medium">{product.stock} unidades</p>
                              <p className="text-gray-500">Min: {product.minStock}</p>
                            </div>
                          </td>
                          <td className="py-4">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStockStatusColor(product.stockStatus)}`}>
                              {getStockStatusText(product.stockStatus)}
                            </span>
                          </td>
                          <td className="py-4 text-sm font-medium text-gray-900">
                            S/. {parseFloat(product.price.toString()).toFixed(2)}
                          </td>
                          <td className="py-4">
                            <div className="flex space-x-2">
                              <Link
                                href={`/admin/products/${product.id}`}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                              <Link
                                href={`/admin/products/${product.id}/edit`}
                                className="text-gray-600 hover:text-gray-800"
                              >
                                <Edit className="h-4 w-4" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 text-sm font-medium text-gray-900">Material</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-900">Tipo</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-900">Stock</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-900">Estado</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-900">Costo/Unidad</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-900">Proveedor</th>
                        <th className="text-left py-3 text-sm font-medium text-gray-900">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredMaterials.map((material) => (
                        <tr key={material.id} className="hover:bg-gray-50">
                          <td className="py-4">
                            <div>
                              <p className="font-medium text-gray-900">{material.name}</p>
                              {material.location && (
                                <p className="text-sm text-gray-500">📍 {material.location}</p>
                              )}
                            </div>
                          </td>
                          <td className="py-4 text-sm text-gray-900">{material.type}</td>
                          <td className="py-4">
                            <div className="text-sm">
                              <p className="font-medium">{material.stock} {material.unit}</p>
                              <p className="text-gray-500">Min: {material.minStock} {material.unit}</p>
                            </div>
                          </td>
                          <td className="py-4">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStockStatusColor(material.stockStatus)}`}>
                              {getStockStatusText(material.stockStatus)}
                            </span>
                          </td>
                          <td className="py-4 text-sm font-medium text-gray-900">
                            S/. {material.costPerUnit.toFixed(4)} / {material.unit}
                          </td>
                          <td className="py-4 text-sm text-gray-900">
                            {material.supplier || 'N/A'}
                          </td>
                          <td className="py-4">
                            <div className="flex space-x-2">
                              <Link
                                href={`/admin/inventory/batches?materialId=${material.id}`}
                                className="text-blue-600 hover:text-blue-800"
                                title="Ver lotes del material"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                              <button 
                                className="text-gray-600 hover:text-gray-800"
                                onClick={() => alert('Funcionalidad de edición de materiales próximamente')}
                                title="Editar material"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}