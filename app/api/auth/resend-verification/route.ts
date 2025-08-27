import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { sendVerificationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email es requerido' },
        { status: 400 }
      )
    }

    // Buscar el usuario
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Si ya está verificado, no enviar email
    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'El email ya está verificado' },
        { status: 400 }
      )
    }

    // Eliminar tokens existentes para este email
    await prisma.verificationToken.deleteMany({
      where: { identifier: email }
    })

    // Generar nuevo token de verificación
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // Expira en 24 horas

    // Guardar nuevo token en la base de datos
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
      
      // Eliminar el token si falla el envío
      await prisma.verificationToken.delete({
        where: { token: verificationToken }
      })
      
      return NextResponse.json(
        { error: 'Error al enviar el email de verificación. Inténtalo más tarde.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Email de verificación enviado exitosamente. Revisa tu bandeja de entrada.',
    }, { status: 200 })

  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}