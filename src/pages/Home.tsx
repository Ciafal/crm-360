import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MessageSquare,
  UserPlus,
  ChevronRight,
  Camera,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Video,
  FileText,
  AudioLines,
  ListTodo,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  Target,
  Users2,
  Zap,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useTeamMembers } from '@/hooks/use-team-members'
import { useInstanciaAtiva, useConversas } from '@/hooks/use-whatsapp'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import { useTasks } from '@/hooks/use-tasks'
import { useDailyActions } from '@/hooks/use-daily-actions'
import { useBI } from '@/hooks/use-bi'
import { getPriorityMeta } from '@/lib/task-meta'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { TaskViewDialog } from '@/components/TaskViewDialog'
import { DailyActionsSection } from '@/components/home/DailyActionsSection'
import { StrategicSummarySection } from '@/components/home/StrategicSummarySection'

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { instance } = useInstanciaAtiva()
  const { conversations } = useConversas(instance?.instance_name)
  const { tasks } = useTasks()
  const { actions, loading: loadingActions, updateActionStatus } = useDailyActions()
  const { dailySummary, isDemoData } = useBI(user?.id)

  const [chartData, setChartData] = useState<any[]>([])
  const [loadingChart, setLoadingChart] = useState(true)

  const [crmCount, setCrmCount] = useState(0)
  const [crmTrendCount, setCrmTrendCount] = useState(0)

  const { members: rawTeamMembers } = useTeamMembers()
  const teamMembers = useMemo(
    () => rawTeamMembers.map((m) => m.expand?.user_id).filter(Boolean),
    [rawTeamMembers],
  )

  const [selectedTask, setSelectedTask] = useState<any | null>(null)
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)

  useEffect(() => {
    if (!instance?.instance_name) return
    const fetchCrmStats = async () => {
      try {
        const total = await pb.collection('crm_contacts').getList(1, 1, {
          filter: `instance_name = '${instance.instance_name}'`,
          requestKey: null,
        })

        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const dateIso = sevenDaysAgo.toISOString().replace('T', ' ')

        const recent = await pb.collection('crm_contacts').getList(1, 1, {
          filter: `instance_name = '${instance.instance_name}' && created >= '${dateIso}'`,
          requestKey: null,
        })

        setCrmCount(total.totalItems)
        setCrmTrendCount(recent.totalItems)
      } catch (err) {
        console.error('Error fetching CRM stats')
      }
    }
    fetchCrmStats()
  }, [instance?.instance_name])

  const fetchChartData = useCallback(
    async (silent = false) => {
      if (!instance?.instance_name) {
        if (!silent) setLoadingChart(false)
        return
      }

      if (!silent) setLoadingChart(true)
      try {
        const days = Array.from({ length: 7 })
          .map((_, i) => {
            const d = new Date()
            d.setDate(d.getDate() - i)
            d.setHours(0, 0, 0, 0)
            const startMs = d.getTime()
            const endMs = startMs + 86400000

            const startSec = Math.floor(startMs / 1000)
            const endSec = Math.floor(endMs / 1000)

            return { date: d, startSec, endSec }
          })
          .reverse()

        const promises = days.flatMap((d) => [
          pb.collection('whatsapp_messages').getList(1, 1, {
            filter: `instance_name = '${instance.instance_name}' && timestamp >= ${d.startSec} && timestamp < ${d.endSec} && from_me = true`,
            requestKey: null,
          }),
          pb.collection('whatsapp_messages').getList(1, 1, {
            filter: `instance_name = '${instance.instance_name}' && timestamp >= ${d.startSec} && timestamp < ${d.endSec} && from_me = false`,
            requestKey: null,
          }),
        ])

        const results = await Promise.all(promises)

        const newChartData = days.map((d, i) => {
          const sent = results[i * 2].totalItems
          const received = results[i * 2 + 1].totalItems
          return {
            label: d.date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
            sent,
            received,
            total: sent + received,
          }
        })

        setChartData(newChartData)
      } catch (err) {
        console.error(err)
        if (!silent) {
          toast({
            title: 'Erro ao carregar dados',
            description: 'Não foi possível carregar as métricas do gráfico.',
            variant: 'destructive',
          })
        }
      } finally {
        if (!silent) setLoadingChart(false)
      }
    },
    [instance?.instance_name, toast],
  )

  useEffect(() => {
    fetchChartData()
  }, [fetchChartData])

  useRealtime('whatsapp_messages', () => {
    fetchChartData(true)
  })

  const { activeConversationsCount, activeTrendCount, unreadCount } = useMemo(() => {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    let unread = 0
    let activeWeek = 0

    conversations.forEach((c) => {
      unread += c.unread_count || 0
      if (new Date(c.created) > sevenDaysAgo) {
        activeWeek++
      }
    })

    return {
      activeConversationsCount: conversations.length,
      activeTrendCount: activeWeek,
      unreadCount: unread,
    }
  }, [conversations])

  const pendingTasks = useMemo(() => {
    return tasks.filter((t) => t.status !== 'concluida' && t.status !== 'cancelada')
  }, [tasks])

  const myPendingTasks = useMemo(() => {
    return pendingTasks.filter((t) => t.assigned_to === user?.id)
  }, [pendingTasks, user?.id])

  const myUrgentTasks = useMemo(() => {
    const PRIORITY_WEIGHT: Record<string, number> = {
      urgente: 4,
      alta: 3,
      media: 2,
      baixa: 1,
    }
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return [...myPendingTasks].sort((a, b) => {
      const aDue = a.due_date ? new Date(a.due_date) : null
      const bDue = b.due_date ? new Date(b.due_date) : null

      const aOverdue = aDue && aDue < today
      const bOverdue = bDue && bDue < today

      if (aOverdue && !bOverdue) return -1
      if (!aOverdue && bOverdue) return 1

      if (aDue && bDue) {
        if (aDue.getTime() !== bDue.getTime()) return aDue.getTime() - bDue.getTime()
      } else if (aDue && !bDue) {
        return -1
      } else if (!aDue && bDue) {
        return 1
      }

      const aPri = PRIORITY_WEIGHT[a.priority] || 0
      const bPri = PRIORITY_WEIGHT[b.priority] || 0
      return bPri - aPri
    })
  }, [myPendingTasks])

  const todayData = chartData[chartData.length - 1] || { total: 0, sent: 0, received: 0 }
  const yesterdayData = chartData[chartData.length - 2] || { total: 0, sent: 0, received: 0 }
  const messagesToday = todayData.total
  const yesterdayMessages = yesterdayData.total

  let todayTrend = ''
  let todayTrendUp = true
  if (loadingChart) {
    todayTrend = 'carregando...'
  } else if (yesterdayMessages === 0 && messagesToday > 0) {
    todayTrend = 'novo recorde'
    todayTrendUp = true
  } else if (messagesToday > yesterdayMessages) {
    todayTrend = `+${messagesToday - yesterdayMessages} em relação a ontem`
    todayTrendUp = true
  } else if (messagesToday < yesterdayMessages) {
    todayTrend = `${yesterdayMessages - messagesToday} a menos que ontem`
    todayTrendUp = false
  } else {
    todayTrend = 'mesmo volume de ontem'
    todayTrendUp = true
  }

  const statCards = [
    {
      title: 'Conversas ativas',
      value: activeConversationsCount.toString(),
      trend: activeTrendCount > 0 ? `+${activeTrendCount} esta semana` : 'Nenhuma esta semana',
      trendUp: activeTrendCount > 0,
      link: '/conversas',
    },
    {
      title: 'Não lidas',
      value: unreadCount.toString(),
      trend: unreadCount > 0 ? 'responder em breve' : 'tudo em dia',
      trendUp: unreadCount === 0,
      link: '/conversas',
    },
    {
      title: 'Mensagens hoje',
      value: messagesToday.toString(),
      trend: todayTrend,
      trendUp: todayTrendUp,
      link: '/conversas',
    },
    {
      title: 'Contatos no CRM',
      value: crmCount.toString(),
      trend: crmTrendCount > 0 ? `+${crmTrendCount} esta semana` : 'Nenhum esta semana',
      trendUp: crmTrendCount >= 0,
      link: '/crm',
    },
  ]

  const myTaskCount = myPendingTasks.length
  const otherTeamTasksCount = pendingTasks.length - myPendingTasks.length

  let headerTaskText = ''
  if (myTaskCount > 0 || otherTeamTasksCount > 0) {
    if (myTaskCount === 1) {
      headerTaskText = '1 tarefa sua'
    } else if (myTaskCount > 1) {
      headerTaskText = `${myTaskCount} tarefas suas`
    } else {
      headerTaskText = 'Nenhuma tarefa sua'
    }

    if (otherTeamTasksCount > 0) {
      headerTaskText += ` · ${otherTeamTasksCount} da equipe`
    }

    headerTaskText += ' pendentes'
  }

  const shortcuts = [
    {
      title: 'Gestão de Inativos',
      description: 'Recupere contas e faturamento',
      icon: RefreshCw,
      color: 'text-emerald-700',
      bg: 'bg-emerald-100',
      link: '/gestao-inativos',
    },
    {
      title: 'Abrir Conversas',
      description: 'Acesse seu inbox comercial',
      icon: MessageSquare,
      color: 'text-primary',
      bg: 'bg-primary/10',
      link: '/conversas',
    },
    {
      title: 'Pipeline CRM',
      description: 'Acompanhe negociações',
      icon: Target,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      link: '/crm',
    },
  ]

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'BOM DIA'
    if (hour < 18) return 'BOA TARDE'
    return 'BOA NOITE'
  }

  const currentDateStr = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  const formattedDate = currentDateStr.charAt(0).toUpperCase() + currentDateStr.slice(1)

  const instanceStatus = instance?.status || 'disconnected'
  const isConnected = instanceStatus === 'connected'
  const isConnecting = instanceStatus === 'qrcode' || instanceStatus === 'creating'
  const statusColor = isConnected ? 'bg-emerald-500' : isConnecting ? 'bg-amber-500' : 'bg-gray-500'
  const statusText = isConnected ? 'Conectado' : isConnecting ? 'Conectando' : 'Desconectado'
  const instanceLabel = instance?.instance_name || 'WhatsApp principal'

  const maxTotal = Math.max(...chartData.map((d) => d.total), 1)

  // KPIs de Execução Diária
  const actionsDoneCount = actions.filter((a) => a.status === 'concluida').length
  const actionsPendingCount = actions.filter(
    (a) => a.status === 'pendente' || a.status === 'em_andamento',
  ).length
  const executionRate =
    actions.length > 0 ? Math.round((actionsDoneCount / actions.length) * 100) : 0

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8 animate-fade-in pb-16">
      {/* Section 1: Hero & Instance Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
          <div className="flex items-center gap-4 md:gap-5">
            <Avatar className="h-14 w-14 md:h-16 md:w-16 border-2 border-background shadow-sm">
              <AvatarImage src={user?.avatar ? pb.files.getUrl(user, user.avatar) : ''} />
              <AvatarFallback className="bg-primary/5 text-primary font-serif font-bold text-xl md:text-2xl">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-0.5 md:gap-1">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground font-sans font-semibold text-[10px] md:text-xs uppercase tracking-widest">
                  {getGreeting()} · MEU DIA COMERCIAL 360
                </span>
                {isDemoData && (
                  <Badge
                    variant="outline"
                    className="text-[10px] py-0 px-2 bg-amber-50 text-amber-700 border-amber-300"
                  >
                    Dados demonstrativos
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary tracking-tight font-sans leading-none">
                Olá, {user?.name?.split(' ')[0] || 'Vendedor'}
              </h1>
              <p className="text-muted-foreground font-sans text-sm md:text-base mt-0.5">
                {formattedDate} · Cargo:{' '}
                <span className="font-semibold text-primary capitalize">
                  {user?.role ? user.role.replace('_', ' ') : 'Gerente Comercial'}
                </span>
              </p>
              {headerTaskText && (
                <div
                  onClick={() => navigate('/tarefas')}
                  className="group flex items-center gap-1.5 mt-1.5 text-xs font-medium text-amber-600 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-full px-2.5 py-1 w-fit cursor-pointer transition-colors"
                >
                  <ListTodo className="w-3.5 h-3.5" />
                  <span>{headerTaskText}</span>
                  <ChevronRight className="w-3 h-3 opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
                </div>
              )}
            </div>
          </div>

          {teamMembers.length > 0 && (
            <div
              onClick={() => navigate('/equipe')}
              className="flex items-center gap-3 bg-white/50 border border-border/40 rounded-full py-1.5 px-2 md:px-4 cursor-pointer hover:bg-white hover:shadow-sm transition-all self-start md:self-auto"
            >
              <div className="flex -space-x-2">
                {teamMembers.slice(0, 4).map((member) => (
                  <Avatar key={member.id} className="w-8 h-8 border-2 border-white shadow-sm">
                    <AvatarImage
                      src={member.avatar ? pb.files.getUrl(member, member.avatar) : ''}
                    />
                    <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                      {member.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {teamMembers.length > 4 && (
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground z-10 shadow-sm">
                    +{teamMembers.length - 4}
                  </div>
                )}
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-xs font-bold text-primary leading-none">Equipe</span>
                <span className="text-[10px] text-muted-foreground font-medium">
                  {teamMembers.length} {teamMembers.length === 1 ? 'membro' : 'membros'}
                </span>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => navigate('/conversas')}
          className="group flex items-center gap-2.5 px-4 py-2.5 bg-white/80 hover:bg-white border border-border/40 rounded-full transition-all shadow-sm hover:shadow-md text-xs md:text-sm shrink-0 self-start md:self-auto"
        >
          <div className="relative flex h-2 w-2 md:h-2.5 md:w-2.5">
            {isConnected && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span className={cn('relative inline-flex rounded-full h-full w-full', statusColor)} />
          </div>
          <span className="font-semibold text-foreground/80">{statusText}</span>
          <span className="text-muted-foreground/40">•</span>
          <span className="text-muted-foreground hidden sm:inline truncate max-w-[140px] font-medium">
            {instanceLabel}
          </span>
          <ChevronRight className="w-4 h-4 text-muted-foreground/60 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* KPIs de Execução Diária Comercial */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="bg-white/60 border-border/40 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Ações Geradas
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-serif text-3xl font-bold text-primary">{actions.length}</span>
            <span className="text-xs text-muted-foreground">hoje</span>
          </div>
        </Card>

        <Card className="bg-white/60 border-border/40 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
            Ações Concluídas
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-serif text-3xl font-bold text-emerald-600">
              {actionsDoneCount}
            </span>
            <Badge
              variant="outline"
              className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300"
            >
              {executionRate}%
            </Badge>
          </div>
        </Card>

        <Card className="bg-white/60 border-border/40 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">
            Ações Pendentes
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-serif text-3xl font-bold text-amber-600">
              {actionsPendingCount}
            </span>
            <span className="text-xs text-muted-foreground">restantes</span>
          </div>
        </Card>

        <Card className="bg-white/60 border-border/40 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Reativações Mês
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-serif text-3xl font-bold text-primary">
              {dailySummary?.reactivatedThisMonth || 5}
            </span>
            <span className="text-xs text-emerald-600 font-semibold">+2 vs anterior</span>
          </div>
        </Card>

        <Card className="bg-white/60 border-border/40 rounded-2xl p-4 flex flex-col justify-between shadow-sm col-span-2 md:col-span-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
            Receita Recuperada
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="font-serif text-2xl font-bold text-primary">
              R$ {((dailySummary?.revenueRecovered || 312500) / 1000).toFixed(0)}k
            </span>
            <span className="text-[10px] text-muted-foreground">
              {dailySummary?.tonsRecovered || 41.8} ton
            </span>
          </div>
        </Card>
      </div>

      {/* C.1.1 Seção AÇÕES DO DIA */}
      <DailyActionsSection
        actions={actions}
        loading={loadingActions}
        onUpdateStatus={updateActionStatus}
        onOpenCustomer360={(custId) => navigate(`/gestao-inativos?cliente=${custId}`)}
        onNavigateConversas={(query) =>
          navigate(query ? `/conversas?search=${encodeURIComponent(query)}` : '/conversas')
        }
      />

      {/* C.1.2 Seção RESUMO ESTRATÉGICO */}
      <StrategicSummarySection
        onFilterCategory={(cat) => {
          // Permite rolar e selecionar tab nas Ações do Dia
          window.scrollTo({ top: 380, behavior: 'smooth' })
        }}
      />

      {/* Section 2: Metric Cards Originais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {statCards.map((stat, i) => (
          <Card
            key={i}
            onClick={() => navigate(stat.link)}
            className="border-border/40 bg-white/50 backdrop-blur-md shadow-none hover:shadow-md hover:bg-white/80 transition-all duration-200 cursor-pointer rounded-2xl overflow-hidden group"
          >
            <CardContent className="p-6 md:p-8 flex flex-col items-center text-center gap-3 min-h-[180px] md:min-h-[210px] justify-center">
              <p className="text-[10px] md:text-[11px] font-semibold text-muted-foreground/80 font-sans uppercase tracking-[0.15em]">
                {stat.title}
              </p>

              {loadingChart ? (
                <Skeleton className="h-14 md:h-20 w-24 md:w-32 rounded-lg" />
              ) : (
                <p className="text-6xl md:text-7xl font-bold font-serif text-primary tracking-tight leading-none transition-transform group-hover:-translate-y-0.5">
                  {stat.value}
                </p>
              )}

              <div className="flex items-center gap-1 text-[11px] md:text-xs min-h-[16px]">
                {loadingChart ? (
                  <Skeleton className="h-3 w-24" />
                ) : (
                  <>
                    {stat.trendUp ? (
                      <ArrowUpRight className="w-3.5 h-3.5 text-primary shrink-0" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    )}
                    <span
                      className={cn(
                        'font-medium font-sans',
                        stat.trendUp ? 'text-primary' : 'text-amber-700',
                      )}
                    >
                      {stat.trend}
                    </span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Section 3: 7-Day Activity Chart */}
        <Card className="lg:col-span-2 border-border/40 bg-white/50 backdrop-blur-md shadow-sm rounded-2xl overflow-hidden flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-xl font-bold text-primary">
              Volume de Mensagens (7 dias)
            </CardTitle>
            <p className="text-sm text-muted-foreground font-sans">
              Enviadas vs. Recebidas ao longo da semana.
            </p>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-end pt-4">
            {loadingChart ? (
              <div className="flex items-end justify-around h-48 gap-2 mt-4">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="w-full max-w-[48px] h-full rounded-t-md opacity-20"
                  />
                ))}
              </div>
            ) : (
              <>
                <div className="relative flex items-end justify-around h-48 gap-2 mt-4">
                  {maxTotal === 1 && chartData.every((d) => d.total === 0) && (
                    <div className="absolute inset-0 pb-6 flex flex-col items-center justify-center text-muted-foreground text-center pointer-events-none z-0">
                      <BarChart3 className="w-10 h-10 mb-3 opacity-20" />
                      <span className="text-sm font-medium">
                        Assim que chegar uma nova mensagem, o gráfico começa a contar!
                      </span>
                    </div>
                  )}
                  {chartData.map((d, i) => {
                    const totalHeight = `${(d.total / maxTotal) * 100}%`
                    const receivedPct = d.total > 0 ? (d.received / d.total) * 100 : 0
                    const sentPct = d.total > 0 ? (d.sent / d.total) * 100 : 0

                    return (
                      <Tooltip key={i} delayDuration={100}>
                        <TooltipTrigger asChild>
                          <div className="flex flex-col items-center flex-1 gap-2 group z-10 h-full cursor-default">
                            <div className="w-full flex-1 flex flex-col justify-end items-center px-1 relative">
                              <div
                                className="w-full max-w-[48px] rounded-t-md overflow-hidden flex flex-col justify-end transition-all duration-1000 ease-out bg-black/5 hover:ring-2 hover:ring-primary/20"
                                style={{ height: d.total === 0 ? '4px' : totalHeight }}
                              >
                                {d.total > 0 && (
                                  <>
                                    <div
                                      className="w-full bg-primary hover:brightness-110 transition-all"
                                      style={{ height: `${receivedPct}%` }}
                                    />
                                    <div
                                      className="w-full bg-primary/40 hover:brightness-110 transition-all"
                                      style={{ height: `${sentPct}%` }}
                                    />
                                  </>
                                )}
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                              {d.label}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="bg-popover text-popover-foreground border-border shadow-lg font-sans z-50"
                        >
                          <div className="flex flex-col gap-1.5 text-xs min-w-[120px] p-1">
                            <div className="font-bold text-sm mb-1 text-primary">{d.label}</div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
                                <div className="w-2.5 h-2.5 rounded-sm bg-primary"></div> Recebidas
                              </span>
                              <span className="font-semibold text-primary">{d.received}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
                                <div className="w-2.5 h-2.5 rounded-sm bg-primary/40"></div>{' '}
                                Enviadas
                              </span>
                              <span className="font-semibold text-primary">{d.sent}</span>
                            </div>
                            <div className="border-t border-border mt-1 pt-1.5 flex items-center justify-between gap-4 font-bold text-primary">
                              <span>Total</span>
                              <span>{d.total}</span>
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )
                  })}
                </div>
                <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-border/30">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                    <span className="text-xs font-medium text-muted-foreground font-sans">
                      Recebidas
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary/40"></div>
                    <span className="text-xs font-medium text-muted-foreground font-sans">
                      Enviadas
                    </span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Section 4: Urgent Tasks & Shortcuts */}
        <div className="flex flex-col gap-8">
          <Card className="border-border/40 bg-white/50 backdrop-blur-md shadow-sm rounded-2xl flex flex-col">
            <CardHeader className="pb-3 px-5 pt-5">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <ListTodo className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="font-serif text-lg font-bold text-primary">
                  Minhas tarefas urgentes
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-5 pb-5 flex flex-col gap-3">
              {myUrgentTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                  <CheckCircle2 className="w-8 h-8 mb-2 opacity-20" />
                  <span className="text-sm font-medium">Sem tarefas pendentes</span>
                </div>
              ) : (
                myUrgentTasks.slice(0, 5).map((task) => {
                  const meta = getPriorityMeta(task.priority)
                  const due = task.due_date ? new Date(task.due_date) : null
                  let isOverdue = false
                  if (due) {
                    const d = new Date()
                    d.setHours(0, 0, 0, 0)
                    isOverdue = due < d
                  }

                  return (
                    <div
                      key={task.id}
                      className="p-3 bg-white border border-border/40 rounded-xl cursor-pointer hover:shadow-sm transition-all group"
                      onClick={() => {
                        setSelectedTask(task)
                        setTaskDialogOpen(true)
                      }}
                    >
                      <h4 className="font-semibold text-sm text-primary truncate group-hover:text-primary/80 mb-2">
                        {task.title}
                      </h4>
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] px-1.5 py-0 h-4 border uppercase tracking-wider',
                            meta.color,
                          )}
                        >
                          {meta.label}
                        </Badge>
                        {due && (
                          <span
                            className={cn(
                              'text-[11px] font-semibold',
                              isOverdue ? 'text-rose-600' : 'text-muted-foreground',
                            )}
                          >
                            {isOverdue
                              ? '⚠ Vencida'
                              : `Vence ${due.toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                })}`}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
              {myUrgentTasks.length > 5 && (
                <Button
                  variant="ghost"
                  className="w-full text-sm text-primary mt-1"
                  onClick={() => navigate('/tarefas')}
                >
                  Ver todas ({myUrgentTasks.length})
                </Button>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4">
            <h3 className="font-serif text-xl font-bold text-primary mb-1">Acesso Rápido</h3>
            {shortcuts.map((s, i) => (
              <Card
                key={i}
                onClick={() => navigate(s.link)}
                className="cursor-pointer group hover:bg-black/5 hover:scale-[1.01] transition-all duration-200 border-border/40 shadow-sm rounded-xl"
              >
                <CardContent className="p-4 flex items-center justify-between min-h-[44px]">
                  <div className="flex items-center gap-4">
                    <div className={cn('p-2.5 rounded-xl', s.bg)}>
                      <s.icon className={cn('w-5 h-5', s.color)} />
                    </div>
                    <div>
                      <h4 className="font-serif font-semibold text-primary">{s.title}</h4>
                      <p className="text-xs text-muted-foreground font-sans mt-0.5">
                        {s.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <TaskViewDialog
        task={selectedTask}
        open={taskDialogOpen}
        onOpenChange={(open) => {
          setTaskDialogOpen(open)
          if (!open) setSelectedTask(null)
        }}
      />
    </div>
  )
}
