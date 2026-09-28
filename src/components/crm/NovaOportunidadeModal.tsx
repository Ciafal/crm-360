import React, { useState, useMemo, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  Building2,
  CheckCircle2,
  Sparkles,
  Layers,
  Calendar,
  DollarSign,
  Scale,
  X,
  TrendingUp,
  FileText,
  User,
  ShieldCheck,
  CreditCard,
  History,
  AlertCircle,
  HelpCircle,
} from 'lucide-react'
import { ClienteCarteira, mockClientes } from '@/data/mockCommercialData'
import {
  opportunityLeadService,
  GRUPOS_MERCADORIA_OPCOES,
  PREVISOES_COMPRA_OPCOES,
  PROBABILIDADE_OPCOES,
  ORIGENS_OPORTUNIDADE,
  PrevisaoCompraTipo,
  ProbabilidadeNivel,
  OrigemOportunidade,
  NovaOportunidadePayload,
  AdvancedOpportunity,
  formatBRL as formatBRLService,
} from '@/services/opportunity_lead_service'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface NovaOportunidadeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (newOpportunity: AdvancedOpportunity) => void
  onNavigateDetail?: (opp: AdvancedOpportunity) => void
  initialCliente?: ClienteCarteira | null
  usuarioAtualNome?: string
}

export function NovaOportunidadeModal({
  open,
  onOpenChange,
  onSuccess,
  onNavigateDetail,
  initialCliente,
  usuarioAtualNome = 'Carlos Mendonça',
}: NovaOportunidadeModalProps) {
  const navigate = useNavigate()

  // Estado do Cliente Selecionado
  const [selectedCliente, setSelectedCliente] = useState<ClienteCarteira | null>(null)
  const [searchClienteTerm, setSearchClienteTerm] = useState('')
  const [isSearchingCliente, setIsSearchingCliente] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Campos do Formulário
  const [grupoMercadoria, setGrupoMercadoria] = useState<string>('Não definido / A identificar')
  const [quantidadeEstimada, setQuantidadeEstimada] = useState<string>('')
  const [precoEstimado, setPrecoEstimado] = useState<string>('')
  const [previsaoCompra, setPrevisaoCompra] = useState<PrevisaoCompraTipo>('sem_previsao')
  const [probabilidade, setProbabilidade] = useState<ProbabilidadeNivel>('baixa')
  const [origem, setOrigem] = useState<OrigemOportunidade>('contato_vendedor')
  const [observacoes, setObservacoes] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Tela de confirmação / sucesso após persistência
  const [createdOpportunity, setCreatedOpportunity] = useState<AdvancedOpportunity | null>(null)

  // Inicialização quando o modal abre ou cliente inicial é passado
  useEffect(() => {
    if (open) {
      if (initialCliente) {
        setSelectedCliente(initialCliente)
        setSearchClienteTerm('')
      } else {
        setSelectedCliente(null)
        setSearchClienteTerm('')
      }
      setGrupoMercadoria('Não definido / A identificar')
      setQuantidadeEstimada('')
      setPrecoEstimado('')
      setPrevisaoCompra('sem_previsao')
      setProbabilidade('baixa')
      setOrigem('contato_vendedor')
      setObservacoes('')
      setIsSaving(false)
      setSaveError(null)
      setCreatedOpportunity(null)
    }
  }, [open, initialCliente])

  // Filtragem Mestre de Clientes por Código SAP, Razão Social, Nome Fantasia ou CNPJ
  const filteredClientes = useMemo(() => {
    if (!searchClienteTerm.trim()) return mockClientes.slice(0, 10)
    const term = searchClienteTerm.toLowerCase().replace(/[^a-z0-9]/g, '')
    const rawTerm = searchClienteTerm.toLowerCase().trim()

    return mockClientes
      .filter((c) => {
        const cleanCnpj = (c.cnpj || '').replace(/[^a-z0-9]/g, '').toLowerCase()
        const matchCnpj = cleanCnpj.includes(term)
        const matchSap = c.sapCode.toLowerCase().includes(rawTerm)
        const matchRazao = c.razaoSocial.toLowerCase().includes(rawTerm)
        const matchFantasia = c.nomeFantasia.toLowerCase().includes(rawTerm)
        const matchCidade = `${c.cidade} ${c.uf}`.toLowerCase().includes(rawTerm)

        return matchCnpj || matchSap || matchRazao || matchFantasia || matchCidade
      })
      .slice(0, 15)
  }, [searchClienteTerm])

  // Cálculo Automático do Valor Potencial: Quantidade × Preço (somente se ambos válidos e > 0)
  const valorPotencialCalculado = useMemo(() => {
    const qty = parseFloat(quantidadeEstimada.replace(',', '.'))
    const price = parseFloat(precoEstimado.replace(',', '.'))

    if (!isNaN(qty) && !isNaN(price) && qty > 0 && price > 0) {
      return qty * price
    }
    return null
  }, [quantidadeEstimada, precoEstimado])

  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  // Validação do Botão "Salvar Oportunidade"
  // Regra 1 e 10: O botão fica HABILITADO assim que existir um CLIENTE válido.
  const isFormValid = Boolean(selectedCliente && selectedCliente.id)

  const handleSelectCliente = (cliente: ClienteCarteira) => {
    setSelectedCliente(cliente)
    setSearchClienteTerm('')
    setIsSearchingCliente(false)
  }

  const handleClearCliente = () => {
    setSelectedCliente(null)
    setSearchClienteTerm('')
  }

  const handleSave = async () => {
    if (!selectedCliente) {
      const msg = 'Selecione um cliente para criar a oportunidade.'
      setSaveError(msg)
      toast.error(msg)
      return
    }

    setIsSaving(true)
    setSaveError(null)

    try {
      const qtyNum = parseFloat(quantidadeEstimada.replace(',', '.'))
      const priceNum = parseFloat(precoEstimado.replace(',', '.'))

      const payload: NovaOportunidadePayload = {
        clienteId: selectedCliente.id,
        clienteNome: selectedCliente.razaoSocial,
        clienteSap: selectedCliente.sapCode,
        clienteCnpj: selectedCliente.cnpj,
        clienteCidade: selectedCliente.cidade,
        clienteUf: selectedCliente.uf,
        clienteSegmento: selectedCliente.segmento,
        vendedorId: selectedCliente.vendedorId || 'qas-vendedor_teste',
        vendedorNome: selectedCliente.vendedor || usuarioAtualNome,

        grupoMercadoria: grupoMercadoria,
        quantidadeEstimadaTons: !isNaN(qtyNum) && qtyNum > 0 ? qtyNum : null,
        precoEstimadoPorTon: !isNaN(priceNum) && priceNum > 0 ? priceNum : null,
        previsaoCompra: previsaoCompra,
        probabilidadeClassificacao: probabilidade,
        origemOportunidade: origem,
        observacoes: observacoes.trim(),
        usuarioAtual: usuarioAtualNome,
      }

      // 1. Salvar e persistir no storage via opportunityLeadService
      const created = opportunityLeadService.createOpportunity(payload)
      if (!created || !created.id) {
        throw new Error('Não foi possível salvar a oportunidade.')
      }

      // 2. RECONSULTAR o registro gravado para confirmar persistência e reatividade
      const verified =
        opportunityLeadService.getOpportunityById(created.id) ||
        opportunityLeadService.getOpportunityById(created.numeroSequencial || '') ||
        opportunityLeadService.getStoredOpportunities().find((o) => o.id === created.id)

      if (!verified) {
        throw new Error('Falha ao verificar persistência da oportunidade gravada.')
      }

      // 3. Disparar evento para atualização reativa em todas as telas sem F5
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('crm360:opportunityCreated', {
            detail: verified,
          }),
        )
      }

      // 4. Só então exibir sucesso e abrir tela de confirmação
      toast.success(
        `Oportunidade ${verified.numeroSequencial || verified.id} criada com sucesso no estágio 1. Especulação!`,
        {
          description: `Cliente: ${selectedCliente.nomeFantasia || selectedCliente.razaoSocial}`,
        },
      )

      setCreatedOpportunity(verified)
      onSuccess?.(verified)
    } catch (err: any) {
      console.error('Falha técnica na persistência da oportunidade:', err)
      setSaveError('Não foi possível salvar a oportunidade.')
      toast.error('Não foi possível salvar a oportunidade.')
      // Mantém o formulário aberto com os dados preenchidos para correção
    } finally {
      setIsSaving(false)
    }
  }

  // Ações da tela de confirmação pós-criação
  const handleAbrirOportunidade = () => {
    if (!createdOpportunity) return
    onOpenChange(false)
    if (onNavigateDetail) {
      onNavigateDetail(createdOpportunity)
    } else {
      navigate('/crm?tab=oportunidades')
    }
  }

  const handleGerarCotacaoConfirm = () => {
    if (!createdOpportunity) return
    onOpenChange(false)
    navigate('/crm/cotacoes/nova', {
      state: {
        clienteId: createdOpportunity.clienteId,
        codigoSap: createdOpportunity.clienteSap,
        razaoSocial: createdOpportunity.clienteNome,
        vendedorNome: createdOpportunity.vendedorNome,
        grupoMercadoriaSugerido: createdOpportunity.grupoMercadoria,
        quantidadeEstimadaSugerida: createdOpportunity.quantidadeEstimadaTons,
        precoEstimadoReferencia: createdOpportunity.precoEstimadoPorTon,
        observacoesOrigem: `Oportunidade vinculada: ${createdOpportunity.numeroSequencial || createdOpportunity.id} — Grupo: ${createdOpportunity.grupoMercadoria || 'Geral'}.`,
        origem: 'oportunidade_funil',
        opportunity_id: createdOpportunity.numeroSequencial || createdOpportunity.id,
        opportunity_number: createdOpportunity.numeroSequencial,
      },
    })
  }

  const handleCriarTarefa = () => {
    onOpenChange(false)
    navigate('/tarefas', {
      state: {
        clienteId: createdOpportunity?.clienteId,
        clienteNome: createdOpportunity?.clienteNome,
        titulo: `Follow-up ${createdOpportunity?.numeroSequencial || 'Oportunidade'}: ${createdOpportunity?.clienteNome}`,
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="nova-oportunidade-dialog-content"
        className="w-[90vw] max-w-[90vw] sm:max-w-[90vw] md:max-w-4xl max-h-[90vh] h-auto flex flex-col rounded-3xl bg-white p-0 overflow-hidden shadow-2xl border-slate-200 my-auto"
        style={{ maxHeight: '90vh' }}
      >
        {/* Topo / Header CIAFAL - FIXO (flex-shrink: 0) */}
        <div className="bg-gradient-to-r from-[#003A70] to-sky-900 text-white p-4 sm:p-5 shrink-0 flex-shrink-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-2.5 bg-white/10 rounded-2xl backdrop-blur-sm shrink-0">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-sky-300" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <DialogTitle className="font-serif text-lg sm:text-xl font-bold text-white tracking-tight">
                    {createdOpportunity
                      ? '✓ Oportunidade Criada com Sucesso!'
                      : '+ Nova Oportunidade Comercial'}
                  </DialogTitle>
                  <Badge className="bg-amber-400 text-slate-950 font-bold text-[10px] border-none uppercase tracking-wide shrink-0">
                    1. Especulação
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-sky-100 font-sans mt-0.5">
                  {createdOpportunity
                    ? 'Registro persistido e sincronizado no funil com número sequencial único.'
                    : 'Registro rápido de oportunidade comercial. Apenas o Cliente é obrigatório.'}
                </DialogDescription>
              </div>
            </div>
            <div className="hidden sm:flex flex-col items-end text-right text-[11px] text-sky-200 shrink-0">
              <span>
                Tipo: <strong>ESPECULAÇÃO COMERCIAL</strong>
              </span>
              <span>CIAFAL Ferro & Aço</span>
            </div>
          </div>
        </div>

        {/* TELA DE CONFIRMAÇÃO SE PERSISTIDO COM SUCESSO */}
        {createdOpportunity ? (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-6 animate-in fade-in-50">
              <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                <div>
                  <h3 className="font-bold text-emerald-950 text-sm">
                    ✓ Oportunidade criada com sucesso!
                  </h3>
                  <p className="text-xs text-emerald-800">
                    O registro foi persistido no CRM 360º e inserido no estágio{' '}
                    <strong>1. Especulação</strong> do Funil Comercial.
                  </p>
                </div>
              </div>

              {/* Quadro de Resumo da Oportunidade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground block font-semibold">
                    Número Sequencial:
                  </span>
                  <span className="font-mono text-base font-bold text-[#003A70] bg-white px-2.5 py-1 rounded-lg border border-slate-200 inline-block">
                    {createdOpportunity.numeroSequencial || createdOpportunity.id}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground block font-semibold">
                    Cliente:
                  </span>
                  <strong className="text-sm text-slate-900 block font-serif">
                    {createdOpportunity.clienteNome}
                  </strong>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    SAP {createdOpportunity.clienteSap}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground block font-semibold">
                    Estágio Inicial:
                  </span>
                  <Badge className="bg-slate-200 text-slate-800 font-bold border-none text-xs">
                    1. Especulação
                  </Badge>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground block font-semibold">
                    Valor Potencial:
                  </span>
                  <span className="font-serif font-bold text-emerald-700 text-sm block">
                    {createdOpportunity.valorPotencialCalculado !== null &&
                    createdOpportunity.valorPotencialCalculado !== undefined &&
                    createdOpportunity.valorPotencialCalculado > 0
                      ? formatBRLService(createdOpportunity.valorPotencialCalculado)
                      : 'Não estimado'}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground block font-semibold">
                    Responsável:
                  </span>
                  <span className="text-slate-800 font-medium">
                    {createdOpportunity.vendedorNome || usuarioAtualNome}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground block font-semibold">
                    Grupo / Família:
                  </span>
                  <span className="text-slate-800 font-medium">
                    {createdOpportunity.grupoMercadoria || 'Não definido'}
                  </span>
                </div>
              </div>
            </div>

            {/* Ações da Confirmação - FOOTER FIXO */}
            <div className="shrink-0 flex-shrink-0 sticky bottom-0 z-20 p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-end gap-2.5 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-9 rounded-xl text-xs"
              >
                Voltar
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCriarTarefa}
                className="h-9 rounded-xl text-xs gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                Criar Tarefa
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGerarCotacaoConfirm}
                className="h-9 rounded-xl text-xs gap-1.5 border-amber-300 bg-amber-50/50 hover:bg-amber-100/60 text-amber-900 font-semibold"
              >
                <FileText className="w-3.5 h-3.5 text-amber-600" />
                Gerar Cotação
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleAbrirOportunidade}
                className="h-9 rounded-xl text-xs gap-1.5 bg-[#003A70] hover:bg-[#002d57] text-white font-semibold shadow-xs"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Abrir Oportunidade
              </Button>
            </div>
          </div>
        ) : (
          /* FORMULÁRIO DE CRIAÇÃO: CORPO CENTRAL COM SCROLL INTERNO + FOOTER FIXO STICKY */
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div
              data-testid="nova-oportunidade-scroll-body"
              className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-5 space-y-5"
            >
              {/* Alerta de Erro caso salvamento falhe */}
              {saveError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{saveError}</span>
                </div>
              )}
              {/* SEÇÃO 1: CLIENTE (OBRIGATÓRIO *) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-[#003A70]" />
                    <span>CLIENTE *</span>
                    <span className="text-rose-600 font-bold">*</span>
                    <span className="text-[11px] font-normal text-muted-foreground">
                      (Pesquise por Código SAP, Razão Social, Nome Fantasia ou CNPJ)
                    </span>
                  </Label>
                  {selectedCliente && (
                    <Badge
                      variant="outline"
                      className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px] font-bold gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Cliente Selecionado
                    </Badge>
                  )}
                </div>

                {!selectedCliente ? (
                  <div className="relative">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                      <Input
                        ref={searchInputRef}
                        placeholder="Digite SAP, Razão Social, Fantasia ou CNPJ (ex: 100001, Metalúrgica, 18.442...)"
                        value={searchClienteTerm}
                        onChange={(e) => {
                          setSearchClienteTerm(e.target.value)
                          setIsSearchingCliente(true)
                        }}
                        onFocus={() => setIsSearchingCliente(true)}
                        className="pl-9 pr-8 h-10 text-xs rounded-xl border-slate-300 focus-visible:ring-[#003A70]"
                      />
                      {searchClienteTerm && (
                        <button
                          type="button"
                          onClick={() => setSearchClienteTerm('')}
                          className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Dropdown de Resultados da Pesquisa Mestre */}
                    {isSearchingCliente && (
                      <div className="absolute z-30 mt-1 w-full bg-white border border-slate-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100 animate-in fade-in-50">
                        {filteredClientes.length === 0 ? (
                          <div className="p-4 text-center text-xs text-muted-foreground">
                            Nenhum cliente encontrado no cadastro mestre para "{searchClienteTerm}".
                          </div>
                        ) : (
                          filteredClientes.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => handleSelectCliente(c)}
                              className="w-full p-3 text-left hover:bg-sky-50 transition-colors flex items-center justify-between group"
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs font-bold text-[#003A70] bg-sky-100/60 px-1.5 py-0.5 rounded">
                                    SAP {c.sapCode}
                                  </span>
                                  <strong className="text-xs text-slate-900 group-hover:text-[#003A70]">
                                    {c.razaoSocial}
                                  </strong>
                                </div>
                                <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                                  <span>Fantasia: {c.nomeFantasia}</span>
                                  <span>·</span>
                                  <span>CNPJ: {c.cnpj}</span>
                                  <span>·</span>
                                  <span>
                                    {c.cidade}/{c.uf}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <Badge
                                  variant="outline"
                                  className="text-[10px] bg-slate-50 font-medium"
                                >
                                  {c.segmento}
                                </Badge>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* CARD DO CLIENTE SELECIONADO (MODO SOMENTE LEITURA COM DADOS CADASTRAIS AUXILIARES) */
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 animate-in fade-in-50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold bg-[#003A70] text-white px-2 py-0.5 rounded-lg">
                            SAP {selectedCliente.sapCode}
                          </span>
                          <strong className="text-sm font-bold text-slate-900 font-serif">
                            {selectedCliente.razaoSocial}
                          </strong>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          <strong>Nome Fantasia:</strong> {selectedCliente.nomeFantasia} ·{' '}
                          <strong>CNPJ:</strong> {selectedCliente.cnpj} ·{' '}
                          <strong>Cidade/UF:</strong> {selectedCliente.cidade}/{selectedCliente.uf}
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleClearCliente}
                        className="h-8 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-xl"
                      >
                        <X className="w-3.5 h-3.5 mr-1" /> Trocar Cliente
                      </Button>
                    </div>

                    {/* PAINEL AUXILIAR DE INFOS COMERCIAIS (Somente leitura - Regra 2) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/80 text-[11px]">
                      <div className="bg-white p-2 rounded-xl border border-slate-200/60">
                        <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                          Vendedor Resp.
                        </span>
                        <strong className="text-slate-800 truncate block">
                          {selectedCliente.vendedor || 'Carlos Mendonça'}
                        </strong>
                      </div>

                      <div className="bg-white p-2 rounded-xl border border-slate-200/60">
                        <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                          Última Compra
                        </span>
                        <strong className="text-slate-800 block">
                          {selectedCliente.ultimaCompraData || 'Sem registro'}
                        </strong>
                      </div>

                      <div className="bg-white p-2 rounded-xl border border-slate-200/60">
                        <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                          Situação Comercial
                        </span>
                        <strong className="text-emerald-700 block">
                          {selectedCliente.statusComercial || 'Ativo'} · RFM{' '}
                          {selectedCliente.rfmSegmento || 'Leal'}
                        </strong>
                      </div>

                      <div className="bg-white p-2 rounded-xl border border-slate-200/60">
                        <span className="text-muted-foreground block text-[10px] uppercase font-semibold">
                          Limite de Crédito
                        </span>
                        <strong className="text-primary block font-mono">
                          {selectedCliente.limiteCredito
                            ? formatBRL(selectedCliente.limiteCredito)
                            : 'R$ 250.000,00'}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SEÇÃO 2: GRUPO DE MERCADORIAS & ESTIMATIVAS (Desktop 3 colunas, Notebook 2, Tablet/Mobile 1) */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {/* Grupo de Mercadorias (Opcional - Regra 3) */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-primary" />
                    <span>Grupo de Mercadorias (Opcional)</span>
                  </Label>
                  <Select value={grupoMercadoria} onValueChange={setGrupoMercadoria}>
                    <SelectTrigger className="h-9 text-xs rounded-xl bg-slate-50/50 w-full">
                      <SelectValue placeholder="Selecione o grupo" />
                    </SelectTrigger>
                    <SelectContent className="max-h-56">
                      {GRUPOS_MERCADORIA_OPCOES.map((grp) => (
                        <SelectItem key={grp} value={grp} className="text-xs">
                          {grp}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-[10px] text-muted-foreground block">
                    Não exige código exato de material.
                  </span>
                </div>

                {/* Quantidade Estimada (Opcional - Regra 4) */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5 text-primary" />
                    <span>Qtd Estimada (t) (Opcional)</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="Ex: 30"
                      value={quantidadeEstimada}
                      onChange={(e) => setQuantidadeEstimada(e.target.value)}
                      className="h-9 text-xs rounded-xl bg-slate-50/50 pr-8 w-full"
                    />
                    <span className="absolute right-3 top-2 text-xs font-bold text-muted-foreground">
                      t
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground block">
                    {quantidadeEstimada ? `${quantidadeEstimada} t` : 'Não estimada'}
                  </span>
                </div>

                {/* Preço Estimado (Opcional - Regra 5) */}
                <div className="space-y-1.5 md:col-span-2 xl:col-span-1">
                  <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-primary" />
                    <span>Preço Estimado (R$/t) (Opcional)</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-muted-foreground font-semibold">
                      R$
                    </span>
                    <Input
                      type="number"
                      step="10"
                      min="0"
                      placeholder="Ex: 4500"
                      value={precoEstimado}
                      onChange={(e) => setPrecoEstimado(e.target.value)}
                      className="h-9 text-xs rounded-xl bg-slate-50/50 pl-9 w-full"
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground block">
                    {precoEstimado ? `R$ ${precoEstimado}/t (referência)` : 'Não informado'}
                  </span>
                </div>
              </div>

              {/* DESTAQUE: VALOR POTENCIAL CALCULADO AUTOMATICAMENTE (Regra 5) */}
              <div className="p-3.5 bg-gradient-to-r from-sky-50 via-blue-50/60 to-indigo-50/40 border border-sky-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#003A70]" />
                    <strong className="text-xs font-bold text-[#003A70] uppercase tracking-wide">
                      Valor Potencial da Oportunidade
                    </strong>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Calculado automaticamente: <strong>Quantidade estimada × Preço estimado</strong>{' '}
                    (somente se ambos informados).
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  {valorPotencialCalculado !== null ? (
                    <div className="space-y-0.5">
                      <span className="font-serif text-lg font-bold text-[#003A70] block font-mono">
                        {formatBRL(valorPotencialCalculado)}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-semibold">
                        {quantidadeEstimada} t × R$ {precoEstimado}/t
                      </span>
                    </div>
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-slate-100 text-slate-600 border-slate-300 font-semibold text-xs py-1"
                    >
                      Não estimado
                    </Badge>
                  )}
                </div>
              </div>

              {/* SEÇÃO 3: CAMPOS COMPLEMENTARES (Desktop 3 colunas, Notebook 2, Tablet/Mobile 1) */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {/* Previsão de Compra (Regra 8) */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span>Previsão de Compra (Opcional)</span>
                  </Label>
                  <Select
                    value={previsaoCompra}
                    onValueChange={(v) => setPrevisaoCompra(v as PrevisaoCompraTipo)}
                  >
                    <SelectTrigger className="h-9 text-xs rounded-xl bg-slate-50/50 w-full">
                      <SelectValue placeholder="Selecione a previsão" />
                    </SelectTrigger>
                    <SelectContent>
                      {PREVISOES_COMPRA_OPCOES.map((prev) => (
                        <SelectItem key={prev.id} value={prev.id} className="text-xs">
                          {prev.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Probabilidade (Regra 9 - Baixa, Média, Alta) */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-primary" />
                    <span>Probabilidade (Opcional)</span>
                  </Label>
                  <Select
                    value={probabilidade}
                    onValueChange={(v) => setProbabilidade(v as ProbabilidadeNivel)}
                  >
                    <SelectTrigger className="h-9 text-xs rounded-xl bg-slate-50/50 w-full">
                      <SelectValue placeholder="Selecione a probabilidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROBABILIDADE_OPCOES.map((prob) => (
                        <SelectItem key={prob.id} value={prob.id} className="text-xs">
                          {prob.label} (~{prob.pctDefault}%)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Origem da Oportunidade (Regra 7) */}
                <div className="space-y-1.5 md:col-span-2 xl:col-span-1">
                  <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-primary" />
                    <span>Origem (Opcional)</span>
                  </Label>
                  <Select value={origem} onValueChange={(v) => setOrigem(v as OrigemOportunidade)}>
                    <SelectTrigger className="h-9 text-xs rounded-xl bg-slate-50/50 w-full">
                      <SelectValue placeholder="Selecione a origem" />
                    </SelectTrigger>
                    <SelectContent className="max-h-56">
                      {ORIGENS_OPORTUNIDADE.map((org) => (
                        <SelectItem key={org.id} value={org.id} className="text-xs">
                          {org.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* SEÇÃO 4: OBSERVAÇÕES E HISTÓRICO COMERCIAL */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  <span>Observações / Histórico Comercial (Opcional)</span>
                </Label>
                <Textarea
                  placeholder="Descreva detalhes livres levantados com o cliente, especificações de uso, contexto da obra ou concorrência..."
                  rows={2}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="text-xs rounded-xl bg-slate-50/50 resize-none border-slate-300"
                />
              </div>

              {/* INFORMATIVO DE AUDITORIA E ESTÁGIO INICIAL */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Auditoria Automática:</strong> Registrado por{' '}
                    <strong>{usuarioAtualNome}</strong> no estágio inicial{' '}
                    <strong>1. Especulação</strong>.
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {new Date().toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>

            {/* Rodapé / Ações - FOOTER FIXO (flex-shrink: 0, sticky bottom-0, background branco, z-20) */}
            <DialogFooter
              data-testid="nova-oportunidade-footer"
              className="sticky bottom-0 z-20 shrink-0 flex-shrink-0 p-3.5 sm:p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.06)]"
            >
              <div className="text-[11px] text-muted-foreground w-full sm:w-auto text-left">
                {!isFormValid ? (
                  <span className="text-rose-600 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Selecione um cliente para
                    habilitar o salvamento.
                  </span>
                ) : (
                  <span className="text-emerald-700 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Pronto para salvar
                    oportunidade comercial.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  disabled={isSaving}
                  className="h-9 text-xs rounded-xl border-slate-300 hover:bg-slate-50"
                >
                  Cancelar
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleSave}
                  disabled={!isFormValid || isSaving}
                  className={cn(
                    'h-9 px-5 text-xs font-semibold rounded-xl text-white shadow-sm transition-all',
                    isFormValid && !isSaving
                      ? 'bg-[#003A70] hover:bg-[#002d57] active:scale-[0.98]'
                      : 'bg-slate-300 cursor-not-allowed',
                  )}
                >
                  {isSaving ? 'Salvando...' : 'Salvar Oportunidade'}
                </Button>
              </div>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
