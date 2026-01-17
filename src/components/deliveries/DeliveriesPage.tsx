'use client'

import { useEffect } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { DataTable } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatsCard } from '@/components/ui/StatsCard'
import { useDeliveries } from '@/hooks/useDeliveries'
import { formatDate } from '@/lib/utils'
import type { ResponsiblePerson } from '@/types/database'
import { Package, Calendar, TrendingUp, Truck } from 'lucide-react'

interface DeliveriesPageProps {
  responsible: ResponsiblePerson
  title: string
  subtitle: string
}

interface DeliveryWithProduct {
  id: string
  product_id: string
  quantity: number
  responsible: ResponsiblePerson
  notes?: string
  delivered_at: string
  created_at: string
  product?: {
    id: string
    name: string
    category: string
    unit: string
  }
}

const categoryLabels: Record<string, string> = {
  material_remodelacion: 'Material Remodelacion',
  herramienta_remodelacion: 'Herramienta Remodelacion',
  material_plomeria: 'Material Plomeria',
  herramienta_plomeria: 'Herramienta Plomeria',
}

export function DeliveriesPage({ responsible, title, subtitle }: DeliveriesPageProps) {
  const { deliveries, isLoading, fetchDeliveries } = useDeliveries()

  useEffect(() => {
    fetchDeliveries(responsible)
  }, [responsible, fetchDeliveries])

  const responsibleDeliveries = deliveries.filter((d) => d.responsible === responsible)

  // Calculate stats
  const totalDeliveries = responsibleDeliveries.length
  const totalItems = responsibleDeliveries.reduce((sum, d) => sum + d.quantity, 0)
  const uniqueProducts = new Set(responsibleDeliveries.map((d) => d.product_id)).size

  // Get deliveries from the last 7 days
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const recentDeliveries = responsibleDeliveries.filter(
    (d) => new Date(d.delivered_at) >= sevenDaysAgo
  ).length

  const columns = [
    {
      key: 'delivered_at',
      label: 'Fecha',
      sortable: true,
      render: (item: DeliveryWithProduct) => (
        <span className="text-sm">{formatDate(item.delivered_at)}</span>
      ),
    },
    {
      key: 'product.name',
      label: 'Producto',
      sortable: true,
      render: (item: DeliveryWithProduct) => (
        <div>
          <p className="font-medium text-foreground">{item.product?.name || 'Producto eliminado'}</p>
          {item.product?.category && (
            <Badge variant="outline" className="mt-1">
              {categoryLabels[item.product.category] || item.product.category}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'quantity',
      label: 'Cantidad',
      sortable: true,
      render: (item: DeliveryWithProduct) => (
        <span className="font-semibold">
          {item.quantity} {item.product?.unit || 'unidad'}(s)
        </span>
      ),
    },
    {
      key: 'notes',
      label: 'Notas',
      className: 'hidden md:table-cell',
      render: (item: DeliveryWithProduct) => (
        <span className="text-sm text-muted-foreground truncate max-w-xs block">
          {item.notes || '-'}
        </span>
      ),
    },
  ]

  return (
    <MainLayout title={title} subtitle={subtitle}>
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total entregas"
          value={totalDeliveries}
          icon={<Truck size={24} />}
        />
        <StatsCard
          title="Items entregados"
          value={totalItems}
          icon={<Package size={24} />}
        />
        <StatsCard
          title="Productos diferentes"
          value={uniqueProducts}
          icon={<TrendingUp size={24} />}
        />
        <StatsCard
          title="Ultimos 7 dias"
          value={recentDeliveries}
          icon={<Calendar size={24} />}
        />
      </div>

      {/* Deliveries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de entregas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && responsibleDeliveries.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : responsibleDeliveries.length === 0 ? (
            <EmptyState
              icon={<Truck size={32} className="text-gray" />}
              title="Sin entregas"
              description={`Aun no hay entregas registradas para ${title}. Las entregas aparecern aqui automaticamente cuando se registren movimientos de salida.`}
            />
          ) : (
            <DataTable
              data={responsibleDeliveries}
              columns={columns}
              searchable
              searchKeys={['notes'] as (keyof DeliveryWithProduct)[]}
              getRowId={(item) => item.id}
              pageSize={15}
            />
          )}
        </CardContent>
      </Card>
    </MainLayout>
  )
}
