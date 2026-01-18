'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  usePurchases,
  getPurchaseStatusColor,
  getPurchaseStatusLabel,
  formatCurrency,
} from '@/hooks/useFinanzas'
import type { Purchase, PurchaseStatus, PaymentMethod } from '@/types/database'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  ShoppingCart,
  Calendar,
  Building2,
  CreditCard,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react'
import InvoiceUploader from '@/components/Finanzas/InvoiceUploader'
import InvoicePreviewModal from '@/components/Finanzas/InvoicePreviewModal'
import InvoiceAIResultModal from '@/components/Finanzas/InvoiceAIResultModal'
import { useEffect } from 'react'

const statusOptions = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'completada', label: 'Completada' },
  { value: 'cancelada', label: 'Cancelada' },
]

const paymentOptions = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'credito', label: 'Crédito' },
]

export default function RegistroComprasPage() {
  const { purchases, isLoading, fetchPurchases, addPurchase, updatePurchase, deletePurchase } = usePurchases()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [invoiceMap, setInvoiceMap] = useState<Record<string, any>>({})
  const [aiModalData, setAiModalData] = useState<any>(null)
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch invoices linked to current purchases to show AI status
  useEffect(() => {
    async function loadInvoices() {
      try {
        const ids = purchases.map((p) => p.id).join(',')
        if (!ids) return
        const res = await fetch(`/api/invoices?purchase_ids=${ids}`)
        const data = await res.json()
        if (Array.isArray(data)) {
          const map: Record<string, any> = {}
          data.forEach((inv) => {
            if (inv.purchase_id) map[inv.purchase_id] = inv
          })
          setInvoiceMap(map)
        }
      } catch (err) {
        console.error('Failed to load invoices', err)
      }
    }

    loadInvoices()
  }, [purchases])

  const [formData, setFormData] = useState({
    supplier: '',
    description: '',
    total: '',
    status: 'pendiente' as PurchaseStatus,
    payment_method: '' as PaymentMethod | '',
    invoice_number: '',
    notes: '',
    purchased_at: new Date().toISOString().split('T')[0],
  })

  // El hook ahora maneja automáticamente la carga de datos

  const filteredPurchases = purchases.filter((purchase) => {
    const matchesSearch =
      purchase.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !statusFilter || purchase.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalAmount = filteredPurchases.reduce((sum, p) => sum + p.total, 0)
  const completedAmount = filteredPurchases
    .filter((p) => p.status === 'completada')
    .reduce((sum, p) => sum + p.total, 0)
  const pendingAmount = filteredPurchases
    .filter((p) => p.status === 'pendiente')
    .reduce((sum, p) => sum + p.total, 0)

  const resetForm = () => {
    setFormData({
      supplier: '',
      description: '',
      total: '',
      status: 'pendiente',
      payment_method: '',
      invoice_number: '',
      notes: '',
      purchased_at: new Date().toISOString().split('T')[0],
    })
    setSelectedPurchase(null)
  }

  const openCreateModal = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const openEditModal = (purchase: Purchase) => {
    setSelectedPurchase(purchase)
    setFormData({
      supplier: purchase.supplier,
      description: purchase.description,
      total: purchase.total.toString(),
      status: purchase.status,
      payment_method: purchase.payment_method || '',
      invoice_number: purchase.invoice_number || '',
      notes: purchase.notes || '',
      purchased_at: purchase.purchased_at.split('T')[0],
    })
    setIsModalOpen(true)
  }

  const openDeleteModal = (purchase: Purchase) => {
    setSelectedPurchase(purchase)
    setIsDeleteModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const purchaseData = {
      supplier: formData.supplier,
      description: formData.description,
      total: parseFloat(formData.total),
      status: formData.status,
      payment_method: formData.payment_method || undefined,
      invoice_number: formData.invoice_number || undefined,
      notes: formData.notes || undefined,
      purchased_at: formData.purchased_at,
    }

    if (selectedPurchase) {
      await updatePurchase(selectedPurchase.id, purchaseData)
    } else {
      await addPurchase(purchaseData as Omit<Purchase, 'id' | 'created_at'>)
    }

    setIsSubmitting(false)
    setIsModalOpen(false)
    resetForm()
  }

  const handleDelete = async () => {
    if (selectedPurchase) {
      await deletePurchase(selectedPurchase.id)
      setIsDeleteModalOpen(false)
      setSelectedPurchase(null)
    }
  }

  const getStatusIcon = (status: PurchaseStatus) => {
    switch (status) {
      case 'completada':
        return <CheckCircle size={14} />
      case 'pendiente':
        return <Clock size={14} />
      case 'cancelada':
        return <XCircle size={14} />
    }
  }

  return (
    <MainLayout title="Registro de Compras" subtitle="Gestiona las compras realizadas">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Compras</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(totalAmount)}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <ShoppingCart className="text-primary" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completadas</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(completedAmount)}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendientes</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{formatCurrency(pendingAmount)}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Clock className="text-amber-600 dark:text-amber-400" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Listado de Compras</CardTitle>
            <div className="flex items-center gap-2">
              <Button onClick={openCreateModal} className="w-full sm:w-auto">
                <Plus size={18} />
                Nueva Compra
              </Button>
              {/* Invoice uploader */}
              <div>
                <InvoiceUploader />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Buscar por proveedor o descripcion..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search size={18} />}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                options={[{ value: '', label: 'Todos los estados' }, ...statusOptions]}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              />
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredPurchases.length === 0 ? (
            <EmptyState
              icon={<ShoppingCart size={48} />}
              title="No hay compras"
              description="Registra tu primera compra para comenzar"
              action={
                <Button onClick={openCreateModal}>
                  <Plus size={18} />
                  Nueva Compra
                </Button>
              }
            />
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Fecha</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Proveedor</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Descripcion</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Total</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Estado</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-foreground">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredPurchases.map((purchase) => (
                      <tr key={purchase.id} className="hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {new Date(purchase.purchased_at).toLocaleDateString('es-ES')}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-foreground">{purchase.supplier}</p>
                          {purchase.invoice_number && (
                            <p className="text-xs text-muted-foreground">Factura: {purchase.invoice_number}</p>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-foreground max-w-xs truncate">
                          {purchase.description}
                        </td>
                        <td className="py-3 px-4 font-semibold text-foreground">
                          {formatCurrency(purchase.total)}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={getPurchaseStatusColor(purchase.status)}>
                            {getStatusIcon(purchase.status)}
                            <span className="ml-1">{getPurchaseStatusLabel(purchase.status)}</span>
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            {/* Show invoice link if present in notes */}
                            {(() => {
                              try {
                                const notesObj = purchase.notes ? JSON.parse(purchase.notes as any) : null
                                const invoice = invoiceMap[purchase.id]
                                return (
                                  <div className="flex items-center gap-2">
                                    {notesObj && notesObj.file_url && (
                                      <button
                                        onClick={() => {
                                          setPreviewUrl(notesObj.file_url)
                                          setIsPreviewOpen(true)
                                        }}
                                        className="p-2 rounded-lg hover:bg-muted transition-colors text-gray-500 dark:text-gray-400 hover:text-primary"
                                      >
                                        Ver factura
                                      </button>
                                    )}

                                    {invoice && (
                                      <>
                                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-900 text-gray-700">
                                          IA: {invoice.status}
                                        </span>
                                        <button
                                          onClick={() => {
                                            setAiModalData(invoice.ai_response)
                                            setIsAiModalOpen(true)
                                          }}
                                          className="p-2 rounded-lg hover:bg-muted transition-colors text-gray-500 dark:text-gray-400 hover:text-primary"
                                        >
                                          Ver IA
                                        </button>
                                      </>
                                    )}
                                  </div>
                                )
                              } catch {
                                return null
                              }
                            })()}

                            <button
                              onClick={() => openEditModal(purchase)}
                              className="p-2 rounded-lg hover:bg-muted transition-colors text-gray-500 dark:text-gray-400 hover:text-primary"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => openDeleteModal(purchase)}
                              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {filteredPurchases.map((purchase) => (
                  <div
                    key={purchase.id}
                    className="p-4 rounded-lg border border-border bg-card"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-foreground">{purchase.supplier}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(purchase.purchased_at).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                      <Badge variant={getPurchaseStatusColor(purchase.status)}>
                        {getPurchaseStatusLabel(purchase.status)}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {purchase.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <p className="text-lg font-bold text-foreground">
                        {formatCurrency(purchase.total)}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(purchase)}
                          className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                        >
                          <Edit2 size={16} className="text-foreground" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(purchase)}
                          className="p-2 rounded-lg bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                        >
                          <Trash2 size={16} className="text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <InvoicePreviewModal url={previewUrl} isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} />
      <InvoiceAIResultModal aiResponse={aiModalData} isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedPurchase ? 'Editar Compra' : 'Nueva Compra'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Proveedor"
              id="supplier"
              value={formData.supplier}
              onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
              placeholder="Nombre del proveedor"
              icon={<Building2 size={18} />}
              required
            />

            <Input
              label="Fecha de compra"
              id="purchased_at"
              type="date"
              value={formData.purchased_at}
              onChange={(e) => setFormData({ ...formData, purchased_at: e.target.value })}
              icon={<Calendar size={18} />}
              required
            />
          </div>

          <Input
            label="Descripcion"
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Descripcion de la compra"
            icon={<FileText size={18} />}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Total"
              id="total"
              type="number"
              step="0.01"
              min="0"
              value={formData.total}
              onChange={(e) => setFormData({ ...formData, total: e.target.value })}
              placeholder="0.00"
              icon={<span className="text-sm font-medium">$</span>}
              required
            />

            <Select
              label="Estado"
              id="status"
              options={statusOptions}
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as PurchaseStatus })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Metodo de pago"
              id="payment_method"
              options={[{ value: '', label: 'Seleccionar...' }, ...paymentOptions]}
              value={formData.payment_method}
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value as PaymentMethod })}
            />

            <Input
              label="Numero de factura"
              id="invoice_number"
              value={formData.invoice_number}
              onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
              placeholder="Opcional"
              icon={<CreditCard size={18} />}
            />
          </div>

          <Input
            label="Notas"
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Notas adicionales (opcional)"
          />

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="w-full sm:w-auto">
              {selectedPurchase ? 'Guardar Cambios' : 'Crear Compra'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Eliminar Compra"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            ¿Estas seguro de eliminar esta compra de <strong className="text-foreground">{selectedPurchase?.supplier}</strong>?
          </p>
          <p className="text-sm text-muted-foreground">
            Esta accion no se puede deshacer.
          </p>

          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              className="w-full sm:w-auto"
            >
              <Trash2 size={16} />
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  )
}
