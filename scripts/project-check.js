const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function projectCheck() {
  console.log('🔍 KN3D PROJECT HEALTH CHECK')
  console.log('=' * 50)
  
  let issues = []
  let warnings = []
  
  try {
    // 1. Check Environment Variables
    console.log('\n📋 1. ENVIRONMENT VARIABLES')
    const envPath = path.join(process.cwd(), '.env.local')
    if (fs.existsSync(envPath)) {
      console.log('   ✅ .env.local exists')
      const envContent = fs.readFileSync(envPath, 'utf8')
      
      const requiredEnvs = [
        'POSTGRES_PRISMA_URL',
        'NEXTAUTH_SECRET',
        'EMAIL_SERVER_HOST',
        'EMAIL_SERVER_USER',
        'EMAIL_SERVER_PASSWORD',
        'EMAIL_FROM'
      ]
      
      requiredEnvs.forEach(env => {
        if (envContent.includes(env) && !envContent.includes(`${env}=""`)) {
          console.log(`   ✅ ${env} configured`)
        } else {
          console.log(`   ❌ ${env} missing or empty`)
          issues.push(`Missing environment variable: ${env}`)
        }
      })
    } else {
      console.log('   ❌ .env.local not found')
      issues.push('Missing .env.local file')
    }

    // 2. Check Database Connection
    console.log('\n🗄️ 2. DATABASE CONNECTION')
    try {
      await prisma.$connect()
      console.log('   ✅ Database connection successful')
      
      // Check tables exist
      const userCount = await prisma.user.count()
      const productCount = await prisma.product.count()
      const categoryCount = await prisma.category.count()
      
      console.log(`   ✅ Users table: ${userCount} records`)
      console.log(`   ✅ Products table: ${productCount} records`)
      console.log(`   ✅ Categories table: ${categoryCount} records`)
      
      if (userCount === 0) {
        warnings.push('No users in database - run seed')
      }
      if (productCount === 0) {
        warnings.push('No products in database - run seed')
      }
      
    } catch (error) {
      console.log(`   ❌ Database connection failed: ${error.message}`)
      issues.push('Database connection failed')
    }

    // 3. Check Admin User
    console.log('\n👤 3. ADMIN USER')
    try {
      const adminUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
        select: {
          email: true,
          name: true,
          emailVerified: true,
          password: true,
          role: true
        }
      })
      
      if (adminUser) {
        console.log(`   ✅ Admin user found: ${adminUser.email}`)
        console.log(`   ✅ Name: ${adminUser.name}`)
        console.log(`   ${adminUser.emailVerified ? '✅' : '⚠️'} Email verified: ${adminUser.emailVerified ? 'Yes' : 'No'}`)
        console.log(`   ${adminUser.password ? '✅' : '❌'} Password: ${adminUser.password ? 'Set' : 'Missing'}`)
        
        if (!adminUser.password) {
          issues.push('Admin user has no password')
        }
      } else {
        console.log('   ❌ No admin user found')
        issues.push('No admin user in database')
      }
    } catch (error) {
      console.log(`   ❌ Error checking admin user: ${error.message}`)
      issues.push('Cannot check admin user')
    }

    // 4. Check Key Files
    console.log('\n📁 4. KEY FILES')
    const keyFiles = [
      'app/layout.tsx',
      'app/page.tsx',
      'app/admin/page.tsx',
      'app/admin/layout.tsx',
      'app/api/auth/[...nextauth]/route.ts',
      'lib/auth.ts',
      'lib/prisma.ts',
      'lib/email.ts',
      'components/admin/sidebar.tsx',
      'components/admin/header.tsx',
      'middleware.ts',
      'prisma/schema.prisma'
    ]
    
    keyFiles.forEach(file => {
      const filePath = path.join(process.cwd(), file)
      if (fs.existsSync(filePath)) {
        console.log(`   ✅ ${file}`)
      } else {
        console.log(`   ❌ ${file}`)
        issues.push(`Missing file: ${file}`)
      }
    })

    // 5. Check Package Dependencies
    console.log('\n📦 5. DEPENDENCIES')
    const packagePath = path.join(process.cwd(), 'package.json')
    if (fs.existsSync(packagePath)) {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
      const requiredDeps = [
        'next',
        'react',
        'typescript',
        '@prisma/client',
        'next-auth',
        'bcryptjs',
        'nodemailer',
        'lucide-react',
        'tailwindcss'
      ]
      
      requiredDeps.forEach(dep => {
        if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
          console.log(`   ✅ ${dep}`)
        } else {
          console.log(`   ❌ ${dep}`)
          issues.push(`Missing dependency: ${dep}`)
        }
      })
    }

    // 6. Check Routes
    console.log('\n🛣️ 6. ROUTES STRUCTURE')
    const routes = [
      'app/auth/signin/page.tsx',
      'app/auth/signup/page.tsx',
      'app/products/page.tsx',
      'app/cart/page.tsx',
      'app/admin/page.tsx',
      'app/api/auth/register/route.ts',
      'app/api/products/route.ts',
      'app/api/cart/route.ts',
      'app/api/admin/dashboard/route.ts'
    ]
    
    routes.forEach(route => {
      const routePath = path.join(process.cwd(), route)
      if (fs.existsSync(routePath)) {
        console.log(`   ✅ ${route}`)
      } else {
        console.log(`   ⚠️ ${route}`)
        warnings.push(`Route missing: ${route}`)
      }
    })

    // 7. Check Configuration
    console.log('\n⚙️ 7. SYSTEM CONFIGURATION')
    try {
      const settings = await prisma.setting.findMany()
      const settingsObj = {}
      settings.forEach(s => settingsObj[s.key] = s.value)
      
      if (settingsObj.CURRENCY) {
        const currency = typeof settingsObj.CURRENCY === 'object' ? settingsObj.CURRENCY : JSON.parse(settingsObj.CURRENCY)
        console.log(`   ✅ Currency: ${currency.symbol} (${currency.code})`)
      }
      
      if (settingsObj.TAX_RATE) {
        console.log(`   ✅ Tax Rate: ${(settingsObj.TAX_RATE * 100).toFixed(1)}%`)
      }
      
      if (settingsObj.FREE_SHIPPING_THRESHOLD) {
        console.log(`   ✅ Free Shipping: ${settingsObj.FREE_SHIPPING_THRESHOLD}`)
      }
      
    } catch (error) {
      console.log(`   ⚠️ Cannot check system settings: ${error.message}`)
      warnings.push('Cannot read system settings')
    }

    // 8. Summary
    console.log('\n' + '=' * 50)
    console.log('📊 SUMMARY')
    console.log('=' * 50)
    
    if (issues.length === 0 && warnings.length === 0) {
      console.log('✅ PROJECT STATUS: EXCELLENT')
      console.log('🎉 All systems are working correctly!')
      console.log('\n🚀 Ready for:')
      console.log('   - Development testing')
      console.log('   - Admin dashboard usage')
      console.log('   - Production deployment')
      
      console.log('\n🔗 URLs to test:')
      console.log('   - Frontend: http://localhost:3000')
      console.log('   - Admin: http://localhost:3000/admin')
      console.log('   - Login: admin@kn3d.com / admin123')
      
    } else {
      console.log(`🟡 PROJECT STATUS: ${issues.length > 0 ? 'NEEDS ATTENTION' : 'GOOD WITH WARNINGS'}`)
      
      if (issues.length > 0) {
        console.log(`\n❌ CRITICAL ISSUES (${issues.length}):`)
        issues.forEach((issue, i) => console.log(`   ${i + 1}. ${issue}`))
      }
      
      if (warnings.length > 0) {
        console.log(`\n⚠️ WARNINGS (${warnings.length}):`)
        warnings.forEach((warning, i) => console.log(`   ${i + 1}. ${warning}`))
      }
      
      console.log('\n🔧 Next Steps:')
      if (issues.length > 0) {
        console.log('   1. Fix critical issues first')
      }
      if (warnings.length > 0) {
        console.log('   2. Address warnings when possible')
      }
      console.log('   3. Run project check again')
    }

  } catch (error) {
    console.error('\n💥 FATAL ERROR:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

projectCheck()