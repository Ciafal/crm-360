import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'
import type { MaterialAsyncStatus } from '@/services/material_async_service'

interface MaterialProgressiveTrackerProps {
  statuses: Record<string, MaterialAsyncStatus>
  materialCode: string
}

export function MaterialProgressiveTracker({
  statuses,
  materialCode,
}: MaterialProgressiveTrackerProps) {
  const list = Object.values(statuses)
  if (list.length === 0) return null

  const allDone = list.every((s) => s.status === 'SUCCESS' || s.status === 'WARNING')

  return (
    <div className="p-2.5 bg-slate-900 text-slate-100 rounded-xl border border-slate-800 space-y-1.5 text-xs animate-fade-in">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-slate-300 flex items-center gap-1.5 text-[11px]">
          {!allDone ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          )}
          Sincronização em tempo real — {materialCode}
        </span>
        <span className="text-[10px] text-slate-400">
          {list.filter((s) => s.status === 'SUCCESS' || s.status === 'WARNING').length}/
          {list.length} serviços
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 pt-1">
        {list.map((s) => {
          return (
            <div
              key={s.service}
              className={`p-1.5 rounded-lg border text-[10px] flex items-center justify-between gap-1.5 ${
                s.status === 'LOADING'
                  ? 'bg-slate-800/80 border-slate-700 text-slate-300'
                  : s.status === 'SUCCESS'
                    ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300'
                    : s.status === 'WARNING'
                      ? 'bg-amber-950/40 border-amber-800/50 text-amber-300'
                      : 'bg-rose-950/40 border-rose-800/50 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                {s.status === 'LOADING' && (
                  <Loader2 className="w-3 h-3 animate-spin text-amber-400 shrink-0" />
                )}
                {s.status === 'SUCCESS' && (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                )}
                {s.status === 'WARNING' && (
                  <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                )}
                {s.status === 'ERROR' && <XCircle className="w-3 h-3 text-rose-400 shrink-0" />}
                <span className="font-medium truncate">{s.name}</span>
              </div>
              {s.latencyMs !== undefined && (
                <span className="font-mono text-[9px] text-slate-400 shrink-0">
                  {s.latencyMs}ms
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
