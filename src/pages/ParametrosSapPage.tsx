import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ShieldCheck,
  ShieldAlert,
  Sliders,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  History,
  AlertTriangle,
  Layers,
  Sparkles,
  ArrowRight,
  Edit3,
  Server,
  Lock,
  Search,
  Filter,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { dataExposurePolicyService } from '@/services/data_exposure_policy_service'
import type {
  DataExposurePolicy,
  ExposurePolicyAuditLog,
  ExposurePolicyCategory,
  ExposureRuleType,
  ExposedValueResult,
} from '@/types/data_exposure_policy'

export default function ParametrosSapPage() {
  const { user } = useAuth()

  // 1. CARREGAMENTO DOS DADOS CENTRALIZADOS
  const [policies, setPolicies] = useState<DataExposurePolicy[]>(() =>
    dataExposurePolicyService.getPolicies(),
  )
  const [auditLogs, setAuditLogs] = useState<ExposurePolicyAuditLog[]>(() =>
    dataExposurePolicyService.getAuditLogs(),
  )

  // 2. FILTROS DA TABELA PRINCIPAL
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('TODAS')
  const [selectedStatus, setSelectedStatus] = useState<string>('TODOS')

  // 3. ESTADOS DO MODAL/DRAWER DE EDIÇÃO
  const [editingPolicy, setEditingPolicy] = useState<DataExposurePolicy | null>(null)
  const [editMaxLimit, setEditMaxLimit] = useState<string>('50')
  const [editThreshold, setEditThreshold] = useState<string>('5')
  const [editSlaHours, setEditSlaHours] = useState<string>('48')
  const [editStatus, setEditStatus] = useState<'ATIVO' | 'INATIVO' | 'RASCUNHO'>('ATIVO')
  const [editJustification, setEditJustification] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 4. ESTADOS DO SIMULADOR DE POLÍTICA EM TEMPO REAL (Req. 8)
  const [simValue, setSimValue] = useState<string>('124.7')
  const [simRole, setSimRole] = useState<string>('VENDEDOR')
  const [simUnit, setSimUnit] = useState<string>('t')
  const [simResult, setSimResult] = useState<ExposedValueResult | null>(() => {
    return dataExposurePolicyService.simulatePolicyResult(124.7, 'VENDEDOR')
  })

  // 5. ABA ATIVA: "parametros", "simulador" ou "historico"
  const [activeTab, setActiveTab] = useState<'parametros' | 'simulador' | 'historico'>('parametros')

  // 6. FILTRO DE HISTÓRICO
  const [historySearch, setHistorySearch] = useState('')

  const reloadData = () => {
    const p = dataExposurePolicyService.getPolicies()
    const a = dataExposurePolicyService.getAuditLogs()
    setPolicies(p)
    setAuditLogs(a)
  }

  // Cards de Resumo Executivo
  const summary = useMemo(() => {
    const total = policies.length
    const active = policies.filter((p) => p.status === 'ATIVO').length
    const inactive = policies.filter((p) => p.status === 'INATIVO').length
    const uniqueIntegrations = new Set(policies.map((p) => p.integrationType)).size
    return { total, active, inactive, uniqueIntegrations, lastAudit: auditLogs[0] }
  }, [policies, auditLogs])

  // Filtragem da Tabela
  const filteredPolicies = useMemo(() => {
    return policies.filter((p) => {
      const matchSearch =
        p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.consumerModule.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sourceField.toLowerCase().includes(searchTerm.toLowerCase())

      const matchCategory =
        selectedCategory === 'TODAS' || p.category.toUpperCase() === selectedCategory.toUpperCase()

      const matchStatus =
        selectedStatus === 'TODOS' || p.status.toUpperCase() === selectedStatus.toUpperCase()

      return matchSearch && matchCategory && matchStatus
    })
  }, [policies, searchTerm, selectedCategory, selectedStatus])

  // Filtragem de Auditoria
  const filteredAuditLogs = useMemo(() => {
    if (!historySearch.trim()) return auditLogs
    const t = historySearch.toLowerCase()
    return auditLogs.filter(
      (log) =>
        log.policyCode.toLowerCase().includes(t) ||
        log.changedBy.toLowerCase().includes(t) ||
        log.justification.toLowerCase().includes(t) ||
        log.consumerModule.toLowerCase().includes(t),
    )
  }, [auditLogs, historySearch])

  // Abrir Modal de Edição
  const handleOpenEdit = (policy: DataExposurePolicy) => {
    setEditingPolicy(policy)
    setEditMaxLimit(policy.maxDisplayedValue !== undefined ? String(policy.maxDisplayedValue) : '')
    setEditThreshold(policy.triggerThreshold !== undefined ? String(policy.triggerThreshold) : '')
    setEditSlaHours(policy.slaHours !== undefined ? String(policy.slaHours) : '')
    setEditStatus(policy.status)
    setEditJustification('')
  }

  // Salvar Alteração com Justificativa e Auditoria
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPolicy) return

    if (!editJustification.trim() || editJustification.trim().length < 5) {
      toast.error(
        'A justificativa é obrigatória (mínimo de 5 caracteres) para alteração de parâmetros SAP.',
      )
      return
    }

    try {
      setIsSubmitting(true)

      const updates: Partial<DataExposurePolicy> = {
        status: editStatus,
      }

      if (editMaxLimit !== '') {
        updates.maxDisplayedValue = parseFloat(editMaxLimit)
      }
      if (editThreshold !== '') {
        updates.triggerThreshold = parseFloat(editThreshold)
      }
      if (editSlaHours !== '') {
        updates.slaHours = parseFloat(editSlaHours)
      }

      const operator = {
        id: user?.id || 'admin-01',
        name: user?.name || 'Administrador Master',
        role: user?.role || 'ADMIN',
      }

      dataExposurePolicyService.updatePolicy(
        editingPolicy.id,
        updates,
        operator,
        editJustification.trim(),
      )

      toast.success(`Parâmetro ${editingPolicy.code} atualizado e publicado com sucesso!`)
      setEditingPolicy(null)
      reloadData()
    } catch (err: any) {
      toast.error(err.message || 'Falha ao atualizar parâmetro.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Executar Simulação
  const handleRunSimulation = () => {
    const val = parseFloat(simValue)
    if (isNaN(val)) {
      toast.error('Informe um valor numérico válido para teste.')
      return
    }
    const res = dataExposurePolicyService.simulatePolicyResult(val, simRole)
    setSimResult(res)
    toast.info(`Simulação executada para perfil ${simRole}.`)
  }

  // Reset para Padrões
  const handleResetDefaults = () => {
    if (
      !window.confirm(
        'Deseja realmente restaurar os parâmetros para os valores de fábrica (50 t / 5 t / 48 h)?',
      )
    ) {
      return
    }
    const operator = {
      id: user?.id || 'admin-01',
      name: user?.name || 'Administrador Master',
      role: user?.role || 'ADMIN',
    }
    dataExposurePolicyService.resetToDefaults(operator)
    reloadData()
    toast.success('Parâmetros restaurados com sucesso para os valores padrão homologados.')
  }

  return (
    <div className="space-y-6 pb-20 animate-fade-in max-w-7xl mx-auto">
      {/* 1. HEADER EXECUTIVO CIAFAL */}
      <div className="bg-gradient-to-r from-[#003A70]/10 via-[#003A70]/5 to-transparent p-6 rounded-3xl border border-sky-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge className="bg-[#003A70] text-white font-mono text-[10px] font-bold border-none">
              INTEGRAÇÕES & GOVERNANÇA SAP
            </Badge>
            <Badge
              variant="outline"
              className="text-[10px] font-bold border-amber-300 bg-amber-50 text-amber-900"
            >
              QAS HOMOLOGAÇÃO
            </Badge>
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#003A70] tracking-tight">
            Central de Parâmetros de Dados SAP e Regras de Exposição
          </h1>
          <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
            Governança centralizada de campos de dados vindos do SAP ECC (RFC/BAPI). Define limites
            máximos, mascaramento, gatilhos de checagem física WMS e segregação estrita por alçada
            de perfil (RBAC).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetDefaults}
            className="h-9 text-xs rounded-xl border-slate-300 text-slate-700 hover:bg-slate-100 gap-1.5"
            title="Restaura os parâmetros originais (50 t, 5 t, 48 h)"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Restaurar Padrões
          </Button>
        </div>
      </div>

      {/* 2. CARDS DE RESUMO (Req. 8) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-200 bg-white shadow-xs p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-500">
              Parâmetros Ativos
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <strong className="text-3xl font-black text-[#003A70]">{summary.active}</strong>
            <span className="text-xs text-slate-500 font-medium">
              de {summary.total} cadastrados
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Políticas em vigor imediato nas telas</p>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white shadow-xs p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-500">
              Inativos / Rascunho
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <strong className="text-3xl font-black text-slate-800">{summary.inactive}</strong>
            <span className="text-xs text-slate-500 font-medium">políticas pausadas</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Sem impacto no consumo comercial</p>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white shadow-xs p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-500">Integrações SAP</span>
            <Server className="w-4 h-4 text-[#003A70]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <strong className="text-3xl font-black text-sky-700">
              {summary.uniqueIntegrations}
            </strong>
            <span className="text-xs text-slate-500 font-medium">conectores RFC/BAPI</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">MARD, MARC, KNKK, COPA, WMS</p>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white shadow-xs p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-500">Última Alteração</span>
            <History className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2">
            <strong className="text-xs font-bold text-slate-800 block truncate">
              {summary.lastAudit?.policyCode || 'Seed Inicial'}
            </strong>
            <span className="text-[10px] text-slate-500">
              {summary.lastAudit
                ? `${summary.lastAudit.changedAt} por ${summary.lastAudit.changedBy}`
                : 'Carga de homologação'}
            </span>
          </div>
          <p className="text-[10px] text-purple-700 mt-1 font-semibold">
            Log de auditoria imutável ativo
          </p>
        </Card>
      </div>

      {/* 3. SELETOR DE ABAS DA CENTRAL */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
        <Button
          size="sm"
          variant={activeTab === 'parametros' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('parametros')}
          className={`h-9 text-xs rounded-xl font-bold flex items-center gap-1.5 ${
            activeTab === 'parametros' ? 'bg-[#003A70] text-white shadow-xs' : 'text-slate-700'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" /> Parâmetros de Exposição ({filteredPolicies.length})
        </Button>

        <Button
          size="sm"
          variant={activeTab === 'simulador' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('simulador')}
          className={`h-9 text-xs rounded-xl font-bold flex items-center gap-1.5 ${
            activeTab === 'simulador' ? 'bg-[#003A70] text-white shadow-xs' : 'text-slate-700'
          }`}
        >
          <Play className="w-3.5 h-3.5" /> Simulador "Testar Parâmetro"
        </Button>

        <Button
          size="sm"
          variant={activeTab === 'historico' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('historico')}
          className={`h-9 text-xs rounded-xl font-bold flex items-center gap-1.5 ${
            activeTab === 'historico' ? 'bg-[#003A70] text-white shadow-xs' : 'text-slate-700'
          }`}
        >
          <History className="w-3.5 h-3.5" /> Histórico de Alterações ({auditLogs.length})
        </Button>
      </div>

      {/* =========================================================================
          ABA 1: TABELA DE PARÂMETROS
         ========================================================================= */}
      {activeTab === 'parametros' && (
        <Card className="rounded-3xl border-slate-200 bg-white shadow-xs overflow-hidden">
          {/* Barra de Filtros e Busca */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por código, nome, módulo ou campo SAP..."
                className="h-9 pl-9 text-xs rounded-xl bg-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-9 text-xs rounded-xl bg-white w-36">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODAS">Todas Categorias</SelectItem>
                  <SelectItem value="ESTOQUE">Estoque</SelectItem>
                  <SelectItem value="CREDITO">Crédito</SelectItem>
                  <SelectItem value="PRECO">Preço</SelectItem>
                  <SelectItem value="MARGEM">Margem</SelectItem>
                  <SelectItem value="LOGISTICA">Logística / SLA</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="h-9 text-xs rounded-xl bg-white w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos Status</SelectItem>
                  <SelectItem value="ATIVO">Ativo</SelectItem>
                  <SelectItem value="INATIVO">Inativo</SelectItem>
                  <SelectItem value="RASCUNHO">Rascunho</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tabela de Parâmetros (Req. 8) */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-100/70">
                <TableRow>
                  <TableHead className="text-xs font-bold text-slate-800">
                    Informação / Código
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-800">
                    Origem & Objeto SAP
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-800">
                    Módulo Consumidor
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-800">Tipo da Regra</TableHead>
                  <TableHead className="text-xs font-bold text-slate-800">Limite / Valor</TableHead>
                  <TableHead className="text-xs font-bold text-slate-800">
                    Perfis Afetados
                  </TableHead>
                  <TableHead className="text-xs font-bold text-slate-800">Status</TableHead>
                  <TableHead className="text-xs font-bold text-slate-800 text-right">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPolicies.map((pol) => {
                  const limitLabel =
                    pol.maxDisplayedValue !== undefined
                      ? `${pol.maxDisplayedValue} ${pol.unit}`
                      : pol.triggerThreshold !== undefined
                        ? `< ${pol.triggerThreshold} ${pol.unit}`
                        : 'Parametrizado'

                  return (
                    <TableRow key={pol.id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell className="py-3">
                        <div className="font-bold text-xs text-slate-900">{pol.name}</div>
                        <span className="font-mono text-[10px] text-slate-500 block">
                          {pol.code}
                        </span>
                      </TableCell>

                      <TableCell className="py-3 text-xs">
                        <span className="font-bold text-[#003A70]">{pol.originSystem}</span>
                        <span className="text-[11px] text-slate-500 block">
                          {pol.sapObject} · {pol.sourceField}
                        </span>
                      </TableCell>

                      <TableCell className="py-3 text-xs text-slate-700">
                        {pol.consumerModule}
                      </TableCell>

                      <TableCell className="py-3">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-bold bg-slate-50 border-slate-300 text-slate-800"
                        >
                          {pol.ruleType.replace('_', ' ')}
                        </Badge>
                      </TableCell>

                      <TableCell className="py-3 text-xs font-mono font-bold text-[#003A70]">
                        {limitLabel}
                      </TableCell>

                      <TableCell className="py-3 text-[11px]">
                        <div className="flex flex-wrap gap-1">
                          {pol.affectedRoles.map((r, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-mono text-[9px] font-semibold"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </TableCell>

                      <TableCell className="py-3">
                        <Badge
                          className={`text-[9px] font-bold border-none ${
                            pol.status === 'ATIVO'
                              ? 'bg-emerald-100 text-emerald-800'
                              : pol.status === 'INATIVO'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {pol.status}
                        </Badge>
                      </TableCell>

                      <TableCell className="py-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEdit(pol)}
                          className="h-8 text-xs rounded-xl font-bold border-sky-300 text-[#003A70] hover:bg-sky-50 gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* =========================================================================
          ABA 2: SIMULADOR DE POLÍTICA EM TEMPO REAL (Req. 8)
         ========================================================================= */}
      {activeTab === 'simulador' && (
        <Card className="rounded-3xl border-slate-200 bg-white shadow-xs p-6 space-y-6">
          <div className="border-b pb-4">
            <h2 className="font-serif text-xl font-bold text-[#003A70] flex items-center gap-2">
              <Play className="w-5 h-5 text-[#003A70]" />
              Simulador "Testar Parâmetro" em Tempo Real
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Informe o valor real retornado pelo SAP ECC e selecione o perfil de usuário. O
              simulador processa a regra ativa e exibe exatamente o payload seguro entregue ao
              frontend sem revelar o saldo real para perfis comerciais.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <Label className="text-xs font-bold text-slate-800">
                Valor Real Retornado pelo SAP
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.01"
                  value={simValue}
                  onChange={(e) => setSimValue(e.target.value)}
                  placeholder="Ex: 124.7"
                  className="h-9 text-xs bg-white font-mono font-bold"
                />
                <span className="text-xs font-bold text-slate-600">t</span>
              </div>
              <p className="text-[10px] text-slate-500">
                Saldo bruto extraído via RFC/BAPI da tabela MARD (LABST).
              </p>
            </div>

            <div className="space-y-1.5 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <Label className="text-xs font-bold text-slate-800">
                Perfil do Usuário Conectado
              </Label>
              <Select value={simRole} onValueChange={setSimRole}>
                <SelectTrigger className="h-9 text-xs bg-white">
                  <SelectValue placeholder="Selecione o perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VENDEDOR">Vendedor Comercial (Sujeito à regra)</SelectItem>
                  <SelectItem value="REPRESENTANTE_EXTERNO">
                    Representante Externo (Mais restrito)
                  </SelectItem>
                  <SelectItem value="SUPERVISOR">
                    Supervisor Regional (Isento / Valor Integral)
                  </SelectItem>
                  <SelectItem value="ADMIN">Administrador Master (Isento / Auditado)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-slate-500">
                RBAC: perfis comerciais sofrem capping e mascaramento.
              </p>
            </div>

            <div className="flex flex-col justify-end p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <Button
                onClick={handleRunSimulation}
                className="h-10 text-xs font-bold bg-[#003A70] hover:bg-[#002850] text-white rounded-xl gap-2 shadow-xs"
              >
                <Play className="w-4 h-4" /> Processar Simulação
              </Button>
            </div>
          </div>

          {/* Atalhos rápidos de teste para validação imediata */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-slate-700">Cenários de Teste Rápidos:</span>
            {[
              { label: '124,7 t (Vendedor)', val: '124.7', role: 'VENDEDOR' },
              { label: '50,0 t (Vendedor)', val: '50.0', role: 'VENDEDOR' },
              { label: '27,8 t (Vendedor)', val: '27.8', role: 'VENDEDOR' },
              { label: '5,0 t (Vendedor)', val: '5.0', role: 'VENDEDOR' },
              { label: '4,99 t (Vendedor)', val: '4.99', role: 'VENDEDOR' },
              { label: '0 t (Vendedor)', val: '0', role: 'VENDEDOR' },
              { label: '124,7 t (Supervisor/Isento)', val: '124.7', role: 'SUPERVISOR' },
            ].map((cen, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSimValue(cen.val)
                  setSimRole(cen.role)
                  const res = dataExposurePolicyService.simulatePolicyResult(
                    parseFloat(cen.val),
                    cen.role,
                  )
                  setSimResult(res)
                }}
                className="px-2.5 py-1 rounded-lg bg-sky-50 text-[#003A70] hover:bg-sky-100 border border-sky-200 font-mono text-[11px] font-semibold transition-colors"
              >
                {cen.label}
              </button>
            ))}
          </div>

          {/* Resultado da Simulação */}
          {simResult && (
            <div className="p-6 bg-slate-900 text-white rounded-3xl space-y-4 shadow-lg border border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-sky-500 text-white font-bold text-xs border-none">
                    RESULTADO DA POLÍTICA
                  </Badge>
                  <span className="text-xs text-slate-400 font-mono">
                    Regra: {simResult.appliedRule}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {simResult.originalValueHidden ? (
                    <Badge variant="outline" className="text-rose-400 border-rose-500 text-[10px]">
                      <Lock className="w-3 h-3 mr-1" /> Saldo Real Omitido do Payload
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-emerald-400 border-emerald-500 text-[10px]"
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Saldo Integral Auditado
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Texto Exibido no Frontend
                  </span>
                  <div className="text-2xl font-black text-amber-300 mt-1">
                    {simResult.displayValue}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Exato padrão ABNT / pt-BR
                  </span>
                </div>

                <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Limite Aplicado (isCapped)
                  </span>
                  <div className="text-xl font-bold mt-1">
                    {simResult.isCapped ? (
                      <span className="text-rose-400 font-mono">TRUE (Acima do limite)</span>
                    ) : (
                      <span className="text-emerald-400 font-mono">FALSE (Dentro da faixa)</span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    {simResult.isCapped
                      ? 'Exibe sufixo "+" sem revelar total'
                      : 'Valor exato liberado'}
                  </span>
                </div>

                <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Gatilho de Checagem Física
                  </span>
                  <div className="text-xl font-bold mt-1">
                    {simResult.canRequestCheck ? (
                      <span className="text-amber-400 font-mono">HABILITADO (&lt; 5 t)</span>
                    ) : (
                      <span className="text-slate-400 font-mono">DESABILITADO (≥ 5 t)</span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    {simResult.canRequestCheck
                      ? 'Botão "Solicitar checagem" ativo'
                      : 'Sem botão de checagem'}
                  </span>
                </div>

                <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    SLA da Checagem
                  </span>
                  <div className="text-2xl font-black text-sky-400 mt-1">
                    {simResult.slaHours} horas
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Prazo de conferência no pátio
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700 text-xs text-slate-300">
                <strong>Tooltip Informativo Entregue ao Usuário:</strong>
                <p className="text-slate-400 mt-0.5">{simResult.tooltip}</p>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* =========================================================================
          ABA 3: HISTÓRICO IMUTÁVEL DE ALTERAÇÕES (Req. 9)
         ========================================================================= */}
      {activeTab === 'historico' && (
        <Card className="rounded-3xl border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-serif text-lg font-bold text-slate-900">
                Trilha de Auditoria Imutável de Parâmetros
              </h3>
              <p className="text-xs text-slate-500">
                Todas as alterações registram carimbo de data/hora, operador, alçada, valor
                anterior, valor novo e justificativa obrigatória.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <Input
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Filtrar histórico..."
                className="h-9 pl-9 text-xs rounded-xl bg-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-100/70">
                <TableRow>
                  <TableHead className="text-xs font-bold text-slate-800">Data / Hora</TableHead>
                  <TableHead className="text-xs font-bold text-slate-800">Parâmetro</TableHead>
                  <TableHead className="text-xs font-bold text-slate-800">Operador</TableHead>
                  <TableHead className="text-xs font-bold text-slate-800">Valor Anterior</TableHead>
                  <TableHead className="text-xs font-bold text-slate-800">Valor Novo</TableHead>
                  <TableHead className="text-xs font-bold text-slate-800">
                    Justificativa Registrada
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAuditLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-xs text-slate-400">
                      Nenhum registro de auditoria encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAuditLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell className="py-3 text-xs font-mono text-slate-600 whitespace-nowrap">
                        {log.changedAt}
                      </TableCell>

                      <TableCell className="py-3">
                        <span className="font-mono text-xs font-bold text-[#003A70]">
                          {log.policyCode}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {log.consumerModule}
                        </span>
                      </TableCell>

                      <TableCell className="py-3 text-xs">
                        <strong className="text-slate-800 block">{log.changedBy}</strong>
                        <Badge
                          variant="outline"
                          className="text-[9px] font-mono px-1 py-0 bg-slate-50"
                        >
                          {log.changedByRole}
                        </Badge>
                      </TableCell>

                      <TableCell className="py-3 text-xs font-mono text-slate-500">
                        {typeof log.previousValue === 'object'
                          ? JSON.stringify(log.previousValue)
                          : String(log.previousValue)}
                      </TableCell>

                      <TableCell className="py-3 text-xs font-mono font-bold text-emerald-700">
                        {typeof log.newValue === 'object'
                          ? JSON.stringify(log.newValue)
                          : String(log.newValue)}
                      </TableCell>

                      <TableCell className="py-3 text-xs text-slate-700 max-w-md">
                        <p className="line-clamp-2 italic">"{log.justification}"</p>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* =========================================================================
          MODAL / DRAWER DE EDIÇÃO DE PARÂMETRO COM JUSTIFICATIVA OBRIGATÓRIA (Req. 8 e 9)
         ========================================================================= */}
      {editingPolicy && (
        <Dialog open={!!editingPolicy} onOpenChange={(open) => !open && setEditingPolicy(null)}>
          <DialogContent className="sm:max-w-xl bg-white rounded-3xl p-6 border-slate-200 shadow-2xl">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#003A70]/10 rounded-xl text-[#003A70]">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="font-serif text-xl font-bold text-[#003A70]">
                    Editar Parâmetro SAP
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    A alteração entrará em vigor imediatamente para todos os módulos conectados sem
                    necessidade de rebuild.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="font-mono text-xs font-bold text-[#003A70]">
                  {editingPolicy.code}
                </span>
                <p className="text-xs font-semibold text-slate-800">{editingPolicy.name}</p>
                <div className="text-[10px] text-slate-500 pt-1">
                  Origem: <strong>{editingPolicy.originSystem}</strong> · Objeto:{' '}
                  {editingPolicy.sapObject} · Campo: {editingPolicy.sourceField}
                </div>
              </div>

              {/* CAMPOS PARAMETRIZÁVEIS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {editingPolicy.maxDisplayedValue !== undefined && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-800">
                      Limite Máximo Exibido ({editingPolicy.unit})
                    </Label>
                    <Input
                      type="number"
                      step="0.1"
                      required
                      value={editMaxLimit}
                      onChange={(e) => setEditMaxLimit(e.target.value)}
                      className="h-9 text-xs rounded-xl bg-white font-mono font-bold"
                    />
                    <span className="text-[10px] text-slate-500">
                      Valores SAP acima deste limite serão exibidos com o sufixo "+".
                    </span>
                  </div>
                )}

                {editingPolicy.triggerThreshold !== undefined && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-800">
                      Limiar de Checagem Física ({editingPolicy.unit})
                    </Label>
                    <Input
                      type="number"
                      step="0.1"
                      required
                      value={editThreshold}
                      onChange={(e) => setEditThreshold(e.target.value)}
                      className="h-9 text-xs rounded-xl bg-white font-mono font-bold"
                    />
                    <span className="text-[10px] text-slate-500">
                      Estoque abaixo deste limiar habilita botão de checagem.
                    </span>
                  </div>
                )}

                {editingPolicy.slaHours !== undefined && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-800">
                      SLA de Atendimento (Horas)
                    </Label>
                    <Input
                      type="number"
                      required
                      value={editSlaHours}
                      onChange={(e) => setEditSlaHours(e.target.value)}
                      className="h-9 text-xs rounded-xl bg-white font-mono font-bold"
                    />
                    <span className="text-[10px] text-slate-500">
                      Tempo limite para conferência física no WMS (ex: 48h).
                    </span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-800">Status da Política</Label>
                  <Select
                    value={editStatus}
                    onValueChange={(v) => setEditStatus(v as 'ATIVO' | 'INATIVO' | 'RASCUNHO')}
                  >
                    <SelectTrigger className="h-9 text-xs rounded-xl bg-white">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ATIVO">Ativo (Em vigor)</SelectItem>
                      <SelectItem value="INATIVO">Inativo (Pausado)</SelectItem>
                      <SelectItem value="RASCUNHO">Rascunho</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* JUSTIFICATIVA OBRIGATÓRIA (Req. 9) */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>
                    Justificativa da Alteração <span className="text-rose-500">*</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Obrigatório p/ auditoria
                  </span>
                </Label>
                <Textarea
                  required
                  value={editJustification}
                  onChange={(e) => setEditJustification(e.target.value)}
                  placeholder="Informe o motivo comercial/estratégico desta alteração (ex: Ajuste no limite de estoque para adequação à política do Q4)..."
                  rows={3}
                  className="text-xs rounded-xl bg-white resize-none"
                />
              </div>

              <DialogFooter className="pt-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingPolicy(null)}
                  className="rounded-xl text-xs h-9"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl text-xs h-9 bg-[#003A70] hover:bg-[#002850] text-white font-bold gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Publicando...' : 'Salvar e Publicar Imediatamente'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
