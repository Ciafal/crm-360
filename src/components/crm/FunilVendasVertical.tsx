import { useState } from 'react'
import { AdvancedOpportunity, formatBRL, formatTonsABNT } from '@/services/opportunity_lead_service'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Filter,
  Layers,
  ChevronRight,
  ChevronDown,
  Sparkles,
  BarChart3,
  Calendar,
  User,
  Building2,
  DollarSign,
  Scale,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface MacroFunilLevel {
  id: number
  nome: string
  estagiosCiafal: string[]
  widthPct: number // % no trapézio vertical (100% no topo descendo até ~28%)
  corBg: string
  corBorder: string
  corTexto: string
}

export const MACRO_FUNIL_LEVELS: MacroFunilLevel[] = [
  {
    id: 1,
    nome: '1. RELACIONAMENTO COM CLIENTE',
    estagiosCiafal: ['relacionamento', 'contato_inicial'],
    widthPct: 100,
    corBg: 'from-blue-900 to-sky-900',
    corBorder: 'border-sky-800',
    corTexto: 'text-sky-200',
  },
  {
    id: 2,
    nome: '2. PRIORIZAÇÃO',
    estagiosCiafal: ['priorizacao', 'classificacao'],
    widthPct: 91,
    corBg: 'from-blue-800 to-sky-800',
    corBorder: 'border-sky-700',
    corTexto: 'text-sky-200',
  },
  {
    id: 3,
    nome: '3. PESQUISA / PROSPECÇÃO',
    estagiosCiafal: ['pesquisa', 'prospeccao_ativa'],
    widthPct: 82,
    corBg: 'from-blue-700 to-cyan-800',
    corBorder: 'border-cyan-700',
    corTexto: 'text-cyan-100',
  },
  {
    id: 4,
    nome: '4. PADRÕES DE CONTATO',
    estagiosCiafal: ['padrao_contato', 'contato_estabelecido'],
    widthPct: 73,
    corBg: 'from-cyan-800 to-cyan-700',
    corBorder: 'border-cyan-600',
    corTexto: 'text-cyan-100',
  },
  {
    id: 5,
    nome: '5. QUALIFICAÇÃO',
    estagiosCiafal: ['qualificacao', 'levantamento_necessidade'],
    widthPct: 64,
    corBg: 'from-cyan-700 to-teal-700',
    corBorder: 'border-teal-600',
    corTexto: 'text-teal-100',
  },
  {
    id: 6,
    nome: '6. LEAD QUALIFICADO PARA VENDAS',
    estagiosCiafal: ['lead_qualificado', 'sql'],
    widthPct: 55,
    corBg: 'from-teal-700 to-emerald-800',
    corBorder: 'border-emerald-700',
    corTexto: 'text-emerald-100',
  },
  {
    id: 7,
    nome: '7. OPORTUNIDADE ACEITA POR VENDAS',
    estagiosCiafal: ['especulacao', 'interesse', 'necessidade_detectada'],
    widthPct: 46,
    corBg: 'from-amber-600 to-amber-700',
    corBorder: 'border-amber-500',
    corTexto: 'text-amber-100',
  },
  {
    id: 8,
    nome: '8. PIPELINE',
    estagiosCiafal: [
      'em_qualificacao',
      'solicitacao_cotacao',
      'cotacao_gerada',
      'negociacao',
      'cotacao',
    ],
    widthPct: 37,
    corBg: 'from-orange-600 to-orange-700',
    corBorder: 'border-orange-500',
    corTexto: 'text-orange-100',
  },
  {
    id: 9,
    nome: '9. NEGÓCIO FECHADO',
    estagiosCiafal: ['fechada_ganha', 'convertida_pedido', 'pedido', 'faturado'],
    widthPct: 28,
    corBg: 'from-emerald-600 to-green-700',
    corBorder: 'border-emerald-500',
    corTexto: 'text-emerald-100',
  },
]

export interface FunilFiltrosState {
  periodo: string
  vendedor: string
  cliente: string
  grupoMercadoria: string
  segmento: string
  origem: string
  probabilidade: string
  estagio: string
}

interface FunilVendasVerticalProps {
  oportunidades: AdvancedOpportunity[]
  commercialMetric: 'valor' | 'volume'
  onSelectOpportunity: (opp: AdvancedOpportunity) => void
  onNovaOportunidadeClick: () => void
}

