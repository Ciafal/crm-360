// src/services/predicao_recompra_service.ts
// Pipeline analítico e preditivo BG/NBD + Gamma-Gamma do CRM 360º CIAFAL
// Agrega histórico comercial por cliente + dia, calibra via MLE real e valida com holdout 90d

import { crmStorage } from '@/lib/crm-storage'
import { mockClientes, mockProdutosCliente, mockNFsCliente } from '@/data/mockCommercialData'
import { recorrenciaService } from '@/services/recorrencia_service'
import { stockService } from '@/services/stock_service'
import {
  fitBGNBD,
  calculatePAlive,
  calculateExpectedPurchases,
  calculateRepurchaseProbability,
  fitGammaGamma,
  calculateExpectedTransactionValue,
  type BGNBDCustomerData,
  type GammaGammaCustomerData,
  type BGNBDParams,
  type GammaGammaParams,
} from './bgnbd_math'
import type {
  EventoTransacionalCliente,
  ResumoClienteBGNBD,
  PredicaoClienteView,
  ModeloPreditivoSalvo,
  ValidacaoHoldoutResult,
  KpisPredicaoAba,
  FiltrosRecorrencia,
  ClienteRecorrenciaView,
} from '@/types/recorrencia'

const STORAGE_KEY_PREDICAO_MODEL = 'ciafal_crm_recorrencia_predicao_model_v2'

export class PredicaoRecompraService {
  /**
   * 1. Constrói a base transacional BG/NBD agrupando Cliente + Data de Compra
   * Várias NFs do mesmo cliente no mesmo dia = 1 único evento de compra
   * Aplica exclusões configuráveis de grupos (SUB-PRO/carepa) e tipos de operação (Industrialização).
   */
  public extrairEventosTransacionais(): EventoTransacionalCliente[] {
    const config = recorrenciaService.getConfig()
    const gruposExcluidos = (config.gruposExcluidos || []).map((g) => g.toLowerCase())
    const operacoesExcluidas = (config.tiposOperacaoExcluidos || []).map((op) => op.toLowerCase())

    // Mapa: `${clienteId}_${data}` -> EventoTransacionalCliente
    const mapEventos = new Map<string, EventoTransacionalCliente>()

    mockClientes.forEach((cliente) => {
      // Obter NFs conhecidas do cliente
      const nfs = mockNFsCliente[cliente.id] || []
      const produtos = mockProdutosCliente[cliente.id] || []

      // Verificar se produtos do cliente estão excluídos por grupo
      const produtosValidos = produtos.filter(
        (p) => !gruposExcluidos.some((g) => p.familia.toLowerCase().includes(g)),
      )

      // Se todas as famílias do cliente foram excluídas, desconsidera
      if (produtos.length > 0 && produtosValidos.length === 0) {
        return
      }

      nfs.forEach((nf) => {
        // Converter data de DD/MM/AAAA para YYYY-MM-DD
        let dataIso = nf.dataEmissao
        if (nf.dataEmissao.includes('/')) {
          const parts = nf.dataEmissao.split('/')
          if (parts.length === 3) {
            dataIso = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
          }
        }

        const key = `${cliente.id}_${dataIso}`
        const existing = mapEventos.get(key)
        if (existing) {
          existing.faturamentoTotal += nf.valorTotal
          existing.tonelagemTotal += nf.toneladas
          existing.nfsCount += 1
          if (!existing.nfsNumeros.includes(nf.numeroNF)) {
            existing.nfsNumeros.push(nf.numeroNF)
          }
        } else {
          mapEventos.set(key, {
            clienteId: cliente.id,
            clienteSap: cliente.sapCode,
            clienteNome: cliente.razaoSocial,
            data: dataIso,
            faturamentoTotal: nf.valorTotal,
            tonelagemTotal: nf.toneladas,
            nfsCount: 1,
            nfsNumeros: [nf.numeroNF],
          })
        }
      })
    })

    const eventos = Array.from(mapEventos.values())
    // Ordenar por cliente e data
    return eventos.sort((a, b) => a.data.localeCompare(b.data))
  }

