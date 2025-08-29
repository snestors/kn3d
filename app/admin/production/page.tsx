'use client'

import { useState, useEffect } from 'react'
import AdminHeader from '@/components/admin/header'
import { 
  Printer, 
  Clock,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Calendar,
  Timer,
  Zap,
  Package,
  TrendingUp,
  Settings,
  Eye
} from 'lucide-react'
import Link from 'next/link'

interface ProductionJob {
  id: string
  jobNumber: string
  name: string
  description?: string
  status: 'QUEUED' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  priority: number
  estimatedHours?: number
  actualHours?: number
  printer?: string
  material?: string
  settings?: any
  files: string[]
  createdAt: string
  startedAt?: string
  completedAt?: string
  notes?: string
  order?: {
    id: string
    orderNumber: string
    customerName: string
  }
  product?: {
    id: string
    name: string
    sku: string
  }
}

interface ProductionStats {
  totalJobs: number
  activeJobs: number
  completedToday: number
  avgCompletionTime: number
  queuedJobs: number
  failedJobs: number
}

export default function ProductionPage() {
  const [jobs, setJobs] = useState<ProductionJob[]>([])
  const [stats, setStats] = useState<ProductionStats>({
    totalJobs: 0,
    activeJobs: 0,
    completedToday: 0,
    avgCompletionTime: 0,
    queuedJobs: 0,
    failedJobs: 0
  })
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedPrinter, setSelectedPrinter] = useState<string>('all')

  useEffect(() => {
    fetchJobs()
    fetchStats()
  }, [])

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/production/jobs')
      const data = await response.json()
      setJobs(data || [])
    } catch (error) {
      console.error('Error fetching production jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/production/stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching production stats:', error)
    }
  }

  const updateJobStatus = async (jobId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/production/jobs/${jobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        fetchJobs()
        fetchStats()
      }
    } catch (error) {
      console.error('Error updating job status:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'QUEUED': return 'text-gray-600 bg-gray-100'
      case 'IN_PROGRESS': return 'text-blue-600 bg-blue-100'
      case 'PAUSED': return 'text-yellow-600 bg-yellow-100'
      case 'COMPLETED': return 'text-green-600 bg-green-100'
      case 'FAILED': return 'text-red-600 bg-red-100'
      case 'CANCELLED': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'QUEUED': return 'En Cola'
      case 'IN_PROGRESS': return 'En Progreso'
      case 'PAUSED': return 'Pausado'
      case 'COMPLETED': return 'Completado'
      case 'FAILED': return 'Fallido'
      case 'CANCELLED': return 'Cancelado'
      default: return status
    }
  }

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'text-red-600 bg-red-100'
    if (priority >= 6) return 'text-orange-600 bg-orange-100'
    if (priority >= 4) return 'text-yellow-600 bg-yellow-100'
    return 'text-green-600 bg-green-100'
  }

  const getPriorityText = (priority: number) => {
    if (priority >= 8) return 'Crítica'
    if (priority >= 6) return 'Alta'
    if (priority >= 4) return 'Media'
    return 'Baja'
  }

  const filteredJobs = jobs.filter(job => {
    const matchesStatus = selectedStatus === 'all' || job.status === selectedStatus
    const matchesPrinter = selectedPrinter === 'all' || job.printer === selectedPrinter
    return matchesStatus && matchesPrinter
  })

  const printers = Array.from(new Set(jobs.map(job => job.printer).filter(Boolean)))

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Centro de Producción</h1>
            <p className="text-gray-600 mt-1">
              Gestión de trabajos de impresión 3D
            </p>
          </div>
          <div className="flex space-x-4">
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Optimizar Cola
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center">
              <Plus className="h-5 w-5 mr-2" />
              Nuevo Trabajo
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Trabajos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalJobs}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En Progreso</p>
                <p className="text-2xl font-bold text-blue-600">{stats.activeJobs}</p>
              </div>
              <Printer className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En Cola</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.queuedJobs}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completados Hoy</p>
                <p className="text-2xl font-bold text-green-600">{stats.completedToday}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Promedio Tiempo</p>
                <p className="text-2xl font-bold text-purple-600">{stats.avgCompletionTime.toFixed(1)}h</p>
              </div>
              <Timer className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Fallidos</p>
                <p className="text-2xl font-bold text-red-600">{stats.failedJobs}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Filters and Job List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                >
                  <option value="all">Todos los estados</option>
                  <option value="QUEUED">En Cola</option>
                  <option value="IN_PROGRESS">En Progreso</option>
                  <option value="PAUSED">Pausado</option>
                  <option value="COMPLETED">Completado</option>
                  <option value="FAILED">Fallido</option>
                  <option value="CANCELLED">Cancelado</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Impresora</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={selectedPrinter}
                  onChange={(e) => setSelectedPrinter(e.target.value)}
                >
                  <option value="all">Todas las impresoras</option>
                  {printers.map(printer => (
                    <option key={printer} value={printer}>{printer}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="text-gray-600">Cargando trabajos...</div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredJobs.length > 0 ? (
                  filteredJobs.map((job) => (
                    <div key={job.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{job.name}</h3>
                            <p className="text-sm text-gray-500">#{job.jobNumber}</p>
                          </div>
                          <div className="flex space-x-2">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                              {getStatusText(job.status)}
                            </span>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(job.priority)}`}>
                              {getPriorityText(job.priority)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {job.status === 'QUEUED' && (
                            <button
                              onClick={() => updateJobStatus(job.id, 'IN_PROGRESS')}
                              className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50"
                              title="Iniciar"
                            >
                              <Play className="h-5 w-5" />
                            </button>
                          )}
                          {job.status === 'IN_PROGRESS' && (
                            <button
                              onClick={() => updateJobStatus(job.id, 'PAUSED')}
                              className="text-yellow-600 hover:text-yellow-800 p-2 rounded-lg hover:bg-yellow-50"
                              title="Pausar"
                            >
                              <Pause className="h-5 w-5" />
                            </button>
                          )}
                          {job.status === 'PAUSED' && (
                            <button
                              onClick={() => updateJobStatus(job.id, 'IN_PROGRESS')}
                              className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50"
                              title="Reanudar"
                            >
                              <Play className="h-5 w-5" />
                            </button>
                          )}
                          {(job.status === 'IN_PROGRESS' || job.status === 'PAUSED') && (
                            <button
                              onClick={() => updateJobStatus(job.id, 'COMPLETED')}
                              className="text-green-600 hover:text-green-800 p-2 rounded-lg hover:bg-green-50"
                              title="Marcar como completado"
                            >
                              <CheckCircle className="h-5 w-5" />
                            </button>
                          )}
                          <Link 
                            href={`/admin/production/jobs/${job.id}`}
                            className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-50"
                          >
                            <Eye className="h-5 w-5" />
                          </Link>
                          <button className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-50">
                            <Settings className="h-5 w-5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Impresora</p>
                          <p className="font-medium">{job.printer || 'No asignada'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Material</p>
                          <p className="font-medium">{job.material || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Tiempo Estimado</p>
                          <p className="font-medium">
                            {job.estimatedHours ? `${job.estimatedHours}h` : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Tiempo Real</p>
                          <p className="font-medium">
                            {job.actualHours ? `${job.actualHours}h` : '-'}
                          </p>
                        </div>
                      </div>

                      {job.order && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>Pedido:</strong> #{job.order.orderNumber} - {job.order.customerName}
                          </p>
                        </div>
                      )}

                      {job.description && (
                        <div className="mt-4">
                          <p className="text-sm text-gray-600">{job.description}</p>
                        </div>
                      )}

                      {job.files && job.files.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm text-gray-500 mb-2">Archivos:</p>
                          <div className="flex flex-wrap gap-2">
                            {job.files.map((file, index) => (
                              <span key={index} className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                                📁 {file.split('/').pop()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Printer className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-lg">No hay trabajos de producción</p>
                    <p className="text-sm">Crea un nuevo trabajo para comenzar</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}