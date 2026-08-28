import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
  ExternalLink,
  ShieldCheck,
  Factory,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import {
  quotationService,
  PRELOADED_CUSTOMERS,
  CATALOG_MATERIALS,
  type PreloadedCustomer,
  type CatalogMaterial,
  STOCK_CONFIRMATION_THRESHOLD_TONS,
} from '@/services/quotation_service'
import { defaultSAPCreditProvider } from '@/providers/SAPCreditProvider'
import type { QuotationItem, Quotation } from '@/types/quotation'
import type { SAPCreditStatus } from '@/providers/SAPCreditProvider'
import { PDFPreviewDialog } from '@/components/cotacoes/PDFPreviewDialog'
import { StockConfirmationDialog } from '@/components/cotacoes/StockConfirmationDialog'
import { PriceDeviationBadge } from '@/components/cotacoes/PriceDeviationBadge'
import { StockBadge } from '@/components/cotacoes/StockBadge'

export default function NovaCotacao() {
  const navigate = useNavigate()
  const { toast } = useToast()

  // Etapa do Wizard
  const [currentStep, setCurrentStep] = useState<number>(1)

  // Seleção de Cliente
  const [customerSearch, setCustomerSearch] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<PreloadedCustomer | null>(null)
  const [selectedContact, setSelectedContact] = useState<{
    nome: string
    cargo: string
    telefone: string
    email: string
  } | null>(null)
  const [selectedShipTo, setSelectedShipTo] = useState<string>('')

  // Consulta de Crédito SAP ECC F.35
  const [creditStatus, setCreditStatus] = useState<SAPCreditStatus | null>(null)
  const [loadingCredit, setLoadingCredit] = useState(false)

  // Itens da Cotação
  const [items, setItems] = useState<QuotationItem[]>([])
  const [materialSearch, setMaterialSearch] = useState('')
  const [selectedMaterial, setSelectedMaterial] = useState<CatalogMaterial | null>(null)
  const [itemQtyTons, setItemQtyTons] = useState<string>('5.0')
  const [itemProposedPrice, setItemProposedPrice] = useState<string>('')
  const [itemDeliveryDate, setItemDeliveryDate] = useState<string>(
    new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  )

  // Condições Gerais
  const [paymentTerms, setPaymentTerms] = useState('28 DDL')
  const [freightType, setFreightType] = useState<'CIF' | 'FOB'>('CIF')
  const [freightValue, setFreightValue] = useState<number>(1500)
  const [validUntil, setValidUntil] = useState<string>(
    new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  )
  const [commercialNotes, setCommercialNotes] = useState('')

  // Modais
  const [stockConfirmItem, setStockConfirmItem] = useState<{
    item: QuotationItem
    material: CatalogMaterial
  } | null>(null)
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false)
  const [createdQuotation, setCreatedQuotation] = useState<Quotation | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Clientes filtrados
  const filteredCustomers = PRELOADED_CUSTOMERS.filter(
    (c) =>
      c.razaoSocial.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.nomeFantasia.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.sapCode.includes(customerSearch) ||
      c.cnpj.includes(customerSearch),
  )

  // Materiais filtrados
  const filteredMaterials = CATALOG_MATERIALS.filter(
    (m) =>
      m.code.toLowerCase().includes(materialSearch.toLowerCase()) ||
      m.description.toLowerCase().includes(materialSearch.toLowerCase()) ||
      m.family.toLowerCase().includes(materialSearch.toLowerCase()),
  )

  // Carregar crédito quando seleciona cliente
  const handleSelectCustomer = async (cust: PreloadedCustomer) => {
    setSelectedCustomer(cust)
    setSelectedContact(cust.contatos[0] || null)
    setSelectedShipTo(cust.shipToAddresses[0]?.code || '')
    setPaymentTerms(cust.condicoesPagamento[0] || '28 DDL')

    await fetchCreditData(cust.sapCode)
  }

  const fetchCreditData = async (sapCustomerCode: string) => {
    try {
      setLoadingCredit(true)
      const res = await defaultSAPCreditProvider.checkCustomerCredit(sapCustomerCode)
      setCreditStatus(res)
    } catch (err) {
      toast({
        title: 'Erro de conexão SAP',
        description: 'Crédito indisponível no momento.',
        variant: 'destructive',
      })
    } finally {
      setLoadingCredit(false)
    }
  }

  // Preencher preço sugerido quando seleciona material
  const handleSelectMaterial = (mat: CatalogMaterial) => {
    setSelectedMaterial(mat)
    setItemProposedPrice(mat.sapPrice.toString())
  }

  // Adicionar Item
  const handleAddItem = () => {
    if (!selectedMaterial) return
    const qty = parseFloat(itemQtyTons.replace(',', '.'))
    const proposed = parseFloat(itemProposedPrice.replace(',', '.'))

    if (isNaN(qty) || qty <= 0) {
      toast({
        title: 'Quantidade Inválida',
        description: 'Informe a quantidade em toneladas (ex: 5 t, 12,5 t)',
        variant: 'destructive',
      })
      return
    }

    if (isNaN(proposed) || proposed <= 0) {
      toast({
        title: 'Preço Inválido',
        description: 'Informe o preço proposto em R$/t',
        variant: 'destructive',
      })
      return
    }

    const sapPrice = selectedMaterial.sapPrice
    const deviationPct = ((proposed - sapPrice) / sapPrice) * 100
    const total = proposed * qty

    const isStockLow = selectedMaterial.availableStock < STOCK_CONFIRMATION_THRESHOLD_TONS
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
    }

    setItems([...items, newItem])
    setSelectedMaterial(null)
    setItemProposedPrice('')
    setItemQtyTons('5.0')
    setMaterialSearch('')

    if (isStockLow) {
      toast({
        title: 'Alerta de Saldo Sistêmico (< 5 t)',
        description:
          'Saldo abaixo de 5t. A cotação pode continuar normalmente, mas você pode solicitar confirmação ao pátio.',
        className: 'bg-amber-50 border-amber-200 text-amber-900',
      })
    }
  }

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((it) => it.id !== id))
  }

  // Totais
  const totalTons = items.reduce((acc, it) => acc + it.quantity, 0)
  const subtotalValue = items.reduce((acc, it) => acc + it.total, 0)
  const totalQuotationValue = subtotalValue + (freightType === 'CIF' ? freightValue : 0)

  // Alçada de Aprovação
  const approvalEval = quotationService.calculateApprovalStatus(items)

  // Finalizar e Salvar Cotação
  const handleSaveQuotation = async (goToPdf = false) => {
    if (!selectedCustomer) {
      toast({
        title: 'Selecione o Cliente',
        description: 'É necessário vincular um cliente SAP para emitir a proposta.',
        variant: 'destructive',
      })
      return
    }
    if (items.length === 0) {
      toast({
        title: 'Adicione Itens',
        description: 'Inclua ao menos um produto no escopo da cotação.',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsSubmitting(true)
      const quotePayload: Partial<Quotation> = {
        customer_id: selectedCustomer.id,
        customer_sap_code: selectedCustomer.sapCode,
        customer_name: selectedCustomer.razaoSocial,
        customer_cnpj: selectedCustomer.cnpj,
        customer_city: selectedCustomer.cidade,
        customer_uf: selectedCustomer.uf,
        customer_archetype: selectedCustomer.archetype,
        customer_abc: selectedCustomer.abcHistorico,
        contact_name: selectedContact?.nome || 'Contato Principal',
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
          approvalEval.approvalStatus === 'PENDING' ? 'AGUARDANDO_APROVACAO' : 'PRONTA_PARA_ENVIO',
        notes: commercialNotes,
      }

      const saved = await quotationService.saveQuotation(quotePayload)
      setCreatedQuotation(saved)

      toast({
        title: 'Cotação Criada com Sucesso!',
        description: `Proposta ${saved.code} registrada no CRM 360º.`,
      })

      if (goToPdf) {
        setPdfPreviewOpen(true)
      } else {
        navigate('/cotacoes')
      }
    } catch (err: any) {
      toast({
        title: 'Erro ao gerar cotação',
        description: err.message || 'Falha ao salvar proposta no sistema.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header com Navegação */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/cotacoes')}
            className="text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-700" /> NOVA COTAÇÃO COMERCIAL CIAFAL
            </h1>
            <p className="text-xs text-slate-500">
              Fluxo integrado: Cliente → Contato → Estoque Lotes → Produção Prevista → Crédito F.35
              → Alçada
            </p>
          </div>
        </div>

        {/* Wizard Steps */}
        <div className="hidden md:flex items-center gap-2 text-xs font-semibold">
          <span
            className={`px-3 py-1 rounded-full ${
              currentStep === 1
                ? 'bg-blue-700 text-white'
                : 'bg-slate-100 text-slate-600 cursor-pointer'
            }`}
            onClick={() => setCurrentStep(1)}
          >
            1. Cliente & Crédito
          </span>
          <span
            className={`px-3 py-1 rounded-full ${
              currentStep === 2
                ? 'bg-blue-700 text-white'
                : 'bg-slate-100 text-slate-600 cursor-pointer'
            }`}
            onClick={() => setCurrentStep(2)}
          >
            2. Itens & Estoque
          </span>
          <span
            className={`px-3 py-1 rounded-full ${
              currentStep === 3
                ? 'bg-blue-700 text-white'
                : 'bg-slate-100 text-slate-600 cursor-pointer'
            }`}
            onClick={() => setCurrentStep(3)}
          >
            3. Condições & Alçadas
          </span>
        </div>
      </div>

      {/* ETAPA 1: CLIENTE, CONTATO & CRÉDITO SAP ECC */}
      {currentStep === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Esquerda: Busca e Seleção do Cliente */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-slate-200 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" /> Seleção do Cliente (Base SAP
                    ECC)
                  </span>
                  {selectedCustomer && (
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
                      Cliente Selecionado
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Campo de Busca */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <Input
                    placeholder="Buscar por Razão Social, Fantasia, CNPJ ou Código SAP..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="pl-9 text-xs"
                  />
                </div>

                {/* Lista de Resultados */}
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {filteredCustomers.map((c) => {
                    const isSelected = selectedCustomer?.id === c.id
                    return (
                      <div
                        key={c.id}
                        onClick={() => handleSelectCustomer(c)}
                        className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-500'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">{c.razaoSocial}</span>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="outline" className="text-[10px] font-mono">
                              SAP: {c.sapCode}
                            </Badge>
                            <Badge
                              className={`text-[10px] ${
                                c.abcHistorico === 'A'
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-blue-600 text-white'
                              }`}
                            >
                              ABC {c.abcHistorico}
                            </Badge>
                          </div>
                        </div>
                        <div className="mt-1 text-slate-500 flex items-center gap-3 text-[11px]">
                          <span>Fantasia: {c.nomeFantasia}</span>
                          <span>CNPJ: {c.cnpj}</span>
                          <span>
                            {c.cidade}/{c.uf}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Detalhes do Cliente Selecionado */}
                {selectedCustomer && (
                  <div className="pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Contato Principal */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">
                        Contato Comercial
                      </Label>
                      <Select
                        value={selectedContact?.nome}
                        onValueChange={(val) => {
                          const found = selectedCustomer.contatos.find((ct) => ct.nome === val)
                          if (found) setSelectedContact(found)
                        }}
                      >
                        <SelectTrigger className="text-xs">
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
                        <div className="p-2 bg-slate-50 rounded text-[11px] text-slate-600 space-y-0.5">
                          <div>
                            <strong>E-mail:</strong> {selectedContact.email}
                          </div>
                          <div>
                            <strong>WhatsApp:</strong> {selectedContact.telefone}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Local de Entrega (Ship-To) */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700">
                        Recebedor de Mercadoria (Ship-To)
                      </Label>
                      <Select value={selectedShipTo} onValueChange={setSelectedShipTo}>
                        <SelectTrigger className="text-xs">
                          <SelectValue placeholder="Selecione o endereço de entrega" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedCustomer.shipToAddresses.map((st) => (
                            <SelectItem key={st.code} value={st.code}>
                              {st.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="p-2 bg-slate-50 rounded text-[11px] text-slate-600">
                        {selectedCustomer.shipToAddresses.find((s) => s.code === selectedShipTo)
                          ?.address || 'Selecione o endereço'}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Coluna Direita: Cartão de Crédito Oficial SAP ECC F.35 */}
          <div className="space-y-4">
            <Card className="border-slate-200 shadow-xs bg-linear-to-b from-white to-slate-50/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    CRÉDITO SAP ECC (F.35 OFICIAL)
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => selectedCustomer && fetchCreditData(selectedCustomer.sapCode)}
                    disabled={!selectedCustomer || loadingCredit}
                    className="h-7 text-xs text-blue-700"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 mr-1 ${loadingCredit ? 'animate-spin' : ''}`}
                    />
                    Atualizar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {!selectedCustomer ? (
                  <div className="text-center py-6 text-xs text-slate-400">
                    Selecione um cliente para carregar a posição financeira oficial SAP.
                  </div>
                ) : loadingCredit ? (
                  <div className="text-center py-6 text-xs text-slate-500 animate-pulse">
                    Consultando BAPI_CREDIT_MANAGEMENT no SAP ECC...
                  </div>
                ) : creditStatus ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-200">
                      <span className="text-xs font-semibold text-emerald-900">
                        Status do Crédito
                      </span>
                      <Badge
                        className={`text-[10px] ${
                          creditStatus.creditCheckResult === 'LIBERADO'
                            ? 'bg-emerald-600 text-white'
                            : creditStatus.creditCheckResult === 'ATENCAO'
                              ? 'bg-amber-600 text-white'
                              : 'bg-rose-600 text-white'
                        }`}
                      >
                        {creditStatus.creditCheckResult}
                      </Badge>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Limite Total Aprovado:</span>
                        <span className="font-bold text-slate-900">
                          R$ {creditStatus.creditLimit.toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Crédito Utilizado:</span>
                        <span className="font-semibold text-slate-700">
                          R$ {creditStatus.creditUsed.toLocaleString('pt-BR')} (
                          {creditStatus.usedPercentage}%)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Saldo Disponível:</span>
                        <span className="font-extrabold text-emerald-700">
                          R$ {creditStatus.creditAvailable.toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Títulos em Aberto:</span>
                        <span className="font-medium text-slate-700">
                          R$ {creditStatus.openOrdersValue.toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Títulos Vencidos:</span>
                        <span
                          className={`font-semibold ${
                            creditStatus.overdueInvoicesValue > 0
                              ? 'text-rose-600'
                              : 'text-emerald-700'
                          }`}
                        >
                          R$ {creditStatus.overdueInvoicesValue.toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Maior Atraso Histórico:</span>
                        <span className="font-medium text-slate-700">
                          {creditStatus.longestDelayDays} dias
                        </span>
                      </div>
                    </div>

                    <div className="p-2 bg-slate-100 rounded text-[10px] text-slate-500 flex items-center justify-between">
                      <span>Fonte: {creditStatus.dataSource}</span>
                      <span>{creditStatus.lastUpdated.split('T')[0]}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-rose-600">
                    Crédito indisponível no momento.
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                onClick={() => setCurrentStep(2)}
                disabled={!selectedCustomer}
                className="bg-blue-700 hover:bg-blue-800 text-white font-semibold w-full"
              >
                Avançar para Itens & Estoque →
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ETAPA 2: ITENS, ESTOQUE DE LOTES & PRODUÇÃO PREVISTA */}
      {currentStep === 2 && (
        <div className="space-y-6">
          {/* Card de Inclusão de Produto */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" /> Catálogo de Produtos & Posição de
                Estoque SAP ECC
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Busca de Materiais */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <Input
                  placeholder="Buscar material por código SAP, descrição, dimensão ou família..."
                  value={materialSearch}
                  onChange={(e) => setMaterialSearch(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>

              {/* Lista Selecionável de Materiais */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-1">
                {filteredMaterials.map((mat) => {
                  const isSelected = selectedMaterial?.code === mat.code
                  const isLow = mat.availableStock < STOCK_CONFIRMATION_THRESHOLD_TONS
                  return (
                    <div
                      key={mat.code}
                      onClick={() => handleSelectMaterial(mat)}
                      className={`p-3 rounded-lg border text-xs cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-500'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 font-mono">{mat.code}</span>
                          <Badge
                            className={`text-[9px] ${
                              mat.availableStock === 0
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : isLow
                                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                                  : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            }`}
                          >
                            {mat.availableStock} t disp.
                          </Badge>
                        </div>
                        <span className="font-semibold text-slate-800 line-clamp-1 mt-1 block">
                          {mat.description}
                        </span>
                        <span className="text-[10px] text-slate-500 block">{mat.dimension}</span>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Tabela SAP:</span>
                        <span className="font-bold text-slate-800">
                          R$ {mat.sapPrice.toLocaleString('pt-BR')}/t
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Painel do Item Selecionado: Detalhes dos Lotes, Produção Prevista e Formulário de Adição */}
              {selectedMaterial && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-sm text-slate-900 font-mono">
                        {selectedMaterial.code}
                      </span>
                      <p className="text-xs text-slate-600 font-medium">
                        {selectedMaterial.description} • {selectedMaterial.dimension}
                      </p>
                    </div>

                    {/* Alerta de confirmação se < 5t */}
                    {selectedMaterial.availableStock < STOCK_CONFIRMATION_THRESHOLD_TONS && (
                      <Badge className="bg-amber-500 text-white text-xs gap-1 py-1 px-2.5">
                        <AlertTriangle className="w-3.5 h-3.5" /> Saldo &lt; 5 t — Confirmação
                        disponível
                      </Badge>
                    )}
                  </div>

                  {/* Informações Avançadas de Estoque (Lotes, Moda, Média) + Produção Prevista */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Bloco de Estoque */}
                    <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-blue-600" />
                        Estrutura de Lotes & Pátio
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                        <div>
                          Saldo: <strong>{selectedMaterial.availableStock} t</strong>
                        </div>
                        <div>
                          Nº de Lotes: <strong>{selectedMaterial.stockDetails.batchCount}</strong>
                        </div>
                        <div>
                          Peso Médio:{' '}
                          <strong>{selectedMaterial.stockDetails.averageBatchWeightTons} t</strong>
                        </div>
                        <div>
                          Peso Moda:{' '}
                          <strong>{selectedMaterial.stockDetails.modeBatchWeightTons} t</strong>
                        </div>
                        <div className="col-span-2">
                          Centro/Depósito:{' '}
                          <strong>
                            {selectedMaterial.plant} / {selectedMaterial.storageLocation}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Bloco de Produção Prevista (Planejamento Oficial SAP) */}
                    <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Factory className="w-3.5 h-3.5 text-purple-600" />
                        Programação de Produção (SAP PP)
                      </span>
                      {selectedMaterial.plannedProduction.hasPlannedProduction ? (
                        <div className="space-y-1 text-[11px] text-slate-600">
                          <div className="flex justify-between">
                            <span>Data Prevista:</span>
                            <strong className="text-purple-700">
                              {selectedMaterial.plannedProduction.plannedDate
                                ?.split('-')
                                .reverse()
                                .join('/')}
                            </strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Qtd Programada:</span>
                            <strong>
                              {selectedMaterial.plannedProduction.plannedQuantityTons} t
                            </strong>
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Linha: {selectedMaterial.plannedProduction.productionLineCenter}
                          </div>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-500 italic py-2">
                          Sem produção programada identificada no SAP ECC.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Inputs de Quantidade e Preço Proposto */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Quantidade (t) *</Label>
                      <Input
                        placeholder="Ex: 5.0"
                        value={itemQtyTons}
                        onChange={(e) => setItemQtyTons(e.target.value)}
                        className="text-xs font-mono font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Preço Base SAP (R$/t)</Label>
                      <Input
                        disabled
                        value={`R$ ${selectedMaterial.sapPrice.toLocaleString('pt-BR')}`}
                        className="text-xs bg-slate-100 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Preço Proposto (R$/t) *</Label>
                      <Input
                        placeholder="Ex: 34000"
                        value={itemProposedPrice}
                        onChange={(e) => setItemProposedPrice(e.target.value)}
                        className="text-xs font-mono font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Previsão de Entrega</Label>
                      <Input
                        type="date"
                        value={itemDeliveryDate}
                        onChange={(e) => setItemDeliveryDate(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedMaterial(null)}>
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAddItem}
                      className="bg-blue-700 hover:bg-blue-800 text-white font-semibold"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Adicionar Item à Proposta
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabela de Itens Adicionados */}
          <Card className="border-slate-200 shadow-xs">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-800">
                Itens da Cotação ({items.length})
              </CardTitle>
              <div className="text-xs font-semibold text-slate-700 flex items-center gap-4">
                <span>
                  Volume Total: <strong>{totalTons.toLocaleString('pt-BR')} t</strong>
                </span>
                <span>
                  Subtotal: <strong>R$ {subtotalValue.toLocaleString('pt-BR')}</strong>
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  Nenhum item adicionado à proposta. Selecione os produtos acima.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Item</th>
                        <th className="p-2.5">Material</th>
                        <th className="p-2.5 text-right">Qtd (t)</th>
                        <th className="p-2.5 text-right">Preço SAP</th>
                        <th className="p-2.5 text-right">Preço Proposto</th>
                        <th className="p-2.5 text-center">Desvio %</th>
                        <th className="p-2.5 text-right">Total Item</th>
                        <th className="p-2.5 text-center">Estoque</th>
                        <th className="p-2.5 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((it, idx) => (
                        <tr key={it.id} className="hover:bg-slate-50/60">
                          <td className="p-2.5 font-mono text-slate-500">#{it.item_sequence}</td>
                          <td className="p-2.5">
                            <span className="font-bold text-slate-900 block font-mono">
                              {it.material_code}
                            </span>
                            <span className="text-[11px] text-slate-500 line-clamp-1">
                              {it.description}
                            </span>
                          </td>
                          <td className="p-2.5 text-right font-bold text-slate-900 font-mono">
                            {it.quantity.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} t
                          </td>
                          <td className="p-2.5 text-right text-slate-500 font-mono">
                            R$ {it.sap_price.toLocaleString('pt-BR')}
                          </td>
                          <td className="p-2.5 text-right font-bold text-slate-900 font-mono">
                            R$ {it.proposed_price.toLocaleString('pt-BR')}
                          </td>
                          <td className="p-2.5 text-center">
                            <PriceDeviationBadge deviationPct={it.deviation_pct} />
                          </td>
                          <td className="p-2.5 text-right font-extrabold text-slate-900 font-mono">
                            R$ {it.total.toLocaleString('pt-BR')}
                          </td>
                          <td className="p-2.5 text-center">
                            <StockBadge situation={it.stock_situation} />
                            {it.stock_confirmation_required && (
                              <button
                                onClick={() => {
                                  const mat = CATALOG_MATERIALS.find(
                                    (m) => m.code === it.material_code,
                                  )
                                  if (mat) setStockConfirmItem({ item: it, material: mat })
                                }}
                                className="text-[10px] text-amber-700 hover:underline block mx-auto mt-0.5 font-semibold"
                              >
                                Solicitar Confirmação
                              </button>
                            )}
                          </td>
                          <td className="p-2.5 text-center">
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => handleRemoveItem(it.id)}
                              className="text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              ← Voltar para Cliente
            </Button>
            <Button
              onClick={() => setCurrentStep(3)}
              disabled={items.length === 0}
              className="bg-blue-700 hover:bg-blue-800 text-white font-semibold"
            >
              Avançar para Condições & Alçada →
            </Button>
          </div>
        </div>
      )}

      {/* ETAPA 3: CONDIÇÕES COMERCIAIS & MATRIZ DE ALÇADA */}
      {currentStep === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Condições de Pagamento e Frete */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-slate-200 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-blue-600" /> Condições Comerciais da Proposta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Condição de Pagamento */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Condição de Pagamento *</Label>
                    <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                      <SelectTrigger className="text-xs">
                        <SelectValue placeholder="Selecione o prazo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="28 DDL">28 DDL (Boleto Bancário)</SelectItem>
                        <SelectItem value="28/42/56 DDL (Boleto)">
                          28/42/56 DDL (Boleto Bancário)
                        </SelectItem>
                        <SelectItem value="30/60 DDL">30/60 DDL (Boleto Bancário)</SelectItem>
                        <SelectItem value="45 DDL">45 DDL (Boleto Bancário)</SelectItem>
                        <SelectItem value="À Vista (TED/PIX)">À Vista (TED/PIX)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Validade da Proposta */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Validade da Proposta *</Label>
                    <Input
                      type="date"
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  {/* Modalidade de Frete */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Tipo de Frete (Incoterm) *</Label>
                    <Select
                      value={freightType}
                      onValueChange={(v) => setFreightType(v as 'CIF' | 'FOB')}
                    >
                      <SelectTrigger className="text-xs">
                        <SelectValue placeholder="Selecione o frete" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CIF">CIF (Por conta da CIAFAL)</SelectItem>
                        <SelectItem value="FOB">FOB (Por conta do Cliente / Retira)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Valor do Frete */}
                  {freightType === 'CIF' && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Valor do Frete (R$) *</Label>
                      <Input
                        type="number"
                        value={freightValue}
                        onChange={(e) => setFreightValue(parseFloat(e.target.value) || 0)}
                        className="text-xs font-mono"
                      />
                    </div>
                  )}
                </div>

                {/* Observações da Cotação */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Observações Comerciais</Label>
                  <Textarea
                    placeholder="Informações sobre descarregamento, laudo de qualidade, especificações técnicas..."
                    value={commercialNotes}
                    onChange={(e) => setCommercialNotes(e.target.value)}
                    rows={3}
                    className="text-xs"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna Direita: Resumo Financeiro & Avaliação de Alçada */}
          <div className="space-y-4">
            <Card className="border-slate-200 shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  AVALIAÇÃO DE ALÇADA COMERCIAL
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div
                  className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                    approvalEval.approvalStatus === 'NOT_REQUIRED'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      : 'bg-amber-50 border-amber-200 text-amber-950'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">Status da Alçada:</span>
                    <Badge
                      className={
                        approvalEval.approvalStatus === 'NOT_REQUIRED'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-600 text-white'
                      }
                    >
                      {approvalEval.approvalStatus === 'NOT_REQUIRED'
                        ? 'Dentro da Alçada'
                        : `Requer ${approvalEval.approvalLevel}`}
                    </Badge>
                  </div>
                  {approvalEval.ruleTriggered && (
                    <p className="text-[11px] leading-relaxed text-amber-800">
                      {approvalEval.ruleTriggered}
                    </p>
                  )}
                </div>

                {/* Resumo dos Valores */}
                <div className="space-y-2 text-xs pt-2 border-t border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Volume Total:</span>
                    <span className="font-bold text-slate-900">
                      {totalTons.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} t
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subtotal Produtos:</span>
                    <span className="font-bold text-slate-900 font-mono">
                      R$ {subtotalValue.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Frete ({freightType}):</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {freightType === 'CIF'
                        ? `R$ ${freightValue.toLocaleString('pt-BR')}`
                        : 'FOB (R$ 0)'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold pt-2 border-t border-slate-200">
                    <span className="text-blue-900">Total da Cotação:</span>
                    <span className="text-blue-900 font-mono">
                      R$ {totalQuotationValue.toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2 pt-0">
                <Button
                  onClick={() => handleSaveQuotation(true)}
                  disabled={isSubmitting}
                  className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold"
                >
                  <FileText className="w-4 h-4 mr-1.5" />
                  {isSubmitting ? 'Gerando...' : 'Gerar Cotação & Visualizar PDF'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleSaveQuotation(false)}
                  disabled={isSubmitting}
                  className="w-full text-xs"
                >
                  Salvar Rascunho e Voltar
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}

      {/* Modal de Solicitação de Confirmação de Estoque WMS/PCP */}
      {stockConfirmItem && (
        <StockConfirmationDialog
          open={!!stockConfirmItem}
          onOpenChange={(open) => !open && setStockConfirmItem(null)}
          quotationId={createdQuotation?.id || 'NOVA_COTACAO'}
          quotationCode={createdQuotation?.code || 'COT-NOVA'}
          quotationItemId={stockConfirmItem.item.id}
          materialCode={stockConfirmItem.item.material_code}
          materialDescription={stockConfirmItem.item.description}
          requestedQty={stockConfirmItem.item.quantity}
          unit="t"
          stockSnapshotQty={stockConfirmItem.item.stock_available}
          onSuccess={() => {
            toast({
              title: 'Solicitação Enviada ao Pátio',
              description: 'Confirmação física enviada com SLA de 48h. A cotação pode prosseguir.',
            })
            setStockConfirmItem(null)
          }}
        />
      )}

      {/* Modal de PDF Preview */}
      {createdQuotation && (
        <PDFPreviewDialog
          open={pdfPreviewOpen}
          onOpenChange={(open) => {
            setPdfPreviewOpen(open)
            if (!open) navigate('/cotacoes')
          }}
          quotation={createdQuotation}
        />
      )}
    </div>
  )
}
