import {
  ClienteSatisfacao360,
  PlanoRecuperacao,
  CampanhaPesquisa,
  RespostaPesquisaCliente,
  SatisfactionAuditLog,
  PerformanceSellerReadiness,
  ISCPesosConfig,
  ISCPesoHistoryEntry,
  ISCBandConfig,
  AIAnalysisResult,
} from '@/types/satisfaction'
import { DEFAULT_ISC_PESOS, DEFAULT_ISC_BANDS, iscEngine } from '@/services/isc_engine'
import { stockService } from '@/services/stock_service'
import { mockClientes } from '@/data/mockCommercialData'
import { crmStorage } from '@/lib/crm-storage'

const STORAGE_KEY_CLIENTES = 'ciafal_satisfaction_clients_v1'
const STORAGE_KEY_PESOS = 'ciafal_satisfaction_pesos_v1'
const STORAGE_KEY_PESOS_HISTORY = 'ciafal_satisfaction_pesos_history_v1'
const STORAGE_KEY_BANDS = 'ciafal_satisfaction_bands_v1'
const STORAGE_KEY_PLANOS = 'ciafal_satisfaction_recovery_plans_v1'
const STORAGE_KEY_CAMPANHAS = 'ciafal_satisfaction_campaigns_v1'
const STORAGE_KEY_RESPOSTAS = 'ciafal_satisfaction_survey_responses_v1'
const STORAGE_KEY_AUDIT = 'ciafal_satisfaction_audit_logs_v1'

