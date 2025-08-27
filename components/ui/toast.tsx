'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration?: number
}

interface ToastContextType {
  showToast: (message: string, type?: Toast['type'], duration?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = (message: string, type: Toast['type'] = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: Toast = { id, message, type, duration }
    
    setToasts(prev => [...prev, newToast])

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              px-6 py-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 ease-in-out
              ${toast.type === 'success' && 'bg-green-500 text-white'}
              ${toast.type === 'error' && 'bg-red-500 text-white'}
              ${toast.type === 'warning' && 'bg-yellow-500 text-white'}
              ${toast.type === 'info' && 'bg-blue-500 text-white'}
            `}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span>
                  {toast.type === 'success' && '✅'}
                  {toast.type === 'error' && '❌'}
                  {toast.type === 'warning' && '⚠️'}
                  {toast.type === 'info' && 'ℹ️'}
                </span>
                <span className="font-medium">{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-4 text-white hover:text-gray-200"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}