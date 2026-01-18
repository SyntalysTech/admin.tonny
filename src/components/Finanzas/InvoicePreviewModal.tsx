"use client"

import { Modal } from '@/components/ui/Modal'
import { useState } from 'react'

interface Props {
  url: string | null
  isOpen: boolean
  onClose: () => void
}

export default function InvoicePreviewModal({ url, isOpen, onClose }: Props) {
  if (!url) return null

  const isPdf = url.toLowerCase().endsWith('.pdf') || url.includes('application/pdf')

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Vista previa factura" size="lg">
      <div className="h-[70vh]">
        {isPdf ? (
          <iframe src={url} className="w-full h-full" />
        ) : (
          <img src={url} className="w-full h-full object-contain" alt="Factura" />
        )}
      </div>
    </Modal>
  )
}
