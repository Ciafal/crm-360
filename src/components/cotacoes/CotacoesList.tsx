import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Plus,
  Search,
  Filter,
  Columns,
  List,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  MessageSquare,
  Server,
  DollarSign,
  TrendingUp,
  RotateCcw,
  Eye,
  ChevronRight,
  ShieldCheck,
  Check,
  Building2,
  Calendar,
} from 'lucide-react'
import { quotationService, PRELOADED_CUSTOMERS } from '@/services/quotation_service'
import {
  QuotationStatusBadge,
  ApprovalStatusBadge,
} from '@/components/cotacoes/QuotationStatusBadge'
import { StockBadge } from '@/components/cotacoes/StockBadge'
import { PriceDeviationBadge } from '@/components/cotacoes/PriceDeviationBadge'
import { PDFPreviewDialog } from '@/components/cotacoes/PDFPreviewDialog'
import { CommunicationComposer } from '@/components/cotacoes/CommunicationComposer'
import { StockResponseDialog } from '@/components/cotacoes/StockResponseDialog'
import { toast } from 'sonner'
import type { Quotation, QuotationStatus, StockConfirmationRequest } from '@/types/quotation'

export default function CotacoesList() {
  const navigate = useNavigate()
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [stockConfirmations, setStockConfirmations] = useState<StockConfirmationRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'KANBAN' | 'LIST'>('KANBAN')
  const [activeTab, setActiveTab] = useState<string>('TODAS')
  const [searchText, setSearchText] = useState('')

  // Dialogs
  const [previewPdfQuote, setPreviewPdfQuote] = useState<Quotation | null>(null)
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false)
  const [commQuote, setCommQuote] = useState<Quotation | null>(null)
  const [commDialogOpen, setCommDialogOpen] = useState(false)
  const [activeStockReq, setActiveStockReq] = useState<StockConfirmationRequest | null>(null)
  const [stockRespDialogOpen, setStockRespDialogOpen] = useState(false)

  const loadData = async () => {
    setLoading(true)
    const list = await quotationService.getAllQuotations()
    const confs = quotationService.getStoredStockConfirmations()
    setQuotations(list)
    setStockConfirmations(confs)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  // Métricas de Cotações
  const totalCotado = quotations.reduce((acc, q) => acc + q.total_value, 0)
  const countAguardandoAprovacao = quotations.filter(
    (q) => q.approval_status === 'AGUARDANDO_APROVACAO',
  ).length
  const countAguardandoEstoque = quotations.filter(
    (q) => q.stock_status === 'AGUARDANDO_CONFIRMACAO' || q.stock_status === 'ESTOQUE_BAIXO',
  ).length
  const countAguardandoSap = quotations.filter(
    (q) => q.status === 'AGUARDANDO_IMPLANTACAO_SAP',
  ).length
  const countImplantadas = quotations.filter((q) => q.status === 'PEDIDO_SAP_IMPLANTADO').length

  // Filtragem
  const filteredQuotations = quotations.filter((q) => {
    const matchesSearch =
      q.code.toLowerCase().includes(searchText.toLowerCase()) ||
      q.customer_name.toLowerCase().includes(searchText.toLowerCase()) ||
      q.seller_name.toLowerCase().includes(searchText.toLowerCase()) ||
      (q.sap_order_number || '').toLowerCase().includes(searchText.toLowerCase())

    if (!matchesSearch) return false

    if (activeTab === 'MINHAS')
      return q.seller_id.includes('vendedor') || q.seller_name.includes('Carlos')
    if (activeTab === 'AGUARDANDO_APROVACAO') return q.approval_status === 'AGUARDANDO_APROVACAO'
    if (activeTab === 'AGUARDANDO_ESTOQUE')
      return q.stock_status === 'AGUARDANDO_CONFIRMACAO' || q.stock_status === 'ESTOQUE_BAIXO'
    if (activeTab === 'CONVERTIDAS')
      return q.status === 'PEDIDO_SAP_IMPLANTADO' || q.status === 'BLOQUEADO_NO_SAP'
    return true
  })

  // Colunas do Kanban
  const kanbanColumns: Array<{
    id: string
    title: string
    statuses: QuotationStatus[]
    badgeColor: string
  }> = [
    {
      id: 'rascunho',
      title: 'Rascunho & Elaboração',
      statuses: ['RASCUNHO', 'EM_ELABORACAO'],
      badgeColor: 'bg-slate-100 text-slate-800',
    },
    {
      id: 'confirmacao_estoque',
      title: 'Confirmação de Estoque',
      statuses: ['AGUARDANDO_CONFIRMACAO_ESTOQUE'],
      badgeColor: 'bg-orange-100 text-orange-900',
    },
    {
      id: 'aprovacao',
      title: 'Aguardando Aprovação',
      statuses: ['AGUARDANDO_APROVACAO', 'AJUSTE_SOLICITADO'],
      badgeColor: 'bg-amber-100 text-amber-900',
    },
    {
      id: 'aprovada',
      title: 'Aprovada Internamente',
      statuses: ['APROVADA_INTERNAMENTE'],
      badgeColor: 'bg-indigo-100 text-indigo-900',
    },
    {
      id: 'enviada_negociacao',
      title: 'Enviada / Negociação',
      statuses: ['ENVIADA_AO_CLIENTE', 'EM_NEGOCIACAO'],
      badgeColor: 'bg-cyan-100 text-cyan-900',
    },
    {
      id: 'aceita',
      title: 'Aceita pelo Cliente',
      statuses: ['ACEITA'],
      badgeColor: 'bg-emerald-100 text-emerald-900',
    },
    {
      id: 'aguardando_sap',
      title: 'Aguardando SAP ECC',
      statuses: ['AGUARDANDO_IMPLANTACAO_SAP', 'PROCESSANDO_SAP'],
      badgeColor: 'bg-blue-600 text-white',
    },
    {
      id: 'pedido_sap',
      title: 'Pedido SAP Implantado',
      statuses: ['PEDIDO_SAP_IMPLANTADO', 'BLOQUEADO_NO_SAP'],
      badgeColor: 'bg-emerald-700 text-white',
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* CABEÇALHO DA SEÇÃO DE COTAÇÕES */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-primary tracking-tight">
            Gestão Comercial de Cotações & Pedidos SAP
          </h2>
          <p className="text-xs text-muted-foreground font-sans mt-0.5">
            Fluxo Completo 360º: Cotação ➔ Estoque ➔ Matriz de Alçada ➔ PDF/WhatsApp ➔ Fila SAP ECC
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Alternância Kanban / Lista */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-border/40">
            <Button
              size="sm"
              variant={viewMode === 'KANBAN' ? 'secondary' : 'ghost'}
              onClick={() => setViewMode('KANBAN')}
              className="h-7 text-xs font-bold gap-1 rounded-lg"
            >
              <Columns className="w-3.5 h-3.5" /> Kanban
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'LIST' ? 'secondary' : 'ghost'}
              onClick={() => setViewMode('LIST')}
              className="h-7 text-xs font-bold gap-1 rounded-lg"
            >
              <List className="w-3.5 h-3.5" /> Lista
            </Button>
          </div>

          <Link to="/crm/integracoes/sap/pedidos">
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 text-xs text-primary font-bold rounded-xl"
            >
              <Server className="w-3.5 h-3.5 text-blue-600" /> Monitor Fila SAP
            </Button>
          </Link>

          <Link to="/crm/cotacoes/nova">
            <Button
              size="sm"
              className="h-9 gap-1.5 text-xs bg-[#003A70] hover:bg-[#002850] text-white font-bold rounded-xl shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Nova Cotação
            </Button>
          </Link>
        </div>
      </div>

      {/* CARDS DE KPIS DO DASHBOARD DE COTAÇÕES */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card className="rounded-2xl p-4 border border-border/40 bg-white shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Cotações Abertas</span>
            <FileText className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="font-serif text-2xl font-bold text-slate-900">{quotations.length}</span>
          <span className="text-[11px] text-muted-foreground block mt-0.5">
            Total: <strong>R$ {totalCotado.toLocaleString('pt-BR')}</strong>
          </span>
        </Card>

        <Card className="rounded-2xl p-4 border border-amber-200 bg-amber-50/40 shadow-xs">
          <div className="flex items-center justify-between text-amber-900 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Aguardando Aprovação
            </span>
            <Clock className="w-3.5 h-3.5 text-amber-700" />
          </div>
          <span className="font-serif text-2xl font-bold text-amber-800">
            {countAguardandoAprovacao}
          </span>
          <span className="text-[11px] text-amber-700 block mt-0.5 font-medium">
            Matriz de Alçada / Desvios
          </span>
        </Card>

        <Card className="rounded-2xl p-4 border border-orange-200 bg-orange-50/40 shadow-xs">
          <div className="flex items-center justify-between text-orange-900 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Estoque &lt; 5t (PCP)
            </span>
            <AlertTriangle className="w-3.5 h-3.5 text-orange-700" />
          </div>
          <span className="font-serif text-2xl font-bold text-orange-800">
            {countAguardandoEstoque}
          </span>
          <span className="text-[11px] text-orange-700 block mt-0.5 font-medium">
            Confirmação de Disponibilidade
          </span>
        </Card>

        <Card className="rounded-2xl p-4 border border-blue-200 bg-blue-50/40 shadow-xs">
          <div className="flex items-center justify-between text-blue-900 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Aguardando SAP</span>
            <Server className="w-3.5 h-3.5 text-blue-700" />
          </div>
          <span className="font-serif text-2xl font-bold text-blue-800">{countAguardandoSap}</span>
          <span className="text-[11px] text-blue-700 block mt-0.5 font-medium">
            Posicionado na Fila NetWeaver
          </span>
        </Card>

        <Card className="rounded-2xl p-4 border border-emerald-200 bg-emerald-50/40 shadow-xs">
          <div className="flex items-center justify-between text-emerald-900 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Implantadas no SAP
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
          </div>
          <span className="font-serif text-2xl font-bold text-emerald-800">{countImplantadas}</span>
          <span className="text-[11px] text-emerald-700 block mt-0.5 font-medium">
            Ordem de Venda Oficial Gerada
          </span>
        </Card>
      </div>

      {/* SOLICITAÇÕES PENDENTES DE CONFIRMAÇÃO DE ESTOQUE (BANNER OPERACIONAL PCP) */}
      {stockConfirmations.some((c) => c.confirmation_status === 'AGUARDANDO_ANALISE') && (
        <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-3xl p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-600 text-white rounded-xl">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-xs text-orange-950 uppercase tracking-wider">
                  Workflow PCP / Logística — Confirmação de Estoque Pendente
                </h4>
                <p className="text-xs text-orange-900">
                  Existem itens cotados com saldo abaixo de 5 toneladas aguardando liberação formal.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {stockConfirmations
                .filter((c) => c.confirmation_status === 'AGUARDANDO_ANALISE')
                .map((req) => (
                  <Button
                    key={req.id}
                    size="sm"
                    onClick={() => {
                      setActiveStockReq(req)
                      setStockRespDialogOpen(true)
                    }}
                    className="h-8 text-xs bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-xs"
                  >
                    Avaliar {req.material_code} ({req.quotation_code})
                  </Button>
                ))}
            </div>
          </div>
        </Card>
      )}

      {/* BARRA DE FILTROS & ABAS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-border/40 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-muted-foreground" />
          <Input
            placeholder="Buscar por número, cliente, vendedor ou SAP..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="h-9 pl-8 text-xs rounded-xl"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'TODAS', label: 'Todas' },
            { id: 'MINHAS', label: 'Minhas Cotações' },
            { id: 'AGUARDANDO_APROVACAO', label: 'Aguardando Aprovação' },
            { id: 'AGUARDANDO_ESTOQUE', label: 'Aguardando Estoque' },
            { id: 'CONVERTIDAS', label: 'Convertidas em Pedido' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-muted-foreground hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. VISÃO KANBAN */}
      {viewMode === 'KANBAN' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-3 items-start overflow-x-auto pb-4">
          {kanbanColumns.map((col) => {
            const colQuotes = filteredQuotations.filter((q) => col.statuses.includes(q.status))

            return (
              <div
                key={col.id}
                className="bg-slate-100/70 border border-border/50 rounded-2xl p-2.5 min-w-[240px] space-y-2.5"
              >
                {/* Header da Coluna */}
                <div className="flex items-center justify-between px-1">
                  <span className="font-serif font-bold text-xs text-slate-800 tracking-tight truncate max-w-[170px]">
                    {col.title}
                  </span>
                  <Badge className={`text-[10px] font-mono font-bold ${col.badgeColor}`}>
                    {colQuotes.length}
                  </Badge>
                </div>

                {/* Cards da Coluna */}
                <div className="space-y-2.5">
                  {colQuotes.length === 0 ? (
                    <div className="p-4 text-center text-[11px] text-muted-foreground border border-dashed border-border/60 rounded-xl">
                      Nenhuma cotação
                    </div>
                  ) : (
                    colQuotes.map((q) => (
                      <Card
                        key={q.id}
                        onClick={() => navigate(`/crm/cotacoes/${q.id}`)}
                        className="p-3.5 bg-white rounded-2xl border border-border/50 shadow-xs hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer space-y-2.5 text-xs"
                      >
                        {/* Topo do Card */}
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-primary text-xs">
                            {q.code}{' '}
                            <span className="text-[10px] text-muted-foreground font-normal">
                              v{q.version}
                            </span>
                          </span>
                          <QuotationStatusBadge status={q.status} />
                        </div>

                        {/* Cliente e Valor */}
                        <div>
                          <strong className="text-slate-900 block truncate text-xs">
                            {q.customer_name}
                          </strong>
                          <span className="text-[10px] text-muted-foreground">
                            Vendedor: {q.seller_name}
                          </span>
                        </div>

                        <div className="flex items-baseline justify-between pt-1 border-t border-border/30">
                          <span className="font-serif font-bold text-sm text-emerald-700">
                            R$ {q.total_value.toLocaleString('pt-BR')}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {q.total_tons} t
                          </span>
                        </div>

                        {/* Badges de Estoque, Preço e SAP */}
                        <div className="flex flex-wrap gap-1 pt-1">
                          <StockBadge situation={q.stock_status} />
                          {q.sap_order_number && (
                            <Badge className="bg-emerald-50 text-emerald-900 border-emerald-300 font-mono text-[9px] font-bold">
                              SAP #{q.sap_order_number}
                            </Badge>
                          )}
                        </div>

                        {/* Ações Rápidas no Card */}
                        <div className="flex items-center justify-between pt-2 border-t border-border/20 text-[10px] text-muted-foreground">
                          <span>Validade: {q.valid_until}</span>
                          <div
                            className="flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewPdfQuote(q)
                                setPdfDialogOpen(true)
                              }}
                              className="p-1 hover:bg-slate-100 rounded text-slate-600"
                              title="Ver PDF"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setCommQuote(q)
                                setCommDialogOpen(true)
                              }}
                              className="p-1 hover:bg-emerald-50 rounded text-emerald-700"
                              title="WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 2. VISÃO LISTA */}
      {viewMode === 'LIST' && (
        <Card className="bg-white rounded-3xl border-border/40 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-border/40 text-[10px] uppercase font-bold text-slate-600">
                <tr>
                  <th className="py-3 px-4">Número & Versão</th>
                  <th className="py-3 px-4">Cliente / Contato</th>
                  <th className="py-3 px-4">Volume & Valor Total</th>
                  <th className="py-3 px-4">Status Cotação</th>
                  <th className="py-3 px-4">Estoque</th>
                  <th className="py-3 px-4">Aprovação</th>
                  <th className="py-3 px-4">Ordem SAP</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {filteredQuotations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs text-muted-foreground">
                      Nenhuma cotação encontrada para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredQuotations.map((q) => (
                    <tr
                      key={q.id}
                      onClick={() => navigate(`/crm/cotacoes/${q.id}`)}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-primary">
                        {q.code}{' '}
                        <span className="text-[10px] text-muted-foreground font-normal">
                          v{q.version}
                        </span>
                        <span className="text-[10px] text-muted-foreground block font-sans">
                          {q.issue_date}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <strong className="text-slate-900 block text-xs">{q.customer_name}</strong>
                        <span className="text-[11px] text-muted-foreground">
                          {q.contact_name} {q.contact_phone && `(${q.contact_phone})`}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-serif font-bold text-emerald-700 block">
                          R$ {q.total_value.toLocaleString('pt-BR')}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {q.total_tons} t · {q.items.length} itens
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <QuotationStatusBadge status={q.status} />
                      </td>

                      <td className="py-3 px-4">
                        <StockBadge situation={q.stock_status} />
                      </td>

                      <td className="py-3 px-4">
                        <ApprovalStatusBadge
                          status={q.approval_status}
                          level={q.approval_level_required}
                        />
                      </td>

                      <td className="py-3 px-4">
                        {q.sap_order_number ? (
                          <span className="font-mono font-bold text-xs bg-emerald-50 text-emerald-900 border border-emerald-200 px-2.5 py-1 rounded-lg">
                            #{q.sap_order_number}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setPreviewPdfQuote(q)
                              setPdfDialogOpen(true)
                            }}
                            className="h-7 text-[10px] text-slate-700 hover:bg-slate-100 rounded-lg"
                          >
                            PDF
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setCommQuote(q)
                              setCommDialogOpen(true)
                            }}
                            className="h-7 text-[10px] text-emerald-700 hover:bg-emerald-50 rounded-lg"
                          >
                            WhatsApp
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => navigate(`/crm/cotacoes/${q.id}`)}
                            className="h-7 text-[10px] bg-[#003A70] text-white hover:bg-[#002850] rounded-lg font-bold"
                          >
                            Abrir
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* DIÁLOGOS GLOBAIS */}
      <PDFPreviewDialog
        open={pdfDialogOpen}
        onOpenChange={setPdfDialogOpen}
        quotation={previewPdfQuote}
      />

      <CommunicationComposer
        open={commDialogOpen}
        onOpenChange={setCommDialogOpen}
        quotation={commQuote}
        onSuccess={loadData}
      />

      <StockResponseDialog
        open={stockRespDialogOpen}
        onOpenChange={setStockRespDialogOpen}
        request={activeStockReq}
        onSuccess={loadData}
      />
    </div>
  )
}
