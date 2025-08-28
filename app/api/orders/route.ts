import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'No estás autenticado' },
        { status: 401 }
      )
    }

    const orders = await prisma.order.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                slug: true,
                images: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform the data
    const transformedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      total: parseFloat(order.total.toString()),
      createdAt: order.createdAt.toISOString(),
      items: order.items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: parseFloat(item.price.toString()),
        product: item.product
      }))
    }))

    return NextResponse.json(transformedOrders)
  } catch (error) {
    console.error('Error fetching user orders:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'No estás autenticado' },
        { status: 401 }
      )
    }
    
    /* 
    NUBEFACT API COMPATIBILITY FIELDS:
    Para Boleta de Venta (03):
    - tipo_documento: 03
    - numero_documento: optional (DNI)
    - nombre_comercial: customerName
    
    Para Factura (01):
    - tipo_documento: 01 
    - numero_documento: required (RUC 11 digits)
    - nombre_comercial: businessName
    - codigo_tipo_documento_identidad: 6 (RUC)
    
    Estructura general NubeFact:
    {
      operacion: "generar_comprobante",
      tipo_de_comprobante: "01" | "03", // 01=Factura, 03=Boleta
      serie: "F001" | "B001",
      numero: "1",
      sunat_transaction: 1,
      cliente_tipo_de_documento: "1" | "6", // 1=DNI, 6=RUC
      cliente_numero_de_documento: documentNumber,
      cliente_denominacion: customerName | businessName,
      cliente_direccion: shippingAddress,
      cliente_email: customerEmail,
      fecha_de_vencimiento: date,
      moneda: 1, // 1=PEN
      tipo_de_cambio: "",
      porcentaje_de_igv: 18.00,
      descuento_global: 0,
      total_descuento: 0,
      total_anticipo: 0,
      total_gravada: subtotal,
      total_inafecta: 0,
      total_exonerada: 0,
      total_igv: tax,
      total_gratuita: 0,
      total_otros_cargos: shippingCost,
      total: total,
      items: [{
        unidad_de_medida: "NIU",
        codigo: product.sku,
        descripcion: product.name,
        cantidad: quantity,
        valor_unitario: price,
        precio_unitario: price * 1.18,
        descuento: 0,
        subtotal: quantity * price,
        tipo_de_igv: 1,
        igv: subtotal * 0.18,
        total: subtotal + igv,
        anticipo_regularizacion: false
      }]
    }
    */

    const body = await request.json()
    const {
      items,
      customerName,
      customerEmail,
      customerPhone,
      documentType,
      documentNumber,
      businessName,
      shippingAddress,
      billingAddress,
      paymentMethod,
      notes
    } = body

    // Validar que haya items
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'El pedido debe tener al menos un producto' },
        { status: 400 }
      )
    }

    // Verificar stock y obtener productos
    const productIds = items.map((item: any) => item.productId)
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true
      }
    })

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: 'Algunos productos no están disponibles' },
        { status: 400 }
      )
    }

    // Verificar stock suficiente
    for (const item of items) {
      const product = products.find(p => p.id === item.productId)
      if (!product) {
        return NextResponse.json(
          { error: `Producto no encontrado: ${item.productId}` },
          { status: 400 }
        )
      }
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Stock insuficiente para ${product.name}. Stock disponible: ${product.stock}` },
          { status: 400 }
        )
      }
    }

    // Calcular totales
    let subtotal = 0
    const orderItems = []

    for (const item of items) {
      const product = products.find(p => p.id === item.productId)!
      const itemTotal = parseFloat(product.price.toString()) * item.quantity
      subtotal += itemTotal

      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: parseFloat(product.price.toString())
      })
    }

    const shippingCost = 15.00 // Costo fijo de envío
    const taxRate = 0.18 // IGV 18%
    const tax = subtotal * taxRate
    const total = subtotal + shippingCost + tax

    // Generar número de orden único
    const orderCount = await prisma.order.count()
    const orderNumber = `KN3D-${String(orderCount + 1).padStart(6, '0')}`

    // Crear la orden en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // Crear la orden
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: session.user.id,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          paymentMethod,
          customerName,
          customerEmail,
          customerPhone,
          documentType,
          documentNumber,
          businessName,
          shippingAddress,
          billingAddress,
          subtotal,
          shippingCost,
          tax,
          discount: 0,
          total,
          notes,
          items: {
            create: orderItems
          }
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  slug: true,
                  images: true
                }
              }
            }
          }
        }
      })

      // Actualizar stock de productos
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        })
      }

      // Limpiar carrito del usuario
      await tx.cartItem.deleteMany({
        where: {
          userId: session.user.id
        }
      })

      return order
    })

    // Transformar respuesta
    const transformedOrder = {
      id: result.id,
      orderNumber: result.orderNumber,
      status: result.status,
      paymentStatus: result.paymentStatus,
      total: parseFloat(result.total.toString()),
      createdAt: result.createdAt.toISOString(),
      items: result.items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: parseFloat(item.price.toString()),
        product: item.product
      }))
    }

    // Generar estructura compatible con NubeFact (para futura integración)
    const nubefactData = {
      operacion: "generar_comprobante",
      tipo_de_comprobante: documentType === 'factura' ? "01" : "03", // 01=Factura, 03=Boleta
      serie: documentType === 'factura' ? "F001" : "B001",
      numero: transformedOrder.orderNumber.split('-')[1], // Usar número de orden
      sunat_transaction: 1,
      cliente_tipo_de_documento: documentType === 'factura' ? "6" : "1", // 6=RUC, 1=DNI
      cliente_numero_de_documento: documentNumber || "",
      cliente_denominacion: documentType === 'factura' ? businessName : customerName,
      cliente_direccion: `${shippingAddress.street}, ${shippingAddress.district}, ${shippingAddress.city}, ${shippingAddress.state}`,
      cliente_email: customerEmail,
      fecha_de_vencimiento: new Date().toISOString().split('T')[0],
      moneda: 1, // PEN
      tipo_de_cambio: "",
      porcentaje_de_igv: 18.00,
      descuento_global: 0,
      total_descuento: 0,
      total_anticipo: 0,
      total_gravada: parseFloat(subtotal.toString()),
      total_inafecta: 0,
      total_exonerada: 0,
      total_igv: parseFloat(tax.toString()),
      total_gratuita: 0,
      total_otros_cargos: parseFloat(shippingCost.toString()),
      total: parseFloat(total.toString()),
      items: items.map((item: any) => {
        const product = products.find(p => p.id === item.productId)
        const itemSubtotal = item.quantity * parseFloat(item.price.toString())
        const itemIgv = itemSubtotal * 0.18
        
        return {
          unidad_de_medida: "NIU", // Unidad
          codigo: product?.sku || item.productId,
          descripcion: product?.name || "Producto",
          cantidad: item.quantity,
          valor_unitario: parseFloat(item.price.toString()),
          precio_unitario: parseFloat(item.price.toString()) * 1.18,
          descuento: 0,
          subtotal: itemSubtotal,
          tipo_de_igv: 1, // Gravado
          igv: itemIgv,
          total: itemSubtotal + itemIgv,
          anticipo_regularizacion: false
        }
      })
    }

    return NextResponse.json({
      message: 'Pedido creado exitosamente',
      order: transformedOrder,
      nubefact_data: nubefactData // Incluir datos para NubeFact (desarrollo)
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Error al crear el pedido' },
      { status: 500 }
    )
  }
}