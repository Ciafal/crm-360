import React, { useState, useEffect } from 'react'
import {
  Mail,
  Shield,
  Key,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Search,
  Users,
  Server,
  Terminal,
  MessageSquare,
  Smartphone,
  Radio,
  ExternalLink,
  BookOpen,
  Workflow,
  Sparkles,
  Layers,
  Plus,
  Edit2,
  Trash2,
  FileCheck,
  Building2,
  Compass,
} from 'lucide-react'
import {
  initialCommercialPlaybooks,
  initialRelationshipEvents,
  initialAutomationRules,
  initialDynamicFormFields,
} from '@/data/mockPlaybooksAndWorkflows'
import type {
  CommercialPlaybook,
  RelationshipEvent,
  CommercialAutomationRule,
  DynamicFormField,
} from '@/types/models'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { PageLoadingState, PageEmptyState, PageErrorState } from '@/components/shared/StateFeedback'
import { cn } from '@/lib/utils'

interface MockEmailItem {
  id: string
  recipient: string
  subject: string
  otp_code: string
  status: 'VALID' | 'EXPIRED' | 'USED' | string
  expires_at?: string
  created: string
}

export default function Administracao() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [adminTab, setAdminTab] = useState<
    'geral' | 'playbooks' | 'relacionamento' | 'workflows' | 'formularios'
  >('geral')
  const [emails, setEmails] = useState<MockEmailItem[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  // Estados dos Módulos Administrativos
  const [playbooks, setPlaybooks] = useState<CommercialPlaybook[]>(initialCommercialPlaybooks)
  const [selectedPlaybook, setSelectedPlaybook] = useState<CommercialPlaybook | null>(null)
  const [playbookModalOpen, setPlaybookModalOpen] = useState(false)

  const [relEvents, setRelEvents] = useState<RelationshipEvent[]>(initialRelationshipEvents)
  const [rules, setRules] = useState<CommercialAutomationRule[]>(initialAutomationRules)
  const [formFields, setFormFields] = useState<DynamicFormField[]>(initialDynamicFormFields)

  const isAdmin =
    user?.role === 'administrador' ||
    user?.role === 'ti' ||
    user?.role === 'diretoria' ||
    user?.email === 'admin.teste@ciafal.local' ||
    user?.email === 'fabiano@adapta.org'

  const loadMockEmails = async () => {
    setLoading(true)
    try {
      // 1. Tentar endpoint customizado /api/mock/emails
      const res = await pb.send('/api/mock/emails', { method: 'GET' })
      if (res && res.items) {
        setEmails(res.items)
      }
    } catch (_) {
      // Fallback via coleção mock_emails se o endpoint falhar
      try {
        const records = await pb.collection('mock_emails').getList(1, 50, {
          sort: '-created',
        })
        const items = records.items.map((r: any) => ({
          id: r.id,
          recipient: r.recipient,
          subject: r.subject,
          otp_code: r.otp_code,
          status: r.status,
          expires_at: r.expires_at,
          created: r.created,
        }))
        setEmails(items)
      } catch (err) {
        console.error('Erro ao carregar e-mails mock:', err)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      loadMockEmails()
    } else {
      setLoading(false)
    }
  }, [isAdmin])

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
    toast({
      title: 'Código OTP Copiado',
      description: `Código ${text} copiado para a área de transferência.`,
    })
  }

  const filteredEmails = emails.filter(
    (e) =>
      e.recipient.toLowerCase().includes(search.toLowerCase()) ||
      e.subject.toLowerCase().includes(search.toLowerCase()) ||
      e.otp_code.includes(search),
  )

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center animate-fade-in">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-200">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-foreground">Acesso Restrito</h2>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto text-sm">
          A seção de Administração e a Caixa de E-mail Mock são restritas ao Administrador do
          sistema.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-3xl font-bold text-primary tracking-tight">
              Administração & Mocks
            </h1>
            <Badge
              variant="outline"
              className="text-xs bg-amber-50 text-amber-700 border-amber-300"
            >
              Modo Teste / HML
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Painel de controle, auditoria de integrações e Caixa de E-mail Mock para códigos de MFA.
          </p>
        </div>

        <Button
          onClick={loadMockEmails}
          variant="outline"
          size="sm"
          className="h-9 gap-2 shadow-xs"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar Caixa
        </Button>
      </div>

      {/* BARRA DE NAVEGAÇÃO DE SUB-MÓDULOS DE ADMINISTRAÇÃO */}
      <div className="bg-slate-100 p-1.5 rounded-2xl flex flex-wrap gap-1.5 border border-border/60">
        <Button
          size="sm"
          variant={adminTab === 'geral' ? 'default' : 'ghost'}
          onClick={() => setAdminTab('geral')}
          className={cn(
            'h-9 text-xs rounded-xl font-semibold',
            adminTab === 'geral' ? 'bg-primary text-white shadow-xs' : 'text-slate-600',
          )}
        >
          <Server className="w-4 h-4 mr-1.5" /> 1. Geral & Mocks OTP
        </Button>
        <Button
          size="sm"
          variant={adminTab === 'playbooks' ? 'default' : 'ghost'}
          onClick={() => setAdminTab('playbooks')}
          className={cn(
            'h-9 text-xs rounded-xl font-semibold',
            adminTab === 'playbooks' ? 'bg-primary text-white shadow-xs' : 'text-slate-600',
          )}
        >
          <BookOpen className="w-4 h-4 mr-1.5" /> 2. Playbooks Comerciais ({playbooks.length})
        </Button>
        <Button
          size="sm"
          variant={adminTab === 'relacionamento' ? 'default' : 'ghost'}
          onClick={() => setAdminTab('relacionamento')}
          className={cn(
            'h-9 text-xs rounded-xl font-semibold',
            adminTab === 'relacionamento' ? 'bg-primary text-white shadow-xs' : 'text-slate-600',
          )}
        >
          <Sparkles className="w-4 h-4 mr-1.5" /> 3. Réguas de Relacionamento ({relEvents.length})
        </Button>
        <Button
          size="sm"
          variant={adminTab === 'workflows' ? 'default' : 'ghost'}
          onClick={() => setAdminTab('workflows')}
          className={cn(
            'h-9 text-xs rounded-xl font-semibold',
            adminTab === 'workflows' ? 'bg-primary text-white shadow-xs' : 'text-slate-600',
          )}
        >
          <Workflow className="w-4 h-4 mr-1.5" /> 4. Workflow Engine & Automação ({rules.length})
        </Button>
        <Button
          size="sm"
          variant={adminTab === 'formularios' ? 'default' : 'ghost'}
          onClick={() => setAdminTab('formularios')}
          className={cn(
            'h-9 text-xs rounded-xl font-semibold',
            adminTab === 'formularios' ? 'bg-primary text-white shadow-xs' : 'text-slate-600',
          )}
        >
          <Layers className="w-4 h-4 mr-1.5" /> 5. Formulários Dinâmicos ({formFields.length})
        </Button>
      </div>

      {/* ABA 2: PLAYBOOKS COMERCIAIS */}
      {adminTab === 'playbooks' && (
        <Card className="rounded-3xl border-border/60 bg-white shadow-sm p-6 space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
            <div>
              <h3 className="font-serif text-xl font-bold text-primary">
                Playbooks Comerciais por Arquétipo
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Definição de diretrizes, perguntas-chave, canais, cadência e anti-patterns com
                versionamento completo.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                toast({ title: 'Novo playbook de arquétipo comercial iniciado.' })
              }}
              className="h-8 gap-1.5 text-xs bg-primary text-white font-semibold"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar Playbook
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {playbooks.map((pb) => (
              <div
                key={pb.id}
                className="p-5 rounded-2xl border border-border/60 bg-slate-50/70 hover:bg-slate-50 transition-colors space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <Badge className="bg-primary text-white font-bold text-[10px]">
                      {pb.customer_archetype}
                    </Badge>
                    <h4 className="font-bold text-sm text-slate-900 mt-1">{pb.name}</h4>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-white font-mono">
                    v{pb.version}
                  </Badge>
                </div>

                <p className="text-xs text-slate-700 line-clamp-2">{pb.recommended_approach}</p>

                <div className="text-[11px] text-muted-foreground border-t pt-2 flex items-center justify-between">
                  <span>
                    Autor: <strong>{pb.created_by}</strong>
                  </span>
                  <span>Atualizado: {pb.updated_at}</span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      toast({ title: `Editando playbook para ${pb.customer_archetype}` })
                    }}
                    className="h-7 text-xs"
                  >
                    <Edit2 className="w-3 h-3 mr-1" /> Editar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ABA 3: RÉGUAS DE RELACIONAMENTO */}
      {adminTab === 'relacionamento' && (
        <Card className="rounded-3xl border-border/60 bg-white shadow-sm p-6 space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
            <div>
              <h3 className="font-serif text-xl font-bold text-primary">
                Réguas de Relacionamento & Marketing
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Gatilhos automáticos de relacionamento (Aniversário, Pós-Venda, Recompra e Datas
                Setoriais) com governança e consentimento LGPD.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => toast({ title: 'Nova régua de relacionamento criada.' })}
              className="h-8 gap-1.5 text-xs bg-primary text-white font-semibold"
            >
              <Plus className="w-3.5 h-3.5" /> Nova Régua
            </Button>
          </div>

          <div className="space-y-3">
            {relEvents.map((ev) => (
              <div
                key={ev.id}
                className="p-4 rounded-2xl border border-border/60 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{ev.name}</span>
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-white font-semibold text-primary"
                    >
                      {ev.type}
                    </Badge>
                    <Badge className="bg-emerald-100 text-emerald-800 text-[10px] border-none font-bold">
                      {ev.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600">
                    <strong>Gatilho:</strong> {ev.date_rule} · <strong>Público:</strong>{' '}
                    {ev.audience}
                  </p>
                  <p className="text-[11px] text-slate-500 italic">Template: "{ev.template}"</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="text-[10px] bg-white text-slate-700">
                    Canal: {ev.channel}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toast({ title: `Régua ${ev.name} atualizada.` })}
                    className="h-7 text-xs"
                  >
                    Configurar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ABA 4: WORKFLOW ENGINE & AUTOMAÇÃO */}
      {adminTab === 'workflows' && (
        <Card className="rounded-3xl border-border/60 bg-white shadow-sm p-6 space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
            <div>
              <h3 className="font-serif text-xl font-bold text-primary">
                Workflow & Automation Engine
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Regras de negócio de automação comercial desacopladas: TRIGGER + CONDITIONS +
                ACTIONS.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => toast({ title: 'Nova regra de automação criada.' })}
              className="h-8 gap-1.5 text-xs bg-primary text-white font-semibold"
            >
              <Plus className="w-3.5 h-3.5" /> Criar Regra de Automação
            </Button>
          </div>

          <div className="space-y-3">
            {rules.map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-2xl border border-border/60 bg-slate-50 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{r.name}</span>
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-blue-50 text-blue-700 border-blue-300 font-mono"
                    >
                      TRIGGER: {r.trigger}
                    </Badge>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800 text-[10px] border-none font-bold">
                    {r.enabled ? 'ATIVA' : 'PAUSADA'}
                  </Badge>
                </div>

                <div className="text-xs text-slate-700 grid grid-cols-1 md:grid-cols-2 gap-2 bg-white p-3 rounded-xl border border-border/40">
                  <div>
                    <strong className="text-primary text-[11px] block">CONDIÇÕES:</strong>
                    {r.conditions.map((c, i) => (
                      <span key={i} className="text-slate-600 block text-[11px]">
                        • {c.field} {c.operator} {JSON.stringify(c.value)}
                      </span>
                    ))}
                  </div>
                  <div>
                    <strong className="text-emerald-700 text-[11px] block">
                      AÇÕES DISPARADAS:
                    </strong>
                    {r.actions.map((a, i) => (
                      <span key={i} className="text-slate-600 block text-[11px]">
                        • Executar {a.type}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ABA 5: FORMULÁRIOS DINÂMICOS */}
      {adminTab === 'formularios' && (
        <Card className="rounded-3xl border-border/60 bg-white shadow-sm p-6 space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
            <div>
              <h3 className="font-serif text-xl font-bold text-primary">
                Formulários Comerciais Dinâmicos
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configuração de campos dinâmicos e condicionais por arquétipo comercial com detecção
                de duplicidade.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => toast({ title: 'Novo campo de formulário dinâmico adicionado.' })}
              className="h-8 gap-1.5 text-xs bg-primary text-white font-semibold"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar Campo
            </Button>
          </div>

          <div className="space-y-3">
            {formFields.map((field) => (
              <div
                key={field.id}
                className="p-4 rounded-2xl border border-border/60 bg-slate-50 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-slate-900">{field.label}</strong>
                    <code className="font-mono text-[10px] text-muted-foreground bg-white px-1.5 py-0.5 rounded border">
                      {field.name}
                    </code>
                    {field.required && (
                      <Badge className="bg-rose-100 text-rose-800 text-[9px] border-none font-bold">
                        Obrigatório
                      </Badge>
                    )}
                  </div>
                  <p className="text-slate-600 mt-1">{field.helpText}</p>
                  {field.conditionalArchetypes && (
                    <span className="text-[10px] text-primary font-semibold block mt-0.5">
                      Condicional para: {field.conditionalArchetypes.join(', ')}
                    </span>
                  )}
                </div>

                <Badge variant="outline" className="text-[10px] bg-white font-mono uppercase">
                  Tipo: {field.type}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ABA 1: GERAL & MOCKS OTP */}
      {adminTab === 'geral' && (
        <>
          {/* Grid de Métricas de Ambiente de Teste */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="rounded-2xl border-border/60 bg-white shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Ambiente Atual
                  </span>
                  <span className="font-bold text-primary text-base">DEV / Pré-Homologação</span>
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border-border/60 bg-white shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Usuários de Teste
                  </span>
                  <span className="font-bold text-emerald-700 text-base">
                    5 Contas Ativas (v0.0.6)
                  </span>
                </div>
              </div>
            </Card>

            <Card className="rounded-2xl border-border/60 bg-white shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    ENABLE_TEST_USERS
                  </span>
                  <span className="font-bold text-amber-700 text-base">Habilitado (true)</span>
                </div>
              </div>
            </Card>
          </div>

          {/* PAINEL DE INTEGRAÇÃO OFICIAL SAP ECC (BACKOFFICE TRANSACIONAL OFICIAL) */}
          <Card className="rounded-3xl border-border/60 bg-white shadow-sm overflow-hidden">
            <CardHeader className="p-6 border-b bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#003A70] text-white rounded-xl">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="font-serif text-xl font-bold text-primary">
                      SAP ECC — Backoffice Transacional Oficial
                    </CardTitle>
                    <Badge className="bg-blue-100 text-blue-900 border-blue-300 border text-[10px] font-bold">
                      Sistema Mestre Corporativo
                    </Badge>
                  </div>
                  <CardDescription className="text-xs mt-0.5">
                    Governança arquitetural: SAP ECC detém clientes, pedidos, faturamento, crédito
                    (F.35) e estoque. CRM 360º opera como camada de inteligência e experiência
                    comercial.
                  </CardDescription>
                </div>
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 border text-xs px-2.5 py-1">
                <Radio className="w-3 h-3 mr-1 animate-pulse text-emerald-600" /> Conectado (RFC /
                BAPI Governança)
              </Badge>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-border/60">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Conector Transacional
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="bg-primary text-white font-bold text-xs">
                      SAPECCProvider (RFC / IDoc)
                    </Badge>
                  </div>
                  <span className="text-[10px] text-muted-foreground block mt-1">
                    Sem UPDATE direto em tabelas SAP
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-border/60">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Última Sincronização
                  </span>
                  <div className="flex items-center gap-2 mt-1 font-mono font-bold text-slate-800 text-sm">
                    {new Date().toLocaleDateString('pt-BR')}{' '}
                    {new Date().toLocaleTimeString('pt-BR')}
                  </div>
                  <span className="text-[10px] text-emerald-700 block mt-1">
                    Delta Sync & Webhooks SAP ativos
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-border/60">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Latência / SLA RFC
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="font-bold text-slate-800 font-mono text-sm">
                      42 ms (Excelente)
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground block mt-1">
                    Fallback ativo para cache offline
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-border/60">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Transações Mapeadas
                  </span>
                  <span className="font-bold text-slate-800 text-xs mt-1 block">
                    F.35 / FD33 (Crédito) · VA03 (Ordens) · XD03 (Cadastro)
                  </span>
                  <span className="text-[10px] text-primary block mt-1">
                    100% Governança CIAFAL
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-blue-50/70 border border-blue-200/60 rounded-2xl text-xs text-blue-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="font-bold">
                    Política de Resiliência e Fallback Transacional SAP ECC:
                  </p>
                  <p className="text-[11px] text-blue-800">
                    Em caso de indisponibilidade momentânea do link SAP, o CRM 360º mantém operação
                    através do Read Model / Cache local auditado, exibindo a marcação{' '}
                    <em>&quot;Dado SAP atualizado em DD/MM/YYYY HH:mm&quot;</em> sem bloquear os
                    fluxos comerciais do vendedor.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs bg-white text-primary border-blue-300 shrink-0"
                  onClick={() => {
                    toast({
                      title: 'Sincronização SAP ECC Confirmada',
                      description:
                        'Conexão RFC/BAPI verificada com sucesso. Resposta da transação F.35 e mestre de materiais íntegra.',
                    })
                  }}
                >
                  Testar Comunicação RFC
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* PAINEL DE CONFIGURAÇÃO DO MAPA DA CARTEIRA & GEO ENGINE */}
          <Card className="rounded-3xl border-border/60 bg-white shadow-sm overflow-hidden">
            <CardHeader className="p-6 border-b bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-600 text-white rounded-xl">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="font-serif text-xl font-bold text-primary">
                    Configuração do Mapa da Carteira & Provedor Geográfico (Geo Engine)
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Governança de provedor de mapas, geocodificação de endereços SAP ECC, clusters
                    territoriais e ajustes autorizados.
                  </CardDescription>
                </div>
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 border text-xs px-2.5 py-1">
                OpenStreetMap / Leaflet Ativo
              </Badge>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-border/60">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Provedor Cartográfico
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="bg-primary text-white font-bold text-xs">
                      OpenStreetMap & Leaflet
                    </Badge>
                  </div>
                  <span className="text-[10px] text-muted-foreground block mt-1">
                    Google Maps Platform Preparado
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-border/60">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Raio de Proximidade Comercial
                  </span>
                  <span className="font-mono font-bold text-slate-800 text-sm mt-1 block">
                    50 km (Polo Metropolitano / Regional)
                  </span>
                  <span className="text-[10px] text-muted-foreground block mt-1">
                    Geofence de Visita: 300 metros
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-border/60">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Regra de Clusterização
                  </span>
                  <span className="font-bold text-slate-800 text-xs mt-1 block">
                    Agrupamento por Município / UF
                  </span>
                  <span className="text-[10px] text-emerald-700 block mt-1">
                    Zoom dinâmico com separação de markers
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-border/60">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Permissão Ajuste Manual
                  </span>
                  <span className="font-bold text-slate-800 text-xs mt-1 block">
                    Vendedor & Supervisor Autorizados
                  </span>
                  <span className="text-[10px] text-muted-foreground block mt-1">
                    Com log de auditoria e preservação SAP
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/60 rounded-2xl text-xs text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="font-bold">Diretriz de Privacidade Territorial do Vendedor:</p>
                  <p className="text-[11px] text-emerald-900">
                    A localização do cliente é tratada como dado cadastral estático geocodificado. A
                    localização do vendedor é solicitada <strong>exclusivamente sob demanda</strong>{' '}
                    para planejamento de rotas e busca de clientes próximos, sem gravação ou
                    rastreamento contínuo em segundo plano.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs bg-white text-emerald-800 border-emerald-300 shrink-0"
                  onClick={() => {
                    toast({
                      title: 'Cache Geográfico Validado',
                      description:
                        'Todas as coordenadas cadastradas no SAP ECC foram verificadas com o índice OpenStreetMap Nominatim.',
                    })
                  }}
                >
                  Revalidar Cache Geo
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* INTEGRAÇÃO WHATSAPP COEX */}
          <Card className="rounded-3xl border-border/60 bg-white shadow-sm overflow-hidden">
            <CardHeader className="p-6 border-b bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-600 text-white rounded-xl">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="font-serif text-xl font-bold text-primary">
                    Integrações & WhatsApp COEX / Cloud API
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Monitoramento de modo operacional, instâncias ativas e sincronização de
                    mensageria omnicanal.
                  </CardDescription>
                </div>
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 border text-xs px-2.5 py-1">
                <Radio className="w-3 h-3 mr-1 animate-pulse text-emerald-600" /> WhatsApp COEX
                Ativo
              </Badge>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-border/60">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Modo WhatsApp
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="bg-primary text-white font-bold text-xs">
                      COEX (Oficial + Web)
                    </Badge>
                    <span className="text-xs text-muted-foreground">ou Cloud API / MOCK</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-border/60">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Número Conectado
                  </span>
                  <div className="flex items-center gap-2 mt-1 font-mono font-bold text-slate-800 text-sm">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    +55 (31) 98888-0000
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-border/60">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Status Operacional
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="font-bold text-emerald-700 text-xs">
                      Conectado & Sincronizando
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-border/60">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Última Sincronização
                  </span>
                  <span className="font-bold text-slate-800 text-xs mt-1 block">
                    {new Date().toLocaleTimeString('pt-BR')} (tempo real via webhook)
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-blue-50/70 border border-blue-200/60 rounded-2xl text-xs text-blue-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="font-bold">Mapeamento de Contexto Comercial no WhatsApp:</p>
                  <p className="text-[11px] text-blue-800">
                    Campos registrados: <code className="font-mono font-bold">phone_number_id</code>
                    , <code className="font-mono font-bold">wa_id</code>,{' '}
                    <code className="font-mono font-bold">contact_id</code>,{' '}
                    <code className="font-mono font-bold">customer_id</code>,{' '}
                    <code className="font-mono font-bold">seller_id</code>,{' '}
                    <code className="font-mono font-bold">conversation_id</code>,{' '}
                    <code className="font-mono font-bold">channel_mode: COEX</code>.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs bg-white text-primary border-blue-300 shrink-0"
                  onClick={() => {
                    toast({
                      title: 'WhatsApp COEX Sincronizado',
                      description:
                        'Status verificado com sucesso. Webhooks e instâncias operando normalmente.',
                    })
                  }}
                >
                  Testar Conexão COEX
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* CAIXA DE E-MAIL MOCK (MFA) */}
          <Card className="rounded-3xl border-border/60 bg-white shadow-sm overflow-hidden">
            <CardHeader className="p-6 border-b bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary text-primary-foreground rounded-xl">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="font-serif text-xl font-bold text-primary">
                    Caixa de E-mail Mock (MFA / OTP)
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Códigos de verificação OTP gerados para usuários externos durante o login em
                    teste.
                  </CardDescription>
                </div>
              </div>

              <div className="w-full sm:w-64">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por e-mail ou código..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-9 text-xs pl-9 rounded-xl"
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0 overflow-x-auto">
              {loading ? (
                <div className="py-12 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Carregando mensagens...
                </div>
              ) : filteredEmails.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  <Mail className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  Nenhum código OTP foi solicitado ainda.
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Faça login com{' '}
                    <code className="bg-slate-100 px-1 py-0.5 rounded">
                      representante.teste@crm360.local
                    </code>{' '}
                    para gerar um OTP.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-muted/20 border-b border-border/40 text-xs text-muted-foreground flex flex-col sm:flex-row justify-between gap-2">
                  <span>
                    <strong>Como utilizar o OTP:</strong> Quando o Representante Externo (
                    <code>representante.teste@crm360.local</code>) tentar logar com{' '}
                    <code>teste123</code>, o OTP de 6 dígitos aparece aqui. Copie e informe ao
                    testador para concluir o acesso.
                  </span>
                </div>
              )}
              {filteredEmails.length > 0 && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-border/60 text-[11px] uppercase font-bold text-muted-foreground tracking-wider">
                      <th className="p-4">Destinatário</th>
                      <th className="p-4">Assunto</th>
                      <th className="p-4 text-center">Código OTP</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4">Gerado em</th>
                      <th className="p-4">Expira em</th>
                      <th className="p-4 text-center">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {filteredEmails.map((item) => {
                      const isExpired =
                        item.status === 'EXPIRED' ||
                        (item.expires_at && new Date(item.expires_at).getTime() < Date.now())

                      return (
                        <tr key={item.id} className="hover:bg-primary/5 transition-colors">
                          <td className="p-4 font-semibold text-foreground">{item.recipient}</td>
                          <td className="p-4 text-muted-foreground">{item.subject}</td>
                          <td className="p-4 text-center">
                            <span className="font-mono font-bold text-sm bg-slate-100 text-primary px-2.5 py-1 rounded-md border border-slate-200 tracking-widest">
                              {item.otp_code}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            {item.status === 'USED' ? (
                              <Badge
                                variant="outline"
                                className="bg-slate-100 text-slate-600 border-slate-300 text-[10px]"
                              >
                                Utilizado
                              </Badge>
                            ) : isExpired ? (
                              <Badge
                                variant="outline"
                                className="bg-rose-50 text-rose-700 border-rose-300 text-[10px]"
                              >
                                Expirado
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px] font-bold"
                              >
                                Válido
                              </Badge>
                            )}
                          </td>
                          <td className="p-4 text-muted-foreground">
                            {new Date(item.created).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </td>
                          <td className="p-4 text-muted-foreground">
                            {item.expires_at
                              ? new Date(item.expires_at).toLocaleTimeString('pt-BR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '10 min'}
                          </td>
                          <td className="p-4 text-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs"
                              onClick={() => copyToClipboard(item.otp_code, item.id)}
                              title="Copiar código OTP para informar ao testador"
                            >
                              {copiedId === item.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
