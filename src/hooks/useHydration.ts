'use client'

import { useEffect, useState } from 'react'

/**
 * Hook para manejar la hidratación de Zustand en Next.js
 * Evita problemas de SSR/CSR mismatch
 */
export function useHydration() {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  return isHydrated
}

/**
 * Hook para ejecutar un fetch solo una vez cuando el componente está hidratado
 * Previene race conditions y múltiples llamadas
 */
export function useFetchOnMount(
  fetchFn: () => Promise<void>,
  deps: unknown[] = []
) {
  const isHydrated = useHydration()
  const [hasFetched, setHasFetched] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Solo ejecutar si está hidratado y no ha fetcheado aún
    if (!isHydrated || hasFetched) return

    let isMounted = true

    const doFetch = async () => {
      try {
        setIsLoading(true)
        setError(null)
        await fetchFn()
        if (isMounted) {
          setHasFetched(true)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Error desconocido')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    doFetch()

    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, hasFetched, ...deps])

  // Función para refrescar manualmente
  const refresh = async () => {
    setIsLoading(true)
    setError(null)
    try {
      await fetchFn()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }

  return { isLoading: !isHydrated || isLoading, error, refresh, isHydrated }
}
