import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { SopMeeting, SopExecutivePlan } from '@/types/sop'
import { formatCiafalMetric } from '@/services/forecast_engine'
import {
  Calendar,
  Sparkles,
  FileText,
  Users,
  CheckCircle2,
  Clock,
  Video,
  ListTodo,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface SopMeetingViewProps {
  meeting: SopMeeting
  plan: SopExecutivePlan
  userRole?: string
}

export function SopMeetingView({ meeting, plan, userRole }: SopMeetingViewProps) {
  const [ataModalOpen, setAtaModalOpen] = useState(false)
  const [briefingModalOpen, setBriefingModalOpen] = useState(false)

  const handleIntegrateAgendaHub = () => {
    toast.success('Reunião S&OP sincronizada com a Agenda Corporativa do HUB CIAFAL!')
  }

  return (
    <div className="space-y-6">
      {/* 1. CABEÇALHO DA REUNIÃO */}
      <Card className="rounded-3xl border border-primary/20 bg-primary/5 shadow-xs overflow-hidden">
        <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              <h2 className="font-serif text-lg font-bold text-primary">{meeting.title}</h2>
              <Badge className="bg-emerald-100 text-emerald-800 border-none text-[10px] font-bold">
                {meeting.status}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-600">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                {new Date(meeting.meetingDate).toLocaleString('pt-BR', {
                  dateStyle: 'full',
                  timeStyle: 'short',
                })}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-medium text-slate-800">
                <Video className="w-3.5 h-3.5 text-primary" /> Formato: {meeting.locationType}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleIntegrateAgendaHub}
              className="h-8 text-xs bg-white text-slate-700"
            >
              <Calendar className="w-3.5 h-3.5 mr-1 text-primary" /> Sincronizar HUB
            </Button>
            <Button
              size="sm"
              onClick={() => setBriefingModalOpen(true)}
              className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" /> Briefing Executivo IA
            </Button>
            <Button
              size="sm"
              onClick={() => setAtaModalOpen(true)}
              className="h-8 text-xs bg-primary text-white font-bold gap-1"
            >
              <FileText className="w-3.5 h-3.5" /> Ver ATA Oficial
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 2. PAINEL DE TÓPICOS DA PAUTA & PARTICIPANTES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* PAUTA OFICIAL */}
        <Card className="rounded-3xl border border-border/60 bg-white shadow-xs md:col-span-2">
          <CardHeader className="p-4 border-b bg-slate-50/50">
            <CardTitle className="font-serif text-sm font-bold text-slate-900 flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-primary" />
              Pauta da Reunião de S&OP (Governança Mensal)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            {meeting.agendaTopics.map((topic, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-slate-50/80 border border-border/40 text-xs text-slate-800 flex items-center justify-between"
              >
                <span>{topic}</span>
                <Badge variant="outline" className="text-[9px] bg-white text-slate-600">
                  Pauta {idx + 1}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* COMITÊ PARTICIPANTE */}
        <Card className="rounded-3xl border border-border/60 bg-white shadow-xs">
          <CardHeader className="p-4 border-b bg-slate-50/50">
            <CardTitle className="font-serif text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Comitê Executivo S&OP
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            {meeting.participants.map((p, idx) => (
              <div
                key={idx}
                className="p-2 rounded-xl bg-slate-50 border border-border/40 flex items-center justify-between text-xs"
              >
                <div>
                  <strong className="block text-slate-800 text-[11px]">{p.name}</strong>
                  <span className="text-[10px] text-muted-foreground">{p.role}</span>
                </div>
                <Badge
                  variant="outline"
                  className="text-[9px] font-mono bg-white text-emerald-800 border-emerald-200"
                >
                  {p.area}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* MODAL: BRIEFING EXECUTIVO GERADO POR IA */}
      <Dialog open={briefingModalOpen} onOpenChange={setBriefingModalOpen}>
        <DialogContent className="sm:max-w-xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-bold text-amber-950 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              Briefing Executivo S&OP gerado por IA
            </DialogTitle>
            <DialogDescription className="text-xs">
              Síntese autônoma de variações de demanda, riscos operacionais e decisões recomendadas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
              <strong className="text-amber-950 text-xs block font-bold mb-1">
                Resumo Executivo:
              </strong>
              <p className="text-slate-700 leading-relaxed">{meeting.aiBriefing.summary}</p>
            </div>

            <div className="space-y-1.5">
              <strong className="text-slate-900 text-xs flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary" /> O que mudou desde o último ciclo?
              </strong>
              <ul className="list-disc list-inside space-y-1 text-slate-700 bg-slate-50 p-3 rounded-2xl border">
                {meeting.aiBriefing.whatChanged.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-1.5">
              <strong className="text-rose-900 text-xs flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Riscos Identificados para
                Deliberação:
              </strong>
              <ul className="list-disc list-inside space-y-1 text-rose-950 bg-rose-50/60 p-3 rounded-2xl border border-rose-200">
                {meeting.aiBriefing.keyRisks.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-1.5">
              <strong className="text-emerald-900 text-xs flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-emerald-600" /> Recomendações de Ação do
                Copiloto S&OP:
              </strong>
              <ul className="list-disc list-inside space-y-1 text-emerald-950 bg-emerald-50/60 p-3 rounded-2xl border border-emerald-200">
                {meeting.aiBriefing.recommendedDecisions.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setBriefingModalOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: ATA OFICIAL S&OP */}
      <Dialog open={ataModalOpen} onOpenChange={setAtaModalOpen}>
        <DialogContent className="sm:max-w-xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-bold text-primary flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              ATA Executiva S&OP (Memória Oficial das Decisões)
            </DialogTitle>
            <DialogDescription className="text-xs">
              Registro auditável de deliberações, responsáveis, prazos e baseline consensual.
            </DialogDescription>
          </DialogHeader>

          {meeting.meetingMinutesAta && (
            <div className="space-y-3.5 py-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border space-y-1">
                <div className="flex justify-between text-muted-foreground text-[10px]">
                  <span>Status do Acordo:</span>
                  <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">
                    CONSENSO ATINGIDO
                  </Badge>
                </div>
                <p className="text-slate-800 font-medium">{meeting.meetingMinutesAta.summary}</p>
              </div>

              <div className="space-y-2">
                <strong className="text-slate-900 text-xs block">Decisões Aprovadas:</strong>
                {meeting.meetingMinutesAta.decisions.map((d, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-1"
                  >
                    <div className="flex justify-between font-bold text-emerald-950">
                      <span>{d.topic}</span>
                      <span className="text-[10px] font-mono font-normal">Prazo: {d.deadline}</span>
                    </div>
                    <p className="text-slate-800 text-[11px]">{d.decision}</p>
                    <span className="text-[10px] text-muted-foreground block">
                      Responsável: {d.responsible} • Motivo: {d.rationale}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <strong className="text-slate-900 text-xs block">Plano de Ação Executivo:</strong>
                {meeting.meetingMinutesAta.actionItems.map((a, i) => (
                  <div
                    key={i}
                    className="p-2 rounded-xl bg-white border flex items-center justify-between"
                  >
                    <div>
                      <strong className="block text-slate-800 text-[11px]">{a.task}</strong>
                      <span className="text-[10px] text-muted-foreground">
                        Responsável: {a.owner}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-[9px] font-mono">
                      {a.dueDate}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAtaModalOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
