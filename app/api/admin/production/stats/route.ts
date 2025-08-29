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

    // Obtener fecha de inicio del día actual
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Obtener estadísticas en paralelo
    const [
      totalJobs,
      activeJobs,
      completedToday,
      queuedJobs,
      failedJobs,
      completedJobs
    ] = await Promise.all([
      // Total de trabajos
      prisma.productionJob.count(),

      // Trabajos activos (en progreso)
      prisma.productionJob.count({
        where: { status: 'IN_PROGRESS' }
      }),

      // Trabajos completados hoy
      prisma.productionJob.count({
        where: {
          status: 'COMPLETED',
          completedAt: {
            gte: today
          }
        }
      }),

      // Trabajos en cola
      prisma.productionJob.count({
        where: { status: 'QUEUED' }
      }),

      // Trabajos fallidos
      prisma.productionJob.count({
        where: { status: 'FAILED' }
      }),

      // Trabajos completados para calcular tiempo promedio
      prisma.productionJob.findMany({
        where: {
          status: 'COMPLETED',
          actualHours: {
            not: null
          }
        },
        select: {
          actualHours: true
        },
        take: 100 // Últimos 100 trabajos para el promedio
      })
    ])

    // Calcular tiempo promedio de completación
    let avgCompletionTime = 0
    if (completedJobs.length > 0) {
      const totalHours = completedJobs.reduce((sum, job) => {
        return sum + (job.actualHours ? parseFloat(job.actualHours.toString()) : 0)
      }, 0)
      avgCompletionTime = totalHours / completedJobs.length
    }

    const stats = {
      totalJobs,
      activeJobs,
      completedToday,
      avgCompletionTime,
      queuedJobs,
      failedJobs
    }

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Production stats API error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}