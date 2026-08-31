// src/pages/ConsultasPage.tsx
import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  FileText,
  CreditCard,
  Award,
  Layers,
  Filter,
  Download,
  Share2,
  Copy,
  Eye,
  Truck,
  Sparkles,
  Calendar,
  Building2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  BarChart3,
  ShieldCheck,
  ChevronRight,
  Info,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { mockClientes } from '@/data/mockCommercialData'
import {
  DocumentoFiscalNF,
  BoletoFinanceiro,
  CertificadoQualidade,
  PacoteDocumentalCliente,
} from '@/data/mockConsultasData'
import { consultasService, ConsultaFilterParams } from '@/services/consultasService'
import { DanfePreviewModal } from '@/components/consultas/DanfePreviewModal'
import { BoletoPreviewModal } from '@/components/consultas/BoletoPreviewModal'
import { CertificadoPreviewModal } from '@/components/consultas/CertificadoPreviewModal'
import {
  MultiDocumentSendModal,
  SelectedDocItem,
} from '@/components/consultas/MultiDocumentSendModal'
import { SolicitarSegundaViaModal } from '@/components/consultas/SolicitarSegundaViaModal'
import { TmsTransporteModal } from '@/components/consultas/TmsTransporteModal'
import { IndicadoresConsultasPanel } from '@/components/consultas/IndicadoresConsultasPanel'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

