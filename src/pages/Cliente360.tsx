import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Building2,
  Phone,
  MessageSquare,
  Mail,
  Sparkles,
  Calendar,
  DollarSign,
  TrendingUp,
  Package,
  FileText,
  Truck,
  ShieldCheck,
  AlertCircle,
  Clock,
  CheckCircle2,
  ExternalLink,
  ChevronLeft,
  ArrowRight,
  Send,
  PlusCircle,
  RotateCcw,
  Briefcase,
  Users,
  Layers,
  History,
  FileSpreadsheet,
  BadgeAlert,
  Loader2,
  Filter,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import {
  defaultERPProvider,
  type CustomerERPData,
  type QuoteERPData,
  type OrderERPData,
  type BillingERPData,
  type DeliveryERPData,
} from '@/providers/ERPProvider'
import { defaultBIProvider } from '@/providers/QlikProvider'
import { defaultAIProvider } from '@/providers/LocalAIAdapter'
import { cn } from '@/lib/utils'

export default function Cliente360() {
  const { id = 'CLI-8041' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()

  const [activeTab, setActiveTab] = useState('visao_geral')
  const [loading, setLoading] = useState(true)
  const [customer, setCustomer] = useState<CustomerERPData | null>(null)
  const [orders, setOrders] = useState<OrderERPData[]>([])
  const [quotes, setQuotes] = useState<QuoteERPData[]>([])
  const [billings, setBillings] = useState<BillingERPData[]>([])
  const [deliveries, setDeliveries] = useState<DeliveryERPData[]>([])
  const [biSummary, setBiSummary] = useState<any>(null)
  const [aiRecommendation, setAiRecommendation] = useState<any>(null)
  const [timelineFilter, setTimelineFilter] = useState<
    'all' | 'whatsapp' | 'phone' | 'email' | 'sap' | 'tasks' | 'visits'
  >('all')

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [erpData, ord, qts, bll, del, biCust, aiRec] = await Promise.all([
          defaultERPProvider.getCustomer(id),
          defaultERPProvider.getCustomerOrders(id),
          defaultERPProvider.getCustomerQuotes(id),
          defaultERPProvider.getCustomerBillings(id),
          defaultERPProvider.getCustomerDeliveries(id),
          defaultBIProvider.getCustomerHistory(id),
          defaultAIProvider.generateRecommendation(id),
        ])
        setCustomer(erpData)
        setOrders(ord)
        setQuotes(qts)
        setBillings(bll)
        setDeliveries(del)
        setBiSummary(biCust)
        setAiRecommendation(aiRec)
      } catch (err) {
        console.error(err)
        toast({
          title: 'Aviso de Conexão',
          description: 'Dados SAP temporariamente indisponíveis. Carregando última versão local.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id, toast])

  const formatBRL = (val?: number) => {
    if (val === undefined || val === null) return 'R$ 0,00'
    return val.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    })
  }

  // Timeline Omnichannel Unificada com suporte ao canal E-mail (Microsoft Graph)
  const allTimelineEvents = useMemo(() => {
    return [
      {
        id: 't-email-1',
        type: 'email',
        category: 'email',
        title: 'E-mail Comercial: Solicitação de Cotação Tubos Inox',
        summary:
          'compras@santarita.ind.br solicitou cotação para 3 toneladas de Tubo Inox AISI 304 Redondo SCH 10 com frete CIF para Campinas.',
        date: 'Hoje às 08:30',
        channel: 'E-mail (Outlook 365)',
        origin: 'Microsoft Graph 365',
        badgeColor: 'bg-sky-50 text-sky-700 border-sky-300',
        conversationId: 'AAQkAGI2TGFiYWNhLWNvbnYtMDAx',
      },
      {
        id: 't-1',
        type: 'whatsapp',
        category: 'whatsapp',
        title: 'Mensagem de Negociação WhatsApp',
        summary:
          'Comprador solicitou confirmação de frete CIF para entrega de 3t Tubos Inox 304 em Campinas.',
        date: 'Hoje às 10:45',
        channel: 'WhatsApp Web',
        origin: 'WhatsApp Baileys',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-300',
      },
      {
        id: 't-email-2',
        type: 'email',
        category: 'email',
        title: 'E-mail Enviado: Proposta Comercial COT-SAP-98104',
        summary:
          'Envio da cotação formal COT-SAP-98104 (R$ 54.000,00) via Microsoft 365 com tabela de preços anexa.',
        date: 'Hoje às 11:15',
        channel: 'E-mail (Outlook 365)',
        origin: 'Microsoft Graph 365',
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-300',
        conversationId: 'AAQkAGI2TGFiYWNhLWNvbnYtMDAx',
      },
      {
        id: 't-2',
        type: 'cotacao',
        category: 'sap',
        title: 'Cotação SAP COT-SAP-98104 Emitida',
        summary:
          'Proposta comercial de R$ 54.000,00 (6.8t Tubos SCH 10) enviada com validade de 15 dias.',
        date: 'Ontem às 16:20',
        channel: 'SAP ECC',
        origin: 'ERP SAP S/4HANA',
        badgeColor: 'bg-blue-50 text-blue-700 border-blue-300',
      },
      {
        id: 't-3',
        type: 'ligacao',
        category: 'phone',
        title: 'Ligação Telefônica Comercial (VoIP)',
        summary: 'Alinhamento com Gerente de Compras sobre expansão da linha de tanques.',
        date: '14/10/2024 às 11:30',
        channel: 'VoIP Corporativo',
        origin: 'Telefonia Asterisk',
        badgeColor: 'bg-purple-50 text-purple-700 border-purple-300',
      },
      {
        id: 't-4',
        type: 'faturamento',
        category: 'sap',
        title: 'Faturamento NF-0091823 Emitido',
        summary: 'Emissão de nota fiscal de R$ 48.500,00 referente ao pedido PED-SAP-77410.',
        date: '14/08/2024 às 14:30',
        channel: 'SAP Billing',
        origin: 'SEFAZ / SAP',
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-300',
      },
      {
        id: 't-5',
        type: 'visita',
        category: 'visits',
        title: 'Visita Técnica Realizada',
        summary:
          'Apresentação da nova linha de Tubos Sanitários e certificação de qualidade CIAFAL.',
        date: '20/07/2024 às 15:00',
        channel: 'Presencial',
        origin: 'App Vendas Móvel',
        badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-300',
      },
    ]
  }, [])

  const filteredTimelineEvents = useMemo(() => {
    if (timelineFilter === 'all') return allTimelineEvents
    return allTimelineEvents.filter((ev) => ev.category === timelineFilter)
  }, [allTimelineEvents, timelineFilter])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto flex flex-col gap-6 py-6 animate-pulse">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 pb-20 animate-fade-in">
      {/* Botão Voltar */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="text-muted-foreground hover:text-primary gap-1"
        >
          <ChevronLeft className="w-4 h-4" /> Voltar
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300">
            Dados demonstrativos · SAP ECC Mock
          </Badge>
          <span className="text-xs text-muted-foreground">
            Sincronizado: {new Date(defaultERPProvider.getLastSync()).toLocaleDateString('pt-BR')}
          </span>
        </div>
      </div>

      {/* CABEÇALHO DO CLIENTE 360º */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 relative z-10">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-primary hover:bg-primary/90 text-white font-mono text-xs px-2.5 py-0.5">
                Código SAP: {customer?.sapCode || id}
              </Badge>
              <Badge variant="outline" className="bg-white/10 text-white border-white/20 text-xs">
                {customer?.segmento || 'Estruturas Metálicas'}
              </Badge>
              {customer?.subsegmento && (
                <Badge
                  variant="outline"
                  className="bg-white/5 text-slate-300 border-white/10 text-xs"
                >
                  {customer.subsegmento}
                </Badge>
              )}
              <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs">
                {customer?.status || 'Ativo'}
              </Badge>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-serif text-white tracking-tight mt-1">
              {customer?.razaoSocial || customer?.nomeFantasia}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-300 mt-1">
              <span>
                <strong>Nome Fantasia:</strong> {customer?.nomeFantasia || '—'}
              </span>
              <span>•</span>
              <span>
                <strong>CNPJ:</strong> {customer?.cnpj || '—'}
              </span>
              <span>•</span>
              <span>
                <strong>Local:</strong> {customer?.cidade}/{customer?.uf}
              </span>
              {customer?.grupoEconomico && (
                <>
                  <span>•</span>
                  <span>
                    <strong>Grupo:</strong> {customer.grupoEconomico}
                  </span>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2 pt-2 border-t border-white/10">
              <span>
                Vendedor:{' '}
                <strong className="text-white">{customer?.vendedor || 'Carlos Mendonça'}</strong>
              </span>
              <span>
                Supervisor:{' '}
                <strong className="text-white">{customer?.supervisor || 'Marcos Vinícius'}</strong>
              </span>
            </div>
          </div>

          {/* Ações Rápidas no Cabeçalho */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
            <Button
              onClick={() =>
                navigate(`/conversas?search=${encodeURIComponent(customer?.razaoSocial || '')}`)
              }
              className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg text-sm gap-2"
            >
              <MessageSquare className="w-4 h-4" /> Abrir WhatsApp
            </Button>
            <Button
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-sm gap-2"
              onClick={() => {
                toast({
                  title: 'Chamada VoIP',
                  description: `Iniciando ligação para ${customer?.contatos?.[0]?.telefone || 'comprador'}...`,
                })
              }}
            >
              <Phone className="w-4 h-4" /> Ligar para Comprador
            </Button>
          </div>
        </div>

        {/* Métricas Rápidas SAP */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              Faturamento Histórico
            </span>
            <span className="text-xl font-serif font-bold text-white mt-0.5 block">
              {formatBRL(customer?.faturamento)}
            </span>
            <span className="text-[11px] text-slate-300">
              {customer?.toneladas || 62.5} ton faturadas
            </span>
          </div>
          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              Ticket Médio & Ciclo
            </span>
            <span className="text-xl font-serif font-bold text-white mt-0.5 block">
              {formatBRL(customer?.ticketMedio)}
            </span>
            <span className="text-[11px] text-slate-300">
              Ciclo médio: {customer?.frequenciaDias || 45} dias
            </span>
          </div>
          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              Última Compra SAP
            </span>
            <span className="text-xl font-serif font-bold text-amber-300 mt-0.5 block">
              {customer?.ultimaCompra || '14/08/2024'}
            </span>
            <span className="text-[11px] text-slate-300">
              {biSummary?.daysSinceLastPurchase || 74} dias sem comprar
            </span>
          </div>
          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              Limite de Crédito
            </span>
            <span className="text-xl font-serif font-bold text-emerald-400 mt-0.5 block">
              {customer?.credit?.isAvailable
                ? formatBRL(customer.credit.limiteCredito)
                : 'Crédito não disponível'}
            </span>
            <span className="text-[11px] text-slate-300">
              Saldo livre: {customer?.credit ? formatBRL(customer.credit.saldoDisponivel) : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* NAVEGAÇÃO DE 12 ABAS */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto pb-2">
          <TabsList className="bg-white/80 border border-border/60 p-1 rounded-2xl h-auto flex flex-nowrap min-w-max gap-1">
            <TabsTrigger
              value="visao_geral"
              className="rounded-xl text-xs font-semibold px-3.5 py-2"
            >
              1. Visão Geral
            </TabsTrigger>
            <TabsTrigger value="timeline" className="rounded-xl text-xs font-semibold px-3.5 py-2">
              2. Timeline Omnichannel
            </TabsTrigger>
            <TabsTrigger value="contatos" className="rounded-xl text-xs font-semibold px-3.5 py-2">
              3. Contatos ({customer?.contatos?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="rounded-xl text-xs font-semibold px-3.5 py-2">
              4. WhatsApp
            </TabsTrigger>
            <TabsTrigger value="ligacoes" className="rounded-xl text-xs font-semibold px-3.5 py-2">
              5. Ligações
            </TabsTrigger>
            <TabsTrigger
              value="oportunidades"
              className="rounded-xl text-xs font-semibold px-3.5 py-2"
            >
              6. Oportunidades
            </TabsTrigger>
            <TabsTrigger value="cotacoes" className="rounded-xl text-xs font-semibold px-3.5 py-2">
              7. Cotações SAP ({quotes.length})
            </TabsTrigger>
            <TabsTrigger value="pedidos" className="rounded-xl text-xs font-semibold px-3.5 py-2">
              8. Pedidos SAP ({orders.length})
            </TabsTrigger>
            <TabsTrigger
              value="faturamento"
              className="rounded-xl text-xs font-semibold px-3.5 py-2"
            >
              9. Faturamento
            </TabsTrigger>
            <TabsTrigger value="produtos" className="rounded-xl text-xs font-semibold px-3.5 py-2">
              10. Produtos
            </TabsTrigger>
            <TabsTrigger value="tarefas" className="rounded-xl text-xs font-semibold px-3.5 py-2">
              11. Tarefas
            </TabsTrigger>
            <TabsTrigger
              value="inteligencia"
              className="rounded-xl text-xs font-semibold px-3.5 py-2"
            >
              12. Inteligência IA
            </TabsTrigger>
          </TabsList>
        </div>

        {/* 1. VISÃO GERAL */}
        <TabsContent value="visao_geral" className="flex flex-col gap-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="rounded-2xl border-border/60 bg-white/60 shadow-sm md:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="font-serif text-lg font-bold text-primary">
                  Diagnóstico Comercial & RFM
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                      Segmento RFM
                    </span>
                    <span className="font-bold text-sm text-primary mt-1 block">
                      {biSummary?.rfmSegment || 'Em risco'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                      P(Vivo) BG/NBD
                    </span>
                    <span className="font-bold text-sm text-emerald-600 mt-1 block">
                      {Math.round((biSummary?.pAlive || 0.82) * 100)}%
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                      Score Reativação
                    </span>
                    <span className="font-bold text-sm text-primary mt-1 block">
                      {biSummary?.reactivationScore || 94}/100
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                      Próxima Compra
                    </span>
                    <span className="font-bold text-sm text-primary mt-1 block">
                      Em {biSummary?.expectedNextPurchaseDays || 6} dias
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200/60 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-xs text-primary uppercase tracking-wider block">
                      Recomendação Estratégica IA
                    </span>
                    <p className="text-xs text-foreground/80 mt-1 leading-relaxed">
                      {aiRecommendation?.action ||
                        biSummary?.recommendedAction ||
                        'Ofertar Tubos Inox 304 SCH 10 com preço FOB promocional para pronta-entrega.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/60 bg-white/60 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="font-serif text-lg font-bold text-primary">
                  Crédito & Vendas SAP
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-border/40">
                  <span className="text-muted-foreground">Condição de Pagamento:</span>
                  <span className="font-semibold text-primary">
                    {customer?.credit?.condicaoPagamento || '28 DDL'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/40">
                  <span className="text-muted-foreground">Status do Crédito:</span>
                  <span className="font-semibold text-emerald-600">
                    {customer?.credit?.statusBloqueio || 'Liberado'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/40">
                  <span className="text-muted-foreground">Org. de Vendas:</span>
                  <span className="font-semibold text-primary">
                    {customer?.salesArea?.organizacaoVendas || '1000'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-muted-foreground">Canal de Distribuição:</span>
                  <span className="font-semibold text-primary">
                    {customer?.salesArea?.canalDistribuicao || '10 (Direta)'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 2. TIMELINE OMNICHANNEL */}
        <TabsContent value="timeline" className="mt-4">
          <Card className="rounded-2xl border-border/60 bg-white/60 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="font-serif text-lg font-bold text-primary">
                  Linha do Tempo Unificada
                </h3>
                <p className="text-xs text-muted-foreground">
                  WhatsApp, ligações, e-mails Microsoft 365, visitas, cotações SAP e faturamentos.
                </p>
              </div>

              {/* Filtros da Timeline */}
              <div className="flex items-center gap-1.5 flex-wrap bg-slate-100/80 p-1 rounded-full border border-border/40">
                <Button
                  size="sm"
                  variant={timelineFilter === 'all' ? 'default' : 'ghost'}
                  className="rounded-full text-xs h-7 px-3"
                  onClick={() => setTimelineFilter('all')}
                >
                  Todos
                </Button>
                <Button
                  size="sm"
                  variant={timelineFilter === 'whatsapp' ? 'default' : 'ghost'}
                  className="rounded-full text-xs h-7 px-3"
                  onClick={() => setTimelineFilter('whatsapp')}
                >
                  WhatsApp
                </Button>
                <Button
                  size="sm"
                  variant={timelineFilter === 'phone' ? 'default' : 'ghost'}
                  className="rounded-full text-xs h-7 px-3"
                  onClick={() => setTimelineFilter('phone')}
                >
                  Telefone
                </Button>
                <Button
                  size="sm"
                  variant={timelineFilter === 'email' ? 'default' : 'ghost'}
                  className="rounded-full text-xs h-7 px-3 bg-sky-600 text-white hover:bg-sky-500"
                  onClick={() => setTimelineFilter('email')}
                >
                  <Mail className="w-3 h-3 mr-1" /> E-mail
                </Button>
                <Button
                  size="sm"
                  variant={timelineFilter === 'sap' ? 'default' : 'ghost'}
                  className="rounded-full text-xs h-7 px-3"
                  onClick={() => setTimelineFilter('sap')}
                >
                  SAP
                </Button>
                <Button
                  size="sm"
                  variant={timelineFilter === 'visits' ? 'default' : 'ghost'}
                  className="rounded-full text-xs h-7 px-3"
                  onClick={() => setTimelineFilter('visits')}
                >
                  Visitas
                </Button>
              </div>
            </div>

            <div className="relative pl-6 border-l-2 border-primary/20 space-y-6">
              {filteredTimelineEvents.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  Nenhuma interação encontrada para o filtro selecionado.
                </div>
              ) : (
                filteredTimelineEvents.map((ev) => (
                  <div key={ev.id} className="relative group">
                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-primary ring-4 ring-white" />
                    <div className="bg-white p-4 rounded-2xl border border-border/60 shadow-sm flex flex-col gap-1.5">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-primary">{ev.title}</span>
                          <Badge variant="outline" className={cn('text-[10px]', ev.badgeColor)}>
                            {ev.channel}
                          </Badge>
                          {ev.conversationId && (
                            <Badge
                              variant="outline"
                              className="text-[9px] bg-slate-50 text-slate-500 font-mono"
                            >
                              Thread Microsoft
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">{ev.date}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{ev.summary}</p>
                      <span className="text-[10px] text-slate-400 mt-1">Origem: {ev.origin}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </TabsContent>

        {/* 3. CONTATOS */}
        <TabsContent value="contatos" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customer?.contatos?.map((c, i) => (
              <Card
                key={i}
                className="rounded-2xl border-border/60 bg-white/60 shadow-sm p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-base text-primary">{c.nome}</h4>
                    {c.isPrincipal && (
                      <Badge className="bg-primary text-white text-[10px]">Principal</Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground block mt-0.5">{c.cargo}</span>
                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-3.5 h-3.5 text-primary" /> {c.telefone}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> {c.whatsapp}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="font-semibold text-primary">@</span> {c.email}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4 pt-3 border-t border-border/40">
                  <Button
                    size="sm"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8"
                    onClick={() => navigate(`/conversas?search=${encodeURIComponent(c.nome)}`)}
                  >
                    <MessageSquare className="w-3.5 h-3.5 mr-1" /> WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-primary text-xs h-8"
                    onClick={() =>
                      toast({ title: 'Discando', description: `Ligando para ${c.telefone}` })
                    }
                  >
                    <Phone className="w-3.5 h-3.5 mr-1" /> Ligar
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 4. WHATSAPP */}
        <TabsContent value="whatsapp" className="mt-4">
          <Card className="rounded-2xl border-border/60 bg-white/60 shadow-sm p-6 flex flex-col items-center justify-center text-center gap-4 py-12">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MessageSquare className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-primary">Conversas WhatsApp</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-md">
                Acesse todas as mensagens trocadas com {customer?.razaoSocial} no Inbox integrado.
              </p>
            </div>
            <Button
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
              onClick={() =>
                navigate(`/conversas?search=${encodeURIComponent(customer?.razaoSocial || '')}`)
              }
            >
              Abrir Conversa no WhatsApp →
            </Button>
          </Card>
        </TabsContent>

        {/* 5. LIGAÇÕES */}
        <TabsContent value="ligacoes" className="mt-4">
          <Card className="rounded-2xl border-border/60 bg-white/60 shadow-sm p-6">
            <h3 className="font-serif text-lg font-bold text-primary mb-4">
              Histórico de Ligações Telefônicas
            </h3>
            <div className="divide-y divide-border/40">
              <div className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-primary block">Ligação VoIP Outbound</span>
                  <span className="text-muted-foreground">
                    Duração: 4m 32s · Vendedor: Carlos Mendonça
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-600 block">Atendida</span>
                  <span className="text-muted-foreground">14/10/2024 às 11:30</span>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* 6. OPORTUNIDADES */}
        <TabsContent value="oportunidades" className="mt-4">
          <Card className="rounded-2xl border-border/60 bg-white/60 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-bold text-primary">Oportunidades em Aberto</h3>
              <Button
                size="sm"
                className="bg-primary text-white text-xs"
                onClick={() => navigate('/crm')}
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1" /> Criar Oportunidade
              </Button>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
              <div>
                <span className="font-bold text-primary block">
                  Fornecimento de Tubos Inox SCH 10 para Safra
                </span>
                <span className="text-muted-foreground">
                  Fase: Proposta Comercial · Potencial: R$ 54.000,00
                </span>
              </div>
              <Badge className="bg-blue-100 text-blue-800 border-none">Em Negociação</Badge>
            </div>
          </Card>
        </TabsContent>

        {/* 7. COTAÇÕES SAP */}
        <TabsContent value="cotacoes" className="mt-4">
          <div className="flex flex-col gap-3">
            {quotes.map((q) => (
              <Card
                key={q.documentNumber}
                className="rounded-2xl border-border/60 bg-white/60 shadow-sm p-5"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-primary">
                      {q.documentNumber}
                    </span>
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                      {q.status === 'em_aberto' ? 'Em Aberto' : 'Vencida'}
                    </Badge>
                  </div>
                  <span className="font-serif font-bold text-lg text-primary">
                    {formatBRL(q.valorTotal)}
                  </span>
                </div>
                <div className="mt-3 divide-y divide-border/30 text-xs">
                  {q.items.map((it, idx) => (
                    <div key={idx} className="py-2 flex justify-between text-muted-foreground">
                      <span>{it.descricao}</span>
                      <span className="font-semibold text-primary">
                        {it.quantidade} {it.unidade} a R$ {it.precoUnitario.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 8. PEDIDOS SAP */}
        <TabsContent value="pedidos" className="mt-4">
          <div className="flex flex-col gap-3">
            {orders.map((o) => (
              <Card
                key={o.documentNumber}
                className="rounded-2xl border-border/60 bg-white/60 shadow-sm p-5"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-primary">
                      {o.documentNumber}
                    </span>
                    <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700">
                      {o.status.toUpperCase()}
                    </Badge>
                  </div>
                  <span className="font-serif font-bold text-lg text-primary">
                    {formatBRL(o.valorTotal)}
                  </span>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  Data do Pedido: {o.createdAt} · Previsão de Entrega: {o.deliveryDate}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 9. FATURAMENTO */}
        <TabsContent value="faturamento" className="mt-4">
          <div className="flex flex-col gap-3">
            {billings.map((b) => (
              <Card
                key={b.invoiceNumber}
                className="rounded-2xl border-border/60 bg-white/60 shadow-sm p-5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-sm text-primary block">{b.invoiceNumber}</span>
                    <span className="text-xs text-muted-foreground">
                      Ref. Pedido: {b.documentNumber}
                    </span>
                  </div>
                  <span className="font-serif font-bold text-lg text-emerald-600">
                    {formatBRL(b.valorTotal)}
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground mt-2 block">
                  Chave NFe: {b.chaveAcessoNFe}
                </span>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 10. PRODUTOS */}
        <TabsContent value="produtos" className="mt-4">
          <Card className="rounded-2xl border-border/60 bg-white/60 shadow-sm p-5">
            <h4 className="font-serif font-bold text-base text-primary mb-3">
              Histórico por Família e Materiais
            </h4>
            <div className="divide-y divide-border/40 text-xs">
              <div className="py-3 flex justify-between items-center">
                <div>
                  <span className="font-bold text-primary block">
                    Tubo Inox AISI 304 Redondo SCH 10 2"
                  </span>
                  <span className="text-muted-foreground">
                    Família: Tubos Inox · Histórico: 28.4 ton
                  </span>
                </div>
                <Badge className="bg-emerald-100 text-emerald-800 border-none">
                  Estoque CIAFAL OK
                </Badge>
              </div>
              <div className="py-3 flex justify-between items-center">
                <div>
                  <span className="font-bold text-primary block">
                    Chapa Inox AISI 304 3.00mm Escovada
                  </span>
                  <span className="text-muted-foreground">
                    Família: Chapas Inox · Histórico: 34.1 ton
                  </span>
                </div>
                <Badge className="bg-emerald-100 text-emerald-800 border-none">
                  Estoque CIAFAL OK
                </Badge>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* 11. TAREFAS */}
        <TabsContent value="tarefas" className="mt-4">
          <Card className="rounded-2xl border-border/60 bg-white/60 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-serif font-bold text-base text-primary">Tarefas Vinculadas</h4>
              <Button
                size="sm"
                className="bg-primary text-white text-xs"
                onClick={() => navigate('/tarefas')}
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1" /> Nova Tarefa
              </Button>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
              <div>
                <span className="font-semibold text-primary block">
                  Follow-up de cotação de tubos
                </span>
                <span className="text-muted-foreground">Vencimento: Amanhã às 17h00</span>
              </div>
              <Badge variant="outline" className="text-amber-700 bg-amber-50">
                Alta Prioridade
              </Badge>
            </div>
          </Card>
        </TabsContent>

        {/* 12. INTELIGÊNCIA IA */}
        <TabsContent value="inteligencia" className="mt-4">
          <Card className="rounded-2xl border-border/60 bg-white/60 shadow-sm p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary text-white">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-primary">
                  CIAFAL AI Copilot Intelligence
                </h3>
                <p className="text-xs text-muted-foreground">
                  Modelo preditivo BG/NBD + Gamma-Gamma com leitura em tempo real.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <span className="font-bold text-primary block uppercase tracking-wider">
                Justificativa da Ação
              </span>
              <p className="text-foreground/80 leading-relaxed">
                {aiRecommendation?.justification ||
                  'Cliente inativo há 74 dias com ciclo médio de 45 dias. Estoque com alta cobertura e margem atrativa.'}
              </p>
              <div className="pt-2 border-t border-slate-200 mt-2">
                <span className="font-bold text-slate-600 block mb-1">Evidências Analíticas:</span>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  {aiRecommendation?.evidence?.map((ev: string, idx: number) => (
                    <li key={idx}>{ev}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
