'use client'

import { create } from 'zustand'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import type { Purchase, Quote, PurchaseStatus, QuoteStatus, PaymentMethod } from '@/types/database'
import { useEffect, useRef, useState } from 'react'
import { useHydration } from './useHydration'

const getSupabase = () => createSupabaseBrowserClient()

// ============== PURCHASES STORE ==============
interface PurchasesState {
  purchases: Purchase[]
  isLoading: boolean
  error: string | null
  hasFetched: boolean

  fetchPurchases: () => Promise<void>
  addPurchase: (purchase: Omit<Purchase, 'id' | 'created_at'>) => Promise<Purchase | null>
  updatePurchase: (id: string, updates: Partial<Purchase>) => Promise<boolean>
  deletePurchase: (id: string) => Promise<boolean>
}

export const usePurchasesStore = create<PurchasesState>((set, get) => ({
  purchases: [],
  isLoading: false,
  error: null,
  hasFetched: false,

  fetchPurchases: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await getSupabase()
        .from('purchases')
        .select('*')
        .order('purchased_at', { ascending: false })

      if (error) throw error
      set({ purchases: data || [], hasFetched: true })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ isLoading: false })
    }
  },

  addPurchase: async (purchase) => {
    try {
      const { data, error } = await getSupabase()
        .from('purchases')
        .insert(purchase)
        .select()
        .single()

      if (error) throw error

      set({ purchases: [data, ...get().purchases] })
      return data
    } catch (error) {
      set({ error: (error as Error).message })
      return null
    }
  },

  updatePurchase: async (id, updates) => {
    try {
      const { error } = await getSupabase()
        .from('purchases')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      set({
        purchases: get().purchases.map((p) =>
          p.id === id ? { ...p, ...updates } : p
        ),
      })
      return true
    } catch (error) {
      set({ error: (error as Error).message })
      return false
    }
  },

  deletePurchase: async (id) => {
    try {
      const { error } = await getSupabase()
        .from('purchases')
        .delete()
        .eq('id', id)

      if (error) throw error

      set({ purchases: get().purchases.filter((p) => p.id !== id) })
      return true
    } catch (error) {
      set({ error: (error as Error).message })
      return false
    }
  },
}))

/**
 * Hook que garantiza la carga de compras con manejo de hidratación
 */
export function usePurchases() {
  const isHydrated = useHydration()
  const hasFetchedRef = useRef(false)
  const [localLoading, setLocalLoading] = useState(true)

  const store = usePurchasesStore()
  const { fetchPurchases, hasFetched, ...rest } = store

  useEffect(() => {
    if (!isHydrated) return

    if (hasFetchedRef.current || hasFetched) {
      setLocalLoading(false)
      return
    }

    hasFetchedRef.current = true
    setLocalLoading(true)

    fetchPurchases().finally(() => {
      setLocalLoading(false)
    })
  }, [isHydrated, fetchPurchases, hasFetched])

  return {
    ...rest,
    fetchPurchases,
    isLoading: !isHydrated || localLoading || rest.isLoading,
  }
}

// ============== QUOTES STORE ==============
interface QuotesState {
  quotes: Quote[]
  isLoading: boolean
  error: string | null
  hasFetched: boolean

  fetchQuotes: () => Promise<void>
  addQuote: (quote: Omit<Quote, 'id' | 'created_at'>) => Promise<Quote | null>
  updateQuote: (id: string, updates: Partial<Quote>) => Promise<boolean>
  deleteQuote: (id: string) => Promise<boolean>
}

export const useQuotesStore = create<QuotesState>((set, get) => ({
  quotes: [],
  isLoading: false,
  error: null,
  hasFetched: false,

  fetchQuotes: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await getSupabase()
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      set({ quotes: data || [], hasFetched: true })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ isLoading: false })
    }
  },

  addQuote: async (quote) => {
    try {
      const { data, error } = await getSupabase()
        .from('quotes')
        .insert(quote)
        .select()
        .single()

      if (error) throw error

      set({ quotes: [data, ...get().quotes] })
      return data
    } catch (error) {
      set({ error: (error as Error).message })
      return null
    }
  },

  updateQuote: async (id, updates) => {
    try {
      const { error } = await getSupabase()
        .from('quotes')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      set({
        quotes: get().quotes.map((q) =>
          q.id === id ? { ...q, ...updates } : q
        ),
      })
      return true
    } catch (error) {
      set({ error: (error as Error).message })
      return false
    }
  },

  deleteQuote: async (id) => {
    try {
      const { error } = await getSupabase()
        .from('quotes')
        .delete()
        .eq('id', id)

      if (error) throw error

      set({ quotes: get().quotes.filter((q) => q.id !== id) })
      return true
    } catch (error) {
      set({ error: (error as Error).message })
      return false
    }
  },
}))

/**
 * Hook que garantiza la carga de cotizaciones con manejo de hidratación
 */
export function useQuotes() {
  const isHydrated = useHydration()
  const hasFetchedRef = useRef(false)
  const [localLoading, setLocalLoading] = useState(true)

  const store = useQuotesStore()
  const { fetchQuotes, hasFetched, ...rest } = store

  useEffect(() => {
    if (!isHydrated) return

    if (hasFetchedRef.current || hasFetched) {
      setLocalLoading(false)
      return
    }

    hasFetchedRef.current = true
    setLocalLoading(true)

    fetchQuotes().finally(() => {
      setLocalLoading(false)
    })
  }, [isHydrated, fetchQuotes, hasFetched])

  return {
    ...rest,
    fetchQuotes,
    isLoading: !isHydrated || localLoading || rest.isLoading,
  }
}

// Helper functions
export const getPurchaseStatusColor = (status: PurchaseStatus): 'success' | 'warning' | 'destructive' | 'default' => {
  switch (status) {
    case 'completada':
      return 'success'
    case 'pendiente':
      return 'warning'
    case 'cancelada':
      return 'destructive'
    default:
      return 'default'
  }
}

export const getQuoteStatusColor = (status: QuoteStatus): 'success' | 'warning' | 'destructive' | 'default' => {
  switch (status) {
    case 'aprobada':
      return 'success'
    case 'pendiente':
      return 'warning'
    case 'rechazada':
      return 'destructive'
    case 'vencida':
      return 'default'
    default:
      return 'default'
  }
}

export const getPurchaseStatusLabel = (status: PurchaseStatus) => {
  switch (status) {
    case 'completada':
      return 'Completada'
    case 'pendiente':
      return 'Pendiente'
    case 'cancelada':
      return 'Cancelada'
    default:
      return status
  }
}

export const getQuoteStatusLabel = (status: QuoteStatus) => {
  switch (status) {
    case 'aprobada':
      return 'Aprobada'
    case 'pendiente':
      return 'Pendiente'
    case 'rechazada':
      return 'Rechazada'
    case 'vencida':
      return 'Vencida'
    default:
      return status
  }
}

export const getPaymentMethodLabel = (method: PaymentMethod) => {
  switch (method) {
    case 'efectivo':
      return 'Efectivo'
    case 'transferencia':
      return 'Transferencia'
    case 'tarjeta':
      return 'Tarjeta'
    case 'credito':
      return 'Crédito'
    default:
      return method
  }
}

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount)
}
