'use client'

import AdminHeader from '@/components/admin/header'
import { 
  ShoppingCart, 
  Package, 
  Users, 
  DollarSign,
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle
} from 'lucide-react'
import { useEffect, useState } from 'react'

interface DashboardStats {
  totalOrders: number
  totalProducts: number
  totalUsers: number
  totalRevenue: number
  recentOrders: any[]
  lowStock: any[]
  salesTrend: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
    totalRevenue: 0,
    recentOrders: [],
    lowStock: [],
    salesTrend: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/admin/dashboard')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div>
        <AdminHeader 
          title="Dashboard" 
          subtitle="Resumen general del sistema"
        />
        <div className="p-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Cargando estadísticas...</div>
          </div>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Pedidos Totales',
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Productos',
      value: stats.totalProducts,
      icon: Package,
      color: 'bg-green-500',
      change: '+3',
      changeType: 'positive'
    },
    {
      title: 'Usuarios',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-purple-500',
      change: '+8%',
      changeType: 'positive'
    },
    {
      title: 'Ingresos',
      value: `S/ ${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'bg-yellow-500',
      change: '+15%',
      changeType: 'positive'
    }
  ]

  return (
    <div>
      <AdminHeader 
        title="Dashboard" 
        subtitle="Resumen general del sistema KN3D"
      />
      
      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">{card.change}</span>
                    <span className="text-sm text-gray-500 ml-1">vs mes pasado</span>
                  </div>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <card.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Pedidos Recientes</h3>
                <a href="/admin/orders" className="text-blue-600 hover:text-blue-800 text-sm">
                  Ver todos
                </a>
              </div>
            </div>
            <div className="p-6">
              {stats.recentOrders.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <ShoppingCart className="h-8 w-8 text-gray-400" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            Pedido #{order.orderNumber}
                          </p>
                          <p className="text-sm text-gray-500">{order.customerName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          S/ {parseFloat(order.total).toFixed(2)}
                        </p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No hay pedidos recientes
                </div>
              )}
            </div>
          </div>

          {/* Low Stock Alert */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Alertas de Stock</h3>
                <a href="/admin/inventory" className="text-blue-600 hover:text-blue-800 text-sm">
                  Ver inventario
                </a>
              </div>
            </div>
            <div className="p-6">
              {stats.lowStock.length > 0 ? (
                <div className="space-y-4">
                  {stats.lowStock.map((product) => (
                    <div key={product.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <AlertCircle className="h-8 w-8 text-red-400" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-red-600">
                          {product.stock} unidades
                        </p>
                        <p className="text-xs text-gray-500">
                          Min: {product.minStock}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-2" />
                  Stock en niveles normales
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <a
            href="/admin/products/new"
            className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-lg transition-colors"
          >
            <Package className="h-8 w-8 mb-3" />
            <h3 className="font-semibold mb-1">Agregar Producto</h3>
            <p className="text-sm opacity-90">Crear un nuevo producto en el catálogo</p>
          </a>

          <a
            href="/admin/orders"
            className="bg-green-600 hover:bg-green-700 text-white p-6 rounded-lg transition-colors"
          >
            <ShoppingCart className="h-8 w-8 mb-3" />
            <h3 className="font-semibold mb-1">Gestionar Pedidos</h3>
            <p className="text-sm opacity-90">Ver y procesar pedidos pendientes</p>
          </a>

          <a
            href="/admin/reports"
            className="bg-purple-600 hover:bg-purple-700 text-white p-6 rounded-lg transition-colors"
          >
            <TrendingUp className="h-8 w-8 mb-3" />
            <h3 className="font-semibold mb-1">Ver Reportes</h3>
            <p className="text-sm opacity-90">Análisis de ventas y rendimiento</p>
          </a>
        </div>
      </div>
    </div>
  )
}