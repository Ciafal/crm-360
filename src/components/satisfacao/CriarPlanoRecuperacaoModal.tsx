import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertTriangle, PlusCircle, ShieldAlert, Sparkles } from 'lucide-react'
import { ClienteSatisfacao360, PlanoRecuperacao } from '@/types/satisfaction'
import { toast } from 'sonner'

interface CriarPlanoRecuperacaoModalProps {
  open: boolean
  onClose: () => void
  clientes: ClienteSatisfacao360[]
  clientePreselecionado?: ClienteSatisfacao360 | null
  onSubmit: (plano: Omit<PlanoRecuperacao, 'id' | 'criadoEm' | 'atualizadoEm' | 'is_mock'>) => void
}

export function CriarPlanoRecuperacaoModal({
  open,
  onClose,
  clientes,
  clientePreselecionado,
  onSubmit,
}: CriarPlanoRecuperacaoModalProps) {
  const [selectedClientId, setSelectedClientId] = useState<string>(
    clientePreselecionado?.id || clientes[0]?.id || '',
  )
  const [problema, setProblema] = useState(
    clientePreselecionado?.impactosNegativos[0] ||
      'Deterioração relevante de relacionamento e queda de ISC.',
  )
  const [situacao, setSituacao] = useState(
    clientePreselecionado?.analiseIA?.situacaoAtual ||
      'Cliente em risco iminente de perda comercial.',
  )
  const [causaRaiz, setCausaRaiz] = useState(
    clientePreselecionado?.analiseIA?.possiveisCausas[0] ||
      'Atrasos logísticos e falta de proatividade comercial.',
  )
  const [resultadoEsperado, setResultadoEsperado] = useState(
    'Recuperar ISC para faixa ≥ 80 e restabelecer fornecimento de volume regular.',
  )
  const [prazoFinal, setPrazoFinal] = useState('2024-11-30')
  const [area, setArea] = useState<
    'Comercial' | 'Logística' | 'Qualidade' | 'Financeiro' | 'Multidisciplinar'
  >('Multidisciplinar')

  // 1 ação inicial sugerida
  const [acao1Desc, setAcao1Desc] = useState(
    clientePreselecionado?.analiseIA?.proximaMelhorAcao?.acao ||
      'Visita presencial técnica e comercial conjunta.',
  )
  const [acao1Resp, setAcao1Resp] = useState(
    clientePreselecionado?.vendedorNome || 'Carlos Mendonça',
  )
  const [acao1Prazo, setAcao1Prazo] = useState('2024-10-25')

  const selectedCliente =
    clientes.find((c) => c.id === selectedClientId) || clientePreselecionado || clientes[0]

  const handleSubmit = () => {
    if (!selectedCliente) {
      toast.error('Selecione um cliente para criar o plano.')
      return
    }

    if (!problema.trim() || !resultadoEsperado.trim()) {
      toast.error('Preencha os campos obrigatórios (Problema e Resultado Esperado).')
      return
    }

    onSubmit({
      clienteId: selectedCliente.id,
      clienteNome: selectedCliente.razaoSocial,
      clienteSap: selectedCliente.sapCode,
      vendedorId: selectedCliente.vendedorId,
      vendedorNome: selectedCliente.vendedorNome,
      gestorNome: selectedCliente.gestorNome,
      status: 'PLANO_DEFINIDO',
      prazoFinal,
      problemaIdentificado: problema,
      situacaoAtual: situacao,
      evidenciasFatos:
        selectedCliente.impactosNegativos.length > 0
          ? selectedCliente.impactosNegativos
          : ['Queda acentuada de ISC oficial'],
      causaRaiz,
      acoesPropostas: [
        {
          id: `ac-${Date.now()}-1`,
          descricao: acao1Desc,
          responsavel: acao1Resp,
          areaEnvolvida: 'Comercial',
          prazo: acao1Prazo,
          concluida: false,
        },
      ],
      resultadoEsperado,
      areaPrincipalEnvolvida: area,
      iscNoMomentoCriacao: selectedCliente.iscAtual,
      iscAtual: selectedCliente.iscAtual,
      variacaoISC: 0,
      volumeRecuperadoTons: 0,
      novasComprasRealizadas: false,
      reincidenciaOcorrencia: false,
      historicoExecucoes: [
        {
          data: new Date().toISOString().replace('T', ' ').slice(0, 16),
          responsavel: selectedCliente.gestorNome || 'Gerência Comercial',
          acao: 'Abertura e estruturação do plano de recuperação',
          resultado: 'Plano formalizado com metas de curto prazo acordadas.',
          proximaAcao: acao1Desc,
        },
      ],
    })

    toast.success(`Plano de Recuperação criado com sucesso para ${selectedCliente.razaoSocial}!`)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-2xl bg-slate-950 text-slate-100 border-slate-800 rounded-3xl max-h-[92vh] overflow-y-auto p-6">
        <DialogHeader className="space-y-1 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-white font-serif">
                Criar Plano de Recuperação de Cliente (Risco / Crítico)
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Formalize as ações, causas, prazos e métricas de eficácia do ISC.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* SELEÇÃO DO CLIENTE */}
          <div>
            <Label className="text-xs text-slate-300">Cliente em Risco/Crítico *</Label>
            <Select value={selectedClientId} onValueChange={setSelectedClientId}>
              <SelectTrigger className="bg-slate-900 border-slate-800 text-xs rounded-xl mt-1 text-white">
                <SelectValue placeholder="Selecione o cliente..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-white">
                {clientes.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="text-xs">
                    {c.razaoSocial} (SAP #{c.sapCode}) — ISC {c.iscAtual}/100 [{c.faixaISC}]
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* PROBLEMA IDENTIFICADO */}
          <div>
            <Label className="text-xs text-slate-300">Problema Identificado *</Label>
            <Input
              value={problema}
              onChange={(e) => setProblema(e.target.value)}
              className="bg-slate-900 border-slate-800 text-xs rounded-xl mt-1 text-white"
              placeholder="Ex: Queda brusca de volume após 2 entregas atrasadas e SAC aberto"
            />
          </div>

          {/* SITUAÇÃO ATUAL */}
          <div>
            <Label className="text-xs text-slate-300">Situação Atual & Evidências</Label>
            <Textarea
              value={situacao}
              onChange={(e) => setSituacao(e.target.value)}
              className="bg-slate-900 border-slate-800 text-xs rounded-xl mt-1 text-white"
              rows={2}
            />
          </div>

          {/* CAUSA RAIZ & ÁREA ENVOLVIDA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-slate-300">Causa Raiz</Label>
              <Input
                value={causaRaiz}
                onChange={(e) => setCausaRaiz(e.target.value)}
                className="bg-slate-900 border-slate-800 text-xs rounded-xl mt-1 text-white"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-300">Área Principal Envolvida</Label>
              <Select value={area} onValueChange={(val: any) => setArea(val)}>
                <SelectTrigger className="bg-slate-900 border-slate-800 text-xs rounded-xl mt-1 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-white">
                  <SelectItem value="Multidisciplinar">Multidisciplinar</SelectItem>
                  <SelectItem value="Comercial">Comercial</SelectItem>
                  <SelectItem value="Logística">Logística</SelectItem>
                  <SelectItem value="Qualidade">Qualidade</SelectItem>
                  <SelectItem value="Financeiro">Financeiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* PRIMEIRA AÇÃO PROPOSTA */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider block">
              Primeira Ação Imediata do Plano
            </span>
            <div>
              <Label className="text-[11px] text-slate-300">Descrição da Ação</Label>
              <Input
                value={acao1Desc}
                onChange={(e) => setAcao1Desc(e.target.value)}
                className="bg-slate-950 border-slate-800 text-xs rounded-xl mt-1 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[11px] text-slate-300">Responsável</Label>
                <Input
                  value={acao1Resp}
                  onChange={(e) => setAcao1Resp(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-xs rounded-xl mt-1 text-white"
                />
              </div>
              <div>
                <Label className="text-[11px] text-slate-300">Prazo da Ação</Label>
                <Input
                  type="date"
                  value={acao1Prazo}
                  onChange={(e) => setAcao1Prazo(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-xs rounded-xl mt-1 text-white"
                />
              </div>
            </div>
          </div>

          {/* RESULTADO ESPERADO & PRAZO FINAL */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Label className="text-xs text-slate-300">Resultado Esperado *</Label>
              <Input
                value={resultadoEsperado}
                onChange={(e) => setResultadoEsperado(e.target.value)}
                className="bg-slate-900 border-slate-800 text-xs rounded-xl mt-1 text-white"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-300">Prazo Final do Plano</Label>
              <Input
                type="date"
                value={prazoFinal}
                onChange={(e) => setPrazoFinal(e.target.value)}
                className="bg-slate-900 border-slate-800 text-xs rounded-xl mt-1 text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <Button variant="ghost" size="sm" onClick={onClose} className="text-xs text-slate-400">
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              className="text-xs bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-semibold shadow-xs"
            >
              Criar e Ativar Plano
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
