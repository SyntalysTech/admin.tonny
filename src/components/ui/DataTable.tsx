'use client'

import { cn } from '@/lib/utils'
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { useState, useMemo } from 'react'
import { Input } from './Input'

interface Column<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  render?: (item: T) => React.ReactNode
  className?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  searchable?: boolean
  searchKeys?: (keyof T)[]
  pageSize?: number
  emptyMessage?: string
  onRowClick?: (item: T) => void
  getRowId?: (item: T) => string
}

export function DataTable<T extends object>({
  data,
  columns,
  searchable = true,
  searchKeys = [],
  pageSize = 10,
  emptyMessage = 'No hay datos disponibles',
  onRowClick,
  getRowId,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortConfig, setSortConfig] = useState<{
    key: string
    direction: 'asc' | 'desc'
  } | null>(null)

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!search || searchKeys.length === 0) return data

    const lowerSearch = search.toLowerCase()
    return data.filter((item) =>
      searchKeys.some((key) => {
        const value = (item as Record<string, unknown>)[key as string]
        if (typeof value === 'string') {
          return value.toLowerCase().includes(lowerSearch)
        }
        if (typeof value === 'number') {
          return value.toString().includes(lowerSearch)
        }
        return false
      })
    )
  }, [data, search, searchKeys])

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData

    return [...filteredData].sort((a, b) => {
      const aValue = (a as Record<string, unknown>)[sortConfig.key]
      const bValue = (b as Record<string, unknown>)[sortConfig.key]

      if (aValue === bValue) return 0
      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

      const comparison = aValue < bValue ? -1 : 1
      return sortConfig.direction === 'asc' ? comparison : -comparison
    })
  }, [filteredData, sortConfig])

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / pageSize)
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedData.slice(start, start + pageSize)
  }, [sortedData, currentPage, pageSize])

  // Handle sort
  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        return current.direction === 'asc'
          ? { key, direction: 'desc' }
          : null
      }
      return { key, direction: 'asc' }
    })
  }

  // Reset page when search changes
  const handleSearchChange = (value: string) => {
    setSearch(value)
    setCurrentPage(1)
  }

  const getValue = (item: T, key: string): unknown => {
    const keys = key.split('.')
    let value: unknown = item
    for (const k of keys) {
      value = (value as Record<string, unknown>)?.[k]
    }
    return value
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Search */}
      {searchable && (
        <div className="w-full sm:max-w-sm">
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            icon={<Search size={18} />}
          />
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border -mx-3 sm:mx-0">
        <table className="w-full min-w-[500px]">
          <thead className="bg-muted">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={cn(
                    'px-3 sm:px-4 py-2.5 sm:py-3 text-left text-xs sm:text-sm font-semibold text-foreground',
                    column.sortable && 'cursor-pointer hover:bg-muted/80 active:bg-muted/70 select-none',
                    column.className
                  )}
                  onClick={() => column.sortable && handleSort(String(column.key))}
                >
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {column.label}
                    {column.sortable && sortConfig?.key === column.key && (
                      <span className="text-primary">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 sm:px-4 py-10 sm:py-12 text-center text-muted-foreground text-sm"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((item, index) => (
                <tr
                  key={getRowId ? getRowId(item) : index}
                  className={cn(
                    'bg-card hover:bg-muted/50 active:bg-muted/70 transition-colors',
                    onRowClick && 'cursor-pointer'
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className={cn(
                        'px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-foreground',
                        column.className
                      )}
                    >
                      {column.render
                        ? column.render(item)
                        : String(getValue(item, String(column.key)) ?? '-')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
            Mostrando {((currentPage - 1) * pageSize) + 1} a{' '}
            {Math.min(currentPage * pageSize, sortedData.length)} de{' '}
            {sortedData.length}
          </p>

          <div className="flex items-center gap-0.5 sm:gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-2 sm:p-2.5 rounded-lg hover:bg-muted active:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              <ChevronsLeft size={16} className="sm:w-[18px] sm:h-[18px] text-gray" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 sm:p-2.5 rounded-lg hover:bg-muted active:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              <ChevronLeft size={16} className="sm:w-[18px] sm:h-[18px] text-gray" />
            </button>

            <div className="flex items-center gap-0.5 sm:gap-1 mx-1 sm:mx-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page: number
                if (totalPages <= 5) {
                  page = i + 1
                } else if (currentPage <= 3) {
                  page = i + 1
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i
                } else {
                  page = currentPage - 2 + i
                }

                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      'w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-xs sm:text-sm font-medium transition-all active:scale-95',
                      currentPage === page
                        ? 'bg-primary text-white'
                        : 'hover:bg-muted active:bg-muted/80 text-foreground'
                    )}
                  >
                    {page}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 sm:p-2.5 rounded-lg hover:bg-muted active:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              <ChevronRight size={16} className="sm:w-[18px] sm:h-[18px] text-gray" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-2 sm:p-2.5 rounded-lg hover:bg-muted active:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              <ChevronsRight size={16} className="sm:w-[18px] sm:h-[18px] text-gray" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
