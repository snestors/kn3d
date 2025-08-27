import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import AuthProvider from '@/components/providers/session-provider'
import { ToastProvider } from '@/components/ui/toast'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'KN3D - E-commerce de Impresión 3D',
  description: 'Tu tienda especializada en productos y materiales para impresión 3D. Filamentos, resinas, impresoras y más.',
  keywords: ['impresión 3D', 'filamentos', 'resinas', 'impresoras 3D', 'PLA', 'ABS', 'PETG'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          <ToastProvider>
            <div className="min-h-screen bg-background">
              {children}
            </div>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}