// Geração de Clientes Iniciais Ricos com as 5 Dimensões Reais
export function generateInitialSatisfactionClients(): ClienteSatisfacao360[] {
  const stockItems = stockService.getStoredStockItems()

  return [
    {
      id: 'cli-100001',
      sapCode: '100001',
      razaoSocial: 'Metalúrgica Santa Rita Ltda',
      nomeFantasia: 'Metalúrgica Santa Rita',
      cnpj: '18.234.567/0001-89',
      segmento: 'Construção Civil',
      subsegmento: 'Estruturas Metálicas',
      regiao: 'Grande BH',
      cidade: 'Contagem',
      uf: 'MG',
      vendedorId: 'qas-vendedor_teste',
      vendedorNome: 'Carlos Mendonça',
      gestorNome: 'Roberto Silveira (Gerente Regional)',
      equipe: 'Equipe Minas Geral',
      classificacaoCliente: 'A',

      faturamentoYTD: 1450000,
      faturamentoMesAnterior: 180000,
      volumeYTD: 245.5,
      volumeMesAnterior: 32.0,

      iscAtual: 67,
      iscAnterior: 84,
      iscVariacao: -17,
      faixaISC: 'RISCO',
      tendencia: 'Piorando',
      riscoChurnPct: 65,

      scoreValorEstrategico: 88,
      quadranteMatriz: 'PRIORIDADE_MAXIMA',

      dimensaoQualidade: {
        score: 60,
        reclamacoesAbertas: 1,
        reclamacoesEncerradas: 3,
        reclamacoesReincidentes: 1,
        gravidadeMedia: 'ALTA',
        naoConformidades: 2,
        devolucoesQtd: 1,
        devolucoesTons: 3.0,
        desviosProcesso: 1,
        retrabalhosQtd: 1,
        tempoMedioRespostaHoras: 48,
        tempoMedioResolucaoDias: 12,
        eficaciaAcaoCorretivaPct: 65,
        fatoresDetalhados: [
          '1 reclamação aberta no SAC sobre empenamento em Perfis W',
          '1 reincidência de desvio dimensional nos últimos 60 dias',
          'Devolução parcial de 3.0 t registrada no SAP em 19/10',
        ],
      },

      dimensaoLogistica: {
        score: 68,
        entregasNoPrazoPct: 78.5,
        otifPct: 76.0,
        diferencaDataDesejadaEntregueDias: 3.5,
        totalEntregasPeriodo: 14,
        entregasAtrasadas: 3,
        entregasCargaParcial: 1,
        reentregasQtd: 1,
        avariasTransporteQtd: 1,
        ocorrenciasTMS: 2,
        tempoMedioTransporteHoras: 18,
        divergenciaQuantidadeQtd: 0,
        transportadorasPrincipais: ['Transportadora TransAço MG', 'Frota Própria CIAFAL'],
        eventosTMSUltimos: [
          'Atraso na liberação doca pátio Contagem (+4h)',
          'Reprogramação de rota Contagem-Betim devido à chuva',
        ],
        fatoresDetalhados: [
          'OTIF em 76.0% (meta corporativa CIAFAL: 95%)',
          '3 entregas com atraso acima de 48h no último mês',
          '1 registro de avaria de amarração de carga no TMS',
        ],
      },

      dimensaoComercial: {
        score: 65,
        diasUltimoContato: 28,
        frequenciaContatoDias: 10,
        visitasRealizadasUltimos90d: 1,
        ligacoesUltimos30d: 2,
        whatsAppInteracoes30d: 5,
        emailsEnviados30d: 3,
        tarefasRealizadas: 4,
        tarefasVencidas: 2,
        cotacoesAbertas: 2,
        cotacoesConvertidas: 1,
        taxaConversaoCotacoesPct: 50.0,
        pedidosEmCarteiraQtd: 1,
        pedidosEmCarteiraTons: 12.0,
        frequenciaCompraDias: 18,
        diasSemCompra: 42,
        variacaoVolumePct: -28.5,
        perdaMixHistorico: true,
        produtosAbandonadosCount: 2,
        produtosAbandonadosNomes: ['Perfil W 200x26.6', 'Chapa Grossa A36 1/2"'],
        fatoresDetalhados: [
          'Queda de 28.5% no volume mensal faturado',
          'Cliente sem compra há 42 dias (ciclo habitual de 18 dias)',
          '2 tarefas comerciais vencidas sem follow-up do vendedor',
        ],
      },

      dimensaoFinanceiro: {
        score: 85,
        comportamentoPagamento: 'PONTUAL',
        atrasoMedioDias: 2,
        titulosVencidosQtd: 0,
        titulosVencidosValor: 0,
        renegociacoesUltimos12m: 0,
        bloqueiosCreditoHistorico: 0,
        statusCreditoAtual: 'LIBERADO',
        limiteCredito: 850000,
        creditoUtilizado: 310000,
        creditoDisponivel: 540000,
        reavaliacoesCreditoPendentes: false,
        fatoresDetalhados: [
          'Crédito SAP totalmente liberado (R$ 540.000 disponível)',
          'Nenhum título em atraso ou protesto',
        ],
      },

      dimensaoPesquisa: {
        score: 60,
        npsScore: 5,
        npsZone: 'DETRATOR',
        csatGeral: 2.8,
        csatProduto: 3.0,
        csatComercial: 3.5,
        csatEntrega: 2.0,
        totalPesquisasRespondidas: 2,
        ultimaPesquisaData: '14/10/2024',
        canalUltimaResposta: 'WhatsApp',
        comentariosRecentes: [
          'Tivemos problemas com o prazo do último lote de perfis e a avaria demorou a ser reposta pela fábrica.',
        ],
        fatoresDetalhados: [
          'NPS Detrator (Nota 5/10) devido a prazo e SAC',
          'CSAT Entrega baixo (2.0/5) por conta dos atrasos do frete',
        ],
      },

      impactosPositivos: [
        'Comportamento de pagamento exemplar e limite de crédito livre de R$ 540.000,00',
        'Pedido em carteira ativo de 12.0 t com faturamento programado',
        'Relacionamento histórico de 8 anos como cliente Chave CIAFAL',
      ],
      impactosNegativos: [
        'Queda de 28.5% de volume no último mês',
        '1 reclamação de qualidade aberta no SAC sobre empenamento em lote',
        '3 entregas atrasadas no TMS nos últimos 45 dias',
        '28 dias sem visita ou contato presencial do vendedor',
        '2 tarefas comerciais vencidas no CRM',
      ],

      alertas: [
        {
          id: 'alt-101',
          tipo: 'QUEDA_ISC',
          nivel: 'CRITICO',
          mensagem:
            'Cliente apresentou deterioração relevante de relacionamento (ISC caiu de 84 para 67).',
          fatos: ['Queda de 17 pontos no ISC oficial CIAFAL nos últimos 30 dias'],
          dataIdentificacao: '18/10/2024',
          resolvido: false,
        },
        {
          id: 'alt-102',
          tipo: 'QUEDA_VOLUME',
          nivel: 'ATENCAO',
          mensagem: 'Queda brusca de volume faturado (-28.5% no período).',
          fatos: ['Volume caiu de 44.8 t para 32.0 t no fechamento anterior'],
          dataIdentificacao: '15/10/2024',
          resolvido: false,
        },
        {
          id: 'alt-103',
          tipo: 'RECLAMACAO_REINCIDENTE',
          nivel: 'CRITICO',
          mensagem: 'Reclamação reincidente de avaria/empenamento de perfis.',
          fatos: ['Protocolo SAC #891 aguarda parecer técnico da Qualidade'],
          dataIdentificacao: '19/10/2024',
          resolvido: false,
        },
      ],

      timeline: [
        {
          id: 'tl-1',
          dataHora: '19/10/2024 09:15',
          sistemaOrigem: 'SAC / Qualidade',
          tipo: 'RECLAMACAO_ABERTA',
          titulo: 'Reclamação Aberta no SAC #891',
          descricao: 'Cliente reportou empenamento superficial em 3 barras de Perfil W 200x26.6.',
          usuario: 'Carlos Mendonça',
          status: 'EM_ANALISE',
          impactoISC: 'NEGATIVO',
        },
        {
          id: 'tl-2',
          dataHora: '16/10/2024 14:30',
          sistemaOrigem: 'TMS',
          tipo: 'CARGA_ATRASADA',
          titulo: 'Atraso na Carga TMS-9912',
          descricao:
            'Carreta retida para conferência no pátio Contagem. Entrega reprogramada para o dia seguinte.',
          usuario: 'Integrador TMS',
          impactoISC: 'NEGATIVO',
        },
        {
          id: 'tl-3',
          dataHora: '14/10/2024 11:00',
          sistemaOrigem: 'Portal Pesquisas',
          tipo: 'PESQUISA_RESPONDIDA',
          titulo: 'Pesquisa NPS Respondida via WhatsApp',
          descricao:
            'Respondente: Roberto Antunes (Diretor de Obras). Nota NPS: 5 (Detrator). CSAT Entrega: 2/5.',
          impactoISC: 'NEGATIVO',
        },
        {
          id: 'tl-4',
          dataHora: '05/10/2024 16:20',
          sistemaOrigem: 'SAP ECC',
          tipo: 'PEDIDO_FATURADO',
          titulo: 'Faturamento Pedido SAP #99014',
          descricao: 'Faturadas 12.0 t de Perfis Laminados no valor de R$ 74.400,00.',
          usuario: 'Faturamento Matriz',
          impactoISC: 'POSITIVO',
        },
      ],

      historicoISC: [
        {
          data: '2024-05-01',
          periodo: 'Mai/24',
          isc: 88,
          qualidade: 90,
          logistica: 92,
          comercial: 86,
          financeiro: 90,
          pesquisa: 80,
          eventoRelevante: 'Fechamento de contrato anual de fornecimento',
        },
        {
          data: '2024-06-01',
          periodo: 'Jun/24',
          isc: 87,
          qualidade: 88,
          logistica: 90,
          comercial: 85,
          financeiro: 92,
          pesquisa: 80,
        },
        {
          data: '2024-07-01',
          periodo: 'Jul/24',
          isc: 86,
          qualidade: 85,
          logistica: 88,
          comercial: 84,
          financeiro: 92,
          pesquisa: 80,
        },
        {
          data: '2024-08-01',
          periodo: 'Ago/24',
          isc: 84,
          qualidade: 82,
          logistica: 85,
          comercial: 80,
          financeiro: 95,
          pesquisa: 75,
          eventoRelevante: 'Início de pequenos atrasos no CD',
        },
        {
          data: '2024-09-01',
          periodo: 'Set/24',
          isc: 75,
          qualidade: 70,
          logistica: 72,
          comercial: 74,
          financeiro: 95,
          pesquisa: 65,
          eventoRelevante: 'Atraso em 2 cargas e primeira reclamação SAC',
        },
        {
          data: '2024-10-01',
          periodo: 'Out/24',
          isc: 67,
          qualidade: 60,
          logistica: 68,
          comercial: 65,
          financeiro: 85,
          pesquisa: 60,
          eventoRelevante: 'Queda de 28% no volume e reincidência de SAC',
        },
      ],

      possuiPlanoRecuperacaoAtivo: true,
      planoRecuperacaoId: 'pln-001',

      analiseIA: {
        clienteId: 'cli-100001',
        clienteNome: 'Metalúrgica Santa Rita Ltda',
        geradoEm: '2024-10-19 10:30',
        situacaoAtual:
          'Cliente Chave Estratégico em Risco com ISC 67/100, apresentando forte deterioração logística e reclamação não resolvida no SAC.',
        oQueMudou:
          'O cliente reduziu as compras mensais em 28.5% após dois episódios consecutivos de atraso na entrega e segregou 3.0 t com queixa de empenamento.',
        fatos: [
          'FATO: Volume faturado caiu de 44.8 t para 32.0 t (-28.5%) no último ciclo.',
          'FATO: Ocorrência TMS #9912 registrou atraso de 72h na entrega de perfis em 16/10.',
          'FATO: Há 1 reclamação aberta no SAC (Protocolo #891) sem parecer final da Engenharia de Qualidade.',
          'FATO: Cliente possui 98.5 t de Perfis W disponíveis em estoque imediato no CD Contagem.',
        ],
        hipoteses: [
          'HIPÓTESE: O cliente pode estar cotando e comprando parte do mix com distribuidor concorrente da Grande BH para suprir obras emergenciais.',
          'HIPÓTESE: A insatisfação com a logística de entrega reduziu a confiança do setor de compras do cliente.',
        ],
        recomendacoes: [
          'RECOMENDAÇÃO: Realizar visita presencial conjunta entre Vendedor e Gestor Comercial até 23/10.',
          'RECOMENDAÇÃO: Agilizar a troca física das 3.0 t de perfis com o lote sadio disponível no CD Contagem.',
          'RECOMENDAÇÃO: Apresentar proposta comercial de lote completo com frete dedicado CIAFAL.',
        ],
        possiveisCausas: [
          'Gargalo no carregamento noturno do CD Contagem gerando atrasos em cascata na rota MG-050.',
          'Falta de resposta célere do SAC com feedback técnico ao cliente.',
        ],
        riscosIdentificados: [
          'Risco de perda total da conta para concorrente regional (impacto de R$ 1.45M/ano).',
          'Degradação do NPS para níveis críticos em obras futuras do cliente.',
        ],
        oportunidadesIdentificadas: [
          'Há 98.5 t de Perfil W 200x26.6 prontas no estoque do CD Contagem (Lote sadio A572-8891).',
          'Limite de crédito de R$ 540.000,00 permite faturamento imediato de 2 carretas completas.',
        ],
        prioridadeAcao: 'URGENTE',
        proximaMelhorAcao: {
          acao: 'Agendar Visita de Recuperação & Troca Imediata do Lote SAC',
          tipoAcao: 'AGENDAR_VISITA',
          justificativa:
            'Visita presencial para restabelecer a confiança do cliente, apresentar o parecer de qualidade e ofertar lote sadio de 25 t do CD Contagem.',
          prazoSugeridoDias: 2,
          estoqueConexo: {
            produtoCodigo: 'PERF-W-200X26',
            produtoDescricao: 'Perfil W 200 x 26.6 kg/m ASTM A572 Gr50 Barra 12m',
            saldoDisponivelTons: 98.5,
            precoMedioSugeridoKg: 6.45,
          },
        },
      },

      temDivergenciaPesquisaComportamento: false,
      is_mock: true,
      sistemaOrigemInfo: {
        sapEccSync: 'SAP ECC — Atualizado hoje às 08:30 (RFC Staging)',
        tmsSync: 'TMS CIAFAL — Atualizado hoje às 08:28',
        wmsSync: 'WMS Pátio Contagem — Online',
        qualidadeSync: 'SAC / Qualidade — Atualizado hoje às 09:15',
        pesquisaSync: 'Portal Pesquisas — Atualizado em 14/10',
      },
    },

    // Cliente 2: Crítico com Queda Severa
    {
      id: 'cli-100008',
      sapCode: '100008',
      razaoSocial: 'Estruturas Metálicas Sete Lagoas Ltda',
      nomeFantasia: 'Estruturas Metálicas Sete Lagoas',
      cnpj: '24.987.123/0001-44',
      segmento: 'Construção Civil',
      subsegmento: 'Perfis Conformados',
      regiao: 'Sete Lagoas / Centro',
      cidade: 'Sete Lagoas',
      uf: 'MG',
      vendedorId: 'qas-vendedor_teste',
      vendedorNome: 'Carlos Mendonça',
      gestorNome: 'Roberto Silveira (Gerente Regional)',
      equipe: 'Equipe Minas Geral',
      classificacaoCliente: 'B',

      faturamentoYTD: 580000,
      faturamentoMesAnterior: 0,
      volumeYTD: 98.0,
      volumeMesAnterior: 0.0,

      iscAtual: 48,
      iscAnterior: 79,
      iscVariacao: -31,
      faixaISC: 'CRITICO',
      tendencia: 'Piorando',
      riscoChurnPct: 88,

      scoreValorEstrategico: 72,
      quadranteMatriz: 'PRIORIDADE_MAXIMA',

      dimensaoQualidade: {
        score: 45,
        reclamacoesAbertas: 2,
        reclamacoesEncerradas: 1,
        reclamacoesReincidentes: 2,
        gravidadeMedia: 'CRITICA',
        naoConformidades: 3,
        devolucoesQtd: 2,
        devolucoesTons: 8.5,
        desviosProcesso: 2,
        retrabalhosQtd: 2,
        tempoMedioRespostaHoras: 96,
        tempoMedioResolucaoDias: 20,
        eficaciaAcaoCorretivaPct: 40,
        fatoresDetalhados: [
          '2 reclamações abertas de oxidação e soldabilidade',
          '2 devoluções totais de carga nos últimos 90 dias',
        ],
      },

      dimensaoLogistica: {
        score: 55,
        entregasNoPrazoPct: 62.0,
        otifPct: 58.0,
        diferencaDataDesejadaEntregueDias: 6.0,
        totalEntregasPeriodo: 6,
        entregasAtrasadas: 3,
        entregasCargaParcial: 2,
        reentregasQtd: 2,
        avariasTransporteQtd: 2,
        ocorrenciasTMS: 4,
        tempoMedioTransporteHoras: 36,
        divergenciaQuantidadeQtd: 1,
        transportadorasPrincipais: ['Expresso Regional MG'],
        eventosTMSUltimos: ['Carga recusada no descarregamento por documentação'],
        fatoresDetalhados: [
          'OTIF crítico em 58.0%',
          'Reentrega de carga recusada por divergência de espessura',
        ],
      },

      dimensaoComercial: {
        score: 42,
        diasUltimoContato: 55,
        frequenciaContatoDias: 15,
        visitasRealizadasUltimos90d: 0,
        ligacoesUltimos30d: 0,
        whatsAppInteracoes30d: 1,
        emailsEnviados30d: 1,
        tarefasRealizadas: 1,
        tarefasVencidas: 3,
        cotacoesAbertas: 0,
        cotacoesConvertidas: 0,
        taxaConversaoCotacoesPct: 0.0,
        pedidosEmCarteiraQtd: 0,
        pedidosEmCarteiraTons: 0.0,
        frequenciaCompraDias: 25,
        diasSemCompra: 78,
        variacaoVolumePct: -100.0,
        perdaMixHistorico: true,
        produtosAbandonadosCount: 3,
        produtosAbandonadosNomes: ['Perfil U Dobrado 150x50', 'Tubo Metalon 50x50'],
        fatoresDetalhados: [
          '100% de queda no volume: zero compras há 78 dias',
          '55 dias sem nenhum contato registrado pelo vendedor',
          '3 tarefas comerciais vencidas',
        ],
      },

      dimensaoFinanceiro: {
        score: 50,
        comportamentoPagamento: 'REINCIDENTE',
        atrasoMedioDias: 18,
        titulosVencidosQtd: 2,
        titulosVencidosValor: 48500,
        renegociacoesUltimos12m: 2,
        bloqueiosCreditoHistorico: 1,
        statusCreditoAtual: 'RESTRITO',
        limiteCredito: 250000,
        creditoUtilizado: 180000,
        creditoDisponivel: 70000,
        reavaliacoesCreditoPendentes: true,
        fatoresDetalhados: [
          '2 títulos vencidos totalizando R$ 48.500,00',
          'Status de crédito RESTRITO no SAP ECC',
        ],
      },

      dimensaoPesquisa: {
        score: 40,
        npsScore: 2,
        npsZone: 'DETRATOR',
        csatGeral: 1.8,
        csatProduto: 2.0,
        csatComercial: 2.0,
        csatEntrega: 1.5,
        totalPesquisasRespondidas: 1,
        ultimaPesquisaData: '28/09/2024',
        canalUltimaResposta: 'E-mail',
        comentariosRecentes: [
          'Ficamos muito prejudicados com a última entrega errada. Ninguém da CIAFAL nos retornou.',
        ],
        fatoresDetalhados: [
          'NPS Crítico (Nota 2/10)',
          'Comentário expressando sensação de abandono comercial',
        ],
      },

      impactosPositivos: [
        'Cliente com demanda fabril contínua na região de Sete Lagoas',
        'Histórico prévio de consumo de 20 t/mês de perfis dobrados',
      ],
      impactosNegativos: [
        'ISC em nível CRÍTICO (48/100) com queda de 31 pontos',
        'Cliente sem compras há 78 dias e 55 dias sem contato',
        '2 títulos vencidos de R$ 48.500,00 com restrição de crédito',
        '2 reclamações sem solução no SAC',
      ],

      alertas: [
        {
          id: 'alt-201',
          tipo: 'QUEDA_ISC',
          nivel: 'CRITICO',
          mensagem: 'Cliente em estado CRÍTICO (ISC 48). Risco iminente de perda definitiva.',
          fatos: ['ISC caiu de 79 para 48 em 60 dias'],
          dataIdentificacao: '10/10/2024',
          resolvido: false,
        },
        {
          id: 'alt-202',
          tipo: 'SEM_COMPRA',
          nivel: 'CRITICO',
          mensagem: 'Cliente sem compras há 78 dias (ciclo habitual de 25 dias).',
          fatos: ['Volume caiu 100% no último mês'],
          dataIdentificacao: '01/10/2024',
          resolvido: false,
        },
      ],

      timeline: [
        {
          id: 'tl-201',
          dataHora: '28/09/2024 15:00',
          sistemaOrigem: 'Portal Pesquisas',
          tipo: 'PESQUISA_RESPONDIDA',
          titulo: 'Pesquisa NPS Detrator (Nota 2)',
          descricao: 'Cliente insatisfeito com entrega incorreta e falta de suporte.',
          impactoISC: 'NEGATIVO',
        },
        {
          id: 'tl-202',
          dataHora: '15/09/2024 11:20',
          sistemaOrigem: 'SAP ECC',
          tipo: 'CARGA_ATRASADA',
          titulo: 'Bloqueio de Faturamento por Título Vencido',
          descricao: 'Ordem de venda bloqueada automaticamente por restrição financeira.',
          impactoISC: 'NEGATIVO',
        },
      ],

      historicoISC: [
        {
          data: '2024-05-01',
          periodo: 'Mai/24',
          isc: 82,
          qualidade: 85,
          logistica: 80,
          comercial: 84,
          financeiro: 80,
          pesquisa: 80,
        },
        {
          data: '2024-06-01',
          periodo: 'Jun/24',
          isc: 80,
          qualidade: 82,
          logistica: 78,
          comercial: 80,
          financeiro: 80,
          pesquisa: 80,
        },
        {
          data: '2024-07-01',
          periodo: 'Jul/24',
          isc: 79,
          qualidade: 80,
          logistica: 75,
          comercial: 78,
          financeiro: 80,
          pesquisa: 80,
        },
        {
          data: '2024-08-01',
          periodo: 'Ago/24',
          isc: 68,
          qualidade: 65,
          logistica: 68,
          comercial: 65,
          financeiro: 70,
          pesquisa: 60,
          eventoRelevante: 'Entrega devolvida e atraso em títulos',
        },
        {
          data: '2024-09-01',
          periodo: 'Set/24',
          isc: 55,
          qualidade: 50,
          logistica: 60,
          comercial: 50,
          financeiro: 60,
          pesquisa: 50,
          eventoRelevante: 'Interrupção de pedidos e bloqueio de crédito',
        },
        {
          data: '2024-10-01',
          periodo: 'Out/24',
          isc: 48,
          qualidade: 45,
          logistica: 55,
          comercial: 42,
          financeiro: 50,
          pesquisa: 40,
          eventoRelevante: '78 dias sem compras e sem contato comercial',
        },
      ],

      possuiPlanoRecuperacaoAtivo: true,
      planoRecuperacaoId: 'pln-002',

      analiseIA: {
        clienteId: 'cli-100008',
        clienteNome: 'Estruturas Metálicas Sete Lagoas Ltda',
        geradoEm: '2024-10-19 11:00',
        situacaoAtual:
          'Cliente Crítico com relacionamento rompido na prática (sem pedidos há 78 dias, restrição financeira e insatisfação no SAC).',
        oQueMudou:
          'Houve uma devolução não tratada adequadamente em agosto, gerando retenção de pagamento e bloqueio automático no SAP, paralisando as compras.',
        fatos: [
          'FATO: Cliente não emite ordens de compra na CIAFAL há 78 dias.',
          'FATO: Existem 2 títulos vencidos no total de R$ 48.500,00 vinculados à carga contestada.',
          'FATO: Existem 40.0 t de Perfil U Dobrado disponíveis no CD Contagem.',
        ],
        hipoteses: [
          'HIPÓTESE: O cliente reteve o pagamento como retaliação pela falta de nota de devolução e substituição do lote.',
          'HIPÓTESE: O cliente está sendo abastecido 100% pela concorrência local de Sete Lagoas.',
        ],
        recomendacoes: [
          'RECOMENDAÇÃO: Intervenção imediata do Gerente Comercial junto à Gerência Financeira para renegociar/abater o título da carga contestada.',
          'RECOMENDAÇÃO: Realizar visita presencial de recuperação na fábrica em Sete Lagoas em até 48h.',
          'RECOMENDAÇÃO: Liberar linha de crédito para novo fornecimento do lote de Perfil U em estoque.',
        ],
        possiveisCausas: [
          'Falta de alinhamento entre Financeiro e SAC na baixa do título da mercadoria devolvida.',
          'Ausência de acompanhamento comercial durante 55 dias.',
        ],
        riscosIdentificados: [
          'Perda definitiva do cliente e judicialização da cobrança dos títulos.',
        ],
        oportunidadesIdentificadas: [
          'Estoque de 40.0 t de Perfil U Dobrado (material exato do cliente) parado no CD Contagem.',
        ],
        prioridadeAcao: 'URGENTE',
        proximaMelhorAcao: {
          acao: 'Escalar para Gerente Comercial & Financeiro para Renegociação e Visita',
          tipoAcao: 'ESCALAR_GESTOR',
          justificativa:
            'Necessária ação multidisciplinar (Comercial + Financeiro) para destravar títulos contestados e realizar visita presencial de retomada.',
          prazoSugeridoDias: 1,
          estoqueConexo: {
            produtoCodigo: 'PERF-U-DOBR-150X50',
            produtoDescricao: 'Perfil U Dobrado 150 x 50 x 3.00mm x 6m SAE 1010',
            saldoDisponivelTons: 40.0,
            precoMedioSugeridoKg: 5.8,
          },
        },
      },

      temDivergenciaPesquisaComportamento: false,
      is_mock: true,
      sistemaOrigemInfo: {
        sapEccSync: 'SAP ECC — Atualizado hoje às 08:30',
        tmsSync: 'TMS CIAFAL — Atualizado hoje às 08:28',
        wmsSync: 'WMS Pátio Contagem — Online',
        qualidadeSync: 'SAC / Qualidade — Atualizado hoje às 09:15',
        pesquisaSync: 'Portal Pesquisas — Atualizado em 28/09',
      },
    },

    // Cliente 3: Divergência entre Pesquisa e Comportamento (NPS 9, mas volume em queda livre)
    {
      id: 'cli-100017',
      sapCode: '100017',
      razaoSocial: 'Serralheria & Coberturas Montes Claros Ltda',
      nomeFantasia: 'Serralheria Montes Claros',
      cnpj: '31.112.445/0001-90',
      segmento: 'Construção Civil',
      subsegmento: 'Serralheria & Esquadrias',
      regiao: 'Norte de Minas',
      cidade: 'Montes Claros',
      uf: 'MG',
      vendedorId: 'qas-representante_teste',
      vendedorNome: 'João Pedro Representações',
      gestorNome: 'Roberto Silveira (Gerente Regional)',
      equipe: 'Equipe Minas Geral',
      classificacaoCliente: 'B',

      faturamentoYTD: 420000,
      faturamentoMesAnterior: 15000,
      volumeYTD: 78.0,
      volumeMesAnterior: 2.8,

      iscAtual: 71,
      iscAnterior: 86,
      iscVariacao: -15,
      faixaISC: 'ATENCAO',
      tendencia: 'Piorando',
      riscoChurnPct: 52,

      scoreValorEstrategico: 65,
      quadranteMatriz: 'PRIORIDADE_MAXIMA',

      dimensaoQualidade: {
        score: 75,
        reclamacoesAbertas: 0,
        reclamacoesEncerradas: 1,
        reclamacoesReincidentes: 0,
        gravidadeMedia: 'BAIXA',
        naoConformidades: 0,
        devolucoesQtd: 0,
        devolucoesTons: 0,
        desviosProcesso: 0,
        retrabalhosQtd: 0,
        tempoMedioRespostaHoras: 24,
        tempoMedioResolucaoDias: 4,
        eficaciaAcaoCorretivaPct: 90,
        fatoresDetalhados: ['Nenhuma não conformidade aberta recente'],
      },

      dimensaoLogistica: {
        score: 70,
        entregasNoPrazoPct: 82.0,
        otifPct: 80.0,
        diferencaDataDesejadaEntregueDias: 3.0,
        totalEntregasPeriodo: 5,
        entregasAtrasadas: 1,
        entregasCargaParcial: 0,
        reentregasQtd: 0,
        avariasTransporteQtd: 0,
        ocorrenciasTMS: 1,
        tempoMedioTransporteHoras: 48,
        divergenciaQuantidadeQtd: 0,
        transportadorasPrincipais: ['Expresso Norte Minas'],
        eventosTMSUltimos: ['Janela de descarga cumprida'],
        fatoresDetalhados: ['Frete consolidado para o Norte de MG com tempo médio de 48h'],
      },

      dimensaoComercial: {
        score: 55,
        diasUltimoContato: 38,
        frequenciaContatoDias: 14,
        visitasRealizadasUltimos90d: 0,
        ligacoesUltimos30d: 1,
        whatsAppInteracoes30d: 2,
        emailsEnviados30d: 0,
        tarefasRealizadas: 2,
        tarefasVencidas: 1,
        cotacoesAbertas: 1,
        cotacoesConvertidas: 0,
        taxaConversaoCotacoesPct: 0.0,
        pedidosEmCarteiraQtd: 0,
        pedidosEmCarteiraTons: 0.0,
        frequenciaCompraDias: 20,
        diasSemCompra: 64,
        variacaoVolumePct: -42.0,
        perdaMixHistorico: true,
        produtosAbandonadosCount: 2,
        produtosAbandonadosNomes: ['Tubo Metalon 50x50', 'Chapa Galvanizada'],
        fatoresDetalhados: [
          'Queda acentuada de 42% no volume faturado',
          'Cliente sem compra de tubos há 64 dias',
          '38 dias sem contato direto do representante',
        ],
      },

      dimensaoFinanceiro: {
        score: 95,
        comportamentoPagamento: 'PONTUAL',
        atrasoMedioDias: 0,
        titulosVencidosQtd: 0,
        titulosVencidosValor: 0,
        renegociacoesUltimos12m: 0,
        bloqueiosCreditoHistorico: 0,
        statusCreditoAtual: 'LIBERADO',
        limiteCredito: 300000,
        creditoUtilizado: 45000,
        creditoDisponivel: 255000,
        reavaliacoesCreditoPendentes: false,
        fatoresDetalhados: [
          'Crédito excelente e totalmente liberado (R$ 255.000 disponível)',
          'Pagamento 100% em dia',
        ],
      },

      dimensaoPesquisa: {
        score: 92,
        npsScore: 9,
        npsZone: 'PROMOTOR',
        csatGeral: 4.8,
        csatProduto: 5.0,
        csatComercial: 4.5,
        csatEntrega: 4.5,
        totalPesquisasRespondidas: 2,
        ultimaPesquisaData: '12/10/2024',
        canalUltimaResposta: 'WhatsApp',
        comentariosRecentes: ['Gostamos muito do atendimento da CIAFAL e da qualidade dos tubos.'],
        fatoresDetalhados: ['NPS Promotor 9/10 e CSAT 4.8/5 registrado na pesquisa'],
      },

      impactosPositivos: [
        'Pesquisa de satisfação extremamente favorável (NPS 9 e CSAT 4.8)',
        'Pagamento rigorosamente pontual e crédito pré-aprovado de R$ 255.000',
      ],
      impactosNegativos: [
        'Divergência Crítica: pesquisa positiva porém volume caiu 42%',
        '64 dias sem compras de reposição de estoque',
        '38 dias sem visita do representante regional',
      ],

      alertas: [
        {
          id: 'alt-301',
          tipo: 'DIVERGENCIA_PESQUISA',
          nivel: 'ATENCAO',
          mensagem:
            'Divergência identificada: Pesquisa positiva, porém comportamento comercial apresenta deterioração.',
          fatos: [
            'Cliente deu nota NPS 9 na pesquisa, mas reduziu compras em 42% e está há 64 dias sem emitir pedidos.',
          ],
          dataIdentificacao: '15/10/2024',
          resolvido: false,
        },
        {
          id: 'alt-302',
          tipo: 'SEM_CONTATO',
          nivel: 'PREVENTIVO',
          mensagem: '38 dias sem contato direto do representante comercial.',
          fatos: ['Representante não realizou visita no ciclo mensal'],
          dataIdentificacao: '16/10/2024',
          resolvido: false,
        },
      ],

      timeline: [
        {
          id: 'tl-301',
          dataHora: '12/10/2024 10:15',
          sistemaOrigem: 'Portal Pesquisas',
          tipo: 'PESQUISA_RESPONDIDA',
          titulo: 'Pesquisa NPS Promotor (Nota 9)',
          descricao: 'Cliente elogiou o produto, porém não realizou compras subsequentes.',
          impactoISC: 'POSITIVO',
        },
        {
          id: 'tl-302',
          dataHora: '20/09/2024 09:00',
          sistemaOrigem: 'CRM 360',
          tipo: 'TAREFA_CRIADA',
          titulo: 'Follow-up de Tubos Metalon',
          descricao: 'Representante agendou ligação de cotação para mix de serralheria.',
          impactoISC: 'NEUTRO',
        },
      ],

      historicoISC: [
        {
          data: '2024-05-01',
          periodo: 'Mai/24',
          isc: 88,
          qualidade: 90,
          logistica: 85,
          comercial: 90,
          financeiro: 95,
          pesquisa: 90,
        },
        {
          data: '2024-06-01',
          periodo: 'Jun/24',
          isc: 87,
          qualidade: 90,
          logistica: 85,
          comercial: 88,
          financeiro: 95,
          pesquisa: 90,
        },
        {
          data: '2024-07-01',
          periodo: 'Jul/24',
          isc: 86,
          qualidade: 85,
          logistica: 82,
          comercial: 85,
          financeiro: 95,
          pesquisa: 90,
        },
        {
          data: '2024-08-01',
          periodo: 'Ago/24',
          isc: 82,
          qualidade: 80,
          logistica: 80,
          comercial: 75,
          financeiro: 95,
          pesquisa: 90,
        },
        {
          data: '2024-09-01',
          periodo: 'Set/24',
          isc: 76,
          qualidade: 78,
          logistica: 75,
          comercial: 65,
          financeiro: 95,
          pesquisa: 92,
          eventoRelevante: 'Divergência detectada entre pesquisa e compras',
        },
        {
          data: '2024-10-01',
          periodo: 'Out/24',
          isc: 71,
          qualidade: 75,
          logistica: 70,
          comercial: 55,
          financeiro: 95,
          pesquisa: 92,
          eventoRelevante: 'Queda de 42% no volume e 64 dias sem compras',
        },
      ],

      possuiPlanoRecuperacaoAtivo: false,

      analiseIA: {
        clienteId: 'cli-100017',
        clienteNome: 'Serralheria & Coberturas Montes Claros Ltda',
        geradoEm: '2024-10-19 11:15',
        situacaoAtual:
          'Alerta Preventivo de Perda Silenciosa: Cliente elogia a CIAFAL na pesquisa (NPS 9), mas parou de comprar o mix de Tubos Metalon.',
        oQueMudou:
          'O cliente reduziu as compras em 42% nos últimos 60 dias sem registrar nenhuma reclamação formal.',
        fatos: [
          'FATO: Pesquisa NPS respondida em 12/10 com nota 9 e CSAT 4.8.',
          'FATO: Volume faturado caiu 42% no mesmo período.',
          'FATO: Existem 64.0 t de Tubos Metalon 50x50 disponíveis no CD Contagem.',
        ],
        hipoteses: [
          'HIPÓTESE: O cliente tem excelente relacionamento institucional, mas pode estar comprando tubos de concorrente local por agressividade de preço ou prazo de entrega no Norte de MG.',
          'HIPÓTESE: Falta de proatividade do representante comercial para fechar cotações de reposição.',
        ],
        recomendacoes: [
          'RECOMENDAÇÃO: Realizar contato telefônico comercial imediato para entender o motivo da interrupção de compra dos tubos.',
          'RECOMENDAÇÃO: Ofertar o lote de 64.0 t de Metalon com consolidação de frete na rota de Montes Claros TMS-9972.',
        ],
        possiveisCausas: [
          'Preço spot de tubos de distribuidores regionais no Norte de Minas.',
          'Falta de visitas presenciais do representante nos últimos 38 dias.',
        ],
        riscosIdentificados: [
          'Perda silenciosa e consolidação do concorrente como fornecedor principal.',
        ],
        oportunidadesIdentificadas: [
          'Há 64.0 t de Tubo Metalon 50x50 disponível no estoque com carregamento TMS previsto para 24/10.',
          'Crédito pré-aprovado de R$ 255.000 permite faturamento imediato.',
        ],
        prioridadeAcao: 'ALTA',
        proximaMelhorAcao: {
          acao: 'Ofertar Lote Disponível de Metalon com Janela Logística TMS Montes Claros',
          tipoAcao: 'RECUPERAR_MIX_ESTOQUE',
          justificativa:
            'Aproveitar a imagem positiva na pesquisa para ofertar 10 t de Tubos Metalon em estoque no CD com frete consolidado na rota TMS de Montes Claros.',
          prazoSugeridoDias: 2,
          estoqueConexo: {
            produtoCodigo: 'TUB-MET-50X50-2MM',
            produtoDescricao: 'Tubo Metalon Quadrado 50 x 50 x 2.00mm x 6m SAE 1008/1012',
            saldoDisponivelTons: 64.0,
            precoMedioSugeridoKg: 6.1,
          },
        },
      },

      temDivergenciaPesquisaComportamento: true,
      divergenciaDescricao:
        'Cliente respondeu NPS 9 (Promotor) e CSAT 4.8, porém comportamento comercial apresenta queda de 42% e 64 dias sem compras.',
      is_mock: true,
      sistemaOrigemInfo: {
        sapEccSync: 'SAP ECC — Atualizado hoje às 08:30',
        tmsSync: 'TMS CIAFAL — Atualizado hoje às 08:28',
        wmsSync: 'WMS Pátio Contagem — Online',
        qualidadeSync: 'SAC / Qualidade — Atualizado hoje às 09:15',
        pesquisaSync: 'Portal Pesquisas — Atualizado em 12/10',
      },
    },

    // Cliente 4: Excelente / Proteger
    {
      id: 'cli-100002',
      sapCode: '100002',
      razaoSocial: 'Aços & Caldeiraria Betim S.A.',
      nomeFantasia: 'Aços & Caldeiraria Betim',
      cnpj: '19.456.789/0001-12',
      segmento: 'Indústria',
      subsegmento: 'Caldeiraria Pesada',
      regiao: 'Grande BH',
      cidade: 'Betim',
      uf: 'MG',
      vendedorId: 'qas-vendedor_teste',
      vendedorNome: 'Carlos Mendonça',
      gestorNome: 'Roberto Silveira (Gerente Regional)',
      equipe: 'Equipe Minas Geral',
      classificacaoCliente: 'Estratégico',

      faturamentoYTD: 2850000,
      faturamentoMesAnterior: 340000,
      volumeYTD: 490.0,
      volumeMesAnterior: 58.0,

      iscAtual: 94,
      iscAnterior: 92,
      iscVariacao: 2,
      faixaISC: 'EXCELENTE',
      tendencia: 'Melhorando',
      riscoChurnPct: 4,

      scoreValorEstrategico: 96,
      quadranteMatriz: 'PROTEGER',

      dimensaoQualidade: {
        score: 96,
        reclamacoesAbertas: 0,
        reclamacoesEncerradas: 2,
        reclamacoesReincidentes: 0,
        gravidadeMedia: 'BAIXA',
        naoConformidades: 0,
        devolucoesQtd: 0,
        devolucoesTons: 0,
        desviosProcesso: 0,
        retrabalhosQtd: 0,
        tempoMedioRespostaHoras: 12,
        tempoMedioResolucaoDias: 2,
        eficaciaAcaoCorretivaPct: 100,
        fatoresDetalhados: ['Zero reclamações ou NCs abertas', '100% de conformidade técnica'],
      },

      dimensaoLogistica: {
        score: 95,
        entregasNoPrazoPct: 98.5,
        otifPct: 97.0,
        diferencaDataDesejadaEntregueDias: 0.5,
        totalEntregasPeriodo: 24,
        entregasAtrasadas: 0,
        entregasCargaParcial: 0,
        reentregasQtd: 0,
        avariasTransporteQtd: 0,
        ocorrenciasTMS: 0,
        tempoMedioTransporteHoras: 12,
        divergenciaQuantidadeQtd: 0,
        transportadorasPrincipais: ['Frota Própria CIAFAL'],
        eventosTMSUltimos: ['Entregas 100% no prazo via frota dedicada'],
        fatoresDetalhados: ['OTIF excelente em 97.0%', 'Frota dedicada Betim com entrega em 24h'],
      },

      dimensaoComercial: {
        score: 92,
        diasUltimoContato: 4,
        frequenciaContatoDias: 7,
        visitasRealizadasUltimos90d: 4,
        ligacoesUltimos30d: 6,
        whatsAppInteracoes30d: 18,
        emailsEnviados30d: 8,
        tarefasRealizadas: 8,
        tarefasVencidas: 0,
        cotacoesAbertas: 3,
        cotacoesConvertidas: 3,
        taxaConversaoCotacoesPct: 100.0,
        pedidosEmCarteiraQtd: 2,
        pedidosEmCarteiraTons: 35.0,
        frequenciaCompraDias: 12,
        diasSemCompra: 7,
        variacaoVolumePct: 14.5,
        perdaMixHistorico: false,
        produtosAbandonadosCount: 0,
        produtosAbandonadosNomes: [],
        fatoresDetalhados: [
          'Crescimento de 14.5% de volume no período',
          'Contato frequente realizado há 4 dias',
          '2 pedidos em carteira totalizando 35.0 t',
        ],
      },

      dimensaoFinanceiro: {
        score: 95,
        comportamentoPagamento: 'PONTUAL',
        atrasoMedioDias: 0,
        titulosVencidosQtd: 0,
        titulosVencidosValor: 0,
        renegociacoesUltimos12m: 0,
        bloqueiosCreditoHistorico: 0,
        statusCreditoAtual: 'LIBERADO',
        limiteCredito: 1500000,
        creditoUtilizado: 620000,
        creditoDisponivel: 880000,
        reavaliacoesCreditoPendentes: false,
        fatoresDetalhados: [
          'Crédito SAP de R$ 1.500.000 com R$ 880.000 livre',
          'Histórico financeiro impecável',
        ],
      },

      dimensaoPesquisa: {
        score: 95,
        npsScore: 10,
        npsZone: 'PROMOTOR',
        csatGeral: 5.0,
        csatProduto: 5.0,
        csatComercial: 5.0,
        csatEntrega: 4.8,
        totalPesquisasRespondidas: 4,
        ultimaPesquisaData: '16/10/2024',
        canalUltimaResposta: 'WhatsApp',
        comentariosRecentes: [
          'Parceria nota 10. Pontualidade de entrega e suporte técnico incomparáveis na região.',
        ],
        fatoresDetalhados: ['NPS 10 Promotor e CSAT Geral 5.0/5'],
      },

      impactosPositivos: [
        'ISC 94/100 (Excelente) com crescimento sustentável de volume (+14.5%)',
        'OTIF de 97.0% com entregas em 24h via frota dedicada CIAFAL',
        'Crédito de R$ 880.000 livre e 2 pedidos em carteira de 35.0 t',
      ],
      impactosNegativos: [],

      alertas: [],

      timeline: [
        {
          id: 'tl-401',
          dataHora: '18/10/2024 16:50',
          sistemaOrigem: 'WMS',
          tipo: 'ENTREGA_CONCLUIDA',
          titulo: 'Checagem de Saldo Físico Confirmada',
          descricao: '6.0 t de Tubos Sch40 conferidas e liberadas para carregamento.',
          usuario: 'Marcelo Ribeiro (WMS)',
          impactoISC: 'POSITIVO',
        },
        {
          id: 'tl-402',
          dataHora: '16/10/2024 09:30',
          sistemaOrigem: 'Portal Pesquisas',
          tipo: 'PESQUISA_RESPONDIDA',
          titulo: 'Pesquisa NPS Nota 10',
          descricao: 'Respondente: Eng. Paulo Mendes. Alta satisfação com o fornecimento contínuo.',
          impactoISC: 'POSITIVO',
        },
      ],

      historicoISC: [
        {
          data: '2024-05-01',
          periodo: 'Mai/24',
          isc: 90,
          qualidade: 92,
          logistica: 90,
          comercial: 88,
          financeiro: 95,
          pesquisa: 90,
        },
        {
          data: '2024-06-01',
          periodo: 'Jun/24',
          isc: 91,
          qualidade: 92,
          logistica: 92,
          comercial: 90,
          financeiro: 95,
          pesquisa: 90,
        },
        {
          data: '2024-07-01',
          periodo: 'Jul/24',
          isc: 92,
          qualidade: 94,
          logistica: 93,
          comercial: 90,
          financeiro: 95,
          pesquisa: 92,
        },
        {
          data: '2024-08-01',
          periodo: 'Ago/24',
          isc: 92,
          qualidade: 95,
          logistica: 94,
          comercial: 90,
          financeiro: 95,
          pesquisa: 92,
        },
        {
          data: '2024-09-01',
          periodo: 'Set/24',
          isc: 93,
          qualidade: 95,
          logistica: 95,
          comercial: 92,
          financeiro: 95,
          pesquisa: 95,
        },
        {
          data: '2024-10-01',
          periodo: 'Out/24',
          isc: 94,
          qualidade: 96,
          logistica: 95,
          comercial: 92,
          financeiro: 95,
          pesquisa: 95,
          eventoRelevante: 'Renovação de fornecimento anual com bonificação',
        },
      ],

      possuiPlanoRecuperacaoAtivo: false,

      analiseIA: {
        clienteId: 'cli-100002',
        clienteNome: 'Aços & Caldeiraria Betim S.A.',
        geradoEm: '2024-10-19 11:30',
        situacaoAtual:
          'Cliente Chave em Excelência (ISC 94/100, Quadrante Proteger). Alto faturamento, pontualidade de faturamento e satisfação máxima.',
        oQueMudou:
          'Crescimento de 14.5% no volume faturado e consolidação de contratos para obras de tanques industriais.',
        fatos: [
          'FATO: Volume YTD atingiu 490.0 t com faturamento de R$ 2.85M.',
          'FATO: OTIF registrado no TMS é de 97.0% com zero atrasos no mês.',
          'FATO: NPS 10 com CSAT 5.0 em todas as dimensões avaliadas.',
        ],
        hipoteses: [
          'HIPÓTESE: Cliente expandirá a planta industrial em 2025, abrindo oportunidade para fornecimento de Chapas Grossas A36.',
        ],
        recomendacoes: [
          'RECOMENDAÇÃO: Apresentar proposta de contrato estendido de longo prazo com garantia de estoque no CD Contagem.',
          'RECOMENDAÇÃO: Realizar almoço de relacionamento entre Diretoria CIAFAL e Presidência do Cliente.',
        ],
        possiveisCausas: [
          'Excelente integração logística e atenção técnica dedicada da equipe de vendas.',
        ],
        riscosIdentificados: [
          'Risco de concorrência tentar ofertar preços predatórios na renovação de 2025.',
        ],
        oportunidadesIdentificadas: [
          '165.0 t de Chapas Grossas A36 disponíveis em estoque no CD Contagem.',
        ],
        prioridadeAcao: 'MEDIA',
        proximaMelhorAcao: {
          acao: 'Apresentar Acordo de Fornecimento Programado de Chapas A36',
          tipoAcao: 'GERAR_COTACAO',
          justificativa:
            'Proteger a conta e blindar contra concorrentes oferecendo garantia de abastecimento de chapas grossas com lote reservado.',
          prazoSugeridoDias: 5,
          estoqueConexo: {
            produtoCodigo: 'CHP-A36-12MM',
            produtoDescricao: 'Chapa Grossa Aço Carbono ASTM A36 12.70mm x 2440 x 6000mm',
            saldoDisponivelTons: 165.0,
            precoMedioSugeridoKg: 5.95,
          },
        },
      },

      temDivergenciaPesquisaComportamento: false,
      is_mock: true,
      sistemaOrigemInfo: {
        sapEccSync: 'SAP ECC — Atualizado hoje às 08:30',
        tmsSync: 'TMS CIAFAL — Atualizado hoje às 08:28',
        wmsSync: 'WMS Pátio Betim — Online',
        qualidadeSync: 'SAC / Qualidade — Atualizado hoje às 09:15',
        pesquisaSync: 'Portal Pesquisas — Atualizado em 16/10',
      },
    },

    // Cliente 5: Atenção - Perda de Mix e Latência Comercial
    {
      id: 'cli-100011',
      sapCode: '100011',
      razaoSocial: 'Oeste Minas Galpões & Coberturas Ltda',
      nomeFantasia: 'Oeste Minas Galpões',
      cnpj: '22.887.334/0001-55',
      segmento: 'Construção Civil',
      subsegmento: 'Galpões & Telhas',
      regiao: 'Centro-Oeste MG',
      cidade: 'Divinópolis',
      uf: 'MG',
      vendedorId: 'qas-vendedor2_teste',
      vendedorNome: 'Mariana Azevedo',
      gestorNome: 'Roberto Silveira (Gerente Regional)',
      equipe: 'Equipe Minas Geral',
      classificacaoCliente: 'B',

      faturamentoYTD: 620000,
      faturamentoMesAnterior: 45000,
      volumeYTD: 82.0,
      volumeMesAnterior: 5.5,

      iscAtual: 74,
      iscAnterior: 86,
      iscVariacao: -12,
      faixaISC: 'ATENCAO',
      tendencia: 'Piorando',
      riscoChurnPct: 38,

      scoreValorEstrategico: 68,
      quadranteMatriz: 'PRIORIDADE_MAXIMA',

      dimensaoQualidade: {
        score: 80,
        reclamacoesAbertas: 0,
        reclamacoesEncerradas: 1,
        reclamacoesReincidentes: 0,
        gravidadeMedia: 'BAIXA',
        naoConformidades: 1,
        devolucoesQtd: 0,
        devolucoesTons: 0,
        desviosProcesso: 0,
        retrabalhosQtd: 0,
        tempoMedioRespostaHoras: 24,
        tempoMedioResolucaoDias: 5,
        eficaciaAcaoCorretivaPct: 85,
        fatoresDetalhados: ['1 Não Conformidade técnica encerrada satisfatoriamente'],
      },

      dimensaoLogistica: {
        score: 75,
        entregasNoPrazoPct: 84.0,
        otifPct: 82.0,
        diferencaDataDesejadaEntregueDias: 2.0,
        totalEntregasPeriodo: 8,
        entregasAtrasadas: 1,
        entregasCargaParcial: 1,
        reentregasQtd: 0,
        avariasTransporteQtd: 0,
        ocorrenciasTMS: 1,
        tempoMedioTransporteHoras: 24,
        divergenciaQuantidadeQtd: 0,
        transportadorasPrincipais: ['Transportadora Divinópolis Express'],
        eventosTMSUltimos: ['Descarga concluída sem avarias'],
        fatoresDetalhados: ['OTIF em 82.0%', '1 entrega parcial por falta de lote no CD'],
      },

      dimensaoComercial: {
        score: 68,
        diasUltimoContato: 24,
        frequenciaContatoDias: 12,
        visitasRealizadasUltimos90d: 1,
        ligacoesUltimos30d: 2,
        whatsAppInteracoes30d: 4,
        emailsEnviados30d: 2,
        tarefasRealizadas: 3,
        tarefasVencidas: 1,
        cotacoesAbertas: 1,
        cotacoesConvertidas: 1,
        taxaConversaoCotacoesPct: 100.0,
        pedidosEmCarteiraQtd: 1,
        pedidosEmCarteiraTons: 5.0,
        frequenciaCompraDias: 18,
        diasSemCompra: 34,
        variacaoVolumePct: -18.0,
        perdaMixHistorico: true,
        produtosAbandonadosCount: 1,
        produtosAbandonadosNomes: ['Bobina Galvalume AZ150'],
        fatoresDetalhados: [
          'Queda de 18% no volume faturado',
          'Produto tradicional (Bobina Galvalume) sem compra há 91 dias',
          '24 dias sem visita ou contato presencial',
        ],
      },

      dimensaoFinanceiro: {
        score: 88,
        comportamentoPagamento: 'PONTUAL',
        atrasoMedioDias: 3,
        titulosVencidosQtd: 0,
        titulosVencidosValor: 0,
        renegociacoesUltimos12m: 0,
        bloqueiosCreditoHistorico: 0,
        statusCreditoAtual: 'LIBERADO',
        limiteCredito: 400000,
        creditoUtilizado: 120000,
        creditoDisponivel: 280000,
        reavaliacoesCreditoPendentes: false,
        fatoresDetalhados: [
          'Crédito liberado com R$ 280.000 disponível',
          'Atraso médio desprezível (3 dias)',
        ],
      },

      dimensaoPesquisa: {
        score: 72,
        npsScore: 7,
        npsZone: 'NEUTRO',
        csatGeral: 3.8,
        csatProduto: 4.0,
        csatComercial: 4.0,
        csatEntrega: 3.5,
        totalPesquisasRespondidas: 2,
        ultimaPesquisaData: '05/10/2024',
        canalUltimaResposta: 'WhatsApp',
        comentariosRecentes: [
          'Atendimento bom, mas precisamos de preços mais agressivos nas bobinas galvalume para fechar os galpões de Pará de Minas.',
        ],
        fatoresDetalhados: ['NPS Neutro (7/10) com demanda por competitividade no Galvalume'],
      },

      impactosPositivos: [
        'Crédito aprovado no SAP ECC com R$ 280.000,00 de limite livre',
        'Cliente fiel na linha de telhas com potencial contínuo na região Centro-Oeste',
      ],
      impactosNegativos: [
        'ISC caiu de 86 para 74 (Faixa de Atenção)',
        'Perda de mix: Bobina Galvalume sem recompra há 91 dias',
        '24 dias sem contato da vendedora',
      ],

      alertas: [
        {
          id: 'alt-501',
          tipo: 'QUEDA_ISC',
          nivel: 'ATENCAO',
          mensagem:
            'Cliente apresentou deterioração relevante de relacionamento (ISC caiu de 86 para 74).',
          fatos: ['Queda de 12 pontos no ISC'],
          dataIdentificacao: '08/10/2024',
          resolvido: false,
        },
        {
          id: 'alt-502',
          tipo: 'ABANDONO_PRODUTO',
          nivel: 'PREVENTIVO',
          mensagem: 'Perda de mix histórico: Bobina Galvalume AZ150 sem recompra.',
          fatos: ['Última compra do SKU foi há 91 dias'],
          dataIdentificacao: '10/10/2024',
          resolvido: false,
        },
      ],

      timeline: [
        {
          id: 'tl-501',
          dataHora: '05/10/2024 14:00',
          sistemaOrigem: 'Portal Pesquisas',
          tipo: 'PESQUISA_RESPONDIDA',
          titulo: 'Pesquisa NPS Neutro (Nota 7)',
          descricao: 'Cliente solicitou condição de preço para bobinas galvalume.',
          impactoISC: 'NEUTRO',
        },
      ],

      historicoISC: [
        {
          data: '2024-05-01',
          periodo: 'Mai/24',
          isc: 88,
          qualidade: 90,
          logistica: 85,
          comercial: 88,
          financeiro: 90,
          pesquisa: 85,
        },
        {
          data: '2024-06-01',
          periodo: 'Jun/24',
          isc: 86,
          qualidade: 88,
          logistica: 85,
          comercial: 86,
          financeiro: 90,
          pesquisa: 80,
        },
        {
          data: '2024-07-01',
          periodo: 'Jul/24',
          isc: 86,
          qualidade: 85,
          logistica: 85,
          comercial: 85,
          financeiro: 90,
          pesquisa: 80,
        },
        {
          data: '2024-08-01',
          periodo: 'Ago/24',
          isc: 82,
          qualidade: 82,
          logistica: 80,
          comercial: 80,
          financeiro: 90,
          pesquisa: 78,
        },
        {
          data: '2024-09-01',
          periodo: 'Set/24',
          isc: 78,
          qualidade: 80,
          logistica: 78,
          comercial: 74,
          financeiro: 88,
          pesquisa: 75,
        },
        {
          data: '2024-10-01',
          periodo: 'Out/24',
          isc: 74,
          qualidade: 80,
          logistica: 75,
          comercial: 68,
          financeiro: 88,
          pesquisa: 72,
          eventoRelevante: 'Perda de mix no Galvalume e ISC em Atenção',
        },
      ],

      possuiPlanoRecuperacaoAtivo: false,

      analiseIA: {
        clienteId: 'cli-100011',
        clienteNome: 'Oeste Minas Galpões & Coberturas Ltda',
        geradoEm: '2024-10-19 11:45',
        situacaoAtual:
          'Cliente em Atenção Preventiva (ISC 74/100). Redução de compras ocasionada pela perda do mix de Bobinas Galvalume.',
        oQueMudou:
          'O cliente deixou de comprar bobinas na CIAFAL há 91 dias, concentrando compras apenas em telhas cortadas.',
        fatos: [
          'FATO: O cliente tem estoque histórico de Bobina Galvalume AZ150 mas não recompra há 91 dias.',
          'FATO: Há 76.0 t de Bobina Galvalume AZ150 paradas em estoque no CD Contagem.',
          'FATO: Janela de transporte TMS para Centro-Oeste/Divinópolis programada para 22/10.',
        ],
        hipoteses: [
          'HIPÓTESE: O cliente comprou bobinas de usinas concorrentes (CSN/Arcelor) via distribuidor de Itaúna.',
        ],
        recomendacoes: [
          'RECOMENDAÇÃO: Mariana Azevedo realizar contato comercial e ofertar lote de 12 t da bobina parada com desconto de oportunidade.',
          'RECOMENDAÇÃO: Incluir o pedido na janela logística TMS de 22/10.',
        ],
        possiveisCausas: ['Sensibilidade de preço no segmento de coberturas metálicas.'],
        riscosIdentificados: [
          'Risco do cliente consolidar compra de telhas e bobinas no concorrente de Itaúna.',
        ],
        oportunidadesIdentificadas: [
          '76.0 t de Bobina Galvalume AZ150 em estoque pronto no CD Contagem.',
        ],
        prioridadeAcao: 'ALTA',
        proximaMelhorAcao: {
          acao: 'Ofertar Lote de Bobina Galvalume Parado no CD Contagem com Frete Dedicado',
          tipoAcao: 'RECUPERAR_MIX_ESTOQUE',
          justificativa:
            'Existe oportunidade de abordagem comercial utilizando o estoque disponível de 76 t de Bobina Galvalume e a janela TMS de Divinópolis.',
          prazoSugeridoDias: 2,
          estoqueConexo: {
            produtoCodigo: 'BOB-GLV-AZ150',
            produtoDescricao: 'Bobina de Aço Galvalume AZ150 0.50mm x 1200mm',
            saldoDisponivelTons: 76.0,
            precoMedioSugeridoKg: 7.65,
          },
        },
      },

      temDivergenciaPesquisaComportamento: false,
      is_mock: true,
      sistemaOrigemInfo: {
        sapEccSync: 'SAP ECC — Atualizado hoje às 08:30',
        tmsSync: 'TMS CIAFAL — Atualizado hoje às 08:28',
        wmsSync: 'WMS Pátio Contagem — Online',
        qualidadeSync: 'SAC / Qualidade — Atualizado hoje às 09:15',
        pesquisaSync: 'Portal Pesquisas — Atualizado em 05/10',
      },
    },
  ]
}

