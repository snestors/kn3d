import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cache } from '@/lib/cache'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 50) // Max 50 items
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const material = searchParams.get('material')
    const color = searchParams.get('color')
    const brand = searchParams.get('brand')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const featured = searchParams.get('featured')

    const skip = (page - 1) * limit
    
    // Cache key based on all parameters
    const cacheKey = `products-${JSON.stringify({ page, limit, category, search, material, color, brand, minPrice, maxPrice, featured })}`
    
    // Intentar obtener del cache (solo si no hay búsqueda)
    if (!search || search.length < 2) {
      const cachedResult = cache.get(cacheKey)
      if (cachedResult) {
        return NextResponse.json(cachedResult)
      }
    }

    // Construir filtros
    const where: any = {
      isActive: true
    }

    if (category) {
      where.category = {
        slug: category
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search] } }
      ]
    }

    if (material) where.material = material
    if (color) where.color = color
    if (brand) where.brand = brand
    if (featured) where.isFeatured = featured === 'true'

    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = parseFloat(minPrice)
      if (maxPrice) where.price.lte = parseFloat(maxPrice)
    }

    // Obtener productos con paginación optimizada
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          comparePrice: true,
          stock: true,
          images: true,
          isFeatured: true,
          isActive: true,
          material: true,
          color: true,
          brand: true,
          category: {
            select: {
              name: true,
              slug: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.product.count({ where })
    ])

    const result = {
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
    
    // Guardar en cache por 5 minutos (solo si no hay búsqueda)
    if (!search || search.length < 2) {
      cache.set(cacheKey, result, 5 * 60 * 1000)
    }
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validación básica
    if (!body.name || !body.price || !body.categoryId) {
      return NextResponse.json(
        { error: 'Campos requeridos: name, price, categoryId' },
        { status: 400 }
      )
    }

    const product = await prisma.product.create({
      data: {
        ...body,
        slug: body.slug || body.name.toLowerCase().replace(/\s+/g, '-'),
        price: parseFloat(body.price)
      },
      include: {
        category: true
      }
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}