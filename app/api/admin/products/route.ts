import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No tienes permisos para realizar esta acción' },
        { status: 403 }
      )
    }

    const products = await prisma.product.findMany({
      include: {
        category: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // Transform the data to ensure numeric types
    const transformedProducts = products.map(product => ({
      ...product,
      price: parseFloat(product.price.toString()),
      comparePrice: product.comparePrice ? parseFloat(product.comparePrice.toString()) : null,
      weight: product.weight ? parseFloat(product.weight.toString()) : null
    }))

    return NextResponse.json(transformedProducts)
  } catch (error) {
    console.error('Error fetching admin products:', error)
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
      return NextResponse.json(
        { error: 'No tienes permisos para realizar esta acción' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      name,
      description,
      price,
      comparePrice,
      stock,
      minStock,
      sku,
      barcode,
      weight,
      dimensions,
      images,
      tags,
      isActive,
      isFeatured,
      categoryId,
      material,
      color,
      brand,
      diameter,
      printTemp,
      bedTemp
    } = body

    // Verificar si el SKU ya existe
    const existingSku = await prisma.product.findUnique({
      where: { sku }
    })

    if (existingSku) {
      return NextResponse.json(
        { error: 'Ya existe un producto con ese SKU' },
        { status: 400 }
      )
    }

    // Generar slug único basado en el nombre
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    
    let slug = baseSlug
    let counter = 1
    
    while (await prisma.product.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        price: parseFloat(price),
        comparePrice: comparePrice === '' || comparePrice === null ? null : parseFloat(comparePrice),
        stock: parseInt(stock),
        minStock: parseInt(minStock) || 5,
        sku,
        barcode,
        weight: weight === '' || weight === null ? null : parseFloat(weight),
        dimensions,
        images: images || [],
        tags: tags || [],
        isActive: Boolean(isActive),
        isFeatured: Boolean(isFeatured),
        categoryId,
        material,
        color,
        brand,
        diameter,
        printTemp,
        bedTemp
      },
      include: {
        category: {
          select: {
            name: true
          }
        }
      }
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Error al crear el producto' },
      { status: 500 }
    )
  }
}