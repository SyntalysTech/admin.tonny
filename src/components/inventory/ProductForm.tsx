'use client'

import { useState } from 'react'
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
  { value: 'metro', label: 'Metro' },
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
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    stock: product?.stock || 0,
    min_stock: product?.min_stock || 5,
    unit: product?.unit || 'unidad',
    price: product?.price || 0,
    supplier: product?.supplier || '',
    location: product?.location || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await onSubmit({
        ...formData,
        category,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Nombre del producto *"
        id="name"
        value={formData.name}
        onChange={(e) => handleChange('name', e.target.value)}
        placeholder="Ej: Pintura eg shel gris Bear Home Depot 225"
        required
      />

      <Input
        label="Descripcion"
        id="description"
        value={formData.description}
        onChange={(e) => handleChange('description', e.target.value)}
        placeholder="Descripcion adicional del producto"
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Stock actual *"
          id="stock"
          type="number"
          min={0}
          value={formData.stock}
          onChange={(e) => handleChange('stock', parseInt(e.target.value) || 0)}
          required
        />

        <Input
          label="Stock minimo"
          id="min_stock"
          type="number"
          min={0}
          value={formData.min_stock}
          onChange={(e) => handleChange('min_stock', parseInt(e.target.value) || 0)}
        />
      </div>

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
          label="Precio unitario"
          id="price"
          type="number"
          min={0}
          step={0.01}
          value={formData.price}
          onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
          placeholder="0.00"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Proveedor"
          id="supplier"
          value={formData.supplier}
          onChange={(e) => handleChange('supplier', e.target.value)}
          placeholder="Ej: Home Depot"
        />

        <Input
          label="Ubicacion"
          id="location"
          value={formData.location}
          onChange={(e) => handleChange('location', e.target.value)}
          placeholder="Ej: Bodega A, Estante 3"
        />
      </div>

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
