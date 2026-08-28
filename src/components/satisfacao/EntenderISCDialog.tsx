import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Info,
  Layers,
  Scale,
} from 'lucide-react'
import { ClienteSatisfacao360, ISCPesosConfig } from '@/types/satisfaction'

interface EntenderISCDialogProps {
  cliente: ClienteSatisfacao360 | null
  open: boolean
  onClose: () => void
  pesos: ISCPesosConfig
}

export function EntenderISCDialog({ cliente, open, onClose, pesos }: EntenderISCDialogProps) {
  if (!cliente) return null

  const getBandBadge = () => {
    switch (cliente.faixaISC) {
      case 'EXCELENTE':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
      case 'SATISFEITO':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/40'
      case 'ATENCAO':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40'
      case 'RISCO':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/40'
      case 'CRITICO':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/40'
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-3xl bg-slate-950 text-slate-100 border-slate-800 rounded-3xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="space-y-2 border-b border-slate-800/80 pb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-white font-serif">
                  Explicabilidade do ISC — {cliente.razaoSocial}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400">
                  SAP #{cliente.sapCode} · {cliente.cidade}/{cliente.uf} · Vendedor:{' '}
                  {cliente.vendedorNome}
                </DialogDescription>
              </div>
            </div>

            <Badge variant="outline" className={`text-xs font-bold px-3 py-1 ${getBandBadge()}`}>
              ISC {cliente.iscAtual}/100 — {cliente.faixaISC}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* BANNER DISCRETO DADOS DEMO */}
          {cliente.is_mock && (
            <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 px-3 py-1.5 rounded-xl text-[11px] font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              DADOS DE DEMONSTRAÇÃO (Ambiente em Homologação / Staging)
            </div>
          )}

          {/* DECOMPOSIÇÃO DAS 5 DIMENSÕES COM PESOS */}
          <div className="space-y-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                <Layers className="w-4 h-4 text-sky-400" /> Composição dos Pesos Oficiais
              </span>
              <span className="text-slate-400 text-[11px]">Soma dos Pesos = 100%</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5 pt-1 text-center">
              {/* Qualidade */}
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    Qualidade ({pesos.qualidade}%)
                  </span>
                  <span className="text-xl font-bold font-serif text-white block mt-1">
                    {cliente.dimensaoQualidade.score}
                  </span>
                  <span className="text-[10px] text-slate-500">score 0-100</span>
                </div>
                <div className="mt-2 text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                  Contribuição:{' '}
                  {((cliente.dimensaoQualidade.score * pesos.qualidade) / 100).toFixed(1)} pts
                </div>
              </div>

              {/* Logística */}
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    Logística ({pesos.logistica}%)
                  </span>
                  <span className="text-xl font-bold font-serif text-white block mt-1">
                    {cliente.dimensaoLogistica.score}
                  </span>
                  <span className="text-[10px] text-slate-500">score 0-100</span>
                </div>
                <div className="mt-2 text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                  Contribuição:{' '}
                  {((cliente.dimensaoLogistica.score * pesos.logistica) / 100).toFixed(1)} pts
                </div>
              </div>

              {/* Comercial */}
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    Comercial ({pesos.comercial}%)
                  </span>
                  <span className="text-xl font-bold font-serif text-white block mt-1">
                    {cliente.dimensaoComercial.score}
                  </span>
                  <span className="text-[10px] text-slate-500">score 0-100</span>
                </div>
                <div className="mt-2 text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                  Contribuição:{' '}
                  {((cliente.dimensaoComercial.score * pesos.comercial) / 100).toFixed(1)} pts
                </div>
              </div>

              {/* Financeiro */}
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    Financeiro ({pesos.financeiro}%)
                  </span>
                  <span className="text-xl font-bold font-serif text-white block mt-1">
                    {cliente.dimensaoFinanceiro.score}
                  </span>
                  <span className="text-[10px] text-slate-500">score 0-100</span>
                </div>
                <div className="mt-2 text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                  Contribuição:{' '}
                  {((cliente.dimensaoFinanceiro.score * pesos.financeiro) / 100).toFixed(1)} pts
                </div>
              </div>

              {/* Pesquisa */}
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    Pesquisa ({pesos.pesquisa}%)
                  </span>
                  <span className="text-xl font-bold font-serif text-white block mt-1">
                    {cliente.dimensaoPesquisa.score}
                  </span>
                  <span className="text-[10px] text-slate-500">score 0-100</span>
                </div>
                <div className="mt-2 text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                  Contribuição:{' '}
                  {((cliente.dimensaoPesquisa.score * pesos.pesquisa) / 100).toFixed(1)} pts
                </div>
              </div>
            </div>
          </div>

          {/* IMPACTOS NEGATIVOS (POR QUE O ISC CAIU / FATORES REAIS) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
              <TrendingDown className="w-4 h-4" />
              Impactos Negativos Reais Detectados no Motor
            </div>
            {cliente.impactosNegativos.length > 0 ? (
              <div className="space-y-2">
                {cliente.impactosNegativos.map((imp, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-200"
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{imp}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic p-3 bg-slate-900 rounded-xl">
                Nenhum impacto negativo relevante registrado no período.
              </p>
            )}
          </div>

          {/* IMPACTOS POSITIVOS (FATORES REAIS FAVORÁVEIS) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <TrendingUp className="w-4 h-4" />
              Impactos Positivos & Forças do Relacionamento
            </div>
            {cliente.impactosPositivos.length > 0 ? (
              <div className="space-y-2">
                {cliente.impactosPositivos.map((imp, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{imp}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic p-3 bg-slate-900 rounded-xl">
                Nenhum impacto positivo registrado.
              </p>
            )}
          </div>

          {/* ORIGEM DOS DADOS E CARGA */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <span className="font-bold text-slate-300 block text-xs">
              Origem dos Dados & Rastreabilidade:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-slate-400">
              <div>• {cliente.sistemaOrigemInfo.sapEccSync}</div>
              <div>• {cliente.sistemaOrigemInfo.tmsSync}</div>
              <div>• {cliente.sistemaOrigemInfo.qualidadeSync}</div>
              <div>• {cliente.sistemaOrigemInfo.pesquisaSync}</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
