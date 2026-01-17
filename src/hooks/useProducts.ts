'use client'

import { create } from 'zustand'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import type { Product, ProductCategory, StockMovement, ResponsiblePerson } from '@/types/database'
import { useEffect, useRef, useState } from 'react'
import { useHydration } from './useHydration'

// Obtener cliente de forma lazy para evitar problemas de SSR
const getSupabase = () => createSupabaseBrowserClient()

interface ProductsState {
  products: Product[]
  movements: StockMovement[]
  isLoading: boolean
  error: string | null
  lastFetchCategory: ProductCategory | 'all' | null

  // Actions
  fetchProducts: (category?: ProductCategory) => Promise<void>
  fetchMovements: (productId?: string) => Promise<void>
  addProduct: (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>
  deleteProduct: (id: string) => Promise<void>
  addMovement: (
    productId: string,
    quantity: number,
    movementType: 'entrada' | 'salida' | 'ajuste',
    responsible: ResponsiblePerson | null,
    notes?: string
  ) => Promise<void>
}

export const useProductsStore = create<ProductsState>((set, get) => ({
  products: [],
  movements: [],
  isLoading: false,
  error: null,
  lastFetchCategory: null,

  fetchProducts: async (category) => {
    set({ isLoading: true, error: null })

    try {
      let query = getSupabase().from('products').select('*').order('name')

      if (category) {
        query = query.eq('category', category)
      }

      const { data, error } = await query

      if (error) throw error

      set({
        products: data || [],
        lastFetchCategory: category || 'all'
      })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ isLoading: false })
    }
  },

  fetchMovements: async (productId) => {
    set({ isLoading: true, error: null })

    try {
      let query = getSupabase()
        .from('stock_movements')
        .select('*, product:products(*)')
        .order('created_at', { ascending: false })

      if (productId) {
        query = query.eq('product_id', productId)
      }

      const { data, error } = await query

      if (error) throw error

      set({ movements: data || [] })
    } catch (error) {
      set({ error: (error as Error).message })
    } finally {
      set({ isLoading: false })
    }
  },

  addProduct: async (product) => {
    set({ isLoading: true, error: null })

    try {
      const { data, error } = await getSupabase()
        .from('products')
        .insert(product)
        .select()
        .single()

      if (error) throw error

      set((state) => ({
        products: [...state.products, data].sort((a, b) => a.name.localeCompare(b.name)),
      }))
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  updateProduct: async (id, updates) => {
    set({ isLoading: true, error: null })

    try {
      const { data, error } = await getSupabase()
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      set((state) => ({
        products: state.products
          .map((p) => (p.id === id ? data : p))
          .sort((a, b) => a.name.localeCompare(b.name)),
      }))
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  deleteProduct: async (id) => {
    set({ isLoading: true, error: null })

    try {
      const { error } = await getSupabase().from('products').delete().eq('id', id)

      if (error) throw error

      set((state) => ({
        products: state.products.filter((p) => p.id !== id),
      }))
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  addMovement: async (productId, quantity, movementType, responsible, notes) => {
    set({ isLoading: true, error: null })

    try {
      // First, get the current product
      const product = get().products.find((p) => p.id === productId)
      if (!product) throw new Error('Producto no encontrado')

      // Calculate new stock
      let newStock: number
      if (movementType === 'entrada') {
        newStock = product.stock + quantity
      } else if (movementType === 'salida') {
        if (quantity > product.stock) {
          throw new Error('No hay suficiente stock disponible')
        }
        newStock = product.stock - quantity
      } else {
        newStock = quantity
      }

      // Insert movement
      const { error: movementError } = await getSupabase().from('stock_movements').insert({
        product_id: productId,
        quantity,
        movement_type: movementType,
        responsible,
        notes,
      })

      if (movementError) throw movementError

      // Update product stock
      const { error: updateError } = await getSupabase()
        .from('products')
        .update({ stock: newStock })
        .eq('id', productId)

      if (updateError) throw updateError

      // If it's a salida with a responsible, also add to deliveries
      if (movementType === 'salida' && responsible) {
        const { error: deliveryError } = await getSupabase().from('deliveries').insert({
          product_id: productId,
          quantity,
          responsible,
          notes,
          delivered_at: new Date().toISOString(),
        })

        if (deliveryError) throw deliveryError
      }

      // Update local state
      set((state) => ({
        products: state.products.map((p) =>
          p.id === productId ? { ...p, stock: newStock } : p
        ),
      }))
    } catch (error) {
      set({ error: (error as Error).message })
      throw error
    } finally {
      set({ isLoading: false })
    }
  },
}))

/**
 * Hook que garantiza la carga de productos con manejo de hidratación
 */
export function useProducts(category?: ProductCategory) {
  const isHydrated = useHydration()
  const hasFetchedRef = useRef(false)
  const [localLoading, setLocalLoading] = useState(true)

  const store = useProductsStore()
  const { fetchProducts, lastFetchCategory, ...rest } = store

  useEffect(() => {
    // No hacer nada hasta que esté hidratado
    if (!isHydrated) return

    const categoryKey = category || 'all'

    // Si ya fetcheamos esta categoría, no volver a hacerlo
    if (hasFetchedRef.current && lastFetchCategory === categoryKey) {
      setLocalLoading(false)
      return
    }

    // Marcar como que vamos a fetchear
    hasFetchedRef.current = true
    setLocalLoading(true)

    fetchProducts(category).finally(() => {
      setLocalLoading(false)
    })
  }, [isHydrated, category, fetchProducts, lastFetchCategory])

  // Reset cuando cambia la categoría
  useEffect(() => {
    hasFetchedRef.current = false
  }, [category])

  return {
    ...rest,
    fetchProducts,
    isLoading: !isHydrated || localLoading || rest.isLoading,
  }
}
