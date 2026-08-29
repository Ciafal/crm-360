import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { SopForecastRecord, UnitType } from '@/types/sop'
import { formatCiafalMetric } from '@/services/forecast_engine'
import { sopService, QLIK_LAST_SYNC } from '@/services/sop_service'
import {
  Sparkles,
  Edit3,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  ArrowRight,
  TrendingUp,
  History,
  ShieldAlert,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface SopForecastLayersTableProps {
  records: SopForecastRecord[]
  unit: UnitType
  onRecordUpdated?: () => void
  userRole?: string
  userName?: string
}

export function SopForecastLayersTable({
  records,
  unit,
  onRecordUpdated,
  userRole = 'gerente_comercial',
  userName = 'Roberto Silveira',
}: SopForecastLayersTableProps) {
  const [selectedRecord, setSelectedRecord] = useState<SopForecastRecord | null>(null)
  const [adjustModalOpen, setAdjustModalOpen] = useState(false)
  const [whyModalOpen, setWhyModalOpen] = useState(false)
  const [auditModalOpen, setAuditModalOpen] = useState(false)

  const [adjustLayer, setAdjustLayer] = useState<'F2' | 'F3'>('F2')
  const [newValue, setNewValue] = useState<number>(0)
  const [justification, setJustification] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleOpenAdjust = (rec: SopForecastRecord, layer: 'F2' | 'F3') => {
    setSelectedRecord(rec)
    setAdjustLayer(layer)
    setNewValue(
      layer === 'F2' ? rec.f2SellerAdjusted : rec.f3ManagementAdjusted || rec.f2SellerAdjusted,
    )
    setJustification(layer === 'F2' ? rec.f2Justification || '' : rec.f3Justification || '')
    setAdjustModalOpen(true)
  }

  const handleSaveAdjustment = async () => {
    if (!selectedRecord) return
    if (!justification.trim() || justification.length < 5) {
      toast.error('Justificativa obrigatória (mínimo de 5 caracteres) para alteração de camada.')
      return
    }

    setIsSaving(true)
    try {
      await sopService.saveForecastAdjustment(
        selectedRecord.id,
        adjustLayer,
        Number(newValue),
        justification,
        userName,
      )
      toast.success(
        `Camada ${adjustLayer} atualizada com sucesso e registrada na trilha de auditoria.`,
      )
      setAdjustModalOpen(false)
      onRecordUpdated?.()
    } catch {
      toast.error('Erro ao registrar ajuste no backend.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="rounded-3xl border border-border/60 bg-white/95 shadow-xs overflow-hidden">
      <CardHeader className="p-5 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            <CardTitle className="font-serif text-lg font-bold text-primary">
              Camadas do Forecast & Versionamento (F0 ➔ F4)
            </CardTitle>
            <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-mono">
              Auditoria Ativa
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Nenhuma camada apaga a anterior. Transparência completa de intervenções com cálculo de
            FVA.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] bg-white text-slate-700 font-mono">
            Última atualização QLIK: {QLIK_LAST_SYNC}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b bg-slate-50 text-[11px] font-bold text-muted-foreground uppercase">
              <th className="py-3 px-3.5">Cliente / Vendedor</th>
              <th className="py-3 px-3.5">Produto / Família</th>
              <th className="py-3 px-2 text-center bg-indigo-50/50 border-x border-indigo-100">
                F0 Estatístico
              </th>
              <th className="py-3 px-2 text-center bg-amber-50/50 border-r border-amber-100">
                F1 IA Enriquecido
              </th>
              <th className="py-3 px-2 text-center bg-blue-50/50 border-r border-blue-100">
                F2 Ajuste Vendedor
              </th>
              <th className="py-3 px-2 text-center bg-purple-50/50 border-r border-purple-100">
                F3 Ajuste Gestão
              </th>
              <th className="py-3 px-2 text-center bg-emerald-50/50 font-extrabold text-emerald-900 border-r border-emerald-100">
                F4 Consensual S&OP
              </th>
              <th className="py-3 px-3 text-center">Meta Oficial</th>
              <th className="py-3 px-3 text-center">FVA / Bias</th>
              <th className="py-3 px-3.5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((r) => {
              const f2Diff = r.f2SellerAdjusted - r.f1AiEnriched
              const f3Diff = (r.f3ManagementAdjusted || r.f2SellerAdjusted) - r.f2SellerAdjusted

              return (
                <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Cliente & Vendedor */}
                  <td className="py-3 px-3.5">
                    <strong className="block text-slate-900 font-semibold text-xs leading-tight">
                      {r.customerName}
                    </strong>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                      <span className="font-mono text-primary font-semibold">{r.customerId}</span>
                      <span>•</span>
                      <span>{r.sellerName}</span>
                    </div>
                  </td>

                  {/* Produto */}
                  <td className="py-3 px-3.5">
                    <span
                      className="font-medium text-slate-800 block text-xs truncate max-w-[180px]"
                      title={r.productName}
                    >
                      {r.productName}
                    </span>
                    <span className="text-[10px] text-muted-foreground block truncate max-w-[180px]">
                      {r.productFamily}
                    </span>
                  </td>

                  {/* F0 Estatístico */}
                  <td className="py-3 px-2 text-center font-mono font-bold text-indigo-900 bg-indigo-50/30 border-x border-indigo-100/50">
                    <div>{formatCiafalMetric(r.f0Statistical, unit)}</div>
                    <div className="text-[9px] text-muted-foreground font-sans font-normal truncate max-w-[90px] mx-auto">
                      {r.championModel}
                    </div>
                  </td>

                  {/* F1 IA Enriquecido */}
                  <td className="py-3 px-2 text-center font-mono font-bold text-amber-900 bg-amber-50/30 border-r border-amber-100/50">
                    <div>{formatCiafalMetric(r.f1AiEnriched, unit)}</div>
                    <div className="text-[9px] text-amber-700 font-sans font-medium flex items-center justify-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" /> F0+
                      {formatCiafalMetric(r.f1AiEnriched - r.f0Statistical, unit)}
                    </div>
                  </td>

                  {/* F2 Ajuste Vendedor */}
                  <td className="py-3 px-2 text-center font-mono font-bold text-blue-900 bg-blue-50/30 border-r border-blue-100/50">
                    <div className="flex items-center justify-center gap-1">
                      <span>{formatCiafalMetric(r.f2SellerAdjusted, unit)}</span>
                      <button
                        onClick={() => handleOpenAdjust(r, 'F2')}
                        className="p-1 rounded hover:bg-blue-100 text-blue-600 transition-colors"
                        title="Ajustar Camada F2 (Vendedor)"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                    </div>
                    {f2Diff !== 0 && (
                      <div
                        className={cn(
                          'text-[9px] font-sans font-medium',
                          f2Diff > 0 ? 'text-blue-700' : 'text-slate-500',
                        )}
                      >
                        {f2Diff > 0 ? `+${f2Diff.toFixed(1)} t` : `${f2Diff.toFixed(1)} t`}
                      </div>
                    )}
                  </td>

                  {/* F3 Ajuste Gestão */}
                  <td className="py-3 px-2 text-center font-mono font-bold text-purple-900 bg-purple-50/30 border-r border-purple-100/50">
                    <div className="flex items-center justify-center gap-1">
                      <span>
                        {formatCiafalMetric(r.f3ManagementAdjusted || r.f2SellerAdjusted, unit)}
                      </span>
                      <button
                        onClick={() => handleOpenAdjust(r, 'F3')}
                        className="p-1 rounded hover:bg-purple-100 text-purple-600 transition-colors"
                        title="Ajustar Camada F3 (Gestão Comercial)"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                    </div>
                    {f3Diff !== 0 && (
                      <div
                        className={cn(
                          'text-[9px] font-sans font-medium',
                          f3Diff > 0 ? 'text-purple-700' : 'text-rose-600',
                        )}
                      >
                        {f3Diff > 0 ? `+${f3Diff.toFixed(1)} t` : `${f3Diff.toFixed(1)} t`}
                      </div>
                    )}
                  </td>

                  {/* F4 Consensual S&OP */}
                  <td className="py-3 px-2 text-center font-mono font-extrabold text-emerald-950 bg-emerald-50/40 border-r border-emerald-100/50">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900">
                      {formatCiafalMetric(r.f4SopConsensual, unit)}
                    </span>
                    <span className="block text-[9px] text-emerald-800 font-sans font-bold mt-0.5">
                      Oficial S&OP
                    </span>
                  </td>

                  {/* Meta Oficial */}
                  <td className="py-3 px-3 text-center font-mono font-semibold text-slate-800">
                    <div>{formatCiafalMetric(r.targetFinal, unit)}</div>
                    <span className="text-[9px] text-muted-foreground font-sans">
                      Sug. IA: {formatCiafalMetric(r.targetSuggested, unit)}
                    </span>
                  </td>

                  {/* FVA & Bias */}
                  <td className="py-3 px-3 text-center">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[9px] px-1.5 py-0 font-bold',
                        r.biasType === 'OPTIMISM'
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : r.biasType === 'CONSERVATIVE'
                            ? 'bg-blue-50 text-blue-800 border-blue-300'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-300',
                      )}
                    >
                      {r.biasType === 'OPTIMISM'
                        ? 'Viés Otimista'
                        : r.biasType === 'CONSERVATIVE'
                          ? 'Viés Conservador'
                          : 'Neutro'}
                    </Badge>
                    <span className="block text-[9px] text-emerald-700 font-mono mt-0.5 font-bold">
                      FVA: +{r.fvaAi.toFixed(1)}%
                    </span>
                  </td>

                  {/* Ações */}
                  <td className="py-3 px-3.5 text-right space-x-1 whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedRecord(r)
                        setWhyModalOpen(true)
                      }}
                      className="h-7 px-2 text-[11px] text-primary hover:bg-primary/10 gap-1 rounded-lg"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-primary" />
                      Por que essa previsão?
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedRecord(r)
                        setAuditModalOpen(true)
                      }}
                      className="h-7 px-2 text-[11px] text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      <History className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </CardContent>

      {/* MODAL 1: AJUSTE DE CAMADA COM JUSTIFICATIVA OBRIGATÓRIA */}
      <Dialog open={adjustModalOpen} onOpenChange={setAdjustModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-bold text-primary flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-primary" />
              Ajustar Forecast — Camada {adjustLayer} (
              {adjustLayer === 'F2' ? 'Vendedor' : 'Gestão Comercial'})
            </DialogTitle>
            <DialogDescription className="text-xs">
              {selectedRecord?.customerName} • {selectedRecord?.productName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl border border-border/40 space-y-1">
              <div className="flex justify-between text-muted-foreground">
                <span>F0 Estatístico (Motor):</span>
                <strong className="text-slate-800">
                  {formatCiafalMetric(selectedRecord?.f0Statistical || 0, unit)}
                </strong>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>F1 IA Enriquecido:</span>
                <strong className="text-slate-800">
                  {formatCiafalMetric(selectedRecord?.f1AiEnriched || 0, unit)}
                </strong>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-800">
                Novo Valor do Forecast ({unit === 't' ? 'Toneladas (t)' : 'R$'}):
              </label>
              <Input
                type="number"
                step="0.1"
                value={newValue}
                onChange={(e) => setNewValue(parseFloat(e.target.value) || 0)}
                className="font-mono text-sm font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 flex items-center justify-between">
                <span>Justificativa da Alteração (Obrigatória):</span>
                <span className="text-[10px] text-rose-600 font-normal">* Auditado no FVA</span>
              </label>
              <textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Ex: Cliente fechou novo contrato de estruturas metálicas com início em Março..."
                rows={3}
                className="w-full p-2.5 rounded-xl border border-border/80 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAdjustModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSaveAdjustment}
              disabled={isSaving}
              className="bg-primary text-white font-bold"
            >
              {isSaving ? 'Salvando...' : 'Salvar Ajuste & Versionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: IA EXPLICATIVA — POR QUE ESSA PREVISÃO? */}
      <Dialog open={whyModalOpen} onOpenChange={setWhyModalOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-bold text-primary flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              Explicabilidade do Forecast IA CIAFAL
            </DialogTitle>
            <DialogDescription className="text-xs">
              Decomposição matemática e sinais de mercado utilizados pelo motor preditivo.
            </DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-3.5 py-2 text-xs">
              <div className="p-3 bg-primary/5 rounded-2xl border border-primary/20 space-y-1.5">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
                  Cliente & Produto Analisados
                </span>
                <strong className="block text-slate-900 text-sm">
                  {selectedRecord.customerName}
                </strong>
                <span className="text-muted-foreground block">{selectedRecord.productName}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-slate-50 rounded-2xl border border-border/40">
                  <span className="text-muted-foreground block text-[10px]">
                    Modelo Champion Selecionado:
                  </span>
                  <strong className="text-indigo-900 font-mono">
                    {selectedRecord.championModel}
                  </strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-border/40">
                  <span className="text-muted-foreground block text-[10px]">
                    Confiança Analítica:
                  </span>
                  <Badge className="bg-emerald-100 text-emerald-800 text-[10px] mt-0.5">
                    {selectedRecord.modelConfidence} ({selectedRecord.historicalMonthsAnalyzed}{' '}
                    meses QLIK)
                  </Badge>
                </div>
              </div>

              <div className="space-y-2 p-3 bg-amber-50/50 rounded-2xl border border-amber-200">
                <strong className="text-amber-900 text-xs block flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Fatores que enriqueceram a
                  Camada F1:
                </strong>
                <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px]">
                  <li>
                    Sazonalidade do setor de construção e estruturas metálicas no mês de Março
                    (+8.5%).
                  </li>
                  <li>
                    Ritmo histórico de recompras a cada{' '}
                    {selectedRecord.nextPurchaseEstimate?.historicalIntervalDays || 30} dias
                    consolidado no QLIK.
                  </li>
                  <li>
                    Carteira confirmada e cotações ativas no CRM 360º com probabilidade ponderada
                    &gt; 80%.
                  </li>
                </ul>
              </div>

              {selectedRecord.nextPurchaseEstimate && (
                <div className="p-3 bg-sky-50 rounded-2xl border border-sky-200 text-slate-800">
                  <strong className="text-sky-900 block text-xs">
                    Janela Provável de Próxima Compra:
                  </strong>
                  <span className="text-[11px] block mt-0.5">
                    Estimada entre{' '}
                    <strong>{selectedRecord.nextPurchaseEstimate.probableWindowStart}</strong> e{' '}
                    <strong>{selectedRecord.nextPurchaseEstimate.probableWindowEnd}</strong>.
                  </span>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setWhyModalOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: TRILHA DE AUDITORIA & HISTÓRICO DE ALTERAÇÕES */}
      <Dialog open={auditModalOpen} onOpenChange={setAuditModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-bold text-primary flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Trilha de Auditoria & Revisões
            </DialogTitle>
            <DialogDescription className="text-xs">
              Histórico imutável de todas as intervenções e justificativas.
            </DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-3 py-2 text-xs">
              <div className="border-l-2 border-indigo-400 pl-3 py-1 space-y-0.5">
                <span className="text-[10px] text-muted-foreground font-mono">
                  F0 — Motor Estatístico
                </span>
                <div className="font-bold text-slate-800">
                  {formatCiafalMetric(selectedRecord.f0Statistical, unit)}
                </div>
                <span className="text-[10px] text-muted-foreground">
                  Fonte: Séries Temporais / Backtest QLIK
                </span>
              </div>

              <div className="border-l-2 border-amber-400 pl-3 py-1 space-y-0.5">
                <span className="text-[10px] text-muted-foreground font-mono">
                  F1 — Enriquecimento IA
                </span>
                <div className="font-bold text-slate-800">
                  {formatCiafalMetric(selectedRecord.f1AiEnriched, unit)}
                </div>
                <span className="text-[10px] text-muted-foreground">
                  Sinais preditivos + Pipeline ponderado
                </span>
              </div>

              {selectedRecord.f2AdjustedBy && (
                <div className="border-l-2 border-blue-400 pl-3 py-1 space-y-0.5 bg-blue-50/40 p-2 rounded-r-xl">
                  <span className="text-[10px] text-blue-900 font-bold font-mono">
                    F2 — Ajuste do Vendedor
                  </span>
                  <div className="font-bold text-slate-800">
                    {formatCiafalMetric(selectedRecord.f2SellerAdjusted, unit)}
                  </div>
                  <span className="text-[11px] text-slate-700 block">
                    "{selectedRecord.f2Justification}"
                  </span>
                  <span className="text-[9px] text-muted-foreground block">
                    Por: {selectedRecord.f2AdjustedBy} •{' '}
                    {selectedRecord.f2AdjustedAt
                      ? new Date(selectedRecord.f2AdjustedAt).toLocaleString('pt-BR')
                      : '-'}
                  </span>
                </div>
              )}

              {selectedRecord.f3AdjustedBy && (
                <div className="border-l-2 border-purple-400 pl-3 py-1 space-y-0.5 bg-purple-50/40 p-2 rounded-r-xl">
                  <span className="text-[10px] text-purple-900 font-bold font-mono">
                    F3 — Ajuste da Gestão
                  </span>
                  <div className="font-bold text-slate-800">
                    {formatCiafalMetric(selectedRecord.f3ManagementAdjusted || 0, unit)}
                  </div>
                  <span className="text-[11px] text-slate-700 block">
                    "{selectedRecord.f3Justification}"
                  </span>
                  <span className="text-[9px] text-muted-foreground block">
                    Por: {selectedRecord.f3AdjustedBy} •{' '}
                    {selectedRecord.f3AdjustedAt
                      ? new Date(selectedRecord.f3AdjustedAt).toLocaleString('pt-BR')
                      : '-'}
                  </span>
                </div>
              )}

              <div className="border-l-2 border-emerald-500 pl-3 py-1 space-y-0.5 bg-emerald-50/40 p-2 rounded-r-xl">
                <span className="text-[10px] text-emerald-900 font-bold font-mono">
                  F4 — Consensual S&OP
                </span>
                <div className="font-extrabold text-emerald-950 text-sm">
                  {formatCiafalMetric(selectedRecord.f4SopConsensual, unit)}
                </div>
                <span className="text-[10px] text-emerald-800 font-semibold block">
                  Número oficial de demanda publicado
                </span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAuditModalOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
