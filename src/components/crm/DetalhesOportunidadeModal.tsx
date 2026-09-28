import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
  TrendingUp,
  Building2,
  Calendar,
  Layers,
  DollarSign,
  Scale,
  Clock,
  ShieldCheck,
  FileSpreadsheet,
  ArrowRight,
  History,
  AlertTriangle,
  User,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import {
  AdvancedOpportunity,
  ESTAGIOS_OPORTUNIDADE_CIAFAL,
  EstagioOportunidadeCiafal,
  opportunityLeadService,
} from '@/services/opportunity_lead_service'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface DetalhesOportunidadeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  opportunity: AdvancedOpportunity | null
  onUpdate?: (updated: AdvancedOpportunity) => void
  usuarioAtualNome?: string
}

export function DetalhesOportunidadeModal({
  open,
  onOpenChange,
  opportunity,
  onUpdate,
  usuarioAtualNome = 'Carlos Mendonça',
}: DetalhesOportunidadeModalProps) {
  const navigate = useNavigate()
  const [selectedStage, setSelectedStage] = useState<EstagioOportunidadeCiafal | ''>('')
  const [motivoMudanca, setMotivoMudanca] = useState('')
  const [isUpdatingStage, setIsUpdatingStage] = useState(false)

  if (!opportunity) return null

  const currentStageCiafal: EstagioOportunidadeCiafal = opportunity.estagioCiafal || 'especulacao'

  const currentStageObj =
    ESTAGIOS_OPORTUNIDADE_CIAFAL.find((s) => s.id === currentStageCiafal) ||
    ESTAGIOS_OPORTUNIDADE_CIAFAL[0]

  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    })
  }

  // Regra 11: Gerar Cotação a partir de Oportunidade
  const handleGerarCotacao = () => {
    onOpenChange(false)
    toast.success(
      `Encaminhando dados da oportunidade de ${opportunity.clienteNome} para Nova Cotação!`,
    )
    navigate('/crm/cotacoes/nova', {
      state: {
        clienteId: opportunity.clienteId,
        codigoSap: opportunity.clienteSap,
        razaoSocial: opportunity.clienteNome,
        vendedorNome: opportunity.vendedorNome,
        grupoMercadoriaSugerido: opportunity.grupoMercadoria,
        quantidadeEstimadaSugerida: opportunity.quantidadeEstimadaTons,
        precoEstimadoReferencia: opportunity.precoEstimadoPorTon,
        observacoesOrigem: `Oportunidade Funil CIAFAL (${opportunity.numeroSequencial || opportunity.id}) - Grupo: ${opportunity.grupoMercadoria || 'Geral'}. ${opportunity.observacoes || ''}`,
        origem: 'oportunidade_funil',
        opportunity_id: opportunity.numeroSequencial || opportunity.id,
        opportunity_number: opportunity.numeroSequencial,
      },
    })
  }

  const handleMudarEstagio = () => {
    if (!selectedStage || selectedStage === currentStageCiafal) return

    setIsUpdatingStage(true)
    try {
      const updated = opportunityLeadService.advanceOpportunityStage(
        opportunity.id,
        selectedStage as EstagioOportunidadeCiafal,
        usuarioAtualNome,
        motivoMudanca.trim() || undefined,
      )

      toast.success(
        `Oportunidade avançada para o estágio: "${
          ESTAGIOS_OPORTUNIDADE_CIAFAL.find((s) => s.id === selectedStage)?.label
        }"!`,
      )
      setSelectedStage('')
      setMotivoMudanca('')
      onUpdate?.(updated)
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar estágio')
    } finally {
      setIsUpdatingStage(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl rounded-3xl bg-white p-0 overflow-hidden shadow-2xl border-slate-200">
        {/* Header CIAFAL */}
        <div className="bg-gradient-to-r from-[#003A70] to-sky-950 text-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-sm">
                <TrendingUp className="w-6 h-6 text-sky-300" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <DialogTitle className="font-serif text-xl font-bold text-white tracking-tight">
                    {opportunity.clienteNome}
                  </DialogTitle>
                  <Badge className="bg-sky-400 text-slate-950 font-bold text-[10px] border-none font-mono">
                    SAP {opportunity.clienteSap}
                  </Badge>
                  <Badge className="bg-white/20 text-white font-mono font-bold text-[10px] border-none">
                    {opportunity.numeroSequencial || opportunity.id}
                  </Badge>
                  <Badge className={cn('text-[10px] font-bold border', currentStageObj.badgeClass)}>
                    {currentStageObj.label}
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-sky-100 font-sans mt-0.5">
                  {opportunity.titulo}
                </DialogDescription>
              </div>
            </div>

            {/* BOTÃO GERAR COTAÇÃO (Regra 11) */}
            <Button
              size="sm"
              onClick={handleGerarCotacao}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs gap-1.5 rounded-xl shadow-md shrink-0"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>GERAR COTAÇÃO</span>
            </Button>
          </div>

          {/* Vínculo de cotação relacionada, se já existir */}
          {opportunity.cotacaoRelacionadaId && (
            <div className="mt-2 pt-2 border-t border-white/15 flex items-center gap-2 text-xs">
              <span className="text-sky-200">Cotação vinculada:</span>
              <Badge className="bg-white text-[#003A70] font-mono font-bold text-[11px] border-none">
                {opportunity.cotacaoRelacionadaId}
              </Badge>
            </div>
          )}
        </div>

        {/* Corpo com Grid de Informações */}
        <div className="p-5 max-h-[75vh] overflow-y-auto space-y-5 text-xs">
          {/* CARDS DE ESTIMATIVAS & VALOR POTENCIAL */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                <Layers className="w-3 h-3 text-primary" /> Grupo
              </span>
              <strong
                className="text-slate-800 text-xs block truncate"
                title={opportunity.grupoMercadoria}
              >
                {opportunity.grupoMercadoria || 'Não definido'}
              </strong>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                <Scale className="w-3 h-3 text-primary" /> Qtd Estimada
              </span>
              <strong className="text-slate-800 text-xs block">
                {opportunity.quantidadeEstimadaTons !== null &&
                opportunity.quantidadeEstimadaTons !== undefined &&
                opportunity.quantidadeEstimadaTons > 0
                  ? `${opportunity.quantidadeEstimadaTons} t`
                  : 'Não informada'}
              </strong>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-primary" /> Preço Estimado
              </span>
              <strong className="text-slate-800 text-xs block">
                {opportunity.precoEstimadoPorTon !== null &&
                opportunity.precoEstimadoPorTon !== undefined &&
                opportunity.precoEstimadoPorTon > 0
                  ? `R$ ${opportunity.precoEstimadoPorTon.toLocaleString('pt-BR')}/t`
                  : 'Não informado'}
              </strong>
            </div>

            <div className="bg-sky-50/80 p-3 rounded-2xl border border-sky-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#003A70] flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> Valor Potencial
              </span>
              <strong className="text-[#003A70] text-sm font-bold font-serif block">
                {opportunity.valorPotencialCalculado !== null &&
                opportunity.valorPotencialCalculado !== undefined &&
                opportunity.valorPotencialCalculado > 0
                  ? formatBRL(opportunity.valorPotencialCalculado)
                  : 'Não estimado'}
              </strong>
            </div>
          </div>

          {/* DADOS COMPLEMENTARES */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/60 p-3 rounded-2xl border border-slate-200">
            <div>
              <span className="text-[10px] text-muted-foreground block">Previsão Compra:</span>
              <strong className="text-slate-800 capitalize">
                {opportunity.previsaoCompra
                  ? opportunity.previsaoCompra.replace(/_/g, ' ')
                  : 'Sem previsão'}
              </strong>
            </div>

            <div>
              <span className="text-[10px] text-muted-foreground block">Probabilidade:</span>
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px] font-bold capitalize mt-0.5',
                  opportunity.probabilidadeClassificacao === 'alta'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : opportunity.probabilidadeClassificacao === 'media'
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-slate-100 text-slate-700 border-slate-300',
                )}
              >
                {opportunity.probabilidadeClassificacao || 'baixa'} ({opportunity.probabilidade}%)
              </Badge>
            </div>

            <div>
              <span className="text-[10px] text-muted-foreground block">Origem:</span>
              <strong className="text-slate-800 capitalize">
                {opportunity.origemOportunidade
                  ? opportunity.origemOportunidade.replace(/_/g, ' ')
                  : 'Contato Vendedor'}
              </strong>
            </div>

            <div>
              <span className="text-[10px] text-muted-foreground block">Responsável:</span>
              <strong className="text-slate-800">
                {opportunity.vendedorNome || 'Carlos Mendonça'}
              </strong>
            </div>
          </div>

          {/* OBSERVAÇÕES */}
          {opportunity.observacoes && (
            <div className="bg-amber-50/60 border border-amber-200 p-3 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold uppercase text-amber-900 tracking-wider">
                Observações / Histórico Comercial:
              </span>
              <p className="text-xs text-amber-950 whitespace-pre-wrap">
                {opportunity.observacoes}
              </p>
            </div>
          )}

          {/* MUDANÇA RÁPIDA DE ESTÁGIO (1 A 10) */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <strong className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ArrowRight className="w-4 h-4 text-[#003A70]" />
                Avançar Estágio Comercial CIAFAL
              </strong>
              <span className="text-[11px] text-muted-foreground">
                Estágio atual: <strong>{currentStageObj.label}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Select
                  value={selectedStage}
                  onValueChange={(v) => setSelectedStage(v as EstagioOportunidadeCiafal)}
                >
                  <SelectTrigger className="h-9 text-xs rounded-xl bg-white">
                    <SelectValue placeholder="Selecione o novo estágio" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {ESTAGIOS_OPORTUNIDADE_CIAFAL.map((st) => (
                      <SelectItem
                        key={st.id}
                        value={st.id}
                        disabled={st.id === currentStageCiafal}
                        className="text-xs"
                      >
                        {st.label} {st.isSaida ? '(Saída)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleMudarEstagio}
                  disabled={
                    !selectedStage || selectedStage === currentStageCiafal || isUpdatingStage
                  }
                  className="h-9 text-xs font-semibold bg-[#003A70] hover:bg-[#002d57] text-white rounded-xl px-4 w-full sm:w-auto"
                >
                  {isUpdatingStage ? 'Atualizando...' : 'Confirmar Mudança'}
                </Button>
              </div>
            </div>

            {selectedStage === 'perdida' && (
              <div className="space-y-1 animate-in fade-in-50">
                <span className="text-[11px] font-semibold text-rose-800">
                  Motivo da Perda (Auditoria Obrigatória):
                </span>
                <Textarea
                  placeholder="Ex: Preço da Gerdau 5% menor, cliente cancelou obra..."
                  rows={2}
                  value={motivoMudanca}
                  onChange={(e) => setMotivoMudanca(e.target.value)}
                  className="text-xs rounded-xl bg-white resize-none border-rose-300"
                />
              </div>
            )}
          </div>

          {/* TRILHA DE AUDITORIA COMPLETA (Regra 14) */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <strong className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Trilha de Auditoria & Rastreabilidade
              </strong>
              <span className="text-[10px] text-muted-foreground">
                {(opportunity.historicoAuditoria || []).length} registros
              </span>
            </div>

            <div className="space-y-2 max-h-44 overflow-y-auto">
              {(opportunity.historicoAuditoria || []).length === 0 ? (
                <div className="p-3 text-center text-[11px] text-muted-foreground bg-slate-50 rounded-xl border border-dashed">
                  Nenhum registro de auditoria gravado.
                </div>
              ) : (
                (opportunity.historicoAuditoria || []).map((aud, i) => (
                  <div
                    key={aud.id || i}
                    className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-[11px] space-y-1"
                  >
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span className="font-semibold text-slate-700 flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" /> {aud.usuario}
                      </span>
                      <span className="font-mono">{aud.dataHora}</span>
                    </div>
                    <div className="font-medium text-slate-900">{aud.acao}</div>
                    {aud.detalhe && <p className="text-slate-600 text-[10px]">{aud.detalhe}</p>}
                    {aud.motivoPerda && (
                      <p className="text-rose-700 font-semibold text-[10px]">
                        Motivo de Perda: {aud.motivoPerda}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate(`/crm/${opportunity.clienteId}`)}
            className="h-8 text-xs rounded-xl"
          >
            <Building2 className="w-3.5 h-3.5 mr-1 text-[#003A70]" /> Visão Cliente 360º
          </Button>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs bg-slate-800 hover:bg-slate-900 text-white rounded-xl"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
