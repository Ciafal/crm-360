import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Building2,
  ExternalLink,
  Phone,
  MessageSquare,
  Mail,
  Sparkles,
  CreditCard,
  Package,
  TrendingUp,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { CustomerPortfolioDetail } from '@/types/cockpit'

interface CommercialDrilldownModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  subtitle?: string
  customers: CustomerPortfolioDetail[]
  unit: 'REVENUE' | 'TONS'
}

export function CommercialDrilldownModal({
  open,
  onOpenChange,
  title,
  subtitle,
  customers,
  unit,
}: CommercialDrilldownModalProps) {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAbc, setSelectedAbc] = useState<string>('ALL')

  const isTons = unit === 'TONS'

  const filtered = customers.filter((c) => {
    const term = searchTerm.toLowerCase()
    const matchesSearch =
      !searchTerm ||
      c.nomeFantasia.toLowerCase().includes(term) ||
      c.razaoSocial.toLowerCase().includes(term) ||
      c.sapCode.includes(term) ||
      c.cidade.toLowerCase().includes(term)

    const matchesAbc = selectedAbc === 'ALL' || c.abc === selectedAbc

    return matchesSearch && matchesAbc
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl p-6">
        <DialogHeader className="pb-3 border-b border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <DialogTitle className="font-serif text-xl font-bold text-primary flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                {title} ({filtered.length})
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {subtitle ||
                  'Relação analítica de clientes com dados de ERP, contato, compras, crédito e recomendações de IA'}
              </DialogDescription>
            </div>

            {/* Filtro Rápido ABC */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              {['ALL', 'A', 'B', 'C'].map((abc) => (
                <button
                  key={abc}
                  type="button"
                  onClick={() => setSelectedAbc(abc)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                    selectedAbc === abc
                      ? 'bg-white text-primary shadow-xs'
                      : 'text-muted-foreground hover:text-slate-900'
                  }`}
                >
                  {abc === 'ALL' ? 'Todos' : `Curva ${abc}`}
                </button>
              ))}
            </div>
          </div>

          {/* Barra de Busca */}
          <div className="relative mt-3">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Filtrar por nome, razão social, código SAP ou cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl"
            />
          </div>
        </DialogHeader>

        {/* Tabela Completa de Drill-Down */}
        <div className="overflow-x-auto border border-border/40 rounded-2xl mt-2">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b">
              <tr>
                <th className="p-3">Código & Cliente</th>
                <th className="p-3">Localização</th>
                <th className="p-3 text-center">Curva ABC</th>
                <th className="p-3 text-right">{isTons ? 'Volume MTD (t)' : 'Faturamento MTD'}</th>
                <th className="p-3 text-right">{isTons ? 'Volume YTD (t)' : 'Faturamento YTD'}</th>
                <th className="p-3 text-center">Último Contato</th>
                <th className="p-3 text-center">Última Compra</th>
                <th className="p-3 text-center">Crédito Disp.</th>
                <th className="p-3 text-center">OITF</th>
                <th className="p-3">Próxima Ação IA</th>
                <th className="p-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-muted-foreground italic">
                    Nenhum cliente encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3">
                      <span className="font-bold text-slate-900 block">{c.nomeFantasia}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        SAP {c.sapCode} · {c.razaoSocial}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700">
                      {c.cidade}/{c.uf}
                    </td>
                    <td className="p-3 text-center">
                      <Badge
                        className={`text-[10px] font-bold border-none ${
                          c.abc === 'A'
                            ? 'bg-emerald-100 text-emerald-800'
                            : c.abc === 'B'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {c.abc}
                      </Badge>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">
                      {isTons
                        ? `${c.volumeMtdTons.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} t`
                        : `R$ ${c.faturamentoMtd.toLocaleString('pt-BR')}`}
                    </td>
                    <td className="p-3 text-right font-mono text-muted-foreground">
                      {isTons
                        ? `${c.volumeYtdTons.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} t`
                        : `R$ ${c.faturamentoYtd.toLocaleString('pt-BR')}`}
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-slate-800 block">{c.ultimoContatoData}</span>
                      <span
                        className={`text-[10px] font-semibold ${
                          c.diasSemContato > 15 ? 'text-rose-600' : 'text-slate-500'
                        }`}
                      >
                        {c.diasSemContato}d atrás ({c.ultimoContatoCanal})
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-slate-800 block">{c.ultimaCompraData}</span>
                      <span
                        className={`text-[10px] font-semibold ${
                          c.diasSemCompra > 30 ? 'text-amber-600' : 'text-slate-500'
                        }`}
                      >
                        {c.diasSemCompra}d atrás
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-emerald-700">
                      R$ {c.creditoDisponivel.toLocaleString('pt-BR')}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`font-bold ${
                          c.oitfPct >= 95
                            ? 'text-emerald-700'
                            : c.oitfPct >= 90
                              ? 'text-blue-700'
                              : 'text-amber-700'
                        }`}
                      >
                        {c.oitfPct}%
                      </span>
                    </td>
                    <td className="p-3 max-w-[220px]">
                      <span className="text-[11px] text-slate-800 font-medium line-clamp-2">
                        {c.proximaAcaoSugeridaIA.acao}
                      </span>
                      <span className="text-[9px] text-muted-foreground block mt-0.5">
                        {c.proximaAcaoSugeridaIA.justificativa}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <Button
                        size="sm"
                        onClick={() => {
                          onOpenChange(false)
                          navigate(`/crm/${c.id}`)
                        }}
                        className="h-7 text-xs bg-primary text-white gap-1 rounded-lg"
                      >
                        CRM 360º <ExternalLink className="w-3 h-3" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
