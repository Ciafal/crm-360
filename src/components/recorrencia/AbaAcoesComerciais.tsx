// src/components/recorrencia/AbaAcoesComerciais.tsx
import React, { useState, useMemo } from 'react'
import {
  ListChecks,
  CheckCircle2,
  Clock,
  Sparkles,
  PhoneCall,
  Calendar,
  Layers,
  ArrowRight,
  ShieldAlert,
  FileCheck,
  Package,
  PlusCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { GerarOportunidadeRetomadaModal } from './GerarOportunidadeRetomadaModal'
import { recorrenciaService } from '@/services/recorrencia_service'
import type {
  ClienteRecorrenciaView,
  FilaAcaoComercial,
  UnitMode,
  ProdutoRetomadaItem,
} from '@/types/recorrencia'

interface AbaAcoesComerciaisProps {
  clientes: ClienteRecorrenciaView[]
  unitMode: UnitMode
  onSelectCliente: (clienteSap: string) => void
}

export function AbaAcoesComerciais({
  clientes,
  unitMode,
  onSelectCliente,
}: AbaAcoesComerciaisProps) {
  const [selectedPrioridade, setSelectedPrioridade] = useState<string>('TODAS')

  // Modal de geração de OPP
  const [modalOpen, setModalOpen] = useState(false)
  const [produtoModal, setProdutoModal] = useState<ProdutoRetomadaItem | null>(null)

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

  // Filas geradas pelo motor analítico por sinais
  const filas = useMemo(() => {
    return recorrenciaService.getFilasAcoesComerciais(clientes)
  }, [clientes])

  const filasFiltradas = useMemo(() => {
    if (selectedPrioridade === 'TODAS') return filas
    return filas.filter((f) => f.prioridade === selectedPrioridade)
  }, [filas, selectedPrioridade])

  const handleExecutarAcao = (acao: FilaAcaoComercial) => {
    if (acao.acaoRecomendada.includes('oportunidade') || acao.prioridade === 'Prioridade 3') {
      // Abre modal de oportunidade
      setProdutoModal({
        clienteSap: acao.clienteSap,
        clienteNome: acao.clienteNome,
        vendedorNome: acao.vendedorNome,
        codigoMaterial: 'MAT-304-INX',
        descricao: acao.produtosSugeridos[0] || 'Mix de Retomada Aço',
        grupo: 'Aços Planos e Tubos',
        quantidadeFaturadaHistorica: Math.round(acao.oportunidadeTons * 1000),
        tonelagemHistorica: acao.oportunidadeTons,
        valorFaturadoHistorico: acao.oportunidadeValor,
        nfsCount: 3,
        primeiraCompraData: '15/01/2023',
        ultimaCompraData: '20/07/2024',
        diasSemComprar: 85,
        situacao: 'Sem nota no ano',
        estoqueDisponivelTons: 12.5,
        estoqueReservadoTons: 2.0,
        estoqueLivreTons: 10.5,
        ultimoPrecoPraticadoKg: 6.8,
        precoAtualKg: 7.1,
        disponibilidadeVenda: 'Imediata',
      })
      setModalOpen(true)
    } else if (acao.acaoRecomendada.includes('financeira') || acao.prioridade === 'Prioridade 4') {
      toast.success(
        `Solicitação de revisão financeira enviada para o cliente ${acao.clienteNome}!`,
        {
          description: 'Notificação enviada ao Comitê de Crédito e anexada à Ficha SAP.',
        },
      )
    } else if (acao.acaoRecomendada.includes('contato')) {
      toast.success(`Contato registrado com sucesso para ${acao.clienteNome}!`, {
        description: `Responsável: ${acao.responsavel}. Tarefa de follow-up criada na agenda.`,
      })
    } else {
      toast.success(`Ação "${acao.acaoRecomendada}" iniciada com sucesso para ${acao.clienteNome}!`)
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. SELETOR DAS 4 FILAS DE PRIORIDADE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Fila 1 */}
        <button
          type="button"
          onClick={() =>
            setSelectedPrioridade(selectedPrioridade === 'Prioridade 1' ? 'TODAS' : 'Prioridade 1')
          }
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            selectedPrioridade === 'Prioridade 1'
              ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-500 shadow-sm'
              : 'bg-white border-slate-200 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <Badge className="bg-rose-600 text-white font-bold text-[10px]">Prioridade 1</Badge>
            <span className="font-mono font-bold text-sm text-rose-700">
              {filas.filter((f) => f.prioridade === 'Prioridade 1').length} ações
            </span>
          </div>
          <h4 className="font-bold text-xs text-slate-900">Recuperação Imediata</h4>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Clientes valiosos com queda forte ou parada abrupta.
          </p>
        </button>

        {/* Fila 2 */}
        <button
          type="button"
          onClick={() =>
            setSelectedPrioridade(selectedPrioridade === 'Prioridade 2' ? 'TODAS' : 'Prioridade 2')
          }
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            selectedPrioridade === 'Prioridade 2'
              ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-500 shadow-sm'
              : 'bg-white border-slate-200 hover:border-purple-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <Badge className="bg-purple-600 text-white font-bold text-[10px]">Prioridade 2</Badge>
            <span className="font-mono font-bold text-sm text-purple-700">
              {filas.filter((f) => f.prioridade === 'Prioridade 2').length} ações
            </span>
          </div>
          <h4 className="font-bold text-xs text-slate-900">Compra Esperada (Cadência)</h4>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Clientes no momento ideal de recompra pelo ciclo.
          </p>
        </button>

        {/* Fila 3 */}
        <button
          type="button"
          onClick={() =>
            setSelectedPrioridade(selectedPrioridade === 'Prioridade 3' ? 'TODAS' : 'Prioridade 3')
          }
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            selectedPrioridade === 'Prioridade 3'
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-500 shadow-sm'
              : 'bg-white border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <Badge className="bg-amber-600 text-white font-bold text-[10px]">Prioridade 3</Badge>
            <span className="font-mono font-bold text-sm text-amber-700">
              {filas.filter((f) => f.prioridade === 'Prioridade 3').length} ações
            </span>
          </div>
          <h4 className="font-bold text-xs text-slate-900">Produto Parado</h4>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Clientes ativos que pararam itens com estoque livre.
          </p>
        </button>

        {/* Fila 4 */}
        <button
          type="button"
          onClick={() =>
            setSelectedPrioridade(selectedPrioridade === 'Prioridade 4' ? 'TODAS' : 'Prioridade 4')
          }
          className={`p-3.5 rounded-2xl border text-left transition-all ${
            selectedPrioridade === 'Prioridade 4'
              ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-500 shadow-sm'
              : 'bg-white border-slate-200 hover:border-sky-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <Badge className="bg-sky-700 text-white font-bold text-[10px]">Prioridade 4</Badge>
            <span className="font-mono font-bold text-sm text-sky-800">
              {filas.filter((f) => f.prioridade === 'Prioridade 4').length} ações
            </span>
          </div>
          <h4 className="font-bold text-xs text-slate-900">Crédito & Restrição</h4>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Oportunidade latente com restrição financeira SAP.
          </p>
        </button>
      </div>

      {/* 2. LISTA DAS AÇÕES COMERCIAIS */}
      <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
        <CardHeader className="p-4 bg-slate-50/70 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="font-serif text-base font-bold text-[#003A70]">
                Fila de Ações Comerciais por Sinais
              </CardTitle>
              <Badge variant="outline" className="text-xs bg-white">
                {filasFiltradas.length} ações prioritárias
              </Badge>
            </div>
            {selectedPrioridade !== 'TODAS' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedPrioridade('TODAS')}
                className="h-7 text-xs rounded-xl"
              >
                Ver Todas as Filas
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                <th className="p-3 pl-4 sticky left-0 bg-slate-100 z-10 w-28">Fila</th>
                <th className="p-3 w-56">Cliente / SAP</th>
                <th className="p-3">Motivo / Diagnóstico</th>
                <th className="p-3 text-right">Oportunidade</th>
                <th className="p-3">Produtos Sugeridos</th>
                <th className="p-3">Ação Recomendada</th>
                <th className="p-3">Responsável</th>
                <th className="p-3 text-center">Prazo</th>
                <th className="p-3 pr-4 text-center">Executar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filasFiltradas.map((acao) => (
                <tr key={acao.id} className="hover:bg-sky-50/50 transition-colors">
                  {/* Fila / Prioridade */}
                  <td className="p-3 pl-4 sticky left-0 bg-white hover:bg-sky-50/50 z-10">
                    <Badge
                      className={`text-[9px] font-bold border-none whitespace-nowrap ${
                        acao.prioridade === 'Prioridade 1'
                          ? 'bg-rose-600 text-white'
                          : acao.prioridade === 'Prioridade 2'
                            ? 'bg-purple-600 text-white'
                            : acao.prioridade === 'Prioridade 3'
                              ? 'bg-amber-600 text-white'
                              : 'bg-sky-700 text-white'
                      }`}
                    >
                      {acao.prioridade}
                    </Badge>
                  </td>

                  {/* Cliente */}
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => onSelectCliente(acao.clienteSap)}
                      className="text-left group block max-w-[210px]"
                    >
                      <strong className="text-slate-900 group-hover:text-primary transition-colors block truncate">
                        {acao.clienteNome}
                      </strong>
                      <span className="text-[10px] text-muted-foreground font-mono block">
                        SAP {acao.clienteSap}
                      </span>
                    </button>
                  </td>

                  {/* Motivo */}
                  <td className="p-3 text-slate-700 max-w-[260px]">
                    <span className="line-clamp-2 leading-relaxed">{acao.motivo}</span>
                  </td>

                  {/* Oportunidade */}
                  <td className="p-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                    <div>
                      {unitMode === 'BRL'
                        ? formatBRL(acao.oportunidadeValor)
                        : formatTons(acao.oportunidadeTons)}
                    </div>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      {unitMode === 'BRL'
                        ? formatTons(acao.oportunidadeTons)
                        : formatBRL(acao.oportunidadeValor)}
                    </span>
                  </td>

                  {/* Produtos Sugeridos */}
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1 max-w-[180px]">
                      {acao.produtosSugeridos.map((prod, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="text-[9px] bg-slate-50 border-slate-200 text-slate-700 py-0"
                        >
                          {prod}
                        </Badge>
                      ))}
                    </div>
                  </td>

                  {/* Ação Recomendada */}
                  <td className="p-3 font-medium text-slate-900">
                    <span className="block max-w-[200px] leading-snug">{acao.acaoRecomendada}</span>
                  </td>

                  {/* Responsável */}
                  <td className="p-3 text-slate-700 whitespace-nowrap">{acao.responsavel}</td>

                  {/* Prazo */}
                  <td className="p-3 text-center whitespace-nowrap">
                    <Badge variant="outline" className="font-mono text-[10px] bg-slate-50">
                      {acao.prazo}
                    </Badge>
                  </td>

                  {/* Executar */}
                  <td className="p-3 pr-4 text-center">
                    <Button
                      size="sm"
                      onClick={() => handleExecutarAcao(acao)}
                      className="h-7 text-xs rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold"
                    >
                      Ação
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Modal de Oportunidade integrado */}
      <GerarOportunidadeRetomadaModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        produto={produtoModal}
      />
    </div>
  )
}
