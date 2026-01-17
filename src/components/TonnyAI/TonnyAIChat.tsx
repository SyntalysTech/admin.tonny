'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, X, Send, Minimize2, Maximize2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function TonnyAIChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hola! Soy TonnyAI, tu asistente de inventario. Puedo ayudarte a gestionar productos, stock, entregas y mas. Que necesitas?',
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus()
    }
  }, [isOpen, isMinimized])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 55000) // 55 segundos timeout

      const response = await fetch('/api/tonny-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: userMessage }].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error en la respuesta')
      }

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.message || 'No pude procesar tu solicitud.' },
      ])
    } catch (error) {
      console.error('Error:', error)
      let errorMsg = 'Lo siento, hubo un error. Intenta de nuevo.'
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMsg = 'La solicitud tardo demasiado. Intenta con una pregunta mas simple.'
        } else if (error.message) {
          errorMsg = `Error: ${error.message}`
        }
      }
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: errorMsg },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Chat reiniciado. En que puedo ayudarte?',
      },
    ])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Floating button when closed
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary hover:bg-primary-dark rounded-full shadow-lg flex items-center justify-center text-white transition-all hover:scale-105 z-50"
        title="Abrir TonnyAI"
      >
        <Bot size={28} />
      </button>
    )
  }

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 bg-white rounded-2xl shadow-2xl border border-border flex flex-col z-50 transition-all duration-300',
        isMinimized ? 'w-72 h-14' : 'w-96 h-[600px] max-h-[80vh]'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary rounded-t-2xl">
        <div className="flex items-center gap-2 text-white">
          <Bot size={24} />
          <div>
            <h3 className="font-semibold text-sm">TonnyAI</h3>
            {!isMinimized && (
              <p className="text-xs text-white/80">Asistente de inventario</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!isMinimized && (
            <button
              onClick={clearChat}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white"
              title="Limpiar chat"
            >
              <Trash2 size={18} />
            </button>
          )}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white"
            title={isMinimized ? 'Expandir' : 'Minimizar'}
          >
            {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white"
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Chat content */}
      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  'flex',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm',
                    message.role === 'user'
                      ? 'bg-primary text-white rounded-br-md'
                      : 'bg-muted text-foreground rounded-bl-md'
                  )}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu mensaje..."
                className="flex-1 px-4 py-2.5 bg-muted rounded-xl border-0 outline-none focus:ring-2 focus:ring-primary/20 text-sm placeholder:text-gray-light"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="p-2.5 bg-primary hover:bg-primary-dark disabled:bg-gray-light disabled:cursor-not-allowed rounded-xl text-white transition-colors"
              >
                <Send size={20} />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Ejemplos: &quot;Agrega 10 galones de pintura&quot; o &quot;Cuanto stock hay?&quot;
            </p>
          </div>
        </>
      )}
    </div>
  )
}
