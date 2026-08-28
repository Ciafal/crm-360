import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Search,
  Building2,
  User,
  Phone,
  Mail,
  CreditCard,
  Package,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  DollarSign,
  Plus,
  Trash2,
  FileText,
  Send,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  Factory,
  Truck,
  Check,
  Clock,
  XCircle,
  TrendingDown,
  TrendingUp,
  Info,
  ExternalLink,
  ChevronRight,
  Receipt,
  History,
  ShoppingCart,
  Sliders,
  CheckCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import {
  quotationService,
  PRELOADED_CUSTOMERS,
  CATALOG_MATERIALS,
  type PreloadedCustomer,
  type CatalogMaterial,
} from '@/services/quotation_service'
import { defaultSAPCreditProvider } from '@/providers/SAPCreditProvider'
import type { QuotationItem, Quotation } from '@/types/quotation'
import type { SAPCreditStatus } from '@/providers/SAPCreditProvider'
import { PDFPreviewDialog } from '@/components/cotacoes/PDFPreviewDialog'
import { PriceDeviationBadge } from '@/components/cotacoes/PriceDeviationBadge'
import { StockBadge } from '@/components/cotacoes/StockBadge'
import { QuoteCopilotDialog } from '@/components/cotacoes/QuoteCopilotDialog'
import { LocalSellerCopilotAgent } from '@/providers/LocalAIAdapter'
import type { QuoteCopilotInsight } from '@/providers/AIProvider'

