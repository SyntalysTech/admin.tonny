export type ProductCategory = 'material_remodelacion' | 'herramienta_remodelacion' | 'material_plomeria' | 'herramienta_plomeria'

export type ResponsiblePerson = 'jordi' | 'gustavo' | 'david' | 'taurus'

export interface Product {
  id: string
  name: string
  description?: string
  category: ProductCategory
  stock: number // Stock total calculado (quantity * unit_size) o manual
  min_stock: number
  unit: string // Unidad de medida (pies, metros, galones, unidad, etc.)
  unit_size?: number // Medida por unidad de fábrica (ej: 10 pies por rollo)
  quantity?: number // Cantidad de unidades/piezas en inventario
  price?: number
  supplier?: string
  location?: string
  brand?: string // Marca del producto
  notes?: string // Notas adicionales
  created_at: string
  updated_at: string
}

export interface StockMovement {
  id: string
  product_id: string
  product?: Product
  quantity: number
  movement_type: 'entrada' | 'salida' | 'ajuste'
  responsible: ResponsiblePerson | null
  notes?: string
  original_message?: string
  created_at: string
}

export interface Delivery {
  id: string
  product_id: string
  product?: Product
  quantity: number
  responsible: ResponsiblePerson
  notes?: string
  delivered_at: string
  created_at: string
}

export type PurchaseStatus = 'pendiente' | 'completada' | 'cancelada'
export type QuoteStatus = 'pendiente' | 'aprobada' | 'rechazada' | 'vencida'
export type PaymentMethod = 'efectivo' | 'transferencia' | 'tarjeta' | 'credito'

export interface Purchase {
  id: string
  supplier: string
  description: string
  total: number
  status: PurchaseStatus
  payment_method?: PaymentMethod
  invoice_number?: string
  notes?: string
  purchased_at: string
  created_at: string
}

export interface Quote {
  id: string
  supplier: string
  description: string
  total: number
  status: QuoteStatus
  valid_until?: string
  notes?: string
  created_at: string
}

export type InvoiceStatus = 'pending' | 'processing' | 'done' | 'error'
export type InvoiceCategory = 'compras' | 'finanzas' | 'gastos'

export interface InvoiceItem {
  sku?: string
  description: string
  quantity: number
  unit_price: number
  total: number
}

export interface Invoice {
  id: string
  purchase_id?: string
  file_path?: string
  public_url?: string
  file_name?: string
  mime_type?: string
  extracted_text?: string
  status?: InvoiceStatus
  ai_response?: any
  processed_at?: string
  // Campos estructurados
  supplier?: string
  invoice_number?: string
  invoice_date?: string
  subtotal?: number
  tax?: number
  total?: number
  currency?: string
  payment_method?: string
  category?: InvoiceCategory
  items?: InvoiceItem[]
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      products: {
        Row: Product
        Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>
      }
      stock_movements: {
        Row: StockMovement
        Insert: Omit<StockMovement, 'id' | 'created_at'>
        Update: Partial<Omit<StockMovement, 'id' | 'created_at'>>
      }
      deliveries: {
        Row: Delivery
        Insert: Omit<Delivery, 'id' | 'created_at'>
        Update: Partial<Omit<Delivery, 'id' | 'created_at'>>
      }
      purchases: {
        Row: Purchase
        Insert: Omit<Purchase, 'id' | 'created_at'>
        Update: Partial<Omit<Purchase, 'id' | 'created_at'>>
      }
      quotes: {
        Row: Quote
        Insert: Omit<Quote, 'id' | 'created_at'>
        Update: Partial<Omit<Quote, 'id' | 'created_at'>>
      }
      invoices: {
        Row: Invoice
        Insert: Omit<Invoice, 'id' | 'created_at'>
        Update: Partial<Omit<Invoice, 'id' | 'created_at'>>
      }
    }
  }
}
