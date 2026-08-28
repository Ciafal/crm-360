// src/components/central-acoes/CampaignWizardModal.tsx
// Modal de Criação e Disparo de Campanhas Comerciais (Reativação e Estoque Parado) com Prévia Obrigatória, Dupla Confirmação, Supressão e Catálogo

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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sparkles,
  Send,
  MessageSquare,
  Mail,
  ShieldCheck,
  ShieldAlert,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Users,
  Eye,
  Info,
} from 'lucide-react'
import type { CampaignType, CampaignChannel } from '@/types/commercial_execution'
import type { CustomerManagementItem } from '@/types/customer_management'
import { campaignService } from '@/services/campaign_service'
import { toast } from 'sonner'

interface CampaignWizardModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tipoCampanha: CampaignType
  clientesSelecionados: any[]
  produtosVinculados?: Array<{
    codigo: string
    descricao: string
    familia: string
    estoqueDisponivelTons: number
    precoReferenciaKg: number
    diasParado?: number
  }>
  onCampaignCreated?: () => void
}

export function CampaignWizardModal({
  open,
  onOpenChange,
  tipoCampanha,
  clientesSelecionados,
  produtosVinculados = [],
  onCampaignCreated,
}: CampaignWizardModalProps) {
  const isEstoqueParado = tipoCampanha === 'estoque_parado'

  const [titulo, setTitulo] = useState(
    isEstoqueParado
      ? `Liquidação de Estoque Parado - ${produtosVinculados[0]?.descricao || 'Aços CIAFAL'}`
      : `Campanha de Reativação Comercial Sem Compra - ${new Date().toLocaleDateString('pt-BR')}`,
  )

  const [descricao, setDescricao] = useState(
    isEstoqueParado
      ? 'Apresentação de lote disponível em pátio para clientes com consumo e crédito aprovado.'
      : 'Campanha de resgate comercial para clientes com histórico de compras sem pedidos nos últimos ciclos.',
  )

  const [canal, setCanal] = useState<CampaignChannel>('whatsapp')
  const [catalogoTipo, setCatalogoTipo] = useState<
    'nenhum' | 'catalogo_geral_ciafal' | 'catalogo_personalizado_ia'
  >('catalogo_personalizado_ia')

  const [isAbTestActive, setIsAbTestActive] = useState(false)

  const defaultMsgA = isEstoqueParado
    ? 'Olá, {{contato_nome}}! Aqui é o {{vendedor_nome}} da CIAFAL Ferro & Aço. Temos um lote com disponibilidade imediata de {{produto_sugerido}} no pátio central. Conseguimos condições especiais de frete e prazo para {{cliente_cidade}}. Gostaria de receber o espelho do lote?'
    : 'Olá, {{contato_nome}}! Notamos que sua última compra de {{ultimo_produto}} na CIAFAL foi há {{dias_sem_compra}} dias. Preparamos uma condição comercial especial para reposição de {{produto_sugerido}} com entrega em até 48h em {{cliente_cidade}}. Segue nossa proposta anexa.'

  const defaultMsgB =
    'Prezado(a) {{contato_nome}}, a CIAFAL Ferro & Aço preparou uma oportunidade exclusiva de fornecimento de {{produto_sugerido}} com pronta retirada e garantia de rastreabilidade de usina. Podemos emitir uma cotação simulação?'

  const [templateMensagemA, setTemplateMensagemA] = useState(defaultMsgA)
  const [templateMensagemB, setTemplateMensagemB] = useState(defaultMsgB)

  // Dupla Confirmação para Disparo em Massa
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)

  // Supressão estimada
  const estimatedSuppression = clientesSelecionados.filter((c) => {
    const res = campaignService.checkSuppression(c.id, canal === 'omnichannel' ? 'whatsapp' : canal)
    return res.supresso
  }).length

  const eligibleCount = Math.max(0, clientesSelecionados.length - estimatedSuppression)

  // Prévia da mensagem com primeiro cliente
  const sampleClient = clientesSelecionados[0]
  const samplePreviewText = sampleClient
    ? templateMensagemA
        .replace(/{{contato_nome}}/g, sampleClient.contatoNome || 'Comprador')
        .replace(
          /{{cliente_nome}}/g,
          sampleClient.nomeFantasia || sampleClient.razaoSocial || 'Cliente',
        )
        .replace(/{{cliente_cidade}}/g, sampleClient.cidade || 'Belo Horizonte')
        .replace(/{{vendedor_nome}}/g, 'Carlos Mendonça')
        .replace(/{{produto_sugerido}}/g, produtosVinculados[0]?.descricao || 'Perfis e Chapas')
        .replace(/{{dias_sem_compra}}/g, String(sampleClient.diasSemCompra || 75))
        .replace(/{{ultimo_produto}}/g, 'Chapa Grossa 1/2"')
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
        tipo: tipoCampanha,
        canal,
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
        usuarioExecutor: 'Carlos Mendonça (Vendedor / Gestor)',
        usuarioExecutorId: 'vend-01',
      })

      toast.success(`Campanha "${campaign.titulo}" iniciada com sucesso!`, {
        description: `${queueCount} disparos enfileirados. ${suprimidosCount} clientes suprimidos por regras LGPD/Bloqueio.`,
      })

      onOpenChange(false)
      if (onCampaignCreated) onCampaignCreated()
    } catch (err) {
      toast.error('Erro ao registrar e enfileirar campanha.')
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl bg-slate-950 text-slate-100 border-slate-800 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-sky-500/20 text-sky-400 rounded-2xl border border-sky-500/30">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <DialogTitle className="font-serif text-xl font-bold text-white flex items-center gap-2">
                  {isEstoqueParado ? 'Campanha de Estoque Parado' : 'Campanha de Reativação'}
                  <Badge className="bg-amber-500 text-slate-950 text-[10px] font-bold">
                    {clientesSelecionados.length} Selecionados
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400">
                  Fluxo: Seleção → Validação de Supressão → Revisão de Mensagem → Dupla Confirmação
                  → Enfileiramento.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-3 text-xs">
            {/* 1. Título e Descrição */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Título da Campanha</label>
                <Input
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white h-9 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">
                  Canal Oficial de Disparo
                </label>
                <Select value={canal} onValueChange={(v) => setCanal(v as CampaignChannel)}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white h-9 rounded-xl text-xs">
                    <SelectValue placeholder="Canal" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 text-white border-slate-800">
                    <SelectItem value="whatsapp">
                      WhatsApp Business (Templates Meta Homologados)
                    </SelectItem>
                    <SelectItem value="email">E-mail Comercial (SMTP Corporativo)</SelectItem>
                    <SelectItem value="omnichannel">Omnichannel (WhatsApp + E-mail)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 2. Catálogo e Teste A/B */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Anexo de Catálogo</label>
                <Select value={catalogoTipo} onValueChange={(v) => setCatalogoTipo(v as any)}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white h-9 rounded-xl text-xs">
                    <SelectValue placeholder="Catálogo" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 text-white border-slate-800">
                    <SelectItem value="catalogo_personalizado_ia">
                      Catálogo Personalizado por IA (Principal + Cross-sell)
                    </SelectItem>
                    <SelectItem value="catalogo_geral_ciafal">
                      Catálogo Comercial Geral CIAFAL
                    </SelectItem>
                    <SelectItem value="nenhum">Sem anexo de catálogo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold block">Experimentação A/B</label>
                <div className="flex items-center gap-2 pt-1.5">
                  <input
                    type="checkbox"
                    id="abTest"
                    checked={isAbTestActive}
                    onChange={(e) => setIsAbTestActive(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-sky-500 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="abTest" className="text-slate-300 text-xs cursor-pointer">
                    Habilitar Teste A/B (50% Variante A / 50% Variante B)
                  </label>
                </div>
              </div>
            </div>

            {/* 3. Produtos Vinculados */}
            {produtosVinculados.length > 0 && (
              <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-amber-400 block">
                  Produtos em Destaque nesta Campanha:
                </span>
                <div className="flex flex-wrap gap-2">
                  {produtosVinculados.map((p) => (
                    <div
                      key={p.codigo}
                      className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-slate-200 flex items-center gap-2"
                    >
                      <strong className="text-sky-300">{p.descricao}</strong>
                      <span className="text-slate-500">·</span>
                      <span className="text-emerald-400 font-bold">
                        {p.estoqueDisponivelTons}t liberadas
                      </span>
                      {p.diasParado && (
                        <span className="text-amber-400">({p.diasParado} dias parado)</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Template da Mensagem A */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 font-semibold block">
                  Template da Mensagem (Variante A)
                </label>
                <span className="text-[10px] text-slate-500 font-mono">
                  Tags: {'{{contato_nome}}'}, {'{{produto_sugerido}}'}, {'{{cliente_cidade}}'}
                </span>
              </div>
              <Textarea
                value={templateMensagemA}
                onChange={(e) => setTemplateMensagemA(e.target.value)}
                rows={3}
                className="bg-slate-900 border-slate-700 text-white rounded-xl text-xs font-sans"
              />
            </div>

            {/* 5. Template da Mensagem B (se A/B ativado) */}
            {isAbTestActive && (
              <div className="space-y-1 animate-fade-in">
                <label className="text-slate-300 font-semibold block">
                  Template da Mensagem (Variante B)
                </label>
                <Textarea
                  value={templateMensagemB}
                  onChange={(e) => setTemplateMensagemB(e.target.value)}
                  rows={3}
                  className="bg-slate-900 border-slate-700 text-white rounded-xl text-xs font-sans"
                />
              </div>
            )}

            {/* 6. Prévia Obrigatória & Validação de Supressão */}
            <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-sky-400 font-bold text-xs">
                  <Eye className="w-4 h-4" />
                  <span>Prévia Obrigatória do Disparo</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px]">
                    {eligibleCount} Elegíveis
                  </Badge>
                  {estimatedSuppression > 0 && (
                    <Badge className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px]">
                      {estimatedSuppression} Suprimidos (LGPD/Bloqueio)
                    </Badge>
                  )}
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-200 text-xs italic font-sans leading-relaxed">
                "{samplePreviewText}"
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-slate-400 pt-1">
                <div>
                  <span className="block text-slate-500">Canal:</span>
                  <strong className="text-white capitalize">{canal}</strong>
                </div>
                <div>
                  <span className="block text-slate-500">Público Total:</span>
                  <strong className="text-white">{clientesSelecionados.length} clientes</strong>
                </div>
                <div>
                  <span className="block text-slate-500">Catálogo:</span>
                  <strong className="text-white">
                    {catalogoTipo === 'catalogo_personalizado_ia'
                      ? 'Personalizado IA'
                      : catalogoTipo === 'catalogo_geral_ciafal'
                        ? 'Geral CIAFAL'
                        : 'Nenhum'}
                  </strong>
                </div>
                <div>
                  <span className="block text-slate-500">Governança:</span>
                  <strong className="text-emerald-400">Opt-in Checado</strong>
                </div>
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

      {/* MODAL DE DUPLA CONFIRMAÇÃO OBRIGATÓRIA (Regra 15) */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent className="bg-slate-950 text-slate-100 border-slate-800 rounded-3xl p-6">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-amber-400">
              <AlertTriangle className="w-6 h-6 text-amber-400" />
              <AlertDialogTitle className="text-lg font-bold text-white">
                Dupla Confirmação Obrigatória de Disparo
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-xs text-slate-300 space-y-2 pt-2">
              <p>
                Você está prestes a disparar a campanha <strong>"{titulo}"</strong> para{' '}
                <strong className="text-white">{eligibleCount} clientes elegíveis</strong> via{' '}
                <strong className="text-amber-400 uppercase">{canal}</strong>.
              </p>
              <p className="text-[11px] text-slate-400 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                • {estimatedSuppression} clientes foram suprimidos automaticamente (respeito a LGPD,
                Opt-out e bloqueios comerciais).
                <br />• O disparo será processado em fila com taxa controlada de envio e
                idempotência ativa.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="border-t border-slate-800 pt-3">
            <AlertDialogCancel className="bg-slate-900 border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs h-9">
              Voltar e Editar
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
