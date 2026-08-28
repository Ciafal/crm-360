import React, { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  HeartHandshake,
  ShieldAlert,
  AlertTriangle,
  Smile,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Search,
  SlidersHorizontal,
  RefreshCw,
  PlusCircle,
  FileSpreadsheet,
  CheckCircle2,
  PhoneCall,
  Calendar,
  Layers,
  ChevronRight,
  Database,
  ArrowUpDown,
  FileText,
  Clock,
  ShieldCheck,
  UserCheck,
  Sliders,
  Settings,
  HelpCircle,
  MessageSquare,
  Truck,
  DollarSign,
  PackageCheck,
  Building2,
  Info,
} from 'lucide-react'
import {
  ClienteSatisfacao360,
  ISCBand,
  ISCPesosConfig,
  PlanoRecuperacao,
  CampanhaPesquisa,
  RespostaPesquisaCliente,
  ISCPesoHistoryEntry,
} from '@/types/satisfaction'
import {
  mockClientesSatisfacao,
  mockCampanhasPesquisa,
  mockRespostasPesquisa,
  mockPesosHistorico,
  mockPlanosRecuperacao,
  satisfactionService,
} from '@/services/satisfaction_service'
import { DEFAULT_ISC_PESOS, DEFAULT_ISC_BANDS } from '@/services/isc_engine'

// Componentes modulares
import { Customer360SatisfactionSheet } from '@/components/satisfacao/Customer360SatisfactionSheet'
import { EntenderISCDialog } from '@/components/satisfacao/EntenderISCDialog'
import { AnaliseIADialog } from '@/components/satisfacao/AnaliseIADialog'
import { MatrizValorSatisfacao } from '@/components/satisfacao/MatrizValorSatisfacao'
import { PlanosRecuperacaoView } from '@/components/satisfacao/PlanosRecuperacaoView'
import { PesquisasView } from '@/components/satisfacao/PesquisasView'
import { ConfiguracoesISCView } from '@/components/satisfacao/ConfiguracoesISCView'
import { EvolucaoSatisfacaoView } from '@/components/satisfacao/EvolucaoSatisfacaoView'
import { CriarPlanoRecuperacaoModal } from '@/components/satisfacao/CriarPlanoRecuperacaoModal'
import { VisaoGestorRanking } from '@/components/satisfacao/VisaoGestorRanking'
import { toast } from 'sonner'

type ActiveSection =
  | 'visao-geral'
  | 'atencao'
  | 'risco'
  | 'criticos'
  | 'evolucao'
  | 'reclamacoes'
  | 'pesquisas'
  | 'planos'
  | 'analise-ia'
  | 'configuracoes'

export default function SatisfacaoClientes() {
  // Estado principal de dados
  const [clientes, setClientes] = useState<ClienteSatisfacao360[]>(mockClientesSatisfacao)
  const [planos, setPlanos] = useState<PlanoRecuperacao[]>(mockPlanosRecuperacao)
  const [campanhas, setCampanhas] = useState<CampanhaPesquisa[]>(mockCampanhasPesquisa)
  const [respostas, setRespostas] = useState<RespostaPesquisaCliente[]>(mockRespostasPesquisa)
  const [pesos, setPesos] = useState<ISCPesosConfig>(DEFAULT_ISC_PESOS)
  const [pesosHistory, setPesosHistory] = useState<ISCPesoHistoryEntry[]>(mockPesosHistorico)
  const [bands, setBands] = useState(DEFAULT_ISC_BANDS)

  // Navegação por abas principais exigidas
  const [activeSection, setActiveSection] = useState<ActiveSection>('visao-geral')

  // Filtros e Visões (RBAC: Minha Carteira vs Visão Geral/Gestor)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedVendedor, setSelectedVendedor] = useState<string>('todos')
  const [selectedSegmento, setSelectedSegmento] = useState<string>('todos')
  const [userRole, setUserRole] = useState<'vendedor' | 'gestor' | 'master'>('gestor')
  const currentSellerName = 'Carlos Mendonça' // Vendedor logado para "Minha Carteira"

  // Modais e Sheets de interação
  const [selectedCliente, setSelectedCliente] = useState<ClienteSatisfacao360 | null>(null)
  const [entenderISCCliente, setEntenderISCCliente] = useState<ClienteSatisfacao360 | null>(null)
  const [analisarIACliente, setAnalisarIACliente] = useState<ClienteSatisfacao360 | null>(null)
  const [criarPlanoModalOpen, setCriarPlanoModalOpen] = useState(false)
  const [clienteParaPlano, setClienteParaPlano] = useState<ClienteSatisfacao360 | null>(null)

  // FILTRAGEM RBAC & BUSCA
  const filteredClientes = useMemo(() => {
    return clientes.filter((c) => {
      // Regra de perfil: vendedor vê apenas a sua carteira
      if (userRole === 'vendedor' && c.vendedorNome !== currentSellerName) {
        return false
      }

      if (selectedVendedor !== 'todos' && c.vendedorNome !== selectedVendedor) {
        return false
      }

      if (selectedSegmento !== 'todos' && c.segmento !== selectedSegmento) {
        return false
      }

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase()
        const matchName = c.razaoSocial.toLowerCase().includes(query)
        const matchSap = c.sapCode.toLowerCase().includes(query)
        const matchCnpj = c.cnpj.toLowerCase().includes(query)
        const matchVend = c.vendedorNome.toLowerCase().includes(query)
        if (!matchName && !matchSap && !matchCnpj && !matchVend) return false
      }

      return true
    })
  }, [clientes, userRole, selectedVendedor, selectedSegmento, searchTerm])

  // KPIs CONSOLIDADOS DO DASHBOARD EXECUTIVO
  const kpis = useMemo(() => {
    const total = filteredClientes.length
    if (total === 0) {
      return {
        total: 0,
        iscMedio: 0,
        excelentes: 0,
        satisfeitos: 0,
        atencao: 0,
        risco: 0,
        criticos: 0,
        melhoraram: 0,
        pioraram: 0,
        reclamacoesAbertas: 0,
        ocorrenciasLog: 0,
        quedaVolumeCount: 0,
        semCompraCount: 0,
      }
    }

    const iscSoma = filteredClientes.reduce((acc, c) => acc + c.iscAtual, 0)
    const excelentes = filteredClientes.filter((c) => c.faixaISC === 'EXCELENTE').length
    const satisfeitos = filteredClientes.filter((c) => c.faixaISC === 'SATISFEITO').length
    const atencao = filteredClientes.filter((c) => c.faixaISC === 'ATENCAO').length
    const risco = filteredClientes.filter((c) => c.faixaISC === 'RISCO').length
    const criticos = filteredClientes.filter((c) => c.faixaISC === 'CRITICO').length

    const melhoraram = filteredClientes.filter((c) => c.iscVariacao > 0).length
    const pioraram = filteredClientes.filter((c) => c.iscVariacao < 0).length

    const reclamacoesAbertas = filteredClientes.reduce(
      (acc, c) => acc + c.dimensaoQualidade.reclamacoesAbertas,
      0,
    )
    const ocorrenciasLog = filteredClientes.reduce(
      (acc, c) => acc + c.dimensaoLogistica.ocorrenciasTMS,
      0,
    )
    const quedaVolumeCount = filteredClientes.filter(
      (c) => c.dimensaoComercial.variacaoVolumePct < -15,
    ).length
    const semCompraCount = filteredClientes.filter(
      (c) => c.dimensaoComercial.diasSemCompra > 45,
    ).length

    return {
      total,
      iscMedio: Math.round(iscSoma / total),
      excelentes,
      satisfeitos,
      atencao,
      risco,
      criticos,
      melhoraram,
      pioraram,
      reclamacoesAbertas,
      ocorrenciasLog,
      quedaVolumeCount,
      semCompraCount,
    }
  }, [filteredClientes])

  // CLIENTES POR CATEGORIAS ESPECÍFICAS
  const clientesAtencao = useMemo(
    () => filteredClientes.filter((c) => c.faixaISC === 'ATENCAO'),
    [filteredClientes],
  )
  const clientesRisco = useMemo(
    () =>
      filteredClientes
        .filter((c) => c.faixaISC === 'RISCO')
        .sort((a, b) => b.scoreValorEstrategico - a.scoreValorEstrategico),
    [filteredClientes],
  )
  const clientesCriticos = useMemo(
    () => filteredClientes.filter((c) => c.faixaISC === 'CRITICO'),
    [filteredClientes],
  )
  const clientesReclamacoes = useMemo(
    () =>
      filteredClientes.filter(
        (c) => c.dimensaoQualidade.reclamacoesAbertas > 0 || c.dimensaoLogistica.ocorrenciasTMS > 0,
      ),
    [filteredClientes],
  )

  // HANDLERS DE AÇÕES
  const handleSavePesos = (novosPesos: ISCPesosConfig, motivo: string) => {
    setPesos(novosPesos)
    const novoHistorico: ISCPesoHistoryEntry = {
      id: `pes-hist-${Date.now()}`,
      pesosAnteriores: pesos,
      pesosNovos: novosPesos,
      userRole: 'ADMIN_MASTER',
      updatedBy: 'Administrador Master',
      updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      motivo,
    }
    setPesosHistory([novoHistorico, ...pesosHistory])
    toast.success('Pesos corporativos do ISC atualizados e aplicados à carteira!')
  }

  const handleCreatePlano = (
    novoPlano: Omit<PlanoRecuperacao, 'id' | 'criadoEm' | 'atualizadoEm' | 'is_mock'>,
  ) => {
    const planoCompleto: PlanoRecuperacao = {
      ...novoPlano,
      id: `rec-plan-${Date.now()}`,
      criadoEm: new Date().toISOString().split('T')[0],
      atualizadoEm: new Date().toISOString().split('T')[0],
      is_mock: true,
    }
    setPlanos([planoCompleto, ...planos])

    // Atualiza status no cliente
    setClientes((prev) =>
      prev.map((c) =>
        c.id === novoPlano.clienteId
          ? {
              ...c,
              possuiPlanoRecuperacaoAtivo: true,
              planoRecuperacaoId: planoCompleto.id,
            }
          : c,
      ),
    )
  }

  const handleCreateTaskFromAction = (cliente: ClienteSatisfacao360, acao: string) => {
    toast.success(`Tarefa criada no CRM: "${acao}" para o cliente ${cliente.razaoSocial}!`, {
      description: `Atribuída a ${cliente.vendedorNome} · ISC no momento: ${cliente.iscAtual}/100.`,
    })
  }

  const handleCreateCotacaoFromOpportunity = (cliente: ClienteSatisfacao360) => {
    toast.success(`Nova Cotação gerada para ${cliente.razaoSocial}!`, {
      description: 'Rastreabilidade ISC ativada no módulo Comercial.',
    })
  }

  const handleOpenCriarPlano = (cliente?: ClienteSatisfacao360) => {
    setClienteParaPlano(cliente || null)
    setCriarPlanoModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-black text-slate-100 pb-20">
      {/* BANNER OFICIAL DE DEMONSTRAÇÃO & INTEGRAÇÃO MOTOR ISC */}
      <div className="bg-gradient-to-r from-sky-950/80 via-slate-900 to-slate-950 border-b border-sky-900/40 px-4 py-2 text-xs flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge className="bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[10px] font-mono uppercase tracking-wider">
            DADOS DE DEMONSTRAÇÃO (is_mock=true)
          </Badge>
          <span className="text-slate-300 text-[11px] hidden md:inline">
            Motor ISC Operante · Conexão SAP ECC (14:20), TMS Frota (14:18), SAC Qualidade (14:15)
          </span>
        </div>

        {/* SELETOR DE PERFIL RBAC */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Perfil:</span>
          <div className="flex bg-slate-950 p-0.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setUserRole('vendedor')}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold transition-all ${
                userRole === 'vendedor'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Minha Carteira (Vendedor)
            </button>
            <button
              onClick={() => setUserRole('gestor')}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold transition-all ${
                userRole === 'gestor' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Visão Gestor (Equipe)
            </button>
            <button
              onClick={() => setUserRole('master')}
              className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold transition-all ${
                userRole === 'master' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Admin Master
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* CABEÇALHO PRINCIPAL DO MÓDULO SATISFAÇÃO DE CLIENTES */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-[#003A70]/40 border border-[#005a9c]/50 text-sky-400 shadow-sm">
                <HeartHandshake className="w-7 h-7" />
              </div>
              <div>
                <h1 className="font-serif text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  Satisfação de Clientes
                  <Badge className="bg-[#003A70] text-sky-200 border-[#005a9c] text-xs font-mono">
                    Índice ISC Oficial
                  </Badge>
                </h1>
                <p className="text-xs text-slate-400">
                  CRM 360 CIAFAL · Inteligência proativa de relacionamento, retenção e recuperação
                  de carteira.
                </p>
              </div>
            </div>
          </div>

          {/* BOTÕES RÁPIDOS DE AÇÃO */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              onClick={() => handleOpenCriarPlano()}
              className="h-9 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-2xl shadow-xs gap-1.5"
            >
              <PlusCircle className="w-4 h-4" /> Criar Plano de Recuperação
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setActiveSection('configuracoes')}
              className="h-9 text-xs text-slate-300 border-slate-800 hover:bg-slate-900 rounded-2xl gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5 text-sky-400" /> Configurar Pesos ISC
            </Button>
          </div>
        </div>

        {/* 10 ÁREAS DO MÓDULO (BARRA DE NAVEGAÇÃO INTERNA) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin border-b border-slate-800/80">
          {[
            {
              id: 'visao-geral',
              label: 'Visão Geral',
              icon: Layers,
              count: filteredClientes.length,
            },
            {
              id: 'atencao',
              label: 'Clientes em Atenção',
              icon: AlertTriangle,
              count: kpis.atencao,
              badgeClass: 'text-amber-400',
            },
            {
              id: 'risco',
              label: 'Clientes em Risco',
              icon: ShieldAlert,
              count: kpis.risco,
              badgeClass: 'text-orange-400',
            },
            {
              id: 'criticos',
              label: 'Clientes Críticos',
              icon: ShieldAlert,
              count: kpis.criticos,
              badgeClass: 'text-rose-400',
            },
            { id: 'evolucao', label: 'Evolução da Satisfação', icon: TrendingUp },
            {
              id: 'reclamacoes',
              label: 'Reclamações & Ocorrências',
              icon: Truck,
              count: kpis.reclamacoesAbertas,
            },
            {
              id: 'pesquisas',
              label: 'Pesquisas (NPS/CSAT)',
              icon: Smile,
              count: campanhas.length,
            },
            {
              id: 'planos',
              label: 'Planos de Recuperação',
              icon: CheckCircle2,
              count: planos.length,
            },
            { id: 'analise-ia', label: 'Matriz Valor × ISC', icon: Sparkles },
            { id: 'configuracoes', label: 'Configurações do ISC', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeSection === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as ActiveSection)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#003A70] text-white shadow-xs border border-sky-400/40'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-slate-800/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-sky-300' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 text-[10px] rounded-full bg-slate-900/90 border border-slate-700/60 font-mono ${
                      tab.badgeClass || 'text-slate-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* DASHBOARD EXECUTIVO PRINCIPAL (VISÃO DE TENDÊNCIA & CARDS DE CONTROLE) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* ISC MÉDIO DA CARTEIRA */}
          <Card className="p-4 rounded-3xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              ISC Médio Carteira
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-serif text-white">
                {kpis.iscMedio}
                <span className="text-xs font-sans text-slate-400">/100</span>
              </span>
              <Badge
                variant="outline"
                className={`text-[10px] font-bold ${
                  kpis.iscMedio >= 80
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : kpis.iscMedio >= 70
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}
              >
                {kpis.iscMedio >= 80 ? 'Satisfeito' : kpis.iscMedio >= 70 ? 'Atenção' : 'Risco'}
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-400">
              <TrendingUp className="w-3 h-3" />
              <span>+2.4 pts vs mês anterior (YTD: 81)</span>
            </div>
          </Card>

          {/* CLIENTES EXCELENTES & SATISFEITOS */}
          <Card className="p-4 rounded-3xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Excelente / Satisfeito
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-serif text-emerald-400">
                {kpis.excelentes + kpis.satisfeitos}
              </span>
              <span className="text-xs text-slate-400">
                ({Math.round(((kpis.excelentes + kpis.satisfeitos) / (kpis.total || 1)) * 100)}%)
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block">
              {kpis.excelentes} Excelente · {kpis.satisfeitos} Satisfeito
            </span>
          </Card>

          {/* CLIENTES EM ATENÇÃO */}
          <Card className="p-4 rounded-3xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
              Clientes em Atenção
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-serif text-amber-400">{kpis.atencao}</span>
              <span className="text-xs text-slate-400">Faixa 70–79</span>
            </div>
            <span className="text-[10px] text-slate-400 block">Alerta preventivo ativo</span>
          </Card>

          {/* CLIENTES EM RISCO */}
          <Card className="p-4 rounded-3xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 block">
              Clientes em Risco
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-serif text-orange-400">{kpis.risco}</span>
              <span className="text-xs text-slate-400">Faixa 60–69</span>
            </div>
            <span className="text-[10px] text-orange-400/80 block">Prioridade comercial</span>
          </Card>

          {/* CLIENTES CRÍTICOS */}
          <Card className="p-4 rounded-3xl bg-slate-950 border border-rose-900/40 bg-rose-950/10 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block">
              Clientes Críticos
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-serif text-rose-400">{kpis.criticos}</span>
              <span className="text-xs text-slate-400">Abaixo de 60</span>
            </div>
            <span className="text-[10px] text-rose-400 font-semibold block">
              {planos.length} Planos de recuperação
            </span>
          </Card>

          {/* RECLAMAÇÕES & LOGÍSTICA */}
          <Card className="p-4 rounded-3xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Gargalos Ativos
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-serif text-white">
                {kpis.reclamacoesAbertas} SAC / {kpis.ocorrenciasLog} TMS
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block">
              {kpis.quedaVolumeCount} clientes c/ queda volume
            </span>
          </Card>
        </div>

        {/* FILTROS E BUSCA RÁPIDA (QUANDO VISÃO GERAL OU LISTAS) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar cliente, SAP, CNPJ ou vendedor..."
              className="pl-8 h-8 text-xs bg-slate-900 border-slate-800 text-white rounded-xl"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            {userRole !== 'vendedor' && (
              <select
                value={selectedVendedor}
                onChange={(e) => setSelectedVendedor(e.target.value)}
                className="h-8 text-xs bg-slate-900 border border-slate-800 text-slate-200 rounded-xl px-2.5 focus:outline-hidden"
              >
                <option value="todos">Todos os Vendedores</option>
                <option value="Carlos Mendonça">Carlos Mendonça</option>
                <option value="Mariana Silva">Mariana Silva</option>
                <option value="Roberto Prado">Roberto Prado</option>
                <option value="Luciana Ribeiro">Luciana Ribeiro</option>
              </select>
            )}

            <select
              value={selectedSegmento}
              onChange={(e) => setSelectedSegmento(e.target.value)}
              className="h-8 text-xs bg-slate-900 border border-slate-800 text-slate-200 rounded-xl px-2.5 focus:outline-hidden"
            >
              <option value="todos">Todos os Segmentos</option>
              <option value="Construção Civil">Construção Civil</option>
              <option value="Estruturas Metálicas">Estruturas Metálicas</option>
              <option value="Indústria Metalmecânica">Indústria Metalmecânica</option>
              <option value="Revenda de Aço">Revenda de Aço</option>
            </select>
          </div>
        </div>

        {/* CONTEÚDO DINÂMICO CONFORME A ABA SELECIONADA */}

        {/* 1. VISÃO GERAL */}
        {activeSection === 'visao-geral' && (
          <div className="space-y-6">
            {/* RANKING DO GESTOR CASO NÃO SEJA VENDEDOR ISOLADO */}
            {userRole !== 'vendedor' && (
              <VisaoGestorRanking
                clientes={clientes}
                onSelectVendedor={(v) => setSelectedVendedor(v)}
              />
            )}

            {/* TABELA PRINCIPAL DE CLIENTES */}
            <Card className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white font-serif flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-sky-400" />
                    Carteira de Clientes — Ficha de Satisfação 360º & Scores
                  </h3>
                  <span className="text-xs text-slate-400">
                    Clique no cliente para abrir a ficha completa 360º com histórico, qualidade,
                    logística e plano.
                  </span>
                </div>

                <span className="text-xs text-slate-400">
                  Exibindo {filteredClientes.length} de {clientes.length} clientes
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Cliente / SAP</th>
                      <th className="py-2.5 px-3">Segmento / Região</th>
                      <th className="py-2.5 px-3">Vendedor</th>
                      <th className="py-2.5 px-3 text-center">Faturamento YTD</th>
                      <th className="py-2.5 px-3 text-center">Volume YTD</th>
                      <th className="py-2.5 px-3 text-center">ISC Oficial</th>
                      <th className="py-2.5 px-3 text-center">Tendência</th>
                      <th className="py-2.5 px-3 text-center">Gargalo Principal</th>
                      <th className="py-2.5 px-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredClientes.map((cliente) => (
                      <tr
                        key={cliente.id}
                        onClick={() => setSelectedCliente(cliente)}
                        className="hover:bg-slate-900/60 transition-all cursor-pointer group"
                      >
                        <td className="py-3 px-3">
                          <div className="font-bold text-white group-hover:text-sky-300 transition-colors">
                            {cliente.razaoSocial}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            SAP #{cliente.sapCode} · {cliente.cnpj}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="text-slate-300">{cliente.segmento}</div>
                          <div className="text-[11px] text-slate-400">
                            {cliente.regiao} · Curva {cliente.classificacaoCliente}
                          </div>
                        </td>

                        <td className="py-3 px-3 text-slate-300">{cliente.vendedorNome}</td>

                        <td className="py-3 px-3 text-center font-mono text-slate-200">
                          R${' '}
                          {cliente.faturamentoYTD.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                          })}
                        </td>

                        <td className="py-3 px-3 text-center font-mono text-slate-200">
                          {cliente.volumeYTD.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}{' '}
                          t
                        </td>

                        <td className="py-3 px-3 text-center">
                          <Badge
                            variant="outline"
                            className={`font-mono font-bold text-xs ${
                              cliente.faixaISC === 'EXCELENTE'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : cliente.faixaISC === 'SATISFEITO'
                                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                  : cliente.faixaISC === 'ATENCAO'
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                    : cliente.faixaISC === 'RISCO'
                                      ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            }`}
                          >
                            {cliente.iscAtual}/100 [{cliente.faixaISC}]
                          </Badge>
                        </td>

                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {cliente.iscVariacao > 0 ? (
                              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                            ) : cliente.iscVariacao < 0 ? (
                              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                            <span
                              className={`text-[11px] font-semibold ${
                                cliente.iscVariacao > 0
                                  ? 'text-emerald-400'
                                  : cliente.iscVariacao < 0
                                    ? 'text-rose-400'
                                    : 'text-slate-400'
                              }`}
                            >
                              {cliente.iscVariacao > 0
                                ? `+${cliente.iscVariacao}`
                                : cliente.iscVariacao}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-center">
                          {cliente.impactosNegativos.length > 0 ? (
                            <span className="text-[11px] text-amber-300 truncate max-w-[180px] block">
                              {cliente.impactosNegativos[0]}
                            </span>
                          ) : (
                            <span className="text-[11px] text-emerald-400">Regular / Estável</span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right">
                          <div
                            className="flex items-center justify-end gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEntenderISCCliente(cliente)}
                              className="h-7 px-2 text-[11px] text-sky-400 hover:text-white hover:bg-slate-800 rounded-lg"
                            >
                              Entender ISC
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setAnalisarIACliente(cliente)}
                              className="h-7 px-2 text-[11px] text-purple-400 hover:text-purple-300 hover:bg-slate-800 rounded-lg"
                            >
                              <Sparkles className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* 2. CLIENTES EM ATENÇÃO */}
        {activeSection === 'atencao' && (
          <Card className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div>
                <h3 className="text-sm font-bold text-amber-400 font-serif flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Clientes em Faixa de Atenção (ISC 70 a 79) — Alerta Preventivo
                </h3>
                <span className="text-xs text-slate-400">
                  Atue antes que o cliente atinja a faixa de risco. Monitoramento de deterioração
                  inicial.
                </span>
              </div>
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                {clientesAtencao.length} Clientes
              </Badge>
            </div>

            <div className="space-y-3">
              {clientesAtencao.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-amber-500/40 transition-all cursor-pointer"
                  onClick={() => setSelectedCliente(c)}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-sm font-bold text-white hover:underline">
                        {c.razaoSocial}
                      </strong>
                      <Badge variant="outline" className="text-xs bg-slate-950 text-slate-300">
                        SAP #{c.sapCode}
                      </Badge>
                      <Badge className="bg-amber-500/20 text-amber-400 text-xs">
                        ISC {c.iscAtual}/100 ({c.iscVariacao})
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-300">
                      <strong>Motivo:</strong>{' '}
                      {c.impactosNegativos[0] || 'Queda sutil de frequência de compra'}
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-slate-400">
                      <span>
                        Vendedor: <strong className="text-slate-300">{c.vendedorNome}</strong>
                      </span>
                      <span>
                        Último Contato:{' '}
                        <strong className="text-slate-300">
                          {c.dimensaoComercial.diasUltimoContato} dias atrás
                        </strong>
                      </span>
                      <span>
                        Próxima Ação:{' '}
                        <strong className="text-sky-300">
                          {c.analiseIA?.proximaMelhorAcao?.acao}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      onClick={() =>
                        handleCreateTaskFromAction(
                          c,
                          c.analiseIA?.proximaMelhorAcao?.acao || 'Contato',
                        )
                      }
                      className="h-8 text-xs bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl"
                    >
                      Criar Tarefa
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAnalisarIACliente(c)}
                      className="h-8 text-xs text-purple-400 border-slate-700 hover:bg-slate-800 rounded-xl"
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1" /> IA
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 3. CLIENTES EM RISCO */}
        {activeSection === 'risco' && (
          <Card className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div>
                <h3 className="text-sm font-bold text-orange-400 font-serif flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  Ranking de Prioridade de Clientes em Risco (ISC 60 a 69)
                </h3>
                <span className="text-xs text-slate-400">
                  Ordenação priorizada por valor estratégico, queda de volume, faturamento e
                  relevância.
                </span>
              </div>
              <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">
                {clientesRisco.length} Clientes em Risco
              </Badge>
            </div>

            <div className="space-y-3">
              {clientesRisco.map((c, index) => (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl bg-slate-900/70 border border-orange-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-orange-500 transition-all cursor-pointer"
                  onClick={() => setSelectedCliente(c)}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-xs font-bold font-mono">
                        #{index + 1}
                      </span>
                      <strong className="text-sm font-bold text-white hover:underline">
                        {c.razaoSocial}
                      </strong>
                      <Badge className="bg-orange-500/20 text-orange-400 text-xs">
                        ISC {c.iscAtual}/100
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-slate-950 text-slate-300">
                        Valor Estratégico: {c.scoreValorEstrategico}/100
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-300 pt-1">
                      <div>
                        Faturamento YTD:{' '}
                        <strong className="text-white">
                          R$ {c.faturamentoYTD.toLocaleString('pt-BR')}
                        </strong>
                      </div>
                      <div>
                        Volume YTD:{' '}
                        <strong className="text-white">{c.volumeYTD.toFixed(1)} t</strong>
                      </div>
                      <div>
                        Queda Volume:{' '}
                        <strong className="text-rose-400">
                          {c.dimensaoComercial.variacaoVolumePct}%
                        </strong>
                      </div>
                      <div>
                        Vendedor: <strong className="text-sky-300">{c.vendedorNome}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      onClick={() => handleOpenCriarPlano(c)}
                      className="h-8 text-xs bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl"
                    >
                      Abrir Plano
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAnalisarIACliente(c)}
                      className="h-8 text-xs text-purple-400 border-slate-700 hover:bg-slate-800 rounded-xl"
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1" /> IA
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 4. CLIENTES CRÍTICOS */}
        {activeSection === 'criticos' && (
          <Card className="p-6 rounded-3xl bg-slate-950 border border-rose-600/40 bg-rose-950/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-800/60 pb-3">
              <div>
                <h3 className="text-base font-bold text-rose-400 font-serif flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-500 animate-pulse" />
                  Painel de Clientes Críticos (ISC &lt; 60) — Intervenção Imediata
                </h3>
                <span className="text-xs text-slate-400">
                  Exibição detalhada de faturamento, volume, causas raízes, vendedor e planos
                  formais de recuperação.
                </span>
              </div>
              <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/40 text-xs">
                {clientesCriticos.length} Críticos
              </Badge>
            </div>

            <div className="space-y-4">
              {clientesCriticos.map((c) => (
                <div
                  key={c.id}
                  className="p-5 rounded-3xl bg-slate-950 border border-rose-500/40 space-y-3 hover:border-rose-400 transition-all cursor-pointer"
                  onClick={() => setSelectedCliente(c)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-base font-bold text-white hover:underline">
                          {c.razaoSocial}
                        </strong>
                        <Badge variant="outline" className="text-xs bg-slate-900 text-slate-300">
                          SAP #{c.sapCode}
                        </Badge>
                        <Badge className="bg-rose-500 text-white font-mono font-bold text-xs">
                          ISC {c.iscAtual}/100 [CRÍTICO]
                        </Badge>
                      </div>
                      <span className="text-xs text-slate-400 block mt-1">
                        Gestor Responsável: {c.gestorNome} · Vendedor: {c.vendedorNome} · Região:{' '}
                        {c.regiao}
                      </span>
                    </div>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        onClick={() => handleOpenCriarPlano(c)}
                        className="h-8 text-xs bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl"
                      >
                        <PlusCircle className="w-3.5 h-3.5 mr-1" /> Plano de Recuperação
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAnalisarIACliente(c)}
                        className="h-8 text-xs text-purple-400 border-slate-700 hover:bg-slate-900 rounded-xl"
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-1" /> Análise IA
                      </Button>
                    </div>
                  </div>

                  {/* CAUSAS PRINCIPAIS & IMPACTOS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-2xl bg-rose-950/30 border border-rose-500/30 space-y-1">
                      <span className="text-[11px] font-bold text-rose-300 block">
                        Principais Causas de Deterioração:
                      </span>
                      <ul className="list-disc list-inside text-slate-300 space-y-0.5">
                        {c.impactosNegativos.map((imp, idx) => (
                          <li key={idx}>{imp}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <span className="text-[11px] font-bold text-sky-300 block">
                        Próxima Ação Recomendada:
                      </span>
                      <p className="text-slate-300">{c.analiseIA?.proximaMelhorAcao?.acao}</p>
                      <span className="text-[10px] text-slate-400">
                        Justificativa: {c.analiseIA?.proximaMelhorAcao?.justificativa} (Prazo:{' '}
                        {c.analiseIA?.proximaMelhorAcao?.prazoSugeridoDias} dias)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 5. EVOLUÇÃO DA SATISFAÇÃO */}
        {activeSection === 'evolucao' && (
          <EvolucaoSatisfacaoView
            clientes={filteredClientes}
            onSelectCliente={(c) => setSelectedCliente(c)}
          />
        )}

        {/* 6. RECLAMAÇÕES E OCORRÊNCIAS */}
        {activeSection === 'reclamacoes' && (
          <Card className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white font-serif flex items-center gap-2">
                  <Truck className="w-4 h-4 text-sky-400" />
                  Painel Integrado de Reclamações SAC & Ocorrências Logísticas TMS
                </h3>
                <span className="text-xs text-slate-400">
                  Rastreabilidade direta de não conformidades, devoluções e atrasos de transporte.
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {clientesReclamacoes.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:border-slate-700 transition-all"
                  onClick={() => setSelectedCliente(c)}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-sm font-bold text-white">{c.razaoSocial}</strong>
                      <Badge variant="outline" className="text-xs bg-slate-950 text-slate-300">
                        SAP #{c.sapCode}
                      </Badge>
                      <Badge className="bg-rose-500/20 text-rose-300 text-xs">
                        {c.dimensaoQualidade.reclamacoesAbertas} SAC /{' '}
                        {c.dimensaoLogistica.ocorrenciasTMS} TMS
                      </Badge>
                    </div>

                    <div className="text-xs text-slate-300 flex items-center gap-3">
                      <span>
                        OTIF: <strong>{c.dimensaoLogistica.entregasNoPrazoPct}%</strong>
                      </span>
                      <span>
                        Devoluções:{' '}
                        <strong>
                          {c.dimensaoQualidade.devolucoesQtd} ({c.dimensaoQualidade.devolucoesTons}{' '}
                          t)
                        </strong>
                      </span>
                      <span>
                        Atraso médio:{' '}
                        <strong>
                          +{c.dimensaoLogistica.diferencaDataDesejadaEntregueDias} dias
                        </strong>
                      </span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs text-sky-300 border-slate-700"
                  >
                    Ver Ocorrências
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 7. PESQUISAS */}
        {activeSection === 'pesquisas' && (
          <PesquisasView
            campanhas={campanhas}
            respostas={respostas}
            onOpenManualSurvey={() =>
              toast.info('Formulário de resposta manual de pesquisa aberto.')
            }
            onSaveNewCampaign={(camp) => {
              setCampanhas([
                {
                  id: `camp-${Date.now()}`,
                  titulo: camp.titulo || 'Nova Campanha',
                  publicoAlvo: camp.publicoAlvo || 'Clientes Gerais',
                  periodoInicio: camp.periodoInicio || '2024-10-01',
                  periodoFim: camp.periodoFim || '2024-12-31',
                  status: 'ATIVA',
                  totalEnviadas: 50,
                  totalRespondidas: 0,
                  taxaRespostaPct: 0,
                  npsMedio: 0,
                  csatMedio: 0,
                  perguntas: [
                    {
                      id: 'p1',
                      ordem: 1,
                      tipo: 'NPS',
                      titulo: 'De 0 a 10, quanto você recomenda a CIAFAL?',
                      dimensaoAlvo: 'GERAL',
                      obrigatoria: true,
                      ativa: true,
                    },
                    {
                      id: 'p2',
                      ordem: 2,
                      tipo: 'RATING_1_5',
                      titulo: 'Qualidade do Produto',
                      dimensaoAlvo: 'QUALIDADE',
                      obrigatoria: true,
                      ativa: true,
                    },
                  ],
                  is_mock: true,
                },
                ...campanhas,
              ])
            }}
          />
        )}

        {/* 8. PLANOS DE RECUPERAÇÃO */}
        {activeSection === 'planos' && (
          <PlanosRecuperacaoView
            planos={planos}
            clientes={clientes}
            onOpenCreatePlanModal={(c) => handleOpenCriarPlano(c)}
            onSelectCliente={(cId) => {
              const cli = clientes.find((c) => c.id === cId)
              if (cli) setSelectedCliente(cli)
            }}
            onRegisterExecution={(planId, exec) => {
              satisfactionService.updateRecoveryPlanExecution(planId, exec, {
                id: 'usr-1',
                name: 'Gestão CIAFAL',
                role: 'ADMIN_MASTER',
              })
              setPlanos(satisfactionService.getRecoveryPlans())
            }}
          />
        )}

        {/* 9. MATRIZ VALOR X SATISFAÇÃO & IA */}
        {activeSection === 'analise-ia' && (
          <MatrizValorSatisfacao
            clientes={filteredClientes}
            onSelectCliente={(c) => setSelectedCliente(c)}
            onOpenAnaliseIA={(c) => setAnalisarIACliente(c)}
          />
        )}

        {/* 10. CONFIGURAÇÕES DO ISC */}
        {activeSection === 'configuracoes' && (
          <ConfiguracoesISCView
            pesos={pesos}
            pesosHistory={pesosHistory}
            bands={bands}
            isAdminMaster={userRole === 'master' || userRole === 'gestor'}
            onSavePesos={handleSavePesos}
            onSaveBands={(b) => setBands(b)}
          />
        )}
      </div>

      {/* FICHA DE SATISFAÇÃO 360º DO CLIENTE (DRAWER/SHEET COMPLETO) */}
      <Customer360SatisfactionSheet
        cliente={selectedCliente}
        open={!!selectedCliente}
        onClose={() => setSelectedCliente(null)}
        pesos={pesos}
        onOpenEntenderISC={(c) => setEntenderISCCliente(c)}
        onOpenAnaliseIA={(c) => setAnalisarIACliente(c)}
        onCreateRecoveryPlan={(c) => handleOpenCriarPlano(c)}
        onCreateTask={(acao, c) => handleCreateTaskFromAction(c, acao)}
        onNavigateToQuote={(c) => handleCreateCotacaoFromOpportunity(c)}
        onNavigateToStock={(sku) => toast.info(`Consultando SKU ${sku} no módulo de Estoque...`)}
      />

      {/* DIÁLOGO "ENTENDER ISC" (EXPLICABILIDADE REAL, NÃO CAIXA-PRETA) */}
      <EntenderISCDialog
        cliente={entenderISCCliente}
        open={!!entenderISCCliente}
        onClose={() => setEntenderISCCliente(null)}
        pesos={pesos}
      />

      {/* DIÁLOGO "ANALISAR COM IA" (SEPARAÇÃO FATOS / HIPÓTESES / RECOMENDAÇÕES) */}
      <AnaliseIADialog
        cliente={analisarIACliente}
        open={!!analisarIACliente}
        onClose={() => setAnalisarIACliente(null)}
        onCreateTaskFromAction={(acao, c) => handleCreateTaskFromAction(c, acao)}
        onCreateRecoveryPlan={(c) => handleOpenCriarPlano(c)}
        onNavigateToQuote={(c) => handleCreateCotacaoFromOpportunity(c)}
        onNavigateToStock={(sku) => toast.info(`Consultando SKU ${sku} no módulo de Estoque...`)}
      />

      {/* MODAL PARA CRIAR PLANO DE RECUPERAÇÃO */}
      <CriarPlanoRecuperacaoModal
        open={criarPlanoModalOpen}
        onClose={() => setCriarPlanoModalOpen(false)}
        clientes={clientes}
        clientePreselecionado={clienteParaPlano}
        onSubmit={handleCreatePlano}
      />
    </div>
  )
}
