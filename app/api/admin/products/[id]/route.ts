import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No tienes permisos para realizar esta acción' },
        { status: 403 }
      )
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    // Transform the data to ensure numeric types
    const transformedProduct = {
      ...product,
      price: parseFloat(product.price.toString()),
      comparePrice: product.comparePrice ? parseFloat(product.comparePrice.toString()) : null,
      weight: product.weight ? parseFloat(product.weight.toString()) : null
    }

    return NextResponse.json(transformedProduct)
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No tienes permisos para realizar esta acción' },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // Verificar si el producto existe
    const existingProduct = await prisma.product.findUnique({
      where: { id: id }
    })

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    // Si se está actualizando el SKU, verificar que no exista otro producto con ese SKU
    if (body.sku && body.sku !== existingProduct.sku) {
      const existingSku = await prisma.product.findUnique({
        where: { sku: body.sku }
      })

      if (existingSku) {
        return NextResponse.json(
          { error: 'Ya existe un producto con ese SKU' },
          { status: 400 }
        )
      }
    }

    // Si se está actualizando el nombre, regenerar el slug si es necesario
    let slug = existingProduct.slug
    if (body.name && body.name !== existingProduct.name) {
      const baseSlug = body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      
      slug = baseSlug
      let counter = 1
      
      while (await prisma.product.findFirst({ 
        where: { 
          slug: slug,
          id: { not: id }
        } 
      })) {
        slug = `${baseSlug}-${counter}`
        counter++
      }
    }

    const updateData: any = { ...body }
    
    // Procesar campos numéricos
    if (updateData.price) updateData.price = parseFloat(updateData.price)
    if (updateData.comparePrice !== undefined) {
      updateData.comparePrice = updateData.comparePrice === '' || updateData.comparePrice === null 
        ? null 
        : parseFloat(updateData.comparePrice)
    }
    if (updateData.stock !== undefined) updateData.stock = parseInt(updateData.stock)
    if (updateData.minStock !== undefined) updateData.minStock = parseInt(updateData.minStock)
    if (updateData.weight !== undefined) {
      updateData.weight = updateData.weight === '' || updateData.weight === null 
        ? null 
        : parseFloat(updateData.weight)
    }
    
    // Procesar campos booleanos
    if (updateData.isActive !== undefined) updateData.isActive = Boolean(updateData.isActive)
    if (updateData.isFeatured !== undefined) updateData.isFeatured = Boolean(updateData.isFeatured)
    
    // Actualizar slug si cambió
    updateData.slug = slug

    const product = await prisma.product.update({
      where: { id: id },
      data: updateData,
      include: {
        category: {
          select: {
            name: true
          }
        }
      }
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Error al actualizar el producto' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No tienes permisos para realizar esta acción' },
        { status: 403 }
      )
    }

    // Verificar si el producto existe
    const existingProduct = await prisma.product.findUnique({
      where: { id: id }
    })

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    // Verificar si el producto tiene pedidos asociados
    const ordersWithProduct = await prisma.orderItem.findFirst({
      where: { productId: id }
    })

    if (ordersWithProduct) {
      return NextResponse.json(
        { error: 'No se puede eliminar un producto que tiene pedidos asociados' },
        { status: 400 }
      )
    }

    // Verificar si el producto tiene items en carritos
    const cartItemsWithProduct = await prisma.cartItem.findFirst({
      where: { productId: id }
    })

    if (cartItemsWithProduct) {
      // Eliminar items del carrito primero
      await prisma.cartItem.deleteMany({
        where: { productId: id }
      })
    }

    // Eliminar el producto
    await prisma.product.delete({
      where: { id: id }
    })

    return NextResponse.json({ message: 'Producto eliminado correctamente' })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Error al eliminar el producto' },
      { status: 500 }
    )
  }
}