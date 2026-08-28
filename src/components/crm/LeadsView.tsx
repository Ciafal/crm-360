import React, { useState, useMemo } from 'react'
import { AdvancedLead, opportunityLeadService } from '@/services/opportunity_lead_service'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
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
  AlertTriangle,
  Flame,
  CheckCircle2,
  ExternalLink,
  DollarSign,
  TrendingUp,
} from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { formatCurrency, formatWeight, cn } from '@/lib/utils'

interface LeadsViewProps {
  onConvertLead?: (lead: AdvancedLead) => void
}

export function LeadsView({ onConvertLead }: LeadsViewProps) {
  const navigate = useNavigate()
  const [leadsList, setLeadsList] = useState<AdvancedLead[]>(
    opportunityLeadService.getStoredLeads(),
  )
  const [searchTerm, setSearchTerm] = useState('')
  const [abcFilter, setAbcFilter] = useState<string>('todos')
  const [stageFilter, setStageFilter] = useState<string>('todos')
  const [tempFilter, setTempFilter] = useState<string>('todos')
  const [segmentFilter, setSegmentFilter] = useState<string>('todos')

  // Modais de Criação & Conversão
  const [newLeadModalOpen, setNewLeadModalOpen] = useState(false)
  const [convertModalOpen, setConvertModalOpen] = useState(false)
  const [selectedLeadToConvert, setSelectedLeadToConvert] = useState<AdvancedLead | null>(null)

  // Formulário de Novo Lead com Validação de Duplicidade
  const [formData, setFormData] = useState<Partial<AdvancedLead>>({
    companyName: '',
    leadName: '',
    cnpj: '',
    email: '',
    phone: '',
    city: 'Contagem',
    uf: 'MG',
    segment: 'Indústria',
    productInterest: 'Tubos e Perfis Laminados',
    potentialTons: 15,
    leadPriorityABC: 'A',
    qualificationScore: 80,
    qualificationTemp: 'Quente',
    assignedSeller: 'Carlos Mendonça',
    stage: 'Novo',
    nextAction: 'Contato inicial de apresentação técnica',
  })
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)

  // Formulário de Conversão para Oportunidade
  const [convertData, setConvertData] = useState({
    titulo: '',
    valor: 0,
    toneladas: 0,
    vendedorNome: 'Carlos Mendonça',
    produtoFamilia: 'Tubos e Perfis Laminados',
  })

  const refreshLeads = () => {
    setLeadsList(opportunityLeadService.getStoredLeads())
  }

  const filteredLeads = useMemo(() => {
    return leadsList.filter((lead) => {
      const matchSearch =
        lead.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.cnpj && lead.cnpj.includes(searchTerm))

      const matchAbc = abcFilter === 'todos' || lead.leadPriorityABC === abcFilter
      const matchStage = stageFilter === 'todos' || lead.stage === stageFilter
      const matchTemp = tempFilter === 'todos' || lead.qualificationTemp === tempFilter
      const matchSegment = segmentFilter === 'todos' || lead.segment === segmentFilter

      return matchSearch && matchAbc && matchStage && matchTemp && matchSegment
    })
  }, [leadsList, searchTerm, abcFilter, stageFilter, tempFilter, segmentFilter])

  // Verificação de duplicidade em tempo real ao digitar
  const handleCnpjChange = (val: string) => {
    setFormData((prev) => ({ ...prev, cnpj: val }))
    if (val.length >= 10) {
      const check = opportunityLeadService.checkDuplicate({ ...formData, cnpj: val })
      if (check.hasDuplicate) {
        setDuplicateWarning(check.duplicateReason || 'Duplicidade detectada!')
      } else {
        setDuplicateWarning(null)
      }
    } else {
      setDuplicateWarning(null)
    }
  }

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault()
    const check = opportunityLeadService.checkDuplicate(formData)
    if (check.hasDuplicate) {
      toast.error(`Atenção: ${check.duplicateReason}`)
      setDuplicateWarning(check.duplicateReason || null)
      return
    }

    const newLead: AdvancedLead = {
      id: `lead-${Date.now()}`,
      companyName: formData.companyName || 'Empresa Lead',
      leadName: formData.leadName || 'Contato Principal',
      origin: 'Prospecção Ativa',
      potentialValue: (Number(formData.potentialTons) || 10) * 6200,
      score: Number(formData.qualificationScore) || 75,
      assignedSellerId: 'qas-vendedor_teste',
      createdAt: new Date().toISOString().split('T')[0],
      lastContact: 'Hoje',
      cnpj: formData.cnpj || '',
      email: formData.email || '',
      phone: formData.phone || '',
      city: formData.city || 'Contagem',
      uf: formData.uf || 'MG',
      segment: formData.segment || 'Indústria',
      productInterest: formData.productInterest || 'Perfis & Vigas',
      potentialTons: Number(formData.potentialTons) || 10,
      potencialValor: (Number(formData.potentialTons) || 10) * 6200,
      leadPriorityABC: formData.leadPriorityABC || 'A',
      qualificationScore: Number(formData.qualificationScore) || 75,
      qualificationTemp:
        (Number(formData.qualificationScore) || 75) >= 75
          ? 'Quente'
          : (Number(formData.qualificationScore) || 75) >= 55
            ? 'Morno'
            : 'Frio',
      assignedSeller: formData.assignedSeller || 'Carlos Mendonça',
      stage: 'Novo',
      urgency:
        (Number(formData.qualificationScore) || 75) >= 75
          ? 'Alta'
          : (Number(formData.qualificationScore) || 75) >= 55
            ? 'Média'
            : 'Baixa',
      nextAction: formData.nextAction || 'Qualificação técnica inicial',
      aiSuggestedProbability: (Number(formData.qualificationScore) || 75) >= 75 ? 75 : 50,
    }

    const current = opportunityLeadService.getStoredLeads()
    current.unshift(newLead)
    opportunityLeadService.saveStoredLeads(current)
    refreshLeads()
    setNewLeadModalOpen(false)
    toast.success(`Lead ${newLead.companyName} cadastrado com sucesso e sem duplicidades!`)
  }

  const handleOpenConvert = (lead: AdvancedLead) => {
    setSelectedLeadToConvert(lead)
    setConvertData({
      titulo: `Oportunidade - ${lead.productInterest} (${lead.companyName})`,
      valor: lead.potencialValor || lead.potentialTons * 6200,
      toneladas: lead.potentialTons,
      vendedorNome: lead.assignedSeller || 'Carlos Mendonça',
      produtoFamilia: lead.productInterest,
    })
    setConvertModalOpen(true)
  }

  const handleExecuteConvert = () => {
    if (!selectedLeadToConvert) return
    try {
      const result = opportunityLeadService.convertLeadToOpportunity(selectedLeadToConvert.id, {
        titulo: convertData.titulo,
        valor: convertData.valor,
        toneladas: convertData.toneladas,
        vendedorNome: convertData.vendedorNome,
        vendedorId: 'qas-vendedor_teste',
        produtoFamilia: convertData.produtoFamilia,
      })

      refreshLeads()
      setConvertModalOpen(false)
      toast.success(
        `Lead ${selectedLeadToConvert.companyName} convertido com sucesso em Oportunidade no Funil Comercial!`,
      )
      onConvertLead?.(result.lead)
    } catch (err: any) {
      toast.error(err.message || 'Falha ao converter lead')
    }
  }

  const tempBadgeStyle = (temp?: string) => {
    switch (temp) {
      case 'Quente':
        return 'bg-rose-100 text-rose-800 border-rose-200'
      case 'Morno':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  return (
    <div className="space-y-4">
      {/* Banner Principal de Leads com Contadores */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-[#003A70] to-sky-900 text-white p-4 sm:p-5 rounded-3xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-sky-400" />
            <h3 className="font-serif text-lg font-bold">
              Gestão Avançada de Leads & Qualificação Comercial
            </h3>
          </div>
          <p className="text-xs text-slate-200 max-w-2xl">
            Validação de duplicidade cruzada (CRM + SAP ECC), termômetro de qualificação (Quente /
            Morno / Frio), e conversão rastreável para o Funil de Vendas CIAFAL.
          </p>
        </div>

        <Button
          size="sm"
          className="h-9 bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs gap-1.5 rounded-xl self-start sm:self-auto shadow-xs"
          onClick={() => {
            setDuplicateWarning(null)
            setNewLeadModalOpen(true)
          }}
        >
          <Plus className="h-3.5 w-3.5" />
          Novo Lead Qualificado
        </Button>
      </div>

      {/* Barra de Filtros */}
      <Card className="bg-white/90 backdrop-blur-md rounded-2xl border-border/40 p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Buscar por empresa, CNPJ ou cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 text-xs rounded-xl"
            />
          </div>

          <Select value={tempFilter} onValueChange={setTempFilter}>
            <SelectTrigger className="h-10 text-xs rounded-xl">
              <SelectValue placeholder="Temperatura" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas Temperaturas</SelectItem>
              <SelectItem value="Quente">🔥 Quente (&gt;75 pts)</SelectItem>
              <SelectItem value="Morno">⚡ Morno (55-74 pts)</SelectItem>
              <SelectItem value="Frio">❄️ Frio (&lt;55 pts)</SelectItem>
            </SelectContent>
          </Select>

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
        {filteredLeads.map((lead) => {
          const isConverted = lead.stage === 'Convertido'

          return (
            <Card
              key={lead.id}
              className={cn(
                'bg-white/95 backdrop-blur-md rounded-2xl border border-border/50 p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3',
                isConverted && 'border-emerald-300 bg-emerald-50/20',
              )}
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-primary line-clamp-1">
                      {lead.companyName}
                    </h4>
                    <span className="text-[11px] text-muted-foreground block">
                      {lead.leadName} · {lead.cnpj || 'CNPJ não informado'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] font-bold border',
                        tempBadgeStyle(lead.qualificationTemp),
                      )}
                    >
                      {lead.qualificationTemp === 'Quente'
                        ? '🔥 '
                        : lead.qualificationTemp === 'Morno'
                          ? '⚡ '
                          : '❄️ '}
                      {lead.qualificationScore || 70} pts
                    </Badge>
                    <ABCBadge category={lead.leadPriorityABC} type="lead" showLabel={false} />
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap text-[11px]">
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px] font-semibold border-none',
                      isConverted ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800',
                    )}
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

                <div className="p-2.5 bg-slate-50 rounded-xl space-y-1.5 text-xs border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-[11px]">Potencial Estimado:</span>
                    <strong className="font-mono text-primary">
                      {formatWeight(lead.potentialTons, 1)} ·{' '}
                      {formatCurrency(lead.potencialValor || lead.potentialTons * 6200)}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-[11px]">Interesse Comercial:</span>
                    <span className="text-slate-800 text-[11px] font-medium truncate max-w-[170px]">
                      {lead.productInterest}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-[11px]">Probabilidade IA:</span>
                    <span className="text-emerald-700 text-[11px] font-bold">
                      {lead.aiSuggestedProbability || 65}% sugerida
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-700 bg-sky-50/70 p-2.5 rounded-xl border border-sky-100 space-y-0.5">
                  <strong className="text-primary font-semibold block text-[10px] uppercase tracking-wider">
                    Próxima Ação:
                  </strong>
                  <span>{lead.nextAction}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/30 gap-2">
                {isConverted ? (
                  <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold border-none gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Convertido em Oportunidade
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="default"
                    className="h-8 px-3 text-xs font-semibold gap-1.5 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-xs"
                    onClick={() => handleOpenConvert(lead)}
                  >
                    <span>Converter em Oportunidade</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                )}

                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                    onClick={() =>
                      toast.success(`Iniciando abordagem WhatsApp com ${lead.leadName}`)
                    }
                    title="Enviar WhatsApp"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 rounded-lg"
                    onClick={() =>
                      toast.success(
                        `Ligando para ${lead.leadName} (${lead.phone || 'Telefone pendente'})...`,
                      )
                    }
                    title="Fazer Ligação"
                  >
                    <Phone className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* DIALOG DE CADASTRO DE NOVO LEAD COM VALIDAÇÃO DE DUPLICIDADE */}
      <Dialog open={newLeadModalOpen} onOpenChange={setNewLeadModalOpen}>
        <DialogContent className="max-w-lg rounded-2xl bg-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg text-primary flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" /> Cadastrar Novo Lead Comercial
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Preencha os dados do lead. A validação de duplicidade por CNPJ, E-mail e Razão Social
              é automática.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateLead} className="space-y-3.5 py-2 text-xs">
            {duplicateWarning && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-xs font-bold text-rose-800">
                    Possível Duplicidade Detectada
                  </strong>
                  <span className="text-[11px] text-rose-700">{duplicateWarning}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Razão Social / Empresa *:</Label>
                <Input
                  required
                  placeholder="Ex: Indústria Metalúrgica Triângulo Ltda"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Nome do Contato Principal *:</Label>
                <Input
                  required
                  placeholder="Ex: Eduardo Martins"
                  value={formData.leadName}
                  onChange={(e) => setFormData({ ...formData, leadName: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">CNPJ (Com validação SAP ECC):</Label>
                <Input
                  placeholder="00.000.000/0000-00"
                  value={formData.cnpj}
                  onChange={(e) => handleCnpjChange(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Telefone / WhatsApp:</Label>
                <Input
                  placeholder="(31) 99999-9999"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">E-mail Comercial:</Label>
                <Input
                  type="email"
                  placeholder="compras@empresa.com.br"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Segmento:</Label>
                <Select
                  value={formData.segment}
                  onValueChange={(v) => setFormData({ ...formData, segment: v })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Indústria">Indústria Metalmecânica</SelectItem>
                    <SelectItem value="Construção Civil">Construção Civil & Estruturas</SelectItem>
                    <SelectItem value="Agronegócio">Agronegócio & Implementos</SelectItem>
                    <SelectItem value="Revenda">Revenda & Serralheria</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Volume Potencial (t):</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={formData.potentialTons}
                  onChange={(e) =>
                    setFormData({ ...formData, potentialTons: Number(e.target.value) })
                  }
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Score Qualificação (0-100):</Label>
                <Input
                  type="number"
                  value={formData.qualificationScore}
                  onChange={(e) =>
                    setFormData({ ...formData, qualificationScore: Number(e.target.value) })
                  }
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Prioridade ABC:</Label>
                <Select
                  value={formData.leadPriorityABC}
                  onValueChange={(v: any) => setFormData({ ...formData, leadPriorityABC: v })}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Classe A</SelectItem>
                    <SelectItem value="B">Classe B</SelectItem>
                    <SelectItem value="C">Classe C</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Família / Produto de Interesse:</Label>
              <Input
                placeholder="Ex: Chapas Grossas A36 e Tubos Sch40"
                value={formData.productInterest}
                onChange={(e) => setFormData({ ...formData, productInterest: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Próxima Ação Comercial:</Label>
              <Input
                placeholder="Ex: Enviar proposta preliminar e agendar visita técnica"
                value={formData.nextAction}
                onChange={(e) => setFormData({ ...formData, nextAction: e.target.value })}
                className="h-8 text-xs"
              />
            </div>

            <DialogFooter className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setNewLeadModalOpen(false)}
                className="h-8 text-xs"
              >
                Cancelar
              </Button>
              <Button type="submit" size="sm" className="h-8 text-xs bg-primary text-white">
                Salvar Lead
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG DE CONVERSÃO DE LEAD PARA OPORTUNIDADE (FASE 1) */}
      <Dialog open={convertModalOpen} onOpenChange={setConvertModalOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg text-primary flex items-center gap-2">
              <ArrowRight className="w-5 h-5 text-primary" /> Converter Lead em Oportunidade
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              A oportunidade será incluída no Kanban Comercial preservando todo o histórico e score
              do lead original.
            </DialogDescription>
          </DialogHeader>

          {selectedLeadToConvert && (
            <div className="space-y-3.5 py-2 text-xs">
              <div className="p-3 bg-slate-50 border rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Lead Selecionado:
                </span>
                <strong className="text-slate-900 text-xs block">
                  {selectedLeadToConvert.companyName} ({selectedLeadToConvert.leadName})
                </strong>
                <span className="text-[11px] text-muted-foreground block">
                  Score de Qualificação: {selectedLeadToConvert.qualificationScore} pts (
                  {selectedLeadToConvert.qualificationTemp})
                </span>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Título da Oportunidade:</Label>
                <Input
                  value={convertData.titulo}
                  onChange={(e) => setConvertData({ ...convertData, titulo: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Volume Estimado (t):</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={convertData.toneladas}
                    onChange={(e) =>
                      setConvertData({
                        ...convertData,
                        toneladas: Number(e.target.value),
                        valor: Number(e.target.value) * 6200,
                      })
                    }
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Valor Estimado (R$):</Label>
                  <Input
                    type="number"
                    value={convertData.valor}
                    onChange={(e) =>
                      setConvertData({ ...convertData, valor: Number(e.target.value) })
                    }
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Família de Produtos:</Label>
                <Input
                  value={convertData.produtoFamilia}
                  onChange={(e) =>
                    setConvertData({ ...convertData, produtoFamilia: e.target.value })
                  }
                  className="h-8 text-xs"
                />
              </div>

              <DialogFooter className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConvertModalOpen(false)}
                  className="h-8 text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleExecuteConvert}
                  className="h-8 text-xs bg-primary text-white"
                >
                  Confirmar Conversão
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
