import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 60000,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ============== FUNCIONES DISPONIBLES ==============
const functions: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  // ========== PRODUCTOS ==========
  {
    type: 'function',
    function: {
      name: 'get_all_products',
      description: 'Obtiene todos los productos del inventario con su stock actual',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: ['material_remodelacion', 'herramienta_remodelacion', 'material_plomeria', 'herramienta_plomeria'],
            description: 'Filtrar por categoria (opcional)',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_product_by_name',
      description: 'Busca un producto por nombre (busqueda parcial). Usa esto primero si el usuario menciona un producto por nombre.',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Nombre o parte del nombre del producto a buscar',
          },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_product',
      description: 'Agrega un nuevo producto al inventario. Deduce categoria automaticamente si no se especifica.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Nombre del producto' },
          description: { type: 'string', description: 'Descripcion del producto' },
          category: {
            type: 'string',
            enum: ['material_remodelacion', 'herramienta_remodelacion', 'material_plomeria', 'herramienta_plomeria'],
            description: 'Categoria del producto',
          },
          stock: { type: 'number', description: 'Cantidad inicial en stock' },
          min_stock: { type: 'number', description: 'Stock minimo para alerta (default: 5)' },
          unit: { type: 'string', description: 'Unidad de medida (unidad, metro, galon, kg, pieza, bolsa, etc)' },
          price: { type: 'number', description: 'Precio unitario (opcional)' },
          supplier: { type: 'string', description: 'Proveedor (opcional)' },
          location: { type: 'string', description: 'Ubicacion en bodega (opcional)' },
        },
        required: ['name', 'category', 'stock', 'unit'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_product',
      description: 'Actualiza un producto existente (nombre, precio, stock minimo, proveedor, ubicacion, etc)',
      parameters: {
        type: 'object',
        properties: {
          product_id: { type: 'string', description: 'ID del producto a actualizar' },
          updates: {
            type: 'object',
            description: 'Campos a actualizar',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              min_stock: { type: 'number' },
              unit: { type: 'string' },
              price: { type: 'number' },
              supplier: { type: 'string' },
              location: { type: 'string' },
            },
          },
        },
        required: ['product_id', 'updates'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_product',
      description: 'Elimina un producto del inventario permanentemente',
      parameters: {
        type: 'object',
        properties: {
          product_id: { type: 'string', description: 'ID del producto a eliminar' },
        },
        required: ['product_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_stock',
      description: 'Agrega stock a un producto existente (entrada de inventario)',
      parameters: {
        type: 'object',
        properties: {
          product_id: { type: 'string', description: 'ID del producto' },
          quantity: { type: 'number', description: 'Cantidad a agregar' },
          notes: { type: 'string', description: 'Notas o comentarios (opcional)' },
        },
        required: ['product_id', 'quantity'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'remove_stock',
      description: 'Quita stock de un producto (salida de inventario, entrega a responsable)',
      parameters: {
        type: 'object',
        properties: {
          product_id: { type: 'string', description: 'ID del producto' },
          quantity: { type: 'number', description: 'Cantidad a quitar' },
          responsible: {
            type: 'string',
            enum: ['jordi', 'gustavo', 'david', 'taurus'],
            description: 'Persona responsable de la entrega (registra la entrega automaticamente)',
          },
          notes: { type: 'string', description: 'Notas o comentarios (opcional)' },
        },
        required: ['product_id', 'quantity'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'adjust_stock',
      description: 'Ajusta el stock de un producto a una cantidad especifica (para correccion de inventario)',
      parameters: {
        type: 'object',
        properties: {
          product_id: { type: 'string', description: 'ID del producto' },
          new_quantity: { type: 'number', description: 'Nueva cantidad de stock' },
          notes: { type: 'string', description: 'Razon del ajuste' },
        },
        required: ['product_id', 'new_quantity'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_low_stock_products',
      description: 'Obtiene productos con stock bajo o agotado (stock <= min_stock)',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_stock_movements',
      description: 'Obtiene el historial de movimientos de stock (entradas, salidas, ajustes)',
      parameters: {
        type: 'object',
        properties: {
          product_id: { type: 'string', description: 'Filtrar por producto (opcional)' },
          limit: { type: 'number', description: 'Numero de registros a obtener (default 20)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_deliveries',
      description: 'Obtiene las entregas realizadas a responsables (Jordi, Gustavo, David, Taurus)',
      parameters: {
        type: 'object',
        properties: {
          responsible: {
            type: 'string',
            enum: ['jordi', 'gustavo', 'david', 'taurus'],
            description: 'Filtrar por responsable (opcional)',
          },
          limit: { type: 'number', description: 'Numero de registros (default 20)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_inventory_summary',
      description: 'Obtiene un resumen completo del inventario: totales, por categoria, stock bajo, valor estimado',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  // ========== COMPRAS ==========
  {
    type: 'function',
    function: {
      name: 'get_purchases',
      description: 'Obtiene el registro de compras realizadas',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['pendiente', 'completada', 'cancelada'],
            description: 'Filtrar por estado (opcional)',
          },
          limit: { type: 'number', description: 'Numero de registros (default 20)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_purchase',
      description: 'Registra una nueva compra',
      parameters: {
        type: 'object',
        properties: {
          supplier: { type: 'string', description: 'Nombre del proveedor' },
          description: { type: 'string', description: 'Descripcion de lo comprado' },
          total: { type: 'number', description: 'Monto total de la compra' },
          status: {
            type: 'string',
            enum: ['pendiente', 'completada', 'cancelada'],
            description: 'Estado de la compra (default: completada)',
          },
          payment_method: {
            type: 'string',
            enum: ['efectivo', 'transferencia', 'tarjeta', 'credito'],
            description: 'Metodo de pago',
          },
          invoice_number: { type: 'string', description: 'Numero de factura (opcional)' },
          notes: { type: 'string', description: 'Notas adicionales (opcional)' },
          purchased_at: { type: 'string', description: 'Fecha de compra en formato ISO (default: hoy)' },
        },
        required: ['supplier', 'description', 'total'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_purchase',
      description: 'Actualiza una compra existente',
      parameters: {
        type: 'object',
        properties: {
          purchase_id: { type: 'string', description: 'ID de la compra' },
          updates: {
            type: 'object',
            description: 'Campos a actualizar',
            properties: {
              supplier: { type: 'string' },
              description: { type: 'string' },
              total: { type: 'number' },
              status: { type: 'string', enum: ['pendiente', 'completada', 'cancelada'] },
              payment_method: { type: 'string', enum: ['efectivo', 'transferencia', 'tarjeta', 'credito'] },
              invoice_number: { type: 'string' },
              notes: { type: 'string' },
            },
          },
        },
        required: ['purchase_id', 'updates'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_purchase',
      description: 'Elimina un registro de compra',
      parameters: {
        type: 'object',
        properties: {
          purchase_id: { type: 'string', description: 'ID de la compra a eliminar' },
        },
        required: ['purchase_id'],
      },
    },
  },
  // ========== COTIZACIONES ==========
  {
    type: 'function',
    function: {
      name: 'get_quotes',
      description: 'Obtiene las cotizaciones registradas',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['pendiente', 'aprobada', 'rechazada', 'vencida'],
            description: 'Filtrar por estado (opcional)',
          },
          limit: { type: 'number', description: 'Numero de registros (default 20)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_quote',
      description: 'Registra una nueva cotizacion',
      parameters: {
        type: 'object',
        properties: {
          supplier: { type: 'string', description: 'Nombre del proveedor' },
          description: { type: 'string', description: 'Descripcion de la cotizacion' },
          total: { type: 'number', description: 'Monto total cotizado' },
          status: {
            type: 'string',
            enum: ['pendiente', 'aprobada', 'rechazada', 'vencida'],
            description: 'Estado de la cotizacion (default: pendiente)',
          },
          valid_until: { type: 'string', description: 'Fecha de vigencia en formato ISO (opcional)' },
          notes: { type: 'string', description: 'Notas adicionales (opcional)' },
        },
        required: ['supplier', 'description', 'total'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_quote',
      description: 'Actualiza una cotizacion existente (estado, monto, notas, etc)',
      parameters: {
        type: 'object',
        properties: {
          quote_id: { type: 'string', description: 'ID de la cotizacion' },
          updates: {
            type: 'object',
            description: 'Campos a actualizar',
            properties: {
              supplier: { type: 'string' },
              description: { type: 'string' },
              total: { type: 'number' },
              status: { type: 'string', enum: ['pendiente', 'aprobada', 'rechazada', 'vencida'] },
              valid_until: { type: 'string' },
              notes: { type: 'string' },
            },
          },
        },
        required: ['quote_id', 'updates'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_quote',
      description: 'Elimina una cotizacion',
      parameters: {
        type: 'object',
        properties: {
          quote_id: { type: 'string', description: 'ID de la cotizacion a eliminar' },
        },
        required: ['quote_id'],
      },
    },
  },
  // ========== FINANZAS RESUMEN ==========
  {
    type: 'function',
    function: {
      name: 'get_finance_summary',
      description: 'Obtiene un resumen de finanzas: total de compras, cotizaciones pendientes, etc',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
]

// ============== IMPLEMENTACION DE FUNCIONES ==============
async function executeFunction(name: string, args: Record<string, unknown>): Promise<string> {
  try {
    switch (name) {
      // ========== PRODUCTOS ==========
      case 'get_all_products': {
        let query = supabase.from('products').select('*').order('name')
        if (args.category) {
          query = query.eq('category', args.category)
        }
        const { data, error } = await query
        if (error) throw error

        // Formatear para respuesta mas legible
        const products = (data || []).map(p => ({
          id: p.id,
          nombre: p.name,
          stock: `${p.stock} ${p.unit}`,
          stock_numerico: p.stock,
          min_stock: p.min_stock,
          categoria: p.category,
          precio: p.price ? `$${p.price}` : 'Sin precio',
          proveedor: p.supplier || 'No especificado',
          ubicacion: p.location || 'No especificada',
          alerta: p.stock <= p.min_stock ? '⚠️ STOCK BAJO' : null,
        }))
        return JSON.stringify(products)
      }

      case 'get_product_by_name': {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .ilike('name', `%${args.name}%`)
        if (error) throw error

        if (!data || data.length === 0) {
          return JSON.stringify({
            encontrados: 0,
            mensaje: `No se encontraron productos con "${args.name}"`
          })
        }

        const products = data.map(p => ({
          id: p.id,
          nombre: p.name,
          stock: `${p.stock} ${p.unit}`,
          stock_numerico: p.stock,
          min_stock: p.min_stock,
          categoria: p.category,
          precio: p.price ? `$${p.price}` : null,
          proveedor: p.supplier,
          ubicacion: p.location,
        }))
        return JSON.stringify({ encontrados: products.length, productos: products })
      }

      case 'add_product': {
        const { data, error } = await supabase
          .from('products')
          .insert({
            name: args.name,
            description: args.description || null,
            category: args.category,
            stock: args.stock || 0,
            min_stock: args.min_stock || 5,
            unit: args.unit || 'unidad',
            price: args.price || null,
            supplier: args.supplier || null,
            location: args.location || null,
          })
          .select()
          .single()
        if (error) throw error
        return JSON.stringify({
          success: true,
          mensaje: `Producto "${data.name}" agregado con ${data.stock} ${data.unit}`,
          producto: data
        })
      }

      case 'update_product': {
        // Primero obtener el producto actual
        const { data: current, error: fetchError } = await supabase
          .from('products')
          .select('name')
          .eq('id', args.product_id)
          .single()
        if (fetchError) throw new Error('Producto no encontrado')

        const { data, error } = await supabase
          .from('products')
          .update(args.updates as Record<string, unknown>)
          .eq('id', args.product_id)
          .select()
          .single()
        if (error) throw error
        return JSON.stringify({
          success: true,
          mensaje: `Producto "${current.name}" actualizado`,
          producto: data
        })
      }

      case 'delete_product': {
        // Primero obtener nombre
        const { data: current, error: fetchError } = await supabase
          .from('products')
          .select('name')
          .eq('id', args.product_id)
          .single()
        if (fetchError) throw new Error('Producto no encontrado')

        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', args.product_id)
        if (error) throw error
        return JSON.stringify({
          success: true,
          mensaje: `Producto "${current.name}" eliminado permanentemente`
        })
      }

      case 'add_stock': {
        const { data: product, error: fetchError } = await supabase
          .from('products')
          .select('stock, name, unit')
          .eq('id', args.product_id)
          .single()
        if (fetchError) throw new Error('Producto no encontrado')

        const newStock = product.stock + (args.quantity as number)

        const { error: updateError } = await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', args.product_id)
        if (updateError) throw updateError

        await supabase.from('stock_movements').insert({
          product_id: args.product_id,
          quantity: args.quantity,
          movement_type: 'entrada',
          notes: args.notes || 'Entrada via TonnyAI',
        })

        return JSON.stringify({
          success: true,
          mensaje: `+${args.quantity} ${product.unit} de ${product.name}`,
          stock_anterior: product.stock,
          stock_nuevo: newStock,
        })
      }

      case 'remove_stock': {
        const { data: product, error: fetchError } = await supabase
          .from('products')
          .select('stock, name, unit')
          .eq('id', args.product_id)
          .single()
        if (fetchError) throw new Error('Producto no encontrado')

        if (product.stock < (args.quantity as number)) {
          return JSON.stringify({
            success: false,
            error: `Stock insuficiente de ${product.name}. Disponible: ${product.stock} ${product.unit}, solicitado: ${args.quantity}`,
          })
        }

        const newStock = product.stock - (args.quantity as number)

        const { error: updateError } = await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', args.product_id)
        if (updateError) throw updateError

        await supabase.from('stock_movements').insert({
          product_id: args.product_id,
          quantity: args.quantity,
          movement_type: 'salida',
          responsible: args.responsible || null,
          notes: args.notes || 'Salida via TonnyAI',
        })

        if (args.responsible) {
          await supabase.from('deliveries').insert({
            product_id: args.product_id,
            quantity: args.quantity,
            responsible: args.responsible,
            notes: args.notes || null,
            delivered_at: new Date().toISOString(),
          })
        }

        const responsableText = args.responsible
          ? ` entregado a ${(args.responsible as string).charAt(0).toUpperCase() + (args.responsible as string).slice(1)}`
          : ''

        return JSON.stringify({
          success: true,
          mensaje: `-${args.quantity} ${product.unit} de ${product.name}${responsableText}`,
          stock_anterior: product.stock,
          stock_nuevo: newStock,
        })
      }

      case 'adjust_stock': {
        const { data: product, error: fetchError } = await supabase
          .from('products')
          .select('stock, name, unit')
          .eq('id', args.product_id)
          .single()
        if (fetchError) throw new Error('Producto no encontrado')

        const { error: updateError } = await supabase
          .from('products')
          .update({ stock: args.new_quantity })
          .eq('id', args.product_id)
        if (updateError) throw updateError

        await supabase.from('stock_movements').insert({
          product_id: args.product_id,
          quantity: args.new_quantity,
          movement_type: 'ajuste',
          notes: args.notes || 'Ajuste via TonnyAI',
        })

        return JSON.stringify({
          success: true,
          mensaje: `Stock de ${product.name} ajustado a ${args.new_quantity} ${product.unit}`,
          stock_anterior: product.stock,
          stock_nuevo: args.new_quantity,
        })
      }

      case 'get_low_stock_products': {
        const { data: allProducts } = await supabase.from('products').select('*')
        const lowStock = (allProducts || [])
          .filter((p) => p.stock <= p.min_stock)
          .map(p => ({
            id: p.id,
            nombre: p.name,
            stock_actual: `${p.stock} ${p.unit}`,
            stock_minimo: p.min_stock,
            faltante: Math.max(0, p.min_stock - p.stock),
            categoria: p.category,
            proveedor: p.supplier || 'No especificado',
          }))

        if (lowStock.length === 0) {
          return JSON.stringify({ mensaje: 'Ningun producto con stock bajo', productos: [] })
        }
        return JSON.stringify({
          alerta: `${lowStock.length} producto(s) con stock bajo`,
          productos: lowStock
        })
      }

      case 'get_stock_movements': {
        let query = supabase
          .from('stock_movements')
          .select('*, product:products(name, unit)')
          .order('created_at', { ascending: false })
          .limit((args.limit as number) || 20)

        if (args.product_id) {
          query = query.eq('product_id', args.product_id)
        }

        const { data, error } = await query
        if (error) throw error

        const movements = (data || []).map(m => ({
          fecha: new Date(m.created_at).toLocaleDateString('es-MX'),
          producto: m.product?.name,
          tipo: m.movement_type,
          cantidad: `${m.movement_type === 'salida' ? '-' : '+'}${m.quantity} ${m.product?.unit}`,
          responsable: m.responsible || '-',
          notas: m.notes || '-',
        }))
        return JSON.stringify(movements)
      }

      case 'get_deliveries': {
        let query = supabase
          .from('deliveries')
          .select('*, product:products(name, unit)')
          .order('delivered_at', { ascending: false })
          .limit((args.limit as number) || 20)

        if (args.responsible) {
          query = query.eq('responsible', args.responsible)
        }

        const { data, error } = await query
        if (error) throw error

        const deliveries = (data || []).map(d => ({
          fecha: new Date(d.delivered_at).toLocaleDateString('es-MX'),
          producto: d.product?.name,
          cantidad: `${d.quantity} ${d.product?.unit}`,
          responsable: d.responsible.charAt(0).toUpperCase() + d.responsible.slice(1),
          notas: d.notes || '-',
        }))
        return JSON.stringify(deliveries)
      }

      case 'get_inventory_summary': {
        const { data: products } = await supabase.from('products').select('*')
        const allProducts = products || []

        const lowStockCount = allProducts.filter((p) => p.stock <= p.min_stock).length
        const totalValue = allProducts.reduce((sum, p) => sum + (p.price || 0) * p.stock, 0)

        const summary = {
          total_productos: allProducts.length,
          total_items_en_stock: allProducts.reduce((sum, p) => sum + p.stock, 0),
          productos_stock_bajo: lowStockCount,
          alerta_stock: lowStockCount > 0 ? `⚠️ ${lowStockCount} producto(s) necesitan reabastecimiento` : '✅ Stock OK',
          por_categoria: {
            'Material Remodelacion': allProducts.filter((p) => p.category === 'material_remodelacion').length,
            'Herramientas Remodelacion': allProducts.filter((p) => p.category === 'herramienta_remodelacion').length,
            'Material Plomeria': allProducts.filter((p) => p.category === 'material_plomeria').length,
            'Herramientas Plomeria': allProducts.filter((p) => p.category === 'herramienta_plomeria').length,
          },
          valor_estimado: `$${totalValue.toLocaleString('es-MX')} MXN`,
        }

        return JSON.stringify(summary)
      }

      // ========== COMPRAS ==========
      case 'get_purchases': {
        let query = supabase
          .from('purchases')
          .select('*')
          .order('purchased_at', { ascending: false })
          .limit((args.limit as number) || 20)

        if (args.status) {
          query = query.eq('status', args.status)
        }

        const { data, error } = await query
        if (error) throw error

        const purchases = (data || []).map(p => ({
          id: p.id,
          fecha: new Date(p.purchased_at).toLocaleDateString('es-MX'),
          proveedor: p.supplier,
          descripcion: p.description,
          total: `$${p.total.toLocaleString('es-MX')}`,
          estado: p.status,
          metodo_pago: p.payment_method || 'No especificado',
          factura: p.invoice_number || '-',
          notas: p.notes || '-',
        }))

        const totalGastado = (data || [])
          .filter(p => p.status === 'completada')
          .reduce((sum, p) => sum + p.total, 0)

        return JSON.stringify({
          total_compras: purchases.length,
          total_gastado: `$${totalGastado.toLocaleString('es-MX')}`,
          compras: purchases
        })
      }

      case 'add_purchase': {
        const { data, error } = await supabase
          .from('purchases')
          .insert({
            supplier: args.supplier,
            description: args.description,
            total: args.total,
            status: args.status || 'completada',
            payment_method: args.payment_method || null,
            invoice_number: args.invoice_number || null,
            notes: args.notes || null,
            purchased_at: args.purchased_at || new Date().toISOString(),
          })
          .select()
          .single()
        if (error) throw error
        return JSON.stringify({
          success: true,
          mensaje: `Compra de $${(args.total as number).toLocaleString('es-MX')} en ${args.supplier} registrada`,
          compra: data
        })
      }

      case 'update_purchase': {
        const { data, error } = await supabase
          .from('purchases')
          .update(args.updates as Record<string, unknown>)
          .eq('id', args.purchase_id)
          .select()
          .single()
        if (error) throw error
        return JSON.stringify({
          success: true,
          mensaje: 'Compra actualizada',
          compra: data
        })
      }

      case 'delete_purchase': {
        const { error } = await supabase
          .from('purchases')
          .delete()
          .eq('id', args.purchase_id)
        if (error) throw error
        return JSON.stringify({ success: true, mensaje: 'Compra eliminada' })
      }

      // ========== COTIZACIONES ==========
      case 'get_quotes': {
        let query = supabase
          .from('quotes')
          .select('*')
          .order('created_at', { ascending: false })
          .limit((args.limit as number) || 20)

        if (args.status) {
          query = query.eq('status', args.status)
        }

        const { data, error } = await query
        if (error) throw error

        const quotes = (data || []).map(q => ({
          id: q.id,
          fecha: new Date(q.created_at).toLocaleDateString('es-MX'),
          proveedor: q.supplier,
          descripcion: q.description,
          total: `$${q.total.toLocaleString('es-MX')}`,
          estado: q.status,
          vigente_hasta: q.valid_until ? new Date(q.valid_until).toLocaleDateString('es-MX') : 'No especificada',
          notas: q.notes || '-',
        }))

        const pendientes = (data || []).filter(q => q.status === 'pendiente').length

        return JSON.stringify({
          total_cotizaciones: quotes.length,
          pendientes: pendientes,
          cotizaciones: quotes
        })
      }

      case 'add_quote': {
        const { data, error } = await supabase
          .from('quotes')
          .insert({
            supplier: args.supplier,
            description: args.description,
            total: args.total,
            status: args.status || 'pendiente',
            valid_until: args.valid_until || null,
            notes: args.notes || null,
          })
          .select()
          .single()
        if (error) throw error
        return JSON.stringify({
          success: true,
          mensaje: `Cotizacion de $${(args.total as number).toLocaleString('es-MX')} de ${args.supplier} registrada`,
          cotizacion: data
        })
      }

      case 'update_quote': {
        const { data, error } = await supabase
          .from('quotes')
          .update(args.updates as Record<string, unknown>)
          .eq('id', args.quote_id)
          .select()
          .single()
        if (error) throw error
        return JSON.stringify({
          success: true,
          mensaje: 'Cotizacion actualizada',
          cotizacion: data
        })
      }

      case 'delete_quote': {
        const { error } = await supabase
          .from('quotes')
          .delete()
          .eq('id', args.quote_id)
        if (error) throw error
        return JSON.stringify({ success: true, mensaje: 'Cotizacion eliminada' })
      }

      // ========== RESUMEN FINANZAS ==========
      case 'get_finance_summary': {
        const [purchasesRes, quotesRes] = await Promise.all([
          supabase.from('purchases').select('*'),
          supabase.from('quotes').select('*'),
        ])

        const purchases = purchasesRes.data || []
        const quotes = quotesRes.data || []

        const completedPurchases = purchases.filter(p => p.status === 'completada')
        const pendingPurchases = purchases.filter(p => p.status === 'pendiente')
        const pendingQuotes = quotes.filter(q => q.status === 'pendiente')
        const approvedQuotes = quotes.filter(q => q.status === 'aprobada')

        const thisMonth = new Date()
        thisMonth.setDate(1)
        const purchasesThisMonth = completedPurchases.filter(p => new Date(p.purchased_at) >= thisMonth)

        return JSON.stringify({
          compras: {
            total_registradas: purchases.length,
            completadas: completedPurchases.length,
            pendientes: pendingPurchases.length,
            gasto_total: `$${completedPurchases.reduce((sum, p) => sum + p.total, 0).toLocaleString('es-MX')}`,
            gasto_este_mes: `$${purchasesThisMonth.reduce((sum, p) => sum + p.total, 0).toLocaleString('es-MX')}`,
          },
          cotizaciones: {
            total_registradas: quotes.length,
            pendientes: pendingQuotes.length,
            aprobadas: approvedQuotes.length,
            valor_pendiente: `$${pendingQuotes.reduce((sum, q) => sum + q.total, 0).toLocaleString('es-MX')}`,
          },
        })
      }

      default:
        return JSON.stringify({ error: `Funcion "${name}" no implementada` })
    }
  } catch (error) {
    console.error(`Error en funcion ${name}:`, error)
    return JSON.stringify({
      error: (error as Error).message,
      funcion: name,
      sugerencia: 'Intenta de nuevo o reformula tu solicitud'
    })
  }
}

const SYSTEM_PROMPT = `Eres TonnyAI, el asistente de gestion de Tonny Construction. Manejas TODO: inventario, compras, cotizaciones y finanzas.

PERSONALIDAD:
- Eres rapido, eficiente y directo
- Ejecutas acciones inmediatamente, sin pedir confirmacion
- Hablas en español casual pero profesional
- Eres el asistente de confianza del negocio

CAPACIDADES COMPLETAS:

📦 INVENTARIO:
- Ver todos los productos o por categoria
- Buscar productos por nombre
- Agregar nuevos productos
- Actualizar productos (nombre, precio, proveedor, ubicacion)
- Eliminar productos
- Agregar stock (entradas)
- Quitar stock (salidas/entregas)
- Ajustar stock (correcciones)
- Ver productos con stock bajo
- Ver historial de movimientos
- Ver entregas por responsable
- Resumen completo del inventario

💰 COMPRAS:
- Ver registro de compras
- Registrar nuevas compras
- Actualizar compras existentes
- Eliminar compras
- Estados: pendiente, completada, cancelada
- Metodos de pago: efectivo, transferencia, tarjeta, credito

📋 COTIZACIONES:
- Ver cotizaciones
- Registrar nuevas cotizaciones
- Actualizar cotizaciones
- Eliminar cotizaciones
- Estados: pendiente, aprobada, rechazada, vencida

📊 FINANZAS:
- Resumen de gastos
- Cotizaciones pendientes
- Compras del mes

CATEGORIAS DE PRODUCTOS:
- material_remodelacion: Pintura, lija, cemento, yeso, masilla, sellador, chapa, clavo, tornillo
- herramienta_remodelacion: Taladro, sierra, martillo, destornillador, nivel, cinta metrica
- material_plomeria: Tubo, conexion, valvula, codo, llave de paso, teflon, pegamento PVC
- herramienta_plomeria: Llave stilson, llave inglesa, destapador, soplete, cortatubo

RESPONSABLES DE ENTREGAS: Jordi, Gustavo, David, Taurus

VALORES POR DEFECTO:
- min_stock: 5
- unit: deduce del contexto (galon, unidad, metro, kg, pieza, bolsa, rollo, etc)
- status compra: completada
- status cotizacion: pendiente

REGLAS DE EJECUCION:
1. SIEMPRE busca el producto por nombre primero si el usuario menciona uno
2. NUNCA pidas confirmacion para acciones simples
3. Si hay duda sobre el producto, busca y muestra opciones
4. Si el producto no existe y el usuario quiere agregar stock, pregunta si desea crearlo
5. Para eliminar, primero confirma que encontraste el producto correcto

FORMATO DE RESPUESTA:
- Usa emojis: ✅ exito, ⚠️ alerta, ❌ error, 📦 producto, 📊 resumen, 💰 dinero
- Respuestas cortas para acciones (1-2 lineas)
- Para listas usa guiones simples (-)
- NO uses markdown como ** o ## (no renderiza bien)
- Numeros grandes con formato: $1,234.56

EJEMPLOS:
"agrega 20 galones pintura blanca"
-> Busco "pintura blanca", si existe agrego stock, si no la creo como nuevo producto

"dame 5 tubos a jordi"
-> Busco "tubo", quito 5 del stock y registro entrega a Jordi

"registra compra de 5000 pesos en Home Depot, materiales varios"
-> Registro la compra directamente

"cuanto hemos gastado este mes"
-> Consulto resumen de finanzas y respondo

"que cotizaciones tenemos pendientes"
-> Muestro cotizaciones con status pendiente

ACTUA RAPIDO. SE UTIL. EL USUARIO CONFIA EN TI.`

// Configuracion para permitir mas tiempo de ejecucion
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'API key de OpenAI no configurada' },
        { status: 500 }
      )
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      tools: functions,
      tool_choice: 'auto',
      temperature: 0.7,
      max_tokens: 1500,
    })

    let assistantMessage = response.choices[0].message
    let iterations = 0
    const maxIterations = 5 // Prevenir loops infinitos

    // Handle tool calls
    while (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0 && iterations < maxIterations) {
      iterations++

      const toolResults = await Promise.all(
        assistantMessage.tool_calls.map(async (toolCall) => {
          const funcCall = toolCall as { id: string; function: { name: string; arguments: string } }
          const args = JSON.parse(funcCall.function.arguments)
          const result = await executeFunction(funcCall.function.name, args)
          return {
            role: 'tool' as const,
            tool_call_id: funcCall.id,
            content: result,
          }
        })
      )

      const followUpResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages,
          assistantMessage,
          ...toolResults,
        ],
        tools: functions,
        tool_choice: 'auto',
        temperature: 0.7,
        max_tokens: 1500,
      })

      assistantMessage = followUpResponse.choices[0].message
    }

    return NextResponse.json({
      message: assistantMessage.content || 'No pude generar una respuesta.',
    })
  } catch (error) {
    console.error('TonnyAI Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json(
      { error: `Error: ${errorMessage}` },
      { status: 500 }
    )
  }
}
