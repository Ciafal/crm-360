import React, { useState } from 'react'
import {
  Filter,
  RotateCcw,
  Bookmark,
  BookmarkCheck,
  Search,
  ChevronDown,
  X,
  SlidersHorizontal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { stockService } from '@/services/stock_service'
import type { StockFilterState } from '@/types/stock'
import { useToast } from '@/hooks/use-toast'

interface StockFilterBarProps {
  filters: StockFilterState
  onFiltersChange: (newFilters: StockFilterState) => void
  onResetFilters: () => void
  userRole?: string
}

export function StockFilterBar({
  filters,
  onFiltersChange,
  onResetFilters,
  userRole,
}: StockFilterBarProps) {
  const { toast } = useToast()
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [savedViews, setSavedViews] = useState(() => stockService.getSavedViews())

  const isManager =
    userRole === 'administrador' ||
    userRole === 'admin' ||
    userRole === 'supervisor' ||
    userRole === 'diretor_comercial'

  const handleFieldChange = (field: keyof StockFilterState, value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value,
    })
  }

  const handleSaveCurrentView = () => {
    const name = window.prompt('Digite um nome para salvar esta visão de filtros:')
    if (!name || !name.trim()) return

    const newView = stockService.saveView(name.trim(), filters)
    setSavedViews(stockService.getSavedViews())
    toast({
      title: 'Visão salva com sucesso!',
      description: `A visão "${newView.name}" foi adicionada aos seus atalhos.`,
    })
  }

  const handleApplySavedView = (view: { name: string; filters: StockFilterState }) => {
    onFiltersChange({ ...view.filters })
    toast({
      title: `Visão aplicada: ${view.name}`,
      description: 'Os filtros foram atualizados conforme a configuração salva.',
    })
  }

  // Contagem de filtros ativos (diferentes do padrão)
  const activeFiltersCount = Object.entries(filters).filter(
    ([k, v]) => v && v !== 'todos' && v !== '' && k !== 'period',
  ).length

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-3xl p-4 border border-border/60 shadow-xs space-y-3">
      {/* LINHA 1: BARRA PRINCIPAL DE BUSCA E CONTROLES GERAIS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          {/* Busca Rápida */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.searchTerm}
              onChange={(e) => handleFieldChange('searchTerm', e.target.value)}
              placeholder="Buscar por código de material, bitola, qualidade, lote..."
              className="h-9 pl-9 text-xs rounded-2xl bg-slate-50/70 border-slate-200"
            />
            {filters.searchTerm && (
              <button
                onClick={() => handleFieldChange('searchTerm', '')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-slate-900"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Seletor de Centro SAP */}
          <Select
            value={filters.plantCode}
            onValueChange={(v) => handleFieldChange('plantCode', v)}
          >
            <SelectTrigger className="h-9 text-xs rounded-2xl bg-slate-50/70 border-slate-200 w-44">
              <SelectValue placeholder="Centro SAP" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Centros</SelectItem>
              <SelectItem value="1000">1000 - Contagem Matriz</SelectItem>
              <SelectItem value="2000">2000 - Betim Industrial</SelectItem>
              <SelectItem value="3000">3000 - Filial SP</SelectItem>
            </SelectContent>
          </Select>

          {/* Seletor de Família */}
          <Select value={filters.family} onValueChange={(v) => handleFieldChange('family', v)}>
            <SelectTrigger className="h-9 text-xs rounded-2xl bg-slate-50/70 border-slate-200 w-44">
              <SelectValue placeholder="Família" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas Famílias</SelectItem>
              <SelectItem value="Perfis Estruturais">Perfis Estruturais</SelectItem>
              <SelectItem value="Tubos Industriais">Tubos Industriais</SelectItem>
              <SelectItem value="Chapas Grossas">Chapas Grossas</SelectItem>
              <SelectItem value="Aços Revestidos">Aços Revestidos (Galvalume)</SelectItem>
              <SelectItem value="Aços Especiais & Inox">Aços Especiais & Inox</SelectItem>
              <SelectItem value="Construção Civil / Vergalhões">Vergalhões CA-50</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* LADO DIREITO: AÇÕES DE VISÕES & LIMPEZA */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="h-9 text-xs rounded-2xl gap-1.5 border-slate-200"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
            <span>Filtros Avançados</span>
            {activeFiltersCount > 0 && (
              <Badge className="h-4 px-1.5 text-[9px] bg-primary text-white ml-0.5">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>

          {/* Menu de Visões Salvas */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-xs rounded-2xl gap-1.5 border-slate-200"
              >
                <Bookmark className="w-3.5 h-3.5 text-amber-600" />
                <span>Visões Salvas</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2 bg-white">
              <DropdownMenuLabel className="text-xs font-bold text-primary">
                Minhas Visões
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {savedViews.map((view) => (
                <DropdownMenuItem
                  key={view.id}
                  onClick={() => handleApplySavedView(view)}
                  className="text-xs cursor-pointer rounded-xl flex items-center justify-between"
                >
                  <span className="truncate">{view.name}</span>
                  <BookmarkCheck className="w-3.5 h-3.5 text-emerald-600 opacity-60" />
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSaveCurrentView}
                className="text-xs cursor-pointer rounded-xl font-bold text-primary"
              >
                + Salvar Filtros Atuais
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Botão Limpar Filtros */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="h-9 text-xs rounded-2xl text-muted-foreground hover:text-slate-900 gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Limpar</span>
          </Button>
        </div>
      </div>

      {/* LINHA 2: FILTROS AVANÇADOS EXPANSÍVEIS */}
      {showAdvanced && (
        <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 animate-fade-in">
          {/* Depósito */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">
              Depósito
            </label>
            <Select
              value={filters.storageLocation}
              onValueChange={(v) => handleFieldChange('storageLocation', v)}
            >
              <SelectTrigger className="h-8 text-xs rounded-xl bg-slate-50 border-slate-200">
                <SelectValue placeholder="Depósito" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Depósitos</SelectItem>
                <SelectItem value="DEP-01">DEP-01 (Pátio Central)</SelectItem>
                <SelectItem value="DEP-02">DEP-02 (Chapas & Bobinas)</SelectItem>
                <SelectItem value="DEP-03">DEP-03 (Tubos / Inox)</SelectItem>
                <SelectItem value="DEP-04">DEP-04 (Armazém Bobinas)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Faixa de Idade (Aging) */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">
              Idade (Aging)
            </label>
            <Select
              value={filters.ageBracket}
              onValueChange={(v) => handleFieldChange('ageBracket', v)}
            >
              <SelectTrigger className="h-8 text-xs rounded-xl bg-slate-50 border-slate-200">
                <SelectValue placeholder="Faixa de Idade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as Faixas</SelectItem>
                <SelectItem value="0-30">0 a 30 dias (Giro Rápido)</SelectItem>
                <SelectItem value="31-60">31 a 60 dias (Normal)</SelectItem>
                <SelectItem value="61-90">61 a 90 dias (Atenção)</SelectItem>
                <SelectItem value="91-120">91 a 120 dias (Baixo Giro)</SelectItem>
                <SelectItem value="121-180">121 a 180 dias (Parado)</SelectItem>
                <SelectItem value=">180">&gt; 180 dias (Crítico)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Classificação de Movimentação */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">
              Classificação
            </label>
            <Select
              value={filters.classification}
              onValueChange={(v) => handleFieldChange('classification', v)}
            >
              <SelectTrigger className="h-8 text-xs rounded-xl bg-slate-50 border-slate-200">
                <SelectValue placeholder="Classificação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas Classificações</SelectItem>
                <SelectItem value="NORMAL">Normal</SelectItem>
                <SelectItem value="ATENCAO">Atenção</SelectItem>
                <SelectItem value="BAIXA_MOVIMENTACAO">Baixa Movimentação</SelectItem>
                <SelectItem value="PARADO">Parado</SelectItem>
                <SelectItem value="CRITICO">Crítico</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Qualidade / Aço */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">
              Qualidade do Aço
            </label>
            <Select value={filters.quality} onValueChange={(v) => handleFieldChange('quality', v)}>
              <SelectTrigger className="h-8 text-xs rounded-xl bg-slate-50 border-slate-200">
                <SelectValue placeholder="Qualidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas Qualidades</SelectItem>
                <SelectItem value="ASTM A572 Gr50">ASTM A572 Gr50</SelectItem>
                <SelectItem value="ASTM A36 / USI-SAC 350">ASTM A36</SelectItem>
                <SelectItem value="ASTM A106 Gr B / API 5L">ASTM A106 Gr B (Sch40)</SelectItem>
                <SelectItem value="AISI 304 Polido h9">Inox 304</SelectItem>
                <SelectItem value="CA-50 NBR 7480">CA-50</SelectItem>
                <SelectItem value="AZ150 Z-275">Galvalume AZ150</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Região / Logística TMS */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">
              Região Logística
            </label>
            <Select value={filters.region} onValueChange={(v) => handleFieldChange('region', v)}>
              <SelectTrigger className="h-8 text-xs rounded-xl bg-slate-50 border-slate-200">
                <SelectValue placeholder="Região" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as Regiões</SelectItem>
                <SelectItem value="Grande BH">Grande BH / Contagem / Betim</SelectItem>
                <SelectItem value="Triângulo Mineiro">Triângulo Mineiro</SelectItem>
                <SelectItem value="Sul de Minas">Sul de Minas</SelectItem>
                <SelectItem value="Zona da Mata">Zona da Mata / Juiz de Fora</SelectItem>
                <SelectItem value="Norte de Minas">Norte de Minas / Montes Claros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Vendedor (apenas Gestores têm seletor de outros vendedores) */}
          {isManager && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">
                Vendedor
              </label>
              <Select
                value={filters.sellerId}
                onValueChange={(v) => handleFieldChange('sellerId', v)}
              >
                <SelectTrigger className="h-8 text-xs rounded-xl bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Vendedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Vendedores</SelectItem>
                  <SelectItem value="qas-vendedor_teste">Carlos Mendonça</SelectItem>
                  <SelectItem value="qas-vendedor2_teste">Mariana Azevedo</SelectItem>
                  <SelectItem value="qas-representante_teste">João Pedro Representações</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
