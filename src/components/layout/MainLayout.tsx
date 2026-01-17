'use client'

import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useSidebar } from '@/hooks/useSidebar'
import { cn } from '@/lib/utils'

interface MainLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

export function MainLayout({ children, title, subtitle }: MainLayoutProps) {
  const { isCollapsed } = useSidebar()

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <Header title={title} subtitle={subtitle} />

        <main
          className={cn(
            // Responsive top padding for header
            'pt-14 sm:pt-16 min-h-screen transition-all duration-300',
            // Sidebar spacing
            isCollapsed ? 'lg:pl-[72px]' : 'lg:pl-64',
            // iOS safe area at bottom
            'pb-[env(safe-area-inset-bottom)]'
          )}
        >
          <div className="p-3 sm:p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
