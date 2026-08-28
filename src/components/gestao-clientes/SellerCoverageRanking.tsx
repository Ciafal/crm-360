// src/components/gestao-clientes/SellerCoverageRanking.tsx
import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Users,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  Target,
  ChevronRight,
} from 'lucide-react'
import type { SellerCoverageItem } from '@/types/customer_management'

interface SellerCoverageRankingProps {
  sellers: SellerCoverageItem[]
  onSelectSeller?: (seller: SellerCoverageItem) => void
}

export function SellerCoverageRanking({ sellers, onSelectSeller }: SellerCoverageRankingProps) {
  return (
    <Card className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl text-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-sky-500/20 text-sky-400 rounded-xl border border-sky-500/30">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif text-base font-bold text-white tracking-tight">
              Cobertura da Carteira por Vendedor & Equipe
            </h3>
            <p className="text-xs text-slate-400">
              Desempenho da execução comercial, frequência de contato e amplitude da carteira
              trabalhada (Meta: 95%).
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
            <tr>
              <th className="p-3">Vendedor</th>
              <th className="p-3">Equipe / Regional</th>
              <th className="p-3 text-center">Elegíveis</th>
              <th className="p-3 text-center">Cobertos</th>
              <th className="p-3 text-center">Descobertos</th>
              <th className="p-3 text-center">Estratégicos</th>
              <th className="p-3 text-center">Em Risco</th>
              <th className="p-3 text-center">Dias Sem Contato Médio</th>
              <th className="p-3 text-center">ISC Médio</th>
              <th className="p-3 text-center">OTIF</th>
              <th className="p-3 text-center">Cobertura %</th>
              <th className="p-3 text-right">Progresso</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {sellers.map((sel) => (
              <tr
                key={sel.vendedorId}
                className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                onClick={() => onSelectSeller && onSelectSeller(sel)}
              >
                <td className="p-3 font-bold text-white flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-800 text-sky-400 flex items-center justify-center font-bold text-[10px]">
                    {sel.vendedorNome.charAt(0)}
                  </div>
                  <span>{sel.vendedorNome}</span>
                </td>

                <td className="p-3 text-slate-400">{sel.regional}</td>

                <td className="p-3 text-center font-mono font-bold text-slate-200">
                  {sel.clientesElegiveis}
                </td>

                <td className="p-3 text-center font-mono text-emerald-400 font-bold">
                  {sel.cobertos}
                </td>

                <td className="p-3 text-center font-mono text-rose-400 font-bold">
                  {sel.descobertos}
                </td>

                <td className="p-3 text-center">
                  <span className="font-mono text-purple-300">
                    {sel.estrategicosCobertos} / {sel.estrategicosTotal}
                  </span>
                </td>

                <td className="p-3 text-center">
                  <span className="font-mono text-orange-300">
                    {sel.emRiscoCobertos} / {sel.emRiscoTotal}
                  </span>
                </td>

                <td className="p-3 text-center font-mono text-slate-400">
                  {sel.diasSemContatoMedio} dias
                </td>

                <td className="p-3 text-center font-mono font-bold text-sky-400">{sel.iscMedio}</td>

                <td className="p-3 text-center font-mono font-bold text-emerald-400">
                  {sel.otifMedio}%
                </td>

                <td className="p-3 text-center">
                  <Badge
                    className={`font-mono text-xs font-bold ${
                      sel.coberturaPct >= 90
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : sel.coberturaPct >= 75
                          ? 'bg-amber-950 text-amber-300 border-amber-800'
                          : 'bg-rose-950 text-rose-300 border-rose-800'
                    }`}
                  >
                    {sel.coberturaPct}%
                  </Badge>
                </td>

                <td className="p-3 text-right">
                  <div className="w-24 ml-auto">
                    <Progress value={sel.coberturaPct} className="h-2 bg-slate-800" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
