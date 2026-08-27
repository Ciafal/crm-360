import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ActionStatusBadge } from './ActionStatusBadge'
import { PriorityBadge } from './PriorityBadge'
import { ABCBadge } from './ABCBadge'
import { DataSourceBadge } from './DataSourceBadge'
import {
  Sparkles,
  ArrowRight,
  Phone,
  MessageSquare,
  Calendar,
  Layers,
  TrendingUp,
  FileText,
  MapPin,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Send,
} from 'lucide-react'
import { AcaoDoDia, ActionExecutionEvidence } from '@/types/models'
import { formatCurrency, formatWeight } from '@/lib/utils'
import { globalActionEvidenceValidator } from '@/services/action_evidence_validator'
import { useToast } from '@/hooks/use-toast'

interface DailyActionCardProps {
  action: AcaoDoDia
  onExecute?: (action: AcaoDoDia) => void
  onOpenCustomer360?: (customerId: string) => void
  onActionUpdated?: (updatedAction: AcaoDoDia) => void
}

export function DailyActionCard({
  action,
  onExecute,
  onOpenCustomer360,
  onActionUpdated,
}: DailyActionCardProps) {
  const { toast } = useToast()
  const [isSimulatingChannel, setIsSimulatingChannel] = useState(false)
  const [selectedChannel, setSelectedChannel] = useState<
    'WhatsApp' | 'Telefone' | 'E-mail' | 'Visita'
  >('WhatsApp')
  const [simulatedContent, setSimulatedContent] = useState('')
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false)
  const [overrideJustification, setOverrideJustification] = useState('')

  // Status normalizado
  const currentStatus = (action.status || 'PLANEJADA').toUpperCase()
  const isConcluida = currentStatus === 'CONCLUIDA'
  const isEmAndamento = currentStatus === 'EM_ANDAMENTO'
  const isAguardando = currentStatus === 'AGUARDANDO_RETORNO'

  // Simulação de disparo de canal com validação IA de evidência em tempo real
  const handleSimulateChannelExecution = (
    channel: 'WhatsApp' | 'Telefone' | 'E-mail' | 'Visita',
  ) => {
    setSelectedChannel(channel)
    if (channel === 'WhatsApp') {
      setSimulatedContent(
        `Olá! Referente à cotação ${action.detalhes?.codigoCotacao || 'COT-SAP-98104'} de ${action.impactoEstimadoVolume || 15}t, confirmamos a liberação do lote com faturamento SAP ECC.`,
      )
    } else if (channel === 'E-mail') {
      setSimulatedContent(
        `Prezado cliente, enviamos a minuta comercial da cotação ${action.detalhes?.codigoCotacao || 'COT-98104'} com tabela de preços atualizada.`,
      )
    } else if (channel === 'Telefone') {
      setSimulatedContent(
        `Ligação VoIP de 4 min: Comprador confirmou interesse e alinhou condições de entrega para próxima semana.`,
      )
    } else {
      setSimulatedContent(
        `Visita técnica presencial realizada para validação dimensional de chapas e tubos.`,
      )
    }
    setIsSimulatingChannel(true)
  }

  // Validação IA da evidência
  const handleValidateAndApplyEvidence = () => {
    const result = globalActionEvidenceValidator.evaluateActionInteraction(action, {
      channel: selectedChannel,
      content: simulatedContent,
      subject: `Ação Comercial - ${action.clienteNome}`,
      hasResponse: selectedChannel === 'WhatsApp' && simulatedContent.includes('confirmamos'),
    })

    const updatedAction: AcaoDoDia = {
      ...action,
      status: result.newStatus as any,
      execution_status: result.newStatus as any,
      business_outcome: result.businessOutcome,
      evidence: result.evidence,
      ai_relevance_confidence: result.confidenceScore,
      evidence_summary: `${selectedChannel}: ${result.reasons[0]}`,
    }

    setIsSimulatingChannel(false)
    if (onActionUpdated) {
      onActionUpdated(updatedAction)
    }

    if (result.confidenceScore < 75 && !result.canConclude) {
      toast({
        title: 'Evidência Parcial / Insuficiente',
        description: `Score IA: ${result.confidenceScore}%. Status alterado para ${result.newStatus}. Mensagem genérica não conclui automaticamente a ação.`,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Evidência Validada pela IA!',
        description: `Canal ${selectedChannel} registrou execução. Status: ${result.newStatus} (Score: ${result.confidenceScore}%).`,
      })
    }
  }

  // Exceção manual para supervisor
  const handleSaveManualOverride = () => {
    if (!overrideJustification.trim()) {
      toast({
        title: 'Justificativa Obrigatória',
        description: 'Supervisores devem registrar o motivo da exceção manual para auditoria.',
        variant: 'destructive',
      })
      return
    }

    const updatedAction: AcaoDoDia = {
      ...action,
      status: 'CONCLUIDA' as any,
      execution_status: 'CONCLUIDA',
      manual_override: true,
      manual_override_justification: overrideJustification,
      manual_override_by: 'Supervisor Comercial (Auditoria)',
      manual_override_at: new Date().toISOString(),
    }

    setOverrideDialogOpen(false)
    if (onActionUpdated) {
      onActionUpdated(updatedAction)
    }
    toast({
      title: 'Exceção Manual Registrada',
      description: 'Ação concluída com auditoria e justificativa gravada.',
    })
  }

  return (
    <>
      <Card className="p-4 rounded-2xl border border-border/70 hover:border-primary/40 hover:shadow-md transition-all duration-200 bg-card space-y-3">
        {/* Top Header: Origem, Cliente, Classificação e Status */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <PriorityBadge priority={action.prioridade} />
              {action.clienteClassificacao && (
                <ABCBadge classification={action.clienteClassificacao} size="sm" />
              )}
              {action.origem && <DataSourceBadge source={action.origem} size="sm" />}
              <ActionStatusBadge status={action.execution_status || action.status} />
            </div>

            <button
              onClick={() => onOpenCustomer360?.(action.clienteId)}
              className="text-left font-serif font-bold text-base text-primary hover:underline block pt-1"
            >
              {action.clienteNome}
            </button>
          </div>

          {/* Impacto Comercial */}
          <div className="text-right shrink-0">
            {action.impactoEstimadoVolume && (
              <span className="text-sm font-bold text-slate-800 block">
                {formatWeight(action.impactoEstimadoVolume)}
              </span>
            )}
            {action.impactoEstimadoValor && (
              <span className="text-xs text-muted-foreground block font-mono">
                {formatCurrency(action.impactoEstimadoValor)}
              </span>
            )}
          </div>
        </div>

        {/* Recomendação da IA / Objetivo da Ação */}
        <div className="bg-primary/5 rounded-xl p-3 border border-primary/10 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>{action.tipoAcao || 'Ação Recomendada pela IA'}</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed font-medium">
            {action.recomendacao}
          </p>
        </div>

        {/* Justificativa de Fato & Correlação Multissistema */}
        {action.justificativa && (
          <p className="text-[11px] text-muted-foreground leading-snug">
            <strong>Contexto Operacional:</strong> {action.justificativa}
          </p>
        )}

        {/* EVIDÊNCIA COMPROVADA (SE EXISTIR) */}
        {action.evidence && (
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Evidência Detectada: Canal {action.evidence.channel}
              </span>
              <Badge className="bg-emerald-100 text-emerald-800 text-[9px] border-none font-mono">
                Score IA: {action.evidence.ai_relevance_score}%
              </Badge>
            </div>
            <p className="text-[11px] text-slate-600 italic">
              "{action.evidence.content_reference}"
            </p>
          </div>
        )}

        {/* BOTÕES DE AÇÃO RÁPIDA / MONITORAMENTO DE CANAL INTEGRADO */}
        <div className="pt-2 border-t border-border/50 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2 text-xs bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
              onClick={() => handleSimulateChannelExecution('WhatsApp')}
              title="Iniciar conversa via WhatsApp integrado"
            >
              <MessageSquare className="w-3.5 h-3.5 mr-1" /> WhatsApp
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2 text-xs bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100"
              onClick={() => handleSimulateChannelExecution('Telefone')}
              title="Disparar ligação via VoIP Telephony"
            >
              <Phone className="w-3.5 h-3.5 mr-1" /> Ligar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2 text-xs bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
              onClick={() => handleSimulateChannelExecution('E-mail')}
              title="Enviar e-mail comercial via Microsoft Graph"
            >
              <FileText className="w-3.5 h-3.5 mr-1" /> E-mail
            </Button>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-[11px] text-muted-foreground hover:text-slate-900"
              onClick={() => setOverrideDialogOpen(true)}
              title="Exceção manual permitida apenas com justificativa de auditoria"
            >
              Exceção Manual
            </Button>

            <Button
              size="sm"
              className="h-8 px-3 text-xs bg-primary text-white hover:bg-primary/90"
              onClick={() => onOpenCustomer360?.(action.clienteId)}
            >
              Abrir 360º <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </Card>

      {/* MODAL DE SIMULAÇÃO / TESTE DE CAPTURA AUTOMÁTICA DE CANAL */}
      <Dialog open={isSimulatingChannel} onOpenChange={setIsSimulatingChannel}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Simular Contato no Canal: {selectedChannel}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              O CRM 360º CIAFAL monitora os canais em segundo plano. Teste a validação da IA
              enviando uma mensagem adequada ou um texto genérico ("Bom dia") para auditar a regra.
            </p>

            <div className="p-2.5 rounded-xl bg-slate-50 border text-xs">
              <strong>Objetivo da Ação:</strong> {action.recomendacao}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                Conteúdo Capturado do Canal {selectedChannel}:
              </label>
              <Textarea
                rows={4}
                value={simulatedContent}
                onChange={(e) => setSimulatedContent(e.target.value)}
                placeholder="Digite o texto da interação..."
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSimulatedContent('Bom dia')}
              className="text-xs text-rose-700 border-rose-200 hover:bg-rose-50"
            >
              Testar "Bom dia" (Inválido)
            </Button>
            <Button
              size="sm"
              className="text-xs bg-primary text-white"
              onClick={handleValidateAndApplyEvidence}
            >
              <Send className="w-3.5 h-3.5 mr-1.5" /> Avaliar com IA & Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE AUDITORIA PARA EXCEÇÃO MANUAL */}
      <Dialog open={overrideDialogOpen} onOpenChange={setOverrideDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg text-primary flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Justificativa de Exceção Manual
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <p className="text-slate-600 leading-relaxed">
              <strong>Regra Corporativa:</strong> Vendedores não concluem ações sem evidência
              automática de canal. Exceções manuais exigem justificativa formal registrada no log de
              auditoria.
            </p>

            <div className="space-y-1">
              <label className="font-bold text-slate-800">
                Motivo / Justificativa da Conclusão Manual:
              </label>
              <Textarea
                rows={3}
                placeholder="Ex: Cliente fechou verbalmente durante almoço de negócios presencial..."
                value={overrideJustification}
                onChange={(e) => setOverrideJustification(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOverrideDialogOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" className="bg-primary text-white" onClick={handleSaveManualOverride}>
              Gravar com Auditoria
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
