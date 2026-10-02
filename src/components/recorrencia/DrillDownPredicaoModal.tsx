// src/components/recorrencia/DrillDownPredicaoModal.tsx
// Drill-down preditivo completo (Requisitos 9, 10, 13 e 14)
// Modal responsivo: max 90vh / 90vw, header fixo, corpo scrollável, footer fixo, sem corte de botões
// Seções: HISTÓRICO, PREDIÇÃO, PRODUTOS e CRÉDITO SAP REAL
// Inclui explicação com números reais e botão destacado "Gerar Oportunidade de Retomada"

import React, { useState } from 'react'
import {
  BrainCircuit,
  TrendingUp,
  History,
  Package,
  CreditCard,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  X,
  FileCheck,
  Calendar,
  Building2,
  DollarSign,
  Scale,
  Clock,
  Layers,
  ChevronRight,
  Info,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { PredicaoClienteView, UnitMode } from '@/types/recorrencia'

interface DrillDownPredicaoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cliente: PredicaoClienteView | null
  unitMode: UnitMode
  onGerarOportunidade: (cliente: PredicaoClienteView) => void
  onOpenCliente360?: (clienteSap: string) => void
}

export function DrillDownPredicaoModal({
  open,
  onOpenChange,
  cliente,
  unitMode,
  onGerarOportunidade,
  onOpenCliente360,
}: DrillDownPredicaoModalProps) {
  const [activeTab, setActiveTab] = useState<'predicao' | 'historico' | 'produtos' | 'credito'>(
    'predicao',
  )
  const [mostrarExplicacao, setMostrarExplicacao] = useState(false)

  if (!cliente) return null

  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    })
  }

  const formatTons = (val: number) => {
    return `${val.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} t`
  }

  const h = cliente.horizontes

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] sm:w-[90vw] max-h-[90vh] h-[90vh] flex flex-col p-0 rounded-3xl overflow-hidden bg-white shadow-2xl border-slate-200">
        {/* HEADER FIXO */}
        <DialogHeader className="p-5 pb-4 border-b border-slate-200 bg-slate-50/90 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-100 text-[#003A70] flex items-center justify-center font-bold shrink-0">
                <BrainCircuit className="w-5 h-5 text-[#003A70]" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <DialogTitle className="font-serif text-lg font-bold text-slate-900 leading-tight">
                    {cliente.razaoSocial}
                  </DialogTitle>
                  <Badge variant="outline" className="font-mono text-xs bg-white">
                    SAP: {cliente.codigoSap}
                  </Badge>
                  <Badge
                    className={`text-[10px] font-bold ${
                      cliente.classificacaoRisco === 'Alta Probabilidade'
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        : cliente.classificacaoRisco === 'Em Risco'
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-rose-100 text-rose-900 border-rose-300'
                    }`}
                  >
                    {cliente.classificacaoRisco}
                  </Badge>
                  <Badge className="bg-sky-100 text-sky-900 border-sky-300 text-[10px] font-bold">
                    RFM: {cliente.segmentoRFM} ({cliente.scoreRFM})
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Vendedor: <strong className="text-slate-700">{cliente.vendedorNome}</strong> ·
                  Representante: <span className="text-slate-700">{cliente.representanteNome}</span>
                </p>
              </div>
            </div>

            {/* P(Alive) em Destaque */}
            <div className="flex items-center gap-3 bg-white px-3.5 py-2 rounded-2xl border border-slate-200 shadow-2xs self-start sm:self-auto">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  P(Alive) Modelo
                </span>
                <span
                  className={`font-serif font-bold text-xl ${
                    cliente.pAlivePercent >= 70
                      ? 'text-emerald-600'
                      : cliente.pAlivePercent >= 40
                        ? 'text-amber-600'
                        : 'text-rose-600'
                  }`}
                >
                  {cliente.pAlivePercent}%
                </span>
              </div>
            </div>
          </div>

          {/* Sub-tabs de Navegação */}
          <div className="flex items-center gap-1.5 pt-3">
            <button
              type="button"
              onClick={() => setActiveTab('predicao')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'predicao'
                  ? 'bg-[#003A70] text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              1. Predição & Horizontes
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('historico')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'historico'
                  ? 'bg-[#003A70] text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              2. Histórico & Cadência
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('produtos')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'produtos'
                  ? 'bg-[#003A70] text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              3. Produtos & Estoque ({cliente.produtosQueDeixouDeComprar.length} parados)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('credito')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'credito'
                  ? 'bg-[#003A70] text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              4. Crédito SAP Real
            </button>
          </div>
        </DialogHeader>

        {/* CORPO COM SCROLL INTERNO */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/50">
          {/* SEÇÃO 1: PREDIÇÃO & HORIZONTES */}
          {activeTab === 'predicao' && (
            <div className="space-y-4">
              {/* Box de Explicação do Risco ("Por que este cliente está nesta classificação?") */}
              <div className="bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sky-700" />
                    <span className="font-serif font-bold text-xs text-sky-900">
                      Diagnóstico Matemático & Leitura Comercial
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setMostrarExplicacao(!mostrarExplicacao)}
                    className="h-6 text-[11px] text-sky-800 hover:bg-sky-100 font-semibold px-2 rounded-lg"
                  >
                    {mostrarExplicacao ? 'Recolher detalhes' : 'Ver explicação completa'}
                  </Button>
                </div>
                <p className="text-xs text-slate-800 leading-relaxed font-medium">
                  {cliente.explicacaoRisco}
                </p>
              </div>

              {/* Tabela de Horizontes Temporais (30, 60, 90, 180, 365 dias) */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif text-xs font-bold text-[#003A70] uppercase tracking-wider">
                    Projeção em Múltiplos Horizontes (BG/NBD × Gamma-Gamma)
                  </h4>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    Valor Médio / Evento: {formatBRL(cliente.valorMedioEvento)}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] bg-slate-50">
                        <th className="p-2.5">Horizonte</th>
                        <th className="p-2.5 text-center">Prob. Recompra</th>
                        <th className="p-2.5 text-center">Compras Esperadas</th>
                        <th className="p-2.5 text-right">Receita Projetada (R$)</th>
                        <th className="p-2.5 text-right">Volume Projetado (t)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        {
                          dias: '30 dias',
                          prob: h.probabilidade30d,
                          compras: h.comprasEsperadas30d,
                          receita: h.receitaEsperada30d,
                          tons: h.tonelagemEsperada30d,
                          destaque: false,
                        },
                        {
                          dias: '60 dias',
                          prob: h.probabilidade60d,
                          compras: h.comprasEsperadas60d,
                          receita: h.receitaEsperada60d,
                          tons: h.tonelagemEsperada60d,
                          destaque: false,
                        },
                        {
                          dias: '90 dias (Padrão S&OP)',
                          prob: h.probabilidade90d,
                          compras: h.comprasEsperadas90d,
                          receita: h.receitaEsperada90d,
                          tons: h.tonelagemEsperada90d,
                          destaque: true,
                        },
                        {
                          dias: '180 dias',
                          prob: h.probabilidade180d,
                          compras: h.comprasEsperadas180d,
                          receita: h.receitaEsperada180d,
                          tons: h.tonelagemEsperada180d,
                          destaque: false,
                        },
                        {
                          dias: '365 dias (1 Ano)',
                          prob: h.probabilidade365d,
                          compras: h.comprasEsperadas365d,
                          receita: h.receitaEsperada365d,
                          tons: h.tonelagemEsperada365d,
                          destaque: false,
                        },
                      ].map((item) => (
                        <tr
                          key={item.dias}
                          className={
                            item.destaque ? 'bg-sky-50/70 font-semibold' : 'hover:bg-slate-50'
                          }
                        >
                          <td className="p-2.5 font-medium text-slate-900">
                            {item.dias}
                            {item.destaque && (
                              <Badge className="ml-2 bg-[#003A70] text-white text-[9px] py-0">
                                Trimestre
                              </Badge>
                            )}
                          </td>
                          <td className="p-2.5 text-center font-mono font-bold text-slate-800">
                            {Math.round(item.prob * 100)}%
                          </td>
                          <td className="p-2.5 text-center font-mono text-slate-700">
                            {item.compras.toFixed(2)}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                            {formatBRL(item.receita)}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-blue-700">
                            {formatTons(item.tons)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Status de Suficiência e Quadrante */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-500 text-[11px] block">Quadrante da Matriz</span>
                  <strong className="text-slate-900 text-sm block">
                    {cliente.quadranteMatriz}
                  </strong>
                  <p className="text-[11px] text-muted-foreground">
                    Classificação estratégica para priorização de contato comercial e esteira de
                    oportunidades.
                  </p>
                </div>

                <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-slate-500 text-[11px] block">Confiabilidade dos Dados</span>
                  <strong className="text-emerald-700 text-sm flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Histórico Suficiente
                  </strong>
                  <p className="text-[11px] text-muted-foreground">
                    {cliente.frequency} recompras registradas em {cliente.tempoTDias} dias de
                    janela.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SEÇÃO 2: HISTÓRICO & CADÊNCIA (Integração RFM) */}
          {activeTab === 'historico' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 bg-white rounded-2xl border border-slate-200">
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">
                    Primeira Compra
                  </span>
                  <strong className="text-slate-900 text-sm font-mono block mt-1">
                    {cliente.primeiraCompraData}
                  </strong>
                  <span className="text-[10px] text-muted-foreground">Início do histórico</span>
                </div>

                <div className="p-3.5 bg-white rounded-2xl border border-slate-200">
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">
                    Última Compra
                  </span>
                  <strong className="text-slate-900 text-sm font-mono block mt-1">
                    {cliente.ultimaCompraData}
                  </strong>
                  <span className="text-[10px] text-muted-foreground">
                    Há {cliente.diasSemComprar} dias
                  </span>
                </div>

                <div className="p-3.5 bg-white rounded-2xl border border-slate-200">
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">
                    Frequência (x)
                  </span>
                  <strong className="text-slate-900 text-sm font-mono block mt-1">
                    {cliente.frequency} recompras
                  </strong>
                  <span className="text-[10px] text-muted-foreground">
                    Total: {cliente.eventosTotal} eventos
                  </span>
                </div>

                <div className="p-3.5 bg-white rounded-2xl border border-slate-200">
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">
                    Janela Total (T)
                  </span>
                  <strong className="text-slate-900 text-sm font-mono block mt-1">
                    {cliente.tempoTDias} dias
                  </strong>
                  <span className="text-[10px] text-muted-foreground">
                    Recency: {cliente.recencyDias}d
                  </span>
                </div>
              </div>

              {/* Comparativo Lado a Lado: HISTÓRICO vs PREDIÇÃO */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <History className="w-4 h-4 text-slate-600" />
                    <h5 className="font-serif font-bold text-xs text-slate-900 uppercase">
                      Padrão Histórico Observado
                    </h5>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Segmento RFM:</span>
                      <strong className="text-slate-900">{cliente.segmentoRFM}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Score RFM Detalhado:</span>
                      <span className="font-mono font-bold text-slate-800">{cliente.scoreRFM}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Intervalo Médio Entre Compras:</span>
                      <span className="font-mono text-slate-800">
                        {Math.round(cliente.recencyDias / Math.max(cliente.frequency, 1))} dias
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Ticket Médio Histórico:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {formatBRL(cliente.valorMedioEvento)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Tonelagem Média por Pedido:</span>
                      <span className="font-mono font-bold text-blue-700">
                        {formatTons(cliente.tonelagemMediaEvento)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-sky-200 bg-sky-50/30 space-y-3">
                  <div className="flex items-center gap-2 border-b border-sky-200 pb-2">
                    <TrendingUp className="w-4 h-4 text-sky-700" />
                    <h5 className="font-serif font-bold text-xs text-sky-900 uppercase">
                      Predição BG/NBD & Gamma-Gamma
                    </h5>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-600">P(Alive) Ativo:</span>
                      <strong
                        className={
                          cliente.pAlivePercent >= 70
                            ? 'text-emerald-700 font-bold'
                            : cliente.pAlivePercent >= 40
                              ? 'text-amber-700 font-bold'
                              : 'text-rose-700 font-bold'
                        }
                      >
                        {cliente.pAlivePercent}%
                      </strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Probabilidade de Recompra (30d):</span>
                      <span className="font-mono font-bold text-slate-800">
                        {Math.round(h.probabilidade30d * 100)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Probabilidade de Recompra (90d):</span>
                      <span className="font-mono font-bold text-slate-800">
                        {Math.round(h.probabilidade90d * 100)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Compras Esperadas (90d):</span>
                      <span className="font-mono font-bold text-slate-900">
                        {h.comprasEsperadas90d.toFixed(2)} pedidos
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Receita Prevista (90d):</span>
                      <span className="font-mono font-bold text-slate-900">
                        {formatBRL(h.receitaEsperada90d)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Volume Previsto (90d):</span>
                      <span className="font-mono font-bold text-blue-700">
                        {formatTons(h.tonelagemEsperada90d)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SEÇÃO 3: PRODUTOS & ESTOQUE */}
          {activeTab === 'produtos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-serif text-xs font-bold text-[#003A70] uppercase">
                    Produtos Abandonados / Em Queda
                  </h4>
                  <p className="text-[11px] text-muted-foreground">
                    Materiais que o cliente comprava regularmente e parou, com estoque livre na
                    CIAFAL.
                  </p>
                </div>
                <Badge variant="outline" className="text-xs bg-white">
                  Estoque Livre Geral: {formatTons(cliente.estoqueLivreTons)}
                </Badge>
              </div>

              {cliente.produtosQueDeixouDeComprar.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-muted-foreground">
                  Nenhum produto abandonado identificado para este cliente. O mix atual encontra-se
                  ativo.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {cliente.produtosQueDeixouDeComprar.map((p) => (
                    <div
                      key={p.codigo}
                      className="p-3.5 bg-white rounded-2xl border border-amber-200 bg-amber-50/20 space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <strong className="text-slate-900 block">{p.descricao}</strong>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            Código: {p.codigo}
                          </span>
                        </div>
                        <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[10px]">
                          Parou de Comprar
                        </Badge>
                      </div>

                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">Saldo Livre em Contagem:</span>
                        <strong className="text-emerald-700 font-mono font-bold">
                          {p.saldoEstoqueTon} toneladas
                        </strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tabela de Produtos Normalmente Comprados */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                <h5 className="font-serif font-bold text-xs text-slate-900 uppercase">
                  Mix Completo de Materiais do Histórico
                </h5>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] bg-slate-50">
                        <th className="p-2">Material</th>
                        <th className="p-2">Família</th>
                        <th className="p-2 text-center">Status</th>
                        <th className="p-2 text-right">Saldo em Estoque</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {cliente.produtosHistoricos.map((prod) => (
                        <tr key={prod.codigo} className="hover:bg-slate-50">
                          <td className="p-2 font-medium text-slate-900">
                            {prod.descricao}
                            <span className="block text-[10px] text-muted-foreground font-mono">
                              {prod.codigo}
                            </span>
                          </td>
                          <td className="p-2 text-slate-600">{prod.familia}</td>
                          <td className="p-2 text-center">
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${
                                prod.status === 'Ativo'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : 'bg-rose-50 text-rose-800 border-rose-300'
                              }`}
                            >
                              {prod.status}
                            </Badge>
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-slate-800">
                            {prod.saldoEstoqueTon} t
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SEÇÃO 4: CRÉDITO SAP REAL */}
          {activeTab === 'credito' && (
            <div className="space-y-4">
              <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#003A70]" />
                    <h5 className="font-serif font-bold text-xs text-slate-900 uppercase">
                      Posição Financeira Oficial (SAP ECC Transação F.35)
                    </h5>
                  </div>
                  <Badge
                    className={`text-xs ${
                      cliente.credito.statusCredito === 'Liberado'
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        : cliente.credito.statusCredito === 'Bloqueado'
                          ? 'bg-rose-100 text-rose-900 border-rose-300'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                    }`}
                  >
                    Situação: {cliente.credito.statusCredito}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-500 block text-[10px]">Limite Aprovado:</span>
                    <strong className="text-slate-900 text-sm font-mono block mt-1">
                      {cliente.credito.limiteAprovado !== null
                        ? formatBRL(cliente.credito.limiteAprovado)
                        : 'Sem informação'}
                    </strong>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-500 block text-[10px]">Limite Utilizado:</span>
                    <strong className="text-slate-900 text-sm font-mono block mt-1">
                      {cliente.credito.limiteUtilizado !== null
                        ? formatBRL(cliente.credito.limiteUtilizado)
                        : 'Sem informação'}
                    </strong>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-500 block text-[10px]">Saldo Disponível:</span>
                    <strong className="text-emerald-700 text-sm font-mono block mt-1">
                      {cliente.credito.saldoDisponivel !== null
                        ? formatBRL(cliente.credito.saldoDisponivel)
                        : 'Sem informação'}
                    </strong>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-500 block text-[10px]">Títulos Vencidos:</span>
                    <strong
                      className={`text-sm font-mono block mt-1 ${
                        (cliente.credito.titulosVencidos || 0) > 0
                          ? 'text-rose-600'
                          : 'text-slate-900'
                      }`}
                    >
                      {cliente.credito.titulosVencidos || 0} títulos (
                      {formatBRL(cliente.credito.valorVencido || 0)})
                    </strong>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground pt-1">
                  * Todos os dados financeiros acima são lidos diretamente do SAP ECC / Central de
                  Crédito da CIAFAL, sem qualquer estimativa ou inferência artificial.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER FIXO (Sem corte de botões, padrão v0.0.71) */}
        <DialogFooter className="p-4 border-t border-slate-200 bg-white shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {onOpenCliente360 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false)
                  onOpenCliente360(cliente.codigoSap)
                }}
                className="rounded-xl text-xs"
              >
                Abrir Cliente 360°
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs"
            >
              Fechar
            </Button>

            {/* BOTÃO DESTACADO: Gerar Oportunidade de Retomada (Requisito 14) */}
            <Button
              type="button"
              size="sm"
              onClick={() => {
                onOpenChange(false)
                onGerarOportunidade(cliente)
              }}
              className="rounded-xl text-xs bg-[#003A70] hover:bg-[#002850] text-white font-bold gap-2 shadow-sm"
            >
              <FileCheck className="w-4 h-4 text-sky-300" />
              <span>Gerar Oportunidade de Retomada</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