export default function ConsultasPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  // Aba ativa: unificada, nfs, boletos, certificados, pacotes, indicadores
  const [activeTab, setActiveTab] = useState<
    'unificada' | 'nfs' | 'boletos' | 'certificados' | 'pacotes' | 'indicadores'
  >('unificada')

  // Filtros
  const [termoBusca, setTermoBusca] = useState('')
  const [clienteFiltro, setClienteFiltro] = useState('TODOS')
  const [periodoFiltro, setPeriodoFiltro] = useState<
    'TODOS' | 'HOJE' | '7DIAS' | '30DIAS' | 'MES_ATUAL' | 'MES_ANTERIOR'
  >('TODOS')
  const [statusFiltro, setStatusFiltro] = useState('TODOS')
  const [empresaFiltro, setEmpresaFiltro] = useState('TODAS')
  const [centroFiltro, setCentroFiltro] = useState('TODOS')

  // Resultados
  const [nfs, setNfs] = useState<DocumentoFiscalNF[]>([])
  const [boletos, setBoletos] = useState<BoletoFinanceiro[]>([])
  const [certificados, setCertificados] = useState<CertificadoQualidade[]>([])
  const [pacotes, setPacotes] = useState<PacoteDocumentalCliente[]>([])
  const [loading, setLoading] = useState(false)
  const [rbacRestrito, setRbacRestrito] = useState(false)

  // Modais de Preview e Ações
  const [selectedNf, setSelectedNf] = useState<DocumentoFiscalNF | null>(null)
  const [danfeModalOpen, setDanfeModalOpen] = useState(false)

  const [selectedBoleto, setSelectedBoleto] = useState<BoletoFinanceiro | null>(null)
  const [boletoModalOpen, setBoletoModalOpen] = useState(false)

  const [selectedCert, setSelectedCert] = useState<CertificadoQualidade | null>(null)
  const [certModalOpen, setCertModalOpen] = useState(false)

  const [tmsModalOpen, setTmsModalOpen] = useState(false)

  const [solicitarSegundaViaOpen, setSolicitarSegundaViaOpen] = useState(false)

  // Modal de Envio Múltiplo
  const [multiSendOpen, setMultiSendOpen] = useState(false)
  const [multiSendDocs, setMultiSendDocs] = useState<SelectedDocItem[]>([])
  const [multiSendClienteId, setMultiSendClienteId] = useState('')
  const [multiSendClienteNome, setMultiSendClienteNome] = useState('')

  // Clientes disponíveis para o usuário (conforme carteira / RBAC)
  const clientesDisponiveis = useMemo(() => {
    if (!user) return []
    const role = (user.role || '').toLowerCase()
    const isGestor = ['administrador', 'diretoria', 'gerente_comercial', 'supervisor'].some((r) =>
      role.includes(r),
    )
    if (isGestor) return mockClientes
    return mockClientes.filter(
      (c) =>
        c.vendedorId === user.id ||
        c.vendedor === user.name ||
        (user.seller_code && c.vendedor.toLowerCase().includes(user.seller_code.toLowerCase())),
    )
  }, [user])

  // Função de busca
  const executarBusca = async () => {
    if (!user) return
    setLoading(true)
    try {
      const res = await consultasService.buscarDocumentos(user, {
        termoBusca,
        clienteId: clienteFiltro,
        status: statusFiltro,
        empresa: empresaFiltro,
        centro: centroFiltro,
      })
      setNfs(res.nfs)
      setBoletos(res.boletos)
      setCertificados(res.certificados)
      setPacotes(res.pacotes)
      setRbacRestrito(res.rbacRestrito)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    executarBusca()
  }, [user, clienteFiltro, statusFiltro, empresaFiltro, centroFiltro, periodoFiltro])

  const handleLimparFiltros = () => {
    setTermoBusca('')
    setClienteFiltro('TODOS')
    setPeriodoFiltro('TODOS')
    setStatusFiltro('TODOS')
    setEmpresaFiltro('TODAS')
    setCentroFiltro('TODOS')
  }

  // Ações de NF
  const handleOpenNfPreview = (nf: DocumentoFiscalNF) => {
    if (user) {
      consultasService.logAction(user, nf.clienteId, 'VIEW_NF', 'NF', nf.numeroNF, {
        mensagemDetalhe: `Abriu visualização do DANFE da NF ${nf.numeroNF}`,
      })
    }
    setSelectedNf(nf)
    setDanfeModalOpen(true)
  }

  const handleDownloadNfXml = (nf: DocumentoFiscalNF) => {
    if (user) {
      consultasService.logAction(user, nf.clienteId, 'DOWNLOAD_XML', 'NF', nf.numeroNF, {
        mensagemDetalhe: `Download do XML oficial da NF ${nf.numeroNF}`,
      })
    }
    toast.success(`Download do XML da NF ${nf.numeroNF} concluído!`)
  }

  const handleCopySecureLinkNf = (nf: DocumentoFiscalNF) => {
    if (user) {
      const link = consultasService.gerarLinkSeguro(user, nf.clienteId, 'NF', nf.numeroNF)
      navigator.clipboard.writeText(link)
      toast.success('Link seguro copiado!', {
        description: 'Válido por 72h com autorização segura no portal CIAFAL.',
      })
    }
  }

  // Ações de Boleto
  const handleOpenBoletoPreview = (boleto: BoletoFinanceiro) => {
    if (user) {
      consultasService.logAction(
        user,
        boleto.clienteId,
        'VIEW_BOLETO',
        'BOLETO',
        boleto.numeroDocumento,
        {
          mensagemDetalhe: `Abriu visualização do boleto nº ${boleto.numeroDocumento}`,
        },
      )
    }
    setSelectedBoleto(boleto)
    setBoletoModalOpen(true)
  }

  const handleCopyLinhaDigitavel = (boleto: BoletoFinanceiro) => {
    navigator.clipboard.writeText(boleto.linhaDigitavel)
    if (user) {
      consultasService.logAction(
        user,
        boleto.clienteId,
        'VIEW_BOLETO',
        'BOLETO',
        boleto.numeroDocumento,
        {
          mensagemDetalhe: `Copiou linha digitável do boleto ${boleto.numeroDocumento}`,
        },
      )
    }
    toast.success('Linha digitável copiada!')
  }

  // Ações de Certificado
  const handleOpenCertPreview = (cert: CertificadoQualidade) => {
    if (user) {
      consultasService.logAction(
        user,
        cert.clienteId,
        'VIEW_CERTIFICADO',
        'CERTIFICADO',
        cert.numeroCertificado,
        {
          mensagemDetalhe: `Abriu visualização do Certificado ${cert.numeroCertificado}`,
        },
      )
    }
    setSelectedCert(cert)
    setCertModalOpen(true)
  }

  // Abertura de Envio Múltiplo
  const handleIniciarEnvioNf = (nf: DocumentoFiscalNF) => {
    setMultiSendClienteId(nf.clienteId)
    setMultiSendClienteNome(nf.clienteNome)
    const docs: SelectedDocItem[] = [
      {
        id: nf.id,
        tipo: 'NF_PDF',
        numero: nf.numeroNF,
        descricao: `DANFE / NF nº ${nf.numeroNF} (${nf.materialResumo})`,
      },
    ]
    if (nf.boletoVinculadoId && nf.numeroBoletoVinculado) {
      docs.push({
        id: nf.boletoVinculadoId,
        tipo: 'BOLETO_PDF',
        numero: nf.numeroBoletoVinculado,
        descricao: `Boleto Bancário (Ref. NF ${nf.numeroNF})`,
      })
    }
    const certVinculado = certificados.find((c) => c.numeroNF === nf.numeroNF)
    if (certVinculado && certVinculado.statusCertificado === 'Aprovado') {
      docs.push({
        id: certVinculado.id,
        tipo: 'CERTIFICADO_PDF',
        numero: certVinculado.numeroCertificado,
        descricao: `Certificado de Qualidade nº ${certVinculado.numeroCertificado} (Lote: ${certVinculado.lote})`,
      })
    }

    setMultiSendDocs(docs)
    setMultiSendOpen(true)
  }

  const handleIniciarEnvioPacote = (pct: PacoteDocumentalCliente) => {
    setMultiSendClienteId(pct.clienteId)
    setMultiSendClienteNome(pct.clienteNome)
    const docs: SelectedDocItem[] = [
      {
        id: pct.nf.id,
        tipo: 'NF_PDF',
        numero: pct.nf.numeroNF,
        descricao: `DANFE NF nº ${pct.nf.numeroNF}`,
      },
    ]
    pct.boletos.forEach((b) => {
      docs.push({
        id: b.id,
        tipo: 'BOLETO_PDF',
        numero: b.numeroDocumento,
        descricao: `Boleto Bancário nº ${b.numeroDocumento}`,
      })
    })
    pct.certificados
      .filter((c) => c.statusCertificado === 'Aprovado')
      .forEach((c) => {
        docs.push({
          id: c.id,
          tipo: 'CERTIFICADO_PDF',
          numero: c.numeroCertificado,
          descricao: `Certificado nº ${c.numeroCertificado} (Lote ${c.lote})`,
        })
      })

    setMultiSendDocs(docs)
    setMultiSendOpen(true)
  }

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* 1. Header do Módulo com Identificação Homologação */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-serif text-primary tracking-tight">
              Consultas & Documentos 360º
            </h1>
            <Badge
              variant="outline"
              className="bg-amber-50 text-amber-900 border-amber-300 text-[10px] font-mono"
            >
              HOMOLOGAÇÃO / TESTE
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Central de autosserviço comercial · 2ª via de Notas Fiscais, Boletos, Certificados de
            Qualidade e Rastreabilidade TMS.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {rbacRestrito && (
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-800 border-blue-200 text-xs py-1 px-2.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              Carteira Comercial: <strong>{user?.name || 'Vendedor'}</strong>
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab('indicadores')}
            className="text-xs h-8 border-slate-300 gap-1.5"
          >
            <BarChart3 className="w-3.5 h-3.5 text-primary" />
            Indicadores & Auditoria
          </Button>
        </div>
      </div>

      {/* 2. Barra de Consulta Universal & Filtros Rápidos */}
      <Card className="border border-slate-200/80 shadow-xs bg-white rounded-2xl">
        <CardContent className="p-4 sm:p-5 space-y-4">
          {/* Campo de Busca Universal */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && executarBusca()}
              placeholder="O que você deseja localizar? Pesquise por cliente, CNPJ, nº do pedido, nº da NF, transporte, boleto, material, lote, corrida..."
              className="pl-10 pr-24 h-11 text-xs sm:text-sm rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all shadow-inner"
            />
            <Button
              size="sm"
              onClick={executarBusca}
              className="absolute right-1.5 top-1.5 h-8 text-xs bg-primary text-white rounded-lg px-4"
            >
              Pesquisar
            </Button>
          </div>

          {/* Filtros Rápidos */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
            {/* Cliente */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Cliente</span>
              <Select value={clienteFiltro} onValueChange={setClienteFiltro}>
                <SelectTrigger className="h-8 text-xs rounded-lg">
                  <SelectValue placeholder="Todos os clientes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos os Clientes</SelectItem>
                  {clientesDisponiveis.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.razaoSocial} ({c.sapCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Período */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Período</span>
              <Select value={periodoFiltro} onValueChange={(v: any) => setPeriodoFiltro(v)}>
                <SelectTrigger className="h-8 text-xs rounded-lg">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Qualquer data</SelectItem>
                  <SelectItem value="HOJE">Hoje</SelectItem>
                  <SelectItem value="7DIAS">Últimos 7 dias</SelectItem>
                  <SelectItem value="30DIAS">Últimos 30 dias</SelectItem>
                  <SelectItem value="MES_ATUAL">Mês atual</SelectItem>
                  <SelectItem value="MES_ANTERIOR">Mês anterior</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Status</span>
              <Select value={statusFiltro} onValueChange={setStatusFiltro}>
                <SelectTrigger className="h-8 text-xs rounded-lg">
                  <SelectValue placeholder="Todos status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos os Status</SelectItem>
                  <SelectItem value="Autorizada">NF Autorizada</SelectItem>
                  <SelectItem value="A vencer">Boleto A vencer</SelectItem>
                  <SelectItem value="Vence hoje">Boleto Vence hoje</SelectItem>
                  <SelectItem value="Vencido">Boleto Vencido</SelectItem>
                  <SelectItem value="Aprovado">Certificado Aprovado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Empresa */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Empresa</span>
              <Select value={empresaFiltro} onValueChange={setEmpresaFiltro}>
                <SelectTrigger className="h-8 text-xs rounded-lg">
                  <SelectValue placeholder="Todas empresas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODAS">Todas as Empresas</SelectItem>
                  <SelectItem value="CIAFAL Matriz">CIAFAL Matriz (0100)</SelectItem>
                  <SelectItem value="CIAFAL Filial">CIAFAL Filiais</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Centro */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Centro</span>
              <Select value={centroFiltro} onValueChange={setCentroFiltro}>
                <SelectTrigger className="h-8 text-xs rounded-lg">
                  <SelectValue placeholder="Todos centros" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos os Centros</SelectItem>
                  <SelectItem value="Contagem">Contagem MG (1010)</SelectItem>
                  <SelectItem value="Betim">Betim MG (1020)</SelectItem>
                  <SelectItem value="Sabará">Sabará MG (1030)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Limpar Filtros */}
            <div className="flex items-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLimparFiltros}
                className="h-8 text-xs w-full text-slate-600 hover:text-slate-900 gap-1 rounded-lg border border-slate-200"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Navegação em Abas do Submódulo */}
      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-4">
        <TabsList className="bg-slate-100/80 p-1 rounded-2xl grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 h-auto">
          <TabsTrigger
            value="unificada"
            className="rounded-xl text-xs py-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-xs font-semibold gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            Consulta Unificada
          </TabsTrigger>

          <TabsTrigger
            value="nfs"
            className="rounded-xl text-xs py-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-xs font-semibold gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            Notas Fiscais ({nfs.length})
          </TabsTrigger>

          <TabsTrigger
            value="boletos"
            className="rounded-xl text-xs py-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-xs font-semibold gap-1.5"
          >
            <CreditCard className="w-3.5 h-3.5" />
            Boletos ({boletos.length})
          </TabsTrigger>

          <TabsTrigger
            value="certificados"
            className="rounded-xl text-xs py-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-xs font-semibold gap-1.5"
          >
            <Award className="w-3.5 h-3.5" />
            Certificados ({certificados.length})
          </TabsTrigger>

          <TabsTrigger
            value="pacotes"
            className="rounded-xl text-xs py-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-xs font-semibold gap-1.5"
          >
            <Layers className="w-3.5 h-3.5" />
            Central de Documentos
          </TabsTrigger>

          <TabsTrigger
            value="indicadores"
            className="rounded-xl text-xs py-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-xs font-semibold gap-1.5"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Indicadores Gestão
          </TabsTrigger>
        </TabsList>

        {/* ========================================================================= */}
        {/* ABA 1: CONSULTA UNIFICADA (Visão consolidada para resolução em segundos) */}
        {/* ========================================================================= */}
        <TabsContent value="unificada" className="space-y-6">
          {/* Sugestão de Operação em Segundos */}
          <div className="p-4 bg-gradient-to-r from-blue-900 to-primary rounded-2xl text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <h3 className="text-sm font-bold tracking-tight">
                  Atendimento Imediato ao Cliente
                </h3>
              </div>
              <p className="text-xs text-blue-100/90 leading-relaxed">
                Localize os documentos de uma entrega (NF + Boleto + Certificado) e envie por
                WhatsApp ou E-mail com 1 clique.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setActiveTab('pacotes')}
              className="bg-white text-primary hover:bg-slate-100 font-bold text-xs shrink-0"
            >
              Ver Entregas por Cliente
            </Button>
          </div>

          {/* Destaque das Últimas Notas Fiscais Faturadas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Notas Fiscais Recentes
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('nfs')}
                className="text-xs text-primary gap-1"
              >
                Ver todas <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>

            {nfs.length === 0 ? (
              <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl text-xs text-muted-foreground">
                Não encontramos documentos correspondentes aos filtros selecionados.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {nfs.slice(0, 3).map((nf) => (
                  <Card
                    key={nf.id}
                    className="border border-slate-200/80 shadow-xs hover:border-primary/40 transition-all bg-white rounded-2xl"
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                            NF Eletrônica
                          </span>
                          <span className="text-base font-black text-slate-900">
                            Nº {nf.numeroNF}
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            Emissão: {nf.dataEmissaoFormatada}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold"
                        >
                          {nf.status}
                        </Badge>
                      </div>

                      <div className="pt-2 border-t border-slate-100 text-xs space-y-1">
                        <div className="font-bold text-slate-900 truncate">{nf.clienteNome}</div>
                        <div className="text-[11px] text-slate-600">
                          Pedido SAP: <strong>{nf.pedidoSap}</strong> ·{' '}
                          {nf.pesoTon.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} t
                        </div>
                        <div className="text-sm font-extrabold text-primary">
                          {nf.valorTotal.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenNfPreview(nf)}
                          className="h-8 text-xs flex-1 gap-1 border-slate-200"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-600" />
                          Visualizar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleIniciarEnvioNf(nf)}
                          className="h-8 text-xs flex-1 bg-primary text-white hover:bg-primary/90 gap-1"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          Enviar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Destaque dos Boletos & Certificados em Duas Colunas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Boletos */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  Boletos / Títulos Financeiros
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab('boletos')}
                  className="text-xs text-primary gap-1"
                >
                  Ver todos <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>

              <div className="space-y-2.5">
                {boletos.slice(0, 3).map((bol) => (
                  <div
                    key={bol.id}
                    className="p-3.5 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-between gap-3 hover:border-emerald-300 transition-all text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900">
                          Boleto #{bol.numeroDocumento}
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            bol.status === 'Vencido'
                              ? 'bg-red-50 text-red-700 border-red-200 font-bold text-[10px]'
                              : bol.status === 'Vence hoje'
                                ? 'bg-amber-50 text-amber-700 border-amber-300 font-bold text-[10px]'
                                : 'bg-blue-50 text-blue-700 border-blue-200 text-[10px]'
                          }
                        >
                          {bol.status}
                        </Badge>
                      </div>
                      <span className="text-slate-600 block truncate max-w-xs">
                        {bol.clienteNome}
                      </span>
                      <span className="text-[11px] text-muted-foreground block">
                        Vencimento: <strong>{bol.dataVencimentoFormatada}</strong> · {bol.banco}
                      </span>
                    </div>

                    <div className="text-right space-y-1 shrink-0">
                      <div className="font-extrabold text-primary text-sm">
                        {bol.valorOriginal.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </div>
                      <div className="flex items-center gap-1.5 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyLinhaDigitavel(bol)}
                          className="h-7 text-[11px] px-2 text-slate-700"
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Linha
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleOpenBoletoPreview(bol)}
                          className="h-7 text-[11px] px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          Visualizar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Certificados de Qualidade */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-blue-600" />
                  Certificados de Qualidade Aprovados
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab('certificados')}
                  className="text-xs text-primary gap-1"
                >
                  Ver todos <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>

              <div className="space-y-2.5">
                {certificados.slice(0, 3).map((cert) => (
                  <div
                    key={cert.id}
                    className="p-3.5 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-between gap-3 hover:border-blue-300 transition-all text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900">
                          {cert.numeroCertificado}
                        </span>
                        <Badge
                          variant="outline"
                          className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold"
                        >
                          {cert.statusCertificado}
                        </Badge>
                      </div>
                      <span className="text-slate-600 block truncate max-w-xs">
                        {cert.materialDescricao}
                      </span>
                      <span className="text-[11px] text-muted-foreground block">
                        Lote: <strong>{cert.lote}</strong> · Corrida:{' '}
                        <strong>{cert.corrida}</strong> · NF: {cert.numeroNF}
                      </span>
                    </div>

                    <div className="text-right space-y-1 shrink-0">
                      <span className="text-xs font-bold text-slate-800 block">
                        {cert.pesoTon.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} t
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleOpenCertPreview(cert)}
                        className="h-7 text-[11px] px-3 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Visualizar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* ABA 2: NOTAS FISCAIS (Grade clean com todas as colunas de negócio) */}
        {/* ========================================================================= */}
        <TabsContent value="nfs" className="space-y-4">
          <Card className="border border-slate-200/80 shadow-xs bg-white rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase font-bold text-[10px]">
                    <th className="p-3.5">Nº NF</th>
                    <th className="p-3.5">Série</th>
                    <th className="p-3.5">Emissão</th>
                    <th className="p-3.5">Código SAP</th>
                    <th className="p-3.5">Cliente</th>
                    <th className="p-3.5">Pedido SAP</th>
                    <th className="p-3.5">Transporte</th>
                    <th className="p-3.5">Material</th>
                    <th className="p-3.5 text-right">Peso (t)</th>
                    <th className="p-3.5 text-right">Valor Total (R$)</th>
                    <th className="p-3.5">Centro</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {nfs.map((nf) => (
                    <tr key={nf.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-black text-slate-900">{nf.numeroNF}</td>
                      <td className="p-3.5 text-slate-500">{nf.serie}</td>
                      <td className="p-3.5 whitespace-nowrap">{nf.dataEmissaoFormatada}</td>
                      <td className="p-3.5 font-mono text-slate-600">{nf.codigoClienteSap}</td>
                      <td className="p-3.5 font-bold text-slate-900 max-w-xs truncate">
                        {nf.clienteNome}
                      </td>
                      <td className="p-3.5 font-bold text-primary">{nf.pedidoSap}</td>
                      <td className="p-3.5">
                        {nf.numeroTransporte ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedNf(nf)
                              setTmsModalOpen(true)
                            }}
                            className="text-blue-700 hover:underline font-semibold flex items-center gap-1"
                          >
                            <Truck className="w-3 h-3" />
                            {nf.numeroTransporte}
                          </button>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td
                        className="p-3.5 max-w-xs truncate text-slate-700"
                        title={nf.materialResumo}
                      >
                        {nf.materialResumo}
                      </td>
                      <td className="p-3.5 text-right font-bold text-slate-900 whitespace-nowrap">
                        {nf.pesoTon.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} t
                      </td>
                      <td className="p-3.5 text-right font-extrabold text-primary whitespace-nowrap">
                        {nf.valorTotal.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </td>
                      <td className="p-3.5 text-slate-600 text-[11px] whitespace-nowrap">
                        {nf.centro.split(' ')[1]}
                      </td>
                      <td className="p-3.5 text-center">
                        <Badge
                          variant="outline"
                          className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold"
                        >
                          {nf.status}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenNfPreview(nf)}
                            className="h-7 px-2 text-xs text-slate-700 hover:text-primary"
                            title="Visualizar DANFE no CRM"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            Visualizar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopySecureLinkNf(nf)}
                            className="h-7 px-2 text-xs border-slate-200"
                            title="Copiar link seguro"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadNfXml(nf)}
                            className="h-7 px-2 text-xs border-slate-200 text-blue-700"
                            title="Baixar XML"
                          >
                            XML
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleIniciarEnvioNf(nf)}
                            className="h-7 px-2.5 text-xs bg-primary text-white hover:bg-primary/90"
                            title="Enviar por WhatsApp / E-mail"
                          >
                            <Share2 className="w-3 h-3 mr-1" />
                            Enviar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* ABA 3: BOLETOS FINANCEIROS */}
        {/* ========================================================================= */}
        <TabsContent value="boletos" className="space-y-4">
          <Card className="border border-slate-200/80 shadow-xs bg-white rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase font-bold text-[10px]">
                    <th className="p-3.5">Cliente</th>
                    <th className="p-3.5">CNPJ</th>
                    <th className="p-3.5">Nº Documento</th>
                    <th className="p-3.5">NF Relacionada</th>
                    <th className="p-3.5">Pedido</th>
                    <th className="p-3.5">Emissão</th>
                    <th className="p-3.5">Vencimento</th>
                    <th className="p-3.5 text-right">Valor Original</th>
                    <th className="p-3.5">Banco</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {boletos.map((bol) => (
                    <tr key={bol.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900 max-w-xs truncate">
                        {bol.clienteNome}
                      </td>
                      <td className="p-3.5 text-slate-600 font-mono text-[11px]">{bol.cnpj}</td>
                      <td className="p-3.5 font-black text-slate-900">{bol.numeroDocumento}</td>
                      <td className="p-3.5 font-bold text-primary">{bol.numeroNfRelacionada}</td>
                      <td className="p-3.5 text-slate-600">{bol.numeroPedido}</td>
                      <td className="p-3.5 text-slate-500">{bol.dataEmissao}</td>
                      <td className="p-3.5 font-bold text-slate-900">
                        {bol.dataVencimentoFormatada}
                      </td>
                      <td className="p-3.5 text-right font-extrabold text-primary whitespace-nowrap">
                        {bol.valorOriginal.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </td>
                      <td className="p-3.5 text-slate-600 text-[11px]">
                        {bol.banco.split(' ')[0]}
                      </td>
                      <td className="p-3.5 text-center">
                        <Badge
                          variant="outline"
                          className={
                            bol.status === 'Vencido'
                              ? 'bg-red-50 text-red-700 border-red-200 font-bold'
                              : bol.status === 'Vence hoje'
                                ? 'bg-amber-50 text-amber-700 border-amber-300 font-bold'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }
                        >
                          {bol.status}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyLinhaDigitavel(bol)}
                            className="h-7 px-2 text-xs text-slate-700"
                            title="Copiar linha digitável"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenBoletoPreview(bol)}
                            className="h-7 px-2.5 text-xs border-slate-200"
                          >
                            Visualizar
                          </Button>

                          {bol.requerSolicitacaoFinanceiro ? (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedBoleto(bol)
                                setSolicitarSegundaViaOpen(true)
                              }}
                              className="h-7 px-2.5 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                            >
                              Solicitar 2ª via
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => {
                                setMultiSendClienteId(bol.clienteId)
                                setMultiSendClienteNome(bol.clienteNome)
                                setMultiSendDocs([
                                  {
                                    id: bol.id,
                                    tipo: 'BOLETO_PDF',
                                    numero: bol.numeroDocumento,
                                    descricao: `Boleto Bancário #${bol.numeroDocumento} (NF ${bol.numeroNfRelacionada})`,
                                  },
                                ])
                                setMultiSendOpen(true)
                              }}
                              className="h-7 px-2.5 text-xs bg-primary text-white hover:bg-primary/90"
                            >
                              <Share2 className="w-3 h-3 mr-1" />
                              Enviar
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* ABA 4: CERTIFICADOS DE QUALIDADE */}
        {/* ========================================================================= */}
        <TabsContent value="certificados" className="space-y-4">
          <Card className="border border-slate-200/80 shadow-xs bg-white rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase font-bold text-[10px]">
                    <th className="p-3.5">Nº Certificado</th>
                    <th className="p-3.5">Nº NF</th>
                    <th className="p-3.5">Item</th>
                    <th className="p-3.5">Pedido</th>
                    <th className="p-3.5">Cliente</th>
                    <th className="p-3.5">Material</th>
                    <th className="p-3.5">Lote</th>
                    <th className="p-3.5">Corrida</th>
                    <th className="p-3.5 text-right">Qtd (t)</th>
                    <th className="p-3.5">Data</th>
                    <th className="p-3.5">Unidade Produtora</th>
                    <th className="p-3.5 text-center">Status</th>
                    <th className="p-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {certificados.map((cert) => (
                    <tr key={cert.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-black text-blue-900">{cert.numeroCertificado}</td>
                      <td className="p-3.5 font-bold text-slate-900">{cert.numeroNF}</td>
                      <td className="p-3.5 text-slate-500">{cert.itemNF}</td>
                      <td className="p-3.5 font-bold text-primary">{cert.pedidoSap}</td>
                      <td className="p-3.5 font-semibold text-slate-900 max-w-xs truncate">
                        {cert.clienteNome}
                      </td>
                      <td
                        className="p-3.5 max-w-xs truncate text-slate-700"
                        title={cert.materialDescricao}
                      >
                        {cert.materialDescricao}
                      </td>
                      <td className="p-3.5 font-mono font-medium text-slate-800">{cert.lote}</td>
                      <td className="p-3.5 font-mono font-bold text-primary">{cert.corrida}</td>
                      <td className="p-3.5 text-right font-bold text-slate-900 whitespace-nowrap">
                        {cert.pesoTon.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} t
                      </td>
                      <td className="p-3.5 text-slate-500 whitespace-nowrap">{cert.dataEmissao}</td>
                      <td className="p-3.5 text-[11px] text-slate-600 whitespace-nowrap">
                        {cert.unidadeProdutora.split(' ')[1]}
                      </td>
                      <td className="p-3.5 text-center">
                        <Badge
                          variant="outline"
                          className={
                            cert.statusCertificado === 'Aprovado'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold'
                              : 'bg-amber-50 text-amber-700 border-amber-300 font-bold'
                          }
                        >
                          {cert.statusCertificado}
                        </Badge>
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenCertPreview(cert)}
                            className="h-7 px-2.5 text-xs border-slate-200"
                          >
                            Visualizar
                          </Button>
                          <Button
                            size="sm"
                            disabled={cert.statusCertificado !== 'Aprovado'}
                            onClick={() => {
                              setMultiSendClienteId(cert.clienteId)
                              setMultiSendClienteNome(cert.clienteNome)
                              setMultiSendDocs([
                                {
                                  id: cert.id,
                                  tipo: 'CERTIFICADO_PDF',
                                  numero: cert.numeroCertificado,
                                  descricao: `Certificado de Qualidade nº ${cert.numeroCertificado} (Lote: ${cert.lote})`,
                                },
                              ])
                              setMultiSendOpen(true)
                            }}
                            className="h-7 px-2.5 text-xs bg-primary text-white hover:bg-primary/90"
                          >
                            <Share2 className="w-3 h-3 mr-1" />
                            Enviar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* ========================================================================= */}
        {/* ABA 5: CENTRAL DE DOCUMENTOS (Timeline consolidada por Faturamento/Entrega) */}
        {/* ========================================================================= */}
        <TabsContent value="pacotes" className="space-y-4">
          <div className="space-y-4">
            {pacotes.map((pct) => (
              <Card
                key={pct.id}
                className="border border-slate-200/80 shadow-xs bg-white rounded-2xl overflow-hidden"
              >
                <CardContent className="p-5 space-y-4">
                  {/* Topo do Pacote */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-sm">
                          {pct.clienteNome}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-slate-600 bg-slate-50 font-mono text-xs"
                        >
                          SAP: {pct.codigoClienteSap}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold text-xs"
                        >
                          {pct.statusFluxo}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Pedido SAP: <strong className="text-primary">{pct.pedidoSap}</strong> ·
                        Faturado em {pct.dataFaturamento} · Valor:{' '}
                        <strong className="text-slate-900">
                          {pct.valorTotal.toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                        </strong>{' '}
                        ({pct.pesoTon.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} t)
                      </p>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleIniciarEnvioPacote(pct)}
                      className="bg-primary text-white hover:bg-primary/90 font-bold text-xs gap-1.5 h-8 shrink-0"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      Enviar Pacote Completo ao Cliente
                    </Button>
                  </div>

                  {/* Timeline Visual dos Documentos do Faturamento */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    {/* 1. Nota Fiscal */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-primary" />
                          Nota Fiscal
                        </span>
                        <Badge variant="outline" className="text-[10px] bg-white">
                          DANFE
                        </Badge>
                      </div>
                      <div className="text-slate-600">
                        <span className="font-black text-slate-900 block text-xs">
                          Nº {pct.nf.numeroNF}
                        </span>
                        <span className="text-[11px] block text-slate-500">
                          {pct.nf.dataEmissaoFormatada}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenNfPreview(pct.nf)}
                        className="w-full h-7 text-[11px] border-slate-300"
                      >
                        Visualizar DANFE
                      </Button>
                    </div>

                    {/* 2. Boletos */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <CreditCard className="w-4 h-4 text-emerald-600" />
                          Boleto Bancário
                        </span>
                        <Badge variant="outline" className="text-[10px] bg-white text-emerald-700">
                          {pct.boletos[0]?.status || 'A vencer'}
                        </Badge>
                      </div>
                      <div className="text-slate-600">
                        <span className="font-black text-slate-900 block text-xs">
                          #{pct.boletos[0]?.numeroDocumento}
                        </span>
                        <span className="text-[11px] block text-slate-500">
                          Venc: {pct.boletos[0]?.dataVencimentoFormatada}
                        </span>
                      </div>
                      {pct.boletos[0] && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenBoletoPreview(pct.boletos[0])}
                          className="w-full h-7 text-[11px] border-slate-300"
                        >
                          Visualizar Boleto
                        </Button>
                      )}
                    </div>

                    {/* 3. Certificados */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-blue-600" />
                          Certificado CQ
                        </span>
                        <Badge variant="outline" className="text-[10px] bg-white text-blue-700">
                          {pct.certificados.length} Certificado(s)
                        </Badge>
                      </div>
                      <div className="text-slate-600">
                        <span className="font-black text-slate-900 block text-xs">
                          {pct.certificados[0]?.numeroCertificado || 'CQ-88992'}
                        </span>
                        <span className="text-[11px] block text-slate-500">
                          Lote: {pct.certificados[0]?.lote || 'L-2026'}
                        </span>
                      </div>
                      {pct.certificados[0] && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenCertPreview(pct.certificados[0])}
                          className="w-full h-7 text-[11px] border-slate-300"
                        >
                          Visualizar CQ
                        </Button>
                      )}
                    </div>

                    {/* 4. Transporte & Entrega */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Truck className="w-4 h-4 text-blue-700" />
                          Logística TMS
                        </span>
                        <Badge variant="outline" className="text-[10px] bg-white text-blue-800">
                          {pct.transporte?.numeroTransporte || 'TR-88902'}
                        </Badge>
                      </div>
                      <div className="text-slate-600">
                        <span className="font-bold text-slate-900 block text-xs truncate">
                          {pct.transporte?.transportadora || 'TransAço'}
                        </span>
                        <span className="text-[11px] block text-slate-500">
                          Status: <strong>{pct.transporte?.status || 'Entregue'}</strong>
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedNf(pct.nf)
                          setTmsModalOpen(true)
                        }}
                        className="w-full h-7 text-[11px] border-slate-300"
                      >
                        Ver Rastreamento
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ========================================================================= */}
        {/* ABA 6: INDICADORES PARA GESTORES & AUDITORIA */}
        {/* ========================================================================= */}
        <TabsContent value="indicadores" className="space-y-4">
          <IndicadoresConsultasPanel />
        </TabsContent>
      </Tabs>

      {/* MODAIS GLOBAIS DE CONSULTAS */}
      <DanfePreviewModal
        nf={selectedNf}
        open={danfeModalOpen}
        onOpenChange={setDanfeModalOpen}
        onOpenSendModal={handleIniciarEnvioNf}
        onOpenTmsModal={(nf) => {
          setSelectedNf(nf)
          setTmsModalOpen(true)
        }}
      />

      <BoletoPreviewModal
        boleto={selectedBoleto}
        open={boletoModalOpen}
        onOpenChange={setBoletoModalOpen}
        onOpenSolicitarFinanceiro={(bol) => {
          setSelectedBoleto(bol)
          setSolicitarSegundaViaOpen(true)
        }}
        onOpenSendModal={(bol) => {
          setMultiSendClienteId(bol.clienteId)
          setMultiSendClienteNome(bol.clienteNome)
          setMultiSendDocs([
            {
              id: bol.id,
              tipo: 'BOLETO_PDF',
              numero: bol.numeroDocumento,
              descricao: `Boleto Bancário #${bol.numeroDocumento}`,
            },
          ])
          setMultiSendOpen(true)
        }}
      />

      <CertificadoPreviewModal
        certificado={selectedCert}
        open={certModalOpen}
        onOpenChange={setCertModalOpen}
        onOpenSendModal={(cert) => {
          setMultiSendClienteId(cert.clienteId)
          setMultiSendClienteNome(cert.clienteNome)
          setMultiSendDocs([
            {
              id: cert.id,
              tipo: 'CERTIFICADO_PDF',
              numero: cert.numeroCertificado,
              descricao: `Certificado de Qualidade nº ${cert.numeroCertificado}`,
            },
          ])
          setMultiSendOpen(true)
        }}
      />

      <MultiDocumentSendModal
        open={multiSendOpen}
        onOpenChange={setMultiSendOpen}
        clienteId={multiSendClienteId}
        clienteNome={multiSendClienteNome}
        documentos={multiSendDocs}
        onSuccess={() => executarBusca()}
      />

      <SolicitarSegundaViaModal
        boleto={selectedBoleto}
        open={solicitarSegundaViaOpen}
        onOpenChange={setSolicitarSegundaViaOpen}
        onSuccess={() => executarBusca()}
      />

      <TmsTransporteModal nf={selectedNf} open={tmsModalOpen} onOpenChange={setTmsModalOpen} />
    </div>
  )
}
