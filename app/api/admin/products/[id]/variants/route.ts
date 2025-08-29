import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    let where: any = { productId: params.id }
    if (!includeInactive) {
      where.isActive = true
    }

    const variants = await prisma.productVariant.findMany({
      where,
      orderBy: [
        { isDefault: 'desc' },
        { color: 'asc' },
        { material: 'asc' }
      ]
    })

    // Convertir campos Decimal a number
    const variantsWithConvertedFields = variants.map(variant => ({
      ...variant,
      basePrice: parseFloat(variant.basePrice.toString()),
      comparePrice: variant.comparePrice ? parseFloat(variant.comparePrice.toString()) : null,
      productionTime: variant.productionTime ? parseFloat(variant.productionTime.toString()) : null
    }))

    return NextResponse.json(variantsWithConvertedFields)

  } catch (error) {
    console.error('Product variants API error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      name,
      color,
      material,
      basePrice,
      comparePrice,
      stock,
      minStock,
      weight,
      dimensions,
      images,
      productionTime,
      materialUsage,
      printSettings,
      isActive,
      isDefault
    } = body

    // Validar campos requeridos
    if (!name || !color || !basePrice) {
      return NextResponse.json(
        { error: 'Campos requeridos: name, color, basePrice' },
        { status: 400 }
      )
    }

    // Verificar que el producto existe
    const product = await prisma.product.findUnique({
      where: { id: params.id }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    // Si esta variante se marca como default, desmarcar otras
    if (isDefault) {
      await prisma.productVariant.updateMany({
        where: { 
          productId: params.id,
          isDefault: true
        },
        data: { isDefault: false }
      })
    }

    // Crear la variante
    const variant = await prisma.productVariant.create({
      data: {
        productId: params.id,
        name,
        color,
        material: material || null,
        basePrice: parseFloat(basePrice),
        comparePrice: comparePrice ? parseFloat(comparePrice) : null,
        stock: parseInt(stock || '0'),
        minStock: parseInt(minStock || '5'),
        weight: weight ? parseFloat(weight) : null,
        dimensions: dimensions || null,
        images: images || [],
        productionTime: productionTime ? parseFloat(productionTime) : null,
        materialUsage: materialUsage || null,
        printSettings: printSettings || null,
        isActive: isActive !== undefined ? isActive : true,
        isDefault: isDefault || false
      }
    })

    // Convertir campos Decimal a number
    const variantWithConvertedFields = {
      ...variant,
      basePrice: parseFloat(variant.basePrice.toString()),
      comparePrice: variant.comparePrice ? parseFloat(variant.comparePrice.toString()) : null,
      productionTime: variant.productionTime ? parseFloat(variant.productionTime.toString()) : null
    }

    return NextResponse.json(variantWithConvertedFields, { status: 201 })

  } catch (error) {
    console.error('Create variant error:', error)
    return NextResponse.json(
      { error: 'Error al crear variante' },
      { status: 500 }
    )
  }
}