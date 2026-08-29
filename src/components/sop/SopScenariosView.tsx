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
import { SopScenarioSimulation } from '@/types/sop'
import { formatCiafalMetric } from '@/services/forecast_engine'
import { sopService } from '@/services/sop_service'
import {
  SlidersHorizontal,
  Plus,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Factory,
  Truck,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface SopScenariosViewProps {
  scenarios: SopScenarioSimulation[]
  onScenarioCreated?: () => void
  userRole?: string
  userName?: string
}

export function SopScenariosView({
  scenarios,
  onScenarioCreated,
  userRole,
  userName = 'Roberto Silveira',
}: SopScenariosViewProps) {
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deltaTons, setDeltaTons] = useState<number>(500)
  const [deltaRevenueBrl, setDeltaRevenueBrl] = useState<number>(3250000)
  const [industrialImpact, setIndustrialImpact] = useState('')
  const [logisticsImpact, setLogisticsImpact] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error('Informe o título do cenário.')
      return
    }

    setIsCreating(true)
    try {
      await sopService.createScenario({
        title,
        description,
        scenarioType: 'CUSTOM',
        cycleYearMonth: '2026-03',
        deltaTons: Number(deltaTons),
        deltaRevenueBrl: Number(deltaRevenueBrl),
        industrialImpact: industrialImpact || 'Impacto industrial avaliado pelo PCP.',
        logisticsImpact: logisticsImpact || 'Capacidade logística contratada via TMS.',
        authorName: userName,
        isFavorite: false,
      })
      toast.success('Novo cenário simulado gravado com sucesso!')
      setCreateModalOpen(false)
      setTitle('')
      setDescription('')
      onScenarioCreated?.()
    } catch {
      toast.error('Erro ao salvar cenário.')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg font-bold text-primary flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-primary" />
            Simulador de Cenários & Análise "E Se?" (What-If)
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Compare variações de demanda, choques de fornecimento e impactos em PCP, WMS e
            Faturamento.
          </p>
        </div>

        <Button
          onClick={() => setCreateModalOpen(true)}
          className="bg-primary text-white text-xs font-bold gap-1.5 h-8 rounded-xl"
        >
          <Plus className="w-4 h-4" /> Novo Cenário / Simulação
        </Button>
      </div>

      {/* LISTA DE CENÁRIOS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scenarios.map((sc) => {
          const isPositive = sc.deltaTons >= 0

          return (
            <Card
              key={sc.id}
              className={cn(
                'rounded-3xl border bg-white shadow-xs overflow-hidden flex flex-col justify-between',
                sc.scenarioType === 'CONSENSUAL'
                  ? 'border-emerald-300 ring-2 ring-emerald-500/20'
                  : 'border-border/60',
              )}
            >
              <CardHeader className="p-4 border-b border-border/40 bg-slate-50/50">
                <div className="flex items-center justify-between gap-1">
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[9px] font-mono font-bold',
                      sc.scenarioType === 'CONSENSUAL'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : sc.scenarioType === 'OTIMISTA'
                          ? 'bg-blue-50 text-blue-800 border-blue-300'
                          : 'bg-slate-100 text-slate-800 border-slate-300',
                    )}
                  >
                    {sc.scenarioType}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">{sc.authorName}</span>
                </div>
                <CardTitle className="font-serif text-sm font-bold text-slate-900 mt-1">
                  {sc.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="p-4 space-y-3 text-xs flex-1 flex flex-col justify-between">
                <p className="text-slate-600 text-[11px]">{sc.description}</p>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-border/40 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delta Demanda:</span>
                    <strong
                      className={cn(
                        'font-mono font-bold',
                        sc.deltaTons > 0
                          ? 'text-blue-700'
                          : sc.deltaTons < 0
                            ? 'text-rose-700'
                            : 'text-slate-800',
                      )}
                    >
                      {sc.deltaTons > 0 ? `+` : ``}
                      {formatCiafalMetric(sc.deltaTons, 't')}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delta Faturamento:</span>
                    <strong
                      className={cn(
                        'font-mono font-bold',
                        sc.deltaRevenueBrl > 0
                          ? 'text-blue-700'
                          : sc.deltaRevenueBrl < 0
                            ? 'text-rose-700'
                            : 'text-slate-800',
                      )}
                    >
                      {sc.deltaRevenueBrl > 0 ? `+` : ``}
                      {formatCiafalMetric(sc.deltaRevenueBrl, 'brl')}
                    </strong>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1 border-t text-[11px]">
                  <div className="flex items-start gap-1.5 text-indigo-950">
                    <Factory className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                    <span>{sc.industrialImpact}</span>
                  </div>
                  <div className="flex items-start gap-1.5 text-sky-950">
                    <Truck className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                    <span>{sc.logisticsImpact}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* MODAL: CRIAR CENÁRIO */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-bold text-primary flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Criar Nova Simulação de Cenário
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure premissas operacionais e comerciais para rodar o modelo preditivo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-800">Título do Cenário:</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Expansão Linha de Vergalhões (+20%)"
                className="text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-800">Descrição / Premissas:</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Aquisição de novo cliente estrutural no interior de SP..."
                rows={2}
                className="w-full p-2.5 rounded-xl border text-xs focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-bold text-slate-800">Delta Volume (t):</label>
                <Input
                  type="number"
                  value={deltaTons}
                  onChange={(e) => setDeltaTons(parseFloat(e.target.value) || 0)}
                  className="font-mono text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800">Delta Faturamento (R$):</label>
                <Input
                  type="number"
                  value={deltaRevenueBrl}
                  onChange={(e) => setDeltaRevenueBrl(parseFloat(e.target.value) || 0)}
                  className="font-mono text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-800">Impacto Industrial (PCP):</label>
              <Input
                value={industrialImpact}
                onChange={(e) => setIndustrialImpact(e.target.value)}
                placeholder="Ex: Alocação de 1 turno extra na linha 2"
                className="text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-800">Impacto Logístico (TMS):</label>
              <Input
                value={logisticsImpact}
                onChange={(e) => setLogisticsImpact(e.target.value)}
                placeholder="Ex: Contratação de 15 carretas spot"
                className="text-xs rounded-xl"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setCreateModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={isCreating}
              className="bg-primary text-white font-bold"
            >
              {isCreating ? 'Simulando...' : 'Salvar Cenário'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
