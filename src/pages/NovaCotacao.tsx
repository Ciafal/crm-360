import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Building2,
  Calendar,
  DollarSign,
  Plus,
  Trash2,
  FileText,
  Printer,
  Send,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Server,
  Zap,
  HelpCircle,
  RefreshCw,
  Sparkles,
  Info,
  Check,
  Layers,
  Search,
} from 'lucide-react'
import {
  quotationService,
  PRELOADED_CUSTOMERS,
  CATALOG_MATERIALS,
  PreloadedCustomer,
  CatalogMaterial,
  STOCK_CONFIRMATION_THRESHOLD_TONS,
} from '@/services/quotation_service'
import { StockBadge } from '@/components/cotacoes/StockBadge'
import { PriceDeviationBadge } from '@/components/cotacoes/PriceDeviationBadge'
import {
  QuotationStatusBadge,
  ApprovalStatusBadge,
} from '@/components/cotacoes/QuotationStatusBadge'
import { StockConfirmationDialog } from '@/components/cotacoes/StockConfirmationDialog'
import { StockResponseDialog } from '@/components/cotacoes/StockResponseDialog'
import { PricingDetailsDrawer } from '@/components/cotacoes/PricingDetailsDrawer'
import { PDFPreviewDialog } from '@/components/cotacoes/PDFPreviewDialog'
import { CommunicationComposer } from '@/components/cotacoes/CommunicationComposer'
import { ClientAcceptanceDialog } from '@/components/cotacoes/ClientAcceptanceDialog'
import { InternalApprovalDialog } from '@/components/cotacoes/InternalApprovalDialog'
import { SapIntegrationRequestDialog } from '@/components/cotacoes/SapIntegrationRequestDialog'
import { toast } from 'sonner'
import type { Quotation, QuotationItem, StockSituation } from '@/types/quotation'

