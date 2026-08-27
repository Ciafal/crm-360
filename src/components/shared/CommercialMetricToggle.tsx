import React from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useAppStore } from '@/stores/useAppStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Weight, DollarSign } from 'lucide-react'

interface MetricToggleProps {
  className?: string
  showBadge?: boolean
}

export function CommercialMetricToggle({ className = '', showBadge = true }: MetricToggleProps) {
  const { user } = useAuth()
  const currentRole = user?.role || ''
  const { commercialMetric, setCommercialMetric } = useAppStore()

  const isSeller = currentRole === 'vendedor' || currentRole === 'representante'
  const isSupervisorOrAbove =
    currentRole === 'supervisor' ||
    currentRole === 'gerente' ||
    currentRole === 'diretor' ||
    currentRole === 'admin'

  // Para vendedor/representante, toneladas é a métrica padrão com badge discreto
  if (isSeller) {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <Badge
          variant="outline"
          className="bg-sky-50 text-sky-800 border-sky-300 font-medium text-xs px-2.5 py-1 flex items-center gap-1.5"
        >
          <Weight className="h-3.5 w-3.5 text-sky-600" />
          <span>Métrica: Toneladas (t)</span>
        </Badge>
        {showBadge && (
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            (R$ disponível como secundário)
          </span>
        )}
      </div>
    )
  }

  // Para Supervisor, Gerente, Diretoria e Admin: Toggle ativo TONELADAS / R$
  return (
    <div
      className={`inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 ${className}`}
    >
      <Button
        type="button"
        size="sm"
        variant={commercialMetric === 'TONS' ? 'default' : 'ghost'}
        className={`h-7 px-2.5 text-xs font-semibold rounded-md transition-all gap-1.5 ${
          commercialMetric === 'TONS'
            ? 'bg-[#003A70] text-white shadow-sm hover:bg-[#002850]'
            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
        }`}
        onClick={() => setCommercialMetric('TONS')}
      >
        <Weight className="h-3.5 w-3.5" />
        <span>TONELADAS (t)</span>
      </Button>

      <Button
        type="button"
        size="sm"
        variant={commercialMetric === 'REVENUE' ? 'default' : 'ghost'}
        className={`h-7 px-2.5 text-xs font-semibold rounded-md transition-all gap-1.5 ${
          commercialMetric === 'REVENUE'
            ? 'bg-[#003A70] text-white shadow-sm hover:bg-[#002850]'
            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
        }`}
        onClick={() => setCommercialMetric('REVENUE')}
      >
        <DollarSign className="h-3.5 w-3.5" />
        <span>VALOR (R$)</span>
      </Button>
    </div>
  )
}
