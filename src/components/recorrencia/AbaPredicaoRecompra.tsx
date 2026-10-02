// src/components/recorrencia/AbaPredicaoRecompra.tsx
import React from 'react'
import { BrainCircuit, Sparkles, Clock, Calendar, CheckCircle2, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function AbaPredicaoRecompra() {
  return (
    <div className="space-y-6 py-6">
      {/* Banner Oficial Exigido pelo Escopo: Sem números inventados */}
      <Card className="border-sky-300 bg-gradient-to-br from-sky-50 via-white to-blue-50/50 shadow-sm overflow-hidden rounded-3xl">
        <CardContent className="p-8 sm:p-12 text-center max-w-3xl mx-auto space-y-5">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-xs">
            <BrainCircuit className="w-8 h-8 text-[#003A70]" />
          </div>

          <div className="space-y-2">
            <Badge className="bg-sky-100 text-[#003A70] border-sky-300 text-xs px-3 py-1 font-semibold uppercase tracking-wider">
              Fatia 2 — Próxima Entrega
            </Badge>

            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Motor Preditivo de Recompra (BG/NBD + Gamma-Gamma)
            </h3>

            <p className="text-base text-slate-700 font-medium">
              A predição probabilística será ativada após o treinamento do modelo (próxima entrega)
            </p>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Em conformidade estrita com as diretrizes de governança do CRM 360º CIAFAL, não são
            exibidas estimativas estatísticas ou probabilidades artificiais sem a calibração com MLE
            (Maximum Likelihood Estimation) real e validação holdout.
          </p>

          <div className="pt-6 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left text-xs">
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Sinais de Cadência
              </span>
              <p className="text-slate-600 text-[11px]">
                Ativos na Fatia 1: clientes próximos do ciclo de recompra histórico já priorizados
                na Aba 6.
              </p>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-sky-600" />
                P(Alive) & Holdout
              </span>
              <p className="text-slate-600 text-[11px]">
                Treinamento supervisionado com curva ROC, MAE de faturamento e teste em janela cega.
              </p>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                Agente IA Fred
              </span>
              <p className="text-slate-600 text-[11px]">
                Alertas automáticos com deduplicação e explicação de risco integrados ao pipeline.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