// Seed Inicial de Planos de Recuperação
export const INITIAL_RECOVERY_PLANS: PlanoRecuperacao[] = [
  {
    id: 'pln-001',
    clienteId: 'cli-100001',
    clienteNome: 'Metalúrgica Santa Rita Ltda',
    clienteSap: '100001',
    vendedorId: 'qas-vendedor_teste',
    vendedorNome: 'Carlos Mendonça',
    gestorNome: 'Roberto Silveira (Gerente Regional)',
    status: 'EM_EXECUCAO',
    criadoEm: '2024-10-18',
    atualizadoEm: '2024-10-19',
    prazoFinal: '2024-11-15',

    problemaIdentificado:
      'Deterioração do ISC de 84 para 67 devido a atrasos logísticos recorrentes e reclamação técnica de empenamento de perfis.',
    situacaoAtual:
      'Cliente segregou 3.0 t de material e reduziu as compras mensais em 28.5%. Reclamação SAC em aberto.',
    evidenciasFatos: [
      'Relatório SAC Protocolo #891 (Empenamento superficial em 3 barras de Perfil W)',
      'Ocorrência TMS-9912 com atraso de 72h na rota Contagem-Betim',
      'Queda de faturamento de R$ 180k para R$ 128k',
    ],
    causaRaiz:
      'Gargalo no carregamento noturno do CD Contagem somado à falta de substituição imediata de material não conforme.',
    acoesPropostas: [
      {
        id: 'ac-01',
        descricao: 'Substituição imediata das 3.0 t avariadas utilizando lote sadio do CD Contagem',
        responsavel: 'Carlos Mendonça & Pátio Contagem',
        areaEnvolvida: 'Logística',
        prazo: '2024-10-22',
        concluida: false,
      },
      {
        id: 'ac-02',
        descricao: 'Visita técnica presencial conjunta com Engenheiro de Qualidade CIAFAL',
        responsavel: 'Carlos Mendonça & Eng. Qualidade',
        areaEnvolvida: 'Qualidade',
        prazo: '2024-10-23',
        concluida: false,
      },
      {
        id: 'ac-03',
        descricao: 'Apresentar proposta comercial de lote completo de 25 t com frete dedicado',
        responsavel: 'Carlos Mendonça',
        areaEnvolvida: 'Comercial',
        prazo: '2024-10-25',
        concluida: false,
      },
    ],
    resultadoEsperado:
      'Recuperar o ISC para a faixa ≥ 80 (Satisfeito), encerrar o SAC com eficácia e retomar o volume regular de 40 t/mês.',
    areaPrincipalEnvolvida: 'Multidisciplinar',

    iscNoMomentoCriacao: 67,
    iscAtual: 67,
    variacaoISC: 0,
    volumeRecuperadoTons: 0,
    novasComprasRealizadas: false,
    reincidenciaOcorrencia: false,

    historicoExecucoes: [
      {
        data: '2024-10-18 16:30',
        responsavel: 'Roberto Silveira (Gerente Regional)',
        acao: 'Abertura Formal do Plano de Recuperação',
        resultado: 'Plano aprovado e tarefas distribuídas para Engenharia de Qualidade e Vendedor.',
        observacao: 'Prioridade máxima devido ao porte de faturamento da conta.',
        proximaAcao: 'Execução da troca de material em 22/10.',
      },
    ],
    is_mock: true,
  },
  {
    id: 'pln-002',
    clienteId: 'cli-100008',
    clienteNome: 'Estruturas Metálicas Sete Lagoas Ltda',
    clienteSap: '100008',
    vendedorId: 'qas-vendedor_teste',
    vendedorNome: 'Carlos Mendonça',
    gestorNome: 'Roberto Silveira (Gerente Regional)',
    status: 'PLANO_DEFINIDO',
    criadoEm: '2024-10-16',
    atualizadoEm: '2024-10-19',
    prazoFinal: '2024-11-30',

    problemaIdentificado:
      'Cliente Crítico com ISC 48/100, 78 dias sem compras e títulos contestados de R$ 48.500,00 bloqueando crédito.',
    situacaoAtual:
      'Compras paralisadas e sentimento de abandono comercial manifestado na pesquisa.',
    evidenciasFatos: [
      '2 títulos vencidos no SAP ECC gerando bloqueio',
      'Zero compras nos últimos 78 dias',
      'NPS nota 2 no Portal de Pesquisas',
    ],
    causaRaiz:
      'Falta de baixa financeira de carga devolvida gerando atrito e rompimento operacional.',
    acoesPropostas: [
      {
        id: 'ac-11',
        descricao:
          'Alinhamento com Diretoria Financeira para abatimento da nota de devolução nos títulos',
        responsavel: 'Roberto Silveira',
        areaEnvolvida: 'Financeiro',
        prazo: '2024-10-21',
        concluida: false,
      },
      {
        id: 'ac-12',
        descricao: 'Visita de reconciliação na fábrica em Sete Lagoas',
        responsavel: 'Roberto Silveira & Carlos Mendonça',
        areaEnvolvida: 'Diretoria',
        prazo: '2024-10-24',
        concluida: false,
      },
    ],
    resultadoEsperado:
      'Desbloquear o crédito SAP, restabelecer confiança institucional e recuperar fornecimento mensal de 20 t.',
    areaPrincipalEnvolvida: 'Multidisciplinar',

    iscNoMomentoCriacao: 48,
    iscAtual: 48,
    variacaoISC: 0,
    novasComprasRealizadas: false,
    reincidenciaOcorrencia: false,

    historicoExecucoes: [
      {
        data: '2024-10-16 11:00',
        responsavel: 'Roberto Silveira',
        acao: 'Mapeamento de Causa Raiz e Criação do Plano',
        resultado:
          'Identificado que títulos em aberto correspondiam a mercadoria avariada não estornada no ECC.',
        proximaAcao: 'Reunião com Crédito/Cobrança em 21/10.',
      },
    ],
    is_mock: true,
  },
]

