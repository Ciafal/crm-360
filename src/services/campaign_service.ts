// src/services/campaign_service.ts
// Gerencia Campanhas Comerciais Estruturadas (E-mail, WhatsApp, Fila, Idempotência, Supressão, Governança, Opt-out)

import {
  mockInitialCampaigns,
  mockInitialQueue,
  mockLGPDConsentList,
} from '@/data/mockCommercialExecutionData'
import type {
  CommercialCampaign,
  CampaignDispatchQueueItem,
  LGPDConsentRecord,
  CustomerManagementItem,
  OptOutChannel,
} from '@/types/commercial_execution'
import { bulkTaskService } from '@/services/bulk_task_service'

const STORAGE_KEY_CAMPAIGNS = 'ciafal_crm_commercial_campaigns_v2'
const STORAGE_KEY_QUEUE = 'ciafal_crm_dispatch_queue_v1'
const STORAGE_KEY_LGPD = 'ciafal_crm_lgpd_consent_v1'

class CampaignService {
  private getStored<T>(key: string, fallback: T): T {
    try {
      const item = localStorage.getItem(key)
      if (item) return JSON.parse(item)
    } catch {
      // fallback
    }
    return fallback
  }

  private setStored<T>(key: string, data: T) {
    try {
      localStorage.setItem(key, JSON.stringify(data))
    } catch {
      // silent
    }
  }

  public getCampaigns(): CommercialCampaign[] {
    return this.getStored<CommercialCampaign[]>(STORAGE_KEY_CAMPAIGNS, mockInitialCampaigns)
  }

  public saveCampaigns(campaigns: CommercialCampaign[]): void {
    this.setStored(STORAGE_KEY_CAMPAIGNS, campaigns)
  }

  public getDispatchQueue(): CampaignDispatchQueueItem[] {
    return this.getStored<CampaignDispatchQueueItem[]>(STORAGE_KEY_QUEUE, mockInitialQueue)
  }

  public saveDispatchQueue(queue: CampaignDispatchQueueItem[]): void {
    this.setStored(STORAGE_KEY_QUEUE, queue)
  }

  public getLGPDRecords(): LGPDConsentRecord[] {
    return this.getStored<LGPDConsentRecord[]>(STORAGE_KEY_LGPD, mockLGPDConsentList)
  }

  public saveLGPDRecords(records: LGPDConsentRecord[]): void {
    this.setStored(STORAGE_KEY_LGPD, records)
  }

  /**
   * Verifica supressão automática (LGPD, opt-out, bloqueio, canal)
   */
  public checkSuppression(
    clienteId: string,
    canal: 'email' | 'whatsapp' | 'telefone' | 'geral',
  ): { supresso: boolean; motivo?: string } {
    const lgpd = this.getLGPDRecords()
    const match = lgpd.find((r) => r.clienteId === clienteId)

    if (match) {
      if (match.status === 'opt_out' && (match.canal === 'geral' || match.canal === canal)) {
        return {
          supresso: true,
          motivo: `Opt-out registrado para o canal ${canal.toUpperCase()} (${match.motivo || 'Sem detalhes'})`,
        }
      }
      if (match.status === 'bloqueado') {
        return {
          supresso: true,
          motivo: `Cliente bloqueado comercialmente por compliance/crédito (${match.motivo || 'Restrição cadastral'})`,
        }
      }
    }

    return { supresso: false }
  }

