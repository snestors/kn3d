'use client'

import { useState, useEffect } from 'react'
import AdminHeader from '@/components/admin/header'
import { 
  Package, 
  Calendar,
  TrendingDown,
  AlertTriangle,
  Search,
  Filter,
  Eye,
  Plus,
  ArrowLeft,
  DollarSign,
  Clock,
  MapPin,
  ShoppingCart
} from 'lucide-react'
import Link from 'next/link'
import BatchModal from '@/components/admin/batch-modal'
import { useSearchParams } from 'next/navigation'

interface MaterialBatch {
  id: string
  batchNumber: string
  material: {
    id: string
    name: string
    unit: string
    type: string
  }
  purchaseDate: string
  supplier?: string
  invoiceNumber?: string
  originalQty: number
  currentQty: number
  unitCost: number
  totalCost: number
  usagePercentage: number
  status: 'active' | 'expired' | 'near_expiry' | 'depleted' | 'inactive'
  daysUntilExpiry?: number
  expiryDate?: string
  isActive: boolean
}

export default function BatchesPage() {
  const searchParams = useSearchParams()
  const materialIdFromUrl = searchParams.get('materialId')
  
  const [batches, setBatches] = useState<MaterialBatch[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showAddBatch, setShowAddBatch] = useState(false)

  useEffect(() => {
    fetchBatches()
  }, [])

  const fetchBatches = async () => {
    setLoading(true)
    try {
      const url = materialIdFromUrl 
        ? `/api/admin/inventory/batches?materialId=${materialIdFromUrl}`
        : '/api/admin/inventory/batches'
      const response = await fetch(url)
      const data = await response.json()
      setBatches(data || [])
    } catch (error) {
      console.error('Error fetching batches:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBatch = async (batchData: any) => {
    try {
      const response = await fetch('/api/admin/inventory/batches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batchData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al crear lote')
      }

      await fetchBatches()
    } catch (error) {
      console.error('Error creating batch:', error)
      throw error
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100'
      case 'expired': return 'text-red-600 bg-red-100'
      case 'near_expiry': return 'text-orange-600 bg-orange-100'
      case 'depleted': return 'text-gray-600 bg-gray-100'
      case 'inactive': return 'text-gray-400 bg-gray-50'
      default: return 'text-blue-600 bg-blue-100'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Activo'
      case 'expired': return 'Vencido'
      case 'near_expiry': return 'Por Vencer'
      case 'depleted': return 'Agotado'
      case 'inactive': return 'Inactivo'
      default: return 'Activo'
    }
  }

  const filteredBatches = Array.isArray(batches) ? batches.filter(batch => {
    const matchesSearch = batch.material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         batch.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (batch.supplier?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
    const matchesStatus = statusFilter === 'all' || batch.status === statusFilter
    return matchesSearch && matchesStatus
  }) : []

  const getBatchStats = () => {
    if (!Array.isArray(batches)) {
      return { total: 0, active: 0, expired: 0, nearExpiry: 0, depleted: 0 }
    }
    return {
      total: batches.length,
      active: batches.filter(b => b.status === 'active').length,
      expired: batches.filter(b => b.status === 'expired').length,
      nearExpiry: batches.filter(b => b.status === 'near_expiry').length,
      depleted: batches.filter(b => b.status === 'depleted').length,
    }
  }

  const stats = getBatchStats()

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link 
              href="/admin/inventory"
              className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Lotes de Materiales
                {materialIdFromUrl && <span className="text-blue-600"> (Filtrado)</span>}
              </h1>
              <p className="text-gray-600 mt-1">
                Trazabilidad detallada de compras y consumos
                {materialIdFromUrl && <span className="text-blue-600"> • Mostrando lotes de un material específico</span>}
              </p>
            </div>
          </div>
          <div className="flex space-x-4">
            <button 
              onClick={() => setShowAddBatch(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nuevo Lote
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Lotes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Activos</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Por Vencer</p>
                <p className="text-2xl font-bold text-orange-600">{stats.nearExpiry}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Vencidos</p>
                <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Agotados</p>
                <p className="text-2xl font-bold text-gray-600">{stats.depleted}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-gray-600" />
            </div>
          </div>
        </div>

        {/* Filters and List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Buscar lotes, materiales o proveedores..."
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
                  <option value="active">Activos</option>
                  <option value="near_expiry">Por vencer</option>
                  <option value="expired">Vencidos</option>
                  <option value="depleted">Agotados</option>
                  <option value="inactive">Inactivos</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="text-gray-600">Cargando lotes...</div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBatches.length > 0 ? (
                  filteredBatches.map((batch) => (
                    <div key={batch.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{batch.material.name}</h3>
                            <p className="text-sm text-gray-500">#{batch.batchNumber}</p>
                          </div>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(batch.status)}`}>
                            {getStatusText(batch.status)}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50">
                            <Eye className="h-5 w-5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Fecha Compra</p>
                          <p className="font-medium">
                            {new Date(batch.purchaseDate).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-gray-500">Proveedor</p>
                          <p className="font-medium">{batch.supplier || 'N/A'}</p>
                        </div>
                        
                        <div>
                          <p className="text-gray-500">Cantidad Original</p>
                          <p className="font-medium">{batch.originalQty} {batch.material.unit}</p>
                        </div>
                        
                        <div>
                          <p className="text-gray-500">Cantidad Actual</p>
                          <p className="font-medium text-blue-600">{batch.currentQty} {batch.material.unit}</p>
                        </div>
                        
                        <div>
                          <p className="text-gray-500">Costo Unitario</p>
                          <p className="font-medium">S/. {batch.unitCost.toFixed(4)}</p>
                        </div>
                        
                        <div>
                          <p className="text-gray-500">Valor Total</p>
                          <p className="font-medium text-green-600">S/. {(batch.currentQty * batch.unitCost).toFixed(2)}</p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Uso del lote</span>
                          <span>{batch.usagePercentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${batch.usagePercentage}%` }}
                          ></div>
                        </div>
                      </div>

                      {batch.daysUntilExpiry && (
                        <div className="mt-4 p-3 bg-orange-50 rounded-lg">
                          <p className="text-sm text-orange-800">
                            <Clock className="inline h-4 w-4 mr-1" />
                            {batch.daysUntilExpiry > 0 
                              ? `Vence en ${batch.daysUntilExpiry} días`
                              : `Vencido hace ${Math.abs(batch.daysUntilExpiry)} días`
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg">No hay lotes de materiales</p>
                    <p className="text-sm">Agrega un nuevo lote para comenzar</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Batch Creation Modal */}
      <BatchModal
        isOpen={showAddBatch}
        onClose={() => setShowAddBatch(false)}
        onSubmit={handleCreateBatch}
      />
    </div>
  )
}