// Seed Inicial de Campanhas e Pesquisas
export const INITIAL_SURVEY_CAMPAIGNS: CampanhaPesquisa[] = [
  {
    id: 'cmp-01',
    titulo: 'Pesquisa Contínua NPS & CSAT 360º CIAFAL 2024',
    publicoAlvo: 'Toda a Carteira Ativa & Recorrente (Grandes Contas e Varejo)',
    periodoInicio: '2024-01-01',
    periodoFim: '2024-12-31',
    status: 'ATIVA',
    totalEnviadas: 180,
    totalRespondidas: 142,
    taxaRespostaPct: 78.8,
    npsMedio: 78,
    csatMedio: 4.5,
    perguntas: [
      {
        id: 'q-nps',
        ordem: 1,
        tipo: 'NPS',
        titulo:
          'Em uma escala de 0 a 10, qual a probabilidade de você recomendar a CIAFAL Ferro & Aço a um parceiro do setor?',
        dimensaoAlvo: 'GERAL',
        obrigatoria: true,
        ativa: true,
      },
      {
        id: 'q-csat-prod',
        ordem: 2,
        tipo: 'RATING_1_5',
        titulo:
          'Como você avalia a Qualidade Técnica e Dimensional dos produtos de aço fornecidos pela CIAFAL?',
        dimensaoAlvo: 'QUALIDADE',
        obrigatoria: true,
        ativa: true,
      },
      {
        id: 'q-csat-com',
        ordem: 3,
        tipo: 'RATING_1_5',
        titulo:
          'Como você avalia o Atendimento Comercial (agilidade nas cotações, clareza e presteza do vendedor)?',
        dimensaoAlvo: 'COMERCIAL',
        obrigatoria: true,
        ativa: true,
      },
      {
        id: 'q-csat-ent',
        ordem: 4,
        tipo: 'RATING_1_5',
        titulo: 'Como você avalia a Pontualidade e Cuidado na Entrega / Frota CIAFAL?',
        dimensaoAlvo: 'ENTREGA',
        obrigatoria: true,
        ativa: true,
      },
      {
        id: 'q-csat-ger',
        ordem: 5,
        tipo: 'RATING_1_5',
        titulo: 'Como você avalia a Experiência Geral de Compra com a CIAFAL?',
        dimensaoAlvo: 'GERAL',
        obrigatoria: true,
        ativa: true,
      },
      {
        id: 'q-coment',
        ordem: 6,
        tipo: 'TEXTO_LIVRE',
        titulo: 'Deixe seu comentário, elogio ou sugestão de melhoria:',
        dimensaoAlvo: 'GERAL',
        obrigatoria: false,
        ativa: true,
      },
    ],
    is_mock: true,
  },
]

