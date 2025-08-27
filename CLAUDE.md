# KN3D - Sistema E-commerce para Impresión 3D con ERP Integrado

## DESCRIPCIÓN DEL PROYECTO
Sistema completo de e-commerce especializado en productos y materiales de impresión 3D con funcionalidades ERP integradas para gestión de inventario, producción y pedidos.

## STACK TÉCNICO
- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui + Lucide React Icons
- **Base de Datos**: Neon PostgreSQL (FREE tier)
- **ORM**: Prisma
- **Autenticación**: NextAuth.js + Email Verification
- **Email**: Nodemailer + Gmail SMTP
- **Almacenamiento**: Vercel Blob Storage (FREE tier)
- **Cache/Rate Limiting**: Upstash Redis
- **Deployment**: Vercel (FREE tier)

## ARQUITECTURA DEL SISTEMA

### FRONTEND PÚBLICO
- **Homepage**: Productos destacados y promociones
- **Catálogo**: Productos 3D con filtros avanzados (material, color, marca, precio)
- **Carrito**: Persistencia local y sincronización con usuario
- **Checkout**: Múltiples métodos de pago
- **Perfil**: Historial de pedidos y configuraciones
- **Búsqueda**: Sistema avanzado con filtros dinámicos

### PANEL ADMINISTRATIVO (ERP)
- **Dashboard**: Métricas clave (ventas, stock, producción)
- **Productos**: CRUD completo con gestión de imágenes
- **Inventario**: Control de stock y alertas de reposición
- **Pedidos**: Gestión de estados (pendiente → producción → enviado → entregado)
- **Producción**: Planificador de cola de trabajos de impresión
- **Reportes**: Analytics de ventas y rendimiento
- **Usuarios**: Gestión de roles y permisos

## ESQUEMA DE BASE DE DATOS

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url = env("POSTGRES_PRISMA_URL")
  directUrl = env("POSTGRES_URL_NON_POOLING")
}

// === USUARIOS Y AUTENTICACIÓN ===
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  password      String?   // Hash de la contraseña (bcrypt)
  role          UserRole  @default(CUSTOMER)
  phone         String?
  address       Json?     // {street, city, state, zipCode, country}
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts Account[]
  sessions Session[]
  orders   Order[]
  cart     CartItem[]
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

enum UserRole {
  CUSTOMER
  ADMIN
  MANAGER
  OPERATOR
}

