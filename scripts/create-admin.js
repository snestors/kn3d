const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    // Verificar si ya existe un admin
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })

    if (existingAdmin) {
      console.log('✅ Ya existe un usuario ADMIN:', existingAdmin.email)
      return
    }

    // Crear usuario admin
    const hashedPassword = await bcrypt.hash('admin123', 12)
    
    const admin = await prisma.user.create({
      data: {
        name: 'Administrador KN3D',
        email: 'admin@kn3d.com',
        password: hashedPassword,
        emailVerified: new Date(),
        role: 'ADMIN'
      }
    })

    console.log('✅ Usuario ADMIN creado exitosamente:', admin.email)
    console.log('📧 Email: admin@kn3d.com')
    console.log('🔑 Password: admin123')

  } catch (error) {
    console.error('❌ Error creando usuario admin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()