export const INITIAL_SURVEY_RESPONSES: RespostaPesquisaCliente[] = [
  {
    id: 'resp-001',
    campanhaId: 'cmp-01',
    clienteId: 'cli-100001',
    clienteNome: 'Metalúrgica Santa Rita Ltda',
    clienteSap: '100001',
    dataResposta: '2024-10-14 11:00',
    canal: 'WhatsApp',
    respondenteNome: 'Roberto Antunes',
    respondenteCargo: 'Diretor de Obras & Suprimentos',
    npsScore: 5,
    qualidadeProdutoRating: 3,
    atendimentoComercialRating: 4,
    prazoEntregaRating: 2,
    atendimentoGeralRating: 3,
    comentariosLivres:
      'Tivemos problemas com o prazo do último lote de perfis e a avaria demorou a ser reposta pela fábrica.',
    divergenciaDetectada: false,
    is_mock: true,
  },
  {
    id: 'resp-002',
    campanhaId: 'cmp-01',
    clienteId: 'cli-100017',
    clienteNome: 'Serralheria & Coberturas Montes Claros Ltda',
    clienteSap: '100017',
    dataResposta: '2024-10-12 10:15',
    canal: 'WhatsApp',
    respondenteNome: 'Cláudio Ferreira',
    respondenteCargo: 'Proprietário',
    npsScore: 9,
    qualidadeProdutoRating: 5,
    atendimentoComercialRating: 5,
    prazoEntregaRating: 4,
    atendimentoGeralRating: 5,
    comentariosLivres: 'Gostamos muito do atendimento da CIAFAL e da qualidade dos tubos.',
    divergenciaDetectada: true,
    divergenciaMotivo:
      'Nota NPS 9 e CSAT 4.8 na pesquisa, porém compras caíram 42% e há 64 dias não realiza reposição.',
    is_mock: true,
  },
  {
    id: 'resp-003',
    campanhaId: 'cmp-01',
    clienteId: 'cli-100002',
    clienteNome: 'Aços & Caldeiraria Betim S.A.',
    clienteSap: '100002',
    dataResposta: '2024-10-16 09:30',
    canal: 'WhatsApp',
    respondenteNome: 'Eng. Paulo Mendes',
    respondenteCargo: 'Gerente de Engenharia',
    npsScore: 10,
    qualidadeProdutoRating: 5,
    atendimentoComercialRating: 5,
    prazoEntregaRating: 5,
    atendimentoGeralRating: 5,
    comentariosLivres:
      'Parceria nota 10. Pontualidade de entrega e suporte técnico incomparáveis na região.',
    divergenciaDetectada: false,
    is_mock: true,
  },
]

