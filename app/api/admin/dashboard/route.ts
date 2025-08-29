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

    // Obtener estadísticas básicas (optimizado)
    console.time('Dashboard queries optimized')
    const [
      totalOrders,
      totalProducts,
      totalUsers,
      totalRevenue,
      recentOrders
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
      
      // Solo pedidos recientes (más rápido)
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
      })
    ])
    
    // Stock bajo como consulta separada y opcional
    const lowStockProducts = await prisma.product.count({
      where: {
        isActive: true,
        stock: {
          lte: 5 // Hardcoded para mejor performance
        }
      }
    })
    
    console.timeEnd('Dashboard queries optimized')

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
      lowStockCount: lowStockProducts,
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