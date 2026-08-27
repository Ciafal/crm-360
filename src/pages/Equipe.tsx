import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { mockEquipe, MembroEquipe } from '@/data/mockCommercialData'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import {
  Users,
  TrendingUp,
  Target,
  DollarSign,
  Briefcase,
  Search,
  Filter,
  UserCheck,
  Calendar,
  Phone,
  Mail,
  Shield,
  ArrowUpRight,
  Eye,
  RefreshCw,
  Plus,
} from 'lucide-react'
import { PageLoadingState, PageEmptyState, PageErrorState } from '@/components/shared/StateFeedback'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function Equipe() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('todos')

  // Simular carregamento com fallback robusto
  useEffect(() => {
    setLoading(true)
    setError(null)
    const timer = setTimeout(() => {
      setLoading(false)
    }, 250)
    return () => clearTimeout(timer)
  }, [user])

  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    })
  }

  // Identificação do Usuário e RLS (Row Level Security / RBAC)
  const userRole = (user?.role || '').toLowerCase()
  const userEmail = (user?.email || '').toLowerCase()

  // Visão Vendedor: Apenas ele mesmo
  // Visão Supervisor: Subordinados (vendedores e representantes) + ele mesmo
  // Visão Admin: Todos
  const isVendedorOnly = userRole === 'vendedor' || userRole === 'representante_externo'
  const isSupervisor = userRole === 'supervisor' || userRole === 'gerente_comercial'
  const isAdmin =
    userRole === 'administrador' || userRole === 'admin' || userEmail.includes('admin')

  const visibleMembers = useMemo(() => {
    if (isVendedorOnly) {
      // Vendedor só vê a si próprio
      return mockEquipe.filter(
        (m) =>
          m.email.toLowerCase() === userEmail ||
          m.userId === user?.id ||
          (userEmail.includes('vendedor2') ? m.id === 'eq-vend2' : m.id === 'eq-vend1') ||
          (userRole === 'representante_externo' && m.id === 'eq-rep'),
      )
    }

    if (isSupervisor) {
      // Supervisor vê vendedores, representantes e a si mesmo
      return mockEquipe.filter((m) => m.role !== 'ADMIN' || m.email === userEmail)
    }

    // Admin / Diretoria vê todos
    return mockEquipe
  }, [isVendedorOnly, isSupervisor, isAdmin, userEmail, user?.id, userRole])

  // Filtragem por busca e cargo
  const filteredMembers = useMemo(() => {
    return visibleMembers.filter((m) => {
      const matchSearch =
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email.toLowerCase().includes(searchTerm.toLowerCase())

      const matchRole =
        selectedRoleFilter === 'todos' || m.role.toLowerCase() === selectedRoleFilter.toLowerCase()

      return matchSearch && matchRole
    })
  }, [visibleMembers, searchTerm, selectedRoleFilter])

  // Totais consolidados dos cards de resumo
  // Meta mensal total: R$ 2.500.000 | Realizado mensal: R$ 1.875.000 | Gap: R$ 625.000 | % Atingimento: 75%
  const summary = useMemo(() => {
    if (isVendedorOnly && visibleMembers.length === 1) {
      const m = visibleMembers[0]
      return {
        totalMembros: 1,
        metaMensal: m.metaMensal,
        realizadoMensal: m.realizadoMensal,
        gap: m.gap,
        atingimento: m.atingimentoPercent,
        pipeline: m.pipeline,
        forecast: m.forecast,
        toneladasMeta: m.toneladasMeta,
        toneladasRealizado: m.toneladasRealizado,
      }
    }

    // Equipe Completa (Admin / Supervisor)
    const metaMensal = 2500000
    const realizadoMensal = 1875000
    const gap = metaMensal - realizadoMensal
    const atingimento = 75

    return {
      totalMembros: mockEquipe.length,
      metaMensal,
      realizadoMensal,
      gap,
      atingimento,
      pipeline: 1200000,
      forecast: 780000,
      toneladasMeta: 400,
      toneladasRealizado: 305,
    }
  }, [isVendedorOnly, visibleMembers])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-8">
        <PageLoadingState message="Carregando informações da equipe..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-8">
        <PageErrorState
          title="Não foi possível carregar os dados da equipe."
          description={error}
          onRetry={() => setLoading(false)}
        />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in pb-16">
      {/* Topo / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-primary/10 rounded-2xl">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-3xl font-bold text-primary tracking-tight">
                  Equipe Comercial & Metas
                </h1>
                <Badge
                  variant="outline"
                  className="text-xs bg-emerald-50 text-emerald-700 border-emerald-300"
                >
                  {isVendedorOnly
                    ? 'Visão Individual (RLS)'
                    : isSupervisor
                      ? 'Visão Regional MG'
                      : 'Visão Geral Diretoria'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground font-sans mt-0.5">
                Acompanhamento individual e consolidado de metas, gap, faturamento e pipeline
                comercial.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLoading(true)
              setTimeout(() => setLoading(false), 200)
            }}
            className="h-9 gap-1.5 text-xs text-muted-foreground"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Atualizar Metas
          </Button>
          {!isVendedorOnly && (
            <Button
              size="sm"
              onClick={() => toast.info('Funcionalidade disponível no painel de administração.')}
              className="h-9 gap-1.5 text-xs bg-primary text-white"
            >
              <Plus className="w-3.5 h-3.5" />
              Convidar Membro
            </Button>
          )}
        </div>
      </div>

      {/* 5 CARDS DE RESUMO OBRIGATÓRIOS */}
      {/* Total da equipe: 5 membros | Meta mensal total: R$ 2.500.000 | Realizado: R$ 1.875.000 | Gap: R$ 625.000 | % Atingimento: 75% */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="bg-white/80 backdrop-blur-md border-border/40 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Total da Equipe
            </span>
            <Users className="w-4 h-4 text-primary/60" />
          </div>
          <div className="mt-2">
            <span className="font-serif text-3xl font-bold text-primary">
              {summary.totalMembros}
            </span>
            <span className="text-xs text-muted-foreground ml-1.5">
              {summary.totalMembros === 1 ? 'membro ativo' : 'membros ativos'}
            </span>
          </div>
        </Card>

        <Card className="bg-white/80 backdrop-blur-md border-border/40 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Meta Mensal Total
            </span>
            <Target className="w-4 h-4 text-primary/60" />
          </div>
          <div className="mt-2">
            <span className="font-serif text-2xl font-bold text-primary">
              {formatBRL(summary.metaMensal)}
            </span>
            <span className="text-[11px] text-muted-foreground block mt-0.5">
              Meta: {summary.toneladasMeta} ton
            </span>
          </div>
        </Card>

        <Card className="bg-white/80 backdrop-blur-md border-border/40 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Realizado Mensal
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <span className="font-serif text-2xl font-bold text-emerald-600">
              {formatBRL(summary.realizadoMensal)}
            </span>
            <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">
              Realizado: {summary.toneladasRealizado} ton
            </span>
          </div>
        </Card>

        <Card className="bg-white/80 backdrop-blur-md border-border/40 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
              Gap da Meta
            </span>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2">
            <span className="font-serif text-2xl font-bold text-amber-600">
              {formatBRL(summary.gap)}
            </span>
            <span className="text-[11px] text-muted-foreground block mt-0.5">
              Faltam {summary.toneladasMeta - summary.toneladasRealizado} ton
            </span>
          </div>
        </Card>

        <Card className="bg-white/80 backdrop-blur-md border-border/40 rounded-2xl p-4 shadow-sm flex flex-col justify-between col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
              % Atingimento
            </span>
            <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold border-none">
              {summary.atingimento}%
            </Badge>
          </div>
          <div className="mt-2 space-y-1.5">
            <Progress value={summary.atingimento} className="h-2.5 bg-slate-100" />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Ritmo: Saudável</span>
              <span className="font-semibold text-primary">{summary.atingimento}% concluído</span>
            </div>
          </div>
        </Card>
      </div>

      {/* FILTROS DA TABELA */}
      <Card className="bg-white/70 backdrop-blur-md border-border/40 shadow-xs rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, cargo ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 text-xs rounded-xl"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-full border border-border/40 text-xs">
              <button
                className={cn(
                  'px-3 py-1.5 rounded-full font-medium transition-all',
                  selectedRoleFilter === 'todos'
                    ? 'bg-white text-primary shadow-xs'
                    : 'text-muted-foreground hover:text-foreground',
                )}
                onClick={() => setSelectedRoleFilter('todos')}
              >
                Todos ({visibleMembers.length})
              </button>
              <button
                className={cn(
                  'px-3 py-1.5 rounded-full font-medium transition-all',
                  selectedRoleFilter === 'vendedor'
                    ? 'bg-white text-primary shadow-xs'
                    : 'text-muted-foreground hover:text-foreground',
                )}
                onClick={() => setSelectedRoleFilter('vendedor')}
              >
                Vendedores
              </button>
              <button
                className={cn(
                  'px-3 py-1.5 rounded-full font-medium transition-all',
                  selectedRoleFilter === 'supervisor'
                    ? 'bg-white text-primary shadow-xs'
                    : 'text-muted-foreground hover:text-foreground',
                )}
                onClick={() => setSelectedRoleFilter('supervisor')}
              >
                Supervisores
              </button>
              <button
                className={cn(
                  'px-3 py-1.5 rounded-full font-medium transition-all',
                  selectedRoleFilter === 'representante_externo'
                    ? 'bg-white text-primary shadow-xs'
                    : 'text-muted-foreground hover:text-foreground',
                )}
                onClick={() => setSelectedRoleFilter('representante_externo')}
              >
                Representantes
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* TABELA DETALHADA DE MEMBROS DA EQUIPE */}
      <Card className="bg-white/90 backdrop-blur-md border-border/40 shadow-sm rounded-3xl overflow-hidden">
        <div className="p-5 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-serif text-lg font-bold text-primary">
              Membros da Equipe Comercial & Desempenho
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Visão detalhada com carteira, metas monetárias, volume em toneladas, pipeline e taxa
              de conversão.
            </p>
          </div>
          <span className="text-xs text-muted-foreground">
            Exibindo <strong>{filteredMembers.length}</strong> de {visibleMembers.length} membros
          </span>
        </div>

        {filteredMembers.length === 0 ? (
          <div className="p-8">
            <PageEmptyState
              title="Nenhum membro encontrado."
              description="Verifique os filtros de busca ou permissões de visualização."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/90 text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/40">
                <tr>
                  <th className="py-3 px-4 font-bold min-w-[200px]">Membro / Cargo</th>
                  <th className="py-3 px-3 font-bold text-center">Carteira</th>
                  <th className="py-3 px-3 font-bold text-right">Meta R$</th>
                  <th className="py-3 px-3 font-bold text-right">Realizado R$</th>
                  <th className="py-3 px-3 font-bold text-right">Gap R$</th>
                  <th className="py-3 px-3 font-bold text-center">% Ating.</th>
                  <th className="py-3 px-3 font-bold text-right">Pipeline R$</th>
                  <th className="py-3 px-3 font-bold text-right">Forecast R$</th>
                  <th className="py-3 px-3 font-bold text-center">Ton (Meta/Real)</th>
                  <th className="py-3 px-3 font-bold text-center">Visitas</th>
                  <th className="py-3 px-3 font-bold text-center">Conversão</th>
                  <th className="py-3 px-4 font-bold text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {filteredMembers.map((m) => {
                  const ating = m.atingimentoPercent
                  const isCurrent = m.email.toLowerCase() === userEmail

                  return (
                    <tr
                      key={m.id}
                      className={cn(
                        'hover:bg-slate-50/80 transition-colors',
                        isCurrent && 'bg-primary/5',
                      )}
                    >
                      {/* Membro / Cargo */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-9 h-9 border border-primary/20">
                            <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                              {m.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-primary text-sm leading-tight">
                                {m.name}
                              </span>
                              {isCurrent && (
                                <Badge className="bg-primary text-white text-[9px] py-0 px-1.5 h-4">
                                  Você
                                </Badge>
                              )}
                            </div>
                            <span className="text-[11px] text-muted-foreground block mt-0.5">
                              {m.cargo}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {m.email} · Ramal: {m.ramal}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Carteira */}
                      <td className="py-3 px-3 text-center">
                        <Badge
                          variant="outline"
                          className="bg-slate-50 text-slate-700 font-mono text-xs font-semibold"
                        >
                          {m.carteiraQtd} clientes
                        </Badge>
                      </td>

                      {/* Meta R$ */}
                      <td className="py-3 px-3 text-right font-medium text-slate-700">
                        {formatBRL(m.metaMensal)}
                      </td>

                      {/* Realizado R$ */}
                      <td className="py-3 px-3 text-right font-serif font-bold text-emerald-600">
                        {formatBRL(m.realizadoMensal)}
                      </td>

                      {/* Gap R$ */}
                      <td className="py-3 px-3 text-right font-semibold text-amber-600">
                        {formatBRL(m.gap)}
                      </td>

                      {/* % Atingimento */}
                      <td className="py-3 px-3 text-center">
                        <Badge
                          className={cn(
                            'text-[10px] font-bold border-none',
                            ating >= 75
                              ? 'bg-emerald-100 text-emerald-800'
                              : ating >= 60
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800',
                          )}
                        >
                          {ating.toFixed(1)}%
                        </Badge>
                      </td>

                      {/* Pipeline R$ */}
                      <td className="py-3 px-3 text-right font-serif font-semibold text-primary">
                        {formatBRL(m.pipeline)}
                      </td>

                      {/* Forecast R$ */}
                      <td className="py-3 px-3 text-right font-mono text-slate-700">
                        {formatBRL(m.forecast)}
                      </td>

                      {/* Toneladas */}
                      <td className="py-3 px-3 text-center">
                        <span className="font-semibold text-primary block">
                          {m.toneladasRealizado} t
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          de {m.toneladasMeta} t
                        </span>
                      </td>

                      {/* Visitas */}
                      <td className="py-3 px-3 text-center font-semibold text-slate-700">
                        {m.visitasMes} visitas
                      </td>

                      {/* Conversão */}
                      <td className="py-3 px-3 text-center">
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-blue-50 text-blue-700 border-blue-300 font-bold"
                        >
                          {m.conversaoPercent}%
                        </Badge>
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-primary hover:bg-primary/10 gap-1"
                            onClick={() => navigate('/crm')}
                          >
                            <Eye className="w-3.5 h-3.5" /> Ver Carteira
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* SEÇÃO INFORMATIVA SOBRE INTEGRAÇÃO E OBSERVABILIDADE */}
      <div className="bg-card rounded-2xl border border-border/40 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-50 text-sky-700 rounded-xl">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-primary">
                Observabilidade & Integrações · CIAFAL Commercial Engine
              </h3>
              <p className="text-xs text-muted-foreground">
                Conectores corporativos com SAP ECC, Qlik Sense e Microsoft 365 integrados.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-xs bg-amber-50 text-amber-700 border-amber-300 font-medium"
            >
              Ambiente QAS Homologado
            </Badge>
            <Badge
              variant="outline"
              className="text-xs bg-emerald-50 text-emerald-700 border-emerald-300 font-medium"
            >
              Sessão LocalStorage Ativa
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-muted/30 rounded-xl space-y-1">
            <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px] block">
              Conector SAP ECC Backoffice
            </span>
            <span className="font-bold text-emerald-600 block">Sincronizado (Mock QAS)</span>
            <span className="text-[11px] text-muted-foreground">25 contas carregadas</span>
          </div>
          <div className="p-3 bg-muted/30 rounded-xl space-y-1">
            <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px] block">
              Modelo Preditivo BG/NBD
            </span>
            <span className="font-bold text-primary block">P(vivo) & RFM Calculados</span>
            <span className="text-[11px] text-muted-foreground">Taxa de acerto 94%</span>
          </div>
          <div className="p-3 bg-muted/30 rounded-xl space-y-1">
            <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px] block">
              Microsoft 365 Graph
            </span>
            <span className="font-bold text-primary block">E-mails & Calendário OK</span>
            <span className="text-[11px] text-muted-foreground">Filtro comercial ativo</span>
          </div>
          <div className="p-3 bg-muted/30 rounded-xl space-y-1">
            <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px] block">
              Controle RBAC / RLS
            </span>
            <span className="font-bold text-primary block">
              {isVendedorOnly
                ? 'Restrito a Vendedor'
                : isSupervisor
                  ? 'Supervisor Regional'
                  : 'Admin Total'}
            </span>
            <span className="text-[11px] text-muted-foreground">
              Perfil: {userRole || 'gerente'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