export default function NovaCotacao() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [quotation, setQuotation] = useState<Quotation | null>(null)

  // BLOCO 1: CLIENTE
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('CLI-8041')
  const [selectedCustomer, setSelectedCustomer] = useState<PreloadedCustomer>(
    PRELOADED_CUSTOMERS[0],
  )
  const [selectedContact, setSelectedContact] = useState<string>('Roberto Antunes')
  const [selectedShipTo, setSelectedShipTo] = useState<string>('0001088041-01')
  const [sellerName, setSellerName] = useState('Carlos Mendonça')

  // BLOCO 2: CONDIÇÕES
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0])
  const [validUntil, setValidUntil] = useState(
    new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  )
  const [paymentTerms, setPaymentTerms] = useState('28/42/56 DDL (Boleto)')
  const [incoterm, setIncoterm] = useState('CIF - Posto Cliente')
  const [freightType, setFreightType] = useState<'CIF' | 'FOB'>('CIF')
  const [freightValue, setFreightValue] = useState<number>(2500)
  const [currency, setCurrency] = useState<'BRL' | 'USD'>('BRL')
  const [notes, setNotes] = useState('')

  // BLOCO 3: PRODUTOS
  const [items, setItems] = useState<QuotationItem[]>([])
  const [materialSearch, setMaterialSearch] = useState('')
  const [selectedMaterialToAdd, setSelectedMaterialToAdd] = useState<CatalogMaterial | null>(null)

  // MODAIS E GAVETAS
  const [stockConfirmDialogOpen, setStockConfirmDialogOpen] = useState(false)
  const [stockConfirmItem, setStockConfirmItem] = useState<QuotationItem | null>(null)

  const [pricingDrawerOpen, setPricingDrawerOpen] = useState(false)
  const [pricingDrawerItem, setPricingDrawerItem] = useState<QuotationItem | null>(null)

  const [pdfDialogOpen, setPdfDialogOpen] = useState(false)
  const [commDialogOpen, setCommDialogOpen] = useState(false)
  const [clientAcceptDialogOpen, setClientAcceptDialogOpen] = useState(false)
  const [internalApprovalDialogOpen, setInternalApprovalDialogOpen] = useState(false)
  const [sapRequestDialogOpen, setSapRequestDialogOpen] = useState(false)

  // Carregar dados se for edição
  useEffect(() => {
    async function loadQuote() {
      if (!id || id === 'nova') {
        // Inicializar com 1 item padrão para agilidade do vendedor
        const defaultMat = CATALOG_MATERIALS[0]
        const defaultItem: QuotationItem = {
          id: `item-${Date.now()}`,
          item_sequence: 10,
          material_code: defaultMat.code,
          description: defaultMat.description,
          family: defaultMat.family,
          dimension: defaultMat.dimension,
          quantity: 6.0,
          unit: defaultMat.unit,
          requested_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
          sap_price: defaultMat.sapPrice,
          proposed_price: defaultMat.sapPrice,
          deviation_pct: 0,
          final_price: defaultMat.sapPrice,
          total: 6.0 * defaultMat.sapPrice,
          stock_available: defaultMat.availableStock,
          stock_situation:
            defaultMat.availableStock >= 5.0 ? 'ESTOQUE_SUFICIENTE' : 'ESTOQUE_BAIXO',
          stock_updated_at: defaultMat.stockUpdatedAt,
          stock_confirmation_required: defaultMat.availableStock < 5.0,
          stock_confirmed: defaultMat.availableStock >= 5.0,
          plant: defaultMat.plant,
          storage_location: defaultMat.storageLocation,
        }
        setItems([defaultItem])
        return
      }

      try {
        setLoading(true)
        const q = await quotationService.getQuotationById(id)
        if (q) {
          setQuotation(q)
          setSelectedCustomerId(q.customer_id)
          const cust = PRELOADED_CUSTOMERS.find((c) => c.id === q.customer_id)
          if (cust) setSelectedCustomer(cust)
          setSelectedContact(q.contact_name)
          setSelectedShipTo(q.ship_to_code)
          setSellerName(q.seller_name)
          setIssueDate(q.issue_date)
          setValidUntil(q.valid_until)
          setPaymentTerms(q.payment_terms)
          setIncoterm(q.incoterm)
          setFreightType(q.freight_type)
          setFreightValue(q.freight_value)
          setCurrency(q.currency)
          setNotes(q.notes || '')
          setItems(q.items || [])
        }
      } catch (err) {
        toast.error('Erro ao carregar cotação.')
      } finally {
        setLoading(false)
      }
    }
    loadQuote()
  }, [id])

  // Troca de Cliente
  const handleCustomerChange = (customerId: string) => {
    const cust = PRELOADED_CUSTOMERS.find((c) => c.id === customerId)
    if (!cust) return
    setSelectedCustomerId(customerId)
    setSelectedCustomer(cust)
    setSelectedContact(cust.contatos[0]?.nome || '')
    setSelectedShipTo(cust.shipToAddresses[0]?.code || '')
    setPaymentTerms(cust.condicoesPagamento[0] || '28 DDL')
  }

  // Recalcular Totais e Desvios dos Itens
  const handleItemChange = (
    index: number,
    field: 'quantity' | 'proposed_price' | 'price_justification' | 'requested_date',
    value: any,
  ) => {
    const newItems = [...items]
    const item = { ...newItems[index] }

    if (field === 'quantity') {
      const q = Math.max(0.01, Number(value))
      item.quantity = q
      item.total = q * item.proposed_price
    } else if (field === 'proposed_price') {
      const p = Math.max(0, Number(value))
      item.proposed_price = p
      item.final_price = p
      item.deviation_pct = item.sap_price > 0 ? ((p - item.sap_price) / item.sap_price) * 100 : 0
      item.total = item.quantity * p
    } else if (field === 'price_justification') {
      item.price_justification = value
    } else if (field === 'requested_date') {
      item.requested_date = value
    }

    newItems[index] = item
    setItems(newItems)
  }

  // Adicionar Material do Catálogo
  const handleAddMaterial = (mat: CatalogMaterial) => {
    const isBelowLimit = mat.availableStock < STOCK_CONFIRMATION_THRESHOLD_TONS
    const initialSituation: StockSituation =
      mat.availableStock <= 0
        ? 'SEM_ESTOQUE'
        : isBelowLimit
          ? 'ESTOQUE_BAIXO'
          : 'ESTOQUE_SUFICIENTE'

    const newItem: QuotationItem = {
      id: `item-${Date.now()}-${items.length + 1}`,
      item_sequence: (items.length + 1) * 10,
      material_code: mat.code,
      description: mat.description,
      family: mat.family,
      dimension: mat.dimension,
      quantity: 5.0,
      unit: mat.unit,
      requested_date: validUntil,
      sap_price: mat.sapPrice,
      proposed_price: mat.sapPrice,
      deviation_pct: 0,
      final_price: mat.sapPrice,
      total: 5.0 * mat.sapPrice,
      stock_available: mat.availableStock,
      stock_situation: initialSituation,
      stock_updated_at: mat.stockUpdatedAt,
      stock_confirmation_required: isBelowLimit,
      stock_confirmed: !isBelowLimit,
      plant: mat.plant,
      storage_location: mat.storageLocation,
    }

    setItems([...items, newItem])
    setSelectedMaterialToAdd(null)
    setMaterialSearch('')
    toast.success(`Material ${mat.code} adicionado à cotação!`)
  }

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    setItems(newItems)
  }

  // Cálculos do Resumo Geral
  const subtotal = items.reduce((acc, it) => acc + it.total, 0)
  const totalTons = items.reduce((acc, it) => acc + (it.unit === 't' ? it.quantity : 0), 0)

  // Desconto calculado contra o Preço de Tabela SAP
  const sapTotalReference = items.reduce((acc, it) => acc + it.quantity * it.sap_price, 0)
  const discountTotal = Math.max(0, sapTotalReference - subtotal)
  const totalValue = subtotal + (freightType === 'CIF' ? freightValue : 0)

  // Avaliação de Aprovação e Estoque
  const approvalCalc = quotationService.calculateApprovalStatus(items)

  const hasPendingStockConfirmation = items.some(
    (it) => it.stock_confirmation_required && !it.stock_confirmed,
  )

  const overallStockSituation: StockSituation = items.some(
    (it) => it.stock_situation === 'CONFIRMACAO_NEGADA',
  )
    ? 'CONFIRMACAO_NEGADA'
    : items.some((it) => it.stock_situation === 'AGUARDANDO_CONFIRMACAO')
      ? 'AGUARDANDO_CONFIRMACAO'
      : items.some((it) => it.stock_situation === 'ESTOQUE_BAIXO' && !it.stock_confirmed)
        ? 'ESTOQUE_BAIXO'
        : 'ESTOQUE_SUFICIENTE'

  // Salvar Cotação
  const handleSave = async (customStatus?: Quotation['status']) => {
    if (!selectedCustomer) {
      toast.error('Selecione um cliente válido.')
      return
    }
    if (items.length === 0) {
      toast.error('Adicione pelo menos um item à cotação.')
      return
    }

    try {
      setLoading(true)

      const payload: Partial<Quotation> = {
        id: quotation?.id,
        code: quotation?.code,
        version: quotation?.version || 1,
        customer_id: selectedCustomer.id,
        customer_sap_code: selectedCustomer.sapCode,
        customer_name: selectedCustomer.razaoSocial,
        customer_cnpj: selectedCustomer.cnpj,
        contact_name: selectedContact,
        ship_to_code: selectedShipTo,
        ship_to_address: selectedCustomer.shipToAddresses.find((s) => s.code === selectedShipTo)
          ?.address,
        seller_id: 'qas-vendedor_teste',
        seller_name: sellerName,
        issue_date: issueDate,
        valid_until: validUntil,
        payment_terms: paymentTerms,
        incoterm: incoterm,
        freight_type: freightType,
        freight_value: freightValue,
        currency: currency,
        sales_org: selectedCustomer.salesOrg,
        distribution_channel: selectedCustomer.distributionChannel,
        division: selectedCustomer.division,
        items: items,
        subtotal: subtotal,
        discount_total: discountTotal,
        surcharge_total: 0,
        total_tons: totalTons,
        total_value: totalValue,
        price_status: approvalCalc.priceStatus,
        stock_status: overallStockSituation,
        approval_status: quotation?.approval_status || approvalCalc.approvalStatus,
        approval_level_required: approvalCalc.approvalLevel,
        client_status: quotation?.client_status || 'NAO_ENVIADA',
        status:
          customStatus ||
          quotation?.status ||
          (hasPendingStockConfirmation
            ? 'AGUARDANDO_CONFIRMACAO_ESTOQUE'
            : approvalCalc.approvalStatus === 'AGUARDANDO_APROVACAO'
              ? 'AGUARDANDO_APROVACAO'
              : 'APROVADA_INTERNAMENTE'),
        notes: notes,
      }

      const saved = await quotationService.saveQuotation(payload)
      setQuotation(saved)
      toast.success(`Cotação ${saved.code} salva com sucesso!`)
      if (!id || id === 'nova') {
        navigate(`/crm/cotacoes/${saved.id}`, { replace: true })
      }
    } catch (err: any) {
      toast.error(`Erro ao salvar cotação: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Criar Nova Versão
  const handleCreateVersion = async () => {
    if (!quotation) return
    try {
      setLoading(true)
      const newVersion = await quotationService.createNewVersion(
        quotation.id,
        'Ajuste comercial solicitado pelo cliente',
      )
      toast.success(`Nova versão v${newVersion.version} criada com sucesso!`)
      navigate(`/crm/cotacoes/${newVersion.id}`)
    } catch (err: any) {
      toast.error(`Erro ao gerar versão: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Materiais filtrados para a busca rápida
  const filteredMaterials = CATALOG_MATERIALS.filter(
    (m) =>
      m.code.toLowerCase().includes(materialSearch.toLowerCase()) ||
      m.description.toLowerCase().includes(materialSearch.toLowerCase()) ||
      m.family.toLowerCase().includes(materialSearch.toLowerCase()),
  )

  const currentQuotationForPreview: Quotation = quotation || {
    id: 'temp-id',
    code: 'COT-NOVA',
    version: 1,
    customer_id: selectedCustomer.id,
    customer_sap_code: selectedCustomer.sapCode,
    customer_name: selectedCustomer.razaoSocial,
    customer_cnpj: selectedCustomer.cnpj,
    contact_name: selectedContact,
    contact_phone: selectedCustomer.contatos[0]?.telefone,
    contact_email: selectedCustomer.contatos[0]?.email,
    ship_to_code: selectedShipTo,
    ship_to_address: selectedCustomer.shipToAddresses.find((s) => s.code === selectedShipTo)
      ?.address,
    seller_id: 'qas-vendedor_teste',
    seller_name: sellerName,
    issue_date: issueDate,
    valid_until: validUntil,
    payment_terms: paymentTerms,
    incoterm: incoterm,
    freight_type: freightType,
    freight_value: freightValue,
    currency: currency,
    sales_org: selectedCustomer.salesOrg,
    distribution_channel: selectedCustomer.distributionChannel,
    division: selectedCustomer.division,
    items: items,
    subtotal: subtotal,
    discount_total: discountTotal,
    surcharge_total: 0,
    total_tons: totalTons,
    total_value: totalValue,
    price_status: approvalCalc.priceStatus,
    stock_status: overallStockSituation,
    approval_status: approvalCalc.approvalStatus,
    approval_level_required: approvalCalc.approvalLevel,
    client_status: 'NAO_ENVIADA',
    status: 'RASCUNHO',
    notes: notes,
    timeline: [],
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in pb-20">
      {/* 1. CABEÇALHO DA COTAÇÃO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/crm?tab=cotacoes')}
            className="rounded-full h-9 w-9 text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-primary tracking-tight">
                {quotation
                  ? `Cotação ${quotation.code} (v${quotation.version})`
                  : 'Nova Cotação Comercial'}
              </h1>
              {quotation && <QuotationStatusBadge status={quotation.status} />}
            </div>
            <p className="text-xs text-muted-foreground font-sans mt-0.5">
              Elaboração de proposta comercial integrada ao SAP NetWeaver & Estoque em Tempo Real
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPdfDialogOpen(true)}
            className="h-9 gap-1.5 text-xs text-primary font-semibold"
          >
            <Printer className="w-3.5 h-3.5" /> Ver PDF
          </Button>

          {quotation && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateVersion}
              className="h-9 gap-1.5 text-xs text-slate-700 font-semibold"
            >
              <Layers className="w-3.5 h-3.5" /> Nova Versão
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => handleSave()}
            disabled={loading}
            className="h-9 gap-1.5 text-xs bg-[#003A70] hover:bg-[#002850] text-white font-bold shadow-xs"
          >
            <Check className="w-3.5 h-3.5" />
            {loading ? 'Salvando...' : 'Salvar Cotação'}
          </Button>
        </div>
      </div>

      {/* 2. LAYOUT EM GRID (CORPO PRINCIPAL À ESQUERDA + PAINEL STICKY À DIREITA) */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* COLUNA ESQUERDA: BLOCOS 1, 2, 3, 4 E TIMELINE (8 COLUNAS) */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* BLOCO 1 — CLIENTE */}
          <Card className="bg-white/90 backdrop-blur-md border-border/40 shadow-xs rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-serif font-bold text-sm text-primary flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" /> Bloco 1 — Identificação do Cliente
              </h3>
              <Badge variant="outline" className="text-[10px] bg-slate-50 font-mono">
                SAP {selectedCustomer.sapCode}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Cliente */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-bold text-primary">
                  Cliente (Razão Social / Fantasia)*
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="w-full h-10 text-xs rounded-xl border border-input px-3 bg-white font-medium"
                >
                  {PRELOADED_CUSTOMERS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.razaoSocial} ({c.nomeFantasia}) — SAP {c.sapCode} — {c.cidade}/{c.uf}
                    </option>
                  ))}
                </select>
              </div>

              {/* Contato Principal */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-primary">Contato Principal</label>
                <select
                  value={selectedContact}
                  onChange={(e) => setSelectedContact(e.target.value)}
                  className="w-full h-10 text-xs rounded-xl border border-input px-3 bg-white"
                >
                  {selectedCustomer.contatos.map((ct, idx) => (
                    <option key={idx} value={ct.nome}>
                      {ct.nome} ({ct.cargo}) — {ct.telefone}
                    </option>
                  ))}
                </select>
              </div>

              {/* Recebedor de Mercadoria (Ship-to) */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-primary">
                  Local de Entrega (Ship-To SAP)*
                </label>
                <select
                  value={selectedShipTo}
                  onChange={(e) => setSelectedShipTo(e.target.value)}
                  className="w-full h-10 text-xs rounded-xl border border-input px-3 bg-white"
                >
                  {selectedCustomer.shipToAddresses.map((sh, idx) => (
                    <option key={idx} value={sh.code}>
                      [{sh.code}] {sh.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vendedor Responsável (Automático) */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground">
                  Vendedor Responsável (Automático)
                </label>
                <Input
                  value={sellerName}
                  disabled
                  className="h-10 text-xs rounded-xl bg-slate-50 font-semibold text-slate-700"
                />
              </div>

              {/* Limite de Crédito F.35 */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground">
                  Saldo de Crédito F.35 SAP
                </label>
                <div className="h-10 px-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between text-xs font-bold text-emerald-800">
                  <span>Disponível para faturamento:</span>
                  <span className="font-mono font-bold">
                    R$ {selectedCustomer.limiteCreditoDisponivel.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* BLOCO 2 — CONDIÇÕES COMERCIAIS */}
          <Card className="bg-white/90 backdrop-blur-md border-border/40 shadow-xs rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-serif font-bold text-sm text-primary flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" /> Bloco 2 — Condições Comerciais &
                Prazos
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              {/* Data Emissão */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-primary">Data de Emissão</label>
                <Input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              {/* Data Validade */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-primary">Validade da Proposta*</label>
                <Input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              {/* Condição Pagamento */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-primary">Condição de Pagamento*</label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full h-10 text-xs rounded-xl border border-input px-3 bg-white"
                >
                  {selectedCustomer.condicoesPagamento.map((cp, idx) => (
                    <option key={idx} value={cp}>
                      {cp}
                    </option>
                  ))}
                </select>
              </div>

              {/* Incoterm */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-primary">Incoterm*</label>
                <select
                  value={incoterm}
                  onChange={(e) => {
                    setIncoterm(e.target.value)
                    setFreightType(e.target.value.startsWith('CIF') ? 'CIF' : 'FOB')
                    if (e.target.value.startsWith('FOB')) setFreightValue(0)
                  }}
                  className="w-full h-10 text-xs rounded-xl border border-input px-3 bg-white"
                >
                  <option value="CIF - Posto Cliente">CIF — Posto Cliente (Frete CIAFAL)</option>
                  <option value="FOB - Retira Betim">FOB — Retira Pátio Betim/MG</option>
                  <option value="FOB - Retira Contagem">FOB — Retira Matriz Contagem/MG</option>
                </select>
              </div>

              {/* Valor Frete */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-primary">Valor do Frete (R$)</label>
                <Input
                  type="number"
                  value={freightValue}
                  disabled={freightType === 'FOB'}
                  onChange={(e) => setFreightValue(Number(e.target.value))}
                  className="h-10 text-xs rounded-xl font-mono"
                />
              </div>

              {/* Moeda */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-primary">Moeda</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as any)}
                  className="w-full h-10 text-xs rounded-xl border border-input px-3 bg-white"
                >
                  <option value="BRL">BRL (Real R$)</option>
                  <option value="USD">USD (Dólar US$)</option>
                </select>
              </div>
            </div>
          </Card>

          {/* BLOCO 3 — PRODUTOS & MATERIAIS */}
          <Card className="bg-white/90 backdrop-blur-md border-border/40 shadow-xs rounded-3xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
              <div>
                <h3 className="font-serif font-bold text-sm text-primary flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" /> Bloco 3 — Itens da Cotação &
                  Consulta de Estoque SAP
                </h3>
                <span className="text-[11px] text-muted-foreground">
                  Grid operacional: Preço SAP, Preço Proposto, Desvio %, Estoque e Confirmação
                </span>
              </div>

              {/* Busca Rápida para Adicionar Produto */}
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar material SAP ou código..."
                  value={materialSearch}
                  onChange={(e) => setMaterialSearch(e.target.value)}
                  className="h-9 pl-8 text-xs rounded-xl"
                />

                {materialSearch && (
                  <div className="absolute top-10 left-0 right-0 z-30 bg-white border border-border/60 rounded-2xl shadow-xl max-h-60 overflow-y-auto p-1.5 space-y-1">
                    {filteredMaterials.map((mat) => (
                      <div
                        key={mat.code}
                        onClick={() => handleAddMaterial(mat)}
                        className="p-2 rounded-xl hover:bg-slate-100 cursor-pointer text-xs flex items-center justify-between transition-colors"
                      >
                        <div>
                          <strong className="text-primary block font-mono">{mat.code}</strong>
                          <span className="text-[11px] text-slate-700 block">
                            {mat.description}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-serif font-bold text-emerald-700 block">
                            R$ {mat.sapPrice.toLocaleString('pt-BR')} / {mat.unit}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-semibold">
                            Estoque: {mat.availableStock} {mat.unit}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* GRID DE ITENS */}
            <div className="space-y-3">
              {items.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-2xl">
                  Nenhum produto adicionado. Utilize a busca acima para incluir materiais SAP.
                </div>
              ) : (
                items.map((it, idx) => {
                  const isStockBelow5t = it.stock_available < STOCK_CONFIRMATION_THRESHOLD_TONS

                  return (
                    <div
                      key={it.id || idx}
                      className="p-4 rounded-2xl border border-border/60 bg-slate-50/40 space-y-3 hover:border-primary/40 transition-all text-xs"
                    >
                      {/* Topo do Item */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/30 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-muted-foreground font-bold">
                            #{(idx + 1) * 10}
                          </span>
                          <span className="font-mono font-bold text-primary text-sm">
                            {it.material_code}
                          </span>
                          <span className="text-slate-800 font-medium truncate max-w-md">
                            {it.description}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <StockBadge situation={it.stock_situation} />
                          <PriceDeviationBadge deviationPct={it.deviation_pct} />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(idx)}
                            className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                            title="Remover Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Dados de Estoque e Posição SAP */}
                      <div className="p-2.5 bg-white rounded-xl border border-border/40 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <div className="flex items-center gap-3">
                          <span>
                            Estoque Disponível:{' '}
                            <strong className="font-mono text-slate-900 font-bold">
                              {it.stock_available} {it.unit}
                            </strong>
                          </span>
                          <span className="text-muted-foreground">
                            Atualizado em: <strong>{it.stock_updated_at}</strong>
                          </span>
                          <span className="text-muted-foreground">
                            Planta: <strong>{it.plant || '1000'}</strong>
                          </span>
                        </div>

                        {/* Botão de Confirmação quando estoque < 5t */}
                        {isStockBelow5t && (
                          <div className="flex items-center gap-2">
                            {it.stock_confirmed ? (
                              <Badge className="bg-emerald-600 text-white text-[10px] gap-1 border-none font-bold">
                                <Check className="w-3 h-3" /> Disponibilidade Confirmada
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setStockConfirmItem(it)
                                  setStockConfirmDialogOpen(true)
                                }}
                                className="h-7 text-[10px] bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 font-bold gap-1"
                              >
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                Solicitar Confirmação (&lt; 5t)
                              </Button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Inputs de Negociação: Quantidade, Preço SAP, Preço Proposto e Total */}
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
                        {/* Quantidade */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-primary uppercase">
                            Qtd ({it.unit})*
                          </label>
                          <Input
                            type="number"
                            step="0.1"
                            value={it.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                            className="h-9 text-xs rounded-xl font-mono font-bold"
                          />
                        </div>

                        {/* Preço Referência SAP */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase">
                            Preço SAP (R$/{it.unit})
                          </label>
                          <div className="h-9 px-3 bg-slate-100 rounded-xl flex items-center font-mono text-slate-700 text-xs">
                            R$ {it.sap_price.toLocaleString('pt-BR')}
                          </div>
                        </div>

                        {/* Preço Proposto pelo Vendedor */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-primary uppercase">
                            Preço Proposto (R$)*
                          </label>
                          <Input
                            type="number"
                            step="50"
                            value={it.proposed_price}
                            onChange={(e) =>
                              handleItemChange(idx, 'proposed_price', e.target.value)
                            }
                            className="h-9 text-xs rounded-xl font-mono font-bold text-primary"
                          />
                        </div>

                        {/* Data Solicitada */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-primary uppercase">
                            Data Desejada
                          </label>
                          <Input
                            type="date"
                            value={it.requested_date}
                            onChange={(e) =>
                              handleItemChange(idx, 'requested_date', e.target.value)
                            }
                            className="h-9 text-xs rounded-xl"
                          />
                        </div>

                        {/* Total do Item & Botão Detalhes */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-primary uppercase">
                              Total Item
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setPricingDrawerItem(it)
                                setPricingDrawerOpen(true)
                              }}
                              className="text-[10px] text-primary hover:underline font-semibold"
                            >
                              Detalhar
                            </button>
                          </div>
                          <div className="h-9 px-3 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-center justify-end font-serif font-bold text-emerald-800 text-xs">
                            R$ {it.total.toLocaleString('pt-BR')}
                          </div>
                        </div>
                      </div>

                      {/* Justificativa de Desvio se houver exceção */}
                      {Math.abs(it.deviation_pct) > 0.01 && (
                        <div className="space-y-1 pt-1">
                          <label className="text-[10px] font-bold text-amber-900">
                            Motivo / Justificativa do Desvio de Preço ({it.deviation_pct.toFixed(2)}
                            %)*
                          </label>
                          <Input
                            placeholder="Ex: Desconto alinhado para volume de fechamento / concorrência."
                            value={it.price_justification || ''}
                            onChange={(e) =>
                              handleItemChange(idx, 'price_justification', e.target.value)
                            }
                            className="h-8 text-xs rounded-xl bg-amber-50/40 border-amber-200 text-amber-950"
                          />
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </Card>

          {/* BLOCO 4 — OBSERVAÇÕES & TIMELINE HISTÓRICO */}
          <Card className="bg-white/90 backdrop-blur-md border-border/40 shadow-xs rounded-3xl p-5 space-y-4">
            <h3 className="font-serif font-bold text-sm text-primary flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> Histórico & Timeline de Ações
            </h3>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-primary">Observações da Cotação</label>
              <Textarea
                placeholder="Instruções de entrega, restrições de descarregamento ou notas para faturamento SAP."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-xs rounded-xl min-h-[60px]"
              />
            </div>

            {/* Timeline de Eventos */}
            {quotation?.timeline && quotation.timeline.length > 0 && (
              <div className="pt-2 border-t border-border/30 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Trilha de Auditoria Comercial
                </span>

                <div className="space-y-2">
                  {quotation.timeline.map((evt, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-50 border border-border/30 flex items-start gap-2.5 text-xs"
                    >
                      <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md shrink-0">
                        {evt.time}
                      </span>
                      <p className="text-slate-800 leading-relaxed">{evt.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* COLUNA DIREITA: PAINEL LATERAL STICKY (4 COLUNAS) */}
        <div className="col-span-12 lg:col-span-4 sticky top-24 space-y-4">
          <Card className="bg-white/95 backdrop-blur-md border border-primary/20 shadow-md rounded-3xl p-5 space-y-4">
            {/* TOPO DO RESUMO */}
            <div className="border-b border-border/40 pb-3">
              <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground block">
                Resumo da Cotação
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="font-serif text-3xl font-bold text-emerald-700">
                  R$ {totalValue.toLocaleString('pt-BR')}
                </span>
                <span className="text-xs font-mono font-bold text-primary">
                  {totalTons.toFixed(1)} t
                </span>
              </div>
            </div>

            {/* CASCATA DE VALORES */}
            <div className="space-y-2 text-xs divide-y divide-border/20">
              <div className="flex justify-between text-slate-600 pt-1">
                <span>Subtotal dos Produtos:</span>
                <span className="font-mono font-semibold">
                  R$ {subtotal.toLocaleString('pt-BR')}
                </span>
              </div>

              <div className="flex justify-between text-slate-600 pt-2">
                <span>Frete ({incoterm.split(' ')[0]}):</span>
                <span className="font-mono font-semibold">
                  R$ {freightValue.toLocaleString('pt-BR')}
                </span>
              </div>

              {discountTotal > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium pt-2">
                  <span>Desconto Total:</span>
                  <span className="font-mono font-bold">
                    -R$ {discountTotal.toLocaleString('pt-BR')}
                  </span>
                </div>
              )}
            </div>

            {/* STATUS CARDS RESUMIDOS */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-border/40 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 text-[11px]">Status Preço:</span>
                <Badge
                  className={`text-[10px] font-bold border-none ${
                    approvalCalc.priceStatus === 'DENTRO_DA_REGRA'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {approvalCalc.priceStatus === 'DENTRO_DA_REGRA' ? 'Dentro da Regra' : 'Exceção'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600 text-[11px]">Status Estoque:</span>
                <StockBadge situation={overallStockSituation} />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600 text-[11px]">Aprovação Interna:</span>
                <ApprovalStatusBadge
                  status={quotation?.approval_status || approvalCalc.approvalStatus}
                  level={approvalCalc.approvalLevel}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600 text-[11px]">Aceite Cliente:</span>
                <Badge
                  className={`text-[10px] font-bold border-none ${
                    quotation?.client_status === 'ACEITA'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {quotation?.client_status === 'ACEITA' ? 'Aceite Formalizado' : 'Pendente'}
                </Badge>
              </div>
            </div>

            {/* AÇÕES DINÂMICAS DO VENDEDOR */}
            <div className="space-y-2 pt-2 border-t border-border/40">
              {/* 1. Solicitar Aprovação Interna */}
              {approvalCalc.approvalStatus === 'AGUARDANDO_APROVACAO' &&
                quotation?.approval_status !== 'APROVADA_SUPERVISOR' &&
                quotation?.approval_status !== 'APROVADA_GERENCIA' &&
                quotation?.approval_status !== 'APROVADA_DIRETORIA' && (
                  <Button
                    type="button"
                    onClick={() => setInternalApprovalDialogOpen(true)}
                    className="w-full h-9 text-xs bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl font-bold gap-1.5 shadow-xs"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> Aprovar Desconto (Alçada)
                  </Button>
                )}

              {/* 2. Enviar WhatsApp / E-mail */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCommDialogOpen(true)}
                  className="h-9 text-xs bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 rounded-xl font-bold gap-1"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCommDialogOpen(true)}
                  className="h-9 text-xs bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100 rounded-xl font-bold gap-1"
                >
                  <Send className="w-3.5 h-3.5 text-blue-600" /> E-mail
                </Button>
              </div>

              {/* 3. Registrar Aceite do Cliente */}
              {quotation?.client_status !== 'ACEITA' && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setClientAcceptDialogOpen(true)}
                  className="w-full h-9 text-xs border-emerald-400 bg-emerald-50/50 text-emerald-800 hover:bg-emerald-100 rounded-xl font-bold gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Registrar Aceite do
                  Cliente
                </Button>
              )}

              {/* 4. SOLICITAR IMPLANTAÇÃO NO SAP ECC */}
              <Button
                type="button"
                onClick={() => setSapRequestDialogOpen(true)}
                disabled={
                  hasPendingStockConfirmation ||
                  (quotation?.approval_status === 'AGUARDANDO_APROVACAO' &&
                    approvalCalc.approvalStatus === 'AGUARDANDO_APROVACAO')
                }
                className="w-full h-10 text-xs bg-[#003A70] hover:bg-[#002850] text-white rounded-xl font-bold shadow-md gap-1.5"
              >
                <Server className="w-4 h-4 text-white" /> Solicitar Implantação no SAP ECC
              </Button>

              {hasPendingStockConfirmation && (
                <span className="text-[10px] text-amber-800 text-center block font-medium">
                  ⚠ Implantação bloqueada: Confirme a disponibilidade de estoque (&lt;5t) primeiro.
                </span>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* DIÁLOGOS E GAVETAS */}
      <StockConfirmationDialog
        open={stockConfirmDialogOpen}
        onOpenChange={setStockConfirmDialogOpen}
        quotationId={quotation?.id || 'temp'}
        quotationCode={quotation?.code || 'COT-NOVA'}
        customerName={selectedCustomer.razaoSocial}
        item={stockConfirmItem}
        onSuccess={() => {
          if (stockConfirmItem) {
            const idx = items.findIndex((i) => i.id === stockConfirmItem.id)
            if (idx >= 0) {
              const updated = [...items]
              updated[idx].stock_situation = 'AGUARDANDO_CONFIRMACAO'
              setItems(updated)
            }
          }
        }}
      />

      <PricingDetailsDrawer
        open={pricingDrawerOpen}
        onOpenChange={setPricingDrawerOpen}
        item={pricingDrawerItem}
        pricingSnapshot={quotation?.pricing_snapshot}
      />

      <PDFPreviewDialog
        open={pdfDialogOpen}
        onOpenChange={setPdfDialogOpen}
        quotation={currentQuotationForPreview}
      />

      <CommunicationComposer
        open={commDialogOpen}
        onOpenChange={setCommDialogOpen}
        quotation={currentQuotationForPreview}
        onSuccess={() => {
          if (quotation) quotation.client_status = 'ENVIADA'
        }}
      />

      <ClientAcceptanceDialog
        open={clientAcceptDialogOpen}
        onOpenChange={setClientAcceptDialogOpen}
        quotation={currentQuotationForPreview}
        onSuccess={() => {
          if (quotation) {
            quotation.client_status = 'ACEITA'
            quotation.status = 'ACEITA'
          }
        }}
      />

      <InternalApprovalDialog
        open={internalApprovalDialogOpen}
        onOpenChange={setInternalApprovalDialogOpen}
        quotation={currentQuotationForPreview}
        onSuccess={() => {
          if (quotation) {
            quotation.approval_status = 'APROVADA_GERENCIA'
            quotation.status = 'APROVADA_INTERNAMENTE'
          }
        }}
      />

      <SapIntegrationRequestDialog
        open={sapRequestDialogOpen}
        onOpenChange={setSapRequestDialogOpen}
        quotation={currentQuotationForPreview}
        onSuccess={() => {
          toast.success('Registro posicionado na fila SAP! Redirecionando para o monitor...')
          navigate('/crm/integracoes/sap/pedidos')
        }}
      />
    </div>
  )
}
