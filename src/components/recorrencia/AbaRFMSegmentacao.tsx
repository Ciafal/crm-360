// src/components/recorrencia/AbaRFMSegmentacao.tsx
import React, { useState, useMemo } from 'react'
import {
  Search,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Users,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
  ExternalLink,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import type { ClienteRecorrenciaView, SegmentoRFM, UnitMode } from '@/types/recorrencia'

interface AbaRFMSegmentacaoProps {
  clientes: ClienteRecorrenciaView[]
  unitMode: UnitMode
  onSelectCliente: (clienteSap: string) => void
}

export function AbaRFMSegmentacao({ clientes, unitMode, onSelectCliente }: AbaRFMSegmentacaoProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSegmento, setSelectedSegmento] = useState<SegmentoRFM | 'TODOS'>('TODOS')
  const [sortField, setSortField] = useState<string>('faturamento')
  const [sortAsc, setSortAsc] = useState<boolean>(false)

  // Formatação BR estrita
  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    })
  }

  const formatTons = (val: number) => {
    return `${val.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} t`
  }

  // Agrupamento por Segmento RFM
  const segmentosCount = useMemo(() => {
    const map: Record<SegmentoRFM, number> = {
      Campeões: 0,
      'Clientes Leais': 0,
      'Potenciais Leais': 0,
      Promissores: 0,
      'Precisam de Atenção': 0,
      'Em Risco': 0,
      'Não Podemos Perder': 0,
      Hibernando: 0,
      Perdidos: 0,
      'Novos Clientes': 0,
    }

    clientes.forEach((c) => {
      if (map[c.segmentoRFM] !== undefined) {
        map[c.segmentoRFM]++
      }
    })

    return map
  }, [clientes])

  // Matriz Frequência × Recência (5x5)
  // Eixo Y = Frequência (1 a 5), Eixo X = Recência (1 a 5)
  const matrizFxR = useMemo(() => {
    const grid: number[][] = Array.from({ length: 5 }, () => [0, 0, 0, 0, 0])
    clientes.forEach((c) => {
      const fIdx = Math.min(Math.max(c.scoreF - 1, 0), 4)
      const rIdx = Math.min(Math.max(c.scoreR - 1, 0), 4)
      grid[fIdx][rIdx]++
    })
    return grid
  }, [clientes])

  // Filtragem e ordenação da Tabela RFM
  const clientesFiltrados = useMemo(() => {
    let list = clientes.filter((c) => {
      if (selectedSegmento !== 'TODOS' && c.segmentoRFM !== selectedSegmento) {
        return false
      }
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        const match =
          c.razaoSocial.toLowerCase().includes(term) ||
          c.codigoSap.toLowerCase().includes(term) ||
          c.vendedorNome.toLowerCase().includes(term) ||
          c.segmentoRFM.toLowerCase().includes(term)
        if (!match) return false
      }
      return true
    })

    list.sort((a, b) => {
      let aVal = 0
      let bVal = 0
      if (sortField === 'faturamento') {
        aVal = a.totalFaturado12m
        bVal = b.totalFaturado12m
      } else if (sortField === 'toneladas') {
        aVal = a.totalToneladas12m
        bVal = b.totalToneladas12m
      } else if (sortField === 'recencia') {
        aVal = -a.diasSemComprar
        bVal = -b.diasSemComprar
      } else if (sortField === 'frequencia') {
        aVal = a.scoreF
        bVal = b.scoreF
      } else if (sortField === 'rfm') {
        aVal = parseInt(a.scoreRFM, 10) || 0
        bVal = parseInt(b.scoreRFM, 10) || 0
      }
      return sortAsc ? aVal - bVal : bVal - aVal
    })

    return list
  }, [clientes, selectedSegmento, searchTerm, sortField, sortAsc])

  // Exportação Excel/CSV
  const handleExportExcel = () => {
    const headers = [
      'Código SAP',
      'Cliente',
      'Vendedor',
      'Recência (R)',
      'Frequência (F)',
      unitMode === 'BRL' ? 'Valor (M)' : 'Tonelagem (M)',
      'Score RFM',
      'Segmento',
      'Última Compra',
      'Dias Sem Comprar',
      'Compra Mensal Média',
      'Risco Atual',
    ]

    const rows = clientesFiltrados.map((c) => [
      c.codigoSap,
      `"${c.razaoSocial}"`,
      `"${c.vendedorNome}"`,
      c.scoreR,
      c.scoreF,
      c.scoreM,
      c.scoreRFM,
      `"${c.segmentoRFM}"`,
      c.ultimaCompraData,
      c.diasSemComprar,
      unitMode === 'BRL'
        ? formatBRL(c.compraMensalMediaValor)
        : formatTons(c.compraMensalMediaTons),
      `"${c.tipoAlerta}"`,
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `ciafal_rfm_segmentacao_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Relatório RFM exportado com sucesso (Excel/CSV)!')
  }

  // Exportação PDF Simulado
  const handleExportPDF = () => {
    toast.info('Exportando relatório RFM formatado para impressão/PDF...')
    setTimeout(() => {
      window.print()
    }, 500)
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. TOPO: GRÁFICO DE SEGMENTOS E MATRIZ FREQUÊNCIA × RECÊNCIA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Segmentos (Cards Clicáveis) */}
        <Card className="lg:col-span-2 border-slate-200 shadow-sm bg-white">
          <CardHeader className="p-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-serif text-sm font-bold text-[#003A70]">
                  Segmentos RFM da Carteira (Recência + Frequência +{' '}
                  {unitMode === 'BRL' ? 'Valor R$' : 'Tonelagem t'})
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Clique no segmento para filtrar instantaneamente os clientes na tabela abaixo.
                </p>
              </div>
              {selectedSegmento !== 'TODOS' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedSegmento('TODOS')}
                  className="h-7 text-xs rounded-xl"
                >
                  Ver Todos ({clientes.length})
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {(
                [
                  { name: 'Campeões', color: 'bg-emerald-50 text-emerald-900 border-emerald-300' },
                  { name: 'Clientes Leais', color: 'bg-sky-50 text-sky-900 border-sky-300' },
                  { name: 'Potenciais Leais', color: 'bg-teal-50 text-teal-900 border-teal-300' },
                  { name: 'Promissores', color: 'bg-indigo-50 text-indigo-900 border-indigo-300' },
                  { name: 'Novos Clientes', color: 'bg-blue-50 text-blue-900 border-blue-300' },
                  {
                    name: 'Precisam de Atenção',
                    color: 'bg-amber-50 text-amber-900 border-amber-300',
                  },
                  { name: 'Em Risco', color: 'bg-orange-50 text-orange-900 border-orange-300' },
                  { name: 'Não Podemos Perder', color: 'bg-rose-50 text-rose-900 border-rose-300' },
                  { name: 'Hibernando', color: 'bg-purple-50 text-purple-900 border-purple-300' },
                  { name: 'Perdidos', color: 'bg-slate-100 text-slate-900 border-slate-300' },
                ] as const
              ).map((seg) => {
                const isSelected = selectedSegmento === seg.name
                const count = segmentosCount[seg.name] || 0
                return (
                  <button
                    key={seg.name}
                    type="button"
                    onClick={() => setSelectedSegmento(isSelected ? 'TODOS' : seg.name)}
                    className={`p-3 rounded-2xl border text-left transition-all hover:scale-[1.02] flex flex-col justify-between ${
                      seg.color
                    } ${
                      isSelected
                        ? 'ring-2 ring-primary ring-offset-2 font-bold shadow-md'
                        : 'opacity-90 hover:opacity-100'
                    }`}
                  >
                    <span className="text-xs font-semibold block leading-tight">{seg.name}</span>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="font-serif font-bold text-xl">{count}</span>
                      <span className="text-[10px] opacity-70">
                        {clientes.length > 0 ? Math.round((count / clientes.length) * 100) : 0}%
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Matriz Frequência × Recência (Heatmap 5x5 Clicável) */}
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader className="p-4 border-b border-slate-200">
            <CardTitle className="font-serif text-sm font-bold text-[#003A70]">
              Matriz Frequência × Recência
            </CardTitle>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Linha = Frequência (F5 alta → F1 baixa), Coluna = Recência (R1 antiga → R5 recente).
            </p>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-1">
              {[4, 3, 2, 1, 0].map((fIdx) => (
                <div key={fIdx} className="flex items-center gap-1">
                  <span className="w-6 text-[10px] font-bold text-slate-500 text-right pr-1">
                    F{fIdx + 1}
                  </span>
                  {[0, 1, 2, 3, 4].map((rIdx) => {
                    const count = matrizFxR[fIdx][rIdx]
                    const intensity =
                      count >= 5
                        ? 'bg-primary text-white font-bold'
                        : count >= 3
                          ? 'bg-sky-600 text-white font-medium'
                          : count >= 1
                            ? 'bg-sky-200 text-slate-900'
                            : 'bg-slate-100 text-slate-300'

                    return (
                      <div
                        key={rIdx}
                        className={`flex-1 h-8 rounded-lg flex items-center justify-center text-xs transition-transform hover:scale-105 cursor-pointer ${intensity}`}
                        title={`Frequência F${fIdx + 1} × Recência R${rIdx + 1}: ${count} cliente(s)`}
                      >
                        {count > 0 ? count : '·'}
                      </div>
                    )
                  })}
                </div>
              ))}
              <div className="flex items-center gap-1 pt-1 pl-7 text-[10px] text-slate-500 font-bold">
                <span className="flex-1 text-center">R1</span>
                <span className="flex-1 text-center">R2</span>
                <span className="flex-1 text-center">R3</span>
                <span className="flex-1 text-center">R4</span>
                <span className="flex-1 text-center">R5</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. TABELA RFM POR CLIENTE (Completa com Busca, Ordenação e Exportações) */}
      <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
        <CardHeader className="p-4 bg-slate-50/70 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <CardTitle className="font-serif text-base font-bold text-[#003A70]">
                Tabela de Clientes & Scores RFM
              </CardTitle>
              <Badge variant="outline" className="text-xs bg-white">
                {clientesFiltrados.length} clientes encontrados
              </Badge>
            </div>

            {/* Ações: Busca + Exportar Excel + Exportar PDF */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative w-48 sm:w-64">
                <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-2.5" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Pesquisar nesta tabela..."
                  className="h-8 text-xs pl-8 rounded-xl bg-white border-slate-200"
                />
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={handleExportExcel}
                className="h-8 text-xs rounded-xl border-emerald-300 text-emerald-900 bg-emerald-50 hover:bg-emerald-100 gap-1.5 font-semibold"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                <span>Excel</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={handleExportPDF}
                className="h-8 text-xs rounded-xl border-slate-300 text-slate-700 hover:bg-slate-100 gap-1.5 font-semibold"
              >
                <FileText className="w-3.5 h-3.5 text-slate-600" />
                <span>PDF</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                <th className="p-3 pl-4 sticky left-0 bg-slate-100 z-10 w-64 shadow-xs">
                  Código / Cliente
                </th>
                <th className="p-3">Representante</th>
                <th
                  className="p-3 cursor-pointer hover:text-primary select-none"
                  onClick={() => handleSort('recencia')}
                >
                  <div className="flex items-center gap-1">
                    <span>Recência</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  className="p-3 cursor-pointer hover:text-primary select-none text-center"
                  onClick={() => handleSort('frequencia')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Frequência</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  className="p-3 cursor-pointer hover:text-primary select-none text-right"
                  onClick={() => handleSort(unitMode === 'BRL' ? 'faturamento' : 'toneladas')}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>{unitMode === 'BRL' ? 'Valor Faturado (12m)' : 'Tonelagem (12m)'}</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  className="p-3 cursor-pointer hover:text-primary select-none text-center"
                  onClick={() => handleSort('rfm')}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Scores R-F-M</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="p-3">Segmento</th>
                <th className="p-3">Última Compra</th>
                <th className="p-3 text-center">Dias s/ Compra</th>
                <th className="p-3 text-right">Compra Mensal Média</th>
                <th className="p-3 pr-4">Risco Atual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clientesFiltrados.map((c) => (
                <tr key={c.id} className="hover:bg-sky-50/50 transition-colors">
                  {/* Código / Cliente com link para a Ficha 360 */}
                  <td className="p-3 pl-4 sticky left-0 bg-white hover:bg-sky-50/50 z-10 shadow-xs">
                    <button
                      type="button"
                      onClick={() => onSelectCliente(c.codigoSap)}
                      className="text-left group block max-w-[230px]"
                    >
                      <strong className="text-slate-900 group-hover:text-primary transition-colors block truncate">
                        {c.razaoSocial}
                      </strong>
                      <span className="text-[10px] text-muted-foreground font-mono block">
                        SAP {c.codigoSap} · {c.cidade}/{c.uf}
                      </span>
                    </button>
                  </td>

                  <td className="p-3 text-slate-700">
                    <span className="block truncate max-w-[140px]">{c.vendedorNome}</span>
                    <span className="text-[10px] text-muted-foreground block truncate">
                      {c.representanteNome}
                    </span>
                  </td>

                  {/* Recência */}
                  <td className="p-3">
                    <Badge variant="outline" className="text-[11px] font-mono bg-slate-50">
                      R{c.scoreR} ({c.diasSemComprar}d)
                    </Badge>
                  </td>

                  {/* Frequência */}
                  <td className="p-3 text-center">
                    <Badge variant="outline" className="text-[11px] font-mono bg-slate-50">
                      F{c.scoreF} ({c.taxaRecorrencia}%)
                    </Badge>
                  </td>

                  {/* Valor Faturado ou Tonelagem */}
                  <td className="p-3 text-right font-mono font-bold text-slate-900">
                    {unitMode === 'BRL'
                      ? formatBRL(c.totalFaturado12m)
                      : formatTons(c.totalToneladas12m)}
                  </td>

                  {/* Score RFM Combinado */}
                  <td className="p-3 text-center">
                    <span className="font-mono font-bold px-2 py-0.5 rounded-lg bg-sky-100 text-[#003A70] text-xs">
                      {c.scoreRFM}
                    </span>
                  </td>

                  {/* Segmento */}
                  <td className="p-3">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-semibold whitespace-nowrap ${
                        c.segmentoRFM === 'Campeões'
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                          : c.segmentoRFM === 'Clientes Leais'
                            ? 'bg-sky-50 text-sky-900 border-sky-300'
                            : c.segmentoRFM === 'Em Risco' || c.segmentoRFM === 'Não Podemos Perder'
                              ? 'bg-rose-50 text-rose-900 border-rose-300'
                              : 'bg-slate-100 text-slate-800 border-slate-300'
                      }`}
                    >
                      {c.segmentoRFM}
                    </Badge>
                  </td>

                  {/* Última Compra */}
                  <td className="p-3 font-mono text-slate-700">{c.ultimaCompraData}</td>

                  {/* Dias Sem Comprar */}
                  <td className="p-3 text-center font-mono font-semibold">
                    <span
                      className={
                        c.diasSemComprar > 90
                          ? 'text-rose-600'
                          : c.diasSemComprar > 60
                            ? 'text-amber-600'
                            : 'text-slate-800'
                      }
                    >
                      {c.diasSemComprar}d
                    </span>
                  </td>

                  {/* Compra Mensal Média */}
                  <td className="p-3 text-right font-mono text-slate-800">
                    {unitMode === 'BRL'
                      ? formatBRL(c.compraMensalMediaValor)
                      : formatTons(c.compraMensalMediaTons)}
                  </td>

                  {/* Risco Atual */}
                  <td className="p-3 pr-4">
                    {c.tipoAlerta === 'Parada Abrupta' ? (
                      <Badge className="bg-rose-600 text-white text-[10px] border-none">
                        Parada Abrupta
                      </Badge>
                    ) : c.tipoAlerta === 'Queda Forte' ? (
                      <Badge className="bg-amber-500 text-white text-[10px] border-none">
                        Queda Forte
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-[10px] text-emerald-700 border-emerald-300 bg-emerald-50"
                      >
                        Normal
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
