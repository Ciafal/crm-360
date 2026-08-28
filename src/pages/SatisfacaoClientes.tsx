import React, { useState, useMemo } from 'react'
import { mockClientes, mockEquipe } from '@/data/mockCommercialData'
import { mockComplaints } from '@/data/mockPlaybooksAndWorkflows'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  SmilePlus,
  Smile,
  Meh,
  Frown,
  Search,
  Filter,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Building2,
  Calendar,
  ExternalLink,
  Users,
  CheckCircle2,
  Clock,
  ThumbsUp,
  RefreshCw,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { cn, formatCurrency } from '@/lib/utils'

export type SatisfactionLevel = 'Muito Satisfeito' | 'Satisfeito' | 'Atenção' | 'Crítico'

export interface ClientSatisfactionItem {
  id: string
  sapCode: string
  razaoSocial: string
  nomeFantasia: string
  vendedor: string
  cidade: string
  uf: string
  scoreNps: number // 0-100
  scoreCsat: number // 1-10
  level: SatisfactionLevel
  tendencia: 'Melhorando' | 'Estável' | 'Piorando'
  ultimaPesquisa: string
  reclamacoesAbertas: number
  entregasNoPrazoPct: number
  atrasoPagamentoMedioDias: number
  frequenciaCompraDias: number
  fatoresPositivos: string[]
  fatoresCriticos: string[]
  recomendacaoIA: string
  riscoInsatisfacaoPct: number
}

export function generateSatisfactionData(): ClientSatisfactionItem[] {
  return mockClientes.map((c, i) => {
    const complaints = mockComplaints[c.id] || []
    const openComplaints = complaints.filter((co) => co.status !== 'ENCERRADA').length

    let scoreNps = 85
    let scoreCsat = 9.0
    let level: SatisfactionLevel = 'Muito Satisfeito'
    let tendencia: 'Melhorando' | 'Estável' | 'Piorando' = 'Estável'
    let riscoInsatisfacao = 10

    if (c.statusComercial === 'Inativo' || openComplaints > 1) {
      scoreNps = 35
      scoreCsat = 4.5
      level = 'Crítico'
      tendencia = 'Piorando'
      riscoInsatisfacao = 85
    } else if (c.pVivo < 60 || openComplaints === 1 || c.diasSemContato > 40) {
      scoreNps = 62
      scoreCsat = 6.8
      level = 'Atenção'
      tendencia = 'Piorando'
      riscoInsatisfacao = 45
    } else if (c.toneladas12m > 100) {
      scoreNps = 92
      scoreCsat = 9.5
      level = 'Muito Satisfeito'
      tendencia = 'Melhorando'
      riscoInsatisfacao = 5
    } else {
      scoreNps = 80
      scoreCsat = 8.4
      level = 'Satisfeito'
      tendencia = 'Estável'
      riscoInsatisfacao = 15
    }

    return {
      id: c.id,
      sapCode: c.sapCode,
      razaoSocial: c.razaoSocial,
      nomeFantasia: c.nomeFantasia,
      vendedor: c.vendedor,
      cidade: c.cidade,
      uf: c.uf,
      scoreNps,
      scoreCsat,
      level,
      tendencia,
      ultimaPesquisa: '15/10/2024',
      reclamacoesAbertas: openComplaints,
      entregasNoPrazoPct: i % 2 === 0 ? 98.2 : 94.5,
      atrasoPagamentoMedioDias: c.statusCredito === 'Restrito' ? 12 : 0,
      frequenciaCompraDias: c.frequenciaDias || 30,
      fatoresPositivos: [
        'Pontualidade de entrega da frota CIAFAL',
        'Atendimento rápido da equipe de vendas',
        'Qualidade dimensional do aço (Gerdau)',
      ],
      fatoresCriticos:
        openComplaints > 0
          ? ['Reclamação de qualidade pendente no SAC', 'Tempo de resposta de cotação']
          : ['Sensibilidade ao reajuste de tabela da usina'],
      recomendacaoIA:
        level === 'Crítico'
          ? 'Intervenção imediata com visita conjunta do Gerente Comercial e Engenheiro de Qualidade.'
          : level === 'Atenção'
            ? 'Realizar follow-up presencial e alinhar SLA de frete dedicado para Betim.'
            : 'Apresentar programa de fidelidade e tabela de preços diferenciada para volume estendido.',
      riscoInsatisfacaoPct: riscoInsatisfacao,
    }
  })
}

