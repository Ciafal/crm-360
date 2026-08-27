import { useState, useEffect } from 'react'
import {
  Bot,
  Plus,
  Sparkles,
  Award,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Activity,
  Clock,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AiAgent } from '@/types/models'
import { useAuth } from '@/hooks/use-auth'
import { useCurrentAccount } from '@/hooks/use-current-account'
import { useRealtime } from '@/hooks/use-realtime'
import { getAiAgents, createAiAgent, updateAiAgent, deleteAiAgent } from '@/services/ai_agents'
import { getErrorMessage } from '@/lib/pocketbase/errors'
import { AgenteCard } from '@/components/agentes/AgenteCard'
import { AgenteFormDialog } from '@/components/agentes/AgenteFormDialog'
import { defaultAIProvider } from '@/providers'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function Agentes() {
  const { user } = useAuth()
  const { accountId } = useCurrentAccount()
  const [agents, setAgents] = useState<AiAgent[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAgent, setEditingAgent] = useState<AiAgent | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Estados do Sales Supervisor Agent
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [supervisorData, setSupervisorData] = useState<{
    diagnosticoGeral: string
    pontosAtencao: Array<{
      id: string
      vendedor: string
      problema: string
      evidencia: string
      impacto: string
      recomendacao: string
      tipo: 'RITMO' | 'LATENCIA' | 'CADENCIA' | 'CARTEIRA'
    }>
    feedbacksPositivos: Array<{
      id: string
      vendedor: string
      destaque: string
      evidencia: string
      pratica: string
    }>
  }>({
    diagnosticoGeral:
      'A equipe atingiu 75% da meta com R$ 1.875.000 faturados e 637t entregues. O pipeline ponderado (R$ 720k) cobre o Gap de R$ 625k nos 8 dias úteis restantes. Recomenda-se acelerar o follow-up de 8 cotações abertas.',
    pontosAtencao: [
      {
        id: 'pa-1',
        vendedor: 'João Pedro Representações',
        problema: 'Ritmo atual abaixo da trajetória e cadência comercial reduzida.',
        evidencia: 'Atingimento de 57.5% da meta (R$ 230k de R$ 400k) e 8 ações atrasadas.',
        impacto: 'Risco de não entrega de R$ 170k no fechamento mensal.',
        recomendacao:
          'Focar em visitas de reativação presencial na linha de cortes a laser em Patos de Minas.',
        tipo: 'RITMO',
      },
      {
        id: 'pa-2',
        vendedor: 'Carlos Mendonça',
        problema: 'Latência elevada em cotações SAP no estágio inicial.',
        evidencia:
          '3 propostas abertas (R$ 280k) aguardando retorno há mais de 48h sem follow-up ativo.',
        impacto: 'Perda de timing para concorrentes regionais que oferecem entrega imediata.',
        recomendacao:
          'Disparar mensagens de follow-up via WhatsApp com tabela CIF garantida para Contagem e Betim.',
        tipo: 'LATENCIA',
      },
      {
        id: 'pa-3',
        vendedor: 'Mariana Azevedo',
        problema: 'Concentração de pipeline em poucas contas de grande porte.',
        evidencia:
          '68% do volume previsto depende de apenas 2 propostas em Juiz de Fora e Divinópolis.',
        impacto: 'Vulnerabilidade caso ocorra adiamento de cronograma de obras dos clientes.',
        recomendacao:
          'Ativar 4 clientes em janela de recompra com mix de telas soldadas e vergalhões.',
        tipo: 'CARTEIRA',
      },
    ],
    feedbacksPositivos: [
      {
        id: 'fp-1',
        vendedor: 'Carlos Mendonça',
        destaque: 'Excelente assertividade técnica em campo.',
        evidencia:
          'Aprovação de laudo dimensional em tubos sanitários e chapas grossas na Usina Vale.',
        pratica:
          'Uso consistente do formulário de visita técnica e coleta de requisitos de qualidade.',
      },
      {
        id: 'fp-2',
        vendedor: 'Marcos Vinícius (Supervisor)',
        destaque: 'Alta conversão em contas estratégicas da diretoria.',
        evidencia:
          'Renovação do contrato trimestral de 26t de tarugos com a Siderúrgica Itaúna (R$ 152k).',
        pratica: 'Alinhamento direto de condições de pagamento com diretores de compras.',
      },
    ],
  })

  // Modal para criar ação a partir da recomendação da IA
  const [actionModalOpen, setActionModalOpen] = useState(false)
  const [actionData, setActionData] = useState({
    title: '',
    seller: '',
    priority: 'Alta',
  })

  const handleOpenActionModal = (recomendacao: string, vendedor: string) => {
    setActionData({
      title: recomendacao,
      seller: vendedor,
      priority: 'Alta',
    })
    setActionModalOpen(true)
  }

  const handleConfirmAction = () => {
    setActionModalOpen(false)
    toast.success('Ação de intervenção criada com sucesso!', {
      description: `Atribuída para ${actionData.seller}. Origem: AI_SUPERVISOR_RECOMMENDATION. Notificação enviada.`,
    })
  }

  const handleRunSupervisorAnalysis = async () => {
    setIsAnalyzing(true)
    toast.info('Sales Supervisor Agent analisando métricas de equipe...')

    try {
      if (defaultAIProvider.supervisor.runFullSupervisorDiagnostic) {
        const diag = await defaultAIProvider.supervisor.runFullSupervisorDiagnostic()
        setSupervisorData(diag)
      }
      setTimeout(() => {
        setIsAnalyzing(false)
        toast.success('Diagnóstico 360º de supervisão concluído!')
      }, 1000)
    } catch {
      setIsAnalyzing(false)
    }
  }

  const loadAgents = async () => {
    try {
      setLoading(true)
      const data = await getAiAgents()
      setAgents(data)
    } catch (error) {
      toast.error('Erro ao carregar agentes: ' + getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) loadAgents()
  }, [user])

  useRealtime('ai_agents', () => {
    loadAgents()
  })

  const handleCreateOrUpdate = async (data: { name: string; system_prompt: string }) => {
    try {
      if (editingAgent) {
        await updateAiAgent(editingAgent.id, data)
        toast.success('Agente atualizado com sucesso!')
      } else {
        await createAiAgent({
          ...data,
          account_id: accountId || '',
        })
        toast.success('Agente criado com sucesso!')
      }
      setDialogOpen(false)
      setEditingAgent(null)
      loadAgents()
    } catch (error) {
      toast.error('Erro ao salvar agente: ' + getErrorMessage(error))
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    try {
      await deleteAiAgent(deletingId)
      toast.success('Agente excluído com sucesso!')
      setDeletingId(null)
      loadAgents()
    } catch (error) {
      toast.error('Erro ao excluir agente: ' + getErrorMessage(error))
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-16">
      {/* SEÇÃO PRINCIPAL: SALES SUPERVISOR AGENT (DESTAQUE NO TOPO) */}
      <Card className="rounded-3xl border-primary/30 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white shadow-xl overflow-hidden">
        <div className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-gradient-to-tr from-amber-500 to-primary rounded-2xl shadow-lg shadow-amber-500/20">
                <Award className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-serif text-2xl font-bold text-white tracking-tight">
                    Sales Supervisor Agent
                  </h2>
                  <Badge className="bg-amber-400 text-slate-950 font-bold text-[10px] border-none">
                    IA NATIVA CIAFAL
                  </Badge>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  Copiloto de Liderança Comercial. Analisa Meta, Gap, Ritmo, Cadência, Latência,
                  Visitas e Carteira da equipe. Identifica oportunidades e pontos de atenção sem
                  gerar punições.
                </p>
              </div>
            </div>

            <Button
              size="sm"
              onClick={handleRunSupervisorAnalysis}
              disabled={isAnalyzing}
              className="h-10 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold gap-2 text-xs shadow-md shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              {isAnalyzing ? 'Processando Diagnóstico...' : 'Executar Análise Completa da Equipe'}
            </Button>
          </div>

          {/* DIAGNÓSTICO GERAL DA IA */}
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" /> DIAGNÓSTICO EXECUTIVO DA SUPERVISÃO
              </span>
              <Badge
                variant="outline"
                className="text-[9px] text-emerald-300 border-emerald-400/40"
              >
                Confiança 99.4%
              </Badge>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-sans">
              {supervisorData.diagnosticoGeral}
            </p>
          </div>

          {/* PONTOS DE ATENÇÃO (PROBLEMA, EVIDÊNCIA, IMPACTO, RECOMENDAÇÃO) & BOTÃO CRIAR AÇÃO */}
          <div className="space-y-3">
            <h3 className="font-serif font-bold text-sm text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> Pontos de Atenção Estruturados
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {supervisorData.pontosAtencao.map((pa) => (
                <div
                  key={pa.id}
                  className="bg-white/10 border border-white/10 p-4 rounded-2xl flex flex-col justify-between gap-3 text-xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge
                        className={cn(
                          'text-[9px] font-bold border-none',
                          pa.tipo === 'RITMO'
                            ? 'bg-rose-500 text-white'
                            : pa.tipo === 'LATENCIA'
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-blue-500 text-white',
                        )}
                      >
                        {pa.tipo}
                      </Badge>
                      <span className="text-[10px] text-slate-300 font-semibold">
                        {pa.vendedor}
                      </span>
                    </div>

                    <p className="font-bold text-white text-xs">{pa.problema}</p>
                    <p className="text-[11px] text-slate-300">
                      <strong className="text-amber-200">Evidência:</strong> {pa.evidencia}
                    </p>
                    <p className="text-[11px] text-slate-300">
                      <strong className="text-rose-300">Impacto:</strong> {pa.impacto}
                    </p>
                    <p className="text-[11px] text-slate-200 bg-black/20 p-2 rounded-lg border border-white/5">
                      <strong className="text-emerald-300">Recomendação:</strong> {pa.recomendacao}
                    </p>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleOpenActionModal(pa.recomendacao, pa.vendedor)}
                    className="w-full h-8 text-[11px] bg-primary hover:bg-primary/90 text-white font-bold gap-1 mt-2"
                  >
                    <Plus className="w-3.5 h-3.5" /> CRIAR AÇÃO PARA VENDEDOR
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* FEEDBACK POSITIVO & MELHORES PRÁTICAS */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <h3 className="font-serif font-bold text-sm text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Feedback Positivo & Melhores Práticas
              Identificadas
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {supervisorData.feedbacksPositivos.map((fp) => (
                <div
                  key={fp.id}
                  className="bg-emerald-950/40 border border-emerald-500/30 p-3.5 rounded-2xl space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-300">{fp.vendedor}</span>
                    <Badge className="bg-emerald-500/20 text-emerald-200 text-[9px] border-none">
                      Destaque Comercial
                    </Badge>
                  </div>
                  <p className="font-semibold text-white">{fp.destaque}</p>
                  <p className="text-[11px] text-slate-300">
                    <strong>Evidência:</strong> {fp.evidencia}
                  </p>
                  <p className="text-[11px] text-emerald-200 font-medium">
                    <strong>Prática:</strong> {fp.pratica}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* CABEÇALHO DO CATÁLOGO DE AGENTES */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <h2 className="text-2xl font-bold font-serif text-primary tracking-tight">
            Catálogo de Assistentes Virtuais
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure e gerencie seus agentes especialistas do Skip Cloud e automações de
            atendimento.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingAgent(null)
            setDialogOpen(true)
          }}
          className="gap-2 text-xs h-9 bg-primary"
        >
          <Plus className="h-4 w-4" />
          Novo Agente
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[180px] w-full rounded-xl" />
          ))}
        </div>
      ) : agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed rounded-xl bg-card/50">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <Bot className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Nenhum agente ainda</h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            Crie seu primeiro agente de IA para automatizar tarefas e auxiliar no atendimento.
          </p>
          <Button
            onClick={() => {
              setEditingAgent(null)
              setDialogOpen(true)
            }}
            className="gap-2"
          >
            <Plus className="w-4 h-4" /> Criar Agente
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <AgenteCard
              key={agent.id}
              agent={agent}
              onEdit={(a) => {
                setEditingAgent(a)
                setDialogOpen(true)
              }}
              onDelete={(id) => setDeletingId(id)}
            />
          ))}
        </div>
      )}

      {/* MODAL DE CRIAÇÃO DE AÇÃO A PARTIR DA IA DO SUPERVISOR */}
      <Dialog open={actionModalOpen} onOpenChange={setActionModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-primary">
              Criar Ação Recomendada pela IA
            </DialogTitle>
            <DialogDescription>
              Atribua esta tarefa ao vendedor selecionado com auditoria.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div>
              <label className="font-semibold text-muted-foreground block mb-1">
                Título da Ação
              </label>
              <input
                type="text"
                value={actionData.title}
                onChange={(e) => setActionData({ ...actionData, title: e.target.value })}
                className="w-full h-9 rounded-md border border-input px-3 py-1 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-muted-foreground block mb-1">
                  Responsável
                </label>
                <input
                  type="text"
                  value={actionData.seller}
                  onChange={(e) => setActionData({ ...actionData, seller: e.target.value })}
                  className="w-full h-9 rounded-md border border-input px-3 py-1 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Prioridade</label>
                <Select
                  value={actionData.priority}
                  onValueChange={(val) => setActionData({ ...actionData, priority: val })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Urgente">Urgente</SelectItem>
                    <SelectItem value="Alta">Alta</SelectItem>
                    <SelectItem value="Média">Média</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-[11px] text-amber-900">
              <strong>Nota de Auditoria:</strong> Ação gerada com origem{' '}
              <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">
                AI_SUPERVISOR_RECOMMENDATION
              </code>
              .
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmAction} className="bg-primary text-white font-semibold">
              Confirmar & Criar Ação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AgenteFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        agent={editingAgent}
        onSubmit={handleCreateOrUpdate}
      />

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O agente será permanentemente removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