export function FunilVendasVertical({
  oportunidades,
  commercialMetric,
  onSelectOpportunity,
  onNovaOportunidadeClick,
}: FunilVendasVerticalProps) {
  // Filtros
  const [filtros, setFiltros] = useState<FunilFiltrosState>({
    periodo: 'mes',
    vendedor: 'todos',
    cliente: '',
    grupoMercadoria: 'todos',
    segmento: 'todos',
    origem: 'todos',
    probabilidade: 'todas',
    estagio: 'todos',
  })

  // Drill-down ativo (id do nível macro 1..9 ou null)
  const [drillDownLevelId, setDrillDownLevelId] = useState<number | null>(7)

  // Separar registros ativos vs saídas (perdidas / suspensas / canceladas)
  const { ativas, perdas } = oportunidades.reduce(
    (acc, opp) => {
      const est = (opp.estagioCiafal || opp.etapa || '').toLowerCase()
      if (
        est.includes('perdid') ||
        est.includes('cancel') ||
        est.includes('suspens') ||
        est === 'adiado'
      ) {
        acc.perdas.push(opp)
      } else {
        acc.ativas.push(opp)
      }
      return acc
    },
    { ativas: [] as AdvancedOpportunity[], perdas: [] as AdvancedOpportunity[] },
  )

  // Filtragem
  const oportunidadesFiltradas = ativas.filter((opp) => {
    if (filtros.vendedor !== 'todos') {
      const vendNome = (opp.vendedorNome || '').toLowerCase()
      if (!vendNome.includes(filtros.vendedor.toLowerCase())) return false
    }
    if (filtros.cliente.trim()) {
      const termo = filtros.cliente.toLowerCase()
      const matchNome = (opp.clienteNome || '').toLowerCase().includes(termo)
      const matchSap = (opp.clienteSap || '').includes(termo)
      const matchSeq = (opp.numeroSequencial || '').toLowerCase().includes(termo)
      if (!matchNome && !matchSap && !matchSeq) return false
    }
    if (filtros.grupoMercadoria !== 'todos') {
      if (opp.grupoMercadoria !== filtros.grupoMercadoria) return false
    }
    if (filtros.origem !== 'todos') {
      if (opp.origemOportunidade !== filtros.origem) return false
    }
    if (filtros.probabilidade !== 'todas') {
      if (opp.probabilidadeClassificacao !== filtros.probabilidade) return false
    }
    if (filtros.estagio !== 'todos') {
      if (opp.estagioCiafal !== filtros.estagio && opp.etapa !== filtros.estagio) return false
    }
    return true
  })

  // Mapeamento dos 9 níveis
  function mapOppToLevel(opp: AdvancedOpportunity): number {
    const est = (opp.estagioCiafal || '').toLowerCase()
    const etapa = (opp.etapa || '').toLowerCase()

    if (
      est === 'fechada_ganha' ||
      est === 'convertida_pedido' ||
      etapa === 'pedido' ||
      etapa === 'faturado'
    ) {
      return 9
    }
    if (
      est === 'em_qualificacao' ||
      est === 'solicitacao_cotacao' ||
      est === 'cotacao_gerada' ||
      est === 'negociacao' ||
      etapa === 'cotacao' ||
      etapa === 'negociacao'
    ) {
      return 8
    }
    if (
      est === 'especulacao' ||
      est === 'interesse' ||
      est === 'necessidade_detectada' ||
      etapa === 'prospeccao' ||
      etapa === 'oportunidade'
    ) {
      return 7
    }
    if (est === 'lead_qualificado' || est === 'sql') return 6
    if (est === 'qualificacao' || etapa === 'necessidade') return 5
    if (est === 'padrao_contato' || etapa === 'contato') return 4
    if (est === 'pesquisa' || est === 'prospeccao_ativa') return 3
    if (est === 'priorizacao') return 2
    return 1 // Relacionamento
  }

  // Agrupar oportunidades por nível macro
  const levelData = MACRO_FUNIL_LEVELS.map((lvl) => {
    const oppsInLevel = oportunidadesFiltradas.filter((o) => mapOppToLevel(o) === lvl.id)
    const count = oppsInLevel.length
    const valorTotal = oppsInLevel.reduce((sum, o) => {
      const val = o.valorPotencialCalculado ?? (o.valor > 0 ? o.valor : 0)
      return sum + val
    }, 0)
    const toneladasTotal = oppsInLevel.reduce((sum, o) => {
      const t = o.quantidadeEstimadaTons ?? (o.toneladas > 0 ? o.toneladas : 0)
      return sum + t
    }, 0)

    // Tempo médio na etapa em dias
    const tempoMedioDias =
      count > 0
        ? Math.round(
            oppsInLevel.reduce((acc, o) => acc + (o.tempoNoEstagioDias || o.agingDias || 0), 0) /
              count,
          )
        : 0

    return {
      ...lvl,
      opps: oppsInLevel,
      count,
      valorTotal,
      toneladasTotal,
      tempoMedioDias,
      taxaConversaoProxima: 0, // calculado abaixo
    }
  })

  // Calcular taxa de conversão para o próximo nível
  for (let i = 0; i < levelData.length - 1; i++) {
    const current = levelData[i]
    const next = levelData[i + 1]
    if (current.count > 0) {
      current.taxaConversaoProxima = Math.min(Math.round((next.count / current.count) * 100), 100)
    } else {
      current.taxaConversaoProxima = 0
    }
  }

  // Alertas inteligentes calculados
  const alertas = []

  // Alerta 1: Paradas > 30 dias no mesmo estágio
  const paradasMais30Dias = oportunidadesFiltradas.filter((o) => {
    const dias = o.tempoNoEstagioDias || o.agingDias || 0
    return dias > 30
  })
  if (paradasMais30Dias.length > 0) {
    const especulacaoCount = paradasMais30Dias.filter(
      (o) =>
        (o.estagioCiafal || o.etapa) === 'especulacao' ||
        (o.estagioCiafal || o.etapa) === 'prospeccao',
    ).length
    alertas.push({
      tipo: 'warning',
      titulo: 'Oportunidades Estagnadas',
      mensagem:
        especulacaoCount > 0
          ? `${especulacaoCount} oportunidades permanecem em Especulação há mais de 30 dias.`
          : `${paradasMais30Dias.length} oportunidades permanecem no mesmo estágio há mais de 30 dias.`,
      count: paradasMais30Dias.length,
    })
  }

  // Alerta 2: Previsão de compra vencida
  const previsaoVencida = oportunidadesFiltradas.filter((o) => {
    if (!o.previsaoFechamento) return false
    const hoje = new Date().toISOString().split('T')[0]
    return o.previsaoFechamento < hoje
  })
  if (previsaoVencida.length > 0) {
    alertas.push({
      tipo: 'danger',
      titulo: 'Previsão de Fechamento Vencida',
      mensagem: `${previsaoVencida.length} oportunidades com data de previsão de compra já expirada sem conversão.`,
      count: previsaoVencida.length,
    })
  }

  // Alerta 3: Alto potencial sem próxima ação ou sem interação > 15 dias
  const altoPotencialSemAcao = oportunidadesFiltradas.filter((o) => {
    const val = o.valorPotencialCalculado ?? o.valor
    const dias = o.tempoNoEstagioDias || o.agingDias || 0
    const semAcao = !o.proximaAcao || o.proximaAcao.trim().length === 0
    return val >= 100000 && (semAcao || dias > 15)
  })
  if (altoPotencialSemAcao.length > 0) {
    alertas.push({
      tipo: 'info',
      titulo: 'Alto Potencial sem Próxima Ação',
      mensagem: `${altoPotencialSemAcao.length} oportunidades de alto valor (≥ R$ 100k) sem próxima ação cadastrada ou sem interação há mais de 15 dias.`,
      count: altoPotencialSemAcao.length,
    })
  }

  // Nível selecionado para drill-down
  const selectedLevel = levelData.find((l) => l.id === drillDownLevelId) || levelData[6]

  return (
    <div className="space-y-6">
      {/* BARRA DE FILTROS DO FUNIL */}
      <Card className="p-4 bg-white/90 backdrop-blur-md border border-slate-200 rounded-3xl shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#003A70]" />
            <h3 className="font-serif text-sm font-bold text-[#003A70]">
              Filtros do Funil de Vendas
            </h3>
            <Badge variant="outline" className="text-[10px] text-muted-foreground">
              {oportunidadesFiltradas.length} ativas de {oportunidades.length} totais
            </Badge>
          </div>

          <Button
            size="sm"
            onClick={onNovaOportunidadeClick}
            className="h-8 gap-1.5 text-xs bg-[#003A70] hover:bg-[#002d57] text-white rounded-xl font-semibold shadow-xs"
          >
            + Nova Oportunidade
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-3">
          {/* Período */}
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">
              Período
            </label>
            <Select
              value={filtros.periodo}
              onValueChange={(v) => setFiltros((prev) => ({ ...prev, periodo: v }))}
            >
              <SelectTrigger className="h-8 text-xs rounded-xl bg-slate-50">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mes">Mês Atual</SelectItem>
                <SelectItem value="ytd">YTD (Ano até hoje)</SelectItem>
                <SelectItem value="12meses">Últimos 12 Meses</SelectItem>
                <SelectItem value="ano">Ano 2026</SelectItem>
                <SelectItem value="personalizado">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Vendedor */}
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">
              Vendedor
            </label>
            <Select
              value={filtros.vendedor}
              onValueChange={(v) => setFiltros((prev) => ({ ...prev, vendedor: v }))}
            >
              <SelectTrigger className="h-8 text-xs rounded-xl bg-slate-50">
                <SelectValue placeholder="Vendedor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="Carlos Mendonça">Carlos Mendonça</SelectItem>
                <SelectItem value="Mariana Azevedo">Mariana Azevedo</SelectItem>
                <SelectItem value="João Pedro">João Pedro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Cliente (Busca) */}
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">
              Cliente / SAP / OPP
            </label>
            <Input
              placeholder="Buscar..."
              value={filtros.cliente}
              onChange={(e) => setFiltros((prev) => ({ ...prev, cliente: e.target.value }))}
              className="h-8 text-xs rounded-xl bg-slate-50"
            />
          </div>

          {/* Grupo de Mercadorias */}
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">
              Grupo de Mercadorias
            </label>
            <Select
              value={filtros.grupoMercadoria}
              onValueChange={(v) => setFiltros((prev) => ({ ...prev, grupoMercadoria: v }))}
            >
              <SelectTrigger className="h-8 text-xs rounded-xl bg-slate-50">
                <SelectValue placeholder="Grupo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Grupos</SelectItem>
                <SelectItem value="Tubos Industriais e Estruturais">Tubos</SelectItem>
                <SelectItem value="Chapas Grossas e Finas">Chapas</SelectItem>
                <SelectItem value="Perfis Estruturais I / W / U">Perfis</SelectItem>
                <SelectItem value="Aço para Construção Civil (CA-50 / CA-60)">
                  Construção Civil
                </SelectItem>
                <SelectItem value="Bobinas e Tiras de Aço">Bobinas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Origem */}
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">
              Origem
            </label>
            <Select
              value={filtros.origem}
              onValueChange={(v) => setFiltros((prev) => ({ ...prev, origem: v }))}
            >
              <SelectTrigger className="h-8 text-xs rounded-xl bg-slate-50">
                <SelectValue placeholder="Origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas Origens</SelectItem>
                <SelectItem value="contato_vendedor">Contato Vendedor</SelectItem>
                <SelectItem value="especulacao_cliente">Especulação Cliente</SelectItem>
                <SelectItem value="lead_inbound">Lead Inbound</SelectItem>
                <SelectItem value="campanha_marketing">Campanha</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Probabilidade */}
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">
              Probabilidade
            </label>
            <Select
              value={filtros.probabilidade}
              onValueChange={(v) => setFiltros((prev) => ({ ...prev, probabilidade: v }))}
            >
              <SelectTrigger className="h-8 text-xs rounded-xl bg-slate-50">
                <SelectValue placeholder="Probabilidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="baixa">Baixa (20%)</SelectItem>
                <SelectItem value="media">Média (50%)</SelectItem>
                <SelectItem value="alta">Alta (80%)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Limpar Filtros */}
          <div className="flex items-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setFiltros({
                  periodo: 'mes',
                  vendedor: 'todos',
                  cliente: '',
                  grupoMercadoria: 'todos',
                  segmento: 'todos',
                  origem: 'todos',
                  probabilidade: 'todas',
                  estagio: 'todos',
                })
              }
              className="h-8 w-full text-xs rounded-xl border-slate-200 text-slate-600 hover:bg-slate-100"
            >
              Limpar Filtros
            </Button>
          </div>
        </div>
      </Card>

      {/* PAINEL ANÁLISE DO FUNIL COM ALERTAS */}
      {alertas.length > 0 && (
        <Card className="p-4 bg-gradient-to-r from-amber-50/70 via-orange-50/40 to-white border border-amber-200 rounded-3xl">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <h4 className="font-serif text-sm font-bold text-amber-950">
              Análise do Funil & Alertas Operacionais
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {alertas.map((alerta, i) => (
              <div
                key={i}
                className="p-3 bg-white/90 border border-amber-200 rounded-2xl shadow-2xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-amber-950">{alerta.titulo}</span>
                  <Badge className="bg-amber-100 text-amber-900 border-none text-[10px] font-bold">
                    {alerta.count}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-700 leading-snug">{alerta.mensagem}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* SEÇÃO PRINCIPAL: GRÁFICO VERTICAL EM TRAPÉZIO & DRILL-DOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* COLUNA ESQUERDA: GRÁFICO VERTICAL DO FUNIL (TRAPÉZIO DE 9 NÍVEIS) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#003A70]" />
              <h3 className="font-serif text-base font-bold text-[#003A70]">
                Gráfico Vertical do Funil (9 Níveis Macro)
              </h3>
            </div>
            <span className="text-[11px] text-muted-foreground">
              Métrica:{' '}
              <strong className="text-slate-800">
                {commercialMetric === 'volume' ? 'Toneladas (t)' : 'Valor (R$)'}
              </strong>
            </span>
          </div>

          <Card className="p-5 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-2.5">
            {levelData.map((lvl, idx) => {
              const isSelected = drillDownLevelId === lvl.id
              const displayMetric =
                commercialMetric === 'volume'
                  ? lvl.toneladasTotal > 0
                    ? formatTonsABNT(lvl.toneladasTotal)
                    : '0,00 t'
                  : lvl.valorTotal > 0
                    ? formatBRL(lvl.valorTotal)
                    : 'R$ 0,00'

              return (
                <div key={lvl.id} className="relative group">
                  {/* Faixa Trapézio / Bloco do Nível */}
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => setDrillDownLevelId(lvl.id)}
                      style={{ width: `${Math.max(lvl.widthPct, 38)}%` }}
                      className={cn(
                        'transition-all duration-200 text-left rounded-2xl p-3 border text-white relative shadow-xs flex flex-col gap-1',
                        'bg-gradient-to-r',
                        lvl.corBg,
                        lvl.corBorder,
                        isSelected
                          ? 'ring-3 ring-sky-400 scale-[1.02] shadow-md z-10'
                          : 'hover:scale-[1.01] hover:shadow-xs opacity-95 group-hover:opacity-100',
                      )}
                    >
                      {/* Topo da Faixa */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-[11px] uppercase tracking-wide truncate">
                          {lvl.nome}
                        </span>
                        <Badge className="bg-white/20 text-white font-mono font-bold text-[10px] border-none shrink-0">
                          {lvl.count} {lvl.count === 1 ? 'opp' : 'opps'}
                        </Badge>
                      </div>

                      {/* Informações de Volume/Valor & Tempo Médio */}
                      <div className="flex items-center justify-between text-[11px] pt-0.5 border-t border-white/15">
                        <span className="font-mono font-bold text-white tracking-tight">
                          {displayMetric}
                        </span>
                        <span className="text-[10px] text-white/80 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3 text-white/70" />
                          {lvl.tempoMedioDias}d méd.
                        </span>
                      </div>
                    </button>
                  </div>

                  {/* Indicador de Conversão para a próxima etapa (abaixo da faixa) */}
                  {idx < levelData.length - 1 && (
                    <div className="flex items-center justify-center my-0.5">
                      <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                        <span>Conv:</span>
                        <strong className="text-slate-800">{lvl.taxaConversaoProxima}%</strong>
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </Card>
        </div>

        {/* COLUNA DIREITA: DRILL-DOWN DO NÍVEL SELECIONADO */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-serif text-base font-bold text-[#003A70] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Drill-down: {selectedLevel.nome}
            </h3>
            <Badge className="bg-[#003A70] text-white text-xs">
              {selectedLevel.count} registros
            </Badge>
          </div>

          <Card className="p-4 bg-slate-50 border border-slate-200 rounded-3xl space-y-3">
            {/* Cabeçalho do Drill-Down */}
            <div className="p-3 bg-white rounded-2xl border border-slate-200/80 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Total em Aberto:</span>
                <strong className="font-serif text-sm text-[#003A70]">
                  {selectedLevel.valorTotal > 0
                    ? formatBRL(selectedLevel.valorTotal)
                    : 'Não estimado'}
                </strong>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Volume Total:</span>
                <span className="font-mono text-xs font-semibold text-slate-700">
                  {selectedLevel.toneladasTotal > 0
                    ? formatTonsABNT(selectedLevel.toneladasTotal)
                    : 'Não informado'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Permanência Média:</span>
                <span className="text-xs font-semibold text-slate-700">
                  {selectedLevel.tempoMedioDias} dias na etapa
                </span>
              </div>
            </div>

            {/* Lista de Oportunidades do Nível */}
            <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
              {selectedLevel.opps.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200 text-xs text-muted-foreground space-y-2">
                  <p>Nenhuma oportunidade ativa neste nível macro com os filtros selecionados.</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onNovaOportunidadeClick}
                    className="h-8 text-xs rounded-xl gap-1 text-[#003A70]"
                  >
                    + Criar Oportunidade
                  </Button>
                </div>
              ) : (
                selectedLevel.opps.map((opp) => {
                  const valorText =
                    opp.valorPotencialCalculado !== null &&
                    opp.valorPotencialCalculado !== undefined &&
                    opp.valorPotencialCalculado > 0
                      ? formatBRL(opp.valorPotencialCalculado)
                      : opp.valor > 0
                        ? formatBRL(opp.valor)
                        : 'Não estimado'

                  const tonsText =
                    opp.quantidadeEstimadaTons !== null &&
                    opp.quantidadeEstimadaTons !== undefined &&
                    opp.quantidadeEstimadaTons > 0
                      ? formatTonsABNT(opp.quantidadeEstimadaTons)
                      : opp.toneladas > 0
                        ? formatTonsABNT(opp.toneladas)
                        : 'Não informada'

                  return (
                    <div
                      key={opp.id}
                      onClick={() => onSelectOpportunity(opp)}
                      className="p-3.5 bg-white border border-slate-200 hover:border-[#003A70] hover:shadow-sm rounded-2xl transition-all cursor-pointer space-y-1.5 group"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-[10px] font-bold bg-sky-100 text-[#003A70] px-1.5 py-0.5 rounded">
                              {opp.numeroSequencial || opp.id}
                            </span>
                            <strong className="text-xs text-slate-900 group-hover:text-[#003A70]">
                              {opp.clienteNome}
                            </strong>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono block">
                            SAP {opp.clienteSap} · {opp.vendedorNome}
                          </span>
                        </div>

                        <Badge className="bg-slate-100 text-slate-700 text-[10px] font-mono border-none shrink-0">
                          {opp.probabilidade}%
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                        <span className="font-serif font-bold text-emerald-700">{valorText}</span>
                        <span className="text-[11px] text-muted-foreground font-mono font-medium">
                          {tonsText}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          {opp.tempoNoEstagioDias || opp.agingDias || 0}d na etapa
                        </span>
                        <span className="truncate max-w-[150px] font-medium text-slate-700">
                          {opp.grupoMercadoria || 'Geral'}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* SEÇÃO DE PERDAS E CANCELAMENTOS (VISÃO FORA DA CONTAGEM ATIVA) */}
      {perdas.length > 0 && (
        <Card className="p-4 bg-slate-50/90 border border-slate-200 rounded-3xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <h4 className="font-serif text-sm font-bold text-slate-800">
                Análise de Perdas & Suspensões ({perdas.length})
              </h4>
            </div>
            <span className="text-[11px] text-muted-foreground">
              Fora da contagem ativa do funil principal
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {perdas.map((p) => (
              <div
                key={p.id}
                onClick={() => onSelectOpportunity(p)}
                className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1 hover:border-rose-300 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-slate-500">
                    {p.numeroSequencial || p.id}
                  </span>
                  <Badge className="bg-rose-100 text-rose-800 text-[9px] border-none">
                    Perdida
                  </Badge>
                </div>
                <strong className="text-slate-900 block truncate">{p.clienteNome}</strong>
                <p className="text-[10px] text-slate-500 truncate">
                  Motivo: {p.motivoPerda || 'Preço/Concorrência'}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
