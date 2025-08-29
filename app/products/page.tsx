'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils'
import Header from '@/components/layout/header'

interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: string
  images: string[]
  category: {
    name: string
    slug: string
  }
  material?: string
  color?: string
  brand?: string
  isFeatured: boolean
}

interface Category {
  id: string
  name: string
  slug: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 500) // 500ms delay
    
    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    fetchProducts()
  }, [selectedCategory, debouncedSearch])

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedCategory) params.append('category', selectedCategory)
      if (debouncedSearch) params.append('search', debouncedSearch)
      params.append('limit', '20') // Limitar resultados
      
      const response = await fetch(`/api/products?${params}`)
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error('Error fetching products:', error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [selectedCategory, debouncedSearch])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Catálogo de Productos</h1>

        {/* Filtros */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Búsqueda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar productos
              </label>
              <input
                type="text"
                placeholder="Buscar por nombre, material, color..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">Todas las categorías</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Grid de Productos */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-xl text-gray-600">Cargando productos...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.length > 0 ? (
              products.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  {/* Imagen del producto */}
                  <div className="aspect-square bg-gray-200 relative">
                    {product.images.length > 0 ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        📦 Sin imagen
                      </div>
                    )}
                    {product.isFeatured && (
                      <span className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 text-xs rounded">
                        Destacado
                      </span>
                    )}
                  </div>

                  {/* Información del producto */}
                  <div className="p-4">
                    <div className="text-sm text-gray-500 mb-1">
                      {product.category.name}
                    </div>
                    <h3 className="font-semibold mb-2 line-clamp-2">
                      {product.name}
                    </h3>
                    
                    {/* Tags del producto */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {product.material && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 text-xs rounded">
                          {product.material}
                        </span>
                      )}
                      {product.color && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 text-xs rounded">
                          {product.color}
                        </span>
                      )}
                      {product.brand && (
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 text-xs rounded">
                          {product.brand}
                        </span>
                      )}
                    </div>

                    <div className="text-xl font-bold text-blue-600">
                      {formatPrice(product.price)}
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="text-gray-500 mb-4">
                  No se encontraron productos
                </div>
                <Link
                  href="/products"
                  onClick={() => {
                    setSelectedCategory('')
                    setSearchTerm('')
                  }}
                  className="text-blue-600 hover:underline"
                >
                  Ver todos los productos
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}