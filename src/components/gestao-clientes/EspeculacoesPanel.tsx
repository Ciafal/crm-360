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
import { Sparkles, PlusCircle } from 'lucide-react'
import type { EspeculacaoItem, EspeculacaoStatus } from '@/types/customer_management'
import { customerManagementService } from '@/services/customer_management_service'
import { toast } from 'sonner'
import { StatusBadge } from './shared/GestaoClientesUiKit'

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
    <div className="space-y-4 text-slate-900">
      {/* 1. CABEÇALHO (Fundo Claro / Azul CIAFAL) */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#003A70]/10 text-[#003A70] border border-[#003A70]/20 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-serif text-base sm:text-lg font-bold text-[#003A70] tracking-tight">
                Gestão de Especulações Comerciais
              </h3>
              <Badge
                variant="outline"
                className="bg-[#EBF3FA] text-[#003A70] border-[#003A70]/30 text-[10px] font-medium"
              >
                Demanda Não Formalizada
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Mapeamento proativo de projetos futuros, consultas informais, concorrentes e
              sazonalidade para antecipação ao PCP.
            </p>
          </div>
        </div>

        <Button
          size="sm"
          onClick={() => setNewModalOpen(true)}
          className="h-9 bg-[#003A70] hover:bg-[#002850] text-white text-xs font-semibold rounded-xl gap-1.5 shadow-2xs"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Nova Especulação</span>
        </Button>
      </div>

      {/* 2. GRID DE ESPECULAÇÕES (Padronizado CIAFAL) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {especulacoes.map((esp) => (
          <Card
            key={esp.id}
            className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#003A70]/40 transition-all flex flex-col justify-between gap-3 shadow-2xs text-slate-900"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <StatusBadge label={esp.status} variant="default" dot />
                <span className="text-[10px] font-mono text-slate-500">
                  Probabilidade:{' '}
                  <strong className="text-emerald-800 font-bold">{esp.probabilidade}%</strong>
                </span>
              </div>

              <div>
                <strong className="text-sm font-bold text-slate-900 block leading-snug line-clamp-1">
                  {esp.clienteNome}
                </strong>
                <span className="text-[11px] text-slate-500 block mt-0.5 truncate">
                  Contato: {esp.contatoNome} · Vendedor: {esp.vendedorNome}
                </span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl text-xs space-y-1 border border-slate-200/80">
                <div className="flex justify-between">
                  <span className="text-slate-500">Produto:</span>
                  <strong className="text-slate-800 truncate max-w-[170px]">
                    {esp.produtoDescricao}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Volume Estimado:</span>
                  <strong className="text-[#003A70] font-mono font-bold">
                    {esp.quantidadeEstimadaTons} t
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Período Provável:</span>
                  <strong className="text-slate-700">{esp.periodoProvavel}</strong>
                </div>
                {esp.precoComentadoKg && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Preço Alvo:</span>
                    <strong className="text-emerald-800 font-mono font-bold">
                      R$ {esp.precoComentadoKg.toFixed(2)} / kg
                    </strong>
                  </div>
                )}
                {esp.concorrente && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Concorrente Citado:</span>
                    <span className="text-slate-700 font-medium">{esp.concorrente}</span>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-slate-600 leading-snug line-clamp-2">
                <strong className="text-slate-700">Observação:</strong>{' '}
                {esp.observacao || 'Nenhuma observação informada.'}
              </p>

              <div className="text-[11px] text-[#003A70] pt-1.5 border-t border-slate-100">
                <strong className="text-slate-500 block text-[10px] uppercase font-bold">
                  Próxima Ação:
                </strong>
                <span className="font-medium">{esp.proximaAcao}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <Button
                size="sm"
                onClick={() => handleAdvanceStatus(esp)}
                className="w-full h-8 text-xs bg-slate-100 hover:bg-[#EBF3FA] text-[#003A70] hover:text-[#00264D] border border-slate-200 font-semibold rounded-xl gap-1.5 shadow-none"
              >
                <span>Avançar Etapa →</span>
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* MODAL NOVA ESPECULAÇÃO */}
      <Dialog open={newModalOpen} onOpenChange={setNewModalOpen}>
        <DialogContent className="bg-white text-slate-900 border border-slate-200 max-w-lg rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-serif text-[#003A70] font-bold">
              Cadastrar Nova Especulação Comercial
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Registre uma necessidade preliminar mapeada em conversas informais com o cliente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">
                  Cliente
                </label>
                <Input
                  value={formData.clienteNome}
                  onChange={(e) => setFormData({ ...formData, clienteNome: e.target.value })}
                  className="bg-white border-slate-200 text-xs rounded-xl focus-visible:ring-[#003A70]"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">
                  Contato do Cliente
                </label>
                <Input
                  value={formData.contatoNome}
                  onChange={(e) => setFormData({ ...formData, contatoNome: e.target.value })}
                  className="bg-white border-slate-200 text-xs rounded-xl focus-visible:ring-[#003A70]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">
                  Produto / Bitola
                </label>
                <Input
                  value={formData.produtoDescricao}
                  onChange={(e) => setFormData({ ...formData, produtoDescricao: e.target.value })}
                  className="bg-white border-slate-200 text-xs rounded-xl focus-visible:ring-[#003A70]"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">
                  Quantidade (t)
                </label>
                <Input
                  type="number"
                  value={formData.quantidadeEstimadaTons}
                  onChange={(e) =>
                    setFormData({ ...formData, quantidadeEstimadaTons: Number(e.target.value) })
                  }
                  className="bg-white border-slate-200 text-xs rounded-xl focus-visible:ring-[#003A70]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">
                  Período Provável
                </label>
                <Input
                  value={formData.periodoProvavel}
                  onChange={(e) => setFormData({ ...formData, periodoProvavel: e.target.value })}
                  className="bg-white border-slate-200 text-xs rounded-xl focus-visible:ring-[#003A70]"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">
                  Concorrente Citado
                </label>
                <Input
                  value={formData.concorrente}
                  onChange={(e) => setFormData({ ...formData, concorrente: e.target.value })}
                  className="bg-white border-slate-200 text-xs rounded-xl focus-visible:ring-[#003A70]"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-slate-600 block mb-1">
                Observações do Comprador
              </label>
              <textarea
                rows={2}
                value={formData.observacao}
                onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#003A70]"
                placeholder="Ex.: Cliente aguarda liberação de verba orçamentária do projeto..."
              />
            </div>

            <Button
              onClick={handleSaveEspeculacao}
              className="w-full h-9 bg-[#003A70] hover:bg-[#002850] text-white font-semibold text-xs rounded-xl mt-2 shadow-2xs"
            >
              Gravar Especulação
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
