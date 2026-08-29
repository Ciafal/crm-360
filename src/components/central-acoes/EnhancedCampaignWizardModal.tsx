import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles,
  Send,
  Eye,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Layers,
  Split,
  MessageSquare,
  Building2,
  Users,
  TrendingUp,
} from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { CampaignChannel, CampaignType } from '@/types/commercial_execution'
import { CustomerManagementItem } from '@/types/customer_management'
import { campaignService } from '@/services/campaign_service'

export interface EnhancedCampaignWizardModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientesSelecionados: CustomerManagementItem[]
  tipoCampanha?: CampaignType
  produtosIniciais?: Array<{
    codigo: string
    descricao: string
    familia: string
    estoqueDisponivelTons: number
    precoReferenciaKg: number
    diasParado?: number
  }>
  onCampaignCreated?: () => void
}

export function EnhancedCampaignWizardModal({
  open,
  onOpenChange,
  clientesSelecionados,
  tipoCampanha = 'reativacao_sem_compra',
  produtosIniciais = [],
  onCampaignCreated,
}: EnhancedCampaignWizardModalProps) {
  // Bloco 1: IDENTIFICAÇÃO
  const [titulo, setTitulo] = useState(
    tipoCampanha === 'estoque_parado'
      ? 'Campanha Oportunidade Pátio — Perfis & Chapas CIAFAL'
      : tipoCampanha === 'cross_sell'
        ? 'Campanha Cross-Sell — Chapas A36 & Perfis Estruturais'
        : 'Campanha Reativação Base Inativa — Q4 Siderurgia',
  )
  const [descricao, setDescricao] = useState(
    'Campanha orientada por IA com segmentação de clientes e acompanhamento do funil até pedido de venda.',
  )
  const [responsavelNome, setResponsavelNome] = useState('Carlos Mendonça (Gestor Comercial)')

  // Bloco 2: PÚBLICO & SEGMENTAÇÃO
  const [segmentoAlvo, setSegmentoAlvo] = useState('Todos os Segmentos')
  const [regionalAlvo, setRegionalAlvo] = useState('Minas Gerais (RMBH & Vale do Aço)')
  const [diasSemCompraMin, setDiasSemCompraMin] = useState(45)

  // Bloco 3: CANAL
  const [canal, setCanal] = useState<CampaignChannel>('whatsapp')

  // Bloco 4: TIPO DE CAMPANHA
  const [tipo, setTipo] = useState<CampaignType>(tipoCampanha)

  // Bloco 5: A/B TEST & MENSAGENS
  const [isAbTestActive, setIsAbTestActive] = useState(true)
  const [abSplitMode, setAbSplitMode] = useState<'50_50' | 'amostra_vencedora'>('50_50')
  const [sampleSizePercent, setSampleSizePercent] = useState(20)

  const [templateMensagemA, setTemplateMensagemA] = useState(
    'Olá, {{contato_nome}}! Aqui é o {{vendedor_nome}} da CIAFAL Ferro & Aço. Identificamos uma condição diferenciada para seu estoque de {{produto_sugerido}} com entrega prioritária em {{cliente_cidade}}. Gostaria de receber nossa cotação atualizada?',
  )

  const [templateMensagemB, setTemplateMensagemB] = useState(
    'Prezado(a) {{contato_nome}}, notamos que sua última compra de aço foi há {{dias_sem_compra}} dias. Liberamos preços direto de usina para {{produto_sugerido}} com pronta entrega no pátio CIAFAL. Podemos confirmar os itens para cotação?',
  )

  const [catalogoTipo, setCatalogoTipo] = useState<
    'nenhum' | 'catalogo_geral_ciafal' | 'catalogo_personalizado_ia'
  >('catalogo_personalizado_ia')

  const [produtosVinculados, setProdutosVinculados] = useState(produtosIniciais)
  const [isExecuting, setIsExecuting] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)

  // Estimativas de Elegibilidade e Supressão
  const estimatedSuppression = Math.round(clientesSelecionados.length * 0.08)
  const eligibleCount = Math.max(0, clientesSelecionados.length - estimatedSuppression)

  // Amostra de prévia
  const sampleClient = clientesSelecionados[0]
  const sampleContactName =
    sampleClient?.datasImportantes?.[0]?.nomeContato ||
    sampleClient?.contatosHistorico?.[0]?.autor ||
    sampleClient?.nomeFantasia ||
    'Comprador'

  const samplePreviewTextA = sampleClient
    ? templateMensagemA
        .replace(/{{contato_nome}}/g, sampleContactName)
        .replace(
          /{{cliente_nome}}/g,
          sampleClient.nomeFantasia || sampleClient.razaoSocial || 'Cliente',
        )
        .replace(/{{cliente_cidade}}/g, sampleClient.cidade || 'Belo Horizonte')
        .replace(/{{vendedor_nome}}/g, 'Carlos Mendonça')
        .replace(/{{produto_sugerido}}/g, produtosVinculados[0]?.descricao || 'Perfis e Chapas A36')
        .replace(/{{dias_sem_compra}}/g, String(sampleClient.diasSemCompra || 65))
    : ''

  const samplePreviewTextB = sampleClient
    ? templateMensagemB
        .replace(/{{contato_nome}}/g, sampleContactName)
        .replace(
          /{{cliente_nome}}/g,
          sampleClient.nomeFantasia || sampleClient.razaoSocial || 'Cliente',
        )
        .replace(/{{cliente_cidade}}/g, sampleClient.cidade || 'Belo Horizonte')
        .replace(/{{vendedor_nome}}/g, 'Carlos Mendonça')
        .replace(/{{produto_sugerido}}/g, produtosVinculados[0]?.descricao || 'Perfis e Chapas A36')
        .replace(/{{dias_sem_compra}}/g, String(sampleClient.diasSemCompra || 65))
    : ''

  const handleTriggerConfirmation = () => {
    if (clientesSelecionados.length === 0) {
      toast.error('Selecione ao menos um cliente para criar a campanha.')
      return
    }
    setConfirmDialogOpen(true)
  }

  const handleFinalDispatch = () => {
    setIsExecuting(true)
    setConfirmDialogOpen(false)

    try {
      const { campaign, queueCount, suprimidosCount } = campaignService.createAndQueueCampaign({
        titulo,
        descricao,
        tipo,
        canal,
        segmentoAlvo,
        regionalAlvo,
        diasSemCompraMin,
        produtosVinculados:
          produtosVinculados.length > 0
            ? produtosVinculados
            : [
                {
                  codigo: 'PER-W-200-22',
                  descricao: 'Perfil W 200 x 22.5 kg/m ASTM A572',
                  familia: 'Perfis W',
                  estoqueDisponivelTons: 25.0,
                  precoReferenciaKg: 8.2,
                },
              ],
        catalogoTipo,
        templateMensagemA,
        templateMensagemB: isAbTestActive ? templateMensagemB : undefined,
        isAbTestActive,
        clientesAlvo: clientesSelecionados,
        usuarioExecutor: responsavelNome,
        usuarioExecutorId: 'vend-01',
      })

      toast.success(`Campanha "${campaign.titulo}" criada com sucesso!`, {
        description: `${queueCount} disparos enfileirados. ${suprimidosCount} clientes suprimidos por conformidade LGPD.`,
      })

      onOpenChange(false)
      if (onCampaignCreated) onCampaignCreated()
    } catch (err) {
      toast.error('Erro ao registrar a campanha comercial.')
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl bg-slate-950 text-slate-100 border-slate-800 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-sky-500/20 text-sky-400 rounded-2xl border border-sky-500/30">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <DialogTitle className="font-serif text-xl font-bold text-white flex items-center gap-2">
                  Assistente de Criação de Campanhas Comerciais
                  <Badge className="bg-amber-500 text-slate-950 text-[10px] font-bold">
                    {clientesSelecionados.length} Clientes Selecionados
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400">
                  Estrutura completa: Identificação → Público → Canal → Tipo → A/B Test → Funil até
                  Venda
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-5 py-3 text-xs">
            {/* BLOCO 1: IDENTIFICAÇÃO */}
            <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-2xl space-y-3">
              <span className="text-[10px] uppercase font-bold text-sky-400 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> 1. Bloco de Identificação da Campanha
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-slate-300 font-semibold block">
                    Nome / Título da Campanha
                  </label>
                  <Input
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    className="bg-slate-950 border-slate-700 text-white h-8 rounded-xl text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold block">
                    Responsável Comercial
                  </label>
                  <Input
                    value={responsavelNome}
                    onChange={(e) => setResponsavelNome(e.target.value)}
                    className="bg-slate-950 border-slate-700 text-white h-8 rounded-xl text-xs"
                  />
                </div>
                <div className="sm:col-span-3 space-y-1">
                  <label className="text-slate-300 font-semibold block">
                    Descrição / Objetivo Comercial
                  </label>
                  <Input
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    className="bg-slate-950 border-slate-700 text-white h-8 rounded-xl text-xs"
                  />
                </div>
              </div>
            </div>

            {/* BLOCO 2 & 3 & 4: PÚBLICO, CANAL E TIPO */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Bloco Tipo */}
              <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-2xl space-y-2">
                <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" /> 2. Tipo de Campanha
                </span>
                <Select value={tipo} onValueChange={(v) => setTipo(v as CampaignType)}>
                  <SelectTrigger className="bg-slate-950 border-slate-700 text-white h-8 rounded-xl text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 text-white border-slate-800 text-xs">
                    <SelectItem value="reativacao_sem_compra">Reativação de Inativos</SelectItem>
                    <SelectItem value="cross_sell">Cross-Sell / Venda Cruzada</SelectItem>
                    <SelectItem value="estoque_parado">Liquidação de Estoque Parado</SelectItem>
                    <SelectItem value="lancamento_catalogo">Lançamento de Catálogo</SelectItem>
                    <SelectItem value="resgate_risco">Resgate de Clientes em Risco</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-slate-400">
                  Direciona as regras e pesos da IA na conversão.
                </p>
              </div>

              {/* Bloco Canal */}
              <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-2xl space-y-2">
                <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> 3. Canal de Disparo
                </span>
                <Select value={canal} onValueChange={(v) => setCanal(v as CampaignChannel)}>
                  <SelectTrigger className="bg-slate-950 border-slate-700 text-white h-8 rounded-xl text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 text-white border-slate-800 text-xs">
                    <SelectItem value="whatsapp">
                      WhatsApp Business Oficial (Meta Cloud API)
                    </SelectItem>
                    <SelectItem value="email">E-mail Comercial Corporativo</SelectItem>
                    <SelectItem value="omnichannel">Omnichannel (WhatsApp + E-mail)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-slate-400">
                  Disparo homologado com rastreabilidade de entrega.
                </p>
              </div>

              {/* Bloco Público */}
              <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-2xl space-y-2">
                <span className="text-[10px] uppercase font-bold text-sky-400 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> 4. Filtro de Público
                </span>
                <Select value={segmentoAlvo} onValueChange={(v) => setSegmentoAlvo(v)}>
                  <SelectTrigger className="bg-slate-950 border-slate-700 text-white h-8 rounded-xl text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 text-white border-slate-800 text-xs">
                    <SelectItem value="Todos os Segmentos">Todos os Segmentos</SelectItem>
                    <SelectItem value="Caldeiraria & Estruturas">
                      Caldeiraria & Estruturas
                    </SelectItem>
                    <SelectItem value="Construção Civil">Construção Civil</SelectItem>
                    <SelectItem value="Revenda de Aço">Revenda & Distribuição</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-slate-400">
                  Segmentação inteligente com supressão LGPD.
                </p>
              </div>
            </div>

            {/* BLOCO 5: TESTE A/B AVANÇADO (50/50 OU AMOSTRA INICIAL + VENCEDORA) */}
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Split className="w-4 h-4 text-purple-400" />
                  <strong className="text-xs text-white">
                    Módulo de Experimentação A/B Comercial
                  </strong>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="enableAb"
                    checked={isAbTestActive}
                    onChange={(e) => setIsAbTestActive(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-purple-500 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                  />
                  <label
                    htmlFor="enableAb"
                    className="text-xs text-slate-300 font-semibold cursor-pointer"
                  >
                    Ativar Teste A/B
                  </label>
                </div>
              </div>

              {isAbTestActive && (
                <div className="space-y-3 pt-2 border-t border-slate-800 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                        Estratégia de Divisão da Base
                      </label>
                      <Select
                        value={abSplitMode}
                        onValueChange={(v) => setAbSplitMode(v as '50_50' | 'amostra_vencedora')}
                      >
                        <SelectTrigger className="bg-slate-950 border-slate-700 text-white h-8 rounded-xl text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 text-white border-slate-800 text-xs">
                          <SelectItem value="50_50">Divisão 50% / 50% em toda a base</SelectItem>
                          <SelectItem value="amostra_vencedora">
                            Amostra Inicial ({sampleSizePercent}%) + Vencedora para o restante
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300">
                      <strong className="text-purple-300 block mb-0.5">
                        Critério de Vitória Comercial:
                      </strong>
                      A mensagem vencedora é decidida por{' '}
                      <strong>Cotações Geradas + Pedidos Emitidos</strong> (não apenas taxa de
                      leitura).
                    </div>
                  </div>

                  {/* Mensagem A */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-300 font-semibold text-[11px]">
                      <span>Mensagem Variante A (Foco em Condição / Preço)</span>
                      <span className="text-[10px] text-slate-500 font-mono">50% dos disparos</span>
                    </div>
                    <Textarea
                      value={templateMensagemA}
                      onChange={(e) => setTemplateMensagemA(e.target.value)}
                      rows={2}
                      className="bg-slate-950 border-slate-700 text-white rounded-xl text-xs"
                    />
                  </div>

                  {/* Mensagem B */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-300 font-semibold text-[11px]">
                      <span>Mensagem Variante B (Foco em Prazo / Pronta Entrega)</span>
                      <span className="text-[10px] text-purple-400 font-mono">
                        50% dos disparos
                      </span>
                    </div>
                    <Textarea
                      value={templateMensagemB}
                      onChange={(e) => setTemplateMensagemB(e.target.value)}
                      rows={2}
                      className="bg-slate-950 border-slate-700 text-white rounded-xl text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* PRÉVIA VISUAL & GOVERNANÇA */}
            <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-sky-400 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" /> Prévia do Disparo & Resumo
                </span>
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px]">
                    {eligibleCount} Elegíveis
                  </Badge>
                  {estimatedSuppression > 0 && (
                    <Badge className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px]">
                      {estimatedSuppression} Suprimidos (LGPD / Bloqueio)
                    </Badge>
                  )}
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-200 text-xs italic">
                "{samplePreviewTextA}"
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-slate-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Disparo sujeito a confirmação explícita de segurança.</span>
            </span>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-9 text-xs border-slate-700 text-slate-300 hover:text-white rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleTriggerConfirmation}
                disabled={isExecuting || eligibleCount === 0}
                className="h-9 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl gap-1.5 shadow-md flex-1 sm:flex-none"
              >
                <Send className="w-4 h-4" />
                <span>Revisar e Disparar Campanha</span>
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CONFIRMAÇÃO OBRIGATÓRIA */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent className="bg-slate-950 text-slate-100 border-slate-800 rounded-3xl p-6">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="w-6 h-6 text-amber-400" />
              <AlertDialogTitle className="text-lg font-bold text-white">
                Dupla Confirmação de Disparo de Campanha
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-xs text-slate-300 space-y-2 pt-2">
              <p>
                Você está confirmando o lançamento da campanha <strong>"{titulo}"</strong> para{' '}
                <strong className="text-white">{eligibleCount} clientes elegíveis</strong> via{' '}
                <strong className="text-amber-400 uppercase">{canal}</strong>.
              </p>
              <p className="text-[11px] text-slate-400 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                • {estimatedSuppression} clientes foram suprimidos automaticamente para segurança de
                LGPD e bloqueios.
                <br />• O funil será rastreado automaticamente até a geração de cotações e pedidos
                SAP.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="border-t border-slate-800 pt-3">
            <AlertDialogCancel className="bg-slate-900 border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs h-9">
              Voltar e Ajustar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleFinalDispatch}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs h-9 gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmar e Iniciar Disparo</span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