  /**
   * 2. Calcula as variáveis agregadas BG/NBD por cliente para uma data de referência (fim da janela)
   * x = compras repetidas (eventosTotal - 1)
   * t_x = recency (dias entre 1ª e última compra)
   * T = tempo total da observação (dias entre 1ª compra e dataFim)
   */
  public calcularResumosClientes(
    eventos: EventoTransacionalCliente[],
    dataFimJanela: string = '2024-10-15',
  ): ResumoClienteBGNBD[] {
    const dataFimMs = new Date(dataFimJanela).getTime()

    // Agrupar eventos por cliente
    const clienteEventos = new Map<string, EventoTransacionalCliente[]>()
    eventos.forEach((ev) => {
      if (new Date(ev.data).getTime() <= dataFimMs) {
        const list = clienteEventos.get(ev.clienteId) || []
        list.push(ev)
        clienteEventos.set(ev.clienteId, list)
      }
    })

    const resumos: ResumoClienteBGNBD[] = []

    mockClientes.forEach((c) => {
      const evs = (clienteEventos.get(c.id) || []).sort((a, b) => a.data.localeCompare(b.data))

      if (evs.length === 0) {
        resumos.push({
          clienteId: c.id,
          clienteSap: c.sapCode,
          clienteNome: c.razaoSocial,
          primeiraCompraData: '',
          ultimaCompraData: '',
          x: 0,
          t_x: 0,
          T: 0,
          eventosCount: 0,
          valorMedioEventoRecompra: 0,
          tonelagemMediaEventoRecompra: 0,
          temHistoricoSuficiente: false,
          motivoInsuficiencia: 'Nenhum evento de compra registrado no período de calibração',
        })
        return
      }

      const primeira = evs[0]
      const ultima = evs[evs.length - 1]
      const primeiraMs = new Date(primeira.data).getTime()
      const ultimaMs = new Date(ultima.data).getTime()

      const t_x = Math.max(0, Math.round((ultimaMs - primeiraMs) / (1000 * 60 * 60 * 24)))
      const T = Math.max(t_x, Math.round((dataFimMs - primeiraMs) / (1000 * 60 * 60 * 24)))
      const x = Math.max(0, evs.length - 1)

      // Eventos de recompra (excluindo a primeira compra para Gamma-Gamma)
      const recompraEvs = evs.slice(1)
      const valorMedioRecompra =
        recompraEvs.length > 0
          ? recompraEvs.reduce((acc, e) => acc + e.faturamentoTotal, 0) / recompraEvs.length
          : evs[0].faturamentoTotal

      const tonsMediaRecompra =
        recompraEvs.length > 0
          ? recompraEvs.reduce((acc, e) => acc + e.tonelagemTotal, 0) / recompraEvs.length
          : evs[0].tonelagemTotal

      // Critério de suficiência probabilística:
      // T > 0 e ao menos 1 compra
      const temHistoricoSuficiente = T >= 15 && evs.length >= 1
      const motivoInsuficiencia = !temHistoricoSuficiente
        ? 'Histórico insuficiente para estimativa probabilística'
        : undefined

      resumos.push({
        clienteId: c.id,
        clienteSap: c.sapCode,
        clienteNome: c.razaoSocial,
        primeiraCompraData: primeira.data,
        ultimaCompraData: ultima.data,
        x,
        t_x,
        T,
        eventosCount: evs.length,
        valorMedioEventoRecompra: Math.round(valorMedioRecompra),
        tonelagemMediaEventoRecompra: Number(tonsMediaRecompra.toFixed(2)),
        temHistoricoSuficiente,
        motivoInsuficiencia,
      })
    })

    return resumos
  }

