import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import pdfParse from 'pdf-parse'
import { createWorker } from 'tesseract.js'

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
        const worker = createWorker({ logger: () => {} })
        try {
          await worker.load()
          // Cargar español y usar como fallback; si no está disponible usa eng
          try {
            await worker.loadLanguage('spa')
            await worker.initialize('spa')
          } catch {
            await worker.loadLanguage('eng')
            await worker.initialize('eng')
          }
          const { data } = await worker.recognize(buffer)
          extractedText = data?.text || null
        } finally {
          await worker.terminate()
        }
      }
    } catch (err) {
      console.warn('Text extraction warning', err)
    }

    // Clasificacion simple por palabras clave
    const textLower = (extractedText || '').toLowerCase()
    let section: 'compras' | 'finanzas' = 'finanzas'
    const compraKeywords = ['compra', 'proveedor', 'home depot', 'subtotal', 'unit price', 'cantidad', 'sku']
    if (compraKeywords.some((k) => textLower.includes(k))) {
      section = 'compras'
    }

    // Intentar extraer total e invoice number
    let total: number | null = null
    let invoiceNumber: string | null = null

    if (extractedText) {
      // Buscar cantidades en formato 9,999.99 o 9999.99 o 9.999,99
      const totalMatch = extractedText.match(/(order total|total|orden total|orden de compra|importe)[:\s]*\$?\s*([0-9\.,]+)/i)
      if (totalMatch && totalMatch[2]) {
        const raw = totalMatch[2].replace(/,/g, '')
        total = parseFloat(raw)
      } else {
        // fallback: tomar el último numero con decimales
        const anyNumbers = Array.from(extractedText.matchAll(/([0-9]+[\.,][0-9]{2})/g)).map((m) => m[1])
        if (anyNumbers.length) {
          const last = anyNumbers[anyNumbers.length - 1].replace(/,/g, '')
          total = parseFloat(last)
        }
      }

      const invMatch = extractedText.match(/(invoice|factura|no\.? de factura|folio)[:\s#-]*([A-Z0-9-]+)/i)
      if (invMatch) invoiceNumber = invMatch[2]
    }

    // Insertar registro en invoices
    const invoiceRecord: any = {
      file_path: filePath,
      public_url: publicUrl,
      file_name: file.name,
      mime_type: file.type,
      extracted_text: extractedText || null,
    }

    const { data: invoiceInserted, error: invoiceInsertError } = await supabase
      .from('invoices')
      .insert(invoiceRecord)
      .select()
      .single()

    if (invoiceInsertError) {
      console.error('Insert invoice error', invoiceInsertError)
      // continue but respond with file info
      return NextResponse.json({ file: publicUrl, extractedText }, { status: 200 })
    }

    // Insertar registro en purchases y relacionar invoice via notes
    const purchaseRecord: any = {
      supplier: invoiceNumber ? `Factura ${invoiceNumber}` : (extractedText ? (extractedText.split('\n')[0] || 'Proveedor desconocido') : 'Proveedor desconocido'),
      description: extractedText ? extractedText.slice(0, 1000) : `Archivo subido: ${file.name}`,
      total: total ?? 0,
      status: 'pendiente',
      invoice_number: invoiceNumber || undefined,
      purchased_at: new Date().toISOString(),
      notes: JSON.stringify({ section_detected: section, invoice_id: invoiceInserted.id, file_url: publicUrl }),
    }

    const { data: insertedPurchase, error: insertError } = await supabase
      .from('purchases')
      .insert(purchaseRecord)
      .select()
      .single()

    if (insertError) {
      console.error('Insert purchase error', insertError)
      return NextResponse.json({ invoice: invoiceInserted, file: publicUrl, extractedText }, { status: 200 })
    }

    // Update invoice with purchase_id
    await supabase.from('invoices').update({ purchase_id: insertedPurchase.id }).eq('id', invoiceInserted.id)

    // Notify TonnyAI to refine/assign fields and update the purchase if needed
    try {
      const tonnyRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/tonny-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'invoices',
          messages: [
            {
              role: 'user',
              content: `Procesa esta factura. Invoice URL: ${publicUrl}. Texto extraído: ${extractedText || ''}. Registra o actualiza la compra con ID ${insertedPurchase.id}. Extrae proveedor, total, numero de factura y fecha si están disponibles y actualiza el registro.`,
            },
          ],
        }),
      })

      // ignore TonnyAI response for now, but log if useful
      const tonnyJson = await tonnyRes.json().catch(() => null)
      console.log('TonnyAI notified for invoice', tonnyJson)
    } catch (err) {
      console.warn('Failed to notify TonnyAI', err)
    }

    return NextResponse.json({ invoice: invoiceInserted, inserted: insertedPurchase, file: publicUrl, extractedText })
  } catch (error) {
    console.error('Invoices POST error', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
