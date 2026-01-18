"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { usePurchases } from '@/hooks/useFinanzas'

export function InvoiceUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const { fetchPurchases } = usePurchases()

  const handleUpload = async () => {
    if (!file) return
    setIsUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)

      const res = await fetch('/api/invoices', { method: 'POST', body: fd })
      const data = await res.json()
      console.log('Upload result', data)
      // refrescar lista de compras
      await fetchPurchases()
      setFile(null)
      alert('Factura subida y registrada (siempre que la tabla purchases exista).')
    } catch (err) {
      console.error(err)
      alert('Error al subir factura')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <label className="w-52">
        <Input
          type="file"
          onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
        />
      </label>
      <Button onClick={handleUpload} isLoading={isUploading} disabled={!file}>
        Subir factura
      </Button>
    </div>
  )
}

export default InvoiceUploader
