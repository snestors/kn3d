'use client'

import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon, Loader } from 'lucide-react'

interface ImageUploadProps {
  images: string[]
  onImagesChange: (images: string[]) => void
  maxImages?: number
  className?: string
}

export default function ImageUpload({ 
  images, 
  onImagesChange, 
  maxImages = 10,
  className = ''
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    const remainingSlots = maxImages - images.length
    const filesToUpload = fileArray.slice(0, remainingSlots)

    if (filesToUpload.length > 0) {
      uploadFiles(filesToUpload)
    }

    if (fileArray.length > remainingSlots) {
      alert(`Solo se pueden subir ${remainingSlots} imagen(es) más`)
    }
  }

  const uploadFiles = async (files: File[]) => {
    setUploading(true)

    try {
      const formData = new FormData()
      files.forEach(file => {
        formData.append('files', file)
      })

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        onImagesChange([...images, ...result.urls])
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Error uploading files:', error)
      alert('Error al subir las imágenes')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (indexToRemove: number) => {
    const newImages = images.filter((_, index) => index !== indexToRemove)
    onImagesChange(newImages)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Imágenes del Producto ({images.length}/{maxImages})
      </label>

      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 transition-colors
          ${dragActive 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${images.length >= maxImages ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={images.length < maxImages ? openFileDialog : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          disabled={uploading || images.length >= maxImages}
        />

        <div className="text-center">
          {uploading ? (
            <div className="flex flex-col items-center">
              <Loader className="h-8 w-8 text-blue-500 animate-spin mb-2" />
              <p className="text-sm text-gray-600">Subiendo imágenes...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">
                {images.length >= maxImages 
                  ? 'Máximo de imágenes alcanzado'
                  : 'Arrastra imágenes aquí o haz clic para seleccionar'
                }
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, WEBP hasta 5MB
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((imageUrl, index) => (
            <div key={imageUrl} className="relative group">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={imageUrl}
                  alt={`Producto ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/placeholder.png'
                  }}
                />
              </div>
              
              {/* Remove Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  removeImage(index)
                }}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                title="Eliminar imagen"
              >
                <X className="h-3 w-3" />
              </button>

              {/* Primary Badge */}
              {index === 0 && (
                <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                  Principal
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Help Text */}
      <p className="mt-2 text-xs text-gray-500">
        La primera imagen será la imagen principal del producto. 
        Puedes subir hasta {maxImages} imágenes.
      </p>
    </div>
  )
}