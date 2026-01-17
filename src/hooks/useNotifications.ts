'use client'

import { useState, useEffect, useCallback } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

export interface Notification {
  id: string
  user_id: string | null
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  read: boolean
  created_at: string
}

// Obtener cliente de forma lazy para evitar problemas de SSR
const getSupabase = () => createSupabaseBrowserClient()

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true)
    try {
      const supabase = getSupabase()

      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser()

      // Buscar notificaciones del usuario o globales (user_id = null)
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`user_id.eq.${user?.id},user_id.is.null`)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error fetching notifications:', error)
        setNotifications([])
        setUnreadCount(0)
      } else {
        setNotifications(data || [])
        setUnreadCount((data || []).filter((n: Notification) => !n.read).length)
      }
    } catch (err) {
      console.error('Error fetching notifications:', err)
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const markAsRead = useCallback(async (id: string) => {
    // Actualizar localmente primero
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))

    // Actualizar en DB
    try {
      const { error } = await getSupabase()
        .from('notifications')
        .update({ read: true })
        .eq('id', id)

      if (error) console.error('Error marking notification as read:', error)
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    // Actualizar localmente primero
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)

    // Actualizar en DB
    if (unreadIds.length > 0) {
      try {
        const { error } = await getSupabase()
          .from('notifications')
          .update({ read: true })
          .in('id', unreadIds)

        if (error) console.error('Error marking all notifications as read:', error)
      } catch (err) {
        console.error('Error marking all notifications as read:', err)
      }
    }
  }, [notifications])

  const addNotification = useCallback(async (
    title: string,
    message: string,
    type: 'info' | 'warning' | 'success' | 'error' = 'info',
    userId?: string
  ) => {
    try {
      const { data, error } = await getSupabase()
        .from('notifications')
        .insert({
          user_id: userId || null,
          title,
          message,
          type,
          read: false,
        })
        .select()
        .single()

      if (error) {
        console.error('Error adding notification:', error)
        return null
      }

      // Agregar a la lista local
      setNotifications((prev) => [data, ...prev])
      setUnreadCount((prev) => prev + 1)
      return data
    } catch (err) {
      console.error('Error adding notification:', err)
      return null
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    addNotification,
    refetch: fetchNotifications,
  }
}