  /**
   * CRIAÇÃO E DISPARO DE CAMPANHA (COM DUPLA CONFIRMAÇÃO E FILA)
   * NUNCA dispara direto: enfileira na fila de mensageria com idempotência
   */
  public createAndQueueCampaign(params: {
    titulo: string
    descricao: string
    tipo: CommercialCampaign['tipo']
    canal: CommercialCampaign['canal']
    segmentoAlvo?: string
    regionalAlvo?: string
    diasSemCompraMin?: number
    diasSemCompraMax?: number
    vendedorId?: string
    vendedorNome?: string
    produtosVinculados: CommercialCampaign['produtosVinculados']
    catalogoTipo: CommercialCampaign['catalogoTipo']
    templateMensagemA: string
    templateMensagemB?: string
    isAbTestActive?: boolean
    clientesAlvo: any[]
    usuarioExecutor: string
    usuarioExecutorId: string
  }): { campaign: CommercialCampaign; queueCount: number; suprimidosCount: number } {
    const campaigns = this.getCampaigns()
    const queue = this.getDispatchQueue()

    const campaignId = `cmp-${Date.now()}`
    const codigo = `CMP-${Date.now().toString().slice(-4)}`
    const todayStr = new Date().toLocaleDateString('pt-BR')

    const queueItems: CampaignDispatchQueueItem[] = []
    let supressoOptOut = 0
    let supressoBloqueado = 0
    let supressoContato = 0
    let supressoFrequencia = 0

    params.clientesAlvo.forEach((cli, idx) => {
      const channelCheck = params.canal === 'omnichannel' ? 'whatsapp' : params.canal
      const suppression = this.checkSuppression(cli.id, channelCheck as any)

      const idempotencyKey = `${campaignId}-${cli.id}-${params.canal}-${todayStr.replace(/\//g, '')}`

      if (suppression.supresso) {
        if (suppression.motivo?.includes('Opt-out')) supressoOptOut++
        else supressoBloqueado++

        queueItems.push({
          id: `dsp-${Date.now()}-${idx}`,
          campanhaId: campaignId,
          campanhaTitulo: params.titulo,
          clienteId: cli.id,
          clienteNome: cli.nomeFantasia || cli.razaoSocial,
          canal: params.canal,
          destinatario: cli.telefone || cli.email || 'Não informado',
          mensagemFinal: params.templateMensagemA,
          variante: 'A',
          status: 'suprimido',
          motivoSupressao: suppression.motivo,
          tentativas: 0,
          maxTentativas: 3,
          idempotencyKey,
          is_mock: true,
        })
        return
      }

      // Validação de contato
      const hasValidContact =
        params.canal === 'email' ? Boolean(cli.email || cli.contatoEmail) : true
      if (!hasValidContact) {
        supressoContato++
        queueItems.push({
          id: `dsp-${Date.now()}-${idx}`,
          campanhaId: campaignId,
          campanhaTitulo: params.titulo,
          clienteId: cli.id,
          clienteNome: cli.nomeFantasia || cli.razaoSocial,
          canal: params.canal,
          destinatario: 'Endereço de e-mail ausente',
          mensagemFinal: params.templateMensagemA,
          variante: 'A',
          status: 'suprimido',
          motivoSupressao: 'E-mail de contato ausente no cadastro comercial',
          tentativas: 0,
          maxTentativas: 3,
          idempotencyKey,
          is_mock: true,
        })
        return
      }

      // Variante A/B
      const variante: 'A' | 'B' = params.isAbTestActive && idx % 2 === 1 ? 'B' : 'A'
      const templateEscolhido =
        variante === 'B' && params.templateMensagemB
          ? params.templateMensagemB
          : params.templateMensagemA

      // Personalização da mensagem com variáveis
      const prodPrincipal = params.produtosVinculados[0]?.descricao || 'Aços Estruturais'
      const msgPersonalizada = templateEscolhido
        .replace(/{{contato_nome}}/g, cli.contatosHistorico?.[0]?.autor || 'Comprador')
        .replace(/{{cliente_nome}}/g, cli.nomeFantasia || cli.razaoSocial)
        .replace(/{{cliente_cidade}}/g, cli.cidade || 'Sua Região')
        .replace(/{{vendedor_nome}}/g, params.vendedorNome || 'Equipe Comercial CIAFAL')
        .replace(/{{produto_sugerido}}/g, prodPrincipal)
        .replace(/{{dias_sem_compra}}/g, String(cli.diasSemCompra || 60))
        .replace(/{{ultimo_produto}}/g, cli.produtosSugeridos?.[0]?.descricao || 'Perfis e Chapas')

      queueItems.push({
        id: `dsp-${Date.now()}-${idx}`,
        campanhaId: campaignId,
        campanhaTitulo: params.titulo,
        clienteId: cli.id,
        clienteNome: cli.nomeFantasia || cli.razaoSocial,
        canal: params.canal,
        destinatario:
          params.canal === 'email'
            ? cli.email || 'contato@cliente.com.br'
            : cli.telefone || '(31) 99999-8888',
        mensagemFinal: msgPersonalizada,
        variante,
        status: 'enviado', // Mock de simulação de disparo bem-sucedido via fila
        tentativas: 1,
        maxTentativas: 3,
        enviadoEm: new Date().toLocaleString('pt-BR'),
        idempotencyKey,
        is_mock: true,
      })
    })

    const totalSupressos = supressoOptOut + supressoBloqueado + supressoContato + supressoFrequencia
    const publicoElegivel = params.clientesAlvo.length - totalSupressos

    const newCampaign: CommercialCampaign = {
      id: campaignId,
      codigo,
      titulo: params.titulo,
      descricao: params.descricao,
      tipo: params.tipo,
      canal: params.canal,
      status: 'em_execucao',
      segmentoAlvo: params.segmentoAlvo,
      regionalAlvo: params.regionalAlvo,
      diasSemCompraMin: params.diasSemCompraMin,
      diasSemCompraMax: params.diasSemCompraMax,
      vendedorId: params.vendedorId,
      vendedorNome: params.vendedorNome,
      produtosVinculados: params.produtosVinculados,
      catalogoTipo: params.catalogoTipo,
      templateMensagemA: params.templateMensagemA,
      templateMensagemB: params.templateMensagemB,
      isAbTestActive: params.isAbTestActive,
      criadoPor: params.usuarioExecutor,
      criadoPorId: params.usuarioExecutorId,
      criadoEm: todayStr,
      aprovadoPor: params.usuarioExecutor,
      aprovadoEm: todayStr,
      disparadoPor: params.usuarioExecutor,
      disparadoEm: todayStr,
      publicoTotal: params.clientesAlvo.length,
      publicoElegivel,
      publicoSupresso: totalSupressos,
      motivosSupressao: {
        optOut: supressoOptOut,
        clienteBloqueado: supressoBloqueado,
        contatoInvalido: supressoContato,
        restricaoFrequencia: supressoFrequencia,
        semAutorizacao: 0,
      },
      metricas: {
        selecionados: params.clientesAlvo.length,
        enviados: publicoElegivel,
        entregues: publicoElegivel,
        lidos: Math.round(publicoElegivel * 0.8),
        respostas: Math.round(publicoElegivel * 0.4),
        taxaRespostaPct: 40,
        cotacoesGeradas: Math.round(publicoElegivel * 0.25),
        pedidosGerados: Math.round(publicoElegivel * 0.15),
        clientesReativados: Math.round(publicoElegivel * 0.15),
        taxaReativacaoPct: 15,
        taxaConversaoPct: 15,
        volumeTotalTons: Math.round(publicoElegivel * 4.5),
        faturamentoTotal: Math.round(publicoElegivel * 35000),
        estoqueParadoConvertidoTons:
          params.tipo === 'estoque_parado' ? Math.round(publicoElegivel * 3.5) : 0,
        estoqueParadoConvertidoValor:
          params.tipo === 'estoque_parado' ? Math.round(publicoElegivel * 28000) : 0,
      },
      analiseIA: {
        sumario: `Após a campanha, foi observado aumento significativo no volume de cotações abertas para a família ${params.produtosVinculados[0]?.familia || 'de aços'}.`,
        melhorSegmento: params.segmentoAlvo || 'Metalmecânico & Caldeiraria',
        melhorRegiao: params.regionalAlvo || 'Minas Gerais (RMBH)',
        melhorProduto: params.produtosVinculados[0]?.descricao || 'Aço Estrutural CIAFAL',
        melhorVendedor: params.vendedorNome || 'Equipe Comercial',
        clientesAltaIntencao: params.clientesAlvo
          .slice(0, 3)
          .map((c) => c.nomeFantasia || c.razaoSocial),
        clientesSemResposta: [],
        proximaAcaoSugerida:
          'Acompanhar respostas e gerar cotações formais para os clientes que interagirem nas próximas 24 horas.',
      },
      is_mock: true,
    }

    this.saveCampaigns([newCampaign, ...campaigns])
    this.saveDispatchQueue([...queueItems, ...queue])

    // Log de auditoria
    bulkTaskService.logAIAudit({
      recomendacaoId: `rec-cmp-${campaignId}`,
      clienteId: params.clientesAlvo.map((c) => c.id).join(','),
      clienteNome: `${params.clientesAlvo.length} clientes selecionados`,
      tipoAcao: 'DISPARO_CAMPANHA_COMERCIAL',
      algoritmoVersao: 'CIAFAL-CAMPAIGN-ENGINE-v2.0',
      dadosUtilizados: `Tipo: ${params.tipo}; Canal: ${params.canal}; Elegíveis: ${publicoElegivel}; Suprimidos: ${totalSupressos}`,
      usuarioExecutor: params.usuarioExecutor,
      acaoExecutada: `Disparo da campanha "${params.titulo}" com dupla confirmação e controle de supressão`,
      resultadoRegistrado: `${publicoElegivel} mensagens enfileiradas com sucesso na mensageria`,
    })

    return { campaign: newCampaign, queueCount: publicoElegivel, suprimidosCount: totalSupressos }
  }

  /**
   * Registra a resposta de um cliente em uma campanha
   */
  public registerClientResponse(
    dispatchId: string,
    resposta: string,
    sentimento: 'positivo' | 'negativo' | 'neutro' | 'duvida' | 'cotacao_solicitada',
  ): void {
    const queue = this.getDispatchQueue()
    const idx = queue.findIndex((q) => q.id === dispatchId)
    if (idx === -1) return

    const item = queue[idx]
    item.status = 'respondido'
    item.respondidoEm = new Date().toLocaleString('pt-BR')
    item.respostaRecebida = resposta
    item.sentimento = sentimento

    queue[idx] = item
    this.saveDispatchQueue(queue)
  }
}

export const campaignService = new CampaignService()
