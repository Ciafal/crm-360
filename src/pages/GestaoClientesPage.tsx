import React, { useState, useMemo, useEffect } from 'react'
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Compass,
  FileSpreadsheet,
  Layers,
  MapPin,
  TrendingUp,
  Sparkles,
  PhoneCall,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  Building2,
  DollarSign,
  Package,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { StatusBadge } from '@/components/gestao-clientes/shared/GestaoClientesUiKit'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

// Modelos e Serviços Unificados CRM Party 360º
import { crmPartyService } from '@/services/crm_party_service'
import type { CrmPartyMaster, CommercialStage } from '@/types/crm_party'
import { customerManagementService } from '@/services/customer_management_service'
import type { CustomerManagementItem } from '@/types/customer_management'

// Componentes Existentes Preservados
import { CoverageKpisPanel } from '@/components/gestao-clientes/CoverageKpisPanel'
import { ClientManagementTable } from '@/components/gestao-clientes/ClientManagementTable'
import { WhoToContactPanel } from '@/components/gestao-clientes/WhoToContactPanel'
import { SellerCoverageRanking } from '@/components/gestao-clientes/SellerCoverageRanking'
import { ClientGeoMapPanel } from '@/components/gestao-clientes/ClientGeoMapPanel'
import { EspeculacoesPanel } from '@/components/gestao-clientes/EspeculacoesPanel'
import { CatalogManagementPanel } from '@/components/gestao-clientes/CatalogManagementPanel'
import { Client360ExecutiveModal } from '@/components/gestao-clientes/Client360ExecutiveModal'

// Novos Componentes da Jornada Comercial Única CRM 360º
import { CadastroLeadModal } from '@/components/gestao-clientes/CadastroLeadModal'
import { QualificarLeadModal } from '@/components/gestao-clientes/QualificarLeadModal'
import { PortalFichaCadastralModal } from '@/components/gestao-clientes/PortalFichaCadastralModal'
import { AnaliseFinanceiraCreditoModal } from '@/components/gestao-clientes/AnaliseFinanceiraCreditoModal'
import { CentralCadastrosView } from '@/components/gestao-clientes/CentralCadastrosView'
import { CentralAcoesInteligentesView } from '@/components/gestao-clientes/CentralAcoesInteligentesView'
import { FunilAquisicaoCohortView } from '@/components/gestao-clientes/FunilAquisicaoCohortView'
import { LeadsProspectsTab } from '@/components/gestao-clientes/LeadsProspectsTab'
import { CrmParty360FichaModal } from '@/components/gestao-clientes/CrmParty360FichaModal'
import { TransferenciaCarteiraModal } from '@/components/gestao-clientes/TransferenciaCarteiraModal'
import { ReativarOportunidadeModal } from '@/components/gestao-clientes/ReativarOportunidadeModal'
import { RecorrenciaComprasModule } from '@/components/recorrencia/RecorrenciaComprasModule'

