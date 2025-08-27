const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function cleanUsers() {
  try {
    console.log('🧹 Limpiando usuarios sin contraseña...')
    
    // Primero mostrar usuarios que se van a eliminar
    const usersToDelete = await prisma.user.findMany({
      where: {
        password: null
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    })

    console.log(`\n📋 Usuarios que se eliminarán (${usersToDelete.length}):`)
    usersToDelete.forEach(user => {
      console.log(`   - ${user.email} (${user.name || 'Sin nombre'}) - ${user.createdAt.toLocaleDateString()}`)
    })

    if (usersToDelete.length === 0) {
      console.log('✅ No hay usuarios sin contraseña para eliminar.')
      return
    }

    // Eliminar relaciones primero (carritos, pedidos, etc.)
    console.log('\n🗑️ Eliminando carritos asociados...')
    const deleteCartsResult = await prisma.cartItem.deleteMany({
      where: {
        userId: {
          in: usersToDelete.map(u => u.id)
        }
      }
    })
    console.log(`   - ${deleteCartsResult.count} items de carrito eliminados`)

    console.log('🗑️ Eliminando pedidos asociados...')
    const deleteOrdersResult = await prisma.order.deleteMany({
      where: {
        userId: {
          in: usersToDelete.map(u => u.id)
        }
      }
    })
    console.log(`   - ${deleteOrdersResult.count} pedidos eliminados`)

    console.log('🗑️ Eliminando sesiones asociadas...')
    const deleteSessionsResult = await prisma.session.deleteMany({
      where: {
        userId: {
          in: usersToDelete.map(u => u.id)
        }
      }
    })
    console.log(`   - ${deleteSessionsResult.count} sesiones eliminadas`)

    console.log('🗑️ Eliminando cuentas asociadas...')
    const deleteAccountsResult = await prisma.account.deleteMany({
      where: {
        userId: {
          in: usersToDelete.map(u => u.id)
        }
      }
    })
    console.log(`   - ${deleteAccountsResult.count} cuentas eliminadas`)

    // Eliminar tokens de verificación
    console.log('🗑️ Eliminando tokens de verificación...')
    const deleteTokensResult = await prisma.verificationToken.deleteMany({
      where: {
        identifier: {
          in: usersToDelete.map(u => u.email)
        }
      }
    })
    console.log(`   - ${deleteTokensResult.count} tokens eliminados`)

    // Finalmente eliminar usuarios
    console.log('🗑️ Eliminando usuarios...')
    const deleteUsersResult = await prisma.user.deleteMany({
      where: {
        password: null
      }
    })

    console.log(`\n✅ Limpieza completada:`)
    console.log(`   - ${deleteUsersResult.count} usuarios eliminados`)
    console.log(`   - ${deleteCartsResult.count} carritos eliminados`)
    console.log(`   - ${deleteOrdersResult.count} pedidos eliminados`)
    console.log(`   - ${deleteSessionsResult.count} sesiones eliminadas`)
    console.log(`   - ${deleteAccountsResult.count} cuentas eliminadas`)
    console.log(`   - ${deleteTokensResult.count} tokens eliminados`)

    // Mostrar usuarios restantes
    const remainingUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true
      }
    })

    console.log(`\n👥 Usuarios restantes (${remainingUsers.length}):`)
    remainingUsers.forEach(user => {
      const verified = user.emailVerified ? '✅' : '❌'
      console.log(`   ${verified} ${user.email} (${user.role}) - ${user.name || 'Sin nombre'}`)
    })

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

cleanUsers()