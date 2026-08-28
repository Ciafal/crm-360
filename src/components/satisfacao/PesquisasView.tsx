import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  SmilePlus,
  Send,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  PlusCircle,
  Copy,
  ExternalLink,
  Users,
  QrCode,
} from 'lucide-react'
import { CampanhaPesquisa, RespostaPesquisaCliente } from '@/types/satisfaction'
import { toast } from 'sonner'

interface PesquisasViewProps {
  campanhas: CampanhaPesquisa[]
  respostas: RespostaPesquisaCliente[]
  onOpenManualSurvey: () => void
  onSaveNewCampaign: (campanha: Partial<CampanhaPesquisa>) => void
}

export function PesquisasView({
  campanhas,
  respostas,
  onOpenManualSurvey,
  onSaveNewCampaign,
}: PesquisasViewProps) {
  const [newCampaignModalOpen, setNewCampaignModalOpen] = useState(false)
  const [campTitulo, setCampTitulo] = useState('')
  const [campPublico, setCampPublico] = useState('Clientes com faturamento > 20t/mês')
  const [campInicio, setCampInicio] = useState('2024-10-01')
  const [campFim, setCampFim] = useState('2024-12-31')

  const handleCreateCampaign = () => {
    if (!campTitulo) {
      toast.error('Informe o título da campanha de pesquisa.')
      return
    }

    onSaveNewCampaign({
      titulo: campTitulo,
      publicoAlvo: campPublico,
      periodoInicio: campInicio,
      periodoFim: campFim,
      status: 'ATIVA',
      totalEnviadas: 0,
      totalRespondidas: 0,
      taxaRespostaPct: 0,
      npsMedio: 0,
      csatMedio: 0,
    })

    toast.success('Campanha de pesquisa criada e ativada com sucesso!')
    setNewCampaignModalOpen(false)
    setCampTitulo('')
  }

  const handleCopyLink = (campanhaId: string) => {
    navigator.clipboard.writeText(`https://crm360.ciafal.com.br/pesquisa/${campanhaId}`)
    toast.success(
      'Link direto da pesquisa copiado para a área de transferência (WhatsApp / E-mail)!',
    )
  }

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-3xl bg-slate-900 border border-slate-800">
        <div>
          <h3 className="font-serif text-base font-bold text-white flex items-center gap-2">
            <SmilePlus className="w-5 h-5 text-emerald-400" />
            Módulo de Pesquisas de Satisfação (NPS & CSAT)
          </h3>
          <p className="text-xs text-slate-400">
            Disparos manuais, geração de links (WhatsApp/E-mail), detecção de divergência e
            questionários flexíveis.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={onOpenManualSurvey}
            className="h-8 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl gap-1.5 shadow-xs"
          >
            <Send className="w-3.5 h-3.5" /> Registrar Resposta Manual
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setNewCampaignModalOpen(true)}
            className="h-8 text-xs text-slate-200 border-slate-700 hover:bg-slate-800 rounded-xl gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" /> Nova Campanha
          </Button>
        </div>
      </div>

      {/* CARDS DE CAMPANHAS ATIVAS */}
      <div className="space-y-3">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
          Campanhas de Pesquisa Ativas
        </span>

        {campanhas.map((camp) => (
          <Card
            key={camp.id}
            className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-4 hover:border-slate-700 transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <strong className="text-sm font-bold text-white font-serif">{camp.titulo}</strong>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs">
                    {camp.status}
                  </Badge>
                </div>
                <span className="text-xs text-slate-400 block mt-1">
                  Público-alvo: {camp.publicoAlvo} · Período: {camp.periodoInicio} a{' '}
                  {camp.periodoFim}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopyLink(camp.id)}
                  className="h-8 text-xs text-slate-300 border-slate-700 hover:bg-slate-900 rounded-xl gap-1"
                >
                  <Copy className="w-3.5 h-3.5" /> Copiar Link
                </Button>
              </div>
            </div>

            {/* MÉTRICAS DA CAMPANHA */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">
                  Respostas Obtidas
                </span>
                <strong className="text-lg font-bold text-white block mt-0.5">
                  {camp.totalRespondidas} / {camp.totalEnviadas}
                </strong>
                <span className="text-[10px] text-emerald-400 font-semibold">
                  {camp.taxaRespostaPct}% taxa
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">
                  NPS Médio da Campanha
                </span>
                <strong className="text-lg font-bold text-emerald-400 block mt-0.5">
                  +{camp.npsMedio} pts
                </strong>
                <span className="text-[10px] text-slate-400">Zona de Excelência</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">CSAT Médio Geral</span>
                <strong className="text-lg font-bold text-sky-400 block mt-0.5">
                  {camp.csatMedio} / 5.0
                </strong>
                <span className="text-[10px] text-slate-400">Qualidade & Entrega</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase block">Perguntas Ativas</span>
                <strong className="text-lg font-bold text-white block mt-0.5">
                  {camp.perguntas.length} itens
                </strong>
                <span className="text-[10px] text-slate-400">NPS + 4 CSATs + Comentário</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* FEED DE RESPOSTAS RECENTES & DETECÇÃO DE DIVERGÊNCIA */}
      <div className="space-y-3">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
          Últimas Respostas Recebidas & Auditoria de Divergência
        </span>

        <div className="space-y-3">
          {respostas.map((resp) => (
            <Card
              key={resp.id}
              className={`p-4 rounded-3xl bg-slate-950 border space-y-2.5 ${
                resp.divergenciaDetectada
                  ? 'border-amber-500/50 bg-amber-950/10'
                  : 'border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <strong className="text-sm font-bold text-white">{resp.clienteNome}</strong>
                  <Badge variant="outline" className="text-[10px] bg-slate-900 text-slate-300">
                    SAP #{resp.clienteSap}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] bg-slate-900 text-sky-400">
                    Via {resp.canal}
                  </Badge>
                </div>

                <span className="text-[11px] text-slate-400">
                  {resp.respondenteNome} ({resp.respondenteCargo}) · {resp.dataResposta}
                </span>
              </div>

              {/* NOTAS */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[9px] text-slate-400 block">NPS</span>
                  <strong className="text-sm text-emerald-400">{resp.npsScore}/10</strong>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[9px] text-slate-400 block">Produto</span>
                  <strong className="text-sm text-white">{resp.qualidadeProdutoRating}/5</strong>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[9px] text-slate-400 block">Comercial</span>
                  <strong className="text-sm text-white">
                    {resp.atendimentoComercialRating}/5
                  </strong>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[9px] text-slate-400 block">Entrega</span>
                  <strong className="text-sm text-white">{resp.prazoEntregaRating}/5</strong>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[9px] text-slate-400 block">Geral</span>
                  <strong className="text-sm text-white">{resp.atendimentoGeralRating}/5</strong>
                </div>
              </div>

              {/* COMENTÁRIO LIVRE */}
              {resp.comentariosLivres && (
                <p className="text-xs text-slate-300 italic p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  "{resp.comentariosLivres}"
                </p>
              )}

              {/* DIVERGÊNCIA DETECTADA */}
              {resp.divergenciaDetectada && (
                <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-xs text-amber-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-amber-300">
                      Divergência Crítica Detectada pelo Motor:
                    </strong>
                    <span>{resp.divergenciaMotivo}</span>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* MODAL PARA NOVA CAMPANHA */}
      <Dialog open={newCampaignModalOpen} onOpenChange={setNewCampaignModalOpen}>
        <DialogContent className="max-w-md bg-slate-950 text-slate-100 border-slate-800 rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white font-serif">
              Criar Nova Campanha de Pesquisa
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Configure o público e o período de vigência para coleta de NPS e CSAT.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div>
              <Label className="text-xs text-slate-300">Título da Campanha</Label>
              <Input
                value={campTitulo}
                onChange={(e) => setCampTitulo(e.target.value)}
                placeholder="Ex: Pesquisa de Satisfação Q4 2024 - Construção Civil"
                className="bg-slate-900 border-slate-800 text-xs rounded-xl mt-1 text-white"
              />
            </div>

            <div>
              <Label className="text-xs text-slate-300">Público-Alvo</Label>
              <Input
                value={campPublico}
                onChange={(e) => setCampPublico(e.target.value)}
                placeholder="Ex: Clientes da Linha de Perfis Estruturais"
                className="bg-slate-900 border-slate-800 text-xs rounded-xl mt-1 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-slate-300">Data Início</Label>
                <Input
                  type="date"
                  value={campInicio}
                  onChange={(e) => setCampInicio(e.target.value)}
                  className="bg-slate-900 border-slate-800 text-xs rounded-xl mt-1 text-white"
                />
              </div>
              <div>
                <Label className="text-xs text-slate-300">Data Fim</Label>
                <Input
                  type="date"
                  value={campFim}
                  onChange={(e) => setCampFim(e.target.value)}
                  className="bg-slate-900 border-slate-800 text-xs rounded-xl mt-1 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setNewCampaignModalOpen(false)}
                className="text-xs text-slate-400"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleCreateCampaign}
                className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl"
              >
                Criar Campanha
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
