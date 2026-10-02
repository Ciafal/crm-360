// src/components/recorrencia/GerarOportunidadeRetomadaModal.tsx
import React, { useState, useEffect, useMemo } from 'react'
import {
  Sparkles,
  Package,
  User,
  Building,
  DollarSign,
  Weight,
  Layers,
  CheckCircle2,
  AlertCircle,
  FileCheck,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { opportunityLeadService } from '@/services/opportunity_lead_service'
import type { ProdutoRetomadaItem, ClienteRecorrenciaView } from '@/types/recorrencia'

interface GerarOportunidadeRetomadaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  produto: ProdutoRetomadaItem | null
  produtosMultiplos?: ProdutoRetomadaItem[]
  cliente?: ClienteRecorrenciaView | null
  onSuccess?: (oppId: string, oppNumber: string) => void
}

export function GerarOportunidadeRetomadaModal({
  open,
  onOpenChange,
  produto,
  produtosMultiplos,
  cliente,
  onSuccess,
}: GerarOportunidadeRetomadaModalProps) {
  // Estado dos campos do formulário (Hooks chamados incondicionalmente no topo)
  const [titulo, setTitulo] = useState('')
  const [volume, setVolume] = useState<number>(5.0)
  const [precoKg, setPrecoKg] = useState<number>(6.5)
  const [justificativa, setJustificativa] = useState('')
  const [motivo, setMotivo] = useState('Retomada de produto')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedProductCodes, setSelectedProductCodes] = useState<string[]>([])

  const isMulti = Boolean(produtosMultiplos && produtosMultiplos.length > 0)
  const activeProducts = useMemo(() => {
    if (isMulti && produtosMultiplos) return produtosMultiplos
    if (produto) return [produto]
    return []
  }, [isMulti, produtosMultiplos, produto])

  // Inicializar seleção de múltiplos produtos
  useEffect(() => {
    if (isMulti && produtosMultiplos) {
      setSelectedProductCodes(produtosMultiplos.map((p) => p.codigoMaterial))
    }
  }, [isMulti, produtosMultiplos])

  // Atualizar valores padrão quando produto/cliente mudar
  useEffect(() => {
    if (isMulti && produtosMultiplos && produtosMultiplos.length > 0) {
      const clienteNome = cliente?.razaoSocial || produtosMultiplos[0].clienteNome
      const volTotal = produtosMultiplos.reduce((acc, p) => acc + (p.tonelagemHistorica || 0), 0)
      const avgPreco =
        produtosMultiplos.reduce((acc, p) => acc + (p.ultimoPrecoPraticadoKg || 6.5), 0) /
        produtosMultiplos.length
      const grupoPrincipal = produtosMultiplos[0].grupo

      setTitulo(`Retomada de Mix Consolidada (${produtosMultiplos.length} itens) — ${clienteNome}`)
      setVolume(Number(volTotal.toFixed(1)) || 5.0)
      setPrecoKg(Number(avgPreco.toFixed(2)) || 6.5)
      setMotivo('Retomada de produto')
      setJustificativa(
        `Oportunidade consolidada de retomada para ${produtosMultiplos.length} itens que deixaram de ser faturados pelo cliente. Volume histórico acumulado: ${volTotal.toFixed(1)}t.`,
      )
    } else if (produto) {
      const clienteNome = cliente?.razaoSocial || produto.clienteNome
      const volumeSugerido = produto.tonelagemHistorica > 0 ? produto.tonelagemHistorica : 5.0
      const valorUnitarioKg = produto.ultimoPrecoPraticadoKg || 6.5

      setTitulo(`Retomada de Mix — ${produto.descricao} (${clienteNome})`)
      setVolume(volumeSugerido)
      setPrecoKg(valorUnitarioKg)
      setMotivo('Retomada de produto')
      setJustificativa(
        `Cliente com histórico relevante de compra que parou de adquirir o produto há ${produto.diasSemComprar} dias. Há saldo em estoque livre de ${produto.estoqueLivreTons}t com disponibilidade ${produto.disponibilidadeVenda.toLowerCase()}.`,
      )
    }
  }, [produto, produtosMultiplos, cliente, isMulti])

  // Recalcular volume quando produtos forem desmarcados no modo multi
  const handleToggleProduct = (cod: string) => {
    setSelectedProductCodes((prev) => {
      const exists = prev.includes(cod)
      const next = exists ? prev.filter((c) => c !== cod) : [...prev, cod]
      if (isMulti && produtosMultiplos) {
        const marcados = produtosMultiplos.filter((p) => next.includes(p.codigoMaterial))
        const vol = marcados.reduce((acc, p) => acc + p.tonelagemHistorica, 0)
        setVolume(Number(vol.toFixed(1)) || 0.1)
      }
      return next
    })
  }

  if (!produto && (!produtosMultiplos || produtosMultiplos.length === 0)) return null

  const mainProd = produto || (produtosMultiplos ? produtosMultiplos[0] : null)
  const clienteNome = cliente?.razaoSocial || mainProd?.clienteNome || 'Cliente CIAFAL'
  const clienteSap = cliente?.codigoSap || mainProd?.clienteSap || '000000'
  const vendedor = cliente?.vendedorNome || mainProd?.vendedorNome || 'Carlos Mendonça'
  const representante = cliente?.representanteNome || 'CIAFAL Matriz Vendas'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // 1. Criar oportunidade oficial no motor do CRM 360º (OPP-XXXXXX/AAAA)
      const valorTotal = Math.round(volume * 1000 * precoKg)
      const itensEscolhidos = isMulti
        ? (produtosMultiplos || []).filter((p) => selectedProductCodes.includes(p.codigoMaterial))
        : produto
          ? [produto]
          : []

      const detalheItens = itensEscolhidos
        .map(
          (it) =>
            `• [${it.codigoMaterial}] ${it.descricao} (${it.grupo}) — Histórico: ${it.tonelagemHistorica}t | Última compra: ${it.ultimaCompraData} | Estoque livre: ${it.estoqueLivreTons}t`,
        )
        .join('\n')

      const observacoesFormatadas = [
        titulo,
        `Motivo: ${motivo}`,
        `Representante: ${representante}`,
        `Vendedor: ${vendedor}`,
        cliente?.segmentoRFM ? `Segmento RFM: ${cliente.segmentoRFM}` : undefined,
        `Justificativa: ${justificativa}`,
        itensEscolhidos.length > 0 ? `\nItens da Oportunidade:\n${detalheItens}` : undefined,
      ]
        .filter(Boolean)
        .join('\n\n')

      const payload = {
        clienteId: cliente?.id || `cli-${clienteSap}`,
        clienteNome,
        clienteSap,
        clienteCnpj: cliente?.cnpjCpf || '',
        clienteCidade: cliente?.cidade || 'Contagem',
        clienteUf: cliente?.uf || 'MG',
        clienteSegmento: cliente?.setorIndustrial || 'Indústria Metalúrgica',
        vendedorId: cliente?.vendedorId || 'qas-vendedor_teste',
        vendedorNome: vendedor,
        grupoMercadoria: mainProd?.grupo || 'Mix Comercial',
        quantidadeEstimadaTons: volume,
        precoEstimadoPorTon: Math.round(precoKg * 1000),
        previsaoCompra: 'ate_30_dias',
        probabilidadeClassificacao: 'alta' as const,
        origemOportunidade: 'Recorrência de Compras — Retomada',
        observacoes: observacoesFormatadas,
        usuarioAtual: vendedor,
      }

      const created = opportunityLeadService.createOpportunity(payload)

      // 2. Reconsultar o registro persistido para garantir integridade e feedback de sucesso
      const verify = opportunityLeadService.getOpportunityById(created.id)
      if (!verify) {
        throw new Error('Falha ao verificar persistência da Oportunidade no CRM.')
      }

      const numOpp = verify.numeroSequencial || `OPP-${created.id.substring(0, 6)}/2024`

      // 3. Emitir evento e notificar usuário
      toast.success(`Oportunidade ${numOpp} gerada com sucesso!`, {
        description: `Persistida na Gestão de Cotações e no Funil com ${volume}t de ${produto.descricao}.`,
      })

      // Notificar ouvinte
      onSuccess?.(verify.id, numOpp)
      onOpenChange(false)
    } catch (err: any) {
      console.error('Erro ao gerar oportunidade de retomada:', err)
      toast.error('Não foi possível gerar a oportunidade de retomada.', {
        description: err?.message || 'Tente novamente.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl p-6">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-100 text-[#003A70] flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="font-serif text-lg font-bold text-[#003A70]">
                Gerar Oportunidade de Retomada
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                Gera uma Oportunidade sequencial (OPP-XXXXXX/AAAA) conectada ao Funil e Cotações.
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Card Resumo do Produto & Cliente */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 text-sm block">{clienteNome}</span>
                <span className="text-[11px] text-slate-500">
                  Vendedor: <strong>{vendedor}</strong> · Representante:{' '}
                  <strong>{representante}</strong>
                </span>
              </div>
              <Badge variant="outline" className="font-mono text-[10px]">
                SAP: {clienteSap}
              </Badge>
            </div>

            {/* Modo Produto Único */}
            {!isMulti && produto && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-200/80 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Produto / Grupo:</span>
                  <strong className="text-slate-900 block truncate" title={produto.descricao}>
                    {produto.descricao}
                  </strong>
                  <span className="text-[10px] text-slate-500 font-mono">{produto.grupo}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Última Compra:</span>
                  <span className="text-slate-800 font-mono">{produto.ultimaCompraData}</span>
                  <span className="text-[10px] text-slate-500 block">
                    há {produto.diasSemComprar}d
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Estoque Livre:</span>
                  <strong className="text-emerald-700 font-mono">
                    {produto.estoqueLivreTons} t
                  </strong>
                  <span className="text-[10px] text-slate-500 block">
                    Histórico: {produto.tonelagemHistorica}t
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Disponibilidade:</span>
                  <Badge className="text-[9px] bg-emerald-600 text-white border-none py-0">
                    {produto.disponibilidadeVenda}
                  </Badge>
                  <span className="text-[10px] text-slate-500 block font-mono">
                    R$ {produto.ultimoPrecoPraticadoKg.toFixed(2)}/kg
                  </span>
                </div>
              </div>
            )}

            {/* Modo Múltiplos Produtos com Checkbox */}
            {isMulti && produtosMultiplos && (
              <div className="pt-2 border-t border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-700">
                    Selecione os produtos parados para incluir na oportunidade (
                    {selectedProductCodes.length}/{produtosMultiplos.length}):
                  </span>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
                  {produtosMultiplos.map((p) => {
                    const isChecked = selectedProductCodes.includes(p.codigoMaterial)
                    return (
                      <label
                        key={p.codigoMaterial}
                        className={`flex items-start gap-2 p-1.5 rounded-lg text-[11px] cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-sky-50/80 text-slate-900'
                            : 'bg-white text-slate-500 opacity-60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleProduct(p.codigoMaterial)}
                          className="mt-0.5 rounded border-slate-300 text-primary focus:ring-primary"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-medium truncate">{p.descricao}</span>
                            <span className="font-mono font-bold text-slate-800">
                              {p.tonelagemHistorica} t
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                            <span>{p.codigoMaterial}</span>
                            <span>•</span>
                            <span>{p.grupo}</span>
                            <span>•</span>
                            <span>Estoque: {p.estoqueLivreTons}t</span>
                            <span>•</span>
                            <span>R$ {p.ultimoPrecoPraticadoKg.toFixed(2)}/kg</span>
                          </div>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Motivo Pré-Preenchido Editável */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Motivo</Label>
              <Input
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                required
                className="h-9 text-xs rounded-xl font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Origem da Oportunidade</Label>
              <Input
                value="Recorrência de Compras — Retomada"
                disabled
                className="h-9 text-xs rounded-xl bg-slate-100 text-slate-600 font-medium"
              />
            </div>
          </div>

          {/* Título da Oportunidade */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Título da Oportunidade</Label>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
              className="h-9 text-xs rounded-xl"
            />
          </div>

          {/* Volume Sugerido e Preço Estimado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Volume Sugerido (t)</Label>
              <Input
                type="number"
                step="0.1"
                min="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value) || 0)}
                required
                className="h-9 text-xs rounded-xl font-mono"
              />
              <span className="text-[10px] text-muted-foreground">
                Baseado na média histórica ({produto?.tonelagemHistorica ?? volume}t)
              </span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                Último Preço Praticado (R$/kg)
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0.1"
                value={precoKg}
                onChange={(e) => setPrecoKg(parseFloat(e.target.value) || 0)}
                required
                className="h-9 text-xs rounded-xl font-mono"
              />
              <span className="text-[10px] text-muted-foreground">
                Valor Total Estimado:{' '}
                <strong className="text-slate-900">
                  {Math.round(volume * 1000 * precoKg).toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </strong>
              </span>
            </div>
          </div>

          {/* Justificativa da Oportunidade */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">
              Justificativa Comercial / Contexto
            </Label>
            <Textarea
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              rows={3}
              required
              className="text-xs rounded-xl resize-none"
            />
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="rounded-xl text-xs bg-primary hover:bg-primary/90 text-white font-semibold gap-1.5"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Gerando...' : 'Confirmar & Criar Oportunidade'}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
