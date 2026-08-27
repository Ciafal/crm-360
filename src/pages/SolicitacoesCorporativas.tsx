import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  CorporateRequest,
  CorporateRequestType,
  CorporateRequestStatus,
  RequestViagemData,
  RequestTreinamentoInternoData,
  RequestTreinamentoExternoData,
  RequestVisitaTecnicaData,
  RequestVisitaFornecedorData,
  RequestVisitaParceiroData,
  RequestReembolsoData,
} from '@/types/models'
import { corporateRequestsService } from '@/services/corporate_requests_service'
import { mockClientes } from '@/data/mockCommercialData'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FileText,
  Plus,
  Plane,
  GraduationCap,
  Briefcase,
  Users,
  Receipt,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  AlertCircle,
  Eye,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  History,
  FileCheck,
  Layers,
  ArrowUpRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const REQUEST_TYPE_LABELS: Record<
  CorporateRequestType,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  VIAGEM: { label: 'Solicitação de Viagem', icon: Plane, color: 'bg-sky-100 text-sky-800' },
  TREINAMENTO_INTERNO: {
    label: 'Treinamento Interno',
    icon: GraduationCap,
    color: 'bg-emerald-100 text-emerald-800',
  },
  TREINAMENTO_EXTERNO: {
    label: 'Treinamento Externo',
    icon: GraduationCap,
    color: 'bg-indigo-100 text-indigo-800',
  },
  VISITA_TECNICA_CLIENTE: {
    label: 'Visita Técnica a Cliente',
    icon: Briefcase,
    color: 'bg-amber-100 text-amber-800',
  },
  VISITA_FORNECEDOR: {
    label: 'Visita a Fornecedor',
    icon: Building2,
    color: 'bg-purple-100 text-purple-800',
  },
  VISITA_PARCEIRO: {
    label: 'Visita a Parceiro',
    icon: Users,
    color: 'bg-teal-100 text-teal-800',
  },
  REEMBOLSO: {
    label: 'Solicitação de Reembolso',
    icon: Receipt,
    color: 'bg-rose-100 text-rose-800',
  },
}

const STATUS_CONFIG: Record<
  CorporateRequestStatus,
  { label: string; bg: string; text: string; icon: React.ComponentType<{ className?: string }> }
> = {
  RASCUNHO: { label: 'Rascunho', bg: 'bg-slate-100', text: 'text-slate-700', icon: Clock },
  ENVIADO: { label: 'Enviado', bg: 'bg-blue-100', text: 'text-blue-800', icon: Send },
  EM_APROVACAO: { label: 'Em Aprovação', bg: 'bg-amber-100', text: 'text-amber-800', icon: Clock },
  APROVADO: {
    label: 'Aprovado',
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    icon: CheckCircle2,
  },
  REJEITADO: { label: 'Rejeitado', bg: 'bg-rose-100', text: 'text-rose-800', icon: XCircle },
  EM_EXECUCAO: { label: 'Em Execução', bg: 'bg-cyan-100', text: 'text-cyan-800', icon: Layers },
  CONCLUIDO: {
    label: 'Concluído',
    bg: 'bg-emerald-50 text-emerald-900 border-emerald-300',
    text: 'text-emerald-800',
    icon: ShieldCheck,
  },
  CANCELADO: { label: 'Cancelado', bg: 'bg-slate-200', text: 'text-slate-600', icon: XCircle },
}

