// src/components/consultas/CatalogoPdfPreviewModal.tsx
import React, { useState } from 'react'
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Building2,
  FileDown,
  Mail,
  Share2,
  Send,
  Sparkles,
  Layers,
  Award,
  Trash2,
  MoveUp,
  MoveDown,
  CheckCircle2,
  ShoppingCart,
  Phone,
  Clock,
  Printer,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Package,
} from 'lucide-react'
import {
  CatalogoGerado,
  CatalogoProdutoItem,
  CatalogoConfiguracao,
  CatalogoModoApresentacao,
} from '@/types/catalogo'
import { catalogoService } from '@/services/catalogoService'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

interface CatalogoPdfPreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  catalogo: CatalogoGerado | null
  onCatalogoAtualizado?: (novoCat: CatalogoGerado) => void
}

export function CatalogoPdfPreviewModal({
  open,
  onOpenChange,
  catalogo,
  onCatalogoAtualizado,
}: CatalogoPdfPreviewModalProps) {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<'preview' | 'produtos' | 'enviar' | 'config'>(
    'preview',
  )
  const [paginaAtual, setPaginaAtual] = useState(1)

  // Estado editável dos produtos na prévia
  const [produtos, setProdutos] = useState<CatalogoProdutoItem[]>(() => catalogo?.produtos || [])
  const [crossSellProdutos, setCrossSellProdutos] = useState<CatalogoProdutoItem[]>(
    () => catalogo?.produtosCrossSell || [],
  )

  // Configuração editável
  const [modo, setModo] = useState<CatalogoModoApresentacao>(catalogo?.modo || 'COMERCIAL')
  const [incluirCapa, setIncluirCapa] = useState(catalogo?.configuracao.incluirCapa ?? true)
  const [incluirDadosTecnicos, setIncluirDadosTecnicos] = useState(
    catalogo?.configuracao.incluirDadosTecnicos ?? true,
  )
  const [incluirNormas, setIncluirNormas] = useState(catalogo?.configuracao.incluirNormas ?? true)
  const [incluirPesos, setIncluirPesos] = useState(
    catalogo?.configuracao.incluirPesosTeoricos ?? true,
  )
  const [incluirCrossSell, setIncluirCrossSell] = useState(
    catalogo?.configuracao.incluirCrossSellSugerido ?? true,
  )

  // Estados de envio
  const [canalEnvio, setCanalEnvio] = useState<'EMAIL' | 'WHATSAPP'>('WHATSAPP')
  const [destinatarioNome, setDestinatarioNome] = useState(
    catalogo?.clienteNome
      ? `Engenharia / Suprimentos (${catalogo.clienteNome})`
      : 'Equipe Técnica & Compras',
  )
  const [destinatarioContato, setDestinatarioContato] = useState(
    catalogo?.clienteTelefone || catalogo?.clienteEmail || '(31) 98765-4321',
  )
  const [mensagemEnvio, setMensagemEnvio] = useState('')
  const [enviando, setEnviando] = useState(false)

  // Atualizar quando abrir um novo catálogo
  React.useEffect(() => {
    if (catalogo) {
      setProdutos(catalogo.produtos)
      setCrossSellProdutos(catalogo.produtosCrossSell || [])
      setModo(catalogo.modo)
      setIncluirCapa(catalogo.configuracao.incluirCapa)
      setIncluirDadosTecnicos(catalogo.configuracao.incluirDadosTecnicos)
      setIncluirNormas(catalogo.configuracao.incluirNormas)
      setIncluirPesos(catalogo.configuracao.incluirPesosTeoricos)
      setIncluirCrossSell(catalogo.configuracao.incluirCrossSellSugerido)
      setDestinatarioNome(
        catalogo.clienteNome
          ? `Engenharia / Suprimentos (${catalogo.clienteNome})`
          : 'Equipe Técnica & Compras',
      )
      setDestinatarioContato(catalogo.clienteTelefone || catalogo.clienteEmail || '(31) 98765-4321')

      const vendedorNome = user?.name || catalogo.vendedorNome || 'Consultor Comercial'
      if (canalEnvio === 'WHATSAPP') {
        setMensagemEnvio(
          `Olá, ${catalogo.clienteNome ? catalogo.clienteNome : 'tudo bem'}! Tudo bem? Preparei uma seleção de produtos CIAFAL que pode ser interessante para sua empresa. Segue nosso catálogo (${catalogo.codigoVersao}). Se desejar, posso preparar uma cotação dos itens de interesse.\n\nAtenciosamente,\n${vendedorNome}\nCIAFAL Ferro & Aço`,
        )
      } else {
        setMensagemEnvio(
          `Assunto: Catálogo de Produtos CIAFAL\n\nOlá, ${catalogo.clienteNome ? catalogo.clienteNome : 'Prezado(a)'}.\n\nSegue nosso catálogo de produtos CIAFAL selecionado para sua empresa (${catalogo.codigoVersao}). Caso tenha interesse em algum material, posso preparar uma cotação.\n\nAtenciosamente,\n${vendedorNome}\nCIAFAL Ferro & Aço\nCentral: (31) 3359-2000`,
        )
      }
    }
  }, [catalogo, canalEnvio, user])

  if (!catalogo) return null

  // Reordenação e remoção de produtos na prévia
  const handleMoverProduto = (index: number, direcao: 'up' | 'down') => {
    const novoArray = [...produtos]
    const targetIndex = direcao === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= novoArray.length) return
    const temp = novoArray[index]
    novoArray[index] = novoArray[targetIndex]
    novoArray[targetIndex] = temp
    setProdutos(novoArray)
    toast.success('Ordem dos produtos atualizada!')
  }

  const handleRemoverProduto = (index: number) => {
    const prodRemovido = produtos[index]
    const novoArray = produtos.filter((_, i) => i !== index)
    setProdutos(novoArray)
    toast.info(`Produto ${prodRemovido.codigo} removido da prévia.`)
  }

  const handleRemoverCrossSell = (index: number) => {
    const novoArray = crossSellProdutos.filter((_, i) => i !== index)
    setCrossSellProdutos(novoArray)
    toast.info('Item complementar removido.')
  }

  // Ação de Gerar PDF / Download
  const handleBaixarPdf = () => {
    toast.success('Gerando PDF com identidade visual CIAFAL...', {
      description: `Arquivo: Catalogo_CIAFAL_${catalogo.codigoVersao.replace(/\s+/g, '_')}.pdf`,
    })
    window.print()
  }

  // Ação de Enviar
  const handleConfirmarEnvio = async () => {
    if (!user) {
      toast.error('Usuário não autenticado.')
      return
    }
    setEnviando(true)
    try {
      const catAtualizado = await catalogoService.enviarCatalogo(
        user as any,
        catalogo.id,
        canalEnvio,
        destinatarioNome,
        destinatarioContato,
        mensagemEnvio,
      )
      toast.success(
        `Catálogo ${catalogo.codigoVersao} enviado com sucesso via ${canalEnvio === 'EMAIL' ? 'E-mail' : 'WhatsApp'}!`,
        {
          description: `Destinatário: ${destinatarioNome} (${destinatarioContato}). Registrado na timeline do CRM.`,
        },
      )
      if (onCatalogoAtualizado) onCatalogoAtualizado(catAtualizado)
      onOpenChange(false)
    } catch (err: any) {
      toast.error('Erro ao enviar catálogo: ' + (err?.message || 'Falha de comunicação'))
    } finally {
      setEnviando(false)
    }
  }

  // Ação Catálogo → Cotação direta
  const handleCriarCotacao = async () => {
    if (!user) return
    try {
      const novaCotacao = await catalogoService.criarCotacaoAPartirDoCatalogo(
        user as any,
        catalogo.id,
        produtos,
      )
      toast.success(`Cotação ${novaCotacao.code} criada a partir do catálogo!`, {
        description: 'Materiais importados com sucesso. Redirecionando para cotações...',
      })
      onOpenChange(false)
      navigate('/crm/cotacoes')
    } catch (err: any) {
      toast.error('Erro ao gerar cotação: ' + err.message)
    }
  }

  // Total de páginas calculadas
  const totalProdutosExibidos = produtos.length + (incluirCrossSell ? crossSellProdutos.length : 0)
  const totalPaginas = Math.ceil(totalProdutosExibidos / 3) + (incluirCapa ? 1 : 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-slate-100 rounded-2xl border border-slate-200">
        {/* Header Modal */}
        <DialogHeader className="p-4 bg-white border-b border-slate-200 flex flex-row items-center justify-between space-y-0 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-[#003A70] text-white p-2 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-base font-bold font-serif text-[#003A70]">
                  {catalogo.configuracao.titulo}
                </DialogTitle>
                <Badge
                  variant="outline"
                  className="bg-sky-50 text-[#003A70] border-sky-200 font-mono text-xs font-bold"
                >
                  {catalogo.codigoVersao}
                </Badge>
                {catalogo.isCongelado && (
                  <Badge className="bg-slate-200 text-slate-800 text-[10px] font-bold">
                    CONGELADO (ENVIADO)
                  </Badge>
                )}
              </div>
              <DialogDescription className="text-xs text-slate-500">
                {catalogo.clienteNome ? (
                  <>
                    Preparado para: <strong>{catalogo.clienteNome}</strong> ·
                  </>
                ) : (
                  'Catálogo Comercial Geral ·'
                )}{' '}
                Modo: <strong>{modo}</strong> · Vendedor: <strong>{catalogo.vendedorNome}</strong>
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCriarCotacao}
              className="h-8 text-xs font-bold bg-white text-[#003A70] border-[#003A70]/30 hover:bg-sky-50 gap-1.5"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Adicionar à Cotação
            </Button>
            <Button
              size="sm"
              onClick={handleBaixarPdf}
              className="h-8 text-xs font-bold bg-[#003A70] text-white hover:bg-[#002850] gap-1.5"
            >
              <FileDown className="w-3.5 h-3.5" />
              Gerar PDF
            </Button>
          </div>
        </DialogHeader>

        {/* Abas de Navegação interna da Prévia */}
        <div className="px-4 py-2 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-auto">
            <TabsList className="bg-slate-100 p-0.5 rounded-xl h-8">
              <TabsTrigger
                value="preview"
                className="text-xs py-1 px-3 rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#003A70] font-bold"
              >
                Prévia do PDF ({totalPaginas} págs)
              </TabsTrigger>
              <TabsTrigger
                value="produtos"
                className="text-xs py-1 px-3 rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#003A70] font-bold"
              >
                Gerenciar Itens ({totalProdutosExibidos})
              </TabsTrigger>
              <TabsTrigger
                value="config"
                className="text-xs py-1 px-3 rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#003A70] font-bold"
              >
                Aparência & Dados
              </TabsTrigger>
              <TabsTrigger
                value="enviar"
                className="text-xs py-1 px-3 rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#003A70] font-bold"
              >
                Enviar ao Cliente
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {activeTab === 'preview' && (
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 rounded-lg"
                disabled={paginaAtual <= 1}
                onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="font-semibold text-slate-800">
                Página {paginaAtual} de {totalPaginas}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 rounded-lg"
                disabled={paginaAtual >= totalPaginas}
                onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Conteúdo Principal Rolável */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex justify-center">
          {/* ABA 1: PRÉVIA DO PDF COM IDENTIDADE VISUAL CIAFAL (A4 CLEAN TÉCNICO-COMERCIAL) */}
          {activeTab === 'preview' && (
            <div className="w-full max-w-[800px] bg-white rounded-xl shadow-xl border border-slate-300 min-h-[900px] p-8 sm:p-12 flex flex-col justify-between text-slate-900 animate-fade-in relative">
              {/* Marca D'Água / Selo Discreto */}
              <div className="absolute top-4 right-6 text-right">
                <span className="text-[10px] font-mono font-bold text-slate-400 block">
                  {catalogo.codigoVersao}
                </span>
                <span className="text-[9px] text-slate-400 block">
                  Emissão: {catalogo.configuracao.dataGeracao}
                </span>
              </div>

              {/* PÁGINA 1: CAPA INSTITUCIONAL OU CONTEÚDO */}
              {paginaAtual === 1 && incluirCapa ? (
                <div className="flex-1 flex flex-col justify-between py-8">
                  {/* Topo da Capa */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-[#003A70] text-white p-3 rounded-2xl shadow-sm">
                        <Building2 className="w-8 h-8" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black font-serif text-[#003A70] tracking-tight">
                          CIAFAL
                        </h2>
                        <span className="text-xs uppercase tracking-widest text-slate-600 font-bold block">
                          COMPANHIA INDUSTRIAL DE AÇOS E FERRAGENS
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 w-24 bg-[#003A70] rounded-full" />
                  </div>

                  {/* Centro da Capa */}
                  <div className="space-y-6 my-12">
                    <span className="inline-block px-3 py-1 rounded-full bg-sky-50 text-[#003A70] border border-sky-200 text-xs font-bold uppercase tracking-wider">
                      {modo === 'TECNICO'
                        ? 'Catálogo Técnico Corporativo'
                        : 'Catálogo Comercial de Produtos'}
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-serif leading-tight">
                      {catalogo.configuracao.titulo}
                    </h1>
                    {catalogo.configuracao.subtitulo && (
                      <p className="text-base text-slate-600 max-w-xl">
                        {catalogo.configuracao.subtitulo}
                      </p>
                    )}

                    {catalogo.clienteNome && (
                      <div className="p-4 bg-slate-50 border-l-4 border-[#003A70] rounded-r-xl space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">
                          Preparado especialmente para:
                        </span>
                        <div className="text-lg font-black text-slate-900">
                          {catalogo.clienteNome}
                        </div>
                        <div className="text-xs text-slate-600 font-mono">
                          Código SAP: {catalogo.clienteSap || '0001088041'} · Validade:{' '}
                          {catalogo.configuracao.validadeDias} dias
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Rodapé da Capa: Dados do Consultor Autorizado */}
                  <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Consultor Técnico-Comercial:
                      </span>
                      <strong className="text-sm font-bold text-[#003A70] block">
                        {catalogo.configuracao.vendedorNome}
                      </strong>
                      <span className="text-slate-600 block">
                        {catalogo.configuracao.vendedorEmail}
                      </span>
                      <span className="text-slate-600 block">
                        WhatsApp: {catalogo.configuracao.vendedorWhatsapp}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Unidades & Centros de Distribuição:
                      </span>
                      <span className="text-slate-700 block font-semibold">
                        Contagem (Matriz) · Betim · Sabará
                      </span>
                      <span className="text-slate-500 block text-[11px]">
                        Atendimento: (31) 3359-2000 · www.ciafal.com.br
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* PÁGINAS INTERNAS: GRADE DOS PRODUTOS SELECIONADOS */
                <div className="flex-1 flex flex-col space-y-6">
                  {/* Cabeçalho de Página Interna */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <div className="bg-[#003A70] text-white p-1.5 rounded-lg">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <span className="font-serif font-bold text-sm text-[#003A70]">
                        CIAFAL FERRO & AÇO
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
                      {modo === 'TECNICO'
                        ? 'Especificações Técnicas de Produtos'
                        : 'Soluções Comerciais em Aço'}
                    </span>
                  </div>

                  {/* Lista de Produtos da Página */}
                  <div className="space-y-4">
                    {produtos
                      .slice(
                        (paginaAtual - (incluirCapa ? 2 : 1)) * 3,
                        (paginaAtual - (incluirCapa ? 2 : 1)) * 3 + 3,
                      )
                      .map((p) => (
                        <div
                          key={p.id}
                          className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-[#003A70]/40 transition-all space-y-3"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-[#003A70] bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                                  {p.codigo}
                                </span>
                                <Badge variant="outline" className="text-[10px] bg-white">
                                  {p.linha}
                                </Badge>
                                {p.tagComercial && (
                                  <Badge className="bg-emerald-100 text-emerald-800 text-[10px] border-none font-bold">
                                    {p.tagComercial}
                                  </Badge>
                                )}
                              </div>
                              <h3 className="text-sm font-bold text-slate-900 mt-1">
                                {p.descricaoComercial}
                              </h3>
                            </div>
                            <span className="text-xs font-bold text-slate-700 font-mono">
                              {p.dimensao}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 leading-relaxed">
                            {p.caracteristicas}
                          </p>

                          {/* Dados Técnicos e Normas Sanitizadas */}
                          {incluirDadosTecnicos && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/80 text-[11px]">
                              <div>
                                <span className="text-slate-400 block font-bold text-[9px] uppercase">
                                  Qualidade do Aço
                                </span>
                                <span className="font-semibold text-slate-800">
                                  {p.qualidadeAco}
                                </span>
                              </div>

                              {incluirNormas && (
                                <div>
                                  <span className="text-slate-400 block font-bold text-[9px] uppercase">
                                    Norma Técnica
                                  </span>
                                  <span className="font-semibold text-slate-800">
                                    {p.normaTecnica}
                                  </span>
                                </div>
                              )}

                              {incluirPesos && p.pesoTeoricoKgM && (
                                <div>
                                  <span className="text-slate-400 block font-bold text-[9px] uppercase">
                                    Peso Teórico
                                  </span>
                                  <span className="font-semibold text-slate-800">
                                    {p.pesoTeoricoKgM.toLocaleString('pt-BR', {
                                      minimumFractionDigits: 2,
                                    })}{' '}
                                    kg/m
                                  </span>
                                </div>
                              )}

                              <div>
                                <span className="text-slate-400 block font-bold text-[9px] uppercase">
                                  Comprimento
                                </span>
                                <span className="font-semibold text-slate-800">
                                  {p.comprimento}
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-100">
                            <strong>Aplicações Típicas:</strong> {p.aplicacao}
                          </div>
                        </div>
                      ))}

                    {/* Seção de Cross Sell Sugerido ("Outras Soluções CIAFAL") */}
                    {incluirCrossSell &&
                      crossSellProdutos.length > 0 &&
                      paginaAtual === totalPaginas && (
                        <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 space-y-3 mt-4">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-purple-700" />
                            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900">
                              {catalogo.configuracao.tituloSecaoCrossSell ||
                                'Outras Soluções Complementares CIAFAL'}
                            </h4>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {crossSellProdutos.map((cs) => (
                              <div
                                key={cs.id}
                                className="p-2.5 bg-white rounded-lg border border-purple-100 flex flex-col justify-between"
                              >
                                <div className="font-bold text-slate-900">
                                  {cs.descricaoComercial}
                                </div>
                                <div className="text-[11px] text-slate-500 font-mono mt-1">
                                  {cs.codigo} · {cs.normaTecnica}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>

                  {/* Rodapé Interno com Numeração */}
                  <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                    <span>CIAFAL FERRO & AÇO · Catálogo Comercial {catalogo.codigoVersao}</span>
                    <span>
                      Página {paginaAtual} de {totalPaginas}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ABA 2: GERENCIAMENTO DE ITENS E ORDENAÇÃO */}
          {activeTab === 'produtos' && (
            <div className="w-full max-w-3xl space-y-4 animate-fade-in">
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Organização dos Produtos no Catálogo
                </h3>
                <p className="text-xs text-slate-500">
                  Reordene os materiais para priorizar itens de maior interesse do cliente ou remova
                  produtos desnecessários antes de enviar.
                </p>
              </div>

              <div className="space-y-2">
                {produtos.map((p, idx) => (
                  <div
                    key={p.id}
                    className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3 shadow-2xs hover:border-[#003A70]/30 transition-all text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-[11px]">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{p.descricaoComercial}</span>
                          <span className="font-mono text-slate-500 text-[10px]">{p.codigo}</span>
                        </div>
                        <span className="text-[11px] text-slate-500 block">
                          {p.linha} · {p.dimensao} · {p.qualidadeAco}
                        </span>
                        {p.motivoRecomendacaoInterna && (
                          <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded font-medium inline-block mt-0.5">
                            💡 {p.motivoRecomendacaoInterna}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-lg"
                        disabled={idx === 0}
                        onClick={() => handleMoverProduto(idx, 'up')}
                        title="Mover para cima"
                      >
                        <MoveUp className="w-3.5 h-3.5 text-slate-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-lg"
                        disabled={idx === produtos.length - 1}
                        onClick={() => handleMoverProduto(idx, 'down')}
                        title="Mover para baixo"
                      >
                        <MoveDown className="w-3.5 h-3.5 text-slate-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        onClick={() => handleRemoverProduto(idx)}
                        title="Remover do catálogo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {crossSellProdutos.length > 0 && (
                <div className="pt-4 space-y-2">
                  <h4 className="text-xs font-bold uppercase text-purple-900 tracking-wider">
                    Itens Complementares Sugeridos (Cross Sell)
                  </h4>
                  {crossSellProdutos.map((cs, idx) => (
                    <div
                      key={cs.id}
                      className="p-3 bg-purple-50/50 rounded-xl border border-purple-200 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900">{cs.descricaoComercial}</span>
                        <span className="text-[11px] text-purple-700 block">
                          {cs.codigo} · {cs.motivoRecomendacaoInterna}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-rose-600"
                        onClick={() => handleRemoverCrossSell(idx)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ABA 3: CONFIGURAÇÃO DE APARÊNCIA E DADOS TÉCNICOS */}
          {activeTab === 'config' && (
            <div className="w-full max-w-2xl bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 text-xs animate-fade-in">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Customização da Apresentação do Catálogo
                </h3>
                <p className="text-slate-500">
                  Ative ou oculte elementos técnicos conforme o perfil do destinatário.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Modo de Apresentação</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={modo === 'COMERCIAL' ? 'default' : 'outline'}
                      onClick={() => setModo('COMERCIAL')}
                      className={`flex-1 text-xs h-8 ${modo === 'COMERCIAL' ? 'bg-[#003A70] text-white' : ''}`}
                    >
                      Modo Comercial (Visual)
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={modo === 'TECNICO' ? 'default' : 'outline'}
                      onClick={() => setModo('TECNICO')}
                      className={`flex-1 text-xs h-8 ${modo === 'TECNICO' ? 'bg-[#003A70] text-white' : ''}`}
                    >
                      Modo Técnico (Completo)
                    </Button>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Validade da Proposta</Label>
                  <Input
                    type="number"
                    defaultValue={catalogo.configuracao.validadeDias}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block">
                      Capa Institucional CIAFAL
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Inclui logotipo oficial, identificação do cliente e consultor
                    </span>
                  </div>
                  <Switch checked={incluirCapa} onCheckedChange={setIncluirCapa} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block">Especificações Técnicas</span>
                    <span className="text-[11px] text-slate-500">
                      Mostra dimensões detalhadas, bitolas e características
                    </span>
                  </div>
                  <Switch
                    checked={incluirDadosTecnicos}
                    onCheckedChange={setIncluirDadosTecnicos}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block">Normas Técnicas Oficiais</span>
                    <span className="text-[11px] text-slate-500">
                      Normas ASTM / NBR / ABNT de conformidade
                    </span>
                  </div>
                  <Switch checked={incluirNormas} onCheckedChange={setIncluirNormas} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block">
                      Pesos Teóricos e Unidades SI
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Exibe pesos nominais padronizados em kg/m e t
                    </span>
                  </div>
                  <Switch checked={incluirPesos} onCheckedChange={setIncluirPesos} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block">
                      Recomendações Complementares (Cross Sell)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Seção final com produtos sugeridos sem expor score de IA
                    </span>
                  </div>
                  <Switch checked={incluirCrossSell} onCheckedChange={setIncluirCrossSell} />
                </div>
              </div>
            </div>
          )}

          {/* ABA 4: ENVIO POR E-MAIL OU WHATSAPP COM REGISTRO NO CRM */}
          {activeTab === 'enviar' && (
            <div className="w-full max-w-2xl bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 text-xs animate-fade-in">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  Enviar Catálogo via Canal Corporativo
                </h3>
                <p className="text-slate-500">
                  O envio será registrado na timeline do cliente e congelará esta versão para
                  auditoria.
                </p>
              </div>

              {/* Seletor de Canal */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCanalEnvio('WHATSAPP')}
                  className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                    canalEnvio === 'WHATSAPP'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Share2 className="w-5 h-5 text-emerald-600" />
                  <div className="text-left">
                    <span className="block font-bold">WhatsApp Oficial</span>
                    <span className="text-[10px] text-slate-500">Omnichannel Corporativo</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setCanalEnvio('EMAIL')}
                  className={`p-3 rounded-xl border flex items-center gap-3 transition-all ${
                    canalEnvio === 'EMAIL'
                      ? 'bg-sky-50 border-[#003A70] text-[#003A70] font-bold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Mail className="w-5 h-5 text-[#003A70]" />
                  <div className="text-left">
                    <span className="block font-bold">E-mail Corporativo</span>
                    <span className="text-[10px] text-slate-500">
                      Com anexo em PDF de alta resolução
                    </span>
                  </div>
                </button>
              </div>

              {/* Destinatário */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Nome do Destinatário</Label>
                  <Input
                    value={destinatarioNome}
                    onChange={(e) => setDestinatarioNome(e.target.value)}
                    placeholder="Ex: Carlos Oliveira"
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">
                    {canalEnvio === 'WHATSAPP' ? 'Número WhatsApp' : 'E-mail Corporativo'}
                  </Label>
                  <Input
                    value={destinatarioContato}
                    onChange={(e) => setDestinatarioContato(e.target.value)}
                    placeholder={
                      canalEnvio === 'WHATSAPP' ? '(31) 98765-4321' : 'compras@empresa.com.br'
                    }
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* Mensagem Editável */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">
                  Mensagem Comercial Editável
                </Label>
                <Textarea
                  rows={5}
                  value={mensagemEnvio}
                  onChange={(e) => setMensagemEnvio(e.target.value)}
                  className="text-xs rounded-xl font-sans"
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2 text-[11px] text-blue-900">
                <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0" />
                <span>
                  <strong>Garantia de Governança:</strong> Este catálogo não contém dados internos
                  de margem, custo ou estoque global. Apenas dados técnicos e comerciais oficiais
                  serão enviados.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="h-8 text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  disabled={enviando || !destinatarioContato.trim()}
                  onClick={handleConfirmarEnvio}
                  className="h-8 text-xs font-bold bg-[#003A70] text-white hover:bg-[#002850] gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {enviando
                    ? 'Enviando...'
                    : `Confirmar Envio por ${canalEnvio === 'EMAIL' ? 'E-mail' : 'WhatsApp'}`}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer do Modal */}
        <DialogFooter className="p-3 bg-white border-t border-slate-200 flex flex-row items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            Status: <strong className="text-slate-800">{catalogo.status}</strong> · Versão:{' '}
            <strong className="text-slate-800">{catalogo.codigoVersao}</strong>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs"
            >
              Fechar
            </Button>
            <Button
              size="sm"
              onClick={() => setActiveTab('enviar')}
              className="h-8 text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              Enviar Catálogo
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
