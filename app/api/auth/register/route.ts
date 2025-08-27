import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { sendVerificationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, phone } = await request.json()

    // Validaciones
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nombre, email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Ya existe una cuenta con este email' },
        { status: 400 }
      )
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 12)

    // Crear el usuario (sin verificar email inicialmente)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword, // Guardar contraseña hasheada
        phone: phone || null,
        emailVerified: null, // No verificado inicialmente
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      }
    })

    // Generar token de verificación
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // Expira en 24 horas

    // Guardar token en la base de datos
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: verificationToken,
        expires: expiresAt,
      },
    })

    // Enviar email de verificación
    try {
      await sendVerificationEmail(email, verificationToken)
    } catch (emailError) {
      console.error('Error sending verification email:', emailError)
      // Si falla el envío del email, eliminamos el usuario y token creados
      await prisma.verificationToken.delete({
        where: { token: verificationToken }
      })
      await prisma.user.delete({
        where: { id: user.id }
      })
      
      return NextResponse.json(
        { error: 'Error al enviar el email de verificación. Inténtalo más tarde.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Cuenta creada exitosamente. Revisa tu email para verificar tu cuenta.',
      user: {
        ...user,
        emailVerified: false
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}