export class SatisfactionService {
  // Clientes
  public getClients(): ClienteSatisfacao360[] {
    try {
      const raw = crmStorage.getJSON<ClienteSatisfacao360[] | null>(STORAGE_KEY_CLIENTES, null)
      if (raw && Array.isArray(raw) && raw.length > 0) return raw
    } catch {
      /* ignore */
    }
    const init = generateInitialSatisfactionClients()
    crmStorage.setJSON(STORAGE_KEY_CLIENTES, init)
    return init
  }

  public saveClients(clients: ClienteSatisfacao360[]) {
    crmStorage.setJSON(STORAGE_KEY_CLIENTES, clients)
  }

  // Pesos do ISC
  public getPesos(): ISCPesosConfig {
    try {
      const raw = crmStorage.getJSON<ISCPesosConfig | null>(STORAGE_KEY_PESOS, null)
      if (raw) return raw
    } catch {
      /* ignore */
    }
    crmStorage.setJSON(STORAGE_KEY_PESOS, DEFAULT_ISC_PESOS)
    return DEFAULT_ISC_PESOS
  }

  public getPesosHistory(): ISCPesoHistoryEntry[] {
    try {
      const raw = crmStorage.getJSON<ISCPesoHistoryEntry[] | null>(STORAGE_KEY_PESOS_HISTORY, null)
      if (raw && Array.isArray(raw) && raw.length > 0) return raw
    } catch {
      /* ignore */
    }
    return [
      {
        id: 'hist-init',
        updatedAt: '2024-10-01 08:00',
        updatedBy: 'Administrador Master',
        userRole: 'administrador',
        motivo: 'Definição da baseline corporativa CIAFAL para o motor ISC 2024',
        pesosAnteriores: DEFAULT_ISC_PESOS,
        pesosNovos: DEFAULT_ISC_PESOS,
      },
    ]
  }

