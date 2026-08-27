import { useState, useMemo } from 'react'
import { useTasks } from '@/hooks/use-tasks'
import { TASK_STATUSES, TASK_PRIORITIES, getPriorityMeta } from '@/lib/task-meta'
import { Task } from '@/types/models'
import pb from '@/lib/pocketbase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { updateTask, deleteTask } from '@/services/tasks'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Search,
  MessageCircle,
  CalendarIcon,
  Paperclip,
  MoreVertical,
  Trash2,
  CheckCircle,
} from 'lucide-react'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { TaskViewDialog } from '@/components/TaskViewDialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PageLoadingState, PageEmptyState } from '@/components/shared/StateFeedback'

export default function Tarefas() {
  const { tasks, loading } = useTasks()
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('todas')
  const [sourceFilter, setSourceFilter] = useState('todas')
  const [sortBy, setSortBy] = useState<'impacto' | 'urgencia' | 'vencimento' | 'padrao'>('impacto')
  const [filterMine, setFilterMine] = useState(false)
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)

  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const filteredTasks = useMemo(() => {
    const list = tasks.filter((t) => {
      const matchSearch =
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        (t.description || '').toLowerCase().includes(search.toLowerCase()) ||
        (t.customer_name || '').toLowerCase().includes(search.toLowerCase())
      const matchPriority = priorityFilter === 'todas' || t.priority === priorityFilter
      const matchSource =
        sourceFilter === 'todas' ||
        (t.source_type && t.source_type.toLowerCase() === sourceFilter.toLowerCase())
      const matchMine = !filterMine || t.assigned_to === pb.authStore.record?.id
      return matchSearch && matchPriority && matchSource && matchMine
    })

    // Ordenação por Impacto na Meta, Urgência ou Vencimento
    return list.sort((a, b) => {
      if (sortBy === 'impacto') {
        const impA = a.impact_meta_tons || 0
        const impB = b.impact_meta_tons || 0
        if (impB !== impA) return impB - impA
      }
      if (sortBy === 'urgencia') {
        const priorityScore: Record<string, number> = { urgente: 4, alta: 3, media: 2, baixa: 1 }
        const scoreA = priorityScore[a.priority] || 0
        const scoreB = priorityScore[b.priority] || 0
        if (scoreB !== scoreA) return scoreB - scoreA
      }
      if (sortBy === 'vencimento') {
        if (!a.due_date) return 1
        if (!b.due_date) return -1
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      }
      return 0
    })
  }, [tasks, search, priorityFilter, sourceFilter, sortBy, filterMine])

  const kpis = useMemo(() => {
    const total = tasks.length
    const byStatus = TASK_STATUSES.reduce(
      (acc, status) => {
        acc[status.id] = tasks.filter((t) => t.status === status.id).length
        return acc
      },
      {} as Record<string, number>,
    )
    return { total, byStatus }
  }, [tasks])

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('taskId', id)
    setDraggedTaskId(id)
  }

  const handleDragOver = (e: React.DragEvent, statusId: string) => {
    e.preventDefault()
    setDragOverColumn(statusId)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = async (e: React.DragEvent, statusId: string) => {
    e.preventDefault()
    setDragOverColumn(null)
    setDraggedTaskId(null)
    const taskId = e.dataTransfer.getData('taskId')
    if (!taskId) return

    const task = tasks.find((t) => t.id === taskId)
    if (!task || task.status === statusId) return

    const updates: Partial<Task> = { status: statusId as any }
    if (statusId === 'concluida') {
      updates.completed_at = new Date().toISOString()
    }

    try {
      await updateTask(taskId, updates)
    } catch (err) {
      console.error('Failed to update task status', err)
    }
  }

  return (
    <div className="flex flex-col gap-6 h-full max-h-[calc(100vh-6rem)] overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-3xl font-bold text-primary">
              Central de Tarefas Comerciais
            </h1>
            <Badge
              variant="outline"
              className="text-[10px] bg-primary/10 text-primary border-primary/30 font-bold"
            >
              Consolidação Multissistema
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            Acompanhamento integrado de Follow-ups, Cotações, Reclamações de Qualidade, Ocorrências
            TMS, WMS, Visitas e Alertas de IA.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 shrink-0">
        <Card className="p-4 flex flex-col items-start justify-center bg-primary/5 border-primary/20">
          <span className="text-sm font-medium text-muted-foreground mb-1">Total</span>
          <span className="text-2xl font-bold">{loading ? '-' : kpis.total}</span>
        </Card>
        {TASK_STATUSES.map((s) => (
          <Card key={s.id} className="p-4 flex flex-col items-start justify-center">
            <span className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
              <span className={cn('w-2 h-2 rounded-full', s.dot)} />
              {s.label}
            </span>
            <span className="text-2xl font-bold">{loading ? '-' : kpis.byStatus[s.id]}</span>
          </Card>
        ))}
      </div>

      {/* Filters & Sorting */}
      <div className="flex flex-col md:flex-row gap-3 shrink-0 items-stretch md:items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border">
            <Button
              variant={!filterMine ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setFilterMine(false)}
              className={cn(
                'h-8 px-3 text-xs rounded-md',
                !filterMine && 'bg-background shadow-sm font-semibold',
              )}
            >
              Todas
            </Button>
            <Button
              variant={filterMine ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setFilterMine(true)}
              className={cn(
                'h-8 px-3 text-xs rounded-md',
                filterMine && 'bg-background shadow-sm font-semibold',
              )}
            >
              Minhas
            </Button>
          </div>

          <div className="relative min-w-[200px] flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar tarefa, cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 bg-background h-8 text-xs"
            />
          </div>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[140px] bg-background h-8 text-xs">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas prioridades</SelectItem>
              {TASK_PRIORITIES.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[140px] bg-background h-8 text-xs">
              <SelectValue placeholder="Origem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas origens</SelectItem>
              <SelectItem value="CRM">CRM</SelectItem>
              <SelectItem value="Cotação">Cotação / Proposta</SelectItem>
              <SelectItem value="Reclamação">Reclamação (Qualidade)</SelectItem>
              <SelectItem value="TMS">TMS (Logística)</SelectItem>
              <SelectItem value="WMS">WMS (Estoque)</SelectItem>
              <SelectItem value="Visita">Visita Comercial</SelectItem>
              <SelectItem value="IA">IA & Recomendações</SelectItem>
              <SelectItem value="Relacionamento">Relacionamento</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Seletor de Ordenação Inteligente */}
        <div className="flex items-center gap-1.5 self-end md:self-auto text-xs">
          <span className="text-[11px] text-muted-foreground font-semibold">Ordenar por:</span>
          <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
            <SelectTrigger className="w-[160px] bg-background h-8 text-xs font-semibold text-primary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="impacto">🎯 Impacto na Meta (t)</SelectItem>
              <SelectItem value="urgencia">⚡ Urgência / Prioridade</SelectItem>
              <SelectItem value="vencimento">📅 Data de Vencimento</SelectItem>
              <SelectItem value="padrao">Padrão</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* StateFeedback se Loading */}
      {loading && (
        <div className="py-4">
          <PageLoadingState message="Carregando informações..." />
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <div className="flex gap-6 min-w-max h-full items-start">
          {TASK_STATUSES.map((status) => {
            const columnTasks = filteredTasks.filter((t) => t.status === status.id)
            const isDragOver = dragOverColumn === status.id

            return (
              <div
                key={status.id}
                className={cn(
                  'w-80 shrink-0 flex flex-col rounded-xl bg-muted/30 border h-full transition-all duration-200',
                  isDragOver ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-transparent',
                )}
                onDragOver={(e) => handleDragOver(e, status.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, status.id)}
              >
                <div className="p-3 font-semibold flex items-center justify-between border-b bg-white/50 backdrop-blur-sm rounded-t-xl shrink-0">
                  <div className="flex items-center gap-2">
                    <span className={cn('w-2 h-2 rounded-full', status.dot)} />
                    {status.label}
                  </div>
                  <Badge variant="secondary" className="px-1.5 py-0.5 text-xs bg-background">
                    {columnTasks.length}
                  </Badge>
                </div>

                <div className="p-3 flex flex-col gap-3 overflow-y-auto flex-1">
                  {columnTasks.length === 0 ? (
                    <div className="h-28 border-2 border-dashed rounded-xl flex items-center justify-center text-muted-foreground text-sm flex-col gap-2 opacity-50">
                      <status.icon className="w-5 h-5" />
                      Nenhuma tarefa
                    </div>
                  ) : (
                    columnTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        isDragging={draggedTaskId === task.id}
                        onDragStart={handleDragStart}
                        onClick={() => {
                          setSelectedTask(task)
                          setDialogOpen(true)
                        }}
                        onDelete={async () => {
                          await deleteTask(task.id)
                        }}
                        onComplete={async () => {
                          await updateTask(task.id, {
                            status: 'concluida',
                            completed_at: new Date().toISOString(),
                          })
                        }}
                      />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <TaskViewDialog open={dialogOpen} onOpenChange={setDialogOpen} task={selectedTask} />
    </div>
  )
}

function TaskCard({
  task,
  isDragging,
  onDragStart,
  onClick,
  onDelete,
  onComplete,
}: {
  task: Task
  isDragging: boolean
  onDragStart: (e: React.DragEvent, id: string) => void
  onClick: () => void
  onDelete: () => void
  onComplete: () => void
}) {
  const priorityMeta = getPriorityMeta(task.priority)
  const navigate = useNavigate()
  const assignedUser = task.expand?.assigned_to

  const linkedCount = task.linked_message_ids
    ? Array.isArray(task.linked_message_ids)
      ? task.linked_message_ids.length
      : 1
    : 0

  return (
    <Card
      className={cn(
        'p-3 cursor-pointer hover:shadow-md transition-all group bg-background border shadow-sm relative active:cursor-grabbing space-y-2',
        isDragging && 'opacity-50 scale-95 shadow-none',
      )}
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge
            variant="outline"
            className={cn(
              'text-[10px] font-medium px-1.5 py-0 border-transparent',
              priorityMeta.color,
            )}
          >
            {priorityMeta.label}
          </Badge>
          {task.source_type && (
            <Badge className="text-[9px] bg-slate-100 text-slate-700 border-slate-300 font-mono">
              Origem: {task.source_type}
            </Badge>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mr-1 opacity-0 group-hover:opacity-100 text-muted-foreground focus:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {task.status !== 'concluida' && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onComplete()
                }}
              >
                <CheckCircle className="w-4 h-4 mr-2 text-emerald-600" /> Concluir
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" /> Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <h4 className="text-sm font-semibold leading-tight">{task.title}</h4>

      {task.customer_name && (
        <div className="text-xs text-primary font-bold">Cliente: {task.customer_name}</div>
      )}

      {task.impact_meta_tons && (
        <div className="text-[11px] text-amber-700 font-medium">
          Impacto na Meta: <strong>{task.impact_meta_tons} toneladas</strong>
        </div>
      )}

      {task.description && (
        <div
          className="text-xs text-muted-foreground line-clamp-2 [&>p]:m-0 [&>*]:m-0"
          dangerouslySetInnerHTML={{ __html: task.description }}
        />
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground mt-3 border-t pt-3">
        <div className="flex items-center gap-3">
          {assignedUser && (
            <Avatar
              className="w-5 h-5 border shadow-sm"
              title={`Responsável: ${assignedUser.name || assignedUser.email}`}
            >
              <AvatarImage
                src={
                  assignedUser.avatar
                    ? pb.files.getUrl(assignedUser, assignedUser.avatar, { thumb: '100x100' })
                    : undefined
                }
              />
              <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                {assignedUser.name?.charAt(0) || assignedUser.email?.charAt(0)}
              </AvatarFallback>
            </Avatar>
          )}
          {task.due_date && (
            <div
              className="flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded-md"
              title="Vencimento"
            >
              <CalendarIcon className="w-3 h-3" />
              {format(new Date(task.due_date), 'dd/MM')}
            </div>
          )}
          {linkedCount > 0 && (
            <div
              className="flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded-md"
              title={`${linkedCount} mensagem(ns) vinculada(s)`}
            >
              <Paperclip className="w-3 h-3" />
              {linkedCount}
            </div>
          )}
        </div>

        {task.conversation_id && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity bg-primary/5 text-primary hover:bg-primary/10"
            onClick={(e) => {
              e.stopPropagation()
              const msgParam =
                task.linked_message_ids &&
                Array.isArray(task.linked_message_ids) &&
                task.linked_message_ids.length > 0
                  ? `&msg=${task.linked_message_ids[0]}`
                  : ''
              navigate(`/conversas?chat=${task.conversation_id}${msgParam}`)
            }}
          >
            <MessageCircle className="w-3 h-3 mr-1" />
            Conversa
          </Button>
        )}
      </div>
    </Card>
  )
}
