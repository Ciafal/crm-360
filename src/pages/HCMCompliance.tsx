import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/hooks/use-auth'
import {
  CompliancePolicyType,
  PolicyDocumentVersion,
  EmployeePolicyAcceptance,
  SignatureEnvelopeSummary,
  SignatureLevel,
  DigitalSignatureProviderType,
} from '@/types/models'
import { complianceService } from '@/services/compliance_service'
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
  Shield,
  ShieldCheck,
  ShieldAlert,
  FileCheck,
  FileText,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Plus,
  Eye,
  History,
  Lock,
  Download,
  Building2,
  Send,
  Sparkles,
  Layers,
  ArrowRight,
  Fingerprint,
  FileSignature,
  RotateCcw,
  Ban,
  Check,
  ExternalLink,
  HelpCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  SEGURANCA_INFORMACAO: { label: 'Segurança da Informação', color: 'bg-blue-100 text-blue-800' },
  CONDUTA_ETICA: { label: 'Código de Ética & Conduta', color: 'bg-emerald-100 text-emerald-800' },
  PRIVACIDADE_LGPD: { label: 'Privacidade & LGPD', color: 'bg-purple-100 text-purple-800' },
  RECURSOS_TI: { label: 'Recursos de TI & E-mail', color: 'bg-cyan-100 text-cyan-800' },
  COMUNICACAO_CORPORATIVA: {
    label: 'WhatsApp & Telefonia',
    color: 'bg-amber-100 text-amber-800',
  },
  EQUIPAMENTOS: { label: 'Termo de Equipamentos', color: 'bg-slate-100 text-slate-800' },
  INTELIGENCIA_ARTIFICIAL: { label: 'Diretrizes de IA', color: 'bg-indigo-100 text-indigo-800' },
  TREINAMENTO_OBRIGATORIO: {
    label: 'Treinamento Obrigatório',
    color: 'bg-rose-100 text-rose-800',
  },
  OUTROS: { label: 'Outras Políticas', color: 'bg-slate-100 text-slate-700' },
}

