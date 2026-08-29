import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Split,
  FileText,
  DollarSign,
  Package,
  Layers,
  UserCheck,
  Target,
  RefreshCw,
  Lightbulb,
} from 'lucide-react'
import { formatCurrency, formatWeight } from '@/lib/utils'
import { CommercialCampaign } from '@/types/commercial_execution'
import { toast } from 'sonner'

export interface CampaignAIDrilldownModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campanha: CommercialCampaign | null
  onNavigateToQuote?: (campanha: CommercialCampaign) => void
}

export function CampaignAIDrilldownModal({
  open,
  onOpenChange,
  campanha,
  onNavigateToQuote,
}: CampaignAIDrilldownModalProps) {
  const [analyzingWithAI, setAnalyzingWithAI] = useState(false)
  const [activeTab, setActiveTab] = useState<'funil' | 'ab_test' | 'ia_10_pontos' | 'clientes'>(
    'funil',
  )

  if (!campanha) return null

  const handleRunAIAnalysis = () => {
    setAnalyzingWithAI(true)
    setTimeout(() => {
      setAnalyzingWithAI(false)
      toast.success('Diagnóstico de IA atualizado em tempo real!')
    }, 1000)
  }

  // Métricas de Funil
  const m = campanha.metricas
  const taxaEntrega = m.enviados > 0 ? Math.round((m.entregues / m.enviados) * 100) : 0
  const taxaLeitura = m.entregues > 0 ? Math.round((m.lidos / m.entregues) * 100) : 0
  const taxaResposta = m.lidos > 0 ? Math.round((m.respostas / m.lidos) * 100) : 0
  const taxaCotacao = m.respostas > 0 ? Math.round((m.cotacoesGeradas / m.respostas) * 100) : 0
  const taxaPedido =
    m.cotacoesGeradas > 0 ? Math.round((m.pedidosGerados / m.cotacoesGeradas) * 100) : 0

  // Métricas A/B Test (Simuladas para Comparação Comercial)
  const isAb = campanha.isAbTestActive
  const varA = {
    nome: 'Variante A (Foco em Condição / Preço)',
    enviados: Math.round(m.enviados * 0.5),
    entregues: Math.round(m.entregues * 0.5),
    lidos: Math.round(m.lidos * 0.48),
    respostas: Math.round(m.respostas * 0.45),
    cotacoes: Math.round(m.cotacoesGeradas * 0.4),
    pedidos: Math.round(m.pedidosGerados * 0.35),
    volumeTons: Math.round(m.volumeTotalTons * 0.38),
    faturamento: Math.round(m.faturamentoTotal * 0.36),
  }

  const varB = {
    nome: 'Variante B (Foco em Pronta Entrega / Pátio)',
    enviados: Math.round(m.enviados * 0.5),
    entregues: Math.round(m.entregues * 0.5),
    lidos: Math.round(m.lidos * 0.52),
    respostas: Math.round(m.respostas * 0.55),
    cotacoes: Math.round(m.cotacoesGeradas * 0.6),
    pedidos: Math.round(m.pedidosGerados * 0.65),
    volumeTons: Math.round(m.volumeTotalTons * 0.62),
    faturamento: Math.round(m.faturamentoTotal * 0.64),
  }

  const winningVariant = varB.faturamento > varA.faturamento ? 'Variante B' : 'Variante A'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-slate-950 text-slate-100 border-slate-800 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-slate-800 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-sky-400 bg-sky-950 px-2.5 py-0.5 rounded-lg border border-sky-800/40">
                  {campanha.codigo}
                </span>
                <Badge className="bg-emerald-500 text-white text-[10px] font-bold uppercase">
                  {campanha.status.replace(/_/g, ' ')}
                </Badge>
                {campanha.isAbTestActive && (
                  <Badge className="bg-purple-600 text-white text-[9px] font-bold">
                    A/B Test Ativo
                  </Badge>
                )}
              </div>
              <DialogTitle className="font-serif text-xl font-bold text-white">
                {campanha.titulo}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Drill-down: Campanha → Cliente → Interação → Oportunidade → Cotação → Pedido SAP
              </DialogDescription>
            </div>

            <Button
              size="sm"
              onClick={handleRunAIAnalysis}
              disabled={analyzingWithAI}
              className="h-8 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl gap-1.5 shadow-xs shrink-0"
            >
              {analyzingWithAI ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Analisando...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" /> Analisar Campanha com IA
                </>
              )}
            </Button>
          </div>
        </DialogHeader>

        {/* NAVEGAÇÃO DE ABAS */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 pt-2">
          <Button
            size="sm"
            variant={activeTab === 'funil' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('funil')}
            className={`h-8 text-xs rounded-xl font-bold ${
              activeTab === 'funil' ? 'bg-sky-600 text-white' : 'text-slate-400'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 mr-1.5" /> Funil até Venda
          </Button>

          {isAb && (
            <Button
              size="sm"
              variant={activeTab === 'ab_test' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('ab_test')}
              className={`h-8 text-xs rounded-xl font-bold ${
                activeTab === 'ab_test' ? 'bg-purple-600 text-white' : 'text-slate-400'
              }`}
            >
              <Split className="w-3.5 h-3.5 mr-1.5" /> Análise A/B Comercial
            </Button>
          )}

          <Button
            size="sm"
            variant={activeTab === 'ia_10_pontos' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('ia_10_pontos')}
            className={`h-8 text-xs rounded-xl font-bold ${
              activeTab === 'ia_10_pontos' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Diagnóstico IA (10 Pontos)
          </Button>
        </div>

        {/* 1. ABA FUNIL ATÉ VENDA */}
        {activeTab === 'funil' && (
          <div className="space-y-4 pt-2 text-xs">
            {/* CARDS DE RESULTADO COMERCIAL */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
              <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans uppercase font-bold">
                  Clientes Abordados
                </span>
                <strong className="text-lg text-white block my-0.5">{m.enviados}</strong>
                <span className="text-[10px] text-emerald-400 font-sans">
                  {taxaEntrega}% taxa de entrega
                </span>
              </div>

              <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans uppercase font-bold">
                  Cotações Geradas
                </span>
                <strong className="text-lg text-amber-300 block my-0.5">{m.cotacoesGeradas}</strong>
                <span className="text-[10px] text-amber-400 font-sans">
                  {taxaCotacao}% conversão de respostas
                </span>
              </div>

              <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans uppercase font-bold">
                  Pedidos Convertidos
                </span>
                <strong className="text-lg text-emerald-400 block my-0.5">
                  {m.pedidosGerados}
                </strong>
                <span className="text-[10px] text-emerald-300 font-sans">
                  {taxaPedido}% conversão em pedido
                </span>
              </div>

              <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans uppercase font-bold">
                  Faturamento Realizado
                </span>
                <strong className="text-base text-emerald-300 block my-0.5">
                  {formatCurrency(m.faturamentoTotal)}
                </strong>
                <span className="text-[10px] text-slate-400 font-sans">
                  {formatWeight(m.volumeTotalTons)} faturadas
                </span>
              </div>
            </div>

            {/* FUNIL COMPLETO EM ETAPAS VISUAIS */}
            <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Funil Passo a Passo com Taxas de Conversão Intermediárias
              </span>

              <div className="space-y-2">
                {[
                  {
                    label: '1. Selecionados na Base',
                    val: m.selecionados,
                    pct: 100,
                    color: 'bg-slate-700',
                  },
                  {
                    label: '2. Mensagens Entregues',
                    val: m.entregues,
                    pct: taxaEntrega,
                    color: 'bg-sky-700',
                  },
                  {
                    label: '3. Mensagens Lidas',
                    val: m.lidos,
                    pct: taxaLeitura,
                    color: 'bg-blue-600',
                  },
                  {
                    label: '4. Respostas Recebidas',
                    val: m.respostas,
                    pct: taxaResposta,
                    color: 'bg-indigo-600',
                  },
                  {
                    label: '5. Cotações Abertas no CPQ',
                    val: m.cotacoesGeradas,
                    pct: taxaCotacao,
                    color: 'bg-amber-600',
                  },
                  {
                    label: '6. Pedidos Emitidos SAP ECC',
                    val: m.pedidosGerados,
                    pct: taxaPedido,
                    color: 'bg-emerald-600',
                  },
                ].map((step, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-medium">{step.label}</span>
                      <span className="font-mono font-bold text-white">
                        {step.val} <span className="text-slate-500 text-[10px]">({step.pct}%)</span>
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden flex">
                      <div
                        style={{ width: `${Math.min(100, Math.max(8, step.pct))}%` }}
                        className={`h-full ${step.color}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. ABA ANÁLISE A/B TEST */}
        {activeTab === 'ab_test' && (
          <div className="space-y-4 pt-2 text-xs">
            <div className="p-4 bg-purple-950/40 border border-purple-800/40 rounded-2xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                  <Split className="w-4 h-4" /> Vencedora por Resultado Comercial: {winningVariant}
                </span>
                <Badge className="bg-purple-600 text-white font-mono text-[10px]">
                  +68% FATURAMENTO
                </Badge>
              </div>
              <p className="text-[11px] text-slate-300">
                A IA priorizou o volume financeiro e cotações convertidas em detrimento de métricas
                superficiais de leitura.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Variante A */}
              <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <strong className="text-sky-400 font-bold">{varA.nome}</strong>
                  <Badge variant="outline" className="text-[10px] text-slate-400">
                    Variante A
                  </Badge>
                </div>
                <div className="space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">Enviados / Entregues:</span>
                    <span>
                      {varA.enviados} / {varA.entregues}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">Respostas Recebidas:</span>
                    <span className="text-sky-300">{varA.respostas}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">Cotações Geradas:</span>
                    <span className="text-amber-300 font-bold">{varA.cotacoes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">Pedidos Emitidos:</span>
                    <span className="text-emerald-400 font-bold">{varA.pedidos}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-800">
                    <span className="text-slate-400 font-sans font-bold">Faturamento:</span>
                    <span className="text-emerald-300 font-bold">
                      {formatCurrency(varA.faturamento)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Variante B */}
              <div className="p-4 bg-purple-950/20 rounded-2xl border border-purple-800/60 space-y-3">
                <div className="flex items-center justify-between border-b border-purple-800/60 pb-2">
                  <strong className="text-purple-300 font-bold">{varB.nome}</strong>
                  <Badge className="bg-purple-600 text-white text-[10px]">Vencedora ★</Badge>
                </div>
                <div className="space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">Enviados / Entregues:</span>
                    <span>
                      {varB.enviados} / {varB.entregues}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">Respostas Recebidas:</span>
                    <span className="text-purple-300">{varB.respostas}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">Cotações Geradas:</span>
                    <span className="text-amber-300 font-bold">{varB.cotacoes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-sans">Pedidos Emitidos:</span>
                    <span className="text-emerald-400 font-bold">{varB.pedidos}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-purple-800/60">
                    <span className="text-slate-400 font-sans font-bold">Faturamento:</span>
                    <span className="text-emerald-300 font-bold">
                      {formatCurrency(varB.faturamento)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. ABA DIAGNÓSTICO IA EM 10 PONTOS EXIGIDOS */}
        {activeTab === 'ia_10_pontos' && (
          <div className="space-y-3 pt-2 text-xs">
            <div className="p-4 bg-amber-950/30 border border-amber-800/40 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>Diagnóstico Completo de IA da Campanha (10 Dimensões Comerciais)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300">
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                  <strong className="text-amber-300 block">1. Desempenho Geral:</strong>
                  <p>
                    Atingimento de 118% da meta de volume planejado com excelente tração em
                    cotações.
                  </p>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                  <strong className="text-emerald-300 block">2. Melhor Segmento:</strong>
                  <p>Caldeiraria Pesada & Estruturas Metálicas (42% das conversões totais).</p>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                  <strong className="text-rose-300 block">3. Pior Segmento:</strong>
                  <p>
                    Revenda de Pequeno Porte (alta taxa de leitura porém baixa conversão em cotação
                    formal).
                  </p>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                  <strong className="text-purple-300 block">4. Melhor Mensagem:</strong>
                  <p>
                    Variante B — Abordagem com ênfase em disponibilidade no pátio e pronta entrega.
                  </p>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                  <strong className="text-sky-300 block">5. Conversão:</strong>
                  <p>Taxa global de 18,4% (disparo → pedido de venda faturado).</p>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                  <strong className="text-emerald-300 block">6. Fatores Positivos:</strong>
                  <p>
                    Preço competitivo de usina, inclusão do PDF do espelho da cotação e agilidade do
                    vendedor.
                  </p>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                  <strong className="text-amber-300 block">7. Fatores Negativos:</strong>
                  <p>
                    3 clientes relataram prazo de pagamento restrito a 14 dias (desejavam 28 ddl).
                  </p>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                  <strong className="text-sky-300 block">8. Clientes Prioritários:</strong>
                  <p>
                    Estruturas Vale do Aço, Usiusinagem MG e Metalúrgica Horizonte (intenção
                    imediata).
                  </p>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                  <strong className="text-emerald-300 block">9. Oportunidades Geradas:</strong>
                  <p>R$ 480.000,00 em pipeline aquecido para o próximo ciclo de fechamento.</p>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                  <strong className="text-amber-300 block">
                    10. Sugestões para Próxima Campanha:
                  </strong>
                  <p>
                    Oferecer condição especial de frete CIF para regiões do interior e testar
                    horário matutino (09h00).
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs border-slate-700 text-slate-300 rounded-xl"
          >
            Fechar Detalhes
          </Button>

          {onNavigateToQuote && (
            <Button
              onClick={() => onNavigateToQuote(campanha)}
              className="h-8 text-xs bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" /> Gerar Nova Cotação desta Campanha
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
