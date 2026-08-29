import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  CheckCircle2,
  AlertTriangle,
  Truck,
  Layers,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  Info,
} from 'lucide-react'
import type { OitfMetrics, OitfDeviationItem } from '@/types/cockpit'

interface OitfCockpitCardProps {
  oitfMetrics: OitfMetrics
}

export function OitfCockpitCard({ oitfMetrics }: OitfCockpitCardProps) {
  const [selectedDeviation, setSelectedDeviation] = useState<OitfDeviationItem | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const isAboveMeta = oitfMetrics.atualPct >= oitfMetrics.metaPct

  return (
    <Card className="bg-white/95 backdrop-blur-md border-border/40 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4">
      <div>
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 rounded-xl">
              <CheckCircle2 className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-lg text-primary">
                  OITF · On-Time In-Full
                </h3>
                <Badge className="bg-indigo-100 text-indigo-800 text-[10px] font-bold border-none">
                  Entregas no Prazo & Completas
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Cruzamento contínuo SAP ECC · CRM · PCP Robotizado · WMS · TMS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              className={`text-xs font-bold border-none px-2.5 py-1 ${
                isAboveMeta ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {oitfMetrics.atualPct.toFixed(1)}% Atual
            </Badge>
            <Badge variant="outline" className="text-xs text-muted-foreground">
              Meta: {oitfMetrics.metaPct.toFixed(1)}% (
              {oitfMetrics.gapPp >= 0
                ? `+${oitfMetrics.gapPp.toFixed(1)}`
                : `${oitfMetrics.gapPp.toFixed(1)}`}{' '}
              p.p.)
            </Badge>
          </div>
        </div>

        {/* Métricas de Histórico e Tendência */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-3 bg-slate-50 rounded-2xl border border-border/40 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Mês Anterior
            </span>
            <span className="font-serif text-base font-bold text-slate-800 block mt-0.5">
              {oitfMetrics.mesAnteriorPct.toFixed(1)}%
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-border/40 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Média YTD
            </span>
            <span className="font-serif text-base font-bold text-slate-800 block mt-0.5">
              {oitfMetrics.mediaYtdPct.toFixed(1)}%
            </span>
          </div>

          <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-200 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 block">
              Tendência
            </span>
            <span className="font-serif text-base font-bold text-indigo-700 block mt-0.5">
              Alta (+2,7 p.p.)
            </span>
          </div>
        </div>

        {/* Lista de Pedidos com Desvio / Drill-down Rápido */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
            Monitoramento de Pedidos Recentes (Drill-Down OITF)
          </span>

          <div className="space-y-2">
            {oitfMetrics.desviosRecentes.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedDeviation(item)
                  setModalOpen(true)
                }}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  item.isOitfOk
                    ? 'bg-slate-50 hover:bg-slate-100 border-border/40'
                    : 'bg-amber-50/60 hover:bg-amber-100/60 border-amber-200'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-primary">
                      {item.pedidoSap} (Item {item.itemSap})
                    </span>
                    <Badge
                      className={`text-[9px] font-bold border-none ${
                        item.isOitfOk
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.isOitfOk ? '✓ OITF 100%' : '⚠ Desvio OITF'}
                    </Badge>
                  </div>
                  <span className="text-xs font-semibold text-slate-900 block mt-0.5">
                    {item.clienteNome}
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    {item.produtoDescricao} · Pedido: {item.quantidadePedidaTons} t | Entregue:{' '}
                    {item.quantidadeEntregueTons} t
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-primary gap-1">
                    Ver Causa IA <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal de Detalhamento OITF com IA e Fontes Cruzadas */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-bold text-primary flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-indigo-600" />
              Drill-Down OITF · {selectedDeviation?.pedidoSap}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Rastreamento de ponta a ponta: SAP ECC, PCP Robotizado, WMS Betim e TMS CIAFAL
            </DialogDescription>
          </DialogHeader>

          {selectedDeviation && (
            <div className="space-y-4 text-xs pt-2">
              {/* Resumo do Pedido */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-border/40 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <span className="text-[10px] text-muted-foreground block">Cliente:</span>
                  <strong className="text-slate-900 block truncate">
                    {selectedDeviation.clienteNome}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Produto:</span>
                  <strong className="text-slate-900 block truncate">
                    {selectedDeviation.produtoDescricao}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">
                    Qtd Pedida / Entregue:
                  </span>
                  <strong className="text-slate-900 block">
                    {selectedDeviation.quantidadePedidaTons} t /{' '}
                    {selectedDeviation.quantidadeEntregueTons} t
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Status OITF:</span>
                  <strong
                    className={selectedDeviation.isOitfOk ? 'text-emerald-700' : 'text-amber-700'}
                  >
                    {selectedDeviation.isOitfOk
                      ? 'Atendido no Prazo e Completo'
                      : 'Parcial / Desvio'}
                  </strong>
                </div>
              </div>

              {/* Análise de Causa Raiz IA (Dado -> Análise -> Hipótese -> Evidência -> Recomendação) */}
              <div className="p-4 bg-gradient-to-r from-sky-950 to-slate-900 text-slate-100 rounded-2xl border border-sky-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-amber-400" /> Diagnóstico da Causa Provável (IA)
                  </span>
                  <Badge className="bg-sky-500/20 text-sky-300 text-[10px] border-none">
                    Não altera registros SAP
                  </Badge>
                </div>

                <p className="text-xs text-slate-200 font-medium">
                  {selectedDeviation.causaProvavelIA}
                </p>

                <div className="space-y-1.5 pt-2 border-t border-slate-800 text-[11px]">
                  <div>
                    <strong className="text-sky-300">DADO: </strong>
                    <span className="text-slate-300">{selectedDeviation.fluxoEvidencia.dado}</span>
                  </div>
                  <div>
                    <strong className="text-sky-300">ANÁLISE: </strong>
                    <span className="text-slate-300">
                      {selectedDeviation.fluxoEvidencia.analise}
                    </span>
                  </div>
                  <div>
                    <strong className="text-sky-300">HIPÓTESE: </strong>
                    <span className="text-slate-300">
                      {selectedDeviation.fluxoEvidencia.hipotese}
                    </span>
                  </div>
                  <div>
                    <strong className="text-sky-300">EVIDÊNCIA: </strong>
                    <span className="text-slate-300">
                      {selectedDeviation.fluxoEvidencia.evidencia}
                    </span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded-xl border border-sky-500/30">
                    <strong className="text-emerald-400">RECOMENDAÇÃO: </strong>
                    <span className="text-slate-200 font-medium">
                      {selectedDeviation.fluxoEvidencia.recomendacao}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cruzamento de Fontes */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-border/40 space-y-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Fontes Operacionais Cruzadas
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-700">
                  <div className="p-2 bg-white rounded-xl border">
                    <strong>SAP ECC SD:</strong> {selectedDeviation.fontesCruzadas.sapEcc}
                  </div>
                  <div className="p-2 bg-white rounded-xl border">
                    <strong>PCP Robotizado:</strong>{' '}
                    {selectedDeviation.fontesCruzadas.pcpRobotizado}
                  </div>
                  <div className="p-2 bg-white rounded-xl border">
                    <strong>WMS CD Betim:</strong> {selectedDeviation.fontesCruzadas.wms}
                  </div>
                  <div className="p-2 bg-white rounded-xl border">
                    <strong>TMS Frota:</strong> {selectedDeviation.fontesCruzadas.tms}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
