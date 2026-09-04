import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Truck,
  Bot,
  Send,
  AlertTriangle,
  Clock,
  MapPin,
  FileText,
  User,
  Phone,
  ShieldCheck,
  ExternalLink,
  Calendar,
  ArrowLeft,
  CheckCircle2,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'
import { fredTmsService } from '@/services/fred_tms_service'

interface ChatMessage {
  id: string
  sender: 'fred' | 'user'
  text: string
  timestamp: string
  suggestedAction?: {
    label: string
    action: () => void
  }
}

export default function AgenteFredPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const transportNumber = searchParams.get('transporte') || 'TMS-CARGA-9912'
  const orderNumber = searchParams.get('pedido') || 'PED-2024-8800'
  const customerSapCode = searchParams.get('sap') || '100001'
  const customerName = searchParams.get('cliente') || 'AÇOCON ESTRUTURAS METÁLICAS S/A'
  const carrierName = searchParams.get('transportadora') || 'TransAço Logística Rodoviária Ltda'
  const vehiclePlate = searchParams.get('placa') || 'ABC-7000'
  const destination = searchParams.get('destino') || 'Contagem/MG'

  const [inputMessage, setInputMessage] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])

  useEffect(() => {
    fredTmsService.logFredInteraction('OPEN_FRED_SESSION', {
      transportNumber,
      orderNumber,
      customerSapCode,
      customerName,
      carrierName,
      vehiclePlate,
    })

    // Mensagem inicial contextualizada
    setMessages([
      {
        id: 'msg-1',
        sender: 'fred',
        text: `Olá! Sou o **Fred**, o agente logístico do TMS CIAFAL. Estou acompanhando o transporte **${transportNumber}** referente ao pedido **${orderNumber}** para o cliente **${customerName}**.\n\n📍 **Status Atual:** Carga retida temporariamente no posto fiscal SEFAZ MG (BR-381 km 488) para verificação documental.\n⏱️ **Novo ETA Previsto:** Hoje 17:30 (+3h30m de impacto)\n🚚 **Motorista:** Marcos Silveira (${vehiclePlate}) · TransAço`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedAction: {
          label: '📅 Agendar alinhamento de descarga na Agenda Corporativa',
          action: () => {
            toast.success(
              'Compromisso de alinhamento logístico criado na Agenda Corporativa do HUB!',
            )
            navigate('/crm360/home')
          },
        },
      },
    ])
  }, [
    transportNumber,
    orderNumber,
    customerSapCode,
    customerName,
    carrierName,
    vehiclePlate,
    navigate,
  ])

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return

    const userText = inputMessage
    const newMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, newMsg])
    setInputMessage('')

    setTimeout(() => {
      let reply = 'Estou monitorando o transporte via telemetria Omnilink e SEFAZ.'
      const lower = userText.toLowerCase()

      if (lower.includes('motorista') || lower.includes('telefone') || lower.includes('contato')) {
        reply = `O motorista responsável é **Marcos Silveira**, telefone **(31) 99872-1102**, carreta placa **ABC-7000**. Última checagem de telemetria ativa há 4 minutos.`
      } else if (
        lower.includes('chegada') ||
        lower.includes('eta') ||
        lower.includes('horário') ||
        lower.includes('prazo')
      ) {
        reply = `A estimativa atualizada de chegada no cliente em **${destination}** é hoje às **17:30**. O MDFe foi liberado pelo fiscal e o veículo acabou de retomar viagem.`
      } else if (lower.includes('oitf') || lower.includes('atraso')) {
        reply = `O impacto no OITF foi classificado com desvio primário na área **SEFAZ / Fiscal**. Essa evidência já foi anexada automaticamente ao relatório de OITF do pedido **${orderNumber}**.`
      } else {
        reply = `Recebido! Entrarei em contato com a transportadora **${carrierName}** para priorizar essa tratativa. Lembro que qualquer negociação comercial ou concessão deve ser feita diretamente por você (humano no loop).`
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `fred-${Date.now()}`,
          sender: 'fred',
          text: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    }, 600)
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4">
      {/* Topo / Voltar */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="gap-2 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao CRM
        </Button>
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 gap-1.5 font-mono text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            TMS Provider Online
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              toast.info('Abrindo visualização direta do transporte no Portal TMS...')
              window.open(`https://tms.ciafal.local/cargas/${transportNumber}`, '_blank')
            }}
            className="text-xs gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Abrir no TMS
          </Button>
        </div>
      </div>

      {/* Card Principal do Fred */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Painel de Contexto Logístico */}
        <Card className="border-slate-200 lg:col-span-1 shadow-sm bg-slate-50/70">
          <CardHeader className="pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-xl text-blue-700">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">
                  Contexto do Transporte
                </CardTitle>
                <p className="text-[11px] text-muted-foreground font-mono">{transportNumber}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                Cliente
              </span>
              <strong className="text-slate-900">{customerName}</strong>
              <span className="text-[11px] text-slate-500 block font-mono">
                SAP: {customerSapCode}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                Pedido SAP
              </span>
              <span className="font-mono font-bold text-blue-700">{orderNumber}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                Transportadora & Veículo
              </span>
              <p className="text-slate-800">{carrierName}</p>
              <p className="text-[11px] text-slate-600 font-mono">Placa: {vehiclePlate}</p>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">
                Destino
              </span>
              <p className="text-slate-800 font-medium">{destination}</p>
            </div>
            <div className="pt-2 border-t border-slate-200">
              <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-amber-800 font-semibold text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Alerta Ativo no TMS
                </div>
                <p className="text-[11px] text-amber-900 leading-tight">
                  Retenção fiscal SEFAZ MG. Fred sugere alinhar extensão de horário de recebimento
                  com o cliente.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chat com Fred */}
        <Card className="border-slate-200 lg:col-span-2 shadow-sm flex flex-col h-[560px]">
          <CardHeader className="pb-3 border-b border-slate-200 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    Fred — Agente TMS CIAFAL
                    <Badge className="bg-blue-100 text-blue-800 border-none text-[10px]">
                      Logística Oficial
                    </Badge>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Consumindo o serviço central do TMS (RLS/Governança ativa)
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>

          {/* Mensagens */}
          <CardContent className="p-4 flex-1 overflow-y-auto space-y-3 bg-slate-50/40">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs shadow-xs ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-xs'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                  {msg.suggestedAction && (
                    <div className="mt-3 pt-2 border-t border-slate-200">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={msg.suggestedAction.action}
                        className="text-[11px] h-7 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg w-full justify-start gap-1.5"
                      >
                        {msg.suggestedAction.label}
                      </Button>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1 font-mono">
                  {msg.timestamp}
                </span>
              </div>
            ))}
          </CardContent>

          {/* Input */}
          <div className="p-3 border-t border-slate-200 bg-white">
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Pergunte ao Fred sobre ETA, motorista, MDFe ou status de descarga..."
                className="text-xs h-9"
              />
              <Button
                onClick={handleSendMessage}
                size="sm"
                className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
