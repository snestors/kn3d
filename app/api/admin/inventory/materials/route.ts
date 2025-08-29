import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function getStockStatus(stock: number, minStock: number, maxStock?: number | null) {
  if (stock === 0) return 'critical'
  if (stock <= minStock) return 'low'
  if (maxStock && stock > maxStock) return 'overstock'
  return 'normal'
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    let where: any = {}

    if (type) {
      where.type = type
    }

    // Obtener materiales
    const materials = await prisma.material.findMany({
      where,
      select: {
        id: true,
        name: true,
        type: true,
        stock: true,
        minStock: true,
        maxStock: true,
        unit: true,
        costPerUnit: true,
        supplier: true,
        location: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Calcular estado de stock y agregar información adicional
    const materialsWithStatus = materials.map(material => ({
      ...material,
      stock: parseFloat(material.stock.toString()),
      minStock: parseFloat(material.minStock.toString()),
      maxStock: material.maxStock ? parseFloat(material.maxStock.toString()) : null,
      costPerUnit: parseFloat(material.costPerUnit.toString()),
      stockStatus: getStockStatus(
        parseFloat(material.stock.toString()), 
        parseFloat(material.minStock.toString()), 
        material.maxStock ? parseFloat(material.maxStock.toString()) : null
      ),
      stockValue: parseFloat(material.stock.toString()) * parseFloat(material.costPerUnit.toString()),
      daysOfStock: material.minStock > 0 
        ? Math.floor(parseFloat(material.stock.toString()) / parseFloat(material.minStock.toString()) * 30)
        : null
    }))

    // Filtrar por estado si se especifica
    let filteredMaterials = materialsWithStatus
    if (status && status !== 'all') {
      filteredMaterials = materialsWithStatus.filter(m => m.stockStatus === status)
    }

    return NextResponse.json(filteredMaterials)

  } catch (error) {
    console.error('Materials inventory API error:', error)
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
    
    // Crear nuevo material
    if (body.action === 'create') {
      const { name, type, stock, minStock, maxStock, unit, costPerUnit, supplier, location } = body

      if (!name || !type || !stock || !minStock || !unit || !costPerUnit) {
        return NextResponse.json(
          { error: 'Campos requeridos: name, type, stock, minStock, unit, costPerUnit' },
          { status: 400 }
        )
      }

      const material = await prisma.material.create({
        data: {
          name,
          type,
          stock: parseFloat(stock),
          minStock: parseFloat(minStock),
          maxStock: maxStock ? parseFloat(maxStock) : null,
          unit,
          costPerUnit: parseFloat(costPerUnit),
          supplier: supplier || null,
          location: location || null
        }
      })

      return NextResponse.json({
        ...material,
        stock: parseFloat(material.stock.toString()),
        minStock: parseFloat(material.minStock.toString()),
        maxStock: material.maxStock ? parseFloat(material.maxStock.toString()) : null,
        costPerUnit: parseFloat(material.costPerUnit.toString()),
        stockStatus: getStockStatus(
          parseFloat(material.stock.toString()), 
          parseFloat(material.minStock.toString()), 
          material.maxStock ? parseFloat(material.maxStock.toString()) : null
        )
      }, { status: 201 })
    }

    // Ajustar stock de material
    if (body.action === 'adjust') {
      const { materialId, adjustment, reason, type } = body

      if (!materialId || typeof adjustment !== 'number') {
        return NextResponse.json(
          { error: 'Datos requeridos: materialId, adjustment' },
          { status: 400 }
        )
      }

      const material = await prisma.material.findUnique({
        where: { id: materialId }
      })

      if (!material) {
        return NextResponse.json(
          { error: 'Material no encontrado' },
          { status: 404 }
        )
      }

      const currentStock = parseFloat(material.stock.toString())
      const newStock = Math.max(0, currentStock + adjustment)

      const updatedMaterial = await prisma.material.update({
        where: { id: materialId },
        data: { stock: newStock }
      })

      return NextResponse.json({
        ...updatedMaterial,
        stock: parseFloat(updatedMaterial.stock.toString()),
        minStock: parseFloat(updatedMaterial.minStock.toString()),
        maxStock: updatedMaterial.maxStock ? parseFloat(updatedMaterial.maxStock.toString()) : null,
        costPerUnit: parseFloat(updatedMaterial.costPerUnit.toString()),
        stockStatus: getStockStatus(
          newStock, 
          parseFloat(updatedMaterial.minStock.toString()), 
          updatedMaterial.maxStock ? parseFloat(updatedMaterial.maxStock.toString()) : null
        )
      })
    }

    return NextResponse.json(
      { error: 'Acción no válida' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Materials API error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}