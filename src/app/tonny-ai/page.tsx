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
  Truck,
  ShoppingCart,
  Receipt,
  Boxes,
  ArrowRightLeft,
  Upload,
  Image,
  Loader2,
} from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

type AIMode = 'inventory' | 'finance' | 'deliveries'

interface ModeConfig {
  id: AIMode
  name: string
  emoji: string
  color: string
  bgColor: string
  borderColor: string
  description: string
  welcomeMessage: string
  quickActions: { label: string; prompt: string; icon: React.ElementType }[]
  examples: { text: string; icon: React.ElementType; color: string }[]
}

const modeConfigs: Record<AIMode, ModeConfig> = {
  inventory: {
    id: 'inventory',
    name: 'Inventario',
    emoji: '📦',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    description: 'Gestiona productos, stock y movimientos',
    welcomeMessage: '¡Hola! Estoy en modo Inventario 📦\n\n' +
      'Puedo ayudarte a:\n' +
      '- Agregar y editar productos\n' +
      '- Registrar entradas y salidas de stock\n' +
      '- Consultar niveles de inventario\n' +
      '- Ver productos con stock bajo\n' +
      '- Registrar movimientos\n\n' +
      'Ejemplo: "Agrega 30 paneles de vinilo, cada uno tiene 12 pies"',
    quickActions: [
      { label: 'Resumen inventario', prompt: 'Dame un resumen completo del inventario', icon: Package },
      { label: 'Stock bajo', prompt: 'Que productos tienen stock bajo? Muestra todos', icon: TrendingDown },
      { label: 'Movimientos recientes', prompt: 'Muestrame los ultimos 15 movimientos de stock', icon: ClipboardList },
      { label: 'Por categoria', prompt: 'Cuantos productos hay por cada categoria?', icon: Boxes },
    ],
    examples: [
      { text: '"Agrega 20 galones de pintura Bear"', icon: PlusCircle, color: 'text-green-500' },
      { text: '"Quita 5 tubos del inventario"', icon: MinusCircle, color: 'text-orange-500' },
      { text: '"Cuanta pintura blanca hay?"', icon: Package, color: 'text-blue-500' },
      { text: '"Actualiza el precio del cemento a $150"', icon: ArrowRightLeft, color: 'text-purple-500' },
    ],
  },
  finance: {
    id: 'finance',
    name: 'Finanzas',
    emoji: '💰',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    description: 'Compras, cotizaciones y facturas',
    welcomeMessage: '¡Hola! Estoy en modo Finanzas 💰\n\n' +
      'Puedo ayudarte a:\n' +
      '- 📎 Subir facturas (PDF o fotos) - usa el botón ⬆️\n' +
      '- Registrar y consultar compras\n' +
      '- Manejar cotizaciones\n' +
      '- Ver resumen de gastos\n' +
      '- Analizar compras por mes/proveedor\n\n' +
      '💡 Tip: Sube una foto de tu factura y extraeré los datos automáticamente.\n\n' +
      'Ejemplo: "Registra compra de $5,000 en Home Depot, materiales de plomeria"',
    quickActions: [
      { label: 'Resumen finanzas', prompt: 'Dame un resumen completo de finanzas: compras, cotizaciones y gastos', icon: BarChart3 },
      { label: 'Compras del mes', prompt: 'Cuanto hemos gastado este mes? Muestra el desglose por proveedor', icon: ShoppingCart },
      { label: 'Cotizaciones pendientes', prompt: 'Que cotizaciones tenemos pendientes? Muestra todas', icon: FileText },
      { label: 'Ultimas compras', prompt: 'Muestrame las ultimas 10 compras registradas', icon: Receipt },
    ],
    examples: [
      { text: '📎 Sube una factura con el botón ⬆️', icon: Upload, color: 'text-amber-500' },
      { text: '"Registra compra de $3,500 en Truper"', icon: ShoppingCart, color: 'text-green-500' },
      { text: '"Nueva cotizacion de $8,000 de CEMEX"', icon: FileText, color: 'text-blue-500' },
      { text: '"Cuanto gastamos en enero?"', icon: DollarSign, color: 'text-purple-500' },
    ],
  },
  deliveries: {
    id: 'deliveries',
    name: 'Entregas',
    emoji: '🚚',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    description: 'Entregas a Jordi, Gustavo, David, Taurus',
    welcomeMessage: '¡Hola! Estoy en modo Entregas 🚚\n\n' +
      'Puedo ayudarte a:\n' +
      '- Ver entregas por responsable\n' +
      '- Registrar nuevas entregas\n' +
      '- Modificar o añadir notas a entregas\n' +
      '- Ver historial de entregas\n\n' +
      'Responsables: Jordi, Gustavo, David, Taurus\n\n' +
      'Ejemplo: "Dame 5 tubos de cobre a Jordi"',
    quickActions: [
      { label: 'Entregas a Jordi', prompt: 'Muestrame todas las entregas a Jordi de este mes', icon: Users },
      { label: 'Entregas a Gustavo', prompt: 'Muestrame todas las entregas a Gustavo de este mes', icon: Users },
      { label: 'Entregas a David', prompt: 'Muestrame todas las entregas a David de este mes', icon: Users },
      { label: 'Entregas a Taurus', prompt: 'Muestrame todas las entregas a Taurus de este mes', icon: Users },
    ],
    examples: [
      { text: '"Entrega 3 taladros a Gustavo"', icon: Truck, color: 'text-blue-500' },
      { text: '"Que le dimos a David esta semana?"', icon: Users, color: 'text-purple-500' },
      { text: '"Añade nota: material urgente"', icon: FileText, color: 'text-amber-500' },
      { text: '"Dame 10 bolsas de cemento a Jordi"', icon: MinusCircle, color: 'text-orange-500' },
    ],
  },
}

