const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkDatabase() {
  try {
    console.log('🔍 Verificando estado de la base de datos...\n')
    
    // Usuarios
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        password: true,
        createdAt: true
      }
    })

    console.log(`👥 Usuarios (${users.length}):`)
    users.forEach(user => {
      const verified = user.emailVerified ? '✅' : '❌'
      const hasPassword = user.password ? '🔐' : '⚠️'
      console.log(`   ${verified} ${hasPassword} ${user.email} (${user.role}) - ${user.name}`)
    })

    // Productos
    const products = await prisma.product.count()
    console.log(`\n📦 Productos: ${products}`)

    // Categorías
    const categories = await prisma.category.count()
    console.log(`📂 Categorías: ${categories}`)

    // Materiales
    const materials = await prisma.material.count()
    console.log(`🧱 Materiales: ${materials}`)

    // Configuraciones
    const settings = await prisma.setting.findMany()
    console.log(`\n⚙️ Configuraciones (${settings.length}):`)
    settings.forEach(setting => {
      const value = typeof setting.value === 'object' 
        ? JSON.stringify(setting.value)
        : setting.value
      console.log(`   - ${setting.key}: ${value}`)
    })

    console.log('\n✅ Verificación completada')

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()