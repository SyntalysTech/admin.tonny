'use client'

import { cn } from '@/lib/utils'
import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string
  error?: string
  options: SelectOption[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, id, ...props }, ref) => {
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
          <select
            ref={ref}
            id={id}
            className={cn(
              // Base styles
              'w-full h-11 sm:h-10 px-3 pr-10 rounded-lg border border-border bg-card text-foreground',
              // Focus styles
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
              // Disabled styles
              'disabled:bg-muted disabled:cursor-not-allowed disabled:opacity-60',
              // Appearance
              'appearance-none cursor-pointer transition-colors',
              // iOS specific - prevent zoom on focus
              'text-base sm:text-sm',
              // Touch feedback
              'active:border-primary/50',
              // Error state
              error && 'border-destructive focus:ring-destructive',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray">
            <ChevronDown size={18} />
          </div>
        </div>
        {error && <p className="mt-1.5 text-sm text-destructive">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'