export default function SatisfacaoClientesPage() {
  const navigate = useNavigate()
  const [data] = useState<ClientSatisfactionItem[]>(generateSatisfactionData())
  const [searchTerm, setSearchTerm] = useState('')
  const [levelFilter, setLevelFilter] = useState<string>('todos')
  const [sellerFilter, setSellerFilter] = useState<string>('todos')
  const [tendenciaFilter, setTendenciaFilter] = useState<string>('todos')

  const filtered = useMemo(() => {
    return data.filter((item) => {
      const matchSearch =
        item.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nomeFantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sapCode.includes(searchTerm)
      const matchLevel = levelFilter === 'todos' || item.level === levelFilter
      const matchSeller = sellerFilter === 'todos' || item.vendedor === sellerFilter
      const matchTendencia = tendenciaFilter === 'todos' || item.tendencia === tendenciaFilter

      return matchSearch && matchLevel && matchSeller && matchTendencia
    })
  }, [data, searchTerm, levelFilter, sellerFilter, tendenciaFilter])

  // Métricas Consolidadas
  const totalClients = data.length
  const avgNps = Math.round(data.reduce((acc, i) => acc + i.scoreNps, 0) / totalClients)
  const avgCsat = (data.reduce((acc, i) => acc + i.scoreCsat, 0) / totalClients).toFixed(1)
  const criticosCount = data.filter((i) => i.level === 'Crítico').length
  const atencaoCount = data.filter((i) => i.level === 'Atenção').length
  const satisfeitosCount = data.filter(
    (i) => i.level === 'Satisfeito' || i.level === 'Muito Satisfeito',
  ).length

  const getLevelBadge = (level: SatisfactionLevel) => {
    switch (level) {
      case 'Muito Satisfeito':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300'
      case 'Satisfeito':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'Atenção':
        return 'bg-amber-100 text-amber-800 border-amber-300'
      case 'Crítico':
        return 'bg-rose-100 text-rose-800 border-rose-300'
    }
  }

  const getLevelIcon = (level: SatisfactionLevel) => {
    switch (level) {
      case 'Muito Satisfeito':
        return <SmilePlus className="w-4 h-4 text-emerald-600" />
      case 'Satisfeito':
        return <Smile className="w-4 h-4 text-blue-600" />
      case 'Atenção':
        return <Meh className="w-4 h-4 text-amber-600" />
      case 'Crítico':
        return <Frown className="w-4 h-4 text-rose-600" />
    }
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in pb-16">
      {/* BANNER PRINCIPAL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-[#003A70] to-emerald-950 text-white p-5 rounded-3xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
            <h1 className="font-serif text-xl font-bold">
              Satisfação de Clientes & CSAT 360º CIAFAL
            </h1>
          </div>
          <p className="text-xs text-slate-200 max-w-2xl">
            Monitoramento de NPS, ocorrências de logística TMS, pontualidade de faturamento,
            reclamações no SAC e previsão de risco de insatisfação por Inteligência Artificial.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() =>
            toast.success('Disparo em lote de pesquisa NPS via WhatsApp & E-mail agendado!')
          }
          className="h-9 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs gap-1.5 rounded-xl self-start sm:self-auto shadow-xs"
        >
          <SmilePlus className="h-4 w-4" /> Disparar Pesquisa NPS
        </Button>
      </div>

      {/* 4 CARDS DE INDICADORES EXECUTIVOS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border-border/50 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            NPS Médio Corporativo
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-serif text-2xl font-bold text-emerald-600">{avgNps} pts</span>
            <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold border-none">
              Zona de Excelência
            </Badge>
          </div>
          <span className="text-[11px] text-muted-foreground mt-1">Meta: &gt;75 pts</span>
        </Card>

        <Card className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border-border/50 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            CSAT Geral (Atendimento)
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-serif text-2xl font-bold text-primary">{avgCsat} / 10</span>
            <Badge className="bg-blue-100 text-blue-800 text-[10px] font-bold border-none">
              92% Positivo
            </Badge>
          </div>
          <span className="text-[11px] text-muted-foreground mt-1">
            Pontualidade TMS e Qualidade
          </span>
        </Card>

        <Card className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border-border/50 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
            Clientes Satisfeitos
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-serif text-2xl font-bold text-emerald-700">
              {satisfeitosCount}
            </span>
            <span className="text-xs text-muted-foreground">
              ({Math.round((satisfeitosCount / totalClients) * 100)}% da carteira)
            </span>
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1">Alta fidelização</span>
        </Card>

        <Card className="bg-white/90 backdrop-blur-md rounded-2xl p-4 border-border/50 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800">
            Em Atenção ou Crítico
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-serif text-2xl font-bold text-rose-600">
              {criticosCount + atencaoCount}
            </span>
            <span className="text-xs text-muted-foreground">({criticosCount} críticos)</span>
          </div>
          <span className="text-[11px] text-rose-600 font-semibold mt-1">
            Requer plano de ação IA
          </span>
        </Card>
      </div>

      {/* BARRA DE FILTROS */}
      <Card className="bg-white/90 backdrop-blur-md rounded-2xl border-border/40 p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente ou código SAP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 text-xs rounded-xl"
            />
          </div>

          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="h-10 text-xs rounded-xl">
              <SelectValue placeholder="Classificação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas as Classificações</SelectItem>
              <SelectItem value="Muito Satisfeito">Muito Satisfeito</SelectItem>
              <SelectItem value="Satisfeito">Satisfeito</SelectItem>
              <SelectItem value="Atenção">Em Atenção</SelectItem>
              <SelectItem value="Crítico">Crítico</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sellerFilter} onValueChange={setSellerFilter}>
            <SelectTrigger className="h-10 text-xs rounded-xl">
              <SelectValue placeholder="Vendedor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Vendedores</SelectItem>
              {mockEquipe.map((v) => (
                <SelectItem key={v.id} value={v.name}>
                  {v.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={tendenciaFilter} onValueChange={setTendenciaFilter}>
            <SelectTrigger className="h-10 text-xs rounded-xl">
              <SelectValue placeholder="Tendência" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas as Tendências</SelectItem>
              <SelectItem value="Melhorando">Melhorando</SelectItem>
              <SelectItem value="Estável">Estável</SelectItem>
              <SelectItem value="Piorando">Piorando</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* GRID DE CARDS DE SATISFAÇÃO POR CLIENTE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((client) => (
          <Card
            key={client.id}
            className={cn(
              'bg-white/95 backdrop-blur-md rounded-2xl border p-4 shadow-xs hover:shadow-md transition-all space-y-3 flex flex-col justify-between',
              client.level === 'Crítico'
                ? 'border-rose-300 bg-rose-50/10'
                : client.level === 'Atenção'
                  ? 'border-amber-300 bg-amber-50/10'
                  : 'border-border/50',
            )}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <strong
                      onClick={() => navigate(`/crm/${client.id}`)}
                      className="font-bold text-sm text-primary hover:underline cursor-pointer block"
                    >
                      {client.razaoSocial}
                    </strong>
                  </div>
                  <span className="text-[11px] text-muted-foreground block">
                    {client.nomeFantasia} · SAP #{client.sapCode} · {client.vendedor}
                  </span>
                </div>

                <Badge
                  variant="outline"
                  className={cn('text-xs font-bold border gap-1', getLevelBadge(client.level))}
                >
                  {getLevelIcon(client.level)}
                  <span>{client.level}</span>
                </Badge>
              </div>

              {/* MATRIZ DE NOTAS E INDICADORES */}
              <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-xl border text-center text-xs">
                <div>
                  <span className="text-[9px] uppercase font-bold text-muted-foreground block">
                    NPS
                  </span>
                  <strong className="font-serif text-base text-primary block">
                    {client.scoreNps}
                  </strong>
                  <span className="text-[9px] text-muted-foreground">pts</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-muted-foreground block">
                    CSAT
                  </span>
                  <strong className="font-serif text-base text-slate-800 block">
                    {client.scoreCsat}
                  </strong>
                  <span className="text-[9px] text-muted-foreground">/10</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-muted-foreground block">
                    TMS Prazo
                  </span>
                  <strong className="font-mono text-sm text-emerald-700 block">
                    {client.entregasNoPrazoPct}%
                  </strong>
                  <span className="text-[9px] text-muted-foreground">on-time</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-muted-foreground block">
                    Risco Churn
                  </span>
                  <strong
                    className={cn(
                      'font-mono text-sm block font-bold',
                      client.riscoInsatisfacaoPct > 50
                        ? 'text-rose-600'
                        : client.riscoInsatisfacaoPct > 25
                          ? 'text-amber-600'
                          : 'text-emerald-600',
                    )}
                  >
                    {client.riscoInsatisfacaoPct}%
                  </strong>
                  <span className="text-[9px] text-muted-foreground">prob. IA</span>
                </div>
              </div>

              {/* FATORES POSITIVOS E CRÍTICOS */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-100 text-emerald-950 space-y-0.5">
                  <span className="font-bold block text-[10px] text-emerald-800">
                    Fatores Positivos:
                  </span>
                  <span className="block text-[10px]">{client.fatoresPositivos[0]}</span>
                </div>
                <div className="p-2 rounded-lg bg-amber-50/70 border border-amber-100 text-amber-950 space-y-0.5">
                  <span className="font-bold block text-[10px] text-amber-800">
                    Ponto de Atenção:
                  </span>
                  <span className="block text-[10px]">{client.fatoresCriticos[0]}</span>
                </div>
              </div>

              {/* RECOMENDAÇÃO DA IA */}
              <div className="p-2.5 rounded-xl bg-sky-50/80 border border-sky-200 text-xs text-sky-950 space-y-0.5">
                <div className="flex items-center gap-1.5 font-bold text-[10px] text-primary uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Recomendação de Ação da IA:
                </div>
                <p className="text-[11px] text-slate-700 leading-snug">{client.recomendacaoIA}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/30 gap-2 mt-2">
              <span className="text-[10px] text-muted-foreground">
                Última pesquisa respondida: {client.ultimaPesquisa}
              </span>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1 text-primary border-primary/30 hover:bg-primary/5"
                onClick={() => navigate(`/crm/${client.id}`)}
              >
                <span>Ver Cliente 360º</span>
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
