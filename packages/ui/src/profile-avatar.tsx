'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@mozedu/ui'
import { User } from 'lucide-react'

interface ProfileAvatarProps {
  imageUrl?: string | null
  name?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-16 w-16 text-base',
  xl: 'h-24 w-24 text-lg',
}

export function ProfileAvatar({ imageUrl, name, size = 'md', className = '' }: ProfileAvatarProps) {
  const [imageError, setImageError] = useState(false)

  const getInitials = (name?: string) => {
    if (!name) return '?'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      {imageUrl && !imageError ? (
        <AvatarImage
          src={imageUrl}
          alt={name || 'Profile'}
          onError={() => setImageError(true)}
        />
      ) : null}
      <AvatarFallback className="bg-primary/10 text-primary">
        {name ? getInitials(name) : <User className="h-1/2 w-1/2" />}
      </AvatarFallback>
    </Avatar>
  )
}