export default function HCMCompliance() {
  const { user } = useAuth()

  const [activeTab, setActiveTab] = useState('termos')
  const [policies, setPolicies] = useState<CompliancePolicyType[]>([])
  const [versions, setVersions] = useState<PolicyDocumentVersion[]>([])
  const [acceptances, setAcceptances] = useState<EmployeePolicyAcceptance[]>([])
  const [envelopes, setEnvelopes] = useState<SignatureEnvelopeSummary[]>([])
  const [kpis, setKpis] = useState({
    totalPolicies: 0,
    totalEmployees: 0,
    complianceRate: 0,
    validAcceptances: 0,
    pendingReacceptance: 0,
    digitalTotal: 0,
    digitalSigned: 0,
    digitalPending: 0,
    digitalExpired: 0,
    digitalCompletionRate: 0,
    avgSignatureDays: 1.6,
    overdueSignersCount: 0,
  })

  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('todos')
  const [envelopeStatusFilter, setEnvelopeStatusFilter] = useState('todos')
  const [envelopeDeptFilter, setEnvelopeDeptFilter] = useState('todos')

  // Modais
  const [readModalOpen, setReadModalOpen] = useState(false)
  const [selectedPolicy, setSelectedPolicy] = useState<CompliancePolicyType | null>(null)
  const [selectedVersion, setSelectedVersion] = useState<PolicyDocumentVersion | null>(null)
  const [isDigitalFlow, setIsDigitalFlow] = useState(false)

  const [newPolicyModalOpen, setNewPolicyModalOpen] = useState(false)
  const [newVersionModalOpen, setNewVersionModalOpen] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [envelopeToCancel, setEnvelopeToCancel] = useState<SignatureEnvelopeSummary | null>(null)
  const [cancelReason, setCancelReason] = useState('')

  // Form Nova Política
  const [newPolName, setNewPolName] = useState('')
  const [newPolCategory, setNewPolCategory] = useState<any>('SEGURANCA_INFORMACAO')
  const [newPolDesc, setNewPolDesc] = useState('')
  const [newPolValidity, setNewPolValidity] = useState(12)
  const [newPolMandatory, setNewPolMandatory] = useState(true)
  const [newPolReaccept, setNewPolReaccept] = useState(true)
  const [newPolSigLevel, setNewPolSigLevel] = useState<SignatureLevel>('ELECTRONIC')
  const [newPolProvider, setNewPolProvider] = useState<DigitalSignatureProviderType>('D4SIGN')
  const [newPolDeadlineDays, setNewPolDeadlineDays] = useState(7)

  // Form Nova Versão
  const [newVerNumber, setNewVerNumber] = useState('')
  const [newVerContent, setNewVerContent] = useState('')

  // Aceite
  const [acceptConfirmed, setAcceptConfirmed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadData = async () => {
    const pols = await complianceService.listPolicies()
    const vers = await complianceService.listVersions()
    const accs = await complianceService.listAcceptances()
    const envs = await complianceService.listDigitalEnvelopes()
    const stats = await complianceService.getComplianceKpis()

    setPolicies(pols)
    setVersions(vers)
    setAcceptances(accs)
    setEnvelopes(envs)
    setKpis(stats)
  }

  useEffect(() => {
    loadData()
  }, [])

  // Filtros de Políticas
  const filteredPolicies = useMemo(() => {
    return policies.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchCat = categoryFilter === 'todos' || p.category === categoryFilter
      return matchSearch && matchCat
    })
  }, [policies, searchTerm, categoryFilter])

  // Filtros de Envelopes Digitais
  const filteredEnvelopes = useMemo(() => {
    return envelopes.filter((env) => {
      const matchSearch =
        env.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        env.employee_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        env.policy_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        env.envelope_id.toLowerCase().includes(searchTerm.toLowerCase())
      const matchStatus = envelopeStatusFilter === 'todos' || env.status === envelopeStatusFilter
      const matchDept =
        envelopeDeptFilter === 'todos' || env.employee_department === envelopeDeptFilter
      return matchSearch && matchStatus && matchDept
    })
  }, [envelopes, searchTerm, envelopeStatusFilter, envelopeDeptFilter])

  // Identifica pendências de aceite para o usuário logado
  const myPendingPolicies = useMemo(() => {
    return policies.filter((p) => {
      if (!p.is_mandatory) return false
      const hasAccepted = acceptances.some(
        (a) =>
          (a.employee_email === user?.email || a.employee_id === user?.id) &&
          a.policy_id === p.id &&
          a.policy_version === p.current_version &&
          (a.status === 'EM_CONFORMIDADE' || a.status === 'SIGNED'),
      )
      return !hasAccepted
    })
  }, [policies, acceptances, user])

  // Abrir modal de leitura e aceite de termo
  const handleOpenReadTerm = (policy: CompliancePolicyType) => {
    setSelectedPolicy(policy)
    setIsDigitalFlow(policy.signature_level === 'DIGITAL')

    const ver =
      versions.find((v) => v.policy_id === policy.id && v.version === policy.current_version) ||
      ({
        id: `gen-${policy.id}`,
        policy_id: policy.id,
        policy_name: policy.name,
        version: policy.current_version,
        effective_date: new Date().toISOString().split('T')[0],
        status: 'PUBLICADO',
        content_markdown: `# ${policy.name}
**Versão ${policy.current_version} — Publicada no HUB CIAFAL**

1. **Objetivo & Aplicabilidade**
Este documento estabelece as diretrizes normativas da CIAFAL para ${policy.description.toLowerCase()}

2. **Deveres e Responsabilidades**
Todos os colaboradores devem zelar pelo estrito cumprimento das regras operacionais, garantindo sigilo, integridade e conformidade com as normas do SGQ, LGPD e Código de Conduta.

3. **Validade e Versionamento**
Validade vigente de ${policy.validity_months} meses a partir da data de publicação.`,
        document_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        created_by: 'Governança & Compliance CIAFAL',
        approved_by: 'Diretoria Executiva',
        approved_at: new Date().toISOString(),
      } as PolicyDocumentVersion)

    setSelectedVersion(ver)
    setAcceptConfirmed(false)
    setReadModalOpen(true)
  }

  // Confirmar Assinatura (Eletrônica Simples ou Iniciar Envelope Digital)
  const handleConfirmAction = async () => {
    if (!selectedPolicy || !selectedVersion) return
    if (!acceptConfirmed) {
      toast.error('Marque a declaração de ciência e concordância para prosseguir.')
      return
    }

    setIsSubmitting(true)
    try {
      const empId = user?.id || 'usr-carlos'
      const empMatricula = user?.employee_id || 'TOTVS-8801'
      const empName = user?.name || 'Carlos Mendonça'
      const empEmail = user?.email || 'carlos.mendonca@ciafal.com.br'
      const empDept = user?.department || 'Comercial — Vendas Minas'
      const empRole = user?.cargo || 'Vendedor Sênior'

      if (selectedPolicy.signature_level === 'DIGITAL') {
        // Fluxo DIGITAL: Inicia envelope no provider configurado (D4Sign / DocuSign)
        const acc = await complianceService.initiateDigitalSignatureEnvelope(
          empId,
          empMatricula,
          empName,
          empEmail,
          empDept,
          empRole,
          selectedPolicy.id,
          selectedVersion.version,
        )

        toast.success(
          `Envelope digital gerado no ${acc.provider || 'D4Sign'}! Notificação enviada para ${empEmail}.`,
        )
      } else {
        // Fluxo ELECTRONIC: Aceite eletrônico direto com hash SHA-256
        await complianceService.registerAcceptance(
          empId,
          empMatricula,
          empName,
          empEmail,
          empDept,
          empRole,
          selectedPolicy.id,
          selectedVersion.version,
          selectedVersion.document_hash,
        )
        toast.success(`Aceite eletrônico registrado com sucesso para ${selectedPolicy.name}!`)
      }

      setReadModalOpen(false)
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao processar assinatura.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Simular Assinatura Digital do Envelope (MOCK QAS)
  const handleSimulateSign = async (envId: string) => {
    try {
      await complianceService.simulateSignEnvelope(envId)
      toast.success(
        `Simulação QAS: Documento assinado digitalmente com sucesso! Callback/Webhook processado.`,
      )
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao simular assinatura.')
    }
  }

  // Reenviar Notificação de Envelope
  const handleResend = async (envId: string) => {
    try {
      const res = await complianceService.resendEnvelope(envId)
      toast.success(res.message)
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao reenviar envelope.')
    }
  }

  // Confirmar Cancelamento de Envelope
  const handleConfirmCancel = async () => {
    if (!envelopeToCancel) return
    try {
      const res = await complianceService.cancelEnvelope(envelopeToCancel.envelope_id, cancelReason)
      toast.success(res.message)
      setCancelModalOpen(false)
      setEnvelopeToCancel(null)
      setCancelReason('')
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao cancelar envelope.')
    }
  }

  // Criar Nova Política
  const handleCreatePolicy = async () => {
    if (!newPolName || !newPolDesc) {
      toast.error('Preencha o nome e a descrição do termo/política.')
      return
    }

    await complianceService.createPolicy({
      name: newPolName,
      category: newPolCategory,
      description: newPolDesc,
      current_version: 'v1.0',
      validity_months: newPolValidity,
      is_mandatory: newPolMandatory,
      target_audience: 'TODOS',
      requires_reacceptance_on_new_version: newPolReaccept,
      status: 'ATIVO',
      signature_level: newPolSigLevel,
      digital_signature_provider: newPolProvider,
      signature_deadline_days: newPolDeadlineDays,
    })

    toast.success('Novo termo/política cadastrado no HCM Governança & Compliance!')
    setNewPolicyModalOpen(false)
    setNewPolName('')
    setNewPolDesc('')
    loadData()
  }

  // Criar Nova Versão de Política
  const handleCreateNewVersion = async () => {
    if (!selectedPolicy || !newVerNumber || !newVerContent) {
      toast.error('Informe o número da versão e o conteúdo markdown do documento.')
      return
    }

    await complianceService.createNewVersion(
      selectedPolicy.id,
      newVerNumber,
      newVerContent,
      user?.name || 'Diretoria de Governança',
    )

    toast.success(`Nova versão ${newVerNumber} publicada para ${selectedPolicy.name}!`)
    setNewVersionModalOpen(false)
    setNewVerNumber('')
    setNewVerContent('')
    loadData()
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in pb-16">
      {/* HEADER EXECUTIVO COM BADGE MOCK */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-100 rounded-2xl">
              <ShieldCheck className="w-6 h-6 text-emerald-800" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-serif text-3xl font-bold text-primary tracking-tight">
                  HCM — Governança & Compliance do Colaborador
                </h1>
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs">
                  Assinatura Digital & Aceite Eletrônico
                </Badge>
                <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[11px] font-bold">
                  MOCK — Ambiente de Homologação (QAS)
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Gestão integrada de termos, políticas corporativas, envelopes digitais (D4Sign /
                DocuSign) e conformidade funcional auditável (TOTVS RM).
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setNewPolicyModalOpen(true)}
            className="h-9 gap-1.5 text-xs bg-primary text-white shadow-xs"
          >
            <Plus className="w-4 h-4" /> Novo Termo / Política
          </Button>
        </div>
      </div>

      {/* COCKPIT DE INDICADORES DE CONFORMIDADE & ASSINATURAS DIGITAIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white/95 backdrop-blur-md border-border/40 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Índice Geral de Conformidade
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <span className="font-serif text-3xl font-bold text-emerald-700 block">
              {kpis.complianceRate}%
            </span>
            <span className="text-[11px] text-muted-foreground">
              Colaboradores com termos vigentes
            </span>
          </div>
        </Card>

        <Card className="bg-white/95 backdrop-blur-md border-border/40 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
              Assinaturas Digitais (D4Sign/DocuSign)
            </span>
            <FileSignature className="w-4 h-4 text-primary" />
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-3xl font-bold text-primary block">
                {kpis.digitalCompletionRate}%
              </span>
              <span className="text-xs font-semibold text-slate-600">
                ({kpis.digitalSigned}/{kpis.digitalTotal} concluídas)
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground">
              {kpis.digitalPending} envelopes aguardando assinatura
            </span>
          </div>
        </Card>

        <Card className="bg-white/95 backdrop-blur-md border-border/40 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
              Prazo Médio de Assinatura
            </span>
            <Clock className="w-4 h-4 text-slate-600" />
          </div>
          <div className="mt-2">
            <span className="font-serif text-3xl font-bold text-slate-900 block">
              {kpis.avgSignatureDays} dias
            </span>
            <span className="text-[11px] text-muted-foreground">
              {kpis.overdueSignersCount} pendência(s) há mais de 3 dias
            </span>
          </div>
        </Card>

        <Card className="bg-white/95 backdrop-blur-md border-border/40 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              Minhas Pendências
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2">
            <span className="font-serif text-3xl font-bold text-amber-700 block">
              {myPendingPolicies.length}
            </span>
            <span className="text-[11px] text-amber-800">Termos aguardando sua assinatura</span>
          </div>
        </Card>
      </div>

      {/* BANNER SE HOUVER PENDÊNCIA PARA O USUÁRIO ATUAL */}
      {myPendingPolicies.length > 0 && (
        <Card className="bg-amber-50/80 border-amber-200 rounded-3xl p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-xl text-amber-800 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-amber-900">
                  Você possui {myPendingPolicies.length} documento(s) com assinatura pendente
                </h4>
                <p className="text-xs text-amber-700">
                  {myPendingPolicies[0].signature_level === 'DIGITAL'
                    ? `O termo "${myPendingPolicies[0].name}" exige Assinatura Digital Externa com validade jurídica via ${myPendingPolicies[0].digital_signature_provider || 'D4Sign'}.`
                    : `O termo "${myPendingPolicies[0].name}" aguarda seu aceite eletrônico interno.`}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => handleOpenReadTerm(myPendingPolicies[0])}
              className="bg-amber-700 hover:bg-amber-800 text-white text-xs gap-1.5 shrink-0"
            >
              {myPendingPolicies[0].signature_level === 'DIGITAL' ? (
                <>
                  <FileSignature className="w-3.5 h-3.5" /> Assinar Digitalmente
                </>
              ) : (
                <>
                  <FileCheck className="w-3.5 h-3.5" /> Assinar Eletronicamente
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* ABAS DO MÓDULO */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-3">
          <TabsList className="bg-slate-100 p-1 rounded-2xl h-auto gap-1">
            <TabsTrigger
              value="termos"
              className="data-[state=active]:bg-white data-[state=active]:text-primary rounded-xl px-4 py-2 text-xs font-semibold"
            >
              Termos & Políticas ({policies.length})
            </TabsTrigger>
            <TabsTrigger
              value="envelopes"
              className="data-[state=active]:bg-white data-[state=active]:text-primary rounded-xl px-4 py-2 text-xs font-semibold"
            >
              <FileSignature className="w-3.5 h-3.5 mr-1.5" /> Assinaturas Digitais (
              {envelopes.length})
            </TabsTrigger>
            <TabsTrigger
              value="pendencias"
              className="data-[state=active]:bg-white data-[state=active]:text-amber-800 rounded-xl px-4 py-2 text-xs font-semibold"
            >
              Minhas Pendências ({myPendingPolicies.length})
            </TabsTrigger>
            <TabsTrigger
              value="aceites"
              className="data-[state=active]:bg-white data-[state=active]:text-primary rounded-xl px-4 py-2 text-xs font-semibold"
            >
              Trilha de Auditoria ({acceptances.length})
            </TabsTrigger>
            <TabsTrigger
              value="relatorios"
              className="data-[state=active]:bg-white data-[state=active]:text-primary rounded-xl px-4 py-2 text-xs font-semibold"
            >
              Cockpit & Auditoria
            </TabsTrigger>
          </TabsList>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar política ou colaborador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 pl-8 text-xs bg-white rounded-xl"
              />
            </div>

            {activeTab === 'termos' && (
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-8 text-xs bg-white rounded-xl w-44">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as Categorias</SelectItem>
                  <SelectItem value="SEGURANCA_INFORMACAO">Segurança da Informação</SelectItem>
                  <SelectItem value="CONDUTA_ETICA">Ética & Conduta</SelectItem>
                  <SelectItem value="PRIVACIDADE_LGPD">Privacidade & LGPD</SelectItem>
                  <SelectItem value="COMUNICACAO_CORPORATIVA">WhatsApp & Telefonia</SelectItem>
                  <SelectItem value="INTELIGENCIA_ARTIFICIAL">Inteligência Artificial</SelectItem>
                  <SelectItem value="EQUIPAMENTOS">Equipamentos</SelectItem>
                </SelectContent>
              </Select>
            )}

            {activeTab === 'envelopes' && (
              <>
                <Select value={envelopeStatusFilter} onValueChange={setEnvelopeStatusFilter}>
                  <SelectTrigger className="h-8 text-xs bg-white rounded-xl w-36">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos Status</SelectItem>
                    <SelectItem value="sent">Enviado</SelectItem>
                    <SelectItem value="viewed">Visualizado</SelectItem>
                    <SelectItem value="signed">Assinado</SelectItem>
                    <SelectItem value="declined">Recusado</SelectItem>
                    <SelectItem value="expired">Expirado</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={envelopeDeptFilter} onValueChange={setEnvelopeDeptFilter}>
                  <SelectTrigger className="h-8 text-xs bg-white rounded-xl w-44">
                    <SelectValue placeholder="Departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos Setores</SelectItem>
                    <SelectItem value="Comercial — Vendas Minas">Comercial — Minas</SelectItem>
                    <SelectItem value="Qualidade & SGQ">Qualidade & SGQ</SelectItem>
                    <SelectItem value="Controladoria & Finanças">Controladoria</SelectItem>
                    <SelectItem value="Logística & Pátio">Logística & Pátio</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </div>

        {/* ABA 1: LISTA DE TERMOS & POLÍTICAS */}
        <TabsContent value="termos" className="m-0 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPolicies.map((pol) => {
              const catCfg = CATEGORY_LABELS[pol.category] || CATEGORY_LABELS.OUTROS
              const isPendingForMe = myPendingPolicies.some((p) => p.id === pol.id)
              const isDigital = pol.signature_level === 'DIGITAL'

              return (
                <Card
                  key={pol.id}
                  className="bg-white/95 backdrop-blur-md border-border/40 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge className={cn('text-[10px] font-bold border-none', catCfg.color)}>
                          {catCfg.label}
                        </Badge>
                        {isDigital ? (
                          <Badge className="bg-purple-100 text-purple-900 border-purple-300 border text-[10px] font-bold gap-1">
                            <FileSignature className="w-3 h-3" /> Assinatura Digital (
                            {pol.digital_signature_provider || 'D4SIGN'})
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-700 text-[10px] font-medium border">
                            Aceite Eletrônico
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-slate-700 px-2 py-0.5 rounded bg-slate-100">
                          {pol.current_version}
                        </span>
                        {pol.is_mandatory && (
                          <Badge className="bg-rose-100 text-rose-800 text-[10px] font-bold border-none">
                            Obrigatório
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-serif font-bold text-base text-primary">{pol.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {pol.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground border-t pt-2">
                      <span>
                        Validade: <strong>{pol.validity_months} meses</strong>
                      </span>
                      <span>
                        Público: <strong>{pol.target_audience}</strong>
                      </span>
                      {isDigital && (
                        <span>
                          Prazo para assinar:{' '}
                          <strong>{pol.signature_deadline_days || 7} dias</strong>
                        </span>
                      )}
                      <span>
                        Reaceite na nova versão:{' '}
                        <strong>{pol.requires_reacceptance_on_new_version ? 'Sim' : 'Não'}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-4 border-t mt-4">
                    {isPendingForMe ? (
                      <Badge className="bg-amber-100 text-amber-800 text-[10px] font-bold border-none gap-1">
                        <Clock className="w-3 h-3" /> Pendente de Assinatura
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold border-none gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Em Conformidade
                      </Badge>
                    )}

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs text-primary gap-1"
                        onClick={() => {
                          setSelectedPolicy(pol)
                          setNewVersionModalOpen(true)
                        }}
                      >
                        <History className="w-3 h-3" /> Nova Versão
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 text-xs bg-primary text-white gap-1"
                        onClick={() => handleOpenReadTerm(pol)}
                      >
                        {isDigital ? (
                          <>
                            <FileSignature className="w-3.5 h-3.5" /> Visualizar & Envelope
                          </>
                        ) : (
                          <>
                            <FileCheck className="w-3.5 h-3.5" /> Visualizar & Assinar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* ABA 2: GERENCIAMENTO DE ASSINATURAS DIGITAIS (ENVELOPES D4SIGN/DOCUSIGN) */}
        <TabsContent value="envelopes" className="m-0 space-y-4">
          <Card className="p-5 bg-white rounded-3xl border-border/40 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-bold text-base text-primary">
                    Painel de Envelopes & Assinaturas Digitais Externas
                  </h3>
                  <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[10px] font-bold">
                    MOCK — QAS
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Acompanhamento de envelopes jurídicos gerados via D4Sign e DocuSign para NDAs,
                  cautelas de equipamentos e termos executivos com webhook em tempo real.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b text-[11px] font-bold text-muted-foreground uppercase">
                    <th className="py-2.5 px-3">Colaborador / Signatário</th>
                    <th className="py-2.5 px-3">Documento & Versão</th>
                    <th className="py-2.5 px-3">Provedor & ID Envelope</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Datas & Prazos</th>
                    <th className="py-2.5 px-3">Integridade SHA-256</th>
                    <th className="py-2.5 px-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEnvelopes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-muted-foreground">
                        Nenhum envelope encontrado com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredEnvelopes.map((env) => (
                      <tr key={env.envelope_id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-3">
                          <strong className="text-slate-900 block">{env.employee_name}</strong>
                          <span className="text-[10px] text-muted-foreground block">
                            {env.employee_email}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {env.employee_matricula} · {env.employee_department}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <strong className="text-primary block">{env.policy_name}</strong>
                          <span className="font-mono text-[10px] text-slate-600">
                            Versão: {env.policy_version}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <Badge
                            className={cn(
                              'text-[10px] font-bold border-none mb-1',
                              env.provider === 'D4SIGN'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800',
                            )}
                          >
                            {env.provider}
                          </Badge>
                          <code className="block font-mono text-[10px] text-muted-foreground">
                            {env.envelope_id.length > 18
                              ? env.envelope_id.substring(0, 18) + '...'
                              : env.envelope_id}
                          </code>
                        </td>
                        <td className="py-3 px-3">
                          {env.status === 'signed' && (
                            <Badge className="bg-emerald-100 text-emerald-800 text-[10px] border-none font-bold gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Assinado
                            </Badge>
                          )}
                          {env.status === 'sent' && (
                            <Badge className="bg-amber-100 text-amber-800 text-[10px] border-none font-bold gap-1">
                              <Clock className="w-3 h-3" /> Enviado (Pendente)
                            </Badge>
                          )}
                          {env.status === 'viewed' && (
                            <Badge className="bg-blue-100 text-blue-800 text-[10px] border-none font-bold gap-1">
                              <Eye className="w-3 h-3" /> Visualizado
                            </Badge>
                          )}
                          {env.status === 'declined' && (
                            <Badge className="bg-rose-100 text-rose-800 text-[10px] border-none font-bold gap-1">
                              <Ban className="w-3 h-3" /> Recusado/Cancelado
                            </Badge>
                          )}
                          {env.status === 'expired' && (
                            <Badge className="bg-slate-100 text-slate-700 text-[10px] border font-bold gap-1">
                              <Clock className="w-3 h-3" /> Prazo Expirado
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-600 text-[11px]">
                          {env.signed_at ? (
                            <span>
                              Assinado em: {new Date(env.signed_at).toLocaleDateString('pt-BR')}
                            </span>
                          ) : (
                            <span className="text-amber-800">
                              Expira em:{' '}
                              {env.expires_at
                                ? new Date(env.expires_at).toLocaleDateString('pt-BR')
                                : '7 dias'}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono text-[10px] text-muted-foreground">
                          {env.signature_hash ? (
                            <span className="text-emerald-700 font-semibold block">
                              SIG: {env.signature_hash.substring(0, 14)}...
                            </span>
                          ) : (
                            <span>DOC: {env.document_hash.substring(0, 14)}...</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {env.status !== 'signed' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-[10px] px-2 text-emerald-700 border-emerald-300"
                                  onClick={() => handleSimulateSign(env.envelope_id)}
                                  title="Simular callback de assinatura digital do colaborador (MOCK QAS)"
                                >
                                  <Check className="w-3 h-3 mr-1" /> Simular Assinatura (QAS)
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-slate-600"
                                  onClick={() => handleResend(env.envelope_id)}
                                  title="Reenviar notificação de assinatura"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-rose-600"
                                  onClick={() => {
                                    setEnvelopeToCancel(env)
                                    setCancelModalOpen(true)
                                  }}
                                  title="Cancelar / Revogar envelope"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                </Button>
                              </>
                            )}
                            {env.status === 'signed' && env.signed_document_url && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[10px] px-2 text-primary gap-1"
                                onClick={() => {
                                  toast.success(
                                    `Download iniciado para o documento auditado com assinatura ${env.provider}!`,
                                  )
                                }}
                              >
                                <Download className="w-3 h-3" /> Baixar PDF Assinado
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* ABA 3: MINHAS PENDÊNCIAS */}
        <TabsContent value="pendencias" className="m-0 space-y-3">
          {myPendingPolicies.length === 0 ? (
            <Card className="p-12 text-center bg-white rounded-3xl border-border/40">
              <ShieldCheck className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
              <h3 className="font-serif font-bold text-lg text-slate-800">
                Parabéns! Você está 100% em conformidade
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Todos os termos, políticas corporativas e acordos do colaborador estão assinados e
                vigentes.
              </p>
            </Card>
          ) : (
            myPendingPolicies.map((pol) => {
              const isDigital = pol.signature_level === 'DIGITAL'
              return (
                <Card
                  key={pol.id}
                  className="p-5 bg-white rounded-3xl border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-amber-100 text-amber-800 text-[10px] font-bold border-none">
                        Pendente de Assinatura
                      </Badge>
                      {isDigital ? (
                        <Badge className="bg-purple-100 text-purple-900 border-purple-300 border text-[10px] font-bold">
                          Exige Assinatura Digital Externa (
                          {pol.digital_signature_provider || 'D4Sign'})
                        </Badge>
                      ) : (
                        <Badge className="bg-slate-100 text-slate-700 text-[10px]">
                          Aceite Eletrônico Interno
                        </Badge>
                      )}
                      <span className="font-mono text-xs font-bold text-slate-700">
                        {pol.current_version}
                      </span>
                    </div>
                    <h4 className="font-serif font-bold text-base text-primary mt-1">{pol.name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{pol.description}</p>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleOpenReadTerm(pol)}
                    className="bg-primary text-white text-xs gap-1.5 shrink-0 h-9"
                  >
                    {isDigital ? (
                      <>
                        <FileSignature className="w-4 h-4" /> Ler e Gerar Envelope Digital
                      </>
                    ) : (
                      <>
                        <FileCheck className="w-4 h-4" /> Ler e Aceitar Termo
                      </>
                    )}
                  </Button>
                </Card>
              )
            })
          )}
        </TabsContent>

        {/* ABA 4: TRILHA DE AUDITORIA & REGISTRO IMUTÁVEL */}
        <TabsContent value="aceites" className="m-0 space-y-3">
          <Card className="p-5 bg-white rounded-3xl border-border/40 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif font-bold text-base text-primary">
                  Registro Imutável de Aceites & Assinaturas Digitais
                </h3>
                <p className="text-xs text-muted-foreground">
                  Evidências auditáveis com carimbo de data/hora, IP de origem, dispositivo,
                  provider e hash SHA-256 em conformidade com a MP 2.200-2 e LGPD.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b text-[11px] font-bold text-muted-foreground uppercase">
                    <th className="py-2.5 px-3">Colaborador (TOTVS RM)</th>
                    <th className="py-2.5 px-3">Documento / Política</th>
                    <th className="py-2.5 px-3">Nível & Provedor</th>
                    <th className="py-2.5 px-3">Data / Hora</th>
                    <th className="py-2.5 px-3">Contexto & IP</th>
                    <th className="py-2.5 px-3">Hash de Assinatura / Integridade</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {acceptances.map((acc) => (
                    <tr key={acc.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-3">
                        <strong className="text-slate-900 block">{acc.employee_name}</strong>
                        <span className="text-[10px] text-muted-foreground">
                          {acc.employee_matricula} · {acc.employee_department}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <strong className="text-primary block">{acc.policy_name}</strong>
                        <span className="font-mono text-[10px] text-slate-600">
                          {acc.policy_version}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {acc.signature_level === 'DIGITAL' ? (
                          <Badge className="bg-purple-100 text-purple-900 text-[10px] font-bold border-none">
                            DIGITAL ({acc.provider || 'D4SIGN'})
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-800 text-[10px] font-medium border">
                            ELETRÔNICO
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {acc.accepted_at
                          ? new Date(acc.accepted_at).toLocaleString('pt-BR')
                          : 'Aguardando'}
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">
                        <span className="font-mono text-[10px] block text-slate-800">
                          {acc.ip_address || '177.136.22.90'}
                        </span>
                        <span className="text-[10px] truncate max-w-[140px] block">
                          {acc.device_context}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[10px] text-muted-foreground">
                        {acc.acceptance_hash
                          ? acc.acceptance_hash.substring(0, 18) + '...'
                          : acc.envelope_id || '---'}
                      </td>
                      <td className="py-3 px-3">
                        {acc.status === 'EM_CONFORMIDADE' || acc.status === 'SIGNED' ? (
                          <Badge className="bg-emerald-100 text-emerald-800 text-[10px] border-none font-bold">
                            Assinado / Conforme
                          </Badge>
                        ) : acc.status === 'PENDING_SIGNATURE' ? (
                          <Badge className="bg-amber-100 text-amber-800 text-[10px] border-none font-bold">
                            Aguardando Assinatura
                          </Badge>
                        ) : (
                          <Badge className="bg-rose-100 text-rose-800 text-[10px] border-none font-bold">
                            {acc.status}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* ABA 5: COCKPIT & AUDITORIA */}
        <TabsContent value="relatorios" className="m-0 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-5 bg-white rounded-3xl border-border/40 shadow-xs space-y-3">
              <h3 className="font-serif font-bold text-base text-primary">
                Conformidade & Assinaturas por Departamento
              </h3>
              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between font-medium mb-1">
                    <span>Comercial & Vendas (Minas & SP)</span>
                    <strong className="text-emerald-700">92% Conforme</strong>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full" style={{ width: '92%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-medium mb-1">
                    <span>Engenharia & Qualidade SGQ</span>
                    <strong className="text-emerald-700">100% Conforme</strong>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-medium mb-1">
                    <span>Logística & Pátio Betim</span>
                    <strong className="text-amber-700">84% Conforme</strong>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: '84%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-medium mb-1">
                    <span>Administrativo & Controladoria</span>
                    <strong className="text-emerald-700">96% Conforme</strong>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full" style={{ width: '96%' }} />
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-5 bg-white rounded-3xl border-border/40 shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <h3 className="font-serif font-bold text-base text-primary">
                  Exportação & Dossiê para Auditoria Externa
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Gere o dossiê consolidado de aceites eletrônicos e certificados digitais D4Sign /
                  DocuSign para auditorias ISO 9001 / SGQ, auditoria contábil e fiscalização LGPD.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    toast.success('Dossiê consolidado de conformidade PDF gerado com sucesso!')
                  }
                  className="text-xs text-primary gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Exportar Relatório PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    toast.success('Trilha completa de auditoria com hashes SHA-256 exportada!')
                  }
                  className="text-xs text-slate-700 gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Exportar Auditoria CSV
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* MODAL: LEITURA E ASSINATURA ELETRÔNICA / DIGITAL */}
      <Dialog open={readModalOpen} onOpenChange={setReadModalOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl">
          {selectedPolicy && selectedVersion && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-primary/10 text-primary border-none text-[10px] font-bold">
                        {CATEGORY_LABELS[selectedPolicy.category]?.label || 'Políticas'}
                      </Badge>
                      <span className="font-mono text-xs font-bold text-slate-700 px-2 py-0.5 rounded bg-slate-100">
                        Versão {selectedVersion.version}
                      </span>
                      {isDigitalFlow ? (
                        <Badge className="bg-purple-100 text-purple-900 border-purple-300 border text-[10px] font-bold">
                          Assinatura Digital (
                          {selectedPolicy.digital_signature_provider || 'D4Sign'})
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold border-none">
                          Aceite Eletrônico Interno
                        </Badge>
                      )}
                    </div>
                    <DialogTitle className="font-serif text-xl font-bold text-primary mt-1">
                      {selectedPolicy.name}
                    </DialogTitle>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* AVISO DO TIPO DE ASSINATURA */}
                {isDigitalFlow ? (
                  <div className="p-3.5 bg-purple-50 rounded-2xl border border-purple-200 text-xs text-purple-950 space-y-1">
                    <strong className="block font-bold">
                      Documento com Requisito de Validade Jurídica Externa (MP 2.200-2 / ICP-Brasil)
                    </strong>
                    <p className="text-purple-900">
                      Ao confirmar, o sistema criará um envelope digital no provedor{' '}
                      <strong>{selectedPolicy.digital_signature_provider || 'D4Sign'}</strong> e
                      enviará o link de assinatura para o seu e-mail funcional (
                      <code>{user?.email || 'carlos.mendonca@ciafal.com.br'}</code>).
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700">
                    Documento interno de governança corporativa com aceite eletrônico imutável via
                    hash SHA-256 e registro de sessão autenticada.
                  </div>
                )}

                {/* ÁREA DE LEITURA DO DOCUMENTO */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-border/60 max-h-80 overflow-y-auto prose prose-sm text-xs leading-relaxed text-slate-800 whitespace-pre-line">
                  {selectedVersion.content_markdown}
                </div>

                {/* HASH E METADADOS DO DOCUMENTO */}
                <div className="p-3 bg-white rounded-xl border border-border/50 text-[11px] text-muted-foreground flex flex-wrap items-center justify-between gap-2">
                  <span>
                    Aprovado por: <strong>{selectedVersion.approved_by}</strong>
                  </span>
                  <span className="font-mono">
                    SHA-256:{' '}
                    {selectedVersion.document_hash
                      ? selectedVersion.document_hash.substring(0, 24) + '...'
                      : '---'}
                  </span>
                  <span>Vigência: {selectedPolicy.validity_months} meses</span>
                </div>

                {/* CHECKBOX DE CIÊNCIA E ACEITE */}
                <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 space-y-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptConfirmed}
                      onChange={(e) => setAcceptConfirmed(e.target.checked)}
                      className="mt-1 rounded text-primary focus:ring-primary w-4 h-4"
                    />
                    <div className="text-xs text-emerald-950 leading-tight">
                      <strong className="block font-bold mb-0.5">
                        Declaro ciência integral e aceito as condições deste documento corporativo
                      </strong>
                      Declaro que li integralmente todas as cláusulas e comprometo-me ao seu estrito
                      cumprimento.
                    </div>
                  </label>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReadModalOpen(false)}
                  className="text-xs"
                >
                  Fechar
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirmAction}
                  disabled={!acceptConfirmed || isSubmitting}
                  className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5"
                >
                  {isDigitalFlow ? (
                    <>
                      <FileSignature className="w-4 h-4" /> Criar Envelope Digital (
                      {selectedPolicy.digital_signature_provider || 'D4Sign'})
                    </>
                  ) : (
                    <>
                      <Fingerprint className="w-4 h-4" /> Assinar Eletronicamente (QAS)
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL: CANCELAR ENVELOPE */}
      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-bold text-rose-700 flex items-center gap-2">
              <Ban className="w-5 h-5" /> Cancelar Envelope Digital
            </DialogTitle>
            <DialogDescription className="text-xs">
              Tem certeza que deseja cancelar o envelope para{' '}
              <strong>{envelopeToCancel?.employee_name}</strong>? O documento perderá a validade de
              assinatura externa no {envelopeToCancel?.provider}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs font-bold text-slate-700">Motivo do Cancelamento</Label>
              <Input
                placeholder="Ex: Atualização cadastral ou reemissão do termo"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="h-9 text-xs mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelModalOpen(false)}
              className="text-xs"
            >
              Voltar
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmCancel}
              className="text-xs bg-rose-700 hover:bg-rose-800 text-white gap-1"
            >
              <Ban className="w-3.5 h-3.5" /> Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: NOVO TERMO / POLÍTICA */}
      <Dialog open={newPolicyModalOpen} onOpenChange={setNewPolicyModalOpen}>
        <DialogContent className="sm:max-w-xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-primary flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" /> Cadastrar Novo Termo / Política
            </DialogTitle>
            <DialogDescription className="text-xs">
              Adicione um novo documento normativo ou com validade jurídica ao cadastro HCM.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs font-bold text-slate-700">Nome do Termo / Política *</Label>
              <Input
                placeholder="Ex: Termo de Sigilo e Não Concorrência Comercial"
                value={newPolName}
                onChange={(e) => setNewPolName(e.target.value)}
                className="h-9 text-xs mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-slate-700">Categoria *</Label>
                <Select value={newPolCategory} onValueChange={setNewPolCategory}>
                  <SelectTrigger className="h-9 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SEGURANCA_INFORMACAO">Segurança da Informação</SelectItem>
                    <SelectItem value="CONDUTA_ETICA">Ética & Conduta</SelectItem>
                    <SelectItem value="PRIVACIDADE_LGPD">Privacidade & LGPD</SelectItem>
                    <SelectItem value="COMUNICACAO_CORPORATIVA">WhatsApp & Telefonia</SelectItem>
                    <SelectItem value="INTELIGENCIA_ARTIFICIAL">Inteligência Artificial</SelectItem>
                    <SelectItem value="EQUIPAMENTOS">Termo de Equipamentos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700">Nível de Assinatura *</Label>
                <Select
                  value={newPolSigLevel}
                  onValueChange={(val: SignatureLevel) => setNewPolSigLevel(val)}
                >
                  <SelectTrigger className="h-9 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ELECTRONIC">Aceite Eletrônico (Interno)</SelectItem>
                    <SelectItem value="DIGITAL">Assinatura Digital (Validade Jurídica)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {newPolSigLevel === 'DIGITAL' && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-purple-50/60 rounded-2xl border border-purple-200">
                <div>
                  <Label className="text-xs font-bold text-purple-950">Provedor Digital *</Label>
                  <Select
                    value={newPolProvider}
                    onValueChange={(val: DigitalSignatureProviderType) => setNewPolProvider(val)}
                  >
                    <SelectTrigger className="h-9 text-xs mt-1 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="D4SIGN">D4Sign (ICP-Brasil)</SelectItem>
                      <SelectItem value="DOCUSIGN">DocuSign (eSignature)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-bold text-purple-950">
                    Prazo para Assinar (Dias)
                  </Label>
                  <Input
                    type="number"
                    value={newPolDeadlineDays}
                    onChange={(e) => setNewPolDeadlineDays(Number(e.target.value))}
                    className="h-9 text-xs mt-1 bg-white"
                  />
                </div>
              </div>
            )}

            <div>
              <Label className="text-xs font-bold text-slate-700">Descrição / Finalidade *</Label>
              <Textarea
                placeholder="Descreva o escopo, as obrigações e os objetivos deste documento..."
                value={newPolDesc}
                onChange={(e) => setNewPolDesc(e.target.value)}
                className="text-xs min-h-[70px] mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold text-slate-700">Validade (Meses)</Label>
                <Input
                  type="number"
                  value={newPolValidity}
                  onChange={(e) => setNewPolValidity(Number(e.target.value))}
                  className="h-9 text-xs mt-1"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newPolMandatory}
                  onChange={(e) => setNewPolMandatory(e.target.checked)}
                />
                <span>Documento Obrigatório para o Público-Alvo</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newPolReaccept}
                  onChange={(e) => setNewPolReaccept(e.target.checked)}
                />
                <span>Exigir novo aceite quando houver nova versão publicada</span>
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNewPolicyModalOpen(false)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleCreatePolicy}
              className="text-xs bg-primary text-white"
            >
              Salvar Política
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: NOVA VERSÃO DO DOCUMENTO */}
      <Dialog open={newVersionModalOpen} onOpenChange={setNewVersionModalOpen}>
        <DialogContent className="sm:max-w-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-primary flex items-center gap-2">
              <History className="w-5 h-5 text-primary" /> Publicar Nova Versão:{' '}
              {selectedPolicy?.name}
            </DialogTitle>
            <DialogDescription className="text-xs">
              A publicação manterá o histórico imutável anterior e notificará os colaboradores caso
              reaceite seja obrigatório.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs font-bold text-slate-700">Identificador da Versão *</Label>
              <Input
                placeholder="Ex: v2.5 ou v3.0"
                value={newVerNumber}
                onChange={(e) => setNewVerNumber(e.target.value)}
                className="h-9 text-xs mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-700">
                Conteúdo do Documento (Markdown) *
              </Label>
              <Textarea
                placeholder="# Título do Documento&#10;1. Cláusula..."
                value={newVerContent}
                onChange={(e) => setNewVerContent(e.target.value)}
                className="text-xs min-h-[140px] font-mono mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNewVersionModalOpen(false)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleCreateNewVersion}
              className="text-xs bg-primary text-white gap-1"
            >
              <Send className="w-3.5 h-3.5" /> Publicar Versão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
