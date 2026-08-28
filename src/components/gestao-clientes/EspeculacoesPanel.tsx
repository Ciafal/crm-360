// src/components/gestao-clientes/EspeculacoesPanel.tsx
import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sparkles,
  PlusCircle,
  Clock,
  TrendingUp,
  Target,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
} from 'lucide-react'
import type { EspeculacaoItem, EspeculacaoStatus } from '@/types/customer_management'
import { customerManagementService } from '@/services/customer_management_service'
import { toast } from 'sonner'

interface EspeculacoesPanelProps {
  especulacoes: EspeculacaoItem[]
  onUpdateList: () => void
}

export function EspeculacoesPanel({ especulacoes, onUpdateList }: EspeculacoesPanelProps) {
  const [newModalOpen, setNewModalOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<EspeculacaoItem>>({
    clienteNome: 'Metalúrgica Santa Rita',
    clienteSap: '100001',
    contatoNome: 'Eng. Marcelo Queiroz',
    vendedorNome: 'Carlos Mendonça',
    produtoCodigo: 'PER-W-200-22',
    produtoDescricao: 'Perfil W 200 x 22.5 kg/m ASTM A572',
    quantidadeEstimadaTons: 30.0,
    periodoProvavel: 'Novembro/2024',
    probabilidade: 70,
    precoComentadoKg: 8.3,
    concorrente: 'Gerdau Comercial',
    observacao: '',
    proximaAcao: 'Checar reserva técnica no PCP',
    validadeData: '15/11/2024',
    status: 'Identificada',
  })

  const handleSaveEspeculacao = () => {
    if (!formData.produtoDescricao || !formData.clienteNome) {
      toast.error('Preencha os dados obrigatórios da especulação.')
      return
    }

    const newItem: EspeculacaoItem = {
      id: `esp-${Date.now()}`,
      clienteId: 'cli-001',
      clienteNome: formData.clienteNome || 'Cliente',
      clienteSap: formData.clienteSap || '100001',
      contatoNome: formData.contatoNome || 'Comprador',
      vendedorId: 'qas-vendedor_teste',
      vendedorNome: formData.vendedorNome || 'Carlos Mendonça',
      produtoCodigo: formData.produtoCodigo || 'PER-W-200-22',
      produtoDescricao: formData.produtoDescricao || 'Produto',
      familia: 'Perfis Estruturais',
      quantidadeEstimadaTons: Number(formData.quantidadeEstimadaTons) || 10,
      periodoProvavel: formData.periodoProvavel || 'Próximo Mês',
      probabilidade: Number(formData.probabilidade) || 50,
      precoComentadoKg: Number(formData.precoComentadoKg) || 7.0,
      concorrente: formData.concorrente || '',
      observacao: formData.observacao || '',
      proximaAcao: formData.proximaAcao || 'Follow-up',
      validadeData: formData.validadeData || '30/11/2024',
      status: (formData.status as EspeculacaoStatus) || 'Identificada',
      criadoEm: new Date().toLocaleDateString('pt-BR'),
      atualizadoEm: new Date().toLocaleDateString('pt-BR'),
      is_mock: true,
    }

    customerManagementService.saveEspeculacoes([newItem, ...especulacoes])
    toast.success('Especulação comercial registrada com sucesso!')
    setNewModalOpen(false)
    onUpdateList()
  }

  const handleAdvanceStatus = (item: EspeculacaoItem) => {
    const nextStatusMap: Record<EspeculacaoStatus, EspeculacaoStatus> = {
      Identificada: 'Investigação',
      Investigação: 'Qualificada',
      Qualificada: 'Oportunidade',
      Oportunidade: 'Cotação',
      Cotação: 'Oportunidade',
      Perdida: 'Perdida',
      'Sem evolução': 'Sem evolução',
      Expirada: 'Expirada',
    }

    const nextStatus = nextStatusMap[item.status] || item.status
    const updated = especulacoes.map((e) =>
      e.id === item.id
        ? { ...e, status: nextStatus, atualizadoEm: new Date().toLocaleDateString('pt-BR') }
        : e,
    )
    customerManagementService.saveEspeculacoes(updated)
    toast.success(`Especulação avançada para etapa: "${nextStatus}"!`, {
      description:
        nextStatus === 'Cotação'
          ? 'Gerando proposta formal vinculada ao PCP e estoque.'
          : undefined,
    })
    onUpdateList()
  }

  return (
    <div className="space-y-4 text-slate-100">
      {/* 1. CABEÇALHO */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Gestão de Especulações Comerciais
              <Badge className="bg-amber-500 text-slate-950 text-[10px] font-bold">
                Demanda Não Formalizada
              </Badge>
            </h3>
            <p className="text-xs text-slate-400">
              Mapeamento proativo de projetos futuros, consultas informais, concorrentes e
              sazonalidade para antecipação ao PCP.
            </p>
          </div>
        </div>

        <Button
          size="sm"
          onClick={() => setNewModalOpen(true)}
          className="h-9 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-2xl gap-1.5 shadow-sm"
        >
          <PlusCircle className="w-4 h-4" /> Nova Especulação
        </Button>
      </div>

      {/* 2. GRID DE ESPECULAÇÕES (Regras 46, 47, 48) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {especulacoes.map((esp) => (
          <Card
            key={esp.id}
            className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 transition-all flex flex-col justify-between gap-3 shadow-xs"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge className="bg-slate-950 text-amber-300 border-amber-500/40 text-[10px] font-mono">
                  {esp.status}
                </Badge>
                <span className="text-[10px] font-mono text-slate-400">
                  Probabilidade: <strong className="text-emerald-400">{esp.probabilidade}%</strong>
                </span>
              </div>

              <div>
                <strong className="text-sm font-bold text-white block leading-snug">
                  {esp.clienteNome}
                </strong>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Contato: {esp.contatoNome} · Vendedor: {esp.vendedorNome}
                </span>
              </div>

              <div className="p-2.5 bg-slate-950 rounded-xl text-xs space-y-1 border border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-400">Produto:</span>
                  <strong className="text-slate-200">{esp.produtoDescricao}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Volume Estimado:</span>
                  <strong className="text-sky-300 font-mono">{esp.quantidadeEstimadaTons} t</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Período Provável:</span>
                  <strong className="text-slate-200">{esp.periodoProvavel}</strong>
                </div>
                {esp.precoComentadoKg && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Preço Alvo:</span>
                    <strong className="text-emerald-400 font-mono">
                      R$ {esp.precoComentadoKg.toFixed(2)} / kg
                    </strong>
                  </div>
                )}
                {esp.concorrente && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Concorrente Citado:</span>
                    <span className="text-rose-300">{esp.concorrente}</span>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-slate-300 leading-snug">
                <strong className="text-slate-400">Observação:</strong> {esp.observacao}
              </p>

              <div className="text-[11px] text-sky-300 pt-1 border-t border-slate-800">
                <strong className="text-slate-400 block text-[10px] uppercase">
                  Próxima Ação:
                </strong>
                {esp.proximaAcao}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <Button
                size="sm"
                onClick={() => handleAdvanceStatus(esp)}
                className="w-full h-8 text-xs bg-slate-800 hover:bg-slate-700 text-sky-300 font-semibold rounded-xl gap-1.5"
              >
                <span>Avançar Etapa →</span>
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* MODAL NOVA ESPECULAÇÃO */}
      <Dialog open={newModalOpen} onOpenChange={setNewModalOpen}>
        <DialogContent className="bg-slate-950 text-slate-100 border border-slate-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-serif text-white">
              Cadastrar Nova Especulação Comercial
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Registre uma necessidade preliminar mapeada em conversas informais com o cliente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Cliente
                </label>
                <Input
                  value={formData.clienteNome}
                  onChange={(e) => setFormData({ ...formData, clienteNome: e.target.value })}
                  className="bg-slate-900 border-slate-800 text-xs rounded-xl"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Contato do Cliente
                </label>
                <Input
                  value={formData.contatoNome}
                  onChange={(e) => setFormData({ ...formData, contatoNome: e.target.value })}
                  className="bg-slate-900 border-slate-800 text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Produto / Bitola
                </label>
                <Input
                  value={formData.produtoDescricao}
                  onChange={(e) => setFormData({ ...formData, produtoDescricao: e.target.value })}
                  className="bg-slate-900 border-slate-800 text-xs rounded-xl"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Quantidade (t)
                </label>
                <Input
                  type="number"
                  value={formData.quantidadeEstimadaTons}
                  onChange={(e) =>
                    setFormData({ ...formData, quantidadeEstimadaTons: Number(e.target.value) })
                  }
                  className="bg-slate-900 border-slate-800 text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Período Provável
                </label>
                <Input
                  value={formData.periodoProvavel}
                  onChange={(e) => setFormData({ ...formData, periodoProvavel: e.target.value })}
                  className="bg-slate-900 border-slate-800 text-xs rounded-xl"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Concorrente Citado
                </label>
                <Input
                  value={formData.concorrente}
                  onChange={(e) => setFormData({ ...formData, concorrente: e.target.value })}
                  className="bg-slate-900 border-slate-800 text-xs rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Observações do Comprador
              </label>
              <textarea
                rows={2}
                value={formData.observacao}
                onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs text-slate-100"
                placeholder="Ex.: Cliente aguarda liberação de verba orçamentária do projeto..."
              />
            </div>

            <Button
              onClick={handleSaveEspeculacao}
              className="w-full h-9 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl mt-2"
            >
              Gravar Especulação
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