  public updatePesos(
    novosPesos: ISCPesosConfig,
    usuario: { id: string; name: string; role: string },
    motivo: string,
  ): { success: boolean; message: string } {
    const sum =
      novosPesos.qualidade +
      novosPesos.logistica +
      novosPesos.comercial +
      novosPesos.financeiro +
      novosPesos.pesquisa

    if (Math.abs(sum - 100) > 0.001) {
      return {
        success: false,
        message: `A soma dos pesos deve ser exatamente 100%. Soma atual: ${sum}%.`,
      }
    }

    const pesosAnteriores = this.getPesos()
    crmStorage.setJSON(STORAGE_KEY_PESOS, novosPesos)

    // Registra histórico
    const history = this.getPesosHistory()
    const now = new Date()
    const nowStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    history.unshift({
      id: `hist-${Date.now()}`,
      updatedAt: nowStr,
      updatedBy: usuario.name,
      userRole: usuario.role,
      motivo: motivo || 'Ajuste de governança dos pesos das dimensões do ISC',
      pesosAnteriores,
      pesosNovos: novosPesos,
    })
    crmStorage.setJSON(STORAGE_KEY_PESOS_HISTORY, history)

    // Recalcula ISC de todos os clientes com os novos pesos
    this.recalculateAllClientsISC(novosPesos)

    // Auditoria
    this.registerAuditLog({
      usuarioId: usuario.id,
      usuarioNome: usuario.name,
      usuarioRole: usuario.role,
      tipoAcao: 'ALTERACAO_PESOS_ISC',
      detalhes: `Pesos alterados por ${usuario.name}: Qualidade ${novosPesos.qualidade}%, Logística ${novosPesos.logistica}%, Comercial ${novosPesos.comercial}%, Financeiro ${novosPesos.financeiro}%, Pesquisa ${novosPesos.pesquisa}%. Motivo: ${motivo}`,
    })

    return {
      success: true,
      message: 'Pesos do ISC atualizados com sucesso e aplicados a toda a carteira.',
    }
  }

  // Recalcular todos os clientes
  public recalculateAllClientsISC(pesos: ISCPesosConfig) {
    const clients = this.getClients()
    const updated = clients.map((c) => {
      const isc = iscEngine.calculateISC(
        c.dimensaoQualidade.score,
        c.dimensaoLogistica.score,
        c.dimensaoComercial.score,
        c.dimensaoFinanceiro.score,
        c.dimensaoPesquisa.score,
        pesos,
      )
      const faixa = iscEngine.getBand(isc)
      const quadrante = iscEngine.calculateMatrixQuadrant(c.scoreValorEstrategico, isc)

      return {
        ...c,
        iscAtual: isc,
        iscVariacao: isc - c.iscAnterior,
        faixaISC: faixa.band,
        quadranteMatriz: quadrante,
      }
    })
    this.saveClients(updated)
  }

