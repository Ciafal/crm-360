import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Server,
  RefreshCw,
  Play,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Eye,
  FileText,
  RotateCcw,
  Ban,
  Activity,
  Layers,
  Search,
  ArrowUpRight,
  Database,
  Calendar,
} from 'lucide-react'
import { quotationService } from '@/services/quotation_service'
import { SapMessageDrawer } from '@/components/cotacoes/SapMessageDrawer'
import { toast } from 'sonner'
import type { SapOrderQueueItem, SapOrderMessage } from '@/types/quotation'

export default function SapOrdersMonitor() {
  const [queue, setQueue] = useState<SapOrderQueueItem[]>([])
  const [messages, setMessages] = useState<SapOrderMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [filterText, setFilterText] = useState('')
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('TODOS')

  // Gaveta de Mensagens SAP
  const [msgDrawerOpen, setMsgDrawerOpen] = useState(false)
  const [activeIntegrationId, setActiveIntegrationId] = useState('')

  const loadData = () => {
    setLoading(true)
    const q = quotationService.getStoredSapQueue()
    const msgs = quotationService.getStoredSapMessages()
    setQueue(q)
    setMessages(msgs)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  // Simular Execução do JOB SAP ECC
  const handleRunJob = async (integrationId: string) => {
    try {
      toast.info('JOB SAP_SD_ORDER_IMPORT acionado para processar a fila...')
      await quotationService.simulateSapJobExecution(integrationId)
      toast.success('Processamento do JOB SAP concluído com sucesso!')
      loadData()
    } catch (err: any) {
      toast.error(`Erro ao executar JOB: ${err.message}`)
    }
  }

  // Reprocessar Item da Fila
  const handleRetry = async (integrationId: string) => {
    try {
      await quotationService.retrySapQueueItem(integrationId)
      toast.success('Solicitação recolocada na fila de processamento SAP!')
      loadData()
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`)
    }
  }

  // Cancelar Solicitação
  const handleCancel = async (integrationId: string) => {
    try {
      await quotationService.cancelSapQueueItem(integrationId)
      toast.success('Solicitação cancelada com sucesso.')
      loadData()
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`)
    }
  }

  // Contadores para os Cards de Topo
  const countWaiting = queue.filter(
    (q) => q.request_status === 'READY_FOR_SAP' || q.request_status === 'PENDING',
  ).length
  const countProcessing = queue.filter((q) => q.request_status === 'SAP_PROCESSING').length
  const countCreated = queue.filter((q) => q.request_status === 'SAP_CREATED').length
  const countBlocked = queue.filter((q) => q.request_status === 'SAP_BLOCKED').length
  const countError = queue.filter((q) => q.request_status === 'SAP_ERROR').length
  const countRetry = queue.filter((q) => q.request_status === 'RETRY_PENDING').length

  const filteredQueue = queue.filter((item) => {
    const matchesSearch =
      item.integration_id.toLowerCase().includes(filterText.toLowerCase()) ||
      item.quotation_code.toLowerCase().includes(filterText.toLowerCase()) ||
      (item.customer_name || '').toLowerCase().includes(filterText.toLowerCase()) ||
      (item.sap_order_number || '').toLowerCase().includes(filterText.toLowerCase())

    if (!matchesSearch) return false

    if (selectedStatusTab === 'AGUARDANDO')
      return item.request_status === 'READY_FOR_SAP' || item.request_status === 'PENDING'
    if (selectedStatusTab === 'IMPLANTADOS') return item.request_status === 'SAP_CREATED'
    if (selectedStatusTab === 'BLOQUEADOS') return item.request_status === 'SAP_BLOCKED'
    if (selectedStatusTab === 'ERROS')
      return item.request_status === 'SAP_ERROR' || item.request_status === 'RETRY_PENDING'
    return true
  })

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in pb-20">
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 text-blue-900 rounded-xl">
              <Server className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-primary tracking-tight">
                Monitor de Integração de Pedidos SAP ECC
              </h1>
              <p className="text-xs text-muted-foreground font-sans mt-0.5">
                Fila de Integração Assíncrona · CRM 360º ➔ Fila ➔ JOB SAP NetWeaver ➔ Retorno
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="h-9 gap-1.5 text-xs rounded-xl"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Atualizar Fila
          </Button>
          <Button
            size="sm"
            onClick={() => {
              const pendingItem = queue.find(
                (q) => q.request_status === 'READY_FOR_SAP' || q.request_status === 'RETRY_PENDING',
              )
              if (pendingItem) {
                handleRunJob(pendingItem.integration_id)
              } else {
                toast.info('Não há registros pendentes para execução imediata do JOB SAP.')
              }
            }}
            className="h-9 gap-1.5 text-xs bg-[#003A70] hover:bg-[#002850] text-white font-bold rounded-xl shadow-xs"
          >
            <Play className="w-3.5 h-3.5" /> Executar JOB SAP Manual
          </Button>
        </div>
      </div>

      {/* CARDS DE STATUS (MÉTRICAS DA FILA) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card
          onClick={() => setSelectedStatusTab('AGUARDANDO')}
          className={`cursor-pointer transition-all rounded-2xl p-4 border ${
            selectedStatusTab === 'AGUARDANDO'
              ? 'border-blue-500 bg-blue-50/50 shadow-sm'
              : 'border-border/40 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Aguardando</span>
            <Clock className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <span className="font-serif text-2xl font-bold text-blue-700">{countWaiting}</span>
        </Card>

        <Card
          onClick={() => setSelectedStatusTab('PROCESSANDO')}
          className={`cursor-pointer transition-all rounded-2xl p-4 border ${
            selectedStatusTab === 'PROCESSANDO'
              ? 'border-indigo-500 bg-indigo-50/50 shadow-sm'
              : 'border-border/40 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Processando</span>
            <Activity className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
          </div>
          <span className="font-serif text-2xl font-bold text-indigo-700">{countProcessing}</span>
        </Card>

        <Card
          onClick={() => setSelectedStatusTab('IMPLANTADOS')}
          className={`cursor-pointer transition-all rounded-2xl p-4 border ${
            selectedStatusTab === 'IMPLANTADOS'
              ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
              : 'border-border/40 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Implantados</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <span className="font-serif text-2xl font-bold text-emerald-700">{countCreated}</span>
        </Card>

        <Card
          onClick={() => setSelectedStatusTab('BLOQUEADOS')}
          className={`cursor-pointer transition-all rounded-2xl p-4 border ${
            selectedStatusTab === 'BLOQUEADOS'
              ? 'border-amber-500 bg-amber-50/50 shadow-sm'
              : 'border-border/40 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Bloqueados SAP</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <span className="font-serif text-2xl font-bold text-amber-700">{countBlocked}</span>
        </Card>

        <Card
          onClick={() => setSelectedStatusTab('ERROS')}
          className={`cursor-pointer transition-all rounded-2xl p-4 border ${
            selectedStatusTab === 'ERROS'
              ? 'border-rose-500 bg-rose-50/50 shadow-sm'
              : 'border-border/40 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Com Erro</span>
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <span className="font-serif text-2xl font-bold text-rose-700">{countError}</span>
        </Card>

        <Card
          onClick={() => setSelectedStatusTab('TODOS')}
          className={`cursor-pointer transition-all rounded-2xl p-4 border ${
            selectedStatusTab === 'TODOS'
              ? 'border-slate-800 bg-slate-50 shadow-sm'
              : 'border-border/40 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total na Fila</span>
            <Database className="w-3.5 h-3.5 text-slate-700" />
          </div>
          <span className="font-serif text-2xl font-bold text-slate-900">{queue.length}</span>
        </Card>
      </div>

      {/* FILTROS E BUSCA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-border/40 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID, Cotação, Pedido SAP ou Cliente..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="h-9 pl-8 text-xs rounded-xl"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['TODOS', 'AGUARDANDO', 'IMPLANTADOS', 'BLOQUEADOS', 'ERROS'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedStatusTab(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedStatusTab === tab
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-muted-foreground hover:bg-slate-100'
              }`}
            >
              {tab === 'TODOS'
                ? 'Todos'
                : tab === 'AGUARDANDO'
                  ? 'Aguardando SAP'
                  : tab === 'IMPLANTADOS'
                    ? 'Implantados'
                    : tab === 'BLOQUEADOS'
                      ? 'Bloqueados'
                      : 'Erros'}
            </button>
          ))}
        </div>
      </div>

      {/* TABELA DE MONITORAÇÃO DA FILA (crm_sap_order_queue) */}
      <Card className="bg-white rounded-3xl border-border/40 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-border/40 text-[10px] uppercase font-bold text-slate-600">
              <tr>
                <th className="py-3 px-4">Integration ID & Cotação</th>
                <th className="py-3 px-4">Cliente / Ship-To</th>
                <th className="py-3 px-4">Total & Moeda</th>
                <th className="py-3 px-4">Status da Fila</th>
                <th className="py-3 px-4">Ordem de Venda SAP</th>
                <th className="py-3 px-4">Retorno do JOB</th>
                <th className="py-3 px-4 text-center">Tentativas</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-muted-foreground">
                    Nenhum registro encontrado na fila de integração SAP para os filtros
                    selecionados.
                  </td>
                </tr>
              ) : (
                filteredQueue.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Integration ID e Cotação */}
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-primary block text-xs">
                        {item.integration_id}
                      </span>
                      <span className="text-[11px] text-slate-600">
                        {item.quotation_code} (v{item.quotation_version})
                      </span>
                      <span className="text-[10px] text-muted-foreground block">
                        {item.created_at}
                      </span>
                    </td>

                    {/* Cliente e Ship-to */}
                    <td className="py-3 px-4">
                      <strong className="text-slate-900 block text-xs">
                        {item.customer_name || 'Cliente'}
                      </strong>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        SAP: {item.sap_customer_code} · Ship-To: {item.ship_to_code}
                      </span>
                    </td>

                    {/* Total e Moeda */}
                    <td className="py-3 px-4">
                      <span className="font-serif font-bold text-emerald-700 block">
                        R$ {item.quotation_total.toLocaleString('pt-BR')}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {item.payment_terms} · {item.incoterm}
                      </span>
                    </td>

                    {/* Status Fila */}
                    <td className="py-3 px-4">
                      {item.request_status === 'READY_FOR_SAP' && (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-300 font-bold text-[10px]">
                          Aguardando SAP
                        </Badge>
                      )}
                      {item.request_status === 'SAP_PROCESSING' && (
                        <Badge className="bg-indigo-100 text-indigo-800 border-indigo-300 font-bold text-[10px] animate-pulse">
                          Processando...
                        </Badge>
                      )}
                      {item.request_status === 'SAP_CREATED' && (
                        <Badge className="bg-emerald-600 text-white border-none font-bold text-[10px]">
                          Implantado
                        </Badge>
                      )}
                      {item.request_status === 'SAP_BLOCKED' && (
                        <Badge className="bg-amber-600 text-white border-none font-bold text-[10px]">
                          Bloqueado no SAP
                        </Badge>
                      )}
                      {item.request_status === 'SAP_ERROR' && (
                        <Badge className="bg-rose-600 text-white border-none font-bold text-[10px]">
                          Erro SAP
                        </Badge>
                      )}
                      {item.request_status === 'RETRY_PENDING' && (
                        <Badge className="bg-purple-100 text-purple-800 border-purple-300 font-bold text-[10px]">
                          Reprocessamento
                        </Badge>
                      )}
                      {item.request_status === 'CANCELLED' && (
                        <Badge variant="outline" className="text-[10px]">
                          Cancelado
                        </Badge>
                      )}
                    </td>

                    {/* Ordem de Venda SAP */}
                    <td className="py-3 px-4">
                      {item.sap_order_number ? (
                        <span className="font-mono font-bold text-xs bg-emerald-50 text-emerald-900 border border-emerald-200 px-2.5 py-1 rounded-lg">
                          #{item.sap_order_number}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">—</span>
                      )}
                    </td>

                    {/* Retorno do JOB */}
                    <td className="py-3 px-4 max-w-xs">
                      <span className="text-[11px] text-slate-800 font-medium block truncate">
                        {item.sap_processing_status}
                      </span>
                      {item.processed_at && (
                        <span className="text-[10px] text-muted-foreground block">
                          Proc: {item.processed_at}
                        </span>
                      )}
                    </td>

                    {/* Tentativas */}
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">
                      {item.retry_count || 0}
                    </td>

                    {/* Ações */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Ver Mensagens SAP */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setActiveIntegrationId(item.integration_id)
                            setMsgDrawerOpen(true)
                          }}
                          className="h-7 text-[10px] text-primary hover:bg-slate-100 rounded-lg px-2"
                          title="Ver Mensagens RFC"
                        >
                          <Eye className="w-3 h-3 mr-1" /> Log RFC
                        </Button>

                        {/* Executar JOB se estiver pendente */}
                        {(item.request_status === 'READY_FOR_SAP' ||
                          item.request_status === 'RETRY_PENDING') && (
                          <Button
                            size="sm"
                            onClick={() => handleRunJob(item.integration_id)}
                            className="h-7 text-[10px] bg-[#003A70] text-white hover:bg-[#002850] rounded-lg px-2 font-bold"
                          >
                            <Play className="w-3 h-3 mr-1" /> Processar
                          </Button>
                        )}

                        {/* Reprocessar se bloqueado ou com erro */}
                        {(item.request_status === 'SAP_ERROR' ||
                          item.request_status === 'SAP_BLOCKED') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRetry(item.integration_id)}
                            className="h-7 text-[10px] text-amber-800 border-amber-300 hover:bg-amber-50 rounded-lg px-2"
                          >
                            <RotateCcw className="w-3 h-3 mr-1" /> Reprocessar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* GAVETA DE LOGS DE MENSAGENS SAP */}
      <SapMessageDrawer
        open={msgDrawerOpen}
        onOpenChange={setMsgDrawerOpen}
        integrationId={activeIntegrationId}
        messages={messages}
      />
    </div>
  )
}
