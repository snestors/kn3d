const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkAdmin() {
  try {
    const admins = await prisma.user.findMany({
      where: { 
        OR: [
          { role: 'ADMIN' },
          { email: 'admin@kn3d.com' }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true
      }
    })

    console.log('👥 Usuarios encontrados:')
    admins.forEach(user => {
      console.log(`📧 ${user.email}`)
      console.log(`👤 ${user.name}`)
      console.log(`🎭 Role: ${user.role}`)
      console.log(`✅ Verified: ${user.emailVerified ? 'Sí' : 'No'}`)
      console.log('---')
    })

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkAdmin()