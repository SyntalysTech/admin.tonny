'use client'

import Link from 'next/link'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { StatsCard } from '@/components/ui/StatsCard'
import { Badge } from '@/components/ui/Badge'
import { useProducts } from '@/hooks/useProducts'
import {
  Package,
  Wrench,
  Droplets,
  Users,
  TrendingDown,
  AlertTriangle,
  ArrowRight,
  Boxes,
  BookOpen,
} from 'lucide-react'

// Proverbios bíblicos reales
const PROVERBIOS_BIBLICOS = [
  { texto: "Confía en el Señor con todo tu corazón, y no te apoyes en tu propia prudencia.", cita: "Proverbios 3:5" },
  { texto: "El principio de la sabiduría es el temor del Señor.", cita: "Proverbios 9:10" },
  { texto: "El que guarda su boca y su lengua, guarda su alma de angustias.", cita: "Proverbios 21:23" },
  { texto: "Mejor es el fin del negocio que su principio; mejor es el sufrido de espíritu que el altivo.", cita: "Eclesiastés 7:8" },
  { texto: "Todo tiene su tiempo, y todo lo que se quiere debajo del cielo tiene su hora.", cita: "Eclesiastés 3:1" },
  { texto: "El corazón alegre constituye buen remedio; mas el espíritu triste seca los huesos.", cita: "Proverbios 17:22" },
  { texto: "La mano de los diligentes señoreará; mas la negligencia será tributaria.", cita: "Proverbios 12:24" },
  { texto: "El que halla esposa halla el bien, y alcanza la benevolencia del Señor.", cita: "Proverbios 18:22" },
  { texto: "Instruye al niño en su camino, y aun cuando fuere viejo no se apartará de él.", cita: "Proverbios 22:6" },
  { texto: "La respuesta blanda quita la ira; mas la palabra áspera hace subir el furor.", cita: "Proverbios 15:1" },
  { texto: "Mejor es adquirir sabiduría que oro preciado; y adquirir inteligencia vale más que la plata.", cita: "Proverbios 16:16" },
  { texto: "El hierro con hierro se aguza; y así el hombre aguza el rostro de su amigo.", cita: "Proverbios 27:17" },
  { texto: "En la multitud de consejeros hay seguridad.", cita: "Proverbios 11:14" },
  { texto: "El que trabaja su tierra se saciará de pan; mas el que sigue a los vagos se llenará de pobreza.", cita: "Proverbios 28:19" },
  { texto: "Panal de miel son los dichos suaves; suavidad al alma y medicina para los huesos.", cita: "Proverbios 16:24" },
  { texto: "El perezoso no ara a causa del invierno; pedirá, pues, en la siega, y no hallará.", cita: "Proverbios 20:4" },
  { texto: "Bienaventurado el hombre que halla la sabiduría, y que obtiene la inteligencia.", cita: "Proverbios 3:13" },
  { texto: "Encomienda a Jehová tus obras, y tus pensamientos serán afirmados.", cita: "Proverbios 16:3" },
  { texto: "El hombre iracundo levanta contiendas; mas el que tarda en airarse apacigua la rencilla.", cita: "Proverbios 15:18" },
  { texto: "Mujer virtuosa, ¿quién la hallará? Porque su estima sobrepasa largamente a la de las piedras preciosas.", cita: "Proverbios 31:10" },
  { texto: "El temor del Señor es enseñanza de sabiduría; y a la honra precede la humildad.", cita: "Proverbios 15:33" },
  { texto: "Hay camino que al hombre le parece derecho; pero su fin es camino de muerte.", cita: "Proverbios 14:12" },
  { texto: "El justo come hasta saciar su alma; mas el vientre de los impíos tendrá necesidad.", cita: "Proverbios 13:25" },
  { texto: "La cordura del hombre detiene su furor, y su honra es pasar por alto la ofensa.", cita: "Proverbios 19:11" },
  { texto: "El que anda con sabios, sabio será; mas el que se junta con necios será quebrantado.", cita: "Proverbios 13:20" },
  { texto: "Torre fuerte es el nombre del Señor; a él correrá el justo, y será levantado.", cita: "Proverbios 18:10" },
  { texto: "Antes del quebrantamiento es la soberbia, y antes de la caída la altivez de espíritu.", cita: "Proverbios 16:18" },
  { texto: "El que refrena sus labios es prudente.", cita: "Proverbios 10:19" },
  { texto: "Corona de satisfacción es la vejez, si se halla en caminos de justicia.", cita: "Proverbios 16:31" },
  { texto: "Las riquezas de vanidad disminuirán; pero el que recoge con mano laboriosa las aumenta.", cita: "Proverbios 13:11" },
  { texto: "Dad, y se os dará; medida buena, apretada, remecida y rebosando darán en vuestro regazo.", cita: "Lucas 6:38" },
]

// Obtener proverbio del día basado en la fecha
const getProverbioDelDia = () => {
  const today = new Date()
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000)
  return PROVERBIOS_BIBLICOS[dayOfYear % PROVERBIOS_BIBLICOS.length]
}

export default function DashboardPage() {
  const proverbio = getProverbioDelDia()
  // El hook ahora maneja automáticamente la carga de datos
  const { products, isLoading } = useProducts()

  // Calculate stats
  const materialRemodelacion = products.filter((p) => p.category === 'material_remodelacion')
  const herramientaRemodelacion = products.filter((p) => p.category === 'herramienta_remodelacion')
  const materialPlomeria = products.filter((p) => p.category === 'material_plomeria')
  const herramientaPlomeria = products.filter((p) => p.category === 'herramienta_plomeria')

  const totalProducts = products.length
  const lowStockProducts = products.filter((p) => p.stock <= p.min_stock)
  const totalItems = products.reduce((sum, p) => sum + p.stock, 0)

  const quickLinks = [
    {
      title: 'Material Remodelacion',
      href: '/inventario/material-remodelacion',
      icon: <Package size={20} />,
      count: materialRemodelacion.length,
      color: 'bg-blue-500',
    },
    {
      title: 'Herramientas Remodelacion',
      href: '/inventario/herramientas-remodelacion',
      icon: <Wrench size={20} />,
      count: herramientaRemodelacion.length,
      color: 'bg-orange-500',
    },
    {
      title: 'Material Plomeria',
      href: '/inventario/material-plomeria',
      icon: <Droplets size={20} />,
      count: materialPlomeria.length,
      color: 'bg-cyan-500',
    },
    {
      title: 'Herramientas Plomeria',
      href: '/inventario/herramientas-plomeria',
      icon: <Wrench size={20} />,
      count: herramientaPlomeria.length,
      color: 'bg-purple-500',
    },
  ]

  const responsibles = [
    { name: 'Jordi', href: '/entregas/jordi', type: 'Subcontratista' },
    { name: 'Gustavo', href: '/entregas/gustavo', type: 'Subcontratista' },
    { name: 'David', href: '/entregas/david', type: 'Subcontratista' },
    { name: 'Taurus', href: '/entregas/taurus', type: 'Personal interno' },
  ]

  return (
    <MainLayout title="Dashboard" subtitle="Vista general del inventario">
      {/* Proverbio del día */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <BookOpen className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">Palabra del Día</p>
            <p className="text-amber-900 dark:text-amber-100 mt-1 italic">
              &ldquo;{proverbio.texto}&rdquo;
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-2 font-medium text-right">
              — {proverbio.cita}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total productos"
          value={totalProducts}
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
        <StatsCard
          title="Categorias"
          value={4}
          icon={<Wrench size={24} />}
        />
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <p className="font-semibold text-amber-800 dark:text-amber-300">Alerta de stock bajo</p>
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                Tienes {lowStockProducts.length} producto(s) con stock bajo o agotado
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {lowStockProducts.slice(0, 5).map((product) => (
                  <Badge key={product.id} variant="warning">
                    {product.name} ({product.stock} {product.unit})
                  </Badge>
                ))}
                {lowStockProducts.length > 5 && (
                  <Badge variant="outline">+{lowStockProducts.length - 5} mas</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Inventory Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Inventarios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : (
              quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${link.color} flex items-center justify-center text-white`}>
                      {link.icon}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{link.title}</p>
                      <p className="text-sm text-muted-foreground">{link.count} productos</p>
                    </div>
                  </div>
                  <ArrowRight size={18} className="text-gray group-hover:text-primary transition-colors" />
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Responsibles */}
        <Card>
          <CardHeader>
            <CardTitle>Entregas por responsable</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {responsibles.map((person) => (
              <Link
                key={person.href}
                href={person.href}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{person.name}</p>
                    <p className="text-sm text-muted-foreground">{person.type}</p>
                  </div>
                </div>
                <ArrowRight size={18} className="text-gray group-hover:text-primary transition-colors" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Low Stock Products */}
      {lowStockProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Productos con stock bajo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Producto</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Categoria</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Stock</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Minimo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {lowStockProducts.slice(0, 5).map((product) => (
                    <tr key={product.id} className="hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <p className="font-medium text-foreground">{product.name}</p>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">
                          {product.category.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-semibold ${product.stock === 0 ? 'text-destructive' : 'text-warning'}`}>
                          {product.stock} {product.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {product.min_stock} {product.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </MainLayout>
  )
}
