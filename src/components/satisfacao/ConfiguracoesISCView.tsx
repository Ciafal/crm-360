import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  Settings2,
  Sliders,
  RotateCcw,
  History,
  CheckCircle2,
  AlertTriangle,
  Info,
  Shield,
  Layers,
  Save,
} from 'lucide-react'
import { ISCPesosConfig, ISCPesoHistoryEntry, ISCBandConfig } from '@/types/satisfaction'
import { DEFAULT_ISC_PESOS } from '@/services/isc_engine'
import { toast } from 'sonner'

interface ConfiguracoesISCViewProps {
  pesos: ISCPesosConfig
  pesosHistory: ISCPesoHistoryEntry[]
  bands: ISCBandConfig[]
  isAdminMaster: boolean
  onSavePesos: (novosPesos: ISCPesosConfig, motivo: string) => void
  onSaveBands: (bands: ISCBandConfig[]) => void
}

export function ConfiguracoesISCView({
  pesos,
  pesosHistory,
  bands,
  isAdminMaster,
  onSavePesos,
  onSaveBands,
}: ConfiguracoesISCViewProps) {
  const [qualidade, setQualidade] = useState(pesos.qualidade)
  const [logistica, setLogistica] = useState(pesos.logistica)
  const [comercial, setComercial] = useState(pesos.comercial)
  const [financeiro, setFinanceiro] = useState(pesos.financeiro)
  const [pesquisa, setPesquisa] = useState(pesos.pesquisa)
  const [motivo, setMotivo] = useState('')

  // Faixas editáveis
  const [editableBands, setEditableBands] = useState<ISCBandConfig[]>(bands)

  const somaPesos = qualidade + logistica + comercial + financeiro + pesquisa
  const isSomaValida = Math.abs(somaPesos - 100) < 0.001

  const handleSalvarPesos = () => {
    if (!isAdminMaster) {
      toast.error(
        'Apenas o Administrador Master tem permissão para alterar os pesos corporativos do ISC.',
      )
      return
    }

    if (!isSomaValida) {
      toast.error(`A soma dos pesos deve ser exatamente 100%. Soma atual: ${somaPesos}%.`)
      return
    }

    if (!motivo.trim()) {
      toast.error(
        'Informe o motivo da alteração dos pesos para registro na governança e auditoria.',
      )
      return
    }

    onSavePesos(
      {
        qualidade,
        logistica,
        comercial,
        financeiro,
        pesquisa,
      },
      motivo,
    )
    setMotivo('')
  }

  const handleRestaurarPadrao = () => {
    setQualidade(DEFAULT_ISC_PESOS.qualidade)
    setLogistica(DEFAULT_ISC_PESOS.logistica)
    setComercial(DEFAULT_ISC_PESOS.comercial)
    setFinanceiro(DEFAULT_ISC_PESOS.financeiro)
    setPesquisa(DEFAULT_ISC_PESOS.pesquisa)
    toast.info(
      'Pesos redefinidos para a sugestão padrão CIAFAL (25/25/20/15/15). Clique em salvar com o motivo.',
    )
  }

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-3xl bg-slate-900 border border-slate-800">
        <div>
          <h3 className="font-serif text-base font-bold text-white flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-sky-400" />
            Configurações & Governança do Motor ISC
          </h3>
          <p className="text-xs text-slate-400">
            Parametrização de pesos das 5 dimensões, faixas de classificação e rastreabilidade de
            histórico.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdminMaster ? (
            <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs gap-1.5 py-1">
              <Shield className="w-3.5 h-3.5" /> Administrador Master Autorizado
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="bg-amber-500/10 text-amber-300 border-amber-500/30 text-xs"
            >
              Modo Somente Leitura (Requer Perfil Master)
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUNA ESQUERDA: CONFIGURADOR DE PESOS */}
        <Card className="lg:col-span-2 p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2 font-serif">
                <Sliders className="w-4 h-4 text-sky-400" />
                Pesos das Dimensões do ISC (Soma Obrigatória = 100%)
              </h4>
              <span className="text-xs text-slate-400">
                Ajuste a ponderação de cada dimensão no cálculo do score geral.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={!isAdminMaster}
                onClick={handleRestaurarPadrao}
                className="h-8 text-xs text-slate-300 border-slate-700 hover:bg-slate-900 rounded-xl"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" /> Padrão
              </Button>
            </div>
          </div>

          {/* TOTALIZADOR DA SOMA */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between ${
              isSomaValida
                ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/20 border-rose-500/40 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-bold">
              {isSomaValida ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              )}
              <span>Soma dos Pesos: {somaPesos}%</span>
            </div>
            <span className="text-[11px] font-mono">
              {isSomaValida ? 'Válido para cálculo' : `Diferença: ${100 - somaPesos}%`}
            </span>
          </div>

          {/* SLIDERS DAS 5 DIMENSÕES */}
          <div className="space-y-5">
            {/* 1. Qualidade */}
            <div className="space-y-2 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <strong className="text-white block">A) Dimensão Qualidade</strong>
                  <span className="text-[11px] text-slate-400">
                    Reclamações SAC, NCs, devoluções, tempo de resposta, eficácia corretiva.
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="text-sm font-bold bg-slate-950 text-sky-400 border-sky-500/40"
                >
                  {qualidade}%
                </Badge>
              </div>
              <Slider
                disabled={!isAdminMaster}
                value={[qualidade]}
                min={0}
                max={60}
                step={1}
                onValueChange={(val) => setQualidade(val[0])}
                className="py-2"
              />
            </div>

            {/* 2. Logística */}
            <div className="space-y-2 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <strong className="text-white block">B) Dimensão Logística & Entregas</strong>
                  <span className="text-[11px] text-slate-400">
                    OTIF, pontualidade de frota CIAFAL, ocorrências TMS, carga parcial, avarias.
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="text-sm font-bold bg-slate-950 text-sky-400 border-sky-500/40"
                >
                  {logistica}%
                </Badge>
              </div>
              <Slider
                disabled={!isAdminMaster}
                value={[logistica]}
                min={0}
                max={60}
                step={1}
                onValueChange={(val) => setLogistica(val[0])}
                className="py-2"
              />
            </div>

            {/* 3. Comercial */}
            <div className="space-y-2 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <strong className="text-white block">
                    C) Dimensão Comercial & Relacionamento
                  </strong>
                  <span className="text-[11px] text-slate-400">
                    Frequência de contato, tarefas vencidas, cotações, queda de volume e perda de
                    mix.
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="text-sm font-bold bg-slate-950 text-sky-400 border-sky-500/40"
                >
                  {comercial}%
                </Badge>
              </div>
              <Slider
                disabled={!isAdminMaster}
                value={[comercial]}
                min={0}
                max={60}
                step={1}
                onValueChange={(val) => setComercial(val[0])}
                className="py-2"
              />
            </div>

            {/* 4. Financeiro */}
            <div className="space-y-2 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <strong className="text-white block">
                    D) Dimensão Financeiro (Fatores Objetivos)
                  </strong>
                  <span className="text-[11px] text-slate-400">
                    Comportamento de pagamento, títulos vencidos, bloqueios SAP ECC, renegociações.
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="text-sm font-bold bg-slate-950 text-sky-400 border-sky-500/40"
                >
                  {financeiro}%
                </Badge>
              </div>
              <Slider
                disabled={!isAdminMaster}
                value={[financeiro]}
                min={0}
                max={60}
                step={1}
                onValueChange={(val) => setFinanceiro(val[0])}
                className="py-2"
              />
            </div>

            {/* 5. Pesquisa */}
            <div className="space-y-2 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <strong className="text-white block">E) Dimensão Pesquisa Direta</strong>
                  <span className="text-[11px] text-slate-400">
                    NPS, CSAT produto/comercial/entrega, comentários livres (não determina o ISC
                    sozinho).
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="text-sm font-bold bg-slate-950 text-sky-400 border-sky-500/40"
                >
                  {pesquisa}%
                </Badge>
              </div>
              <Slider
                disabled={!isAdminMaster}
                value={[pesquisa]}
                min={0}
                max={60}
                step={1}
                onValueChange={(val) => setPesquisa(val[0])}
                className="py-2"
              />
            </div>
          </div>

          {/* MOTIVO E BOTÃO DE SALVAR */}
          {isAdminMaster && (
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <Label className="text-xs text-slate-300">
                Motivo da Alteração de Pesos (Obrigatório para Auditoria)
              </Label>
              <Input
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ex: Ajuste semestral de política de satisfação com foco em frete e SAC"
                className="bg-slate-900 border-slate-800 text-xs rounded-xl text-white"
              />
              <Button
                onClick={handleSalvarPesos}
                disabled={!isSomaValida || !motivo.trim()}
                className="w-full h-10 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs rounded-xl shadow-xs gap-1.5"
              >
                <Save className="w-4 h-4" /> Salvar Novos Pesos e Recalcular Toda a Carteira
              </Button>
            </div>
          )}
        </Card>

        {/* COLUNA DIREITA: FAIXAS PARAMETRIZÁVEIS & HISTÓRICO DE AUDITORIA */}
        <div className="space-y-6">
          {/* FAIXAS DO ISC */}
          <Card className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 font-serif border-b border-slate-800/80 pb-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              Faixas Parametrizáveis do ISC
            </h4>

            <div className="space-y-2">
              {bands.map((b) => (
                <div
                  key={b.band}
                  className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: b.color }}
                    />
                    <strong className="text-white">{b.label}</strong>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs font-mono font-bold ${b.badgeClass}`}
                  >
                    {b.min} a {b.max} pts
                  </Badge>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-400">
              As faixas permitem segmentar alertas de risco preventivo antes que clientes cheguem ao
              nível crítico.
            </p>
          </Card>

          {/* HISTÓRICO DE AUDITORIA DE PESOS */}
          <Card className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
            <h4 className="text-sm font-bold text-white flex items-center gap-2 font-serif border-b border-slate-800/80 pb-2">
              <History className="w-4 h-4 text-amber-400" />
              Histórico de Alterações de Pesos
            </h4>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {pesosHistory.map((h) => (
                <div
                  key={h.id}
                  className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <strong className="text-sky-300">{h.updatedBy}</strong>
                    <span className="text-slate-400">{h.updatedAt}</span>
                  </div>
                  <p className="text-slate-300 text-[11px] italic">"{h.motivo}"</p>
                  <div className="text-[10px] text-slate-400 font-mono bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                    Q:{h.pesosNovos.qualidade}% | L:{h.pesosNovos.logistica}% | C:
                    {h.pesosNovos.comercial}% | F:{h.pesosNovos.financeiro}% | P:
                    {h.pesosNovos.pesquisa}%
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
