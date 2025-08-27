import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendWelcomeEmail } from '@/lib/email'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')
  const email = searchParams.get('email')

  if (!token || !email) {
    return NextResponse.redirect(
      new URL('/auth/signin?error=invalid_verification_link', request.url)
    )
  }

  try {
    // Buscar el token de verificación
    const verificationToken = await prisma.verificationToken.findUnique({
      where: {
        token,
        identifier: email,
      },
    })

    if (!verificationToken) {
      return NextResponse.redirect(
        new URL('/auth/signin?error=invalid_token', request.url)
      )
    }

    // Verificar que no haya expirado
    if (verificationToken.expires < new Date()) {
      // Eliminar token expirado
      await prisma.verificationToken.delete({
        where: {
          token,
        },
      })
      
      return NextResponse.redirect(
        new URL('/auth/signin?error=expired_token', request.url)
      )
    }

    // Buscar el usuario
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.redirect(
        new URL('/auth/signin?error=user_not_found', request.url)
      )
    }

    // Si ya está verificado, redirigir directamente
    if (user.emailVerified) {
      return NextResponse.redirect(
        new URL('/auth/signin?message=already_verified', request.url)
      )
    }

    // Marcar email como verificado
    await prisma.user.update({
      where: { email },
      data: {
        emailVerified: new Date(),
      },
    })

    // Eliminar el token de verificación
    await prisma.verificationToken.delete({
      where: {
        token,
      },
    })

    // Enviar email de bienvenida
    try {
      await sendWelcomeEmail(email, user.name || 'Usuario')
    } catch (error) {
      console.error('Error sending welcome email:', error)
      // No falla la verificación si el email de bienvenida falla
    }

    // Redirigir a página de éxito
    return NextResponse.redirect(
      new URL('/auth/signin?message=email_verified', request.url)
    )
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.redirect(
      new URL('/auth/signin?error=verification_failed', request.url)
    )
  }
}