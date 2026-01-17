'use client'

import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { useEffect, useCallback } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
      // Prevent iOS scroll bounce
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
      document.body.style.position = ''
      document.body.style.width = ''
    }
  }, [isOpen, handleEscape])

  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          'relative w-full bg-card shadow-xl border border-border',
          // Mobile: slide from bottom, full width, rounded top
          'rounded-t-2xl sm:rounded-xl',
          'mx-0 sm:mx-4',
          // Animation
          'animate-in fade-in-0 slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200',
          // Height constraints
          'max-h-[85vh] sm:max-h-[90vh] flex flex-col',
          // Safe area for iOS
          'pb-[env(safe-area-inset-bottom)]',
          sizes[size]
        )}
      >
        {/* iOS Drag Handle */}
        <div className="flex justify-center pt-2 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border">
          <h2 className="text-base sm:text-lg font-semibold text-foreground">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 -mr-1 rounded-lg hover:bg-muted active:bg-muted/80 transition-colors touch-target"
          >
            <X size={20} className="text-gray" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 overscroll-contain">{children}</div>
      </div>
    </div>
  )
}
