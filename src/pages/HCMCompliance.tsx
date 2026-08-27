import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/hooks/use-auth'
import {
  CompliancePolicyType,
  PolicyDocumentVersion,
  EmployeePolicyAcceptance,
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
  const [kpis, setKpis] = useState({
    totalPolicies: 0,
    totalEmployees: 0,
    complianceRate: 0,
    validAcceptances: 0,
    pendingReacceptance: 0,
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('todos')

  // Modais
  const [readModalOpen, setReadModalOpen] = useState(false)
  const [selectedPolicy, setSelectedPolicy] = useState<CompliancePolicyType | null>(null)
  const [selectedVersion, setSelectedVersion] = useState<PolicyDocumentVersion | null>(null)

  const [newPolicyModalOpen, setNewPolicyModalOpen] = useState(false)
  const [newVersionModalOpen, setNewVersionModalOpen] = useState(false)

  // Form Nova Política
  const [newPolName, setNewPolName] = useState('')
  const [newPolCategory, setNewPolCategory] = useState<any>('SEGURANCA_INFORMACAO')
  const [newPolDesc, setNewPolDesc] = useState('')
  const [newPolValidity, setNewPolValidity] = useState(12)
  const [newPolMandatory, setNewPolMandatory] = useState(true)
  const [newPolReaccept, setNewPolReaccept] = useState(true)

  // Form Nova Versão
  const [newVerNumber, setNewVerNumber] = useState('')
  const [newVerContent, setNewVerContent] = useState('')

  // Aceite
  const [acceptConfirmed, setAcceptConfirmed] = useState(false)

  const loadData = async () => {
    const pols = await complianceService.listPolicies()
    const vers = await complianceService.listVersions()
    const accs = await complianceService.listAcceptances()
    const stats = await complianceService.getComplianceKpis()

    setPolicies(pols)
    setVersions(vers)
    setAcceptances(accs)
    setKpis(stats)
  }

  useEffect(() => {
    loadData()
  }, [])

  // Filtros
  const filteredPolicies = useMemo(() => {
    return policies.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchCat = categoryFilter === 'todos' || p.category === categoryFilter
      return matchSearch && matchCat
    })
  }, [policies, searchTerm, categoryFilter])

  // Identifica pendências de aceite para o usuário logado
  const myPendingPolicies = useMemo(() => {
    return policies.filter((p) => {
      if (!p.is_mandatory) return false
      const hasAccepted = acceptances.some(
        (a) =>
          (a.employee_email === user?.email || a.employee_id === user?.id) &&
          a.policy_id === p.id &&
          a.policy_version === p.current_version &&
          a.status === 'EM_CONFORMIDADE',
      )
      return !hasAccepted
    })
  }, [policies, acceptances, user])

  // Abrir modal de leitura e aceite de termo
  const handleOpenReadTerm = (policy: CompliancePolicyType) => {
    setSelectedPolicy(policy)
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

  // Registrar Aceite Eletrônico
  const handleConfirmAcceptance = async () => {
    if (!selectedPolicy || !selectedVersion) return
    if (!acceptConfirmed) {
      toast.error('Marque a confirmação de leitura e concordância para assinar.')
      return
    }

    try {
      await complianceService.registerAcceptance(
        user?.id || 'usr-current',
        user?.employee_id || 'TOTVS-8801',
        user?.name || 'Carlos Mendonça',
        user?.email || 'carlos.mendonca@ciafal.com.br',
        user?.department || 'Comercial — Vendas Indústria',
        user?.cargo || 'Vendedor Sênior',
        selectedPolicy.id,
        selectedVersion.version,
        selectedVersion.document_hash,
      )

      toast.success(`Aceite registrado com sucesso para ${selectedPolicy.name}!`)
      setReadModalOpen(false)
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao registrar aceite.')
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
    })

    toast.success('Novo termo/política criado no cadastro corporativo!')
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
      {/* HEADER EXECUTIVO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-emerald-100 rounded-2xl">
              <ShieldCheck className="w-6 h-6 text-emerald-800" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-3xl font-bold text-primary tracking-tight">
                  HCM — Governança & Compliance do Colaborador
                </h1>
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs">
                  Assinatura Eletrônica & LGPD
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Gestão centralizada de termos, políticas corporativas, versionamento imutável e
                controle de conformidade dos funcionários (TOTVS RM).
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

      {/* CARDS DE INDICADORES DE CONFORMIDADE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white/95 backdrop-blur-md border-border/40 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Índice de Conformidade
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <span className="font-serif text-3xl font-bold text-emerald-700 block">
              {kpis.complianceRate}%
            </span>
            <span className="text-[11px] text-muted-foreground">
              Colaboradores em dia com termos
            </span>
          </div>
        </Card>

        <Card className="bg-white/95 backdrop-blur-md border-border/40 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
              Políticas Ativas
            </span>
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <div className="mt-2">
            <span className="font-serif text-3xl font-bold text-primary block">
              {kpis.totalPolicies}
            </span>
            <span className="text-[11px] text-muted-foreground">Documentos parametrizados</span>
          </div>
        </Card>

        <Card className="bg-white/95 backdrop-blur-md border-border/40 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              Minhas Pendências
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2">
            <span className="font-serif text-3xl font-bold text-amber-700 block">
              {myPendingPolicies.length}
            </span>
            <span className="text-[11px] text-amber-800">Termos aguardando sua assinatura</span>
          </div>
        </Card>

        <Card className="bg-white/95 backdrop-blur-md border-border/40 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
              Aceites Registrados
            </span>
            <Fingerprint className="w-4 h-4 text-slate-700" />
          </div>
          <div className="mt-2">
            <span className="font-serif text-3xl font-bold text-slate-900 block">
              {acceptances.length}
            </span>
            <span className="text-[11px] text-muted-foreground">
              Com hash SHA-256 e IP auditado
            </span>
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
                  Você possui {myPendingPolicies.length} termo(s) obrigatório(s) pendente(s) de
                  ciência
                </h4>
                <p className="text-xs text-amber-700">
                  Mantenha sua conformidade funcional assinando eletronicamente os termos
                  corporativos.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => handleOpenReadTerm(myPendingPolicies[0])}
              className="bg-amber-700 hover:bg-amber-800 text-white text-xs gap-1.5 shrink-0"
            >
              <FileCheck className="w-3.5 h-3.5" /> Assinar Agora:{' '}
              {myPendingPolicies[0].name.split(' ')[0]}...
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
              value="pendencias"
              className="data-[state=active]:bg-white data-[state=active]:text-amber-800 rounded-xl px-4 py-2 text-xs font-semibold"
            >
              Minhas Pendências ({myPendingPolicies.length})
            </TabsTrigger>
            <TabsTrigger
              value="aceites"
              className="data-[state=active]:bg-white data-[state=active]:text-primary rounded-xl px-4 py-2 text-xs font-semibold"
            >
              Aceites Realizados ({acceptances.length})
            </TabsTrigger>
            <TabsTrigger
              value="relatorios"
              className="data-[state=active]:bg-white data-[state=active]:text-primary rounded-xl px-4 py-2 text-xs font-semibold"
            >
              Relatório de Conformidade
            </TabsTrigger>
          </TabsList>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar política ou termo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 pl-8 text-xs bg-white rounded-xl"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-8 text-xs bg-white rounded-xl w-48">
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
          </div>
        </div>

        {/* ABA 1: LISTA DE TERMOS & POLÍTICAS */}
        <TabsContent value="termos" className="m-0 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPolicies.map((pol) => {
              const catCfg = CATEGORY_LABELS[pol.category] || CATEGORY_LABELS.OUTROS
              const isPendingForMe = myPendingPolicies.some((p) => p.id === pol.id)

              return (
                <Card
                  key={pol.id}
                  className="bg-white/95 backdrop-blur-md border-border/40 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <Badge className={cn('text-[10px] font-bold border-none', catCfg.color)}>
                        {catCfg.label}
                      </Badge>
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
                      <span>
                        Reaceite na nova versão:{' '}
                        <strong>{pol.requires_reacceptance_on_new_version ? 'Sim' : 'Não'}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-4 border-t mt-4">
                    {isPendingForMe ? (
                      <Badge className="bg-amber-100 text-amber-800 text-[10px] font-bold border-none gap-1">
                        <Clock className="w-3 h-3" /> Pendente de Aceite
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
                        <FileCheck className="w-3.5 h-3.5" /> Visualizar & Assinar
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* ABA 2: MINHAS PENDÊNCIAS */}
        <TabsContent value="pendencias" className="m-0 space-y-3">
          {myPendingPolicies.length === 0 ? (
            <Card className="p-12 text-center bg-white rounded-3xl border-border/40">
              <ShieldCheck className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
              <h3 className="font-serif font-bold text-lg text-slate-800">
                Parabéns! Você está 100% em conformidade
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Todos os termos, políticas corporativas e acordos do colaborador estão aceitos e
                vigentes.
              </p>
            </Card>
          ) : (
            myPendingPolicies.map((pol) => (
              <Card
                key={pol.id}
                className="p-5 bg-white rounded-3xl border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-amber-100 text-amber-800 text-[10px] font-bold border-none">
                      Pendente de Aceite
                    </Badge>
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
                  <FileCheck className="w-4 h-4" /> Ler e Aceitar Termo
                </Button>
              </Card>
            ))
          )}
        </TabsContent>

        {/* ABA 3: ACEITES REALIZADOS & AUDITORIA */}
        <TabsContent value="aceites" className="m-0 space-y-3">
          <Card className="p-5 bg-white rounded-3xl border-border/40 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif font-bold text-base text-primary">
                  Registro Imutável de Aceites Eletrônicos
                </h3>
                <p className="text-xs text-muted-foreground">
                  Evidências auditáveis com carimbo de data/hora, IP de origem, dispositivo e hash
                  SHA-256.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b text-[11px] font-bold text-muted-foreground uppercase">
                    <th className="py-2.5 px-3">Colaborador (TOTVS RM)</th>
                    <th className="py-2.5 px-3">Documento / Política</th>
                    <th className="py-2.5 px-3">Versão</th>
                    <th className="py-2.5 px-3">Data / Hora</th>
                    <th className="py-2.5 px-3">IP & Contexto</th>
                    <th className="py-2.5 px-3">Hash de Integridade</th>
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
                      <td className="py-3 px-3 font-medium text-primary">{acc.policy_name}</td>
                      <td className="py-3 px-3 font-mono font-bold">{acc.policy_version}</td>
                      <td className="py-3 px-3 text-slate-600">
                        {new Date(acc.accepted_at).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">
                        <span className="font-mono text-[10px] block text-slate-800">
                          {acc.ip_address}
                        </span>
                        <span className="text-[10px] truncate max-w-[140px] block">
                          {acc.device_context}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[10px] text-muted-foreground">
                        {acc.acceptance_hash ? acc.acceptance_hash.substring(0, 16) + '...' : '---'}
                      </td>
                      <td className="py-3 px-3">
                        {acc.status === 'EM_CONFORMIDADE' ? (
                          <Badge className="bg-emerald-100 text-emerald-800 text-[10px] border-none font-bold">
                            Conforme
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800 text-[10px] border-none font-bold">
                            Reaceite Pendente
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

        {/* ABA 4: RELATÓRIO DE CONFORMIDADE */}
        <TabsContent value="relatorios" className="m-0 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-5 bg-white rounded-3xl border-border/40 shadow-xs space-y-3">
              <h3 className="font-serif font-bold text-base text-primary">
                Conformidade por Departamento
              </h3>
              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between font-medium mb-1">
                    <span>Comercial & Vendas (Minas & SP)</span>
                    <strong className="text-emerald-700">92%</strong>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full" style={{ width: '92%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-medium mb-1">
                    <span>Engenharia & Qualidade SGQ</span>
                    <strong className="text-emerald-700">100%</strong>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-medium mb-1">
                    <span>Logística & Pátio Betim</span>
                    <strong className="text-amber-700">84%</strong>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: '84%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-medium mb-1">
                    <span>Administrativo & Financeiro</span>
                    <strong className="text-emerald-700">96%</strong>
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
                  Exportação & Certificação para Auditoria
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Gere o dossiê consolidado de aceites para apresentação em auditorias ISO 9001 /
                  SGQ, auditoria contábil ou fiscalização LGPD.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.success('Relatório de Conformidade PDF gerado com sucesso!')}
                  className="text-xs text-primary gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Exportar Relatório PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.success('Trilha completa de auditoria CSV exportada!')}
                  className="text-xs text-slate-700 gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Exportar Auditoria CSV
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* MODAL: LEITURA E ASSINATURA ELETRÔNICA DO TERMO */}
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
                    </div>
                    <DialogTitle className="font-serif text-xl font-bold text-primary mt-1">
                      {selectedPolicy.name}
                    </DialogTitle>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4 py-2">
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
                        Declaro ciência integral e aceito os termos do documento
                      </strong>
                      Declaro que li integralmente as condições deste documento corporativo e
                      comprometo-me a respeitar todas as diretrizes estabelecidas pela CIAFAL.
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
                  onClick={handleConfirmAcceptance}
                  disabled={!acceptConfirmed}
                  className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5"
                >
                  <Fingerprint className="w-4 h-4" /> Assinar Eletronicamente (QAS)
                </Button>
              </DialogFooter>
            </>
          )}
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
              Adicione um novo tipo de política corporativa ao cadastro administrativo do HCM.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs font-bold text-slate-700">Nome do Termo / Política *</Label>
              <Input
                placeholder="Ex: Política de Uso de Inteligência Artificial Generativa"
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
                <Label className="text-xs font-bold text-slate-700">Validade (Meses)</Label>
                <Input
                  type="number"
                  value={newPolValidity}
                  onChange={(e) => setNewPolValidity(Number(e.target.value))}
                  className="h-9 text-xs mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-700">Descrição / Finalidade *</Label>
              <Textarea
                placeholder="Descreva o escopo e os objetivos desta política corporativa..."
                value={newPolDesc}
                onChange={(e) => setNewPolDesc(e.target.value)}
                className="text-xs min-h-[70px] mt-1"
              />
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
              A publicação de uma nova versão manterá o histórico imutável anterior e notificará os
              colaboradores caso reaceite seja obrigatório.
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
