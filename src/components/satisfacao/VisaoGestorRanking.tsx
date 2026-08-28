import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react'
import { ClienteSatisfacao360 } from '@/types/satisfaction'

interface VisaoGestorRankingProps {
  clientes: ClienteSatisfacao360[]
  onSelectVendedor?: (vendedorNome: string) => void
}

export function VisaoGestorRanking({ clientes, onSelectVendedor }: VisaoGestorRankingProps) {
  // Agrupar métricas por vendedor
  const vendedorMap = new Map<
    string,
    {
      vendedorNome: string
      totalClientes: number
      iscSoma: number
      criticos: number
      risco: number
      atencao: number
      satisfeitos: number
      excelentes: number
      melhorando: number
      piorando: number
    }
  >()

  clientes.forEach((c) => {
    const nome = c.vendedorNome || 'Não Atribuído'
    if (!vendedorMap.has(nome)) {
      vendedorMap.set(nome, {
        vendedorNome: nome,
        totalClientes: 0,
        iscSoma: 0,
        criticos: 0,
        risco: 0,
        atencao: 0,
        satisfeitos: 0,
        excelentes: 0,
        melhorando: 0,
        piorando: 0,
      })
    }

    const item = vendedorMap.get(nome)!
    item.totalClientes += 1
    item.iscSoma += c.iscAtual
    if (c.faixaISC === 'CRITICO') item.criticos += 1
    else if (c.faixaISC === 'RISCO') item.risco += 1
    else if (c.faixaISC === 'ATENCAO') item.atencao += 1
    else if (c.faixaISC === 'SATISFEITO') item.satisfeitos += 1
    else if (c.faixaISC === 'EXCELENTE') item.excelentes += 1

    if (c.iscVariacao > 0) item.melhorando += 1
    if (c.iscVariacao < 0) item.piorando += 1
  })

  const ranking = Array.from(vendedorMap.values()).map((v) => ({
    ...v,
    iscMedio: Math.round(v.iscSoma / (v.totalClientes || 1)),
  }))

  ranking.sort((a, b) => b.iscMedio - a.iscMedio)

  return (
    <Card className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2 font-serif">
            <Users className="w-4 h-4 text-sky-400" />
            Diagnóstico Comparativo de Carteiras por Vendedor (Visão do Gestor)
          </h4>
          <span className="text-xs text-slate-400">
            Mapeamento da saúde da carteira para suporte tático da gestão (não constitui nota
            individual de RH).
          </span>
        </div>

        <Badge variant="outline" className="text-xs bg-slate-900 text-slate-300 border-slate-800">
          {ranking.length} Carteiras Ativas
        </Badge>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
              <th className="py-2.5 px-3">Vendedor</th>
              <th className="py-2.5 px-3 text-center">Clientes</th>
              <th className="py-2.5 px-3 text-center">ISC Médio Carteira</th>
              <th className="py-2.5 px-3 text-center text-rose-400">Críticos</th>
              <th className="py-2.5 px-3 text-center text-orange-400">Risco</th>
              <th className="py-2.5 px-3 text-center text-amber-400">Atenção</th>
              <th className="py-2.5 px-3 text-center text-emerald-400">Melhorando</th>
              <th className="py-2.5 px-3 text-center text-rose-400">Piorando</th>
              <th className="py-2.5 px-3 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {ranking.map((row) => (
              <tr key={row.vendedorNome} className="hover:bg-slate-900/50 transition-all">
                <td className="py-3 px-3">
                  <div className="font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-400" />
                    {row.vendedorNome}
                  </div>
                </td>
                <td className="py-3 px-3 text-center text-slate-300 font-semibold">
                  {row.totalClientes}
                </td>
                <td className="py-3 px-3 text-center">
                  <Badge
                    variant="outline"
                    className={`font-mono font-bold text-xs ${
                      row.iscMedio >= 80
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : row.iscMedio >= 70
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                    }`}
                  >
                    {row.iscMedio} pts
                  </Badge>
                </td>
                <td className="py-3 px-3 text-center font-bold text-rose-400">
                  {row.criticos > 0 ? (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20">{row.criticos}</span>
                  ) : (
                    '0'
                  )}
                </td>
                <td className="py-3 px-3 text-center font-bold text-orange-400">
                  {row.risco > 0 ? (
                    <span className="px-2 py-0.5 rounded-full bg-orange-500/20">{row.risco}</span>
                  ) : (
                    '0'
                  )}
                </td>
                <td className="py-3 px-3 text-center text-amber-300">{row.atencao}</td>
                <td className="py-3 px-3 text-center font-bold text-emerald-400">
                  +{row.melhorando}
                </td>
                <td className="py-3 px-3 text-center font-bold text-rose-400">-{row.piorando}</td>
                <td className="py-3 px-3 text-right">
                  {onSelectVendedor && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onSelectVendedor(row.vendedorNome)}
                      className="h-7 text-[11px] text-sky-400 hover:text-white hover:bg-slate-800"
                    >
                      Filtrar <ChevronRight className="w-3 h-3 ml-0.5" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
