import React, { useState, useMemo } from 'react'
import { useAuth } from '@/hooks/use-auth'
import {
  mockClientes,
  mockEquipe,
  mockFunilOportunidades,
  mockAcoesDoDia,
  ClienteCarteira,
  OportunidadeFunil,
  AcaoDoDia,
} from '@/data/mockCommercialData'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
  Cell,
} from 'recharts'
import {
  TrendingUp,
  Target,
  Sparkles,
  DollarSign,
  Calendar,
  Clock,
  Phone,
  MessageSquare,
  Mail,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Flame,
  Building2,
  Users,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  BarChart3,
  Scale,
  ShieldAlert,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react'
import { customerManagementService } from '@/services/customer_management_service'
import { RFMSegmentBadge } from '@/components/shared/RFMSegmentBadge'
import { PageLoadingState, PageEmptyState, PageErrorState } from '@/components/shared/StateFeedback'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [completedActions, setCompletedActions] = useState<Record<string, boolean>>({})

  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    })
  }

  // Clientes que Precisam de Contato (Regra 19 - Integração Meu Dia + Cobertura da Carteira)
  const customersNeedingContact = useMemo(() => {
    const all = customerManagementService.getCustomers()
    return customerManagementService.getWhoToContactToday(all).slice(0, 4)
  }, [])

  // Identificação do Usuário e RLS
  const userRole = (user?.role || '').toLowerCase()
  const userEmail = (user?.email || '').toLowerCase()
  const isVendedorOnly = userRole === 'vendedor' || userRole === 'representante_externo'

  // Dados do Vendedor Logado
  const currentMember = useMemo(() => {
    return (
      mockEquipe.find((m) => m.email.toLowerCase() === userEmail) ||
      (userEmail.includes('vendedor2')
        ? mockEquipe.find((m) => m.id === 'eq-vend2')
        : userEmail.includes('representante')
          ? mockEquipe.find((m) => m.id === 'eq-rep')
          : isVendedorOnly
            ? mockEquipe.find((m) => m.id === 'eq-vend1')
            : mockEquipe[0]) ||
      mockEquipe[0]
    )
  }, [userEmail, isVendedorOnly])

  // Cálculos de Meta e Ritmo
  // Meta R$ / Realizado R$ / Gap R$ / % Atingimento / Dias restantes
  // Ritmo atual R$/dia vs Ritmo necessário R$/dia
  const meta = currentMember.metaMensal
  const realizado = currentMember.realizadoMensal
  const gap = currentMember.gap
  const atingimento = currentMember.atingimentoPercent
  const diasTotaisMes = 22 // dias úteis
  const diasPassados = 14
  const diasRestantes = 8

  const ritmoAtualPorDia = diasPassados > 0 ? Math.round(realizado / diasPassados) : 0
  const ritmoNecessarioPorDia = diasRestantes > 0 ? Math.round(gap / diasRestantes) : 0

  // Clientes Prioritários (Top 5 por score)
  const topClientes = useMemo(() => {
    const list = [...mockClientes]
    if (isVendedorOnly) {
      return list
        .filter(
          (c) =>
            c.vendedorId === currentMember.userId ||
            c.vendedor.toLowerCase().includes(currentMember.name.split(' ')[0].toLowerCase()),
        )
        .sort((a, b) => b.scoreComercial - a.scoreComercial)
        .slice(0, 5)
    }
    return list.sort((a, b) => b.scoreComercial - a.scoreComercial).slice(0, 5)
  }, [isVendedorOnly, currentMember])

  // Oportunidades do Vendedor
  const vendedorOps = useMemo(() => {
    if (isVendedorOnly) {
      return mockFunilOportunidades
        .filter(
          (op) =>
            op.vendedorId === currentMember.userId ||
            op.vendedorNome.toLowerCase().includes(currentMember.name.split(' ')[0].toLowerCase()),
        )
        .slice(0, 4)
    }
    return mockFunilOportunidades.slice(0, 4)
  }, [isVendedorOnly, currentMember])

  // Agenda do Dia (Mock de visitas/reuniões)
  const agendaDoDia = [
    {
      id: 'ag-1',
      horario: '09:30 - 10:15',
      tipo: 'WhatsApp Call',
      cliente: 'Metalúrgica Santa Rita Ltda',
      contato: 'Eduardo (Comprador)',
      pauta: 'Follow-up da cotação de 16.5t Perfis W',
      status: 'confirmado',
    },
    {
      id: 'ag-2',
      horario: '11:00 - 12:00',
      tipo: 'Reunião Teams M365',
      cliente: 'Aços & Caldeiraria Betim S.A.',
      contato: 'Roberto (Diretor Industrial)',
      pauta: 'Alinhamento do desconto de 2.5% em Chapas Grossas',
      status: 'confirmado',
    },
    {
      id: 'ag-3',
      horario: '14:30 - 16:00',
      tipo: 'Visita Presencial',
      cliente: 'Construtora Horizonte Belo Ltda',
      contato: 'Eng. Marcelo',
      pauta: 'Apresentação técnica de Vergalhões CA-50 no canteiro',
      status: 'pendente',
    },
  ]

  const toggleAction = (id: string) => {
    setCompletedActions((prev) => {
      const next = !prev[id]
      if (next) toast.success('Ação concluída com sucesso!')
      return { ...prev, [id]: next }
    })
  }

  const getCanalIcon = (canal: string) => {
    switch (canal) {
      case 'WhatsApp':
        return <MessageSquare className="w-3.5 h-3.5 text-emerald-600 inline mr-1" />
      case 'Telefone':
        return <Phone className="w-3.5 h-3.5 text-blue-600 inline mr-1" />
      case 'E-mail':
        return <Mail className="w-3.5 h-3.5 text-indigo-600 inline mr-1" />
      case 'Visita':
        return <MapPin className="w-3.5 h-3.5 text-amber-600 inline mr-1" />
      default:
        return null
    }
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in pb-16">
      {/* BOAS-VINDAS / COCKPIT HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-primary/10 rounded-2xl">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-3xl font-bold text-primary tracking-tight">
                  Meu Dia · Cockpit Comercial
                </h1>
                <Badge
                  variant="outline"
                  className="text-xs bg-emerald-50 text-emerald-700 border-emerald-300"
                >
                  {currentMember.cargo}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground font-sans mt-0.5">
                Olá, <strong>{currentMember.name}</strong>. Aqui está seu plano de ação diário
                baseado em inteligência preditiva.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              toast.info('Recalculando recomendações BG/NBD do dia...')
            }}
            className="h-9 gap-1.5 text-xs text-muted-foreground"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Recalcular Ações
          </Button>
          <Button
            size="sm"
            onClick={() => navigate('/crm')}
            className="h-9 gap-1.5 text-xs bg-primary text-white"
          >
            <Building2 className="w-3.5 h-3.5" />
            Ver Carteira Completa
          </Button>
        </div>
      </div>

      {/* COCKPIT DO VENDEDOR — 2 CARDS GRANDES: META E RITMO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* CARD META */}
        <Card className="bg-white/95 backdrop-blur-md border-border/40 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                <h3 className="font-serif font-bold text-lg text-primary">
                  Desempenho da Meta Mensal
                </h3>
              </div>
              <Badge className="bg-emerald-100 text-emerald-800 text-xs font-bold border-none">
                {atingimento.toFixed(1)}% Atingido
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="p-3 bg-slate-50 rounded-2xl border border-border/40">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Meta Mensal
                </span>
                <span className="font-serif text-lg font-bold text-slate-900 block mt-0.5">
                  {formatBRL(meta)}
                </span>
              </div>

              <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                  Realizado
                </span>
                <span className="font-serif text-lg font-bold text-emerald-700 block mt-0.5">
                  {formatBRL(realizado)}
                </span>
              </div>

              <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                  Gap Faltante
                </span>
                <span className="font-serif text-lg font-bold text-amber-600 block mt-0.5">
                  {formatBRL(gap)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Progress value={atingimento} className="h-3 bg-slate-100" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Passados: {diasPassados} dias úteis</span>
                <span className="font-semibold text-primary">
                  Restam: {diasRestantes} dias úteis
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-border/30 mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Volume: <strong>{currentMember.toneladasRealizado}t</strong> de{' '}
              {currentMember.toneladasMeta}t
            </span>
            <span>
              Conversão: <strong>{currentMember.conversaoPercent}%</strong>
            </span>
          </div>
        </Card>

        {/* CARD RITMO */}
        <Card className="bg-white/95 backdrop-blur-md border-border/40 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <h3 className="font-serif font-bold text-lg text-primary">
                  Ritmo Comercial Diário
                </h3>
              </div>
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300">
                Controle de Cadência
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-border/40 space-y-1">
                <span className="text-xs font-semibold text-muted-foreground">Ritmo Atual</span>
                <span className="font-serif text-2xl font-bold text-slate-800 block">
                  {formatBRL(ritmoAtualPorDia)}
                  <span className="text-xs font-normal text-muted-foreground">/dia</span>
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  Média realizada nos 14 dias anteriores
                </span>
              </div>

              <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-1">
                <span className="text-xs font-semibold text-emerald-800">Ritmo Necessário</span>
                <span className="font-serif text-2xl font-bold text-emerald-700 block">
                  {formatBRL(ritmoNecessarioPorDia)}
                  <span className="text-xs font-normal text-emerald-600">/dia</span>
                </span>
                <span className="text-[11px] text-emerald-700 font-medium block">
                  Necessário nos próximos 8 dias úteis
                </span>
              </div>
            </div>

            <div className="p-3 bg-muted/20 rounded-xl text-xs text-muted-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                Seu ritmo atual cobre{' '}
                <strong>{Math.round((ritmoAtualPorDia / ritmoNecessarioPorDia) * 100)}%</strong> do
                ritmo necessário. Fechar as 2 cotações prioritárias de hoje garantirá 100% da meta.
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-border/30 mt-4 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Pipeline Pessoal: <strong>{formatBRL(currentMember.pipeline)}</strong>
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                if (typeof navigate === 'function') {
                  navigate('/crm?tab=funil')
                }
              }}
              className="h-7 text-xs text-primary gap-1"
            >
              Ver Funil <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </Card>
      </div>

      {/* SEÇÃO ANALÍTICA: GRÁFICOS MEU DIA (Meta x Realizado em Toneladas e Ritmo Atual vs Necessário) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* GRÁFICO 1: META X REALIZADO (t) */}
        <Card className="bg-white/95 backdrop-blur-md border-border/40 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-primary" />
              <div>
                <h4 className="font-serif font-bold text-sm text-primary">
                  Meta x Realizado em Toneladas (t)
                </h4>
                <span className="text-[10px] text-muted-foreground">
                  Acompanhamento de volume físico de aço entregue vs meta
                </span>
              </div>
            </div>
            <Badge variant="outline" className="text-xs bg-slate-50 font-bold text-primary">
              {currentMember.toneladasRealizado}t de {currentMember.toneladasMeta}t
            </Badge>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: 'Meta Mês', toneladas: currentMember.toneladasMeta, fill: '#cbd5e1' },
                  {
                    name: 'Realizado',
                    toneladas: currentMember.toneladasRealizado,
                    fill: '#004A8F',
                  },
                  {
                    name: 'Gap',
                    toneladas: Math.max(
                      0,
                      currentMember.toneladasMeta - currentMember.toneladasRealizado,
                    ),
                    fill: '#f59e0b',
                  },
                ]}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} unit="t" />
                <Tooltip
                  formatter={(val: number) => [`${val.toFixed(1)} toneladas`, 'Volume']}
                  contentStyle={{
                    borderRadius: '12px',
                    fontSize: '11px',
                    border: '1px solid #e2e8f0',
                  }}
                />
                <Bar dataKey="toneladas" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* GRÁFICO 2: RITMO ATUAL VS NECESSÁRIO (DIÁRIO) */}
        <Card className="bg-white/95 backdrop-blur-md border-border/40 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <div>
                <h4 className="font-serif font-bold text-sm text-primary">
                  Ritmo Diário de Vendas (R$/dia)
                </h4>
                <span className="text-[10px] text-muted-foreground">
                  Comparativo de velocidade comercial para cobrir o Gap nos {diasRestantes} dias
                  restantes
                </span>
              </div>
            </div>
            <Badge className="text-[10px] bg-emerald-100 text-emerald-800 border-none font-bold">
              {formatBRL(ritmoNecessarioPorDia)}/dia nec.
            </Badge>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={[
                  { name: 'Ritmo Atual', valor: ritmoAtualPorDia, fill: '#3b82f6' },
                  { name: 'Ritmo Necessário', valor: ritmoNecessarioPorDia, fill: '#10b981' },
                ]}
                margin={{ top: 10, right: 20, left: 35, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
                />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: number) => [formatBRL(val), 'Valor diário']}
                  contentStyle={{
                    borderRadius: '12px',
                    fontSize: '11px',
                    border: '1px solid #e2e8f0',
                  }}
                />
                <Bar dataKey="valor" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* BLOCO REGRA 19: CLIENTES QUE PRECISAM DE CONTATO (COBERTURA VENCIDA & PRIORIDADE) */}
      <Card className="bg-slate-900/95 border-sky-900/60 text-slate-100 rounded-3xl p-6 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg font-bold text-white tracking-tight">
                  Clientes que Precisam de Contato
                </h3>
                <Badge className="bg-amber-500 text-slate-950 text-[10px] font-bold">
                  Cobertura da Carteira
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Priorização algorítmica: Cobertura vencida, ISC vulnerável, queda de compra e
                produtos recomendados.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => navigate('/gestao-clientes')}
            className="h-8 text-xs bg-sky-600 hover:bg-sky-500 text-white rounded-xl gap-1"
          >
            Ver Cobertura Completa <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {customersNeedingContact.map((sug) => (
            <div
              key={sug.cliente.id}
              className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-sky-500/50 transition-all flex flex-col justify-between gap-2.5"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 text-sky-400 border border-slate-800">
                    {sug.prioridade}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                      sug.cliente.coberturaVencidaDias > 0
                        ? 'bg-rose-950 text-rose-300 border border-rose-800/50'
                        : 'bg-emerald-950 text-emerald-300'
                    }`}
                  >
                    {sug.cliente.coberturaVencidaDias > 0
                      ? `Cobertura vencida há ${sug.cliente.coberturaVencidaDias}d`
                      : 'Janela próxima'}
                  </span>
                </div>

                <div>
                  <strong
                    onClick={() => navigate('/gestao-clientes')}
                    className="text-sm font-bold text-white hover:text-sky-300 cursor-pointer transition-colors block"
                  >
                    {sug.cliente.nomeFantasia || sug.cliente.razaoSocial}
                  </strong>
                  <span className="text-[11px] text-slate-400">
                    ISC: <strong className="text-amber-400">{sug.cliente.isc}/100</strong> · Último
                    pedido: {sug.cliente.diasSemPedido}d atrás
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/60 text-[11px] text-slate-300">
                  <span className="text-[10px] uppercase font-bold text-sky-400 block">
                    Produto Sugerido:
                  </span>
                  <strong className="text-white">{sug.produtoSugerido.descricao}</strong>
                  <span className="text-slate-400 block text-[10px]">
                    {sug.produtoSugerido.motivo}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <Button
                  size="sm"
                  onClick={() => {
                    toast.success(
                      `Contato via ${sug.acaoRecomendada} iniciado com ${sug.cliente.nomeFantasia}`,
                    )
                    navigate('/gestao-clientes')
                  }}
                  className="flex-1 h-8 text-xs bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl gap-1"
                >
                  {sug.acaoRecomendada === 'WhatsApp' && <MessageSquare className="w-3.5 h-3.5" />}
                  {sug.acaoRecomendada === 'Ligar' && <Phone className="w-3.5 h-3.5" />}
                  {sug.acaoRecomendada === 'E-mail' && <Mail className="w-3.5 h-3.5" />}
                  {sug.acaoRecomendada === 'Enviar Catálogo' && (
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                  )}
                  <span>{sug.acaoRecomendada}</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/gestao-clientes')}
                  className="h-8 text-xs border-slate-800 bg-slate-900 text-slate-300 hover:text-white rounded-xl"
                >
                  Gerar Cotação
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* SEÇÃO PRINCIPAL: AÇÕES DO DIA (5-8 AÇÕES RECOMENDADAS) */}
      <Card className="bg-white/95 backdrop-blur-md border-border/40 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h3 className="font-serif text-xl font-bold text-primary">
                Ações Recomendadas do Dia
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Oportunidades, campanhas de reativação, clientes sem cobertura e estoque parado com
              maior impacto comercial.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => navigate('/central-acoes')}
              className="h-8 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl gap-1.5 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Central de Ações</span>
            </Button>
            <Badge className="bg-primary text-white text-xs">
              {mockAcoesDoDia.length} Ações Prioritárias
            </Badge>
          </div>{' '}
        </div>

        <div className="space-y-3">
          {mockAcoesDoDia.map((acao) => {
            const isDone = completedActions[acao.id]

            return (
              <div
                key={acao.id}
                className={cn(
                  'p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4',
                  isDone
                    ? 'bg-slate-50 border-slate-200 opacity-60'
                    : acao.urgencia === 'urgente'
                      ? 'bg-amber-50/40 border-amber-200 hover:border-amber-400'
                      : 'bg-white border-border/50 hover:border-primary/40',
                )}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      className={cn(
                        'text-[10px] font-bold border-none',
                        acao.urgencia === 'urgente'
                          ? 'bg-rose-100 text-rose-800'
                          : acao.urgencia === 'alta'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800',
                      )}
                    >
                      {acao.tipoAcao}
                    </Badge>
                    <span
                      onClick={() => navigate(`/crm/${acao.clienteId}`)}
                      className="font-bold text-sm text-primary hover:underline cursor-pointer"
                    >
                      {acao.clienteNome}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      SAP {acao.clienteSap} · {acao.cidadeUf}
                    </span>
                  </div>

                  <p className="text-xs text-slate-800 font-medium">{acao.recomendacao}</p>
                  <p className="text-[11px] text-muted-foreground">{acao.justificativa}</p>
                </div>

                <div className="flex flex-wrap items-center gap-4 shrink-0 border-t md:border-t-0 pt-2 md:pt-0">
                  <div className="text-right">
                    <span className="font-serif font-bold text-sm text-emerald-600 block">
                      {formatBRL(acao.potencialValor)}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {acao.potencialTon.toLocaleString('pt-BR')} t ·{' '}
                      {getCanalIcon(acao.canalSugerido)} {acao.horarioSugerido}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/crm/${acao.clienteId}`)}
                      className="h-8 text-xs text-primary border-primary/30 hover:bg-primary/10"
                    >
                      Abrir 360º
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => toggleAction(acao.id)}
                      className={cn(
                        'h-8 text-xs text-white gap-1',
                        isDone ? 'bg-slate-500' : 'bg-emerald-600 hover:bg-emerald-700',
                      )}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isDone ? 'Concluída' : 'Concluir'}
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* GRADE INFERIOR: CLIENTES PRIORITÁRIOS, OPORTUNIDADES E AGENDA DO DIA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* TOP 5 CLIENTES PRIORITÁRIOS */}
        <Card className="bg-white/95 backdrop-blur-md border-border/40 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              <h4 className="font-serif font-bold text-sm text-primary">Clientes Prioritários</h4>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate('/crm')}
              className="h-7 text-xs text-primary p-0"
            >
              Ver todos
            </Button>
          </div>

          <div className="space-y-2.5">
            {topClientes.map((c) => (
              <div
                key={c.id}
                onClick={() => navigate(`/crm/${c.id}`)}
                className="p-3 bg-slate-50 hover:bg-slate-100 transition-colors rounded-2xl border border-border/30 cursor-pointer flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-xs text-slate-900 block hover:text-primary">
                    {c.nomeFantasia || c.razaoSocial}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {c.cidade}/{c.uf} · Fat: {formatBRL(c.faturamento12m)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-serif font-bold text-xs text-primary block">
                    Score {c.scoreComercial}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    {c.pVivo}% P(vivo)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* OPORTUNIDADES ATIVAS / FOLLOW-UPS */}
        <Card className="bg-white/95 backdrop-blur-md border-border/40 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h4 className="font-serif font-bold text-sm text-primary">Oportunidades Ativas</h4>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate('/crm?tab=funil')}
              className="h-7 text-xs text-primary p-0"
            >
              Abrir Funil
            </Button>
          </div>

          <div className="space-y-2.5">
            {vendedorOps.map((op) => (
              <div
                key={op.id}
                onClick={() => navigate(`/crm/${op.clienteId}`)}
                className="p-3 bg-slate-50 hover:bg-slate-100 transition-colors rounded-2xl border border-border/30 cursor-pointer space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-primary">{op.clienteNome}</span>
                  <Badge className="text-[9px] bg-primary/10 text-primary border-none">
                    {op.probabilidade}%
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-700 font-medium line-clamp-1">{op.titulo}</p>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-serif font-bold text-emerald-600">
                    {formatBRL(op.valor)}
                  </span>
                  <span className="text-slate-500">Prev: {op.previsaoFechamento}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* AGENDA DO DIA (VISITAS / REUNIÕES) */}
        <Card className="bg-white/95 backdrop-blur-md border-border/40 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <h4 className="font-serif font-bold text-sm text-primary">Agenda Comercial</h4>
            </div>
            <Badge variant="outline" className="text-[10px] bg-white">
              Microsoft 365
            </Badge>
          </div>

          <div className="space-y-2.5">
            {agendaDoDia.map((ag) => (
              <div
                key={ag.id}
                className="p-3 bg-slate-50 rounded-2xl border border-border/30 space-y-1"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-900">{ag.horario}</span>
                  <Badge className="text-[9px] bg-blue-100 text-blue-800 border-none font-bold">
                    {ag.tipo}
                  </Badge>
                </div>
                <span className="font-bold text-xs text-primary block">{ag.cliente}</span>
                <p className="text-[10px] text-slate-600">
                  {ag.contato} · {ag.pauta}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
