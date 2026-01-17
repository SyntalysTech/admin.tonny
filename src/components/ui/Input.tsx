'use client'

import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={id}
            className={cn(
              // Base styles
              'w-full h-11 sm:h-10 px-3 rounded-lg border border-border bg-card text-foreground',
              'placeholder:text-gray-light dark:placeholder:text-gray-500',
              // Focus styles
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
              // Disabled styles
              'disabled:bg-muted disabled:cursor-not-allowed disabled:opacity-60',
              // Transition
              'transition-colors',
              // iOS specific - prevent zoom on focus
              'text-base sm:text-sm',
              // Touch feedback
              'active:border-primary/50',
              // Icon padding
              icon && 'pl-10',
              // Error state
              error && 'border-destructive focus:ring-destructive',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1.5 text-sm text-destructive">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
