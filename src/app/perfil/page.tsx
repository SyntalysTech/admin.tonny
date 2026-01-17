'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { User, Mail, Shield, Calendar, Save } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

export default function PerfilPage() {
  const { user, profile } = useAuth()
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const supabase = createSupabaseBrowserClient()

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)
    setMessage(null)

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', user.id)

    if (error) {
      setMessage({ type: 'error', text: 'Error al actualizar el perfil' })
    } else {
      setMessage({ type: 'success', text: 'Perfil actualizado correctamente' })
    }

    setIsLoading(false)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800'
      case 'admin':
        return 'bg-primary/10 text-primary'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin'
      case 'admin':
        return 'Admin'
      default:
        return 'Usuario'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <MainLayout title="Mi Perfil" subtitle="Gestiona tu informacion personal">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Profile Info Card */}
        <Card>
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold">
                {profile?.full_name
                  ?.split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2) || user?.email?.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  {profile?.full_name || 'Usuario'}
                </h2>
                <p className="text-muted-foreground">{user?.email}</p>
                <span
                  className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(
                    profile?.role || 'user'
                  )}`}
                >
                  {getRoleLabel(profile?.role || 'user')}
                </span>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Mail size={20} className="text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Correo</p>
                  <p className="text-sm font-medium text-foreground">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Shield size={20} className="text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Rol</p>
                  <p className="text-sm font-medium text-foreground">
                    {getRoleLabel(profile?.role || 'user')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg sm:col-span-2">
                <Calendar size={20} className="text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Miembro desde</p>
                  <p className="text-sm font-medium text-foreground">
                    {profile?.created_at ? formatDate(profile.created_at) : '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Edit Profile Card */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Editar perfil</h3>

            {message && (
              <div
                className={`mb-4 px-4 py-3 rounded-lg text-sm ${
                  message.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <Input
                label="Nombre completo"
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Tu nombre completo"
                icon={<User size={18} />}
              />

              <Input
                label="Correo electronico"
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                icon={<Mail size={18} />}
              />

              <p className="text-xs text-muted-foreground">
                El correo electronico no se puede cambiar. Contacta con el Super Admin si necesitas
                modificarlo.
              </p>

              <Button type="submit" isLoading={isLoading}>
                <Save size={18} />
                Guardar cambios
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </MainLayout>
  )
}
