'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import type { Invoice, InvoiceItem } from '@/types/database'
import {
  FileText,
  Building2,
  Calendar,
  Package,
  Receipt,
  CreditCard,
  Eye,
  Download,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

interface InvoiceDataTableProps {
  invoice: Invoice
  isOpen: boolean
  onClose: () => void
}

function formatCurrency(amount: number | undefined | null, currency = 'MXN'): string {
  if (amount === undefined || amount === null) return '-'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency === 'USD' ? 'USD' : 'USD', // Home Depot usa USD
    minimumFractionDigits: 2,
  }).format(amount)
}

function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '-'
  try {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function getCategoryBadge(category: string | undefined) {
  switch (category) {
    case 'compras':
      return <Badge variant="warning">Compras</Badge>
    case 'gastos':
      return <Badge variant="destructive">Gastos</Badge>
    case 'finanzas':
      return <Badge variant="secondary">Finanzas</Badge>
    default:
      return <Badge variant="outline">{category || 'Sin categoría'}</Badge>
  }
}

function getStatusBadge(status: string | undefined) {
  switch (status) {
    case 'done':
      return <Badge variant="success">Procesado</Badge>
    case 'processing':
      return <Badge variant="warning">Procesando</Badge>
    case 'error':
      return <Badge variant="destructive">Error</Badge>
    default:
      return <Badge variant="outline">Pendiente</Badge>
  }
}

export default function InvoiceDataTable({ invoice, isOpen, onClose }: InvoiceDataTableProps) {
  const [showRawText, setShowRawText] = useState(false)
  const [expandedItems, setExpandedItems] = useState(true)

  // Parse items si es string
  let items: InvoiceItem[] = []
  if (invoice.items) {
    if (typeof invoice.items === 'string') {
      try {
        items = JSON.parse(invoice.items)
      } catch {
        items = []
      }
    } else if (Array.isArray(invoice.items)) {
      items = invoice.items
    }
  }

  // Calcular totales
  const itemsSubtotal = items.reduce((sum, i) => sum + (i.total || 0), 0)
  const hasModel = items.some(i => i.model)
  const hasSku = items.some(i => i.sku)
  const hasSize = items.some(i => i.size)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="xl">
      <div className="space-y-4">
        {/* Header estilo Home Depot */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 -mx-6 -mt-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                <Building2 size={24} className="text-orange-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {invoice.supplier || 'Factura'}
                </h2>
                <p className="text-orange-100 text-sm">
                  {invoice.invoice_number ? `Factura #${invoice.invoice_number}` : 'Sin número de factura'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getCategoryBadge(invoice.category)}
              {getStatusBadge(invoice.status)}
            </div>
          </div>
        </div>

        {/* Info básica en fila */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Calendar size={14} />
              <span className="text-xs uppercase">Fecha</span>
            </div>
            <p className="font-semibold text-foreground">{formatDate(invoice.invoice_date)}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Receipt size={14} />
              <span className="text-xs uppercase">No. Factura</span>
            </div>
            <p className="font-semibold text-foreground font-mono">{invoice.invoice_number || '-'}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <CreditCard size={14} />
              <span className="text-xs uppercase">Pago</span>
            </div>
            <p className="font-semibold text-foreground capitalize">{invoice.payment_method || '-'}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Package size={14} />
              <span className="text-xs uppercase">Items</span>
            </div>
            <p className="font-semibold text-foreground">{items.length} productos</p>
          </div>
        </div>

        {/* Tabla de items estilo Excel/Home Depot */}
        {items.length > 0 && (
          <div className="border border-border rounded-lg overflow-hidden">
            {/* Header de tabla */}
            <button
              onClick={() => setExpandedItems(!expandedItems)}
              className="w-full flex items-center justify-between bg-amber-500 text-white px-4 py-2 font-semibold text-sm"
            >
              <span>Detalle de Productos</span>
              {expandedItems ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {expandedItems && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-amber-100 dark:bg-amber-900/30 border-b-2 border-amber-500">
                      <th className="px-2 py-2 text-left font-bold text-amber-900 dark:text-amber-100 w-[40%]">
                        Description
                      </th>
                      {hasModel && (
                        <th className="px-2 py-2 text-left font-bold text-amber-900 dark:text-amber-100">
                          Model #
                        </th>
                      )}
                      {hasSku && (
                        <th className="px-2 py-2 text-left font-bold text-amber-900 dark:text-amber-100">
                          SKU #
                        </th>
                      )}
                      {hasSize && (
                        <th className="px-2 py-2 text-center font-bold text-amber-900 dark:text-amber-100">
                          Size
                        </th>
                      )}
                      <th className="px-2 py-2 text-center font-bold text-amber-900 dark:text-amber-100">
                        Qty
                      </th>
                      <th className="px-2 py-2 text-right font-bold text-amber-900 dark:text-amber-100">
                        Unit Price
                      </th>
                      <th className="px-2 py-2 text-right font-bold text-amber-900 dark:text-amber-100 bg-amber-200 dark:bg-amber-800/50">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.map((item, idx) => (
                      <tr
                        key={idx}
                        className={`${idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800/50'} hover:bg-amber-50 dark:hover:bg-amber-900/20`}
                      >
                        <td className="px-2 py-2 text-foreground">
                          {item.description}
                        </td>
                        {hasModel && (
                          <td className="px-2 py-2 font-mono text-muted-foreground">
                            {item.model || '-'}
                          </td>
                        )}
                        {hasSku && (
                          <td className="px-2 py-2 font-mono text-muted-foreground">
                            {item.sku || '-'}
                          </td>
                        )}
                        {hasSize && (
                          <td className="px-2 py-2 text-center text-foreground">
                            {item.size || '-'}
                          </td>
                        )}
                        <td className="px-2 py-2 text-center font-semibold text-foreground">
                          {item.quantity}
                        </td>
                        <td className="px-2 py-2 text-right text-foreground">
                          {formatCurrency(item.unit_price, invoice.currency)}
                        </td>
                        <td className="px-2 py-2 text-right font-semibold text-foreground bg-amber-50 dark:bg-amber-900/20">
                          {formatCurrency(item.total, invoice.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Resumen de totales estilo Excel */}
        <div className="flex justify-end">
          <div className="w-full md:w-80 border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-border">
                  <td className="px-4 py-2 text-muted-foreground">Subtotal</td>
                  <td className="px-4 py-2 text-right font-semibold text-foreground">
                    {formatCurrency(invoice.subtotal || itemsSubtotal, invoice.currency)}
                  </td>
                </tr>
                {invoice.tax && invoice.tax > 0 && (
                  <>
                    <tr className="border-b border-border">
                      <td className="px-4 py-2 text-muted-foreground">Descuentos</td>
                      <td className="px-4 py-2 text-right text-foreground">-</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="px-4 py-2 text-muted-foreground">Sales Tax</td>
                      <td className="px-4 py-2 text-right text-foreground">
                        {formatCurrency(invoice.tax, invoice.currency)}
                      </td>
                    </tr>
                  </>
                )}
                <tr className="bg-amber-500 text-white">
                  <td className="px-4 py-3 font-bold">Order Total</td>
                  <td className="px-4 py-3 text-right font-bold text-lg">
                    {formatCurrency(invoice.total, invoice.currency)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer con acciones */}
        <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-4">
          <div className="flex items-center gap-2">
            <FileText size={14} />
            <span>{invoice.file_name || 'Archivo sin nombre'}</span>
          </div>
          <div className="flex items-center gap-3">
            {invoice.public_url && (
              <a
                href={invoice.public_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <Eye size={14} />
                Ver archivo
              </a>
            )}
            <button
              onClick={() => setShowRawText(!showRawText)}
              className="text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <FileText size={14} />
              {showRawText ? 'Ocultar OCR' : 'Ver OCR'}
            </button>
          </div>
        </div>

        {/* Texto extraído */}
        {showRawText && invoice.extracted_text && (
          <div className="bg-muted/30 rounded-lg border border-border p-4 max-h-48 overflow-y-auto">
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">
              {invoice.extracted_text}
            </pre>
          </div>
        )}
      </div>
    </Modal>
  )
}
