'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import type { Product, ResponsiblePerson } from '@/types/database'

interface StockMovementFormProps {
  product: Product
  onSubmit: (data: {
    quantity: number
    movement_type: 'entrada' | 'salida' | 'ajuste'
    responsible: ResponsiblePerson | null
    notes?: string
  }) => Promise<void>
  onCancel: () => void
}

const movementTypeOptions = [
  { value: 'entrada', label: 'Entrada (agregar stock)' },
  { value: 'salida', label: 'Salida (entregar material)' },
  { value: 'ajuste', label: 'Ajuste de inventario' },
]

const responsibleOptions = [
  { value: '', label: 'Sin asignar' },
  { value: 'jordi', label: 'Jordi' },
  { value: 'gustavo', label: 'Gustavo' },
  { value: 'david', label: 'David' },
  { value: 'taurus', label: 'Taurus (Personal interno)' },
]

export function StockMovementForm({ product, onSubmit, onCancel }: StockMovementFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    quantity: 1,
    movement_type: 'salida' as 'entrada' | 'salida' | 'ajuste',
    responsible: '' as ResponsiblePerson | '',
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await onSubmit({
        quantity: formData.quantity,
        movement_type: formData.movement_type,
        responsible: formData.responsible || null,
        notes: formData.notes || undefined,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const newStock =
    formData.movement_type === 'entrada'
      ? product.stock + formData.quantity
      : formData.movement_type === 'salida'
      ? product.stock - formData.quantity
      : formData.quantity

  const isInvalidSalida = formData.movement_type === 'salida' && formData.quantity > product.stock

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Product Info */}
      <div className="bg-muted rounded-lg p-4">
        <p className="text-sm text-muted-foreground">Producto</p>
        <p className="font-semibold text-foreground">{product.name}</p>
        <p className="text-sm text-gray mt-1">
          Stock actual: <span className="font-medium">{product.stock} {product.unit}(s)</span>
        </p>
      </div>

      <Select
        label="Tipo de movimiento *"
        id="movement_type"
        options={movementTypeOptions}
        value={formData.movement_type}
        onChange={(e) => handleChange('movement_type', e.target.value)}
        required
      />

      <Input
        label="Cantidad *"
        id="quantity"
        type="number"
        min={1}
        max={formData.movement_type === 'salida' ? product.stock : undefined}
        value={formData.quantity}
        onChange={(e) => handleChange('quantity', parseInt(e.target.value) || 0)}
        error={isInvalidSalida ? 'No hay suficiente stock disponible' : undefined}
        required
      />

      {formData.movement_type === 'salida' && (
        <Select
          label="Responsable (quien se lo lleva)"
          id="responsible"
          options={responsibleOptions}
          value={formData.responsible}
          onChange={(e) => handleChange('responsible', e.target.value)}
        />
      )}

      <Input
        label="Notas"
        id="notes"
        value={formData.notes}
        onChange={(e) => handleChange('notes', e.target.value)}
        placeholder="Notas adicionales del movimiento"
      />

      {/* Preview */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <p className="text-sm text-muted-foreground">Stock resultante</p>
        <p className={`text-2xl font-bold ${newStock < 0 ? 'text-destructive' : 'text-primary'}`}>
          {newStock} {product.unit}(s)
        </p>
        {newStock < product.min_stock && newStock >= 0 && (
          <p className="text-sm text-warning mt-1">Stock bajo el minimo recomendado</p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={isLoading} disabled={isInvalidSalida || formData.quantity <= 0}>
          Registrar movimiento
        </Button>
      </div>
    </form>
  )
}
