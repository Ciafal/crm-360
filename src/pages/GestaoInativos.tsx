import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  RefreshCw,
  Search,
  Filter,
  Users,
  DollarSign,
  TrendingUp,
  Package,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Phone,
  MessageSquare,
  AlertTriangle,
  ChevronRight,
  SlidersHorizontal,
  FileSpreadsheet,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { useBI } from '@/hooks/use-bi'
import { useAuth } from '@/hooks/use-auth'
import { useDailyActions } from '@/hooks/use-daily-actions'
import { useToast } from '@/hooks/use-toast'
import { Customer360Sheet } from '@/components/inativos/Customer360Sheet'
import type { BICustomerSummary, BIFilters } from '@/providers/BIProvider'
import { cn } from '@/lib/utils'

export default function GestaoInativos() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const { loading, dailySummary, inactiveCustomers, isDemoData, health, loadData } = useBI(user?.id)

  const { createAction } = useDailyActions()

  // Filtros
  const [search, setSearch] = useState('')
  const [inactivityFilter, setInactivityFilter] = useState<string>('todos')
  const [segmentFilter, setSegmentFilter] = useState<string>('todos')
  const [selectedSeller, setSelectedSeller] = useState<string>('meus')

  // Estado do Drawer 360
  const [selectedCustomer, setSelectedCustomer] = useState<BICustomerSummary | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  // Sub-abas da página
  const [activeTab, setActiveTab] = useState<
    'fila' | 'recorrencia' | 'evolucao' | 'rfm' | 'produtos'
  >('fila')

  // Abre drawer se veio cliente na query string
  useEffect(() => {
    const custId = searchParams.get('cliente')
    if (custId && inactiveCustomers.length > 0) {
      const found = inactiveCustomers.find((c) => c.customerId === custId)
      if (found) {
        setSelectedCustomer(found)
        setSheetOpen(true)
      }
    }
  }, [searchParams, inactiveCustomers])

  const filteredCustomers = useMemo(() => {
    let list = [...inactiveCustomers]

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (c) =>
          c.customerName.toLowerCase().includes(q) ||
          c.customerId.toLowerCase().includes(q) ||
          (c.city && c.city.toLowerCase().includes(q)) ||
          (c.cnpj && c.cnpj.includes(q)),
      )
    }

    if (inactivityFilter !== 'todos') {
      const days = parseInt(inactivityFilter, 10)
      if (days === 180) {
        list = list.filter((c) => c.daysSinceLastPurchase >= 180)
      } else {
        list = list.filter(
          (c) => c.daysSinceLastPurchase >= days && c.daysSinceLastPurchase < days + 30,
        )
      }
    }

    if (segmentFilter !== 'todos') {
      list = list.filter((c) => c.segment === segmentFilter)
    }

    return list.sort((a, b) => b.reactivationScore - a.reactivationScore)
  }, [inactiveCustomers, search, inactivityFilter, segmentFilter])

  const formatBRL = (val?: number) => {
    if (!val) return 'R$ 0'
    return val.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    })
  }

  // Se o usuário logado for vendedor e não supervisor/gerente, fixa apenas sua carteira
  const isVendedorOnly = user?.role === 'vendedor'

  const handleGenerateAction = async (customer: BICustomerSummary) => {
    if (!user) return
    try {
      await createAction({
        seller_id: user.id,
        customer_id: customer.customerId,
        customer_name: customer.customerName,
        action_type: 'atacar_agora',
        priority: customer.reactivationScore,
        recommendation: customer.recommendedAction || 'Reativação comercial prioritária',
        rationale:
          customer.reason ||
          `Cliente inativo há ${customer.daysSinceLastPurchase} dias com potencial de ${formatBRL(customer.expectedValue)}.`,
        source: 'qlik',
        confidence: customer.pAlive,
        potential_revenue: customer.expectedValue,
        potential_tons: customer.historicalTons ? customer.historicalTons / 5 : 5,
        product_family: customer.products?.[0]?.family || 'Aços & Inox',
        due_at: new Date().toISOString(),
      })
      toast({
        title: 'Ação comercial criada!',
        description: `${customer.customerName} adicionado às Ações do Dia no Meu Dia.`,
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao criar ação',
        description: err.message,
        variant: 'destructive',
      })
    }
  }

  // Segmentos únicos para filtro
  const uniqueSegments = useMemo(() => {
    const set = new Set<string>()
    inactiveCustomers.forEach((c) => {
      if (c.segment) set.add(c.segment)
    })
    return Array.from(set)
  }, [inactiveCustomers])

  // Dados para RFM
  const rfmGroups = useMemo(() => {
    const map: Record<string, { count: number; totalRev: number; actions: string }> = {
      Campeões: {
        count: 0,
        totalRev: 0,
        actions: 'Ligar direto para Diretoria, ofertar lotes FOB especiais',
      },
      Leais: {
        count: 0,
        totalRev: 0,
        actions: 'Oferecer pronta-entrega, renegociar prazo de pagamento',
      },
      Potenciais: {
        count: 0,
        totalRev: 0,
        actions: 'Apresentar linha completa de Inox e Aços Especiais',
      },
      'Precisam de atenção': {
        count: 0,
        totalRev: 0,
        actions: 'Desbloquear limites e resolver restrições financeiras',
      },
      'Em risco': {
        count: 0,
        totalRev: 0,
        actions: 'Ataque imediato via WhatsApp com tabela promocional',
      },
      'Prestes a hibernar': {
        count: 0,
        totalRev: 0,
        actions: 'Agendar visita técnica para mapear troca de fornecedor',
      },
      Hibernando: { count: 0, totalRev: 0, actions: 'Campanha de reativação sazonal pré-safra' },
      Perdidos: { count: 0, totalRev: 0, actions: 'Auditoria de motivos de perda no CRM' },
    }

    inactiveCustomers.forEach((c) => {
      const seg = c.rfmSegment || 'Em risco'
      if (!map[seg]) {
        map[seg] = {
          count: 0,
          totalRev: 0,
          actions: 'Revisar histórico e retomar contato comercial',
        }
      }
      map[seg].count += 1
      map[seg].totalRev += c.historicalRevenue || 0
    })

    return map
  }, [inactiveCustomers])

  // Produtos parados consolidados
  const stoppedProducts = useMemo(() => {
    const map: Record<
      string,
      {
        code: string
        desc: string
        family: string
        clients: number
        tons: number
        inStock: boolean
        priceKg?: number
      }
    > = {}

    inactiveCustomers.forEach((c) => {
      c.products?.forEach((p) => {
        if (p.stopped) {
          if (!map[p.code]) {
            map[p.code] = {
              code: p.code,
              desc: p.description,
              family: p.family,
              clients: 0,
              tons: 0,
              inStock: !!p.stockAvailable,
              priceKg: p.priceKg,
            }
          }
          map[p.code].clients += 1
          map[p.code].tons += p.historicalTons || 0
        }
      })
    })

    return Object.values(map).sort((a, b) => b.tons - a.tons)
  }, [inactiveCustomers])

  const monthsHeader = [
    'Nov/23',
    'Dez/23',
    'Jan/24',
    'Fev/24',
    'Mar/24',
    'Abr/24',
    'Mai/24',
    'Jun/24',
    'Jul/24',
    'Ago/24',
    'Set/24',
    'Out/24',
  ]

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in pb-16">
      {/* Topo / Header da Subaplicação */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 rounded-xl">
              <RefreshCw className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-3xl font-bold text-primary tracking-tight">
                  Gestão de Inativos
                </h1>
                {isDemoData && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-amber-50 text-amber-700 border-amber-300"
                  >
                    Dados demonstrativos Qlik
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground font-sans mt-0.5">
                Inteligência preditiva para recuperação de contas inativas, quebra de recorrência e
                mix abandonado.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-border/50 rounded-full shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Última atualização: {new Date().toLocaleDateString('pt-BR')} 08:30</span>
          </div>
        </div>
      </div>

      {/* Filtros Operacionais Superiores */}
      <Card className="bg-white/70 backdrop-blur-md border-border/40 shadow-xs rounded-2xl p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente, CNPJ ou cidade..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 text-xs rounded-xl"
            />
          </div>

          <div>
            <Select value={inactivityFilter} onValueChange={setInactivityFilter}>
              <SelectTrigger className="h-10 text-xs rounded-xl">
                <SelectValue placeholder="Período de Inatividade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as inatividades</SelectItem>
                <SelectItem value="60">60 a 90 dias</SelectItem>
                <SelectItem value="90">90 a 120 dias</SelectItem>
                <SelectItem value="120">120 a 180 dias</SelectItem>
                <SelectItem value="180">180+ dias (Hibernando)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select value={segmentFilter} onValueChange={setSegmentFilter}>
              <SelectTrigger className="h-10 text-xs rounded-xl">
                <SelectValue placeholder="Segmento Industrial" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os segmentos</SelectItem>
                {uniqueSegments.map((seg) => (
                  <SelectItem key={seg} value={seg}>
                    {seg}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select
              value={selectedSeller}
              onValueChange={setSelectedSeller}
              disabled={isVendedorOnly}
            >
              <SelectTrigger className="h-10 text-xs rounded-xl">
                <SelectValue placeholder="Vendedor Responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="meus">Minha Carteira ({user?.name || 'Vendedor'})</SelectItem>
                {!isVendedorOnly && <SelectItem value="equipe">Toda a Equipe Comercial</SelectItem>}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('')
                setInactivityFilter('todos')
                setSegmentFilter('todos')
                setSelectedSeller('meus')
              }}
              className="h-10 text-xs rounded-xl flex-1 text-muted-foreground"
            >
              Limpar Filtros
            </Button>
          </div>
        </div>
      </Card>

      {/* C.2.2 KPIs Principais (Cards Horizontais) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card className="bg-white/80 border-border/40 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Clientes Inativos
          </span>
          <span className="font-serif text-3xl font-bold text-rose-600 mt-1 block">
            {dailySummary?.inactiveClients || 18}
          </span>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">
            de 60 clientes na carteira
          </span>
        </Card>

        <Card className="bg-white/80 border-border/40 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">
            Potencial Recuperável
          </span>
          <span className="font-serif text-2xl font-bold text-primary mt-1 block">
            {formatBRL(dailySummary?.recoverablePotential || 4670000)}
          </span>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">
            Valor em risco analítico
          </span>
        </Card>

        <Card className="bg-white/80 border-border/40 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
            Elegíveis p/ Abordagem
          </span>
          <span className="font-serif text-3xl font-bold text-emerald-600 mt-1 block">
            {dailySummary?.eligibleForContact || 14}
          </span>
          <span className="text-[11px] text-emerald-700 font-semibold mt-0.5 block">
            Score &gt; 70 + Estoque OK
          </span>
        </Card>

        <Card className="bg-white/80 border-border/40 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Reativados (Mês)
          </span>
          <span className="font-serif text-3xl font-bold text-primary mt-1 block">
            {dailySummary?.reactivatedThisMonth || 5}
          </span>
          <Badge
            variant="outline"
            className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300 mt-1"
          >
            Taxa {dailySummary?.reactivationRate || 27.7}%
          </Badge>
        </Card>

        <Card className="bg-white/80 border-border/40 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">
            Receita Recuperada
          </span>
          <span className="font-serif text-2xl font-bold text-primary mt-1 block">
            {formatBRL(dailySummary?.revenueRecovered || 312500)}
          </span>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">
            {dailySummary?.tonsRecovered || 41.8} ton recuperadas
          </span>
        </Card>

        <Card className="bg-white/80 border-border/40 rounded-2xl p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Crédito & Estoque
          </span>
          <span className="font-serif text-3xl font-bold text-primary mt-1 block">94%</span>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">
            Cobertura média de mix
          </span>
        </Card>
      </div>

      {/* SEÇÃO SUPERVISÃO: TOP OPORTUNIDADES DE REATIVAÇÃO DA EQUIPE */}
      <Card className="rounded-3xl border-border/60 bg-white/90 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h3 className="font-serif text-lg font-bold text-primary">
                Top Oportunidades de Reativação da Equipe (Visão Supervisor)
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Priorização por score combinado de probabilidade P(vivo), valor esperado e cobertura
              de estoque.
            </p>
          </div>
          <Badge className="bg-primary/10 text-primary border-primary/20 text-xs w-fit">
            Feedback Loop Omnichannel Ativo
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/40">
              <tr>
                <th className="py-2.5 px-3 font-bold">Cliente</th>
                <th className="py-2.5 px-3 font-bold">Vendedor</th>
                <th className="py-2.5 px-3 font-bold text-center">Score</th>
                <th className="py-2.5 px-3 font-bold text-center">P(vivo)</th>
                <th className="py-2.5 px-3 font-bold text-right">Potencial R$</th>
                <th className="py-2.5 px-3 font-bold">Ação Recomendada</th>
                <th className="py-2.5 px-3 font-bold text-center">Status Feedback</th>
                <th className="py-2.5 px-3 font-bold text-right">360º</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {inactiveCustomers.slice(0, 4).map((c, idx) => (
                <tr key={c.customerId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-primary">
                    {c.customerName}
                    <span className="text-[10px] text-muted-foreground block">{c.customerId}</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-700">Carlos Mendonça</td>
                  <td className="py-2.5 px-3 text-center">
                    <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold border-none">
                      {c.reactivationScore}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-semibold text-primary">
                    {Math.round(c.pAlive * 100)}%
                  </td>
                  <td className="py-2.5 px-3 text-right font-serif font-bold text-primary">
                    {formatBRL(c.expectedValue)}
                  </td>
                  <td
                    className="py-2.5 px-3 text-slate-600 max-w-xs truncate"
                    title={c.recommendedAction}
                  >
                    {c.recommendedAction}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-blue-50 text-blue-700 border-blue-200"
                    >
                      Recomendado → Proposta
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs text-primary hover:bg-primary/10"
                      onClick={() => navigate(`/cliente/${c.customerId}`)}
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1" /> Ver 360º
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Abas Principais da Subaplicação */}
      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full">
        <TabsList className="bg-white/70 border border-border/50 p-1 rounded-2xl w-full sm:w-auto flex flex-wrap gap-1">
          <TabsTrigger value="fila" className="text-xs font-semibold rounded-xl px-4 py-2">
            Fila Prioritária ({filteredCustomers.length})
          </TabsTrigger>
          <TabsTrigger value="recorrencia" className="text-xs font-semibold rounded-xl px-4 py-2">
            Mapa de Recorrência (12M)
          </TabsTrigger>
          <TabsTrigger value="evolucao" className="text-xs font-semibold rounded-xl px-4 py-2">
            Evolução de Compradores
          </TabsTrigger>
          <TabsTrigger value="rfm" className="text-xs font-semibold rounded-xl px-4 py-2">
            Segmentação RFM
          </TabsTrigger>
          <TabsTrigger value="produtos" className="text-xs font-semibold rounded-xl px-4 py-2">
            Mix Abandonado ({stoppedProducts.length})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: FILA PRIORITÁRIA DE REATIVAÇÃO */}
        <TabsContent value="fila" className="mt-4 flex flex-col gap-4">
          <Card className="bg-white/80 backdrop-blur-md border-border/40 shadow-sm rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/90 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/40">
                  <tr>
                    <th className="py-3 px-4 font-bold"># / Score</th>
                    <th className="py-3 px-4 font-bold">Cliente</th>
                    <th className="py-3 px-4 font-bold">Dias Inativo</th>
                    <th className="py-3 px-4 font-bold">Histórico</th>
                    <th className="py-3 px-4 font-bold">Potencial R$</th>
                    <th className="py-3 px-4 font-bold">P(vivo)</th>
                    <th className="py-3 px-4 font-bold">Crédito</th>
                    <th className="py-3 px-4 font-bold">Estoque</th>
                    <th className="py-3 px-4 font-bold">Ação Recomendada</th>
                    <th className="py-3 px-4 font-bold text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={10} className="p-4">
                          <Skeleton className="h-8 w-full" />
                        </td>
                      </tr>
                    ))
                  ) : filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-muted-foreground">
                        Nenhum cliente encontrado com os filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((cust, idx) => (
                      <tr
                        key={cust.customerId}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                        onClick={() => {
                          setSelectedCustomer(cust)
                          setSheetOpen(true)
                        }}
                      >
                        {/* Score */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-muted-foreground text-[11px] font-semibold w-4">
                              {idx + 1}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                'font-bold font-serif text-xs px-2',
                                cust.reactivationScore >= 85
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                  : cust.reactivationScore >= 75
                                    ? 'bg-blue-50 text-blue-700 border-blue-300'
                                    : 'bg-amber-50 text-amber-700 border-amber-300',
                              )}
                            >
                              {cust.reactivationScore}
                            </Badge>
                          </div>
                        </td>

                        {/* Cliente */}
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-primary text-sm group-hover:text-primary/80">
                              {cust.customerName}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {cust.customerId} · {cust.city}/{cust.uf}
                            </span>
                          </div>
                        </td>

                        {/* Inatividade */}
                        <td className="py-3 px-4">
                          <span className="font-semibold text-rose-600 block">
                            {cust.daysSinceLastPurchase} dias
                          </span>
                          <span className="text-[10px] text-muted-foreground block">
                            Última: {cust.lastPurchaseDate}
                          </span>
                        </td>

                        {/* Histórico */}
                        <td className="py-3 px-4">
                          <span className="font-semibold text-primary block">
                            {formatBRL(cust.historicalRevenue)}
                          </span>
                          <span className="text-[10px] text-muted-foreground block">
                            {cust.historicalTons} ton · {cust.frequency}d ciclo
                          </span>
                        </td>

                        {/* Potencial R$ */}
                        <td className="py-3 px-4">
                          <span className="font-bold text-primary font-serif text-sm block">
                            {formatBRL(cust.expectedValue)}
                          </span>
                          <span className="text-[10px] text-emerald-700 font-semibold block">
                            Em {cust.expectedNextPurchaseDays} dias
                          </span>
                        </td>

                        {/* P(vivo) */}
                        <td className="py-3 px-4 font-mono font-semibold">
                          {Math.round(cust.pAlive * 100)}%
                        </td>

                        {/* Crédito */}
                        <td className="py-3 px-4">
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px]',
                              cust.creditStatus === 'liberado'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200',
                            )}
                          >
                            {cust.creditStatus === 'liberado' ? 'Liberado' : 'Em análise'}
                          </Badge>
                        </td>

                        {/* Estoque */}
                        <td className="py-3 px-4">
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-slate-100 text-slate-700"
                          >
                            {cust.stockCoveragePercent || 90}% pronto
                          </Badge>
                        </td>

                        {/* Ação Recomendada */}
                        <td className="py-3 px-4 max-w-xs">
                          <p
                            className="text-xs text-slate-700 truncate"
                            title={cust.recommendedAction}
                          >
                            {cust.recommendedAction}
                          </p>
                        </td>

                        {/* Botão Ação */}
                        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs"
                            onClick={() => handleGenerateAction(cust)}
                          >
                            Criar Ação
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* TAB 2: MAPA DE RECORRÊNCIA (GRADE 12 MESES) */}
        <TabsContent value="recorrencia" className="mt-4 flex flex-col gap-4">
          <Card className="bg-white/80 border-border/40 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif font-bold text-lg text-primary">
                  Grade de Compras Mensais por Cliente (12 Meses)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Verde escuro = mês com alto volume de compra; Cinza = ausência de pedido.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/40 text-muted-foreground text-[10px] uppercase">
                    <th className="py-2.5 px-3 text-left font-bold min-w-[200px]">Cliente</th>
                    {monthsHeader.map((m) => (
                      <th key={m} className="py-2.5 px-2 text-center font-bold">
                        {m}
                      </th>
                    ))}
                    <th className="py-2.5 px-3 text-right font-bold">Status Atual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {filteredCustomers.slice(0, 12).map((cust) => {
                    const months = cust.recurrenceMonths || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
                    return (
                      <tr
                        key={cust.customerId}
                        className="hover:bg-slate-50 cursor-pointer"
                        onClick={() => {
                          setSelectedCustomer(cust)
                          setSheetOpen(true)
                        }}
                      >
                        <td className="py-2.5 px-3 font-semibold text-primary">
                          <span className="block truncate">{cust.customerName}</span>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {cust.customerId}
                          </span>
                        </td>
                        {months.map((bought, i) => (
                          <td key={i} className="py-2.5 px-2 text-center">
                            <div
                              className={cn(
                                'w-7 h-7 mx-auto rounded-lg flex items-center justify-center font-bold text-[10px]',
                                bought
                                  ? 'bg-emerald-500 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-300',
                              )}
                            >
                              {bought ? '✓' : '—'}
                            </div>
                          </td>
                        ))}
                        <td className="py-2.5 px-3 text-right">
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-rose-50 text-rose-700 border-rose-300"
                          >
                            {cust.daysSinceLastPurchase}d sem compra
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* TAB 3: EVOLUÇÃO DE CLIENTES ATIVOS */}
        <TabsContent value="evolucao" className="mt-4 flex flex-col gap-4">
          <Card className="bg-white/80 border-border/40 rounded-2xl p-6 shadow-sm">
            <h3 className="font-serif font-bold text-lg text-primary">
              Evolução da Carteira de Clientes Compradores
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5 mb-6">
              Acompanhamento mensal de clientes ativos vs. clientes em queda de recompra.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs text-muted-foreground block">Média Compradores / Mês</span>
                <span className="font-serif text-2xl font-bold text-primary mt-1 block">
                  42 contas
                </span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs text-muted-foreground block">Queda no Q3</span>
                <span className="font-serif text-2xl font-bold text-rose-600 mt-1 block">
                  -18 contas
                </span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs text-muted-foreground block">Reativadas no Q4</span>
                <span className="font-serif text-2xl font-bold text-emerald-600 mt-1 block">
                  +5 contas
                </span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs text-muted-foreground block">Meta Reativação Q4</span>
                <span className="font-serif text-2xl font-bold text-primary mt-1 block">
                  14 contas
                </span>
              </div>
            </div>

            <div className="h-48 flex items-end justify-between gap-2 pt-6 border-t border-border/30">
              {[38, 41, 45, 44, 46, 48, 42, 39, 36, 37, 40, 42].map((val, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[11px] font-bold text-primary">{val}</span>
                  <div
                    className="w-full max-w-[36px] bg-primary rounded-t-md hover:bg-primary/80 transition-all"
                    style={{ height: `${(val / 50) * 120}px` }}
                  />
                  <span className="text-[10px] text-muted-foreground uppercase">
                    {monthsHeader[idx].split('/')[0]}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* TAB 4: SEGMENTAÇÃO RFM */}
        <TabsContent value="rfm" className="mt-4 flex flex-col gap-4">
          <Card className="bg-white/80 border-border/40 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-border/40">
              <h3 className="font-serif font-bold text-lg text-primary">
                Matriz RFM da Carteira Inativa
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Segmentação baseada em Recência (dias), Frequência (pedidos/ano) e Monetário
                (faturamento total).
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-muted-foreground text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 font-bold">Segmento RFM</th>
                    <th className="py-3 px-4 font-bold text-center">Clientes</th>
                    <th className="py-3 px-4 font-bold text-center">% Carteira</th>
                    <th className="py-3 px-4 font-bold">Faturamento Médio</th>
                    <th className="py-3 px-4 font-bold">Estratégia Recomendada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {Object.entries(rfmGroups).map(([segment, data]) => (
                    <tr key={segment} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-bold text-primary flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                        {segment}
                      </td>
                      <td className="py-3 px-4 text-center font-serif text-sm font-bold text-primary">
                        {data.count}
                      </td>
                      <td className="py-3 px-4 text-center text-muted-foreground">
                        {inactiveCustomers.length > 0
                          ? Math.round((data.count / inactiveCustomers.length) * 100)
                          : 0}
                        %
                      </td>
                      <td className="py-3 px-4 font-semibold text-primary">
                        {data.count > 0 ? formatBRL(data.totalRev / data.count) : 'R$ 0'}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{data.actions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* TAB 5: MIX ABANDONADO */}
        <TabsContent value="produtos" className="mt-4 flex flex-col gap-4">
          <Card className="bg-white/80 border-border/40 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-border/40 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-lg text-primary">
                  Produtos que Deixaram de Ser Comprados
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Consolidação dos SKUs abandonados pelos clientes com verificação de estoque
                  CIAFAL.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-muted-foreground text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 font-bold">Código SKU</th>
                    <th className="py-3 px-4 font-bold">Descrição do Produto</th>
                    <th className="py-3 px-4 font-bold">Família</th>
                    <th className="py-3 px-4 font-bold text-center">Clientes Parados</th>
                    <th className="py-3 px-4 font-bold">Volume Histórico</th>
                    <th className="py-3 px-4 font-bold">Estoque</th>
                    <th className="py-3 px-4 font-bold text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {stoppedProducts.map((p) => (
                    <tr key={p.code} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-mono font-bold text-primary">{p.code}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">{p.desc}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-[10px] bg-slate-100">
                          {p.family}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-rose-600">{p.clients}</td>
                      <td className="py-3 px-4 font-semibold text-primary">{p.tons} ton</td>
                      <td className="py-3 px-4">
                        {p.inStock ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300"
                          >
                            Disponível
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-amber-50 text-amber-700 border-amber-300"
                          >
                            Sob Consulta
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-xs text-primary font-semibold hover:bg-primary/10"
                          onClick={() => {
                            setSearch(p.code)
                            setActiveTab('fila')
                          }}
                        >
                          Ver Clientes
                          <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Drawer Visão 360 do Inativo */}
      <Customer360Sheet
        customer={selectedCustomer}
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open)
          if (!open) {
            searchParams.delete('cliente')
            setSearchParams(searchParams)
          }
        }}
        onGenerateAction={handleGenerateAction}
        onOpenConversas={(name) => navigate(`/conversas?search=${encodeURIComponent(name)}`)}
      />
    </div>
  )
}
