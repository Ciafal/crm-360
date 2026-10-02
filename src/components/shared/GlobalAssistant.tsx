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
import { predicaoRecompraService } from '@/services/predicao_recompra_service'

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
      text: 'Olá! Sou o Assistente CRM 360º CIAFAL. Posso consultar posição de crédito SAP ECC, entregas no TMS, reclamações de qualidade, localização no Mapa e scores probabilísticos do motor BG/NBD & Gamma-Gamma de Recorrência. O que você deseja consultar agora?',
      quickPrompts: [
        'Quem devo contatar hoje?',
        'Quais clientes têm maior risco de perda?',
        'Quem deve voltar a comprar nos próximos 30 dias?',
        'Qual receita provável da minha carteira nos próximos 90 dias?',
        'Qual tonelagem provável nos próximos 90 dias?',
        'Mostre clientes A próximos de Belo Horizonte',
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
      } else if (
        lower.includes('belo horizonte') ||
        (lower.includes('próximos') && lower.includes('bh'))
      ) {
        reply =
          'No polo de Belo Horizonte e Região Metropolitana, encontramos 4 clientes Classe A: Metalúrgica Santa Rita (185t), Estruturas Metálicas Triângulo (92t), Construtora Aliança (120t) e Indústria Mecânica União (65t). Volume somado: 462 toneladas.'
        link = { label: 'Abrir no Mapa da Carteira', url: '/crm?tab=mapa' }
      } else if (lower.includes('divinópolis') || lower.includes('divinopolis')) {
        reply =
          'Em Divinópolis / Região Centro-Oeste, identificamos Caldeiraria & Montagens Oeste (SAP 100008, ABC B, 48t) em janela imediata de recompra (previsão para os próximos 4 dias).'
        link = { label: 'Ver Cliente em Divinópolis no Mapa', url: '/crm?tab=mapa' }
      } else if (
        lower.includes('contagem') &&
        (lower.includes('amanhã') || lower.includes('visitar') || lower.includes('visita'))
      ) {
        reply =
          'Para sua visita em Contagem, a IA do Roteiro Comercial sugere aproveitar a proximidade geográfica para visitar também: 1) Metalúrgica Santa Rita (SAP 100001 - Janela de Recompra ativa) e 2) Aços & Caldeiraria Betim (a 12 min de distância, com cotação pendente de 22t).'
        link = { label: 'Planejar Roteiro de Visitas no Mapa', url: '/crm?tab=mapa' }
      } else if (
        lower.includes('centro-oeste') ||
        (lower.includes('inativos') && lower.includes('região'))
      ) {
        reply =
          'Na região Centro-Oeste / polo Divinópolis, identificamos 2 contas inativas com histórico A/B (potencial estimado em 75 toneladas/ano). Oportunidade para reatribuição territorial ou ação de reativação.'
        link = { label: 'Filtrar Inativos no Mapa', url: '/crm?tab=mapa' }
      } else if (
        lower.includes('mapa') ||
        lower.includes('região') ||
        lower.includes('roteiro') ||
        lower.includes('visita')
      ) {
        reply =
          'Território CIAFAL: No polo de Belo Horizonte e Contagem você possui 8 clientes (475.5t). Em Divinópolis há 1 cliente em janela imediata de recompra. Sugiro roteiro agrupando visitas em Contagem e Betim com prioridade para perfis e vigas.'
        link = { label: 'Abrir Mapa da Carteira', url: '/crm?tab=mapa' }
      } else if (lower.includes('inativo') || lower.includes('reativação')) {
        reply =
          'Camada de Inativos: 6 contas prioritárias identificadas em Minas Gerais com potencial de 240 toneladas. Disponível reatribuição territorial para representantes externos.'
        link = { label: 'Ver Inativos no Mapa', url: '/crm?tab=mapa' }
      } else if (
        lower.includes('quem devo contatar') ||
        lower.includes('contatar hoje') ||
        lower.includes('prioridade de contato')
      ) {
        // Consulta resultados estruturados do BG/NBD
        const predicoes = predicaoRecompraService.getPredicoesFiltradas(
          {
            empresa: 'TODAS',
            vendedor: 'TODOS',
            representante: 'TODOS',
            cliente: '',
            uf: 'TODOS',
            cidade: 'TODAS',
            setorIndustrial: 'TODOS',
            grupoMercadoria: 'TODOS',
            produto: '',
            periodo: '12M',
            classeRecorrencia: 'TODAS',
            segmentoRFM: 'TODOS',
            statusCliente: 'TODOS',
            riscoPerda: 'TODOS',
            situacaoCredito: 'TODOS',
            unitMode: 'BRL',
          },
          user?.role,
          user?.id,
        )
        const prioritarios = predicoes
          .filter(
            (p) =>
              p.quadranteMatriz === 'Recuperação prioritária' ||
              (p.pAlivePercent < 60 && p.horizontes.receitaEsperada90d >= 30000),
          )
          .slice(0, 3)

        if (prioritarios.length > 0) {
          const nomes = prioritarios
            .map(
              (p) =>
                `• ${p.razaoSocial} (SAP ${p.codigoSap}) - P(Alive): ${p.pAlivePercent}%, há ${p.diasSemComprar}d inativo, potencial: R$ ${p.horizontes.receitaEsperada90d.toLocaleString('pt-BR')}`,
            )
            .join('\n')
          reply = `Com base nas predições do motor BG/NBD, os 3 clientes prioritários para contato imediato são:\n\n${nomes}\n\nTodos possuem probabilidade de abandono com alto valor de recompra projetado.`
        } else {
          reply =
            'Não há clientes em risco crítico no momento. Toda a carteira prioritária está com cadência regular.'
        }
        link = { label: 'Ver Predição de Recompra (Aba 5)', url: '/crm/recorrencia' }
      } else if (
        lower.includes('risco de perda') ||
        lower.includes('maior risco') ||
        lower.includes('risco de churn')
      ) {
        const predicoes = predicaoRecompraService.getPredicoesFiltradas(
          {
            empresa: 'TODAS',
            vendedor: 'TODOS',
            representante: 'TODOS',
            cliente: '',
            uf: 'TODOS',
            cidade: 'TODAS',
            setorIndustrial: 'TODOS',
            grupoMercadoria: 'TODOS',
            produto: '',
            periodo: '12M',
            classeRecorrencia: 'TODAS',
            segmentoRFM: 'TODOS',
            statusCliente: 'TODOS',
            riscoPerda: 'TODOS',
            situacaoCredito: 'TODOS',
            unitMode: 'BRL',
          },
          user?.role,
          user?.id,
        )
        const emRisco = predicoes.filter((p) => p.pAlivePercent < 45).slice(0, 3)
        const lista = emRisco
          .map(
            (p) =>
              `• ${p.razaoSocial} (P(Alive) ${p.pAlivePercent}%, sem compra há ${p.diasSemComprar} dias, RFM: ${p.scoreRFM})`,
          )
          .join('\n')
        reply = `Identificamos ${emRisco.length} clientes com risco iminente de perda (P(Alive) < 45%):\n\n${lista}\n\nRecomenda-se acionar a Aba 5 e gerar oportunidade de retomada com os produtos que deixaram de comprar.`
        link = { label: 'Abrir Painel Preditivo', url: '/crm/recorrencia' }
      } else if (
        lower.includes('30 dias') ||
        lower.includes('voltar a comprar') ||
        lower.includes('próximos 30')
      ) {
        const predicoes = predicaoRecompraService.getPredicoesFiltradas(
          {
            empresa: 'TODAS',
            vendedor: 'TODOS',
            representante: 'TODOS',
            cliente: '',
            uf: 'TODOS',
            cidade: 'TODAS',
            setorIndustrial: 'TODOS',
            grupoMercadoria: 'TODOS',
            produto: '',
            periodo: '12M',
            classeRecorrencia: 'TODAS',
            segmentoRFM: 'TODOS',
            statusCliente: 'TODOS',
            riscoPerda: 'TODOS',
            situacaoCredito: 'TODOS',
            unitMode: 'BRL',
          },
          user?.role,
          user?.id,
        )
        const proximos = predicoes
          .filter((p) => p.horizontes.probabilidade30d >= 0.4)
          .sort((a, b) => b.horizontes.probabilidade30d - a.horizontes.probabilidade30d)
          .slice(0, 3)

        const lista = proximos
          .map(
            (p) =>
              `• ${p.razaoSocial} - Prob. 30d: ${Math.round(p.horizontes.probabilidade30d * 100)}% | Receita prevista: R$ ${p.horizontes.receitaEsperada30d.toLocaleString('pt-BR')} (${p.horizontes.tonelagemEsperada30d}t)`,
          )
          .join('\n')
        reply = `Clientes com maior probabilidade estatística de retorno nos próximos 30 dias (modelo BG/NBD):\n\n${lista}`
        link = { label: 'Ver Tabela Preditiva Completa', url: '/crm/recorrencia' }
      } else if (
        lower.includes('receita provável') ||
        lower.includes('receita provavel') ||
        (lower.includes('receita') && lower.includes('90'))
      ) {
        const predicoes = predicaoRecompraService.getPredicoesFiltradas(
          {
            empresa: 'TODAS',
            vendedor: 'TODOS',
            representante: 'TODOS',
            cliente: '',
            uf: 'TODOS',
            cidade: 'TODAS',
            setorIndustrial: 'TODOS',
            grupoMercadoria: 'TODOS',
            produto: '',
            periodo: '12M',
            classeRecorrencia: 'TODAS',
            segmentoRFM: 'TODOS',
            statusCliente: 'TODOS',
            riscoPerda: 'TODOS',
            situacaoCredito: 'TODOS',
            unitMode: 'BRL',
          },
          user?.role,
          user?.id,
        )
        const total = predicoes.reduce((acc, p) => acc + p.horizontes.receitaEsperada90d, 0)
        reply = `A projeção matemática para os próximos 90 dias (calibrada via BG/NBD e Gamma-Gamma MLE) aponta uma receita esperada de R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} na carteira avaliada.`
        link = { label: 'Ver Detalhamento na Aba 5', url: '/crm/recorrencia' }
      } else if (
        lower.includes('tonelagem provável') ||
        lower.includes('tonelagem provavel') ||
        (lower.includes('tonelagem') && lower.includes('90')) ||
        (lower.includes('volume') && lower.includes('90'))
      ) {
        const predicoes = predicaoRecompraService.getPredicoesFiltradas(
          {
            empresa: 'TODAS',
            vendedor: 'TODOS',
            representante: 'TODOS',
            cliente: '',
            uf: 'TODOS',
            cidade: 'TODAS',
            setorIndustrial: 'TODOS',
            grupoMercadoria: 'TODOS',
            produto: '',
            periodo: '12M',
            classeRecorrencia: 'TODAS',
            segmentoRFM: 'TODOS',
            statusCliente: 'TODOS',
            riscoPerda: 'TODOS',
            situacaoCredito: 'TODOS',
            unitMode: 'BRL',
          },
          user?.role,
          user?.id,
        )
        const totalTons = predicoes.reduce((acc, p) => acc + p.horizontes.tonelagemEsperada90d, 0)
        reply = `O volume físico projetado para os próximos 90 dias é de ${totalTons.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} toneladas, calculado pela média histórica de entrega condicionada aos eventos previstos do BG/NBD.`
        link = { label: 'Ver Detalhamento de Volume (t)', url: '/crm/recorrencia' }
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
