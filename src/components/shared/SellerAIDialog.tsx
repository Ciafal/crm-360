import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  PlusCircle,
  Users,
  Target,
  Gauge,
  Activity,
  Package,
  ShieldCheck,
  Building2,
  ExternalLink,
} from 'lucide-react'
import { SellerIndividualAnalysis } from '@/providers/AIProvider'
import { useToast } from '@/hooks/use-toast'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

export interface SellerAIDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  analysis: SellerIndividualAnalysis | null
  loading?: boolean
  onCreateAction?: (action: {
    title: string
    description: string
    sellerId: string
    priority: string
  }) => void
}

export function SellerAIDialog({
  open,
  onOpenChange,
  analysis,
  loading = false,
  onCreateAction,
}: SellerAIDialogProps) {
  const { toast } = useToast()
  const navigate = useNavigate()
  const [createdActions, setCreatedActions] = useState<Record<string, boolean>>({})

  if (!open) return null

  const handleTransformIntoTask = (action: SellerIndividualAnalysis['acoesRecomendadas'][0]) => {
    if (onCreateAction && analysis) {
      onCreateAction({
        title: action.titulo,
        description: action.descricao,
        sellerId: analysis.sellerId,
        priority: action.prioridade,
      })
    }

    setCreatedActions((prev) => ({ ...prev, [action.id]: true }))

    toast({
      title: 'Ação comercial criada com sucesso!',
      description: `A recomendação da IA foi incluída na lista de tarefas e plano de ação do vendedor ${analysis?.sellerName}.`,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-primary to-slate-900 text-white p-6 rounded-t-2xl">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-400 text-slate-950 rounded-xl shadow-md">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-xl font-serif font-bold text-white tracking-tight">
                    Diagnóstico Individual de IA — {analysis?.sellerName || 'Vendedor'}
                  </DialogTitle>
                  <Badge className="bg-amber-400 text-slate-950 font-bold text-[10px] border-none">
                    CIAFAL Copilot v2.1
                  </Badge>
                </div>
                <DialogDescription className="text-slate-300 text-xs mt-0.5">
                  {analysis?.cargo} · Análise baseada em fatos, ritmo, cadência, latência e dados do
                  SAP ECC
                </DialogDescription>
              </div>
            </div>
          </div>
        </div>

        {loading || !analysis ? (
          <div className="p-12 text-center space-y-3">
            <Sparkles className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-700">
              Processando evidências comerciais, carteira e histórico do SAP ECC...
            </p>
            <p className="text-xs text-muted-foreground">
              Avaliando taxa de ativação, ritmo vs média e oportunidades da carteira.
            </p>
          </div>
        ) : (
          <div className="p-6 space-y-6 bg-slate-50/50">
            {/* Resumo Executivo */}
            <div className="p-4 rounded-xl bg-white border border-amber-200 shadow-xs space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <h4 className="font-serif font-bold text-sm text-slate-900">Resumo Executivo</h4>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {analysis.resumoExecutivo}
              </p>
            </div>

            {/* Painel de Evidências Numéricas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Realizado / Meta
                </span>
                <span className="text-sm font-bold text-primary">
                  {analysis.evidenciasContextuais.realizadoVolume} de{' '}
                  {analysis.evidenciasContextuais.metaVolume}
                </span>
                <span className="text-[10px] text-emerald-600 block mt-0.5 font-semibold">
                  {analysis.evidenciasContextuais.atingimentoPercent.toLocaleString('pt-BR', {
                    minimumFractionDigits: 1,
                  })}
                  % atingido
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Ritmo vs Média
                </span>
                <span className="text-sm font-bold text-violet-700 font-mono">
                  {analysis.evidenciasContextuais.ritmoAtual}
                </span>
                <span className="text-[10px] text-muted-foreground block mt-0.5">
                  Média: {analysis.evidenciasContextuais.mediaHistorica}
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Ativos no Mês
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {analysis.evidenciasContextuais.clientesAtivosMes} /{' '}
                  {analysis.evidenciasContextuais.carteiraTotal}
                </span>
                <span className="text-[10px] text-amber-600 block mt-0.5 font-semibold">
                  {analysis.evidenciasContextuais.taxaCarteiraAtivaPercent.toLocaleString('pt-BR', {
                    minimumFractionDigits: 1,
                  })}
                  % da carteira
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Forecast Projetado
                </span>
                <span className="text-sm font-bold text-indigo-700">
                  {analysis.evidenciasContextuais.forecastVolume}
                </span>
                <span className="text-[10px] text-muted-foreground block mt-0.5">
                  {analysis.evidenciasContextuais.followupsPendentes} follow-ups pendentes
                </span>
              </div>
            </div>

            {/* Abas: Diagnóstico / Oportunidades / Ações Recomendadas */}
            <Tabs defaultValue="diagnostico" className="w-full">
              <TabsList className="grid grid-cols-3 bg-slate-200/70 p-1 rounded-xl">
                <TabsTrigger value="diagnostico" className="text-xs font-semibold rounded-lg">
                  Diagnóstico (Pontos +/-)
                </TabsTrigger>
                <TabsTrigger value="oportunidades" className="text-xs font-semibold rounded-lg">
                  Oportunidades ({analysis.oportunidades.length})
                </TabsTrigger>
                <TabsTrigger value="acoes" className="text-xs font-semibold rounded-lg">
                  Ações da IA ({analysis.acoesRecomendadas.length})
                </TabsTrigger>
              </TabsList>

              {/* Aba 1: Diagnóstico */}
              <TabsContent value="diagnostico" className="space-y-4 pt-3">
                {/* Positivos */}
                <div className="space-y-2">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Pontos Positivos Identificados
                  </h5>
                  <div className="grid gap-2">
                    {analysis.pontosPositivos.map((pos, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1"
                      >
                        <strong className="text-xs text-emerald-950 block">{pos.titulo}</strong>
                        <p className="text-[11px] text-emerald-800">
                          <span className="font-semibold">Evidência:</span> {pos.evidenciaNumerica}
                        </p>
                        <p className="text-[10px] text-emerald-700 italic">
                          Impacto: {pos.impacto}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pontos de Atenção */}
                <div className="space-y-2 pt-1">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> Pontos de Atenção & Gargalos
                  </h5>
                  <div className="grid gap-2">
                    {analysis.pontosAtencao.map((at, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <strong className="text-xs text-amber-950">{at.titulo}</strong>
                          <Badge
                            className={cn(
                              'text-[9px] px-1.5 py-0 border-none font-bold',
                              at.riscoMeta === 'ALTO' || at.riscoMeta === 'CRITICO'
                                ? 'bg-rose-500 text-white'
                                : 'bg-amber-200 text-amber-900',
                            )}
                          >
                            Risco {at.riscoMeta}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-amber-900">
                          <span className="font-semibold">Evidência:</span> {at.evidenciaNumerica}
                        </p>
                        <p className="text-[10px] text-amber-800">
                          <span className="font-semibold">Causa provável:</span> {at.causaProvavel}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Aba 2: Oportunidades */}
              <TabsContent value="oportunidades" className="space-y-3 pt-3">
                <p className="text-xs text-muted-foreground">
                  Contas da carteira com alta probabilidade de fechamento no ciclo atual:
                </p>
                <div className="grid gap-2.5">
                  {analysis.oportunidades.map((op, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-start justify-between gap-3 shadow-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-primary shrink-0" />
                          <strong className="text-xs text-slate-900">{op.cliente}</strong>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          <span className="font-semibold text-slate-800">Mix:</span> {op.produto} ·{' '}
                          <span className="font-semibold text-emerald-700 font-mono">
                            {op.potencial}
                          </span>
                        </p>
                        <p className="text-[10px] text-muted-foreground">{op.motivo}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs rounded-lg gap-1 border-primary/30 text-primary hover:bg-primary/10 shrink-0"
                        onClick={() => {
                          onOpenChange(false)
                          navigate('/crm')
                        }}
                      >
                        <span>Ver no CRM</span>
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Aba 3: Ações Recomendadas pela IA */}
              <TabsContent value="acoes" className="space-y-3 pt-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Ações prioritárias sugeridas pelo agente de IA. O supervisor pode converter em
                    tarefas com confirmação:
                  </p>
                </div>

                <div className="grid gap-2.5">
                  {analysis.acoesRecomendadas.map((act) => {
                    const isCreated = !!createdActions[act.id]

                    return (
                      <div
                        key={act.id}
                        className={cn(
                          'p-3.5 rounded-xl border transition-all space-y-2',
                          isCreated
                            ? 'bg-emerald-50/50 border-emerald-300'
                            : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs',
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge
                                className={cn(
                                  'text-[9px] px-1.5 py-0 border-none font-bold',
                                  act.prioridade === 'ALTA'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800',
                                )}
                              >
                                Prioridade {act.prioridade}
                              </Badge>
                              <strong className="text-xs text-slate-900">{act.titulo}</strong>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {act.descricao}
                            </p>
                            <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> Prazo: {act.prazoSugerido}
                              </span>
                              {act.clienteAlvo && (
                                <span className="flex items-center gap-1">
                                  <Building2 className="w-3 h-3" /> Alvo: {act.clienteAlvo}
                                </span>
                              )}
                            </div>
                          </div>

                          <Button
                            size="sm"
                            disabled={isCreated}
                            onClick={() => handleTransformIntoTask(act)}
                            className={cn(
                              'h-8 px-3 rounded-lg text-xs font-semibold gap-1.5 shrink-0 transition-all',
                              isCreated
                                ? 'bg-emerald-600 text-white hover:bg-emerald-600 cursor-default'
                                : 'bg-primary text-white hover:bg-primary/90',
                            )}
                          >
                            {isCreated ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Criada</span>
                              </>
                            ) : (
                              <>
                                <PlusCircle className="w-3.5 h-3.5" />
                                <span>Criar Ação</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </TabsContent>
            </Tabs>

            {/* Botões de Drill-down Rápidos */}
            <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-muted-foreground uppercase">
                Atalhos Operacionais:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false)
                    navigate('/meu-dia')
                  }}
                  className="h-7 text-xs rounded-lg"
                >
                  Abrir Meu Dia
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false)
                    navigate('/crm')
                  }}
                  className="h-7 text-xs rounded-lg"
                >
                  Ver Carteira
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false)
                    navigate('/gestao-inativos')
                  }}
                  className="h-7 text-xs rounded-lg text-amber-700 hover:text-amber-800"
                >
                  Ver Clientes em Risco
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false)
                    navigate('/contatos')
                  }}
                  className="h-7 text-xs rounded-lg"
                >
                  Ver Contatos
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false)
                    navigate('/crm?tab=pipeline')
                  }}
                  className="h-7 text-xs rounded-lg text-primary font-semibold"
                >
                  Ver Funil
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false)
                    navigate('/tarefas')
                  }}
                  className="h-7 text-xs rounded-lg"
                >
                  Ver Tarefas
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
