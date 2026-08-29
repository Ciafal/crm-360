import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Bot, ArrowRight, ShieldCheck } from 'lucide-react'

interface ExecutiveAIBriefingBlockProps {
  briefingText: string
  unit: 'REVENUE' | 'TONS'
}

export function ExecutiveAIBriefingBlock({ briefingText, unit }: ExecutiveAIBriefingBlockProps) {
  return (
    <Card className="bg-gradient-to-r from-slate-900 via-primary/90 to-slate-900 text-white rounded-3xl p-5 shadow-lg border border-primary/40">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shrink-0">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-serif font-bold text-base text-white">
                Briefing Executivo da Carteira · Assistente IA 360º
              </span>
              <Badge className="bg-amber-400 text-slate-950 text-[10px] font-bold border-none">
                Direcionamento do Dia
              </Badge>
              <Badge variant="outline" className="text-[10px] text-slate-300 border-white/20">
                Visualização → Exceção → Decisão → Ação
              </Badge>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed font-normal">{briefingText}</p>
          </div>
        </div>
      </div>
    </Card>
  )
}
