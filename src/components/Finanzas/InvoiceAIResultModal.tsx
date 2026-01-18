"use client"

import { Modal } from '@/components/ui/Modal'

interface Props {
  aiResponse: any
  isOpen: boolean
  onClose: () => void
}

export default function InvoiceAIResultModal({ aiResponse, isOpen, onClose }: Props) {
  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Resultado IA" size="md">
      <div className="max-h-[60vh] overflow-auto whitespace-pre-wrap text-sm">
        {aiResponse ? (
          <pre className="text-xs">{typeof aiResponse === 'string' ? aiResponse : JSON.stringify(aiResponse, null, 2)}</pre>
        ) : (
          <p className="text-muted-foreground">Sin respuesta de IA</p>
        )}
      </div>
    </Modal>
  )
}