export default function SolicitacoesCorporativas() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [requests, setRequests] = useState<CorporateRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>(searchParams.get('tab') || 'todas')
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('todos')
  const [statusFilter, setStatusFilter] = useState<string>('todos')

  // Modais
  const [newModalOpen, setNewModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<CorporateRequest | null>(null)
  const [commentText, setCommentText] = useState('')
  const [actionComment, setActionComment] = useState('')

  // Form de Nova Solicitação
  const [newType, setNewType] = useState<CorporateRequestType>('VIAGEM')
  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState<'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE'>('MEDIA')
  const [newCost, setNewCost] = useState<number>(0)
  const [newJustification, setNewJustification] = useState('')

  // Sub-campos específicos
  const [viagemOrigin, setViagemOrigin] = useState('Contagem / MG')
  const [viagemDestination, setViagemDestination] = useState('')
  const [viagemDepDate, setViagemDepDate] = useState('')
  const [viagemRetDate, setViagemRetDate] = useState('')
  const [viagemTransport, setViagemTransport] = useState<any>('AEREO')
  const [viagemHotel, setViagemHotel] = useState(true)
  const [viagemFlight, setViagemFlight] = useState(true)
  const [viagemAdvance, setViagemAdvance] = useState(false)
  const [viagemAdvanceAmount, setViagemAdvanceAmount] = useState<number>(500)

  // Sub-campos Treinamento Interno
  const [treinInternoName, setTreinInternoName] = useState('')
  const [treinInternoInstructor, setTreinInternoInstructor] = useState('')
  const [treinInternoParticipants, setTreinInternoParticipants] = useState(10)
  const [treinInternoDate, setTreinInternoDate] = useState('')
  const [treinInternoDuration, setTreinInternoDuration] = useState(4)
  const [treinInternoCompetency, setTreinInternoCompetency] = useState(
    'Metalurgia & Aços Estruturais',
  )

  // Sub-campos Treinamento Externo
  const [treinExtInstitution, setTreinExtInstitution] = useState('')
  const [treinExtCourse, setTreinExtCourse] = useState('')
  const [treinExtCity, setTreinExtCity] = useState('')
  const [treinExtModality, setTreinExtModality] = useState<any>('PRESENCIAL')

  // Sub-campos Visita Técnica
  const [visitaCustomerId, setVisitaCustomerId] = useState('')
  const [visitaTechLead, setVisitaTechLead] = useState('')
  const [visitaDate, setVisitaDate] = useState('')
  const [visitaTime, setVisitaTime] = useState('14:00')
  const [visitaExpectedResult, setVisitaExpectedResult] = useState('')

  // Sub-campos Visita Fornecedor
  const [fornecName, setFornecName] = useState('')
  const [fornecSap, setFornecSap] = useState('')
  const [fornecDate, setFornecDate] = useState('')

  // Sub-campos Visita Parceiro
  const [parceiroName, setParceiroName] = useState('')
  const [parceiroCat, setParceiroCat] = useState<any>('TECNOLOGIA')
  const [parceiroDate, setParceiroDate] = useState('')

  // Sub-campos Reembolso
  const [reembolsoType, setReembolsoType] = useState<any>('ALIMENTACAO')
  const [reembolsoDate, setReembolsoDate] = useState(new Date().toISOString().split('T')[0])
  const [reembolsoTripCode, setReembolsoTripCode] = useState('')

  const loadRequests = async () => {
    setLoading(true)
    const list = await corporateRequestsService.listRequests()
    setRequests(list)
    setLoading(false)
  }

  useEffect(() => {
    loadRequests()
  }, [])

  // Auto-fill ao vir com query params de outra tela (ex: CRM -> Visita Técnica)
  useEffect(() => {
    const typeParam = searchParams.get('tipo') as CorporateRequestType
    const clienteParam = searchParams.get('cliente')
    const sapParam = searchParams.get('sap')

    if (typeParam && REQUEST_TYPE_LABELS[typeParam]) {
      setNewType(typeParam)
      if (typeParam === 'VISITA_TECNICA_CLIENTE') {
        const found = mockClientes.find((c) => c.id === clienteParam || c.sapCode === sapParam)
        if (found) {
          setVisitaCustomerId(found.id)
          setNewTitle(`Visita Técnica ao Cliente — ${found.nomeFantasia || found.razaoSocial}`)
          setNewJustification(
            `Alinhamento de especificações e suporte técnico in-loco para ${found.nomeFantasia}.`,
          )
          setVisitaTechLead('Eng. Maurício Ramos (Qualidade CIAFAL)')
          setVisitaExpectedResult('Homologação técnica de perfis e liberação da cotação.')
        }
      }
      setNewModalOpen(true)
    }
  }, [searchParams])

  // Filtragem
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const matchSearch =
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.requester_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.department.toLowerCase().includes(searchTerm.toLowerCase())

      const matchType = typeFilter === 'todos' || r.request_type === typeFilter
      const matchStatus = statusFilter === 'todos' || r.status === statusFilter

      if (activeTab === 'minhas') {
        const isMine =
          r.requester_email.toLowerCase() === (user?.email || '').toLowerCase() ||
          r.requester_id === user?.id ||
          r.requester_name.toLowerCase().includes((user?.name || '').toLowerCase())
        return isMine && matchSearch && matchType && matchStatus
      }

      if (activeTab === 'pendentes') {
        const isPending =
          r.status === 'ENVIADO' || r.status === 'EM_APROVACAO' || r.status === 'EM_EXECUCAO'
        return isPending && matchSearch && matchType && matchStatus
      }

      return matchSearch && matchType && matchStatus
    })
  }, [requests, activeTab, searchTerm, typeFilter, statusFilter, user])

  // Submissão do Form de Nova Solicitação
  const handleCreateRequest = async (submitDirectly = true) => {
    if (!newTitle) {
      toast.error('Informe o título da solicitação.')
      return
    }

    let typeData: any = {}

    if (newType === 'VIAGEM') {
      typeData = {
        origin: viagemOrigin,
        destination: viagemDestination || 'São Paulo / SP',
        departure_date: viagemDepDate || '2024-11-15',
        return_date: viagemRetDate || '2024-11-18',
        transport_type: viagemTransport,
        need_hotel: viagemHotel,
        hotel_nights: 3,
        need_flight: viagemFlight,
        need_advance_payment: viagemAdvance,
        advance_amount: viagemAdvance ? viagemAdvanceAmount : 0,
      } as RequestViagemData
    } else if (newType === 'TREINAMENTO_INTERNO') {
      typeData = {
        training_name: treinInternoName || newTitle,
        objective: newJustification || 'Capacitação técnica operacional',
        instructor: treinInternoInstructor || 'Instrutor Técnico Especialista CIAFAL',
        participants_count: treinInternoParticipants,
        participants_list: ['Equipe Comercial', 'Engenharia de Aplicação'],
        scheduled_date: treinInternoDate || '2024-11-20',
        duration_hours: treinInternoDuration,
        need_room: true,
        need_equipment: true,
        cost: newCost,
        competency_related: treinInternoCompetency,
        integrated_with_hcm: true,
      } as RequestTreinamentoInternoData
    } else if (newType === 'TREINAMENTO_EXTERNO') {
      typeData = {
        institution: treinExtInstitution || 'Instituto Brasileiro de Siderurgia',
        course_name: treinExtCourse || newTitle,
        city_uf: treinExtCity || 'São Paulo / SP',
        modality: treinExtModality,
        registration_cost: newCost,
        expected_certificate: true,
        integrated_with_hcm: true,
      } as RequestTreinamentoExternoData
    } else if (newType === 'VISITA_TECNICA_CLIENTE') {
      const cli = mockClientes.find((c) => c.id === visitaCustomerId) || mockClientes[0]
      typeData = {
        customer_id: cli.id,
        sap_customer_code: cli.sapCode,
        customer_name: cli.razaoSocial,
        unit_address: cli.enderecoCadastral || `${cli.cidade} - ${cli.uf}`,
        contacts: 'Gerência de Compras e Engenharia',
        objective: newTitle,
        reason: newJustification,
        seller_id: user?.id || 'usr-vendedor',
        seller_name: user?.name || 'Carlos Mendonça',
        technical_lead: visitaTechLead || 'Eng. Maurício Ramos',
        participants: `${user?.name || 'Vendedor'}, ${visitaTechLead || 'Engenharia'}`,
        visit_date: visitaDate || '2024-11-10',
        visit_time: visitaTime || '14:00',
        location: `${cli.cidade} / ${cli.uf}`,
        need_travel: false,
        expected_result: visitaExpectedResult || 'Aprovação técnica de lote',
        crm_integration_status: 'SYNCED',
      } as RequestVisitaTecnicaData
    } else if (newType === 'VISITA_FORNECEDOR') {
      typeData = {
        supplier_sap_code: fornecSap || 'FORN-SAP-9901',
        supplier_name: fornecName || 'Gerdau Usina Ouro Branco',
        unit_address: 'Rodovia MG-443, KM 7 - Ouro Branco/MG',
        objective: newTitle,
        participants: user?.name || 'Equipe Suprimentos CIAFAL',
        visit_date: fornecDate || '2024-11-25',
        expected_result: 'Auditoria de qualidade e programação de entrega de tarugos',
        procurement_focus: true,
        quality_focus: true,
      } as RequestVisitaFornecedorData
    } else if (newType === 'VISITA_PARCEIRO') {
      typeData = {
        partner_name: parceiroName || 'Parceiro Tecnológico / Logístico',
        partner_category: parceiroCat,
        unit_address: 'Av. Raja Gabaglia, 2000 - Belo Horizonte/MG',
        objective: newTitle,
        participants: user?.name || 'Vendedor',
        visit_date: parceiroDate || '2024-11-12',
        expected_result: 'Alinhamento de SLA e integração operacional',
      } as RequestVisitaParceiroData
    } else if (newType === 'REEMBOLSO') {
      typeData = {
        expense_type: reembolsoType,
        expense_date: reembolsoDate,
        amount: newCost || 180,
        currency: 'BRL',
        related_trip_code: reembolsoTripCode || 'SOL-2024-001',
        receipts_count: 1,
        erp_status: 'READY_FOR_ERP',
      } as RequestReembolsoData
    }

    const initialStatus: CorporateRequestStatus = submitDirectly ? 'ENVIADO' : 'RASCUNHO'

    await corporateRequestsService.createRequest({
      request_type: newType,
      title: newTitle,
      requester_id: user?.id || 'usr-current',
      requester_name: user?.name || 'Carlos Mendonça',
      requester_email: user?.email || 'carlos.mendonca@ciafal.com.br',
      matricula: user?.employee_id || 'TOTVS-8801',
      department: user?.department || 'Comercial — Vendas Indústria',
      cost_center: user?.cost_center || 'CC-1020 — Comercial Minas',
      manager_id: user?.manager_id || 'usr-supervisor',
      manager_name: user?.manager_name || 'Roberto Silveira (Supervisor Regional)',
      current_approver_id: user?.manager_id || 'usr-supervisor',
      current_approver_name: user?.manager_name || 'Roberto Silveira (Supervisor Regional)',
      current_approver_role: 'Supervisor Comercial (Hierarquia Organizacional)',
      status: initialStatus,
      priority: newPriority,
      estimated_cost: newCost,
      currency: 'BRL',
      justification: newJustification,
      type_data: typeData,
      attachments: [],
    })

    toast.success(
      submitDirectly
        ? 'Solicitação Corporativa enviada para aprovação do gestor!'
        : 'Rascunho salvo com sucesso!',
    )
    setNewModalOpen(false)
    resetForm()
    loadRequests()
  }

  const resetForm = () => {
    setNewTitle('')
    setNewCost(0)
    setNewJustification('')
    setViagemDestination('')
    setTreinInternoName('')
    setTreinExtCourse('')
    setFornecName('')
    setParceiroName('')
  }

  const handleWorkflowAction = async (
    action: 'SUBMETER' | 'APROVAR' | 'REJEITAR' | 'EXECUTAR' | 'CONCLUIR' | 'CANCELAR',
  ) => {
    if (!selectedRequest) return
    try {
      const updated = await corporateRequestsService.updateRequestStatus(
        selectedRequest.id,
        action,
        user?.id || 'usr-current',
        user?.name || 'Administrador QAS',
        user?.role || 'Master Admin',
        actionComment,
      )
      setSelectedRequest(updated)
      setActionComment('')
      toast.success(`Workflow atualizado: ${action} executado com sucesso!`)
      loadRequests()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao processar ação.')
    }
  }

  const handleAddComment = async () => {
    if (!selectedRequest || !commentText) return
    const updated = await corporateRequestsService.addComment(
      selectedRequest.id,
      user?.id || 'usr-current',
      user?.name || 'Carlos Mendonça',
      commentText,
    )
    setSelectedRequest(updated)
    setCommentText('')
    toast.success('Comentário registrado no histórico!')
    loadRequests()
  }

  const formatBRL = (val?: number) => {
    if (!val) return 'R$ 0,00'
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in pb-16">
      {/* HEADER EXECUTIVO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-primary/10 rounded-2xl">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-3xl font-bold text-primary tracking-tight">
                  Central de Solicitações Corporativas
                </h1>
                <Badge className="bg-primary/10 text-primary border-primary/30 text-xs">
                  Motor Único de Workflow
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Gestão integrada de Viagens, Treinamentos, Visitas Técnicas e Reembolsos com
                aprovação hierárquica e histórico imutável.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              resetForm()
              setNewModalOpen(true)
            }}
            className="h-9 gap-1.5 text-xs bg-primary text-white shadow-xs"
          >
            <Plus className="w-4 h-4" /> Nova Solicitação
          </Button>
        </div>
      </div>

      {/* 4 CARDS DE INDICADORES DO MÓDULO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white/95 backdrop-blur-md border-border/40 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Total de Solicitações
            </span>
            <Layers className="w-4 h-4 text-primary" />
          </div>
          <div className="mt-2">
            <span className="font-serif text-3xl font-bold text-primary block">
              {requests.length}
            </span>
            <span className="text-[11px] text-muted-foreground">Transversais no HUB CIAFAL</span>
          </div>
        </Card>

        <Card className="bg-white/95 backdrop-blur-md border-border/40 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              Pendentes de Aprovação
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2">
            <span className="font-serif text-3xl font-bold text-amber-700 block">
              {requests.filter((r) => r.status === 'ENVIADO' || r.status === 'EM_APROVACAO').length}
            </span>
            <span className="text-[11px] text-amber-800">Aguardando gestores / diretoria</span>
          </div>
        </Card>

        <Card className="bg-white/95 backdrop-blur-md border-border/40 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Aprovadas & Concluídas
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <span className="font-serif text-3xl font-bold text-emerald-700 block">
              {requests.filter((r) => r.status === 'APROVADO' || r.status === 'CONCLUIDO').length}
            </span>
            <span className="text-[11px] text-emerald-800">Integradas ao HCM / CRM / ERP</span>
          </div>
        </Card>

        <Card className="bg-white/95 backdrop-blur-md border-border/40 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Volume Orçado (BRL)
            </span>
            <DollarSign className="w-4 h-4 text-primary" />
          </div>
          <div className="mt-2">
            <span className="font-serif text-2xl font-bold text-slate-900 block">
              {formatBRL(requests.reduce((acc, r) => acc + (r.estimated_cost || 0), 0))}
            </span>
            <span className="text-[11px] text-muted-foreground">Centros de Custo controlados</span>
          </div>
        </Card>
      </div>

      {/* ABAS & FILTROS */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-3">
          <TabsList className="bg-slate-100 p-1 rounded-2xl h-auto gap-1">
            <TabsTrigger
              value="todas"
              className="data-[state=active]:bg-white data-[state=active]:text-primary rounded-xl px-4 py-2 text-xs font-semibold"
            >
              Todas as Solicitações ({requests.length})
            </TabsTrigger>
            <TabsTrigger
              value="pendentes"
              className="data-[state=active]:bg-white data-[state=active]:text-amber-800 rounded-xl px-4 py-2 text-xs font-semibold"
            >
              Pendentes de Aprovação (
              {requests.filter((r) => r.status === 'ENVIADO' || r.status === 'EM_APROVACAO').length}
              )
            </TabsTrigger>
            <TabsTrigger
              value="minhas"
              className="data-[state=active]:bg-white data-[state=active]:text-primary rounded-xl px-4 py-2 text-xs font-semibold"
            >
              Minhas Solicitações
            </TabsTrigger>
          </TabsList>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por código, título ou solicitante..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 pl-8 text-xs bg-white rounded-xl"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-8 text-xs bg-white rounded-xl w-44">
                <SelectValue placeholder="Tipo de Solicitação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Tipos</SelectItem>
                <SelectItem value="VIAGEM">Viagem</SelectItem>
                <SelectItem value="TREINAMENTO_INTERNO">Treinamento Interno</SelectItem>
                <SelectItem value="TREINAMENTO_EXTERNO">Treinamento Externo</SelectItem>
                <SelectItem value="VISITA_TECNICA_CLIENTE">Visita a Cliente</SelectItem>
                <SelectItem value="VISITA_FORNECEDOR">Visita a Fornecedor</SelectItem>
                <SelectItem value="VISITA_PARCEIRO">Visita a Parceiro</SelectItem>
                <SelectItem value="REEMBOLSO">Reembolso</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 text-xs bg-white rounded-xl w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Status</SelectItem>
                <SelectItem value="RASCUNHO">Rascunho</SelectItem>
                <SelectItem value="ENVIADO">Enviado</SelectItem>
                <SelectItem value="EM_APROVACAO">Em Aprovação</SelectItem>
                <SelectItem value="APROVADO">Aprovado</SelectItem>
                <SelectItem value="REJEITADO">Rejeitado</SelectItem>
                <SelectItem value="EM_EXECUCAO">Em Execução</SelectItem>
                <SelectItem value="CONCLUIDO">Concluído</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* LISTAGEM DE SOLICITAÇÕES */}
        <TabsContent value={activeTab} className="m-0 space-y-3">
          {filteredRequests.length === 0 ? (
            <Card className="p-12 text-center bg-white rounded-3xl border-border/40">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
              <h3 className="font-serif font-bold text-lg text-slate-800">
                Nenhuma solicitação encontrada
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Ajuste os filtros ou crie uma nova solicitação corporativa.
              </p>
            </Card>
          ) : (
            filteredRequests.map((req) => {
              const typeCfg = REQUEST_TYPE_LABELS[req.request_type]
              const statusCfg = STATUS_CONFIG[req.status]
              const TypeIcon = typeCfg.icon
              const StatusIcon = statusCfg.icon

              return (
                <Card
                  key={req.id}
                  className="bg-white/95 backdrop-blur-md border-border/40 rounded-3xl p-5 shadow-xs hover:border-primary/40 transition-all cursor-pointer"
                  onClick={() => {
                    setSelectedRequest(req)
                    setDetailModalOpen(true)
                  }}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0 border border-border/40">
                        <TypeIcon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-slate-100 font-bold text-slate-800">
                            {req.code}
                          </span>
                          <Badge className={cn('text-[10px] font-bold border-none', typeCfg.color)}>
                            {typeCfg.label}
                          </Badge>
                          <Badge
                            className={cn(
                              'text-[10px] font-bold border-none gap-1',
                              statusCfg.bg,
                              statusCfg.text,
                            )}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {statusCfg.label}
                          </Badge>
                          {req.priority === 'ALTA' || req.priority === 'URGENTE' ? (
                            <Badge className="bg-rose-100 text-rose-800 text-[10px] font-bold border-none">
                              Prioridade {req.priority}
                            </Badge>
                          ) : null}
                        </div>

                        <h3 className="font-serif font-bold text-base text-primary hover:underline">
                          {req.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-x-4 text-xs text-muted-foreground">
                          <span>
                            Solicitante: <strong>{req.requester_name}</strong> ({req.department})
                          </span>
                          <span>
                            Centro de Custo: <strong>{req.cost_center}</strong>
                          </span>
                          <span>
                            Aprovador Atual: <strong>{req.current_approver_name}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between lg:justify-end gap-6 pt-3 lg:pt-0 border-t lg:border-t-0">
                      <div className="text-left lg:text-right">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                          Valor Estimado
                        </span>
                        <span className="font-serif font-bold text-lg text-slate-900 block">
                          {formatBRL(req.estimated_cost)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Criado em: {new Date(req.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs text-primary gap-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedRequest(req)
                            setDetailModalOpen(true)
                          }}
                        >
                          <Eye className="w-3.5 h-3.5" /> Detalhes & Workflow
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })
          )}
        </TabsContent>
      </Tabs>

      {/* MODAL: NOVA SOLICITAÇÃO CORPORATIVA */}
      <Dialog open={newModalOpen} onOpenChange={setNewModalOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-bold text-primary flex items-center gap-2">
              <Plus className="w-6 h-6 text-primary" /> Nova Solicitação Corporativa
            </DialogTitle>
            <DialogDescription className="text-xs">
              Selecione o tipo de solicitação transversal. O formulário carregará os campos
              específicos e roteará pela hierarquia oficial da CIAFAL.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* SELETOR DE TIPO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Tipo de Solicitação *</Label>
                <Select
                  value={newType}
                  onValueChange={(v) => {
                    setNewType(v as CorporateRequestType)
                  }}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VIAGEM">✈️ Solicitação de Viagem</SelectItem>
                    <SelectItem value="TREINAMENTO_INTERNO">🎓 Treinamento Interno</SelectItem>
                    <SelectItem value="TREINAMENTO_EXTERNO">🏛️ Treinamento Externo</SelectItem>
                    <SelectItem value="VISITA_TECNICA_CLIENTE">
                      💼 Visita Técnica a Cliente (CRM 360)
                    </SelectItem>
                    <SelectItem value="VISITA_FORNECEDOR">🏭 Visita a Fornecedor</SelectItem>
                    <SelectItem value="VISITA_PARCEIRO">🤝 Visita a Parceiro</SelectItem>
                    <SelectItem value="REEMBOLSO">🧾 Solicitação de Reembolso</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Prioridade</Label>
                <Select value={newPriority} onValueChange={(v) => setNewPriority(v as any)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BAIXA">Baixa</SelectItem>
                    <SelectItem value="MEDIA">Média</SelectItem>
                    <SelectItem value="ALTA">Alta</SelectItem>
                    <SelectItem value="URGENTE">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* TÍTULO E CUSTO ESTIMADO */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Título / Assunto *</Label>
                <Input
                  placeholder="Ex: Viagem para Fechamento Anual Gerdau Piracicaba"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Custo Estimado (R$)</Label>
                <Input
                  type="number"
                  placeholder="0,00"
                  value={newCost || ''}
                  onChange={(e) => setNewCost(Number(e.target.value))}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* CAMPOS DINÂMICOS ESPECÍFICOS POR TIPO */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-border/50 space-y-3">
              <span className="text-xs font-bold text-primary uppercase tracking-wider block">
                Detalhes Específicos: {REQUEST_TYPE_LABELS[newType].label}
              </span>

              {/* 1. VIAGEM */}
              {newType === 'VIAGEM' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Origem</Label>
                    <Input
                      value={viagemOrigin}
                      onChange={(e) => setViagemOrigin(e.target.value)}
                      className="h-8 text-xs bg-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Destino *</Label>
                    <Input
                      placeholder="Ex: São Paulo / SP"
                      value={viagemDestination}
                      onChange={(e) => setViagemDestination(e.target.value)}
                      className="h-8 text-xs bg-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Data Ida</Label>
                    <Input
                      type="date"
                      value={viagemDepDate}
                      onChange={(e) => setViagemDepDate(e.target.value)}
                      className="h-8 text-xs bg-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Data Retorno</Label>
                    <Input
                      type="date"
                      value={viagemRetDate}
                      onChange={(e) => setViagemRetDate(e.target.value)}
                      className="h-8 text-xs bg-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Transporte</Label>
                    <Select value={viagemTransport} onValueChange={setViagemTransport}>
                      <SelectTrigger className="h-8 text-xs bg-white mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AEREO">Aéreo</SelectItem>
                        <SelectItem value="CARRO_PROPRIO">Carro Próprio / Km</SelectItem>
                        <SelectItem value="CARRO_LOCADO">Carro Locado</SelectItem>
                        <SelectItem value="ONIBUS">Ônibus</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-4 pt-4">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={viagemHotel}
                        onChange={(e) => setViagemHotel(e.target.checked)}
                      />
                      <span>Hospedagem</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={viagemAdvance}
                        onChange={(e) => setViagemAdvance(e.target.checked)}
                      />
                      <span>Adiantamento</span>
                    </label>
                  </div>
                </div>
              )}

              {/* 2. TREINAMENTO INTERNO */}
              {newType === 'TREINAMENTO_INTERNO' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Nome do Treinamento</Label>
                    <Input
                      placeholder="Ex: Treinamento em Vigas e Perfis Laminados"
                      value={treinInternoName}
                      onChange={(e) => setTreinInternoName(e.target.value)}
                      className="h-8 text-xs bg-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Instrutor</Label>
                    <Input
                      placeholder="Ex: Especialista Gerdau / Engenheiro CIAFAL"
                      value={treinInternoInstructor}
                      onChange={(e) => setTreinInternoInstructor(e.target.value)}
                      className="h-8 text-xs bg-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">
                      Participantes Previstos
                    </Label>
                    <Input
                      type="number"
                      value={treinInternoParticipants}
                      onChange={(e) => setTreinInternoParticipants(Number(e.target.value))}
                      className="h-8 text-xs bg-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Duração (Horas)</Label>
                    <Input
                      type="number"
                      value={treinInternoDuration}
                      onChange={(e) => setTreinInternoDuration(Number(e.target.value))}
                      className="h-8 text-xs bg-white mt-1"
                    />
                  </div>
                </div>
              )}

              {/* 3. TREINAMENTO EXTERNO */}
              {newType === 'TREINAMENTO_EXTERNO' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <Label className="text-[11px] text-muted-foreground">
                      Instituição / Escola
                    </Label>
                    <Input
                      placeholder="Ex: ABM / FIA / FGV"
                      value={treinExtInstitution}
                      onChange={(e) => setTreinExtInstitution(e.target.value)}
                      className="h-8 text-xs bg-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">
                      Nome do Curso / Evento
                    </Label>
                    <Input
                      placeholder="Ex: Congresso Brasileiro de Siderurgia 2024"
                      value={treinExtCourse}
                      onChange={(e) => setTreinExtCourse(e.target.value)}
                      className="h-8 text-xs bg-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Cidade / Modalidade</Label>
                    <Input
                      placeholder="Ex: São Paulo / Presencial"
                      value={treinExtCity}
                      onChange={(e) => setTreinExtCity(e.target.value)}
                      className="h-8 text-xs bg-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Modalidade</Label>
                    <Select value={treinExtModality} onValueChange={setTreinExtModality}>
                      <SelectTrigger className="h-8 text-xs bg-white mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PRESENCIAL">Presencial</SelectItem>
                        <SelectItem value="ONLINE_AO_VIVO">Online Ao Vivo</SelectItem>
                        <SelectItem value="HIBRIDO">Híbrido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* 4. VISITA TÉCNICA A CLIENTE */}
              {newType === 'VISITA_TECNICA_CLIENTE' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <Label className="text-[11px] text-muted-foreground">
                      Cliente (Base CRM/SAP)
                    </Label>
                    <Select value={visitaCustomerId} onValueChange={setVisitaCustomerId}>
                      <SelectTrigger className="h-8 text-xs bg-white mt-1">
                        <SelectValue placeholder="Selecione o cliente..." />
                      </SelectTrigger>
                      <SelectContent>
                        {mockClientes.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.nomeFantasia || c.razaoSocial} (SAP #{c.sapCode})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Responsável Técnico</Label>
                    <Input
                      placeholder="Ex: Eng. Maurício Ramos"
                      value={visitaTechLead}
                      onChange={(e) => setVisitaTechLead(e.target.value)}
                      className="h-8 text-xs bg-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Data da Visita</Label>
                    <Input
                      type="date"
                      value={visitaDate}
                      onChange={(e) => setVisitaDate(e.target.value)}
                      className="h-8 text-xs bg-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Resultado Esperado</Label>
                    <Input
                      placeholder="Ex: Homologação de Chapas Grossas"
                      value={visitaExpectedResult}
                      onChange={(e) => setVisitaExpectedResult(e.target.value)}
                      className="h-8 text-xs bg-white mt-1"
                    />
                  </div>
                </div>
              )}

              {/* 5. VISITA A FORNECEDOR */}
              {newType === 'VISITA_FORNECEDOR' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Fornecedor / Usina</Label>
                    <Input
                      placeholder="Ex: Gerdau Aços Longos Ouro Branco"
                      value={fornecName}
                      onChange={(e) => setFornecName(e.target.value)}
                      className="h-8 text-xs bg-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">
                      Código Fornecedor SAP
                    </Label>
                    <Input
                      placeholder="Ex: FORN-SAP-8820"
                      value={fornecSap}
                      onChange={(e) => setFornecSap(e.target.value)}
                      className="h-8 text-xs bg-white mt-1"
                    />
                  </div>
                </div>
              )}

              {/* 6. VISITA A PARCEIRO */}
              {newType === 'VISITA_PARCEIRO' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Nome do Parceiro</Label>
                    <Input
                      placeholder="Ex: Totvs / SAP / Parceiro de Engenharia"
                      value={parceiroName}
                      onChange={(e) => setParceiroName(e.target.value)}
                      className="h-8 text-xs bg-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">
                      Categoria do Parceiro
                    </Label>
                    <Select value={parceiroCat} onValueChange={setParceiroCat}>
                      <SelectTrigger className="h-8 text-xs bg-white mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TECNOLOGIA">Tecnologia & TI</SelectItem>
                        <SelectItem value="ENGENHARIA">Engenharia & Projetos</SelectItem>
                        <SelectItem value="COMERCIAL">Comercial & Vendas</SelectItem>
                        <SelectItem value="LOGISTICA">Logística & TMS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* 7. REEMBOLSO */}
              {newType === 'REEMBOLSO' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Tipo de Despesa</Label>
                    <Select value={reembolsoType} onValueChange={setReembolsoType}>
                      <SelectTrigger className="h-8 text-xs bg-white mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALIMENTACAO">Alimentação</SelectItem>
                        <SelectItem value="COMBUSTIVEL">Combustível</SelectItem>
                        <SelectItem value="TRANSPORTE">Transporte / Táxi / Uber</SelectItem>
                        <SelectItem value="HOSPEDAGEM">Hospedagem</SelectItem>
                        <SelectItem value="PEDAGIO">Pedágio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">
                      Viagem Relacionada (Código)
                    </Label>
                    <Input
                      placeholder="Ex: SOL-2024-001"
                      value={reembolsoTripCode}
                      onChange={(e) => setReembolsoTripCode(e.target.value)}
                      className="h-8 text-xs bg-white mt-1"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* JUSTIFICATIVA */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Justificativa Corporativa *
              </Label>
              <Textarea
                placeholder="Descreva o motivo, impacto comercial/operacional e retorno esperado para a CIAFAL..."
                value={newJustification}
                onChange={(e) => setNewJustification(e.target.value)}
                className="text-xs min-h-[70px]"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCreateRequest(false)}
              className="text-xs"
            >
              Salvar como Rascunho
            </Button>
            <Button
              size="sm"
              onClick={() => handleCreateRequest(true)}
              className="text-xs bg-primary text-white gap-1.5"
            >
              <Send className="w-3.5 h-3.5" /> Enviar para Aprovação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: DETALHES, AUDITORIA & WORKFLOW ENGINE */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl">
          {selectedRequest && (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                        {selectedRequest.code}
                      </span>
                      <Badge
                        className={cn(
                          'text-[10px] font-bold border-none',
                          REQUEST_TYPE_LABELS[selectedRequest.request_type].color,
                        )}
                      >
                        {REQUEST_TYPE_LABELS[selectedRequest.request_type].label}
                      </Badge>
                      <Badge
                        className={cn(
                          'text-[10px] font-bold border-none',
                          STATUS_CONFIG[selectedRequest.status].bg,
                          STATUS_CONFIG[selectedRequest.status].text,
                        )}
                      >
                        {STATUS_CONFIG[selectedRequest.status].label}
                      </Badge>
                    </div>
                    <DialogTitle className="font-serif text-xl font-bold text-primary mt-1">
                      {selectedRequest.title}
                    </DialogTitle>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      Valor
                    </span>
                    <span className="font-serif text-xl font-bold text-slate-900">
                      {formatBRL(selectedRequest.estimated_cost)}
                    </span>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 py-2">
                {/* ETAPAS DO WORKFLOW (PROGRESS BAR HIERÁRQUICO) */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-border/50">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-3">
                    Esteira de Aprovação Hierárquica (Identity Service)
                  </span>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div
                      className={cn(
                        'p-2.5 rounded-xl border',
                        selectedRequest.workflow_stage_index >= 1
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                          : 'bg-white border-border/40 text-muted-foreground',
                      )}
                    >
                      <span className="text-[10px] block opacity-70">1. Solicitante</span>
                      {selectedRequest.requester_name.split(' ')[0]}
                    </div>

                    <div
                      className={cn(
                        'p-2.5 rounded-xl border',
                        selectedRequest.workflow_stage_index >= 2
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                          : 'bg-white border-border/40 text-muted-foreground',
                      )}
                    >
                      <span className="text-[10px] block opacity-70">2. Gestor Imediato</span>
                      {selectedRequest.manager_name.split(' ')[0]}
                    </div>

                    <div
                      className={cn(
                        'p-2.5 rounded-xl border',
                        selectedRequest.workflow_stage_index >= 3
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                          : 'bg-white border-border/40 text-muted-foreground',
                      )}
                    >
                      <span className="text-[10px] block opacity-70">3. Diretoria / Área</span>
                      {selectedRequest.current_approver_role.split(' ')[0]}
                    </div>

                    <div
                      className={cn(
                        'p-2.5 rounded-xl border',
                        selectedRequest.workflow_stage_index >= 4
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                          : 'bg-white border-border/40 text-muted-foreground',
                      )}
                    >
                      <span className="text-[10px] block opacity-70">4. Conclusão / ERP</span>
                      Concluído
                    </div>
                  </div>
                </div>

                {/* DADOS GERAIS E PAYLOAD */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-white rounded-2xl border border-border/50 space-y-2">
                    <span className="font-bold text-slate-800 uppercase tracking-wider block">
                      Dados do Solicitante & Hierarquia
                    </span>
                    <div className="space-y-1 text-slate-600">
                      <div>
                        Solicitante: <strong>{selectedRequest.requester_name}</strong>
                      </div>
                      <div>
                        Matrícula TOTVS RM: <strong>{selectedRequest.matricula}</strong>
                      </div>
                      <div>
                        Departamento: <strong>{selectedRequest.department}</strong>
                      </div>
                      <div>
                        Centro de Custo: <strong>{selectedRequest.cost_center}</strong>
                      </div>
                      <div>
                        Gestor Imediato: <strong>{selectedRequest.manager_name}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-2xl border border-border/50 space-y-2">
                    <span className="font-bold text-slate-800 uppercase tracking-wider block">
                      Justificativa & Detalhes Operacionais
                    </span>
                    <p className="text-slate-700 leading-relaxed font-medium">
                      {selectedRequest.justification}
                    </p>
                    <div className="pt-2 border-t text-[11px] text-muted-foreground">
                      Prioridade: <strong>{selectedRequest.priority}</strong> · Criado em:{' '}
                      {new Date(selectedRequest.created_at).toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>

                {/* AÇÕES DE WORKFLOW PARA APROVADORES */}
                <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" /> Ações Operacionais de
                      Workflow
                    </span>
                    <Badge className="bg-primary/20 text-primary-foreground border-none text-[10px]">
                      Aprovador: {selectedRequest.current_approver_name}
                    </Badge>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      placeholder="Adicione um parecer ou justificativa da aprovação/rejeição..."
                      value={actionComment}
                      onChange={(e) => setActionComment(e.target.value)}
                      className="h-8 text-xs bg-slate-800 text-white border-slate-700"
                    />
                    <div className="flex items-center gap-2 shrink-0">
                      {selectedRequest.status === 'RASCUNHO' && (
                        <Button
                          size="sm"
                          onClick={() => handleWorkflowAction('SUBMETER')}
                          className="h-8 text-xs bg-primary text-white"
                        >
                          <Send className="w-3.5 h-3.5 mr-1" /> Submeter
                        </Button>
                      )}

                      {(selectedRequest.status === 'ENVIADO' ||
                        selectedRequest.status === 'EM_APROVACAO') && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleWorkflowAction('APROVAR')}
                            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Aprovar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleWorkflowAction('REJEITAR')}
                            className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Rejeitar
                          </Button>
                        </>
                      )}

                      {selectedRequest.status === 'APROVADO' && (
                        <Button
                          size="sm"
                          onClick={() => handleWorkflowAction('CONCLUIR')}
                          className="h-8 text-xs bg-emerald-700 text-white gap-1"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" /> Concluir & Integrar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* AUDIT LOG & COMENTÁRIOS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* AUDIT LOG IMUTÁVEL */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-border/50 space-y-3">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-primary" /> Trilha de Auditoria Imutável
                    </span>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {selectedRequest.audit_log.map((log) => (
                        <div
                          key={log.id}
                          className="p-2 bg-white rounded-xl border border-border/40 text-xs space-y-0.5"
                        >
                          <div className="flex items-center justify-between font-bold text-primary">
                            <span>{log.action}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600">
                            Por: {log.user_name} ({log.role || 'Usuário'})
                          </div>
                          {log.comments && (
                            <div className="text-[10px] text-muted-foreground italic">
                              "{log.comments}"
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* COMENTÁRIOS */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-border/50 space-y-3 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                        <MessageSquare className="w-3.5 h-3.5 text-primary" /> Comentários &
                        Despachos ({selectedRequest.comments.length})
                      </span>
                      <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                        {selectedRequest.comments.length === 0 ? (
                          <span className="text-xs text-muted-foreground italic">
                            Nenhum comentário registrado ainda.
                          </span>
                        ) : (
                          selectedRequest.comments.map((com) => (
                            <div
                              key={com.id}
                              className="p-2 bg-white rounded-xl border border-border/40 text-xs"
                            >
                              <div className="flex items-center justify-between font-bold text-slate-800 text-[11px]">
                                <span>{com.user_name}</span>
                                <span className="text-[10px] text-muted-foreground">
                                  {new Date(com.timestamp).toLocaleTimeString('pt-BR')}
                                </span>
                              </div>
                              <p className="text-slate-700 text-[11px] mt-0.5">{com.content}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="Escreva um comentário..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        className="h-8 text-xs bg-white"
                      />
                      <Button
                        size="sm"
                        onClick={handleAddComment}
                        className="h-8 text-xs bg-primary text-white shrink-0"
                      >
                        Enviar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDetailModalOpen(false)}
                  className="text-xs"
                >
                  Fechar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
