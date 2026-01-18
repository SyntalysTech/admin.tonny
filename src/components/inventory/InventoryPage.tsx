'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { DataTable } from '@/components/ui/DataTable'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatsCard } from '@/components/ui/StatsCard'
import { ProductForm } from './ProductForm'
import { StockMovementForm } from './StockMovementForm'
import { useProducts } from '@/hooks/useProducts'
import type { Product, ProductCategory } from '@/types/database'
import {
  Plus,
  Package,
  AlertTriangle,
  ArrowUpDown,
  Edit,
  Trash2,
  TrendingDown,
  Boxes,
} from 'lucide-react'

interface InventoryPageProps {
  category: ProductCategory
  title: string
  subtitle: string
}

export function InventoryPage({ category, title, subtitle }: InventoryPageProps) {
  // El hook ahora maneja automáticamente la carga de datos por categoría
  const { products, isLoading, addProduct, updateProduct, deleteProduct, addMovement } =
    useProducts(category)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  // Los productos ya vienen filtrados por categoría desde el hook
  const categoryProducts = products.filter((p) => p.category === category)
  const lowStockProducts = categoryProducts.filter((p) => p.stock <= p.min_stock)
  const totalItems = categoryProducts.reduce((sum, p) => sum + p.stock, 0)

  const handleAddProduct = async (data: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    await addProduct(data)
    setIsProductModalOpen(false)
    setSelectedProduct(null)
  }

  const handleUpdateProduct = async (data: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    if (!selectedProduct) return
    await updateProduct(selectedProduct.id, data)
    setIsProductModalOpen(false)
    setSelectedProduct(null)
  }

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return
    await deleteProduct(selectedProduct.id)
    setIsDeleteModalOpen(false)
    setSelectedProduct(null)
  }

  const handleMovement = async (data: {
    quantity: number
    movement_type: 'entrada' | 'salida' | 'ajuste'
    responsible: string | null
    notes?: string
  }) => {
    if (!selectedProduct) return
    await addMovement(
      selectedProduct.id,
      data.quantity,
      data.movement_type,
      data.responsible as 'jordi' | 'gustavo' | 'david' | 'taurus' | null,
      data.notes
    )
    setIsMovementModalOpen(false)
    setSelectedProduct(null)
  }

  const columns = [
    {
      key: 'name',
      label: 'Producto',
      sortable: true,
      render: (item: Product) => (
        <div>
          <p className="font-medium text-foreground">{item.name}</p>
          {item.brand && (
            <p className="text-xs text-primary">{item.brand}</p>
          )}
          {item.description && (
            <p className="text-xs sm:text-sm text-muted-foreground truncate max-w-[200px] sm:max-w-xs">{item.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'stock',
      label: 'Stock Total',
      sortable: true,
      render: (item: Product) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span className="font-semibold text-lg">{item.stock}</span>
            <span className="text-xs sm:text-sm text-muted-foreground">{item.unit}</span>
            {item.stock <= item.min_stock && (
              <Badge variant="warning" className="text-[10px] sm:text-xs">Bajo</Badge>
            )}
          </div>
          {item.unit_size && item.quantity && (
            <p className="text-xs text-muted-foreground">
              {item.quantity} pzas x {item.unit_size} {item.unit}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'quantity',
      label: 'Cantidad',
      sortable: true,
      className: 'hidden md:table-cell',
      render: (item: Product) => item.unit_size && item.quantity ? (
        <div className="text-center">
          <span className="font-medium">{item.quantity}</span>
          <p className="text-xs text-muted-foreground">piezas</p>
        </div>
      ) : '-',
    },
    {
      key: 'unit_size',
      label: 'Medida/U',
      sortable: true,
      className: 'hidden lg:table-cell',
      render: (item: Product) => item.unit_size ? (
        <span>{item.unit_size} {item.unit}</span>
      ) : '-',
    },
    {
      key: 'min_stock',
      label: 'Min.',
      sortable: true,
      className: 'hidden lg:table-cell',
    },
    {
      key: 'supplier',
      label: 'Proveedor',
      sortable: true,
      className: 'hidden xl:table-cell',
      render: (item: Product) => item.supplier || '-',
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (item: Product) => (
        <div className="flex items-center gap-0.5 sm:gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              setSelectedProduct(item)
              setIsMovementModalOpen(true)
            }}
            title="Registrar movimiento"
            className="p-1.5 sm:p-2"
          >
            <ArrowUpDown size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              setSelectedProduct(item)
              setIsProductModalOpen(true)
            }}
            title="Editar producto"
            className="p-1.5 sm:p-2"
          >
            <Edit size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              setSelectedProduct(item)
              setIsDeleteModalOpen(true)
            }}
            title="Eliminar producto"
            className="text-destructive hover:text-destructive p-1.5 sm:p-2"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <MainLayout title={title} subtitle={subtitle}>
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <StatsCard
          title="Total de productos"
          value={categoryProducts.length}
          icon={<Package size={24} />}
        />
        <StatsCard
          title="Items en inventario"
          value={totalItems}
          icon={<Boxes size={24} />}
        />
        <StatsCard
          title="Stock bajo"
          value={lowStockProducts.length}
          icon={<TrendingDown size={24} />}
        />
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 flex items-start gap-2.5 sm:gap-3">
          <AlertTriangle className="text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" size={18} />
          <div className="min-w-0">
            <p className="font-medium text-amber-800 dark:text-amber-200 text-sm sm:text-base">Productos con stock bajo</p>
            <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300 mt-0.5 sm:mt-1 truncate">
              {lowStockProducts.map((p) => p.name).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Products Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <CardTitle>Inventario</CardTitle>
            <Button
              onClick={() => {
                setSelectedProduct(null)
                setIsProductModalOpen(true)
              }}
              className="w-full sm:w-auto"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Agregar producto</span>
              <span className="sm:hidden">Agregar</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && categoryProducts.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : categoryProducts.length === 0 ? (
            <EmptyState
              icon={<Package size={32} className="text-gray" />}
              title="Sin productos"
              description="Aun no hay productos en este inventario. Agrega el primero para comenzar."
              action={
                <Button onClick={() => setIsProductModalOpen(true)}>
                  <Plus size={18} />
                  Agregar producto
                </Button>
              }
            />
          ) : (
            <DataTable
              data={categoryProducts}
              columns={columns}
              searchable
              searchKeys={['name', 'description', 'supplier', 'location', 'brand']}
              getRowId={(item) => item.id}
              pageSize={10}
            />
          )}
        </CardContent>
      </Card>

      {/* Product Modal */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false)
          setSelectedProduct(null)
        }}
        title={selectedProduct ? 'Editar producto' : 'Nuevo producto'}
        size="lg"
      >
        <ProductForm
          product={selectedProduct || undefined}
          category={category}
          onSubmit={selectedProduct ? handleUpdateProduct : handleAddProduct}
          onCancel={() => {
            setIsProductModalOpen(false)
            setSelectedProduct(null)
          }}
        />
      </Modal>

      {/* Movement Modal */}
      <Modal
        isOpen={isMovementModalOpen}
        onClose={() => {
          setIsMovementModalOpen(false)
          setSelectedProduct(null)
        }}
        title="Registrar movimiento"
        size="md"
      >
        {selectedProduct && (
          <StockMovementForm
            product={selectedProduct}
            onSubmit={handleMovement}
            onCancel={() => {
              setIsMovementModalOpen(false)
              setSelectedProduct(null)
            }}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setSelectedProduct(null)
        }}
        title="Eliminar producto"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm sm:text-base">
            Estas seguro que deseas eliminar <span className="font-medium text-foreground">{selectedProduct?.name}</span>?
            Esta accion no se puede deshacer.
          </p>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                setIsDeleteModalOpen(false)
                setSelectedProduct(null)
              }}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteProduct} className="w-full sm:w-auto">
              Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  )
}
