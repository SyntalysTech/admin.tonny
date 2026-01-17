'use client'

import { create } from 'zustand'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import type { ResponsiblePerson } from '@/types/database'

// Obtener cliente de forma lazy para evitar problemas de SSR
const getSupabase = () => createSupabaseBrowserClient()

interface DeliveryWithProduct {
  id: string
  product_id: string
  quantity: number
  responsible: ResponsiblePerson
  notes?: string
  delivered_at: string
  created_at: string
  product?: {
    id: string
    name: string
    category: string
    unit: string
  }
}

interface DeliveriesState {
  deliveries: DeliveryWithProduct[]
  isLoading: boolean
  error: string | null

  fetchDeliveries: (responsible?: ResponsiblePerson) => Promise<void>
}

export const useDeliveries = create<DeliveriesState>((set) => ({
  deliveries: [],
  isLoading: false,
  error: null,

  fetchDeliveries: async (responsible) => {
    set({ isLoading: true, error: null })

    try {
      let query = getSupabase()
        .from('deliveries')
        .select('*, product:products(id, name, category, unit)')
        .order('delivered_at', { ascending: false })

      if (responsible) {
        query = query.eq('responsible', responsible)
      }

      const { data, error } = await query

      if (error) throw error

      set({ deliveries: data || [] })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ isLoading: false })
    }
  },
}))
