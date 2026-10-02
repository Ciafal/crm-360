// src/components/gestao-clientes/SellerCoverageRanking.tsx
import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users } from 'lucide-react'
import type { SellerCoverageItem } from '@/types/customer_management'
import { ProgressBar, StatusBadge } from './shared/GestaoClientesUiKit'

interface SellerCoverageRankingProps {
  sellers: SellerCoverageItem[]
  onSelectSeller?: (seller: SellerCoverageItem) => void
}

export function SellerCoverageRanking({ sellers, onSelectSeller }: SellerCoverageRankingProps) {
  return (
    <Card className="p-4 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-2xs text-slate-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-[#003A70]/10 text-[#003A70] rounded-xl border border-[#003A70]/20 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif text-base font-bold text-[#003A70] tracking-tight">
              Cobertura da Carteira por Vendedor & Equipe
            </h3>
            <p className="text-xs text-slate-500">
              Desempenho da execução comercial, frequência de contato e amplitude da carteira
              trabalhada (Meta: 95%).
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-2xl">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-slate-600 font-mono text-[10px] uppercase border-b border-slate-200">
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
          <tbody className="divide-y divide-slate-100">
            {sellers.map((sel) => {
              const coberturaVariant =
                sel.coberturaPct >= 90
                  ? 'positive'
                  : sel.coberturaPct >= 75
                    ? 'warning'
                    : 'critical'

              return (
                <tr
                  key={sel.vendedorId}
                  className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                  onClick={() => onSelectSeller && onSelectSeller(sel)}
                >
                  <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#EBF3FA] text-[#003A70] border border-[#003A70]/20 flex items-center justify-center font-bold text-[10px]">
                      {sel.vendedorNome.charAt(0)}
                    </div>
                    <span>{sel.vendedorNome}</span>
                  </td>

                  <td className="p-3 text-slate-500">{sel.regional}</td>

                  <td className="p-3 text-center font-mono font-bold text-slate-800">
                    {sel.clientesElegiveis}
                  </td>

                  <td className="p-3 text-center font-mono text-emerald-800 font-bold">
                    {sel.cobertos}
                  </td>

                  {/* Descobertos: Vermelho discreto corporativo */}
                  <td className="p-3 text-center font-mono text-red-700 font-bold">
                    {sel.descobertos}
                  </td>

                  {/* Estratégicos: Azul CIAFAL (sem roxo decorativo) */}
                  <td className="p-3 text-center">
                    <span className="font-mono text-[#003A70] font-medium">
                      {sel.estrategicosCobertos} / {sel.estrategicosTotal}
                    </span>
                  </td>

                  {/* Em Risco: Âmbar corporativo discreto (sem laranja neon) */}
                  <td className="p-3 text-center">
                    <span className="font-mono text-amber-800 font-medium">
                      {sel.emRiscoCobertos} / {sel.emRiscoTotal}
                    </span>
                  </td>

                  <td className="p-3 text-center font-mono text-slate-500">
                    {sel.diasSemContatoMedio} dias
                  </td>

                  <td className="p-3 text-center font-mono font-bold text-[#003A70]">
                    {sel.iscMedio}
                  </td>

                  <td className="p-3 text-center font-mono font-bold text-emerald-800">
                    {sel.otifMedio}%
                  </td>

                  <td className="p-3 text-center">
                    <StatusBadge label={`${sel.coberturaPct}%`} variant={coberturaVariant} />
                  </td>

                  <td className="p-3 text-right">
                    <div className="w-24 ml-auto">
                      <ProgressBar value={sel.coberturaPct} variant={coberturaVariant} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
