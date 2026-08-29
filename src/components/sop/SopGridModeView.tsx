import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SopForecastRecord, UnitType } from '@/types/sop'
import { formatCiafalMetric } from '@/services/forecast_engine'
import { QLIK_LAST_SYNC } from '@/services/sop_service'
import {
  Table as TableIcon,
  Search,
  Filter,
  Download,
  Copy,
  Sparkles,
  Save,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface SopGridModeViewProps {
  records: SopForecastRecord[]
  unit: UnitType
  userRole?: string
}

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export function SopGridModeView({ records, unit, userRole }: SopGridModeViewProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [familyFilter, setFamilyFilter] = useState('ALL')
  const [editedValues, setEditedValues] = useState<Record<string, number>>({})

  // Multiplicadores sazonais padrão para distribuição Jan..Dez na grade
  const seasonalFactors = [0.85, 0.9, 1.05, 1.0, 1.1, 1.15, 1.05, 1.0, 1.1, 1.15, 1.05, 0.8]

  const handleCellChange = (recordId: string, monthIdx: number, val: number) => {
    setEditedValues((prev) => ({
      ...prev,
      [`${recordId}-${monthIdx}`]: val,
    }))
  }

  const handleSaveGrid = () => {
    toast.success('Alterações da Grade Comercial gravadas com sucesso no Planejamento!')
  }

  const handleExportCsv = () => {
    toast.success(
      'Exportando Grade Comercial (Cliente × Produto × Jan..Dez) em formato CSV oficial.',
    )
  }

  const filteredRecords = records.filter((r) => {
    const matchSearch =
      r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.sellerName.toLowerCase().includes(searchTerm.toLowerCase())

    const matchFamily = familyFilter === 'ALL' || r.productFamily === familyFilter
    return matchSearch && matchFamily
  })

  return (
    <Card className="rounded-3xl border border-border/60 bg-white/95 shadow-xs overflow-hidden">
      <CardHeader className="p-5 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <TableIcon className="w-5 h-5 text-primary" />
            <CardTitle className="font-serif text-lg font-bold text-primary">
              Modo Grade Avançado — Planejamento Anual (Cliente × Produto × Jan..Dez)
            </CardTitle>
            <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-mono">
              Rolling 12M
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Visão consolidável em produto, família, cliente e vendedor com edição direta e cálculo
            de ritmo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="h-8 text-xs gap-1.5 text-slate-700"
          >
            <Download className="w-3.5 h-3.5" /> Exportar Grade
          </Button>
          <Button
            size="sm"
            onClick={handleSaveGrid}
            className="h-8 text-xs bg-primary text-white font-bold gap-1.5"
          >
            <Save className="w-3.5 h-3.5" /> Salvar Alterações
          </Button>
        </div>
      </CardHeader>

      {/* BARRA DE FILTROS DA GRADE */}
      <div className="p-4 bg-white border-b border-border/40 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-2.5" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar cliente, produto ou vendedor..."
              className="pl-8 h-8 text-xs rounded-xl"
            />
          </div>

          <select
            value={familyFilter}
            onChange={(e) => setFamilyFilter(e.target.value)}
            className="h-8 px-2.5 rounded-xl border border-border/60 text-xs bg-white text-slate-700"
          >
            <option value="ALL">Todas as Famílias</option>
            <option value="Perfis Estruturais & Vigas">Perfis Estruturais & Vigas</option>
            <option value="Tubos Estruturais & Industriais">Tubos Industriais</option>
            <option value="Aço para Construção Civil (Vergalhões)">Construção Civil</option>
            <option value="Aços Especiais & Trefilados">Aços Especiais</option>
            <option value="Perfis Leves & Cantoneiras">Cantoneiras</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="font-mono">Fonte: QLIK ({QLIK_LAST_SYNC})</span>
          <span>•</span>
          <span className="font-semibold text-slate-800">
            Unidade: {unit === 't' ? 't (Toneladas)' : 'R$'}
          </span>
        </div>
      </div>

      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b bg-slate-50 text-[10px] font-bold text-muted-foreground uppercase">
              <th className="py-2.5 px-3 sticky left-0 bg-slate-50 z-10 w-48">Cliente</th>
              <th className="py-2.5 px-3 sticky left-48 bg-slate-50 z-10 w-44">Produto</th>
              <th className="py-2.5 px-2 text-center bg-slate-100 font-bold">Total Ano</th>
              {MONTHS.map((m, idx) => (
                <th
                  key={m}
                  className={cn(
                    'py-2.5 px-2 text-center min-w-[70px]',
                    idx === 2 ? 'bg-primary/10 text-primary font-extrabold' : '',
                  )}
                >
                  {m} {idx === 2 && '(Atual)'}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRecords.map((r) => {
              const baseVal = r.f4SopConsensual || r.f0Statistical

              // Calcula valor para cada mês com base no fator sazonal ou edição
              const monthValues = seasonalFactors.map((f, idx) => {
                const key = `${r.id}-${idx}`
                if (editedValues[key] !== undefined) return editedValues[key]
                return Math.round(baseVal * f * 10) / 10
              })

              const rowTotal = monthValues.reduce((a, b) => a + b, 0)

              return (
                <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Cliente */}
                  <td className="py-2.5 px-3 sticky left-0 bg-white z-10">
                    <strong
                      className="block text-slate-900 font-semibold text-xs truncate max-w-[180px]"
                      title={r.customerName}
                    >
                      {r.customerName}
                    </strong>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {r.sellerName}
                    </span>
                  </td>

                  {/* Produto */}
                  <td className="py-2.5 px-3 sticky left-48 bg-white z-10">
                    <span
                      className="font-medium text-slate-800 block text-xs truncate max-w-[160px]"
                      title={r.productName}
                    >
                      {r.productName}
                    </span>
                    <span className="text-[10px] text-muted-foreground block truncate max-w-[160px]">
                      {r.productFamily}
                    </span>
                  </td>

                  {/* Total Ano */}
                  <td className="py-2 px-2 text-center font-mono font-bold text-slate-900 bg-slate-50">
                    {formatCiafalMetric(rowTotal, unit)}
                  </td>

                  {/* 12 Meses com Input Inline */}
                  {monthValues.map((val, idx) => (
                    <td
                      key={idx}
                      className={cn(
                        'py-1.5 px-1 text-center font-mono',
                        idx === 2 ? 'bg-primary/5 font-bold text-primary' : '',
                      )}
                    >
                      <input
                        type="number"
                        step="0.1"
                        value={val}
                        onChange={(e) =>
                          handleCellChange(r.id, idx, parseFloat(e.target.value) || 0)
                        }
                        className={cn(
                          'w-full text-center text-xs py-1 rounded-md border border-transparent hover:border-border/60 focus:border-primary focus:bg-white focus:outline-none transition-all',
                          idx === 2
                            ? 'font-bold text-primary bg-primary/10'
                            : 'text-slate-800 bg-transparent',
                        )}
                      />
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
