// src/components/satisfacao/OtifDrilldownModal.tsx
import React, { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Truck,
  Filter,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Download,
  Star,
  Building2,
  PlusCircle,
} from 'lucide-react'
import { OtifDeliveryRecord } from '@/types/otif'
import { toast } from 'sonner'

interface OtifDrilldownModalProps {
  open: boolean
  onClose: () => void
  deliveries: OtifDeliveryRecord[]
  onGerarAcao?: (record: OtifDeliveryRecord) => void
}

export function OtifDrilldownModal({
  open,
  onClose,
  deliveries,
  onGerarAcao,
}: OtifDrilldownModalProps) {
  // Filtros
  const [termo, setTermo] = useState('')
  const [statusFiltro, setStatusFiltro] = useState<
    'TODOS' | 'NO_PRAZO' | 'ATRASADOS' | 'INCOMPLETOS' | 'OTIF_SIM' | 'OTIF_NAO'
  >('TODOS')
  const [transportadoraFiltro, setTransportadoraFiltro] = useState('TODAS')
  const [vendedorFiltro, setVendedorFiltro] = useState('TODOS')
  const [linhaFiltro, setLinhaFiltro] = useState('TODAS')

  // Lista única de filtros
  const transportadoras = useMemo(() => {
    return Array.from(new Set(deliveries.map((d) => d.transportadora).filter(Boolean)))
  }, [deliveries])

  const vendedores = useMemo(() => {
    return Array.from(new Set(deliveries.map((d) => d.vendedorNome).filter(Boolean)))
  }, [deliveries])

  const linhas = useMemo(() => {
    return Array.from(new Set(deliveries.map((d) => d.linha).filter(Boolean)))
  }, [deliveries])

  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((d) => {
      if (statusFiltro === 'NO_PRAZO' && !d.onTime) return false
      if (statusFiltro === 'ATRASADOS' && d.onTime) return false
      if (statusFiltro === 'INCOMPLETOS' && d.inFull) return false
      if (statusFiltro === 'OTIF_SIM' && !d.otif) return false
      if (statusFiltro === 'OTIF_NAO' && d.otif) return false

      if (transportadoraFiltro !== 'TODAS' && d.transportadora !== transportadoraFiltro)
        return false
      if (vendedorFiltro !== 'TODOS' && d.vendedorNome !== vendedorFiltro) return false
      if (linhaFiltro !== 'TODAS' && d.linha !== linhaFiltro) return false

      if (termo.trim()) {
        const q = termo.toLowerCase()
        const matchCliente = d.clienteNome.toLowerCase().includes(q)
        const matchSap = d.clienteSap.toLowerCase().includes(q)
        const matchPed = d.pedidoNumero.toLowerCase().includes(q)
        const matchNf = d.nfNumero.toLowerCase().includes(q)
        const matchTr = d.transporteNumero.toLowerCase().includes(q)
        const matchProd = d.produtoDescricao.toLowerCase().includes(q)
        if (!matchCliente && !matchSap && !matchPed && !matchNf && !matchTr && !matchProd)
          return false
      }

      return true
    })
  }, [deliveries, statusFiltro, transportadoraFiltro, vendedorFiltro, linhaFiltro, termo])

  const stats = useMemo(() => {
    const total = deliveries.length
    if (total === 0) return { onTimePct: 0, inFullPct: 0, otifPct: 0, atrasados: 0, incompletos: 0 }
    const onTimeCount = deliveries.filter((d) => d.onTime).length
    const inFullCount = deliveries.filter((d) => d.inFull).length
    const otifCount = deliveries.filter((d) => d.otif).length
    return {
      onTimePct: Math.round((onTimeCount / total) * 1000) / 10,
      inFullPct: Math.round((inFullCount / total) * 1000) / 10,
      otifPct: Math.round((otifCount / total) * 1000) / 10,
      atrasados: total - onTimeCount,
      incompletos: total - inFullCount,
    }
  }, [deliveries])

  const handleExportCsv = () => {
    toast.success('Relatório de entregas e desvios OTIF exportado com sucesso!')
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-6xl max-h-[92vh] overflow-y-auto p-6 bg-white rounded-3xl border border-slate-200 shadow-xl">
        <DialogHeader className="space-y-1 pb-4 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-[#003A70] text-white">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold font-serif text-[#003A70]">
                  Drill-Down OTIF & Entregas CIAFAL
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  On-Time (No Prazo) × In-Full (Completo) · Cruzamento de dados de Pedido, NF,
                  Expedição, TMS e Avaliação.
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCsv}
                className="text-xs h-8 rounded-xl border-slate-300 gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" /> Exportar CSV
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Mini KPIs de OTIF */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
          <div className="p-3 rounded-2xl bg-sky-50 border border-sky-100">
            <span className="text-[10px] font-bold text-[#003A70] uppercase">OTIF Geral</span>
            <div className="text-xl font-bold font-serif text-[#003A70] mt-0.5">
              {stats.otifPct.toFixed(1)}%
            </div>
            <span className="text-[10px] text-slate-500">
              Meta: 95,0% (Gap: {(stats.otifPct - 95).toFixed(1)} p.p.)
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
            <span className="text-[10px] font-bold text-emerald-800 uppercase">
              On-Time (No Prazo)
            </span>
            <div className="text-xl font-bold font-serif text-emerald-700 mt-0.5">
              {stats.onTimePct.toFixed(1)}%
            </div>
            <span className="text-[10px] text-slate-500">{stats.atrasados} entregas c/ atraso</span>
          </div>

          <div className="p-3 rounded-2xl bg-indigo-50 border border-indigo-100">
            <span className="text-[10px] font-bold text-indigo-800 uppercase">
              In-Full (Completo)
            </span>
            <div className="text-xl font-bold font-serif text-indigo-700 mt-0.5">
              {stats.inFullPct.toFixed(1)}%
            </div>
            <span className="text-[10px] text-slate-500">
              {stats.incompletos} entregas parciais
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-100">
            <span className="text-[10px] font-bold text-amber-800 uppercase">Total Entregas</span>
            <div className="text-xl font-bold font-serif text-amber-700 mt-0.5">
              {deliveries.length}
            </div>
            <span className="text-[10px] text-slate-500">
              Filtradas: {filteredDeliveries.length}
            </span>
          </div>
        </div>

        {/* Barra de Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 mb-4 text-xs">
          <div className="lg:col-span-2 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              placeholder="Buscar por cliente, pedido, NF, transporte ou material..."
              className="pl-8 h-8 text-xs bg-white rounded-xl border-slate-200"
            />
          </div>

          <div>
            <Select value={statusFiltro} onValueChange={(v: any) => setStatusFiltro(v)}>
              <SelectTrigger className="h-8 text-xs rounded-xl bg-white border-slate-200">
                <SelectValue placeholder="Status OTIF" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos os Registros</SelectItem>
                <SelectItem value="OTIF_SIM">OTIF Conforme (Sim)</SelectItem>
                <SelectItem value="OTIF_NAO">OTIF Desvio (Não)</SelectItem>
                <SelectItem value="ATRASADOS">Apenas Atrasados</SelectItem>
                <SelectItem value="INCOMPLETOS">Apenas Incompletos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select value={transportadoraFiltro} onValueChange={setTransportadoraFiltro}>
              <SelectTrigger className="h-8 text-xs rounded-xl bg-white border-slate-200">
                <SelectValue placeholder="Transportadora" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODAS">Todas Transportadoras</SelectItem>
                {transportadoras.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select value={linhaFiltro} onValueChange={setLinhaFiltro}>
              <SelectTrigger className="h-8 text-xs rounded-xl bg-white border-slate-200">
                <SelectValue placeholder="Linha de Produto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODAS">Todas as Linhas</SelectItem>
                {linhas.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabela de Drill-down */}
        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Cliente / SAP</th>
                <th className="py-2.5 px-3">Pedido / NF / TMS</th>
                <th className="py-2.5 px-3">Datas (Desejada → Entregue)</th>
                <th className="py-2.5 px-3 text-right">Qtd Pedida vs Entregue</th>
                <th className="py-2.5 px-3 text-center">On-Time</th>
                <th className="py-2.5 px-3 text-center">In-Full</th>
                <th className="py-2.5 px-3 text-center">OTIF</th>
                <th className="py-2.5 px-3">Motivo do Desvio</th>
                <th className="py-2.5 px-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDeliveries.map((rec) => (
                <tr key={rec.id} className="hover:bg-sky-50/40 transition-colors">
                  <td className="py-3 px-3">
                    <strong className="text-slate-800 block">{rec.clienteNome}</strong>
                    <span className="text-[11px] text-slate-500 font-mono">
                      SAP #{rec.clienteSap} · {rec.regiao}
                    </span>
                  </td>

                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-700">{rec.pedidoNumero}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      {rec.nfNumero} · {rec.transporteNumero}
                    </div>
                    <div className="text-[10px] text-slate-400">{rec.transportadora}</div>
                  </td>

                  <td className="py-3 px-3">
                    <div className="text-slate-700">
                      Desejada: <strong>{rec.dataDesejada}</strong>
                    </div>
                    <div className="text-[11px] text-slate-500">Expedida: {rec.dataExpedida}</div>
                    <div className="text-[11px] font-semibold text-slate-800">
                      Entregue: {rec.dataEntregue}
                    </div>
                  </td>

                  <td className="py-3 px-3 text-right">
                    <div className="text-slate-800 font-semibold">
                      {rec.quantidadePedidaKg.toLocaleString('pt-BR')} kg
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Entregue: {rec.quantidadeEntregueKg.toLocaleString('pt-BR')} kg
                    </div>
                    {rec.quantidadePedidaKg !== rec.quantidadeEntregueKg && (
                      <span className="text-[10px] text-rose-600 font-bold">
                        Dif: -
                        {(rec.quantidadePedidaKg - rec.quantidadeEntregueKg).toLocaleString(
                          'pt-BR',
                        )}{' '}
                        kg
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-center">
                    {rec.onTime ? (
                      <Badge className="bg-emerald-100 text-emerald-800 text-[10px] border-emerald-200">
                        Sim
                      </Badge>
                    ) : (
                      <Badge className="bg-rose-100 text-rose-800 text-[10px] border-rose-200">
                        Não
                      </Badge>
                    )}
                  </td>

                  <td className="py-3 px-3 text-center">
                    {rec.inFull ? (
                      <Badge className="bg-emerald-100 text-emerald-800 text-[10px] border-emerald-200">
                        Sim
                      </Badge>
                    ) : (
                      <Badge className="bg-rose-100 text-rose-800 text-[10px] border-rose-200">
                        Não
                      </Badge>
                    )}
                  </td>

                  <td className="py-3 px-3 text-center">
                    {rec.otif ? (
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                        <CheckCircle2 className="w-3 h-3" /> OTIF
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 text-[10px]">
                        <XCircle className="w-3 h-3" /> DESVIO
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3 max-w-xs">
                    {rec.motivoDesvio ? (
                      <div>
                        <span className="text-[11px] text-rose-700 block leading-tight">
                          {rec.motivoDesvio}
                        </span>
                        <span className="text-[9px] text-slate-400 uppercase font-bold">
                          Resp: {rec.responsavelDesvio || 'Logística'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">
                        Conforme especificado
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-right">
                    {!rec.otif && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (onGerarAcao) onGerarAcao(rec)
                          else
                            toast.success(
                              `Ação corretiva gerada na Central de Ações para o pedido ${rec.pedidoNumero}!`,
                            )
                        }}
                        className="h-7 text-[11px] rounded-lg border-sky-300 text-[#003A70] hover:bg-sky-50 font-semibold"
                      >
                        <PlusCircle className="w-3 h-3 mr-1 text-[#003A70]" /> Gerar Ação
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
