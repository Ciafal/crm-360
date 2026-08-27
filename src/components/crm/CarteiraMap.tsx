import React, { useState, useMemo, useEffect } from 'react'
import { ClienteCarteira, LeadItem, mockVisitas } from '@/data/mockCommercialData'
import { mockComplaints } from '@/data/mockPlaybooksAndWorkflows'
import { tmsProvider } from '@/providers/TMSProvider'
import { defaultGeoProvider, RouteWaypoint, RoutePlanResult } from '@/providers/GeoProvider'
import { customerGeoService } from '@/services/customer_geo_service'
import { useAuth } from '@/hooks/use-auth'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ABCBadge } from '@/components/shared/ABCBadge'
import { RFMSegmentBadge } from '@/components/shared/RFMSegmentBadge'
import { CommercialMetricToggle } from '@/components/shared/CommercialMetricToggle'
import { useAppStore } from '@/stores/useAppStore'
import {
  MapPin,
  Navigation,
  Compass,
  Building2,
  Phone,
  MessageSquare,
  Calendar,
  Sparkles,
  Search,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Truck,
  ShieldAlert,
  Edit3,
  ExternalLink,
  Flame,
  UserCheck,
  CheckCircle2,
  Filter,
  ArrowRight,
  TrendingUp,
  Map as MapIcon,
  Crosshair,
  RotateCcw,
  Check,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface CarteiraMapProps {
  clientes: ClienteCarteira[]
  leads?: LeadItem[]
}

// Bounding box aproximada de Minas Gerais e entorno SP
const MAP_BOUNDS = {
  minLat: -23.6,
  maxLat: -16.5,
  minLng: -48.5,
  maxLng: -41.5,
}

// Converte latitude/longitude para porcentagem de posição X/Y no canvas cartográfico
function projectToCanvas(lat: number, lng: number) {
  const x = ((lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng)) * 100
  const y = ((MAP_BOUNDS.maxLat - lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * 100
  return {
    x: Math.max(5, Math.min(95, x)),
    y: Math.max(5, Math.min(95, y)),
  }
}

export function CarteiraMap({ clientes, leads = [] }: CarteiraMapProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { commercialMetric } = useAppStore()

  // Permissões / RLS
  const isVendedor = user?.role === 'vendedor'
  const isRep = user?.role === 'representante_externo'
  const isSupervisorOrAbove =
    user?.role === 'supervisor' ||
    user?.role === 'gerente_comercial' ||
    user?.role === 'diretoria' ||
    user?.role === 'administrador' ||
    user?.role === 'ti'

  // Estados de Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSeller, setSelectedSeller] = useState<string>('todos')
  const [selectedAbcHist, setSelectedAbcHist] = useState<string>('todos')
  const [selectedAbcPot, setSelectedAbcPot] = useState<string>('todos')
  const [selectedArchetype, setSelectedArchetype] = useState<string>('todos')
  const [selectedStatus, setSelectedStatus] = useState<string>('todos') // todos, Ativo, Em Risco, Inativo, Lead
  const [selectedCity, setSelectedCity] = useState<string>('todos')
  const [selectedPurchaseMoment, setSelectedPurchaseMoment] = useState<string>('todos') // todos, janela_imediata, atencao
  const [selectedVisitaFilter, setSelectedVisitaFilter] = useState<string>('todos') // todos, com_visita, sem_visita_30d
  const [showAiPriorityOnly, setShowAiPriorityOnly] = useState(false)
  const [heatmapMetric, setHeatmapMetric] = useState<'off' | 'tons' | 'potencial' | 'inativos'>(
    'off',
  )

  // Ponto Selecionado & Interação
  const [selectedPoint, setSelectedPoint] = useState<ClienteCarteira | null>(null)
  const [selectedClusterKey, setSelectedClusterKey] = useState<string | null>(null)
  const [zoomLevel, setZoomLevel] = useState<number>(1) // 1x, 1.5x, 2x

  // Modal de Ajuste Manual de Localização
  const [manualOverrideOpen, setManualOverrideOpen] = useState(false)
  const [overrideCustomer, setOverrideCustomer] = useState<ClienteCarteira | null>(null)
  const [overrideLat, setOverrideLat] = useState<string>('')
  const [overrideLng, setOverrideLng] = useState<string>('')
  const [overrideReason, setOverrideReason] = useState<string>('')

  // Modal de Planejamento de Roteiro IA
  const [routePlannerOpen, setRoutePlannerOpen] = useState(false)
  const [routeDate, setRouteDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [routeStartingCity, setRouteStartingCity] = useState<string>('Contagem')
  const [selectedRouteClients, setSelectedRouteClients] = useState<string[]>([])
  const [calculatedRoute, setCalculatedRoute] = useState<RoutePlanResult | null>(null)
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false)

  // Localização Móvel do Vendedor (solicitada sob demanda)
  const [sellerLocation, setSellerLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locatingSeller, setLocatingSeller] = useState(false)

  // Transferência / Reatribuição de Carteira por Supervisor
  const [reassignModalOpen, setReassignModalOpen] = useState(false)
  const [reassignCustomer, setReassignCustomer] = useState<ClienteCarteira | null>(null)
  const [targetSeller, setTargetSeller] = useState<string>('Carlos Mendonça')

  // Cargas TMS em trânsito mapeadas por ID de cliente
  const [tmsAlertMap, setTmsAlertMap] = useState<
    Record<string, { count: number; inTransit: boolean }>
  >({
    'cli-100001': { count: 1, inTransit: true },
    'cli-100002': { count: 1, inTransit: true },
    'cli-100006': { count: 1, inTransit: true },
  })

  // Reclamações de qualidade ativas
  const qualityComplaintsMap = useMemo(() => {
    const map: Record<string, number> = {}
    Object.entries(mockComplaints).forEach(([customerId, list]) => {
      list.forEach((c) => {
        if (c.status !== 'CONCLUIDA') {
          map[customerId] = (map[customerId] || 0) + 1
        }
      })
    })
    return map
  }, [])

  // 1. Filtragem com RLS e Filtros da Barra
  const filteredClientes = useMemo(() => {
    return clientes.filter((c) => {
      // RLS
      if (
        isVendedor &&
        c.vendedorId !== user?.id &&
        !c.vendedor.toLowerCase().includes(user?.name.toLowerCase() || '')
      ) {
        // Se for vendedor, restringe a sua carteira
        return false
      }
      if (isRep && c.vendedorId !== user?.id && !c.vendedor.toLowerCase().includes('joão pedro')) {
        return false
      }

      // Vendedor selector (Supervisor/Gerente)
      if (selectedSeller !== 'todos' && c.vendedor !== selectedSeller) return false

      // Busca geral
      if (searchTerm) {
        const q = searchTerm.toLowerCase()
        const matchSearch =
          c.razaoSocial.toLowerCase().includes(q) ||
          c.nomeFantasia.toLowerCase().includes(q) ||
          c.sapCode.includes(q) ||
          c.cnpj.includes(q) ||
          c.cidade.toLowerCase().includes(q)
        if (!matchSearch) return false
      }

      // ABC Histórico & Potencial
      if (selectedAbcHist !== 'todos' && c.abcHistorico !== selectedAbcHist) return false
      if (selectedAbcPot !== 'todos' && c.abcPotencial !== selectedAbcPot) return false

      // Arquétipo Comercial
      if (
        selectedArchetype !== 'todos' &&
        (c.arquetipoComercial || 'INDÚSTRIA') !== selectedArchetype
      ) {
        return false
      }

      // Status Comercial (Ativo, Em Risco, Inativo)
      if (selectedStatus !== 'todos' && c.statusComercial !== selectedStatus) return false

      // Cidade
      if (selectedCity !== 'todos' && c.cidade !== selectedCity) return false

      // Purchase Moment / Janela de Recompra
      if (selectedPurchaseMoment === 'janela_imediata') {
        if (c.diasProximaCompra > 7) return false
      } else if (selectedPurchaseMoment === 'atencao') {
        if (c.diasProximaCompra > 15 && c.pVivo > 60) return false
      }

      // Visitas
      if (
        selectedVisitaFilter === 'com_visita' &&
        (!c.proximaVisitaData || c.proximaVisitaData === 'Pendente')
      ) {
        return false
      }
      if (selectedVisitaFilter === 'sem_visita_30d' && (c.diasSemVisita || 0) < 30) {
        return false
      }

      // Camada de Prioridade IA
      if (showAiPriorityOnly) {
        // Clientes A ou com Purchase Moment alto ou em risco com alto volume
        const isHighPriority =
          c.abcHistorico === 'A' ||
          c.abcPotencial === 'A' ||
          (c.purchaseMomentScore && c.purchaseMomentScore >= 80) ||
          (c.statusComercial === 'Em Risco' && c.toneladas12m > 40)
        if (!isHighPriority) return false
      }

      return true
    })
  }, [
    clientes,
    isVendedor,
    isRep,
    user,
    selectedSeller,
    searchTerm,
    selectedAbcHist,
    selectedAbcPot,
    selectedArchetype,
    selectedStatus,
    selectedCity,
    selectedPurchaseMoment,
    selectedVisitaFilter,
    showAiPriorityOnly,
  ])

  // 2. Agrupamento por Cidades / Clusters
  const clustersByCity = useMemo(() => {
    const groups: Record<
      string,
      { city: string; uf: string; clientes: ClienteCarteira[]; totalTons: number }
    > = {}

    filteredClientes.forEach((c) => {
      const key = `${c.cidade}-${c.uf}`
      if (!groups[key]) {
        groups[key] = {
          city: c.cidade,
          uf: c.uf,
          clientes: [],
          totalTons: 0,
        }
      }
      groups[key].clientes.push(c)
      groups[key].totalTons += c.toneladas12m
    })

    return Object.values(groups).sort((a, b) => b.totalTons - a.totalTons)
  }, [filteredClientes])

  // 3. Analytics e KPIs do Mapa
  const mapKpis = useMemo(() => {
    const count = filteredClientes.length
    const totalTons = filteredClientes.reduce((acc, c) => acc + c.toneladas12m, 0)
    const totalPotentialTons = filteredClientes.reduce(
      (acc, c) => acc + (c.potencialTons12m || c.toneladas12m * 1.2),
      0,
    )
    const totalRevenue = filteredClientes.reduce((acc, c) => acc + c.faturamento12m, 0)
    const clientesA = filteredClientes.filter((c) => c.abcHistorico === 'A').length
    const emRisco = filteredClientes.filter((c) => c.statusComercial === 'Em Risco').length
    const inativos = filteredClientes.filter((c) => c.statusComercial === 'Inativo').length
    const comOportunidade = filteredClientes.filter((c) => c.pipelineValor > 0).length
    const visitasPendentes = filteredClientes.filter(
      (c) => c.proximaVisitaData && c.proximaVisitaData !== 'Pendente',
    ).length

    return {
      count,
      totalTons,
      totalPotentialTons,
      totalRevenue,
      clientesA,
      emRisco,
      inativos,
      comOportunidade,
      visitasPendentes,
    }
  }, [filteredClientes])

  // 4. Solicitação de Localização Atual do Vendedor (Clientes Próximos)
  const handleRequestSellerLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalização não suportada no seu navegador.')
      return
    }
    setLocatingSeller(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSellerLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
        setLocatingSeller(false)
        toast.success(
          'Localização atual obtida com sucesso! Marcador do vendedor exibido para auxílio de roteiro.',
        )
      },
      (error) => {
        setLocatingSeller(false)
        // Fallback para Contagem/MG em ambiente dev/mock
        setSellerLocation({ lat: -19.9328, lng: -44.0539 })
        toast.info(
          'Permissão de GPS não concedida. Posição padrão definida para Hub CIAFAL Contagem / MG.',
        )
      },
      { timeout: 8000 },
    )
  }

  // 5. Planejamento de Roteiro com IA
  const handlePlanRoute = async () => {
    setIsCalculatingRoute(true)
    try {
      const candidates =
        selectedRouteClients.length > 0
          ? filteredClientes.filter((c) => selectedRouteClients.includes(c.id))
          : filteredClientes.slice(0, 4)

      const waypoints: RouteWaypoint[] = candidates.map((c) => ({
        id: c.id,
        title: `${c.nomeFantasia} (${c.cidade})`,
        latitude: c.latitude || -19.9328,
        longitude: c.longitude || -44.0539,
        customerSap: c.sapCode,
        priorityScore:
          (c.abcHistorico === 'A' ? 100 : c.abcHistorico === 'B' ? 60 : 30) +
          (c.purchaseMomentScore || 50),
        estimatedDurationMins: 45,
      }))

      const result = await defaultGeoProvider.calculateRoute(waypoints)
      setCalculatedRoute(result)
      toast.success('Roteiro otimizado calculado pela Inteligência Comercial CIAFAL!')
    } catch (_) {
      toast.error('Erro ao calcular roteiro inteligente.')
    } finally {
      setIsCalculatingRoute(false)
    }
  }

  // 6. Confirmação do Ajuste Manual de Localização
  const handleSaveManualOverride = async () => {
    if (!overrideCustomer) return
    const latNum = parseFloat(overrideLat)
    const lngNum = parseFloat(overrideLng)

    if (isNaN(latNum) || isNaN(lngNum)) {
      toast.error('Coordenadas inválidas. Informe latitude e longitude válidas.')
      return
    }

    try {
      await customerGeoService.recordManualOverride({
        customerId: overrideCustomer.id,
        sapCode: overrideCustomer.sapCode,
        previousLat: overrideCustomer.latitude || -19.9328,
        previousLng: overrideCustomer.longitude || -44.0539,
        newLat: latNum,
        newLng: lngNum,
        reason: overrideReason || 'Ajuste de portaria / acesso de recebimento pelo vendedor',
        userId: user?.id || 'qas-user',
        userName: user?.name || 'Carlos Mendonça',
      })

      // Atualiza na lista local
      overrideCustomer.latitude = latNum
      overrideCustomer.longitude = lngNum

      toast.success(
        `Localização de ${overrideCustomer.nomeFantasia} atualizada! Log de auditoria registrado. Endereço fiscal SAP preservado.`,
      )
      setManualOverrideOpen(false)
    } catch (_) {
      toast.error('Não foi possível salvar o ajuste manual.')
    }
  }

  // 7. Confirmação de Reatribuição de Inativo
  const handleConfirmReassign = () => {
    if (!reassignCustomer) return
    toast.success(
      `Cliente inativo ${reassignCustomer.nomeFantasia} (SAP ${reassignCustomer.sapCode}) reatribuído com sucesso para ${targetSeller}!`,
    )
    setReassignModalOpen(false)
  }

  return (
    <div className="space-y-4">
      {/* HEADER ESTRATÉGICO COM PRIORIDADE IA E FERRAMENTAS */}
      <Card className="bg-gradient-to-r from-blue-950 via-[#003A70] to-slate-900 text-white rounded-3xl p-5 border-none shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Compass className="h-5 w-5 text-blue-300 animate-pulse" />
              <h3 className="font-serif text-lg font-bold">
                Mapa da Carteira & Inteligência Territorial
              </h3>
              <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px]">
                Fonte: SAP ECC + Geo Engine
              </Badge>
              <Badge className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px]">
                Métrica: {commercialMetric === 'TONS' ? 'Toneladas (t)' : 'Faturamento (R$)'}
              </Badge>
            </div>
            <p className="text-xs text-blue-100 max-w-3xl">
              Visualização geográfica da carteira, clusters de concentração de demanda, roteirização
              comercial e gaps territoriais em Minas Gerais e regiões polo.
              <span className="text-amber-300 font-medium block mt-0.5">
                • Dados cadastrais oficiais SAP ECC. Privacidade preservada: sem rastreamento
                contínuo.
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* Alternador de Métrica (Vendedor t / Supervisor t e R$) */}
            <CommercialMetricToggle />

            {/* Toggle Prioridade IA */}
            <Button
              size="sm"
              variant={showAiPriorityOnly ? 'default' : 'outline'}
              className={cn(
                'h-9 text-xs font-semibold gap-1.5 rounded-xl transition-all',
                showAiPriorityOnly
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-md'
                  : 'bg-white/10 border-white/20 text-white hover:bg-white/20',
              )}
              onClick={() => setShowAiPriorityOnly(!showAiPriorityOnly)}
            >
              <Sparkles
                className={cn(
                  'h-3.5 w-3.5',
                  showAiPriorityOnly ? 'text-slate-950' : 'text-amber-400',
                )}
              />
              {showAiPriorityOnly ? 'Prioridade IA Ativa' : 'Mostrar Prioridade IA'}
            </Button>

            {/* Planejar Roteiro */}
            <Button
              size="sm"
              className="h-9 text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-xs"
              onClick={() => {
                setRoutePlannerOpen(true)
                if (calculatedRoute === null) {
                  handlePlanRoute()
                }
              }}
            >
              <Navigation className="h-3.5 w-3.5" />
              Planejar Roteiro
            </Button>

            {/* Clientes Próximos */}
            <Button
              size="sm"
              variant="outline"
              className="h-9 text-xs font-semibold gap-1.5 bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl"
              onClick={handleRequestSellerLocation}
              disabled={locatingSeller}
            >
              <Crosshair
                className={`h-3.5 w-3.5 ${locatingSeller ? 'animate-spin text-emerald-400' : 'text-emerald-300'}`}
              />
              {sellerLocation ? 'Minha Posição Ativa' : 'Clientes Próximos'}
            </Button>
          </div>
        </div>
      </Card>

      {/* BARRA DE FILTROS AVANÇADOS DO MAPA */}
      <Card className="bg-white/90 backdrop-blur-md border-border/40 shadow-xs rounded-2xl p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {/* Busca */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Buscar Cliente, SAP, CNPJ ou Cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl"
            />
          </div>

          {/* Vendedor (Supervisor/Gerente) */}
          {isSupervisorOrAbove && (
            <div>
              <Select value={selectedSeller} onValueChange={setSelectedSeller}>
                <SelectTrigger className="h-9 text-xs rounded-xl">
                  <SelectValue placeholder="Vendedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Vendedores</SelectItem>
                  <SelectItem value="Carlos Mendonça">Carlos Mendonça</SelectItem>
                  <SelectItem value="Mariana Azevedo">Mariana Azevedo</SelectItem>
                  <SelectItem value="João Pedro Representações">João Pedro (Rep)</SelectItem>
                  <SelectItem value="Marcos Vinícius">Marcos Vinícius (Sup)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Arquétipo Comercial */}
          <div>
            <Select value={selectedArchetype} onValueChange={setSelectedArchetype}>
              <SelectTrigger className="h-9 text-xs rounded-xl">
                <SelectValue placeholder="Arquétipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Arquétipos</SelectItem>
                <SelectItem value="INDÚSTRIA">Indústria</SelectItem>
                <SelectItem value="REVENDA">Revenda</SelectItem>
                <SelectItem value="SERRALHERIA">Serralheria</SelectItem>
                <SelectItem value="CONSUMIDOR_FINAL">Consumidor Final</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ABC Histórico */}
          <div>
            <Select value={selectedAbcHist} onValueChange={setSelectedAbcHist}>
              <SelectTrigger className="h-9 text-xs rounded-xl">
                <SelectValue placeholder="ABC Histórico" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">ABC Histórico: Todos</SelectItem>
                <SelectItem value="A">Classe A (&gt;100t)</SelectItem>
                <SelectItem value="B">Classe B (40-100t)</SelectItem>
                <SelectItem value="C">Classe C (&lt;40t)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status / Inativos */}
          <div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="h-9 text-xs rounded-xl">
                <SelectValue placeholder="Status Carteira" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="Ativo">Clientes Ativos</SelectItem>
                <SelectItem value="Em Risco">Clientes Em Risco</SelectItem>
                <SelectItem value="Inativo">Clientes Inativos (Reativação)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Janela de Recompra */}
          <div>
            <Select value={selectedPurchaseMoment} onValueChange={setSelectedPurchaseMoment}>
              <SelectTrigger className="h-9 text-xs rounded-xl">
                <SelectValue placeholder="Recompra" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as Janelas</SelectItem>
                <SelectItem value="janela_imediata">Janela Imediata (&lt;=7d)</SelectItem>
                <SelectItem value="atencao">Em Atenção (&lt;=15d)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Visitas Planejadas */}
          <div>
            <Select value={selectedVisitaFilter} onValueChange={setSelectedVisitaFilter}>
              <SelectTrigger className="h-9 text-xs rounded-xl">
                <SelectValue placeholder="Visitas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas Visitas</SelectItem>
                <SelectItem value="com_visita">Com Visita Agendada</SelectItem>
                <SelectItem value="sem_visita_30d">Sem Visita &gt; 30 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mapa de Calor Comercial */}
          <div>
            <Select value={heatmapMetric} onValueChange={(v: any) => setHeatmapMetric(v)}>
              <SelectTrigger className="h-9 text-xs rounded-xl border-amber-200 bg-amber-50/50">
                <SelectValue placeholder="Heatmap" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="off">Heatmap: Desligado</SelectItem>
                <SelectItem value="tons">Calor por Toneladas</SelectItem>
                <SelectItem value="potencial">Calor por Potencial</SelectItem>
                <SelectItem value="inativos">Densidade de Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* GRID PRINCIPAL: PAINEL LATERAL DE ANALYTICS + CANVAS CARTOGRÁFICO */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* COLUNA 1: ANALYTICS DO MAPA & POLOS REGIONAIS */}
        <div className="space-y-4">
          {/* Card de Métricas do Mapa */}
          <Card className="bg-white/95 backdrop-blur-md rounded-2xl border-border/50 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-serif font-bold text-xs text-primary uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-primary" /> Analytics do Território
              </h4>
              <Badge variant="outline" className="text-[10px] bg-slate-50 font-mono">
                {mapKpis.count} clientes
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-border/40">
                <span className="text-[10px] text-muted-foreground block">Volume Realizado:</span>
                <strong className="font-mono text-primary text-sm block">
                  {mapKpis.totalTons.toFixed(1)} t
                </strong>
                {commercialMetric === 'REVENUE' && (
                  <span className="text-[9px] text-slate-500 block">
                    R$ {(mapKpis.totalRevenue / 1000).toFixed(0)}k
                  </span>
                )}
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-border/40">
                <span className="text-[10px] text-muted-foreground block">Potencial Total:</span>
                <strong className="font-mono text-emerald-600 text-sm block">
                  {mapKpis.totalPotentialTons.toFixed(1)} t
                </strong>
                <span className="text-[9px] text-emerald-700 block">
                  +{(mapKpis.totalPotentialTons - mapKpis.totalTons).toFixed(1)} t gap
                </span>
              </div>

              <div className="p-2.5 bg-blue-50/70 rounded-xl border border-blue-200/50">
                <span className="text-[10px] text-blue-900 block">Clientes Classe A:</span>
                <strong className="font-mono text-blue-900 text-sm block">
                  {mapKpis.clientesA} contas
                </strong>
                <span className="text-[9px] text-blue-700 block">
                  {((mapKpis.clientesA / (mapKpis.count || 1)) * 100).toFixed(0)}% da seleção
                </span>
              </div>

              <div className="p-2.5 bg-rose-50/70 rounded-xl border border-rose-200/50">
                <span className="text-[10px] text-rose-900 block">Em Risco / Inativos:</span>
                <strong className="font-mono text-rose-900 text-sm block">
                  {mapKpis.emRisco + mapKpis.inativos} contas
                </strong>
                <span className="text-[9px] text-rose-700 block">
                  {mapKpis.inativos} inativos para reativar
                </span>
              </div>
            </div>

            <div className="border-t pt-2 text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Visitas em rota agendadas:</span>
              <strong className="text-slate-900 font-mono">{mapKpis.visitasPendentes}</strong>
            </div>
          </Card>

          {/* Agrupamento por Polos / Cidades */}
          <Card className="bg-white/95 backdrop-blur-md rounded-2xl border-border/50 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <MapIcon className="h-3.5 w-3.5 text-primary" /> Polos & Concentração
              </h4>
              <span className="text-[10px] text-muted-foreground">
                {clustersByCity.length} municípios
              </span>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {clustersByCity.map((cluster) => {
                const isSelected = selectedClusterKey === `${cluster.city}-${cluster.uf}`
                const percentOfTotal = (
                  (cluster.totalTons / (mapKpis.totalTons || 1)) *
                  100
                ).toFixed(0)

                return (
                  <div
                    key={`${cluster.city}-${cluster.uf}`}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedClusterKey(null)
                      } else {
                        setSelectedClusterKey(`${cluster.city}-${cluster.uf}`)
                        setSelectedPoint(cluster.clientes[0])
                        toast.info(`Foco no polo de ${cluster.city}/${cluster.uf}`)
                      }
                    }}
                    className={cn(
                      'p-3 rounded-xl border transition-all cursor-pointer text-xs space-y-1.5',
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-xs ring-1 ring-primary'
                        : 'border-border/50 hover:bg-slate-50',
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <MapPin className="h-3 w-3 text-primary shrink-0" />
                        <span className="truncate">
                          {cluster.city} / {cluster.uf}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-mono bg-white font-bold">
                        {cluster.clientes.length}{' '}
                        {cluster.clientes.length === 1 ? 'cliente' : 'clientes'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Volume Polo:</span>
                      <strong className="text-primary font-mono">
                        {cluster.totalTons.toFixed(1)} t ({percentOfTotal}%)
                      </strong>
                    </div>

                    {/* Mini lista com os nomes dos clientes */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {cluster.clientes.slice(0, 3).map((c) => (
                        <span
                          key={c.id}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium"
                        >
                          {c.nomeFantasia.split(' ')[0]} ({c.toneladas12m}t)
                        </span>
                      ))}
                      {cluster.clientes.length > 3 && (
                        <span className="text-[9px] text-muted-foreground">
                          +{cluster.clientes.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        {/* COLUNA 2, 3 e 4: CANVAS DO MAPA CARTOGRÁFICO INTERATIVO */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="bg-slate-950 text-white rounded-3xl border-border/40 p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[560px]">
            {/* Camada cartográfica de fundo Leaflet/OpenStreetMap visualmente estilizada para Dark Industrial CIAFAL */}
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

            {/* Malha de contornos das principais rodovias de MG (Fernão Dias BR-381, BR-040, BR-262) */}
            <svg
              className="absolute inset-0 w-full h-full opacity-20 pointer-events-none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M 50 100 Q 250 250 450 320 T 800 500"
                stroke="#38bdf8"
                strokeWidth="2"
                fill="none"
                strokeDasharray="4 4"
              />
              <path
                d="M 120 40 Q 300 180 500 280 T 700 520"
                stroke="#10b981"
                strokeWidth="1.5"
                fill="none"
              />
              <path
                d="M 600 80 Q 480 260 380 420"
                stroke="#f59e0b"
                strokeWidth="1"
                fill="none"
                strokeDasharray="6 6"
              />
            </svg>

            {/* BARRA SUPERIOR DO CANVAS DO MAPA */}
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">
                    Dispersão Territorial — Polo Minas Gerais & Centros de Distribuição
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Hub Principal: CD Contagem (MG) · Provedor: OpenStreetMap Leaflet Engine
                  </span>
                </div>
              </div>

              {/* Legenda de Cores e Controles de Zoom */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-2 text-[10px] text-slate-300 bg-slate-900/80 px-2.5 py-1 rounded-xl border border-white/10">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> ABC A
                    (&gt;100t)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> ABC B
                    (40-100t)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" /> ABC C
                    (&lt;40t)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Inativo
                  </span>
                </div>

                <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-white/10">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-slate-300 hover:text-white"
                    onClick={() => setZoomLevel((z) => Math.min(2, z + 0.25))}
                    title="Aproximar Zoom"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-slate-300 hover:text-white"
                    onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.25))}
                    title="Afastar Zoom"
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-slate-300 hover:text-white"
                    onClick={() => {
                      setZoomLevel(1)
                      setSelectedPoint(null)
                      setSelectedClusterKey(null)
                    }}
                    title="Resetar Visão"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            {/* ÁREA INTERATIVA DE PLOTAGEM DOS CLIENTES COM MARKERS INTELIGENTES */}
            <div
              className="relative z-10 flex-1 my-4 min-h-[380px] rounded-2xl bg-slate-900/40 border border-white/10 overflow-hidden relative"
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'center center',
                transition: 'transform 0.3s ease-out',
              }}
            >
              {/* CD Central CIAFAL Contagem / Betim */}
              <div
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center pointer-events-none"
                style={{
                  left: '46%',
                  top: '52%',
                }}
              >
                <div className="w-6 h-6 rounded-full bg-[#003A70] border-2 border-white shadow-lg flex items-center justify-center text-[10px] font-bold text-white animate-pulse">
                  🏭
                </div>
                <span className="text-[9px] font-bold text-blue-200 bg-slate-950/80 px-1.5 py-0.5 rounded mt-0.5 border border-blue-400/40">
                  CD CIAFAL Contagem
                </span>
              </div>

              {/* Marcador do Vendedor (quando localizado) */}
              {sellerLocation && (
                <div
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center"
                  style={{
                    left: '47%',
                    top: '50%',
                  }}
                >
                  <div className="w-7 h-7 rounded-full bg-emerald-500 border-2 border-white shadow-xl flex items-center justify-center text-white animate-bounce">
                    <UserCheck className="h-4 w-4" />
                  </div>
                  <span className="text-[9px] font-bold text-emerald-200 bg-emerald-950/90 px-1.5 py-0.5 rounded mt-0.5 border border-emerald-400">
                    Você (Vendedor)
                  </span>
                </div>
              )}

              {/* Rota desenhada quando calculada */}
              {calculatedRoute && calculatedRoute.waypoints.length > 1 && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                  <polyline
                    points={calculatedRoute.waypoints
                      .map((wp) => {
                        const proj = projectToCanvas(wp.latitude, wp.longitude)
                        return `${proj.x}%,${proj.y}%`
                      })
                      .join(' ')}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3"
                    strokeDasharray="6 4"
                    className="animate-pulse"
                  />
                </svg>
              )}

              {/* PLOTAGEM DE TODOS OS CLIENTES */}
              {filteredClientes.map((c) => {
                const lat = c.latitude || -19.9328
                const lng = c.longitude || -44.0539
                const proj = projectToCanvas(lat, lng)
                const isSelected = selectedPoint?.id === c.id

                // Tamanho proporcional ao volume em toneladas (12m/potencial)
                const isA = c.abcHistorico === 'A'
                const isB = c.abcHistorico === 'B'
                const isC = c.abcHistorico === 'C'
                const isInativo = c.statusComercial === 'Inativo'

                const markerSize = isA ? 'w-9 h-9' : isB ? 'w-7 h-7' : 'w-6 h-6'
                const markerColor = isInativo
                  ? 'bg-rose-600 border-rose-300'
                  : isA
                    ? 'bg-blue-600 border-blue-300'
                    : isB
                      ? 'bg-amber-500 border-amber-200'
                      : 'bg-slate-600 border-slate-300'

                // Badges de contexto TMS e Qualidade
                const hasTms = tmsAlertMap[c.id]?.inTransit
                const hasQualityComplaint = (qualityComplaintsMap[c.id] || 0) > 0
                const hasVisitToday = c.proximaVisitaData?.includes('Hoje')

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedPoint(c)}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all hover:scale-125 z-20 group"
                    style={{
                      left: `${proj.x}%`,
                      top: `${proj.y}%`,
                    }}
                  >
                    {/* Marcador Principal */}
                    <div
                      className={cn(
                        'rounded-full border-2 flex items-center justify-center shadow-lg relative transition-all',
                        markerSize,
                        markerColor,
                        isSelected ? 'ring-4 ring-emerald-400 scale-110' : '',
                      )}
                    >
                      <span className="font-mono font-bold text-[10px] text-white">
                        {c.abcHistorico}
                      </span>

                      {/* Badge TMS Carga em Trânsito */}
                      {hasTms && (
                        <span
                          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-500 border border-white flex items-center justify-center text-white"
                          title="Carga em Trânsito (TMS)"
                        >
                          <Truck className="h-2.5 w-2.5" />
                        </span>
                      )}

                      {/* Badge Reclamação de Qualidade Aberta */}
                      {hasQualityComplaint && (
                        <span
                          className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full bg-rose-500 border border-white flex items-center justify-center text-white animate-pulse"
                          title="Reclamação de Qualidade Aberta"
                        >
                          <ShieldAlert className="h-2.5 w-2.5" />
                        </span>
                      )}

                      {/* Badge Visita Hoje */}
                      {hasVisitToday && (
                        <span
                          className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-amber-400 border border-white flex items-center justify-center text-slate-950 font-bold"
                          title="Visita Agendada Hoje"
                        >
                          <Calendar className="h-2.5 w-2.5" />
                        </span>
                      )}
                    </div>

                    {/* Tooltip Hover Rápido */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col items-center pointer-events-none z-30">
                      <div className="bg-slate-900/95 text-white text-[10px] font-semibold px-2 py-1 rounded-lg shadow-xl border border-white/20 whitespace-nowrap">
                        <span>{c.nomeFantasia}</span>
                        <span className="text-primary-foreground font-mono block text-[9px] text-blue-300">
                          {c.toneladas12m} t · {c.cidade}/{c.uf}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* CARD RÁPIDO DO CLIENTE SELECIONADO (BOTTOM BAR) */}
            {selectedPoint ? (
              <div className="relative z-10 bg-slate-900/95 border border-white/20 p-4 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 animate-fade-in shadow-2xl">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-white">
                      {selectedPoint.razaoSocial}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] border-white/20 text-blue-300 font-mono"
                    >
                      SAP #{selectedPoint.sapCode}
                    </Badge>
                    <ABCBadge category={selectedPoint.abcHistorico} type="carteira" />
                    <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px]">
                      {selectedPoint.arquetipoComercial || 'INDÚSTRIA'}
                    </Badge>
                    {tmsAlertMap[selectedPoint.id]?.inTransit && (
                      <Badge className="bg-emerald-500 text-white text-[9px] font-bold flex items-center gap-1">
                        <Truck className="h-3 w-3" /> Carga em Trânsito (TMS)
                      </Badge>
                    )}
                    {(qualityComplaintsMap[selectedPoint.id] || 0) > 0 && (
                      <Badge className="bg-rose-600 text-white text-[9px] font-bold flex items-center gap-1">
                        <ShieldAlert className="h-3 w-3" /> Reclamação de Qualidade Aberta
                      </Badge>
                    )}
                  </div>

                  <div className="text-xs text-slate-300 flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5">
                    <span>
                      Local:{' '}
                      <strong>
                        {selectedPoint.cidade}/{selectedPoint.uf}
                      </strong>
                    </span>
                    <span>
                      Vendedor: <strong>{selectedPoint.vendedor}</strong>
                    </span>
                    <span>
                      Volume 12m:{' '}
                      <strong className="text-emerald-400 font-mono">
                        {selectedPoint.toneladas12m} t
                      </strong>
                    </span>
                    <span>
                      P(vivo):{' '}
                      <strong className="text-amber-300 font-mono">{selectedPoint.pVivo}%</strong>
                    </span>
                    <span>
                      Última Compra: <strong>{selectedPoint.ultimaCompraData}</strong>
                    </span>
                    <span>
                      Próxima Ação:{' '}
                      <strong className="text-blue-300">{selectedPoint.proximaAcao}</strong>
                    </span>
                  </div>
                </div>

                {/* Botões de Ação do Ponto Selecionado */}
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs border-white/20 text-white hover:bg-white/10"
                    onClick={() => navigate(`/crm/${selectedPoint.id}`)}
                  >
                    Abrir Cliente 360º
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs border-emerald-500/50 text-emerald-300 hover:bg-emerald-950/40 gap-1"
                    onClick={() =>
                      navigate(
                        `/conversas?whatsapp=true&cliente=${encodeURIComponent(selectedPoint.nomeFantasia)}&id=${selectedPoint.id}`,
                      )
                    }
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    WhatsApp
                  </Button>

                  <Button
                    size="sm"
                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white gap-1"
                    onClick={() => {
                      navigate(
                        `/visitas?cliente=${encodeURIComponent(selectedPoint.nomeFantasia)}&sap=${selectedPoint.sapCode}`,
                      )
                      toast.success(
                        `Iniciando agendamento de visita para ${selectedPoint.nomeFantasia}!`,
                      )
                    }}
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    Agendar Visita
                  </Button>

                  {/* Ajuste Manual de Localização */}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-xs text-slate-400 hover:text-white"
                    onClick={() => {
                      setOverrideCustomer(selectedPoint)
                      setOverrideLat(String(selectedPoint.latitude || -19.9328))
                      setOverrideLng(String(selectedPoint.longitude || -44.0539))
                      setOverrideReason('Correção de portaria industrial pelo vendedor')
                      setManualOverrideOpen(true)
                    }}
                    title="Ajustar posição manual no mapa"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </Button>

                  {/* Reatribuição para Supervisores se Inativo */}
                  {isSupervisorOrAbove && selectedPoint.statusComercial === 'Inativo' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs border-amber-400 text-amber-300 hover:bg-amber-950/40"
                      onClick={() => {
                        setReassignCustomer(selectedPoint)
                        setReassignModalOpen(true)
                      }}
                    >
                      Reatribuir Inativo
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="relative z-10 bg-slate-900/60 border border-white/10 p-3 rounded-2xl text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Compass className="h-4 w-4 text-emerald-400" />
                Clique em qualquer cliente no mapa para ver resumo comercial, histórico de entregas
                TMS e agendar visitas em rota.
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* MODAL: AJUSTE MANUAL DE LOCALIZAÇÃO GEOGRÁFICA */}
      <Dialog open={manualOverrideOpen} onOpenChange={setManualOverrideOpen}>
        <DialogContent className="max-w-md bg-white rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-bold text-primary flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-emerald-600" />
              Ajustar Localização do Cliente no Mapa
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Ajuste autorizado da posição geográfica para correção de portaria ou pátio de
              recebimento.
              <strong className="block text-slate-900 mt-1">
                * O endereço fiscal oficial do SAP ECC permanece inalterado.
              </strong>
            </DialogDescription>
          </DialogHeader>

          {overrideCustomer && (
            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-border/50">
                <span className="font-bold text-slate-900 block">
                  {overrideCustomer.razaoSocial}
                </span>
                <span className="text-muted-foreground block text-[11px]">
                  SAP #{overrideCustomer.sapCode} · {overrideCustomer.cidade}/{overrideCustomer.uf}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Latitude:</label>
                  <Input
                    value={overrideLat}
                    onChange={(e) => setOverrideLat(e.target.value)}
                    className="h-9 text-xs font-mono rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Longitude:</label>
                  <Input
                    value={overrideLng}
                    onChange={(e) => setOverrideLng(e.target.value)}
                    className="h-9 text-xs font-mono rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Motivo do Ajuste:</label>
                <Input
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Ex: Portaria de carga pesada na Rodovia MG-030..."
                  className="h-9 text-xs rounded-xl"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center justify-end gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setManualOverrideOpen(false)}
              className="h-8 text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSaveManualOverride}
              className="h-8 text-xs bg-primary text-white rounded-xl font-semibold"
            >
              Salvar Ajuste Manual
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: PLANEJADOR DE ROTEIRO INTELIGENTE */}
      <Dialog open={routePlannerOpen} onOpenChange={setRoutePlannerOpen}>
        <DialogContent className="max-w-2xl bg-white rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-bold text-primary flex items-center gap-2">
              <Navigation className="h-5 w-5 text-emerald-600" />
              Planejamento Comercial de Roteiro de Visitas
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Otimização de visitas por proximidade territorial, janela de recompra e potencial em
              toneladas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Data do Roteiro:</label>
                <Input
                  type="date"
                  value={routeDate}
                  onChange={(e) => setRouteDate(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Ponto de Partida / Polo:
                </label>
                <Select value={routeStartingCity} onValueChange={setRouteStartingCity}>
                  <SelectTrigger className="h-9 text-xs rounded-xl">
                    <SelectValue placeholder="Cidade Polo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Contagem">CD CIAFAL Contagem / MG</SelectItem>
                    <SelectItem value="Belo Horizonte">Belo Horizonte / MG</SelectItem>
                    <SelectItem value="Betim">Betim / MG</SelectItem>
                    <SelectItem value="Uberlândia">Uberlândia (Triângulo)</SelectItem>
                    <SelectItem value="Juiz de Fora">Juiz de Fora (Zona da Mata)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Resultado do Cálculo */}
            {calculatedRoute && (
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900 text-xs">
                    Roteiro Otimizado pela Inteligência CIAFAL
                  </span>
                  <Badge className="bg-emerald-600 text-white font-mono text-[10px]">
                    {calculatedRoute.totalDistanceKm} km · ~{calculatedRoute.estimatedTotalHours}h
                  </Badge>
                </div>
                <p className="text-[11px] text-emerald-800">
                  {calculatedRoute.optimizedRouteSummary}
                </p>

                <div className="space-y-2 border-t border-emerald-200/60 pt-2">
                  {calculatedRoute.waypoints.map((wp, i) => (
                    <div
                      key={wp.id}
                      className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-emerald-200/50 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <strong className="text-slate-900">{wp.title}</strong>
                      </div>
                      <span className="text-muted-foreground font-mono text-[11px]">
                        SAP #{wp.customerSap} · 45 min
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex items-center justify-between gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePlanRoute}
              disabled={isCalculatingRoute}
              className="h-8 text-xs rounded-xl gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              {isCalculatingRoute ? 'Calculando...' : 'Recalcular Rota com IA'}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setRoutePlannerOpen(false)
                toast.success('Roteiro salvo na Gestão do Dia e módulo de Visitas!')
              }}
              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold gap-1"
            >
              <Check className="h-3.5 w-3.5" />
              Confirmar e Agendar Roteiro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: REATRIBUIÇÃO DE INATIVO POR SUPERVISOR */}
      <Dialog open={reassignModalOpen} onOpenChange={setReassignModalOpen}>
        <DialogContent className="max-w-md bg-white rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-bold text-primary">
              Reatribuição Territorial de Cliente Inativo
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Encaminhe a conta inativa para um vendedor ou representante mais próximo da região.
            </DialogDescription>
          </DialogHeader>

          {reassignCustomer && (
            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-border/50">
                <span className="font-bold text-slate-900 block">
                  {reassignCustomer.razaoSocial}
                </span>
                <span className="text-muted-foreground block text-[11px]">
                  Localização: {reassignCustomer.cidade}/{reassignCustomer.uf} · Inativo há{' '}
                  {reassignCustomer.diasSemContato} dias
                </span>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Novo Responsável:</label>
                <Select value={targetSeller} onValueChange={setTargetSeller}>
                  <SelectTrigger className="h-9 text-xs rounded-xl">
                    <SelectValue placeholder="Selecione o vendedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Carlos Mendonça">Carlos Mendonça (Indústria)</SelectItem>
                    <SelectItem value="Mariana Azevedo">Mariana Azevedo (Construção)</SelectItem>
                    <SelectItem value="João Pedro Representações">
                      João Pedro (Rep. Externo)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter className="flex items-center justify-end gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setReassignModalOpen(false)}
              className="h-8 text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmReassign}
              className="h-8 text-xs bg-primary text-white rounded-xl font-semibold"
            >
              Confirmar Reatribuição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
