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
      <DialogContent className="max-w-4xl bg-white text-slate-900 border-slate-200 rounded-3xl max-h-[92vh] overflow-y-auto p-6 shadow-xl">
        <DialogHeader className="space-y-2 border-b border-slate-100 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-sky-50 text-[#003A70] border border-sky-200">
                <Sparkles className="w-5 h-5 text-[#003A70]" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-[#003A70] font-serif flex items-center gap-2">
                  Diagnóstico Estruturado por IA — {cliente.razaoSocial}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Gerado em {ia.geradoEm} · Algoritmo de Satisfação & Retenção CIAFAL
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`text-xs font-bold px-3 py-1 ${
                  ia.prioridadeAcao === 'URGENTE'
                    ? 'bg-rose-50 text-rose-800 border-rose-200'
                    : ia.prioridadeAcao === 'ALTA'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-blue-50 text-blue-800 border-blue-200'
                }`}
              >
                Prioridade: {ia.prioridadeAcao}
              </Badge>
              <Badge
                variant="outline"
                className="text-xs bg-slate-100 text-slate-700 border-slate-200"
              >
                ISC Atual: {cliente.iscAtual}/100
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* BANNER DISCRETO DADOS DEMO */}
          {cliente.is_mock && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 px-3 py-1.5 rounded-xl text-[11px] font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              DADOS DE DEMONSTRAÇÃO (Motor de IA em Modo Simulado Staging)
            </div>
          )}

          {/* 1. SITUAÇÃO ATUAL & O QUE MUDOU */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
              <span className="text-[10px] font-bold text-[#003A70] uppercase tracking-wider block">
                1. Situação Atual Diagnosticada
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">{ia.situacaoAtual}</p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60 space-y-1.5">
              <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
                2. O Que Mudou no Relacionamento
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">{ia.oQueMudou}</p>
            </div>
          </div>

          {/* 2. DISTINÇÃO EXPLÍCITA: FATOS vs HIPÓTESES vs RECOMENDAÇÕES */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Decomposição Cognitiva (Fatos Objetivos × Hipóteses × Recomendações)
              </h4>
              <span className="text-[10px] text-slate-500 italic">
                * Hipóteses são probabilidades e não são apresentadas como fatos consumados
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* FATOS REAIS */}
              <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2">
                <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0" />
                  FATOS (Comprovados por Dados)
                </div>
                <div className="space-y-1.5">
                  {ia.fatos.map((fato, i) => (
                    <div
                      key={i}
                      className="text-[11px] text-blue-950 leading-snug p-2 rounded-xl bg-white border border-blue-100 shadow-2xs"
                    >
                      {fato}
                    </div>
                  ))}
                </div>
              </div>

              {/* HIPÓTESES */}
              <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
                <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                  <HelpCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  HIPÓTESES (Probabilidades da IA)
                </div>
                <div className="space-y-1.5">
                  {ia.hipoteses.map((hip, i) => (
                    <div
                      key={i}
                      className="text-[11px] text-amber-950 leading-snug p-2 rounded-xl bg-white border border-amber-100 shadow-2xs"
                    >
                      {hip}
                    </div>
                  ))}
                </div>
              </div>

              {/* RECOMENDAÇÕES */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-xs">
                  <Lightbulb className="w-4 h-4 text-emerald-700 shrink-0" />
                  RECOMENDAÇÕES (Ações Propostas)
                </div>
                <div className="space-y-1.5">
                  {ia.recomendacoes.map((rec, i) => (
                    <div
                      key={i}
                      className="text-[11px] text-emerald-950 leading-snug p-2 rounded-xl bg-white border border-emerald-100 shadow-2xs"
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
            <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/60 space-y-2">
              <span className="text-[10px] font-bold text-rose-900 uppercase tracking-wider block">
                Riscos Identificados
              </span>
              <ul className="space-y-1 text-xs text-slate-700">
                {ia.riscosIdentificados.map((r, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-rose-600 font-bold">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Oportunidades + Estoque */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/60 space-y-2">
              <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider block">
                Oportunidades & Conexão com Estoque
              </span>
              <ul className="space-y-1 text-xs text-slate-700">
                {ia.oportunidadesIdentificadas.map((op, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>{op}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 4. DESTAQUE: PRÓXIMA MELHOR AÇÃO (NEXT BEST ACTION) */}
          <div className="p-5 rounded-2xl bg-sky-50/80 border border-sky-200 space-y-3 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#003A70] text-white font-bold">
                  <ArrowRight className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#003A70] tracking-wider">
                    Próxima Melhor Ação Recomendada
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 font-serif">
                    {ia.proximaMelhorAcao.acao}
                  </h3>
                </div>
              </div>

              <Badge
                variant="outline"
                className="text-xs bg-white text-[#003A70] border-sky-300 font-semibold w-fit"
              >
                Prazo Sugerido: {ia.proximaMelhorAcao.prazoSugeridoDias} dias
              </Badge>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed">
              {ia.proximaMelhorAcao.justificativa}
            </p>

            {/* Item de Estoque Conexo (Se houver) */}
            {ia.proximaMelhorAcao.estoqueConexo && (
              <div className="p-3 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-800 block">
                      {ia.proximaMelhorAcao.estoqueConexo.produtoCodigo} —{' '}
                      {ia.proximaMelhorAcao.estoqueConexo.produtoDescricao}
                    </span>
                    <span className="text-[11px] text-slate-500">
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
                    className="h-8 text-xs text-amber-800 border-amber-300 hover:bg-amber-50 shrink-0"
                  >
                    Consultar no Módulo Estoque
                  </Button>
                )}
              </div>
            )}

            {/* BOTÕES DE CONEXÃO MULTISSISTEMA */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-sky-200/80">
              <Button
                size="sm"
                onClick={handleCreateTask}
                className="h-8 bg-[#003A70] hover:bg-[#002850] text-white text-xs font-semibold gap-1.5 rounded-xl shadow-xs"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Transformar em Tarefa CRM
              </Button>

              {onNavigateToQuote && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onNavigateToQuote(cliente)}
                  className="h-8 text-xs text-emerald-800 border-emerald-300 hover:bg-emerald-50 rounded-xl"
                >
                  <FileText className="w-3.5 h-3.5 mr-1" /> Gerar Nova Cotação
                </Button>
              )}

              {onCreateRecoveryPlan && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onCreateRecoveryPlan(cliente)}
                  className="h-8 text-xs text-rose-800 border-rose-300 hover:bg-rose-50 rounded-xl"
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
