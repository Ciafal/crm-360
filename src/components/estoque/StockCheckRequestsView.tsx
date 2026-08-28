import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Warehouse,
  FileCheck,
  Search,
  Filter,
  Send,
  UserCheck,
  Eye,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import type { StockCheckRequest, CheckStatus } from '@/types/stock'
import { formatWeight } from '@/lib/utils'

interface StockCheckRequestsViewProps {
  checkRequests: StockCheckRequest[]
  onNewCheckRequest: () => void
  onRespondCheckRequest: (request: StockCheckRequest) => void
  userRole?: string
}

export function StockCheckRequestsView({
  checkRequests,
  onNewCheckRequest,
  onRespondCheckRequest,
  userRole,
}: StockCheckRequestsViewProps) {
  const [filterStatus, setFilterStatus] = useState<string>('todos')
  const [search, setSearch] = useState('')
  const [selectedProtocolDetails, setSelectedProtocolDetails] = useState<StockCheckRequest | null>(
    null,
  )

  const isManagerOrWms =
    userRole === 'administrador' ||
    userRole === 'admin' ||
    userRole === 'supervisor' ||
    userRole === 'gerente_comercial' ||
    userRole === 'wms'

  const filteredRequests = checkRequests.filter((req) => {
    const matchStatus = filterStatus === 'todos' ? true : req.status === filterStatus
    const matchSearch =
      !search ||
      req.protocol.toLowerCase().includes(search.toLowerCase()) ||
      req.materialCode.toLowerCase().includes(search.toLowerCase()) ||
      req.requesterName.toLowerCase().includes(search.toLowerCase()) ||
      (req.customerName && req.customerName.toLowerCase().includes(search.toLowerCase())) ||
      (req.batchNumber && req.batchNumber.toLowerCase().includes(search.toLowerCase()))

    return matchStatus && matchSearch
  })

  const getStatusBadge = (status: CheckStatus) => {
    switch (status) {
      case 'SOLICITADA':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-none font-bold text-[10px]">
            Solicitada
          </Badge>
        )
      case 'RECEBIDA':
        return (
          <Badge className="bg-indigo-100 text-indigo-800 border-none font-bold text-[10px]">
            Recebida WMS
          </Badge>
        )
      case 'EM_VERIFICACAO':
        return (
          <Badge className="bg-amber-100 text-amber-800 border-none font-bold text-[10px]">
            Em Verificação
          </Badge>
        )
      case 'CONFIRMADA':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold text-[10px]">
            Confirmada
          </Badge>
        )
      case 'CONFIRMADA_PARCIALMENTE':
        return (
          <Badge className="bg-teal-100 text-teal-800 border-none font-bold text-[10px]">
            Parcial
          </Badge>
        )
      case 'DIVERGENCIA_ENCONTRADA':
        return (
          <Badge className="bg-rose-100 text-rose-800 border-none font-bold text-[10px]">
            Divergência
          </Badge>
        )
      case 'INDISPONIVEL':
        return (
          <Badge className="bg-slate-200 text-slate-800 border-none font-bold text-[10px]">
            Indisponível
          </Badge>
        )
      case 'ENCERRADA':
        return (
          <Badge className="bg-slate-100 text-slate-600 border-none font-bold text-[10px]">
            Encerrada
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. RESUMO DOS PROTOCOLOS DE CHECAGEM */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white/95 rounded-3xl border border-border/50 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-muted-foreground block">
              Total de Solicitações
            </span>
            <strong className="text-2xl font-serif font-bold text-slate-900 block mt-1">
              {checkRequests.length}
            </strong>
          </div>
          <div className="p-2.5 bg-primary/10 rounded-2xl text-primary">
            <FileCheck className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 bg-white/95 rounded-3xl border border-border/50 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-amber-700 block">
              Em Verificação / Fila
            </span>
            <strong className="text-2xl font-serif font-bold text-amber-800 block mt-1">
              {
                checkRequests.filter(
                  (r) =>
                    r.status === 'SOLICITADA' ||
                    r.status === 'RECEBIDA' ||
                    r.status === 'EM_VERIFICACAO',
                ).length
              }
            </strong>
          </div>
          <div className="p-2.5 bg-amber-50 rounded-2xl text-amber-700">
            <Clock className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 bg-white/95 rounded-3xl border border-border/50 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-700 block">
              Confirmadas com Sucesso
            </span>
            <strong className="text-2xl font-serif font-bold text-emerald-800 block mt-1">
              {checkRequests.filter((r) => r.status === 'CONFIRMADA').length}
            </strong>
          </div>
          <div className="p-2.5 bg-emerald-50 rounded-2xl text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 bg-white/95 rounded-3xl border border-border/50 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-rose-700 block">
              Divergências / Ocorrências
            </span>
            <strong className="text-2xl font-serif font-bold text-rose-800 block mt-1">
              {
                checkRequests.filter(
                  (r) => r.status === 'DIVERGENCIA_ENCONTRADA' || r.status === 'INDISPONIVEL',
                ).length
              }
            </strong>
          </div>
          <div className="p-2.5 bg-rose-50 rounded-2xl text-rose-700">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* 2. FILTROS E BOTÃO DE NOVA SOLICITAÇÃO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-3">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
          <button
            onClick={() => setFilterStatus('todos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterStatus === 'todos'
                ? 'bg-white text-primary shadow-xs font-bold'
                : 'text-muted-foreground hover:text-slate-900'
            }`}
          >
            Todos ({checkRequests.length})
          </button>
          <button
            onClick={() => setFilterStatus('SOLICITADA')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterStatus === 'SOLICITADA'
                ? 'bg-blue-700 text-white shadow-xs font-bold'
                : 'text-blue-800 hover:bg-blue-50'
            }`}
          >
            Solicitadas
          </button>
          <button
            onClick={() => setFilterStatus('EM_VERIFICACAO')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterStatus === 'EM_VERIFICACAO'
                ? 'bg-amber-700 text-white shadow-xs font-bold'
                : 'text-amber-800 hover:bg-amber-50'
            }`}
          >
            Em Verificação
          </button>
          <button
            onClick={() => setFilterStatus('CONFIRMADA')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterStatus === 'CONFIRMADA'
                ? 'bg-emerald-700 text-white shadow-xs font-bold'
                : 'text-emerald-800 hover:bg-emerald-50'
            }`}
          >
            Confirmadas
          </button>
          <button
            onClick={() => setFilterStatus('DIVERGENCIA_ENCONTRADA')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filterStatus === 'DIVERGENCIA_ENCONTRADA'
                ? 'bg-rose-700 text-white shadow-xs font-bold'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            Divergências
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por protocolo, lote, vendedor..."
              className="h-8 pl-8 text-xs rounded-xl bg-white"
            />
          </div>

          <Button
            size="sm"
            onClick={onNewCheckRequest}
            className="h-8 text-xs rounded-xl bg-primary hover:bg-primary/90 text-white font-bold gap-1 shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Nova Checagem</span>
          </Button>
        </div>
      </div>

      {/* 3. TABELA DE SOLICITAÇÕES */}
      <Card className="p-5 bg-white/95 backdrop-blur-md rounded-3xl border border-border/50 shadow-xs space-y-4">
        <div className="rounded-2xl border border-border/50 overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="text-xs font-bold text-slate-700">Protocolo & SLA</TableHead>
                <TableHead className="text-xs font-bold text-slate-700">Material & Lote</TableHead>
                <TableHead className="text-xs font-bold text-slate-700">
                  Centro / Depósito
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-700 text-right">
                  Qtd Solicitada / Conf.
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-700">
                  Solicitante & Cotação
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-700 text-center">
                  Status
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-700 text-center">
                  Ações
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((req) => (
                <TableRow key={req.id} className="hover:bg-slate-50/80 transition-colors">
                  <TableCell>
                    <div className="space-y-0.5">
                      <strong className="font-mono text-xs font-bold text-primary block">
                        {req.protocol}
                      </strong>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Badge
                          variant="outline"
                          className={`text-[9px] px-1 py-0 font-bold ${
                            req.priority === 'URGENTE'
                              ? 'text-rose-700 border-rose-300 bg-rose-50'
                              : req.priority === 'ALTA'
                                ? 'text-amber-700 border-amber-300 bg-amber-50'
                                : 'text-slate-600'
                          }`}
                        >
                          {req.priority}
                        </Badge>
                        <span>SLA: {req.slaDeadline}</span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-0.5">
                      <span className="font-mono text-xs font-bold text-slate-900 block">
                        {req.materialCode}
                      </span>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {req.materialDescription}
                      </p>
                      <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">
                        Lote: {req.batchNumber || 'Geral'}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-xs space-y-0.5">
                      <strong className="text-slate-800 block">{req.plantName}</strong>
                      <span className="text-muted-foreground block text-[11px]">
                        {req.storageLocation}
                      </span>
                      <span className="text-[10px] text-primary block">
                        WMS: {req.wmsRequestId}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="space-y-0.5">
                      <strong className="text-xs text-slate-900 block">
                        Sol.: {formatWeight(req.requestedTons)}
                      </strong>
                      {req.confirmedPhysicalTons !== undefined ? (
                        <span
                          className={`text-xs font-bold block ${
                            req.divergenceFound ? 'text-rose-600' : 'text-emerald-700'
                          }`}
                        >
                          Conf.: {formatWeight(req.confirmedPhysicalTons)}
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground block">
                          Pendente de contagem
                        </span>
                      )}
                      {req.divergenceFound && (
                        <span className="text-[9px] text-rose-700 font-bold block">
                          Div.: {formatWeight(req.divergenceTons || 0)}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="text-xs space-y-0.5">
                      <strong className="text-slate-800 block">{req.requesterName}</strong>
                      {req.quotationCode && (
                        <span className="font-mono text-[10px] text-primary block">
                          {req.quotationCode}
                        </span>
                      )}
                      {req.customerName && (
                        <span className="text-[10px] text-muted-foreground block truncate max-w-[140px]">
                          {req.customerName}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="text-center">{getStatusBadge(req.status)}</TableCell>

                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      {/* Botão para WMS / Supervisor responder conferência */}
                      {req.status !== 'CONFIRMADA' && req.status !== 'ENCERRADA' && (
                        <Button
                          size="sm"
                          onClick={() => onRespondCheckRequest(req)}
                          className="h-7 text-[11px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1 shadow-xs"
                        >
                          <UserCheck className="w-3 h-3" />
                          <span>Retorno WMS</span>
                        </Button>
                      )}

                      {/* Ver Histórico */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedProtocolDetails(req)}
                        className="h-7 w-7 p-0 rounded-xl text-slate-600 hover:text-slate-900"
                        title="Ver histórico do protocolo"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* DRAWER / MODAL SIMPLES DE DETALHES DO HISTÓRICO */}
      {selectedProtocolDetails && (
        <Card className="p-5 bg-slate-900 text-white rounded-3xl border border-slate-800 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <h4 className="font-bold text-sm">
                Trilha de Eventos · Protocolo {selectedProtocolDetails.protocol}
              </h4>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedProtocolDetails(null)}
              className="h-7 text-xs text-slate-400 hover:text-white"
            >
              Fechar
            </Button>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800">
            {selectedProtocolDetails.historyLog.map((ev, i) => (
              <div
                key={i}
                className="text-xs p-2.5 rounded-xl bg-slate-800/60 flex items-start justify-between"
              >
                <div>
                  <strong className="text-emerald-400 block">{ev.action}</strong>
                  <span className="text-slate-300 text-[11px]">{ev.comment}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Por: {ev.actor}</span>
                </div>
                <span className="font-mono text-[10px] text-slate-400 shrink-0">{ev.datetime}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
