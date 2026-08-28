import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Layers,
  Users,
  Package,
  TrendingDown,
  Repeat,
  Sparkles,
  ChevronRight,
  HelpCircle,
  ArrowRight,
  Activity,
} from 'lucide-react'
import { cn, formatNumberBR, formatWeight } from '@/lib/utils'

export interface GapBreakdownItem {
  category: 'CLIENTES' | 'PRODUTO' | 'CONVERSAO' | 'FREQUENCIA' | 'OUTROS'
  title: string
  impactTons: number
  impactPct: number
  description: string
  rootCause: {
    fact: string
    hypothesis: string
    evidence: string
    confidence: 'Alta' | 'Média' | 'Baixa'
  }
  suggestedAction: string
  drilldownDetails?: Array<{
    name: string
    tons: number
    systemSource: string
  }>
}

export interface GapDecompositionPanelProps {
  totalGapTons: number
  items?: GapBreakdownItem[]
  onExecuteAction?: (item: GapBreakdownItem) => void
  className?: string
}

export const DEFAULT_GAP_BREAKDOWN: GapBreakdownItem[] = [
  {
    category: 'CLIENTES',
    title: 'Clientes Curva A sem Recompra no Ciclo',
    impactTons: 110,
    impactPct: 39.3,
    description: '3 grandes contas industriais atrasaram a reposição histórica em mais de 6 dias.',
    rootCause: {
      fact: 'Faturamento de chapas grossas A36 caiu 42% nas contas Metais Betim e Usinagem Vale.',
      hypothesis:
        'Compradores aguardando fechamento de novos projetos de caldeiraria no início do mês seguinte.',
      evidence:
        'Contatos confirmaram estoque mínimo em fábrica e cotações pendentes de validação técnica.',
      confidence: 'Alta',
    },
    suggestedAction:
      'Oferecer condição especial de frete CIF bonificado para antecipar 85 t de Chapas A36.',
    drilldownDetails: [
      { name: 'Metais Betim Indústria Ltda', tons: 52, systemSource: 'SAP ECC' },
      { name: 'Usinagem Vale do Aço S/A', tons: 38, systemSource: 'SAP ECC' },
      { name: 'Santa Rita Estruturas Metálicas', tons: 20, systemSource: 'SAP ECC' },
    ],
  },
  {
    category: 'PRODUTO',
    title: 'Desaceleração na Família de Tubos Industriais',
    impactTons: 75,
    impactPct: 26.8,
    description: 'Menor demanda pontual de revendas e serralherias da Grande BH.',
    rootCause: {
      fact: 'Volume de tubos caiu de 140 t para 65 t no comparativo mês a mês.',
      hypothesis: 'Pressão de preços de distribuidoras regionais com estoque excedente.',
      evidence: 'Pareto de perdas no CRM apontou 4 orçamentos perdidos por variação de R$ 0,15/kg.',
      confidence: 'Alta',
    },
    suggestedAction: 'Aplicar tabela de alçada especial para lotes fechados acima de 15 t.',
    drilldownDetails: [
      { name: 'Tubos Quadrados 80x80 e 100x100', tons: 45, systemSource: 'Qlik Sense' },
      { name: 'Tubos Redondos Estruturais Sch40', tons: 30, systemSource: 'Qlik Sense' },
    ],
  },
  {
    category: 'CONVERSAO',
    title: 'Latência em Cotações Abertas > 48 Horas',
    impactTons: 55,
    impactPct: 19.6,
    description: '8 cotações emitidas sem retorno de follow-up do consultor.',
    rootCause: {
      fact: 'Tempo médio de resposta do vendedor subiu de 4h para 32h nesta quinzena.',
      hypothesis: 'Sobrecarga operacional e ausência de contato ativo pós-envio de proposta.',
      evidence:
        'Logs do WhatsApp e do CRM registraram mensagens de compradores não respondidas no SLA.',
      confidence: 'Alta',
    },
    suggestedAction: 'Disparar rotina de follow-up guiado pelo Seller Copilot para as 8 propostas.',
    drilldownDetails: [
      { name: 'Cotação COT-2024-089 (Estruturas Brasil)', tons: 25, systemSource: 'CRM 360º' },
      { name: 'Cotação COT-2024-094 (Caldeiraria Minas)', tons: 18, systemSource: 'CRM 360º' },
      { name: 'Cotação COT-2024-101 (Ferragens União)', tons: 12, systemSource: 'CRM 360º' },
    ],
  },
  {
    category: 'FREQUENCIA',
    title: 'Redução do Ticket Médio por Pedido',
    impactTons: 40,
    impactPct: 14.3,
    description: 'Clientes fracionando pedidos para manter fluxo de caixa enxuto.',
    rootCause: {
      fact: 'Média por pedido caiu de 18,5 t para 11,2 t nos últimos 30 dias.',
      hypothesis: 'Incerteza setorial gerando compras apenas sob demanda imediata de obra.',
      evidence:
        'Histórico de faturamentos SAP ECC confirma aumento do número de ordens com menor tonelagem.',
      confidence: 'Média',
    },
    suggestedAction:
      'Propor venda casada de Perfis + Barras com desconto progressivo por carga cheia.',
    drilldownDetails: [
      { name: 'Compras Fracionadas Indústria', tons: 24, systemSource: 'SAP ECC' },
      { name: 'Compras Fracionadas Serralheria', tons: 16, systemSource: 'SAP ECC' },
    ],
  },
]

