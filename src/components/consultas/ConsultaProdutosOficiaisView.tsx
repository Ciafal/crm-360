// src/components/consultas/ConsultaProdutosOficiaisView.tsx
import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  Layers,
  Package,
  Sparkles,
  Info,
  CheckCircle2,
  FileDown,
  Building2,
  SlidersHorizontal,
  ExternalLink,
} from 'lucide-react'
import { CatalogoProdutoItem, ProdutoFiltrosPesquisa } from '@/types/catalogo'
import { catalogoService } from '@/services/catalogoService'
import { toast } from 'sonner'

export function ConsultaProdutosOficiaisView({
  onSelecionarProduto,
}: {
  onSelecionarProduto?: (prod: CatalogoProdutoItem) => void
}) {
  const [termo, setTermo] = useState('')
  const [linha, setLinha] = useState('TODAS')
  const [familia, setFamilia] = useState('TODAS')
  const [empresa, setEmpresa] = useState('TODAS')
  const [producaoPropria, setProducaoPropria] = useState(false)
  const [industrializacao, setIndustrializacao] = useState(false)
  const [produtoModal, setProdutoModal] = useState<CatalogoProdutoItem | null>(null)

  const linhas = useMemo(() => catalogoService.getLinhasDisponiveis(), [])
  const familias = useMemo(() => catalogoService.getFamiliasDisponiveis(linha), [linha])

  const produtos = useMemo(() => {
    return catalogoService.getProdutosOficiais({
      termo,
      linha,
      familia,
      empresa,
      producaoPropria: producaoPropria ? true : undefined,
      industrializacao: industrializacao ? true : undefined,
    })
  }, [termo, linha, familia, empresa, producaoPropria, industrializacao])

  return (
    <div className="space-y-5">
      {/* Barra de Filtros Avançados de Produtos */}
      <Card className="border-slate-200 shadow-xs bg-white">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <Input
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                placeholder="Buscar por código, descrição, bitola, dimensão, aplicação, norma técnica..."
                className="pl-9 h-9 text-xs bg-slate-50 border-slate-200 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <Select
                value={linha}
                onValueChange={(v) => {
                  setLinha(v)
                  setFamilia('TODAS')
                }}
              >
                <SelectTrigger className="h-9 text-xs w-[180px] bg-white">
                  <SelectValue placeholder="Linha..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODAS">Todas as Linhas</SelectItem>
                  {linhas.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={familia} onValueChange={setFamilia}>
                <SelectTrigger className="h-9 text-xs w-[180px] bg-white">
                  <SelectValue placeholder="Família..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODAS">Todas as Famílias</SelectItem>
                  {familias.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <Checkbox
                  checked={producaoPropria}
                  onCheckedChange={(c) => setProducaoPropria(!!c)}
                />
                <span>Apenas Produção Própria CIAFAL</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <Checkbox
                  checked={industrializacao}
                  onCheckedChange={(c) => setIndustrializacao(!!c)}
                />
                <span>Industrialização / Corte e Dobra</span>
              </label>
            </div>

            <span className="text-slate-500 font-medium">
              <strong>{produtos.length}</strong> produtos técnicos encontrados
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Grade de Produtos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {produtos.map((p) => (
          <Card
            key={p.id}
            className="border-slate-200 shadow-2xs hover:border-[#003A70]/40 transition-all flex flex-col justify-between bg-white"
          >
            <CardHeader className="p-4 pb-2 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <Badge className="bg-sky-50 text-[#003A70] border-sky-200 font-mono text-xs font-bold">
                  {p.codigo}
                </Badge>
                <Badge variant="outline" className="text-[10px] bg-slate-50">
                  {p.linha}
                </Badge>
              </div>
              <CardTitle className="text-sm font-bold text-slate-900 leading-snug">
                {p.descricaoComercial}
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 font-mono">
                {p.dimensao} · {p.qualidadeAco}
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 pt-0 space-y-3 text-xs">
              <p className="text-slate-600 text-[11px] line-clamp-2 leading-relaxed">
                {p.aplicacao}
              </p>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                <div>
                  <span className="text-slate-400 block font-bold text-[9px] uppercase">
                    Norma Técnica
                  </span>
                  <span className="font-semibold text-slate-800">{p.normaTecnica}</span>
                </div>
                {p.pesoTeoricoKgM && (
                  <div>
                    <span className="text-slate-400 block font-bold text-[9px] uppercase">
                      Peso Teórico
                    </span>
                    <span className="font-semibold text-slate-800">
                      {p.pesoTeoricoKgM.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg/m
                    </span>
                  </div>
                )}
              </div>

              {p.empresaOrigem && (
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-500">
                  <span>Origem: {p.empresaOrigem}</span>
                  {p.producaoPropria && (
                    <span className="text-emerald-700 font-bold">● Produção Própria</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {produtos.length === 0 && (
          <div className="col-span-full p-12 text-center text-slate-500 text-xs bg-white rounded-2xl border border-slate-200">
            Nenhum produto oficial encontrado para os filtros selecionados.
          </div>
        )}
      </div>
    </div>
  )
}
