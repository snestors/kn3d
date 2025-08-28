import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No tienes permisos para realizar esta acción' },
        { status: 403 }
      )
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: true,
                sku: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 }
      )
    }

    // Transform the data
    const transformedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      paymentId: order.paymentId,
      shippingAddress: order.shippingAddress,
      billingAddress: order.billingAddress,
      subtotal: parseFloat(order.subtotal.toString()),
      shippingCost: parseFloat(order.shippingCost.toString()),
      tax: parseFloat(order.tax.toString()),
      discount: parseFloat(order.discount.toString()),
      total: parseFloat(order.total.toString()),
      notes: order.notes,
      internalNotes: order.internalNotes,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      shippedAt: order.shippedAt?.toISOString() || null,
      deliveredAt: order.deliveredAt?.toISOString() || null,
      user: order.user,
      items: order.items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: parseFloat(item.price.toString()),
        product: item.product
      }))
    }

    return NextResponse.json(transformedOrder)
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No tienes permisos para realizar esta acción' },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // Verificar si el pedido existe
    const existingOrder = await prisma.order.findUnique({
      where: { id }
    })

    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 }
      )
    }

    const updateData: any = {}

    // Solo actualizar campos permitidos
    if (body.status !== undefined) {
      updateData.status = body.status
      
      // Actualizar fechas automáticamente según el estado
      if (body.status === 'SHIPPED' && !existingOrder.shippedAt) {
        updateData.shippedAt = new Date()
      }
      if (body.status === 'DELIVERED' && !existingOrder.deliveredAt) {
        updateData.deliveredAt = new Date()
      }
    }
    
    if (body.paymentStatus !== undefined) {
      updateData.paymentStatus = body.paymentStatus
    }
    
    if (body.internalNotes !== undefined) {
      updateData.internalNotes = body.internalNotes
    }

    if (body.shippingCost !== undefined) {
      updateData.shippingCost = parseFloat(body.shippingCost)
    }

    if (body.tax !== undefined) {
      updateData.tax = parseFloat(body.tax)
    }

    if (body.discount !== undefined) {
      updateData.discount = parseFloat(body.discount)
    }

    // Recalcular total si se cambiaron costos
    if (body.shippingCost !== undefined || body.tax !== undefined || body.discount !== undefined) {
      const currentSubtotal = parseFloat(existingOrder.subtotal.toString())
      const newShippingCost = parseFloat(body.shippingCost ?? existingOrder.shippingCost.toString())
      const newTax = parseFloat(body.tax ?? existingOrder.tax.toString())
      const newDiscount = parseFloat(body.discount ?? existingOrder.discount.toString())
      
      updateData.total = currentSubtotal + newShippingCost + newTax - newDiscount
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                images: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Pedido actualizado correctamente',
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        customerName: updatedOrder.customerName,
        customerEmail: updatedOrder.customerEmail,
        status: updatedOrder.status,
        paymentStatus: updatedOrder.paymentStatus,
        total: parseFloat(updatedOrder.total.toString()),
        updatedAt: updatedOrder.updatedAt.toISOString()
      }
    })
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: 'Error al actualizar el pedido' },
      { status: 500 }
    )
  }
}