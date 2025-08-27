'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/layout/header'

interface Category {
  id: string
  name: string
  slug: string
  description?: string
  image?: string
  _count?: {
    products: number
  }
  products?: {
    id: string
    name: string
    slug: string
    price: string
    images: string[]
  }[]
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories?includeProducts=true')
      const data = await response.json()
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Explorar Categorías</h1>
        <p className="text-gray-600 mb-8">
          Encuentra exactamente lo que necesitas para tus proyectos de impresión 3D
        </p>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-xl text-gray-600">Cargando categorías...</div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((category) => (
              <div key={category.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {/* Imagen de la categoría */}
                <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 relative">
                  {category.image ? (
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-white text-6xl">
                        {category.name === 'Filamentos' && '🧵'}
                        {category.name === 'Resinas' && '🧪'}
                        {category.name === 'Impresoras 3D' && '🖨️'}
                        {category.name === 'Accesorios' && '🔧'}
                        {!['Filamentos', 'Resinas', 'Impresoras 3D', 'Accesorios'].includes(category.name) && '📦'}
                      </div>
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-white/90 px-3 py-1 rounded-full text-sm font-medium">
                    {category._count?.products || 0} productos
                  </div>
                </div>

                <div className="p-6">
                  <h2 className="text-xl font-bold mb-2">{category.name}</h2>
                  {category.description && (
                    <p className="text-gray-600 mb-4">{category.description}</p>
                  )}

                  {/* Productos destacados de la categoría */}
                  {category.products && category.products.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Productos destacados:</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {category.products.slice(0, 4).map((product) => (
                          <Link
                            key={product.id}
                            href={`/products/${product.slug}`}
                            className="group"
                          >
                            <div className="bg-gray-100 rounded p-2 group-hover:bg-gray-200 transition-colors">
                              <div className="text-xs font-medium line-clamp-2 mb-1">
                                {product.name}
                              </div>
                              <div className="text-xs font-bold text-blue-600">
                                S/ {parseFloat(product.price).toFixed(2)}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  <Link
                    href={`/products?category=${category.slug}`}
                    className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Ver todos los productos
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && categories.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              No hay categorías disponibles
            </div>
            <Link
              href="/products"
              className="text-blue-600 hover:underline"
            >
              Ver todos los productos
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}