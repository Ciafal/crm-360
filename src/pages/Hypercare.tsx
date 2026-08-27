import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  LifeBuoy,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  Activity,
  Cpu,
  Server,
  Zap,
  Users,
  Search,
  Filter,
  Layers,
  ArrowRight,
  ExternalLink,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface IncidentItem {
  id: string
  code: string
  title: string
  module: string
  severity: 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAIXA'
  status: 'ABERTO' | 'EM_ANALISE' | 'RESOLVIDO' | 'MONITORANDO'
  reportedBy: string
  openedAt: string
  resolvedAt?: string
  slaRemainingMinutes: number
}

export default function Hypercare() {
  const navigate = useNavigate()
  const [feedbackInput, setFeedbackInput] = useState('')
  const [feedbackModule, setFeedbackModule] = useState('CRM 360')
  const [searchTerm, setSearchTerm] = useState('')

  const [incidents, setIncidents] = useState<IncidentItem[]>([
    {
      id: 'inc-01',
      code: 'HYP-2024-008',
      title: 'Sincronização de Pedidos Bloqueados por Crédito no SAP ECC',
      module: 'SAP Integration (F.35)',
      severity: 'MEDIA',
      status: 'RESOLVIDO',
      reportedBy: 'Carlos Mendonça (Comercial)',
      openedAt: '2024-10-18T08:30:00Z',
      resolvedAt: '2024-10-18T09:15:00Z',
      slaRemainingMinutes: 0,
    },
    {
      id: 'inc-02',
      code: 'HYP-2024-009',
      title: 'Tempo de Resposta em Consulta de Rota Geocodificada CD Betim',
      module: 'Logística / GeoProvider',
      severity: 'BAIXA',
      status: 'MONITORANDO',
      reportedBy: 'Equipe Logística TMS',
      openedAt: '2024-10-18T10:00:00Z',
      slaRemainingMinutes: 120,
    },
    {
      id: 'inc-03',
      code: 'HYP-2024-010',
      title: 'Validação de Carga em Staging de Metas do Planejamento Estratégico',
      module: 'Planejamento Estratégico',
      severity: 'BAIXA',
      status: 'RESOLVIDO',
      reportedBy: 'Controladoria & Finanças',
      openedAt: '2024-10-17T15:20:00Z',
      resolvedAt: '2024-10-17T16:00:00Z',
      slaRemainingMinutes: 0,
    },
  ])

  const handleSendFeedback = () => {
    if (!feedbackInput.trim()) {
      toast.error('Descreva o apontamento ou feedback.')
      return
    }

    const newInc: IncidentItem = {
      id: `inc-${Date.now()}`,
      code: `HYP-${new Date().getFullYear()}-${String(incidents.length + 1).padStart(3, '0')}`,
      title: feedbackInput,
      module: feedbackModule,
      severity: 'MEDIA',
      status: 'EM_ANALISE',
      reportedBy: 'Usuário Homologador QAS',
      openedAt: new Date().toISOString(),
      slaRemainingMinutes: 240,
    }

    setIncidents([newInc, ...incidents])
    setFeedbackInput('')
    toast.success('Apontamento de Hypercare registrado com prioridade de atendimento!')
  }

  const getSeverityBadge = (s: string) => {
    switch (s) {
      case 'CRITICA':
        return (
          <Badge className="bg-rose-600 text-white border-none font-bold text-[10px]">
            Crítica
          </Badge>
        )
      case 'ALTA':
        return (
          <Badge className="bg-orange-500 text-white border-none font-bold text-[10px]">Alta</Badge>
        )
      case 'MEDIA':
        return (
          <Badge className="bg-amber-100 text-amber-800 border-none font-bold text-[10px]">
            Média
          </Badge>
        )
      default:
        return (
          <Badge className="bg-slate-100 text-slate-700 border-none font-bold text-[10px]">
            Baixa
          </Badge>
        )
    }
  }

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'RESOLVIDO':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold text-[10px] gap-1">
            <CheckCircle2 className="w-3 h-3" /> Resolvido
          </Badge>
        )
      case 'MONITORANDO':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-none font-bold text-[10px] gap-1">
            <Activity className="w-3 h-3" /> Monitorando
          </Badge>
        )
      default:
        return (
          <Badge className="bg-amber-100 text-amber-800 border-none font-bold text-[10px] gap-1">
            <Clock className="w-3 h-3" /> Em Análise
          </Badge>
        )
    }
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in pb-16">
      {/* 1. HERO COM HEADER CLARO E HIERARQUIA VISUAL EQUILIBRADA (SEM BLOCO GIGANTE AZUL) */}
      <div className="p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-3xl border border-border/50 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-600 text-white font-bold border-none text-[10px] gap-1">
                <ShieldCheck className="w-3 h-3" /> HYPERCARE ATIVO — QAS / HOMOLOGAÇÃO
              </Badge>
              <Badge className="bg-white text-slate-700 border-border/60 text-[10px]">
                Ciclo: Rodada de Consolidação v2.1
              </Badge>
            </div>
            <h1 className="font-serif text-3xl font-bold text-primary tracking-tight">
              Cockpit de Monitoramento & Hypercare
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Acompanhamento assistido em tempo real das aplicações corporativas, integridade de
              contratos, tempos de resposta das integrações SAP/TOTVS e suporte dedicado à
              homologação.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/relatorio-release')}
              className="h-9 text-xs text-primary gap-1.5"
            >
              <Layers className="w-4 h-4" /> Relatório da Release
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/central-integracoes')}
              className="h-9 text-xs bg-primary text-white gap-1.5 font-bold"
            >
              <Zap className="w-4 h-4" /> Central de Integrações
            </Button>
          </div>
        </div>
      </div>

      {/* 2. 12-COLUMN RESPONSIVE GRID: 4 CARDS DE KPI DE OPERAÇÃO */}
      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-12 sm:col-span-6 lg:col-span-3 bg-white/95 border-border/40 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Disponibilidade (SLA)
            </span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <span className="font-serif text-3xl font-bold text-emerald-700 block">99.98%</span>
            <span className="text-[11px] text-muted-foreground">Todos os nós operando</span>
          </div>
        </Card>

        <Card className="col-span-12 sm:col-span-6 lg:col-span-3 bg-white/95 border-border/40 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Tempo Médio Resposta (TTR)
            </span>
            <Clock className="w-4 h-4 text-primary" />
          </div>
          <div className="mt-2">
            <span className="font-serif text-3xl font-bold text-primary block">14 min</span>
            <span className="text-[11px] text-muted-foreground">SLA contratual: 45 min</span>
          </div>
        </Card>

        <Card className="col-span-12 sm:col-span-6 lg:col-span-3 bg-white/95 border-border/40 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Incidentes Críticos
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <span className="font-serif text-3xl font-bold text-slate-900 block">0</span>
            <span className="text-[11px] text-emerald-700 font-semibold">
              Nenhuma anomalia grave
            </span>
          </div>
        </Card>

        <Card className="col-span-12 sm:col-span-6 lg:col-span-3 bg-white/95 border-border/40 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Transações Processadas
            </span>
            <Cpu className="w-4 h-4 text-primary" />
          </div>
          <div className="mt-2">
            <span className="font-serif text-3xl font-bold text-slate-900 block">12.480</span>
            <span className="text-[11px] text-muted-foreground">24h no ecossistema HUB</span>
          </div>
        </Card>
      </div>

      {/* 3. GRID 12 COLUNAS: CORPO PRINCIPAL COM FEEDBACK RÁPIDO & MONITORAMENTO DE INCIDENTES */}
      <div className="grid grid-cols-12 gap-6">
        {/* COLUNA ESQUERDA (7 COLS): LISTA DE APONTAMENTOS & FEEDBACKS */}
        <div className="col-span-12 lg:col-span-7 space-y-4">
          <Card className="bg-white/95 border-border/40 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-serif font-bold text-base text-primary">
                  Apontamentos & Chamados em Homologação
                </h3>
                <p className="text-xs text-muted-foreground">
                  Registro direto da equipe de homologadores durante o período de sustentação
                  assistida.
                </p>
              </div>
              <Badge className="bg-slate-100 text-slate-800 text-xs font-mono font-bold">
                {incidents.length} Registros
              </Badge>
            </div>

            <div className="space-y-3">
              {incidents.map((inc) => (
                <div
                  key={inc.id}
                  className="p-4 bg-slate-50/70 hover:bg-slate-50 transition-colors rounded-2xl border border-border/40 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-border/30">
                        {inc.code}
                      </span>
                      <Badge className="bg-primary/10 text-primary border-none text-[10px] font-bold">
                        {inc.module}
                      </Badge>
                      {getSeverityBadge(inc.severity)}
                    </div>
                    <div>{getStatusBadge(inc.status)}</div>
                  </div>

                  <h4 className="font-serif font-bold text-sm text-slate-900">{inc.title}</h4>

                  <div className="flex flex-wrap items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/30">
                    <span>
                      Por: <strong>{inc.reportedBy}</strong>
                    </span>
                    <span>Aberto em: {new Date(inc.openedAt).toLocaleTimeString('pt-BR')}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* COLUNA DIREITA (5 COLS): FORM DE REGISTRO & STATUS DE SERVIÇOS CRÍTICOS */}
        <div className="col-span-12 lg:col-span-5 space-y-4">
          {/* REGISTRAR APONTAMENTO */}
          <Card className="bg-white/95 border-border/40 rounded-3xl p-5 shadow-xs space-y-3">
            <h3 className="font-serif font-bold text-base text-primary flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" /> Registrar Feedback de Hypercare
            </h3>
            <p className="text-xs text-muted-foreground">
              Envie rapidamente anotações funcionais, validações de layout ou comportamentos de
              teste.
            </p>

            <div className="space-y-2 pt-1">
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-1">
                  Módulo Impactado
                </span>
                <select
                  value={feedbackModule}
                  onChange={(e) => setFeedbackModule(e.target.value)}
                  className="w-full h-8 text-xs bg-slate-50 border border-border/60 rounded-xl px-2"
                >
                  <option value="CRM 360">CRM 360 & Gestão de Carteira</option>
                  <option value="Solicitações Corporativas">Solicitações Corporativas</option>
                  <option value="HCM / Compliance">HCM — Governança & Compliance</option>
                  <option value="Planejamento Estratégico">Planejamento Estratégico</option>
                  <option value="SAP ECC Integration">SAP ECC / Crédito F.35</option>
                </select>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-700 block mb-1">
                  Descrição do Ponto
                </span>
                <Input
                  placeholder="Ex: Botão de cálculo testado e aprovado com sucesso..."
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  className="text-xs h-9 bg-slate-50"
                />
              </div>

              <Button
                onClick={handleSendFeedback}
                className="w-full bg-primary text-white text-xs font-bold gap-1.5 h-9 mt-2"
              >
                <Send className="w-3.5 h-3.5" /> Enviar para a Equipe de Engenharia
              </Button>
            </div>
          </Card>

          {/* STATUS DOS SERVIÇOS EM MONITORAMENTO */}
          <Card className="bg-white/95 border-border/40 rounded-3xl p-5 shadow-xs space-y-3">
            <h3 className="font-serif font-bold text-base text-primary flex items-center gap-2">
              <Server className="w-4 h-4 text-primary" /> Status dos Componentes do HUB
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                <span className="font-medium text-slate-800">
                  Motor de Solicitações Corporativas
                </span>
                <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold text-[10px]">
                  100% Operacional
                </Badge>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                <span className="font-medium text-slate-800">Módulo HCM Governança & Aceites</span>
                <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold text-[10px]">
                  100% Operacional
                </Badge>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                <span className="font-medium text-slate-800">
                  Importador de PE com Schema Oficial
                </span>
                <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold text-[10px]">
                  100% Operacional
                </Badge>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                <span className="font-medium text-slate-800">
                  Cockpit de KPIs & Seletor CRM 360
                </span>
                <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold text-[10px]">
                  100% Operacional
                </Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
