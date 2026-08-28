import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Layers,
  Filter,
  CheckCircle2,
  AlertTriangle,
  History,
} from 'lucide-react'
import { ClienteSatisfacao360 } from '@/types/satisfaction'

interface EvolucaoSatisfacaoViewProps {
  clientes: ClienteSatisfacao360[]
  onSelectCliente: (cliente: ClienteSatisfacao360) => void
}

export function EvolucaoSatisfacaoView({ clientes, onSelectCliente }: EvolucaoSatisfacaoViewProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'3m' | '6m' | '12m' | '24m' | 'YTD'>('6m')
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>('todos')

  // Clientes que melhoraram e pioraram
  const melhoraram = clientes.filter((c) => c.iscVariacao > 0)
  const pioraram = clientes.filter((c) => c.iscVariacao < 0)
  const estaveis = clientes.filter((c) => c.iscVariacao === 0)

  // Histórico consolidado (médias dos clientes)
  const periods = ['Mai/24', 'Jun/24', 'Jul/24', 'Ago/24', 'Set/24', 'Out/24']
  const avgHistory = periods.map((p) => {
    let totalISC = 0
    let totalQ = 0
    let totalL = 0
    let totalC = 0
    let totalF = 0
    let totalP = 0
    let count = 0

    clientes.forEach((c) => {
      const pt = c.historicoISC.find((h) => h.periodo === p)
      if (pt) {
        totalISC += pt.isc
        totalQ += pt.qualidade
        totalL += pt.logistica
        totalC += pt.comercial
        totalF += pt.financeiro
        totalP += pt.pesquisa
        count++
      }
    })

    return {
      periodo: p,
      isc: count > 0 ? Math.round(totalISC / count) : 80,
      qualidade: count > 0 ? Math.round(totalQ / count) : 80,
      logistica: count > 0 ? Math.round(totalL / count) : 80,
      comercial: count > 0 ? Math.round(totalC / count) : 80,
      financeiro: count > 0 ? Math.round(totalF / count) : 90,
      pesquisa: count > 0 ? Math.round(totalP / count) : 80,
    }
  })

  return (
    <div className="space-y-6">
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-3xl bg-slate-900 border border-slate-800">
        <div>
          <h3 className="font-serif text-base font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-sky-400" />
            Evolução Histórica da Satisfação (Snapshots & Tendências)
          </h3>
          <p className="text-xs text-slate-400">
            Acompanhamento temporal do ISC oficial, sobreposição de eventos críticos e migração de
            faixas.
          </p>
        </div>

        {/* SELETOR DE PERÍODO */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800">
          {(['3m', '6m', '12m', '24m', 'YTD'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPeriod(p)}
              className={`px-3 py-1 text-xs font-semibold rounded-xl transition-all ${
                selectedPeriod === p
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* MÉTRICAS DE MIGRAÇÃO */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 rounded-3xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-400 block">
              Clientes que Melhoraram
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-serif text-white">{melhoraram.length}</span>
              <span className="text-xs text-emerald-400 font-semibold">
                (+{Math.round((melhoraram.length / (clientes.length || 1)) * 100)}%)
              </span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-4 rounded-3xl bg-rose-950/20 border border-rose-500/30 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-rose-400 block">
              Clientes que Pioraram
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-serif text-white">{pioraram.length}</span>
              <span className="text-xs text-rose-400 font-semibold">
                ({Math.round((pioraram.length / (clientes.length || 1)) * 100)}%)
              </span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-rose-500/20 text-rose-400">
            <TrendingDown className="w-6 h-6" />
          </div>
        </Card>

        <Card className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Estáveis / Sem Variação
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-serif text-white">{estaveis.length}</span>
              <span className="text-xs text-slate-400 font-semibold">
                ({Math.round((estaveis.length / (clientes.length || 1)) * 100)}%)
              </span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-800 text-slate-300">
            <Layers className="w-6 h-6" />
          </div>
        </Card>
      </div>

      {/* LINHA DO TEMPO CONSOLIDADA DA CARTEIRA */}
      <Card className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
        <h4 className="text-sm font-bold text-white flex items-center gap-2 font-serif border-b border-slate-800/80 pb-3">
          <Calendar className="w-4 h-4 text-sky-400" />
          Evolução dos Snapshots Mensais Médios da Carteira ({selectedPeriod})
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          {avgHistory.map((pt) => (
            <div
              key={pt.periodo}
              className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between text-center space-y-2"
            >
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider block">
                {pt.periodo}
              </span>
              <div>
                <strong className="text-2xl font-bold font-serif text-white block">{pt.isc}</strong>
                <span className="text-[10px] text-slate-400">ISC Médio</span>
              </div>

              <div className="text-[10px] text-slate-400 space-y-0.5 border-t border-slate-800 pt-2 text-left">
                <div className="flex justify-between">
                  <span>Qual:</span> <strong className="text-slate-300">{pt.qualidade}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Log:</span> <strong className="text-slate-300">{pt.logistica}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Com:</span> <strong className="text-slate-300">{pt.comercial}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Fin:</span> <strong className="text-slate-300">{pt.financeiro}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Pesq:</span> <strong className="text-slate-300">{pt.pesquisa}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* DETALHE POR CLIENTE COM EVENTOS RELEVANTES */}
      <Card className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
        <h4 className="text-sm font-bold text-white font-serif border-b border-slate-800/80 pb-3">
          Histórico Individual & Eventos Relevantes por Cliente
        </h4>

        <div className="space-y-3">
          {clientes.map((c) => (
            <div
              key={c.id}
              className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-all cursor-pointer"
              onClick={() => onSelectCliente(c)}
            >
              <div>
                <div className="flex items-center gap-2">
                  <strong className="text-sm font-bold text-white hover:underline">
                    {c.razaoSocial}
                  </strong>
                  <Badge variant="outline" className="text-xs bg-slate-950 text-slate-300">
                    SAP #{c.sapCode}
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-slate-950 text-sky-400">
                    {c.vendedorNome}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                  <span>
                    Atual: <strong className="text-white">{c.iscAtual} pts</strong>
                  </span>
                  <span>
                    Anterior: <strong className="text-slate-300">{c.iscAnterior} pts</strong>
                  </span>
                  <span
                    className={
                      c.iscVariacao >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'
                    }
                  >
                    ({c.iscVariacao >= 0 ? `+${c.iscVariacao}` : c.iscVariacao} pts)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {c.historicoISC.slice(-3).map((h, i) => (
                  <div
                    key={i}
                    className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs"
                  >
                    <span className="text-[10px] text-slate-400 block">{h.periodo}</span>
                    <strong className="text-sm text-white">{h.isc}</strong>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
