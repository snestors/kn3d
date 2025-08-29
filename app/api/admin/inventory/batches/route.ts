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
    const showExpired = searchParams.get('showExpired') === 'true'

    let where: any = {}

    if (materialId) {
      where.materialId = materialId
    }

    if (!showExpired) {
      where.isActive = true
    }

    const batches = await prisma.materialBatch.findMany({
      where,
      include: {
        material: {
          select: {
            id: true,
            name: true,
            unit: true,
            type: true
          }
        }
      },
      orderBy: [
        { isActive: 'desc' },
        { purchaseDate: 'desc' }
      ]
    })

    // Convertir campos Decimal a number y calcular estado
    const batchesWithStatus = batches.map(batch => {
      const originalQty = parseFloat(batch.originalQty.toString())
      const currentQty = parseFloat(batch.currentQty.toString())
      const unitCost = parseFloat(batch.unitCost.toString())
      const totalCost = parseFloat(batch.totalCost.toString())

      const usagePercentage = originalQty > 0 ? ((originalQty - currentQty) / originalQty) * 100 : 0
      const isExpired = batch.expiryDate && batch.expiryDate < new Date()
      const isNearExpiry = batch.expiryDate && 
        batch.expiryDate > new Date() && 
        batch.expiryDate < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días

      let status = 'active'
      if (!batch.isActive) status = 'inactive'
      else if (isExpired) status = 'expired'
      else if (isNearExpiry) status = 'near_expiry'
      else if (currentQty <= 0) status = 'depleted'

      return {
        ...batch,
        originalQty,
        currentQty,
        unitCost,
        totalCost,
        usagePercentage: Math.round(usagePercentage * 100) / 100,
        status,
        daysUntilExpiry: batch.expiryDate ? 
          Math.ceil((batch.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null
      }
    })

    return NextResponse.json(batchesWithStatus)

  } catch (error) {
    console.error('Batches API error:', error)
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
      materialId, 
      purchaseDate, 
      supplier, 
      invoiceNumber,
      originalQty, 
      unitCost, 
      expiryDate 
    } = body

    // Validar campos requeridos
    if (!materialId || !purchaseDate || !originalQty || !unitCost) {
      return NextResponse.json(
        { error: 'Campos requeridos: materialId, purchaseDate, originalQty, unitCost' },
        { status: 400 }
      )
    }

    // Verificar que el material existe
    const material = await prisma.material.findUnique({
      where: { id: materialId }
    })

    if (!material) {
      return NextResponse.json(
        { error: 'Material no encontrado' },
        { status: 404 }
      )
    }

    // Generar número de lote único
    const batchCount = await prisma.materialBatch.count()
    const batchNumber = `BATCH-${String(batchCount + 1).padStart(6, '0')}`

    // Calcular costo total
    const qty = parseFloat(originalQty)
    const cost = parseFloat(unitCost)
    const totalCost = qty * cost

    // Crear el lote
    const batch = await prisma.materialBatch.create({
      data: {
        materialId,
        batchNumber,
        purchaseDate: new Date(purchaseDate),
        supplier: supplier || null,
        invoiceNumber: invoiceNumber || null,
        originalQty: qty,
        currentQty: qty, // Inicialmente igual a la cantidad original
        unitCost: cost,
        totalCost: totalCost,
        expiryDate: expiryDate ? new Date(expiryDate) : null
      },
      include: {
        material: {
          select: {
            id: true,
            name: true,
            unit: true,
            type: true
          }
        }
      }
    })

    // Actualizar el stock del material
    await prisma.material.update({
      where: { id: materialId },
      data: {
        stock: {
          increment: qty
        }
      }
    })

    // Crear movimiento de inventario
    const movementCount = await prisma.inventoryMovement.count()
    const movementNumber = `MOV-${String(movementCount + 1).padStart(8, '0')}`

    await prisma.inventoryMovement.create({
      data: {
        movementNumber,
        type: 'PURCHASE',
        reference: invoiceNumber || `Lote ${batchNumber}`,
        materialId,
        batchId: batch.id,
        quantity: qty,
        unitCost: cost,
        totalCost: totalCost,
        stockAfter: parseFloat(material.stock.toString()) + qty,
        notes: `Compra de material - Lote ${batchNumber}`,
        movementDate: new Date(purchaseDate)
      }
    })

    return NextResponse.json({
      ...batch,
      originalQty: parseFloat(batch.originalQty.toString()),
      currentQty: parseFloat(batch.currentQty.toString()),
      unitCost: parseFloat(batch.unitCost.toString()),
      totalCost: parseFloat(batch.totalCost.toString())
    }, { status: 201 })

  } catch (error) {
    console.error('Create batch error:', error)
    return NextResponse.json(
      { error: 'Error al crear lote de material' },
      { status: 500 }
    )
  }
}