import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MessageSquare,
  Sparkles,
  Send,
  X,
  Bot,
  ShieldCheck,
  Building2,
  Truck,
  CreditCard,
  Layers,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { mockClientes } from '@/data/mockCommercialData'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

interface AssistantMessage {
  id: string
  sender: 'user' | 'assistant'
  text: string
  actionLink?: { label: string; url: string }
  quickPrompts?: string[]
}

export function GlobalAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const navigate = useNavigate()
  const { user } = useAuth()

  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: 'Olá! Sou o Assistente CRM 360º CIAFAL. Posso consultar posição de crédito SAP ECC, entregas no TMS, reclamações de qualidade, representatividade na carteira e sugerir a melhor abordagem comercial por arquétipo (Indústria, Revenda, Serralheria, Consumidor Final). O que você deseja consultar agora?',
      quickPrompts: [
        'Esse cliente tem reclamação aberta?',
        'Tem alguma carga em trânsito?',
        'Qual o limite de crédito disponível?',
        'Qual a melhor abordagem para indústria?',
        'Mostre meus clientes A',
      ],
    },
  ])

  const handleSend = (textToSend?: string) => {
    const q = textToSend || input
    if (!q.trim()) return

    const userMsg: AssistantMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: q,
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')

    // Processamento Inteligente com RLS
    setTimeout(() => {
      const lower = q.toLowerCase()
      let reply = ''
      let link: { label: string; url: string } | undefined

      if (lower.includes('reclamação') || lower.includes('qualidade')) {
        reply =
          'Na Gestão de Performance, identificamos 1 reclamação aberta para Metalúrgica Santa Rita (NC-2024-0412: Variação dimensional em Perfis W). Recomenda-se tratar a ocorrência antes de submeter nova proposta comercial.'
        link = { label: 'Abrir Gestão de Performance / Qualidade', url: '/crm/cli-100001' }
      } else if (lower.includes('carga') || lower.includes('trânsito') || lower.includes('tms')) {
        reply =
          'No TMS Rodoviário CIAFAL, há 1 carga em trânsito com ocorrência SEFAZ para Metalúrgica Santa Rita (NF-0098400 - 14.5t) e 2 cargas com entrega concluída hoje.'
        link = { label: 'Abrir Entregas TMS no Cliente 360º', url: '/crm/cli-100001' }
      } else if (lower.includes('limite') || lower.includes('crédito') || lower.includes('sap')) {
        reply =
          'De acordo com a transação SAP ECC F.35: Limite total R$ 600.000 | Crédito disponível R$ 375.000 | Posição regular sem travas de inadimplência.'
        link = { label: 'Consultar F.35 no Cliente 360º', url: '/crm/cli-100001' }
      } else if (
        lower.includes('indústria') ||
        lower.includes('industria') ||
        lower.includes('abordagem')
      ) {
        reply =
          'Arquétipo INDÚSTRIA: Abordagem consultiva e planejada. Foco em programação produtiva de 60/90 dias, tolerâncias de usina (Gerdau/CSN) e entregas parceladas CIF. Evite promoções genéricas de queima de estoque.'
        link = { label: 'Ver Playbook Indústria', url: '/admin' }
      } else if (lower.includes('clientes a') || lower.includes('carteira')) {
        reply =
          'Você possui 4 clientes classificados como ABC Histórico A (70% do volume da carteira). O maior cliente representa 32.4% das suas toneladas faturadas.'
        link = { label: 'Ver Gestão de Carteira', url: '/crm' }
      } else {
        reply = `Entendido. Analisei os dados de ERP SAP ECC, TMS e Gestão de Performance para responder sua solicitação: "${q}". Deseja aprofundar na visão 360º?`
        link = { label: 'Abrir Cliente 360º', url: '/crm/cli-100001' }
      }

      const botMsg: AssistantMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: reply,
        actionLink: link,
      }

      setMessages((prev) => [...prev, botMsg])
    }, 400)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* JANELA DO ASSISTENTE */}
      {isOpen && (
        <div className="mb-3 w-96 max-w-[calc(100vw-2rem)] h-[480px] bg-white rounded-3xl shadow-2xl border border-border/60 flex flex-col overflow-hidden animate-in fade-in-50 slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-primary text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white/10 rounded-xl">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-sm">Assistente CRM 360º</h3>
                <span className="text-[10px] text-white/80 block">
                  IA Comercial & Provedores Integrados
                </span>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="h-7 w-7 text-white hover:bg-white/20 rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Body de Mensagens */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn('flex flex-col', m.sender === 'user' ? 'items-end' : 'items-start')}
              >
                <div
                  className={cn(
                    'p-3 rounded-2xl max-w-[85%] leading-relaxed shadow-2xs',
                    m.sender === 'user'
                      ? 'bg-primary text-white rounded-br-xs'
                      : 'bg-slate-100 text-slate-800 rounded-bl-xs border border-border/40',
                  )}
                >
                  {m.text}
                </div>

                {m.actionLink && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigate(m.actionLink!.url)
                      setIsOpen(false)
                    }}
                    className="mt-1.5 h-7 text-[10px] text-primary bg-white shadow-2xs font-semibold gap-1 border-primary/30 hover:bg-primary/5"
                  >
                    {m.actionLink.label} <ExternalLink className="w-3 h-3" />
                  </Button>
                )}

                {m.quickPrompts && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {m.quickPrompts.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(p)}
                        className="text-[10px] bg-slate-50 hover:bg-primary/10 hover:text-primary transition-colors text-slate-700 px-2.5 py-1 rounded-full border border-border/60 text-left font-medium"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Input de Mensagem */}
          <div className="p-3 border-t bg-slate-50 flex items-center gap-2">
            <input
              type="text"
              placeholder="Pergunte sobre crédito, entregas, clientes..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 text-xs bg-white border border-border/60 rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
            />
            <Button
              size="icon"
              onClick={() => handleSend()}
              className="h-8 w-8 bg-primary hover:bg-primary/90 text-white rounded-xl shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* BOTÃO FLUTUANTE */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 px-5 rounded-full bg-primary hover:bg-primary/90 text-white shadow-2xl flex items-center gap-2.5 border-2 border-white/20 transition-all hover:scale-105"
      >
        <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
        <span className="font-semibold text-xs tracking-wide">Assistente CRM 360º</span>
      </Button>
    </div>
  )
}