export default function GestaoClientesPage() {
  const navigate = useNavigate()

  // 1. Estados Centrais do CRM Party Master
  const [parties, setParties] = useState<CrmPartyMaster[]>([])
  const [selectedParty, setSelectedParty] = useState<CrmPartyMaster | null>(null)

  // 2. Modais de Gestão Comercial e Onboarding
  const [isCadastroLeadOpen, setIsCadastroLeadOpen] = useState(false)
  const [isQualificarOpen, setIsQualificarOpen] = useState(false)
  const [isFichaCadastralOpen, setIsFichaCadastralOpen] = useState(false)
  const [isAnaliseFinanceiraOpen, setIsAnaliseFinanceiraOpen] = useState(false)
  const [isCrmPartyModalOpen, setIsCrmPartyModalOpen] = useState(false)
  const [isTransferenciaOpen, setIsTransferenciaOpen] = useState(false)
  const [isReativarOpen, setIsReativarOpen] = useState(false)

  // Modal 360 legado para retrocompatibilidade
  const [selectedItemFor360, setSelectedItemFor360] = useState<CustomerManagementItem | null>(null)
  const [is360ExecutiveModalOpen, setIs360ExecutiveModalOpen] = useState(false)

  // 3. Organização de Seções Obrigatória (Regra 31)
  // 1. VISÃO GERAL & COBERTURA; 2. QUEM DEVO CONTATAR HOJE?; 3. LEADS & PROSPECTS; 4. LISTA DE CLIENTES; 5. CADASTROS; 6. COBERTURA POR VENDEDOR
  const [activeSection, setActiveSection] = useState<string>('visao-geral')

  // 4. Busca Global & Filtros Unificados (Regra 31)
  const [globalSearchTerm, setGlobalSearchTerm] = useState('')
  const [filterRegional, setFilterRegional] = useState('TODOS')
  const [filterVendedor, setFilterVendedor] = useState('TODOS')
  const [filterEstagio, setFilterEstagio] = useState('TODOS')

  // Carrega lista de CRM Party Master
  const loadParties = () => {
    const data = crmPartyService.getParties()
    setParties(data)
  }

  useEffect(() => {
    loadParties()
  }, [])

  // KPI calculations baseados no CRM Party Master
  const kpis = useMemo(() => {
    const total = parties.length
    const leads = parties.filter(
      (p) => p.commercial_stage === 'LEAD' || p.commercial_stage === 'LEAD_QUALIFICADO',
    ).length
    const prospects = parties.filter(
      (p) => p.commercial_stage === 'PROSPECT' || p.commercial_stage === 'CADASTRO_EM_ANDAMENTO',
    ).length
    const clientesSap = parties.filter(
      (p) =>
        p.sap_customer_id ||
        p.commercial_stage === 'CLIENTE_SAP' ||
        p.commercial_stage === 'CLIENTE_ATIVO',
    ).length
    const faturados = parties.filter((p) => p.data_primeiro_faturamento).length
    const cadastrosPendentes = parties.filter(
      (p) =>
        p.registration_status !== 'NAO_INICIADO' &&
        p.registration_status !== 'CADASTRO_SAP_CONCLUIDO',
    ).length

    return {
      total,
      leads,
      prospects,
      clientesSap,
      faturados,
      cadastrosPendentes,
      taxaConversao: leads > 0 ? Math.round((clientesSap / total) * 100) : 0,
    }
  }, [parties])

  // Abertura Universal da Ficha 360º (Regra 31: Busca por cliente, CNPJ, SAP, CRM ID abre a mesma ficha)
  const handleOpenParty360 = (partyIdOrCrmId: string) => {
    const party =
      crmPartyService.getPartyById(partyIdOrCrmId) ||
      crmPartyService.getPartyBySapCode(partyIdOrCrmId)
    if (party) {
      setSelectedParty(party)
      setIsCrmPartyModalOpen(true)
    } else {
      // Fallback para customerManagementService legado
      const legacyItem = customerManagementService
        .getCustomers()
        .find((c) => c.id === partyIdOrCrmId || c.codigo === partyIdOrCrmId)
      if (legacyItem) {
        setSelectedItemFor360(legacyItem)
        setIs360ExecutiveModalOpen(true)
      } else {
        toast.error('Registro não encontrado no CRM')
      }
    }
  }

  // Abertura Direta de Nova Cotação (Regra 24: CTA que pré-preenche cliente)
  const handleOpenNovaCotacao = (party: CrmPartyMaster) => {
    navigate('/cotacoes/nova', {
      state: {
        clienteId: party.crm_party_id,
        codigoSap: party.sap_customer_id,
        razaoSocial: party.razao_social,
        cnpj: party.cnpj_cpf,
        vendedorNome: party.vendedor_atual_nome,
        contatoNome: party.contatos?.[0]?.nome,
        contatoEmail: party.contatos?.[0]?.email,
        contatoTel: party.contatos?.[0]?.whatsapp,
        condicaoPagamento: party.analise_credito?.condicao_pagamento_recomendada,
        limiteDisponivel: party.analise_credito?.limite_disponivel,
      },
    })
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pb-16">
      {/* 1. TOPO EXECUTIVO CIAFAL & AÇÕES CENTRAIS (Regra 31) */}
      <div className="border-b border-border/60 bg-white/95 sticky top-0 z-30 backdrop-blur-md shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Título & Badge de Origem Mestre */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#003A70]/10 text-[#003A70] rounded-xl border border-[#003A70]/20 shadow-2xs">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-serif font-bold text-[#003A70] tracking-tight">
                    Gestão de Clientes & Cobertura da Carteira
                  </h1>
                  <StatusBadge label="CRM 360º CIAFAL" variant="default" />
                </div>
                <p className="text-xs text-slate-500">
                  Registro Comercial Único · Jornada Lead → Prospect → Cliente SAP · Sem Cadastros
                  Paralelos
                </p>
              </div>
            </div>

            {/* BOTÕES DE AÇÃO OBRIGATÓRIOS NO CABEÇALHO */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setActiveSection('recorrencia')}
                className={`h-8 text-xs rounded-xl gap-1.5 transition-all ${
                  activeSection === 'recorrencia'
                    ? 'bg-[#003A70] text-white border-[#003A70] font-semibold shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:text-[#003A70] hover:bg-slate-50'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-[#003A70]" />
                <span>Recorrência de Compras</span>
              </Button>

              <Button
                size="sm"
                onClick={() => setIsCadastroLeadOpen(true)}
                className="h-8 text-xs bg-[#003A70] hover:bg-[#002850] text-white font-semibold rounded-xl gap-1.5 shadow-2xs transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Cadastrar Lead</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setActiveSection('cadastros')}
                className={`h-8 text-xs rounded-xl gap-1.5 transition-all ${
                  activeSection === 'cadastros'
                    ? 'bg-[#003A70] text-white border-[#003A70] font-semibold shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:text-[#003A70] hover:bg-slate-50'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Central de Cadastros</span>
                {kpis.cadastrosPendentes > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold">
                    {kpis.cadastrosPendentes}
                  </span>
                )}
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setActiveSection('central-acoes')}
                className={`h-8 text-xs rounded-xl gap-1.5 transition-all ${
                  activeSection === 'central-acoes'
                    ? 'bg-[#003A70] text-white border-[#003A70] font-semibold shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:text-[#003A70] hover:bg-slate-50'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#003A70]" />
                <span>Central de Ações</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setActiveSection('quem-contatar')}
                className={`h-8 text-xs rounded-xl gap-1.5 transition-all ${
                  activeSection === 'quem-contatar'
                    ? 'bg-[#003A70] text-white border-[#003A70] font-semibold shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:text-[#003A70] hover:bg-slate-50'
                }`}
              >
                <PhoneCall className="w-3.5 h-3.5 text-emerald-700" />
                <span>Quem Contatar Hoje</span>
              </Button>
            </div>
          </div>

          {/* BARRA DE BUSCA GLOBAL UNIVERSAL (Regra 31) */}
          <div className="mt-3.5 pt-3 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-2.5" />
              <Input
                value={globalSearchTerm}
                onChange={(e) => setGlobalSearchTerm(e.target.value)}
                placeholder="Busca global: Razão Social, CNPJ, SAP, CRM ID, contato..."
                className="h-9 pl-9 bg-white border-border text-xs rounded-xl text-foreground placeholder:text-muted-foreground focus:border-primary"
              />
            </div>

            {/* Micro Indicadores do Registro Único */}
            <div className="flex items-center gap-2 text-xs text-slate-600 overflow-x-auto w-full sm:w-auto">
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Base Mestre</span>
                <strong className="text-slate-900 font-mono">{kpis.total}</strong>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Leads</span>
                <strong className="text-slate-900 font-mono">{kpis.leads}</strong>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Prospects</span>
                <strong className="text-slate-900 font-mono">{kpis.prospects}</strong>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Clientes SAP</span>
                <strong className="text-[#003A70] font-mono">{kpis.clientesSap}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CORPO PRINCIPAL COM 6 SEÇÕES ORGANIZADAS (Regra 31) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 space-y-5">
        <Tabs value={activeSection} onValueChange={setActiveSection} className="space-y-4">
          <TabsList className="bg-slate-100 border border-slate-200 p-1 rounded-xl flex items-center gap-1 overflow-x-auto h-auto">
            <TabsTrigger
              value="recorrencia"
              className="text-xs font-semibold px-3.5 py-1.5 rounded-lg data-[state=active]:bg-[#003A70] data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-2xs transition-colors select-none text-slate-700"
            >
              Recorrência de Compras
            </TabsTrigger>
            <TabsTrigger
              value="visao-geral"
              className="text-xs font-semibold px-3.5 py-1.5 rounded-lg data-[state=active]:bg-[#003A70] data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-2xs transition-colors select-none text-slate-700"
            >
              Visão Geral & Cobertura
            </TabsTrigger>
            <TabsTrigger
              value="quem-contatar"
              className="text-xs font-semibold px-3.5 py-1.5 rounded-lg data-[state=active]:bg-[#003A70] data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-2xs transition-colors select-none text-slate-700"
            >
              Quem Contatar Hoje
            </TabsTrigger>
            <TabsTrigger
              value="leads-prospects"
              className="text-xs font-semibold px-3.5 py-1.5 rounded-lg data-[state=active]:bg-[#003A70] data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-2xs transition-colors select-none text-slate-700"
            >
              Leads & Prospects
            </TabsTrigger>
            <TabsTrigger
              value="lista-clientes"
              className="text-xs font-semibold px-3.5 py-1.5 rounded-lg data-[state=active]:bg-[#003A70] data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-2xs transition-colors select-none text-slate-700"
            >
              Lista de Clientes
            </TabsTrigger>
            <TabsTrigger
              value="cadastros"
              className="text-xs font-semibold px-3.5 py-1.5 rounded-lg data-[state=active]:bg-[#003A70] data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-2xs transition-colors select-none text-slate-700"
            >
              Central de Cadastros
            </TabsTrigger>
            <TabsTrigger
              value="cobertura-vendedor"
              className="text-xs font-semibold px-3.5 py-1.5 rounded-lg data-[state=active]:bg-[#003A70] data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-2xs transition-colors select-none text-slate-700"
            >
              Cobertura por Vendedor
            </TabsTrigger>
            <TabsTrigger
              value="funil-cohort"
              className="text-xs font-semibold px-3.5 py-1.5 rounded-lg data-[state=active]:bg-[#003A70] data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-2xs transition-colors select-none text-slate-700"
            >
              Funil & Cohort
            </TabsTrigger>
            <TabsTrigger
              value="central-acoes"
              className="text-xs font-semibold px-3.5 py-1.5 rounded-lg data-[state=active]:bg-[#003A70] data-[state=active]:text-white data-[state=active]:font-bold data-[state=active]:shadow-2xs transition-colors select-none text-slate-700"
            >
              Central de Ações
            </TabsTrigger>
          </TabsList>

          {/* SEÇÃO 0: RECORRÊNCIA DE COMPRAS (Módulo Completo de 6 Abas Integradas) */}
          <TabsContent value="recorrencia" className="space-y-4">
            <RecorrenciaComprasModule onOpenCliente360={handleOpenParty360} />
          </TabsContent>

          {/* SEÇÃO 1: VISÃO GERAL & COBERTURA */}
          <TabsContent value="visao-geral" className="space-y-4">
            <CoverageKpisPanel
              kpis={customerManagementService.calculateCoverageKpis(
                customerManagementService.getCustomers(),
              )}
            />

            {/* Painel do Funil Real de Aquisição (Regra 25) */}
            <FunilAquisicaoCohortView
              parties={parties}
              onSelectStageFilter={(stg) => {
                if (stg === 'LEADS' || stg === 'QUALIFICADOS' || stg === 'PROSPECTS') {
                  setActiveSection('leads-prospects')
                } else if (stg === 'CADASTROS') {
                  setActiveSection('cadastros')
                } else {
                  setActiveSection('lista-clientes')
                }
              }}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ClientGeoMapPanel
                clientes={customerManagementService.getCustomers()}
                regionalMetrics={customerManagementService.getRegionalMetrics()}
                onSelectClient={(client) => handleOpenParty360(client.id)}
              />
              <EspeculacoesPanel
                especulacoes={customerManagementService.getEspeculacoes()}
                onUpdateList={() => {}}
              />
            </div>
          </TabsContent>

          {/* SEÇÃO 2: QUEM DEVO CONTATAR HOJE? */}
          <TabsContent value="quem-contatar" className="space-y-4">
            <WhoToContactPanel
              suggestions={customerManagementService.getWhoToContactToday(
                customerManagementService.getCustomers(),
              )}
              onSelectClient={(client) => handleOpenParty360(client.id)}
            />
          </TabsContent>

          {/* SEÇÃO 3: LEADS & PROSPECTS (Regra 1 a 11) */}
          <TabsContent value="leads-prospects" className="space-y-4">
            <LeadsProspectsTab
              parties={parties}
              onOpenParty={(id) => handleOpenParty360(id)}
              onOpenCadastroModal={() => setIsCadastroLeadOpen(true)}
              onOpenQualificarModal={(p) => {
                setSelectedParty(p)
                setIsQualificarOpen(true)
              }}
              onOpenFichaModal={(p) => {
                setSelectedParty(p)
                setIsFichaCadastralOpen(true)
              }}
            />
          </TabsContent>

          {/* SEÇÃO 4: LISTA DE CLIENTES (Tabela Principal Mantida) */}
          <TabsContent value="lista-clientes" className="space-y-4">
            <ClientManagementTable
              clientes={customerManagementService.getCustomers()}
              onSelectClient={(client) => handleOpenParty360(client.id)}
            />
          </TabsContent>

          {/* SEÇÃO 5: CENTRAL DE CADASTROS (Regra 18) */}
          <TabsContent value="cadastros" className="space-y-4">
            <CentralCadastrosView
              parties={parties}
              onOpenParty={(id) => handleOpenParty360(id)}
              onOpenFichaModal={(p) => {
                setSelectedParty(p)
                setIsFichaCadastralOpen(true)
              }}
              onOpenAnaliseFinanceiraModal={(p) => {
                setSelectedParty(p)
                setIsAnaliseFinanceiraOpen(true)
              }}
              onRefreshParties={loadParties}
            />
          </TabsContent>

          {/* SEÇÃO 6: COBERTURA POR VENDEDOR */}
          <TabsContent value="cobertura-vendedor" className="space-y-4">
            <SellerCoverageRanking
              sellers={customerManagementService.calculateSellerCoverage(
                customerManagementService.getCustomers(),
              )}
            />
          </TabsContent>

          {/* TAB EXTRA: FUNIL & COHORT EXPANDIDO */}
          <TabsContent value="funil-cohort" className="space-y-4">
            <FunilAquisicaoCohortView
              parties={parties}
              onSelectStageFilter={(stg) => {
                if (stg === 'LEADS' || stg === 'QUALIFICADOS') setActiveSection('leads-prospects')
                else if (stg === 'CADASTROS') setActiveSection('cadastros')
                else setActiveSection('lista-clientes')
              }}
            />
          </TabsContent>

          {/* TAB EXTRA: CENTRAL DE AÇÕES INTELIGENTES (Regra 26) */}
          <TabsContent value="central-acoes" className="space-y-4">
            <CentralAcoesInteligentesView
              parties={parties}
              onOpenParty={(id) => handleOpenParty360(id)}
              onOpenNovaCotacao={(p) => handleOpenNovaCotacao(p)}
              onOpenQualificarModal={(p) => {
                setSelectedParty(p)
                setIsQualificarOpen(true)
              }}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* 3. MODAIS CENTRAIS DA JORNADA COMERCIAL ÚNICA (Regras 1 a 34) */}

      {/* Modal 1: Cadastro Simples de Lead (Regra 5, 6, 7) */}
      <CadastroLeadModal
        open={isCadastroLeadOpen}
        onOpenChange={setIsCadastroLeadOpen}
        onLeadCreated={(newLead) => {
          loadParties()
          setSelectedParty(newLead)
          setIsCrmPartyModalOpen(true)
        }}
        onOpenExistingParty={(id) => handleOpenParty360(id)}
      />

      {/* Modal 2: Qualificação Comercial com IA Score (Regra 10) */}
      <QualificarLeadModal
        party={selectedParty}
        open={isQualificarOpen}
        onOpenChange={setIsQualificarOpen}
        onQualified={(updated) => {
          loadParties()
          setSelectedParty(updated)
        }}
        onInitiateOnboarding={(updated) => {
          loadParties()
          setSelectedParty(updated)
          setIsFichaCadastralOpen(true)
        }}
      />

      {/* Modal 3: Portal do Cliente / Ficha Cadastral Wizard (Regra 13, 14, 15, 16) */}
      <PortalFichaCadastralModal
        party={selectedParty}
        open={isFichaCadastralOpen}
        onOpenChange={setIsFichaCadastralOpen}
        onSaved={(updated) => {
          loadParties()
          setSelectedParty(updated)
        }}
      />

      {/* Modal 4: Análise Financeira & Crédito com Alçada Humana (Regra 19, 20) */}
      <AnaliseFinanceiraCreditoModal
        party={selectedParty}
        open={isAnaliseFinanceiraOpen}
        onOpenChange={setIsAnaliseFinanceiraOpen}
        onApproved={(updated) => {
          loadParties()
          setSelectedParty(updated)
        }}
      />

      {/* Modal 5: Ficha Mestre CRM Party 360º (Regra 27) */}
      <CrmParty360FichaModal
        party={selectedParty}
        open={isCrmPartyModalOpen}
        onOpenChange={setIsCrmPartyModalOpen}
        onOpenNovaCotacao={(p) => handleOpenNovaCotacao(p)}
        onOpenFichaModal={(p) => {
          setSelectedParty(p)
          setIsFichaCadastralOpen(true)
        }}
        onOpenQualificarModal={(p) => {
          setSelectedParty(p)
          setIsQualificarOpen(true)
        }}
        onOpenAnaliseFinanceiraModal={(p) => {
          setSelectedParty(p)
          setIsAnaliseFinanceiraOpen(true)
        }}
        onOpenTransferenciaModal={(p) => {
          setSelectedParty(p)
          setIsTransferenciaOpen(true)
        }}
        onOpenReativarModal={(p) => {
          setSelectedParty(p)
          setIsReativarOpen(true)
        }}
        onRefreshParties={loadParties}
      />

      {/* Modal 6: Transferência Administrativa de Carteira (Regra 28) */}
      <TransferenciaCarteiraModal
        party={selectedParty}
        open={isTransferenciaOpen}
        onOpenChange={setIsTransferenciaOpen}
        onTransferred={(updated) => {
          loadParties()
          setSelectedParty(updated)
        }}
      />

      {/* Modal 7: Reativação / Novo Ciclo Comercial (Regra 28) */}
      <ReativarOportunidadeModal
        party={selectedParty}
        open={isReativarOpen}
        onOpenChange={setIsReativarOpen}
        onReactivated={(updated) => {
          loadParties()
          setSelectedParty(updated)
        }}
      />

      {/* Modal Legado Preservado */}
      {selectedItemFor360 && (
        <Client360ExecutiveModal
          cliente={selectedItemFor360}
          open={is360ExecutiveModalOpen}
          onOpenChange={setIs360ExecutiveModalOpen}
          onContactRegistered={loadParties}
        />
      )}
    </div>
  )
}
