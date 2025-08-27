'use client'

import Link from 'next/link'
import Header from '@/components/layout/header'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary/10 to-primary/5 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Bienvenido a KN3D
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Tu tienda especializada en impresión 3D. Encuentra los mejores filamentos, 
            resinas, impresoras y accesorios para tus proyectos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/products" 
              className="bg-primary text-primary-foreground px-8 py-3 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Ver Productos
            </Link>
            <Link 
              href="/categories" 
              className="border border-primary text-primary px-8 py-3 rounded-lg hover:bg-primary/10 transition-colors"
            >
              Explorar Categorías
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">¿Por qué elegir KN3D?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold mb-3">Calidad Premium</h3>
              <p className="text-muted-foreground">
                Seleccionamos cuidadosamente los mejores materiales y equipos 
                para garantizar resultados excepcionales.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold mb-3">Envío Rápido</h3>
              <p className="text-muted-foreground">
                Despacho en 24-48 horas. Envío gratuito en compras superiores a $100.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl mb-4">🛠️</div>
              <h3 className="text-xl font-semibold mb-3">Soporte Técnico</h3>
              <p className="text-muted-foreground">
                Nuestro equipo de expertos está aquí para ayudarte con 
                cualquier consulta técnica.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="bg-muted py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Categorías Populares</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { name: 'Filamentos PLA', icon: '🧵', href: '/products?category=filamentos&material=PLA' },
              { name: 'Resinas', icon: '🧪', href: '/products?category=resinas' },
              { name: 'Impresoras', icon: '🖨️', href: '/products?category=impresoras' },
              { name: 'Accesorios', icon: '🔧', href: '/products?category=accesorios' },
            ].map((category) => (
              <Link
                key={category.name}
                href={category.href}
                className="bg-card p-6 rounded-lg hover:shadow-lg transition-shadow text-center group"
              >
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
                  {category.icon}
                </div>
                <h3 className="font-semibold">{category.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-semibold mb-4">KN3D</h3>
              <p className="text-muted-foreground text-sm">
                Tu partner confiable en impresión 3D. Calidad, innovación y soporte técnico especializado.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Productos</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/products?category=filamentos">Filamentos</Link></li>
                <li><Link href="/products?category=resinas">Resinas</Link></li>
                <li><Link href="/products?category=impresoras">Impresoras</Link></li>
                <li><Link href="/products?category=accesorios">Accesorios</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about">Acerca de nosotros</Link></li>
                <li><Link href="/contact">Contacto</Link></li>
                <li><Link href="/shipping">Envíos</Link></li>
                <li><Link href="/returns">Devoluciones</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Soporte</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/help">Centro de ayuda</Link></li>
                <li><Link href="/guides">Guías técnicas</Link></li>
                <li><Link href="/warranty">Garantía</Link></li>
                <li><Link href="/privacy">Privacidad</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-muted-foreground text-sm">
            <p>&copy; 2024 KN3D. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}