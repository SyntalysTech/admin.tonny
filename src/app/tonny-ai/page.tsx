'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import {
  Send,
  Trash2,
  Bot,
  User,
  Package,
  TrendingDown,
  ClipboardList,
  Sparkles,
  Mic,
  X,
  DollarSign,
  FileText,
  Users,
  BarChart3,
  PlusCircle,
  MinusCircle,
} from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const STORAGE_KEY = 'tonny-ai-chat-history'
const WELCOME_MESSAGE: Message = {
  role: 'assistant',
  content: '¡Hola! Soy TonnyAI 🤖 Tu asistente de gestion.\n\n' +
    'Puedo ayudarte con:\n\n' +
    '📦 Inventario\n' +
    '- "Agrega 20 galones de pintura blanca"\n' +
    '- "Dame 5 tubos a Jordi"\n' +
    '- "Cuantas brochas hay?"\n\n' +
    '💰 Compras y Cotizaciones\n' +
    '- "Registra compra de $3,500 en Home Depot"\n' +
    '- "Nueva cotizacion de Truper por $8,000"\n' +
    '- "Cuanto hemos gastado este mes?"\n\n' +
    '¡Habla o escribe, estoy listo!',
  timestamp: new Date(),
}

// Acciones rápidas organizadas por categoría
const quickActionsInventory = [
  { label: 'Resumen inventario', prompt: 'Dame un resumen del inventario', icon: Package },
  { label: 'Stock bajo', prompt: 'Que productos tienen stock bajo?', icon: TrendingDown },
  { label: 'Movimientos recientes', prompt: 'Muestrame los ultimos 10 movimientos de stock', icon: ClipboardList },
]

const quickActionsFinance = [
  { label: 'Resumen finanzas', prompt: 'Dame un resumen de finanzas: compras y cotizaciones', icon: BarChart3 },
  { label: 'Compras del mes', prompt: 'Cuanto hemos gastado este mes en compras?', icon: DollarSign },
  { label: 'Cotizaciones pendientes', prompt: 'Que cotizaciones tenemos pendientes?', icon: FileText },
]

const quickActionsDeliveries = [
  { label: 'Entregas a Jordi', prompt: 'Muestrame las entregas a Jordi', icon: Users },
  { label: 'Entregas a Gustavo', prompt: 'Muestrame las entregas a Gustavo', icon: Users },
  { label: 'Entregas a David', prompt: 'Muestrame las entregas a David', icon: Users },
  { label: 'Entregas a Taurus', prompt: 'Muestrame las entregas a Taurus', icon: Users },
]

