import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { id } = await params
    const { quantity } = await request.json()

    if (!quantity || quantity < 1) {
      return NextResponse.json(
        { error: 'Cantidad debe ser mayor a 0' },
        { status: 400 }
      )
    }

    const cartItem = await prisma.cartItem.update({
      where: {
        id: id,
        userId: session.user.id
      },
      data: { quantity },
      include: {
        product: {
          select: {
            name: true,
            price: true,
            stock: true
          }
        }
      }
    })

    return NextResponse.json(cartItem)
  } catch (error) {
    console.error('Error updating cart item:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { id } = await params
    await prisma.cartItem.delete({
      where: {
        id: id,
        userId: session.user.id
      }
    })

    return NextResponse.json({ message: 'Item removido del carrito' })
  } catch (error) {
    console.error('Error removing cart item:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}