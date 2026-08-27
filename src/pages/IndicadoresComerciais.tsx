import React, { useState, useMemo } from 'react'
import { EXPANDED_COMMERCIAL_KPIS } from '@/data/mockCommercialKpisExpanded'
import { CommercialKpiDefinition, CommercialKpiLevel, CommercialKpiCategory } from '@/types/models'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  DollarSign,
  Package,
  Users,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Briefcase,
  Building2,
  PieChart,
  Target,
  Sparkles,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function IndicadoresComerciais() {
  const [levelTab, setLevelTab] = useState<'VENDEDOR' | 'GERENCIAL_DIRECAO' | 'TODOS'>('VENDEDOR')
  const [categoryFilter, setCategoryFilter] = useState<string>('todos')
  const [searchTerm, setSearchTerm] = useState('')

  const formatValue = (val: number, unit: string) => {
    if (unit === 'R$') {
      return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    }
    if (unit === 'TON') {
      return `${val.toLocaleString('pt-BR')} t`
    }
    if (unit === '%') {
      return `${val.toFixed(1)}%`
    }
    if (unit === 'SCORE') {
      return `${val.toFixed(1)} pts`
    }
    return `${val} un`
  }

  const filteredKpis = useMemo(() => {
    return EXPANDED_COMMERCIAL_KPIS.filter((kpi) => {
      const matchSearch =
        kpi.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        kpi.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        kpi.formula_descricao.toLowerCase().includes(searchTerm.toLowerCase())

      const matchCat = categoryFilter === 'todos' || kpi.categoria === categoryFilter

      let matchLevel = true
      if (levelTab === 'VENDEDOR') {
        matchLevel = kpi.nivel === 'VENDEDOR' || kpi.nivel === 'AMBOS'
      } else if (levelTab === 'GERENCIAL_DIRECAO') {
        matchLevel = kpi.nivel === 'GERENCIAL_DIRECAO' || kpi.nivel === 'AMBOS'
      }

      return matchSearch && matchCat && matchLevel
    })
  }, [levelTab, categoryFilter, searchTerm])

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in pb-16">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-primary/10 rounded-2xl">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-3xl font-bold text-primary tracking-tight">
                  Catálogo & Cockpit de KPIs Comerciais
                </h1>
                <Badge className="bg-primary/10 text-primary border-primary/30 text-xs">
                  Realizado x Meta x OIF
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Métricas de vendas, volume em toneladas, rentabilidade, inadimplência e fulfillment
                em dois níveis: Vendedor/Representante e Gestão/Diretoria.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* DESTAQUE: INDICADOR OIF */}
      <Card className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-6 shadow-md border-none">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-400 text-slate-950 font-bold border-none text-[10px]">
                KPI ESTRATÉGICO CORPORATIVO
              </Badge>
              <Badge className="bg-slate-700 text-amber-200 border-amber-400/30 text-[10px]">
                STATUS: REQUIRES_CONFIGURATION
              </Badge>
            </div>
            <h3 className="font-serif text-2xl font-bold text-white flex items-center gap-2">
              OIF — Overall Order Fulfillment Index
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Indicador unificado de cumprimento do pedido (OTIF, Lead Time e aderência de mix).
              Fórmula parametrizável no cadastro de governança da CIAFAL.
            </p>
          </div>

          <div className="flex items-center gap-6 border-t lg:border-t-0 lg:border-l border-slate-700 pt-4 lg:pt-0 lg:pl-6 shrink-0">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Realizado
              </span>
              <span className="font-serif text-3xl font-bold text-emerald-400">91.4 pts</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Meta</span>
              <span className="font-serif text-3xl font-bold text-white">95.0 pts</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Atingimento
              </span>
              <span className="font-serif text-3xl font-bold text-amber-400">96.2%</span>
            </div>
          </div>
        </div>
      </Card>

      {/* ABAS POR NÍVEL (VENDEDOR vs GERÊNCIA) & FILTROS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-3">
        <Tabs value={levelTab} onValueChange={(v) => setLevelTab(v as any)} className="w-auto">
          <TabsList className="bg-slate-100 p-1 rounded-2xl h-auto gap-1">
            <TabsTrigger
              value="VENDEDOR"
              className="data-[state=active]:bg-white data-[state=active]:text-primary rounded-xl px-4 py-2 text-xs font-semibold"
            >
              <Briefcase className="w-3.5 h-3.5 mr-1.5" /> Nível Vendedor / Representante
            </TabsTrigger>
            <TabsTrigger
              value="GERENCIAL_DIRECAO"
              className="data-[state=active]:bg-white data-[state=active]:text-primary rounded-xl px-4 py-2 text-xs font-semibold"
            >
              <Building2 className="w-3.5 h-3.5 mr-1.5" /> Nível Gerência / Diretoria
            </TabsTrigger>
            <TabsTrigger
              value="TODOS"
              className="data-[state=active]:bg-white data-[state=active]:text-primary rounded-xl px-4 py-2 text-xs font-semibold"
            >
              Todos os Indicadores
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-60">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar indicador ou fórmula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 pl-8 text-xs bg-white rounded-xl"
            />
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-8 text-xs bg-white rounded-xl w-44">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas Categorias</SelectItem>
              <SelectItem value="FATURAMENTO">Faturamento (R$)</SelectItem>
              <SelectItem value="VOLUME">Volume (Toneladas)</SelectItem>
              <SelectItem value="MARGEM">Margem / Rentabilidade</SelectItem>
              <SelectItem value="CLIENTES">Clientes & Carteira</SelectItem>
              <SelectItem value="EFICIENCIA">Eficiência Comercial</SelectItem>
              <SelectItem value="QUALIDADE">Qualidade & SGQ</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* GRID DE CARDS COMPARATIVOS (REALIZADO x META x GAP x TENDÊNCIA) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredKpis.map((kpi) => {
          const isAboveMeta = kpi.atingimento_pct >= 100
          const isWarning = kpi.atingimento_pct < 90

          return (
            <Card
              key={kpi.id}
              className="bg-white/95 backdrop-blur-md border-border/40 rounded-3xl p-5 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    {kpi.codigo}
                  </span>
                  <div className="flex items-center gap-1">
                    <Badge className="bg-primary/10 text-primary border-none text-[10px] font-bold">
                      {kpi.fonte}
                    </Badge>
                    {kpi.requires_configuration && (
                      <Badge className="bg-amber-100 text-amber-800 text-[10px] border-none font-bold">
                        Parametrizável
                      </Badge>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-serif font-bold text-base text-primary">{kpi.nome}</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                    {kpi.formula_descricao}
                  </p>
                </div>

                {/* COMPARATIVO: REALIZADO vs META vs GAP */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-border/40 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      Realizado
                    </span>
                    <strong className="text-xs text-slate-900 block truncate">
                      {formatValue(kpi.realizado_atual, kpi.unidade)}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      Meta
                    </span>
                    <strong className="text-xs text-slate-600 block truncate">
                      {formatValue(kpi.meta_atual, kpi.unidade)}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      Gap
                    </span>
                    <strong
                      className={cn(
                        'text-xs block truncate',
                        kpi.gap >= 0 ? 'text-emerald-700' : 'text-rose-700',
                      )}
                    >
                      {kpi.gap > 0 ? `+` : ''}
                      {formatValue(kpi.gap, kpi.unidade)}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t mt-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">Atingimento da Meta</span>
                  <strong
                    className={cn(
                      'font-bold',
                      isAboveMeta
                        ? 'text-emerald-700'
                        : isWarning
                          ? 'text-rose-700'
                          : 'text-amber-700',
                    )}
                  >
                    {kpi.atingimento_pct.toFixed(1)}%
                  </strong>
                </div>

                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      isAboveMeta ? 'bg-emerald-600' : isWarning ? 'bg-rose-500' : 'bg-amber-500',
                    )}
                    style={{ width: `${Math.min(100, kpi.atingimento_pct)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                  <span>
                    Período Ant.: <strong>{formatValue(kpi.periodo_anterior, kpi.unidade)}</strong>
                  </span>
                  <span>
                    Forecast: <strong>{formatValue(kpi.forecast, kpi.unidade)}</strong>
                  </span>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
