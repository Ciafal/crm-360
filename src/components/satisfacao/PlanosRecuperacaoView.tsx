import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  PlusCircle,
  FileCheck2,
  History,
  TrendingUp,
  User,
  ShieldAlert,
} from 'lucide-react'
import { PlanoRecuperacao, ClienteSatisfacao360 } from '@/types/satisfaction'
import { toast } from 'sonner'

interface PlanosRecuperacaoViewProps {
  planos: PlanoRecuperacao[]
  clientes: ClienteSatisfacao360[]
  onOpenCreatePlanModal: (cliente?: ClienteSatisfacao360) => void
  onSelectCliente: (clienteId: string) => void
  onRegisterExecution: (
    planId: string,
    execution: {
      responsavel: string
      acao: string
      resultado: string
      observacao?: string
      evidencia?: string
      proximaAcao?: string
    },
  ) => void
}

export function PlanosRecuperacaoView({
  planos,
  clientes,
  onOpenCreatePlanModal,
  onSelectCliente,
  onRegisterExecution,
}: PlanosRecuperacaoViewProps) {
  const [selectedPlan, setSelectedPlan] = useState<PlanoRecuperacao | null>(null)
  const [executionModalOpen, setExecutionModalOpen] = useState(false)
  const [execAcao, setExecAcao] = useState('')
  const [execResponsavel, setExecResponsavel] = useState('Carlos Mendonça')
  const [execResultado, setExecResultado] = useState('')
  const [execObs, setExecObs] = useState('')
  const [execProxima, setExecProxima] = useState('')

  const handleOpenExecution = (plan: PlanoRecuperacao) => {
    setSelectedPlan(plan)
    setExecAcao(plan.acoesPropostas[0]?.descricao || 'Visita / Follow-up')
    setExecutionModalOpen(true)
  }

  const handleSubmitExecution = () => {
    if (!selectedPlan || !execResultado) {
      toast.error('Informe o resultado da ação executada.')
      return
    }

    onRegisterExecution(selectedPlan.id, {
      responsavel: execResponsavel,
      acao: execAcao,
      resultado: execResultado,
      observacao: execObs,
      proximaAcao: execProxima,
    })

    toast.success(
      'Execução da ação registrada com sucesso no histórico de auditoria e performance!',
    )
    setExecutionModalOpen(false)
    setExecResultado('')
    setExecObs('')
    setExecProxima('')
  }

  return (
    <div className="space-y-4">
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <h3 className="font-serif text-base font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            Planos de Recuperação de Clientes em Risco & Críticos
          </h3>
          <p className="text-xs text-slate-400">
            Governança formal, registro de causas, prazos, histórico de ações e avaliação de
            eficácia do ISC.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => onOpenCreatePlanModal()}
          className="h-8 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl gap-1.5 shadow-xs"
        >
          <PlusCircle className="w-4 h-4" /> Criar Novo Plano
        </Button>
      </div>

      {/* LISTA DE PLANOS */}
      <div className="space-y-3">
        {planos.map((plano) => (
          <Card
            key={plano.id}
            className="p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-4 hover:border-slate-700 transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <strong
                    onClick={() => onSelectCliente(plano.clienteId)}
                    className="text-sm font-bold text-sky-400 hover:underline cursor-pointer"
                  >
                    {plano.clienteNome}
                  </strong>
                  <Badge variant="outline" className="text-xs bg-slate-900 text-slate-300">
                    SAP #{plano.clienteSap}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-xs bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold"
                  >
                    Status: {plano.status}
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-slate-900 text-slate-400">
                    Área: {plano.areaPrincipalEnvolvida}
                  </Badge>
                </div>
                <span className="text-xs text-slate-400 block mt-1">
                  Vendedor: {plano.vendedorNome} · Gestor: {plano.gestorNome} · Prazo Final:{' '}
                  {plano.prazoFinal}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Evolução do ISC
                  </span>
                  <div className="flex items-baseline gap-1.5 justify-end">
                    <span className="text-xs text-slate-400">
                      Antes: {plano.iscNoMomentoCriacao}
                    </span>
                    <span className="text-sm font-bold text-white font-serif">
                      → Atual: {plano.iscAtual}
                    </span>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenExecution(plano)}
                  className="h-8 text-xs text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/10 rounded-xl"
                >
                  <FileCheck2 className="w-3.5 h-3.5 mr-1" /> Registrar Execução
                </Button>
              </div>
            </div>

            {/* PROBLEMA & CAUSA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
                  Problema Identificado & Evidências
                </span>
                <p className="text-slate-200">{plano.problemaIdentificado}</p>
                <div className="pt-1 text-[11px] text-slate-400">
                  {plano.evidenciasFatos.map((ev, i) => (
                    <div key={i}>• {ev}</div>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                  Causa Raiz & Resultado Esperado
                </span>
                <p className="text-slate-200">
                  <strong>Causa:</strong> {plano.causaRaiz}
                </p>
                <p className="text-slate-300 pt-1">
                  <strong>Resultado Esperado:</strong> {plano.resultadoEsperado}
                </p>
              </div>
            </div>

            {/* AÇÕES PROPOSTAS */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Ações Propostas & Prazos
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {plano.acoesPropostas.map((ac) => (
                  <div
                    key={ac.id}
                    className="p-3 rounded-2xl bg-slate-900/50 border border-slate-800 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <Badge variant="outline" className="text-[10px] bg-slate-950 text-sky-400">
                        {ac.areaEnvolvida}
                      </Badge>
                      <span className="text-slate-400">Prazo: {ac.prazo}</span>
                    </div>
                    <p className="text-slate-200 font-medium">{ac.descricao}</p>
                    <span className="text-[10px] text-slate-400 block">Resp: {ac.responsavel}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* HISTÓRICO DE EXECUÇÕES REALIZADAS */}
            {plano.historicoExecucoes.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Histórico de Atuações (Alimenta Gestão de Performance)
                </span>
                <div className="space-y-1">
                  {plano.historicoExecucoes.map((ex, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <span className="font-bold text-slate-200">{ex.acao}</span>
                        <span className="text-slate-400 block text-[11px]">
                          Resultado: {ex.resultado} · Resp: {ex.responsavel}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">{ex.data}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        ))}

        {planos.length === 0 && (
          <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 text-center space-y-2">
            <p className="text-xs text-slate-400">Nenhum plano de recuperação registrado.</p>
          </div>
        )}
      </div>

      {/* MODAL PARA REGISTRAR EXECUÇÃO DA AÇÃO */}
      <Dialog open={executionModalOpen} onOpenChange={setExecutionModalOpen}>
        <DialogContent className="max-w-md bg-slate-950 text-slate-100 border-slate-800 rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white font-serif">
              Registrar Execução de Ação no Plano
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Cliente: {selectedPlan?.clienteNome}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div>
              <Label className="text-xs text-slate-300">Ação Realizada</Label>
              <Input
                value={execAcao}
                onChange={(e) => setExecAcao(e.target.value)}
                className="bg-slate-900 border-slate-800 text-xs rounded-xl mt-1 text-white"
                placeholder="Ex: Visita presencial técnica realizada"
              />
            </div>

            <div>
              <Label className="text-xs text-slate-300">Responsável pela Execução</Label>
              <Input
                value={execResponsavel}
                onChange={(e) => setExecResponsavel(e.target.value)}
                className="bg-slate-900 border-slate-800 text-xs rounded-xl mt-1 text-white"
              />
            </div>

            <div>
              <Label className="text-xs text-slate-300">Resultado Observado *</Label>
              <Textarea
                value={execResultado}
                onChange={(e) => setExecResultado(e.target.value)}
                className="bg-slate-900 border-slate-800 text-xs rounded-xl mt-1 text-white"
                placeholder="Descreva o que foi acordado com o cliente, se o problema foi sanado, etc."
                rows={3}
              />
            </div>

            <div>
              <Label className="text-xs text-slate-300">Próxima Ação Necessária (Opcional)</Label>
              <Input
                value={execProxima}
                onChange={(e) => setExecProxima(e.target.value)}
                className="bg-slate-900 border-slate-800 text-xs rounded-xl mt-1 text-white"
                placeholder="Ex: Enviar termo de garantia de lote em 24h"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExecutionModalOpen(false)}
                className="text-xs text-slate-400"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSubmitExecution}
                className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl"
              >
                Salvar Execução
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
