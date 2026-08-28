import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  CalendarCheck,
  Phone,
  FileText,
  RotateCcw,
  Package,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Send,
  Truck,
} from 'lucide-react'
import { cn, formatWeight } from '@/lib/utils'

export type DailyPriorityType =
  | 'CLIENTE_PRIORITARIO'
  | 'FOLLOW_UP_COTACAO'
  | 'REATIVACAO'
  | 'CROSS_SELL'
  | 'CHECAGEM_ESTOQUE'

export interface SellerDailyPriorityItem {
  id: string
  type: DailyPriorityType
  title: string
  clientName: string
  contactName?: string
  phone?: string
  impactTons?: number
  deadlineTime: string
  description: string
  completed: boolean
  whyAiSelected: string
}

export interface SellerDailyCockpitHeaderProps {
  items?: SellerDailyPriorityItem[]
  onToggleComplete?: (id: string) => void
  onActionClick?: (item: SellerDailyPriorityItem) => void
  className?: string
}

export const MOCK_DAILY_PRIORITIES: SellerDailyPriorityItem[] = [
  {
    id: 'day-01',
    type: 'FOLLOW_UP_COTACAO',
    title: 'Follow-up Cotação COT-2024-089 (85 t Perfis W)',
    clientName: 'Estruturas Metálicas Triângulo',
    contactName: 'Engº Rodrigo Silveira',
    phone: '(31) 98765-4321',
    impactTons: 85,
    deadlineTime: '10:30',
    completed: false,
    description: 'Apresentar opção de entrega fracionada sem frete adicional para fechar hoje.',
    whyAiSelected:
      'Cotação de alto valor com probabilidade 85% e prazo de resposta no limite do SLA.',
  },
  {
    id: 'day-02',
    type: 'CLIENTE_PRIORITARIO',
    title: 'Contato Curva A — Atraso de Recompra (60 t)',
    clientName: 'Metais Betim Indústria',
    contactName: 'Sr. Marcos Aurélio (Compras)',
    phone: '(31) 99123-8877',
    impactTons: 60,
    deadlineTime: '11:45',
    completed: false,
    description: 'Verificar consumo de Chapas A36 e programar carregamento para quinta-feira.',
    whyAiSelected:
      'Cliente sem compras há 42 dias (costuma comprar a cada 28 dias). Risco de perda.',
  },
  {
    id: 'day-03',
    type: 'CHECAGEM_ESTOQUE',
    title: 'Checagem de Estoque / PCP Tubos Sch40 (40 t)',
    clientName: 'Minas Estruturas Holding',
    contactName: 'PCP Betim / Logística',
    impactTons: 40,
    deadlineTime: '14:00',
    completed: false,
    description: 'Confirmar saldo liberado no WMS ou previsão de laminação para o dia 28/10.',
    whyAiSelected:
      'Estoque físico em 3,5 t. Necessário confirmar lote programado no PCP robotizado.',
  },
  {
    id: 'day-04',
    type: 'CROSS_SELL',
    title: 'Oferta de Cantoneiras para Caldeiraria Vale (45 t)',
    clientName: 'Caldeiraria & Usinagem Vale',
    contactName: 'Dra. Fernanda Prado',
    phone: '(31) 99344-2211',
    impactTons: 45,
    deadlineTime: '15:30',
    completed: false,
    description:
      'Oferecer Cantoneiras de abas iguais em complemento ao pedido de chapas em aberto.',
    whyAiSelected: 'Padrão histórico de compra conjunta identificado pela inteligência de mercado.',
  },
  {
    id: 'day-05',
    type: 'REATIVACAO',
    title: 'Campanha Reativação Serralheria Progresso (35 t)',
    clientName: 'Serralheria Progresso Ltda',
    contactName: 'Sr. José Carlos',
    phone: '(34) 98877-1122',
    impactTons: 35,
    deadlineTime: '16:30',
    completed: false,
    description: 'Apresentar condições especiais de reabertura de crédito e entrega gratuita.',
    whyAiSelected: 'Conta inativa há 110 dias com crédito recém-revalidado no SAP.',
  },
]

export function SellerDailyCockpitHeader({
  items = MOCK_DAILY_PRIORITIES,
  onToggleComplete,
  onActionClick,
  className,
}: SellerDailyCockpitHeaderProps) {
  const [taskList, setTaskList] = useState<SellerDailyPriorityItem[]>(items)

  const handleToggle = (id: string) => {
    setTaskList((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)))
    if (onToggleComplete) onToggleComplete(id)
  }

  const completedCount = taskList.filter((t) => t.completed).length
  const totalImpactTons = taskList.reduce((acc, t) => acc + (t.impactTons || 0), 0)

  return (
    <Card
      className={cn(
        'p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4',
        className,
      )}
    >
      {/* HEADER: O QUE FAZER HOJE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-base text-primary">
                O Que Fazer Hoje — Cockpit Matinal do Vendedor
              </h3>
              <Badge className="bg-primary/10 text-primary text-[10px] font-mono">
                {completedCount} de {taskList.length} concluídas
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Rotina guiada de prioridades: clientes críticos, follow-ups de cotação, reativações e
              estoque
            </p>
          </div>
        </div>

        <Badge
          variant="outline"
          className="text-xs font-bold text-emerald-800 bg-emerald-50 border-emerald-300"
        >
          Potencial Mapeado Hoje: +{formatWeight(totalImpactTons, 0)}
        </Badge>
      </div>

      {/* LISTA DAS 5 PRIORIDADES DO DIA */}
      <div className="space-y-2">
        {taskList.map((task) => {
          return (
            <div
              key={task.id}
              className={cn(
                'p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3',
                task.completed
                  ? 'bg-slate-50 border-slate-200 opacity-60'
                  : 'bg-white border-slate-200/90 hover:border-primary/40 shadow-xs',
              )}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={task.completed}
                  onCheckedChange={() => handleToggle(task.id)}
                  className="mt-1 h-4 w-4 rounded text-primary focus:ring-primary"
                />

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className="text-[9px] font-bold bg-slate-100 text-slate-800 border-none"
                    >
                      {task.deadlineTime}
                    </Badge>
                    <strong
                      className={cn(
                        'text-xs',
                        task.completed ? 'line-through text-slate-500' : 'text-slate-900',
                      )}
                    >
                      {task.title}
                    </strong>
                    {task.contactName && (
                      <span className="text-[10px] text-muted-foreground">
                        • {task.contactName}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {task.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                {task.impactTons && (
                  <span className="font-mono text-xs font-bold text-primary bg-primary/5 px-2 py-1 rounded-lg border border-primary/20">
                    +{formatWeight(task.impactTons, 0)}
                  </span>
                )}

                <Button
                  size="sm"
                  variant={task.completed ? 'outline' : 'default'}
                  onClick={() => onActionClick?.(task)}
                  className={cn(
                    'h-7 text-xs font-semibold gap-1 rounded-xl',
                    task.completed
                      ? 'text-slate-600'
                      : 'bg-primary hover:bg-primary/90 text-white shadow-xs',
                  )}
                >
                  {task.type === 'FOLLOW_UP_COTACAO' && <FileText className="w-3 h-3" />}
                  {task.type === 'CLIENTE_PRIORITARIO' && <Phone className="w-3 h-3" />}
                  {task.type === 'CHECAGEM_ESTOQUE' && <Package className="w-3 h-3" />}
                  {task.type === 'CROSS_SELL' && <Sparkles className="w-3 h-3" />}
                  {task.type === 'REATIVACAO' && <RotateCcw className="w-3 h-3" />}
                  <span>Executar</span>
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