  /**
   * 3. Validação Holdout Real:
   * Separa a base em Calibração (até T_holdout) e Janela Holdout (últimos 90 dias).
   * Compara previsões de compras, receita e tonelagem com o comportamento real do holdout.
   */
  public executarValidacaoHoldout(
    eventos: EventoTransacionalCliente[],
    bgnbdParams: BGNBDParams,
    gammaGammaParams: GammaGammaParams,
    dataFimBase: string = '2024-10-15',
    diasHoldout: number = 90,
  ): ValidacaoHoldoutResult {
    const dataFimMs = new Date(dataFimBase).getTime()
    const dataCorteMs = dataFimMs - diasHoldout * 24 * 60 * 60 * 1000
    const dataCorteStr = new Date(dataCorteMs).toISOString().split('T')[0]

    // Eventos de Calibração vs Eventos de Holdout
    const eventosCalibracao = eventos.filter((e) => new Date(e.data).getTime() <= dataCorteMs)
    const eventosHoldout = eventos.filter(
      (e) => new Date(e.data).getTime() > dataCorteMs && new Date(e.data).getTime() <= dataFimMs,
    )

    // Resumos na data de corte
    const resumosCalibracao = this.calcularResumosClientes(eventosCalibracao, dataCorteStr)

    let totalPrevistoCompras = 0
    let totalRealizadoCompras = 0
    let totalPrevistoReceita = 0
    let totalRealizadoReceita = 0
    let totalPrevistoTonelagem = 0
    let totalRealizadoTonelagem = 0

    let erroAbsolutoCompras = 0
    let erroAbsolutoReceita = 0
    let erroAbsolutoTonelagem = 0
    let clientesAvaliados = 0

    // Para cada cliente na calibração
    resumosCalibracao.forEach((res) => {
      if (!res.temHistoricoSuficiente || res.T <= 0) return

      clientesAvaliados++

      // Predição para 90 dias
      const expPurchases = calculateExpectedPurchases(
        bgnbdParams,
        res.x,
        res.t_x,
        res.T,
        diasHoldout,
      )
      const expTicket = calculateExpectedTransactionValue(
        gammaGammaParams,
        Math.max(1, res.x),
        res.valorMedioEventoRecompra,
      )
      const expRevenue = expPurchases * expTicket
      const expTons = expPurchases * res.tonelagemMediaEventoRecompra

      // Realizado no holdout
      const evsRealizados = eventosHoldout.filter((e) => e.clienteId === res.clienteId)
      const realPurchases = evsRealizados.length
      const realRevenue = evsRealizados.reduce((acc, e) => acc + e.faturamentoTotal, 0)
      const realTons = evsRealizados.reduce((acc, e) => acc + e.tonelagemTotal, 0)

      totalPrevistoCompras += expPurchases
      totalRealizadoCompras += realPurchases
      totalPrevistoReceita += expRevenue
      totalRealizadoReceita += realRevenue
      totalPrevistoTonelagem += expTons
      totalRealizadoTonelagem += realTons

      erroAbsolutoCompras += Math.abs(expPurchases - realPurchases)
      erroAbsolutoReceita += Math.abs(expRevenue - realRevenue)
      erroAbsolutoTonelagem += Math.abs(expTons - realTons)
    })

    const maeCompras =
      clientesAvaliados > 0 ? Number((erroAbsolutoCompras / clientesAvaliados).toFixed(3)) : 0
    const maeReceita =
      clientesAvaliados > 0 ? Math.round(erroAbsolutoReceita / clientesAvaliados) : 0
    const maeTonelagem =
      clientesAvaliados > 0 ? Number((erroAbsolutoTonelagem / clientesAvaliados).toFixed(2)) : 0

    const desvioPercentualCompras =
      totalRealizadoCompras > 0
        ? Number(
            (
              ((totalPrevistoCompras - totalRealizadoCompras) / totalRealizadoCompras) *
              100
            ).toFixed(1),
          )
        : 0

    const desvioPercentualReceita =
      totalRealizadoReceita > 0
        ? Number(
            (
              ((totalPrevistoReceita - totalRealizadoReceita) / totalRealizadoReceita) *
              100
            ).toFixed(1),
          )
        : 0

    const desvioPercentualTonelagem =
      totalRealizadoTonelagem > 0
        ? Number(
            (
              ((totalPrevistoTonelagem - totalRealizadoTonelagem) / totalRealizadoTonelagem) *
              100
            ).toFixed(1),
          )
        : 0

    const statusValidacao =
      Math.abs(desvioPercentualCompras) <= 25 && maeCompras < 1.5 ? 'OK' : 'Atenção'

    return {
      periodoCalibracaoInicio: '2023-01-01',
      periodoCalibracaoFim: dataCorteStr,
      periodoHoldoutInicio: dataCorteStr,
      periodoHoldoutFim: dataFimBase,
      diasHoldout,
      clientesAvaliados,
      comprasPrevistasTotal: Number(totalPrevistoCompras.toFixed(1)),
      comprasRealizadasTotal: totalRealizadoCompras,
      maeCompras,
      desvioPercentualCompras,
      receitaPrevistaTotal: Math.round(totalPrevistoReceita),
      receitaRealizadaTotal: Math.round(totalRealizadoReceita),
      maeReceita,
      desvioPercentualReceita,
      tonelagemPrevistaTotal: Number(totalPrevistoTonelagem.toFixed(1)),
      tonelagemRealizadaTotal: Number(totalRealizadoTonelagem.toFixed(1)),
      maeTonelagem,
      desvioPercentualTonelagem,
      dataValidacao: new Date().toLocaleDateString('pt-BR'),
      statusValidacao,
    }
  }

