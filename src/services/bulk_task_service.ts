// src/services/bulk_task_service.ts
// Gerencia a criação e controle de tarefas em lote e individuais (UMA TAREFA POR CLIENTE)

import { crmStorage } from '@/lib/crm-storage'
import {
  mockInitialTasks,
  mockInitialBatches,
  mockInitialAuditLogs,
} from '@/data/mockCommercialExecutionData'
import type {
  CommercialTask,
  BulkTaskBatch,
  AIAuditLog,
  TaskType,
  PriorityLevel,
  ActionOriginType,
} from '@/types/commercial_execution'
import type { CustomerManagementItem } from '@/types/customer_management'

const STORAGE_KEY_TASKS = 'ciafal_crm_commercial_tasks_v1'
const STORAGE_KEY_BATCHES = 'ciafal_crm_task_batches_v1'
const STORAGE_KEY_AUDIT = 'ciafal_crm_ai_audit_logs_v1'

class BulkTaskService {
  private getStored<T>(key: string, fallback: T): T {
    return crmStorage.getJSON<T>(key, fallback)
  }

  private setStored<T>(key: string, data: T) {
    crmStorage.setJSON(key, data)
  }

  public getTasks(): CommercialTask[] {
    return this.getStored<CommercialTask[]>(STORAGE_KEY_TASKS, mockInitialTasks)
  }

  public saveTasks(tasks: CommercialTask[]): void {
    this.setStored(STORAGE_KEY_TASKS, tasks)
  }

  public getBatches(): BulkTaskBatch[] {
    return this.getStored<BulkTaskBatch[]>(STORAGE_KEY_BATCHES, mockInitialBatches)
  }

  public saveBatches(batches: BulkTaskBatch[]): void {
    this.setStored(STORAGE_KEY_BATCHES, batches)
  }

  public getAuditLogs(): AIAuditLog[] {
    return this.getStored<AIAuditLog[]>(STORAGE_KEY_AUDIT, mockInitialAuditLogs)
  }

  public saveAuditLogs(logs: AIAuditLog[]): void {
    this.setStored(STORAGE_KEY_AUDIT, logs)
  }