// Helper de formatação monetária padrão pt-BR (R$ 5.882,79)
export const formatBRL = (val: number | undefined) => {
  if (val === undefined || val === null || isNaN(val)) return 'R$ 0,00'
  return val.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// Helper de formatação de peso em tonelada ("t", nunca "ton")
export const formatTons = (val: number | undefined) => {
  if (val === undefined || val === null || isNaN(val)) return '0,000 t'
  return `${val.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} t`
}

export default function NovaCotacao() {
  const navigate = useNavigate()
  const { id } = useParams<{ id?: string }>()
  const { toast } = useToast()

  // Configuração Comercial Dinâmica
  const [adminSettings, setAdminSettings] = useState(() => quotationService.getAdminSettings())
  const stockCheckThreshold = adminSettings.stockCheckThresholdTons || 5.0

  // Estado da Cotação / Código Gerado
  const [quoteCode] = useState(() => {
    const randomNum = Math.floor(10000 + Math.random() * 90000)
    return `COT-2026-${randomNum}`
  })
  const [quoteStatus, setQuoteStatus] = useState<string>('RASCUNHO')
  const [saveStatus, setSaveStatus] = useState<'SALVO' | 'SALVANDO' | 'RASCUNHO'>('RASCUNHO')

  // Seleção e Busca de Cliente
  const [customerSearch, setCustomerSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<PreloadedCustomer | null>(null)
  const [selectedContact, setSelectedContact] = useState<{
    nome: string
    cargo: string
    telefone: string
    email: string
  } | null>(null)
  const [selectedShipTo, setSelectedShipTo] = useState<string>('')
  const [isCustomerSearching, setIsCustomerSearching] = useState(false)

  // Consulta de Crédito SAP ECC F.35
  const [creditStatus, setCreditStatus] = useState<SAPCreditStatus | null>(null)
  const [loadingCredit, setLoadingCredit] = useState(false)

  // Itens da Cotação
  const [items, setItems] = useState<QuotationItem[]>([])
  const [materialSearch, setMaterialSearch] = useState('')
  const [selectedMaterial, setSelectedMaterial] = useState<CatalogMaterial | null>(null)
  const [itemQtyTons, setItemQtyTons] = useState<string>('2.0')
  const [itemProposedPrice, setItemProposedPrice] = useState<string>('')
  const [itemPriceJustification, setItemPriceJustification] = useState<string>('')
  const [itemDeliveryDate, setItemDeliveryDate] = useState<string>('2026-09-04')

  // Condições Gerais da Cotação
  const [paymentTerms, setPaymentTerms] = useState('30/60 DDL (Boleto)')
  const [freightType, setFreightType] = useState<'CIF' | 'FOB'>('CIF')
  const [freightValue, setFreightValue] = useState<number>(0)
  const [validUntil, setValidUntil] = useState<string>('2026-09-15')
  const [commercialNotes, setCommercialNotes] = useState('')

  // Drawers de Detalhes
  const [titulosDrawerOpen, setTitulosDrawerOpen] = useState(false)
  const [comprasDrawerOpen, setComprasDrawerOpen] = useState(false)
  const [pedidosDrawerOpen, setPedidosDrawerOpen] = useState(false)
  const [historicoDrawerOpen, setHistoricoDrawerOpen] = useState(false)
  const [pricingBreakdownItem, setPricingBreakdownItem] = useState<QuotationItem | null>(null)
  const [priceHistoryItem, setPriceHistoryItem] = useState<QuotationItem | null>(null)
  const [pcpProgramacaoItem, setPcpProgramacaoItem] = useState<CatalogMaterial | null>(null)
  const [stockCheckDrawerOpen, setStockCheckDrawerOpen] = useState(false)
  const [stockCheckItemTarget, setStockCheckItemTarget] = useState<QuotationItem | null>(null)
  const [stockCheckResponsible, setStockCheckResponsible] = useState<string>('PCP / Pátio Betim')
  const [stockCheckNotes, setStockCheckNotes] = useState<string>('')

  // Modais de PDF / IA Copilot
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false)
  const [createdQuotation, setCreatedQuotation] = useState<Quotation | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [copilotOpen, setCopilotOpen] = useState(false)
  const [copilotInsight, setCopilotInsight] = useState<QuoteCopilotInsight | null>(null)
  const [copilotLoading, setCopilotLoading] = useState(false)
  const [approvalModalOpen, setApprovalModalOpen] = useState(false)

  // Carregar Cotação existente se ID estiver na URL
  useEffect(() => {
    if (id) {
      quotationService.getQuotationById(id).then((q) => {
        if (q) {
          const cust = PRELOADED_CUSTOMERS.find(
            (c) => c.sapCode === q.customer_sap_code || c.id === q.customer_id,
          )
          if (cust) {
            setSelectedCustomer(cust)
            setSelectedContact({
              nome: q.contact_name,
              cargo: q.contact_role || '',
              telefone: q.contact_phone || '',
              email: q.contact_email || '',
            })
            setSelectedShipTo(q.ship_to_code)
          }
          setItems(q.items || [])
          setPaymentTerms(q.payment_terms)
          setFreightType(q.freight_type)
          setFreightValue(q.freight_value || 0)
          setValidUntil(q.valid_until)
          setCommercialNotes(q.notes || '')
          setQuoteStatus(q.status)
          fetchCreditData(q.customer_sap_code, q.customer_id)
        }
      })
    }
  }, [id])

  // Filtragem de clientes para autocomplete
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return PRELOADED_CUSTOMERS
    const term = customerSearch.toLowerCase()
    return PRELOADED_CUSTOMERS.filter(
      (c) =>
        c.razaoSocial.toLowerCase().includes(term) ||
        c.nomeFantasia.toLowerCase().includes(term) ||
        c.sapCode.includes(term) ||
        c.cnpj.includes(term) ||
        c.cidade.toLowerCase().includes(term),
    )
  }, [customerSearch])

  // Filtragem de materiais para busca no Grid
  const filteredMaterials = useMemo(() => {
    if (!materialSearch.trim()) return CATALOG_MATERIALS
    const term = materialSearch.toLowerCase()
    return CATALOG_MATERIALS.filter(
      (m) =>
        m.code.toLowerCase().includes(term) ||
        m.description.toLowerCase().includes(term) ||
        m.family.toLowerCase().includes(term) ||
        m.dimension.toLowerCase().includes(term),
    )
  }, [materialSearch])

  // Buscar dados de crédito SAP ECC (F.35)
  const fetchCreditData = async (sapCode: string, customerId = 'cust-default') => {
    try {
      setLoadingCredit(true)
      const res = await defaultSAPCreditProvider.checkCustomerCredit(sapCode, customerId)
      setCreditStatus(res)
    } catch {
      toast({
        title: 'Erro de conexão SAP',
        description: 'Não foi possível carregar o crédito no momento.',
        variant: 'destructive',
      })
    } finally {
      setLoadingCredit(false)
    }
  }

  // Ao selecionar um cliente no autocomplete
  const handleSelectCustomer = async (cust: PreloadedCustomer) => {
    setSelectedCustomer(cust)
    setCustomerSearch('')
    setIsCustomerSearching(false)
    setSelectedContact(cust.contatos[0] || null)
    setSelectedShipTo(cust.shipToAddresses[0]?.code || '')
    setPaymentTerms(cust.condicoesPagamento[0] || '30/60 DDL (Boleto)')
    setFreightType('CIF')
    setFreightValue(0)

    toast({
      title: 'Cliente Selecionado',
      description: `${cust.nomeFantasia} carregado com dados do SAP ECC.`,
    })

    await fetchCreditData(cust.sapCode, cust.id)
    triggerAutosave()
  }

  // Preencher produto ao selecionar material
  const handleSelectMaterial = (mat: CatalogMaterial) => {
    setSelectedMaterial(mat)
    setItemProposedPrice(mat.sapPrice.toString())
    setItemPriceJustification('')
    // Calcular envio estimado com base na produção prevista e estoque
    if (mat.availableStock >= 5.0) {
      setItemDeliveryDate('2026-09-03')
    } else if (mat.plannedProduction.hasPlannedProduction) {
      // Produção 02/09, expedição 03/09, transporte 1d -> 04/09
      setItemDeliveryDate('2026-09-04')
    } else {
      setItemDeliveryDate('2026-09-10')
    }
  }

  // Adicionar Item no Grid
  const handleAddItem = () => {
    if (!selectedMaterial) return
    const qty = parseFloat(itemQtyTons.replace(',', '.'))
    const proposed = parseFloat(itemProposedPrice.replace(',', '.'))

    if (isNaN(qty) || qty <= 0) {
      toast({
        title: 'Quantidade Inválida',
        description: 'Informe a quantidade em toneladas (ex: 2.0 t).',
        variant: 'destructive',
      })
      return
    }

    if (isNaN(proposed) || proposed <= 0) {
      toast({
        title: 'Preço Inválido',
        description: 'Informe o preço proposto em R$/t.',
        variant: 'destructive',
      })
      return
    }

    const sapPrice = selectedMaterial.sapPrice
    const deviationPct = ((proposed - sapPrice) / sapPrice) * 100
    const total = proposed * qty

    // Regra de Estoque Parametrizável (< 5t default)
    const isStockLow = selectedMaterial.availableStock < stockCheckThreshold
    const situation =
      selectedMaterial.availableStock === 0
        ? 'SEM_ESTOQUE'
        : isStockLow
          ? 'ESTOQUE_BAIXO'
          : 'ESTOQUE_SUFICIENTE'

    const newItem: QuotationItem = {
      id: `item-${Date.now()}`,
      item_sequence: (items.length + 1) * 10,
      material_code: selectedMaterial.code,
      description: selectedMaterial.description,
      family: selectedMaterial.family,
      dimension: selectedMaterial.dimension,
      quantity: qty,
      unit: 't',
      requested_date: itemDeliveryDate,
      sap_price: sapPrice,
      proposed_price: proposed,
      deviation_pct: deviationPct,
      final_price: proposed,
      total,
      stock_available: selectedMaterial.availableStock,
      stock_situation: situation,
      stock_updated_at: selectedMaterial.stockUpdatedAt,
      stock_confirmation_required: isStockLow,
      stock_confirmed: !isStockLow,
      plant: selectedMaterial.plant,
      storage_location: selectedMaterial.storageLocation,
      stock_details: selectedMaterial.stockDetails,
      planned_production: selectedMaterial.plannedProduction,
      price_justification: itemPriceJustification,
    }

    setItems([...items, newItem])
    setSelectedMaterial(null)
    setItemProposedPrice('')
    setItemPriceJustification('')
    setItemQtyTons('2.0')
    setMaterialSearch('')

    if (isStockLow) {
      toast({
        title: `⚠ Estoque Baixo (${formatTons(selectedMaterial.availableStock)} disponíveis)`,
        description: 'Saldo abaixo de 5,000 t. Você pode solicitar checagem ao PCP/Expedição.',
        className: 'bg-amber-50 border-amber-300 text-amber-900',
      })
    }

    triggerAutosave()
  }

  // Atualizar Preço Proposto diretamente no Grid
  const handleUpdateItemPrice = (itemId: string, newPriceStr: string) => {
    const val = parseFloat(newPriceStr.replace(',', '.'))
    setItems((prev) =>
      prev.map((it) => {
        if (it.id === itemId) {
          const proposed = isNaN(val) ? it.sap_price : val
          const deviationPct = ((proposed - it.sap_price) / it.sap_price) * 100
          return {
            ...it,
            proposed_price: proposed,
            final_price: proposed,
            deviation_pct: deviationPct,
            total: proposed * it.quantity,
          }
        }
        return it
      }),
    )
    triggerAutosave()
  }

  // Atualizar Quantidade diretamente no Grid
  const handleUpdateItemQty = (itemId: string, newQtyStr: string) => {
    const val = parseFloat(newQtyStr.replace(',', '.'))
    setItems((prev) =>
      prev.map((it) => {
        if (it.id === itemId) {
          const qty = isNaN(val) || val <= 0 ? 1.0 : val
          return {
            ...it,
            quantity: qty,
            total: it.proposed_price * qty,
          }
        }
        return it
      }),
    )
    triggerAutosave()
  }

  // Remover Item do Grid
  const handleRemoveItem = (id: string) => {
    setItems(items.filter((it) => it.id !== id))
    triggerAutosave()
  }

  // Totais
  const totalTons = useMemo(() => items.reduce((acc, it) => acc + it.quantity, 0), [items])
  const subtotalValue = useMemo(() => items.reduce((acc, it) => acc + it.total, 0), [items])
  const totalQuotationValue = useMemo(
    () => subtotalValue + (freightType === 'CIF' ? freightValue : 0),
    [subtotalValue, freightType, freightValue],
  )

  // Alçada de Aprovação Dinâmica
  const approvalEval = useMemo(() => quotationService.calculateApprovalStatus(items), [items])

  // Itens com Estoque Baixo ou Checagem Pendente
  const itemsRequiringCheck = useMemo(
    () =>
      items.filter(
        (it) => it.stock_situation === 'ESTOQUE_BAIXO' || it.stock_confirmation_required,
      ),
    [items],
  )

  // Itens com Exceção de Preço
  const itemsWithPriceException = useMemo(
    () => items.filter((it) => it.deviation_pct < -0.01),
    [items],
  )

  // Autosave simulado
  const triggerAutosave = () => {
    setSaveStatus('SALVANDO')
    setTimeout(() => {
      setSaveStatus('SALVO')
    }, 450)
  }

  // Submeter Cotação
  const handleSaveQuotation = async (goToPdf = false) => {
    if (!selectedCustomer) {
      toast({
        title: 'Cliente Obrigatório',
        description: 'Selecione um cliente para gerar a cotação.',
        variant: 'destructive',
      })
      return
    }

    if (items.length === 0) {
      toast({
        title: 'Nenhum Item Adicionado',
        description: 'Inclua ao menos um produto no grid de cotação.',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsSubmitting(true)
      const quotePayload: Partial<Quotation> = {
        code: quoteCode,
        customer_id: selectedCustomer.id,
        customer_sap_code: selectedCustomer.sapCode,
        customer_name: selectedCustomer.razaoSocial,
        customer_cnpj: selectedCustomer.cnpj,
        customer_city: selectedCustomer.cidade,
        customer_uf: selectedCustomer.uf,
        customer_archetype: selectedCustomer.archetype,
        customer_abc: selectedCustomer.abcHistorico,
        contact_name: selectedContact?.nome || 'Contato Comercial',
        contact_role: selectedContact?.cargo,
        contact_email: selectedContact?.email,
        contact_phone: selectedContact?.telefone,
        ship_to_code: selectedShipTo || selectedCustomer.shipToAddresses[0]?.code,
        ship_to_address: selectedCustomer.shipToAddresses.find((s) => s.code === selectedShipTo)
          ?.address,
        seller_id: 'qas-vendedor_teste',
        seller_name: selectedCustomer.vendedor || 'Carlos Mendonça',
        valid_until: validUntil,
        payment_terms: paymentTerms,
        incoterm: freightType === 'CIF' ? 'CIF - Posto Cliente' : 'FOB - Retira Betim',
        freight_type: freightType,
        freight_value: freightType === 'CIF' ? freightValue : 0,
        sales_org: selectedCustomer.salesOrg,
        distribution_channel: selectedCustomer.distributionChannel,
        division: selectedCustomer.division,
        items,
        subtotal: subtotalValue,
        total_tons: totalTons,
        total_value: totalQuotationValue,
        price_status: approvalEval.priceStatus,
        approval_status: approvalEval.approvalStatus,
        approval_level_required: approvalEval.approvalLevel,
        status:
          approvalEval.approvalStatus === 'PENDING'
            ? 'AGUARDANDO_APROVACAO'
            : itemsRequiringCheck.length > 0 &&
                itemsRequiringCheck.some((it) => !it.stock_confirmed)
              ? 'AGUARDANDO_CONFIRMACAO_ESTOQUE'
              : 'PRONTA_PARA_ENVIO',
        notes: commercialNotes,
      }

      const saved = await quotationService.saveQuotation(quotePayload)
      setCreatedQuotation(saved)
      setQuoteStatus(saved.status)

      toast({
        title: '✓ Cotação Salva com Sucesso',
        description: `Proposta ${saved.code} registrada no CRM 360º. Nenhuma alteração foi feita no SAP.`,
      })

      if (goToPdf) {
        setPdfPreviewOpen(true)
      } else {
        navigate('/crm/cotacoes')
      }
    } catch (err: any) {
      toast({
        title: 'Erro ao salvar cotação',
        description: err.message || 'Falha ao salvar proposta.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Executar Solicitação de Checagem de Estoque
  const handleConfirmStockCheck = async () => {
    if (!stockCheckItemTarget || !selectedCustomer) return
    try {
      await quotationService.requestStockConfirmation({
        quotation_id: quoteCode,
        quotation_code: quoteCode,
        quotation_item_id: stockCheckItemTarget.id,
        customer_name: selectedCustomer.nomeFantasia,
        material_code: stockCheckItemTarget.material_code,
        material_description: stockCheckItemTarget.description,
        requested_qty: stockCheckItemTarget.quantity,
        unit: 't',
        stock_snapshot_qty: stockCheckItemTarget.stock_available,
        requested_by: selectedCustomer.vendedor || 'Carlos Mendonça',
        assigned_area: stockCheckResponsible,
        comment:
          stockCheckNotes ||
          `Checagem solicitada pelo vendedor para ${selectedCustomer.nomeFantasia}`,
      })

      setItems((prev) =>
        prev.map((it) =>
          it.id === stockCheckItemTarget.id
            ? {
                ...it,
                stock_situation: 'AGUARDANDO_CONFIRMACAO',
                stock_confirmation_required: true,
              }
            : it,
        ),
      )

      toast({
        title: '✓ Solicitação de Checagem Enviada',
        description: `Enviada para ${stockCheckResponsible}. SLA de 48h registrado. A cotação segue normalmente.`,
      })
      setStockCheckDrawerOpen(false)
      setStockCheckItemTarget(null)
      triggerAutosave()
    } catch (err: any) {
      toast({
        title: 'Falha ao solicitar checagem',
        description: err.message,
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 animate-fade-in">
      {/* HEADER OPERACIONAL */}
      <div className="bg-white p-4 rounded-2xl border border-border/60 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/crm/cotacoes')}
            className="h-9 gap-1 text-xs text-slate-700 hover:bg-slate-50 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-xl text-primary tracking-tight">
                NOVA COTAÇÃO
              </span>
              <Badge
                variant="outline"
                className="font-mono text-xs font-bold bg-slate-50 text-primary border-primary/30"
              >
                {quoteCode}
              </Badge>
              <Badge
                className={`text-[10px] uppercase font-bold border-none ${
                  quoteStatus === 'RASCUNHO'
                    ? 'bg-slate-100 text-slate-700'
                    : quoteStatus === 'AGUARDANDO_APROVACAO'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-800'
                }`}
              >
                {quoteStatus}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Workspace Comercial CIAFAL · Gestão nativa no CRM · Mínimo preenchimento manual
            </p>
          </div>
        </div>

        {/* Ações Rápidas do Header: Freshness, Autosave & Copilot */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-1 bg-slate-50 rounded-lg border border-border/40">
            <span
              className={`w-2 h-2 rounded-full ${saveStatus === 'SALVO' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}
            />
            <span className="text-[11px] font-medium">
              {saveStatus === 'SALVO'
                ? '✓ Salvo como rascunho'
                : saveStatus === 'SALVANDO'
                  ? 'Salvando...'
                  : 'Rascunho ativo'}
            </span>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              if (!selectedCustomer) {
                toast({
                  title: 'Selecione um Cliente Primeiro',
                  description:
                    'A IA precisa do contexto do cliente para cruzar histórico, estoque e crédito.',
                  variant: 'destructive',
                })
                return
              }
              setCopilotLoading(true)
              setCopilotOpen(true)
              const copilot = new LocalSellerCopilotAgent()
              const insight = await copilot.analyzeQuoteOpportunity({
                customerId: selectedCustomer.id,
                customerName: selectedCustomer.razaoSocial,
                customerSapCode: selectedCustomer.sapCode,
                archetype: selectedCustomer.archetype,
                abcCategory: selectedCustomer.abcHistorico,
                materialCodes: items.map((it) => it.material_code),
                totalTons: totalTons || 2.0,
                authorizedPriceTons: items[0]?.sap_price || 5882.79,
                creditAvailable: creditStatus?.creditAvailable || 56020.03,
                creditStatus: (creditStatus?.creditStatus as any) || 'REGULAR',
                stockAvailableTons:
                  items.reduce((acc, it) => acc + (it.stock_available || 0), 0) || 3.4,
                hasPlannedProduction: true,
              })
              setCopilotInsight(insight)
              setCopilotLoading(false)
            }}
            className="h-9 border-purple-300 text-purple-700 bg-purple-50 hover:bg-purple-100 font-semibold text-xs gap-1.5 rounded-xl"
          >
            <Sparkles className="w-4 h-4 text-purple-600" /> Análise IA
          </Button>

          <Button
            size="sm"
            onClick={() => handleSaveQuotation(false)}
            disabled={isSubmitting}
            className="h-9 bg-primary text-white text-xs font-semibold rounded-xl"
          >
            Salvar Cotação
          </Button>
        </div>
      </div>

      {/* WORKSPACE PRINCIPAL: CONTEÚDO À ESQUERDA (2/3) + RESUMO LATERAL STICKY (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUNA ESQUERDA: WORKSPACE COMERCIAL */}
        <div className="lg:col-span-8 space-y-6">
          {/* PASSO 1: AUTOCOMPLETE DE CLIENTE */}
          <Card className="bg-white border-border/60 shadow-xs rounded-2xl overflow-hidden">
            <CardHeader className="p-4 pb-3 border-b border-border/40 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  Passo 1 — Selecionar Cliente *
                </CardTitle>
                {selectedCustomer && (
                  <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold border-none">
                    ✓ Conectado ao SAP ECC
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              {/* Autocomplete de Busca */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  placeholder="Buscar razão social, fantasia, CNPJ ou código SAP... (ex: AGRICORTE, 0001094050, Santa Rita)"
                  value={customerSearch}
                  onFocus={() => setIsCustomerSearching(true)}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value)
                    setIsCustomerSearching(true)
                  }}
                  className="pl-9 h-10 text-xs rounded-xl"
                />

                {/* Dropdown de sugestões */}
                {isCustomerSearching && (
                  <div className="absolute left-0 right-0 top-11 z-30 bg-white border border-border/60 rounded-xl shadow-lg max-h-60 overflow-y-auto p-1.5 space-y-1">
                    {filteredCustomers.length === 0 ? (
                      <div className="p-3 text-xs text-muted-foreground text-center italic">
                        Nenhum cliente SAP localizado com esse termo.
                      </div>
                    ) : (
                      filteredCustomers.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => handleSelectCustomer(c)}
                          className="p-2.5 rounded-lg text-xs hover:bg-primary/5 cursor-pointer flex items-center justify-between transition-colors border border-transparent hover:border-border/40"
                        >
                          <div>
                            <span className="font-bold text-slate-900 block">{c.razaoSocial}</span>
                            <span className="text-[11px] text-muted-foreground">
                              {c.nomeFantasia} · CNPJ: {c.cnpj} · {c.cidade}/{c.uf}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="font-mono text-[10px]">
                              SAP {c.sapCode}
                            </Badge>
                            <Badge className="bg-primary text-white text-[10px]">
                              ABC {c.abcHistorico}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Quando Cliente Selecionado: Exibir Contato & Recebedor (Ship-To) */}
              {selectedCustomer && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border/40">
                  {/* Dropdown Contato */}
                  <div className="space-y-1.5 bg-slate-50/70 p-3 rounded-xl border border-border/40">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-primary" /> Contato Comercial
                      </Label>
                      <span className="text-[10px] text-muted-foreground">
                        Preenchimento automático
                      </span>
                    </div>
                    <Select
                      value={selectedContact?.nome}
                      onValueChange={(val) => {
                        const found = selectedCustomer.contatos.find((ct) => ct.nome === val)
                        if (found) setSelectedContact(found)
                      }}
                    >
                      <SelectTrigger className="h-9 text-xs bg-white rounded-lg">
                        <SelectValue placeholder="Selecione o contato" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedCustomer.contatos.map((ct) => (
                          <SelectItem key={ct.nome} value={ct.nome}>
                            {ct.nome} — {ct.cargo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedContact && (
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                        <span className="flex items-center gap-1 truncate">
                          <Phone className="w-3 h-3 text-emerald-600 shrink-0" />{' '}
                          {selectedContact.telefone}
                        </span>
                        <span className="flex items-center gap-1 truncate">
                          <Mail className="w-3 h-3 text-blue-600 shrink-0" />{' '}
                          {selectedContact.email}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Dropdown Ship-To */}
                  <div className="space-y-1.5 bg-slate-50/70 p-3 rounded-xl border border-border/40">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5 text-primary" /> Recebedor / Ship-To (SAP)
                      </Label>
                      <span className="text-[10px] text-muted-foreground">Endereço cadastrado</span>
                    </div>
                    <Select value={selectedShipTo} onValueChange={setSelectedShipTo}>
                      <SelectTrigger className="h-9 text-xs bg-white rounded-lg">
                        <SelectValue placeholder="Selecione o local de entrega" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedCustomer.shipToAddresses.map((st) => (
                          <SelectItem key={st.code} value={st.code}>
                            {st.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-slate-600 truncate pt-1">
                      {selectedCustomer.shipToAddresses.find((s) => s.code === selectedShipTo)
                        ?.address || selectedCustomer.shipToAddresses[0]?.address}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CARDS DO CLIENTE (CRÉDITO | FINANCEIRO | RELACIONAMENTO COMERCIAL) */}
          {selectedCustomer && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* CARD 1: CRÉDITO DO CLIENTE (SAP ECC) */}
              <Card className="bg-white border-border/60 shadow-xs rounded-2xl p-3.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-border/30">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-emerald-600" /> Crédito do Cliente
                    </span>
                    <Badge className="bg-emerald-100 text-emerald-800 text-[9px] font-bold border-none">
                      ✓ Disponível
                    </Badge>
                  </div>

                  <div className="mt-2.5 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Limite Total:</span>
                      <span className="font-bold text-slate-900 font-mono">
                        {formatBRL(creditStatus?.creditLimit || 150000)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Utilizado:</span>
                      <span className="font-medium text-slate-700 font-mono">
                        {formatBRL(creditStatus?.creditUsed || 93979.97)}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-muted-foreground font-semibold">Disponível:</span>
                      <span className="font-serif font-bold text-emerald-700 text-sm font-mono">
                        {formatBRL(creditStatus?.creditAvailable || 56020.03)}
                      </span>
                    </div>

                    {/* Barra de Utilização */}
                    <div className="pt-1 space-y-1">
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>Utilização</span>
                        <span className="font-bold font-mono">
                          {creditStatus?.usedPercentage || 62.65}%
                        </span>
                      </div>
                      <Progress
                        value={creditStatus?.usedPercentage || 62.65}
                        className="h-1.5 bg-slate-100"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-border/30 text-[10px] text-muted-foreground flex items-center justify-between">
                  <span>Atualizado hoje 10:00</span>
                  <span className="font-mono">Fonte: SAP ECC</span>
                </div>
              </Card>

              {/* CARD 2: FINANCEIRO & TÍTULOS */}
              <Card className="bg-white border-border/60 shadow-xs rounded-2xl p-3.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-border/30">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Receipt className="w-4 h-4 text-blue-600" /> Financeiro
                    </span>
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] font-bold">
                      ✓ Sem vencidos
                    </Badge>
                  </div>

                  <div className="mt-2.5 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Títulos Abertos:</span>
                      <span className="font-bold text-slate-900 font-mono">
                        {formatBRL(creditStatus?.openOrdersValue || 93979.97)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Próx. Vencimento:</span>
                      <span className="font-medium text-slate-800 text-[11px]">
                        31/08/2026 ({formatBRL(6572.17)})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Último Pagamento:</span>
                      <span className="font-medium text-slate-800 text-[11px]">
                        17/08/2026 ({formatBRL(6572.17)})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-border/30 flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setTitulosDrawerOpen(true)}
                    className="text-primary hover:bg-primary/5 text-[11px] font-semibold h-7 px-2"
                  >
                    Ver títulos →
                  </Button>
                </div>
              </Card>

              {/* CARD 3: RELACIONAMENTO COMERCIAL */}
              <Card className="bg-white border-border/60 shadow-xs rounded-2xl p-3.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-border/30">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <History className="w-4 h-4 text-purple-600" /> Relacionamento
                    </span>
                    <Badge variant="outline" className="text-[9px] font-mono">
                      Curva {selectedCustomer.abcHistorico}
                    </Badge>
                  </div>

                  <div className="mt-2.5 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Última Compra:</span>
                      <span className="font-medium text-slate-800 text-[11px]">15/08/2026</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Último Produto:</span>
                      <span
                        className="font-bold text-slate-900 text-[11px] truncate max-w-[130px]"
                        title="Cantoneira 2 x 1/4"
                      >
                        Cantoneira 2 x 1/4
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Volume 90d:</span>
                      <span className="font-mono font-bold text-slate-900">38,500 t</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">Pedidos / Cotações:</span>
                      <span className="font-semibold text-slate-800">3 abertos / 2 cotações</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-border/30 flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setComprasDrawerOpen(true)}
                    className="text-primary hover:bg-primary/5 text-[11px] font-semibold h-7 px-2"
                  >
                    Ver compras →
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setPedidosDrawerOpen(true)}
                    className="text-primary hover:bg-primary/5 text-[11px] font-semibold h-7 px-2"
                  >
                    Ver pedidos →
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* PASSO 2: ITENS DA COTAÇÃO & GRID COMERCIAL */}
          <Card className="bg-white border-border/60 shadow-xs rounded-2xl overflow-hidden">
            <CardHeader className="p-4 pb-3 border-b border-border/40 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  Passo 2 — Itens da Cotação ({items.length})
                </CardTitle>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Estoque online SAP ECC · PCP Robotizado · Logística TMS · Preço SAP com cálculo de
                  desvio
                </p>
              </div>

              {/* Botão de Adição Rápida */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedMaterial(CATALOG_MATERIALS[0])}
                className="h-8 text-xs font-semibold rounded-xl text-primary border-primary/30 hover:bg-primary/5"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar item
              </Button>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              {/* Campo de Busca Rápida de Produto */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar código, descrição ou dimensão... (ex: V20200360600, Cantoneira, Tubo Inox, Viga Gerdau)"
                  value={materialSearch}
                  onChange={(e) => setMaterialSearch(e.target.value)}
                  className="pl-9 h-10 text-xs rounded-xl"
                />

                {/* Lista rápida de catálogo */}
                {materialSearch && (
                  <div className="absolute left-0 right-0 top-11 z-20 bg-white border border-border/60 rounded-xl shadow-lg max-h-56 overflow-y-auto p-1.5 space-y-1">
                    {filteredMaterials.map((m) => (
                      <div
                        key={m.code}
                        onClick={() => handleSelectMaterial(m)}
                        className="p-2.5 rounded-lg text-xs hover:bg-primary/5 cursor-pointer flex items-center justify-between transition-colors border border-transparent hover:border-border/40"
                      >
                        <div>
                          <span className="font-bold text-slate-900 block font-mono">{m.code}</span>
                          <span className="text-[11px] text-slate-600 font-medium">
                            {m.description}
                          </span>
                          <span className="text-[10px] text-muted-foreground block">
                            {m.dimension} · {m.family}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-900 font-mono block">
                            {formatBRL(m.sapPrice)}/t
                          </span>
                          <Badge
                            className={`text-[9px] ${
                              m.availableStock < stockCheckThreshold
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            }`}
                          >
                            {formatTons(m.availableStock)} disp.
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* CARD DE ADIÇÃO DE ITEM SELECIONADO COM ESTOQUE, PCP E TMS */}
              {selectedMaterial && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-primary/20 space-y-4 animate-scale-in">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/40">
                    <div>
                      <span className="font-mono font-bold text-sm text-primary block">
                        {selectedMaterial.code}
                      </span>
                      <span className="font-semibold text-xs text-slate-800">
                        {selectedMaterial.description}
                      </span>
                      <span className="text-[11px] text-muted-foreground block">
                        {selectedMaterial.dimension}
                      </span>
                    </div>

                    {/* Alerta de Estoque Baixo se < 5t */}
                    {selectedMaterial.availableStock < stockCheckThreshold && (
                      <div className="flex items-center gap-2">
                        <Badge className="bg-amber-500 text-white text-xs gap-1 py-1 px-2.5 font-bold">
                          <AlertTriangle className="w-3.5 h-3.5" />⚠ ESTOQUE BAIXO —{' '}
                          {formatTons(selectedMaterial.availableStock)} disponíveis
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Informações Automáticas: Estoque SAP, PCP Robotizado & Estimativa TMS */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    {/* Bloco 1: Estoque Disponível */}
                    <div className="p-3 bg-white rounded-xl border border-border/50 space-y-1">
                      <span className="font-bold text-slate-800 flex items-center justify-between">
                        <span>ESTOQUE DISPONÍVEL</span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          Fonte: SAP ECC
                        </span>
                      </span>
                      <div className="text-base font-bold text-slate-900 font-mono">
                        {formatTons(selectedMaterial.availableStock)}
                      </div>
                      <span className="text-[10px] text-muted-foreground block">
                        Atualizado: {selectedMaterial.stockUpdatedAt}
                      </span>
                      {selectedMaterial.availableStock < stockCheckThreshold && (
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => {
                            setStockCheckItemTarget({
                              id: `temp-${Date.now()}`,
                              item_sequence: 10,
                              material_code: selectedMaterial.code,
                              description: selectedMaterial.description,
                              quantity: parseFloat(itemQtyTons.replace(',', '.')) || 2.0,
                              unit: 't',
                              requested_date: itemDeliveryDate,
                              sap_price: selectedMaterial.sapPrice,
                              proposed_price: selectedMaterial.sapPrice,
                              deviation_pct: 0,
                              final_price: selectedMaterial.sapPrice,
                              total: selectedMaterial.sapPrice * 2.0,
                              stock_available: selectedMaterial.availableStock,
                              stock_situation: 'ESTOQUE_BAIXO',
                              stock_updated_at: selectedMaterial.stockUpdatedAt,
                              stock_confirmation_required: true,
                            })
                            setStockCheckDrawerOpen(true)
                          }}
                          className="w-full text-amber-800 bg-amber-50 hover:bg-amber-100 border-amber-300 text-[10px] font-bold h-6 mt-1"
                        >
                          Solicitar checagem
                        </Button>
                      )}
                    </div>

                    {/* Bloco 2: PCP Robotizado */}
                    <div className="p-3 bg-white rounded-xl border border-border/50 space-y-1">
                      <span className="font-bold text-purple-900 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Factory className="w-3.5 h-3.5 text-purple-600" /> PRÓXIMA PRODUÇÃO
                          PREVISTA
                        </span>
                      </span>
                      {selectedMaterial.plannedProduction.hasPlannedProduction ? (
                        <>
                          <div className="text-xs font-bold text-purple-700">
                            {selectedMaterial.plannedProduction.plannedDate
                              ?.split('-')
                              .reverse()
                              .join('/')}{' '}
                            · Linha L2
                          </div>
                          <span className="text-[10px] text-slate-600 block">
                            Qtd prevista:{' '}
                            <strong>
                              {formatTons(selectedMaterial.plannedProduction.plannedQuantityTons)}
                            </strong>
                          </span>
                          <span className="text-[9px] text-muted-foreground block italic">
                            * Produção prevista (não garantida)
                          </span>
                        </>
                      ) : (
                        <div className="text-[11px] text-muted-foreground italic py-1">
                          Sem programação de produção no SAP PP
                        </div>
                      )}
                    </div>

                    {/* Bloco 3: TMS Estimativa Logística */}
                    <div className="p-3 bg-white rounded-xl border border-border/50 space-y-1">
                      <span className="font-bold text-blue-900 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5 text-blue-600" /> PRAZO ESTIMADO DE ENVIO
                        </span>
                        <span className="text-[9px] text-muted-foreground font-mono">TMS</span>
                      </span>
                      <div className="text-xs font-semibold text-slate-800 space-y-0.5">
                        <div className="flex justify-between text-[11px]">
                          <span>Expedição estimada:</span>
                          <strong>03/09/2026</strong>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span>Entrega estimada:</span>
                          <strong className="text-blue-700">04/09/2026 (1 dia)</strong>
                        </div>
                      </div>
                      <span className="text-[9px] text-muted-foreground block">
                        Estimativa atual · Frete rodoviário dedicado
                      </span>
                    </div>
                  </div>

                  {/* Preenchimento: Quantidade e Preço Cotação */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Quantidade (t) *</Label>
                      <Input
                        placeholder="Ex: 2,000"
                        value={itemQtyTons}
                        onChange={(e) => setItemQtyTons(e.target.value)}
                        className="text-xs font-mono font-bold bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Preço SAP (R$/t)</Label>
                      <Input
                        disabled
                        value={formatBRL(selectedMaterial.sapPrice)}
                        className="text-xs bg-slate-100 font-mono font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Preço Cotação (R$/t) *</Label>
                      <Input
                        placeholder="Ex: 5882.79"
                        value={itemProposedPrice}
                        onChange={(e) => setItemProposedPrice(e.target.value)}
                        className="text-xs font-mono font-bold bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Previsão Entrega (TMS)</Label>
                      <Input
                        type="date"
                        value={itemDeliveryDate}
                        onChange={(e) => setItemDeliveryDate(e.target.value)}
                        className="text-xs bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedMaterial(null)}
                      className="text-xs"
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAddItem}
                      className="bg-primary text-white text-xs font-semibold rounded-xl"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Incluir no Grid de Itens
                    </Button>
                  </div>
                </div>
              )}

              {/* GRID OPERACIONAL DE ITENS */}
              <div className="overflow-x-auto border border-border/40 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-border/40">
                    <tr>
                      <th className="p-3">Produto</th>
                      <th className="p-3">Descrição</th>
                      <th className="p-3 text-right">Qtd</th>
                      <th className="p-3 text-center">UM</th>
                      <th className="p-3 text-right">Estoque</th>
                      <th className="p-3 text-center">Disponibilidade</th>
                      <th className="p-3 text-center">Próx. Produção</th>
                      <th className="p-3 text-center">Envio Estimado</th>
                      <th className="p-3 text-right">Preço SAP</th>
                      <th className="p-3 text-right">Preço Cotação</th>
                      <th className="p-3 text-center">Desvio</th>
                      <th className="p-3 text-right">Total</th>
                      <th className="p-3 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={13} className="p-8 text-center text-muted-foreground italic">
                          Nenhum item na cotação. Pesquise um produto acima ou clique em [ +
                          Adicionar item ].
                        </td>
                      </tr>
                    ) : (
                      items.map((it) => {
                        const isDeviation = Math.abs(it.deviation_pct) > 0.01
                        return (
                          <tr key={it.id} className="hover:bg-primary/5 transition-colors group">
                            <td className="p-3 font-mono font-bold text-primary">
                              {it.material_code}
                            </td>
                            <td className="p-3">
                              <span className="font-semibold text-slate-800 block">
                                {it.description}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {it.dimension}
                              </span>
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-slate-900">
                              <Input
                                value={it.quantity}
                                onChange={(e) => handleUpdateItemQty(it.id, e.target.value)}
                                className="w-16 h-7 text-xs font-mono font-bold text-right p-1 rounded-md inline-block bg-white"
                              />
                            </td>
                            <td className="p-3 text-center font-bold text-slate-700 font-mono">
                              t
                            </td>
                            <td className="p-3 text-right font-mono font-semibold text-slate-800">
                              {formatTons(it.stock_available)}
                            </td>
                            <td className="p-3 text-center">
                              {it.stock_available < stockCheckThreshold ? (
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  onClick={() => {
                                    setStockCheckItemTarget(it)
                                    setStockCheckDrawerOpen(true)
                                  }}
                                  className="h-6 px-1.5 text-[10px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded"
                                >
                                  ⚠ Solicitar checagem
                                </Button>
                              ) : (
                                <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold border-none">
                                  ✓ Disponível
                                </Badge>
                              )}
                            </td>
                            <td className="p-3 text-center text-[11px] text-purple-700 font-medium">
                              {it.planned_production?.plannedDate
                                ? it.planned_production.plannedDate.split('-').reverse().join('/')
                                : '02/09/2026'}
                            </td>
                            <td className="p-3 text-center text-[11px] text-blue-700 font-medium">
                              {it.requested_date
                                ? it.requested_date.split('-').reverse().join('/')
                                : '03/09/2026'}
                            </td>
                            <td className="p-3 text-right font-mono text-muted-foreground">
                              {formatBRL(it.sap_price)}/t
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-slate-900">
                              <Input
                                value={it.proposed_price}
                                onChange={(e) => handleUpdateItemPrice(it.id, e.target.value)}
                                className="w-24 h-7 text-xs font-mono font-bold text-right p-1 rounded-md inline-block bg-white"
                              />
                            </td>
                            <td className="p-3 text-center">
                              <PriceDeviationBadge deviationPct={it.deviation_pct} />
                            </td>
                            <td className="p-3 text-right font-mono font-extrabold text-slate-900">
                              {formatBRL(it.total)}
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  onClick={() => setPricingBreakdownItem(it)}
                                  title="Ver formação do preço"
                                  className="h-6 w-6 p-0 text-slate-500 hover:text-primary"
                                >
                                  <Info className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  onClick={() => handleRemoveItem(it.id)}
                                  className="h-6 w-6 p-0 text-rose-600 hover:bg-rose-50"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* CONDIÇÕES COMERCIAIS & OBSERVAÇÕES */}
          <Card className="bg-white border-border/60 shadow-xs rounded-2xl p-4">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-primary mb-3 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-primary" /> Condições Comerciais Gerais
            </CardTitle>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Condição de Pagamento</Label>
                <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                  <SelectTrigger className="h-9 text-xs rounded-xl">
                    <SelectValue placeholder="Selecione o prazo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30/60 DDL (Boleto)">30/60 DDL (Boleto Padrão)</SelectItem>
                    <SelectItem value="28 DDL">28 DDL (Boleto)</SelectItem>
                    <SelectItem value="28/42/56 DDL (Boleto)">28/42/56 DDL (Boleto)</SelectItem>
                    <SelectItem value="45 DDL">45 DDL</SelectItem>
                    <SelectItem value="À Vista (TED/PIX)">À Vista (TED/PIX)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Incoterm / Frete</Label>
                <Select
                  value={freightType}
                  onValueChange={(v) => setFreightType(v as 'CIF' | 'FOB')}
                >
                  <SelectTrigger className="h-9 text-xs rounded-xl">
                    <SelectValue placeholder="Tipo de frete" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CIF">CIF (Incluso - Posto Cliente)</SelectItem>
                    <SelectItem value="FOB">FOB (Cliente Retira Betim)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Validade da Proposta</Label>
                <Input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="sm:col-span-3 space-y-1 pt-1">
                <Label className="text-xs font-semibold">Observações Comerciais</Label>
                <Textarea
                  placeholder="Informações adicionais de negociação, descarregamento, laudo de qualidade..."
                  value={commercialNotes}
                  onChange={(e) => setCommercialNotes(e.target.value)}
                  rows={2}
                  className="text-xs rounded-xl"
                />
              </div>
            </div>
          </Card>
        </div>

        {/* COLUNA DIREITA (STICKY): PAINEL LATERAL "RESUMO COMERCIAL" */}
        <div className="lg:col-span-4 sticky top-24 space-y-4">
          <Card className="bg-white border-primary/20 shadow-md rounded-3xl overflow-hidden">
            <CardHeader className="bg-primary text-white p-4 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold tracking-tight">RESUMO COMERCIAL</CardTitle>
                <Badge className="bg-white/20 text-white font-mono text-[10px] border-none">
                  {quoteCode}
                </Badge>
              </div>
              <p className="text-[11px] text-white/80 mt-0.5">
                {selectedCustomer ? selectedCustomer.nomeFantasia : 'Nenhum cliente selecionado'}
              </p>
            </CardHeader>

            <CardContent className="p-4 space-y-3.5">
              {/* Cliente & Crédito */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Crédito Disponível:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {formatBRL(creditStatus?.creditAvailable || 56020.03)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Financeiro:</span>
                  <span className="font-semibold text-emerald-700 text-[11px] flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Sem vencidos
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Volume Total:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatTons(totalTons)}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-border/40">
                  <span className="font-bold text-slate-800">Valor Cotação:</span>
                  <span className="font-serif font-bold text-primary text-lg font-mono">
                    {formatBRL(totalQuotationValue)}
                  </span>
                </div>

                {/* Status de Estoque Resumido */}
                <div className="flex justify-between items-center pt-2 border-t border-border/40">
                  <span className="text-muted-foreground">Estoque:</span>
                  {itemsRequiringCheck.length > 0 ? (
                    <Badge className="bg-amber-100 text-amber-900 text-[10px] font-bold border-amber-300">
                      ⚠ {itemsRequiringCheck.length} item para checagem
                    </Badge>
                  ) : (
                    <Badge className="bg-emerald-100 text-emerald-900 text-[10px] font-bold border-none">
                      ✓ Estoque normal
                    </Badge>
                  )}
                </div>

                {/* Status de Preço Resumido */}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Preço:</span>
                  {itemsWithPriceException.length > 0 ? (
                    <Badge className="bg-amber-100 text-amber-900 text-[10px] font-bold border-amber-300">
                      ⚠ {itemsWithPriceException.length} exceção de preço
                    </Badge>
                  ) : (
                    <Badge className="bg-emerald-100 text-emerald-900 text-[10px] font-bold border-none">
                      ✓ {items.length} itens padrão
                    </Badge>
                  )}
                </div>

                {/* Alçada Resumida */}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Aprovação:</span>
                  {approvalEval.approvalStatus === 'PENDING' ? (
                    <Badge className="bg-purple-100 text-purple-900 text-[10px] font-bold border-purple-300">
                      ⏳ Requer {approvalEval.approvalLevel}
                    </Badge>
                  ) : (
                    <Badge className="bg-emerald-100 text-emerald-900 text-[10px] font-bold border-none">
                      ✓ Liberada
                    </Badge>
                  )}
                </div>

                {/* Prazo Estimado */}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Prazo Estimado:</span>
                  <span className="font-semibold text-blue-700 text-xs">04/09/2026</span>
                </div>
              </div>

              {/* Botões de Ação Contextuais */}
              <div className="space-y-2 pt-2 border-t border-border/40">
                <Button
                  onClick={() => handleSaveQuotation(false)}
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-semibold text-xs h-9 rounded-xl"
                >
                  <FileText className="w-3.5 h-3.5 mr-1" /> Salvar Cotação
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleSaveQuotation(true)}
                  disabled={isSubmitting}
                  className="w-full text-slate-700 border-border/60 hover:bg-slate-50 text-xs h-9 rounded-xl"
                >
                  <FileText className="w-3.5 h-3.5 mr-1 text-primary" /> Gerar PDF Oficial
                </Button>

                {approvalEval.approvalStatus === 'PENDING' && (
                  <Button
                    variant="outline"
                    onClick={() => setApprovalModalOpen(true)}
                    className="w-full text-purple-700 border-purple-300 bg-purple-50/50 hover:bg-purple-100 text-xs h-9 rounded-xl font-semibold"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 mr-1 text-purple-600" /> Solicitar aprovação
                  </Button>
                )}

                <Button
                  variant="ghost"
                  onClick={() => {
                    toast({
                      title: 'Pronto para envio',
                      description:
                        'Salve a cotação e visualize o PDF antes de encaminhar ao cliente.',
                    })
                  }}
                  className="w-full text-emerald-700 hover:bg-emerald-50 text-xs h-9 rounded-xl font-semibold"
                >
                  <Send className="w-3.5 h-3.5 mr-1" /> Enviar ao cliente
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* DRAWER 1: TÍTULOS FINANCEIROS */}
      <Sheet open={titulosDrawerOpen} onOpenChange={setTitulosDrawerOpen}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader className="pb-3 border-b border-border/40">
            <SheetTitle className="text-sm font-bold text-primary flex items-center gap-2">
              <Receipt className="w-4 h-4 text-blue-600" /> Posição Financeira de Títulos —{' '}
              {selectedCustomer?.nomeFantasia}
            </SheetTitle>
            <SheetDescription className="text-xs">
              Extrato analítico de duplicatas SAP ECC F.35 (A vencer, Vencidos e Pagos recentemente)
            </SheetDescription>
          </SheetHeader>

          <div className="py-4 space-y-4">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Situação Regular:</strong> Cliente não possui títulos vencidos no momento.
              </span>
            </div>

            <div className="overflow-x-auto border border-border/40 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b">
                  <tr>
                    <th className="p-2.5">Documento</th>
                    <th className="p-2.5">Vencimento</th>
                    <th className="p-2.5 text-right">Valor</th>
                    <th className="p-2.5 text-center">Status</th>
                    <th className="p-2.5 text-center">Dias</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono font-bold text-slate-800">DUP-08912</td>
                    <td className="p-2.5">31/08/2026</td>
                    <td className="p-2.5 text-right font-mono font-bold">{formatBRL(6572.17)}</td>
                    <td className="p-2.5 text-center">
                      <Badge className="bg-blue-100 text-blue-800 text-[10px]">A Vencer</Badge>
                    </td>
                    <td className="p-2.5 text-center font-mono">3d</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono font-bold text-slate-800">DUP-08913</td>
                    <td className="p-2.5">15/09/2026</td>
                    <td className="p-2.5 text-right font-mono font-bold">{formatBRL(43700.0)}</td>
                    <td className="p-2.5 text-center">
                      <Badge className="bg-blue-100 text-blue-800 text-[10px]">A Vencer</Badge>
                    </td>
                    <td className="p-2.5 text-center font-mono">18d</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono font-bold text-slate-800">DUP-08914</td>
                    <td className="p-2.5">30/09/2026</td>
                    <td className="p-2.5 text-right font-mono font-bold">{formatBRL(43707.8)}</td>
                    <td className="p-2.5 text-center">
                      <Badge className="bg-blue-100 text-blue-800 text-[10px]">A Vencer</Badge>
                    </td>
                    <td className="p-2.5 text-center font-mono">33d</td>
                  </tr>
                  <tr className="hover:bg-slate-50 bg-slate-50/50">
                    <td className="p-2.5 font-mono font-bold text-slate-500">DUP-08441</td>
                    <td className="p-2.5">17/08/2026</td>
                    <td className="p-2.5 text-right font-mono text-muted-foreground">
                      {formatBRL(6572.17)}
                    </td>
                    <td className="p-2.5 text-center">
                      <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">Pago</Badge>
                    </td>
                    <td className="p-2.5 text-center font-mono text-emerald-700">0d</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* DRAWER 2: HISTÓRICO DE COMPRAS */}
      <Sheet open={comprasDrawerOpen} onOpenChange={setComprasDrawerOpen}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader className="pb-3 border-b border-border/40">
            <SheetTitle className="text-sm font-bold text-primary flex items-center gap-2">
              <History className="w-4 h-4 text-purple-600" /> Histórico de Compras —{' '}
              {selectedCustomer?.nomeFantasia}
            </SheetTitle>
            <SheetDescription className="text-xs">
              Últimas aquisições faturadas no SAP ECC nos últimos 90 dias
            </SheetDescription>
          </SheetHeader>

          <div className="py-4 space-y-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-border/40 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800">NF-e 044190 · 15/08/2026</span>
                <span className="font-mono font-bold text-primary">{formatBRL(41179.53)}</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Cantoneira 2 x 1/4 - 6,00 M (7,000 t a R$ 5.882,79/t)
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-border/40 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800">NF-e 043812 · 28/07/2026</span>
                <span className="font-mono font-bold text-primary">{formatBRL(88241.85)}</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Cantoneira 2 x 1/4 - 6,00 M (15,000 t a R$ 5.882,79/t)
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* DRAWER 3: PEDIDOS EM ABERTO */}
      <Sheet open={pedidosDrawerOpen} onOpenChange={setPedidosDrawerOpen}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader className="pb-3 border-b border-border/40">
            <SheetTitle className="text-sm font-bold text-primary flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-emerald-600" /> Pedidos em Aberto —{' '}
              {selectedCustomer?.nomeFantasia}
            </SheetTitle>
            <SheetDescription className="text-xs">
              Ordens de Venda em carteira aguardando expedição no SAP SD
            </SheetDescription>
          </SheetHeader>

          <div className="py-4 space-y-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-border/40 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800 font-mono">
                  OV 10049280 · Entr. 30/08
                </span>
                <Badge className="bg-blue-100 text-blue-800 text-[10px]">Em Separação</Badge>
              </div>
              <p className="text-[11px] text-slate-600">
                Cantoneira 2 x 1/4 (12,000 t) · Valor: {formatBRL(70593.48)}
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* DRAWER 4: FORMAÇÃO DE PREÇO (PRICING BREAKDOWN) */}
      <Sheet
        open={!!pricingBreakdownItem}
        onOpenChange={(open) => !open && setPricingBreakdownItem(null)}
      >
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader className="pb-3 border-b border-border/40">
            <SheetTitle className="text-sm font-bold text-primary flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" /> Formação do Preço SAP
            </SheetTitle>
            <SheetDescription className="text-xs">
              {pricingBreakdownItem?.material_code} — {pricingBreakdownItem?.description}
            </SheetDescription>
          </SheetHeader>

          {pricingBreakdownItem && (
            <div className="py-4 space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-border/40 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Preço Base Tabela SAP:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatBRL(pricingBreakdownItem.sap_price)}/t
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Preço Proposto:</span>
                  <span className="font-mono font-bold text-primary">
                    {formatBRL(pricingBreakdownItem.proposed_price)}/t
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Desvio / Desconto:</span>
                  <PriceDeviationBadge deviationPct={pricingBreakdownItem.deviation_pct} />
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-bold text-slate-800">Impacto Total no Item:</span>
                  <span className="font-mono font-extrabold text-slate-900">
                    {formatBRL(
                      (pricingBreakdownItem.proposed_price - pricingBreakdownItem.sap_price) *
                        pricingBreakdownItem.quantity,
                    )}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-white border border-border/40 rounded-xl space-y-1.5 text-[11px] text-slate-600">
                <div className="flex justify-between">
                  <span>ICMS / PIS / COFINS (estimado):</span>
                  <strong className="font-mono">18,25%</strong>
                </div>
                <div className="flex justify-between">
                  <span>Origem da Regra:</span>
                  <strong>Esquema ZCIAFAL SAP SD</strong>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* DRAWER 5: SOLICITAR CHECAGEM DE ESTOQUE (WORKFLOW CONFIGURÁVEL) */}
      <Sheet open={stockCheckDrawerOpen} onOpenChange={setStockCheckDrawerOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader className="pb-3 border-b border-border/40">
            <SheetTitle className="text-sm font-bold text-primary flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" /> CHECAGEM DE DISPONIBILIDADE
            </SheetTitle>
            <SheetDescription className="text-xs">
              Solicitação direta de verificação física para o responsável configurado
            </SheetDescription>
          </SheetHeader>

          {stockCheckItemTarget && selectedCustomer && (
            <div className="py-4 space-y-4 text-xs">
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2 text-amber-950">
                <div className="flex justify-between">
                  <span>Cliente:</span>
                  <strong>
                    {selectedCustomer.nomeFantasia} ({selectedCustomer.sapCode})
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Material:</span>
                  <strong className="font-mono">{stockCheckItemTarget.material_code}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Qtd Solicitada:</span>
                  <strong className="font-mono">{formatTons(stockCheckItemTarget.quantity)}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Estoque Informado SAP:</span>
                  <strong className="font-mono">
                    {formatTons(stockCheckItemTarget.stock_available)}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Última Atualização:</span>
                  <span>{stockCheckItemTarget.stock_updated_at || '28/08/2026 10:30'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Data Desejada pelo Cliente:</span>
                  <strong>
                    {stockCheckItemTarget.requested_date?.split('-').reverse().join('/') ||
                      '04/09/2026'}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span>Próxima Produção Prevista:</span>
                  <strong>02/09/2026 (Linha L2)</strong>
                </div>
              </div>

              {/* Responsável Configurável */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Área / Responsável pelo Atendimento</Label>
                <Select value={stockCheckResponsible} onValueChange={setStockCheckResponsible}>
                  <SelectTrigger className="h-9 text-xs rounded-xl">
                    <SelectValue placeholder="Selecione o responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PCP / Pátio Betim">PCP / Pátio Betim (Matriz)</SelectItem>
                    <SelectItem value="Logística & Expedição">Logística & Expedição</SelectItem>
                    <SelectItem value="Gestor Comercial">Gestor Comercial</SelectItem>
                    <SelectItem value="PCP Tubos & Inox">PCP Tubos & Inox Contagem</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Observação do Vendedor</Label>
                <Textarea
                  placeholder="Ex: Cliente tem urgência para obra, aceita entrega parcial se houver lote liberado..."
                  value={stockCheckNotes}
                  onChange={(e) => setStockCheckNotes(e.target.value)}
                  rows={3}
                  className="text-xs rounded-xl"
                />
              </div>

              <SheetFooter className="pt-2">
                <Button
                  onClick={handleConfirmStockCheck}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs h-9 rounded-xl"
                >
                  Solicitar checagem
                </Button>
              </SheetFooter>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* MODAL QUOTE COPILOT (IA) */}
      <QuoteCopilotDialog
        open={copilotOpen}
        onOpenChange={setCopilotOpen}
        insight={copilotInsight}
        customerName={selectedCustomer?.razaoSocial || 'Cliente'}
        quoteCode={quoteCode}
        onApplyArgument={(arg) => {
          setCommercialNotes((prev) =>
            prev ? `${prev}\n\n[Recomendação Copilot]: ${arg}` : `[Recomendação Copilot]: ${arg}`,
          )
        }}
      />

      {/* MODAL DE PDF PREVIEW */}
      {createdQuotation && (
        <PDFPreviewDialog
          open={pdfPreviewOpen}
          onOpenChange={(open) => {
            setPdfPreviewOpen(open)
            if (!open) navigate('/crm/cotacoes')
          }}
          quotation={createdQuotation}
        />
      )}
    </div>
  )
}