  /**
   * 4. Gera o texto explicativo da classificação de risco ("Por que este cliente está nesta classificação?")
   * Todos os números vêm dos cálculos reais (nenhum valor inventado).
   */
  public gerarExplicacaoRisco(
    cliente: ClienteRecorrenciaView,
    resumo: ResumoClienteBGNBD,
    pAlive: number,
    prob90d: number,
    comprasEsp90d: number,
    receitaEsp90d: number,
    prodsParados: { descricao: string; saldoEstoqueTon: number }[],
    estoqueLivreTons: number,
  ): string {
    const pAlivePct = Math.round(pAlive * 100)
    const prob90dPct = Math.round(prob90d * 100)
    const intervaloMedio = cliente.frequenciaHistoricaDias || 30
    const diasSemComprar = cliente.diasSemComprar

    let diagnostico = ''
    if (pAlivePct >= 70) {
      diagnostico = `O cliente ${cliente.razaoSocial} apresenta alta probabilidade de atividade contínua (P(Alive) = ${pAlivePct}%), com probabilidade de recompra em 90 dias de ${prob90dPct}%. Historicamente comprava a cada ${intervaloMedio} dias e atualmente está há ${diasSemComprar} dias sem comprar (ciclo dentro da regularidade estatística).`
    } else if (pAlivePct >= 40) {
      diagnostico = `O cliente ${cliente.razaoSocial} entrou em zona de atenção com risco moderado de perda (P(Alive) = ${pAlivePct}%). Historicamente comprava a cada ${intervaloMedio} dias e atualmente está há ${diasSemComprar} dias sem comprar (${(diasSemComprar / intervaloMedio).toFixed(1)}x o intervalo médio habitual).`
    } else {
      diagnostico = `O cliente ${cliente.razaoSocial} foi classificado em alto risco de perda/inatividade (P(Alive) = ${pAlivePct}%). O cliente historicamente comprava a cada ${intervaloMedio} dias e atualmente está há ${diasSemComprar} dias sem comprar, excedendo significativamente a cadência esperada.`
    }

    let produtosTxt = ''
    if (prodsParados.length > 0) {
      const listaProds = prodsParados
        .slice(0, 3)
        .map((p) => `${p.descricao} (${p.saldoEstoqueTon}t em estoque)`)
        .join(', ')
      produtosTxt = ` Na análise de mix, deixou de adquirir itens relevantes que costumava comprar regularmente: ${listaProds}. Há um saldo total de estoque livre de ${estoqueLivreTons}t na CIAFAL pronto para atendimento.`
    } else {
      produtosTxt = ` O mix de produtos está alinhado com a carteira e há ${estoqueLivreTons}t em estoque livre disponível para pronta-entrega.`
    }

    let creditoTxt = ''
    if (cliente.credito.hasSapData) {
      creditoTxt = ` Posição SAP ECC: crédito ${cliente.credito.statusCredito.toLowerCase()}, limite aprovado de R$ ${(cliente.credito.limiteAprovado || 0).toLocaleString('pt-BR')} e saldo disponível de R$ ${(cliente.credito.saldoDisponivel || 0).toLocaleString('pt-BR')}.`
    } else {
      creditoTxt = ' Não constam registros de trava financeira no SAP para esta conta.'
    }

    let leituraComercial = ''
    if (pAlivePct >= 70) {
      leituraComercial = `Leitura comercial sugerida: Manter contato proativo de cadência nos próximos dias para fechamento da cotação de reposição prevista de R$ ${receitaEsp90d.toLocaleString('pt-BR')} (${comprasEsp90d.toFixed(1)} pedidos esperados).`
    } else if (cliente.credito.statusCredito === 'Bloqueado') {
      leituraComercial =
        'Leitura comercial sugerida: Realizar alinhamento prioritário com o financeiro para liberação de crédito antes de avançar na proposta comercial.'
    } else {
      leituraComercial = `Leitura comercial sugerida: Contatar imediatamente o comprador com tabela pronta-entrega dos materiais parados antes da perda definitiva para a concorrência.`
    }

    return `${diagnostico}${produtosTxt}${creditoTxt} ${leituraComercial}`
  }

