'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/hooks/useSidebar'
import { useTheme } from '@/hooks/useTheme'
import {
  Package,
  Users,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  X,
  ChevronDown,
  Bot,
  LayoutDashboard,
} from 'lucide-react'
import { useState } from 'react'

interface NavItem {
  label: string
  href?: string
  icon: React.ReactNode
  children?: { label: string; href: string }[]
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/',
    icon: <LayoutDashboard size={20} />,
  },
  {
    label: 'TonnyAI',
    href: '/tonny-ai',
    icon: <Bot size={20} />,
  },
  {
    label: 'Inventario',
    icon: <Package size={20} />,
    children: [
      { label: 'Material Remodelacion', href: '/inventario/material-remodelacion' },
      { label: 'Herramientas Remodelacion', href: '/inventario/herramientas-remodelacion' },
      { label: 'Material Plomeria', href: '/inventario/material-plomeria' },
      { label: 'Herramientas Plomeria', href: '/inventario/herramientas-plomeria' },
    ],
  },
  {
    label: 'Entregas',
    icon: <Users size={20} />,
    children: [
      { label: 'Jordi', href: '/entregas/jordi' },
      { label: 'Gustavo', href: '/entregas/gustavo' },
      { label: 'David', href: '/entregas/david' },
      { label: 'Taurus', href: '/entregas/taurus' },
    ],
  },
  {
    label: 'Finanzas',
    icon: <ShoppingCart size={20} />,
    children: [
      { label: 'Registro de Compras', href: '/finanzas/registro-compras' },
      { label: 'Registro de Cotizaciones', href: '/finanzas/registro-cotizaciones' },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isCollapsed, isMobileOpen, toggle, setMobileOpen } = useSidebar()
  const { theme } = useTheme()
  const [expandedItems, setExpandedItems] = useState<string[]>(['Inventario', 'Entregas', 'Finanzas'])

  const isDark = theme === 'dark'

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]
    )
  }

  const isActive = (href: string) => pathname === href
  const isParentActive = (children?: { href: string }[]) =>
    children?.some((child) => pathname === child.href)

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full flex flex-col transition-all duration-300 ease-in-out',
          isDark
            ? 'bg-primary-dark border-r border-primary-dark/50'
            : 'bg-white border-r border-border',
          isCollapsed ? 'w-[72px]' : 'w-72 sm:w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          // iOS safe area
          'pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]'
        )}
      >
        {/* Logo Section */}
        <div className={cn(
          'h-14 sm:h-16 flex items-center justify-between px-4 border-b flex-shrink-0',
          isDark ? 'border-white/20' : 'border-border'
        )}>
          <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 overflow-hidden">
            {isCollapsed ? (
              <Image
                src={isDark ? '/logos/logo-icon-alone-white-512x512.png' : '/logos/logo-icon-alone-green-512x512.png'}
                alt="Tonny Admin"
                width={40}
                height={40}
                className="flex-shrink-0"
              />
            ) : (
              <Image
                src={isDark ? '/logos/logo-horizontal-icon-and-text-grey-800x200.png' : '/logos/logo-horizontal-icon-and-text-green-800x200.png'}
                alt="Tonny Admin"
                width={160}
                height={40}
                className="flex-shrink-0"
              />
            )}
          </Link>

          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileOpen(false)}
            className={cn(
              'lg:hidden p-2.5 -mr-1 rounded-xl transition-colors active:scale-95',
              isDark ? 'hover:bg-white/10 active:bg-white/20' : 'hover:bg-muted active:bg-muted/80'
            )}
          >
            <X size={22} className={isDark ? 'text-white' : 'text-gray'} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 overscroll-contain">
          {navItems.map((item) => (
            <div key={item.label} className="mb-1">
              {item.children ? (
                <>
                  <button
                    onClick={() => !isCollapsed && toggleExpanded(item.label)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-3 sm:py-2.5 rounded-xl text-sm font-medium transition-all',
                      'active:scale-[0.98]',
                      isParentActive(item.children)
                        ? isDark
                          ? 'bg-white/20 text-white'
                          : 'bg-primary/10 text-primary'
                        : isDark
                          ? 'text-white/80 hover:bg-white/10 active:bg-white/15 hover:text-white'
                          : 'text-gray-dark hover:bg-muted active:bg-muted/80 hover:text-foreground',
                      isCollapsed && 'justify-center'
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <span className={cn(
                      'flex-shrink-0',
                      isParentActive(item.children)
                        ? isDark ? 'text-white' : 'text-primary'
                        : isDark ? 'text-white/70' : 'text-gray'
                    )}>
                      {item.icon}
                    </span>
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 text-left truncate">{item.label}</span>
                        <ChevronDown
                          size={16}
                          className={cn(
                            'transition-transform duration-200',
                            isDark ? 'text-white/70' : 'text-gray',
                            expandedItems.includes(item.label) && 'rotate-180'
                          )}
                        />
                      </>
                    )}
                  </button>

                  {/* Submenu */}
                  {!isCollapsed && expandedItems.includes(item.label) && (
                    <div className={cn(
                      'mt-1 ml-4 pl-4 border-l space-y-0.5',
                      isDark ? 'border-white/20' : 'border-border'
                    )}>
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            'block px-3 py-2.5 sm:py-2 rounded-xl text-sm transition-all active:scale-[0.98]',
                            isActive(child.href)
                              ? isDark
                                ? 'bg-white text-primary-dark font-medium'
                                : 'bg-primary text-white font-medium'
                              : isDark
                                ? 'text-white/80 hover:bg-white/10 active:bg-white/15 hover:text-white'
                                : 'text-gray-dark hover:bg-muted active:bg-muted/80 hover:text-foreground'
                          )}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Collapsed Tooltip Menu */}
                  {isCollapsed && (
                    <div className="group relative">
                      <div className="absolute left-full top-0 ml-2 hidden group-hover:block z-50">
                        <div className={cn(
                          'rounded-xl shadow-lg py-2 min-w-[200px]',
                          isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-border'
                        )}>
                          <div className={cn(
                            'px-3 py-1.5 text-xs font-semibold uppercase',
                            isDark ? 'text-white/60' : 'text-gray'
                          )}>
                            {item.label}
                          </div>
                          {item.children.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => setMobileOpen(false)}
                              className={cn(
                                'block px-3 py-2.5 text-sm transition-colors',
                                isActive(child.href)
                                  ? 'bg-primary text-white'
                                  : isDark
                                    ? 'text-white/80 hover:bg-white/10'
                                    : 'text-gray-dark hover:bg-muted hover:text-foreground'
                              )}
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href={item.href!}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-3 sm:py-2.5 rounded-xl text-sm font-medium transition-all',
                    'active:scale-[0.98]',
                    isActive(item.href!)
                      ? isDark
                        ? 'bg-white text-primary-dark'
                        : 'bg-primary text-white'
                      : isDark
                        ? 'text-white/80 hover:bg-white/10 active:bg-white/15 hover:text-white'
                        : 'text-gray-dark hover:bg-muted active:bg-muted/80 hover:text-foreground',
                    isCollapsed && 'justify-center'
                  )}
                  title={isCollapsed ? item.label : undefined}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* Collapse Toggle - Desktop Only */}
        <div className={cn(
          'hidden lg:block border-t p-2 flex-shrink-0',
          isDark ? 'border-white/20' : 'border-border'
        )}>
          <button
            onClick={toggle}
            className={cn(
              'w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all',
              'active:scale-[0.98]',
              isDark
                ? 'text-white/70 hover:bg-white/10 hover:text-white'
                : 'text-gray hover:bg-muted hover:text-foreground'
            )}
          >
            {isCollapsed ? (
              <ChevronRight size={20} />
            ) : (
              <>
                <ChevronLeft size={20} />
                <span>Colapsar</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  )
}
