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
    const jobId = searchParams.get('jobId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit

    let where: any = {}

    if (jobId) {
      where.productionJobId = jobId
    }

    const [costs, total] = await Promise.all([
      prisma.productionCost.findMany({
        where,
        include: {
          productionJob: {
            select: {
              id: true,
              jobNumber: true,
              name: true
            }
          },
          material: {
            select: {
              id: true,
              name: true,
              unit: true,
              type: true
            }
          },
          batch: {
            select: {
              id: true,
              batchNumber: true,
              supplier: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.productionCost.count({ where })
    ])

    // Convertir campos Decimal a number
    const costsWithDetails = costs.map(cost => ({
      ...cost,
      quantity: parseFloat(cost.quantity.toString()),
      unitCost: parseFloat(cost.unitCost.toString()),
      totalCost: parseFloat(cost.totalCost.toString())
    }))

    return NextResponse.json({
      costs: costsWithDetails,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Production costs API error:', error)
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
      productionJobId,
      materialId,
      batchId,
      quantity,
      notes 
    } = body

    // Validar campos requeridos
    if (!productionJobId || !materialId || !quantity) {
      return NextResponse.json(
        { error: 'Campos requeridos: productionJobId, materialId, quantity' },
        { status: 400 }
      )
    }

    // Verificar que el trabajo de producción existe
    const productionJob = await prisma.productionJob.findUnique({
      where: { id: productionJobId }
    })

    if (!productionJob) {
      return NextResponse.json(
        { error: 'Trabajo de producción no encontrado' },
        { status: 404 }
      )
    }

    // Obtener el material
    const material = await prisma.material.findUnique({
      where: { id: materialId }
    })

    if (!material) {
      return NextResponse.json(
        { error: 'Material no encontrado' },
        { status: 404 }
      )
    }

    const qty = parseFloat(quantity)
    let unitCost = parseFloat(material.costPerUnit.toString())
    let batchUsed = null

    // Si se especifica un lote, usar el costo de ese lote
    if (batchId) {
      const batch = await prisma.materialBatch.findUnique({
        where: { id: batchId }
      })
      
      if (batch) {
        unitCost = parseFloat(batch.unitCost.toString())
        batchUsed = batch

        // Verificar que hay suficiente cantidad en el lote
        const currentBatchQty = parseFloat(batch.currentQty.toString())
        if (currentBatchQty < qty) {
          return NextResponse.json(
            { error: 'Cantidad insuficiente en el lote seleccionado' },
            { status: 400 }
          )
        }
      }
    } else {
      // Si no se especifica lote, usar FIFO para seleccionar el lote más antiguo
      const availableBatch = await prisma.materialBatch.findFirst({
        where: {
          materialId,
          currentQty: { gt: 0 },
          isActive: true
        },
        orderBy: {
          purchaseDate: 'asc'
        }
      })

      if (availableBatch) {
        const currentBatchQty = parseFloat(availableBatch.currentQty.toString())
        if (currentBatchQty >= qty) {
          batchUsed = availableBatch
          unitCost = parseFloat(availableBatch.unitCost.toString())
        }
      }
    }

    const totalCost = qty * unitCost

    // Crear el registro de costo de producción
    const productionCost = await prisma.productionCost.create({
      data: {
        productionJobId,
        materialId,
        batchId: batchUsed?.id || null,
        quantity: qty,
        unitCost,
        totalCost,
        notes: notes || null
      },
      include: {
        productionJob: {
          select: {
            id: true,
            jobNumber: true,
            name: true
          }
        },
        material: {
          select: {
            id: true,
            name: true,
            unit: true,
            type: true
          }
        },
        batch: {
          select: {
            id: true,
            batchNumber: true,
            supplier: true
          }
        }
      }
    })

    // Actualizar el lote si se usa uno específico
    if (batchUsed) {
      const newBatchQty = parseFloat(batchUsed.currentQty.toString()) - qty
      await prisma.materialBatch.update({
        where: { id: batchUsed.id },
        data: { currentQty: Math.max(0, newBatchQty) }
      })
    }

    // Crear movimiento de inventario
    const movementCount = await prisma.inventoryMovement.count()
    const movementNumber = `MOV-${String(movementCount + 1).padStart(8, '0')}`

    await prisma.inventoryMovement.create({
      data: {
        movementNumber,
        type: 'CONSUMPTION',
        reference: `Producción ${productionJob.jobNumber}`,
        materialId,
        batchId: batchUsed?.id || null,
        productionJobId,
        quantity: -qty, // Negativo porque es consumo
        unitCost,
        totalCost,
        stockAfter: parseFloat(material.stock.toString()) - qty,
        notes: `Consumo para producción: ${productionJob.name}`,
        createdBy: session.user.id
      }
    })

    // Actualizar stock del material
    await prisma.material.update({
      where: { id: materialId },
      data: {
        stock: {
          decrement: qty
        }
      }
    })

    return NextResponse.json({
      ...productionCost,
      quantity: parseFloat(productionCost.quantity.toString()),
      unitCost: parseFloat(productionCost.unitCost.toString()),
      totalCost: parseFloat(productionCost.totalCost.toString())
    }, { status: 201 })

  } catch (error) {
    console.error('Create production cost error:', error)
    return NextResponse.json(
      { error: 'Error al crear costo de producción' },
      { status: 500 }
    )
  }
}

// Endpoint para calcular el costo total de un trabajo de producción
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const body = await request.json()
    const { productionJobId } = body

    if (!productionJobId) {
      return NextResponse.json(
        { error: 'Campo requerido: productionJobId' },
        { status: 400 }
      )
    }

    // Obtener todos los costos de producción para este trabajo
    const productionCosts = await prisma.productionCost.findMany({
      where: { productionJobId },
      include: {
        material: {
          select: {
            name: true,
            unit: true
          }
        }
      }
    })

    // Calcular totales
    const materialCosts = productionCosts.reduce((total, cost) => 
      total + parseFloat(cost.totalCost.toString()), 0
    )

    // Obtener el trabajo de producción para calcular costos de mano de obra
    const productionJob = await prisma.productionJob.findUnique({
      where: { id: productionJobId }
    })

    if (!productionJob) {
      return NextResponse.json(
        { error: 'Trabajo de producción no encontrado' },
        { status: 404 }
      )
    }

    // Calcular costo de mano de obra (ejemplo: S/. 15 por hora)
    const laborCostPerHour = 15.00
    const laborHours = productionJob.actualHours || productionJob.estimatedHours || 0
    const laborCost = parseFloat(laborHours.toString()) * laborCostPerHour

    // Calcular costo total
    const totalCost = materialCosts + laborCost

    // Calcular precio sugerido (ejemplo: margen del 40%)
    const margin = 0.40
    const suggestedPrice = totalCost * (1 + margin)

    return NextResponse.json({
      productionJobId,
      breakdown: {
        materials: {
          cost: materialCosts,
          items: productionCosts.map(cost => ({
            material: cost.material.name,
            quantity: parseFloat(cost.quantity.toString()),
            unit: cost.material.unit,
            unitCost: parseFloat(cost.unitCost.toString()),
            totalCost: parseFloat(cost.totalCost.toString())
          }))
        },
        labor: {
          hours: parseFloat(laborHours.toString()),
          costPerHour: laborCostPerHour,
          totalCost: laborCost
        }
      },
      totals: {
        materialCost: materialCosts,
        laborCost: laborCost,
        totalCost: totalCost,
        suggestedPrice: suggestedPrice,
        margin: margin * 100
      }
    })

  } catch (error) {
    console.error('Calculate production cost error:', error)
    return NextResponse.json(
      { error: 'Error al calcular costos de producción' },
      { status: 500 }
    )
  }
}