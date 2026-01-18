'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import type { Product, ProductCategory } from '@/types/database'

interface ProductFormProps {
  product?: Product
  category: ProductCategory
  onSubmit: (data: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  onCancel: () => void
}

const unitOptions = [
  { value: 'unidad', label: 'Unidad' },
  { value: 'pieza', label: 'Pieza' },
  { value: 'pies', label: 'Pies' },
  { value: 'metro', label: 'Metro' },
  { value: 'pulgadas', label: 'Pulgadas' },
  { value: 'kg', label: 'Kilogramo' },
  { value: 'litro', label: 'Litro' },
  { value: 'galon', label: 'Galon' },
  { value: 'rollo', label: 'Rollo' },
  { value: 'caja', label: 'Caja' },
  { value: 'paquete', label: 'Paquete' },
  { value: 'bolsa', label: 'Bolsa' },
]

export function ProductForm({ product, category, onSubmit, onCancel }: ProductFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [useUnitSize, setUseUnitSize] = useState(!!product?.unit_size)
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    stock: product?.stock || 0,
    min_stock: product?.min_stock || 5,
    unit: product?.unit || 'unidad',
    unit_size: product?.unit_size || undefined as number | undefined,
    quantity: product?.quantity || undefined as number | undefined,
    price: product?.price || 0,
    supplier: product?.supplier || '',
    brand: product?.brand || '',
    location: product?.location || '',
    notes: product?.notes || '',
  })

  // Calcular stock total cuando cambian unit_size o quantity
  useEffect(() => {
    if (useUnitSize && formData.unit_size && formData.quantity) {
      const calculatedStock = formData.unit_size * formData.quantity
      setFormData(prev => ({ ...prev, stock: calculatedStock }))
    }
  }, [formData.unit_size, formData.quantity, useUnitSize])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const submitData = {
        ...formData,
        category,
        // Limpiar campos si no se usa unit_size
        unit_size: useUnitSize ? formData.unit_size : undefined,
        quantity: useUnitSize ? formData.quantity : undefined,
      }
      await onSubmit(submitData)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: string | number | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Nombre del producto *"
        id="name"
        value={formData.name}
        onChange={(e) => handleChange('name', e.target.value)}
        placeholder="Ej: Vinilo siding panel, Pintura Bear, etc."
        required
      />

      <Input
        label="Descripcion"
        id="description"
        value={formData.description}
        onChange={(e) => handleChange('description', e.target.value)}
        placeholder="Descripcion adicional del producto"
      />

      {/* Toggle para usar medida por unidad */}
      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
        <input
          type="checkbox"
          id="useUnitSize"
          checked={useUnitSize}
          onChange={(e) => setUseUnitSize(e.target.checked)}
          className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
        />
        <label htmlFor="useUnitSize" className="text-sm text-foreground">
          Este producto tiene medida por unidad (ej: cada rollo tiene X pies)
        </label>
      </div>

      {useUnitSize ? (
        <>
          {/* Campos para productos con medida por unidad */}
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Unidad de medida *"
              id="unit"
              options={unitOptions}
              value={formData.unit}
              onChange={(e) => handleChange('unit', e.target.value)}
              required
            />
            <Input
              label="Medida por unidad *"
              id="unit_size"
              type="number"
              min={0}
              step={0.01}
              value={formData.unit_size || ''}
              onChange={(e) => handleChange('unit_size', parseFloat(e.target.value) || undefined)}
              placeholder={`Ej: 10 (cada pieza tiene 10 ${formData.unit})`}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Cantidad de piezas *"
              id="quantity"
              type="number"
              min={0}
              value={formData.quantity || ''}
              onChange={(e) => handleChange('quantity', parseInt(e.target.value) || undefined)}
              placeholder="Ej: 30 piezas/rollos"
              required
            />
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                Stock total (calculado)
              </label>
              <div className="px-3 py-2.5 bg-muted rounded-lg border border-border text-foreground font-medium">
                {formData.stock} {formData.unit}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formData.quantity || 0} x {formData.unit_size || 0} = {formData.stock}
              </p>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Campos para productos sin medida por unidad */}
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Unidad *"
              id="unit"
              options={unitOptions}
              value={formData.unit}
              onChange={(e) => handleChange('unit', e.target.value)}
              required
            />
            <Input
              label="Stock actual *"
              id="stock"
              type="number"
              min={0}
              value={formData.stock}
              onChange={(e) => handleChange('stock', parseInt(e.target.value) || 0)}
              required
            />
          </div>
        </>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Stock minimo (alerta)"
          id="min_stock"
          type="number"
          min={0}
          value={formData.min_stock}
          onChange={(e) => handleChange('min_stock', parseInt(e.target.value) || 0)}
        />
        <Input
          label="Precio unitario"
          id="price"
          type="number"
          min={0}
          step={0.01}
          value={formData.price || ''}
          onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
          placeholder="0.00"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Marca"
          id="brand"
          value={formData.brand}
          onChange={(e) => handleChange('brand', e.target.value)}
          placeholder="Ej: Sherwin Williams, Bear, etc."
        />
        <Input
          label="Proveedor"
          id="supplier"
          value={formData.supplier}
          onChange={(e) => handleChange('supplier', e.target.value)}
          placeholder="Ej: Home Depot"
        />
      </div>

      <Input
        label="Ubicacion"
        id="location"
        value={formData.location}
        onChange={(e) => handleChange('location', e.target.value)}
        placeholder="Ej: Bodega A, Estante 3"
      />

      <Input
        label="Notas"
        id="notes"
        value={formData.notes}
        onChange={(e) => handleChange('notes', e.target.value)}
        placeholder="Notas adicionales sobre el producto"
      />

      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {product ? 'Guardar cambios' : 'Crear producto'}
        </Button>
      </div>
    </form>
  )
}
