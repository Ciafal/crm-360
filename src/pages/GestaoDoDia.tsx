import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  TrendingUp,
  Target,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  ChevronRight,
  PlusCircle,
  Calendar,
  Sparkles,
  MessageSquare,
  Phone,
  RotateCcw,
  UserCheck,
  FileText,
  DollarSign,
  Layers,
  Search,
  Eye,
  Filter,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { defaultBIProvider } from '@/providers/QlikProvider'
import { defaultAIProvider } from '@/providers/LocalAIAdapter'
import { cn } from '@/lib/utils'

interface SellerKPI {
  id: string
  name: string
  role: string
  avatar?: string
  plannedActions: number
  completedActions: number
  pendingActions: number
  overdueActions: number
  rescheduledActions: number
  opportunities: number
  potentialRevenue: number
  potentialTons: number
  conversionRate: number
}

const MOCK_SELLERS: SellerKPI[] = [
  {
    id: 'vendedor-001',
    name: 'Carlos Mendonça',
    role: 'Vendedor Sênior',
    plannedActions: 10,
    completedActions: 8,
    pendingActions: 1,
    overdueActions: 1,
    rescheduledActions: 0,
    opportunities: 3,
    potentialRevenue: 485000,
    potentialTons: 62.5,
    conversionRate: 80,
  },
  {
    id: 'vendedor-002',
    name: 'Mariana Azevedo',
    role: 'Vendedora Pleno',
    plannedActions: 8,
    completedActions: 6,
    pendingActions: 2,
    overdueActions: 0,
    rescheduledActions: 1,
    opportunities: 2,
    potentialRevenue: 340000,
    potentialTons: 44.0,
    conversionRate: 75,
  },
  {
    id: 'vendedor-003',
    name: 'Lucas Brandão',
    role: 'Vendedor Júnior',
    plannedActions: 6,
    completedActions: 4,
    pendingActions: 2,
    overdueActions: 1,
    rescheduledActions: 1,
    opportunities: 1,
    potentialRevenue: 210000,
    potentialTons: 28.0,
    conversionRate: 66,
  },
  {
    id: 'vendedor-004',
    name: 'Juliana Paes',
    role: 'Especialista Inox',
    plannedActions: 9,
    completedActions: 8,
    pendingActions: 0,
    overdueActions: 0,
    rescheduledActions: 1,
    opportunities: 4,
    potentialRevenue: 620000,
    potentialTons: 82.0,
    conversionRate: 88,
  },
  {
    id: 'vendedor-005',
    name: 'Rafael Guimarães',
    role: 'Vendedor Pleno',
    plannedActions: 7,
    completedActions: 4,
    pendingActions: 2,
    overdueActions: 1,
    rescheduledActions: 0,
    opportunities: 1,
    potentialRevenue: 195000,
    potentialTons: 25.0,
    conversionRate: 57,
  },
]

