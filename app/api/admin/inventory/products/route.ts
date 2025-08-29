import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function getStockStatus(stock: number, minStock: number) {
  if (stock === 0) return 'critical'
  if (stock <= minStock) return 'low'
  if (stock > minStock * 3) return 'overstock' // Consideramos sobrestock si es 3x el mínimo
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
    const category = searchParams.get('category')

    let where: any = {
      isActive: true
    }

    if (category) {
      where.category = {
        slug: category
      }
    }

    // Obtener productos con información de inventario
    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        sku: true,
        stock: true,
        minStock: true,
        price: true,
        material: true,
        color: true,
        brand: true,
        isActive: true,
        category: {
          select: {
            name: true,
            slug: true
          }
        },
        _count: {
          select: {
            orderItems: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Calcular estado de stock y agregar información adicional
    const productsWithStatus = products.map(product => ({
      ...product,
      price: parseFloat(product.price.toString()),
      stockStatus: getStockStatus(
        product.stock, 
        product.minStock
      ),
      totalSales: product._count.orderItems,
      stockValue: product.stock * parseFloat(product.price.toString())
    }))

    // Filtrar por estado si se especifica
    let filteredProducts = productsWithStatus
    if (status && status !== 'all') {
      filteredProducts = productsWithStatus.filter(p => p.stockStatus === status)
    }

    return NextResponse.json(filteredProducts)

  } catch (error) {
    console.error('Inventory API error:', error)
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
    const { productId, adjustment, reason, type } = body

    // Validar datos
    if (!productId || typeof adjustment !== 'number') {
      return NextResponse.json(
        { error: 'Datos requeridos: productId, adjustment' },
        { status: 400 }
      )
    }

    // Obtener producto actual
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { stock: true, name: true }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    const newStock = Math.max(0, product.stock + adjustment)

    // Actualizar stock del producto
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { stock: newStock },
      include: {
        category: {
          select: { name: true, slug: true }
        }
      }
    })

    // Registrar movimiento de inventario (opcional - crear tabla si es necesario)
    // await prisma.inventoryMovement.create({
    //   data: {
    //     productId,
    //     type: type || (adjustment > 0 ? 'IN' : 'OUT'),
    //     quantity: Math.abs(adjustment),
    //     previousStock: product.stock,
    //     newStock,
    //     reason: reason || 'Ajuste manual',
    //     createdBy: session.user.id
    //   }
    // })

    return NextResponse.json({
      ...updatedProduct,
      price: parseFloat(updatedProduct.price.toString()),
      stockStatus: getStockStatus(
        updatedProduct.stock, 
        updatedProduct.minStock
      )
    })

  } catch (error) {
    console.error('Inventory adjustment error:', error)
    return NextResponse.json(
      { error: 'Error al ajustar inventario' },
      { status: 500 }
    )
  }
}