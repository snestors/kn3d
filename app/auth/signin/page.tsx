'use client'

import { useState, useEffect, Suspense } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function SignInForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [showResendButton, setShowResendButton] = useState(false)
  const [resendingEmail, setResendingEmail] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const error = searchParams.get('error')
    const msg = searchParams.get('message')

    if (error) {
      switch (error) {
        case 'invalid_verification_link':
          setError('Enlace de verificación inválido')
          break
        case 'invalid_token':
          setError('Token de verificación inválido')
          break
        case 'expired_token':
          setError('El enlace de verificación ha expirado. Solicita uno nuevo.')
          break
        case 'user_not_found':
          setError('Usuario no encontrado')
          break
        case 'verification_failed':
          setError('Error al verificar la cuenta. Inténtalo de nuevo.')
          break
        default:
          setError('Error de autenticación')
      }
    }

    if (msg) {
      switch (msg) {
        case 'email_verified':
          setMessage('¡Email verificado exitosamente! Ya puedes iniciar sesión.')
          break
        case 'already_verified':
          setMessage('Tu cuenta ya está verificada. Puedes iniciar sesión.')
          break
        default:
          setMessage(msg)
      }
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        if (result.error === 'EMAIL_NOT_VERIFIED') {
          setError('Debes verificar tu email antes de iniciar sesión. Revisa tu bandeja de entrada.')
          setShowResendButton(true)
        } else {
          setError('Email o contraseña incorrectos')
          setShowResendButton(false)
        }
      } else {
        // Verificar la sesión y redirigir
        const session = await getSession()
        if (session) {
          router.push('/products')
          router.refresh()
        }
      }
    } catch (error) {
      setError('Error al iniciar sesión')
      console.error('Sign in error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleResendVerification = async () => {
    if (!email) {
      setError('Por favor, ingresa tu email')
      return
    }

    setResendingEmail(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message)
        setShowResendButton(false)
      } else {
        setError(data.error || 'Error al reenviar el email')
      }
    } catch (error) {
      setError('Error de conexión. Inténtalo de nuevo.')
      console.error('Resend verification error:', error)
    } finally {
      setResendingEmail(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center">
          <div className="text-3xl font-bold text-blue-600">KN3D</div>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Iniciar Sesión
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Accede a tu cuenta para gestionar tus pedidos
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                {message}
              </div>
            )}

            {showResendButton && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendingEmail}
                  className="text-blue-600 hover:text-blue-500 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendingEmail ? '📧 Reenviando...' : '📧 Reenviar email de verificación'}
                </button>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Tu contraseña"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Iniciando...' : 'Iniciar Sesión'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Cuenta de prueba</span>
              </div>
            </div>

            <div className="mt-6 bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Para probar el sistema:</h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p><strong>Email:</strong> admin@kn3d.com</p>
                <p><strong>Contraseña:</strong> cualquier contraseña</p>
                <p className="text-xs mt-2 text-blue-600">
                  * En desarrollo, cualquier contraseña funciona
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/products"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              ← Volver al catálogo
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function SignInPageLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-3xl font-bold text-blue-600 text-center">KN3D</div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Iniciar Sesión
        </h2>
        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInPageLoading />}>
      <SignInForm />
    </Suspense>
  )
}