  /**
   * Registra um log de auditoria da IA
   */
  public logAIAudit(log: Omit<AIAuditLog, 'id' | 'dataHora'>) {
    const logs = this.getAuditLogs()
    const newLog: AIAuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      dataHora: new Date().toLocaleString('pt-BR'),
      ...log,
    }
    this.saveAuditLogs([newLog, ...logs])
  }

  /**
   * GERAÇÃO DE MENSAGEM SUGERIDA HIPER-PERSONALIZADA PELA IA
   * Considera nome, histórico, produto, última compra, volume, perfil, segmento, região, estoque, cobertura, ISC e relacionamento.
   * NUNCA gera texto genérico igual para todos.
   */
  public generatePersonalizedAIMessage(
    cliente: CustomerManagementItem,
    tipoTarefa: TaskType,
    produto?: { descricao: string; familia: string; saldoEstoqueTons?: number },
  ): string {
    const nome = cliente.nomeFantasia || cliente.razaoSocial
    const cidade = cliente.cidade
    const segmento = cliente.segmento
    const produtoNome =
      produto?.descricao || cliente.produtosSugeridos[0]?.descricao || 'Aços Estruturais'
    const diasSemCompra = cliente.diasSemCompra
    const diasSemContato = cliente.diasSemContato
    const isc = cliente.isc

    // Personalização baseada no contexto operacional
    if (tipoTarefa === 'whatsapp') {
      if (diasSemCompra > 60) {
        return `Olá, equipe ${nome}! Tudo bem? Aqui é a CIAFAL Ferro & Aço. Observamos que sua última reposição de ${produtoNome} foi há ${diasSemCompra} dias. Temos disponibilidade imediata em pátio com frete programado para ${cidade}. Conseguimos garantir condições especiais de lote nesta semana. Podemos simular uma cotação?`
      }
      if (isc < 75) {
        return `Olá, ${nome}! Gostaríamos de alinhar nosso cronograma de entregas em ${cidade} para garantir pontualidade total no seu próximo pedido de ${produtoNome}. Como estão suas demandas para os próximos dias?`
      }
      return `Olá, ${nome}! Temos um lote recém-chegado de ${produtoNome} com certificação e pronta entrega para seu segmento (${segmento}) em ${cidade}. Gostaria de receber o espelho técnico atualizado?`
    }

    if (tipoTarefa === 'ligacao') {
      return `Pauta da ligação para ${nome}: 1) Alinhar reposição de ${produtoNome} (última compra há ${diasSemCompra}d); 2) Verificar índice de satisfação (ISC atual: ${isc}/100); 3) Apresentar condição de frete consolidado para ${cidade}; 4) Ofertar cross-sell com ${cliente.produtosSugeridos[1]?.descricao || 'Perfis e Chapas'}.`
    }

    if (tipoTarefa === 'email') {
      return `Prezados da ${nome},\n\nA CIAFAL Ferro & Aço preparou uma condição especial para abastecimento de ${produtoNome} diretamente em sua unidade de ${cidade} (${cliente.uf}). Com histórico de consumo no setor de ${segmento}, disponibilizamos lote com faturamento imediato e condições diferenciadas de prazo.\n\nAguardamos seu retorno para envio da proposta formalizada.`
    }

    if (tipoTarefa === 'envio_catalogo') {
      return `Catálogo personalizado gerado pela IA CIAFAL para ${nome} (${segmento}), priorizando ${produtoNome}, aços estruturais de alta demanda e itens com estoque imediato em ${cidade}.`
    }

    return `Abordagem consultiva para ${nome}: Apresentar disponibilidade de ${produtoNome} em ${cidade}, resgatando histórico de compras (${diasSemCompra} dias sem compra) e fortalecendo relacionamento comercial.`
  }

  /**
   * CRIAÇÃO DE TAREFAS EM LOTE:
   * Cria UMA TAREFA INDEPENDENTE POR CLIENTE (10 clientes -> 10 tarefas).
   * Garante idempotência: se a mesma tarefa já existir para o cliente no lote, não duplica.
   */
  public createBulkTasks(params: {
    batchName: string
    origem: ActionOriginType
    clientes: CustomerManagementItem[]
    tipo: TaskType
    dataPrazo: string
    prioridade: PriorityLevel
    responsavelId: string
    responsavelNome: string
    atribuidoPorId: string
    atribuidoPorNome: string
    observacaoGeral?: string
    campanhaId?: string
    campanhaNome?: string
    produtoSugeridoGeral?: {
      codigo: string
      descricao: string
      familia: string
      saldoEstoqueTons?: number
    }
  }): { batch: BulkTaskBatch; createdTasks: CommercialTask[] } {
    const existingTasks = this.getTasks()
    const existingBatches = this.getBatches()

    const batchId = `batch-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`
    const createdTasks: CommercialTask[] = []
    const todayStr = new Date().toLocaleDateString('pt-BR')

    for (const cliente of params.clientes) {
      // Idempotência por cliente e lote
      const alreadyExists = existingTasks.some(
        (t) =>
          t.clienteId === cliente.id &&
          t.tipo === params.tipo &&
          t.status !== 'concluida' &&
          t.status !== 'cancelada' &&
          t.dataCriacao === todayStr,
      )

      if (alreadyExists) {
        continue
      }

      const prod =
        params.produtoSugeridoGeral ||
        (cliente.produtosSugeridos && cliente.produtosSugeridos[0]
          ? {
              codigo: cliente.produtosSugeridos[0].codigo,
              descricao: cliente.produtosSugeridos[0].descricao,
              familia: cliente.produtosSugeridos[0].familia,
              saldoEstoqueTons: cliente.produtosSugeridos[0].saldoEstoqueTons,
            }
          : undefined)

      const mensagemSugerida = this.generatePersonalizedAIMessage(cliente, params.tipo, prod)

      const newTask: CommercialTask = {
        id: `tsk-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        batchId,
        batchName: params.batchName,
        clienteId: cliente.id,
        clienteNome: cliente.nomeFantasia || cliente.razaoSocial,
        clienteCidadeUf: `${cliente.cidade} - ${cliente.uf}`,
        clienteSegmento: cliente.segmento,
        contatoNome: cliente.contatosHistorico[0]?.autor || 'Comprador Comercial',
        tipo: params.tipo,
        dataCriacao: todayStr,
        dataPrazo: params.dataPrazo,
        prioridade: params.prioridade,
        responsavelId: params.responsavelId,
        responsavelNome: params.responsavelNome,
        atribuidoPorId: params.atribuidoPorId,
        atribuidoPorNome: params.atribuidoPorNome,
        status: 'pendente',
        mensagemSugeridaIA: mensagemSugerida,
        produtoSugerido: prod,
        observacao: params.observacaoGeral,
        origem: params.origem,
        campanhaId: params.campanhaId,
        campanhaNome: params.campanhaNome,
        is_mock: true,
      }

      createdTasks.push(newTask)
    }

    const newBatch: BulkTaskBatch = {
      id: batchId,
      nome: params.batchName,
      origem: params.origem,
      campanhaId: params.campanhaId,
      criadoEm: todayStr,
      prazoOriginal: params.dataPrazo,
      responsavelId: params.responsavelId,
      responsavelNome: params.responsavelNome,
      totalTarefas: createdTasks.length,
      concluidas: 0,
      pendentes: createdTasks.length,
      vencidas: 0,
      canceladas: 0,
      conversaoPercent: 0,
      volumeConvertidoTons: 0,
      faturamentoConvertido: 0,
      is_mock: true,
    }

    this.saveTasks([...createdTasks, ...existingTasks])
    this.saveBatches([newBatch, ...existingBatches])

    // Log de auditoria da IA
    this.logAIAudit({
      recomendacaoId: `rec-batch-${batchId}`,
      clienteId: createdTasks.map((t) => t.clienteId).join(','),
      clienteNome: `${createdTasks.length} clientes da carteira`,
      tipoAcao: 'CRIAÇÃO_TAREFAS_LOTE',
      algoritmoVersao: 'CIAFAL-BULK-EXECUTION-v1.0',
      dadosUtilizados: `Origem: ${params.origem}; Tipo: ${params.tipo}; Prioridade: ${params.prioridade}`,
      usuarioExecutor: `${params.atribuidoPorNome} → ${params.responsavelNome}`,
      acaoExecutada: `Criação de ${createdTasks.length} tarefas individualizadas no lote "${params.batchName}"`,
      resultadoRegistrado: 'Tarefas distribuídas na fila comercial',
    })

    return { batch: newBatch, createdTasks }
  }

  /**
   * REATRIBUIÇÃO DE TAREFAS EM LOTE COM AUDITORIA
   * Gestor pode reatribuir tarefas (ex: vendedor ausente -> outro) sem perder histórico
   */
  public reassignTasksInBulk(
    taskIds: string[],
    newResponsavelId: string,
    newResponsavelNome: string,
    usuarioGestor: string,
    justificativa = 'Reatribuição de carteira / cobertura comercial',
  ): void {
    const tasks = this.getTasks()
    const todayStr = new Date().toLocaleString('pt-BR')

    const updatedTasks = tasks.map((t) => {
      if (taskIds.includes(t.id)) {
        const historico = t.historicoAlteracoes || []
        return {
          ...t,
          responsavelId: newResponsavelId,
          responsavelNome: newResponsavelNome,
          historicoAlteracoes: [
            ...historico,
            {
              data: todayStr,
              usuario: usuarioGestor,
              campoAlterado: 'responsavelNome',
              valorAnterior: t.responsavelNome,
              valorNovo: newResponsavelNome,
              justificativa,
            },
          ],
        }
      }
      return t
    })

    this.saveTasks(updatedTasks)
  }

  /**
   * ALTERAÇÃO DE PRAZO EM LOTE COM HISTÓRICO
   */
  public updateDueDateInBulk(
    taskIds: string[],
    newDueDate: string,
    usuarioGestor: string,
    justificativa = 'Ajuste de cadência operacional',
  ): void {
    const tasks = this.getTasks()
    const todayStr = new Date().toLocaleString('pt-BR')

    const updatedTasks = tasks.map((t) => {
      if (taskIds.includes(t.id)) {
        const historico = t.historicoAlteracoes || []
        return {
          ...t,
          dataPrazo: newDueDate,
          historicoAlteracoes: [
            ...historico,
            {
              data: todayStr,
              usuario: usuarioGestor,
              campoAlterado: 'dataPrazo',
              valorAnterior: t.dataPrazo,
              valorNovo: newDueDate,
              justificativa,
            },
          ],
        }
      }
      return t
    })

    this.saveTasks(updatedTasks)
  }

  /**
   * Concluir tarefa e registrar desfecho comercial
   */
  public completeTask(
    taskId: string,
    desfecho: {
      respostaCliente?: {
        conteudo: string
        sentimento: 'positivo' | 'negativo' | 'neutro' | 'duvida' | 'cotacao_solicitada'
        canal: 'whatsapp' | 'email' | 'omnichannel'
      }
      cotacaoGeradaId?: string
      oportunidadeGeradaId?: string
      pedidoSapGeradoId?: string
      valorConvertido?: number
      volumeConvertidoTons?: number
    },
  ): void {
    const tasks = this.getTasks()
    const idx = tasks.findIndex((t) => t.id === taskId)
    if (idx === -1) return

    const task = tasks[idx]
    const todayStr = new Date().toLocaleDateString('pt-BR')

    task.status = 'concluida'
    task.dataConclusao = todayStr
    if (desfecho.respostaCliente) {
      task.respostaCliente = {
        data: todayStr,
        ...desfecho.respostaCliente,
      }
    }
    if (desfecho.cotacaoGeradaId) task.cotacaoGeradaId = desfecho.cotacaoGeradaId
    if (desfecho.oportunidadeGeradaId) task.oportunidadeGeradaId = desfecho.oportunidadeGeradaId
    if (desfecho.pedidoSapGeradoId) task.pedidoSapGeradoId = desfecho.pedidoSapGeradoId
    if (desfecho.valorConvertido) task.valorConvertido = desfecho.valorConvertido
    if (desfecho.volumeConvertidoTons) task.volumeConvertidoTons = desfecho.volumeConvertidoTons

    tasks[idx] = task
    this.saveTasks(tasks)

    // Atualiza contadores do lote se existir
    if (task.batchId) {
      const batches = this.getBatches()
      const bIdx = batches.findIndex((b) => b.id === task.batchId)
      if (bIdx !== -1) {
        const batch = batches[bIdx]
        const batchTasks = tasks.filter((t) => t.batchId === batch.id)
        batch.concluidas = batchTasks.filter((t) => t.status === 'concluida').length
        batch.pendentes = batchTasks.filter((t) => t.status === 'pendente').length
        batch.vencidas = batchTasks.filter((t) => t.status === 'vencida').length
        batch.volumeConvertidoTons = batchTasks.reduce(
          (acc, t) => acc + (t.volumeConvertidoTons || 0),
          0,
        )
        batch.faturamentoConvertido = batchTasks.reduce(
          (acc, t) => acc + (t.valorConvertido || 0),
          0,
        )
        batch.conversaoPercent =
          batch.totalTarefas > 0 ? Math.round((batch.concluidas / batch.totalTarefas) * 100) : 0
        batches[bIdx] = batch
        this.saveBatches(batches)
      }
    }
  }
}

export const bulkTaskService = new BulkTaskService()
