import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    // Obtener estadísticas en paralelo para mejor rendimiento
    console.time('Dashboard queries')
    const [
      totalOrders,
      totalProducts,
      totalUsers,
      totalRevenue,
      recentOrders,
      lowStockProducts
    ] = await Promise.all([
      // Total de pedidos
      prisma.order.count(),
      
      // Total de productos activos
      prisma.product.count({
        where: { isActive: true }
      }),
      
      // Total de usuarios
      prisma.user.count(),
      
      // Ingresos totales (suma de todos los pedidos completados)
      prisma.order.aggregate({
        _sum: {
          total: true
        },
        where: {
          status: 'DELIVERED'
        }
      }),
      
      // Pedidos recientes (últimos 5)
      prisma.order.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          total: true,
          status: true,
          createdAt: true
        }
      }),
      
      // Productos con stock bajo (stock <= minStock)
      prisma.product.findMany({
        where: {
          AND: [
            { isActive: true },
            {
              stock: {
                lte: prisma.product.fields.minStock
              }
            }
          ]
        },
        select: {
          id: true,
          name: true,
          sku: true,
          stock: true,
          minStock: true
        },
        take: 10
      })
    ])
    console.timeEnd('Dashboard queries')

    // Simplificar - remover tendencias para mejorar performance
    const salesTrend = 0

    const dashboardStats = {
      totalOrders,
      totalProducts,
      totalUsers,
      totalRevenue: totalRevenue._sum.total ? parseFloat(totalRevenue._sum.total.toString()) : 0,
      recentOrders: recentOrders.map(order => ({
        ...order,
        total: parseFloat(order.total.toString())
      })),
      lowStock: lowStockProducts,
      salesTrend: Math.round(salesTrend * 100) / 100 // Redondear a 2 decimales
    }

    return NextResponse.json(dashboardStats)

  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}