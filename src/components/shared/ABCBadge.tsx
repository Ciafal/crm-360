import React from 'react'
import { Badge } from '@/components/ui/badge'
import type { ABCCategory } from '@/types/models'

interface ABCBadgeProps {
  category?: ABCCategory
  classification?: any
  size?: 'sm' | 'md' | 'lg' | string
  type?: 'carteira' | 'potencial' | 'lead' | 'reativacao'
  showLabel?: boolean
  className?: string
}

export function ABCBadge({
  category: propCategory,
  classification,
  size = 'md',
  type = 'carteira',
  showLabel = false,
  className = '',
}: ABCBadgeProps) {
  const category = (propCategory || classification || 'B') as ABCCategory
  // Badges neutros e elegantes (Pantone 2945 C / Steel CRM)
  const getStyle = () => {
    switch (category) {
      case 'A':
        return 'bg-blue-100 text-[#003A70] border-blue-300 font-bold dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
      case 'B':
        return 'bg-amber-50 text-amber-800 border-amber-300 font-semibold dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
      case 'C':
        return 'bg-slate-100 text-slate-700 border-slate-300 font-medium dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300'
    }
  }

  const getLabel = () => {
    switch (type) {
      case 'carteira':
        return `ABC Carteira: Classe ${category}`
      case 'potencial':
        return `ABC Potencial: Classe ${category}`
      case 'lead':
        return `Lead ABC: Prioridade ${category === 'A' ? 'Alta' : category === 'B' ? 'Média' : 'Baixa'}`
      case 'reativacao':
        return `ABC Reativação: ${category === 'A' ? 'Prioritária' : category === 'B' ? 'Potencial' : 'Monitorar'}`
    }
  }

  return (
    <Badge
      variant="outline"
      className={`px-2 py-0.5 text-xs transition-colors shadow-none ${getStyle()} ${className}`}
      title={getLabel()}
    >
      {showLabel ? getLabel() : `ABC: ${category}`}
    </Badge>
  )
}
