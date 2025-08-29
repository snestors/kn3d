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
    const materialId = searchParams.get('materialId')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit

    let where: any = {}

    if (materialId) {
      where.materialId = materialId
    }

    if (type) {
      where.type = type
    }

    const [movements, total] = await Promise.all([
      prisma.inventoryMovement.findMany({
        where,
        include: {
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
          },
          productionJob: {
            select: {
              id: true,
              jobNumber: true,
              name: true
            }
          }
        },
        orderBy: {
          movementDate: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.inventoryMovement.count({ where })
    ])

    // Convertir campos Decimal y agregar información adicional
    const movementsWithDetails = movements.map(movement => ({
      ...movement,
      quantity: parseFloat(movement.quantity.toString()),
      unitCost: movement.unitCost ? parseFloat(movement.unitCost.toString()) : null,
      totalCost: movement.totalCost ? parseFloat(movement.totalCost.toString()) : null,
      stockAfter: parseFloat(movement.stockAfter.toString()),
      typeText: getMovementTypeText(movement.type),
      impact: getMovementImpact(movement.type)
    }))

    return NextResponse.json({
      movements: movementsWithDetails,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Movements API error:', error)
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
      type, 
      materialId, 
      batchId, 
      quantity, 
      reference, 
      notes,
      productionJobId 
    } = body

    // Validar campos requeridos
    if (!type || !materialId || !quantity) {
      return NextResponse.json(
        { error: 'Campos requeridos: type, materialId, quantity' },
        { status: 400 }
      )
    }

    // Obtener material actual
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
    const currentStock = parseFloat(material.stock.toString())
    
    // Calcular nuevo stock según el tipo de movimiento
    let newStock = currentStock
    let unitCost = null
    let totalCost = null

    switch (type) {
      case 'CONSUMPTION':
      case 'WASTE':
        if (currentStock < qty) {
          return NextResponse.json(
            { error: 'Stock insuficiente para el movimiento' },
            { status: 400 }
          )
        }
        newStock = currentStock - qty
        break
      
      case 'PURCHASE':
      case 'RETURN':
        newStock = currentStock + qty
        break
      
      case 'ADJUSTMENT':
        // Para ajustes, la cantidad puede ser positiva o negativa
        newStock = Math.max(0, currentStock + qty)
        break
      
      default:
        newStock = currentStock
    }

    // Si hay un lote específico, obtener el costo unitario
    if (batchId) {
      const batch = await prisma.materialBatch.findUnique({
        where: { id: batchId }
      })
      
      if (batch) {
        unitCost = parseFloat(batch.unitCost.toString())
        totalCost = Math.abs(qty) * unitCost
        
        // Actualizar cantidad del lote para consumos
        if (type === 'CONSUMPTION' || type === 'WASTE') {
          const currentBatchQty = parseFloat(batch.currentQty.toString())
          const newBatchQty = Math.max(0, currentBatchQty - Math.abs(qty))
          
          await prisma.materialBatch.update({
            where: { id: batchId },
            data: { currentQty: newBatchQty }
          })
        }
      }
    } else {
      // Si no hay lote específico, usar el costo promedio del material
      unitCost = parseFloat(material.costPerUnit.toString())
      totalCost = Math.abs(qty) * unitCost
    }

    // Generar número de movimiento único
    const movementCount = await prisma.inventoryMovement.count()
    const movementNumber = `MOV-${String(movementCount + 1).padStart(8, '0')}`

    // Crear el movimiento
    const movement = await prisma.inventoryMovement.create({
      data: {
        movementNumber,
        type,
        reference: reference || null,
        materialId,
        batchId: batchId || null,
        quantity: qty,
        unitCost,
        totalCost,
        stockAfter: newStock,
        notes: notes || null,
        createdBy: session.user.id,
        productionJobId: productionJobId || null
      },
      include: {
        material: {
          select: {
            id: true,
            name: true,
            unit: true
          }
        },
        batch: {
          select: {
            id: true,
            batchNumber: true
          }
        },
        productionJob: {
          select: {
            id: true,
            jobNumber: true,
            name: true
          }
        }
      }
    })

    // Actualizar el stock del material
    await prisma.material.update({
      where: { id: materialId },
      data: { stock: newStock }
    })

    return NextResponse.json({
      ...movement,
      quantity: parseFloat(movement.quantity.toString()),
      unitCost: movement.unitCost ? parseFloat(movement.unitCost.toString()) : null,
      totalCost: movement.totalCost ? parseFloat(movement.totalCost.toString()) : null,
      stockAfter: parseFloat(movement.stockAfter.toString())
    }, { status: 201 })

  } catch (error) {
    console.error('Create movement error:', error)
    return NextResponse.json(
      { error: 'Error al crear movimiento de inventario' },
      { status: 500 }
    )
  }
}

function getMovementTypeText(type: string): string {
  const types: Record<string, string> = {
    'PURCHASE': 'Compra',
    'CONSUMPTION': 'Consumo',
    'ADJUSTMENT': 'Ajuste',
    'TRANSFER': 'Transferencia',
    'WASTE': 'Desperdicio',
    'RETURN': 'Devolución'
  }
  return types[type] || type
}

function getMovementImpact(type: string): 'positive' | 'negative' | 'neutral' {
  switch (type) {
    case 'PURCHASE':
    case 'RETURN':
      return 'positive'
    case 'CONSUMPTION':
    case 'WASTE':
      return 'negative'
    default:
      return 'neutral'
  }
}