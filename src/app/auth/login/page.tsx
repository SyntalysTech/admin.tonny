'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/hooks/useTheme'
import { PublicRoute } from '@/components/auth/PublicRoute'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { signIn } = useAuth()
  const { theme } = useTheme()
  const router = useRouter()

  const isDark = theme === 'dark'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const { error } = await signIn(email, password)

    if (error) {
      setError('Correo o contraseña incorrectos')
      setIsLoading(false)
      return
    }

    router.push('/')
  }

  return (
    <PublicRoute>
      <div className="min-h-screen bg-background flex pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        {/* Left Side - Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Logo */}
            <div className="mb-8 text-center">
              <Image
                src={isDark ? '/logos/logo-horizontal-icon-and-text-grey-800x200.png' : '/logos/logo-horizontal-icon-and-text-green-800x200.png'}
                alt="Admin Tonny"
                width={200}
                height={50}
                className="mx-auto"
              />
            </div>

            {/* Title */}
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold text-foreground">Bienvenido de vuelta</h1>
              <p className="text-muted-foreground mt-2">Ingresa tus credenciales para acceder</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <Input
                label="Correo electronico"
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                icon={<Mail size={18} />}
                required
              />

              <div className="relative">
                <Input
                  label="Contraseña"
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tu contraseña"
                  icon={<Lock size={18} />}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-gray hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <Button type="submit" className="w-full" isLoading={isLoading}>
                Iniciar sesion
              </Button>
            </form>
          </div>
        </div>

        {/* Right Side - Decorative */}
        <div className="hidden lg:flex flex-1 bg-primary items-center justify-center p-8">
          <div className="text-center text-white max-w-md">
            <Image
              src="/logos/logo-icon-alone-white-512x512.png"
              alt="Logo"
              width={120}
              height={120}
              className="mx-auto mb-8"
            />
            <h2 className="text-3xl font-bold mb-4">Sistema de Inventario</h2>
            <p className="text-white/80 text-lg">
              Gestiona tu inventario de materiales y herramientas de manera eficiente
            </p>
          </div>
        </div>
      </div>
    </PublicRoute>
  )
}
