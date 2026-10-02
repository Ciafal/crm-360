// src/components/gestao-clientes/ClientManagementTable.tsx
import React, { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
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
import { Search, FileSpreadsheet, ShieldCheck, AlertTriangle, ChevronRight } from 'lucide-react'
import type { CustomerRecord } from '@/types/customer_management'
import { exportToCsv } from '@/lib/utils'
import { toast } from 'sonner'
import { StatusBadge, SemanticVariant } from './shared/GestaoClientesUiKit'

interface ClientManagementTableProps {
  clientes: CustomerRecord[]
  onSelectClient: (cliente: CustomerRecord) => void
  initialFilter?: string
}

export function ClientManagementTable({
  clientes,
  onSelectClient,
  initialFilter = 'todos',
}: ClientManagementTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [classFilter, setClassFilter] = useState('todos')
  const [coverageFilter, setCoverageFilter] = useState(initialFilter)
  const [sortBy, setSortBy] = useState<'cobertura' | 'faturamento' | 'isc' | 'diasContato'>(
    'cobertura',
  )

  const filteredData = useMemo(() => {
    return clientes
      .filter((c) => {
        // Filtro de Cobertura
        if (coverageFilter === 'descobertos' && c.coberto) return false
        if (coverageFilter === 'cobertos' && !c.coberto) return false
        if (coverageFilter === 'vencidos' && c.coberturaVencidaDias <= 0) return false
        if (coverageFilter === 'estrategicos' && c.classificacao !== 'ESTRATEGICO') return false
        if (coverageFilter === 'clientes_a' && c.classificacao !== 'CLIENTE_A') return false
        if (coverageFilter === 'em_risco' && c.classificacao !== 'EM_RISCO') return false
        if (coverageFilter === 'prospects' && c.classificacao !== 'PROSPECT') return false

        // Filtro de Status
        if (statusFilter !== 'todos' && !c.status.includes(statusFilter as any)) return false

        // Filtro de Classificação
        if (classFilter !== 'todos' && c.classificacao !== classFilter) return false

        // Busca textual
        if (searchTerm) {
          const term = searchTerm.toLowerCase()
          const matchCodigo = c.codigo.toLowerCase().includes(term)
          const matchRazao = c.razaoSocial.toLowerCase().includes(term)
          const matchFantasia = c.nomeFantasia.toLowerCase().includes(term)
          const matchCidade = c.cidade.toLowerCase().includes(term)
          const matchVendedor = c.vendedorNome.toLowerCase().includes(term)
          if (!matchCodigo && !matchRazao && !matchFantasia && !matchCidade && !matchVendedor) {
            return false
          }
        }

        return true
      })
      .sort((a, b) => {
        if (sortBy === 'cobertura') return b.coberturaVencidaDias - a.coberturaVencidaDias
        if (sortBy === 'faturamento') return b.faturamento12m - a.faturamento12m
        if (sortBy === 'isc') return a.isc - b.isc
        if (sortBy === 'diasContato') return b.diasSemContato - a.diasSemContato
        return 0
      })
  }, [clientes, statusFilter, classFilter, coverageFilter, searchTerm, sortBy])

  const handleExport = () => {
    const exportItems = filteredData.map((c) => ({
      Codigo_SAP: c.codigo,
      Razao_Social: c.razaoSocial,
      Nome_Fantasia: c.nomeFantasia,
      Cidade: c.cidade,
      UF: c.uf,
      Segmento: c.segmento,
      Vendedor: c.vendedorNome,
      Classificacao: c.classificacao,
      Status: c.status.join(' | '),
      Ultima_Compra_Data: c.ultimaCompraData || 'Sem compra',
      Dias_Sem_Compra: c.diasSemCompra,
      Ultimo_Pedido_Data: c.ultimoPedidoData || 'Sem pedido',
      Dias_Sem_Pedido: c.diasSemPedido,
      Ultimo_Faturamento_Data: c.ultimoFaturamentoData || 'Sem faturamento',
      Ultimo_Contato_Data: c.ultimoContatoData,
      Dias_Sem_Contato: c.diasSemContato,
      Canal_Ultimo_Contato: c.ultimoContatoCanal,
      Cobertura_Carteira: c.coberto ? 'COBERTO' : `VENCIDA HÁ ${c.coberturaVencidaDias} DIAS`,
      ISC_Satisfacao: c.isc,
      OTIF: `${c.otif}%`,
      Oportunidade_Aberta: c.oportunidadeAberta ? 'SIM' : 'NÃO',
      Proxima_Acao: c.proximaAcao,
    }))

    exportToCsv(`Clientes_CIAFAL_${new Date().toISOString().slice(0, 10)}`, exportItems)
    toast.success('Lista de clientes exportada com sucesso!')
  }

  return (
    <Card className="p-4 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-2xs text-slate-900">
      {/* 1. BARRA DE FILTROS E BUSCA (Design Limpo e Responsivo) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <Input
            placeholder="Buscar por código, cliente, fantasia, cidade ou vendedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 bg-white border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 rounded-xl focus-visible:ring-[#003A70]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Filtro Status */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-36 text-xs bg-white border-slate-200 text-slate-700 rounded-xl">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200 text-slate-900 text-xs">
              <SelectItem value="todos">Status (Todos)</SelectItem>
              <SelectItem value="Ativo">Ativos</SelectItem>
              <SelectItem value="Pedido em Carteira">Pedido em Carteira</SelectItem>
              <SelectItem value="Cotação Aberta">Cotação Aberta</SelectItem>
              <SelectItem value="Faturado">Faturado</SelectItem>
              <SelectItem value="Sem Compra">Sem Compra</SelectItem>
              <SelectItem value="Sem Contato">Sem Contato</SelectItem>
              <SelectItem value="Inativo">Inativos</SelectItem>
              <SelectItem value="Prospect">Prospects</SelectItem>
              <SelectItem value="Em Recuperação">Em Recuperação</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtro Classificação */}
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className="h-9 w-36 text-xs bg-white border-slate-200 text-slate-700 rounded-xl">
              <SelectValue placeholder="Classificação" />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200 text-slate-900 text-xs">
              <SelectItem value="todos">Classificação (Todas)</SelectItem>
              <SelectItem value="ESTRATEGICO">Estratégicos</SelectItem>
              <SelectItem value="CLIENTE_A">Clientes A</SelectItem>
              <SelectItem value="CLIENTE_B">Clientes B</SelectItem>
              <SelectItem value="CLIENTE_C">Clientes C</SelectItem>
              <SelectItem value="PROSPECT">Prospects</SelectItem>
              <SelectItem value="EM_RISCO">Em Risco</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtro Cobertura */}
          <Select value={coverageFilter} onValueChange={setCoverageFilter}>
            <SelectTrigger className="h-9 w-36 text-xs bg-white border-slate-200 text-slate-700 rounded-xl">
              <SelectValue placeholder="Cobertura" />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200 text-slate-900 text-xs">
              <SelectItem value="todos">Cobertura (Todas)</SelectItem>
              <SelectItem value="cobertos">Cobertos</SelectItem>
              <SelectItem value="descobertos">Sem Cobertura</SelectItem>
              <SelectItem value="vencidos">Cobertura Vencida</SelectItem>
            </SelectContent>
          </Select>

          {/* Ordenação */}
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
            <SelectTrigger className="h-9 w-36 text-xs bg-white border-slate-200 text-slate-700 rounded-xl">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200 text-slate-900 text-xs">
              <SelectItem value="cobertura">Mais Vencidos</SelectItem>
              <SelectItem value="faturamento">Maior Faturamento</SelectItem>
              <SelectItem value="isc">Menor ISC (Risco)</SelectItem>
              <SelectItem value="diasContato">Mais Dias Sem Contato</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="h-9 text-xs bg-white border-slate-200 text-slate-700 hover:text-[#003A70] hover:bg-slate-50 rounded-xl gap-1.5 font-medium"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Exportar</span>
          </Button>
        </div>
      </div>

      {/* 2. TABELA COMPLETA EXECUTIVA (Diretriz 9: Nítida, Alto Contraste, Sem Cores Circenses) */}
      <div className="overflow-x-auto border border-slate-200 rounded-2xl">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-slate-600 font-mono text-[10px] uppercase border-b border-slate-200">
            <tr>
              <th className="p-3">Código</th>
              <th className="p-3">Cliente / Fantasia</th>
              <th className="p-3">Cidade / UF</th>
              <th className="p-3">Vendedor</th>
              <th className="p-3 text-center">Classificação</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-center">Último Contato</th>
              <th className="p-3 text-center">Cobertura</th>
              <th className="p-3 text-center">Última Compra</th>
              <th className="p-3 text-center">ISC</th>
              <th className="p-3 text-center">OTIF</th>
              <th className="p-3">Próxima Ação</th>
              <th className="p-3 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredData.map((cliente) => {
              const classVariant: SemanticVariant =
                cliente.classificacao === 'ESTRATEGICO'
                  ? 'default' // azul CIAFAL (Diretriz 3: sem roxo decorativo)
                  : cliente.classificacao === 'CLIENTE_A'
                    ? 'positive'
                    : cliente.classificacao === 'EM_RISCO'
                      ? 'warning' // âmbar corporativo
                      : 'neutral'

              return (
                <tr
                  key={cliente.id}
                  className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                  onClick={() => onSelectClient(cliente)}
                >
                  <td className="p-3 font-mono font-bold text-[#003A70]">{cliente.codigo}</td>

                  <td className="p-3">
                    <div className="font-bold text-slate-900 leading-tight">
                      {cliente.nomeFantasia}
                    </div>
                    <span className="text-[10px] text-slate-500 block truncate max-w-[180px]">
                      {cliente.razaoSocial}
                    </span>
                  </td>

                  <td className="p-3">
                    <span className="text-slate-800">{cliente.cidade}</span>
                    <span className="text-slate-500 block text-[10px]">
                      {cliente.uf} ({cliente.regiao})
                    </span>
                  </td>

                  <td className="p-3 font-medium text-slate-800">{cliente.vendedorNome}</td>

                  <td className="p-3 text-center">
                    <StatusBadge
                      label={cliente.classificacao.replace('_', ' ')}
                      variant={classVariant}
                    />
                  </td>

                  <td className="p-3 text-center">
                    <div className="flex flex-wrap gap-1 justify-center max-w-[120px]">
                      {cliente.status.slice(0, 2).map((st, i) => (
                        <span
                          key={i}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200/60 whitespace-nowrap"
                        >
                          {st}
                        </span>
                      ))}
                      {cliente.status.length > 2 && (
                        <span className="text-[9px] text-slate-500">
                          +{cliente.status.length - 2}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="p-3 text-center">
                    <span className="font-mono text-slate-800 block text-[11px] font-medium">
                      {cliente.ultimoContatoData || 'Sem registro'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {cliente.diasSemContato}d atrás · {cliente.ultimoContatoCanal}
                    </span>
                  </td>

                  {/* Cobertura (Diretriz 2: Sem Cobertura em vermelho discreto, não estridente) */}
                  <td className="p-3 text-center">
                    {cliente.coberto ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <ShieldCheck className="w-3 h-3 text-emerald-700" /> Coberto
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-800 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                        <AlertTriangle className="w-3 h-3 text-red-700" /> Vencida{' '}
                        {cliente.coberturaVencidaDias}d
                      </span>
                    )}
                  </td>

                  <td className="p-3 text-center">
                    <span className="font-mono text-slate-800 block text-[11px]">
                      {cliente.ultimaCompraData || 'Sem compra'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {cliente.diasSemCompra < 999 ? `${cliente.diasSemCompra}d atrás` : '-'}
                    </span>
                  </td>

                  <td className="p-3 text-center">
                    <strong
                      className={`font-mono text-[11px] ${
                        cliente.isc >= 75 ? 'text-[#003A70]' : 'text-amber-800'
                      }`}
                    >
                      {cliente.isc}
                    </strong>
                  </td>

                  <td className="p-3 text-center">
                    <strong
                      className={`font-mono text-[11px] ${
                        cliente.otif >= 90 ? 'text-emerald-800' : 'text-amber-800'
                      }`}
                    >
                      {cliente.otif}%
                    </strong>
                  </td>

                  <td className="p-3 max-w-[200px]">
                    <p className="text-[11px] text-slate-600 truncate" title={cliente.proximaAcao}>
                      {cliente.proximaAcao}
                    </p>
                  </td>

                  <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onSelectClient(cliente)}
                      className="h-7 text-xs text-[#003A70] hover:bg-[#EBF3FA] p-1 rounded-lg"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              )
            })}

            {filteredData.length === 0 && (
              <tr>
                <td colSpan={13} className="p-8 text-center text-xs text-slate-500">
                  Nenhum cliente encontrado para os filtros selecionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
