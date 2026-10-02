// src/components/gestao-clientes/ClientGeoMapPanel.tsx
import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Sparkles, Globe2 } from 'lucide-react'
import type { CustomerManagementItem, RegionalGeoMetric } from '@/types/customer_management'
import { toast } from 'sonner'
import { StatusBadge } from './shared/GestaoClientesUiKit'

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
      {/* 1. TOPO: CAMADAS E SELETOR DE ESTADOS (Fundo Claro / Azul CIAFAL) */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#003A70]/10 text-[#003A70] border border-[#003A70]/20 shrink-0">
            <Globe2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-serif text-base sm:text-lg font-bold text-[#003A70] tracking-tight">
                Mapa Geral da Carteira & Penetração Regional
              </h3>
              <Badge
                variant="outline"
                className="bg-[#EBF3FA] text-[#003A70] border-[#003A70]/30 text-[10px] font-medium"
              >
                Brasil → Estado → Município
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Visualização de concentração de carteira, vazios territoriais, cobertura por estado e
              clientes em risco.
            </p>
          </div>
        </div>

        {/* Camadas do Mapa (Padronizado CIAFAL: Ativo em #003A70, sem rainbow) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-slate-500 uppercase font-bold mr-1">Camadas:</span>
          <Button
            size="sm"
            variant={activeLayer === 'todos' ? 'default' : 'outline'}
            onClick={() => setActiveLayer('todos')}
            className={`h-7 text-xs rounded-xl font-medium ${
              activeLayer === 'todos'
                ? 'bg-[#003A70] text-white hover:bg-[#002850] shadow-2xs'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            Todos
          </Button>
          <Button
            size="sm"
            variant={activeLayer === 'descobertos' ? 'default' : 'outline'}
            onClick={() => setActiveLayer('descobertos')}
            className={`h-7 text-xs rounded-xl font-medium ${
              activeLayer === 'descobertos'
                ? 'bg-red-700 text-white hover:bg-red-800 shadow-2xs'
                : 'border-slate-200 bg-white text-red-700 hover:bg-red-50'
            }`}
          >
            Sem Cobertura
          </Button>
          <Button
            size="sm"
            variant={activeLayer === 'risco' ? 'default' : 'outline'}
            onClick={() => setActiveLayer('risco')}
            className={`h-7 text-xs rounded-xl font-medium ${
              activeLayer === 'risco'
                ? 'bg-amber-700 text-white hover:bg-amber-800 shadow-2xs'
                : 'border-slate-200 bg-white text-amber-800 hover:bg-amber-50'
            }`}
          >
            Em Risco
          </Button>
          <Button
            size="sm"
            variant={activeLayer === 'cotacoes' ? 'default' : 'outline'}
            onClick={() => setActiveLayer('cotacoes')}
            className={`h-7 text-xs rounded-xl font-medium ${
              activeLayer === 'cotacoes'
                ? 'bg-emerald-700 text-white hover:bg-emerald-800 shadow-2xs'
                : 'border-slate-200 bg-white text-emerald-800 hover:bg-emerald-50'
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
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
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
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all shadow-2xs ${
                    isSelected
                      ? 'bg-[#EBF3FA]/50 border-[#003A70] ring-2 ring-[#003A70]/20'
                      : 'bg-white border-slate-200 hover:border-[#003A70]/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-slate-100 text-slate-800 border-slate-200 font-mono font-bold text-xs">
                        {met.uf}
                      </Badge>
                      <strong className="text-slate-900 text-xs font-semibold">
                        {met.nomeEstado}
                      </strong>
                    </div>
                    <span className="text-xs font-mono font-bold text-[#003A70]">
                      {met.coberturaPct}% Cob.
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-100 text-[10px]">
                    <div>
                      <span className="text-slate-500 block">Clientes</span>
                      <strong className="text-slate-800">{met.totalClientes}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Faturamento</span>
                      <strong className="text-slate-800">
                        R$ {(met.faturamentoMes / 1000).toFixed(0)}k
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Volume</span>
                      <strong className="text-slate-800">{met.toneladasMes} t</strong>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <Button
            onClick={handleAnalyzeRegionAI}
            disabled={isAnalyzingRegion}
            className="w-full h-9 bg-[#003A70] hover:bg-[#002850] text-white font-semibold text-xs rounded-xl gap-1.5 shadow-2xs mt-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isAnalyzingRegion ? 'Analisando Região...' : `Analisar Região ${selectedUf} com IA`}
          </Button>
        </div>

        {/* Painel Central e Direito: Municípios */}
        <div className="lg:col-span-2 space-y-3">
          {aiRegionalInsight && (
            <div className="p-4 rounded-2xl bg-[#EBF3FA] border border-[#003A70]/30 text-xs text-[#003A70] space-y-1.5 animate-fade-in shadow-2xs">
              <span className="font-bold uppercase tracking-wider flex items-center gap-1.5 text-[#003A70] text-[11px]">
                <Sparkles className="w-3.5 h-3.5" /> Diagnóstico Territorial de Inteligência IA
              </span>
              <p className="leading-relaxed text-[11px] text-slate-700">{aiRegionalInsight}</p>
            </div>
          )}

          <Card className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 text-slate-900 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 flex-wrap gap-2">
              <div>
                <strong className="text-sm text-slate-900 block font-semibold">
                  Clientes Mapeados em {selectedMetric.nomeEstado} ({filteredGeoClients.length})
                </strong>
                <span className="text-[11px] text-slate-500">
                  {selectedMetric.municipiosAtendidos} municípios atendidos ·{' '}
                  {selectedMetric.municipiosSemClientes} municípios potenciais
                </span>
              </div>
              <Badge
                variant="outline"
                className="text-xs font-mono border-slate-200 text-slate-700 bg-slate-50"
              >
                ISC Médio:{' '}
                <strong className="text-[#003A70] ml-1">{selectedMetric.iscMedio}</strong> · OTIF:{' '}
                <strong className="text-emerald-800 ml-1">{selectedMetric.otifMedio}%</strong>
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[420px] overflow-y-auto pr-1">
              {filteredGeoClients.map((cli) => (
                <div
                  key={cli.id}
                  onClick={() => onSelectClient(cli)}
                  className="p-3 rounded-xl bg-white border border-slate-200 hover:border-[#003A70]/50 transition-all cursor-pointer flex flex-col justify-between gap-2 shadow-2xs hover:shadow-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-[#003A70] font-bold">
                        {cli.codigo}
                      </span>
                      <StatusBadge
                        label={cli.coberto ? 'Coberto' : `Vencido ${cli.coberturaVencidaDias}d`}
                        variant={cli.coberto ? 'positive' : 'critical'}
                        dot
                      />
                    </div>
                    <strong className="text-xs text-slate-900 block leading-snug line-clamp-1">
                      {cli.nomeFantasia}
                    </strong>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" /> {cli.cidade} - {cli.uf} (
                      {cli.regiao})
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-[10px] text-slate-500">
                    <span>
                      Vendedor: <strong className="text-slate-800">{cli.vendedorNome}</strong>
                    </span>
                    <span className="text-[#003A70] font-semibold hover:underline">
                      Ver Ficha 360 →
                    </span>
                  </div>
                </div>
              ))}

              {filteredGeoClients.length === 0 && (
                <div className="col-span-2 p-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-2xl">
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
