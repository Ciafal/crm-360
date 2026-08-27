import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Flame,
  ShieldAlert,
  Clock3,
  PauseCircle,
  TrendingUp,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface StrategicSummarySectionProps {
  onFilterCategory?: (category: string) => void
}

export function StrategicSummarySection({ onFilterCategory }: StrategicSummarySectionProps) {
  const navigate = useNavigate()

  const groups = [
    {
      id: 'g1',
      title: 'Grupo 1 — Atacar agora (Pronta-entrega)',
      count: 6,
      potential: 'R$ 290.000',
      tons: '38,4 t',
      description: 'Alta oportunidade de fechamento imediato + alta cobertura de estoque CIAFAL.',
      badgeText: 'Prioridade Máxima',
      badgeClass: 'bg-emerald-500/15 text-emerald-700 border-emerald-300',
      icon: Flame,
      iconClass: 'text-emerald-600 bg-emerald-50',
      actionText: 'Ver 6 clientes',
      filterKey: 'atacar_agora',
    },
    {
      id: 'g2',
      title: 'Grupo 2 — Atacar após resolver impedimento',
      count: 3,
      potential: 'R$ 145.000',
      tons: '19,2 t',
      description:
        'Boa oportunidade histórica, porém travada por crédito, divergência cadastral ou limite.',
      badgeText: 'Ação Financeira/Crédito',
      badgeClass: 'bg-rose-500/15 text-rose-700 border-rose-300',
      icon: ShieldAlert,
      iconClass: 'text-rose-600 bg-rose-50',
      actionText: 'Destravar 3 contas',
      filterKey: 'resolver_impedimento',
    },
    {
      id: 'g3',
      title: 'Grupo 3 — Preparar contato / Monitorar',
      count: 5,
      potential: 'R$ 180.000',
      tons: '24,0 t',
      description:
        'Potencial relevante confirmado, mas momento atual ainda fora da melhor janela de recompra.',
      badgeText: 'Planejamento Q4',
      badgeClass: 'bg-amber-500/15 text-amber-700 border-amber-300',
      icon: Clock3,
      iconClass: 'text-amber-600 bg-amber-50',
      actionText: 'Agendar abordagens',
      filterKey: 'recuperar',
    },
    {
      id: 'g4',
      title: 'Grupo 4 — Não priorizar agora',
      count: 4,
      potential: 'R$ 85.000',
      tons: '11,0 t',
      description:
        'Baixa probabilidade de retorno no curto prazo, fora do perfil de margem ou risco operacional.',
      badgeText: 'Monitoramento Passivo',
      badgeClass: 'bg-slate-500/15 text-slate-700 border-slate-300',
      icon: PauseCircle,
      iconClass: 'text-slate-600 bg-slate-50',
      actionText: 'Ver clientes em espera',
      filterKey: 'nao_priorizar',
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-border/40 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="font-serif text-2xl font-bold text-primary">
              Resumo Estratégico da Carteira
            </h2>
          </div>
          <p className="text-sm text-muted-foreground font-sans mt-0.5">
            Matriz de segmentação inteligente: foco nas contas de alto retorno com disponibilidade
            de produto.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/gestao-inativos')}
          className="text-xs text-primary font-semibold hover:bg-primary/5 rounded-full"
        >
          Gestão Completa de Inativos
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {groups.map((grp) => {
          const Icon = grp.icon
          return (
            <Card
              key={grp.id}
              className="bg-white/70 backdrop-blur-md border-border/40 shadow-sm hover:shadow-md transition-all duration-200 rounded-2xl flex flex-col justify-between"
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-xl ${grp.iconClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${grp.badgeClass}`}>
                    {grp.badgeText}
                  </Badge>
                </div>
                <CardTitle className="font-serif text-base font-bold text-primary leading-tight">
                  {grp.title}
                </CardTitle>
                <div className="mt-2 flex items-baseline justify-between border-y border-border/30 py-2">
                  <div>
                    <span className="text-2xl font-bold font-serif text-primary">{grp.count}</span>
                    <span className="text-xs text-muted-foreground ml-1">contas</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-sm text-primary block">{grp.potential}</span>
                    <span className="text-[10px] text-muted-foreground block">{grp.tons}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-1 flex flex-col gap-3">
                <p className="text-xs text-muted-foreground leading-relaxed min-h-[38px]">
                  {grp.description}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (onFilterCategory) onFilterCategory(grp.filterKey)
                  }}
                  className="w-full text-xs text-primary hover:bg-primary/10 rounded-xl justify-between px-2"
                >
                  <span>{grp.actionText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
