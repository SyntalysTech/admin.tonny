'use client'

import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = cn(
      'inline-flex items-center justify-center font-medium rounded-lg transition-all',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:pointer-events-none',
      // iOS touch feedback
      'active:scale-[0.98] active:opacity-90',
      // Minimum touch target for iOS
      'min-h-[44px] sm:min-h-0'
    )

    const variants = {
      primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary active:bg-primary-dark',
      secondary: 'bg-gray text-white hover:bg-gray-dark focus:ring-gray active:bg-gray-dark',
      outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white focus:ring-primary active:bg-primary/90',
      ghost: 'text-gray-dark hover:bg-muted focus:ring-gray active:bg-muted/80',
      destructive: 'bg-destructive text-white hover:bg-red-600 focus:ring-destructive active:bg-red-700',
    }

    const sizes = {
      sm: 'h-9 sm:h-8 px-3 text-sm gap-1.5',
      md: 'h-11 sm:h-10 px-4 text-sm gap-2',
      lg: 'h-12 px-6 text-base gap-2',
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
