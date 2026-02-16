'use client'

import { useRef, useState } from 'react'
import { Camera, Loader2, Upload, X } from 'lucide-react'
import { Button } from '../components/button'
import { toast } from 'sonner'

interface ImageUploadProps {
  currentImageUrl?: string | null
  onUpload: (file: File) => Promise<string>
  entityType: 'student' | 'teacher' | 'school'
  entityName?: string
  className?: string
}

export function ImageUpload({ currentImageUrl, onUpload, entityType, entityName, className = '' }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload JPEG, PNG, GIF, or WebP images.')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload
    setUploading(true)
    try {
      const imageUrl = await onUpload(file)
      toast.success(`${entityType === 'school' ? 'Logo' : 'Profile image'} uploaded successfully`)
      setPreview(imageUrl)
    } catch (error) {
      toast.error(`Failed to upload ${entityType === 'school' ? 'logo' : 'profile image'}`)
      setPreview(currentImageUrl || null)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <div className="relative">
        <div className={`${entityType === 'school' ? 'h-32 w-32' : 'h-24 w-24'} rounded-full overflow-hidden bg-muted flex items-center justify-center border-2 border-border`}>
          {preview ? (
            <img 
              src={preview} 
              alt={entityName || entityType} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              {entityType === 'school' ? <Upload className="h-8 w-8" /> : <Camera className="h-8 w-8" />}
              <span className="text-xs">No image</span>
            </div>
          )}
        </div>
        {preview && !uploading && (
          <Button
            type="button"
            variant="danger"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={handleRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleButtonClick}
        disabled={uploading}
      >
        {uploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Camera className="mr-2 h-4 w-4" />
            {preview ? 'Change' : 'Upload'} {entityType === 'school' ? 'Logo' : 'Photo'}
          </>
        )}
      </Button>
    </div>
  )
}
