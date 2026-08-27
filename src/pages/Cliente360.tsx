import React, { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  mockClientes,
  mockTimelineData,
  mockProdutosCliente,
  mockNFsCliente,
  mockFunilOportunidades,
  ClienteCarteira,
  TimelineEntry,
  ProdutoCliente,
  NFCliente,
} from '@/data/mockCommercialData'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  Building2,
  Calendar,
  CreditCard,
  FileText,
  Mail,
  MapPin,
  MessageSquare,
  Package,
  Phone,
  Plus,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Truck,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  Warehouse,
  Flame,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react'
import { RFMSegmentBadge } from '@/components/shared/RFMSegmentBadge'
import { PageLoadingState, PageEmptyState, PageErrorState } from '@/components/shared/StateFeedback'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function Cliente360() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('timeline')
  const [wmsConfirmed, setWmsConfirmed] = useState<Record<string, boolean>>({})

  // Localizar cliente nos mocks
  const cliente = useMemo(() => {
    return (
      mockClientes.find((c) => c.id === id || c.sapCode === id) || mockClientes[0] // fallback seguro
    )
  }, [id])

  // Dados das abas com fallback seguro
  const timeline = useMemo(() => {
    return mockTimelineData[cliente.id] || mockTimelineData['cli-100001'] || []
  }, [cliente.id])

  const produtos = useMemo(() => {
    return mockProdutosCliente[cliente.id] || mockProdutosCliente['cli-100001'] || []
  }, [cliente.id])

  const nfs = useMemo(() => {
    return mockNFsCliente[cliente.id] || mockNFsCliente['cli-100001'] || []
  }, [cliente.id])

  const oportunidades = useMemo(() => {
    return mockFunilOportunidades.filter((op) => op.clienteId === cliente.id)
  }, [cliente.id])

  const formatBRL = (val: number) => {
    return val.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    })
  }

  const handleRequestWMS = (prodCode: string) => {
    setWmsConfirmed((prev) => ({ ...prev, [prodCode]: true }))
    toast.success(`Solicitação de confirmação de saldo WMS enviada para o item ${prodCode}!`, {
      description: 'A equipe de logística do CD Contagem foi notificada.',
    })
  }

  const getTimelineIcon = (tipo: string) => {
    switch (tipo) {
      case 'whatsapp':
        return <MessageSquare className="w-4 h-4 text-emerald-600" />
      case 'email':
        return <Mail className="w-4 h-4 text-indigo-600" />
      case 'telefone':
        return <Phone className="w-4 h-4 text-blue-600" />
      case 'visita':
        return <MapPin className="w-4 h-4 text-amber-600" />
      case 'cotacao':
        return <FileText className="w-4 h-4 text-purple-600" />
      case 'pedido':
        return <ShoppingBag className="w-4 h-4 text-primary" />
      case 'nf':
        return <Truck className="w-4 h-4 text-emerald-700" />
      default:
        return <Clock className="w-4 h-4 text-slate-500" />
    }
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in pb-16">
      {/* NAVEGAÇÃO DE VOLTA */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/crm')}
          className="gap-1.5 text-xs text-muted-foreground hover:text-primary pl-0"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para Gestão de Carteira
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.info('Atualizando ficha cadastral via SAP RFC...')}
            className="h-8 gap-1.5 text-xs text-muted-foreground"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Sincronizar SAP
          </Button>
          <Button
            size="sm"
            onClick={() => toast.info('Nova cotação gerada no SAP para ' + cliente.razaoSocial)}
            className="h-8 gap-1.5 text-xs bg-primary text-white"
          >
            <Plus className="w-3.5 h-3.5" /> Criar Cotação
          </Button>
        </div>
      </div>

      {/* CABEÇALHO DO CLIENTE 360º */}
      <Card className="bg-white/95 backdrop-blur-md border-border/40 shadow-sm rounded-3xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Informações Principais */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
              <Building2 className="w-7 h-7 text-primary" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                  SAP #{cliente.sapCode}
                </span>
                <h1 className="font-serif text-2xl font-bold text-primary tracking-tight">
                  {cliente.razaoSocial}
                </h1>
                <Badge
                  className={cn(
                    'text-[10px] font-bold border-none',
                    cliente.statusComercial === 'Ativo'
                      ? 'bg-emerald-100 text-emerald-800'
                      : cliente.statusComercial === 'Em Risco'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800',
                  )}
                >
                  Status: {cliente.statusComercial}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px] font-bold',
                    cliente.statusCredito === 'Regular'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : cliente.statusCredito === 'Restrito'
                        ? 'bg-amber-50 text-amber-700 border-amber-300'
                        : 'bg-rose-50 text-rose-700 border-rose-300',
                  )}
                >
                  Crédito: {cliente.statusCredito}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-muted-foreground mt-2">
                <span className="font-medium text-slate-800">
                  Fantasia: <strong>{cliente.nomeFantasia}</strong>
                </span>
                <span>CNPJ: {cliente.cnpj}</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                  {cliente.cidade} - {cliente.uf}
                </span>
                <span>
                  Segmento: <strong>{cliente.segmento}</strong> ({cliente.subsegmento})
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 text-xs text-slate-600 mt-1">
                <span>
                  Vendedor Responsável: <strong>{cliente.vendedor}</strong>
                </span>
                <span>
                  Supervisor Regional: <strong>{cliente.supervisor}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Tag de Segmento RFM & Score */}
          <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-2xl border border-border/40 shrink-0">
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Classificação RFM
              </span>
              <div className="mt-1">
                <RFMSegmentBadge segment={cliente.rfmSegmento} />
              </div>
            </div>
            <div className="h-9 w-px bg-border/60 mx-1" />
            <div className="text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Score
              </span>
              <span className="font-serif text-2xl font-bold text-primary block mt-0.5">
                {cliente.scoreComercial}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* 8 CARDS DE RESUMO OBRIGATÓRIOS (LINHA SUPERIOR) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* 1. Faturamento 12m */}
        <Card className="bg-white/80 backdrop-blur-md border-border/40 rounded-2xl p-3 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Fat. 12m
          </span>
          <div className="mt-1.5">
            <span className="font-serif text-sm font-bold text-slate-900 block">
              {formatBRL(cliente.faturamento12m)}
            </span>
          </div>
        </Card>

        {/* 2. Toneladas 12m */}
        <Card className="bg-white/80 backdrop-blur-md border-border/40 rounded-2xl p-3 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Volume 12m
          </span>
          <div className="mt-1.5">
            <span className="font-serif text-sm font-bold text-primary block">
              {cliente.toneladas12m} ton
            </span>
          </div>
        </Card>

        {/* 3. Ticket Médio */}
        <Card className="bg-white/80 backdrop-blur-md border-border/40 rounded-2xl p-3 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Ticket Médio
          </span>
          <div className="mt-1.5">
            <span className="font-serif text-sm font-bold text-slate-900 block">
              {formatBRL(cliente.ticketMedio)}
            </span>
          </div>
        </Card>

        {/* 4. Frequência */}
        <Card className="bg-white/80 backdrop-blur-md border-border/40 rounded-2xl p-3 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Frequência
          </span>
          <div className="mt-1.5">
            <span className="text-xs font-semibold text-slate-800 block">
              {cliente.recorrencia}
            </span>
            <span className="text-[10px] text-muted-foreground">
              ~{cliente.frequenciaDias} dias
            </span>
          </div>
        </Card>

        {/* 5. Última Compra */}
        <Card className="bg-white/80 backdrop-blur-md border-border/40 rounded-2xl p-3 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Última Compra
          </span>
          <div className="mt-1.5">
            <span className="text-xs font-semibold text-slate-900 block">
              {cliente.ultimaCompraData}
            </span>
            <span className="text-[10px] text-emerald-600 font-bold block">
              {formatBRL(cliente.ultimaCompraValor)}
            </span>
          </div>
        </Card>

        {/* 6. Próxima Recompra Estimada */}
        <Card className="bg-white/80 backdrop-blur-md border-border/40 rounded-2xl p-3 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Próx. Recompra
          </span>
          <div className="mt-1.5">
            <span className="text-xs font-semibold text-slate-900 block">
              {cliente.proximaCompraEstimada}
            </span>
            <span className="text-[10px] text-primary font-semibold block">
              em {cliente.diasProximaCompra} dias
            </span>
          </div>
        </Card>

        {/* 7. P(vivo) & Potencial */}
        <Card className="bg-white/80 backdrop-blur-md border-border/40 rounded-2xl p-3 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            P(vivo) / Potencial
          </span>
          <div className="mt-1.5">
            <span className="font-mono text-xs font-bold text-emerald-600 block">
              {cliente.pVivo}% ativo
            </span>
            <span className="text-[10px] text-muted-foreground block">
              {formatBRL(cliente.potencial12m)}
            </span>
          </div>
        </Card>

        {/* 8. Pipeline & Último Contato */}
        <Card className="bg-white/80 backdrop-blur-md border-border/40 rounded-2xl p-3 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Pipeline Ativo
          </span>
          <div className="mt-1.5">
            <span className="font-serif text-sm font-bold text-emerald-600 block">
              {formatBRL(cliente.pipelineValor)}
            </span>
            <span className="text-[10px] text-slate-500 block">
              Contato: {cliente.ultimoContatoData}
            </span>
          </div>
        </Card>
      </div>

      {/* 6 ABAS DETALHADAS DO CLIENTE 360º */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <div className="border-b border-border/40 pb-px">
          <TabsList className="bg-transparent p-0 h-auto gap-2 flex-wrap">
            <TabsTrigger
              value="timeline"
              className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl px-4 py-2 text-xs font-semibold gap-1.5"
            >
              <Clock className="w-3.5 h-3.5" /> 1. Timeline ({timeline.length})
            </TabsTrigger>
            <TabsTrigger
              value="produtos"
              className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl px-4 py-2 text-xs font-semibold gap-1.5"
            >
              <Package className="w-3.5 h-3.5" /> 2. Produtos & Abandonados ({produtos.length})
            </TabsTrigger>
            <TabsTrigger
              value="financeiro"
              className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl px-4 py-2 text-xs font-semibold gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5" /> 3. Financeiro & Crédito
            </TabsTrigger>
            <TabsTrigger
              value="nfs"
              className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl px-4 py-2 text-xs font-semibold gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" /> 4. Últimas NFs ({nfs.length})
            </TabsTrigger>
            <TabsTrigger
              value="estoque"
              className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl px-4 py-2 text-xs font-semibold gap-1.5"
            >
              <Warehouse className="w-3.5 h-3.5" /> 5. Estoque & WMS
            </TabsTrigger>
            <TabsTrigger
              value="oportunidades"
              className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl px-4 py-2 text-xs font-semibold gap-1.5"
            >
              <TrendingUp className="w-3.5 h-3.5" /> 6. Oportunidades ({oportunidades.length})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ABA 1: TIMELINE */}
        <TabsContent value="timeline" className="space-y-4 m-0">
          <Card className="bg-white/95 backdrop-blur-md border-border/40 rounded-3xl p-6">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-primary">
                  Linha do Tempo de Interações & Movimentações
                </h3>
                <p className="text-xs text-muted-foreground">
                  Feed unificado com WhatsApp, E-mails Microsoft 365, Visitas, Cotações e Pedidos
                  SAP.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => toast.info('Registro rápido de interação aberto.')}
                className="h-8 gap-1.5 text-xs text-primary"
              >
                <Plus className="w-3.5 h-3.5" /> Registrar Contato
              </Button>
            </div>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
              {timeline.map((item) => (
                <div key={item.id} className="relative group">
                  <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white border-2 border-primary flex items-center justify-center shadow-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  </div>

                  <div className="bg-slate-50 hover:bg-slate-100/80 transition-colors p-4 rounded-2xl border border-border/40 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-white rounded-lg border border-border/40 shadow-2xs">
                          {getTimelineIcon(item.tipo)}
                        </div>
                        <span className="font-bold text-xs text-slate-900">{item.titulo}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.valor && (
                          <span className="font-serif font-bold text-xs text-emerald-600">
                            {formatBRL(item.valor)}
                          </span>
                        )}
                        <Badge variant="outline" className="text-[10px] bg-white text-slate-600">
                          {item.canal}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">{item.data}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 font-medium pl-8">{item.descricao}</p>
                    <div className="pl-8 text-[10px] text-muted-foreground">
                      Registrado por: <strong>{item.autor}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* ABA 2: PRODUTOS & PRODUTOS ABANDONADOS */}
        <TabsContent value="produtos" className="space-y-6 m-0">
          {/* Seção Destacada: Produtos Abandonados */}
          {produtos.some((p) => p.status === 'Parou') && (
            <Card className="bg-rose-50/70 border-rose-200 rounded-3xl p-5 space-y-3">
              <div className="flex items-center gap-2.5 text-rose-800">
                <Flame className="w-5 h-5 text-rose-600 animate-pulse" />
                <h4 className="font-serif font-bold text-sm">
                  Alerta de Produtos Abandonados (Oportunidade de Recuperação)
                </h4>
              </div>
              <p className="text-xs text-rose-700">
                O cliente costumava comprar estes materiais com frequência regular e parou nos
                últimos ciclos. Ação de reativação comercial recomendada.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {produtos
                  .filter((p) => p.status === 'Parou')
                  .map((p) => (
                    <div
                      key={p.id}
                      className="bg-white p-3.5 rounded-2xl border border-rose-200 flex items-center justify-between shadow-2xs"
                    >
                      <div>
                        <span className="font-mono text-[10px] text-muted-foreground block">
                          {p.codigo} · {p.familia}
                        </span>
                        <span className="font-bold text-xs text-slate-900 block">
                          {p.descricao}
                        </span>
                        <span className="text-[11px] text-rose-600 font-semibold block mt-0.5">
                          Última compra: {p.ultimaCompraData} (Volume anterior: {p.volume12mTon}t)
                        </span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() =>
                          toast.success(`Oferta de reativação para ${p.codigo} criada com sucesso!`)
                        }
                        className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white shrink-0 ml-2"
                      >
                        Ofertar Lote
                      </Button>
                    </div>
                  ))}
              </div>
            </Card>
          )}

          {/* Grid de Todos os Produtos */}
          <Card className="bg-white/95 backdrop-blur-md border-border/40 rounded-3xl p-6">
            <h3 className="font-serif text-lg font-bold text-primary mb-1">
              Catálogo de Materiais & Histórico de Compras
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Comportamento de compra por família de produtos, preço médio praticado e status de
              recompra.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-muted-foreground uppercase text-[10px] border-b">
                  <tr>
                    <th className="py-3 px-3">Código</th>
                    <th className="py-3 px-3">Descrição do Material</th>
                    <th className="py-3 px-3">Família</th>
                    <th className="py-3 px-3">Última Compra</th>
                    <th className="py-3 px-3 text-center">Volume 12m</th>
                    <th className="py-3 px-3 text-right">Preço Médio / kg</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {produtos.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-primary">{p.codigo}</td>
                      <td className="py-3 px-3 font-medium text-slate-900">{p.descricao}</td>
                      <td className="py-3 px-3 text-slate-600">{p.familia}</td>
                      <td className="py-3 px-3 text-slate-700">{p.ultimaCompraData}</td>
                      <td className="py-3 px-3 text-center font-mono font-semibold text-primary">
                        {p.volume12mTon} t
                      </td>
                      <td className="py-3 px-3 text-right font-serif font-semibold text-slate-800">
                        {p.precoMedioKg.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge
                          className={cn(
                            'text-[10px] font-bold border-none',
                            p.status === 'Ativo'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.status === 'Reduziu'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800',
                          )}
                        >
                          {p.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toast.info(`Cotação para o item ${p.codigo} adicionada.`)}
                          className="h-7 text-xs text-primary hover:bg-primary/10"
                        >
                          Cotar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* ABA 3: FINANCEIRO & CRÉDITO */}
        <TabsContent value="financeiro" className="space-y-4 m-0">
          <Card className="bg-white/95 backdrop-blur-md border-border/40 rounded-3xl p-6">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-primary">
                  Posição Financeira & Linha de Crédito SAP
                </h3>
                <p className="text-xs text-muted-foreground">
                  Informações sincronizadas com o módulo financeiro do SAP S/4HANA (Contas a
                  Receber).
                </p>
              </div>
              <Badge
                variant="outline"
                className="bg-emerald-50 text-emerald-700 border-emerald-300 text-xs font-semibold"
              >
                Consulta Serasa & SAP OK
              </Badge>
            </div>

            {/* CARDS FINANCEIROS OBRIGATÓRIOS */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-border/40 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Limite de Crédito
                </span>
                <span className="font-serif text-lg font-bold text-slate-900 block">
                  {formatBRL(cliente.limiteCredito)}
                </span>
              </div>

              <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                  Crédito Disponível
                </span>
                <span className="font-serif text-lg font-bold text-emerald-700 block">
                  {formatBRL(cliente.creditoDisponivel)}
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-border/40 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  % Utilizado
                </span>
                <span className="font-serif text-lg font-bold text-primary block">
                  {(
                    ((cliente.limiteCredito - cliente.creditoDisponivel) / cliente.limiteCredito) *
                    100
                  ).toFixed(0)}
                  %
                </span>
              </div>

              <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block">
                  A Receber (A Vencer)
                </span>
                <span className="font-serif text-lg font-bold text-blue-700 block">
                  {formatBRL(cliente.limiteCredito - cliente.creditoDisponivel)}
                </span>
              </div>

              <div className="p-3.5 bg-rose-50/60 rounded-2xl border border-rose-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block">
                  Títulos Vencidos
                </span>
                <span className="font-serif text-lg font-bold text-rose-600 block">R$ 0,00</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-border/40 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Maior Atraso
                </span>
                <span className="font-serif text-lg font-bold text-slate-800 block">0 dias</span>
              </div>
            </div>

            <div className="p-4 bg-muted/20 rounded-2xl border border-dashed border-border/60 text-xs text-muted-foreground flex items-center justify-between">
              <span>
                Condição padrão de pagamento negociada:{' '}
                <strong>28 / 35 DDL via Boleto Bancário</strong>
              </span>
              <span className="text-[11px] text-emerald-600 font-semibold">Cliente adimplente</span>
            </div>
          </Card>
        </TabsContent>

        {/* ABA 4: ÚLTIMAS NOTAS FISCAIS */}
        <TabsContent value="nfs" className="space-y-4 m-0">
          <Card className="bg-white/95 backdrop-blur-md border-border/40 rounded-3xl p-6">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-primary">
                  Histórico de Faturamento & Notas Fiscais Eletrônicas
                </h3>
                <p className="text-xs text-muted-foreground">
                  Documentos fiscais emitidos pela CIAFAL integrados com a SEFAZ MG.
                </p>
              </div>
              <Badge className="bg-primary text-white text-xs">
                {nfs.length} NFs no histórico recente
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-muted-foreground uppercase text-[10px] border-b">
                  <tr>
                    <th className="py-3 px-3">Número NF</th>
                    <th className="py-3 px-3">Data de Emissão</th>
                    <th className="py-3 px-3 text-right">Valor Total R$</th>
                    <th className="py-3 px-3 text-center">Toneladas</th>
                    <th className="py-3 px-3">Transportadora</th>
                    <th className="py-3 px-3 text-center">Status Entrega</th>
                    <th className="py-3 px-3 text-center">DANFE / XML</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {nfs.map((nf) => (
                    <tr key={nf.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-primary">{nf.numeroNF}</td>
                      <td className="py-3 px-3 text-slate-800">{nf.dataEmissao}</td>
                      <td className="py-3 px-3 text-right font-serif font-bold text-emerald-600">
                        {formatBRL(nf.valorTotal)}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-semibold">
                        {nf.toneladas} t
                      </td>
                      <td className="py-3 px-3 text-slate-600">{nf.transportadora}</td>
                      <td className="py-3 px-3 text-center">
                        <Badge
                          className={cn(
                            'text-[10px] font-bold border-none',
                            nf.statusEntrega === 'Entregue'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800',
                          )}
                        >
                          {nf.statusEntrega}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toast.info(`Download do DANFE da NF ${nf.numeroNF}...`)}
                          className="h-7 text-xs text-primary hover:bg-primary/10"
                        >
                          Visualizar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* ABA 5: ESTOQUE & WMS */}
        <TabsContent value="estoque" className="space-y-4 m-0">
          <Card className="bg-white/95 backdrop-blur-md border-border/40 rounded-3xl p-6">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-primary">
                  Estoque Disponível em Pátio (CD Contagem / Betim)
                </h3>
                <p className="text-xs text-muted-foreground">
                  Saldos físicos atualizados com conferência de lotes e alertas de estoque crítico.
                </p>
              </div>
              <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-300 text-xs">
                WMS Conectado
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-muted-foreground uppercase text-[10px] border-b">
                  <tr>
                    <th className="py-3 px-3">Código</th>
                    <th className="py-3 px-3">Descrição do Material</th>
                    <th className="py-3 px-3 text-center">Saldo Estoque (ton)</th>
                    <th className="py-3 px-3 text-center">Lotes</th>
                    <th className="py-3 px-3 text-right">Peso Médio (kg)</th>
                    <th className="py-3 px-3">Alerta WMS</th>
                    <th className="py-3 px-3 text-center">Ação WMS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {produtos.map((p) => {
                    const isLowStock = p.saldoEstoqueTon < 5.0
                    const isConfirmed = wmsConfirmed[p.codigo]

                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-primary">{p.codigo}</td>
                        <td className="py-3 px-3 font-medium text-slate-900">{p.descricao}</td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                          {p.saldoEstoqueTon} t
                        </td>
                        <td className="py-3 px-3 text-center font-mono">{p.lotes} lotes</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-600">
                          {p.pesoMedioKg} kg
                        </td>
                        <td className="py-3 px-3">
                          {isLowStock ? (
                            <div className="flex items-center gap-1 text-amber-700 font-semibold text-[11px] bg-amber-50 px-2 py-0.5 rounded-md border border-amber-300 w-fit">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Solicitar confirmação de saldo (&lt; 5 ton)
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-emerald-700 font-medium text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Saldo seguro pronta-entrega
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {isLowStock && (
                            <Button
                              size="sm"
                              variant={isConfirmed ? 'outline' : 'default'}
                              onClick={() => handleRequestWMS(p.codigo)}
                              disabled={isConfirmed}
                              className={cn(
                                'h-7 text-[11px] gap-1',
                                isConfirmed
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                  : 'bg-amber-600 hover:bg-amber-700 text-white',
                              )}
                            >
                              <Warehouse className="w-3.5 h-3.5" />
                              {isConfirmed ? 'WMS Solicitado' : 'Solicitar Confirmação WMS'}
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* ABA 6: OPORTUNIDADES DO CLIENTE */}
        <TabsContent value="oportunidades" className="space-y-4 m-0">
          <Card className="bg-white/95 backdrop-blur-md border-border/40 rounded-3xl p-6">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-primary">
                  Oportunidades & Negociações Abertas
                </h3>
                <p className="text-xs text-muted-foreground">
                  Propostas em andamento no funil comercial da CIAFAL para este cliente.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => toast.info('Nova oportunidade para este cliente.')}
                className="h-8 gap-1.5 text-xs bg-primary text-white"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Oportunidade
              </Button>
            </div>

            {oportunidades.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Nenhuma oportunidade ativa no funil para este cliente no momento.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {oportunidades.map((op) => (
                  <Card
                    key={op.id}
                    className="bg-slate-50/80 border-border/40 rounded-2xl p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-bold text-sm text-primary block">{op.titulo}</span>
                        <span className="text-xs text-muted-foreground">
                          Vendedor: {op.vendedorNome} · Previsão: {op.previsaoFechamento}
                        </span>
                      </div>
                      <Badge className="bg-primary/10 text-primary border-none text-xs font-bold capitalize">
                        {op.etapa}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between border-t border-b py-2 text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[10px]">VALOR TOTAL</span>
                        <span className="font-serif font-bold text-base text-emerald-600">
                          {formatBRL(op.valor)}
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="text-muted-foreground block text-[10px]">VOLUME</span>
                        <span className="font-bold text-slate-800">{op.toneladas} ton</span>
                      </div>
                      <div className="text-right">
                        <span className="text-muted-foreground block text-[10px]">
                          PROBABILIDADE
                        </span>
                        <span className="font-bold text-primary">{op.probabilidade}%</span>
                      </div>
                    </div>

                    <div className="bg-white p-2.5 rounded-xl border border-border/40 text-xs text-slate-700">
                      <strong className="text-primary">Próxima Ação:</strong> {op.proximaAcao}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
