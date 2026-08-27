import React, { useState, useMemo } from 'react'
import { LeadItem, mockLeads } from '@/data/mockCommercialData'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ABCBadge } from '@/components/shared/ABCBadge'
import {
  Search,
  Plus,
  Filter,
  UserCheck,
  MessageSquare,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

interface LeadsViewProps {
  onConvertLead?: (lead: LeadItem) => void
}

export function LeadsView({ onConvertLead }: LeadsViewProps) {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [abcFilter, setAbcFilter] = useState<string>('todos')
  const [stageFilter, setStageFilter] = useState<string>('todos')
  const [segmentFilter, setSegmentFilter] = useState<string>('todos')
  const [selectedLead, setSelectedLead] = useState<LeadItem | null>(null)

  const filteredLeads = useMemo(() => {
    return mockLeads.filter((lead) => {
      const matchSearch =
        lead.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.city.toLowerCase().includes(searchTerm.toLowerCase())

      const matchAbc = abcFilter === 'todos' || lead.leadPriorityABC === abcFilter
      const matchStage = stageFilter === 'todos' || lead.stage === stageFilter
      const matchSegment = segmentFilter === 'todos' || lead.segment === segmentFilter

      return matchSearch && matchAbc && matchStage && matchSegment
    })
  }, [searchTerm, abcFilter, stageFilter, segmentFilter])

  const stageBadgeStyle = (stage: LeadItem['stage']) => {
    switch (stage) {
      case 'Novo':
        return 'bg-blue-100 text-blue-800'
      case 'Qualificando':
        return 'bg-purple-100 text-purple-800'
      case 'Contato':
        return 'bg-cyan-100 text-cyan-800'
      case 'Necessidade':
        return 'bg-amber-100 text-amber-800'
      case 'Convertido':
        return 'bg-emerald-100 text-emerald-800'
      case 'Descartado':
        return 'bg-slate-200 text-slate-700'
    }
  }

  return (
    <div className="space-y-4">
      {/* Banner LeadPriorityABC */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 to-[#003A70] text-white p-4 rounded-3xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-sky-400" />
            <h3 className="font-serif text-lg font-bold">
              Gestão de Leads Comerciais (LeadPriorityABC)
            </h3>
          </div>
          <p className="text-xs text-slate-200 max-w-2xl">
            Classificação independente de prioridade para aquisição: <strong>Classe A</strong> (Alta
            prioridade / Fit CIAFAL &gt; 30t),
            <strong> Classe B</strong> (Média prioridade), <strong>Classe C</strong> (Baixa
            urgência). Leads A impactam o Meu Dia.
          </p>
        </div>

        <Button
          size="sm"
          className="h-9 bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs gap-1.5 rounded-xl self-start sm:self-auto"
          onClick={() => toast.info('Formulário de cadastro de novo lead comercial.')}
        >
          <Plus className="h-3.5 w-3.5" />
          Novo Lead
        </Button>
      </div>

      {/* Barra de Filtros */}
      <Card className="bg-white/80 backdrop-blur-md rounded-2xl border-border/40 p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Buscar por empresa, contato ou cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 text-xs rounded-xl"
            />
          </div>

          <Select value={abcFilter} onValueChange={setAbcFilter}>
            <SelectTrigger className="h-10 text-xs rounded-xl">
              <SelectValue placeholder="Prioridade ABC" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os ABCs</SelectItem>
              <SelectItem value="A">Classe A — Alta Prioridade</SelectItem>
              <SelectItem value="B">Classe B — Média Prioridade</SelectItem>
              <SelectItem value="C">Classe C — Baixa Prioridade</SelectItem>
            </SelectContent>
          </Select>

          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="h-10 text-xs rounded-xl">
              <SelectValue placeholder="Estágio do Lead" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Estágios</SelectItem>
              <SelectItem value="Novo">Novo</SelectItem>
              <SelectItem value="Qualificando">Qualificando</SelectItem>
              <SelectItem value="Contato">Contato</SelectItem>
              <SelectItem value="Necessidade">Necessidade</SelectItem>
              <SelectItem value="Convertido">Convertido</SelectItem>
              <SelectItem value="Descartado">Descartado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={segmentFilter} onValueChange={setSegmentFilter}>
            <SelectTrigger className="h-10 text-xs rounded-xl">
              <SelectValue placeholder="Segmento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos Segmentos</SelectItem>
              <SelectItem value="Construção Civil">Construção Civil</SelectItem>
              <SelectItem value="Indústria">Indústria</SelectItem>
              <SelectItem value="Agronegócio">Agronegócio</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Grid de Leads */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLeads.map((lead) => (
          <Card
            key={lead.id}
            className="bg-white/90 backdrop-blur-md rounded-2xl border-border/40 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-sm text-primary line-clamp-1">
                    {lead.companyName}
                  </h4>
                  <span className="text-[11px] text-muted-foreground block">{lead.leadName}</span>
                </div>
                <ABCBadge category={lead.leadPriorityABC} type="lead" showLabel={false} />
              </div>

              <div className="flex items-center gap-2 flex-wrap text-[11px]">
                <Badge
                  variant="outline"
                  className={`text-[10px] font-semibold border-none ${stageBadgeStyle(lead.stage)}`}
                >
                  {lead.stage}
                </Badge>
                <span className="text-muted-foreground">·</span>
                <span className="text-slate-700 font-medium">{lead.segment}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-slate-600 flex items-center gap-0.5">
                  <MapPin className="h-3 w-3 text-slate-400" /> {lead.city}/{lead.uf}
                </span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-[11px]">Potencial Estimado:</span>
                  <strong className="font-mono text-primary">{lead.potentialTons} t</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-[11px]">Interesse:</span>
                  <span className="text-slate-800 text-[11px] font-medium truncate max-w-[170px]">
                    {lead.productInterest}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-[11px]">Vendedor:</span>
                  <span className="text-slate-700 text-[11px]">{lead.assignedSeller}</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-600 bg-blue-50/50 p-2 rounded-lg border border-blue-100">
                <strong className="text-primary font-semibold">Próxima Ação:</strong>{' '}
                {lead.nextAction}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/30">
              <span className="text-[10px] text-muted-foreground">
                Último contato: {lead.lastContact || 'Pendente'}
              </span>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2.5 text-xs font-semibold gap-1 text-primary hover:bg-primary/5"
                onClick={() =>
                  toast.success(`Iniciando abordagem com ${lead.leadName} via WhatsApp...`)
                }
              >
                Abordar
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
