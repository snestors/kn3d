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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const printer = searchParams.get('printer')

    let where: any = {}

    if (status && status !== 'all') {
      where.status = status
    }

    if (printer && printer !== 'all') {
      where.printer = printer
    }

    const jobs = await prisma.productionJob.findMany({
      where,
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
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    // Convertir campos Decimal a number
    const jobsWithNumbers = jobs.map(job => ({
      ...job,
      estimatedHours: job.estimatedHours ? parseFloat(job.estimatedHours.toString()) : null,
      actualHours: job.actualHours ? parseFloat(job.actualHours.toString()) : null
    }))

    return NextResponse.json(jobsWithNumbers)

  } catch (error) {
    console.error('Production jobs API error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      orderId, 
      productId, 
      name, 
      description, 
      priority, 
      estimatedHours, 
      printer, 
      material, 
      settings, 
      files 
    } = body

    // Validar datos requeridos
    if (!name) {
      return NextResponse.json(
        { error: 'El nombre del trabajo es requerido' },
        { status: 400 }
      )
    }

    // Generar número de trabajo único
    const jobCount = await prisma.productionJob.count()
    const jobNumber = `JOB-${String(jobCount + 1).padStart(6, '0')}`

    const jobData: any = {
      jobNumber,
      name,
      description: description || null,
      priority: priority || 5,
      estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
      printer: printer || null,
      material: material || null,
      settings: settings || null,
      files: files || []
    }

    // Agregar orderId si se proporciona
    if (orderId) {
      const orderExists = await prisma.order.findUnique({
        where: { id: orderId }
      })
      if (!orderExists) {
        return NextResponse.json(
          { error: 'Pedido no encontrado' },
          { status: 404 }
        )
      }
      jobData.orderId = orderId
    }

    // Agregar productId si se proporciona
    if (productId) {
      const productExists = await prisma.product.findUnique({
        where: { id: productId }
      })
      if (!productExists) {
        return NextResponse.json(
          { error: 'Producto no encontrado' },
          { status: 404 }
        )
      }
      jobData.productId = productId
    }

    const job = await prisma.productionJob.create({
      data: jobData,
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

    return NextResponse.json({
      ...job,
      estimatedHours: job.estimatedHours ? parseFloat(job.estimatedHours.toString()) : null,
      actualHours: job.actualHours ? parseFloat(job.actualHours.toString()) : null
    }, { status: 201 })

  } catch (error) {
    console.error('Create production job error:', error)
    return NextResponse.json(
      { error: 'Error al crear trabajo de producción' },
      { status: 500 }
    )
  }
}