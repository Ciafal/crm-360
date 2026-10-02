// src/components/recorrencia/AbaCreditoRisco.tsx
import React, { useState, useMemo } from 'react'
import {
  ShieldAlert,
  AlertOctagon,
  TrendingDown,
  DollarSign,
  Package,
  Calendar,
  Clock,
  ArrowRight,
  FileSpreadsheet,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  PlusCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import type { ClienteRecorrenciaView, UnitMode } from '@/types/recorrencia'

interface AbaCreditoRiscoProps {
  clientes: ClienteRecorrenciaView[]
  unitMode: UnitMode
  onSelectCliente: (clienteSap: string) => void
  onGerarOportunidadeRetomada?: (cliente: ClienteRecorrenciaView) => void
  onSolicitarRevisaoCredito?: (cliente: ClienteRecorrenciaView) => void
}

export function AbaCreditoRisco({
  clientes,
  unitMode,
  onSelectCliente,
  onGerarOportunidadeRetomada,
  onSolicitarRevisaoCredito,
}: AbaCreditoRiscoProps) {
  const [filterSinal, setFilterSinal] = useState<string>('TODOS')
  const [filterCruzamento, setFilterCruzamento] = useState<string>('TODOS')
  const [searchTerm, setSearchTerm] = useState('')

  // Formatação BR estrita
  const formatBRL = (val: number | null | undefined) => {
    if (val === null || val === undefined) return 'Sem informação SAP'
    return val.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    })
  }

  const formatTons = (val: number | null | undefined) => {
    if (val === null || val === undefined) return '0,0 t'
    return `${val.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} t`
  }

  // Filtragem da Tabela de Risco
  const clientesFiltrados = useMemo(() => {
    return clientes.filter((c) => {
      if (filterSinal === 'PARADA_ABRUPTA' && c.tipoAlerta !== 'Parada Abrupta') return false
      if (filterSinal === 'QUEDA_FORTE' && c.tipoAlerta !== 'Queda Forte') return false
      if (filterCruzamento !== 'TODOS' && c.cruzamentoCredito !== filterCruzamento) return false

      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        const match =
          c.razaoSocial.toLowerCase().includes(term) ||
          c.codigoSap.toLowerCase().includes(term) ||
          c.vendedorNome.toLowerCase().includes(term)
        if (!match) return false
      }
      return true
    })
  }, [clientes, filterSinal, filterCruzamento, searchTerm])

  return (
    <div className="space-y-6">
      {/* 1. CARDS DE CRUZAMENTO CRÉDITO × RECORRÊNCIA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Cruzamento 1: Prioridade Financeira */}
        <Card
          onClick={() =>
            setFilterCruzamento(
              filterCruzamento === 'Prioridade Financeira' ? 'TODOS' : 'Prioridade Financeira',
            )
          }
          className={`border-rose-300 bg-rose-50/50 hover:bg-rose-50 transition-all cursor-pointer shadow-xs ${
            filterCruzamento === 'Prioridade Financeira' ? 'ring-2 ring-rose-500' : ''
          }`}
        >
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <Badge className="bg-rose-600 text-white font-bold text-[10px]">
                Prioridade Financeira
              </Badge>
              <ShieldAlert className="w-4 h-4 text-rose-600" />
            </div>
            <h4 className="font-serif font-bold text-sm text-rose-950">
              Perdeu Ritmo + Crédito Bloqueado
            </h4>
            <p className="text-xs text-rose-800 leading-relaxed">
              Cliente reduziu/interrompeu compras e possui restrição financeira ativa no SAP.
            </p>
            <div className="pt-2 border-t border-rose-200 flex items-center justify-between text-xs">
              <span className="text-rose-900 font-semibold">
                Ação: <strong>Solicitar revisão financeira</strong>
              </span>
              <span className="font-mono font-bold text-rose-700">
                {clientes.filter((c) => c.cruzamentoCredito === 'Prioridade Financeira').length}{' '}
                clientes
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Cruzamento 2: Prioridade Comercial */}
        <Card
          onClick={() =>
            setFilterCruzamento(
              filterCruzamento === 'Prioridade Comercial' ? 'TODOS' : 'Prioridade Comercial',
            )
          }
          className={`border-amber-300 bg-amber-50/50 hover:bg-amber-50 transition-all cursor-pointer shadow-xs ${
            filterCruzamento === 'Prioridade Comercial' ? 'ring-2 ring-amber-500' : ''
          }`}
        >
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <Badge className="bg-amber-600 text-white font-bold text-[10px]">
                Prioridade Comercial
              </Badge>
              <AlertOctagon className="w-4 h-4 text-amber-600" />
            </div>
            <h4 className="font-serif font-bold text-sm text-amber-950">
              Perdeu Ritmo + Crédito Normal
            </h4>
            <p className="text-xs text-amber-800 leading-relaxed">
              Cliente reduziu compras, mas possui limite liberado no SAP. A causa é comercial.
            </p>
            <div className="pt-2 border-t border-amber-200 flex items-center justify-between text-xs">
              <span className="text-amber-900 font-semibold">
                Ação: <strong>Contato & Oportunidade Retomada</strong>
              </span>
              <span className="font-mono font-bold text-amber-700">
                {clientes.filter((c) => c.cruzamentoCredito === 'Prioridade Comercial').length}{' '}
                clientes
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Cruzamento 3: Risco de Restrição */}
        <Card
          onClick={() =>
            setFilterCruzamento(
              filterCruzamento === 'Risco de Restrição' ? 'TODOS' : 'Risco de Restrição',
            )
          }
          className={`border-sky-300 bg-sky-50/50 hover:bg-sky-50 transition-all cursor-pointer shadow-xs ${
            filterCruzamento === 'Risco de Restrição' ? 'ring-2 ring-sky-500' : ''
          }`}
        >
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <Badge className="bg-sky-700 text-white font-bold text-[10px]">
                Risco de Restrição
              </Badge>
              <TrendingDown className="w-4 h-4 text-sky-700" />
            </div>
            <h4 className="font-serif font-bold text-sm text-sky-950">
              Compra Normal + Pouco Saldo
            </h4>
            <p className="text-xs text-sky-800 leading-relaxed">
              Cliente compra com recorrência porém o saldo disponível está próximo do esgotamento.
            </p>
            <div className="pt-2 border-t border-sky-200 flex items-center justify-between text-xs">
              <span className="text-sky-900 font-semibold">
                Ação: <strong>Avaliar limite preventivamente</strong>
              </span>
              <span className="font-mono font-bold text-sky-700">
                {clientes.filter((c) => c.cruzamentoCredito === 'Risco de Restrição').length}{' '}
                clientes
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. REGRA DE ALERTA COMERCIAL (TEXTO OBRIGATÓRIO) */}
      <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-950 leading-relaxed">
          <strong>Diretriz de Governança Comercial CIAFAL:</strong> Os alertas comerciais são{' '}
          <strong>hipóteses investigativas</strong>, nunca afirmações de causa. Quando um cliente
          tem parada abrupta, o sistema indica{' '}
          <em>"Parada abrupta — verificar situação de crédito"</em>. O status de crédito é sempre
          proveniente da integração oficial <strong>SAP ECC (F.35)</strong>. Quando não houver dado
          disponível no SAP, exibe-se <strong>"Sem informação SAP"</strong>.
        </div>
      </div>

      {/* 3. TABELA DETALHADA: CRÉDITO & RISCO */}
      <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
        <CardHeader className="p-4 bg-slate-50/70 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CardTitle className="font-serif text-base font-bold text-[#003A70]">
                Cruzamento de Recorrência & Posição de Crédito SAP
              </CardTitle>
              <Badge variant="outline" className="text-xs bg-white">
                {clientesFiltrados.length} registros
              </Badge>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar cliente, SAP..."
                className="h-8 text-xs w-48 sm:w-60 rounded-xl bg-white border-slate-200"
              />

              <Button
                size="sm"
                variant={filterSinal === 'PARADA_ABRUPTA' ? 'default' : 'outline'}
                onClick={() =>
                  setFilterSinal(filterSinal === 'PARADA_ABRUPTA' ? 'TODOS' : 'PARADA_ABRUPTA')
                }
                className="h-8 text-xs rounded-xl"
              >
                Parada Abrupta
              </Button>

              <Button
                size="sm"
                variant={filterSinal === 'QUEDA_FORTE' ? 'default' : 'outline'}
                onClick={() =>
                  setFilterSinal(filterSinal === 'QUEDA_FORTE' ? 'TODOS' : 'QUEDA_FORTE')
                }
                className="h-8 text-xs rounded-xl"
              >
                Queda Forte
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                <th className="p-3 pl-4 sticky left-0 bg-slate-100 z-10 w-64 shadow-xs">
                  Cliente / Razão Social
                </th>
                <th className="p-3">Sinal de Alerta</th>
                <th className="p-3 text-right">Compra Média</th>
                <th className="p-3 text-right">Ticket Médio</th>
                <th className="p-3 text-center">Dias s/ Compra</th>
                <th className="p-3 text-right">Estoque Produtos Parados</th>
                <th className="p-3 text-right">Limite Aprovado (SAP)</th>
                <th className="p-3 text-right">Saldo Disponível</th>
                <th className="p-3 text-right">Títulos Vencidos</th>
                <th className="p-3 text-center">Maior Atraso</th>
                <th className="p-3 text-center">Situação SAP</th>
                <th className="p-3 pr-4 text-center">Ação Sugerida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clientesFiltrados.map((c) => (
                <tr key={c.id} className="hover:bg-sky-50/50 transition-colors">
                  {/* Cliente */}
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
                        SAP {c.codigoSap} · {c.vendedorNome}
                      </span>
                    </button>
                  </td>

                  {/* Sinal de Alerta (Hipótese) */}
                  <td className="p-3">
                    {c.tipoAlerta === 'Parada Abrupta' ? (
                      <div>
                        <Badge className="bg-rose-600 text-white text-[10px] border-none block w-fit">
                          Parada Abrupta
                        </Badge>
                        <span className="text-[10px] text-rose-800 font-medium block mt-0.5">
                          verificar situação de crédito
                        </span>
                      </div>
                    ) : c.tipoAlerta === 'Queda Forte' ? (
                      <div>
                        <Badge className="bg-amber-500 text-white text-[10px] border-none block w-fit">
                          Queda Forte
                        </Badge>
                        <span className="text-[10px] text-amber-800 font-medium block mt-0.5">
                          volume abaixo do padrão
                        </span>
                      </div>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-[10px] text-emerald-700 bg-emerald-50 border-emerald-300"
                      >
                        Regular
                      </Badge>
                    )}
                  </td>

                  {/* Compra Mensal Média */}
                  <td className="p-3 text-right font-mono text-slate-800">
                    {unitMode === 'BRL'
                      ? formatBRL(c.compraMensalMediaValor)
                      : formatTons(c.compraMensalMediaTons)}
                  </td>

                  {/* Ticket Médio */}
                  <td className="p-3 text-right font-mono text-slate-800">
                    {formatBRL(c.ticketMedioValor)}
                  </td>

                  {/* Dias Sem Comprar */}
                  <td className="p-3 text-center font-mono font-bold">
                    <span
                      className={
                        c.diasSemComprar > 60
                          ? 'text-rose-600'
                          : c.diasSemComprar > 35
                            ? 'text-amber-600'
                            : 'text-slate-800'
                      }
                    >
                      {c.diasSemComprar}d
                    </span>
                  </td>

                  {/* Estoque dos Produtos Parados */}
                  <td className="p-3 text-right font-mono">
                    {c.estoqueProdutosParadosTons > 0 ? (
                      <span className="text-amber-700 font-semibold">
                        {formatTons(c.estoqueProdutosParadosTons)}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  {/* Limite Aprovado (SAP F.35) */}
                  <td className="p-3 text-right font-mono font-bold text-slate-900">
                    {formatBRL(c.credito.limiteAprovado)}
                  </td>

                  {/* Saldo Disponível */}
                  <td className="p-3 text-right font-mono font-semibold">
                    {c.credito.saldoDisponivel !== null ? (
                      <span
                        className={
                          c.credito.saldoDisponivel < 20000 ? 'text-rose-600' : 'text-emerald-700'
                        }
                      >
                        {formatBRL(c.credito.saldoDisponivel)}
                      </span>
                    ) : (
                      'Sem informação SAP'
                    )}
                  </td>

                  {/* Títulos Vencidos */}
                  <td className="p-3 text-right font-mono">
                    {c.credito.valorVencido && c.credito.valorVencido > 0 ? (
                      <span className="text-rose-600 font-bold">
                        {formatBRL(c.credito.valorVencido)}
                      </span>
                    ) : (
                      <span className="text-slate-500">R$ 0</span>
                    )}
                  </td>

                  {/* Maior Atraso */}
                  <td className="p-3 text-center font-mono">
                    {c.credito.maiorAtrasoDias && c.credito.maiorAtrasoDias > 0 ? (
                      <Badge
                        variant="outline"
                        className="bg-rose-50 text-rose-800 border-rose-300 text-[10px]"
                      >
                        {c.credito.maiorAtrasoDias} dias
                      </Badge>
                    ) : (
                      <span className="text-emerald-700 text-[11px]">0 dias</span>
                    )}
                  </td>

                  {/* Situação Cadastral SAP */}
                  <td className="p-3 text-center">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-bold ${
                        c.credito.statusCredito === 'Liberado'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : c.credito.statusCredito === 'Em Análise'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : c.credito.statusCredito === 'Bloqueado'
                              ? 'bg-rose-50 text-rose-800 border-rose-300'
                              : 'bg-slate-100 text-slate-600 border-slate-300'
                      }`}
                    >
                      {c.credito.statusCredito}
                    </Badge>
                  </td>

                  {/* Ações Específicas do Cruzamento */}
                  <td className="p-3 pr-4 text-center">
                    {c.cruzamentoCredito === 'Prioridade Financeira' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onSolicitarRevisaoCredito?.(c)}
                        className="h-7 text-[11px] rounded-xl border-rose-300 bg-rose-50 text-rose-900 hover:bg-rose-100"
                      >
                        Revisão Financeira
                      </Button>
                    ) : c.cruzamentoCredito === 'Prioridade Comercial' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onGerarOportunidadeRetomada?.(c)}
                        className="h-7 text-[11px] rounded-xl border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
                      >
                        Retomada Mix
                      </Button>
                    ) : c.cruzamentoCredito === 'Risco de Restrição' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          toast.info(
                            `Limite de ${c.razaoSocial} encaminhado para avaliação preventiva.`,
                          )
                        }
                        className="h-7 text-[11px] rounded-xl border-sky-300 bg-sky-50 text-sky-900 hover:bg-sky-100"
                      >
                        Avaliar Limite
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onSelectCliente(c.codigoSap)}
                        className="h-7 text-[11px] rounded-xl text-slate-600"
                      >
                        Ficha 360º
                      </Button>
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
