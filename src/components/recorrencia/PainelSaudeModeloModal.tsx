// src/components/recorrencia/PainelSaudeModeloModal.tsx
// Painel Administrativo de Saúde do Modelo BG/NBD + Gamma-Gamma e Validação Holdout (Requisitos 11 e 12)
// Apenas para Administrador e Gerente autorizado

import React, { useState } from 'react'
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Sliders,
  ShieldAlert,
  Database,
  Calendar,
  Layers,
  HelpCircle,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import type { ModeloPreditivoSalvo, ValidacaoHoldoutResult } from '@/types/recorrencia'

interface PainelSaudeModeloModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  modelo: ModeloPreditivoSalvo
  isAdmin: boolean
  onReprocessar: () => void
}

export function PainelSaudeModeloModal({
  open,
  onOpenChange,
  modelo,
  isAdmin,
  onReprocessar,
}: PainelSaudeModeloModalProps) {
  const [reprocessando, setReprocessando] = useState(false)

  const handleReprocessar = async () => {
    if (!isAdmin) {
      toast.error('Apenas Administradores podem reprocessar o modelo preditivo.')
      return
    }

    setReprocessando(true)
    toast.info('Iniciando calibração MLE real (Nelder-Mead) nos dados comerciais...')
    setTimeout(() => {
      try {
        onReprocessar()
        toast.success(
          'Modelo preditivo BG/NBD + Gamma-Gamma reprocessado e persistido com sucesso!',
        )
      } catch (err: any) {
        toast.error('Erro ao reprocessar modelo: ' + (err?.message || 'Falha na otimização'))
      } finally {
        setReprocessando(false)
      }
    }, 600)
  }

  const v = modelo.validacao

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-[95vw] sm:w-[90vw] max-h-[90vh] h-[90vh] flex flex-col p-0 rounded-3xl overflow-hidden bg-white shadow-2xl border-slate-200">
        <DialogHeader className="p-5 pb-4 border-b border-slate-200 bg-slate-50/90 shrink-0">
          <div className="flex items-center justify-between pr-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-100 text-[#003A70] flex items-center justify-center font-bold">
                <Activity className="w-5 h-5 text-[#003A70]" />
              </div>
              <div>
                <DialogTitle className="font-serif text-lg font-bold text-slate-900">
                  Saúde do Motor Preditivo (BG/NBD + Gamma-Gamma)
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  Parâmetros MLE reais, convergência estatística e validação holdout em janela de 90
                  dias.
                </p>
              </div>
            </div>

            <Badge
              className={`text-xs font-bold ${
                v.statusValidacao === 'OK'
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  : 'bg-amber-100 text-amber-900 border-amber-300'
              }`}
            >
              Status: {v.statusValidacao}
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/40 text-xs">
          {/* Card Resumo do Modelo */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-white rounded-2xl border border-slate-200">
              <span className="text-slate-500 text-[10px] uppercase font-bold block">
                Versão do Modelo
              </span>
              <strong className="text-slate-900 font-mono text-sm block mt-1">
                {modelo.versao}
              </strong>
              <span className="text-[10px] text-muted-foreground">
                Treinado: {new Date(modelo.treinadoEm).toLocaleDateString('pt-BR')}
              </span>
            </div>

            <div className="p-3 bg-white rounded-2xl border border-slate-200">
              <span className="text-slate-500 text-[10px] uppercase font-bold block">
                Clientes Base
              </span>
              <strong className="text-slate-900 font-mono text-sm block mt-1">
                {modelo.qtdeClientesTotal} clientes
              </strong>
              <span className="text-[10px] text-muted-foreground">
                {modelo.qtdeClientesElegiveisBGNBD} elegíveis BG/NBD
              </span>
            </div>

            <div className="p-3 bg-white rounded-2xl border border-slate-200">
              <span className="text-slate-500 text-[10px] uppercase font-bold block">
                Eventos Únicos
              </span>
              <strong className="text-slate-900 font-mono text-sm block mt-1">
                {modelo.qtdeEventosTotal} eventos
              </strong>
              <span className="text-[10px] text-muted-foreground">
                Total de {modelo.qtdeNFsTotal} NFs
              </span>
            </div>

            <div className="p-3 bg-white rounded-2xl border border-slate-200">
              <span className="text-slate-500 text-[10px] uppercase font-bold block">
                Período Calibrado
              </span>
              <strong className="text-slate-900 font-mono text-sm block mt-1">
                {modelo.periodoBase.diasTotal} dias
              </strong>
              <span className="text-[10px] text-muted-foreground">
                {modelo.periodoBase.inicio} a {modelo.periodoBase.fim}
              </span>
            </div>
          </div>

          {/* PARÂMETROS BG/NBD */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h4 className="font-serif font-bold text-xs text-slate-900 uppercase">
                  1. Modelo BG/NBD (Frequência & Recência)
                </h4>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono">
                Log-Likelihood: {modelo.bgnbd.logLikelihood}
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-500 text-[10px] block">Parâmetro r</span>
                <strong className="text-slate-900 text-sm font-mono">{modelo.bgnbd.r}</strong>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-500 text-[10px] block">Parâmetro alpha (dias)</span>
                <strong className="text-slate-900 text-sm font-mono">{modelo.bgnbd.alpha}</strong>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-500 text-[10px] block">Parâmetro a (Beta)</span>
                <strong className="text-slate-900 text-sm font-mono">{modelo.bgnbd.a}</strong>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-500 text-[10px] block">Parâmetro b (Beta)</span>
                <strong className="text-slate-900 text-sm font-mono">{modelo.bgnbd.b}</strong>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>
                Convergência do Otimizador Nelder-Mead:{' '}
                <strong className="text-slate-800">
                  {modelo.bgnbd.converged ? 'Convergido' : 'Parcial'} ({modelo.bgnbd.iterations}{' '}
                  iterações)
                </strong>
              </span>
              <span className="text-emerald-700 font-semibold">Parâmetros Validados por MLE</span>
            </div>
          </div>

          {/* PARÂMETROS GAMMA-GAMMA */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h4 className="font-serif font-bold text-xs text-slate-900 uppercase">
                  2. Modelo Gamma-Gamma (Valor Monetário)
                </h4>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono">
                Log-Likelihood: {modelo.gammaGamma.logLikelihood}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-500 text-[10px] block">Parâmetro p</span>
                <strong className="text-slate-900 text-sm font-mono">{modelo.gammaGamma.p}</strong>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-500 text-[10px] block">Parâmetro q</span>
                <strong className="text-slate-900 text-sm font-mono">{modelo.gammaGamma.q}</strong>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl">
                <span className="text-slate-500 text-[10px] block">Parâmetro v</span>
                <strong className="text-slate-900 text-sm font-mono">{modelo.gammaGamma.v}</strong>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>
                Clientes Elegíveis (com recompra):{' '}
                <strong className="text-slate-800">
                  {modelo.qtdeClientesElegiveisGammaGamma} contas
                </strong>
              </span>
              <span className="text-emerald-700 font-semibold">
                Estimativa monetária individual ativada
              </span>
            </div>
          </div>

          {/* VALIDAÇÃO EM JANELA HOLDOUT (90 DIAS) */}
          <div className="p-4 bg-white rounded-2xl border border-sky-200 bg-sky-50/20 space-y-3">
            <div className="flex items-center justify-between border-b border-sky-200 pb-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-sky-700" />
                <h4 className="font-serif font-bold text-xs text-sky-900 uppercase">
                  3. Validação Holdout Real (Janela de {v.diasHoldout} Dias)
                </h4>
              </div>
              <span className="text-[11px] text-sky-800 font-mono">
                Holdout: {v.periodoHoldoutInicio} a {v.periodoHoldoutFim}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">
                  Compras no Holdout
                </span>
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-600">Previsto:</span>
                  <strong className="font-mono text-slate-900">{v.comprasPrevistasTotal}</strong>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-600">Realizado:</span>
                  <strong className="font-mono text-slate-900">{v.comprasRealizadasTotal}</strong>
                </div>
                <div className="pt-1 border-t border-slate-100 flex justify-between text-[11px]">
                  <span className="text-slate-500">MAE / Desvio:</span>
                  <strong className="text-emerald-700">
                    {v.maeCompras} ({v.desvioPercentualCompras > 0 ? '+' : ''}
                    {v.desvioPercentualCompras}%)
                  </strong>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">
                  Receita (R$) no Holdout
                </span>
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-600">Previsto:</span>
                  <strong className="font-mono text-slate-900">
                    R$ {(v.receitaPrevistaTotal / 1000).toFixed(0)}k
                  </strong>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-600">Realizado:</span>
                  <strong className="font-mono text-slate-900">
                    R$ {(v.receitaRealizadaTotal / 1000).toFixed(0)}k
                  </strong>
                </div>
                <div className="pt-1 border-t border-slate-100 flex justify-between text-[11px]">
                  <span className="text-slate-500">Desvio:</span>
                  <strong className="text-emerald-700">
                    {v.desvioPercentualReceita > 0 ? '+' : ''}
                    {v.desvioPercentualReceita}%
                  </strong>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">
                  Volume (t) no Holdout
                </span>
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-600">Previsto:</span>
                  <strong className="font-mono text-blue-700">{v.tonelagemPrevistaTotal} t</strong>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-600">Realizado:</span>
                  <strong className="font-mono text-blue-700">{v.tonelagemRealizadaTotal} t</strong>
                </div>
                <div className="pt-1 border-t border-slate-100 flex justify-between text-[11px]">
                  <span className="text-slate-500">Desvio:</span>
                  <strong className="text-emerald-700">
                    {v.desvioPercentualTonelagem > 0 ? '+' : ''}
                    {v.desvioPercentualTonelagem}%
                  </strong>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground pt-1">
              * A calibração separa os últimos 90 dias como período holdout cego. Se o desvio de
              compras for inferior a ±25% e o MAE menor que 1.5, o modelo é rotulado como OK.
            </p>
          </div>
        </div>

        <DialogFooter className="p-4 border-t border-slate-200 bg-white shrink-0 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            {isAdmin
              ? 'Acesso Administrativo Habilitado'
              : 'Visível em modo leitura para Gestor Comercial'}
          </span>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs"
            >
              Fechar
            </Button>

            {isAdmin && (
              <Button
                type="button"
                size="sm"
                disabled={reprocessando}
                onClick={handleReprocessar}
                className="rounded-xl text-xs bg-[#003A70] hover:bg-[#002850] text-white font-bold gap-1.5 shadow-sm"
              >
                <RotateCw className={`w-3.5 h-3.5 ${reprocessando ? 'animate-spin' : ''}`} />
                <span>{reprocessando ? 'Reprocessando...' : 'Reprocessar Modelo (MLE)'}</span>
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
