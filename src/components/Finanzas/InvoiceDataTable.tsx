'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import type { Invoice, InvoiceItem } from '@/types/database'
import {
  FileText,
  Building2,
  Calendar,
  DollarSign,
  Package,
  Receipt,
  CreditCard,
  Tag,
  Eye,
  X,
} from 'lucide-react'

interface InvoiceDataTableProps {
  invoice: Invoice
  isOpen: boolean
  onClose: () => void
}

function formatCurrency(amount: number | undefined | null, currency = 'MXN'): string {
  if (amount === undefined || amount === null) return '-'
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currency === 'USD' ? 'USD' : 'MXN',
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
      return <Badge variant="default">Compras</Badge>
    case 'gastos':
      return <Badge variant="warning">Gastos</Badge>
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Datos de Factura" size="xl">
      <div className="space-y-6">
        {/* Header con badges */}
        <div className="flex flex-wrap items-center gap-2">
          {getCategoryBadge(invoice.category)}
          {getStatusBadge(invoice.status)}
          {invoice.currency && (
            <Badge variant="outline">{invoice.currency}</Badge>
          )}
        </div>

        {/* Datos principales - Estilo Excel */}
        <div className="bg-muted/50 rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-border">
              <tr className="hover:bg-muted/80">
                <td className="px-4 py-3 font-medium text-muted-foreground w-1/3 flex items-center gap-2">
                  <Building2 size={16} className="text-primary" />
                  Proveedor
                </td>
                <td className="px-4 py-3 text-foreground font-semibold">
                  {invoice.supplier || <span className="text-muted-foreground italic">No detectado</span>}
                </td>
              </tr>
              <tr className="hover:bg-muted/80">
                <td className="px-4 py-3 font-medium text-muted-foreground flex items-center gap-2">
                  <Receipt size={16} className="text-primary" />
                  No. Factura
                </td>
                <td className="px-4 py-3 text-foreground font-mono">
                  {invoice.invoice_number || <span className="text-muted-foreground italic">No detectado</span>}
                </td>
              </tr>
              <tr className="hover:bg-muted/80">
                <td className="px-4 py-3 font-medium text-muted-foreground flex items-center gap-2">
                  <Calendar size={16} className="text-primary" />
                  Fecha
                </td>
                <td className="px-4 py-3 text-foreground">
                  {formatDate(invoice.invoice_date)}
                </td>
              </tr>
              <tr className="hover:bg-muted/80">
                <td className="px-4 py-3 font-medium text-muted-foreground flex items-center gap-2">
                  <CreditCard size={16} className="text-primary" />
                  Método de Pago
                </td>
                <td className="px-4 py-3 text-foreground capitalize">
                  {invoice.payment_method || <span className="text-muted-foreground italic">No detectado</span>}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Resumen financiero */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-muted/50 rounded-lg border border-border p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Subtotal</p>
            <p className="text-lg font-bold text-foreground">
              {formatCurrency(invoice.subtotal, invoice.currency)}
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg border border-border p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">IVA</p>
            <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
              {formatCurrency(invoice.tax, invoice.currency)}
            </p>
          </div>
          <div className="bg-primary/10 rounded-lg border border-primary/30 p-4 text-center">
            <p className="text-xs text-primary uppercase tracking-wider mb-1">Total</p>
            <p className="text-xl font-bold text-primary">
              {formatCurrency(invoice.total, invoice.currency)}
            </p>
          </div>
        </div>

        {/* Tabla de items/productos - Estilo Excel */}
        {items.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Package size={16} className="text-primary" />
              Productos / Items ({items.length})
            </div>
            <div className="bg-muted/50 rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted border-b border-border">
                      <th className="px-3 py-2 text-left font-semibold text-foreground">#</th>
                      {items.some(i => i.sku) && (
                        <th className="px-3 py-2 text-left font-semibold text-foreground">SKU</th>
                      )}
                      <th className="px-3 py-2 text-left font-semibold text-foreground">Descripción</th>
                      <th className="px-3 py-2 text-right font-semibold text-foreground">Cant.</th>
                      <th className="px-3 py-2 text-right font-semibold text-foreground">P. Unit.</th>
                      <th className="px-3 py-2 text-right font-semibold text-foreground">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-muted/80">
                        <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                        {items.some(i => i.sku) && (
                          <td className="px-3 py-2 font-mono text-xs">{item.sku || '-'}</td>
                        )}
                        <td className="px-3 py-2 text-foreground max-w-xs truncate">
                          {item.description}
                        </td>
                        <td className="px-3 py-2 text-right text-foreground">{item.quantity}</td>
                        <td className="px-3 py-2 text-right text-muted-foreground">
                          {formatCurrency(item.unit_price, invoice.currency)}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-foreground">
                          {formatCurrency(item.total, invoice.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted border-t-2 border-border">
                      <td colSpan={items.some(i => i.sku) ? 5 : 4} className="px-3 py-2 text-right font-semibold text-foreground">
                        Total Items:
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-primary">
                        {formatCurrency(items.reduce((sum, i) => sum + (i.total || 0), 0), invoice.currency)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Info del archivo */}
        <div className="flex items-center justify-between text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
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
                className="text-primary hover:underline flex items-center gap-1"
              >
                <Eye size={14} />
                Ver archivo
              </a>
            )}
            <button
              onClick={() => setShowRawText(!showRawText)}
              className="text-muted-foreground hover:text-foreground"
            >
              {showRawText ? 'Ocultar texto' : 'Ver texto OCR'}
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
