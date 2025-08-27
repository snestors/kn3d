import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updatePricesForPeru() {
  try {
    console.log('🇵🇪 Actualizando precios para Perú (PEN)...')

    // Actualizar precios de productos (convertir de USD a PEN aproximadamente 1 USD = 3.75 PEN)
    await prisma.product.updateMany({
      where: { sku: 'FIL-PLA-WHT-175' },
      data: { price: 95.99 } // ~$25.99 USD
    })

    await prisma.product.updateMany({
      where: { sku: 'FIL-PLA-BLK-175' },
      data: { price: 95.99 } // ~$25.99 USD
    })

    await prisma.product.updateMany({
      where: { sku: 'FIL-ABS-BLU-175' },
      data: { price: 112.49 } // ~$29.99 USD
    })

    await prisma.product.updateMany({
      where: { sku: 'RES-STD-GRY-1L' },
      data: { price: 172.49 } // ~$45.99 USD
    })

    await prisma.product.updateMany({
      where: { sku: 'IMP-KN3D-PRO' },
      data: { price: 1124.99 } // ~$299.99 USD
    })

    await prisma.product.updateMany({
      where: { sku: 'ACC-TOOL-KIT' },
      data: { price: 74.99 } // ~$19.99 USD
    })

    // Actualizar configuraciones del sistema
    await prisma.setting.upsert({
      where: { key: 'CURRENCY' },
      update: { value: { symbol: 'S/', code: 'PEN' } },
      create: { key: 'CURRENCY', value: { symbol: 'S/', code: 'PEN' } }
    })

    await prisma.setting.upsert({
      where: { key: 'TAX_RATE' },
      update: { value: 0.18 }, // IGV Perú 18%
      create: { key: 'TAX_RATE', value: 0.18 }
    })

    await prisma.setting.upsert({
      where: { key: 'FREE_SHIPPING_THRESHOLD' },
      update: { value: 200.00 }, // S/ 200 para envío gratis
      create: { key: 'FREE_SHIPPING_THRESHOLD', value: 200.00 }
    })

    console.log('✅ Precios actualizados correctamente para Perú')
    
    // Mostrar productos actualizados
    const products = await prisma.product.findMany({
      select: {
        name: true,
        price: true,
        sku: true
      }
    })

    console.log('\n📋 Productos actualizados:')
    products.forEach(product => {
      console.log(`- ${product.name}: S/ ${product.price}`)
    })

  } catch (error) {
    console.error('Error actualizando precios:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updatePricesForPeru()