export default function TonnyAIPage() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE])
  const [isHydrated, setIsHydrated] = useState(false)
  const [activeSection, setActiveSection] = useState<'inventory' | 'finance' | 'deliveries'>('inventory')
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Cargar historial de localStorage al montar
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        // Convertir timestamps de string a Date
        const messagesWithDates = parsed.map((m: Message & { timestamp: string }) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }))
        if (messagesWithDates.length > 0) {
          setMessages(messagesWithDates)
        }
      }
    } catch (error) {
      console.error('Error loading chat history:', error)
    }
    setIsHydrated(true)
  }, [])

  // Guardar mensajes en localStorage cuando cambien (después de hidratar)
  useEffect(() => {
    if (isHydrated && messages.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
      } catch (error) {
        console.error('Error saving chat history:', error)
      }
    }
  }, [messages, isHydrated])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const sendMessage = useCallback(async (messageText?: string) => {
    const textToSend = messageText || input.trim()
    if (!textToSend || isLoading) return

    setInput('')
    const userMessage: Message = {
      role: 'user',
      content: textToSend,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 55000)

      const response = await fetch('/api/tonny-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
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
        {
          role: 'assistant',
          content: data.message || 'No pude procesar tu solicitud.',
          timestamp: new Date(),
        },
      ])
    } catch (error) {
      console.error('Error:', error)
      let errorMsg = '❌ Lo siento, hubo un error. Intenta de nuevo.'
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMsg = '⏱️ Tardo demasiado. Intenta algo mas simple.'
        } else if (error.message) {
          errorMsg = `❌ ${error.message}`
        }
      }
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: errorMsg,
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }, [input, isLoading, messages])

  // Funciones de grabación de voz
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        stream.getTracks().forEach(track => track.stop())
        await transcribeAudio(audioBlob)
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error al acceder al microfono:', error)
      alert('No se pudo acceder al microfono. Verifica los permisos.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      // Desconectar el handler onstop para que no transcriba
      mediaRecorderRef.current.onstop = null
      mediaRecorderRef.current.stop()
      // Detener todos los tracks del stream
      mediaRecorderRef.current.stream?.getTracks().forEach(track => track.stop())
      setIsRecording(false)
      audioChunksRef.current = []
    }
  }

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true)
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'audio.webm')

      const response = await fetch('/api/tonny-ai/transcribe', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.text) {
        // Enviar directamente el mensaje transcrito
        sendMessage(data.text)
      } else {
        throw new Error('No se pudo transcribir el audio')
      }
    } catch (error) {
      console.error('Error transcribiendo:', error)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '❌ No pude entender el audio. Intenta de nuevo o escribe tu mensaje.',
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsTranscribing(false)
    }
  }

  const clearChat = () => {
    const resetMessage: Message = {
      role: 'assistant',
      content: '🔄 Chat reiniciado. ¿Que necesitas?',
      timestamp: new Date(),
    }
    setMessages([resetMessage])
    // Limpiar localStorage
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Error clearing chat history:', error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <MainLayout title="TonnyAI" subtitle="Tu asistente de gestion">
      <div className="h-[calc(100vh-180px)] sm:h-[calc(100vh-160px)] flex flex-col lg:flex-row gap-4">
        {/* Sidebar - Hidden on mobile */}
        <div className="hidden lg:block lg:w-80 flex-shrink-0">
          <Card className="h-full overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border bg-gradient-to-r from-primary/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-green-600 flex items-center justify-center shadow-lg">
                  <Bot size={28} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">TonnyAI</h3>
                  <p className="text-xs text-muted-foreground">Tu asistente inteligente</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {/* Tabs de secciones */}
              <div className="flex gap-1 mb-4 p-1 bg-muted rounded-lg">
                <button
                  onClick={() => setActiveSection('inventory')}
                  className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all ${
                    activeSection === 'inventory'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  📦 Inventario
                </button>
                <button
                  onClick={() => setActiveSection('finance')}
                  className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all ${
                    activeSection === 'finance'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  💰 Finanzas
                </button>
                <button
                  onClick={() => setActiveSection('deliveries')}
                  className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all ${
                    activeSection === 'deliveries'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  🚚 Entregas
                </button>
              </div>

              {/* Acciones de inventario */}
              {activeSection === 'inventory' && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Consultas rapidas</p>
                  {quickActionsInventory.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => sendMessage(action.prompt)}
                      disabled={isLoading || isRecording}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-primary/5 hover:border-primary/30 transition-all text-left disabled:opacity-50"
                    >
                      <action.icon size={18} className="text-primary flex-shrink-0" />
                      <span className="text-sm text-foreground">{action.label}</span>
                    </button>
                  ))}

                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mt-4 mb-2">Ejemplos de voz</p>
                  <div className="space-y-1.5 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    <p className="flex items-center gap-2"><PlusCircle size={14} className="text-green-500" /> "Agrega 10 bolsas de cemento"</p>
                    <p className="flex items-center gap-2"><MinusCircle size={14} className="text-orange-500" /> "Saca 3 taladros para David"</p>
                    <p className="flex items-center gap-2"><Package size={14} className="text-blue-500" /> "Cuanto hay de pintura?"</p>
                  </div>
                </div>
              )}

              {/* Acciones de finanzas */}
              {activeSection === 'finance' && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Consultas rapidas</p>
                  {quickActionsFinance.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => sendMessage(action.prompt)}
                      disabled={isLoading || isRecording}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-primary/5 hover:border-primary/30 transition-all text-left disabled:opacity-50"
                    >
                      <action.icon size={18} className="text-primary flex-shrink-0" />
                      <span className="text-sm text-foreground">{action.label}</span>
                    </button>
                  ))}

                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mt-4 mb-2">Ejemplos de voz</p>
                  <div className="space-y-1.5 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    <p className="flex items-center gap-2"><DollarSign size={14} className="text-green-500" /> "Registra compra de $5,000 en Home Depot"</p>
                    <p className="flex items-center gap-2"><FileText size={14} className="text-blue-500" /> "Nueva cotizacion de Truper por $3,000"</p>
                    <p className="flex items-center gap-2"><BarChart3 size={14} className="text-purple-500" /> "Cuanto gastamos en enero?"</p>
                  </div>
                </div>
              )}

              {/* Acciones de entregas */}
              {activeSection === 'deliveries' && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Ver entregas por responsable</p>
                  {quickActionsDeliveries.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => sendMessage(action.prompt)}
                      disabled={isLoading || isRecording}
                      className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-primary/5 hover:border-primary/30 transition-all text-left disabled:opacity-50"
                    >
                      <action.icon size={18} className="text-primary flex-shrink-0" />
                      <span className="text-sm text-foreground">{action.label}</span>
                    </button>
                  ))}

                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mt-4 mb-2">Ejemplos de voz</p>
                  <div className="space-y-1.5 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    <p className="flex items-center gap-2"><MinusCircle size={14} className="text-orange-500" /> "Dame 5 tubos a Jordi"</p>
                    <p className="flex items-center gap-2"><MinusCircle size={14} className="text-orange-500" /> "Entrega 2 taladros a Gustavo"</p>
                    <p className="flex items-center gap-2"><Users size={14} className="text-blue-500" /> "Que le hemos dado a David?"</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border">
              <button
                onClick={clearChat}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg border border-border hover:bg-red-50 dark:hover:bg-red-900/30 hover:border-red-200 dark:hover:border-red-800 hover:text-red-600 dark:hover:text-red-400 transition-all text-sm text-muted-foreground"
              >
                <Trash2 size={16} />
                Limpiar chat
              </button>
            </div>
          </Card>
        </div>

        {/* Chat Area */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 sm:px-6 py-3 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-primary" />
              <span className="text-sm font-medium text-foreground">Chat con TonnyAI</span>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs text-muted-foreground hidden sm:block">
                  {messages.length - 1} mensajes
                </span>
                {/* Mobile clear button */}
                <button
                  onClick={clearChat}
                  className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all"
                  title="Limpiar chat"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user'
                      ? 'bg-primary text-white'
                      : 'bg-gradient-to-br from-primary to-green-600 text-white'
                  }`}
                >
                  {message.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                </div>

                <div className={`flex-1 max-w-[85%] ${message.role === 'user' ? 'text-right' : ''}`}>
                  <div
                    className={`inline-block rounded-2xl px-4 py-2.5 ${
                      message.role === 'user'
                        ? 'bg-primary text-white rounded-tr-sm'
                        : 'bg-muted text-foreground rounded-tl-sm'
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 px-1">
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}

            {(isLoading || isTranscribing) && (
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-green-600 flex items-center justify-center flex-shrink-0">
                  <Bot size={18} className="text-white" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    <span className="text-xs text-muted-foreground ml-2">
                      {isTranscribing ? 'Escuchando...' : 'Procesando...'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Mobile Quick Actions */}
          <div className="lg:hidden flex gap-2 px-4 py-2 overflow-x-auto border-t border-border bg-muted/20 scrollbar-hide">
            <button
              onClick={() => sendMessage('Dame un resumen del inventario')}
              disabled={isLoading || isRecording}
              className="flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all disabled:opacity-50"
            >
              📦 Inventario
            </button>
            <button
              onClick={() => sendMessage('Que productos tienen stock bajo?')}
              disabled={isLoading || isRecording}
              className="flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 transition-all disabled:opacity-50"
            >
              ⚠️ Stock bajo
            </button>
            <button
              onClick={() => sendMessage('Dame un resumen de finanzas')}
              disabled={isLoading || isRecording}
              className="flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-full bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-all disabled:opacity-50"
            >
              💰 Finanzas
            </button>
            <button
              onClick={() => sendMessage('Muestrame las ultimas entregas')}
              disabled={isLoading || isRecording}
              className="flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all disabled:opacity-50"
            >
              🚚 Entregas
            </button>
          </div>

          {/* Input Area */}
          <div className="p-3 sm:p-4 border-t border-border bg-muted/30 pb-[env(safe-area-inset-bottom)]">
            {isRecording ? (
              /* Recording Mode UI */
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 p-3 bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-800 rounded-xl">
                  <div className="w-4 h-4 bg-red-600 rounded-full animate-pulse" />
                  <span className="text-base text-red-700 dark:text-red-400 font-semibold">Grabando audio...</span>
                </div>
                <div className="flex items-center gap-3">
                  {/* Cancel Button */}
                  <button
                    onClick={cancelRecording}
                    className="flex-1 h-14 rounded-xl flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold transition-all"
                  >
                    <X size={24} />
                    <span>Cancelar</span>
                  </button>
                  {/* Send Recording Button */}
                  <button
                    onClick={stopRecording}
                    className="flex-1 h-14 rounded-xl flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold transition-all shadow-lg"
                  >
                    <Send size={24} />
                    <span>Enviar audio</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Normal Input Mode */
              <div className="flex items-center gap-2">
                {/* Voice Button */}
                <button
                  onClick={startRecording}
                  disabled={isLoading || isTranscribing}
                  className="h-12 w-12 flex-shrink-0 rounded-xl flex items-center justify-center transition-all shadow-sm bg-card border border-border hover:border-primary hover:bg-primary/5 text-gray-600 dark:text-gray-400 hover:text-primary disabled:opacity-50"
                  title="Grabar mensaje de voz"
                >
                  <Mic size={20} />
                </button>

                {/* Text Input */}
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe o habla..."
                  className="flex-1 h-12 px-4 bg-card text-foreground rounded-xl border border-border outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  disabled={isLoading || isTranscribing}
                />

                {/* Send Button */}
                <Button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isLoading}
                  className="h-12 w-12 flex-shrink-0 p-0"
                >
                  <Send size={20} />
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </MainLayout>
  )
}
