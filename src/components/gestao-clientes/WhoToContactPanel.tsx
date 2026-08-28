// src/components/gestao-clientes/WhoToContactPanel.tsx
import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sparkles,
  PhoneCall,
  MessageSquare,
  Mail,
  FileSpreadsheet,
  ArrowRight,
  Clock,
  Building2,
  AlertTriangle,
} from 'lucide-react'
import type { AIWhoToContactSuggestion, CustomerManagementItem } from '@/types/customer_management'
import { toast } from 'sonner'

interface WhoToContactPanelProps {
  suggestions: AIWhoToContactSuggestion[]
  onSelectClient: (cliente: CustomerManagementItem) => void
  onQuickAction?: (cliente: CustomerManagementItem, acao: string) => void
}

export function WhoToContactPanel({
  suggestions,
  onSelectClient,
  onQuickAction,
}: WhoToContactPanelProps) {
  const handleAction = (sug: AIWhoToContactSuggestion) => {
    if (onQuickAction) {
      onQuickAction(sug.cliente, sug.acaoRecomendada)
    } else {
      toast.success(`Ação "${sug.acaoRecomendada}" iniciada para ${sug.cliente.nomeFantasia}`, {
        description: `Produto sugerido: ${sug.produtoSugerido.descricao}.`,
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-3xl bg-gradient-to-r from-sky-950 via-slate-900 to-slate-950 border border-sky-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-sky-500/20 border border-sky-500/30 text-amber-300">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Quem Devo Contatar Hoje?
              <Badge className="bg-amber-500 text-slate-950 text-[10px] font-bold">
                Motor IA CIAFAL
              </Badge>
            </h3>
            <p className="text-xs text-slate-300">
              Priorização inteligente cruzando Cobertura Vencida, Classificação, ISC, Queda de
              Volume, Cotações e Estoque Disponível.
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          {suggestions.length} clientes priorizados para hoje
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {suggestions.map((sug, idx) => (
          <Card
            key={sug.cliente.id}
            className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-sky-500/50 transition-all flex flex-col justify-between gap-3 shadow-xs"
          >
            <div className="space-y-2">
              {/* Topo do Card */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-sky-400">
                  #{idx + 1} • {sug.prioridade}
                </span>
                <Badge
                  variant="outline"
                  className={`text-[9px] font-mono ${
                    sug.cliente.classificacao === 'ESTRATEGICO'
                      ? 'border-purple-500 text-purple-300'
                      : sug.cliente.classificacao === 'EM_RISCO'
                        ? 'border-rose-500 text-rose-300'
                        : 'border-slate-600 text-slate-300'
                  }`}
                >
                  {sug.cliente.classificacao.replace('_', ' ')}
                </Badge>
              </div>

              {/* Nome do Cliente */}
              <div>
                <strong
                  onClick={() => onSelectClient(sug.cliente)}
                  className="text-sm font-bold text-white hover:text-sky-300 cursor-pointer transition-colors block leading-snug"
                >
                  {sug.cliente.razaoSocial}
                </strong>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  {sug.cliente.cidade} - {sug.cliente.uf} · {sug.cliente.segmento}
                </span>
              </div>

              {/* Motivo do Algoritmo */}
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-amber-200/90 leading-tight">
                <span className="font-bold block text-[10px] uppercase text-amber-400">
                  Motivo de Priorização
                </span>
                {sug.motivoOrdem}
              </div>

              {/* Indicadores do Cliente */}
              <div className="grid grid-cols-3 gap-1 p-2 bg-slate-950/60 rounded-xl text-center text-[10px] border border-slate-800/50">
                <div>
                  <span className="text-slate-500 block">Sem Contato</span>
                  <strong className={sug.diasSemContato > 30 ? 'text-rose-400' : 'text-slate-200'}>
                    {sug.diasSemContato} dias
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">ISC</span>
                  <strong className={sug.cliente.isc >= 75 ? 'text-sky-400' : 'text-amber-400'}>
                    {sug.cliente.isc}/100
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">OTIF</span>
                  <strong
                    className={sug.cliente.otif >= 90 ? 'text-emerald-400' : 'text-orange-400'}
                  >
                    {sug.cliente.otif}%
                  </strong>
                </div>
              </div>

              {/* Produto Sugerido */}
              <div className="text-xs pt-1 border-t border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">
                  Produto Recomendado
                </span>
                <strong className="text-sky-300 text-[11px] block">
                  {sug.produtoSugerido.descricao}
                </strong>
                <span className="text-[10px] text-slate-500 block">
                  {sug.produtoSugerido.motivo}
                </span>
              </div>
            </div>

            {/* Ações Inferiores */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <Button
                size="sm"
                onClick={() => handleAction(sug)}
                className="flex-1 h-8 text-xs bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl gap-1"
              >
                {sug.acaoRecomendada === 'WhatsApp' && <MessageSquare className="w-3.5 h-3.5" />}
                {sug.acaoRecomendada === 'Ligar' && <PhoneCall className="w-3.5 h-3.5" />}
                {sug.acaoRecomendada === 'E-mail' && <Mail className="w-3.5 h-3.5" />}
                {sug.acaoRecomendada === 'Enviar Catálogo' && (
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                )}
                <span>{sug.acaoRecomendada}</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => onSelectClient(sug.cliente)}
                className="h-8 text-xs border-slate-700 text-slate-300 hover:text-white rounded-xl"
              >
                Ficha 360
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
