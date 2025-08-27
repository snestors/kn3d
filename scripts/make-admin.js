const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function makeAdmin() {
  const email = process.argv[2]
  
  if (!email) {
    console.error('❌ Uso: node scripts/make-admin.js <email>')
    process.exit(1)
  }

  try {
    // Buscar el usuario
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      console.error(`❌ Usuario con email ${email} no encontrado`)
      process.exit(1)
    }

    // Actualizar rol a ADMIN
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' }
    })

    console.log('✅ Usuario promovido a ADMIN exitosamente:')
    console.log(`   📧 Email: ${updatedUser.email}`)
    console.log(`   👤 Nombre: ${updatedUser.name}`)
    console.log(`   🔑 Rol: ${updatedUser.role}`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

makeAdmin()