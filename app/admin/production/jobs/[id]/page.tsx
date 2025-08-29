'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AdminHeader from '@/components/admin/header'
import ProductionCosts from '@/components/admin/production-costs'
import { 
  ArrowLeft,
  Clock,
  User,
  FileText,
  Settings,
  Package,
  Calendar,
  AlertCircle,
  CheckCircle,
  Play,
  Pause,
  X
} from 'lucide-react'
import Link from 'next/link'

interface ProductionJob {
  id: string
  jobNumber: string
  name: string
  description: string
  status: string
  priority: number
  estimatedHours: number | null
  actualHours: number | null
  files: string[]
  printer: string | null
  material: string | null
  settings: any
  createdAt: string
  updatedAt: string
  startedAt: string | null
  completedAt: string | null
  notes: string | null
  order: {
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

const statusConfig = {
  QUEUED: { color: 'bg-gray-100 text-gray-800', text: 'En Cola', icon: Clock },
  IN_PROGRESS: { color: 'bg-blue-100 text-blue-800', text: 'En Proceso', icon: Play },
  PAUSED: { color: 'bg-yellow-100 text-yellow-800', text: 'Pausado', icon: Pause },
  COMPLETED: { color: 'bg-green-100 text-green-800', text: 'Completado', icon: CheckCircle },
  FAILED: { color: 'bg-red-100 text-red-800', text: 'Fallido', icon: AlertCircle },
  CANCELLED: { color: 'bg-gray-100 text-gray-800', text: 'Cancelado', icon: X }
}

export default function ProductionJobDetail() {
  const params = useParams()
  const router = useRouter()
  const [job, setJob] = useState<ProductionJob | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'details' | 'costs' | 'files'>('details')

  useEffect(() => {
    if (params.id) {
      fetchJob()
    }
  }, [params.id])

  const fetchJob = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/production/jobs/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setJob(data)
      } else if (response.status === 404) {
        router.push('/admin/production')
      }
    } catch (error) {
      console.error('Error fetching job:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateJobStatus = async (newStatus: string) => {
    if (!job) return
    
    try {
      const response = await fetch(`/api/admin/production/jobs/${job.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: newStatus,
          startedAt: newStatus === 'IN_PROGRESS' && !job.startedAt ? new Date().toISOString() : undefined,
          completedAt: newStatus === 'COMPLETED' ? new Date().toISOString() : undefined
        }),
      })

      if (response.ok) {
        await fetchJob()
      }
    } catch (error) {
      console.error('Error updating job status:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-32">
            <div className="text-gray-600">Cargando trabajo de producción...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Trabajo no encontrado</h2>
            <Link 
              href="/admin/production"
              className="text-blue-600 hover:text-blue-800"
            >
              Volver a Producción
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const StatusIcon = statusConfig[job.status as keyof typeof statusConfig]?.icon || Clock
  const statusStyle = statusConfig[job.status as keyof typeof statusConfig]

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link 
              href="/admin/production"
              className="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{job.name}</h1>
              <p className="text-gray-600 mt-1">
                #{job.jobNumber} {job.order && `• Cliente: ${job.order.customerName}`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusStyle?.color}`}>
              <StatusIcon className="h-4 w-4 mr-2" />
              {statusStyle?.text}
            </span>
            
            {/* Quick Status Actions */}
            <div className="flex space-x-2">
              {job.status === 'QUEUED' && (
                <button
                  onClick={() => updateJobStatus('IN_PROGRESS')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Iniciar
                </button>
              )}
              
              {job.status === 'IN_PROGRESS' && (
                <>
                  <button
                    onClick={() => updateJobStatus('PAUSED')}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Pausar
                  </button>
                  <button
                    onClick={() => updateJobStatus('COMPLETED')}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Completar
                  </button>
                </>
              )}
              
              {job.status === 'PAUSED' && (
                <button
                  onClick={() => updateJobStatus('IN_PROGRESS')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Reanudar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('details')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'details'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <FileText className="inline h-5 w-5 mr-2" />
                Detalles
              </button>
              <button
                onClick={() => setActiveTab('costs')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'costs'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Package className="inline h-5 w-5 mr-2" />
                Costos
              </button>
              <button
                onClick={() => setActiveTab('files')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'files'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Settings className="inline h-5 w-5 mr-2" />
                Archivos
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'details' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Job Information */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Trabajo</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Descripción</label>
                        <p className="mt-1 text-gray-900">{job.description || 'Sin descripción'}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Prioridad</label>
                          <p className="mt-1 text-gray-900">
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                              job.priority >= 8 ? 'bg-red-100 text-red-800' :
                              job.priority >= 6 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {job.priority}/10
                            </span>
                          </p>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-gray-500">Impresora</label>
                          <p className="mt-1 text-gray-900">{job.printer || 'Sin asignar'}</p>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-500">Material</label>
                        <p className="mt-1 text-gray-900">{job.material || 'Sin especificar'}</p>
                      </div>
                      
                      {job.product && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Producto</label>
                          <p className="mt-1 text-gray-900">{job.product.name} ({job.product.sku})</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Time Tracking */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Seguimiento de Tiempo</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center mb-2">
                          <Clock className="h-5 w-5 text-blue-600 mr-2" />
                          <span className="text-sm font-medium text-blue-800">Tiempo Estimado</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-900">
                          {job.estimatedHours ? `${job.estimatedHours}h` : 'N/A'}
                        </p>
                      </div>
                      
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center mb-2">
                          <Clock className="h-5 w-5 text-green-600 mr-2" />
                          <span className="text-sm font-medium text-green-800">Tiempo Real</span>
                        </div>
                        <p className="text-2xl font-bold text-green-900">
                          {job.actualHours ? `${job.actualHours}h` : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dates and Order Info */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Fechas Importantes</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Creado</p>
                          <p className="text-sm text-gray-600">
                            {new Date(job.createdAt).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      
                      {job.startedAt && (
                        <div className="flex items-center">
                          <Play className="h-5 w-5 text-blue-500 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Iniciado</p>
                            <p className="text-sm text-gray-600">
                              {new Date(job.startedAt).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {job.completedAt && (
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Completado</p>
                            <p className="text-sm text-gray-600">
                              {new Date(job.completedAt).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Information */}
                  {job.order && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Pedido</h3>
                      
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium text-gray-900">Pedido #{job.order.orderNumber}</span>
                          <Link
                            href={`/admin/orders/${job.order.id}`}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            Ver pedido →
                          </Link>
                        </div>
                        <p className="text-sm text-gray-600">Cliente: {job.order.customerName}</p>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {job.notes && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Notas</h3>
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <p className="text-gray-900">{job.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'costs' && (
              <ProductionCosts 
                productionJobId={job.id} 
                jobName={job.name}
              />
            )}

            {activeTab === 'files' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Archivos del Trabajo</h3>
                
                {job.files && job.files.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {job.files.map((file, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center mb-2">
                          <FileText className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            Archivo {index + 1}
                          </span>
                        </div>
                        <a
                          href={file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Descargar archivo
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No hay archivos adjuntos</p>
                  </div>
                )}

                {/* Settings */}
                {job.settings && (
                  <div className="mt-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuraciones de Impresión</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="text-sm text-gray-900 whitespace-pre-wrap">
                        {JSON.stringify(job.settings, null, 2)}
                      </pre>
                    </div>
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