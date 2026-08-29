import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  FileText,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  TrendingUp,
  RotateCcw,
  Layers,
  Search,
  Filter,
  BarChart3,
  Kanban,
  ListFilter,
  Send,
  Zap,
} from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import CotacoesList from '@/components/cotacoes/CotacoesList'
import { smartCrossSellEngine, type CrossSellEfficiencyStats } from '@/services/cross_sell_engine'
import { formatBRL, formatTons } from '@/pages/NovaCotacao'

export function CotacoesModule() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'central'
  const navigate = useNavigate()

  const [stats, setStats] = useState<CrossSellEfficiencyStats>(() =>
    smartCrossSellEngine.getEfficiencyStats(),
  )

  const handleTabChange = (val: string) => {
    setSearchParams({ tab: val })
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header do Módulo de Cotações */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-primary/95 to-slate-950 text-white shadow-xl border border-primary/30">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="p-2.5 bg-primary/20 backdrop-blur-md rounded-2xl border border-white/10 text-amber-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight">MÓDULO COTAÇÕES</h1>
                <Badge className="bg-amber-400/20 text-amber-300 border-amber-400/40 text-[10px] font-mono">
                  CRM 360º CIAFAL
                </Badge>
              </div>
              <p className="text-xs text-slate-300">
                Propostas Comerciais, Cross Sell Inteligente, Aprovações Dinâmicas & Integração SAP
                ECC
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            asChild
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/40 gap-1.5 h-10 px-4"
          >
            <Link to="/crm/cotacoes/nova">
              <Plus className="w-4 h-4" /> Nova Cotação Clean
            </Link>
          </Button>
        </div>
      </div>

      {/* Navegação Interna do Módulo Cotações */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="bg-slate-100 dark:bg-slate-900/90 p-1 rounded-2xl border border-border/60 flex flex-wrap h-auto gap-1">
          <TabsTrigger
            value="central"
            className="rounded-xl text-xs font-semibold gap-1.5 py-2 px-3 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            <BarChart3 className="w-4 h-4" /> Gestão Completa (Dashboard, Lista & Kanban)
          </TabsTrigger>
          <TabsTrigger
            value="cross-sell"
            className="rounded-xl text-xs font-semibold gap-1.5 py-2 px-3 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-primary data-[state=active]:shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-purple-500" /> Inteligência Cross-Sell
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: CENTRAL DE COTAÇÕES COM LISTA, DASHBOARD & KANBAN JÁ INTEGRADOS */}
        <TabsContent value="central" className="space-y-4">
          <CotacoesList />
        </TabsContent>

        {/* TAB 4: CROSS-SELL & IA INTELIGENTE */}
        <TabsContent value="cross-sell" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="rounded-2xl border-purple-200/60 dark:border-purple-900/40 bg-purple-50/50 dark:bg-purple-950/20">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs text-muted-foreground">Sugestões Apresentadas</span>
                <div className="text-2xl font-bold font-mono text-purple-700 dark:text-purple-300">
                  {stats.sugestoesGeradas}
                </div>
                <span className="text-[10px] text-muted-foreground block">
                  Baseadas em histórico Qlik/SAP
                </span>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs text-muted-foreground">Sugestões Aceitas</span>
                <div className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
                  {stats.sugestoesAceitas}
                </div>
                <span className="text-[10px] text-emerald-600 block font-semibold">
                  Taxa de Aceite: {stats.taxaConversaoCrossSellPct}%
                </span>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-blue-200/60 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs text-muted-foreground">Toneladas por Cross Sell</span>
                <div className="text-2xl font-bold font-mono text-blue-700 dark:text-blue-300">
                  {formatTons(stats.toneladasGeradasCrossSellT)}
                </div>
                <span className="text-[10px] text-muted-foreground block">Volume incremental</span>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-amber-200/60 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20">
              <CardContent className="p-4 space-y-1">
                <span className="text-xs text-muted-foreground">Receita por Cross Sell</span>
                <div className="text-2xl font-bold font-mono text-amber-700 dark:text-amber-300">
                  {formatBRL(stats.faturamentoGeradoCrossSellBRL)}
                </div>
                <span className="text-[10px] text-muted-foreground block">
                  Conversões diretas em pedidos
                </span>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-3xl border-border/70 overflow-hidden shadow-sm">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/70 border-b border-border/60 pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                Matriz de Aprendizado & Eficiência de Recomendações (IA CRM 360º)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <p className="text-xs text-muted-foreground">
                As recomendações da IA não empurram estoque encalhado: a prioridade máxima é a
                aderência real ao perfil do cliente, histórico de recompra e intervalo habitual de
                compras. O sistema aprende a cada aceite ou descarte de sugestão feito pelo
                vendedor.
              </p>

              <div className="border border-border/60 rounded-2xl overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 text-muted-foreground text-[11px] uppercase border-b border-border/60 font-mono">
                    <tr>
                      <th className="p-3">Categoria de IA</th>
                      <th className="p-3">Critério de Disparo</th>
                      <th className="p-3">Prioridade</th>
                      <th className="p-3">Origem dos Dados</th>
                      <th className="p-3">Disponibilidade Requerida</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    <tr>
                      <td className="p-3 font-semibold text-rose-600">⚠️ Recompra em Atraso</td>
                      <td className="p-3">
                        Cliente ultrapassou intervalo habitual de recompra (&gt; 15 dias de atraso)
                      </td>
                      <td className="p-3">
                        <Badge className="bg-rose-500/20 text-rose-700 border-rose-300 text-[10px]">
                          Máxima (Score 90+)
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">SAP Histórico / Qlik</td>
                      <td className="p-3 text-muted-foreground">Estoque &gt; 5t ou PCP Previsto</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-emerald-600">🔄 Recompra Provável</td>
                      <td className="p-3">
                        Janela ideal de recompra se aproximando (5 a 10 dias da média)
                      </td>
                      <td className="p-3">
                        <Badge className="bg-emerald-500/20 text-emerald-700 border-emerald-300 text-[10px]">
                          Alta (Score 80-89)
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">QLIK Recorrência</td>
                      <td className="p-3 text-muted-foreground">Estoque Imediato ou PCP</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-blue-600">📦 Cross Sell Histórico</td>
                      <td className="p-3">
                        Itens comprados juntos em mais de 60% dos pedidos anteriores do cliente
                      </td>
                      <td className="p-3">
                        <Badge className="bg-blue-500/20 text-blue-700 border-blue-300 text-[10px]">
                          Média/Alta (Score 75-85)
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">Faturas SAP SD</td>
                      <td className="p-3 text-muted-foreground">Livre Estoque WMS/SAP</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-purple-600">
                        🎯 Cross Sell por Perfil
                      </td>
                      <td className="p-3">
                        Preditivo: Clientes do mesmo segmento e porte consomem esta família
                      </td>
                      <td className="p-3">
                        <Badge className="bg-purple-500/20 text-purple-700 border-purple-300 text-[10px]">
                          Oportunidade (Score 70-80)
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">Modelo Preditivo CRM</td>
                      <td className="p-3 text-muted-foreground">Disponível em Estoque</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: APROVAÇÕES PENDENTES */}
        <TabsContent value="aprovacoes" className="space-y-4">
          <Card className="rounded-3xl border-border/70 overflow-hidden shadow-sm">
            <CardHeader className="bg-amber-500/10 border-b border-amber-500/20 pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-amber-900 dark:text-amber-300">
                <Clock className="w-4 h-4 text-amber-600" />
                Alçadas & Aprovações Comerciais Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <CotacoesList />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
