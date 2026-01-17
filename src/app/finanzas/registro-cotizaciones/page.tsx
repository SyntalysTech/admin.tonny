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
  useQuotes,
  getQuoteStatusColor,
  getQuoteStatusLabel,
  formatCurrency,
} from '@/hooks/useFinanzas'
import type { Quote, QuoteStatus } from '@/types/database'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  FileText,
  Calendar,
  Building2,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
} from 'lucide-react'

const statusOptions = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'aprobada', label: 'Aprobada' },
  { value: 'rechazada', label: 'Rechazada' },
  { value: 'vencida', label: 'Vencida' },
]

export default function RegistroCotizacionesPage() {
  const { quotes, isLoading, fetchQuotes, addQuote, updateQuote, deleteQuote } = useQuotes()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    supplier: '',
    description: '',
    total: '',
    status: 'pendiente' as QuoteStatus,
    valid_until: '',
    notes: '',
  })

  // El hook ahora maneja automáticamente la carga de datos

  const filteredQuotes = quotes.filter((quote) => {
    const matchesSearch =
      quote.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !statusFilter || quote.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalAmount = filteredQuotes.reduce((sum, q) => sum + q.total, 0)
  const approvedAmount = filteredQuotes
    .filter((q) => q.status === 'aprobada')
    .reduce((sum, q) => sum + q.total, 0)
  const pendingCount = filteredQuotes.filter((q) => q.status === 'pendiente').length

  const resetForm = () => {
    setFormData({
      supplier: '',
      description: '',
      total: '',
      status: 'pendiente',
      valid_until: '',
      notes: '',
    })
    setSelectedQuote(null)
  }

  const openCreateModal = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const openEditModal = (quote: Quote) => {
    setSelectedQuote(quote)
    setFormData({
      supplier: quote.supplier,
      description: quote.description,
      total: quote.total.toString(),
      status: quote.status,
      valid_until: quote.valid_until ? quote.valid_until.split('T')[0] : '',
      notes: quote.notes || '',
    })
    setIsModalOpen(true)
  }

  const openDeleteModal = (quote: Quote) => {
    setSelectedQuote(quote)
    setIsDeleteModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const quoteData = {
      supplier: formData.supplier,
      description: formData.description,
      total: parseFloat(formData.total),
      status: formData.status,
      valid_until: formData.valid_until || undefined,
      notes: formData.notes || undefined,
    }

    if (selectedQuote) {
      await updateQuote(selectedQuote.id, quoteData)
    } else {
      await addQuote(quoteData as Omit<Quote, 'id' | 'created_at'>)
    }

    setIsSubmitting(false)
    setIsModalOpen(false)
    resetForm()
  }

  const handleDelete = async () => {
    if (selectedQuote) {
      await deleteQuote(selectedQuote.id)
      setIsDeleteModalOpen(false)
      setSelectedQuote(null)
    }
  }

  const getStatusIcon = (status: QuoteStatus) => {
    switch (status) {
      case 'aprobada':
        return <CheckCircle size={14} />
      case 'pendiente':
        return <Clock size={14} />
      case 'rechazada':
        return <XCircle size={14} />
      case 'vencida':
        return <AlertCircle size={14} />
    }
  }

  const isExpired = (validUntil?: string) => {
    if (!validUntil) return false
    return new Date(validUntil) < new Date()
  }

  return (
    <MainLayout title="Registro de Cotizaciones" subtitle="Gestiona las cotizaciones de proveedores">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Cotizado</p>
                <p className="text-2xl font-bold text-foreground">{formatCurrency(totalAmount)}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="text-primary" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aprobadas</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(approvedAmount)}</p>
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
                <p className="text-sm text-muted-foreground">Por Revisar</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{pendingCount}</p>
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
            <CardTitle>Listado de Cotizaciones</CardTitle>
            <Button onClick={openCreateModal} className="w-full sm:w-auto">
              <Plus size={18} />
              Nueva Cotizacion
            </Button>
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
          ) : filteredQuotes.length === 0 ? (
            <EmptyState
              icon={<FileText size={48} />}
              title="No hay cotizaciones"
              description="Registra tu primera cotizacion para comenzar"
              action={
                <Button onClick={openCreateModal}>
                  <Plus size={18} />
                  Nueva Cotizacion
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
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Vigencia</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Estado</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-foreground">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredQuotes.map((quote) => (
                      <tr key={quote.id} className="hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {new Date(quote.created_at).toLocaleDateString('es-ES')}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-foreground">{quote.supplier}</p>
                        </td>
                        <td className="py-3 px-4 text-sm text-foreground max-w-xs truncate">
                          {quote.description}
                        </td>
                        <td className="py-3 px-4 font-semibold text-foreground">
                          {formatCurrency(quote.total)}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {quote.valid_until ? (
                            <span className={isExpired(quote.valid_until) ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}>
                              {new Date(quote.valid_until).toLocaleDateString('es-ES')}
                              {isExpired(quote.valid_until) && ' (Vencida)'}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={getQuoteStatusColor(quote.status)}>
                            {getStatusIcon(quote.status)}
                            <span className="ml-1">{getQuoteStatusLabel(quote.status)}</span>
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(quote)}
                              className="p-2 rounded-lg hover:bg-muted transition-colors text-gray-500 dark:text-gray-400 hover:text-primary"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => openDeleteModal(quote)}
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
                {filteredQuotes.map((quote) => (
                  <div
                    key={quote.id}
                    className="p-4 rounded-lg border border-border bg-card"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-foreground">{quote.supplier}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(quote.created_at).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                      <Badge variant={getQuoteStatusColor(quote.status)}>
                        {getQuoteStatusLabel(quote.status)}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {quote.description}
                    </p>

                    {quote.valid_until && (
                      <p className={`text-xs mb-3 ${isExpired(quote.valid_until) ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                        Vigente hasta: {new Date(quote.valid_until).toLocaleDateString('es-ES')}
                        {isExpired(quote.valid_until) && ' (Vencida)'}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      <p className="text-lg font-bold text-foreground">
                        {formatCurrency(quote.total)}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(quote)}
                          className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                        >
                          <Edit2 size={16} className="text-foreground" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(quote)}
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

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedQuote ? 'Editar Cotizacion' : 'Nueva Cotizacion'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
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
            label="Descripcion"
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Descripcion de la cotizacion"
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
              onChange={(e) => setFormData({ ...formData, status: e.target.value as QuoteStatus })}
            />
          </div>

          <Input
            label="Vigente hasta"
            id="valid_until"
            type="date"
            value={formData.valid_until}
            onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
            icon={<Calendar size={18} />}
          />

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
              {selectedQuote ? 'Guardar Cambios' : 'Crear Cotizacion'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Eliminar Cotizacion"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            ¿Estas seguro de eliminar esta cotizacion de <strong className="text-foreground">{selectedQuote?.supplier}</strong>?
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