export default function GestaoDoDia() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [dateFilter, setDateFilter] = useState<'hoje' | 'ontem' | '7dias' | 'custom'>('hoje')
  const [selectedSeller, setSelectedSeller] = useState<SellerKPI | null>(null)
  const [search, setSearch] = useState('')
  const [managerActionOpen, setManagerActionOpen] = useState(false)
  const [actionFormData, setActionFormData] = useState({
    customerId: '',
    customerName: '',
    recommendation: '',
    managerNote: '',
    priority: 5,
  })

  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    })
  }

  // KPIs consolidados da equipe
  const totals = useMemo(() => {
    return MOCK_SELLERS.reduce(
      (acc, s) => {
        acc.sellersCount += 1
        acc.planned += s.plannedActions
        acc.completed += s.completedActions
        acc.pending += s.pendingActions
        acc.overdue += s.overdueActions
        acc.rescheduled += s.rescheduledActions
        acc.opportunities += s.opportunities
        acc.potentialRevenue += s.potentialRevenue
        acc.potentialTons += s.potentialTons
        return acc
      },
      {
        sellersCount: 0,
        planned: 0,
        completed: 0,
        pending: 0,
        overdue: 0,
        rescheduled: 0,
        opportunities: 0,
        potentialRevenue: 0,
        potentialTons: 0,
      },
    )
  }, [])

  // Compromissos comerciais do Microsoft 365
  const commercialMeetings = useMemo(() => {
    return [
      {
        id: 'mtg-1',
        seller: 'Carlos Mendonça',
        title: 'Reunião Comercial de Alinhamento Safra - Metalúrgica Santa Rita',
        time: '14:30 - 15:30',
        type: 'Microsoft Teams',
        customer: 'Metalúrgica Santa Rita Ltda',
        isCommercial: true,
      },
      {
        id: 'mtg-2',
        seller: 'Carlos Mendonça',
        title: 'Visita Técnica e Negociação Inox 316L - Tanques Paulista',
        time: 'Amanhã às 10:00',
        type: 'Presencial / Sertãozinho',
        customer: 'Caldeiraria & Tanques Industrial Paulista',
        isCommercial: true,
      },
    ]
  }, [])

  const filteredSellers = useMemo(() => {
    if (!search) return MOCK_SELLERS
    return MOCK_SELLERS.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
  }, [search])

  const handleCreateManagerAction = () => {
    if (!actionFormData.customerName || !actionFormData.recommendation) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Informe o cliente e a recomendação comercial.',
        variant: 'destructive',
      })
      return
    }

    toast({
      title: 'Ação Gerencial Atribuída',
      description: `Ação para ${actionFormData.customerName} enviada para ${selectedSeller?.name}. Origem auditada (MANAGER_ASSIGNED).`,
    })
    setManagerActionOpen(false)
    setActionFormData({
      customerId: '',
      customerName: '',
      recommendation: '',
      managerNote: '',
      priority: 5,
    })
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 pb-20 animate-fade-in">
      {/* Banner de Modo Gerencial se Vendedor Selecionado */}
      {selectedSeller && (
        <div className="bg-primary text-white p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-blue-200 block">
                Visualização Gerencial do Supervisor
              </span>
              <p className="text-sm font-semibold text-white">
                Visualizando Meu Dia de: <strong>{selectedSeller.name}</strong> · Data:{' '}
                {new Date().toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/30 text-xs"
              onClick={() => {
                setManagerActionOpen(true)
              }}
            >
              <PlusCircle className="w-3.5 h-3.5 mr-1" /> Atribuir Ação Gerencial
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="text-xs text-primary bg-white hover:bg-white/90 font-semibold"
              onClick={() => setSelectedSeller(null)}
            >
              Voltar ao Cockpit
            </Button>
          </div>
        </div>
      )}

      {/* Header do Cockpit */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-3xl font-bold text-primary tracking-tight">
              Gestão do Dia
            </h1>
            <Badge
              variant="outline"
              className="text-xs bg-primary/5 text-primary border-primary/20"
            >
              Cockpit do Supervisor
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Acompanhamento consolidado de execução comercial, metas do dia e suporte aos vendedores.
          </p>
        </div>

        {/* Filtros de Período */}
        <div className="flex items-center gap-1.5 bg-white/80 p-1 rounded-full border border-border/60 shadow-xs">
          <Button
            size="sm"
            variant={dateFilter === 'hoje' ? 'default' : 'ghost'}
            className="rounded-full text-xs h-8 px-3"
            onClick={() => setDateFilter('hoje')}
          >
            Hoje
          </Button>
          <Button
            size="sm"
            variant={dateFilter === 'ontem' ? 'default' : 'ghost'}
            className="rounded-full text-xs h-8 px-3"
            onClick={() => setDateFilter('ontem')}
          >
            Ontem
          </Button>
          <Button
            size="sm"
            variant={dateFilter === '7dias' ? 'default' : 'ghost'}
            className="rounded-full text-xs h-8 px-3"
            onClick={() => setDateFilter('7dias')}
          >
            Últimos 7 dias
          </Button>
        </div>
      </div>

      {/* CALENDÁRIO COMERCIAL MICROSOFT 365 (SUPERVISÃO) */}
      <Card className="rounded-2xl border-sky-200 bg-sky-50/50 p-4 shadow-xs">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-sky-600 text-white rounded-lg">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="font-serif font-bold text-sm text-sky-950">
              Compromissos Comerciais da Equipe (Microsoft 365)
            </span>
            <Badge variant="outline" className="text-[10px] bg-white text-sky-700 border-sky-300">
              Filtro de Relevância Comercial Ativo · Compromissos Privados Ocultados
            </Badge>
          </div>
          <span className="text-xs text-sky-700 font-medium">
            Modo Demonstração Microsoft Graph
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {commercialMeetings.map((m) => (
            <div
              key={m.id}
              className="bg-white p-3 rounded-xl border border-sky-100 flex items-start justify-between text-xs"
            >
              <div>
                <span className="font-bold text-sky-900 block">{m.title}</span>
                <span className="text-muted-foreground mt-0.5 block">
                  Vendedor: <strong>{m.seller}</strong> · Cliente: {m.customer}
                </span>
              </div>
              <div className="text-right shrink-0 ml-2">
                <Badge className="bg-sky-100 text-sky-800 border-none text-[10px]">{m.type}</Badge>
                <span className="text-[11px] text-muted-foreground mt-1 block font-medium">
                  {m.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* RESUMO GERENCIAL DIÁRIO AUTOMÁTICO (IA SUPERVISOR) */}
      <Card className="rounded-3xl border-primary/20 bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white p-6 shadow-xl relative overflow-hidden">
        {' '}
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/10 rounded-2xl shrink-0">
            <Sparkles className="w-6 h-6 text-amber-300" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Resumo Gerencial Diário · Sales Supervisor Agent
              </span>
              <span className="text-xs text-slate-400">
                Atualizado há 15 min · Confiança IA: 94% · Origem: Qlik + SAP
              </span>
            </div>
            <p className="text-sm sm:text-base font-serif text-white/95 leading-relaxed">
              "Equipe com <strong>{totals.sellersCount} vendedores ativos</strong> e{' '}
              <strong>{totals.planned} ações comerciais planejadas</strong> para hoje. Já foram
              concluídas <strong>{totals.completed} ações</strong> (
              {Math.round((totals.completed / totals.planned) * 100)}% de conversão), com{' '}
              <strong>{formatBRL(totals.potentialRevenue)}</strong> e{' '}
              <strong>{totals.potentialTons} ton</strong> de potencial trabalhado."
            </p>
            <div className="pt-2 flex flex-wrap gap-4 text-xs text-amber-200">
              <span>
                ⚠ <strong>{totals.overdue} ações críticas</strong> vencidas requerem atenção
                imediata.
              </span>
              <span>
                📈 <strong>{totals.opportunities} novas oportunidades</strong> geradas no dia.
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* KPIS CONSOLIDADOS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="rounded-2xl border-border/60 bg-white/70 p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase">
            Planejado
          </span>
          <span className="font-serif text-2xl font-bold text-primary mt-1 block">
            {totals.planned}
          </span>
          <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">
            100% da meta diária
          </span>
        </Card>

        <Card className="rounded-2xl border-border/60 bg-white/70 p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase">Concluído</span>
          <span className="font-serif text-2xl font-bold text-emerald-600 mt-1 block">
            {totals.completed}
          </span>
          <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">
            {Math.round((totals.completed / totals.planned) * 100)}% de execução
          </span>
        </Card>

        <Card className="rounded-2xl border-border/60 bg-white/70 p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-amber-700 uppercase">Pendente</span>
          <span className="font-serif text-2xl font-bold text-amber-600 mt-1 block">
            {totals.pending}
          </span>
          <span className="text-[10px] text-muted-foreground mt-0.5 block">Em andamento</span>
        </Card>

        <Card className="rounded-2xl border-border/60 bg-white/70 p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-rose-700 uppercase">Vencido</span>
          <span className="font-serif text-2xl font-bold text-rose-600 mt-1 block">
            {totals.overdue}
          </span>
          <span className="text-[10px] text-rose-600 font-semibold mt-0.5 block">
            Atenção requerida
          </span>
        </Card>

        <Card className="rounded-2xl border-border/60 bg-white/70 p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-primary uppercase">Potencial R$</span>
          <span className="font-serif text-xl font-bold text-primary mt-1 block">
            R$ {(totals.potentialRevenue / 1000).toFixed(0)}k
          </span>
          <span className="text-[10px] text-muted-foreground mt-0.5 block">
            {totals.potentialTons} ton
          </span>
        </Card>

        <Card className="rounded-2xl border-border/60 bg-white/70 p-4 shadow-sm">
          <span className="text-[11px] font-semibold text-blue-700 uppercase">Oportunidades</span>
          <span className="font-serif text-2xl font-bold text-blue-600 mt-1 block">
            {totals.opportunities}
          </span>
          <span className="text-[10px] text-blue-600 font-semibold mt-0.5 block">Geradas hoje</span>
        </Card>
      </div>

      {/* TABELA POR VENDEDOR */}
      <Card className="rounded-3xl border-border/60 bg-white/80 shadow-sm overflow-hidden">
        <CardHeader className="p-6 pb-4 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="font-serif text-xl font-bold text-primary">
              Desempenho da Equipe Comercial
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Clique em um vendedor para abrir o "Meu Dia" em modo gerencial ou atribuir ações.
            </p>
          </div>
          <div className="w-full sm:w-64">
            <Input
              placeholder="Buscar vendedor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 text-xs rounded-xl"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-border/40 text-[11px] uppercase font-bold text-muted-foreground tracking-wider">
                <th className="p-4">Vendedor</th>
                <th className="p-4 text-center">Planejado</th>
                <th className="p-4 text-center">Concluído</th>
                <th className="p-4 text-center">Pendente</th>
                <th className="p-4 text-center">Vencido</th>
                <th className="p-4 text-center">Reagendado</th>
                <th className="p-4 text-center">Oportunidades</th>
                <th className="p-4 text-right">Potencial R$</th>
                <th className="p-4 text-right">Potencial Ton</th>
                <th className="p-4 text-center">Conversão</th>
                <th className="p-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {filteredSellers.map((s) => (
                <tr
                  key={s.id}
                  className="hover:bg-primary/5 transition-colors group cursor-pointer"
                  onClick={() => setSelectedSeller(s)}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                        {s.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-primary block leading-tight group-hover:text-primary/80">
                          {s.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{s.role}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-center font-semibold text-primary">{s.plannedActions}</td>
                  <td className="p-4 text-center font-bold text-emerald-600">
                    {s.completedActions}
                  </td>
                  <td className="p-4 text-center text-amber-600 font-semibold">
                    {s.pendingActions}
                  </td>
                  <td className="p-4 text-center">
                    {s.overdueActions > 0 ? (
                      <Badge
                        variant="outline"
                        className="bg-rose-50 text-rose-700 border-rose-300 text-[10px]"
                      >
                        {s.overdueActions}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </td>
                  <td className="p-4 text-center text-muted-foreground">{s.rescheduledActions}</td>
                  <td className="p-4 text-center font-bold text-blue-600">{s.opportunities}</td>
                  <td className="p-4 text-right font-serif font-bold text-primary">
                    {formatBRL(s.potentialRevenue)}
                  </td>
                  <td className="p-4 text-right font-medium text-slate-700">{s.potentialTons} t</td>
                  <td className="p-4 text-center">
                    <Badge
                      className={cn(
                        'text-[10px] font-bold border-none',
                        s.conversionRate >= 75
                          ? 'bg-emerald-100 text-emerald-800'
                          : s.conversionRate >= 60
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800',
                      )}
                    >
                      {s.conversionRate}%
                    </Badge>
                  </td>
                  <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs text-primary hover:bg-primary/10"
                      onClick={() => setSelectedSeller(s)}
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" /> Ver Meu Dia
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* MODAL PARA CRIAR AÇÃO GERENCIAL AUDITADA */}
      <Dialog open={managerActionOpen} onOpenChange={setManagerActionOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-primary">Atribuir Ação Gerencial</DialogTitle>
            <DialogDescription>
              Criar orientação comercial para {selectedSeller?.name}. Origem: MANAGER_ASSIGNED
              (auditado).
            </DialogDescription>
          </DialogHeader>
          <div className="py-3 flex flex-col gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                Nome do Cliente / Conta
              </label>
              <Input
                placeholder="Ex: Metalúrgica Santa Rita Ltda"
                value={actionFormData.customerName}
                onChange={(e) =>
                  setActionFormData({ ...actionFormData, customerName: e.target.value })
                }
                className="h-9 text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                Recomendação Comercial
              </label>
              <Input
                placeholder="Ex: Retomar negociação de Tubos 304 com condição especial"
                value={actionFormData.recommendation}
                onChange={(e) =>
                  setActionFormData({ ...actionFormData, recommendation: e.target.value })
                }
                className="h-9 text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                Nota do Supervisor (manager_note)
              </label>
              <Textarea
                placeholder="Ex: Concedi autorização de 3% extra de margem para fechar até 17h..."
                value={actionFormData.managerNote}
                onChange={(e) =>
                  setActionFormData({ ...actionFormData, managerNote: e.target.value })
                }
                rows={3}
                className="text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManagerActionOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateManagerAction} className="bg-primary text-white">
              Atribuir Ação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
