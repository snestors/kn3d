import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { variantId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const variant = await prisma.productVariant.findUnique({
      where: { id: params.variantId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            sku: true
          }
        }
      }
    })

    if (!variant) {
      return NextResponse.json({ error: 'Variante no encontrada' }, { status: 404 })
    }

    // Convertir campos Decimal a number
    const variantWithConvertedFields = {
      ...variant,
      basePrice: parseFloat(variant.basePrice.toString()),
      comparePrice: variant.comparePrice ? parseFloat(variant.comparePrice.toString()) : null,
      productionTime: variant.productionTime ? parseFloat(variant.productionTime.toString()) : null
    }

    return NextResponse.json(variantWithConvertedFields)

  } catch (error) {
    console.error('Variant API error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { variantId: string } }
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

    // Verificar que la variante existe
    const existingVariant = await prisma.productVariant.findUnique({
      where: { id: params.variantId }
    })

    if (!existingVariant) {
      return NextResponse.json({ error: 'Variante no encontrada' }, { status: 404 })
    }

    // Si esta variante se marca como default, desmarcar otras del mismo producto
    if (isDefault) {
      await prisma.productVariant.updateMany({
        where: { 
          productId: existingVariant.productId,
          isDefault: true,
          id: { not: params.variantId }
        },
        data: { isDefault: false }
      })
    }

    // Preparar datos de actualización
    const updateData: any = {}

    if (name !== undefined) updateData.name = name
    if (color !== undefined) updateData.color = color
    if (material !== undefined) updateData.material = material
    if (basePrice !== undefined) updateData.basePrice = parseFloat(basePrice)
    if (comparePrice !== undefined) updateData.comparePrice = comparePrice ? parseFloat(comparePrice) : null
    if (stock !== undefined) updateData.stock = parseInt(stock)
    if (minStock !== undefined) updateData.minStock = parseInt(minStock)
    if (weight !== undefined) updateData.weight = weight ? parseFloat(weight) : null
    if (dimensions !== undefined) updateData.dimensions = dimensions
    if (images !== undefined) updateData.images = images
    if (productionTime !== undefined) updateData.productionTime = productionTime ? parseFloat(productionTime) : null
    if (materialUsage !== undefined) updateData.materialUsage = materialUsage
    if (printSettings !== undefined) updateData.printSettings = printSettings
    if (isActive !== undefined) updateData.isActive = isActive
    if (isDefault !== undefined) updateData.isDefault = isDefault

    // Actualizar la variante
    const updatedVariant = await prisma.productVariant.update({
      where: { id: params.variantId },
      data: updateData,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            sku: true
          }
        }
      }
    })

    // Convertir campos Decimal a number
    const variantWithConvertedFields = {
      ...updatedVariant,
      basePrice: parseFloat(updatedVariant.basePrice.toString()),
      comparePrice: updatedVariant.comparePrice ? parseFloat(updatedVariant.comparePrice.toString()) : null,
      productionTime: updatedVariant.productionTime ? parseFloat(updatedVariant.productionTime.toString()) : null
    }

    return NextResponse.json(variantWithConvertedFields)

  } catch (error) {
    console.error('Update variant error:', error)
    return NextResponse.json(
      { error: 'Error al actualizar variante' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { variantId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    // Verificar que la variante existe
    const existingVariant = await prisma.productVariant.findUnique({
      where: { id: params.variantId }
    })

    if (!existingVariant) {
      return NextResponse.json({ error: 'Variante no encontrada' }, { status: 404 })
    }

    // No permitir eliminar la variante por defecto si es la única
    if (existingVariant.isDefault) {
      const variantCount = await prisma.productVariant.count({
        where: { 
          productId: existingVariant.productId,
          isActive: true
        }
      })

      if (variantCount === 1) {
        return NextResponse.json(
          { error: 'No se puede eliminar la única variante activa del producto' },
          { status: 400 }
        )
      }
    }

    // Verificar si hay pedidos asociados
    const orderItemsCount = await prisma.orderItemVariant.count({
      where: { variantId: params.variantId }
    })

    if (orderItemsCount > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar una variante con pedidos asociados. Márcala como inactiva.' },
        { status: 400 }
      )
    }

    // Eliminar items del carrito asociados
    await prisma.cartItemVariant.deleteMany({
      where: { variantId: params.variantId }
    })

    // Eliminar la variante
    await prisma.productVariant.delete({
      where: { id: params.variantId }
    })

    // Si era la variante por defecto, marcar otra como default
    if (existingVariant.isDefault) {
      const nextVariant = await prisma.productVariant.findFirst({
        where: { 
          productId: existingVariant.productId,
          isActive: true
        },
        orderBy: { createdAt: 'asc' }
      })

      if (nextVariant) {
        await prisma.productVariant.update({
          where: { id: nextVariant.id },
          data: { isDefault: true }
        })
      }
    }

    return NextResponse.json({ message: 'Variante eliminada exitosamente' })

  } catch (error) {
    console.error('Delete variant error:', error)
    return NextResponse.json(
      { error: 'Error al eliminar variante' },
      { status: 500 }
    )
  }
}