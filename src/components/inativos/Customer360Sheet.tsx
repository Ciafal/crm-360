import React, { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  TrendingUp,
  Package,
  MessageSquare,
  Phone,
  Clock,
  Sparkles,
  AlertCircle,
  PlusCircle,
  History,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'
import type { BICustomerSummary } from '@/providers/BIProvider'
import { cn } from '@/lib/utils'

interface Customer360SheetProps {
  customer?: BICustomerSummary | null
  customerId?: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onGenerateAction?: (customer: BICustomerSummary) => void
  onOpenConversas?: (customerName: string) => void
}

export function Customer360Sheet({
  customer: propCustomer,
  customerId,
  open,
  onOpenChange,
  onGenerateAction,
  onOpenConversas,
}: Customer360SheetProps) {
  const [activeTab, setActiveTab] = useState('recorrencia')

  const fallbackCustomer: BICustomerSummary | null = customerId
    ? {
        customerId: customerId,
        customerName: `Cliente ${customerId}`,
        reactivationScore: 85,
        pAlive: 0.82,
        daysSinceLastPurchase: 42,
        expectedValue: 120000,
        expectedNextPurchaseDays: 14,
        historicalRevenue: 480000,
        historicalTons: 65,
        frequency: 28,
        ticket: 45000,
        rfmSegment: 'Campeões',
        creditStatus: 'liberado',
        recommendedChannel: 'whatsapp',
        recommendedAction: 'Retomar contato com proposta de pronta-entrega de laminados.',
        reason: 'Intervalo de compras superado em 14 dias.',
        products: [],
        recurrenceMonths: [1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 0],
      }
    : null

  const customer = propCustomer || fallbackCustomer

  if (!customer) return null

  const formatBRL = (val?: number) => {
    if (!val) return 'R$ 0'
    return val.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    })
  }

  // Gera meses passados para grade de calor
  const monthsNames = [
    'Jan',
    'Fev',
    'Mar',
    'Abr',
    'Mai',
    'Jun',
    'Jul',
    'Ago',
    'Set',
    'Out',
    'Nov',
    'Dez',
  ]
  const recurrenceArray = customer.recurrenceMonths || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl overflow-y-auto p-0 flex flex-col bg-background"
      >
        {/* Header Superior do Drawer */}
        <div className="p-6 bg-slate-900 text-white flex flex-col gap-3 relative">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="bg-primary text-white border-none text-[11px] font-mono"
                >
                  {customer.customerId}
                </Badge>
                <Badge variant="secondary" className="bg-white/10 text-white text-[11px]">
                  {customer.segment || 'Indústria Metal-Mecânica'}
                </Badge>
              </div>
              <SheetTitle className="text-xl font-bold font-serif text-white mt-2 leading-tight">
                {customer.customerName}
              </SheetTitle>
              <SheetDescription className="text-slate-300 text-xs mt-1 flex items-center gap-3">
                <span>CNPJ: {customer.cnpj || 'Não informado'}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  {customer.city}/{customer.uf}
                </span>
              </SheetDescription>
            </div>

            <div className="text-right flex flex-col items-end">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Score Reativação
              </span>
              <span className="text-3xl font-bold font-serif text-emerald-400">
                {customer.reactivationScore}
              </span>
              <span className="text-[11px] text-slate-300 mt-0.5">
                P(vivo): {Math.round(customer.pAlive * 100)}%
              </span>
            </div>
          </div>

          {/* Banner de Ação Recomendada */}
          <div className="mt-2 bg-white/10 rounded-xl p-3 border border-white/10 flex items-start gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="text-xs font-bold text-amber-200 block uppercase tracking-wider">
                Recomendação de Fechamento IA
              </span>
              <p className="text-xs text-slate-100 mt-0.5 leading-relaxed">
                {customer.recommendedAction || customer.reason}
              </p>
            </div>
            {onGenerateAction && (
              <Button
                size="sm"
                onClick={() => {
                  onGenerateAction(customer)
                  onOpenChange(false)
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 px-3 rounded-lg shrink-0 shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1" />
                Criar Ação
              </Button>
            )}
          </div>
        </div>

        {/* Métricas Principais 360 */}
        <div className="grid grid-cols-3 gap-2 p-6 pb-2 bg-slate-50 border-b border-border/40">
          <div className="p-3 bg-white rounded-xl border border-slate-200/80">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
              Dias Inativo
            </span>
            <span className="text-2xl font-bold font-serif text-rose-600 mt-1 block">
              {customer.daysSinceLastPurchase} dias
            </span>
            <span className="text-[11px] text-muted-foreground mt-0.5 block">
              Última: {customer.lastPurchaseDate}
            </span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200/80">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
              Potencial Estimado
            </span>
            <span className="text-2xl font-bold font-serif text-primary mt-1 block">
              {formatBRL(customer.expectedValue)}
            </span>
            <span className="text-[11px] text-muted-foreground mt-0.5 block">
              Histórico: {formatBRL(customer.historicalRevenue)}
            </span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200/80">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
              Crédito & Estoque
            </span>
            <div className="flex items-center gap-1 mt-1">
              <Badge
                variant="outline"
                className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300"
              >
                {customer.creditStatus === 'liberado' ? 'Crédito OK' : 'Em análise'}
              </Badge>
            </div>
            <span className="text-[11px] text-muted-foreground mt-1 block">
              Estoque: {customer.stockCoveragePercent || 90}% cobertura
            </span>
          </div>
        </div>

        {/* Abas de Detalhamento 360 */}
        <div className="flex-1 p-6 flex flex-col gap-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 w-full bg-muted/60 p-1 rounded-xl">
              <TabsTrigger value="recorrencia" className="text-xs font-semibold rounded-lg">
                Recorrência & RFM
              </TabsTrigger>
              <TabsTrigger value="produtos" className="text-xs font-semibold rounded-lg">
                Produtos Parados ({customer.products?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="contato" className="text-xs font-semibold rounded-lg">
                Plano de Abordagem
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Recorrência Mensal (Heatmap 12 Meses) */}
            <TabsContent value="recorrencia" className="flex flex-col gap-4 mt-4">
              <div className="bg-white rounded-2xl p-4 border border-border/60 shadow-sm flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif font-bold text-sm text-primary">
                    Mapa de Recorrência Histórica (Últimos 12 Meses)
                  </h4>
                  <span className="text-xs text-muted-foreground">
                    Ciclo: {customer.frequency} dias
                  </span>
                </div>

                <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 py-2">
                  {recurrenceArray.map((bought, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all',
                        bought
                          ? 'bg-emerald-500 text-white border-emerald-600 font-bold shadow-xs'
                          : 'bg-slate-100 text-slate-400 border-slate-200 font-normal',
                      )}
                    >
                      <span className="text-[10px] uppercase tracking-wider">
                        {monthsNames[idx]}
                      </span>
                      <span className="text-xs mt-0.5">{bought ? '✓' : '—'}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/30">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-emerald-500" />
                    <span>Mês com Faturamento</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-slate-200" />
                    <span>Sem Compras</span>
                  </div>
                </div>
              </div>

              {/* Informações RFM */}
              <div className="bg-white rounded-2xl p-4 border border-border/60 shadow-sm flex flex-col gap-2">
                <h4 className="font-serif font-bold text-sm text-primary">
                  Classificação RFM & Modelagem
                </h4>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                      Segmento RFM
                    </span>
                    <span className="font-bold text-sm text-primary mt-0.5 block">
                      {customer.rfmSegment}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                      Ticket Médio
                    </span>
                    <span className="font-bold text-sm text-primary mt-0.5 block">
                      {formatBRL(customer.ticket)}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                      Toneladas Históricas
                    </span>
                    <span className="font-bold text-sm text-primary mt-0.5 block">
                      {customer.historicalTons} ton
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                      Próxima Compra Esperada
                    </span>
                    <span className="font-bold text-sm text-emerald-700 mt-0.5 block">
                      Em {customer.expectedNextPurchaseDays} dias
                    </span>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: Produtos que Parou de Comprar */}
            <TabsContent value="produtos" className="flex flex-col gap-3 mt-4">
              <div className="bg-white rounded-2xl p-4 border border-border/60 shadow-sm flex flex-col gap-3">
                <h4 className="font-serif font-bold text-sm text-primary">
                  Mix Abandonado com Compatibilidade de Estoque
                </h4>
                <div className="divide-y divide-border/40">
                  {customer.products && customer.products.length > 0 ? (
                    customer.products.map((prod, idx) => (
                      <div key={idx} className="py-3 flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-primary">
                              {prod.code}
                            </span>
                            <Badge variant="outline" className="text-[10px] bg-slate-100">
                              {prod.family}
                            </Badge>
                          </div>
                          <p className="text-xs font-medium text-slate-800 mt-1">
                            {prod.description}
                          </p>
                          <span className="text-[11px] text-muted-foreground mt-0.5 block">
                            Última compra: {prod.lastPurchaseDate} · Histórico:{' '}
                            {prod.historicalTons} ton
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          {prod.stockAvailable ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300 flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3" /> Estoque OK ({prod.stockCoverage}
                              d)
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-amber-50 text-amber-700 border-amber-300"
                            >
                              Sob encomenda
                            </Badge>
                          )}
                          {prod.priceKg ? (
                            <span className="text-xs font-bold text-primary mt-1 block">
                              R$ {prod.priceKg.toFixed(2)} / kg
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground py-4 text-center">
                      Nenhum produto em histórico recente registrado.
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: Plano de Contato Sugerido */}
            <TabsContent value="contato" className="flex flex-col gap-3 mt-4">
              <div className="bg-white rounded-2xl p-4 border border-border/60 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif font-bold text-sm text-primary">
                    Estratégia de Abordagem
                  </h4>
                  <Badge
                    variant="outline"
                    className="text-xs bg-primary/10 text-primary border-primary/20"
                  >
                    Canal Ideal: {customer.recommendedChannel || 'WhatsApp'}
                  </Badge>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">
                    Argumento Recomendado
                  </span>
                  <p className="text-xs text-slate-800 leading-relaxed">
                    "
                    {customer.reason ||
                      'Notamos um intervalo superior ao habitual desde o último fornecimento. Temos lote exclusivo de Inox 304 com frete promocional para pronta-entrega.'}
                    "
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => {
                      if (onOpenConversas) onOpenConversas(customer.customerName)
                    }}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Iniciar Conversa no WhatsApp
                  </Button>
                  <Button variant="outline" className="flex-1 text-primary">
                    <Phone className="w-4 h-4 mr-2" />
                    Ligar para Comprador
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  )
}
