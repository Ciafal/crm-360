import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Wrench,
  Search,
  ExternalLink,
  PlusCircle,
  Sparkles,
} from 'lucide-react'
import { ClienteSatisfacao360 } from '@/types/satisfaction'

interface MatrizValorSatisfacaoProps {
  clientes: ClienteSatisfacao360[]
  onSelectCliente: (cliente: ClienteSatisfacao360) => void
  onOpenAnaliseIA: (cliente: ClienteSatisfacao360) => void
}

export function MatrizValorSatisfacao({
  clientes,
  onSelectCliente,
  onOpenAnaliseIA,
}: MatrizValorSatisfacaoProps) {
  const [selectedQuadrant, setSelectedQuadrant] = useState<string>('todos')

  // Quadrantes:
  // 1. Proteger: Alto Valor (scoreValorEstrategico >= 60) + Alta Satisfação (iscAtual >= 75)
  // 2. Prioridade Máxima: Alto Valor (>= 60) + Baixa Satisfação (< 75)
  // 3. Manutenção: Baixo Valor (< 60) + Alta Satisfação (>= 75)
  // 4. Reavaliar Estratégia: Baixo Valor (< 60) + Baixa Satisfação (< 75)

  const protegerClientes = clientes.filter((c) => c.scoreValorEstrategico >= 60 && c.iscAtual >= 75)
  const prioridadeClientes = clientes.filter(
    (c) => c.scoreValorEstrategico >= 60 && c.iscAtual < 75,
  )
  const manutencaoClientes = clientes.filter(
    (c) => c.scoreValorEstrategico < 60 && c.iscAtual >= 75,
  )
  const reavaliarClientes = clientes.filter((c) => c.scoreValorEstrategico < 60 && c.iscAtual < 75)

  return (
    <div className="space-y-4">
      {/* CABEÇALHO DA MATRIZ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <h3 className="font-serif text-base font-bold text-white flex items-center gap-2">
            Matriz Estratégica: Valor do Cliente × Satisfação (ISC)
          </h3>
          <p className="text-xs text-slate-400">
            Eixo X: Valor Estratégico (Faturamento, Potencial, Volume) | Eixo Y: Satisfação do
            Cliente (ISC)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs bg-slate-950 text-slate-300 border-slate-700">
            Total Clientes: {clientes.length}
          </Badge>
        </div>
      </div>

      {/* GRID 2x2 DA MATRIZ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* QUADRANTE 1: ALTO VALOR + BAIXA SATISFAÇÃO -> PRIORIDADE MÁXIMA (CRÍTICO) */}
        <Card className="p-4 rounded-3xl bg-rose-950/20 border-2 border-rose-500/40 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-sm font-bold text-rose-400 uppercase tracking-wider block">
                  Prioridade Máxima (Risco Iminente)
                </strong>
                <span className="text-[11px] text-slate-400">Alto Valor + Baixa Satisfação</span>
              </div>
            </div>
            <Badge className="bg-rose-500 text-white font-bold text-xs">
              {prioridadeClientes.length} cliente(s)
            </Badge>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {prioridadeClientes.map((c) => (
              <div
                key={c.id}
                className="p-3 rounded-2xl bg-slate-950 border border-rose-500/30 flex items-center justify-between gap-2 hover:border-rose-400 transition-all cursor-pointer"
                onClick={() => onSelectCliente(c)}
              >
                <div>
                  <strong className="text-xs text-white block hover:underline">
                    {c.razaoSocial}
                  </strong>
                  <span className="text-[10px] text-slate-400">
                    SAP #{c.sapCode} · {c.vendedorNome} · Vol: {c.volumeYTD.toFixed(1)} t
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant="outline"
                    className="text-xs bg-rose-500/10 text-rose-400 border-rose-500/30 font-bold"
                  >
                    ISC {c.iscAtual}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      onOpenAnaliseIA(c)
                    }}
                    className="h-7 w-7 p-0 text-amber-400 hover:bg-slate-800"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
            {prioridadeClientes.length === 0 && (
              <p className="text-xs text-slate-500 italic p-3 text-center">
                Nenhum cliente neste quadrante.
              </p>
            )}
          </div>
        </Card>

        {/* QUADRANTE 2: ALTO VALOR + ALTA SATISFAÇÃO -> PROTEGER (EXCELÊNCIA) */}
        <Card className="p-4 rounded-3xl bg-emerald-950/20 border-2 border-emerald-500/40 space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-sm font-bold text-emerald-400 uppercase tracking-wider block">
                  Proteger (Contas Chave)
                </strong>
                <span className="text-[11px] text-slate-400">Alto Valor + Alta Satisfação</span>
              </div>
            </div>
            <Badge className="bg-emerald-500 text-white font-bold text-xs">
              {protegerClientes.length} cliente(s)
            </Badge>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {protegerClientes.map((c) => (
              <div
                key={c.id}
                className="p-3 rounded-2xl bg-slate-950 border border-emerald-500/30 flex items-center justify-between gap-2 hover:border-emerald-400 transition-all cursor-pointer"
                onClick={() => onSelectCliente(c)}
              >
                <div>
                  <strong className="text-xs text-white block hover:underline">
                    {c.razaoSocial}
                  </strong>
                  <span className="text-[10px] text-slate-400">
                    SAP #{c.sapCode} · {c.vendedorNome} · Vol: {c.volumeYTD.toFixed(1)} t
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant="outline"
                    className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-bold"
                  >
                    ISC {c.iscAtual}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      onOpenAnaliseIA(c)
                    }}
                    className="h-7 w-7 p-0 text-amber-400 hover:bg-slate-800"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
            {protegerClientes.length === 0 && (
              <p className="text-xs text-slate-500 italic p-3 text-center">
                Nenhum cliente neste quadrante.
              </p>
            )}
          </div>
        </Card>

        {/* QUADRANTE 3: BAIXO VALOR + BAIXA SATISFAÇÃO -> REAVALIAR ESTRATÉGIA */}
        <Card className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-sm font-bold text-orange-400 uppercase tracking-wider block">
                  Reavaliar Estratégia
                </strong>
                <span className="text-[11px] text-slate-400">Baixo Valor + Baixa Satisfação</span>
              </div>
            </div>
            <Badge variant="outline" className="text-xs bg-slate-950 text-slate-300">
              {reavaliarClientes.length} cliente(s)
            </Badge>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {reavaliarClientes.map((c) => (
              <div
                key={c.id}
                className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2 hover:border-slate-700 transition-all cursor-pointer"
                onClick={() => onSelectCliente(c)}
              >
                <div>
                  <strong className="text-xs text-white block hover:underline">
                    {c.razaoSocial}
                  </strong>
                  <span className="text-[10px] text-slate-400">
                    SAP #{c.sapCode} · {c.vendedorNome}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="text-xs bg-orange-500/10 text-orange-400 border-orange-500/30"
                >
                  ISC {c.iscAtual}
                </Badge>
              </div>
            ))}
            {reavaliarClientes.length === 0 && (
              <p className="text-xs text-slate-500 italic p-3 text-center">
                Nenhum cliente neste quadrante.
              </p>
            )}
          </div>
        </Card>

        {/* QUADRANTE 4: BAIXO VALOR + ALTA SATISFAÇÃO -> MANUTENÇÃO */}
        <Card className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <Wrench className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-sm font-bold text-blue-400 uppercase tracking-wider block">
                  Manutenção & Upsell
                </strong>
                <span className="text-[11px] text-slate-400">Baixo Valor + Alta Satisfação</span>
              </div>
            </div>
            <Badge variant="outline" className="text-xs bg-slate-950 text-slate-300">
              {manutencaoClientes.length} cliente(s)
            </Badge>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {manutencaoClientes.map((c) => (
              <div
                key={c.id}
                className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2 hover:border-slate-700 transition-all cursor-pointer"
                onClick={() => onSelectCliente(c)}
              >
                <div>
                  <strong className="text-xs text-white block hover:underline">
                    {c.razaoSocial}
                  </strong>
                  <span className="text-[10px] text-slate-400">
                    SAP #{c.sapCode} · {c.vendedorNome}
                  </span>
                </div>
                <Badge
                  variant="outline"
                  className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/30"
                >
                  ISC {c.iscAtual}
                </Badge>
              </div>
            ))}
            {manutencaoClientes.length === 0 && (
              <p className="text-xs text-slate-500 italic p-3 text-center">
                Nenhum cliente neste quadrante.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
