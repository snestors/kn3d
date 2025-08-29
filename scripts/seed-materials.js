const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedMaterials() {
  try {
    console.log('🌱 Sembrando materiales de producción...')

    // Materiales de filamento
    const filamentMaterials = [
      {
        name: 'Filamento PLA Negro 1.75mm',
        type: 'FILAMENT_PLA',
        stock: 2.5,
        minStock: 1.0,
        maxStock: 10.0,
        unit: 'kg',
        costPerUnit: 25.50,
        supplier: 'PrintMaster Supply',
        location: 'Estante A1'
      },
      {
        name: 'Filamento PLA Blanco 1.75mm',
        type: 'FILAMENT_PLA',
        stock: 1.8,
        minStock: 1.0,
        maxStock: 10.0,
        unit: 'kg',
        costPerUnit: 25.50,
        supplier: 'PrintMaster Supply',
        location: 'Estante A2'
      },
      {
        name: 'Filamento PLA Rojo 1.75mm',
        type: 'FILAMENT_PLA',
        stock: 0.5,
        minStock: 1.0,
        maxStock: 10.0,
        unit: 'kg',
        costPerUnit: 28.00,
        supplier: 'PrintMaster Supply',
        location: 'Estante A3'
      },
      {
        name: 'Filamento ABS Negro 1.75mm',
        type: 'FILAMENT_ABS',
        stock: 3.2,
        minStock: 1.5,
        maxStock: 8.0,
        unit: 'kg',
        costPerUnit: 32.00,
        supplier: '3D World Peru',
        location: 'Estante B1'
      },
      {
        name: 'Filamento PETG Transparente 1.75mm',
        type: 'FILAMENT_PETG',
        stock: 1.0,
        minStock: 1.0,
        maxStock: 6.0,
        unit: 'kg',
        costPerUnit: 38.50,
        supplier: 'Advanced Materials',
        location: 'Estante B2'
      },
      {
        name: 'Filamento TPU Flexible Negro 1.75mm',
        type: 'FILAMENT_TPU',
        stock: 0.8,
        minStock: 0.5,
        maxStock: 3.0,
        unit: 'kg',
        costPerUnit: 65.00,
        supplier: 'FlexiPrint Co.',
        location: 'Estante C1'
      }
    ]

    // Materiales de resina
    const resinMaterials = [
      {
        name: 'Resina Estándar Gris 1L',
        type: 'RESIN_STANDARD',
        stock: 2.5,
        minStock: 1.0,
        maxStock: 8.0,
        unit: 'L',
        costPerUnit: 45.00,
        supplier: 'ResinCraft',
        location: 'Gabinete Resinas'
      },
      {
        name: 'Resina Tough Negra 1L',
        type: 'RESIN_TOUGH',
        stock: 1.2,
        minStock: 0.5,
        maxStock: 4.0,
        unit: 'L',
        costPerUnit: 68.00,
        supplier: 'ProResin Labs',
        location: 'Gabinete Resinas'
      },
      {
        name: 'Resina Flexible Clara 1L',
        type: 'RESIN_FLEXIBLE',
        stock: 0.3,
        minStock: 0.5,
        maxStock: 3.0,
        unit: 'L',
        costPerUnit: 85.00,
        supplier: 'FlexResin Inc.',
        location: 'Gabinete Resinas'
      }
    ]

    // Hardware y consumibles
    const hardwareMaterials = [
      {
        name: 'Tornillos M3x12mm',
        type: 'HARDWARE',
        stock: 150,
        minStock: 50,
        maxStock: 500,
        unit: 'unidades',
        costPerUnit: 0.15,
        supplier: 'Ferretería Industrial',
        location: 'Cajón H1'
      },
      {
        name: 'Tuercas M3',
        type: 'HARDWARE',
        stock: 200,
        minStock: 50,
        maxStock: 500,
        unit: 'unidades',
        costPerUnit: 0.08,
        supplier: 'Ferretería Industrial',
        location: 'Cajón H2'
      },
      {
        name: 'Alcohol Isopropílico 1L',
        type: 'CONSUMABLES',
        stock: 0.8,
        minStock: 1.0,
        maxStock: 5.0,
        unit: 'L',
        costPerUnit: 18.50,
        supplier: 'Química del Sur',
        location: 'Estante Químicos'
      },
      {
        name: 'Papel de Lija 220',
        type: 'CONSUMABLES',
        stock: 20,
        minStock: 10,
        maxStock: 100,
        unit: 'hojas',
        costPerUnit: 1.25,
        supplier: 'Abrasivos Tech',
        location: 'Cajón Herramientas'
      }
    ]

    // Componentes electrónicos
    const electronicMaterials = [
      {
        name: 'LEDs 5mm Blancos',
        type: 'ELECTRONICS',
        stock: 25,
        minStock: 20,
        maxStock: 200,
        unit: 'unidades',
        costPerUnit: 0.85,
        supplier: 'ElectroComponentes',
        location: 'Cajón E1'
      },
      {
        name: 'Resistencias 220Ω',
        type: 'ELECTRONICS',
        stock: 50,
        minStock: 30,
        maxStock: 200,
        unit: 'unidades',
        costPerUnit: 0.12,
        supplier: 'ElectroComponentes',
        location: 'Cajón E2'
      }
    ]

    // Combinar todos los materiales
    const allMaterials = [
      ...filamentMaterials,
      ...resinMaterials,
      ...hardwareMaterials,
      ...electronicMaterials
    ]

    // Insertar materiales
    for (const material of allMaterials) {
      await prisma.material.upsert({
        where: { name: material.name },
        update: material,
        create: material
      })
      console.log(`✅ Material creado/actualizado: ${material.name}`)
    }

    console.log(`\n🎉 Se han creado/actualizado ${allMaterials.length} materiales`)
    console.log('\n📊 Resumen por tipo:')
    console.log(`- Filamentos PLA: ${filamentMaterials.filter(m => m.type === 'FILAMENT_PLA').length}`)
    console.log(`- Filamentos ABS: ${filamentMaterials.filter(m => m.type === 'FILAMENT_ABS').length}`)
    console.log(`- Filamentos PETG: ${filamentMaterials.filter(m => m.type === 'FILAMENT_PETG').length}`)
    console.log(`- Filamentos TPU: ${filamentMaterials.filter(m => m.type === 'FILAMENT_TPU').length}`)
    console.log(`- Resinas: ${resinMaterials.length}`)
    console.log(`- Hardware: ${hardwareMaterials.length}`)
    console.log(`- Electrónicos: ${electronicMaterials.length}`)

    // Mostrar materiales con stock crítico/bajo
    const criticalMaterials = allMaterials.filter(m => m.stock <= m.minStock * 0.5)
    const lowMaterials = allMaterials.filter(m => m.stock <= m.minStock && m.stock > m.minStock * 0.5)

    if (criticalMaterials.length > 0) {
      console.log(`\n🚨 Materiales con stock crítico (${criticalMaterials.length}):`)
      criticalMaterials.forEach(m => {
        console.log(`   - ${m.name}: ${m.stock} ${m.unit} (Min: ${m.minStock})`)
      })
    }

    if (lowMaterials.length > 0) {
      console.log(`\n⚠️ Materiales con stock bajo (${lowMaterials.length}):`)
      lowMaterials.forEach(m => {
        console.log(`   - ${m.name}: ${m.stock} ${m.unit} (Min: ${m.minStock})`)
      })
    }

  } catch (error) {
    console.error('❌ Error sembrando materiales:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedMaterials()