// src/pages/GestaoClientesPage.tsx
import React, { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Users,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Layers,
  Globe2,
  BookOpen,
  Target,
  FileSpreadsheet,
  TrendingUp,
  Clock,
  ShieldAlert,
  Building2,
  PhoneCall,
  RefreshCw,
  PlusCircle,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { customerManagementService } from '@/services/customer_management_service'
import type {
  CustomerManagementItem,
  CoverageSummaryKpi,
  SellerCoverageItem,
  CatalogProduct,
  EspeculacaoItem,
  MarketingCampaign,
  RegionalGeoMetric,
} from '@/types/customer_management'

// Componentes modulares
import { CoverageKpisPanel } from '@/components/gestao-clientes/CoverageKpisPanel'
import { WhoToContactPanel } from '@/components/gestao-clientes/WhoToContactPanel'
import { ClientManagementTable } from '@/components/gestao-clientes/ClientManagementTable'
import { Client360ExecutiveModal } from '@/components/gestao-clientes/Client360ExecutiveModal'
import { ClientGeoMapPanel } from '@/components/gestao-clientes/ClientGeoMapPanel'
import { CatalogManagementPanel } from '@/components/gestao-clientes/CatalogManagementPanel'
import { EspeculacoesPanel } from '@/components/gestao-clientes/EspeculacoesPanel'
import { SellerCoverageRanking } from '@/components/gestao-clientes/SellerCoverageRanking'
import { toast } from 'sonner'

export type GestaoClientesTab =
  | 'visao_geral'
  | 'quem_contatar'
  | 'lista_clientes'
  | 'cobertura_vendedores'
  | 'mapa_brasil'
  | 'catalogo'
  | 'especulacoes'

export default function GestaoClientesPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  // Estado da aba principal
  const [activeTab, setActiveTab] = useState<GestaoClientesTab>('visao_geral')

  // Perfil RBAC (Visão Vendedor vs Visão Gestão)
  const [profileView, setProfileView] = useState<'vendedor' | 'gestao'>('gestao')
  const currentSellerName = 'Carlos Mendonça'

  // Dados mestres
  const [rawCustomers, setRawCustomers] = useState<CustomerManagementItem[]>(() =>
    customerManagementService.getCustomers(),
  )
  const [catalog, setCatalog] = useState<CatalogProduct[]>(() =>
    customerManagementService.getCatalog(),
  )
  const [especulacoes, setEspeculacoes] = useState<EspeculacaoItem[]>(() =>
    customerManagementService.getEspeculacoes(),
  )
  const [regionalMetrics] = useState<RegionalGeoMetric[]>(() =>
    customerManagementService.getRegionalMetrics(),
  )

  // Modais
  const [selectedClientModal, setSelectedClientModal] = useState<CustomerManagementItem | null>(
    null,
  )
  const [isClientModalOpen, setIsClientModalOpen] = useState(false)

  // Recarregar dados do storage
  const reloadData = () => {
    setRawCustomers(customerManagementService.getCustomers())
    setCatalog(customerManagementService.getCatalog())
    setEspeculacoes(customerManagementService.getEspeculacoes())
  }

  // Filtragem conforme Perfil (Visão Vendedor vê só a própria carteira)
  const authorizedCustomers = useMemo(() => {
    if (profileView === 'vendedor') {
      return rawCustomers.filter(
        (c) =>
          c.vendedorNome.toLowerCase().includes('carlos') ||
          c.vendedorId === user?.id ||
          c.vendedorId === 'qas-vendedor_teste',
      )
    }
    return rawCustomers
  }, [rawCustomers, profileView, user])

  // KPIs de Cobertura
  const coverageKpis: CoverageSummaryKpi = useMemo(() => {
    return customerManagementService.calculateCoverageKpis(authorizedCustomers, 95)
  }, [authorizedCustomers])

  // Ranking de Cobertura por Vendedor
  const sellerCoverageList: SellerCoverageItem[] = useMemo(() => {
    return customerManagementService.calculateSellerCoverage(rawCustomers)
  }, [rawCustomers])

  // IA: Quem Devo Contatar Hoje?
  const whoToContactSuggestions = useMemo(() => {
    return customerManagementService.getWhoToContactToday(authorizedCustomers)
  }, [authorizedCustomers])

  // Handlers
  const handleOpenClientDetail = (cliente: CustomerManagementItem) => {
    setSelectedClientModal(cliente)
    setIsClientModalOpen(true)
  }

  const handleQuickAction = (cliente: CustomerManagementItem, acao: string) => {
    setSelectedClientModal(cliente)
    setIsClientModalOpen(true)
  }

  return (
    <div className="space-y-6 pb-16 text-slate-100">
      {/* 1. BANNER OFICIAL DE DEMONSTRAÇÃO E AMBIENTE */}
      <div className="bg-gradient-to-r from-sky-950/80 via-slate-900 to-slate-950 border border-sky-900/40 p-3 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Badge className="bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[10px] font-mono uppercase tracking-wider">
            DADOS DE DEMONSTRAÇÃO (is_mock=true)
          </Badge>
          <span className="text-slate-300 text-[11px]">
            Módulo Gestão de Carteira CIAFAL · Sincronizado com SAP ECC, PCP Robotizado e TMS Frota
          </span>
        </div>

        {/* Alternador de Perfil RBAC (Regra 4) */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-xs">Visão:</span>
          <div className="flex bg-slate-950 p-0.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setProfileView('vendedor')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                profileView === 'vendedor'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Visão Vendedor (Minha Carteira)
            </button>
            <button
              onClick={() => setProfileView('gestao')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                profileView === 'gestao'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Visão Gestão (Empresa / Equipes)
            </button>
          </div>
        </div>
      </div>

      {/* 2. CABEÇALHO EXECUTIVO DO MÓDULO */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-sky-400 bg-sky-950/80 px-2.5 py-0.5 rounded-xl border border-sky-800/50">
              CRM 360º CIAFAL FERRO & AÇO
            </span>
            <span className="text-xs text-slate-400">
              {profileView === 'vendedor'
                ? `Vendedor: ${currentSellerName}`
                : 'Diretoria & Supervisão Regional'}
            </span>
          </div>

          <h1 className="font-serif text-3xl font-bold text-white tracking-tight mt-1 flex items-center gap-2.5">
            <Users className="w-8 h-8 text-sky-400" />
            Gestão de Clientes & Cobertura da Carteira
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Visão operacional e gerencial da carteira ativa, cotações, faturamento, cobertura
            comercial, recomendações de IA, cross-sell, catálogo técnico, especulações e OTIF.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              reloadData()
              toast.success('Dados de clientes e cotações sincronizados com o backend!')
            }}
            className="h-9 text-xs border-slate-700 bg-slate-900 text-slate-300 hover:text-white rounded-2xl gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 text-sky-400" /> Sincronizar Carteira
          </Button>

          <Button
            size="sm"
            onClick={() => navigate('/central-acoes')}
            className="h-9 text-xs bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-2xl gap-1.5 shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Central de Ações</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setActiveTab('quem_contatar')}
            className="h-9 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-2xl gap-1.5 shadow-sm"
          >
            <Sparkles className="w-4 h-4" /> Quem Contatar Hoje?
          </Button>
        </div>
      </div>

      {/* 3. NAVEGAÇÃO ENTRE AS ABAS PRINCIPAIS DO MÓDULO */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800 scrollbar-none">
        <button
          onClick={() => setActiveTab('visao_geral')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'visao_geral'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-400 hover:bg-slate-900 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Visão Geral & Cobertura</span>
        </button>

        <button
          onClick={() => setActiveTab('quem_contatar')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'quem_contatar'
              ? 'bg-amber-500 text-slate-950 shadow-xs'
              : 'text-slate-400 hover:bg-slate-900 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Quem Devo Contatar Hoje?</span>
          <Badge className="ml-1 px-1.5 text-[9px] bg-amber-600 text-white">
            {whoToContactSuggestions.length}
          </Badge>
        </button>

        <button
          onClick={() => setActiveTab('lista_clientes')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'lista_clientes'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-400 hover:bg-slate-900 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Lista de Clientes ({authorizedCustomers.length})</span>
        </button>

        {profileView === 'gestao' && (
          <button
            onClick={() => setActiveTab('cobertura_vendedores')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'cobertura_vendedores'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Cobertura por Vendedor</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('mapa_brasil')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'mapa_brasil'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-400 hover:bg-slate-900 hover:text-white'
          }`}
        >
          <Globe2 className="w-4 h-4" />
          <span>Mapa Brasil & Regional</span>
        </button>

        <button
          onClick={() => setActiveTab('catalogo')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'catalogo'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-400 hover:bg-slate-900 hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Catálogo Comercial CIAFAL</span>
        </button>

        <button
          onClick={() => setActiveTab('especulacoes')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeTab === 'especulacoes'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'text-slate-400 hover:bg-slate-900 hover:text-white'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>Especulações ({especulacoes.length})</span>
        </button>
      </div>

      {/* 4. RENDERIZAÇÃO DA VISÃO ATIVA */}
      {activeTab === 'visao_geral' && (
        <div className="space-y-6">
          <CoverageKpisPanel
            kpis={coverageKpis}
            onSelectFilter={() => setActiveTab('lista_clientes')}
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <WhoToContactPanel
              suggestions={whoToContactSuggestions.slice(0, 4)}
              onSelectClient={handleOpenClientDetail}
              onQuickAction={handleQuickAction}
            />
            <div className="space-y-4">
              <ClientGeoMapPanel
                clientes={authorizedCustomers}
                regionalMetrics={regionalMetrics}
                onSelectClient={handleOpenClientDetail}
              />
            </div>
          </div>
          <ClientManagementTable
            clientes={authorizedCustomers}
            onSelectClient={handleOpenClientDetail}
            userRole={profileView}
          />
        </div>
      )}

      {activeTab === 'quem_contatar' && (
        <WhoToContactPanel
          suggestions={whoToContactSuggestions}
          onSelectClient={handleOpenClientDetail}
          onQuickAction={handleQuickAction}
        />
      )}

      {activeTab === 'lista_clientes' && (
        <ClientManagementTable
          clientes={authorizedCustomers}
          onSelectClient={handleOpenClientDetail}
          userRole={profileView}
        />
      )}

      {activeTab === 'cobertura_vendedores' && profileView === 'gestao' && (
        <SellerCoverageRanking
          sellers={sellerCoverageList}
          onSelectSeller={(sel) => {
            toast.info(`Filtrando carteira do vendedor ${sel.vendedorNome}`)
            setActiveTab('lista_clientes')
          }}
        />
      )}

      {activeTab === 'mapa_brasil' && (
        <ClientGeoMapPanel
          clientes={authorizedCustomers}
          regionalMetrics={regionalMetrics}
          onSelectClient={handleOpenClientDetail}
        />
      )}

      {activeTab === 'catalogo' && <CatalogManagementPanel catalog={catalog} />}

      {activeTab === 'especulacoes' && (
        <EspeculacoesPanel especulacoes={especulacoes} onUpdateList={reloadData} />
      )}

      {/* 5. MODAL EXECUTIVO CLIENTE 360 & INTERAÇÃO */}
      <Client360ExecutiveModal
        cliente={selectedClientModal}
        open={isClientModalOpen}
        onOpenChange={setIsClientModalOpen}
        onContactRegistered={reloadData}
      />
    </div>
  )
}
