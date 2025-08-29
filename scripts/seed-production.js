const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedProductionJobs() {
  try {
    console.log('🏭 Sembrando trabajos de producción...')

    // Obtener algunos productos existentes
    const products = await prisma.product.findMany({
      take: 5,
      where: { isActive: true },
      select: { id: true, name: true, sku: true }
    })

    if (products.length === 0) {
      console.log('⚠️ No hay productos disponibles, creando trabajos genéricos...')
    }

    // Trabajos de ejemplo
    const jobs = [
      {
        jobNumber: 'JOB-000001',
        name: 'Figuras Decorativas Mini Dragon',
        description: 'Lote de 10 figuras de dragones decorativos en PLA negro',
        status: 'COMPLETED',
        priority: 5,
        estimatedHours: 8.5,
        actualHours: 9.2,
        printer: 'Ender3_Pro_001',
        material: 'PLA Negro',
        settings: {
          layerHeight: 0.2,
          infill: 15,
          printSpeed: 50,
          nozzleTemp: 210,
          bedTemp: 60,
          supports: true
        },
        files: ['dragon_mini_v2.stl', 'dragon_mini_supports.gcode'],
        notes: 'Completado exitosamente. Excelente calidad de acabado.',
        productId: products[0]?.id || null,
        startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Hace 2 días
        completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Hace 1 día
      },
      {
        jobNumber: 'JOB-000002',
        name: 'Porta Celular Ergonómico',
        description: 'Reposición de stock - 5 unidades en PLA blanco',
        status: 'IN_PROGRESS',
        priority: 6,
        estimatedHours: 4.0,
        actualHours: 2.5,
        printer: 'Ender3_Pro_002',
        material: 'PLA Blanco',
        settings: {
          layerHeight: 0.25,
          infill: 20,
          printSpeed: 60,
          nozzleTemp: 205,
          bedTemp: 60,
          supports: false
        },
        files: ['phone_holder_ergonomic.stl'],
        notes: 'En progreso. Estimado de finalización: 2 horas más.',
        productId: products[1]?.id || null,
        startedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // Hace 3 horas
      },
      {
        jobNumber: 'JOB-000003',
        name: 'Organizador de Escritorio Modular',
        description: 'Set completo de organizadores modulares - 8 piezas',
        status: 'QUEUED',
        priority: 7,
        estimatedHours: 12.0,
        printer: 'Prusa_MK3S_001',
        material: 'PETG Transparente',
        settings: {
          layerHeight: 0.2,
          infill: 25,
          printSpeed: 45,
          nozzleTemp: 245,
          bedTemp: 85,
          supports: false
        },
        files: ['desk_organizer_base.stl', 'desk_organizer_dividers.stl', 'desk_organizer_pen_holder.stl'],
        notes: 'Prioritario - Cliente empresarial. Revisar disponibilidad de PETG.',
        productId: products[2]?.id || null,
      },
      {
        jobNumber: 'JOB-000004',
        name: 'Prototipos Industriales Flexibles',
        description: 'Prototipos de juntas flexibles en TPU para cliente',
        status: 'PAUSED',
        priority: 8,
        estimatedHours: 6.0,
        actualHours: 1.5,
        printer: 'Artillery_Sidewinder_001',
        material: 'TPU Flexible Negro',
        settings: {
          layerHeight: 0.3,
          infill: 100,
          printSpeed: 25,
          nozzleTemp: 230,
          bedTemp: 50,
          supports: true
        },
        files: ['flexible_joint_prototype_v3.stl'],
        notes: 'Pausado por falta de TPU. Esperando reabastecimiento.',
        productId: products[3]?.id || null,
        startedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // Hace 4 horas
      },
      {
        jobNumber: 'JOB-000005',
        name: 'Miniaturas de Juego de Mesa',
        description: 'Set de 20 miniaturas detalladas en resina gris',
        status: 'QUEUED',
        priority: 4,
        estimatedHours: 3.5,
        printer: 'Mars_3_Pro_001',
        material: 'Resina Estándar Gris',
        settings: {
          layerHeight: 0.05,
          exposure: 2.5,
          bottomExposure: 25,
          liftDistance: 8,
          supports: true,
          hollowing: false
        },
        files: ['miniatures_warriors_set.stl', 'miniatures_supports.stl'],
        notes: 'Trabajo de resina. Requiere post-procesamiento con alcohol.',
        productId: products[4]?.id || null,
      },
      {
        jobNumber: 'JOB-000006',
        name: 'Piezas de Repuesto Maquinaria',
        description: 'Engranajes de repuesto en ABS negro - alta resistencia',
        status: 'FAILED',
        priority: 9,
        estimatedHours: 5.0,
        actualHours: 2.0,
        printer: 'Ender3_Pro_001',
        material: 'ABS Negro',
        settings: {
          layerHeight: 0.2,
          infill: 50,
          printSpeed: 40,
          nozzleTemp: 250,
          bedTemp: 100,
          supports: false
        },
        files: ['gear_replacement_part.stl'],
        notes: 'Falló por warping del ABS. Ajustar temperatura de cama y usar enclosure.',
        startedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // Hace 6 horas
        completedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // Hace 4 horas
      },
      {
        jobNumber: 'JOB-000007',
        name: 'Trofeos Personalizados',
        description: 'Trofeos personalizados para evento deportivo - 15 unidades',
        status: 'QUEUED',
        priority: 6,
        estimatedHours: 18.0,
        printer: null, // Sin asignar
        material: 'PLA Negro',
        settings: {
          layerHeight: 0.2,
          infill: 30,
          printSpeed: 55,
          nozzleTemp: 210,
          bedTemp: 60,
          supports: true
        },
        files: ['trophy_base.stl', 'trophy_top.stl', 'personalized_text.stl'],
        notes: 'Urgente para evento del próximo fin de semana. Dividir en múltiples impresoras.',
      }
    ]

    // Crear trabajos de producción
    let createdJobs = 0
    for (const job of jobs) {
      const existingJob = await prisma.productionJob.findUnique({
        where: { jobNumber: job.jobNumber }
      })

      if (!existingJob) {
        await prisma.productionJob.create({
          data: job
        })
        console.log(`✅ Trabajo creado: ${job.jobNumber} - ${job.name}`)
        createdJobs++
      } else {
        console.log(`⏭️ Trabajo ya existe: ${job.jobNumber}`)
      }
    }

    console.log(`\n🎉 Se crearon ${createdJobs} trabajos de producción`)
    
    // Mostrar resumen por estado
    const stats = await prisma.productionJob.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    })

    console.log('\n📊 Resumen por estado:')
    stats.forEach(stat => {
      const statusText = {
        'QUEUED': 'En Cola',
        'IN_PROGRESS': 'En Progreso',
        'PAUSED': 'Pausado',
        'COMPLETED': 'Completado',
        'FAILED': 'Fallido',
        'CANCELLED': 'Cancelado'
      }
      console.log(`   - ${statusText[stat.status] || stat.status}: ${stat._count.status}`)
    })

    // Mostrar trabajos críticos
    const criticalJobs = await prisma.productionJob.findMany({
      where: { priority: { gte: 8 } },
      select: { jobNumber: true, name: true, priority: true, status: true }
    })

    if (criticalJobs.length > 0) {
      console.log(`\n🚨 Trabajos de alta prioridad (${criticalJobs.length}):`)
      criticalJobs.forEach(job => {
        console.log(`   - ${job.jobNumber}: ${job.name} (Prioridad: ${job.priority}, Estado: ${job.status})`)
      })
    }

  } catch (error) {
    console.error('❌ Error sembrando trabajos de producción:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedProductionJobs()