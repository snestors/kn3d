import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cache } from '@/lib/cache'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeProducts = searchParams.get('includeProducts') === 'true'
    const cacheKey = `categories-${includeProducts}`

    // Intentar obtener del cache
    const cachedCategories = cache.get(cacheKey)
    if (cachedCategories) {
      return NextResponse.json(cachedCategories)
    }

    const categories = await prisma.category.findMany({
      include: {
        _count: includeProducts ? {
          select: { products: { where: { isActive: true } } }
        } : undefined,
        products: includeProducts ? {
          where: { isActive: true },
          take: 4,
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            images: true
          }
        } : undefined,
        parent: {
          select: {
            name: true,
            slug: true
          }
        },
        children: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Guardar en cache por 15 minutos
    cache.set(cacheKey, categories, 15 * 60 * 1000)
    
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.name) {
      return NextResponse.json(
        { error: 'El nombre es requerido' },
        { status: 400 }
      )
    }

    const category = await prisma.category.create({
      data: {
        ...body,
        slug: body.slug || body.name.toLowerCase().replace(/\s+/g, '-')
      }
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}