// === PRODUCTOS ===
model Category {
  id          String    @id @default(cuid())
  name        String    @unique
  slug        String    @unique
  description String?
  image       String?
  parentId    String?
  parent      Category? @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryHierarchy")
  products    Product[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Product {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  description String
  price       Decimal  @db.Decimal(10, 2)
  comparePrice Decimal? @db.Decimal(10, 2) // Precio tachado
  stock       Int      @default(0)
  minStock    Int      @default(5)
  sku         String   @unique
  barcode     String?
  weight      Decimal? @db.Decimal(8, 3) // kg
  dimensions  Json?    // {length, width, height} en cm
  images      String[] // URLs de Vercel Blob
  tags        String[]
  isActive    Boolean  @default(true)
  isFeatured  Boolean  @default(false)
  
  categoryId  String
  category    Category @relation(fields: [categoryId], references: [id])
  
  // Campos específicos para impresión 3D
  material    String?  // PLA, ABS, PETG, etc.
  color       String?
  brand       String?
  diameter    String?  // 1.75mm, 3mm
  printTemp   String?  // Temperatura de impresión
  bedTemp     String?  // Temperatura de cama
  
  orderItems    OrderItem[]
  cartItems     CartItem[]
  productionJobs ProductionJob[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([categoryId])
  @@index([isActive, isFeatured])
}

// === CARRITO ===
model CartItem {
  id        String   @id @default(cuid())
  userId    String
  productId String
  quantity  Int
  addedAt   DateTime @default(now())

  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([userId, productId])
}

// === PEDIDOS ===
model Order {
  id              String      @id @default(cuid())
  orderNumber     String      @unique
  userId          String
  status          OrderStatus @default(PENDING)
  paymentStatus   PaymentStatus @default(PENDING)
  paymentMethod   String?     // stripe, paypal, transfer, etc.
  paymentId       String?     // ID de transacción
  
  // Información del cliente
  customerName    String
  customerEmail   String
  customerPhone   String?
  
  // Dirección de envío
  shippingAddress Json        // {street, city, state, zipCode, country}
  billingAddress  Json?       // Si es diferente a shipping
  
  // Montos
  subtotal        Decimal     @db.Decimal(10, 2)
  shippingCost    Decimal     @db.Decimal(10, 2) @default(0)
  tax             Decimal     @db.Decimal(10, 2) @default(0)
  discount        Decimal     @db.Decimal(10, 2) @default(0)
  total           Decimal     @db.Decimal(10, 2)
  
  // Fechas
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  shippedAt       DateTime?
  deliveredAt     DateTime?
  
  // Notas
  notes           String?
  internalNotes   String?     // Solo para admin
  
  user            User        @relation(fields: [userId], references: [id])
  items           OrderItem[]
  productionJobs  ProductionJob[]
  
  @@index([userId])
  @@index([status])
  @@index([createdAt])
}

model OrderItem {
  id        String  @id @default(cuid())
  orderId   String
  productId String
  quantity  Int
  price     Decimal @db.Decimal(10, 2) // Precio al momento de la compra
  
  order   Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id])
  
  @@index([orderId])
}

enum OrderStatus {
  PENDING       // Pendiente de pago
  CONFIRMED     // Confirmado y pagado
  PROCESSING    // En preparación
  PRODUCTION    // En producción (para items personalizados)
  SHIPPED       // Enviado
  DELIVERED     // Entregado
  CANCELLED     // Cancelado
  RETURNED      // Devuelto
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
  PARTIALLY_REFUNDED
}

// === INVENTARIO ===
model Material {
  id          String   @id @default(cuid())
  name        String   @unique
  type        MaterialType
  supplier    String?
  stock       Decimal  @db.Decimal(10, 3) // kg o unidades
  minStock    Decimal  @db.Decimal(10, 3)
  maxStock    Decimal? @db.Decimal(10, 3)
  unit        String   @default("kg") // kg, units, meters, etc.
  costPerUnit Decimal  @db.Decimal(10, 4)
  location    String?  // Ubicación en almacén
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([type])
}

enum MaterialType {
  FILAMENT_PLA
  FILAMENT_ABS
  FILAMENT_PETG
  FILAMENT_TPU
  RESIN_STANDARD
  RESIN_TOUGH
  RESIN_FLEXIBLE
  HARDWARE      // Tornillos, tuercas, etc.
  ELECTRONICS   // Componentes electrónicos
  CONSUMABLES   // Alcohol, papel, etc.
}

// === PRODUCCIÓN ===
model ProductionJob {
  id            String          @id @default(cuid())
  orderId       String
  productId     String?         // Puede ser null para trabajos personalizados
  jobNumber     String          @unique
  name          String
  description   String?
  status        ProductionStatus @default(QUEUED)
  priority      Int             @default(5) // 1-10, 10 es más alta
  
  // Tiempos estimados
  estimatedHours Decimal?       @db.Decimal(8, 2)
  actualHours    Decimal?       @db.Decimal(8, 2)
  
  // Archivos
  files         String[]        // URLs de archivos STL, GCODE, etc.
  
  // Configuración de impresión
  printer       String?         // ID o nombre de impresora asignada
  material      String?         // Material a usar
  settings      Json?           // Configuraciones específicas
  
  // Fechas
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt
  startedAt     DateTime?
  completedAt   DateTime?
  
  // Notas
  notes         String?
  
  order         Order           @relation(fields: [orderId], references: [id])
  product       Product?        @relation(fields: [productId], references: [id])
  
  @@index([status, priority])
  @@index([orderId])
}

enum ProductionStatus {
  QUEUED        // En cola
  IN_PROGRESS   // En producción
  PAUSED        // Pausado
  COMPLETED     // Completado
  FAILED        // Falló
  CANCELLED     // Cancelado
}

// === CONFIGURACIONES ===
model Setting {
  id    String @id @default(cuid())
  key   String @unique
  value Json
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## API ENDPOINTS

### Autenticación
- `POST /api/auth/signin` - Iniciar sesión
- `POST /api/auth/signout` - Cerrar sesión
- `POST /api/auth/signup` - Registro

### Productos
- `GET /api/products` - Listar productos (con filtros)
- `GET /api/products/[slug]` - Producto individual
- `POST /api/products` - Crear producto (admin)
- `PUT /api/products/[id]` - Actualizar producto (admin)
- `DELETE /api/products/[id]` - Eliminar producto (admin)

### Categorías
- `GET /api/categories` - Listar categorías
- `POST /api/categories` - Crear categoría (admin)

### Carrito
- `GET /api/cart` - Obtener carrito del usuario
- `POST /api/cart` - Agregar item al carrito
- `PUT /api/cart/[id]` - Actualizar cantidad
- `DELETE /api/cart/[id]` - Remover item

### Pedidos
- `GET /api/orders` - Listar pedidos del usuario
- `GET /api/orders/[id]` - Pedido individual
- `POST /api/orders` - Crear pedido
- `PUT /api/orders/[id]` - Actualizar estado (admin)

### Admin
- `GET /api/admin/dashboard` - Métricas del dashboard
- `GET /api/admin/orders` - Todos los pedidos
- `GET /api/admin/inventory` - Estado del inventario
- `GET /api/admin/production` - Cola de producción

### Uploads
- `POST /api/upload/images` - Subir imágenes de productos
- `POST /api/upload/files` - Subir archivos 3D

## COMANDOS ÚTILES

### Desarrollo
```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Generar y sincronizar base de datos
npx prisma generate
npx prisma db push

# Seed inicial de datos
npx prisma db seed

# Tipo checking
npm run type-check

# Linting y formato
npm run lint
npm run lint:fix
```

### Base de Datos
```bash
# Visualizar base de datos
npx prisma studio

# Reset completo de base de datos
npx prisma migrate reset

# Crear migración
npx prisma migrate dev --name [nombre-migracion]
```

### Deployment
```bash
# Build para producción
npm run build

# Deploy a Vercel
vercel --prod
```

## VARIABLES DE ENTORNO

```env
# Database
POSTGRES_PRISMA_URL=""
POSTGRES_URL_NON_POOLING=""

# NextAuth
NEXTAUTH_SECRET=""
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=""

# Upstash Redis
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# Payment Providers
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""

# Email
EMAIL_SERVER_HOST=""
EMAIL_SERVER_PORT=""
EMAIL_SERVER_USER=""
EMAIL_SERVER_PASSWORD=""
EMAIL_FROM=""
```

## ESTRUCTURA DE CARPETAS

```
kn3d/
├── app/                          # App Router (Next.js 14)
│   ├── (admin)/                  # Admin routes group
│   │   ├── admin/
│   │   │   ├── dashboard/
│   │   │   ├── products/
│   │   │   ├── orders/
│   │   │   ├── inventory/
│   │   │   └── production/
│   ├── (public)/                 # Public routes group
│   │   ├── products/
│   │   ├── cart/
│   │   ├── checkout/
│   │   └── profile/
│   ├── api/                      # API Routes
│   │   ├── auth/
│   │   ├── products/
│   │   ├── orders/
│   │   ├── cart/
│   │   ├── admin/
│   │   └── upload/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/                   # Componentes reutilizables
│   ├── ui/                      # shadcn/ui components
│   ├── forms/
│   ├── layout/
│   └── features/
├── lib/                         # Utilidades y configuraciones
│   ├── auth.ts
│   ├── prisma.ts
│   ├── redis.ts
│   └── utils.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/
│   └── images/
├── types/                       # Tipos TypeScript
└── hooks/                       # Custom hooks
```

## NOTAS IMPORTANTES

1. **Vercel FREE Tier Limits**:
   - Postgres: 60 hours compute time/month
   - Blob Storage: 5GB/month
   - Funciones: 100GB-Hours/month

2. **Optimizaciones para FREE tier**:
   - Conexiones de DB con pooling
   - Imágenes optimizadas con Next.js Image
   - Rate limiting con Redis
   - Caching estratégico

3. **Seguridad**:
   - Validación de inputs con Zod
   - Rate limiting en APIs críticas
   - Sanitización de datos
   - RBAC (Role-Based Access Control)

4. **SEO & Performance**:
   - Server-side rendering para catálogo
   - Metadata dinámicos
   - Sitemap automático
   - Web Vitals optimization

## ESTADO ACTUAL DEL PROYECTO

### ✅ FUNCIONALIDADES COMPLETADAS

**🔐 Sistema de Autenticación Completo**
- Registro de usuarios con validación
- Login con email/contraseña (hash bcrypt)
- Verificación por email obligatoria
- Reenvío de tokens de verificación
- Roles de usuario (CUSTOMER, ADMIN, MANAGER, OPERATOR)
- Middleware de protección para rutas admin

**🛒 E-commerce Público**
- Homepage con productos destacados
- Catálogo completo con filtros y búsqueda
- Páginas de producto individuales
- Sistema de carrito de compras
- Gestión de categorías
- Header global con estado de login

**🏢 Panel Administrativo (Admin Dashboard)**
- Layout completo con sidebar y header responsive
- Dashboard principal con métricas clave
- Estadísticas en tiempo real (pedidos, productos, usuarios, ingresos)
- Alertas de stock bajo
- Navegación completa para todas las secciones admin
- Protección por roles (solo ADMIN puede acceder)

**📧 Sistema de Email**
- Configurado con Gmail SMTP
- Templates HTML profesionales
- Email de verificación de cuenta
- Email de bienvenida post-verificación
- Sistema de notificaciones por email

**🗄️ Base de Datos**
- Schema completo con todas las entidades ERP
- Configurada en Neon PostgreSQL
- Migraciones aplicadas correctamente
- Datos de productos de ejemplo

### ✅ SISTEMA COMPLETAMENTE FUNCIONAL
**Autenticación y Registro:**
- ✅ Sistema de registro con validación completa
- ✅ Verificación obligatoria por email (Gmail SMTP)
- ✅ Login con contraseñas hasheadas (bcrypt)
- ✅ Middleware de protección por roles
- ✅ Reenvío de tokens de verificación
- ✅ Emails HTML profesionales (verificación + bienvenida)

**Base de Datos:**
- ✅ Schema completo con campo password
- ✅ Cliente Prisma regenerado y sincronizado
- ✅ Datos de ejemplo poblados (productos, categorías, admin)
- ✅ Configuración para Perú (PEN, 18% IGV)

**Frontend Público:**
- ✅ Homepage con productos destacados
- ✅ Catálogo completo con filtros
- ✅ Páginas de producto individuales
- ✅ Sistema de carrito funcional
- ✅ Header global con estado de autenticación

**Panel Administrativo:**
- ✅ Dashboard completo con métricas en tiempo real
- ✅ Sidebar responsive con navegación completa
- ✅ Protección por middleware (solo ADMIN)
- ✅ Estadísticas de pedidos, productos, usuarios, ingresos
- ✅ Alertas de stock bajo

### 🚧 EN DESARROLLO
- Gestión completa de productos (CRUD admin)
- Gestión de pedidos y estados
- Sistema de subida de archivos/imágenes

### 📋 PENDIENTE
- Sistema de producción e inventario
- Reportes y analytics
- Deploy a producción

## CONFIGURACIÓN ACTUAL

**Base de Datos**: Neon PostgreSQL
**Email SMTP**: Gmail (snestors@gmail.com)
**Autenticación**: NextAuth.js con verificación obligatoria
**Archivos**: Vercel Blob Storage configurado

## COMANDOS ÚTILES ACTUALIZADOS

### Usuario Administrador
```bash
# Crear usuario ADMIN
node scripts/make-admin.js email@usuario.com

# Limpiar usuarios sin contraseña (desarrollo)
# Se puede hacer manualmente desde la DB si es necesario
```

### Testing
```bash
# Servidor desarrollo
npm run dev

# Acceso admin (requiere usuario ADMIN)
http://localhost:3000/admin

# Registro público
http://localhost:3000/auth/signup

# Login
http://localhost:3000/auth/signin
```

## PRÓXIMOS PASOS RECOMENDADOS

1. **Completar Admin Products** - CRUD completo de productos
2. **Sistema de Archivos** - Upload de imágenes con Vercel Blob
3. **Gestión de Pedidos** - Estados y seguimiento completo
4. **Deploy Producción** - Configurar Vercel con dominio

## CREDENCIALES DE DESARROLLO

- **Admin Dashboard**: `/admin` (requiere rol ADMIN)
- **Base de Datos**: Neon PostgreSQL (configurada)
- **Email SMTP**: Gmail configurado y funcional
- **Almacenamiento**: Vercel Blob listo para usar