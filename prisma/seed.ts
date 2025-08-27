import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Crear categorías iniciales
  const filamentCategory = await prisma.category.upsert({
    where: { slug: 'filamentos' },
    update: {},
    create: {
      name: 'Filamentos',
      slug: 'filamentos',
      description: 'Filamentos para impresión FDM',
    },
  })

  const resinCategory = await prisma.category.upsert({
    where: { slug: 'resinas' },
    update: {},
    create: {
      name: 'Resinas',
      slug: 'resinas',
      description: 'Resinas para impresión SLA/LCD',
    },
  })

  const printersCategory = await prisma.category.upsert({
    where: { slug: 'impresoras' },
    update: {},
    create: {
      name: 'Impresoras 3D',
      slug: 'impresoras',
      description: 'Impresoras 3D FDM y SLA',
    },
  })

  const accessoriesCategory = await prisma.category.upsert({
    where: { slug: 'accesorios' },
    update: {},
    create: {
      name: 'Accesorios',
      slug: 'accesorios',
      description: 'Accesorios y herramientas para impresión 3D',
    },
  })

  // Crear usuario administrador
  const hashedPassword = await bcrypt.hash('admin123', 12)
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@kn3d.com' },
    update: {},
    create: {
      email: 'admin@kn3d.com',
      name: 'KN3D Admin',
      password: hashedPassword,
      role: 'ADMIN',
      emailVerified: new Date(),
      phone: '+51 999 999 999',
    },
  })

  // Crear productos de ejemplo
  await prisma.product.createMany({
    data: [
      {
        name: 'Filamento PLA Blanco 1.75mm',
        slug: 'filamento-pla-blanco-175mm',
        description: 'Filamento PLA de alta calidad, ideal para principiantes. Fácil de imprimir y biodegradable.',
        price: 89.99,
        stock: 50,
        sku: 'FIL-PLA-WHT-175',
        categoryId: filamentCategory.id,
        material: 'PLA',
        color: 'Blanco',
        brand: 'KN3D Premium',
        diameter: '1.75mm',
        printTemp: '200-220°C',
        bedTemp: '60°C',
        tags: ['PLA', 'blanco', 'principiante', 'biodegradable'],
        isFeatured: true,
        images: [],
      },
      {
        name: 'Filamento PLA Negro 1.75mm',
        slug: 'filamento-pla-negro-175mm',
        description: 'Filamento PLA negro mate, perfecto para prototipos y piezas finales.',
        price: 89.99,
        stock: 45,
        sku: 'FIL-PLA-BLK-175',
        categoryId: filamentCategory.id,
        material: 'PLA',
        color: 'Negro',
        brand: 'KN3D Premium',
        diameter: '1.75mm',
        printTemp: '200-220°C',
        bedTemp: '60°C',
        tags: ['PLA', 'negro', 'mate'],
        images: [],
      },
      {
        name: 'Filamento ABS Azul 1.75mm',
        slug: 'filamento-abs-azul-175mm',
        description: 'Filamento ABS resistente, ideal para piezas mecánicas que requieren durabilidad.',
        price: 109.99,
        stock: 30,
        sku: 'FIL-ABS-BLU-175',
        categoryId: filamentCategory.id,
        material: 'ABS',
        color: 'Azul',
        brand: 'KN3D Premium',
        diameter: '1.75mm',
        printTemp: '240-260°C',
        bedTemp: '80-100°C',
        tags: ['ABS', 'azul', 'resistente', 'mecánico'],
        images: [],
      },
      {
        name: 'Resina Standard Gris 1L',
        slug: 'resina-standard-gris-1l',
        description: 'Resina estándar para impresión LCD/SLA, excelente detalle y acabado.',
        price: 169.99,
        stock: 25,
        sku: 'RES-STD-GRY-1L',
        categoryId: resinCategory.id,
        material: 'Resina Standard',
        color: 'Gris',
        brand: 'KN3D Resin',
        tags: ['resina', 'gris', 'detalle', 'SLA', 'LCD'],
        images: [],
      },
      {
        name: 'Impresora 3D KN3D Pro',
        slug: 'impresora-3d-kn3d-pro',
        description: 'Impresora 3D FDM de alta precisión con cama caliente y detección de filamento.',
        price: 1199.99,
        stock: 10,
        sku: 'IMP-KN3D-PRO',
        categoryId: printersCategory.id,
        brand: 'KN3D',
        dimensions: {
          length: 35,
          width: 35,
          height: 40
        },
        weight: 8.5,
        tags: ['impresora', 'FDM', 'cama caliente', 'sensor filamento'],
        isFeatured: true,
        images: [],
      },
      {
        name: 'Kit de Herramientas para Impresión 3D',
        slug: 'kit-herramientas-impresion-3d',
        description: 'Kit completo con todas las herramientas necesarias para impresión 3D.',
        price: 69.99,
        stock: 35,
        sku: 'ACC-TOOL-KIT',
        categoryId: accessoriesCategory.id,
        brand: 'KN3D Tools',
        tags: ['herramientas', 'kit', 'accesorios'],
        images: [],
      },
    ],
    skipDuplicates: true,
  })

  // Crear materiales para inventario
  await prisma.material.createMany({
    data: [
      {
        name: 'PLA Bobina 1kg',
        type: 'FILAMENT_PLA',
        stock: 150.5,
        minStock: 20.0,
        costPerUnit: 18.50,
        supplier: 'Proveedor Filamentos SA',
        location: 'A-1-01',
      },
      {
        name: 'ABS Bobina 1kg',
        type: 'FILAMENT_ABS',
        stock: 85.2,
        minStock: 15.0,
        costPerUnit: 22.30,
        supplier: 'Proveedor Filamentos SA',
        location: 'A-1-02',
      },
      {
        name: 'Resina Standard 1L',
        type: 'RESIN_STANDARD',
        stock: 45.0,
        minStock: 10.0,
        costPerUnit: 32.00,
        supplier: 'ResCol Industries',
        location: 'B-2-01',
      },
      {
        name: 'Tornillos M3x10',
        type: 'HARDWARE',
        stock: 500.0,
        minStock: 100.0,
        unit: 'units',
        costPerUnit: 0.15,
        supplier: 'Ferretería Industrial',
        location: 'C-3-05',
      },
    ],
    skipDuplicates: true,
  })

  // Crear configuraciones del sistema
  await prisma.setting.createMany({
    data: [
      {
        key: 'SITE_NAME',
        value: 'KN3D Store',
      },
      {
        key: 'CURRENCY',
        value: { symbol: 'S/', code: 'PEN' },
      },
      {
        key: 'TAX_RATE',
        value: 0.18,
      },
      {
        key: 'FREE_SHIPPING_THRESHOLD',
        value: 200.00,
      },
      {
        key: 'ORDER_NUMBER_PREFIX',
        value: 'KN3D-',
      },
    ],
    skipDuplicates: true,
  })

  console.log('✅ Base de datos inicializada con datos de ejemplo')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })