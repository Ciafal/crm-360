// src/components/gestao-clientes/Client360ExecutiveModal.tsx
import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Building2,
  Sparkles,
  PhoneCall,
  MessageSquare,
  Mail,
  Calendar,
  Layers,
  MapPin,
  TrendingUp,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Truck,
  DollarSign,
  Plus,
} from 'lucide-react'
import type { CustomerManagementItem } from '@/types/customer_management'
import { customerManagementService } from '@/services/customer_management_service'
import { toast } from 'sonner'
import { StatusBadge, AlertBlock } from './shared/GestaoClientesUiKit'

interface Client360ExecutiveModalProps {
  cliente: CustomerManagementItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onContactRegistered?: () => void
}

export function Client360ExecutiveModal({
  cliente,
  open,
  onOpenChange,
  onContactRegistered,
}: Client360ExecutiveModalProps) {
  const [activeTab, setActiveTab] = useState<
    'diagnostico_ia' | 'produtos' | 'timeline' | 'datas' | 'contato'
  >('diagnostico_ia')
  const [contactChannel, setContactChannel] =
    useState<CustomerManagementItem['ultimoContatoCanal']>('WhatsApp')
  const [contactSummary, setContactSummary] = useState('')
  const [nextActionInput, setNextActionInput] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)

  if (!cliente) return null

  const aiDiagnostic = customerManagementService.analyzeClientWithAI(cliente)

  const handleSaveContact = () => {
    if (!contactSummary.trim()) {
      toast.error('Informe o resumo da interação comercial.')
      return
    }

    setIsRegistering(true)
    setTimeout(() => {
      customerManagementService.registerCommercialContact(
        cliente.id,
        contactChannel,
        contactSummary,
        nextActionInput || cliente.proximaAcao,
      )
      setIsRegistering(false)
      setContactSummary('')
      setNextActionInput('')
      toast.success(`Contato via ${contactChannel} registrado com sucesso!`, {
        description: `Cobertura do cliente ${cliente.nomeFantasia} atualizada para Coberto (0 dias sem contato).`,
      })
      if (onContactRegistered) onContactRegistered()
      setActiveTab('timeline')
    }, 400)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-white text-slate-900 border border-border p-0 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Banner Homologação */}
        {cliente.is_mock && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-1.5 text-[10px] text-amber-900 font-mono flex items-center justify-between font-bold">
            <span>DADOS DE DEMONSTRAÇÃO · CIAFAL CRM 360</span>
            <span className="text-muted-foreground">Código SAP: {cliente.codigo}</span>
          </div>
        )}

        {/* HEADER MODAL */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Building2 className="w-5 h-5 text-[#003A70]" />
              <h2 className="font-serif text-lg sm:text-xl font-bold text-[#003A70] tracking-tight">
                {cliente.razaoSocial}
              </h2>
              <StatusBadge label={cliente.nomeFantasia} variant="default" />
              <StatusBadge
                label={cliente.classificacao.replace('_', ' ')}
                variant={
                  cliente.classificacao === 'ESTRATEGICO' || cliente.classificacao === 'CLIENTE_A'
                    ? 'positive'
                    : cliente.classificacao === 'EM_RISCO'
                      ? 'warning'
                      : 'default'
                }
              />
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400" /> {cliente.cidade} - {cliente.uf} (
                {cliente.regiao})
              </span>
              <span>•</span>
              <span>
                Vendedor: <strong className="text-slate-800">{cliente.vendedorNome}</strong>
              </span>
              <span>•</span>
              <span>
                Segmento: <strong className="text-slate-800">{cliente.segmento}</strong>
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setActiveTab('contato')}
              className="h-8 text-xs bg-[#003A70] hover:bg-[#002850] text-white rounded-xl gap-1.5 font-semibold shadow-2xs"
            >
              <PhoneCall className="w-3.5 h-3.5" /> Registrar Interação
            </Button>
          </div>
        </div>

        {/* Métricas Rápidas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 sm:p-4 bg-white border-b border-slate-200 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">
              Cobertura Carteira
            </span>
            <div className="flex items-center justify-between mt-1">
              <strong
                className={
                  cliente.coberto ? 'text-emerald-800 font-semibold' : 'text-red-700 font-semibold'
                }
              >
                {cliente.coberto
                  ? 'Coberto (No Prazo)'
                  : `Atrasado há ${cliente.coberturaVencidaDias}d`}
              </strong>
              <span className="text-[10px] text-slate-500">
                {cliente.frequenciaEsperadaDias}d max
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">
              Índice ISC Oficial
            </span>
            <div className="flex items-center justify-between mt-1">
              <strong className={cliente.isc >= 75 ? 'text-[#003A70]' : 'text-amber-800'}>
                {cliente.isc} / 100
              </strong>
              <span className="text-[10px] text-slate-500">Satisfação</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">
              OTIF CIAFAL
            </span>
            <div className="flex items-center justify-between mt-1">
              <strong
                className={
                  cliente.otif >= 90
                    ? 'text-emerald-800 font-semibold'
                    : 'text-amber-800 font-semibold'
                }
              >
                {cliente.otif}%
              </strong>
              <span className="text-[10px] text-slate-500">On Time In Full</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] text-slate-500 block uppercase font-bold">
              Faturamento 12M
            </span>
            <div className="flex items-center justify-between mt-1">
              <strong className="text-slate-900 font-semibold">
                R$ {(cliente.faturamento12m / 1000).toFixed(0)}k
              </strong>
              <span className="text-[10px] text-slate-500">{cliente.toneladas12m} t</span>
            </div>
          </div>
        </div>

        {/* Tabs Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="bg-slate-100 border border-slate-200 p-1 rounded-xl w-full grid grid-cols-5 text-xs mb-4">
              <TabsTrigger
                value="diagnostico_ia"
                className="rounded-lg gap-1.5 data-[state=active]:bg-[#003A70] data-[state=active]:text-white data-[state=active]:font-bold"
              >
                <Sparkles className="w-3.5 h-3.5" /> IA 360
              </TabsTrigger>
              <TabsTrigger
                value="produtos"
                className="rounded-lg gap-1.5 data-[state=active]:bg-[#003A70] data-[state=active]:text-white data-[state=active]:font-bold"
              >
                <Layers className="w-3.5 h-3.5" /> Cross-Sell
              </TabsTrigger>
              <TabsTrigger
                value="timeline"
                className="rounded-lg gap-1.5 data-[state=active]:bg-[#003A70] data-[state=active]:text-white data-[state=active]:font-bold"
              >
                <Clock className="w-3.5 h-3.5" /> Timeline
              </TabsTrigger>
              <TabsTrigger
                value="datas"
                className="rounded-lg gap-1.5 data-[state=active]:bg-[#003A70] data-[state=active]:text-white data-[state=active]:font-bold"
              >
                <Calendar className="w-3.5 h-3.5" /> Datas
              </TabsTrigger>
              <TabsTrigger
                value="contato"
                className="rounded-lg gap-1.5 data-[state=active]:bg-[#003A70] data-[state=active]:text-white data-[state=active]:font-bold"
              >
                <PhoneCall className="w-3.5 h-3.5" /> + Interação
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: DIAGNÓSTICO IA */}
            <TabsContent value="diagnostico_ia" className="space-y-4 m-0">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950/40 border border-sky-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-amber-400" /> Diagnóstico do Consultor IA
                    CIAFAL
                  </div>
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px]">
                    Score Urgência: {aiDiagnostic.scoreUrgencia}/100
                  </Badge>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed">{aiDiagnostic.situacao}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                    <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> Riscos Identificados
                    </span>
                    <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                      {aiDiagnostic.riscos.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5" /> Oportunidades & Avanços
                    </span>
                    <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                      {aiDiagnostic.oportunidades.map((o, i) => (
                        <li key={i}>{o}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-sky-300 uppercase font-bold block">
                      Produto Recomendado
                    </span>
                    <strong className="text-white text-sm">
                      {aiDiagnostic.produtoRecomendado.descricao}
                    </strong>
                    <span className="text-slate-400 block text-[11px] mt-0.5">
                      {aiDiagnostic.motivoRecomendacao}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      toast.success(`Cotação iniciada para ${cliente.nomeFantasia}`, {
                        description: `Item adicionado: ${aiDiagnostic.produtoRecomendado.descricao}`,
                      })
                    }}
                    className="h-8 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl shrink-0"
                  >
                    Gerar Cotação com Este Item
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: PRODUTOS & CROSS-SELL */}
            <TabsContent value="produtos" className="space-y-3 m-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Mix Sugerido & Oportunidades de Cross-Sell
                </span>
                <span className="text-xs text-slate-500">
                  Baseado no histórico do segmento {cliente.segmento}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {cliente.produtosSugeridos.map((prod) => (
                  <div
                    key={prod.id}
                    className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between gap-2.5"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className="text-[9px] font-mono border-sky-500/40 text-sky-300 bg-sky-950/30"
                        >
                          {prod.tipo.replace('_', ' ').toUpperCase()}
                        </Badge>
                        {prod.saldoEstoqueTons !== undefined && (
                          <span className="text-[10px] font-mono text-emerald-400">
                            {prod.saldoEstoqueTons > 0
                              ? `${prod.saldoEstoqueTons} t em pátio`
                              : 'PCP Programado'}
                          </span>
                        )}
                      </div>
                      <strong className="text-xs text-white block">{prod.descricao}</strong>
                      <p className="text-[11px] text-slate-400 leading-snug">{prod.motivo}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                      <span className="text-slate-400">
                        Potencial:{' '}
                        <strong className="text-slate-200">{prod.potencialTons} t</strong>
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          toast.success(`Item ${prod.codigo} adicionado ao rascunho de cotação!`)
                        }}
                        className="h-7 text-xs text-sky-400 hover:text-white p-0 hover:bg-transparent"
                      >
                        + Adicionar à Cotação →
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* TAB 3: TIMELINE UNIFICADA */}
            <TabsContent value="timeline" className="space-y-3 m-0">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Histórico Comercial Unificado
              </span>

              <div className="space-y-2">
                {cliente.timelineUnificada.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3 text-xs"
                  >
                    <div className="p-1.5 rounded-lg bg-slate-800 text-sky-400 shrink-0 mt-0.5">
                      {ev.tipo === 'whatsapp' && <MessageSquare className="w-3.5 h-3.5" />}
                      {ev.tipo === 'ligacao' && <PhoneCall className="w-3.5 h-3.5" />}
                      {ev.tipo === 'email' && <Mail className="w-3.5 h-3.5" />}
                      {ev.tipo === 'visita' && <MapPin className="w-3.5 h-3.5" />}
                      {ev.tipo === 'cotacao' && <FileSpreadsheet className="w-3.5 h-3.5" />}
                      {ev.tipo === 'faturamento' && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                      {ev.tipo === 'reclamacao' && (
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      )}
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <strong className="text-white text-xs">{ev.titulo}</strong>
                        <span className="text-[10px] text-slate-500 font-mono">{ev.data}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">{ev.descricao}</p>
                      <span className="text-[10px] text-slate-500 block">Autor: {ev.autor}</span>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* TAB 4: DATAS IMPORTANTES */}
            <TabsContent value="datas" className="space-y-3 m-0">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Agenda de Relacionamento & Datas Comemorativas
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {cliente.datasImportantes.map((dt) => (
                  <div
                    key={dt.id}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <strong className="text-white block">{dt.descricao}</strong>
                      {dt.nomeContato && (
                        <span className="text-[11px] text-slate-400 block">{dt.nomeContato}</span>
                      )}
                    </div>
                    <Badge className="bg-sky-950 text-sky-300 border-sky-800 text-xs font-mono">
                      {dt.data}
                    </Badge>
                  </div>
                ))}
                {cliente.datasImportantes.length === 0 && (
                  <div className="col-span-2 p-4 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                    Nenhuma data comemorativa cadastrada para este cliente.
                  </div>
                )}
              </div>
            </TabsContent>

            {/* TAB 5: REGISTRAR CONTATO */}
            <TabsContent value="contato" className="space-y-3 m-0">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
                <span className="font-bold text-white text-xs uppercase tracking-wider block">
                  Registrar Interação Comercial Válida
                </span>
                <p className="text-slate-400 text-[11px]">
                  Contatos válidos (ligação, WhatsApp, e-mail, visita presencial) renovam a
                  Cobertura Comercial da Carteira.
                </p>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400">
                    Canal Utilizado
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {(['WhatsApp', 'Telefone', 'E-mail', 'Visita', 'Reunião'] as const).map(
                      (canal) => (
                        <button
                          key={canal}
                          type="button"
                          onClick={() => setContactChannel(canal)}
                          className={`h-7 px-3 text-xs rounded-lg font-medium border transition-colors ${
                            contactChannel === canal
                              ? 'bg-[#003A70] text-white border-[#003A70] font-bold shadow-2xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {canal}
                        </button>
                      ),
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">
                    Resumo da Conversa
                  </label>
                  <textarea
                    rows={3}
                    value={contactSummary}
                    onChange={(e) => setContactSummary(e.target.value)}
                    placeholder="Ex.: Alinhado envio de proposta de 25t de perfis W e confirmação de estoque..."
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#003A70]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500">
                    Próxima Ação Definida
                  </label>
                  <input
                    type="text"
                    value={nextActionInput}
                    onChange={(e) => setNextActionInput(e.target.value)}
                    placeholder="Ex.: Retornar na quinta-feira após reunião de suprimentos"
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#003A70]"
                  />
                </div>
                <Button
                  onClick={handleSaveContact}
                  disabled={isRegistering}
                  className="w-full h-8 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl mt-2 shadow-2xs"
                >
                  {isRegistering
                    ? 'Salvando na Carteira...'
                    : 'Salvar Interação & Atualizar Cobertura'}
                </Button>{' '}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
