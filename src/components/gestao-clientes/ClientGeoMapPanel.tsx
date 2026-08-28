// src/components/gestao-clientes/ClientGeoMapPanel.tsx
import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  MapPin,
  Sparkles,
  Layers,
  Building2,
  TrendingUp,
  AlertTriangle,
  Globe2,
  ShieldAlert,
} from 'lucide-react'
import type { CustomerManagementItem, RegionalGeoMetric } from '@/types/customer_management'
import { toast } from 'sonner'

interface ClientGeoMapPanelProps {
  clientes: CustomerManagementItem[]
  regionalMetrics: RegionalGeoMetric[]
  onSelectClient: (cliente: CustomerManagementItem) => void
}

export function ClientGeoMapPanel({
  clientes,
  regionalMetrics,
  onSelectClient,
}: ClientGeoMapPanelProps) {
  const [selectedUf, setSelectedUf] = useState<string>('MG')
  const [activeLayer, setActiveLayer] = useState<'todos' | 'risco' | 'descobertos' | 'cotacoes'>(
    'todos',
  )
  const [isAnalyzingRegion, setIsAnalyzingRegion] = useState(false)
  const [aiRegionalInsight, setAiRegionalInsight] = useState<string | null>(null)

  const selectedMetric = regionalMetrics.find((m) => m.uf === selectedUf) || regionalMetrics[0]

  const filteredGeoClients = clientes.filter((c) => {
    if (c.uf !== selectedUf) return false
    if (activeLayer === 'risco' && c.classificacao !== 'EM_RISCO') return false
    if (activeLayer === 'descobertos' && c.coberto) return false
    if (activeLayer === 'cotacoes' && c.cotacoesAbertasCount === 0) return false
    return true
  })

  const handleAnalyzeRegionAI = () => {
    setIsAnalyzingRegion(true)
    setTimeout(() => {
      setIsAnalyzingRegion(false)
      setAiRegionalInsight(
        `Diagnóstico IA para ${selectedMetric.nomeEstado} (${selectedMetric.uf}): Cobertura atual em ${selectedMetric.coberturaPct}% com forte concentração em ${selectedMetric.municipiosAtendidos} municípios e ${selectedMetric.municipiosSemClientes} cidades sem presença CIAFAL. Oportunidade prioritária: expandir atuação no Polo Metalmecânico com oferta estruturada de Perfis W e Vergalhões CA-50, onde há 110t em cotações e especulações represadas.`,
      )
      toast.success(`Análise Regional IA gerada para ${selectedMetric.nomeEstado}!`)
    }, 600)
  }

  return (
    <div className="space-y-4">
      {/* 1. TOPO: CAMADAS E SELETOR DE ESTADOS (MAPA BRASIL DRILL-DOWN) */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <Globe2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Mapa Geral da Carteira & Penetração Regional
              <Badge className="bg-[#003A70] text-sky-200 border-[#005a9c] text-[10px]">
                Drill: Brasil → Estado → Município
              </Badge>
            </h3>
            <p className="text-xs text-slate-400">
              Visualização de concentração de carteira, vazios territoriais, cobertura por estado e
              clientes em risco.
            </p>
          </div>
        </div>

        {/* Camadas do Mapa (Regra 52) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-slate-400 uppercase font-bold mr-1">Camadas:</span>
          <Button
            size="sm"
            variant={activeLayer === 'todos' ? 'default' : 'outline'}
            onClick={() => setActiveLayer('todos')}
            className={`h-7 text-xs rounded-xl ${
              activeLayer === 'todos' ? 'bg-sky-600 text-white' : 'border-slate-800 text-slate-400'
            }`}
          >
            Todos
          </Button>
          <Button
            size="sm"
            variant={activeLayer === 'descobertos' ? 'default' : 'outline'}
            onClick={() => setActiveLayer('descobertos')}
            className={`h-7 text-xs rounded-xl ${
              activeLayer === 'descobertos'
                ? 'bg-rose-600 text-white'
                : 'border-slate-800 text-rose-400'
            }`}
          >
            Sem Cobertura
          </Button>
          <Button
            size="sm"
            variant={activeLayer === 'risco' ? 'default' : 'outline'}
            onClick={() => setActiveLayer('risco')}
            className={`h-7 text-xs rounded-xl ${
              activeLayer === 'risco'
                ? 'bg-orange-600 text-white'
                : 'border-slate-800 text-orange-400'
            }`}
          >
            Em Risco
          </Button>
          <Button
            size="sm"
            variant={activeLayer === 'cotacoes' ? 'default' : 'outline'}
            onClick={() => setActiveLayer('cotacoes')}
            className={`h-7 text-xs rounded-xl ${
              activeLayer === 'cotacoes'
                ? 'bg-emerald-600 text-white'
                : 'border-slate-800 text-emerald-400'
            }`}
          >
            Com Cotações
          </Button>
        </div>
      </div>

      {/* 2. GRID DO MAPA E INDICADORES REGIONAIS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Painel Esquerdo: Estados Atendidos */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Estados Atendidos (Drill Regional)
          </span>

          <div className="space-y-2">
            {regionalMetrics.map((met) => {
              const isSelected = met.uf === selectedUf
              return (
                <div
                  key={met.uf}
                  onClick={() => {
                    setSelectedUf(met.uf)
                    setAiRegionalInsight(null)
                  }}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-sky-950/60 border-sky-500 shadow-md'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-slate-800 text-white font-mono font-bold text-xs">
                        {met.uf}
                      </Badge>
                      <strong className="text-white text-xs">{met.nomeEstado}</strong>
                    </div>
                    <span className="text-xs font-mono font-bold text-sky-400">
                      {met.coberturaPct}% Cob.
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-800/80 text-[10px]">
                    <div>
                      <span className="text-slate-500 block">Clientes</span>
                      <strong className="text-slate-200">{met.totalClientes}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Faturamento</span>
                      <strong className="text-slate-200">
                        R$ {(met.faturamentoMes / 1000).toFixed(0)}k
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Volume</span>
                      <strong className="text-slate-200">{met.toneladasMes} t</strong>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <Button
            onClick={handleAnalyzeRegionAI}
            disabled={isAnalyzingRegion}
            className="w-full h-9 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-2xl gap-1.5 shadow-sm mt-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isAnalyzingRegion ? 'Analisando Região...' : `Analisar Região ${selectedUf} com IA`}
          </Button>
        </div>

        {/* Painel Central e Direito: Mapa Interativo Simulado & Municípios */}
        <div className="lg:col-span-2 space-y-3">
          {aiRegionalInsight && (
            <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200 space-y-1.5 animate-fade-in">
              <span className="font-bold uppercase tracking-wider flex items-center gap-1.5 text-amber-400 text-[11px]">
                <Sparkles className="w-3.5 h-3.5" /> Diagnóstico Territorial de Inteligência IA
              </span>
              <p className="leading-relaxed text-[11px]">{aiRegionalInsight}</p>
            </div>
          )}

          <Card className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div>
                <strong className="text-sm text-white block">
                  Clientes Mapeados em {selectedMetric.nomeEstado} ({filteredGeoClients.length})
                </strong>
                <span className="text-[11px] text-slate-400">
                  {selectedMetric.municipiosAtendidos} municípios atendidos ·{' '}
                  {selectedMetric.municipiosSemClientes} municípios potenciais
                </span>
              </div>
              <Badge variant="outline" className="text-xs font-mono border-sky-500/50 text-sky-300">
                ISC Médio: {selectedMetric.iscMedio} · OTIF: {selectedMetric.otifMedio}%
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[420px] overflow-y-auto pr-1">
              {filteredGeoClients.map((cli) => (
                <div
                  key={cli.id}
                  onClick={() => onSelectClient(cli)}
                  className="p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-sky-500/60 transition-all cursor-pointer flex flex-col justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-sky-400 font-bold">
                        {cli.codigo}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          cli.coberto
                            ? 'bg-emerald-950 text-emerald-400'
                            : 'bg-rose-950 text-rose-400'
                        }`}
                      >
                        {cli.coberto ? 'Coberto' : `Vencido ${cli.coberturaVencidaDias}d`}
                      </span>
                    </div>
                    <strong className="text-xs text-white block leading-snug">
                      {cli.nomeFantasia}
                    </strong>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500" /> {cli.cidade} - {cli.uf} (
                      {cli.regiao})
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80 text-[10px] text-slate-400">
                    <span>
                      Vendedor: <strong className="text-slate-200">{cli.vendedorNome}</strong>
                    </span>
                    <span className="text-sky-400 font-bold hover:underline">Ver Ficha 360 →</span>
                  </div>
                </div>
              ))}

              {filteredGeoClients.length === 0 && (
                <div className="col-span-2 p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                  Nenhum cliente encontrado para a camada "{activeLayer}" no estado de{' '}
                  {selectedMetric.nomeEstado}.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