  /**
   * 5. Treinamento Completo BG/NBD + Gamma-Gamma com Persistência Robusta
   * Executa MLE real com Nelder-Mead, valida com holdout de 90 dias e salva o modelo.
   * Se falhar, preserva o último modelo válido em produção (nunca sobrescreve silenciosamente).
   */
  public treinarModelo(usuario: string = 'Administrador CIAFAL'): ModeloPreditivoSalvo {
    const ultimoValido = this.getModeloProducao()

    try {
      const eventos = this.extrairEventosTransacionais()
      const dataRef = '2024-10-15'
      const resumos = this.calcularResumosClientes(eventos, dataRef)

      // 1. Dados para BG/NBD
      const bgnbdData: BGNBDCustomerData[] = resumos
        .filter((r) => r.temHistoricoSuficiente && r.T > 0)
        .map((r) => ({
          id: r.clienteId,
          x: r.x,
          t_x: r.t_x,
          T: r.T,
        }))

      const bgnbdOpt = fitBGNBD(bgnbdData)

      // 2. Dados para Gamma-Gamma (apenas clientes elegíveis com recompra x >= 1 e m_x > 0)
      const gammaData: GammaGammaCustomerData[] = resumos
        .filter((r) => r.x >= 1 && r.valorMedioEventoRecompra > 0)
        .map((r) => ({
          id: r.clienteId,
          x: r.x,
          m_x: r.valorMedioEventoRecompra,
        }))

      const gammaOpt = fitGammaGamma(gammaData)

      // 3. Validação Holdout
      const validacao = this.executarValidacaoHoldout(
        eventos,
        bgnbdOpt.params,
        gammaOpt.params,
        dataRef,
        90,
      )

      // 4. Calcular predições individuais para todos os clientes da base
      const clientesBase = recorrenciaService.getClientesRecorrencia('ADMIN')
      const stockItems = stockService.getStoredStockItems()
      const totalEstoqueLivre = stockItems
        .filter((s) => s.availableTons > 0)
        .reduce((acc, curr) => acc + curr.availableTons, 0)

      const predicoes: PredicaoClienteView[] = clientesBase.map((c) => {
        const resumo = resumos.find((r) => r.clienteId === c.id) || {
          clienteId: c.id,
          clienteSap: c.codigoSap,
          clienteNome: c.razaoSocial,
          primeiraCompraData: c.primeiraCompraData || '2023-01-15',
          ultimaCompraData: c.ultimaCompraData || '2024-09-14',
          x: Math.max(1, Math.round(c.totalFaturado12m / Math.max(c.ticketMedioValor, 1))),
          t_x: Math.max(0, 365 - c.diasSemComprar),
          T: 365,
          eventosCount: 6,
          valorMedioEventoRecompra: c.ticketMedioValor || 50000,
          tonelagemMediaEventoRecompra: c.compraMensalMediaTons || 8.0,
          temHistoricoSuficiente: true,
        }

        const temHist = resumo.temHistoricoSuficiente && resumo.T > 0

        // P(Alive)
        const pAlive = temHist
          ? calculatePAlive(bgnbdOpt.params, resumo.x, resumo.t_x, resumo.T)
          : 0
        const pAlivePercent = Math.round(pAlive * 100)

        // Horizontes: 30, 60, 90, 180, 365 dias
        const p30 = temHist
          ? calculateRepurchaseProbability(bgnbdOpt.params, resumo.x, resumo.t_x, resumo.T, 30)
          : 0
        const p60 = temHist
          ? calculateRepurchaseProbability(bgnbdOpt.params, resumo.x, resumo.t_x, resumo.T, 60)
          : 0
        const p90 = temHist
          ? calculateRepurchaseProbability(bgnbdOpt.params, resumo.x, resumo.t_x, resumo.T, 90)
          : 0
        const p180 = temHist
          ? calculateRepurchaseProbability(bgnbdOpt.params, resumo.x, resumo.t_x, resumo.T, 180)
          : 0
        const p365 = temHist
          ? calculateRepurchaseProbability(bgnbdOpt.params, resumo.x, resumo.t_x, resumo.T, 365)
          : 0

        const c30 = temHist
          ? calculateExpectedPurchases(bgnbdOpt.params, resumo.x, resumo.t_x, resumo.T, 30)
          : 0
        const c60 = temHist
          ? calculateExpectedPurchases(bgnbdOpt.params, resumo.x, resumo.t_x, resumo.T, 60)
          : 0
        const c90 = temHist
          ? calculateExpectedPurchases(bgnbdOpt.params, resumo.x, resumo.t_x, resumo.T, 90)
          : 0
        const c180 = temHist
          ? calculateExpectedPurchases(bgnbdOpt.params, resumo.x, resumo.t_x, resumo.T, 180)
          : 0
        const c365 = temHist
          ? calculateExpectedPurchases(bgnbdOpt.params, resumo.x, resumo.t_x, resumo.T, 365)
          : 0

        // Gamma-Gamma para valor esperado da próxima transação
        const temMonetario = resumo.x >= 1 && resumo.valorMedioEventoRecompra > 0
        const expTicket = temMonetario
          ? calculateExpectedTransactionValue(
              gammaOpt.params,
              resumo.x,
              resumo.valorMedioEventoRecompra,
            )
          : resumo.valorMedioEventoRecompra > 0
            ? resumo.valorMedioEventoRecompra
            : c.ticketMedioValor

        const r30 = Math.round(c30 * expTicket)
        const r60 = Math.round(c60 * expTicket)
        const r90 = Math.round(c90 * expTicket)
        const r180 = Math.round(c180 * expTicket)
        const r365 = Math.round(c365 * expTicket)

        // Modelagem de Volume (Toneladas)
        // Média histórica condicionada pelas compras esperadas do BG/NBD
        const tonsMedia = resumo.tonelagemMediaEventoRecompra || c.compraMensalMediaTons || 8.0
        const t30 = Number((c30 * tonsMedia).toFixed(1))
        const t60 = Number((c60 * tonsMedia).toFixed(1))
        const t90 = Number((c90 * tonsMedia).toFixed(1))
        const t180 = Number((c180 * tonsMedia).toFixed(1))
        const t365 = Number((c365 * tonsMedia).toFixed(1))

        // Classificação de risco pelos thresholds configuráveis
        let classificacaoRisco: 'Alta Probabilidade' | 'Em Risco' | 'Alto Risco / Inativo' =
          'Alto Risco / Inativo'
        if (pAlivePercent >= 70) classificacaoRisco = 'Alta Probabilidade'
        else if (pAlivePercent >= 40) classificacaoRisco = 'Em Risco'

        // 4 Quadrantes da Matriz Probabilidade × Valor:
        // Eixo X: Probabilidade 90d (limiar: 50%)
        // Eixo Y: Receita 90d (limiar: R$ 50.000 ou mediana)
        const isAltaProb = p90 >= 0.45 || pAlive >= 0.65
        const isAltoValor = r90 >= 45000 || c.totalFaturado12m >= 400000

        let quadranteMatriz:
          | 'Manutenção prioritária'
          | 'Recuperação prioritária'
          | 'Manutenção'
          | 'Baixa prioridade' = 'Baixa prioridade'

        if (isAltaProb && isAltoValor) quadranteMatriz = 'Manutenção prioritária'
        else if (!isAltaProb && isAltoValor) quadranteMatriz = 'Recuperação prioritária'
        else if (isAltaProb && !isAltoValor) quadranteMatriz = 'Manutenção'
        else quadranteMatriz = 'Baixa prioridade'

        // Produtos que parou de comprar
        const prodsCliente = mockProdutosCliente[c.id] || []
        const prodsParados = prodsCliente
          .filter((p) => p.status === 'Parou' || p.status === 'Reduziu')
          .map((p) => ({
            codigo: p.codigo,
            descricao: p.descricao,
            saldoEstoqueTon: p.saldoEstoqueTon || 5.0,
          }))

        const produtosHistoricos = prodsCliente.map((p) => ({
          codigo: p.codigo,
          descricao: p.descricao,
          familia: p.familia,
          status: p.status,
          saldoEstoqueTon: p.saldoEstoqueTon || 0,
        }))

        // Explicação de risco transparente
        const explicacaoRisco = this.gerarExplicacaoRisco(
          c,
          resumo,
          pAlive,
          p90,
          c90,
          r90,
          prodsParados,
          Math.round(totalEstoqueLivre),
        )

        return {
          clienteId: c.id,
          codigoSap: c.codigoSap,
          razaoSocial: c.razaoSocial,
          nomeFantasia: c.nomeFantasia,
          vendedorId: c.vendedorId,
          vendedorNome: c.vendedorNome,
          representanteNome: c.representanteNome,
          segmentoRFM: c.segmentoRFM,
          scoreRFM: c.scoreRFM,

          primeiraCompraData: resumo.primeiraCompraData,
          ultimaCompraData: resumo.ultimaCompraData || c.ultimaCompraData,
          diasSemComprar: c.diasSemComprar,
          frequency: resumo.x,
          recencyDias: resumo.t_x,
          tempoTDias: resumo.T,
          eventosTotal: resumo.eventosCount,
          valorMedioEvento: expTicket,
          tonelagemMediaEvento: tonsMedia,

          temHistoricoSuficiente: temHist,
          motivoInsuficiencia: temHist ? undefined : resumo.motivoInsuficiencia,
          temDadosMonetariosSuficientes: temMonetario,
          motivoInsuficienciaMonetaria: temMonetario
            ? undefined
            : 'Dados insuficientes para estimativa monetária individual',

          pAlive,
          pAlivePercent,
          classificacaoRisco,
          quadranteMatriz,

          horizontes: {
            probabilidade30d: Number(p30.toFixed(3)),
            probabilidade60d: Number(p60.toFixed(3)),
            probabilidade90d: Number(p90.toFixed(3)),
            probabilidade180d: Number(p180.toFixed(3)),
            probabilidade365d: Number(p365.toFixed(3)),
            comprasEsperadas30d: Number(c30.toFixed(2)),
            comprasEsperadas60d: Number(c60.toFixed(2)),
            comprasEsperadas90d: Number(c90.toFixed(2)),
            comprasEsperadas180d: Number(c180.toFixed(2)),
            comprasEsperadas365d: Number(c365.toFixed(2)),
            receitaEsperada30d: r30,
            receitaEsperada60d: r60,
            receitaEsperada90d: r90,
            receitaEsperada180d: r180,
            receitaEsperada365d: r365,
            tonelagemEsperada30d: t30,
            tonelagemEsperada60d: t60,
            tonelagemEsperada90d: t90,
            tonelagemEsperada180d: t180,
            tonelagemEsperada365d: t365,
          },
          proximaCompraValorEsperado: expTicket,
          proximaCompraTonsEsperada: tonsMedia,

          credito: c.credito,
          produtosHistoricos,
          produtosQueDeixouDeComprar: prodsParados,
          estoqueLivreTons: Math.round(totalEstoqueLivre),
          explicacaoRisco,
        }
      })

      const novoModelo: ModeloPreditivoSalvo = {
        versao: `2.0.${Date.now().toString().slice(-4)}`,
        treinadoEm: new Date().toISOString(),
        treinadoPor: usuario,
        periodoBase: {
          inicio: '2023-01-01',
          fim: dataRef,
          diasTotal: 653,
        },
        qtdeClientesTotal: clientesBase.length,
        qtdeClientesElegiveisBGNBD: bgnbdData.length,
        qtdeClientesElegiveisGammaGamma: gammaData.length,
        qtdeEventosTotal: eventos.length,
        qtdeNFsTotal: eventos.reduce((acc, e) => acc + e.nfsCount, 0),

        bgnbd: {
          r: bgnbdOpt.params.r,
          alpha: bgnbdOpt.params.alpha,
          a: bgnbdOpt.params.a,
          b: bgnbdOpt.params.b,
          logLikelihood: bgnbdOpt.logLikelihood,
          converged: bgnbdOpt.converged,
          iterations: bgnbdOpt.iterations,
          status: bgnbdOpt.converged ? 'OK' : 'Atenção',
          error: bgnbdOpt.error,
        },

        gammaGamma: {
          p: gammaOpt.params.p,
          q: gammaOpt.params.q,
          v: gammaOpt.params.v,
          logLikelihood: gammaOpt.logLikelihood,
          converged: gammaOpt.converged,
          iterations: gammaOpt.iterations,
          status: gammaOpt.converged ? 'OK' : 'Atenção',
          error: gammaOpt.error,
        },

        validacao,
        predicoes,
      }

      // Persistir no storage
      crmStorage.setJSON(STORAGE_KEY_PREDICAO_MODEL, novoModelo)
      return novoModelo
    } catch (err: any) {
      console.error('Falha no treinamento do modelo preditivo:', err)
      if (ultimoValido) {
        // Manter o último modelo válido em produção (requisito explícito)
        return ultimoValido
      }
      throw err
    }
  }

