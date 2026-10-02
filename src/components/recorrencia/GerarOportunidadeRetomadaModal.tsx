// src/components/recorrencia/GerarOportunidadeRetomadaModal.tsx
import React, { useState, useEffect } from 'react'
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
  cliente?: ClienteRecorrenciaView | null
  onSuccess?: (oppId: string, oppNumber: string) => void
}

export function GerarOportunidadeRetomadaModal({
  open,
  onOpenChange,
  produto,
  cliente,
  onSuccess,
}: GerarOportunidadeRetomadaModalProps) {
  // Estado dos campos do formulário (Hooks chamados incondicionalmente no topo)
  const [titulo, setTitulo] = useState('')
  const [volume, setVolume] = useState<number>(5.0)
  const [precoKg, setPrecoKg] = useState<number>(6.5)
  const [justificativa, setJustificativa] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Atualizar valores padrão quando produto/cliente mudar
  useEffect(() => {
    if (produto) {
      const clienteNome = cliente?.razaoSocial || produto.clienteNome
      const volumeSugerido = produto.tonelagemHistorica > 0 ? produto.tonelagemHistorica : 5.0
      const valorUnitarioKg = produto.ultimoPrecoPraticadoKg || 6.5

      setTitulo(`Retomada de Mix — ${produto.descricao} (${clienteNome})`)
      setVolume(volumeSugerido)
      setPrecoKg(valorUnitarioKg)
      setJustificativa(
        `Cliente com histórico relevante de compra que parou de adquirir o produto há ${produto.diasSemComprar} dias. Há saldo em estoque livre de ${produto.estoqueLivreTons}t com disponibilidade ${produto.disponibilidadeVenda.toLowerCase()}.`,
      )
    }
  }, [produto, cliente])

  if (!produto) return null

  const clienteNome = cliente?.razaoSocial || produto.clienteNome
  const clienteSap = cliente?.codigoSap || produto.clienteSap
  const vendedor = cliente?.vendedorNome || produto.vendedorNome

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // 1. Criar oportunidade oficial no motor do CRM 360º (OPP-XXXXXX/AAAA)
      const valorTotal = Math.round(volume * 1000 * precoKg)

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
        grupoMercadoria: produto.grupo,
        quantidadeEstimadaTons: volume,
        precoEstimadoPorTon: precoKg * 1000,
        previsaoCompra: 'ate_30_dias',
        probabilidadeClassificacao: 'alta' as const,
        origemOportunidade: 'Motor de Retomada CIAFAL',
        observacoes: `${titulo}\n\nJustificativa: ${justificativa}`,
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
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">{clienteNome}</span>
              <Badge variant="outline" className="font-mono text-[10px]">
                SAP: {clienteSap}
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-200/80 text-[11px]">
              <div>
                <span className="text-slate-500 block">Produto:</span>
                <strong className="text-slate-900 block truncate">{produto.descricao}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Última Compra:</span>
                <span className="text-slate-800 font-mono">{produto.ultimaCompraData}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Estoque Livre:</span>
                <strong className="text-emerald-700 font-mono">{produto.estoqueLivreTons} t</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Disponibilidade:</span>
                <Badge className="text-[9px] bg-emerald-600 text-white border-none py-0">
                  {produto.disponibilidadeVenda}
                </Badge>
              </div>
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
                Baseado na média histórica ({produto.tonelagemHistorica}t)
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
