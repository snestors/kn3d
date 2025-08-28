import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { put } from '@vercel/blob'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No tienes permisos para subir archivos' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No se han enviado archivos' },
        { status: 400 }
      )
    }

    const uploadedUrls: string[] = []

    for (const file of files) {
      if (!file || file.size === 0) continue

      // Validar tipo de archivo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `Tipo de archivo no permitido: ${file.type}. Solo se permiten imágenes.` },
          { status: 400 }
        )
      }

      // Validar tamaño de archivo (5MB máximo)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: 'El archivo es demasiado grande. Tamaño máximo: 5MB' },
          { status: 400 }
        )
      }

      // Generar nombre único para el archivo
      const timestamp = Date.now()
      const randomStr = Math.random().toString(36).substring(2, 8)
      const fileExtension = file.name.split('.').pop()
      const fileName = `products/${timestamp}-${randomStr}.${fileExtension}`

      try {
        const blob = await put(fileName, file, {
          access: 'public',
        })
        
        uploadedUrls.push(blob.url)
      } catch (uploadError) {
        console.error('Error uploading to Vercel Blob:', uploadError)
        return NextResponse.json(
          { error: 'Error al subir el archivo' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      message: `${uploadedUrls.length} archivo(s) subido(s) exitosamente`,
      urls: uploadedUrls
    })

  } catch (error) {
    console.error('Error in upload route:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar archivos' },
        { status: 403 }
      )
    }

    const { url } = await request.json()
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL del archivo requerida' },
        { status: 400 }
      )
    }

    // TODO: Implement blob deletion when available in Vercel Blob API
    // For now, we'll just return success as Vercel Blob doesn't have a delete API yet
    
    return NextResponse.json({
      message: 'Archivo marcado para eliminación'
    })

  } catch (error) {
    console.error('Error in delete route:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}