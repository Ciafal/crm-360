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
  UserCheck,
  Calendar,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  Phone,
  MessageCircle,
  FileCheck,
  Save,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface SopSellerPlanningViewProps {
  records: SopForecastRecord[]
  unit: UnitType
  onRecordUpdated?: () => void
  userRole?: string
  userName?: string
}

export function SopSellerPlanningView({
  records,
  unit,
  onRecordUpdated,
  userName = 'Carlos Mendonça',
}: SopSellerPlanningViewProps) {
  const [selectedRecord, setSelectedRecord] = useState<SopForecastRecord | null>(null)
  const [adjustModalOpen, setAdjustModalOpen] = useState(false)
  const [sellerAdjustValue, setSellerAdjustValue] = useState<number>(0)
  const [justification, setJustification] = useState('')
  const [proposedTarget, setProposedTarget] = useState<number>(0)
  const [isSaving, setIsSaving] = useState(false)

  const handleOpenPlan = (r: SopForecastRecord) => {
    setSelectedRecord(r)
    setSellerAdjustValue(r.f2SellerAdjusted)
    setJustification(r.f2Justification || '')
    setProposedTarget(r.targetProposed || r.targetSuggested)
    setAdjustModalOpen(true)
  }

  const handleSavePlan = async () => {
    if (!selectedRecord) return
    setIsSaving(true)
    try {
      await sopService.saveForecastAdjustment(
        selectedRecord.id,
        'F2',
        Number(sellerAdjustValue),
        justification || 'Ajuste de volume planejado pelo vendedor.',
        userName,
      )
      await sopService.saveForecastAdjustment(
        selectedRecord.id,
        'TARGET_PROPOSED',
        Number(proposedTarget),
        'Meta proposta pelo vendedor.',
        userName,
      )
      toast.success('Planejamento do cliente e meta propostos salvos!')
      setAdjustModalOpen(false)
      onRecordUpdated?.()
    } catch {
      toast.error('Erro ao salvar planejamento.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg font-bold text-primary flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-primary" />
            Planejamento Individual do Vendedor
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Fluxo passo a passo: Cliente ➔ Histórico QLIK ➔ Produtos ➔ Forecast Estatístico ➔
            Forecast IA ➔ Ajuste Vendedor ➔ Proposta de Meta.
          </p>
        </div>

        <Badge variant="outline" className="text-xs bg-white text-slate-700 font-mono">
          Fonte: QLIK ({QLIK_LAST_SYNC})
        </Badge>
      </div>

      {/* 2. LISTA DE CLIENTES DA CARTEIRA */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {records.map((r) => {
          const nextAction = r.nextBestAction
          const nextProd = r.nextBestProduct
          const nextPurchase = r.nextPurchaseEstimate

          return (
            <Card
              key={r.id}
              className="rounded-3xl border border-border/60 bg-white shadow-xs overflow-hidden flex flex-col justify-between"
            >
              <CardHeader className="p-4 border-b border-border/40 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className="text-[9px] font-mono font-bold bg-white text-primary"
                  >
                    {r.customerId}
                  </Badge>
                  <Badge className="bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                    Confiança: {r.modelConfidence}
                  </Badge>
                </div>
                <CardTitle className="font-serif text-sm font-bold text-slate-900 mt-1">
                  {r.customerName}
                </CardTitle>
                <p className="text-[11px] text-muted-foreground truncate">{r.productName}</p>
              </CardHeader>

              <CardContent className="p-4 space-y-3 text-xs flex-1 flex flex-col justify-between">
                {/* FORECAST STATS */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-slate-50 border text-center">
                  <div>
                    <span className="text-[9px] text-muted-foreground block">F0 Estatístico</span>
                    <strong className="font-mono text-xs text-indigo-900 block">
                      {formatCiafalMetric(r.f0Statistical, unit)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-muted-foreground block">F1 IA Sugerido</span>
                    <strong className="font-mono text-xs text-amber-900 block">
                      {formatCiafalMetric(r.f1AiEnriched, unit)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-muted-foreground block">F2 Meu Ajuste</span>
                    <strong className="font-mono text-xs text-blue-900 block">
                      {formatCiafalMetric(r.f2SellerAdjusted, unit)}
                    </strong>
                  </div>
                </div>

                {/* PRÓXIMA COMPRA & NEXT BEST PRODUCT */}
                <div className="space-y-2 text-[11px]">
                  {nextPurchase && (
                    <div className="p-2 rounded-xl bg-sky-50/60 border border-sky-100 flex items-center justify-between">
                      <span className="text-sky-900 font-medium">Janela Próx. Compra:</span>
                      <strong className="text-sky-950 font-mono">
                        {nextPurchase.probableWindowStart} ~ {nextPurchase.probableWindowEnd}
                      </strong>
                    </div>
                  )}

                  {nextProd && (
                    <div className="p-2 rounded-xl bg-amber-50/60 border border-amber-100 space-y-0.5">
                      <div className="flex items-center justify-between text-amber-900 font-bold">
                        <span className="flex items-center gap-1">
                          <ShoppingBag className="w-3 h-3 text-amber-700" /> Next Best Product:
                        </span>
                        <span className="font-mono font-normal text-[10px]">
                          Estoque WMS: {nextProd.stockAvailableTons} t
                        </span>
                      </div>
                      <span className="block text-slate-800 text-[10px] font-medium truncate">
                        {nextProd.productName}
                      </span>
                    </div>
                  )}

                  {nextAction && (
                    <div className="p-2 rounded-xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between">
                      <span className="text-emerald-950 font-medium flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-emerald-700" /> Ação Recomendada:
                      </span>
                      <Badge className="bg-emerald-600 text-white text-[9px] font-bold">
                        {nextAction.action}
                      </Badge>
                    </div>
                  )}
                </div>

                <Button
                  onClick={() => handleOpenPlan(r)}
                  className="w-full bg-primary text-white text-xs font-bold gap-1.5 h-8 rounded-xl mt-2"
                >
                  Planejar Demanda & Meta <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* MODAL: AJUSTE DO VENDEDOR */}
      <Dialog open={adjustModalOpen} onOpenChange={setAdjustModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-bold text-primary flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" />
              Planejar Demanda do Cliente (F2)
            </DialogTitle>
            <DialogDescription className="text-xs">
              {selectedRecord?.customerName} • {selectedRecord?.productName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl border space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">F0 Motor Matemático:</span>
                <strong className="font-mono">
                  {formatCiafalMetric(selectedRecord?.f0Statistical || 0, unit)}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">F1 Sugerido pela IA:</span>
                <strong className="font-mono text-amber-900">
                  {formatCiafalMetric(selectedRecord?.f1AiEnriched || 0, unit)}
                </strong>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-800">Meu Forecast Comercial (F2):</label>
              <Input
                type="number"
                value={sellerAdjustValue}
                onChange={(e) => setSellerAdjustValue(parseFloat(e.target.value) || 0)}
                className="font-mono text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-800">Proposta de Meta Individual:</label>
              <Input
                type="number"
                value={proposedTarget}
                onChange={(e) => setProposedTarget(parseFloat(e.target.value) || 0)}
                className="font-mono text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-800">Justificativa Comercial:</label>
              <textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Ex: Cliente aumentando consumo para entrega de obra..."
                rows={2}
                className="w-full p-2.5 rounded-xl border text-xs focus:outline-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAdjustModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSavePlan}
              disabled={isSaving}
              className="bg-primary text-white font-bold"
            >
              {isSaving ? 'Salvando...' : 'Salvar Planejamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
