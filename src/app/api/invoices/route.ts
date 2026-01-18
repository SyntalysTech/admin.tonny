import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import pdfParse from 'pdf-parse'
import { createWorker } from 'tesseract.js'

// Interface para items de factura
interface InvoiceItem {
  sku?: string
  description: string
  quantity: number
  unit_price: number
  total: number
}

// Interface para datos extraídos
interface ExtractedInvoiceData {
  supplier: string | null
  invoice_number: string | null
  invoice_date: string | null
  subtotal: number | null
  tax: number | null
  total: number | null
  currency: string
  payment_method: string | null
  category: 'compras' | 'finanzas' | 'gastos'
  items: InvoiceItem[]
}

// Función para extraer datos estructurados de la factura
function extractInvoiceData(text: string): ExtractedInvoiceData {
  const textLower = text.toLowerCase()
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  // Detectar categoría
  let category: 'compras' | 'finanzas' | 'gastos' = 'finanzas'
  const compraKeywords = ['compra', 'proveedor', 'home depot', 'ferreteria', 'material', 'herramienta', 'subtotal', 'unit price', 'cantidad', 'sku', 'order', 'purchase']
  const gastosKeywords = ['gasto', 'expense', 'servicio', 'service', 'luz', 'agua', 'telefono', 'internet', 'renta', 'nomina']

  if (compraKeywords.some(k => textLower.includes(k))) {
    category = 'compras'
  } else if (gastosKeywords.some(k => textLower.includes(k))) {
    category = 'gastos'
  }

  // Extraer proveedor (primera línea que parece nombre de empresa)
  let supplier: string | null = null
  const supplierPatterns = [
    /(?:proveedor|supplier|vendor|tienda|store)[:\s]*(.+)/i,
    /(?:home\s*depot|lowes|ferret[eé]ria|construrama|cemex|comex)/i,
  ]

  for (const line of lines.slice(0, 10)) {
    for (const pattern of supplierPatterns) {
      const match = line.match(pattern)
      if (match) {
        supplier = match[1] || match[0]
        break
      }
    }
    if (supplier) break
  }

  // Si no encontramos proveedor, usar primera línea significativa
  if (!supplier && lines.length > 0) {
    const firstMeaningful = lines.find(l => l.length > 3 && !/^(fecha|date|invoice|factura|total|order)/i.test(l))
    if (firstMeaningful) supplier = firstMeaningful.slice(0, 100)
  }

  // Extraer número de factura
  let invoice_number: string | null = null
  const invoicePatterns = [
    /(?:invoice|factura|folio|no\.|#|order|pedido)[:\s#-]*([A-Z0-9][\w-]{3,})/i,
    /([A-Z]{2,}\d{4,})/,
  ]

  for (const pattern of invoicePatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      invoice_number = match[1]
      break
    }
  }

  // Extraer fecha
  let invoice_date: string | null = null
  const datePatterns = [
    /(?:fecha|date)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/,
    /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/,
  ]

  for (const pattern of datePatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      // Convertir a formato ISO
      const dateParts = match[1].split(/[\/\-]/)
      if (dateParts.length === 3) {
        let year = dateParts[2]?.length === 2 ? '20' + dateParts[2] : dateParts[2]
        if (dateParts[0].length === 4) {
          // YYYY-MM-DD
          invoice_date = `${dateParts[0]}-${dateParts[1].padStart(2, '0')}-${dateParts[2].padStart(2, '0')}`
        } else {
          // DD-MM-YYYY o MM-DD-YYYY
          invoice_date = `${year}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`
        }
      }
      break
    }
  }

  // Extraer montos
  let subtotal: number | null = null
  let tax: number | null = null
  let total: number | null = null

  const subtotalMatch = text.match(/(?:subtotal|sub\s*total)[:\s]*\$?\s*([\d,]+\.?\d*)/i)
  if (subtotalMatch) {
    subtotal = parseFloat(subtotalMatch[1].replace(/,/g, ''))
  }

  const taxMatch = text.match(/(?:tax|iva|impuesto|i\.v\.a\.?)[:\s]*\$?\s*([\d,]+\.?\d*)/i)
  if (taxMatch) {
    tax = parseFloat(taxMatch[1].replace(/,/g, ''))
  }

  const totalPatterns = [
    /(?:order\s*total|total\s*order|grand\s*total|total\s*general)[:\s]*\$?\s*([\d,]+\.?\d*)/i,
    /(?:total)[:\s]*\$?\s*([\d,]+\.?\d*)/i,
  ]

  for (const pattern of totalPatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      total = parseFloat(match[1].replace(/,/g, ''))
      break
    }
  }

  // Fallback: buscar el número más grande
  if (!total) {
    const amounts = Array.from(text.matchAll(/\$?\s*([\d,]+\.\d{2})/g))
      .map(m => parseFloat(m[1].replace(/,/g, '')))
      .filter(n => !isNaN(n))
    if (amounts.length > 0) {
      total = Math.max(...amounts)
    }
  }

  // Detectar moneda
  let currency = 'MXN'
  if (/USD|\$\s*US|US\s*\$|dollars?/i.test(text)) {
    currency = 'USD'
  }

  // Detectar método de pago
  let payment_method: string | null = null
  if (/credit\s*card|tarjeta\s*de\s*cr[ée]dito|visa|mastercard|amex/i.test(text)) {
    payment_method = 'tarjeta'
  } else if (/efectivo|cash/i.test(text)) {
    payment_method = 'efectivo'
  } else if (/transfer|transferencia|wire/i.test(text)) {
    payment_method = 'transferencia'
  } else if (/cr[ée]dito|credit|financing/i.test(text)) {
    payment_method = 'credito'
  }

  // Extraer items/productos
  const items: InvoiceItem[] = []

  // Patrones para detectar líneas de productos
  // Formato típico: SKU | Descripción | Cantidad | Precio | Total
  const itemPatterns = [
    // SKU Descripción Qty Price Total
    /([A-Z0-9]{4,})\s+(.{10,50}?)\s+(\d+(?:\.\d+)?)\s+\$?([\d,]+\.?\d*)\s+\$?([\d,]+\.?\d*)/g,
    // Descripción Qty @ Price = Total
    /(.{10,50}?)\s+(\d+(?:\.\d+)?)\s*[@x]\s*\$?([\d,]+\.?\d*)\s*=?\s*\$?([\d,]+\.?\d*)/g,
  ]

  for (const pattern of itemPatterns) {
    const matches = Array.from(text.matchAll(pattern))
    for (const match of matches) {
      if (match.length >= 5) {
        const item: InvoiceItem = {
          sku: match[1]?.match(/^[A-Z0-9]+$/) ? match[1] : undefined,
          description: (match[1]?.match(/^[A-Z0-9]+$/) ? match[2] : match[1]) || 'Producto',
          quantity: parseFloat(match[match.length - 3] || '1'),
          unit_price: parseFloat((match[match.length - 2] || '0').replace(/,/g, '')),
          total: parseFloat((match[match.length - 1] || '0').replace(/,/g, '')),
        }
        if (item.total > 0) {
          items.push(item)
        }
      }
    }
    if (items.length > 0) break
  }

  return {
    supplier,
    invoice_number,
    invoice_date,
    subtotal,
    tax,
    total,
    currency,
    payment_method,
    category,
    items,
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const url = new URL(request.url)
    const purchaseIdsParam = url.searchParams.get('purchase_ids')
    const categoryParam = url.searchParams.get('category')

    let query = supabase.from('invoices').select('*')

    if (purchaseIdsParam) {
      const ids = purchaseIdsParam.split(',').map((s) => s.trim()).filter(Boolean)
      query = query.in('purchase_id', ids)
    }

    if (categoryParam) {
      query = query.eq('category', categoryParam)
    }

    query = query.order('created_at', { ascending: false }).limit(50)

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    console.error('Invoices GET error', err)
    return NextResponse.json({ error: 'Error fetching invoices' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No se envio archivo' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const supabase = await createSupabaseServerClient()

    const filePath = `invoices/${Date.now()}_${file.name}`
    const { error: uploadError } = await supabase.storage
      .from('invoices')
      .upload(filePath, buffer, { contentType: file.type })

    if (uploadError) {
      console.error('Upload error', uploadError)
      return NextResponse.json({ error: 'Error al subir archivo' }, { status: 500 })
    }

    // Obtener URL publica (si el bucket permite)
    const { data: urlData } = supabase.storage.from('invoices').getPublicUrl(filePath)
    const publicUrl = urlData?.publicUrl || null

    // Extraer texto: PDFs con pdf-parse, imágenes con Tesseract
    let extractedText: string | null = null
    try {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const parsed = await pdfParse(buffer)
        extractedText = parsed?.text || null
      } else if (file.type.startsWith('image/')) {
        // Tesseract.js v5+ API
        const worker = await createWorker('spa+eng')
        try {
          const { data } = await worker.recognize(buffer)
          extractedText = data?.text || null
        } finally {
          await worker.terminate()
        }
      }
    } catch (err) {
      console.warn('Text extraction warning', err)
    }

    // Extraer datos estructurados de la factura
    const invoiceData = extractInvoiceData(extractedText || '')

    // Insertar registro en invoices con datos estructurados
    const invoiceRecord: any = {
      file_path: filePath,
      public_url: publicUrl,
      file_name: file.name,
      mime_type: file.type,
      extracted_text: extractedText || null,
      supplier: invoiceData.supplier,
      invoice_number: invoiceData.invoice_number,
      invoice_date: invoiceData.invoice_date,
      subtotal: invoiceData.subtotal,
      tax: invoiceData.tax,
      total: invoiceData.total,
      currency: invoiceData.currency,
      payment_method: invoiceData.payment_method,
      category: invoiceData.category,
      items: invoiceData.items.length > 0 ? JSON.stringify(invoiceData.items) : null,
    }

    const { data: invoiceInserted, error: invoiceInsertError } = await supabase
      .from('invoices')
      .insert(invoiceRecord)
      .select()
      .single()

    if (invoiceInsertError) {
      console.error('Insert invoice error', invoiceInsertError)
      // continue but respond with file info
      return NextResponse.json({ file: publicUrl, extractedText, extractedData: invoiceData }, { status: 200 })
    }

    // Solo crear purchase si la categoría es "compras"
    let insertedPurchase = null
    if (invoiceData.category === 'compras') {
      const purchaseRecord: any = {
        supplier: invoiceData.supplier || (invoiceData.invoice_number ? `Factura ${invoiceData.invoice_number}` : 'Proveedor desconocido'),
        description: extractedText ? extractedText.slice(0, 1000) : `Archivo subido: ${file.name}`,
        total: invoiceData.total ?? 0,
        status: 'pendiente',
        payment_method: invoiceData.payment_method || undefined,
        invoice_number: invoiceData.invoice_number || undefined,
        purchased_at: invoiceData.invoice_date || new Date().toISOString(),
        notes: JSON.stringify({
          section_detected: invoiceData.category,
          invoice_id: invoiceInserted.id,
          file_url: publicUrl,
          items_count: invoiceData.items.length
        }),
      }

      const { data: purchaseData, error: insertError } = await supabase
        .from('purchases')
        .insert(purchaseRecord)
        .select()
        .single()

      if (insertError) {
        console.error('Insert purchase error', insertError)
      } else {
        insertedPurchase = purchaseData
        // Update invoice with purchase_id
        await supabase.from('invoices').update({ purchase_id: insertedPurchase.id, status: 'pending' }).eq('id', invoiceInserted.id)
      }
    } else {
      // Marcar invoice como pending (sin purchase relacionado)
      await supabase.from('invoices').update({ status: 'pending' }).eq('id', invoiceInserted.id)
    }

    // Notify TonnyAI to refine/assign fields and update the purchase if needed
    try {
      // mark as processing
      await supabase.from('invoices').update({ status: 'processing' }).eq('id', invoiceInserted.id)

      const purchaseContext = insertedPurchase
        ? `Compra creada con ID ${insertedPurchase.id}.`
        : `No se creó compra (categoría: ${invoiceData.category}).`

      const tonnyRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/tonny-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'invoices',
          messages: [
            {
              role: 'user',
              content: `Procesa esta factura.
Invoice URL: ${publicUrl}
Categoría detectada: ${invoiceData.category}
Datos extraídos:
- Proveedor: ${invoiceData.supplier || 'No detectado'}
- Número de factura: ${invoiceData.invoice_number || 'No detectado'}
- Fecha: ${invoiceData.invoice_date || 'No detectada'}
- Subtotal: ${invoiceData.subtotal || 'No detectado'}
- IVA: ${invoiceData.tax || 'No detectado'}
- Total: ${invoiceData.total || 'No detectado'}
- Moneda: ${invoiceData.currency}
- Items: ${invoiceData.items.length} productos
${purchaseContext}
Texto extraído: ${extractedText?.slice(0, 2000) || ''}

Valida los datos extraídos y actualiza si es necesario.`,
            },
          ],
        }),
      })

      const tonnyJson = await tonnyRes.json().catch(() => null)
      console.log('TonnyAI notified for invoice', tonnyJson)

      // save AI response and mark done
      await supabase.from('invoices').update({ ai_response: tonnyJson || null, processed_at: new Date().toISOString(), status: 'done' }).eq('id', invoiceInserted.id)
    } catch (err) {
      console.warn('Failed to notify TonnyAI', err)
      await supabase.from('invoices').update({ ai_response: JSON.stringify({ error: String(err) }), processed_at: new Date().toISOString(), status: 'error' }).eq('id', invoiceInserted.id)
    }

    return NextResponse.json({
      invoice: invoiceInserted,
      purchase: insertedPurchase,
      file: publicUrl,
      extractedData: invoiceData,
    })
  } catch (error) {
    console.error('Invoices POST error', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
