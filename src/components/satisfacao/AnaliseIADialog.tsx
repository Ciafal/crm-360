import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  ArrowRight,
  Package,
  PlusCircle,
  FileText,
  PhoneCall,
  Calendar,
  AlertCircle,
} from 'lucide-react'
import { ClienteSatisfacao360 } from '@/types/satisfaction'
import { toast } from 'sonner'

interface AnaliseIADialogProps {
  cliente: ClienteSatisfacao360 | null
  open: boolean
  onClose: () => void
  onCreateTaskFromAction?: (actionText: string, client: ClienteSatisfacao360) => void
  onCreateRecoveryPlan?: (client: ClienteSatisfacao360) => void
  onNavigateToStock?: (materialCode: string) => void
  onNavigateToQuote?: (client: ClienteSatisfacao360) => void
}

export function AnaliseIADialog({
  cliente,
  open,
  onClose,
  onCreateTaskFromAction,
  onCreateRecoveryPlan,
  onNavigateToStock,
  onNavigateToQuote,
}: AnaliseIADialogProps) {
  if (!cliente || !cliente.analiseIA) return null

  const ia = cliente.analiseIA

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'URGENTE':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40'
      case 'ALTA':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40'
      case 'MEDIA':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40'
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40'
    }
  }

  const handleCreateTask = () => {
    if (onCreateTaskFromAction) {
      onCreateTaskFromAction(ia.proximaMelhorAcao.acao, cliente)
    } else {
      toast.success(
        `Tarefa "${ia.proximaMelhorAcao.acao}" criada no módulo de Tarefas com prazo de ${ia.proximaMelhorAcao.prazoSugeridoDias} dias!`,
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-4xl bg-slate-950 text-slate-100 border-slate-800 rounded-3xl max-h-[92vh] overflow-y-auto p-6">
        <DialogHeader className="space-y-2 border-b border-slate-800/80 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-sky-500/20 text-sky-400 border border-sky-500/30">
                <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-white font-serif flex items-center gap-2">
                  Diagnóstico Estruturado por IA — {cliente.razaoSocial}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400">
                  Gerado em {ia.geradoEm} · Algoritmo de Satisfação & Retenção CIAFAL
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`text-xs font-bold px-3 py-1 ${getPriorityBadge(ia.prioridadeAcao)}`}
              >
                Prioridade: {ia.prioridadeAcao}
              </Badge>
              <Badge
                variant="outline"
                className="text-xs bg-slate-900 text-slate-300 border-slate-700"
              >
                ISC Atual: {cliente.iscAtual}/100
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* BANNER DISCRETO DADOS DEMO */}
          {cliente.is_mock && (
            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 px-3 py-1.5 rounded-xl text-[11px] font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              DADOS DE DEMONSTRAÇÃO (Motor de IA em Modo Simulado Staging)
            </div>
          )}

          {/* 1. SITUAÇÃO ATUAL & O QUE MUDOU */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5">
              <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                1. Situação Atual Diagnosticada
              </span>
              <p className="text-xs text-slate-200 leading-relaxed">{ia.situacaoAtual}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                2. O Que Mudou no Relacionamento
              </span>
              <p className="text-xs text-slate-200 leading-relaxed">{ia.oQueMudou}</p>
            </div>
          </div>

          {/* 2. DISTINÇÃO EXPLÍCITA: FATOS vs HIPÓTESES vs RECOMENDAÇÕES */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Decomposição Cognitiva (Fatos Objetivos × Hipóteses × Recomendações)
              </h4>
              <span className="text-[10px] text-slate-400 italic">
                * Hipóteses não são apresentadas como fatos
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* FATOS REAIS */}
              <div className="p-3.5 rounded-2xl bg-blue-950/30 border border-blue-500/30 space-y-2">
                <div className="flex items-center gap-1.5 text-blue-400 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                  FATOS (Comprovados por Dados)
                </div>
                <div className="space-y-1.5">
                  {ia.fatos.map((fato, i) => (
                    <div
                      key={i}
                      className="text-[11px] text-blue-100/90 leading-snug p-2 rounded-xl bg-blue-900/20 border border-blue-500/20"
                    >
                      {fato}
                    </div>
                  ))}
                </div>
              </div>

              {/* HIPÓTESES */}
              <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-2">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                  <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  HIPÓTESES (Probabilidades da IA)
                </div>
                <div className="space-y-1.5">
                  {ia.hipoteses.map((hip, i) => (
                    <div
                      key={i}
                      className="text-[11px] text-amber-100/90 leading-snug p-2 rounded-xl bg-amber-900/20 border border-amber-500/20"
                    >
                      {hip}
                    </div>
                  ))}
                </div>
              </div>

              {/* RECOMENDAÇÕES */}
              <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-2">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                  <Lightbulb className="w-4 h-4 text-emerald-400 shrink-0" />
                  RECOMENDAÇÕES (Ações Propostas)
                </div>
                <div className="space-y-1.5">
                  {ia.recomendacoes.map((rec, i) => (
                    <div
                      key={i}
                      className="text-[11px] text-emerald-100/90 leading-snug p-2 rounded-xl bg-emerald-900/20 border border-emerald-500/20"
                    >
                      {rec}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 3. RISCOS & OPORTUNIDADES COM CONEXÃO AO ESTOQUE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Riscos */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
                Riscos Identificados
              </span>
              <ul className="space-y-1 text-xs text-slate-300">
                {ia.riscosIdentificados.map((r, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-rose-400">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Oportunidades + Estoque */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                Oportunidades & Conexão com Estoque
              </span>
              <ul className="space-y-1 text-xs text-slate-300">
                {ia.oportunidadesIdentificadas.map((op, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-400">•</span>
                    <span>{op}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 4. DESTAQUE: PRÓXIMA MELHOR AÇÃO (NEXT BEST ACTION) */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-sky-950/60 via-slate-900 to-indigo-950/60 border border-sky-500/40 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-sky-500 text-slate-950 font-bold">
                  <ArrowRight className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-sky-400 tracking-wider">
                    Próxima Melhor Ação Recomendada
                  </span>
                  <h3 className="text-sm font-bold text-white font-serif">
                    {ia.proximaMelhorAcao.acao}
                  </h3>
                </div>
              </div>

              <Badge
                variant="outline"
                className="text-xs bg-sky-500/20 text-sky-300 border-sky-500/40 w-fit"
              >
                Prazo Sugerido: {ia.proximaMelhorAcao.prazoSugeridoDias} dias
              </Badge>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {ia.proximaMelhorAcao.justificativa}
            </p>

            {/* Item de Estoque Conexo (Se houver) */}
            {ia.proximaMelhorAcao.estoqueConexo && (
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <span className="font-bold text-white block">
                      {ia.proximaMelhorAcao.estoqueConexo.produtoCodigo} —{' '}
                      {ia.proximaMelhorAcao.estoqueConexo.produtoDescricao}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Saldo Disponível: {ia.proximaMelhorAcao.estoqueConexo.saldoDisponivelTons} t ·
                      Sugestão: R${' '}
                      {ia.proximaMelhorAcao.estoqueConexo.precoMedioSugeridoKg.toFixed(2)}/kg
                    </span>
                  </div>
                </div>

                {onNavigateToStock && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      onNavigateToStock(ia.proximaMelhorAcao.estoqueConexo!.produtoCodigo)
                    }
                    className="h-8 text-xs text-amber-300 border-amber-500/40 hover:bg-amber-500/10 shrink-0"
                  >
                    Consultar no Módulo Estoque
                  </Button>
                )}
              </div>
            )}

            {/* BOTÕES DE CONEXÃO MULTISSISTEMA */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
              <Button
                size="sm"
                onClick={handleCreateTask}
                className="h-8 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold gap-1.5 rounded-xl shadow-xs"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Transformar em Tarefa CRM
              </Button>

              {onNavigateToQuote && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onNavigateToQuote(cliente)}
                  className="h-8 text-xs text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/10 rounded-xl"
                >
                  <FileText className="w-3.5 h-3.5 mr-1" /> Gerar Nova Cotação
                </Button>
              )}

              {onCreateRecoveryPlan && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onCreateRecoveryPlan(cliente)}
                  className="h-8 text-xs text-rose-300 border-rose-500/40 hover:bg-rose-500/10 rounded-xl"
                >
                  <AlertCircle className="w-3.5 h-3.5 mr-1" /> Abrir Plano de Recuperação
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
