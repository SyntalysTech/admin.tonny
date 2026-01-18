'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSidebar } from '@/hooks/useSidebar'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/hooks/useNotifications'
import { useTheme } from '@/hooks/useTheme'
import { Menu, Bell, Search, LogOut, User, ChevronDown, Check, Info, AlertTriangle, CheckCircle, XCircle, Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HeaderProps {
  title: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  const router = useRouter()
  const { isCollapsed, setMobileOpen } = useSidebar()
  const { user, profile, signOut } = useAuth()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const { theme, toggleTheme } = useTheme()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  const isDark = theme === 'dark'

  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase()
    }
    return 'TA'
  }

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/auth/login'
  }

  return (
    <header
      className={cn(
        'fixed top-0 right-0 flex items-center justify-between px-4 md:px-6 z-30 transition-all duration-300',
        'pt-[env(safe-area-inset-top)] h-[calc(4rem+env(safe-area-inset-top))]',
        isDark
          ? 'bg-gray-900 border-b border-gray-700'
          : 'bg-white border-b border-border',
        isCollapsed ? 'lg:left-[72px]' : 'lg:left-64',
        'left-0'
      )}
    >
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileOpen(true)}
          className={cn(
            'lg:hidden p-2 rounded-lg transition-colors',
            isDark ? 'hover:bg-gray-800' : 'hover:bg-muted'
          )}
        >
          <Menu size={24} className={isDark ? 'text-gray-400' : 'text-gray'} />
        </button>

        {/* Page Title */}
        <div>
          <h1 className={cn(
            'text-lg md:text-xl font-semibold',
            isDark ? 'text-white' : 'text-foreground'
          )}>{title}</h1>
          {subtitle && (
            <p className={cn(
              'text-sm hidden sm:block',
              isDark ? 'text-gray-400' : 'text-muted-foreground'
            )}>{subtitle}</p>
          )}
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Search - Desktop Only */}
        <div className={cn(
          'hidden md:flex items-center gap-2 rounded-lg px-3 py-2',
          isDark ? 'bg-gray-800' : 'bg-muted'
        )}>
          <Search size={18} className={isDark ? 'text-gray-400' : 'text-gray'} />
          <input
            type="text"
            placeholder="Buscar..."
            className={cn(
              'bg-transparent border-none outline-none text-sm w-40 lg:w-60',
              isDark
                ? 'text-white placeholder:text-gray-500'
                : 'text-foreground placeholder:text-gray-light'
            )}
          />
        </div>

        {/* Mobile Search Button */}
        <button className={cn(
          'md:hidden p-2 rounded-lg transition-colors',
          isDark ? 'hover:bg-gray-800' : 'hover:bg-muted'
        )}>
          <Search size={20} className={isDark ? 'text-gray-400' : 'text-gray'} />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={cn(
            'p-2 rounded-lg transition-colors',
            isDark ? 'hover:bg-gray-800 text-yellow-400' : 'hover:bg-muted text-gray'
          )}
          title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={cn(
              'relative p-2 rounded-lg transition-colors',
              isDark ? 'hover:bg-gray-800' : 'hover:bg-muted'
            )}
          >
            <Bell size={20} className={isDark ? 'text-gray-400' : 'text-gray'} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-primary rounded-full text-[10px] text-white flex items-center justify-center font-medium">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifications(false)}
              />
              <div className={cn(
                'fixed sm:absolute right-2 sm:right-0 left-2 sm:left-auto top-[calc(4rem+env(safe-area-inset-top))] sm:top-full sm:mt-2 sm:w-96 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden',
                isDark
                  ? 'bg-gray-800 border border-gray-700'
                  : 'bg-white border border-border'
              )}>
                <div className={cn(
                  'p-3 flex items-center justify-between',
                  isDark ? 'border-b border-gray-700' : 'border-b border-border'
                )}>
                  <p className={cn(
                    'font-semibold',
                    isDark ? 'text-white' : 'text-foreground'
                  )}>Notificaciones</p>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllAsRead()}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <Check size={12} />
                      Marcar todas leidas
                    </button>
                  )}
                </div>
                <div className="overflow-y-auto max-h-72">
                  {notifications.length === 0 ? (
                    <div className={cn(
                      'p-4 text-center text-sm',
                      isDark ? 'text-gray-400' : 'text-muted-foreground'
                    )}>
                      No hay notificaciones
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => markAsRead(notification.id)}
                        className={cn(
                          'p-3 last:border-0 cursor-pointer transition-colors',
                          isDark
                            ? 'border-b border-gray-700 hover:bg-gray-700/50'
                            : 'border-b border-border hover:bg-muted/50',
                          !notification.read && (isDark ? 'bg-primary/10' : 'bg-primary/5')
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                            notification.type === 'info' && (isDark ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-600'),
                            notification.type === 'warning' && (isDark ? 'bg-amber-900/50 text-amber-400' : 'bg-amber-100 text-amber-600'),
                            notification.type === 'success' && (isDark ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-600'),
                            notification.type === 'error' && (isDark ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-600')
                          )}>
                            {notification.type === 'info' && <Info size={16} />}
                            {notification.type === 'warning' && <AlertTriangle size={16} />}
                            {notification.type === 'success' && <CheckCircle size={16} />}
                            {notification.type === 'error' && <XCircle size={16} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              'text-sm',
                              isDark ? 'text-white' : 'text-foreground',
                              !notification.read && 'font-medium'
                            )}>
                              {notification.title}
                            </p>
                            <p className={cn(
                              'text-xs mt-0.5 line-clamp-2',
                              isDark ? 'text-gray-400' : 'text-muted-foreground'
                            )}>
                              {notification.message}
                            </p>
                            <p className={cn(
                              'text-[10px] mt-1',
                              isDark ? 'text-gray-500' : 'text-muted-foreground'
                            )}>
                              {new Date(notification.created_at).toLocaleDateString('es-ES', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={cn(
              'flex items-center gap-2 p-1 rounded-lg transition-colors',
              isDark ? 'hover:bg-gray-800' : 'hover:bg-muted'
            )}
          >
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-semibold text-sm">
              {getInitials()}
            </div>
            <div className="hidden md:block text-left">
              <p className={cn(
                'text-sm font-medium',
                isDark ? 'text-white' : 'text-foreground'
              )}>
                {profile?.full_name || user?.email?.split('@')[0] || 'Usuario'}
              </p>
              <p className={cn(
                'text-xs capitalize',
                isDark ? 'text-gray-400' : 'text-muted-foreground'
              )}>
                {profile?.role?.replace('_', ' ') || 'Admin'}
              </p>
            </div>
            <ChevronDown size={16} className={cn(
              'hidden md:block',
              isDark ? 'text-gray-400' : 'text-gray'
            )} />
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
              <div className={cn(
                'absolute right-0 top-full mt-2 w-56 rounded-lg shadow-lg z-50',
                isDark
                  ? 'bg-gray-800 border border-gray-700'
                  : 'bg-white border border-border'
              )}>
                <div className={cn(
                  'p-3',
                  isDark ? 'border-b border-gray-700' : 'border-b border-border'
                )}>
                  <p className={cn(
                    'text-sm font-medium truncate',
                    isDark ? 'text-white' : 'text-foreground'
                  )}>
                    {profile?.full_name || 'Usuario'}
                  </p>
                  <p className={cn(
                    'text-xs truncate',
                    isDark ? 'text-gray-400' : 'text-muted-foreground'
                  )}>
                    {user?.email}
                  </p>
                </div>
                <div className="p-1">
                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      router.push('/perfil')
                    }}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors',
                      isDark
                        ? 'text-white hover:bg-gray-700'
                        : 'text-foreground hover:bg-muted'
                    )}
                  >
                    <User size={16} className={isDark ? 'text-gray-400' : 'text-gray'} />
                    Mi perfil
                  </button>
                  <button
                    onClick={handleSignOut}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors',
                      isDark
                        ? 'text-red-400 hover:bg-red-900/30'
                        : 'text-destructive hover:bg-red-50'
                    )}
                  >
                    <LogOut size={16} />
                    Cerrar sesion
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
