'use client'

import { useAuth } from '@/contexts/AuthContext'
import { TonnyAIChat } from './TonnyAIChat'

export function TonnyAIWrapper() {
  const { user, isLoading } = useAuth()

  // Solo mostrar si el usuario está autenticado
  if (isLoading || !user) {
    return null
  }

  return <TonnyAIChat />
}
