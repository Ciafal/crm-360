import React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type DataSourceType = 'qlik' | 'sap' | 'crm' | 'meta' | 'voip' | 'ai' | string

interface DataSourceBadgeProps {
  source: DataSourceType
  size?: 'sm' | 'md' | 'lg' | string
  className?: string
}

export function DataSourceBadge({ source, className }: DataSourceBadgeProps) {
  const sourceLower = (source || '').toLowerCase()

  const config: Record<string, { label: string; class: string }> = {
    qlik: { label: 'Qlik — MOCK', class: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
    sap: { label: 'SAP — MOCK', class: 'bg-blue-50 text-blue-800 border-blue-300' },
    crm: { label: 'CRM Comercial', class: 'bg-indigo-50 text-indigo-800 border-indigo-300' },
    meta: { label: 'Meta — MOCK', class: 'bg-green-50 text-green-800 border-green-300' },
    voip: { label: 'VoIP — MOCK', class: 'bg-purple-50 text-purple-800 border-purple-300' },
    ai: {
      label: 'CIAFAL AI Agent',
      class: 'bg-amber-50 text-amber-800 border-amber-300 font-bold',
    },
    ai_generated: {
      label: 'CIAFAL AI Agent',
      class: 'bg-amber-50 text-amber-800 border-amber-300 font-bold',
    },
    reactivation_ai: {
      label: 'ReactivationAgent',
      class: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
    },
    ms365: {
      label: 'Microsoft Graph — MOCK',
      class: 'bg-sky-50 text-sky-800 border-sky-300 font-bold',
    },
    email: {
      label: 'Microsoft Graph — MOCK',
      class: 'bg-sky-50 text-sky-800 border-sky-300 font-bold',
    },
    microsoft_graph: {
      label: 'Microsoft Graph — MOCK',
      class: 'bg-sky-50 text-sky-800 border-sky-300 font-bold',
    },
  }

  const item = config[sourceLower] || {
    label: source.toUpperCase(),
    class: 'bg-slate-100 text-slate-700 border-slate-300',
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        'text-[9px] uppercase tracking-wider py-0 px-1.5 font-bold font-sans',
        item.class,
        className,
      )}
    >
      {item.label}
    </Badge>
  )
}
