// src/components/central-acoes/CreateBulkTasksModal.tsx
// Modal de Criação de Tarefas em Lote (UMA TAREFA INDEPENDENTE POR CLIENTE) com Mensagem Personalizada por IA

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sparkles,
  Users,
  Calendar,
  CheckCircle2,
  PhoneCall,
  MessageSquare,
  Mail,
  Building2,
  FileSpreadsheet,
  AlertTriangle,
  Info,
} from 'lucide-react'
import type { TaskType, PriorityLevel, ActionOriginType } from '@/types/commercial_execution'
import type { CustomerManagementItem } from '@/types/customer_management'
import { bulkTaskService } from '@/services/bulk_task_service'
import { toast } from 'sonner'

interface CreateBulkTasksModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientes: CustomerManagementItem[]
  origemPadrao?: ActionOriginType
  onTasksCreated?: () => void
}

export function CreateBulkTasksModal({
  open,
  onOpenChange,
  clientes,
  origemPadrao = 'quem_devo_contatar',
  onTasksCreated,
}: CreateBulkTasksModalProps) {
  const [batchName, setBatchName] = useState(
    `Ação Comercial em Lote - ${new Date().toLocaleDateString('pt-BR')}`,
  )
  const [tipo, setTipo] = useState<TaskType>('whatsapp')
  const [prioridade, setPrioridade] = useState<PriorityLevel>('ALTA')

  // Prazo padrão: D+3 dias úteis
  const defaultDueDate = () => {
    const d = new Date()
    d.setDate(d.getDate() + 3)
    return d.toISOString().split('T')[0]
  }
  const [dataPrazo, setDataPrazo] = useState<string>(defaultDueDate())

  const [responsavelNome, setResponsavelNome] = useState('Carlos Mendonça')
  const [responsavelId, setResponsavelId] = useState('vend-01')
  const [observacaoGeral, setObservacaoGeral] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Pré-visualização da IA para o primeiro cliente da lista
  const previewClient = clientes[0]
  const previewMsg = previewClient
    ? bulkTaskService.generatePersonalizedAIMessage(previewClient, tipo)
    : ''

  const handleSubmit = () => {
    if (clientes.length === 0) {
      toast.error('Nenhum cliente selecionado para criação de tarefas.')
      return
    }

    setIsSubmitting(true)

    try {
      const { batch, createdTasks } = bulkTaskService.createBulkTasks({
        batchName,
        origem: origemPadrao,
        clientes,
        tipo,
        dataPrazo,
        prioridade,
        responsavelId,
        responsavelNome,
        atribuidoPorId: 'gest-01',
        atribuidoPorNome: 'Supervisor Comercial CIAFAL',
        observacaoGeral,
      })

      toast.success(`${createdTasks.length} tarefas individualizadas criadas com sucesso!`, {
        description: `Lote "${batch.nome}" distribuído para ${responsavelNome}.`,
      })

      onOpenChange(false)
      if (onTasksCreated) onTasksCreated()
    } catch (err) {
      toast.error('Erro ao gerar tarefas em lote.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-slate-950 text-slate-100 border-slate-800 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-2 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sky-500/20 text-sky-400 rounded-xl border border-sky-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="font-serif text-xl font-bold text-white flex items-center gap-2">
                Criar Tarefas em Lote
                <Badge className="bg-amber-500 text-slate-950 text-[10px] font-bold">
                  {clientes.length} {clientes.length === 1 ? 'Cliente' : 'Clientes'}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Regra de Governança: Cria <strong>1 tarefa independente por cliente</strong> com
                abordagem personalizada por IA. NUNCA cria tarefas genéricas agrupadas.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* 1. Nome do Lote */}
          <div className="space-y-1">
            <label className="text-slate-300 font-semibold block">
              Nome do Lote / Identificador
            </label>
            <Input
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
              className="bg-slate-900 border-slate-700 text-white h-9 rounded-xl text-xs"
              placeholder="Ex: Follow-up Carteira Metalmecânica MG"
            />
          </div>

          {/* 2. Grid de Configuração: Tipo, Prazo, Prioridade, Responsável */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-300 font-semibold block">Tipo da Tarefa</label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as TaskType)}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white h-9 rounded-xl text-xs">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 text-white border-slate-800">
                  <SelectItem value="whatsapp">WhatsApp Comercial</SelectItem>
                  <SelectItem value="ligacao">Ligação Telefônica</SelectItem>
                  <SelectItem value="email">E-mail Comercial</SelectItem>
                  <SelectItem value="visita">Visita Presencial</SelectItem>
                  <SelectItem value="envio_catalogo">Envio de Catálogo Técnico</SelectItem>
                  <SelectItem value="cotacao">Elaboração de Cotação</SelectItem>
                  <SelectItem value="acompanhamento">Acompanhamento / Follow-up</SelectItem>
                  <SelectItem value="reativacao">Reativação de Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold block">Prazo de Execução</label>
              <Input
                type="date"
                value={dataPrazo}
                onChange={(e) => setDataPrazo(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white h-9 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold block">Prioridade</label>
              <Select value={prioridade} onValueChange={(v) => setPrioridade(v as PriorityLevel)}>
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white h-9 rounded-xl text-xs">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 text-white border-slate-800">
                  <SelectItem value="URGENTE">Urgente (Hoje / D+1)</SelectItem>
                  <SelectItem value="ALTA">Alta (D+3)</SelectItem>
                  <SelectItem value="MEDIA">Média (D+5)</SelectItem>
                  <SelectItem value="BAIXA">Baixa (Rotina)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-semibold block">Vendedor Responsável</label>
              <Select
                value={responsavelId}
                onValueChange={(val) => {
                  setResponsavelId(val)
                  if (val === 'vend-01') setResponsavelNome('Carlos Mendonça')
                  else if (val === 'vend-02') setResponsavelNome('Ana Paula Rocha')
                  else if (val === 'vend-03') setResponsavelNome('Marcos Silveira')
                  else setResponsavelNome('Equipe Comercial')
                }}
              >
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white h-9 rounded-xl text-xs">
                  <SelectValue placeholder="Selecione o responsável" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 text-white border-slate-800">
                  <SelectItem value="vend-01">Carlos Mendonça (Minas Gerais / RMBH)</SelectItem>
                  <SelectItem value="vend-02">Ana Paula Rocha (Triângulo Mineiro)</SelectItem>
                  <SelectItem value="vend-03">Marcos Silveira (Vale do Aço)</SelectItem>
                  <SelectItem value="vend-todos">Distribuir para Carteira Própria</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 3. Observações Gerais */}
          <div className="space-y-1">
            <label className="text-slate-300 font-semibold block">
              Observações Estratégicas (Opcional)
            </label>
            <Input
              value={observacaoGeral}
              onChange={(e) => setObservacaoGeral(e.target.value)}
              className="bg-slate-900 border-slate-700 text-white h-9 rounded-xl text-xs"
              placeholder="Ex: Alinhar condições de frete TMS e validar estoque no SAP antes de fechar"
            />
          </div>

          {/* 4. Amostra da Mensagem Gerada por IA */}
          {previewClient && (
            <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-amber-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Exemplo de Mensagem Hiper-Personalizada pela IA
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Cliente Amostra: {previewClient.nomeFantasia || previewClient.razaoSocial}
                </span>
              </div>
              <p className="text-xs text-slate-200 bg-slate-950 p-2.5 rounded-xl border border-slate-800 leading-relaxed font-sans italic">
                "{previewMsg}"
              </p>
              <span className="text-[10px] text-slate-500 block">
                * Cada um dos {clientes.length} clientes receberá um texto adaptado com seu próprio
                produto sugerido, cidade, ISC e histórico de compras.
              </span>
            </div>
          )}

          {/* 5. Lista de Clientes Selecionados */}
          <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-2xl space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Público Selecionado ({clientes.length} clientes):
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {clientes.map((c) => (
                <span
                  key={c.id}
                  className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-sky-300 text-[10px]"
                >
                  {c.nomeFantasia || c.razaoSocial} ({c.cidade})
                </span>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-slate-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>
              Serão geradas <strong>{clientes.length} tarefas individuais</strong> no CRM.
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 text-xs border-slate-700 text-slate-300 hover:text-white rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || clientes.length === 0}
              className="h-9 text-xs bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl gap-1.5 shadow-md flex-1 sm:flex-none"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Criar {clientes.length} Tarefas em Lote</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
