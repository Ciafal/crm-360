// src/components/recorrencia/AbaProdutosRetomada.tsx
import React, { useState, useMemo } from 'react'
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
import { GerarOportunidadeRetomadaModal } from './GerarOportunidadeRetomadaModal'
import { recorrenciaService } from '@/services/recorrencia_service'
import type { ProdutoRetomadaItem, ClienteRecorrenciaView, UnitMode } from '@/types/recorrencia'

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

  // Modal de geração de oportunidade
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedProduto, setSelectedProduto] = useState<ProdutoRetomadaItem | null>(null)

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

  const handleAbrirOportunidade = (produto: ProdutoRetomadaItem) => {
    setSelectedProduto(produto)
    setModalOpen(true)
  }

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

      {/* Modal Integrado de Oportunidade Sequencial (OPP-XXXXXX/AAAA) */}
      <GerarOportunidadeRetomadaModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        produto={selectedProduto}
      />
    </div>
  )
}
