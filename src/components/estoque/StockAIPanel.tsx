import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  Building2,
  TrendingDown,
  Warehouse,
  Truck,
  Factory,
  RefreshCw,
  Send,
  CheckCircle2,
} from 'lucide-react'
import type { StockItem, CommercialOpportunity } from '@/types/stock'
import { formatCurrency, formatWeight, formatNumberBR } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface StockAIPanelProps {
  items: StockItem[]
  opportunities: CommercialOpportunity[]
  userRole?: string
  onRequestCheck: (item: StockItem) => void
  onContactCustomer: (opportunity: CommercialOpportunity) => void
}

export function StockAIPanel({
  items,
  opportunities,
  userRole,
  onRequestCheck,
  onContactCustomer,
}: StockAIPanelProps) {
  const { toast } = useToast()
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [lastAnalysisTime, setLastAnalysisTime] = useState<string>('Hoje, 09:15')

  const isManager =
    userRole === 'administrador' ||
    userRole === 'admin' ||
    userRole === 'supervisor' ||
    userRole === 'gerente_comercial'

  const criticalItems = items.filter(
    (it) => it.classification === 'CRITICO' || it.classification === 'PARADO',
  )

  const handleRunAiAnalysis = () => {
    setIsAnalyzing(true)
    setTimeout(() => {
      setIsAnalyzing(false)
      const now = new Date()
      setLastAnalysisTime(
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      )
      toast({
        title: 'Análise de IA de Estoque Concluída!',
        description: `Processados ${items.length} SKUs com base no seu perfil de acesso governado.`,
      })
    }, 900)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. HERO BANNER DA IA COMERCIAL */}
      <Card className="p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-primary/90 text-white rounded-3xl border border-primary/30 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-400 text-slate-950 font-bold text-xs border-none">
                COPILOTO DE GESTÃO DE ESTOQUE CIAFAL
              </Badge>
              <Badge variant="outline" className="text-xs text-blue-200 border-blue-400/30">
                GOVERNANÇA & ISOLAMENTO ATIVO
              </Badge>
            </div>
            <h3 className="font-serif text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Diagnóstico Estratégico & Ações Comerciais Recomendadas
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              O motor inteligente analisa saldos, envelhecimento (aging), capital imobilizado,
              ritmos de venda e janelas logísticas para gerar prescrições objetivas.
              <span className="text-amber-300 block font-normal mt-0.5">
                Regra 22: A IA atua estritamente no escopo de acesso do seu usuário e não altera
                dados mestres automaticamente.
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              onClick={handleRunAiAnalysis}
              disabled={isAnalyzing}
              className="h-10 px-4 rounded-2xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold gap-2 shadow-lg"
            >
              <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAnalyzing ? 'Processando IA...' : 'Atualizar Análise IA'}</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* 2. PAINEL DE AÇÕES RECOMENDADAS (Regra 22) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 rounded-xl text-amber-800">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-slate-900">
                Prescrições Comerciais Prioritárias (Painel de Ação)
              </h3>
              <p className="text-xs text-muted-foreground">
                Cruzamento entre Situação, Evidência, Possível Impacto e Ação Comercial Prescrita.
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs font-mono bg-slate-50">
            Última Execução: {lastAnalysisTime}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {criticalItems.map((item, idx) => {
            const oppForThisItem = opportunities.find((o) => o.materialCode === item.materialCode)

            return (
              <Card
                key={item.id}
                className="p-5 bg-white/95 backdrop-blur-md rounded-3xl border border-border/60 shadow-xs flex flex-col justify-between hover:border-amber-400 transition-all space-y-4"
              >
                <div className="space-y-3">
                  {/* CABEÇALHO DO ITEM */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                          {item.materialCode}
                        </span>
                        <Badge
                          className={`text-[9px] font-bold border-none ${
                            item.classification === 'CRITICO'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}
                        >
                          {item.classification}
                        </Badge>
                      </div>
                      <h4 className="font-serif font-bold text-sm text-slate-900 mt-1 line-clamp-1">
                        {item.description}
                      </h4>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        Capital
                      </span>
                      <strong className="text-xs font-bold text-rose-700">
                        {formatCurrency(item.estimatedTotalValue)}
                      </strong>
                    </div>
                  </div>

                  {/* MATRIZ DE RECOMENDAÇÃO (Situação / Evidência / Impacto / Ação) */}
                  <div className="space-y-2 text-xs">
                    {/* Situação */}
                    <div className="p-2.5 bg-slate-50 rounded-2xl">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        Situação Identificada
                      </span>
                      <p className="text-slate-800 font-medium">
                        {item.daysWithoutMovement > 120
                          ? `Lote sem giro comercial há ${item.daysWithoutMovement} dias (${formatWeight(item.availableTons)} livres no depósito ${item.storageLocation}).`
                          : `Estoque em nível crítico (${formatWeight(item.availableTons)} livres) abaixo da margem de segurança de ${formatWeight(item.criticalStockTons)}.`}
                      </p>
                    </div>

                    {/* Evidência */}
                    <div className="p-2.5 bg-blue-50/60 rounded-2xl">
                      <span className="text-[10px] uppercase font-bold text-primary block">
                        Evidência dos Sistemas
                      </span>
                      <p className="text-slate-800">
                        Entrada no SAP em {item.entryDate} · Último comprador registrado:{' '}
                        <strong>{item.lastCustomerName || 'Não registrado'}</strong>.
                        {item.tmsComplementAvailable &&
                          ' Há frete programado no TMS para a região.'}
                      </p>
                    </div>

                    {/* Possível Impacto */}
                    <div className="p-2.5 bg-rose-50/60 rounded-2xl">
                      <span className="text-[10px] uppercase font-bold text-rose-700 block">
                        Possível Impacto Financeiro
                      </span>
                      <p className="text-rose-950">
                        Custo de oportunidade de capital imobilizado e risco de depreciação física
                        ou ruptura em cotações ativas.
                      </p>
                    </div>

                    {/* Ação Comercial Sugerida */}
                    <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-2xl">
                      <span className="text-[10px] uppercase font-bold text-amber-900 flex items-center gap-1">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-700" />
                        Ação Comercial Prescrita pela IA
                      </span>
                      <p className="text-xs text-amber-950 font-medium mt-1">
                        {oppForThisItem
                          ? `Acionar o cliente ${oppForThisItem.customerName} oferecendo condição com frete TMS consolidado.`
                          : `Promover checagem física no pátio e ofertar para clientes do segmento de Caldeiraria/Construção Civil.`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* BOTÕES DE AÇÃO */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRequestCheck(item)}
                    className="h-8 text-xs rounded-xl gap-1 text-slate-700"
                  >
                    <Warehouse className="w-3.5 h-3.5 text-primary" />
                    <span>Solicitar Checagem</span>
                  </Button>

                  {oppForThisItem && (
                    <Button
                      size="sm"
                      onClick={() => onContactCustomer(oppForThisItem)}
                      className="h-8 text-xs rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold gap-1 shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Acionar Cliente Recomendado</span>
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
