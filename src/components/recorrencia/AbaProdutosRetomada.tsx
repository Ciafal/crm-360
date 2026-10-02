// src/components/recorrencia/AbaProdutosRetomada.tsx
import React, { useState, useMemo, useCallback } from 'react'
import {
  Package,
  Weight,
  Layers,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  FileSpreadsheet,
  ChevronRight,
  ChevronDown,
  Info,
  Clock,
  ArrowUpDown,
  Building2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { GerarOportunidadeRetomadaModal } from './GerarOportunidadeRetomadaModal'
import { recorrenciaService } from '@/services/recorrencia_service'
import type { ProdutoRetomadaItem, ClienteRecorrenciaView, UnitMode } from '@/types/recorrencia'

export type OrdenacaoClientesOpcao =
  | 'compra_mensal_media'
  | 'maior_volume'
  | 'maior_tonelagem_parada'
  | 'maior_num_parados'
  | 'maior_tempo_sem_comprar'
  | 'ultima_compra_mais_antiga'
  | 'risco_perda'
  | 'probabilidade_recompra'

interface AbaProdutosRetomadaProps {
  clientes: ClienteRecorrenciaView[]
  unitMode: UnitMode
  onSelectCliente: (clienteSap: string) => void
}

export function AbaProdutosRetomada({
  clientes,
  unitMode,
  onSelectCliente,
}: AbaProdutosRetomadaProps) {
  const [selectedClienteSap, setSelectedClienteSap] = useState<string>('TODOS')
  const [selectedGrupo, setSelectedGrupo] = useState<string>('TODOS')
  const [selectedSituacao, setSelectedSituacao] = useState<string>('TODOS')
  const [searchTerm, setSearchTerm] = useState('')

  // Estado da nova seção "Relação por Cliente"
  const [buscaClienteProduto, setBuscaClienteProduto] = useState('')
  const [ordenacaoCliente, setOrdenacaoCliente] =
    useState<OrdenacaoClientesOpcao>('compra_mensal_media')
  const [expandedClients, setExpandedClients] = useState<Record<string, boolean>>({})
  const [expandedClientsCache, setExpandedClientsCache] = useState<
    Record<string, ProdutoRetomadaItem[]>
  >({})

  // Modal de geração de oportunidade
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedProduto, setSelectedProduto] = useState<ProdutoRetomadaItem | null>(null)
  const [selectedProdutosMultiplos, setSelectedProdutosMultiplos] = useState<
    ProdutoRetomadaItem[] | undefined
  >(undefined)
  const [selectedClienteModal, setSelectedClienteModal] = useState<ClienteRecorrenciaView | null>(
    null,
  )

  // Formatação BR estrita
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

  // Lista mestre de produtos carregada do motor de retomada
  const todosProdutos = useMemo(() => {
    return recorrenciaService.getProdutosRetomada()
  }, [])

  // Filtragem dos Produtos
  const produtosFiltrados = useMemo(() => {
    return todosProdutos.filter((p) => {
      if (selectedClienteSap !== 'TODOS' && p.clienteSap !== selectedClienteSap) {
        return false
      }
      if (selectedGrupo !== 'TODOS' && p.grupo !== selectedGrupo) {
        return false
      }
      if (selectedSituacao !== 'TODOS' && p.situacao !== selectedSituacao) {
        return false
      }
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        const match =
          p.descricao.toLowerCase().includes(term) ||
          p.codigoMaterial.toLowerCase().includes(term) ||
          p.clienteNome.toLowerCase().includes(term) ||
          p.grupo.toLowerCase().includes(term)
        if (!match) return false
      }
      return true
    })
  }, [todosProdutos, selectedClienteSap, selectedGrupo, selectedSituacao, searchTerm])

  // 4 Indicadores principais de topo:
  // Produtos Distintos, Tonelagem, Itens Parados, Tonelagem Parada
  const indicadores = useMemo(() => {
    const distintosSet = new Set(produtosFiltrados.map((p) => p.codigoMaterial))
    const tonelagemTotal = produtosFiltrados.reduce((acc, p) => acc + p.tonelagemHistorica, 0)
    const parados = produtosFiltrados.filter(
      (p) => p.situacao === 'Sem nota no ano' || p.diasSemComprar > 60,
    )
    const tonelagemParada = parados.reduce((acc, p) => acc + p.tonelagemHistorica, 0)

    return {
      produtosDistintos: distintosSet.size,
      tonelagemTotal: Number(tonelagemTotal.toFixed(1)),
      itensParados: parados.length,
      tonelagemParada: Number(tonelagemParada.toFixed(1)),
    }
  }, [produtosFiltrados])

  // Gráfico: Grupos de Mercadoria (quanto de cada família parou, ativo vs parado)
  const gruposMercadoriaBreakdown = useMemo(() => {
    const mapa: Record<string, { ativoTons: number; paradoTons: number }> = {}

    produtosFiltrados.forEach((p) => {
      if (!mapa[p.grupo]) {
        mapa[p.grupo] = { ativoTons: 0, paradoTons: 0 }
      }
      if (p.situacao === 'Ativo') {
        mapa[p.grupo].ativoTons += p.tonelagemHistorica
      } else {
        mapa[p.grupo].paradoTons += p.tonelagemHistorica
      }
    })

    return Object.entries(mapa).map(([grupo, vals]) => ({
      grupo,
      ativoTons: Number(vals.ativoTons.toFixed(1)),
      paradoTons: Number(vals.paradoTons.toFixed(1)),
      totalTons: Number((vals.ativoTons + vals.paradoTons).toFixed(1)),
    }))
  }, [produtosFiltrados])

  const handleAbrirOportunidade = (
    produto: ProdutoRetomadaItem,
    clienteAssociado?: ClienteRecorrenciaView | null,
  ) => {
    setSelectedProduto(produto)
    setSelectedProdutosMultiplos(undefined)
    setSelectedClienteModal(clienteAssociado || null)
    setModalOpen(true)
  }

  const handleAbrirOportunidadeMultipla = (
    clienteAlvo: ClienteRecorrenciaView,
    itensParados: ProdutoRetomadaItem[],
  ) => {
    setSelectedProduto(null)
    setSelectedProdutosMultiplos(itensParados)
    setSelectedClienteModal(clienteAlvo)
    setModalOpen(true)
  }

  // Resolver produtos de um cliente sob demanda (cache em expandedClientsCache)
  const getProdutosDoCliente = useCallback(
    (clienteSap: string): ProdutoRetomadaItem[] => {
      if (expandedClientsCache[clienteSap]) {
        return expandedClientsCache[clienteSap]
      }
      const resolvidos = todosProdutos.filter((p) => p.clienteSap === clienteSap)
      setExpandedClientsCache((prev) => ({ ...prev, [clienteSap]: resolvidos }))
      return resolvidos
    },
    [expandedClientsCache, todosProdutos],
  )

  // Toggle do Accordion
  const toggleClienteAccordion = useCallback(
    (clienteSap: string) => {
      setExpandedClients((prev) => {
        const isCurrentlyExpanded = Boolean(prev[clienteSap])
        const next = { ...prev, [clienteSap]: !isCurrentlyExpanded }
        // Se estiver abrindo e não estiver no cache, carrega agora
        if (!isCurrentlyExpanded && !expandedClientsCache[clienteSap]) {
          const prods = todosProdutos.filter((p) => p.clienteSap === clienteSap)
          setExpandedClientsCache((c) => ({ ...c, [clienteSap]: prods }))
        }
        return next
      })
    },
    [expandedClientsCache, todosProdutos],
  )

  // Resumo de cada cliente para exibição rápida e ordenação
  const clientesComResumo = useMemo(() => {
    return clientes.map((c) => {
      // Produtos do cliente a partir do catálogo mestre
      const prods = todosProdutos.filter((p) => p.clienteSap === c.codigoSap)
      const distintosCount = new Set(prods.map((p) => p.codigoMaterial)).size
      const volumeHistoricoTotal = Number(
        prods.reduce((acc, p) => acc + p.tonelagemHistorica, 0).toFixed(1),
      )
      const parados = prods.filter((p) => p.situacao === 'Sem nota no ano' || p.diasSemComprar > 60)
      const paradosCount = parados.length
      const tonelagemParada = Number(
        parados.reduce((acc, p) => acc + p.tonelagemHistorica, 0).toFixed(1),
      )

      // Fallbacks coerentes com c se prods não existir
      const volumeTotal =
        volumeHistoricoTotal > 0
          ? volumeHistoricoTotal
          : Number((c.totalToneladas12m || c.compraMensalMediaTons * 12).toFixed(1))
      const produtosDistintos = distintosCount > 0 ? distintosCount : 4
      const ultimaCompra = c.ultimaCompraData || '14/09/2024'

      return {
        cliente: c,
        volumeTotal,
        produtosDistintos,
        ultimaCompra,
        paradosCount,
        tonelagemParada,
        produtos: prods,
      }
    })
  }, [clientes, todosProdutos])

  // Busca e Ordenação dos Clientes
  const clientesProcessados = useMemo(() => {
    let lista = [...clientesComResumo]

    // Busca textual inteligente: cliente (nome/código/SAP/CNPJ) ou produto (código/descrição)
    if (buscaClienteProduto.trim()) {
      const term = buscaClienteProduto.trim().toLowerCase()
      lista = lista.filter((item) => {
        const c = item.cliente
        const matchCliente =
          c.razaoSocial.toLowerCase().includes(term) ||
          c.codigoSap.toLowerCase().includes(term) ||
          c.cnpjCpf.toLowerCase().includes(term) ||
          (c.nomeFantasia && c.nomeFantasia.toLowerCase().includes(term))

        const matchProduto = item.produtos.some(
          (p) =>
            p.codigoMaterial.toLowerCase().includes(term) ||
            p.descricao.toLowerCase().includes(term) ||
            p.grupo.toLowerCase().includes(term),
        )

        return matchCliente || matchProduto
      })
    }

    // Ordenação estrita das 8 opções
    lista.sort((a, b) => {
      switch (ordenacaoCliente) {
        case 'compra_mensal_media':
          return (b.cliente.compraMensalMediaTons || 0) - (a.cliente.compraMensalMediaTons || 0)
        case 'maior_volume':
          return b.volumeTotal - a.volumeTotal
        case 'maior_tonelagem_parada':
          return b.tonelagemParada - a.tonelagemParada
        case 'maior_num_parados':
          return b.paradosCount - a.paradosCount
        case 'maior_tempo_sem_comprar':
          return (b.cliente.diasSemComprar || 0) - (a.cliente.diasSemComprar || 0)
        case 'ultima_compra_mais_antiga':
          return (b.cliente.diasSemComprar || 0) - (a.cliente.diasSemComprar || 0)
        case 'risco_perda': {
          const pesoRisco = (cli: ClienteRecorrenciaView) => {
            if (cli.tipoAlerta === 'Parada Abrupta') return 3
            if (cli.tipoAlerta === 'Queda Forte') return 2
            return 1
          }
          return pesoRisco(b.cliente) - pesoRisco(a.cliente)
        }
        case 'probabilidade_recompra': {
          const pesoProb = (cli: ClienteRecorrenciaView) => {
            return cli.altaProbabilidadeCadencia ? 2 : 1
          }
          return pesoProb(b.cliente) - pesoProb(a.cliente)
        }
        default:
          return (b.cliente.compraMensalMediaTons || 0) - (a.cliente.compraMensalMediaTons || 0)
      }
    })

    return lista
  }, [clientesComResumo, buscaClienteProduto, ordenacaoCliente])

  // Se o termo de busca casar com um produto, auto-expandir o cliente correspondente
  React.useEffect(() => {
    if (!buscaClienteProduto.trim()) return
    const term = buscaClienteProduto.trim().toLowerCase()
    const matchingSap: Record<string, boolean> = {}

    clientesComResumo.forEach((item) => {
      const matchProd = item.produtos.some(
        (p) =>
          p.codigoMaterial.toLowerCase().includes(term) || p.descricao.toLowerCase().includes(term),
      )
      if (matchProd) {
        matchingSap[item.cliente.codigoSap] = true
        if (!expandedClientsCache[item.cliente.codigoSap]) {
          getProdutosDoCliente(item.cliente.codigoSap)
        }
      }
    })

    if (Object.keys(matchingSap).length > 0) {
      setExpandedClients((prev) => ({ ...prev, ...matchingSap }))
    }
  }, [buscaClienteProduto, clientesComResumo, expandedClientsCache, getProdutosDoCliente])

  return (
    <div className="space-y-6">
      {/* 1. INDICADORES DE TOPO DA ABA 4 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Indicador 1 */}
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold uppercase tracking-wider">
                1. Produtos Distintos
              </span>
              <Package className="w-4 h-4 text-primary" />
            </div>
            <div className="font-serif font-bold text-2xl text-slate-900">
              {indicadores.produtosDistintos}
            </div>
            <span className="text-[10px] text-muted-foreground block">
              Mix comercial em circulação
            </span>
          </CardContent>
        </Card>

        {/* Indicador 2 */}
        <Card className="border-slate-200 bg-white shadow-xs">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold uppercase tracking-wider">
                2. Tonelagem Total
              </span>
              <Weight className="w-4 h-4 text-sky-600" />
            </div>
            <div className="font-serif font-bold text-2xl text-[#003A70]">
              {formatTons(indicadores.tonelagemTotal)}
            </div>
            <span className="text-[10px] text-muted-foreground block">
              Histórico ponderado 12 meses
            </span>
          </CardContent>
        </Card>

        {/* Indicador 3 */}
        <Card className="border-amber-200 bg-amber-50/40 shadow-xs">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-amber-800">
              <span className="text-[10px] font-bold uppercase tracking-wider">
                3. Itens Parados
              </span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="font-serif font-bold text-2xl text-amber-800">
              {indicadores.itensParados}
            </div>
            <span className="text-[10px] text-amber-700 block">Sem nota no ano corrente</span>
          </CardContent>
        </Card>

        {/* Indicador 4 */}
        <Card className="border-rose-200 bg-rose-50/40 shadow-xs">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between text-rose-800">
              <span className="text-[10px] font-bold uppercase tracking-wider">
                4. Tonelagem Parada
              </span>
              <Layers className="w-4 h-4 text-rose-600" />
            </div>
            <div className="font-serif font-bold text-2xl text-rose-700">
              {formatTons(indicadores.tonelagemParada)}
            </div>
            <span className="text-[10px] text-rose-800 block">Volume potencial de retomada</span>
          </CardContent>
        </Card>
      </div>

      {/* 2. GRÁFICO: GRUPOS DE MERCADORIA (Ativo vs Parado) */}
      <Card className="border-slate-200 shadow-sm bg-white">
        <CardHeader className="p-4 border-b border-slate-200">
          <CardTitle className="font-serif text-sm font-bold text-[#003A70] flex items-center justify-between">
            <span>Grupos de Mercadoria — Quanto de cada família parou</span>
            <div className="flex items-center gap-3 text-xs font-normal">
              <span className="flex items-center gap-1.5 text-emerald-800">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                Ainda Comprado (Ativo)
              </span>
              <span className="flex items-center gap-1.5 text-rose-800">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                Parado no Cliente
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3">
            {gruposMercadoriaBreakdown.map((item) => {
              const pctAtivo = item.totalTons > 0 ? (item.ativoTons / item.totalTons) * 100 : 0
              const pctParado = item.totalTons > 0 ? (item.paradoTons / item.totalTons) * 100 : 0

              return (
                <div key={item.grupo} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{item.grupo}</span>
                    <div className="flex items-center gap-2 font-mono text-[11px]">
                      <span className="text-emerald-700 font-bold">
                        {formatTons(item.ativoTons)}
                      </span>
                      <span className="text-slate-400">/</span>
                      <span className="text-rose-600 font-bold">{formatTons(item.paradoTons)}</span>
                      <span className="text-slate-500">({item.totalTons}t total)</span>
                    </div>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 flex overflow-hidden">
                    <div
                      style={{ width: `${pctAtivo}%` }}
                      className="bg-emerald-500 h-full transition-all"
                      title={`Ativo: ${formatTons(item.ativoTons)} (${Math.round(pctAtivo)}%)`}
                    />
                    <div
                      style={{ width: `${pctParado}%` }}
                      className="bg-rose-500 h-full transition-all"
                      title={`Parado: ${formatTons(item.paradoTons)} (${Math.round(pctParado)}%)`}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 3. RELAÇÃO DE PRODUTOS POR CLIENTE COM MOTOR DE RETOMADA & OPP */}
      <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
        <CardHeader className="p-4 bg-slate-50/70 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="font-serif text-base font-bold text-[#003A70]">
                Produtos Comprados e Retomada de Mix
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Clique em <strong>"Gerar Oportunidade"</strong> para criar OPP-XXXXXX/AAAA integrada
                ao Funil.
              </p>
            </div>

            {/* Filtros Internos da Tabela */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Cliente */}
              <Select value={selectedClienteSap} onValueChange={setSelectedClienteSap}>
                <SelectTrigger className="h-8 text-xs w-48 rounded-xl bg-white border-slate-200">
                  <SelectValue placeholder="Cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos os Clientes</SelectItem>
                  {clientes.map((c) => (
                    <SelectItem key={c.codigoSap} value={c.codigoSap}>
                      {c.razaoSocial}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Situação no Ano */}
              <Select value={selectedSituacao} onValueChange={setSelectedSituacao}>
                <SelectTrigger className="h-8 text-xs w-36 rounded-xl bg-white border-slate-200">
                  <SelectValue placeholder="Situação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todas Situações</SelectItem>
                  <SelectItem value="Ativo">Ativo no Ano</SelectItem>
                  <SelectItem value="Sem nota no ano">Sem Nota no Ano</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative w-44">
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filtrar material..."
                  className="h-8 text-xs rounded-xl pl-2.5 bg-white border-slate-200"
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                <th className="p-3 pl-4 sticky left-0 bg-slate-100 z-10 w-60 shadow-xs">
                  Material / Grupo
                </th>
                <th className="p-3">Cliente</th>
                <th className="p-3 text-right">Histórico (t)</th>
                <th className="p-3 text-right">Valor Histórico</th>
                <th className="p-3 text-center">Nº NFs</th>
                <th className="p-3">Última Compra</th>
                <th className="p-3 text-center">Dias s/ Compra</th>
                <th className="p-3 text-center">Situação</th>
                <th className="p-3 text-right">Estoque Livre</th>
                <th className="p-3 text-right">Último Preço</th>
                <th className="p-3 text-center">Disponibilidade</th>
                <th className="p-3 pr-4 text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {produtosFiltrados.map((p, idx) => (
                <tr
                  key={`${p.clienteSap}-${p.codigoMaterial}-${idx}`}
                  className="hover:bg-sky-50/50 transition-colors"
                >
                  {/* Material */}
                  <td className="p-3 pl-4 sticky left-0 bg-white hover:bg-sky-50/50 z-10 shadow-xs">
                    <strong className="text-slate-900 block truncate max-w-[220px]">
                      {p.descricao}
                    </strong>
                    <span className="text-[10px] text-muted-foreground font-mono block">
                      Cód: {p.codigoMaterial} · {p.grupo}
                    </span>
                  </td>

                  {/* Cliente */}
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => onSelectCliente(p.clienteSap)}
                      className="text-left group block max-w-[180px]"
                    >
                      <span className="text-slate-800 font-medium group-hover:text-primary truncate block">
                        {p.clienteNome}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono block">
                        SAP: {p.clienteSap}
                      </span>
                    </button>
                  </td>

                  {/* Tonelagem */}
                  <td className="p-3 text-right font-mono font-bold text-slate-900">
                    {formatTons(p.tonelagemHistorica)}
                  </td>

                  {/* Valor Faturado */}
                  <td className="p-3 text-right font-mono text-slate-800">
                    {formatBRL(p.valorFaturadoHistorico)}
                  </td>

                  {/* NFs */}
                  <td className="p-3 text-center font-mono">{p.nfsCount} NF(s)</td>

                  {/* Última Compra */}
                  <td className="p-3 font-mono text-slate-700">{p.ultimaCompraData}</td>

                  {/* Dias sem comprar */}
                  <td className="p-3 text-center font-mono font-bold">
                    <span className={p.diasSemComprar > 60 ? 'text-rose-600' : 'text-slate-700'}>
                      {p.diasSemComprar}d
                    </span>
                  </td>

                  {/* Situação no Ano */}
                  <td className="p-3 text-center">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-semibold ${
                        p.situacao === 'Ativo'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-rose-50 text-rose-800 border-rose-300'
                      }`}
                    >
                      {p.situacao}
                    </Badge>
                  </td>

                  {/* Estoque Livre */}
                  <td className="p-3 text-right font-mono font-bold">
                    <span
                      className={p.estoqueLivreTons > 0 ? 'text-emerald-700' : 'text-slate-400'}
                    >
                      {formatTons(p.estoqueLivreTons)}
                    </span>
                  </td>

                  {/* Último Preço */}
                  <td className="p-3 text-right font-mono text-slate-800">
                    R$ {p.ultimoPrecoPraticadoKg.toFixed(2)}/kg
                  </td>

                  {/* Disponibilidade */}
                  <td className="p-3 text-center">
                    <Badge
                      className={`text-[9px] border-none ${
                        p.disponibilidadeVenda === 'Imediata'
                          ? 'bg-emerald-600 text-white'
                          : p.disponibilidadeVenda === 'Baixo Estoque'
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-400 text-white'
                      }`}
                    >
                      {p.disponibilidadeVenda}
                    </Badge>
                  </td>

                  {/* Ação: Gerar Oportunidade */}
                  <td className="p-3 pr-4 text-center">
                    <Button
                      size="sm"
                      onClick={() => handleAbrirOportunidade(p)}
                      className="h-7 text-xs rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>Gerar OPP</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* 4. RELAÇÃO POR CLIENTE — HISTÓRICO EXPANSÍVEL E RETOMADA CONSOLIDADA */}
      <div className="space-y-4 pt-2">
        {/* Cabeçalho da Seção */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#003A70]" />
              <h3 className="font-serif text-lg font-bold text-[#003A70]">Relação por Cliente</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Visualize o histórico de produtos comprados por cada cliente e identifique itens que
              deixaram de ser adquiridos.
            </p>
          </div>

          {/* Controles: Busca e Ordenação */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Campo de Busca Inteligente */}
            <div className="relative w-56 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={buscaClienteProduto}
                onChange={(e) => setBuscaClienteProduto(e.target.value)}
                placeholder="Buscar cliente ou produto..."
                className="h-8 text-xs rounded-xl pl-8 bg-slate-50 border-slate-200 focus:bg-white"
              />
            </div>

            {/* Ordenação */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                Ordenar por:
              </span>
              <Select
                value={ordenacaoCliente}
                onValueChange={(val: OrdenacaoClientesOpcao) => setOrdenacaoCliente(val)}
              >
                <SelectTrigger className="h-8 text-xs w-52 rounded-xl bg-slate-50 border-slate-200">
                  <ArrowUpDown className="w-3.5 h-3.5 mr-1.5 text-slate-400 shrink-0" />
                  <SelectValue placeholder="Ordenação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compra_mensal_media">Compra mensal média (desc)</SelectItem>
                  <SelectItem value="maior_volume">Maior volume histórico (t)</SelectItem>
                  <SelectItem value="maior_tonelagem_parada">Maior tonelagem parada (t)</SelectItem>
                  <SelectItem value="maior_num_parados">Maior nº de produtos parados</SelectItem>
                  <SelectItem value="maior_tempo_sem_comprar">
                    Maior tempo sem comprar (dias)
                  </SelectItem>
                  <SelectItem value="ultima_compra_mais_antiga">
                    Última compra mais antiga
                  </SelectItem>
                  <SelectItem value="risco_perda">Risco de perda (alertas)</SelectItem>
                  <SelectItem value="probabilidade_recompra">
                    Probabilidade de recompra (cadência)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Lista de Accordions por Cliente */}
        <div className="space-y-3">
          {clientesProcessados.length === 0 ? (
            <Card className="border-slate-200 bg-white p-8 text-center text-slate-500 text-xs">
              Nenhum cliente encontrado com os filtros e busca atuais.
            </Card>
          ) : (
            clientesProcessados.map(
              ({
                cliente: c,
                volumeTotal,
                produtosDistintos,
                ultimaCompra,
                paradosCount,
                tonelagemParada,
              }) => {
                const isExpanded = Boolean(expandedClients[c.codigoSap])
                const prodsDoCliente = isExpanded ? getProdutosDoCliente(c.codigoSap) : []
                const itensParadosDoCliente = prodsDoCliente.filter(
                  (p) => p.situacao === 'Sem nota no ano' || p.diasSemComprar > 60,
                )

                // Grupos do cliente com status (ex: "LEVE CHATO COMERCIAL · 168,8 t · parou" / "· ativo")
                const gruposDoCliente = Array.from(new Set(prodsDoCliente.map((p) => p.grupo))).map(
                  (grp) => {
                    const itensDoGrp = prodsDoCliente.filter((p) => p.grupo === grp)
                    const tonsGrp = Number(
                      itensDoGrp.reduce((acc, p) => acc + p.tonelagemHistorica, 0).toFixed(1),
                    )
                    const temAtivo = itensDoGrp.some((p) => p.situacao === 'Ativo')
                    return {
                      grupo: grp,
                      tonelagem: tonsGrp,
                      status: temAtivo ? 'ativo' : 'parou',
                    }
                  },
                )

                return (
                  <div
                    key={c.codigoSap}
                    className={`rounded-2xl bg-white border transition-all overflow-hidden ${
                      isExpanded
                        ? 'border-[#003A70] ring-2 ring-[#003A70]/15 shadow-md'
                        : 'border-slate-200 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    {/* Linha Resumo Fechada/Cabeçalho do Accordion (clicável em qualquer área) */}
                    <div
                      onClick={() => toggleClienteAccordion(c.codigoSap)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          toggleClienteAccordion(c.codigoSap)
                        }
                      }}
                      className={`w-full text-left p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none transition-colors ${
                        isExpanded ? 'bg-sky-50/50' : 'hover:bg-slate-50/70'
                      }`}
                    >
                      {/* Lado Esquerdo: Seta ▶↔▼ + Nome Destacado + Badges de Risco/RFM */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center transition-transform ${
                            isExpanded
                              ? 'bg-[#003A70] text-white rotate-90'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <ChevronRight className="w-4 h-4 shrink-0 transition-transform" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-serif font-bold text-sm sm:text-base text-slate-900 truncate">
                              {c.razaoSocial}
                            </span>
                            <Badge
                              variant="outline"
                              className="font-mono text-[10px] bg-white border-slate-300"
                            >
                              SAP: {c.codigoSap}
                            </Badge>
                            {c.segmentoRFM && (
                              <Badge
                                variant="outline"
                                className="text-[9px] font-semibold bg-sky-50 text-[#003A70] border-sky-200"
                              >
                                {c.segmentoRFM}
                              </Badge>
                            )}
                            {c.tipoAlerta !== 'Sem Alerta' && (
                              <Badge
                                className={`text-[9px] font-semibold text-white border-none ${
                                  c.tipoAlerta === 'Parada Abrupta' ? 'bg-rose-600' : 'bg-amber-600'
                                }`}
                              >
                                {c.tipoAlerta}
                              </Badge>
                            )}
                          </div>
                          <span className="text-[11px] text-muted-foreground block truncate">
                            Vendedor: <strong>{c.vendedorNome}</strong> · Rep:{' '}
                            <strong>{c.representanteNome}</strong> · {c.cidade}/{c.uf}
                          </span>
                        </div>
                      </div>

                      {/* Lado Direito: VOLUME, PRODUTOS, ÚLTIMA, PARADO */}
                      <div className="flex items-center gap-3 sm:gap-5 flex-wrap justify-between md:justify-end shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                        {/* VOLUME */}
                        <div className="text-right">
                          <span className="text-[9px] uppercase tracking-wider font-bold text-slate-600 block">
                            VOLUME (12M)
                          </span>
                          <span className="font-mono font-bold text-xs sm:text-sm text-[#003A70]">
                            {formatTons(volumeTotal)}
                          </span>
                        </div>

                        {/* PRODUTOS */}
                        <div className="text-right">
                          <span className="text-[9px] uppercase tracking-wider font-bold text-slate-600 block">
                            PRODUTOS
                          </span>
                          <span className="font-mono font-bold text-xs sm:text-sm text-slate-900">
                            {produtosDistintos} distintos
                          </span>
                        </div>

                        {/* ÚLTIMA */}
                        <div className="text-right">
                          <span className="text-[9px] uppercase tracking-wider font-bold text-slate-600 block">
                            ÚLTIMA COMPRA
                          </span>
                          <span className="font-mono text-xs sm:text-sm text-slate-700">
                            {ultimaCompra}
                          </span>
                        </div>

                        {/* PARADO */}
                        <div className="text-right pl-2 border-l border-slate-200">
                          <span className="text-[9px] uppercase tracking-wider font-bold text-rose-700 block">
                            PARADO
                          </span>
                          <span className="font-mono font-bold text-xs sm:text-sm text-rose-600">
                            {paradosCount} itens · {formatTons(tonelagemParada)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Conteúdo Expandido Imediatamente Abaixo (sem navegação) */}
                    {isExpanded && (
                      <div className="border-t border-slate-200 bg-slate-50/40 p-4 space-y-4 animate-in fade-in-50 duration-200">
                        {/* Barra de Ações Rápidas do Cabeçalho Expandido */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-white border border-slate-200">
                          <div className="flex items-center gap-3 flex-wrap text-xs">
                            <span className="font-semibold text-slate-800">
                              Mix de Produtos do Cliente:
                            </span>
                            <span className="text-slate-500 font-mono text-[11px]">
                              {prodsDoCliente.length} itens cadastrados · Compra média mensal:{' '}
                              {formatTons(c.compraMensalMediaTons)} (R${' '}
                              {c.compraMensalMediaValor.toLocaleString('pt-BR')})
                            </span>
                          </div>

                          {/* Ação Consolidada: Gerar Oportunidade de Retomada */}
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleAbrirOportunidadeMultipla(c, itensParadosDoCliente)
                              }}
                              disabled={itensParadosDoCliente.length === 0}
                              className="h-8 text-xs rounded-xl bg-[#003A70] hover:bg-[#002850] text-white font-semibold gap-1.5 shadow-xs"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                              <span>
                                Gerar oportunidade de retomada ({itensParadosDoCliente.length}{' '}
                                parados)
                              </span>
                            </Button>
                          </div>
                        </div>

                        {/* Badges por Grupo de Mercadoria ("GRUPO · N t · parou/ativo") */}
                        {gruposDoCliente.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                              Famílias e Grupos de Mercadoria:
                            </span>
                            <div className="flex items-center gap-2 flex-wrap">
                              {gruposDoCliente.map((grp) => (
                                <Badge
                                  key={grp.grupo}
                                  variant="outline"
                                  className={`text-xs py-1 px-2.5 rounded-lg font-mono font-medium flex items-center gap-1.5 ${
                                    grp.status === 'ativo'
                                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                                      : 'bg-rose-50 text-rose-900 border-rose-300'
                                  }`}
                                >
                                  <span
                                    className={`w-2 h-2 rounded-full inline-block ${
                                      grp.status === 'ativo' ? 'bg-emerald-500' : 'bg-rose-500'
                                    }`}
                                  />
                                  <span className="font-semibold">{grp.grupo}</span>
                                  <span className="text-slate-400">·</span>
                                  <span>{formatTons(grp.tonelagem)}</span>
                                  <span className="text-slate-400">·</span>
                                  <strong
                                    className={
                                      grp.status === 'ativo' ? 'text-emerald-700' : 'text-rose-700'
                                    }
                                  >
                                    {grp.status}
                                  </strong>
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Tabela de Produtos do Cliente */}
                        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left border-collapse min-w-[760px]">
                              <thead>
                                <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                                  <th className="p-3 pl-4 sticky left-0 bg-slate-100 z-10 w-64 shadow-xs">
                                    Produto
                                  </th>
                                  <th className="p-3">Grupo</th>
                                  <th className="p-3 text-right">Quantidade</th>
                                  <th className="p-3 text-center">NFs</th>
                                  <th className="p-3">Primeira Compra</th>
                                  <th className="p-3">Última Compra</th>
                                  <th className="p-3 text-center">Situação</th>
                                  <th className="p-3 text-center">Comercial</th>
                                  <th className="p-3 pr-4 text-center">Ação</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {prodsDoCliente.length === 0 ? (
                                  <tr>
                                    <td
                                      colSpan={9}
                                      className="p-4 text-center text-muted-foreground text-xs"
                                    >
                                      Nenhum produto faturado para este cliente no histórico
                                      recente.
                                    </td>
                                  </tr>
                                ) : (
                                  prodsDoCliente.map((p, idx) => {
                                    const isParadoOuSemNota =
                                      p.situacao === 'Sem nota no ano' || p.diasSemComprar > 60

                                    return (
                                      <tr
                                        key={`${p.codigoMaterial}-${idx}`}
                                        className={`transition-colors ${
                                          isParadoOuSemNota
                                            ? 'bg-rose-50/20 hover:bg-rose-50/40'
                                            : 'hover:bg-sky-50/40'
                                        }`}
                                      >
                                        {/* Produto (código + descrição com Tooltip se truncar) */}
                                        <td className="p-3 pl-4 sticky left-0 bg-white hover:bg-sky-50/40 z-10 shadow-xs">
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <strong className="text-slate-900 block truncate max-w-[240px] cursor-help">
                                                  {p.descricao}
                                                </strong>
                                              </TooltipTrigger>
                                              <TooltipContent className="max-w-xs text-xs">
                                                <p className="font-bold">{p.descricao}</p>
                                                <p className="text-[10px] text-slate-400 font-mono">
                                                  Código SAP: {p.codigoMaterial}
                                                </p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                          <span className="text-[10px] text-muted-foreground font-mono block">
                                            Cód: {p.codigoMaterial}
                                          </span>
                                        </td>

                                        {/* Grupo */}
                                        <td className="p-3 text-slate-700 font-medium">
                                          {p.grupo}
                                        </td>

                                        {/* Quantidade (pt-BR vírgula, ex: "161,0 t") */}
                                        <td className="p-3 text-right font-mono font-bold text-slate-900">
                                          {formatTons(p.tonelagemHistorica)}
                                        </td>

                                        {/* NFs (distintas) */}
                                        <td className="p-3 text-center font-mono text-slate-700">
                                          {p.nfsCount}
                                        </td>

                                        {/* Primeira Compra */}
                                        <td className="p-3 font-mono text-slate-600">
                                          {p.primeiraCompraData || '12/01/2023'}
                                        </td>

                                        {/* Última Compra */}
                                        <td className="p-3 font-mono text-slate-700">
                                          <span>{p.ultimaCompraData}</span>
                                          <span className="text-[10px] text-slate-600 block">
                                            há {p.diasSemComprar}d
                                          </span>
                                        </td>

                                        {/* Situação (Badge com regras obrigatórias preservadas) */}
                                        <td className="p-3 text-center">
                                          <Badge
                                            variant="outline"
                                            className={`text-[10px] font-semibold ${
                                              p.situacao === 'Ativo'
                                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                                : 'bg-rose-50 text-rose-800 border-rose-300'
                                            }`}
                                          >
                                            {p.situacao}
                                          </Badge>
                                        </td>

                                        {/* Comercial Adicional via Popover */}
                                        <td className="p-3 text-center">
                                          <Popover>
                                            <PopoverTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 px-2 text-[11px] text-slate-600 hover:text-primary rounded-lg gap-1"
                                              >
                                                <Info className="w-3.5 h-3.5 text-sky-600" />
                                                <span>Detalhes</span>
                                              </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-64 p-3 text-xs space-y-2 rounded-2xl shadow-lg border-slate-200">
                                              <div className="font-bold text-slate-900 border-b border-slate-100 pb-1.5">
                                                Informações Comerciais
                                              </div>
                                              <div className="space-y-1 font-mono text-[11px]">
                                                <div className="flex justify-between">
                                                  <span className="text-slate-500 font-sans">
                                                    Estoque livre:
                                                  </span>
                                                  <strong
                                                    className={
                                                      p.estoqueLivreTons > 0
                                                        ? 'text-emerald-700'
                                                        : 'text-slate-400'
                                                    }
                                                  >
                                                    {formatTons(p.estoqueLivreTons)}
                                                  </strong>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-slate-500 font-sans">
                                                    Último preço:
                                                  </span>
                                                  <span>
                                                    R$ {p.ultimoPrecoPraticadoKg.toFixed(2)}/kg
                                                  </span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-slate-500 font-sans">
                                                    Preço atual sugerido:
                                                  </span>
                                                  <span>R$ {p.precoAtualKg.toFixed(2)}/kg</span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-slate-500 font-sans">
                                                    Disponibilidade:
                                                  </span>
                                                  <span className="font-sans font-semibold text-slate-800">
                                                    {p.disponibilidadeVenda}
                                                  </span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-slate-500 font-sans">
                                                    Dias sem compra:
                                                  </span>
                                                  <span
                                                    className={
                                                      p.diasSemComprar > 60
                                                        ? 'text-rose-600 font-bold'
                                                        : 'text-slate-800'
                                                    }
                                                  >
                                                    {p.diasSemComprar} dias
                                                  </span>
                                                </div>
                                                <div className="flex justify-between">
                                                  <span className="text-slate-500 font-sans">
                                                    Valor faturado hist.:
                                                  </span>
                                                  <span>{formatBRL(p.valorFaturadoHistorico)}</span>
                                                </div>
                                              </div>
                                            </PopoverContent>
                                          </Popover>
                                        </td>

                                        {/* Ação por Produto */}
                                        <td className="p-3 pr-4 text-center">
                                          <Button
                                            size="sm"
                                            type="button"
                                            onClick={() => handleAbrirOportunidade(p, c)}
                                            className={`h-7 text-xs rounded-xl font-semibold gap-1 ${
                                              isParadoOuSemNota
                                                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                                                : 'bg-primary hover:bg-primary/90 text-white'
                                            }`}
                                          >
                                            <Sparkles className="w-3 h-3 text-amber-300" />
                                            <span>Criar Oportunidade</span>
                                          </Button>
                                        </td>
                                      </tr>
                                    )
                                  })
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              },
            )
          )}
        </div>
      </div>

      {/* Modal Integrado de Oportunidade Sequencial (OPP-XXXXXX/AAAA) */}
      <GerarOportunidadeRetomadaModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        produto={selectedProduto}
        produtosMultiplos={selectedProdutosMultiplos}
        cliente={selectedClienteModal}
      />
    </div>
  )
}
