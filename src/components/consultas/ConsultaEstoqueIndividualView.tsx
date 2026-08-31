// src/components/consultas/ConsultaEstoqueIndividualView.tsx
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Layers,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Building2,
  Calendar,
  Truck,
  CheckCircle2,
  Clock,
  Info,
  Lock,
  History,
} from 'lucide-react'
import { catalogoService } from '@/services/catalogoService'
import { useAuth } from '@/hooks/use-auth'
import { CATALOG_MATERIALS } from '@/services/quotation_service'
import { toast } from 'sonner'

export function ConsultaEstoqueIndividualView() {
  const { user } = useAuth()
  const [termo, setTermo] = useState('')
  const [resultado, setResultado] = useState<any>(null)
  const [buscou, setBuscou] = useState(false)
  const [historicoConsultas, setHistoricoConsultas] = useState<
    Array<{ codigo: string; descricao: string; hora: string; disponivelTons: number }>
  >([])

  const handleConsultar = (codigoInput?: string) => {
    const cod = (codigoInput || termo).trim()
    if (!cod) {
      toast.error('Informe o código específico do produto para consulta individual.')
      return
    }

    const authCtx = {
      id: user?.id || 'vendedor_teste',
      name: user?.name || 'Vendedor Comercial',
      email: user?.email || 'vendedor@ciafal.com.br',
      role: (user?.role as any) || 'vendedor',
      carteiraId: 'CART-01',
    }

    const res = catalogoService.consultarEstoqueIndividual(authCtx, cod)
    setBuscou(true)
    setResultado(res)

    if (res.autorizado && res.produto) {
      setHistoricoConsultas((prev) => [
        {
          codigo: res.produto!.codigo,
          descricao: res.produto!.descricao,
          hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          disponivelTons: res.produto!.disponivelTons,
        },
        ...prev.slice(0, 4),
      ])
      toast.success(`Estoque do material ${res.produto.codigo} consultado com sucesso!`)
    } else {
      toast.error(res.mensagem || 'Não autorizado')
    }
  }

  return (
    <div className="space-y-6">
      {/* Banner de Segurança & Governança de Estoque Individual */}
      <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#003A70]">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-[#003A70] text-white rounded-xl shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#003A70]">
              Política de Consulta Individual de Estoque (RBAC / RLS)
            </h3>
            <p className="text-slate-600 mt-0.5 max-w-3xl leading-relaxed">
              Vendedores e representantes têm acesso para consultar o saldo físico e previsão de
              produção de <strong>um material específico por vez</strong>. Por políticas
              estratégicas de governança, consultas em lote, download global de estoques e valores
              financeiros não são permitidos.
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="bg-white text-[#003A70] border-sky-300 shrink-0 font-mono text-xs font-bold"
        >
          <Lock className="w-3 h-3 mr-1" /> Consulta Auditada
        </Badge>
      </div>

      {/* Caixa de Busca de UM Material */}
      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="p-5 pb-3">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Search className="w-4 h-4 text-[#003A70]" />
            Consultar Saldo de Material Específico
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Digite o código técnico CIAFAL exato (ex: V20200360600, TB-304-SCH10, BCH-1-14,
            PER-W-200-22)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-0 space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Input
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleConsultar()}
                placeholder="Código do material (ex: V20200360600)..."
                className="h-10 text-xs font-mono uppercase bg-slate-50 border-slate-300 focus:bg-white"
              />
            </div>
            <Button
              onClick={() => handleConsultar()}
              className="h-10 text-xs font-bold bg-[#003A70] hover:bg-[#002850] text-white px-6 w-full sm:w-auto"
            >
              <Search className="w-4 h-4 mr-1.5" />
              Consultar Saldo
            </Button>
          </div>

          {/* Atalhos rápidos para materiais comuns */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Sugestões de Consulta:</span>
            {['V20200360600', 'TB-304-SCH10', 'BCH-1-14', 'PER-W-200-22', 'TUB-SCH40-2POL'].map(
              (cod) => (
                <button
                  key={cod}
                  type="button"
                  onClick={() => {
                    setTermo(cod)
                    handleConsultar(cod)
                  }}
                  className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 font-mono text-[11px] text-slate-700 transition-colors border border-slate-200"
                >
                  {cod}
                </button>
              ),
            )}
          </div>
        </CardContent>
      </Card>

      {/* Card do Resultado da Consulta Individual */}
      {buscou && resultado?.autorizado && resultado?.produto && (
        <Card className="border-slate-200 shadow-md bg-white overflow-hidden animate-fade-in">
          <div className="p-5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Badge className="bg-sky-500 text-white font-mono text-xs font-bold border-none">
                  {resultado.produto.codigo}
                </Badge>
                <Badge variant="outline" className="text-slate-300 border-slate-700 text-xs">
                  {resultado.produto.linha}
                </Badge>
              </div>
              <h2 className="text-lg font-bold mt-1.5">{resultado.produto.descricao}</h2>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[11px] text-slate-400 block uppercase font-bold tracking-wider">
                Status Físico
              </span>
              {resultado.produto.statusEstoque === 'DISPONIVEL' && (
                <Badge className="bg-emerald-500 text-white font-bold text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Saldo Disponível
                </Badge>
              )}
              {resultado.produto.statusEstoque === 'ESTOQUE_BAIXO' && (
                <Badge className="bg-amber-500 text-white font-bold text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Saldo Reduzido
                </Badge>
              )}
              {resultado.produto.statusEstoque === 'SEM_ESTOQUE' && (
                <Badge className="bg-rose-500 text-white font-bold text-xs">
                  Sem Saldo Físico Imediato
                </Badge>
              )}
            </div>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* Grid com Saldo em Toneladas e Localização */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] uppercase font-bold text-slate-500 block">
                  Disponível Imediato para Venda
                </span>
                <div className="text-2xl font-black text-[#003A70] mt-1">
                  {resultado.produto.disponivelTons.toLocaleString('pt-BR', {
                    minimumFractionDigits: 1,
                  })}{' '}
                  <span className="text-base font-normal text-slate-600">t</span>
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Liberado para faturamento
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] uppercase font-bold text-slate-500 block">
                  Planta & Depósito
                </span>
                <div className="text-sm font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-[#003A70]" />
                  {resultado.produto.planta}
                </div>
                <span className="text-[11px] text-slate-600 block mt-1">
                  {resultado.produto.deposito}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] uppercase font-bold text-slate-500 block">
                  Prazo de Expedição / TMS
                </span>
                <div className="text-sm font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-emerald-600" />
                  {resultado.produto.prazoTMSDias} dias úteis
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Rota programada padrão
                </span>
              </div>
            </div>

            {/* Previsão de PCP se houver */}
            {resultado.produto.previsaoPcp && (
              <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 flex items-start gap-3 text-xs text-[#003A70]">
                <Calendar className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">
                    Previsão de Produção Programada (PCP):
                  </strong>
                  <span>{resultado.produto.previsaoPcp}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Histórico Recente de Consultas Auditadas */}
      {historicoConsultas.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <History className="w-4 h-4 text-slate-500" />
            Últimas Consultas Auditadas nesta Sessão
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {historicoConsultas.map((h, i) => (
              <div
                key={i}
                onClick={() => {
                  setTermo(h.codigo)
                  handleConsultar(h.codigo)
                }}
                className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs cursor-pointer hover:border-[#003A70] transition-colors"
              >
                <div>
                  <span className="font-mono font-bold text-[#003A70]">{h.codigo}</span>
                  <span className="text-slate-600 block text-[11px] truncate max-w-[200px]">
                    {h.descricao}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-800">
                    {h.disponivelTons.toLocaleString('pt-BR', { minimumFractionDigits: 1 })} t
                  </span>
                  <span className="text-[10px] text-slate-400 block">{h.hora}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
