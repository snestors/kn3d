'use client'

import { useState, useEffect } from 'react'
import { DollarSign, Package, Clock, Calculator, Plus, Trash2 } from 'lucide-react'

interface Material {
  id: string
  name: string
  unit: string
  type: string
}

interface MaterialBatch {
  id: string
  batchNumber: string
  supplier: string
}

interface ProductionCost {
  id: string
  material: {
    name: string
    unit: string
  }
  batch?: {
    batchNumber: string
    supplier: string
  }
  quantity: number
  unitCost: number
  totalCost: number
  notes?: string
}

interface CostBreakdown {
  materials: {
    cost: number
    items: {
      material: string
      quantity: number
      unit: string
      unitCost: number
      totalCost: number
    }[]
  }
  labor: {
    hours: number
    costPerHour: number
    totalCost: number
  }
}

interface CostTotals {
  materialCost: number
  laborCost: number
  totalCost: number
  suggestedPrice: number
  margin: number
}

interface ProductionCostsProps {
  productionJobId: string
  jobName: string
}

export default function ProductionCosts({ productionJobId, jobName }: ProductionCostsProps) {
  const [costs, setCosts] = useState<ProductionCost[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [batches, setBatches] = useState<MaterialBatch[]>([])
  const [breakdown, setBreakdown] = useState<CostBreakdown | null>(null)
  const [totals, setTotals] = useState<CostTotals | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    materialId: '',
    batchId: '',
    quantity: '',
    notes: ''
  })

  useEffect(() => {
    fetchData()
  }, [productionJobId])

  const fetchData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchCosts(),
        fetchMaterials(),
        calculateTotals()
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCosts = async () => {
    try {
      const response = await fetch(`/api/admin/production/costs?jobId=${productionJobId}`)
      const data = await response.json()
      setCosts(data.costs || [])
    } catch (error) {
      console.error('Error fetching costs:', error)
    }
  }

  const fetchMaterials = async () => {
    try {
      const response = await fetch('/api/admin/inventory/materials')
      const data = await response.json()
      setMaterials(data || [])
    } catch (error) {
      console.error('Error fetching materials:', error)
    }
  }

  const fetchBatchesForMaterial = async (materialId: string) => {
    if (!materialId) return
    try {
      const response = await fetch(`/api/admin/inventory/batches?materialId=${materialId}`)
      const data = await response.json()
      setBatches(data || [])
    } catch (error) {
      console.error('Error fetching batches:', error)
    }
  }

  const calculateTotals = async () => {
    try {
      const response = await fetch('/api/admin/production/costs', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productionJobId }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setBreakdown(data.breakdown)
        setTotals(data.totals)
      }
    } catch (error) {
      console.error('Error calculating totals:', error)
    }
  }

  const handleAddCost = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.materialId || !formData.quantity) {
      alert('Por favor completa los campos obligatorios')
      return
    }

    try {
      const response = await fetch('/api/admin/production/costs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productionJobId,
          ...formData
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al agregar costo')
      }

      // Reset form and refresh data
      setFormData({
        materialId: '',
        batchId: '',
        quantity: '',
        notes: ''
      })
      setShowAddForm(false)
      await fetchData()
      
    } catch (error) {
      console.error('Error adding cost:', error)
      alert('Error al agregar costo de producción')
    }
  }

  const handleMaterialChange = (materialId: string) => {
    setFormData(prev => ({ ...prev, materialId, batchId: '' }))
    setBatches([])
    if (materialId) {
      fetchBatchesForMaterial(materialId)
    }
  }

  const selectedMaterial = materials.find(m => m.id === formData.materialId)

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="text-gray-600">Cargando costos de producción...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Costos de Producción</h3>
          <p className="text-sm text-gray-600">{jobName}</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Agregar Costo
        </button>
      </div>

      {/* Add Cost Form */}
      {showAddForm && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <form onSubmit={handleAddCost} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Material *
              </label>
              <select
                value={formData.materialId}
                onChange={(e) => handleMaterialChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Seleccionar material...</option>
                {materials.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.name} ({material.unit})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lote (Opcional)
              </label>
              <select
                value={formData.batchId}
                onChange={(e) => setFormData(prev => ({ ...prev, batchId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!formData.materialId}
              >
                <option value="">FIFO (Automático)</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.batchNumber} ({batch.supplier})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad * {selectedMaterial && `(${selectedMaterial.unit})`}
              </label>
              <input
                type="number"
                step="0.001"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.000"
                required
              />
            </div>

            <div className="flex items-end space-x-2">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Agregar
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Cost Items */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <h4 className="font-medium text-gray-900">Materiales Consumidos</h4>
        </div>
        
        {costs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Material</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Lote</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Cantidad</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Costo Unit.</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Total</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {costs.map((cost) => (
                  <tr key={cost.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {cost.material.name}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {cost.batch ? (
                        <div>
                          <div>{cost.batch.batchNumber}</div>
                          <div className="text-xs text-gray-500">{cost.batch.supplier}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">FIFO</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {cost.quantity.toFixed(3)} {cost.material.unit}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      S/. {cost.unitCost.toFixed(4)}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      S/. {cost.totalCost.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {cost.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No se han registrado costos de materiales</p>
            <p className="text-sm">Agrega el primer costo de material para este trabajo</p>
          </div>
        )}
      </div>

      {/* Cost Summary */}
      {totals && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cost Breakdown */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h4 className="font-medium text-gray-900 mb-4 flex items-center">
              <Calculator className="h-5 w-5 mr-2" />
              Desglose de Costos
            </h4>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Materiales:</span>
                <span className="font-medium">S/. {totals.materialCost.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Mano de Obra:</span>
                <span className="font-medium">S/. {totals.laborCost.toFixed(2)}</span>
              </div>
              
              {breakdown?.labor && (
                <div className="text-xs text-gray-500 ml-4">
                  {breakdown.labor.hours.toFixed(2)} horas × S/. {breakdown.labor.costPerHour.toFixed(2)}/hora
                </div>
              )}
              
              <hr className="my-2" />
              
              <div className="flex justify-between items-center text-lg font-semibold">
                <span className="text-gray-900">Costo Total:</span>
                <span className="text-gray-900">S/. {totals.totalCost.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Pricing Suggestion */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h4 className="font-medium text-gray-900 mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Precio Sugerido
            </h4>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Costo Base:</span>
                <span className="font-medium">S/. {totals.totalCost.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Margen ({totals.margin.toFixed(0)}%):</span>
                <span className="font-medium text-green-600">
                  + S/. {(totals.suggestedPrice - totals.totalCost).toFixed(2)}
                </span>
              </div>
              
              <hr className="my-2" />
              
              <div className="flex justify-between items-center text-lg font-semibold">
                <span className="text-gray-900">Precio Sugerido:</span>
                <span className="text-green-600">S/. {totals.suggestedPrice.toFixed(2)}</span>
              </div>
              
              <p className="text-xs text-gray-500 mt-2">
                * Precio calculado con margen del {totals.margin.toFixed(0)}% sobre el costo total
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}