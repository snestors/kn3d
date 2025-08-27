'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Bell, Search, Menu } from 'lucide-react'
import { useState } from 'react'

interface AdminHeaderProps {
  title: string
  subtitle?: string
  onMenuClick?: () => void
}

export default function AdminHeader({ title, subtitle, onMenuClick }: AdminHeaderProps) {
  const { data: session } = useSession()
  const [showNotifications, setShowNotifications] = useState(false)

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Title and mobile menu */}
          <div className="flex items-center">
            <button
              type="button"
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              onClick={onMenuClick}
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="ml-4 md:ml-0">
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              {subtitle && (
                <p className="text-sm text-gray-500">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Right side - Search, notifications, user menu */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="hidden lg:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                className="p-2 text-gray-400 hover:text-gray-500 relative"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="h-5 w-5" />
                {/* Notification badge */}
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  3
                </span>
              </button>

              {/* Notifications dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900">Notificaciones</h3>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <div className="p-4 hover:bg-gray-50">
                      <p className="text-sm text-gray-800">Nuevo pedido #1234</p>
                      <p className="text-xs text-gray-500">Hace 5 minutos</p>
                    </div>
                    <div className="p-4 hover:bg-gray-50">
                      <p className="text-sm text-gray-800">Stock bajo: Filamento PLA Rojo</p>
                      <p className="text-xs text-gray-500">Hace 1 hora</p>
                    </div>
                    <div className="p-4 hover:bg-gray-50">
                      <p className="text-sm text-gray-800">Usuario nuevo registrado</p>
                      <p className="text-xs text-gray-500">Hace 2 horas</p>
                    </div>
                  </div>
                  <div className="p-4 border-t border-gray-200">
                    <Link 
                      href="/admin/notifications" 
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Ver todas las notificaciones
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Quick links */}
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-gray-700"
              title="Ver tienda"
            >
              Ver Tienda
            </Link>
          </div>
        </div>
      </div>

      {/* Close notifications dropdown when clicking outside */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        />
      )}
    </div>
  )
}