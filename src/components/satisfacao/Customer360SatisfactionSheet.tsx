import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Package,
  FileText,
  AlertTriangle,
  Clock,
  Sparkles,
  ExternalLink,
  PlusCircle,
  HelpCircle,
  CheckCircle2,
  Scale,
} from 'lucide-react'
import { ClienteSatisfacao360, ISCPesosConfig } from '@/types/satisfaction'
import { formatCurrency } from '@/lib/utils'

interface Customer360SatisfactionSheetProps {
  cliente: ClienteSatisfacao360 | null
  open: boolean
  onClose: () => void
  pesos: ISCPesosConfig
  onOpenEntenderISC: (client: ClienteSatisfacao360) => void
  onOpenAnaliseIA: (client: ClienteSatisfacao360) => void
  onCreateRecoveryPlan: (client: ClienteSatisfacao360) => void
  onCreateTask: (action: string, client: ClienteSatisfacao360) => void
  onNavigateToQuote: (client: ClienteSatisfacao360) => void
  onNavigateToStock: (materialCode: string) => void
}

export function Customer360SatisfactionSheet({
  cliente,
  open,
  onClose,
  pesos,
  onOpenEntenderISC,
  onOpenAnaliseIA,
  onCreateRecoveryPlan,
  onCreateTask,
  onNavigateToQuote,
  onNavigateToStock,
}: Customer360SatisfactionSheetProps) {
  const [activeTab, setActiveTab] = useState('visao_geral')

  if (!cliente) return null

  const getBandBadge = () => {
    switch (cliente.faixaISC) {
      case 'EXCELENTE':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
      case 'SATISFEITO':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/40'
      case 'ATENCAO':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40'
      case 'RISCO':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/40'
      case 'CRITICO':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/40'
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-5xl bg-white text-slate-900 border-slate-200 rounded-3xl max-h-[92vh] overflow-y-auto p-6 shadow-xl">
        {/* CABEÇALHO 360 DO CLIENTE */}
        <DialogHeader className="space-y-3 border-b border-slate-100 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-serif text-xl font-bold text-[#003A70]">
                  {cliente.razaoSocial}
                </span>
                <Badge
                  variant="outline"
                  className="text-xs bg-slate-50 border-slate-200 text-slate-700"
                >
                  SAP #{cliente.sapCode}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-xs bg-slate-50 border-slate-200 text-slate-700"
                >
                  CNPJ: {cliente.cnpj}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-xs bg-sky-50 text-[#003A70] border-sky-200"
                >
                  Classe {cliente.classificacaoCliente}
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                <span>
                  <strong>Segmento:</strong> {cliente.segmento} ({cliente.subsegmento})
                </span>
                <span>
                  <strong>Região:</strong> {cliente.regiao} — {cliente.cidade}/{cliente.uf}
                </span>
                <span>
                  <strong>Vendedor:</strong> {cliente.vendedorNome}
                </span>
                <span>
                  <strong>Gestor:</strong> {cliente.gestorNome}
                </span>
              </div>
            </div>

            {/* ISC E STATUS */}
            <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Índice ISC Oficial
                </span>
                <div className="flex items-baseline gap-2 justify-end">
                  <span className="text-3xl font-bold font-serif text-[#003A70]">
                    {cliente.iscAtual}
                  </span>
                  <span className="text-xs text-slate-400">/100</span>
                  <Badge variant="outline" className={`text-xs font-bold ${getBandBadge()}`}>
                    {cliente.faixaISC}
                  </Badge>
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Anterior: {cliente.iscAnterior} (
                  {cliente.iscVariacao >= 0 ? `+${cliente.iscVariacao}` : cliente.iscVariacao} pts)
                </span>
              </div>
            </div>
          </div>

          {/* BANNER DADOS DEMO */}
          {cliente.is_mock && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 px-3 py-1 rounded-xl text-[10px] font-mono flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                DADOS DE DEMONSTRAÇÃO (Sincronização com SAP ECC / TMS / WMS / SAC)
              </span>
              <span>{cliente.sistemaOrigemInfo.sapEccSync}</span>
            </div>
          )}

          {/* BARRA DE AÇÕES RÁPIDAS NO TOPO DA FICHA */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onOpenEntenderISC(cliente)}
              className="h-8 text-xs text-[#003A70] border-sky-300 hover:bg-sky-50 rounded-xl gap-1.5 font-semibold"
            >
              <Scale className="w-3.5 h-3.5" /> Entender ISC ({cliente.iscAtual}/100)
            </Button>

            <Button
              size="sm"
              onClick={() => onOpenAnaliseIA(cliente)}
              className="h-8 text-xs bg-[#003A70] hover:bg-[#002850] text-white rounded-xl gap-1.5 font-semibold shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Analisar com IA
            </Button>

            {cliente.iscAtual < 75 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onCreateRecoveryPlan(cliente)}
                className="h-8 text-xs text-rose-700 border-rose-300 hover:bg-rose-50 rounded-xl gap-1.5 font-semibold"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                {cliente.possuiPlanoRecuperacaoAtivo
                  ? 'Ver Plano de Recuperação'
                  : 'Criar Plano de Recuperação'}
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => onNavigateToQuote(cliente)}
              className="h-8 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50 rounded-xl gap-1.5 font-semibold"
            >
              <FileText className="w-3.5 h-3.5" /> Criar Cotação
            </Button>
          </div>
        </DialogHeader>

        {/* 10 ABAS DA FICHA 360 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 pt-2">
          <TabsList className="bg-slate-100 border border-slate-200 p-1 rounded-2xl flex flex-wrap gap-1 h-auto">
            <TabsTrigger
              value="visao_geral"
              className="text-xs py-1.5 rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#003A70] data-[state=active]:font-bold"
            >
              Visão Geral
            </TabsTrigger>
            <TabsTrigger
              value="comercial"
              className="text-xs py-1.5 rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#003A70] data-[state=active]:font-bold"
            >
              Comercial
            </TabsTrigger>
            <TabsTrigger
              value="qualidade"
              className="text-xs py-1.5 rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#003A70] data-[state=active]:font-bold"
            >
              Qualidade ({cliente.dimensaoQualidade.score})
            </TabsTrigger>
            <TabsTrigger
              value="logistica"
              className="text-xs py-1.5 rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#003A70] data-[state=active]:font-bold"
            >
              Logística ({cliente.dimensaoLogistica.score})
            </TabsTrigger>
            <TabsTrigger
              value="financeiro"
              className="text-xs py-1.5 rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#003A70] data-[state=active]:font-bold"
            >
              Financeiro ({cliente.dimensaoFinanceiro.score})
            </TabsTrigger>
            <TabsTrigger
              value="pesquisa"
              className="text-xs py-1.5 rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#003A70] data-[state=active]:font-bold"
            >
              Pesquisa
            </TabsTrigger>
            <TabsTrigger
              value="historico"
              className="text-xs py-1.5 rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#003A70] data-[state=active]:font-bold"
            >
              Histórico ISC
            </TabsTrigger>
            <TabsTrigger
              value="ocorrencias"
              className="text-xs py-1.5 rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#003A70] data-[state=active]:font-bold"
            >
              Ocorrências
            </TabsTrigger>
            <TabsTrigger
              value="plano_recuperacao"
              className="text-xs py-1.5 rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#003A70] data-[state=active]:font-bold"
            >
              Plano Recuperação
            </TabsTrigger>
            <TabsTrigger
              value="acoes_comerciais"
              className="text-xs py-1.5 rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#003A70] data-[state=active]:font-bold"
            >
              Ações Comerciais
            </TabsTrigger>
          </TabsList>

          {/* 1. ABA VISÃO GERAL */}
          <TabsContent value="visao_geral" className="space-y-4">
            {/* 4 Cards de Resumo */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  Faturamento YTD
                </span>
                <strong className="text-lg font-bold font-serif text-[#003A70] block mt-1">
                  {formatCurrency(cliente.faturamentoYTD)}
                </strong>
                <span className="text-[10px] text-slate-500">
                  Mês anterior: {formatCurrency(cliente.faturamentoMesAnterior)}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  Volume Faturado YTD
                </span>
                <strong className="text-lg font-bold font-serif text-slate-800 block mt-1">
                  {cliente.volumeYTD.toFixed(1)} t
                </strong>
                <span className="text-[10px] text-slate-500">
                  Mês anterior: {cliente.volumeMesAnterior.toFixed(1)} t
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  Valor Estratégico
                </span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <strong className="text-lg font-bold font-serif text-amber-600 block">
                    {cliente.scoreValorEstrategico}/100
                  </strong>
                  <Badge
                    variant="outline"
                    className="text-[9px] bg-white text-slate-700 border-slate-300"
                  >
                    {cliente.quadranteMatriz}
                  </Badge>
                </div>
                <span className="text-[10px] text-slate-500">Matriz Valor × Satisfação</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  Risco de Churn (IA)
                </span>
                <strong
                  className={`text-lg font-bold font-serif block mt-1 ${cliente.riscoChurnPct > 50 ? 'text-rose-600' : 'text-emerald-600'}`}
                >
                  {cliente.riscoChurnPct}%
                </strong>
                <span className="text-[10px] text-slate-500">Probabilidade de abandono</span>
              </div>
            </div>

            {/* IMPACTOS POSITIVOS E NEGATIVOS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-800 uppercase tracking-wider">
                  <TrendingDown className="w-4 h-4 text-rose-600" /> Impactos Negativos no ISC
                </div>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {cliente.impactosNegativos.map((imp, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-rose-600 font-bold">•</span>
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  <TrendingUp className="w-4 h-4 text-emerald-600" /> Impactos Positivos no ISC
                </div>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {cliente.impactosPositivos.map((imp, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* RESUMO DAS 5 DIMENSÕES */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Notas das 5 Dimensões Compostas do ISC
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Qualidade</span>
                  <strong className="text-base text-slate-800">
                    {cliente.dimensaoQualidade.score}
                  </strong>
                  <span className="text-[10px] text-slate-400 block">Peso {pesos.qualidade}%</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Logística</span>
                  <strong className="text-base text-slate-800">
                    {cliente.dimensaoLogistica.score}
                  </strong>
                  <span className="text-[10px] text-slate-400 block">Peso {pesos.logistica}%</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Comercial</span>
                  <strong className="text-base text-slate-800">
                    {cliente.dimensaoComercial.score}
                  </strong>
                  <span className="text-[10px] text-slate-400 block">Peso {pesos.comercial}%</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Financeiro</span>
                  <strong className="text-base text-slate-800">
                    {cliente.dimensaoFinanceiro.score}
                  </strong>
                  <span className="text-[10px] text-slate-400 block">Peso {pesos.financeiro}%</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Pesquisa</span>
                  <strong className="text-base text-slate-800">
                    {cliente.dimensaoPesquisa.score}
                  </strong>
                  <span className="text-[10px] text-slate-400 block">Peso {pesos.pesquisa}%</span>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* 2. ABA COMERCIAL */}
          <TabsContent value="comercial" className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <span className="text-slate-400 block">Último Contato</span>
                <strong className="text-sm text-white">
                  Há {cliente.dimensaoComercial.diasUltimoContato} dias
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <span className="text-slate-400 block">Dias Sem Compras</span>
                <strong className="text-sm text-white">
                  {cliente.dimensaoComercial.diasSemCompra} dias
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <span className="text-slate-400 block">Variação de Volume</span>
                <strong
                  className={`text-sm ${cliente.dimensaoComercial.variacaoVolumePct < 0 ? 'text-rose-400' : 'text-emerald-400'}`}
                >
                  {cliente.dimensaoComercial.variacaoVolumePct}%
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <span className="text-slate-400 block">Tarefas Vencidas</span>
                <strong className="text-sm text-amber-400">
                  {cliente.dimensaoComercial.tarefasVencidas} pendentes
                </strong>
              </div>
            </div>

            {cliente.dimensaoComercial.produtosAbandonadosCount > 0 && (
              <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                  Perda de Mix & Produtos Abandonados
                </span>
                <p className="text-xs text-slate-300">
                  O cliente deixou de recomprar os seguintes materiais tradicionais da sua carteira:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {cliente.dimensaoComercial.produtosAbandonadosNomes.map((prod, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="text-xs bg-slate-900 text-amber-300 border-amber-500/40"
                    >
                      {prod}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* 3. ABA QUALIDADE */}
          <TabsContent value="qualidade" className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block">Reclamações Abertas</span>
                <strong className="text-sm text-rose-400">
                  {cliente.dimensaoQualidade.reclamacoesAbertas}
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block">Reincidentes</span>
                <strong className="text-sm text-amber-400">
                  {cliente.dimensaoQualidade.reclamacoesReincidentes}
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block">Devoluções (Tons)</span>
                <strong className="text-sm text-white">
                  {cliente.dimensaoQualidade.devolucoesTons} t
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block">Eficácia Ação Corretiva</span>
                <strong className="text-sm text-emerald-400">
                  {cliente.dimensaoQualidade.eficaciaAcaoCorretivaPct}%
                </strong>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Fatores e Registros de Qualidade (SAC / Engenharia)
              </span>
              <ul className="space-y-1 text-xs text-slate-300">
                {cliente.dimensaoQualidade.fatoresDetalhados.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-sky-400">•</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>

          {/* 4. ABA LOGÍSTICA */}
          <TabsContent value="logistica" className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block">OTIF / No Prazo</span>
                <strong className="text-sm text-sky-400">
                  {cliente.dimensaoLogistica.otifPct}%
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block">Entregas Atrasadas</span>
                <strong className="text-sm text-rose-400">
                  {cliente.dimensaoLogistica.entregasAtrasadas}
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block">Avarias Transporte</span>
                <strong className="text-sm text-amber-400">
                  {cliente.dimensaoLogistica.avariasTransporteQtd}
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block">Diferença Data Desejada</span>
                <strong className="text-sm text-white">
                  +{cliente.dimensaoLogistica.diferencaDataDesejadaEntregueDias} dias
                </strong>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Eventos e Ocorrências TMS
              </span>
              <ul className="space-y-1 text-xs text-slate-300">
                {cliente.dimensaoLogistica.fatoresDetalhados.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-sky-400">•</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </TabsContent>

          {/* 5. ABA FINANCEIRO */}
          <TabsContent value="financeiro" className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block">Status de Crédito</span>
                <Badge
                  variant="outline"
                  className="text-xs bg-emerald-500/20 text-emerald-400 border-emerald-500/40 mt-1"
                >
                  {cliente.dimensaoFinanceiro.statusCreditoAtual}
                </Badge>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block">Limite de Crédito</span>
                <strong className="text-sm text-white">
                  {formatCurrency(cliente.dimensaoFinanceiro.limiteCredito)}
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block">Crédito Disponível</span>
                <strong className="text-sm text-emerald-400">
                  {formatCurrency(cliente.dimensaoFinanceiro.creditoDisponivel)}
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block">Títulos Vencidos</span>
                <strong className="text-sm text-rose-400">
                  {cliente.dimensaoFinanceiro.titulosVencidosQtd} (
                  {formatCurrency(cliente.dimensaoFinanceiro.titulosVencidosValor)})
                </strong>
              </div>
            </div>
          </TabsContent>

          {/* 6. ABA PESQUISA */}
          <TabsContent value="pesquisa" className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    NPS Registrado
                  </span>
                  <div className="flex items-baseline gap-2">
                    <strong className="text-2xl font-bold font-serif text-white">
                      {cliente.dimensaoPesquisa.npsScore}/10
                    </strong>
                    <Badge variant="outline" className="text-xs bg-slate-950 text-slate-300">
                      {cliente.dimensaoPesquisa.npsZone}
                    </Badge>
                  </div>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <span>Última pesquisa: {cliente.dimensaoPesquisa.ultimaPesquisaData}</span>
                  <span className="block text-[11px]">
                    Canal: {cliente.dimensaoPesquisa.canalUltimaResposta}
                  </span>
                </div>
              </div>

              {cliente.temDivergenciaPesquisaComportamento && (
                <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-xs text-amber-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Divergência Detectada pelo Motor:</strong>{' '}
                    {cliente.divergenciaDescricao}
                  </div>
                </div>
              )}

              {cliente.dimensaoPesquisa.comentariosRecentes.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <span className="text-xs font-bold text-slate-300 block">
                    Comentários Livres do Cliente:
                  </span>
                  {cliente.dimensaoPesquisa.comentariosRecentes.map((c, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 italic"
                    >
                      "{c}"
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* 7. ABA HISTÓRICO ISC */}
          <TabsContent value="historico" className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Evolução Cronológica do ISC com Eventos Sobrepostos
              </span>
              <div className="space-y-2">
                {cliente.historicoISC.map((pt, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-300 w-16">{pt.periodo}</span>
                      <span className="font-bold font-serif text-white text-base">
                        ISC {pt.isc}
                      </span>
                      {pt.eventoRelevante && (
                        <span className="text-[11px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                          {pt.eventoRelevante}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>Q: {pt.qualidade}</span>
                      <span>L: {pt.logistica}</span>
                      <span>C: {pt.comercial}</span>
                      <span>F: {pt.financeiro}</span>
                      <span>P: {pt.pesquisa}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* 8. ABA OCORRÊNCIAS & TIMELINE */}
          <TabsContent value="ocorrencias" className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Linha do Tempo Unificada Multissistema (SAP, TMS, WMS, SAC, CRM)
              </span>
              <div className="space-y-2.5">
                {cliente.timeline.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-slate-900 text-sky-400 border-sky-500/30"
                        >
                          {ev.sistemaOrigem}
                        </Badge>
                        <strong className="text-white">{ev.titulo}</strong>
                      </div>
                      <span className="text-[11px] text-slate-400">{ev.dataHora}</span>
                    </div>
                    <p className="text-slate-300 text-[11px]">{ev.descricao}</p>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* 9. ABA PLANO DE RECUPERAÇÃO */}
          <TabsContent value="plano_recuperacao" className="space-y-4">
            {cliente.possuiPlanoRecuperacaoAtivo ? (
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                    Plano de Recuperação em Andamento
                  </span>
                  <Badge
                    variant="outline"
                    className="text-xs bg-rose-500/20 text-rose-300 border-rose-500/40"
                  >
                    Status: Em Execução
                  </Badge>
                </div>
                <p className="text-xs text-slate-300">
                  Este cliente possui plano aberto para reverter a deterioração de relacionamento.
                </p>
                <Button
                  size="sm"
                  onClick={() => onCreateRecoveryPlan(cliente)}
                  className="h-8 text-xs bg-rose-600 hover:bg-rose-500 text-white rounded-xl"
                >
                  Abrir Detalhes do Plano
                </Button>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
                <p className="text-xs text-slate-400">
                  Nenhum plano de recuperação ativo no momento para este cliente.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onCreateRecoveryPlan(cliente)}
                  className="h-8 text-xs text-sky-400 border-sky-500/30 hover:bg-sky-500/10 rounded-xl"
                >
                  <PlusCircle className="w-3.5 h-3.5 mr-1" /> Criar Novo Plano de Recuperação
                </Button>
              </div>
            )}
          </TabsContent>

          {/* 10. ABA AÇÕES COMERCIAIS */}
          <TabsContent value="acoes_comerciais" className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Ações Recomendadas para o Vendedor
              </span>
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <strong className="text-sm text-sky-400">
                    {cliente.analiseIA?.proximaMelhorAcao.acao || 'Follow-up Comercial'}
                  </strong>
                  <Button
                    size="sm"
                    onClick={() =>
                      onCreateTask(
                        cliente.analiseIA?.proximaMelhorAcao.acao || 'Follow-up',
                        cliente,
                      )
                    }
                    className="h-7 text-xs bg-sky-600 hover:bg-sky-500 text-white rounded-lg"
                  >
                    Gerar Tarefa
                  </Button>
                </div>
                <p className="text-xs text-slate-300">
                  {cliente.analiseIA?.proximaMelhorAcao.justificativa}
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