export function GapDecompositionPanel({
  totalGapTons,
  items = DEFAULT_GAP_BREAKDOWN,
  onExecuteAction,
  className,
}: GapDecompositionPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('CLIENTES')
  const [showCauseModal, setShowCauseModal] = useState<GapBreakdownItem | null>(null)

  const activeItem = items.find((i) => i.category === selectedCategory) || items[0]

  return (
    <Card
      className={cn(
        'p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4',
        className,
      )}
    >
      {/* HEADER DA DECOMPOSIÇÃO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-700">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-primary">
              "O Que Explica Meu Gap?" — Decomposição & Análise Causal
            </h3>
            <p className="text-xs text-muted-foreground">
              Decomposição analítica em Clientes, Produto, Conversão e Frequência com drill-down e
              evidências
            </p>
          </div>
        </div>

        <Badge
          variant="outline"
          className="text-xs font-bold text-amber-700 bg-amber-50 border-amber-300"
        >
          Gap Total: {formatWeight(totalGapTons, 0)}
        </Badge>
      </div>

      {/* TABS DE CATEGORIA DE GAP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {items.map((item) => {
          const isSelected = selectedCategory === item.category

          return (
            <button
              key={item.category}
              onClick={() => setSelectedCategory(item.category)}
              className={cn(
                'p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1',
                isSelected
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-800',
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                  {item.category === 'CLIENTES'
                    ? '1. Clientes'
                    : item.category === 'PRODUTO'
                      ? '2. Produto'
                      : item.category === 'CONVERSAO'
                        ? '3. Conversão'
                        : '4. Frequência'}
                </span>
                <span
                  className={cn(
                    'text-[10px] font-bold font-mono',
                    isSelected ? 'text-amber-300' : 'text-amber-700',
                  )}
                >
                  {formatNumberBR(item.impactPct, 1)}%
                </span>
              </div>

              <strong className="font-serif text-lg leading-none mt-1">
                {formatWeight(item.impactTons, 0)}
              </strong>
              <span className="text-[10px] truncate opacity-80">{item.title}</span>
            </button>
          )
        })}
      </div>

      {/* CARD DETALHADO DO GAP SELECIONADO: CAUSA RAIZ, EVIDÊNCIA E DRILL-DOWN */}
      {activeItem && (
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3.5 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-serif font-bold text-sm text-slate-900">{activeItem.title}</h4>
                <Badge className="bg-amber-100 text-amber-800 text-[10px] font-bold border-none">
                  Impacto: {formatWeight(activeItem.impactTons, 0)} (
                  {formatNumberBR(activeItem.impactPct, 1)}%)
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{activeItem.description}</p>
            </div>

            <Button
              size="sm"
              onClick={() => onExecuteAction?.(activeItem)}
              className="h-8 text-xs bg-primary hover:bg-primary/90 text-white font-semibold gap-1.5 rounded-xl shadow-xs"
            >
              <span>Aplicar Ação Corretiva</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* QUADRO DE ANÁLISE DE CAUSA: FATO / HIPÓTESE / EVIDÊNCIA / CONFIANÇA */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs">
            {/* Fato */}
            <div className="p-3 bg-white rounded-xl border space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">1. FATO</span>
              <p className="text-slate-800 font-medium leading-relaxed">
                {activeItem.rootCause.fact}
              </p>
            </div>

            {/* Hipótese */}
            <div className="p-3 bg-white rounded-xl border space-y-1">
              <span className="text-[10px] uppercase font-bold text-amber-600 block">
                2. HIPÓTESE
              </span>
              <p className="text-slate-800 font-medium leading-relaxed">
                {activeItem.rootCause.hypothesis}
              </p>
            </div>

            {/* Evidência */}
            <div className="p-3 bg-white rounded-xl border space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-600 block">
                3. EVIDÊNCIA
              </span>
              <p className="text-slate-800 font-medium leading-relaxed">
                {activeItem.rootCause.evidence}
              </p>
            </div>

            {/* Confiança & Sistema */}
            <div className="p-3 bg-white rounded-xl border space-y-1 flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  4. CONFIANÇA
                </span>
                <Badge
                  className={cn(
                    'text-[10px] font-bold border-none mt-1',
                    activeItem.rootCause.confidence === 'Alta'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800',
                  )}
                >
                  Confiança {activeItem.rootCause.confidence}
                </Badge>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">
                Sem causalidade automática
              </span>
            </div>
          </div>

          {/* DRILL-DOWN DOS CLIENTES / PRODUTOS AFETADOS */}
          {activeItem.drilldownDetails && activeItem.drilldownDetails.length > 0 && (
            <div className="pt-2 border-t border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-600 block mb-2 tracking-wider">
                Drill-down das Entidades mais Impactantes:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {activeItem.drilldownDetails.map((detail, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between text-xs"
                  >
                    <div className="truncate pr-2">
                      <strong className="text-slate-900 block truncate">{detail.name}</strong>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Fonte: {detail.systemSource}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 shrink-0">
                      -{detail.tons} t
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
