import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  Clock,
  Video,
  Phone,
  MessageSquare,
  MapPin,
  CheckCircle2,
  Users,
  ExternalLink,
  Plus,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import type { HubCorporateAppointment } from '@/types/cockpit'

interface MinhaAgendaWidgetProps {
  appointments: HubCorporateAppointment[]
  onOpenNewModal?: () => void
}

export function MinhaAgendaWidget({ appointments, onOpenNewModal }: MinhaAgendaWidgetProps) {
  const navigate = useNavigate()

  const getTypeIcon = (tipo: HubCorporateAppointment['tipo']) => {
    switch (tipo) {
      case 'VISITA_PRESENCIAL':
        return <MapPin className="w-4 h-4 text-amber-600" />
      case 'REUNIAO_TEAMS':
        return <Video className="w-4 h-4 text-blue-600" />
      case 'WHATSAPP_CALL':
        return <MessageSquare className="w-4 h-4 text-emerald-600" />
      case 'LIGACAO':
        return <Phone className="w-4 h-4 text-indigo-600" />
      default:
        return <Calendar className="w-4 h-4 text-slate-600" />
    }
  }

  const getTypeBadge = (tipo: HubCorporateAppointment['tipo']) => {
    switch (tipo) {
      case 'VISITA_PRESENCIAL':
        return 'Visita Presencial'
      case 'REUNIAO_TEAMS':
        return 'Reunião Teams M365'
      case 'WHATSAPP_CALL':
        return 'WhatsApp Call'
      case 'LIGACAO':
        return 'Ligação Comercial'
      case 'FOLLOW_UP':
        return 'Follow-up Cotação'
      default:
        return 'Compromisso'
    }
  }

  return (
    <Card className="bg-white/95 backdrop-blur-md border-border/40 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4">
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-border/40">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-lg text-primary">Minha Agenda de Hoje</h3>
                <Badge className="bg-sky-50 text-sky-800 border-sky-300 text-[10px] font-bold">
                  HUB CIAFAL & M365
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Integração nativa com a Agenda Corporativa do HUB CIAFAL (ID único rastreável)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                toast.info('Abrindo agendamento integrado no HUB CIAFAL...')
                if (onOpenNewModal) onOpenNewModal()
              }}
              className="h-8 text-xs gap-1 rounded-xl"
            >
              <Plus className="w-3.5 h-3.5" /> Novo Compromisso
            </Button>
          </div>
        </div>

        {/* Lista de Compromissos de Hoje */}
        <div className="space-y-3 pt-3">
          {appointments.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground italic text-xs">
              Nenhum compromisso corporativo agendado para hoje.
            </div>
          ) : (
            appointments.map((app) => (
              <div
                key={app.id}
                className="p-3.5 bg-slate-50/80 hover:bg-slate-100/80 rounded-2xl border border-border/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-xs text-slate-900 bg-white px-2 py-0.5 rounded-md border border-border/40">
                      {app.horarioFormatado}
                    </span>
                    <Badge className="bg-primary/10 text-primary text-[10px] font-bold border-none flex items-center gap-1">
                      {getTypeIcon(app.tipo)}
                      <span>{getTypeBadge(app.tipo)}</span>
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-mono">{app.hubId}</span>
                  </div>

                  <div>
                    <strong
                      onClick={() => navigate(`/crm/${app.clienteId}`)}
                      className="text-xs text-slate-900 hover:text-primary cursor-pointer block"
                    >
                      {app.clienteNome}
                    </strong>
                    <p className="text-[11px] text-slate-600 font-medium">{app.pauta}</p>
                  </div>

                  {/* Participantes & AD Status */}
                  <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground pt-0.5">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-400" />
                      {app.participantes.map((p) => p.nome.split(' ')[0]).join(', ')}
                    </span>
                    {app.participantes.some((p) => p.adStatus === 'PRESENCIAL') && (
                      <Badge
                        variant="outline"
                        className="text-[9px] bg-emerald-50 text-emerald-800 border-emerald-300"
                      >
                        Presencial
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/crm/${app.clienteId}`)}
                    className="h-8 text-xs text-primary border-primary/30 hover:bg-primary/5 rounded-xl"
                  >
                    Abrir 360º
                  </Button>
                  <Button
                    size="sm"
                    onClick={() =>
                      toast.success(`Compromisso ${app.hubId} marcado como realizado.`)
                    }
                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Concluir
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  )
}
