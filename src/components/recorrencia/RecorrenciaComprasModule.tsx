// src/components/recorrencia/RecorrenciaComprasModule.tsx
// Módulo Completo de Recorrência de Compras - CRM 360º CIAFAL
// Contém as 6 abas integradas compartilhando a mesma barra de filtros e estado RBAC

import React, { useState, useMemo, useEffect } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'

// Sub-abas do módulo
import { FiltrosRecorrenciaBar } from './FiltrosRecorrenciaBar'
import { AbaVisaoGeral } from './AbaVisaoGeral'
import { AbaRFMSegmentacao } from './AbaRFMSegmentacao'
import { AbaCreditoRisco } from './AbaCreditoRisco'
import { AbaProdutosRetomada } from './AbaProdutosRetomada'
import { AbaPredicaoRecompra } from './AbaPredicaoRecompra'
import { AbaAcoesComerciais } from './AbaAcoesComerciais'
import { ParametrosConfigModal } from './ParametrosConfigModal'
import { GerarOportunidadeRetomadaModal } from './GerarOportunidadeRetomadaModal'

// Serviços e Tipos
import { recorrenciaService } from '@/services/recorrencia_service'
import type {
  ClienteRecorrenciaView,
  FiltrosRecorrencia,
  ProdutoRetomadaItem,
} from '@/types/recorrencia'

interface RecorrenciaComprasModuleProps {
  onOpenCliente360: (sapCodeOrId: string) => void
}

