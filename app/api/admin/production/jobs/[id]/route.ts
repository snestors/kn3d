import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const job = await prisma.productionJob.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            customerName: true,
            customerEmail: true
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            material: true,
            color: true
          }
        }
      }
    })

    if (!job) {
      return NextResponse.json(
        { error: 'Trabajo de producción no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ...job,
      estimatedHours: job.estimatedHours ? parseFloat(job.estimatedHours.toString()) : null,
      actualHours: job.actualHours ? parseFloat(job.actualHours.toString()) : null
    })

  } catch (error) {
    console.error('Get production job error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      status, 
      priority, 
      estimatedHours, 
      actualHours, 
      printer, 
      material, 
      settings, 
      notes 
    } = body

    const job = await prisma.productionJob.findUnique({
      where: { id }
    })

    if (!job) {
      return NextResponse.json(
        { error: 'Trabajo de producción no encontrado' },
        { status: 404 }
      )
    }

    const updateData: any = {}

    // Actualizar campos si se proporcionan
    if (status !== undefined) {
      updateData.status = status
      
      // Actualizar timestamps según el estado
      if (status === 'IN_PROGRESS' && job.status !== 'IN_PROGRESS') {
        updateData.startedAt = new Date()
      }
      
      if (status === 'COMPLETED' && job.status !== 'COMPLETED') {
        updateData.completedAt = new Date()
        
        // Calcular tiempo real si no se proporcionó
        if (job.startedAt && !actualHours) {
          const startTime = new Date(job.startedAt).getTime()
          const endTime = Date.now()
          const hoursElapsed = (endTime - startTime) / (1000 * 60 * 60)
          updateData.actualHours = hoursElapsed
        }
      }
    }

    if (priority !== undefined) updateData.priority = priority
    if (estimatedHours !== undefined) updateData.estimatedHours = parseFloat(estimatedHours)
    if (actualHours !== undefined) updateData.actualHours = parseFloat(actualHours)
    if (printer !== undefined) updateData.printer = printer
    if (material !== undefined) updateData.material = material
    if (settings !== undefined) updateData.settings = settings
    if (notes !== undefined) updateData.notes = notes

    const updatedJob = await prisma.productionJob.update({
      where: { id },
      data: updateData,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            customerName: true
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            sku: true
          }
        }
      }
    })

    // Si el trabajo se completó y tiene un producto asociado, actualizar stock
    if (updateData.status === 'COMPLETED' && updatedJob.productId) {
      await prisma.product.update({
        where: { id: updatedJob.productId },
        data: {
          stock: {
            increment: 1 // Incrementar stock en 1 unidad producida
          }
        }
      })
    }

    return NextResponse.json({
      ...updatedJob,
      estimatedHours: updatedJob.estimatedHours ? parseFloat(updatedJob.estimatedHours.toString()) : null,
      actualHours: updatedJob.actualHours ? parseFloat(updatedJob.actualHours.toString()) : null
    })

  } catch (error) {
    console.error('Update production job error:', error)
    return NextResponse.json(
      { error: 'Error al actualizar trabajo de producción' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const job = await prisma.productionJob.findUnique({
      where: { id }
    })

    if (!job) {
      return NextResponse.json(
        { error: 'Trabajo de producción no encontrado' },
        { status: 404 }
      )
    }

    // No permitir eliminar trabajos en progreso
    if (job.status === 'IN_PROGRESS') {
      return NextResponse.json(
        { error: 'No se puede eliminar un trabajo en progreso' },
        { status: 400 }
      )
    }

    await prisma.productionJob.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Trabajo eliminado correctamente' })

  } catch (error) {
    console.error('Delete production job error:', error)
    return NextResponse.json(
      { error: 'Error al eliminar trabajo de producción' },
      { status: 500 }
    )
  }
}