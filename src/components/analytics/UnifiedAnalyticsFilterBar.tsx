import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
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
import {
  Filter,
  RotateCcw,
  Bookmark,
  Check,
  Search,
  SlidersHorizontal,
  ChevronDown,
  Sparkles,
  Save,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export interface UnifiedCommercialFiltersState {
  periodo: string // 'MES' | 'TRIMESTRE' | 'YTD' | '12_MESES' | 'PERSONALIZADO'
  dataInicio?: string
  dataFim?: string
  vendedorId: string
  representanteId: string
  supervisorId: string
  gerenteId: string
  equipeId: string
  clienteId: string
  grupoEconomicoId: string
  produtoId: string
  familiaProduto: string
  linhaProduto: string
  regiao: string
  uf: string
  cidade: string
  segmento: string
  subsegmento: string
  carteiraTipo: string
  canalVenda: string
  situacaoCotacao: string
  situacaoOportunidade: string
  statusCliente: string // 'todos' | 'ativo' | 'inativo' | 'novo' | 'reativado'
  termoBusca: string
}

export const INITIAL_COMMERCIAL_FILTERS: UnifiedCommercialFiltersState = {
  periodo: 'YTD',
  dataInicio: '',
  dataFim: '',
  vendedorId: 'todos',
  representanteId: 'todos',
  supervisorId: 'todos',
  gerenteId: 'todos',
  equipeId: 'todos',
  clienteId: 'todos',
  grupoEconomicoId: 'todos',
  produtoId: 'todos',
  familiaProduto: 'todos',
  linhaProduto: 'todos',
  regiao: 'todos',
  uf: 'todos',
  cidade: 'todos',
  segmento: 'todos',
  subsegmento: 'todos',
  carteiraTipo: 'todos',
  canalVenda: 'todos',
  situacaoCotacao: 'todos',
  situacaoOportunidade: 'todos',
  statusCliente: 'todos',
  termoBusca: '',
}

export interface UnifiedAnalyticsFilterBarProps {
  filters: UnifiedCommercialFiltersState
  onChange: (newFilters: UnifiedCommercialFiltersState) => void
  onReset?: () => void
  isSellerMode?: boolean
  className?: string
}

export function UnifiedAnalyticsFilterBar({
  filters,
  onChange,
  onReset,
  isSellerMode = false,
  className,
}: UnifiedAnalyticsFilterBarProps) {
  const [expanded, setExpanded] = useState(false)
  const [savedViews, setSavedViews] = useState<
    Array<{ name: string; filters: UnifiedCommercialFiltersState }>
  >([
    { name: 'Visão YTD Geral', filters: { ...INITIAL_COMMERCIAL_FILTERS, periodo: 'YTD' } },
    {
      name: 'Clientes A - MG',
      filters: { ...INITIAL_COMMERCIAL_FILTERS, uf: 'MG', statusCliente: 'ativo' },
    },
    {
      name: 'Perfis & Chapas',
      filters: { ...INITIAL_COMMERCIAL_FILTERS, familiaProduto: 'PERFIS' },
    },
  ])

  const handleFieldChange = (field: keyof UnifiedCommercialFiltersState, value: string) => {
    onChange({
      ...filters,
      [field]: value,
    })
  }

  const handleReset = () => {
    if (onReset) {
      onReset()
    } else {
      onChange(INITIAL_COMMERCIAL_FILTERS)
    }
    toast.info('Filtros restaurados para a visão padrão.')
  }

  const handleSaveCurrentView = () => {
    const viewName = prompt('Digite um nome para esta visão analítica:')
    if (viewName && viewName.trim()) {
      setSavedViews([...savedViews, { name: viewName.trim(), filters: { ...filters } }])
      toast.success(`Visão "${viewName.trim()}" salva com sucesso!`)
    }
  }

  const handleApplySavedView = (view: { name: string; filters: UnifiedCommercialFiltersState }) => {
    onChange({ ...view.filters })
    toast.success(`Visão "${view.name}" aplicada!`)
  }

  // Contagem de filtros ativos
  const activeFilterCount = React.useMemo(() => {
    let count = 0
    if (filters.periodo !== 'YTD') count++
    if (filters.vendedorId !== 'todos') count++
    if (filters.familiaProduto !== 'todos') count++
    if (filters.uf !== 'todos') count++
    if (filters.segmento !== 'todos') count++
    if (filters.statusCliente !== 'todos') count++
    if (filters.canalVenda !== 'todos') count++
    if (filters.situacaoCotacao !== 'todos') count++
    if (filters.termoBusca) count++
    return count
  }, [filters])

  return (
    <Card
      className={cn(
        'p-4 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3.5',
        className,
      )}
    >
      {/* CABEÇALHO DA BARRA ÚNICA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-slate-900">
                Barra Global de Filtros & Segmentação
              </h4>
              {activeFilterCount > 0 && (
                <Badge className="bg-primary text-white text-[10px] font-mono px-1.5 py-0 h-4">
                  {activeFilterCount} ativos
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Todos os gráficos, indicadores e diagnósticos reagem aos mesmos filtros unificados
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Menu de Visões Salvas */}
          <Select
            onValueChange={(val) => {
              const target = savedViews.find((v) => v.name === val)
              if (target) handleApplySavedView(target)
            }}
          >
            <SelectTrigger className="h-7 text-xs w-36 rounded-lg bg-slate-50 border-slate-200">
              <SelectValue placeholder="Visões Salvas" />
            </SelectTrigger>
            <SelectContent>
              {savedViews.map((sv, idx) => (
                <SelectItem key={idx} value={sv.name} className="text-xs">
                  {sv.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveCurrentView}
            className="h-7 text-xs gap-1 rounded-lg border-slate-300 text-slate-700 hover:text-primary"
            title="Salvar visão atual"
          >
            <Save className="w-3 h-3" />
            <span className="hidden sm:inline">Salvar Visão</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-7 text-xs text-muted-foreground hover:text-slate-900 gap-1 px-2"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Limpar</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-7 text-xs gap-1 rounded-lg border-slate-300 text-slate-700 font-semibold"
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>{expanded ? 'Menos Filtros' : 'Filtros Avançados'}</span>
          </Button>
        </div>
      </div>

      {/* LINHA 1 DE FILTROS PRINCIPAIS: PERÍODO, VENDEDOR, FAMÍLIA, STATUS CLIENTE, UF E BUSCA */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* Período */}
        <div>
          <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
            Período
          </label>
          <Select
            value={filters.periodo}
            onValueChange={(val) => handleFieldChange('periodo', val)}
          >
            <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200 rounded-lg font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MES">Mês Atual (Outubro)</SelectItem>
              <SelectItem value="TRIMESTRE">Trimestre (Q4)</SelectItem>
              <SelectItem value="YTD">YTD (Ano Acumulado)</SelectItem>
              <SelectItem value="12_MESES">Últimos 12 Meses</SelectItem>
              <SelectItem value="PERSONALIZADO">Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Vendedor / Representante */}
        <div>
          <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
            Vendedor / Repr.
          </label>
          <Select
            value={filters.vendedorId}
            onValueChange={(val) => handleFieldChange('vendedorId', val)}
            disabled={isSellerMode}
          >
            <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200 rounded-lg">
              <SelectValue placeholder="Todos vendedores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Toda a Equipe</SelectItem>
              <SelectItem value="eq-vend1">Carlos Mendonça (Vend)</SelectItem>
              <SelectItem value="eq-vend2">Mariana Siqueira (Vend)</SelectItem>
              <SelectItem value="eq-vend3">João Pedro Rocha (Vend)</SelectItem>
              <SelectItem value="eq-rep">Roberto Faria (Repr Externo)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Família de Produto */}
        <div>
          <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
            Família de Produto
          </label>
          <Select
            value={filters.familiaProduto}
            onValueChange={(val) => handleFieldChange('familiaProduto', val)}
          >
            <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200 rounded-lg">
              <SelectValue placeholder="Todas famílias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas Famílias</SelectItem>
              <SelectItem value="PERFIS">Perfis Laminados (W, I, U)</SelectItem>
              <SelectItem value="BARRAS">Barras Chatas & Quadradas</SelectItem>
              <SelectItem value="CANTONEIRAS">Cantoneiras Laminadas</SelectItem>
              <SelectItem value="CHAPAS">Chapas Grossas & Finas A36</SelectItem>
              <SelectItem value="TUBOS">Tubos Industriais & Redondos</SelectItem>
              <SelectItem value="TELAS">Telas Soldadas & CA-50</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status do Cliente */}
        <div>
          <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
            Status do Cliente
          </label>
          <Select
            value={filters.statusCliente}
            onValueChange={(val) => handleFieldChange('statusCliente', val)}
          >
            <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200 rounded-lg">
              <SelectValue placeholder="Todos status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Clientes</SelectItem>
              <SelectItem value="ativo">Clientes Ativos</SelectItem>
              <SelectItem value="inativo">Clientes Inativos</SelectItem>
              <SelectItem value="novo">Novos Clientes</SelectItem>
              <SelectItem value="reativado">Reativados no Ciclo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* UF / Região */}
        <div>
          <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
            UF / Região
          </label>
          <Select value={filters.uf} onValueChange={(val) => handleFieldChange('uf', val)}>
            <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200 rounded-lg">
              <SelectValue placeholder="Todas UFs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas as UFs</SelectItem>
              <SelectItem value="MG">Minas Gerais (MG)</SelectItem>
              <SelectItem value="SP">São Paulo (SP)</SelectItem>
              <SelectItem value="RJ">Rio de Janeiro (RJ)</SelectItem>
              <SelectItem value="ES">Espírito Santo (ES)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Busca Rápida */}
        <div>
          <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
            Busca Rápida
          </label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Cliente, produto, CNPJ..."
              value={filters.termoBusca}
              onChange={(e) => handleFieldChange('termoBusca', e.target.value)}
              className="pl-8 h-8 text-xs bg-slate-50 border-slate-200 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* LINHA 2 DE FILTROS AVANÇADOS (QUANDO EXPANDIDO) */}
      {expanded && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100 animate-fade-in">
          {/* Segmento */}
          <div>
            <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
              Segmento Industrial
            </label>
            <Select
              value={filters.segmento}
              onValueChange={(val) => handleFieldChange('segmento', val)}
            >
              <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200 rounded-lg">
                <SelectValue placeholder="Todos segmentos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Segmentos</SelectItem>
                <SelectItem value="CALDEIRARIA">Caldeiraria Pesada & Estruturas</SelectItem>
                <SelectItem value="CONSTRUCAO">Construção Civil & Montagens</SelectItem>
                <SelectItem value="REVENDA">Revenda & Distribuição de Aço</SelectItem>
                <SelectItem value="AGRO">Agronegócio & Silos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Canal de Venda */}
          <div>
            <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
              Canal Comercial
            </label>
            <Select
              value={filters.canalVenda}
              onValueChange={(val) => handleFieldChange('canalVenda', val)}
            >
              <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200 rounded-lg">
                <SelectValue placeholder="Todos canais" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Canais</SelectItem>
                <SelectItem value="DIRETO">Vendas Diretas Internas</SelectItem>
                <SelectItem value="REPRESENTACAO">Representação Externa</SelectItem>
                <SelectItem value="WHATSAPP">Canal WhatsApp / Chat</SelectItem>
                <SelectItem value="PORTAL">Portal B2B</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Situação da Cotação */}
          <div>
            <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
              Status da Cotação
            </label>
            <Select
              value={filters.situacaoCotacao}
              onValueChange={(val) => handleFieldChange('situacaoCotacao', val)}
            >
              <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200 rounded-lg">
                <SelectValue placeholder="Todos status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as Cotações</SelectItem>
                <SelectItem value="ABERTA">Aberta / Em Análise</SelectItem>
                <SelectItem value="ENVIADA">Enviada ao Cliente</SelectItem>
                <SelectItem value="PARADA">Parada / Sem Follow-up</SelectItem>
                <SelectItem value="ACEITA">Aceita / Convertida</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de Carteira */}
          <div>
            <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
              Carteira
            </label>
            <Select
              value={filters.carteiraTipo}
              onValueChange={(val) => handleFieldChange('carteiraTipo', val)}
            >
              <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200 rounded-lg">
                <SelectValue placeholder="Todas carteiras" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as Carteiras</SelectItem>
                <SelectItem value="PRINCIPAL">Carteira Primária</SelectItem>
                <SelectItem value="ESPECIAL">Contas Corporativas</SelectItem>
                <SelectItem value="REGIONAL">Carteira Regional MG</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Grupo Econômico */}
          <div>
            <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
              Grupo Econômico
            </label>
            <Select
              value={filters.grupoEconomicoId}
              onValueChange={(val) => handleFieldChange('grupoEconomicoId', val)}
            >
              <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200 rounded-lg">
                <SelectValue placeholder="Todos grupos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Grupos</SelectItem>
                <SelectItem value="GRP-VALE">Grupo Vale do Aço</SelectItem>
                <SelectItem value="GRP-MINAS">Minas Estruturas Holding</SelectItem>
                <SelectItem value="GRP-CENTRO">Metalmecânica Centro-Oeste</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </Card>
  )
}