const STORAGE_KEY_PREFIX = 'tonny-ai-chat-'
const MODE_STORAGE_KEY = 'tonny-ai-current-mode'

export default function TonnyAIPage() {
  const [currentMode, setCurrentMode] = useState<AIMode>('inventory')
  const [conversations, setConversations] = useState<Record<AIMode, Message[]>>({
    inventory: [],
    finance: [],
    deliveries: [],
  })
  const [isHydrated, setIsHydrated] = useState(false)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isUploadingFile, setIsUploadingFile] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const currentConfig = modeConfigs[currentMode]
  const messages = conversations[currentMode]

  const getWelcomeMessage = (mode: AIMode): Message => ({
    role: 'assistant',
    content: modeConfigs[mode].welcomeMessage,
    timestamp: new Date(),
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Cargar conversaciones de localStorage
  useEffect(() => {
    try {
      // Cargar modo actual
      const savedMode = localStorage.getItem(MODE_STORAGE_KEY) as AIMode | null
      if (savedMode && modeConfigs[savedMode]) {
        setCurrentMode(savedMode)
      }

      // Cargar conversaciones de cada modo
      const loadedConversations: Record<AIMode, Message[]> = {
        inventory: [],
        finance: [],
        deliveries: [],
      }

      Object.keys(modeConfigs).forEach((mode) => {
        const saved = localStorage.getItem(STORAGE_KEY_PREFIX + mode)
        if (saved) {
          const parsed = JSON.parse(saved)
          const messagesWithDates = parsed.map((m: Message & { timestamp: string }) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }))
          loadedConversations[mode as AIMode] = messagesWithDates.length > 0 ? messagesWithDates : [getWelcomeMessage(mode as AIMode)]
        } else {
          loadedConversations[mode as AIMode] = [getWelcomeMessage(mode as AIMode)]
        }
      })

      setConversations(loadedConversations)
    } catch (error) {
      console.error('Error loading chat history:', error)
      // Inicializar con mensajes de bienvenida
      setConversations({
        inventory: [getWelcomeMessage('inventory')],
        finance: [getWelcomeMessage('finance')],
        deliveries: [getWelcomeMessage('deliveries')],
      })
    }
    setIsHydrated(true)
  }, [])

  // Guardar conversación actual cuando cambie
  useEffect(() => {
    if (isHydrated && messages.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY_PREFIX + currentMode, JSON.stringify(messages))
      } catch (error) {
        console.error('Error saving chat history:', error)
      }
    }
  }, [messages, isHydrated, currentMode])

  // Guardar modo actual
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(MODE_STORAGE_KEY, currentMode)
    }
  }, [currentMode, isHydrated])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [currentMode])

  const setMessages = (updater: (prev: Message[]) => Message[]) => {
    setConversations(prev => ({
      ...prev,
      [currentMode]: updater(prev[currentMode])
    }))
  }

  const switchMode = (newMode: AIMode) => {
    if (newMode !== currentMode) {
      setCurrentMode(newMode)
      setInput('')
    }
  }

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
          mode: currentMode,
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
  }, [input, isLoading, messages, currentMode])

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
      mediaRecorderRef.current.onstop = null
      mediaRecorderRef.current.stop()
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
    const resetMessage = getWelcomeMessage(currentMode)
    setMessages(() => [resetMessage])
    try {
      localStorage.removeItem(STORAGE_KEY_PREFIX + currentMode)
    } catch (error) {
      console.error('Error clearing chat history:', error)
    }
  }

  // Función para subir archivos (facturas PDF/imágenes)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Resetear input para permitir subir el mismo archivo
    e.target.value = ''

    // Verificar tipo de archivo
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic']
    if (!validTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.pdf')) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '❌ Solo puedo procesar archivos PDF o imágenes (JPG, PNG, WebP).',
          timestamp: new Date(),
        },
      ])
      return
    }

    // Agregar mensaje del usuario
    const userMessage: Message = {
      role: 'user',
      content: `📎 Subiendo factura: ${file.name}`,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setIsUploadingFile(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/invoices', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al subir archivo')
      }

      // Construir mensaje de respuesta
      let responseContent = '✅ **Factura procesada correctamente**\n\n'

      if (data.extractedData) {
        const ed = data.extractedData
        responseContent += `📊 **Datos extraídos:**\n`
        responseContent += `- **Categoría:** ${ed.category || 'No detectada'}\n`
        responseContent += `- **Proveedor:** ${ed.supplier || 'No detectado'}\n`
        responseContent += `- **No. Factura:** ${ed.invoice_number || 'No detectado'}\n`
        responseContent += `- **Fecha:** ${ed.invoice_date || 'No detectada'}\n`
        responseContent += `- **Subtotal:** ${ed.subtotal ? `$${ed.subtotal.toLocaleString()}` : 'No detectado'}\n`
        responseContent += `- **IVA:** ${ed.tax ? `$${ed.tax.toLocaleString()}` : 'No detectado'}\n`
        responseContent += `- **Total:** ${ed.total ? `$${ed.total.toLocaleString()} ${ed.currency}` : 'No detectado'}\n`

        if (ed.items && ed.items.length > 0) {
          responseContent += `- **Items:** ${ed.items.length} productos\n`
        }
      }

      if (data.purchase) {
        responseContent += `\n🛒 **Compra registrada** con ID: ${data.purchase.id.slice(0, 8)}...\n`
        responseContent += `Puedes verla en Finanzas > Registro de Compras`
      } else if (data.invoice) {
        responseContent += `\n📄 **Factura guardada** (categoría: ${data.extractedData?.category || 'finanzas'})`
      }

      if (data.file) {
        responseContent += `\n\n🔗 [Ver archivo](${data.file})`
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: responseContent,
          timestamp: new Date(),
        },
      ])
    } catch (error) {
      console.error('Error uploading file:', error)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `❌ Error al procesar la factura: ${error instanceof Error ? error.message : 'Error desconocido'}`,
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsUploadingFile(false)
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
            {/* Header con avatar y modo */}
            <div className={`p-4 border-b border-border bg-gradient-to-r ${currentConfig.bgColor} to-transparent`}>
              <div className="flex items-center gap-3">
                <div className={`w-14 h-14 rounded-2xl ${currentConfig.bgColor} ${currentConfig.borderColor} border-2 flex items-center justify-center shadow-lg`}>
                  <span className="text-2xl">{currentConfig.emoji}</span>
                </div>
                <div>
                  <h3 className="font-bold text-foreground flex items-center gap-2">
                    TonnyAI
                    <span className={`text-xs px-2 py-0.5 rounded-full ${currentConfig.bgColor} ${currentConfig.color}`}>
                      {currentConfig.name}
                    </span>
                  </h3>
                  <p className="text-xs text-muted-foreground">{currentConfig.description}</p>
                </div>
              </div>
            </div>

            {/* Mode Selector */}
            <div className="p-3 border-b border-border">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Modo de trabajo</p>
              <div className="grid grid-cols-3 gap-1.5">
                {Object.values(modeConfigs).map((config) => (
                  <button
                    key={config.id}
                    onClick={() => switchMode(config.id)}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all ${
                      currentMode === config.id
                        ? `${config.bgColor} ${config.borderColor} border-2 shadow-sm`
                        : 'border-2 border-transparent hover:bg-muted/50'
                    }`}
                  >
                    <span className="text-xl">{config.emoji}</span>
                    <span className={`text-[10px] font-medium ${
                      currentMode === config.id ? config.color : 'text-muted-foreground'
                    }`}>
                      {config.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {/* Acciones rapidas */}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Consultas rapidas</p>
                {currentConfig.quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => sendMessage(action.prompt)}
                    disabled={isLoading || isRecording}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left disabled:opacity-50
                      hover:${currentConfig.bgColor} hover:${currentConfig.borderColor}
                      border-border hover:border-current`}
                  >
                    <div className={`w-8 h-8 rounded-lg ${currentConfig.bgColor} flex items-center justify-center`}>
                      <action.icon size={16} className={currentConfig.color} />
                    </div>
                    <span className="text-sm text-foreground font-medium">{action.label}</span>
                  </button>
                ))}
              </div>

              {/* Ejemplos */}
              <div className="mt-6">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Ejemplos</p>
                <div className="space-y-2 bg-muted/30 p-3 rounded-xl border border-border">
                  {currentConfig.examples.map((example, index) => (
                    <p key={index} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <example.icon size={14} className={`${example.color} flex-shrink-0 mt-0.5`} />
                      <span>{example.text}</span>
                    </p>
                  ))}
                </div>
              </div>
            </div>

            {/* Clear button */}
            <div className="p-4 border-t border-border">
              <button
                onClick={clearChat}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-border hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-800 hover:text-red-600 dark:hover:text-red-400 transition-all text-sm text-muted-foreground"
              >
                <Trash2 size={16} />
                Limpiar chat de {currentConfig.name}
              </button>
            </div>
          </Card>
        </div>

        {/* Chat Area */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className={`px-4 sm:px-6 py-3 border-b border-border bg-gradient-to-r ${currentConfig.bgColor} to-transparent`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${currentConfig.bgColor} ${currentConfig.borderColor} border flex items-center justify-center`}>
                <span className="text-lg">{currentConfig.emoji}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">TonnyAI</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${currentConfig.bgColor} ${currentConfig.color} font-medium`}>
                    {currentConfig.name}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground">{messages.length - 1} mensajes</p>
              </div>

              {/* Mobile mode switcher */}
              <div className="flex lg:hidden items-center gap-1 bg-muted/50 rounded-lg p-1">
                {Object.values(modeConfigs).map((config) => (
                  <button
                    key={config.id}
                    onClick={() => switchMode(config.id)}
                    className={`p-2 rounded-md transition-all ${
                      currentMode === config.id
                        ? `${config.bgColor} shadow-sm`
                        : 'hover:bg-muted'
                    }`}
                    title={config.name}
                  >
                    <span className="text-sm">{config.emoji}</span>
                  </button>
                ))}
              </div>

              {/* Clear button mobile */}
              <button
                onClick={clearChat}
                className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all"
                title="Limpiar chat"
              >
                <Trash2 size={16} />
              </button>
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
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user'
                      ? 'bg-primary text-white'
                      : `${currentConfig.bgColor} ${currentConfig.borderColor} border`
                  }`}
                >
                  {message.role === 'user' ? (
                    <User size={18} />
                  ) : (
                    <span className="text-base">{currentConfig.emoji}</span>
                  )}
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
                <div className={`w-9 h-9 rounded-xl ${currentConfig.bgColor} ${currentConfig.borderColor} border flex items-center justify-center flex-shrink-0`}>
                  <span className="text-base">{currentConfig.emoji}</span>
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
            {currentConfig.quickActions.slice(0, 4).map((action, index) => (
              <button
                key={index}
                onClick={() => sendMessage(action.prompt)}
                disabled={isLoading || isRecording}
                className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-full ${currentConfig.bgColor} ${currentConfig.color} ${currentConfig.borderColor} border transition-all disabled:opacity-50`}
              >
                {currentConfig.emoji} {action.label}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div className={`p-3 sm:p-4 border-t ${currentConfig.borderColor} ${currentConfig.bgColor} pb-[env(safe-area-inset-bottom)]`}>
            {isRecording ? (
              /* Recording Mode UI */
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 p-3 bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-800 rounded-xl">
                  <div className="w-4 h-4 bg-red-600 rounded-full animate-pulse" />
                  <span className="text-base text-red-700 dark:text-red-400 font-semibold">Grabando audio...</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={cancelRecording}
                    className="flex-1 h-14 rounded-xl flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold transition-all"
                  >
                    <X size={24} />
                    <span>Cancelar</span>
                  </button>
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
                  disabled={isLoading || isTranscribing || isUploadingFile}
                  className={`h-12 w-12 flex-shrink-0 rounded-xl flex items-center justify-center transition-all shadow-sm bg-card border hover:${currentConfig.borderColor} ${currentConfig.borderColor.replace('border-', 'hover:text-').replace('/30', '')} disabled:opacity-50`}
                  title="Grabar mensaje de voz"
                >
                  <Mic size={20} />
                </button>

                {/* File Upload Button */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading || isTranscribing || isUploadingFile}
                  className={`h-12 w-12 flex-shrink-0 rounded-xl flex items-center justify-center transition-all shadow-sm bg-card border hover:border-amber-500/50 hover:text-amber-500 disabled:opacity-50 ${isUploadingFile ? 'animate-pulse bg-amber-50 dark:bg-amber-900/20' : ''}`}
                  title="Subir factura (PDF o imagen)"
                >
                  {isUploadingFile ? (
                    <Loader2 size={20} className="animate-spin text-amber-500" />
                  ) : (
                    <Upload size={20} />
                  )}
                </button>

                {/* Text Input */}
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Pregunta sobre ${currentConfig.name.toLowerCase()}...`}
                  className={`flex-1 h-12 px-4 bg-card text-foreground rounded-xl border outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500`}
                  disabled={isLoading || isTranscribing || isUploadingFile}
                />

                {/* Send Button */}
                <Button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isLoading || isUploadingFile}
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