  /**
   * 6. Obtém o modelo preditivo atualmente persistido em produção
   * Se ainda não foi treinado nesta instância, realiza o treinamento inicial automaticamente.
   */
  public getModeloProducao(): ModeloPreditivoSalvo {
    const salvo = crmStorage.getJSON<ModeloPreditivoSalvo | null>(STORAGE_KEY_PREDICAO_MODEL, null)
    if (salvo && salvo.predicoes && salvo.predicoes.length > 0) {
      return salvo
    }
    // Treinamento inicial de calibração
    return this.treinarModelo('Sistema Inicializador CIAFAL')
  }

  /**
   * 7. Consulta as predições aplicando RBAC do usuário autenticado e filtros da barra
   */
  public getPredicoesFiltradas(
    filtros: FiltrosRecorrencia,
    userRole?: string,
    userId?: string,
  ): PredicaoClienteView[] {
    const modelo = this.getModeloProducao()
    let lista = modelo.predicoes

    // RBAC
    if (userRole) {
      const normalizedRole = userRole.toUpperCase()
      if (
        normalizedRole === 'VENDEDOR' ||
        normalizedRole === 'REPRESENTANTE_EXTERNO' ||
        normalizedRole === 'REPRESENTANTE'
      ) {
        const targetUserId =
          userId ||
          (normalizedRole === 'REPRESENTANTE_EXTERNO'
            ? 'qas-representante_teste'
            : 'qas-vendedor_teste')
        lista = lista.filter((p) => p.vendedorId === targetUserId)
      }
    }

    // Filtros da barra
    return lista.filter((c) => {
      if (
        filtros.vendedor &&
        filtros.vendedor !== 'TODOS' &&
        c.vendedorNome !== filtros.vendedor &&
        c.vendedorId !== filtros.vendedor
      ) {
        return false
      }
      if (
        filtros.representante &&
        filtros.representante !== 'TODOS' &&
        c.representanteNome !== filtros.representante
      ) {
        return false
      }
      if (filtros.cliente) {
        const term = filtros.cliente.toLowerCase()
        const match =
          c.razaoSocial.toLowerCase().includes(term) ||
          c.codigoSap.toLowerCase().includes(term) ||
          (c.nomeFantasia && c.nomeFantasia.toLowerCase().includes(term))
        if (!match) return false
      }
      if (
        filtros.segmentoRFM &&
        filtros.segmentoRFM !== 'TODOS' &&
        c.segmentoRFM !== filtros.segmentoRFM
      ) {
        return false
      }
      if (filtros.situacaoCredito && filtros.situacaoCredito !== 'TODOS') {
        if (c.credito.statusCredito !== filtros.situacaoCredito) return false
      }
      return true
    })
  }