export function RecorrenciaComprasModule({ onOpenCliente360 }: RecorrenciaComprasModuleProps) {
  const { user } = useAuth()
  const userRole = user?.role || 'ADMIN'
  const userId = user?.id || 'qas-admin_teste'

  // 1. Estado da Aba Ativa (1. Visão Geral | 2. RFM | 3. Crédito | 4. Produtos | 5. Predição | 6. Ações)
  const [activeSubTab, setActiveSubTab] = useState<string>('visao-geral')

  // 2. Filtros Compartilhados da Barra Superior
  const [filtros, setFiltros] = useState<FiltrosRecorrencia>({
    empresa: 'TODOS',
    vendedor: 'TODOS',
    representante: 'TODOS',
    cliente: '',
    uf: 'TODOS',
    cidade: 'TODOS',
    setorIndustrial: 'TODOS',
    grupoMercadoria: 'TODOS',
    produto: 'TODOS',
    periodo: '12M',
    classeRecorrencia: 'TODOS',
    segmentoRFM: 'TODOS',
    statusCliente: 'TODOS',
    riscoPerda: 'TODOS',
    situacaoCredito: 'TODOS',
    unitMode: 'BRL',
  })

  // 3. Modal de Configuração Administrativa
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
  const [configReloadTrigger, setConfigReloadTrigger] = useState(0)

  // 4. Modal de Geração de Oportunidade Direta da Aba de Crédito / Ações
  const [modalOppOpen, setModalOppOpen] = useState(false)
  const [produtoParaOpp, setProdutoParaOpp] = useState<ProdutoRetomadaItem | null>(null)
  const [clienteParaOpp, setClienteParaOpp] = useState<ClienteRecorrenciaView | null>(null)

  // 5. Carregar Dados Brutos e Aplicar RBAC
  const baseClientes = useMemo(() => {
    return recorrenciaService.getClientesRecorrencia(userRole, userId)
  }, [userRole, userId, configReloadTrigger])

  // 6. Aplicar Filtros da Barra Superior
  const clientesFiltrados = useMemo(() => {
    return recorrenciaService.filtrarClientes(baseClientes, filtros)
  }, [baseClientes, filtros])

  // 7. KPIs de Topo Recalculados
  const kpis = useMemo(() => {
    return recorrenciaService.calcularKpisVisaoGeral(clientesFiltrados)
  }, [clientesFiltrados])

  // Limpar Filtros
  const handleResetFiltros = () => {
    setFiltros({
      empresa: 'TODOS',
      vendedor: 'TODOS',
      representante: 'TODOS',
      cliente: '',
      uf: 'TODOS',
      cidade: 'TODOS',
      setorIndustrial: 'TODOS',
      grupoMercadoria: 'TODOS',
      produto: 'TODOS',
      periodo: '12M',
      classeRecorrencia: 'TODOS',
      segmentoRFM: 'TODOS',
      statusCliente: 'TODOS',
      riscoPerda: 'TODOS',
      situacaoCredito: 'TODOS',
      unitMode: filtros.unitMode,
    })
    toast.info('Filtros restaurados para o padrão da sua carteira.')
  }

  // Filtragem ao clicar nos KPIs da Visão Geral
  const handleApplyKpiFilter = (key: string, value: string) => {
    if (key === 'reset') {
      handleResetFiltros()
    } else if (key === 'classeRecorrencia') {
      setFiltros((prev) => ({ ...prev, classeRecorrencia: value }))
    } else if (key === 'segmentoRFM') {
      setFiltros((prev) => ({ ...prev, segmentoRFM: value }))
    } else if (key === 'riscoPerda') {
      setFiltros((prev) => ({ ...prev, riscoPerda: value }))
    } else if (key === 'cadencia') {
      // Navega para ações comerciais prioritárias da cadência
      setActiveSubTab('acoes-comerciais')
    } else if (key === 'diasSemComprar') {
      toast.info('Filtrando clientes inativos há mais de 90 dias.')
      setFiltros((prev) => ({ ...prev, classeRecorrencia: 'Esporádico' }))
    }
  }

  // Abertura de Oportunidade vinda da Aba Crédito & Risco
  const handleGerarOppDeCliente = (c: ClienteRecorrenciaView) => {
    const parados = recorrenciaService.getProdutosParadosPorCliente(c.codigoSap)
    const prod = parados[0] || {
      clienteSap: c.codigoSap,
      clienteNome: c.razaoSocial,
      vendedorNome: c.vendedorNome,
      codigoMaterial: 'TUB-REC-50',
      descricao: 'Tubos Industriais e Perfis',
      grupo: 'Tubos e Perfis',
      quantidadeFaturadaHistorica: Math.round(c.compraMensalMediaTons * 1000),
      tonelagemHistorica: c.compraMensalMediaTons,
      valorFaturadoHistorico: c.compraMensalMediaValor,
      nfsCount: 3,
      primeiraCompraData: '15/01/2023',
      ultimaCompraData: c.ultimaCompraData,
      diasSemComprar: c.diasSemComprar,
      situacao: 'Sem nota no ano',
      estoqueDisponivelTons: 15.0,
      estoqueReservadoTons: 2.0,
      estoqueLivreTons: 13.0,
      ultimoPrecoPraticadoKg: 6.8,
      precoAtualKg: 7.1,
      disponibilidadeVenda: 'Imediata',
    }
    setProdutoParaOpp(prod)
    setClienteParaOpp(c)
    setModalOppOpen(true)
  }

  const handleSolicitarRevisao = (c: ClienteRecorrenciaView) => {
    toast.success(`Solicitação de revisão financeira enviada para ${c.razaoSocial}!`, {
      description: 'Análise de crédito SAP encaminhada ao Comitê de Risco CIAFAL.',
    })
  }

  const isAdminOrDirector =
    userRole.toUpperCase() === 'ADMIN' ||
    userRole.toUpperCase() === 'GERENTE' ||
    userRole.toUpperCase() === 'DIRETOR'

  return (
    <div className="space-y-4">
      {/* 1. BARRA SUPERIOR DE FILTROS FIXA & COMPARTILHADA (Regra de Negócio 3) */}
      <FiltrosRecorrenciaBar
        filtros={filtros}
        onChangeFiltros={setFiltros}
        onResetFiltros={handleResetFiltros}
        totalResultados={clientesFiltrados.length}
        totalOriginal={baseClientes.length}
        isAdminOrDirector={isAdminOrDirector}
        onOpenConfigModal={() => setIsConfigModalOpen(true)}
      />

      {/* 2. SUB-ABAS DE NAVEGAÇÃO DA RECORRÊNCIA (Regra de Negócio 1) */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-4">
        <TabsList className="bg-slate-100 border border-slate-200 p-1 rounded-2xl flex items-center gap-1 overflow-x-auto h-auto">
          <TabsTrigger
            value="visao-geral"
            className="text-xs font-semibold px-4 py-2 rounded-xl data-[state=active]:bg-[#003A70] data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
          >
            1. Visão Geral
          </TabsTrigger>
          <TabsTrigger
            value="rfm"
            className="text-xs font-semibold px-4 py-2 rounded-xl data-[state=active]:bg-[#003A70] data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
          >
            2. RFM e Segmentação
          </TabsTrigger>
          <TabsTrigger
            value="credito-risco"
            className="text-xs font-semibold px-4 py-2 rounded-xl data-[state=active]:bg-[#003A70] data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
          >
            3. Crédito e Risco
          </TabsTrigger>
          <TabsTrigger
            value="produtos-retomada"
            className="text-xs font-semibold px-4 py-2 rounded-xl data-[state=active]:bg-[#003A70] data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
          >
            4. Produtos e Retomada
          </TabsTrigger>
          <TabsTrigger
            value="predicao"
            className="text-xs font-semibold px-4 py-2 rounded-xl data-[state=active]:bg-[#003A70] data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
          >
            5. Predição de Recompra
          </TabsTrigger>
          <TabsTrigger
            value="acoes-comerciais"
            className="text-xs font-semibold px-4 py-2 rounded-xl data-[state=active]:bg-[#003A70] data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
          >
            6. Ações Comerciais
          </TabsTrigger>
        </TabsList>

        {/* CONTEÚDO DAS 6 ABAS */}

        {/* ABA 1: Visão Geral */}
        <TabsContent value="visao-geral" className="space-y-4">
          <AbaVisaoGeral
            clientes={clientesFiltrados}
            kpis={kpis}
            unitMode={filtros.unitMode}
            onSelectCliente={onOpenCliente360}
            onApplyKpiFilter={handleApplyKpiFilter}
          />
        </TabsContent>

        {/* ABA 2: RFM e Segmentação */}
        <TabsContent value="rfm" className="space-y-4">
          <AbaRFMSegmentacao
            clientes={clientesFiltrados}
            unitMode={filtros.unitMode}
            onSelectCliente={onOpenCliente360}
          />
        </TabsContent>

        {/* ABA 3: Crédito e Risco */}
        <TabsContent value="credito-risco" className="space-y-4">
          <AbaCreditoRisco
            clientes={clientesFiltrados}
            unitMode={filtros.unitMode}
            onSelectCliente={onOpenCliente360}
            onGerarOportunidadeRetomada={handleGerarOppDeCliente}
            onSolicitarRevisaoCredito={handleSolicitarRevisao}
          />
        </TabsContent>

        {/* ABA 4: Produtos e Retomada */}
        <TabsContent value="produtos-retomada" className="space-y-4">
          <AbaProdutosRetomada
            clientes={clientesFiltrados}
            unitMode={filtros.unitMode}
            onSelectCliente={onOpenCliente360}
          />
        </TabsContent>

        {/* ABA 5: Predição de Recompra (Fatia 2 Informativa) */}
        <TabsContent value="predicao" className="space-y-4">
          <AbaPredicaoRecompra />
        </TabsContent>

        {/* ABA 6: Ações Comerciais */}
        <TabsContent value="acoes-comerciais" className="space-y-4">
          <AbaAcoesComerciais
            clientes={clientesFiltrados}
            unitMode={filtros.unitMode}
            onSelectCliente={onOpenCliente360}
          />
        </TabsContent>
      </Tabs>

      {/* Modal de Configuração de Parâmetros e Auditoria */}
      <ParametrosConfigModal
        open={isConfigModalOpen}
        onOpenChange={setIsConfigModalOpen}
        onSaved={() => setConfigReloadTrigger((prev) => prev + 1)}
        userName={user?.name || 'Administrador CIAFAL'}
      />

      {/* Modal de Oportunidade Direto da Recorrência */}
      <GerarOportunidadeRetomadaModal
        open={modalOppOpen}
        onOpenChange={setModalOppOpen}
        produto={produtoParaOpp}
        cliente={clienteParaOpp}
      />
    </div>
  )
}