  // Faixas do ISC
  public getBands(): ISCBandConfig[] {
    try {
      const raw = crmStorage.getJSON<ISCBandConfig[] | null>(STORAGE_KEY_BANDS, null)
      if (raw && Array.isArray(raw) && raw.length > 0) return raw
    } catch {
      /* ignore */
    }
    crmStorage.setJSON(STORAGE_KEY_BANDS, DEFAULT_ISC_BANDS)
    return DEFAULT_ISC_BANDS
  }

  public saveBands(bands: ISCBandConfig[]) {
    crmStorage.setJSON(STORAGE_KEY_BANDS, bands)
  }

  // Planos de Recuperação
  public getRecoveryPlans(): PlanoRecuperacao[] {
    try {
      const raw = crmStorage.getJSON<PlanoRecuperacao[] | null>(STORAGE_KEY_PLANOS, null)
      if (raw && Array.isArray(raw) && raw.length > 0) return raw
    } catch {
      /* ignore */
    }
    crmStorage.setJSON(STORAGE_KEY_PLANOS, INITIAL_RECOVERY_PLANS)
    return INITIAL_RECOVERY_PLANS
  }

  public saveRecoveryPlans(plans: PlanoRecuperacao[]) {
    crmStorage.setJSON(STORAGE_KEY_PLANOS, plans)
  }

  public createRecoveryPlan(
    plan: Omit<PlanoRecuperacao, 'id' | 'criadoEm' | 'atualizadoEm' | 'is_mock'>,
    usuario: { id: string; name: string; role: string },
  ): PlanoRecuperacao {
    const list = this.getRecoveryPlans()
    const now = new Date()
    const nowStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    const newPlan: PlanoRecuperacao = {
      ...plan,
      id: `pln-${Date.now()}`,
      criadoEm: nowStr,
      atualizadoEm: nowStr,
      is_mock: true,
    }

    list.unshift(newPlan)
    this.saveRecoveryPlans(list)

    // Marca cliente com plano ativo
    const clients = this.getClients()
    const target = clients.find((c) => c.id === plan.clienteId)
    if (target) {
      target.possuiPlanoRecuperacaoAtivo = true
      target.planoRecuperacaoId = newPlan.id
      target.timeline.unshift({
        id: `tl-pln-${Date.now()}`,
        dataHora: nowStr,
        sistemaOrigem: 'CRM 360',
        tipo: 'PLANO_RECUPERACAO_CRIADO',
        titulo: 'Plano de Recuperação Criado',
        descricao: `Plano iniciado com foco em: ${plan.problemaIdentificado.slice(0, 80)}...`,
        usuario: usuario.name,
        impactoISC: 'POSITIVO',
      })
      this.saveClients(clients)
    }

    this.registerAuditLog({
      usuarioId: usuario.id,
      usuarioNome: usuario.name,
      usuarioRole: usuario.role,
      tipoAcao: 'CRIACAO_PLANO_RECUPERACAO',
      detalhes: `Plano de recuperação criado para o cliente ${plan.clienteNome} (SAP #${plan.clienteSap})`,
      clienteId: plan.clienteId,
      clienteNome: plan.clienteNome,
    })

    return newPlan
  }

  public updateRecoveryPlanExecution(
    planId: string,
    execution: {
      responsavel: string
      acao: string
      resultado: string
      observacao?: string
      evidencia?: string
      proximaAcao?: string
    },
    usuario: { id: string; name: string; role: string },
  ) {
    const list = this.getRecoveryPlans()
    const idx = list.findIndex((p) => p.id === planId)
    if (idx === -1) return

    const plan = list[idx]
    const now = new Date()
    const nowStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    plan.historicoExecucoes.unshift({
      data: nowStr,
      ...execution,
    })
    plan.atualizadoEm = nowStr
    list[idx] = plan
    this.saveRecoveryPlans(list)

    this.registerAuditLog({
      usuarioId: usuario.id,
      usuarioNome: usuario.name,
      usuarioRole: usuario.role,
      tipoAcao: 'EXECUCAO_ACAO_PLANO',
      detalhes: `Ação registrada no plano de ${plan.clienteNome}: ${execution.acao} -> ${execution.resultado}`,
      clienteId: plan.clienteId,
      clienteNome: plan.clienteNome,
    })
  }

  // Campanhas de Pesquisa
  public getSurveyCampaigns(): CampanhaPesquisa[] {
    try {
      const raw = crmStorage.getJSON<CampanhaPesquisa[] | null>(STORAGE_KEY_CAMPANHAS, null)
      if (raw && Array.isArray(raw) && raw.length > 0) return raw
    } catch {
      /* ignore */
    }
    crmStorage.setJSON(STORAGE_KEY_CAMPANHAS, INITIAL_SURVEY_CAMPAIGNS)
    return INITIAL_SURVEY_CAMPAIGNS
  }

  public saveSurveyCampaigns(campaigns: CampanhaPesquisa[]) {
    crmStorage.setJSON(STORAGE_KEY_CAMPANHAS, campaigns)
  }

  public getSurveyResponses(): RespostaPesquisaCliente[] {
    try {
      const raw = crmStorage.getJSON<RespostaPesquisaCliente[] | null>(STORAGE_KEY_RESPOSTAS, null)
      if (raw && Array.isArray(raw) && raw.length > 0) return raw
    } catch {
      /* ignore */
    }
    crmStorage.setJSON(STORAGE_KEY_RESPOSTAS, INITIAL_SURVEY_RESPONSES)
    return INITIAL_SURVEY_RESPONSES
  }

  public saveSurveyResponses(responses: RespostaPesquisaCliente[]) {
    crmStorage.setJSON(STORAGE_KEY_RESPOSTAS, responses)
  }

  // Auditoria
  public getAuditLogs(): SatisfactionAuditLog[] {
    try {
      const raw = crmStorage.getJSON<SatisfactionAuditLog[]>(STORAGE_KEY_AUDIT, [])
      if (Array.isArray(raw)) return raw
    } catch {
      /* ignore */
    }
    return []
  }

  public registerAuditLog(entry: Omit<SatisfactionAuditLog, 'id' | 'dataHora'>) {
    const list = this.getAuditLogs()
    const now = new Date()
    const nowStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    list.unshift({
      ...entry,
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      dataHora: nowStr,
    })

    if (list.length > 300) list.pop()
    crmStorage.setJSON(STORAGE_KEY_AUDIT, list)
  }

  // RBAC: Filtrar clientes por perfil do usuário
  public filterClientsByAccess(
    clients: ClienteSatisfacao360[],
    currentUser: { id?: string; role?: string; name?: string } | null,
  ): ClienteSatisfacao360[] {
    if (!currentUser) return []

    const role = (currentUser.role || '').toLowerCase()

    // 1. Admin Master & Direção Geral: enxergam tudo
    if (role === 'administrador' || role === 'admin' || role === 'diretor_comercial') {
      return clients
    }

    // 2. Supervisor / Gerente Comercial: enxerga toda a equipe
    if (role === 'supervisor' || role === 'gerente_comercial') {
      return clients
    }

    // 3. Vendedor / Representante: ISOLAMENTO ESTRITO DA CARTEIRA
    const userId = currentUser.id || ''
    const userName = (currentUser.name || '').toLowerCase()

    return clients.filter((c) => {
      const matchId = c.vendedorId === userId
      const matchName = c.vendedorNome.toLowerCase().includes(userName)
      return matchId || matchName
    })
  }

  // Estrutura de Performance dos Vendedores (Preparação para Módulo Futuro)
  public getPerformanceSellerReadiness(): PerformanceSellerReadiness[] {
    const clients = this.getClients()
    const sellersMap: Record<string, PerformanceSellerReadiness> = {
      'qas-vendedor_teste': {
        vendedorId: 'qas-vendedor_teste',
        vendedorNome: 'Carlos Mendonça',
        alertasRecebidosCount: 5,
        alertasTratadosCount: 2,
        tempoMedioTratamentoAlertasDias: 3.2,
        clientesCriticosAtendidosCount: 2,
        tarefasSatisfacaoExecutadasCount: 12,
        tarefasSatisfacaoVencidasCount: 3,
        clientesRecuperadosCount: 1,
        clientesPerdidosCount: 0,
        evolucaoIscCarteiraMedia: -6.5,
        oportunidadesEstoqueGeradas: 4,
        oportunidadesEstoqueConvertidas: 2,
        is_mock: true,
      },
      'qas-vendedor2_teste': {
        vendedorId: 'qas-vendedor2_teste',
        vendedorNome: 'Mariana Azevedo',
        alertasRecebidosCount: 2,
        alertasTratadosCount: 2,
        tempoMedioTratamentoAlertasDias: 1.5,
        clientesCriticosAtendidosCount: 1,
        tarefasSatisfacaoExecutadasCount: 8,
        tarefasSatisfacaoVencidasCount: 0,
        clientesRecuperadosCount: 2,
        clientesPerdidosCount: 0,
        evolucaoIscCarteiraMedia: 4.2,
        oportunidadesEstoqueGeradas: 3,
        oportunidadesEstoqueConvertidas: 3,
        is_mock: true,
      },
      'qas-representante_teste': {
        vendedorId: 'qas-representante_teste',
        vendedorNome: 'João Pedro Representações',
        alertasRecebidosCount: 3,
        alertasTratadosCount: 1,
        tempoMedioTratamentoAlertasDias: 5.0,
        clientesCriticosAtendidosCount: 0,
        tarefasSatisfacaoExecutadasCount: 4,
        tarefasSatisfacaoVencidasCount: 2,
        clientesRecuperadosCount: 0,
        clientesPerdidosCount: 1,
        evolucaoIscCarteiraMedia: -4.0,
        oportunidadesEstoqueGeradas: 2,
        oportunidadesEstoqueConvertidas: 0,
        is_mock: true,
      },
    }

    return Object.values(sellersMap)
  }
}

export const satisfactionService = new SatisfactionService()

// Alias exports for convenience
export const mockClientesSatisfacao = generateInitialSatisfactionClients()
export const mockCampanhasPesquisa = INITIAL_SURVEY_CAMPAIGNS
export const mockRespostasPesquisa = INITIAL_SURVEY_RESPONSES
export const mockPesosHistorico: ISCPesoHistoryEntry[] = [
  {
    id: 'hist-init-1',
    updatedAt: '2024-09-01 10:00',
    updatedBy: 'Administrador Master',
    userRole: 'ADMIN_MASTER',
    motivo: 'Definição dos pesos de governança inicial do CRM 360 CIAFAL',
    pesosAnteriores: { qualidade: 20, logistica: 20, comercial: 20, financeiro: 20, pesquisa: 20 },
    pesosNovos: { qualidade: 25, logistica: 25, comercial: 20, financeiro: 15, pesquisa: 15 },
  },
]
export const mockPlanosRecuperacao = INITIAL_RECOVERY_PLANS
