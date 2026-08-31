// src/components/consultas/GerarCatalogoWizardModal.tsx
import React, { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  BookOpen,
  Sparkles,
  Layers,
  Filter,
  Search,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Building2,
  Package,
  Eye,
  SlidersHorizontal,
  Info,
  ShieldAlert,
} from 'lucide-react'
import {
  CatalogoTipo,
  CatalogoModoApresentacao,
  CatalogoProdutoItem,
  CatalogoConfiguracao,
  CatalogoGerado,
} from '@/types/catalogo'
import { catalogoService } from '@/services/catalogoService'
import { mockCustomerManagementList } from '@/data/mockCustomerManagementData'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { CatalogoPdfPreviewModal } from './CatalogoPdfPreviewModal'

interface GerarCatalogoWizardModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCatalogoCriado?: (cat: CatalogoGerado) => void
}

export function GerarCatalogoWizardModal({
  open,
  onOpenChange,
  onCatalogoCriado,
}: GerarCatalogoWizardModalProps) {
  const { user } = useAuth()

  // Passo do Assistente (1: Tipo/Cliente, 2: Seleção de Produtos, 3: Prévia & Conclusão)
  const [passo, setPasso] = useState<1 | 2 | 3>(1)

  // Configurações do Catálogo
  const [tipo, setTipo] = useState<CatalogoTipo>('INTELIGENTE_CLIENTE')
  const [modo, setModo] = useState<CatalogoModoApresentacao>('COMERCIAL')
  const [clienteId, setClienteId] = useState<string>('CLI-8041')
  const [titulo, setTitulo] = useState('Catálogo de Soluções em Aço CIAFAL')
  const [subtitulo, setSubtitulo] = useState('')
  const [linhaSelecionada, setLinhaSelecionada] = useState<string>('TODAS')
  const [familiaSelecionada, setFamiliaSelecionada] = useState<string>('TODAS')

  // Filtros de busca de produtos no passo 2
  const [buscaTermo, setBuscaTermo] = useState('')
  const [filtroEmpresa, setFiltroEmpresa] = useState('TODAS')
  const [filtroProducaoPropria, setFiltroProducaoPropria] = useState(false)
  const [filtroIndustrializacao, setFiltroIndustrializacao] = useState(false)

  // Itens selecionados
  const [produtosSelecionados, setProdutosSelecionados] = useState<CatalogoProdutoItem[]>([])
  const [crossSellSugeridos, setCrossSellSugeridos] = useState<CatalogoProdutoItem[]>([])

  // Opções de personalização
  const [incluirCapa, setIncluirCapa] = useState(true)
  const [incluirDadosTecnicos, setIncluirDadosTecnicos] = useState(true)
  const [incluirNormas, setIncluirNormas] = useState(true)
  const [incluirPesos, setIncluirPesos] = useState(true)
  const [incluirCrossSell, setIncluirCrossSell] = useState(true)
  const [validadeDias, setValidadeDias] = useState(30)

  // Modal de Prévia Aberto
  const [catalogoGeradoTemp, setCatalogoGeradoTemp] = useState<CatalogoGerado | null>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)

  // Linhas e Famílias
  const linhas = useMemo(() => catalogoService.getLinhasDisponiveis(), [])
  const familias = useMemo(
    () => catalogoService.getFamiliasDisponiveis(linhaSelecionada),
    [linhaSelecionada],
  )

  // Lista de clientes disponíveis
  const clientes = useMemo(() => mockCustomerManagementList, [])
  const clienteAtual = useMemo(
    () => clientes.find((c) => c.id === clienteId || c.codigo === clienteId),
    [clientes, clienteId],
  )

  // Produtos oficiais filtrados
  const produtosFiltrados = useMemo(() => {
    return catalogoService.getProdutosOficiais({
      termo: buscaTermo,
      linha: linhaSelecionada,
      familia: familiaSelecionada,
      empresa: filtroEmpresa,
      producaoPropria: filtroProducaoPropria ? true : undefined,
      industrializacao: filtroIndustrializacao ? true : undefined,
    })
  }, [
    buscaTermo,
    linhaSelecionada,
    familiaSelecionada,
    filtroEmpresa,
    filtroProducaoPropria,
    filtroIndustrializacao,
  ])

  // Efeito ao trocar para Catálogo Inteligente por Cliente
  React.useEffect(() => {
    if (tipo === 'INTELIGENTE_CLIENTE' && clienteAtual) {
      const sugestao = catalogoService.sugerirProdutosPorCliente(clienteAtual.codigo)
      setProdutosSelecionados(sugestao.produtosPrincipais)
      setCrossSellSugeridos(sugestao.produtosCrossSell)
      setTitulo(`Catálogo Técnico de Soluções CIAFAL - ${clienteAtual.razaoSocial}`)
      setSubtitulo('Mix de produtos otimizado conforme histórico e demandas do seu segmento')
    } else if (tipo === 'COMPLETO') {
      const todos = catalogoService.getProdutosOficiais()
      setProdutosSelecionados(todos)
      setCrossSellSugeridos([])
      setTitulo('Catálogo Geral de Produtos CIAFAL Ferro & Aço')
      setSubtitulo('Linha completa de laminados, perfis estruturais, tubos e chapas')
    } else if (tipo === 'LINHA') {
      const lin = linhaSelecionada === 'TODAS' ? 'Laminados Mercantis' : linhaSelecionada
      const prodsLinha = catalogoService.getProdutosOficiais({ linha: lin })
      setProdutosSelecionados(prodsLinha)
      setTitulo(`Catálogo de Produtos CIAFAL - ${lin}`)
      setSubtitulo(`Portfólio técnico e comercial da linha ${lin}`)
    }
  }, [tipo, clienteAtual, linhaSelecionada])

  // Ações de seleção de produtos
  const handleToggleProduto = (prod: CatalogoProdutoItem) => {
    setProdutosSelecionados((prev) => {
      const existe = prev.some((p) => p.id === prod.id)
      if (existe) {
        return prev.filter((p) => p.id !== prod.id)
      } else {
        return [...prev, prod]
      }
    })
  }

  const handleSelecionarTodosFiltrados = () => {
    setProdutosSelecionados((prev) => {
      const mapa = new Map(prev.map((p) => [p.id, p]))
      produtosFiltrados.forEach((p) => mapa.set(p.id, p))
      return Array.from(mapa.values())
    })
    toast.info(`${produtosFiltrados.length} produtos adicionados à seleção.`)
  }

  const handleLimparSelecao = () => {
    setProdutosSelecionados([])
    toast.info('Seleção limpa.')
  }

  // Finalizar e Gerar Catálogo
  const handleAvancarParaPrevia = async () => {
    if (produtosSelecionados.length === 0) {
      toast.error('Selecione pelo menos um produto para gerar o catálogo.')
      return
    }

    const config: CatalogoConfiguracao = {
      titulo,
      subtitulo,
      tipo,
      modo,
      clienteId: tipo === 'INTELIGENTE_CLIENTE' || clienteId ? clienteAtual?.id : undefined,
      clienteNome:
        tipo === 'INTELIGENTE_CLIENTE' || clienteId ? clienteAtual?.razaoSocial : undefined,
      clienteSap: tipo === 'INTELIGENTE_CLIENTE' || clienteId ? clienteAtual?.codigo : undefined,
      vendedorId: user?.id || 'vendedor_logado',
      vendedorNome: user?.name || 'Carlos Mendonça',
      vendedorEmail: user?.email || 'carlos.mendonca@ciafal.com.br',
      vendedorTelefone: '(31) 3359-2040',
      vendedorWhatsapp: '(31) 99811-0044',
      linhaSelecionada: tipo === 'LINHA' ? linhaSelecionada : undefined,
      familiaSelecionada: tipo === 'LINHA' ? familiaSelecionada : undefined,
      incluirCapa,
      incluirDadosTecnicos,
      incluirNormas,
      incluirPesosTeoricos: incluirPesos,
      incluirCrossSellSugerido: incluirCrossSell,
      tituloSecaoCrossSell: 'Outras Soluções Complementares CIAFAL',
      dataGeracao: new Date().toLocaleDateString('pt-BR'),
      validadeDias,
      versao: 1,
      codigoVersao: 'CAT-2026-TEMP',
    }

    try {
      const novoCat = await catalogoService.salvarNovoCatalogo(
        user as any,
        config,
        produtosSelecionados,
        crossSellSugeridos,
      )
      setCatalogoGeradoTemp(novoCat)
      setShowPreviewModal(true)
      if (onCatalogoCriado) onCatalogoCriado(novoCat)
      onOpenChange(false)
    } catch (err: any) {
      toast.error('Erro ao gerar catálogo: ' + err.message)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-slate-50 rounded-2xl border border-slate-200">
          {/* Header */}
          <DialogHeader className="p-4 bg-white border-b border-slate-200 flex flex-row items-center justify-between space-y-0 shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-[#003A70] text-white p-2 rounded-xl">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold font-serif text-[#003A70]">
                  Assistente de Geração de Catálogos CIAFAL
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Crie catálogos técnicos e comerciais oficiais em PDF para envio via WhatsApp ou
                  E-mail.
                </DialogDescription>
              </div>
            </div>

            {/* Indicador de Passos */}
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span
                className={`px-2 py-0.5 rounded-full ${
                  passo === 1 ? 'bg-[#003A70] text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                1. Tipo & Cliente
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span
                className={`px-2 py-0.5 rounded-full ${
                  passo === 2 ? 'bg-[#003A70] text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                2. Seleção de Produtos ({produtosSelecionados.length})
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span
                className={`px-2 py-0.5 rounded-full ${
                  passo === 3 ? 'bg-[#003A70] text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                3. Prévia & PDF
              </span>
            </div>
          </DialogHeader>

          {/* Conteúdo Rolável dos Passos */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* ========================================================
                PASSO 1: SELEÇÃO DO TIPO DE CATÁLOGO E CLIENTE
            ======================================================== */}
            {passo === 1 && (
              <div className="space-y-6 animate-fade-in">
                {/* 4 Cards de Tipos de Catálogo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Tipo 1: Inteligente por Cliente */}
                  <div
                    onClick={() => setTipo('INTELIGENTE_CLIENTE')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      tipo === 'INTELIGENTE_CLIENTE'
                        ? 'border-[#003A70] bg-sky-50/60 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-[#003A70] font-bold text-sm">
                        <Sparkles className="w-4 h-4 text-[#003A70]" />
                        Catálogo Inteligente por Cliente
                      </div>
                      <Badge className="bg-sky-100 text-[#003A70] border-none text-[10px] font-bold">
                        Recomendado IA
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600">
                      A IA analisa compras anteriores, frequência, recência e sugere mix de recompra
                      + Cross Sell ideal.
                    </p>
                  </div>

                  {/* Tipo 2: Personalizado */}
                  <div
                    onClick={() => setTipo('PERSONALIZADO')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      tipo === 'PERSONALIZADO'
                        ? 'border-[#003A70] bg-sky-50/60 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-[#003A70] font-bold text-sm">
                        <SlidersHorizontal className="w-4 h-4 text-[#003A70]" />
                        Catálogo Personalizado
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        Seleção Livre
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600">
                      Monte manualmente o catálogo escolhendo materiais específicos com filtros
                      avançados.
                    </p>
                  </div>

                  {/* Tipo 3: Por Linha / Família */}
                  <div
                    onClick={() => setTipo('LINHA')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      tipo === 'LINHA'
                        ? 'border-[#003A70] bg-sky-50/60 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-[#003A70] font-bold text-sm">
                        <Layers className="w-4 h-4 text-[#003A70]" />
                        Catálogo por Linha / Família
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        Setorial
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600">
                      Gere catálogo completo de uma linha técnica (ex: Laminados Mercantis, Perfis W
                      ou Tubos Inox).
                    </p>
                  </div>

                  {/* Tipo 4: Catálogo Geral Completo */}
                  <div
                    onClick={() => setTipo('COMPLETO')}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      tipo === 'COMPLETO'
                        ? 'border-[#003A70] bg-sky-50/60 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-[#003A70] font-bold text-sm">
                        <BookOpen className="w-4 h-4 text-[#003A70]" />
                        Catálogo Geral Completo
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        Institucional
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600">
                      Todos os produtos comerciais autorizados para apresentação corporativa geral.
                    </p>
                  </div>
                </div>

                {/* Bloco de Configuração de Cliente e Detalhes */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Destinatário & Parâmetros Iniciais
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Seletor de Cliente */}
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-700">
                        Cliente da Carteira (Opcional)
                      </Label>
                      <Select value={clienteId} onValueChange={setClienteId}>
                        <SelectTrigger className="h-9 text-xs bg-white">
                          <SelectValue placeholder="Selecione um cliente..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SEM_CLIENTE">
                            -- Catálogo Geral (Sem cliente específico) --
                          </SelectItem>
                          {clientes.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.razaoSocial} ({c.codigo})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Modo de Apresentação */}
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-700">
                        Modo de Apresentação
                      </Label>
                      <Select value={modo} onValueChange={(v: any) => setModo(v)}>
                        <SelectTrigger className="h-9 text-xs bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="COMERCIAL">
                            Modo Comercial (Visual, Aplicações & Benefícios)
                          </SelectItem>
                          <SelectItem value="TECNICO">
                            Modo Técnico (Normas, Bitolas, Pesos & Tolerâncias)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Se for por linha, seletor de linha */}
                    {tipo === 'LINHA' && (
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-slate-700">
                          Linha de Produtos
                        </Label>
                        <Select value={linhaSelecionada} onValueChange={setLinhaSelecionada}>
                          <SelectTrigger className="h-9 text-xs bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="TODAS">Todas as Linhas</SelectItem>
                            {linhas.map((l) => (
                              <SelectItem key={l} value={l}>
                                {l}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Título Personalizado */}
                    <div className="space-y-1 md:col-span-2">
                      <Label className="text-xs font-bold text-slate-700">Título da Capa</Label>
                      <Input
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Nota de Governança CIAFAL */}
                <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl flex items-start gap-2.5 text-xs text-[#003A70]">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#003A70]" />
                  <span>
                    <strong>Governança de Dados CIAFAL:</strong> O gerador de catálogo utiliza
                    apenas informações técnicas e comerciais públicas. Jamais serão expostos no
                    documento final: margens internas, estoques totais ou scores de IA.
                  </span>
                </div>
              </div>
            )}

            {/* ========================================================
                PASSO 2: SELEÇÃO, FILTROS E SUGESTÕES INTELIGENTES
            ======================================================== */}
            {passo === 2 && (
              <div className="space-y-5 animate-fade-in">
                {/* Barra de Filtros e Busca Rápida */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="relative flex-1 w-full">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <Input
                        value={buscaTermo}
                        onChange={(e) => setBuscaTermo(e.target.value)}
                        placeholder="Buscar por código, descrição, bitola, norma, aplicação..."
                        className="pl-9 h-9 text-xs"
                      />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Select value={linhaSelecionada} onValueChange={setLinhaSelecionada}>
                        <SelectTrigger className="h-9 text-xs w-[180px] bg-white">
                          <SelectValue placeholder="Linha..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TODAS">Todas as Linhas</SelectItem>
                          {linhas.map((l) => (
                            <SelectItem key={l} value={l}>
                              {l}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelecionarTodosFiltrados}
                        className="h-9 text-xs text-[#003A70] font-bold shrink-0"
                      >
                        Selecionar Filtrados ({produtosFiltrados.length})
                      </Button>

                      {produtosSelecionados.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleLimparSelecao}
                          className="h-9 text-xs text-rose-600 hover:bg-rose-50 shrink-0"
                        >
                          Limpar ({produtosSelecionados.length})
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Filtros adicionais */}
                  <div className="flex flex-wrap items-center gap-4 text-xs pt-2 border-t border-slate-100 text-slate-600">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <Checkbox
                        checked={filtroProducaoPropria}
                        onCheckedChange={(c) => setFiltroProducaoPropria(!!c)}
                      />
                      <span>Apenas Produção Própria CIAFAL</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <Checkbox
                        checked={filtroIndustrializacao}
                        onCheckedChange={(c) => setFiltroIndustrializacao(!!c)}
                      />
                      <span>Industrialização / Corte e Dobra</span>
                    </label>

                    <span className="text-slate-400">|</span>

                    <span className="text-slate-500 font-medium">
                      Exibindo <strong>{produtosFiltrados.length}</strong> materiais disponíveis
                    </span>
                  </div>
                </div>

                {/* Grade de Produtos para Seleção */}
                <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                  {produtosFiltrados.map((prod) => {
                    const isSelected = produtosSelecionados.some((p) => p.id === prod.id)
                    return (
                      <div
                        key={prod.id}
                        onClick={() => handleToggleProduto(prod)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-sky-50/80 border-[#003A70] shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Checkbox checked={isSelected} onCheckedChange={() => {}} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-[#003A70] bg-white px-2 py-0.5 rounded border border-slate-200">
                                {prod.codigo}
                              </span>
                              <span className="font-bold text-xs text-slate-900 truncate">
                                {prod.descricaoComercial}
                              </span>
                              {prod.tagComercial && (
                                <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold border-none">
                                  {prod.tagComercial}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                              <span>{prod.linha}</span>
                              <span>•</span>
                              <span>{prod.dimensao}</span>
                              <span>•</span>
                              <span>{prod.normaTecnica}</span>
                              <span>•</span>
                              <span className="font-semibold text-slate-700">
                                {prod.pesoTeoricoKgM ? `${prod.pesoTeoricoKgM} kg/m` : ''}
                              </span>
                            </div>
                            {prod.motivoRecomendacaoInterna && (
                              <div className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded font-medium inline-block mt-1">
                                💡 {prod.motivoRecomendacaoInterna}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <Badge variant="outline" className="text-[10px] bg-slate-50">
                            {prod.empresaOrigem || 'CIAFAL Matriz'}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Resumo da Seleção */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#003A70]" />
                    <span>
                      Total Selecionado:{' '}
                      <strong className="text-[#003A70] text-sm">
                        {produtosSelecionados.length} materiais
                      </strong>
                    </span>
                  </div>
                  <span className="text-slate-500">
                    Estimativa: ~
                    {Math.ceil(produtosSelecionados.length / 3) + (incluirCapa ? 1 : 0)} páginas no
                    PDF
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer do Assistente com Navegação de Passos */}
          <DialogFooter className="p-3 bg-white border-t border-slate-200 flex flex-row items-center justify-between shrink-0">
            <div>
              {passo > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPasso((p) => (p - 1) as any)}
                  className="h-8 text-xs font-semibold gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Voltar
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 text-xs"
              >
                Cancelar
              </Button>

              {passo === 1 && (
                <Button
                  size="sm"
                  onClick={() => setPasso(2)}
                  className="h-8 text-xs font-bold bg-[#003A70] text-white hover:bg-[#002850] gap-1"
                >
                  Avançar para Produtos
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              )}

              {passo === 2 && (
                <Button
                  size="sm"
                  disabled={produtosSelecionados.length === 0}
                  onClick={handleAvancarParaPrevia}
                  className="h-8 text-xs font-bold bg-[#003A70] text-white hover:bg-[#002850] gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Gerar & Visualizar Prévia ({produtosSelecionados.length})
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Prévia Acionado */}
      {catalogoGeradoTemp && (
        <CatalogoPdfPreviewModal
          open={showPreviewModal}
          onOpenChange={setShowPreviewModal}
          catalogo={catalogoGeradoTemp}
        />
      )}
    </>
  )
}