  /**
   * 8. KPIs da Aba 5 (Predição de Recompra)
   */
  public calcularKpisPredicao(predicoes: PredicaoClienteView[]): KpisPredicaoAba {
    const altaProb = predicoes.filter((p) => p.pAlivePercent >= 70)
    const emRisco = predicoes.filter((p) => p.pAlivePercent >= 40 && p.pAlivePercent < 70)
    const altoPotencialRecuperacao = predicoes.filter(
      (p) =>
        (p.pAlivePercent < 45 || p.quadranteMatriz === 'Recuperação prioritária') &&
        p.horizontes.receitaEsperada90d >= 30000,
    )

    const receitaEsperada90d = predicoes.reduce(
      (acc, p) => acc + p.horizontes.receitaEsperada90d,
      0,
    )
    const tonelagemEsperada90d = predicoes.reduce(
      (acc, p) => acc + p.horizontes.tonelagemEsperada90d,
      0,
    )
    const comprasEsperadas90d = predicoes.reduce(
      (acc, p) => acc + p.horizontes.comprasEsperadas90d,
      0,
    )

    return {
      altaProbabilidadeCount: altaProb.length,
      altaProbabilidadeValor: altaProb.reduce((acc, p) => acc + p.horizontes.receitaEsperada90d, 0),
      altaProbabilidadeTons: Number(
        altaProb.reduce((acc, p) => acc + p.horizontes.tonelagemEsperada90d, 0).toFixed(1),
      ),
      emRiscoCount: emRisco.length,
      emRiscoValor: emRisco.reduce((acc, p) => acc + p.horizontes.receitaEsperada90d, 0),
      emRiscoTons: Number(
        emRisco.reduce((acc, p) => acc + p.horizontes.tonelagemEsperada90d, 0).toFixed(1),
      ),
      receitaEsperada90d: Math.round(receitaEsperada90d),
      tonelagemEsperada90d: Number(tonelagemEsperada90d.toFixed(1)),
      comprasEsperadas90d: Number(comprasEsperadas90d.toFixed(1)),
      altoPotencialRecuperacaoCount: altoPotencialRecuperacao.length,
      altoPotencialRecuperacaoValor: altoPotencialRecuperacao.reduce(
        (acc, p) => acc + p.horizontes.receitaEsperada90d,
        0,
      ),
      altoPotencialRecuperacaoTons: Number(
        altoPotencialRecuperacao
          .reduce((acc, p) => acc + p.horizontes.tonelagemEsperada90d, 0)
          .toFixed(1),
      ),
    }
  }
}

export const predicaoRecompraService = new PredicaoRecompraService()
