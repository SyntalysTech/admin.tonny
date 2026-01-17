'use client'

import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  change?: {
    value: number
    type: 'increase' | 'decrease'
  }
  className?: string
}

export function StatsCard({ title, value, icon, change, className }: StatsCardProps) {
  return (
    <div
      className={cn(
        'bg-card rounded-xl sm:rounded-2xl border border-border p-3 sm:p-4 md:p-6',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm text-muted-foreground truncate">{title}</p>
          <p className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mt-0.5 sm:mt-1">{value}</p>
          {change && (
            <p
              className={cn(
                'text-xs sm:text-sm mt-1.5 sm:mt-2 flex items-center gap-1',
                change.type === 'increase' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              )}
            >
              <span>{change.type === 'increase' ? '+' : '-'}{Math.abs(change.value)}%</span>
              <span className="text-muted-foreground hidden sm:inline">vs mes anterior</span>
            </p>
          )}
        </div>
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
          {icon}
        </div>
      </div>
    </div>
  )
}
