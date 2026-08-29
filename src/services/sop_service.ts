/**
 * SERVIÇO CENTRAL DE PERSISTÊNCIA & INTEGRAÇÕES S&OP
 *
 * Regra de Governança de Fontes:
 * - PASSADO CONSOLIDADO = QLIK (verdade analítica histórica)
 * - PRESENTE TRANSACIONAL = SAP ECC + CRM + WMS + PCP + TMS
 * - FUTURO = Forecast + CRM + PCP + TMS
 *
 * Todos os registros salvam em PocketBase com fallback resiliente para QAS / Offline.
 */

import pb from '@/lib/pocketbase/client'
import {
  SopForecastRecord,
  SopExecutivePlan,
  SopMeeting,
  SopScenarioSimulation,
  SopGlobalFilter,
  FvaMetricSummary,
} from '@/types/sop'
import { evaluateChampionChallenger, calculateFvaMetrics } from './forecast_engine'

export const QLIK_LAST_SYNC = '24/02/2026 18:45'
export const SAP_LAST_SYNC = '25/02/2026 09:12'
export const WMS_LAST_SYNC = '25/02/2026 09:10'
export const PCP_LAST_SYNC = '25/02/2026 08:30'
export const TMS_LAST_SYNC = '25/02/2026 09:05'

// Base Oficial Seed de S&OP (Preserva dados consistentes de clientes CIAFAL)
const BASE_SOP_RECORDS: SopForecastRecord[] = [
  {
    id: 'sop-rec-01',
    sellerId: 'qas-vendedor_teste',
    sellerName: 'Carlos Mendonça',
    customerId: 'CLI-1001',
    customerName: 'Aço Forte Estruturas Metálicas Ltda',
    productId: 'MAT-VIG-W200',
    productName: 'Viga Laminada W200x26.6 (Aço ASTM A572 Gr.50)',
    productFamily: 'Perfis Estruturais & Vigas',
    yearMonth: '2026-03',
    unit: 't',
    f0Statistical: 120.0,
    f1AiEnriched: 135.0,
    f2SellerAdjusted: 150.0,
    f3ManagementAdjusted: 145.0,
    f4SopConsensual: 140.0,
    rActual: 0,
    targetSuggested: 130.0,
    targetProposed: 145.0,
    targetApproved: 140.0,
    targetFinal: 140.0,
    championModel: 'ENSEMBLE_PROPHET_ARIMA',
    challengerModel: 'HOLT_WINTERS_DAMPED',
    modelConfidence: 'ALTA',
    historicalMonthsAnalyzed: 36,
    f2Justification: 'Cliente expandindo galpão logístico em Campinas (obras em Março).',
    f2AdjustedBy: 'Carlos Mendonça',
    f2AdjustedAt: '2026-02-20T14:30:00Z',
    f3Justification: 'Ajuste de capacidade industrial na linha de laminação pesada.',
    f3PreviousValue: 150.0,
    f3AdjustedBy: 'Gerência Comercial (Roberto Silveira)',
    f3AdjustedAt: '2026-02-22T10:15:00Z',
    f3ImpactSummary: 'Redução de 5 t para mitigar gargalo no PCP.',
    fvaAi: 4.2,
    fvaSeller: -1.5,
    fvaManagement: 3.1,
    fvaConsensual: 2.0,
    biasType: 'OPTIMISM',
    accuracyScore: 94.2,
    status: 'PUBLICADO',
    revisionCode: 'V1',
    sourceSystem: 'QLIK_SAP_COMBO',
    qlikTimestamp: QLIK_LAST_SYNC,
    nextPurchaseEstimate: {
      lastPurchaseDate: '2026-01-28',
      historicalIntervalDays: 32,
      probableWindowStart: '2026-03-01',
      probableWindowEnd: '2026-03-08',
      confidence: 'ALTA',
    },
    nextBestProduct: {
      productName: 'Chapa Grossa SAC-350 12.5mm',
      reason: 'Cross-sell histórico com perfis laminados para bases de pilares.',
      stockAvailableTons: 84.5,
      pcpScheduled: true,
    },
    nextBestAction: {
      action: 'Cotação',
      reason: 'Janela de recompra ativa com sobra de estoque identificada no WMS.',
      urgency: 'ALTA',
    },
  },
  {
    id: 'sop-rec-02',
    sellerId: 'qas-vendedor_teste',
    sellerName: 'Carlos Mendonça',
    customerId: 'CLI-1002',
    customerName: 'Metalúrgica Rio Claro S/A',
    productId: 'MAT-TUB-IND100',
    productName: 'Tubo Industrial Quadrado 100x100x4.75mm',
    productFamily: 'Tubos Estruturais & Industriais',
    yearMonth: '2026-03',
    unit: 't',
    f0Statistical: 65.0,
    f1AiEnriched: 70.0,
    f2SellerAdjusted: 70.0,
    f3ManagementAdjusted: 68.0,
    f4SopConsensual: 68.0,
    rActual: 0,
    targetSuggested: 65.0,
    targetProposed: 70.0,
    targetApproved: 68.0,
    targetFinal: 68.0,
    championModel: 'HOLT_WINTERS_DAMPED',
    challengerModel: 'EXPONENTIAL_SMOOTHING',
    modelConfidence: 'ALTA',
    historicalMonthsAnalyzed: 28,
    fvaAi: 2.8,
    fvaSeller: 0.0,
    fvaManagement: 1.5,
    fvaConsensual: 1.2,
    biasType: 'NEUTRAL',
    accuracyScore: 96.0,
    status: 'PUBLICADO',
    revisionCode: 'V0',
    sourceSystem: 'QLIK_SAP_COMBO',
    qlikTimestamp: QLIK_LAST_SYNC,
    nextPurchaseEstimate: {
      lastPurchaseDate: '2026-02-05',
      historicalIntervalDays: 25,
      probableWindowStart: '2026-03-02',
      probableWindowEnd: '2026-03-10',
      confidence: 'ALTA',
    },
    nextBestProduct: {
      productName: 'Perfil U Dobrado 150x50x3.00mm',
      reason: 'Consumo complementar em serralheria pesada.',
      stockAvailableTons: 42.0,
      pcpScheduled: false,
    },
    nextBestAction: {
      action: 'WhatsApp',
      reason: 'Confirmar cronograma de entrega do lote de Março.',
      urgency: 'MEDIA',
    },
  },
  {
    id: 'sop-rec-03',
    sellerId: 'qas-vendedor2_teste',
    sellerName: 'Juliana Paes (Vendedora Pleno)',
    customerId: 'CLI-1003',
    customerName: 'Construtora Metropolitana ABC',
    productId: 'MAT-VERG-CA50-12',
    productName: 'Vergalhão CA-50 12.5mm (Barras 12m)',
    productFamily: 'Aço para Construção Civil (Vergalhões)',
    yearMonth: '2026-03',
    unit: 't',
    f0Statistical: 210.0,
    f1AiEnriched: 225.0,
    f2SellerAdjusted: 240.0,
    f3ManagementAdjusted: 230.0,
    f4SopConsensual: 220.0,
    rActual: 0,
    targetSuggested: 200.0,
    targetProposed: 230.0,
    targetApproved: 220.0,
    targetFinal: 220.0,
    championModel: 'ENSEMBLE_PROPHET_ARIMA',
    challengerModel: 'EXPONENTIAL_SMOOTHING',
    modelConfidence: 'ALTA',
    historicalMonthsAnalyzed: 36,
    f2Justification: 'Previsão de concretagem de 3 lajes no empreendimento Reserva do Parque.',
    f2AdjustedBy: 'Juliana Paes',
    f2AdjustedAt: '2026-02-18T16:00:00Z',
    f3Justification: 'Ajuste de cota de fornecimento por política de limite de crédito.',
    f3PreviousValue: 240.0,
    f3AdjustedBy: 'Gerência Comercial (Roberto Silveira)',
    f3AdjustedAt: '2026-02-21T11:00:00Z',
    f3ImpactSummary: 'Limite de crédito rotativo fixado em R$ 1.8M.',
    fvaAi: 3.5,
    fvaSeller: -2.8,
    fvaManagement: 4.0,
    fvaConsensual: 2.5,
    biasType: 'OPTIMISM',
    accuracyScore: 91.5,
    status: 'PUBLICADO',
    revisionCode: 'V1',
    sourceSystem: 'QLIK_SAP_COMBO',
    qlikTimestamp: QLIK_LAST_SYNC,
    nextPurchaseEstimate: {
      lastPurchaseDate: '2026-02-10',
      historicalIntervalDays: 20,
      probableWindowStart: '2026-03-02',
      probableWindowEnd: '2026-03-06',
      confidence: 'ALTA',
    },
    nextBestProduct: {
      productName: 'Tela Soldada Q-196 (Malha 10x10)',
      reason: 'Utilizado em conjunto na armação de lajes.',
      stockAvailableTons: 110.0,
      pcpScheduled: true,
    },
    nextBestAction: {
      action: 'Follow-up',
      reason: 'Liberar pendência de crédito no SAP para emissão da remessa.',
      urgency: 'ALTA',
    },
  },
  {
    id: 'sop-rec-04',
    sellerId: 'qas-vendedor_teste',
    sellerName: 'Carlos Mendonça',
    customerId: 'CLI-1004',
    customerName: 'Indústria Mecânica Paulistana',
    productId: 'MAT-BAR-RED1045',
    productName: 'Barra Redonda Trefilada SAE 1045 2.1/2"',
    productFamily: 'Aços Especiais & Trefilados',
    yearMonth: '2026-03',
    unit: 't',
    f0Statistical: 40.0,
    f1AiEnriched: 38.0,
    f2SellerAdjusted: 35.0,
    f3ManagementAdjusted: 35.0,
    f4SopConsensual: 35.0,
    rActual: 0,
    targetSuggested: 40.0,
    targetProposed: 35.0,
    targetApproved: 35.0,
    targetFinal: 35.0,
    championModel: 'EXPONENTIAL_SMOOTHING',
    challengerModel: 'CROSTON_INTERMITTENT',
    modelConfidence: 'MEDIA',
    historicalMonthsAnalyzed: 18,
    f2Justification: 'Cliente reduziu turno de usinagem no 1º trimestre.',
    f2AdjustedBy: 'Carlos Mendonça',
    f2AdjustedAt: '2026-02-19T09:30:00Z',
    fvaAi: 1.2,
    fvaSeller: 2.1,
    fvaManagement: 0.0,
    fvaConsensual: 0.5,
    biasType: 'CONSERVATIVE',
    accuracyScore: 93.8,
    status: 'PUBLICADO',
    revisionCode: 'V0',
    sourceSystem: 'QLIK_SAP_COMBO',
    qlikTimestamp: QLIK_LAST_SYNC,
    nextPurchaseEstimate: {
      lastPurchaseDate: '2026-01-15',
      historicalIntervalDays: 45,
      probableWindowStart: '2026-03-05',
      probableWindowEnd: '2026-03-15',
      confidence: 'MEDIA',
    },
    nextBestProduct: {
      productName: 'Barra Chata SAE 1020 3" x 1/2"',
      reason: 'Consumo para suportes mecânicos.',
      stockAvailableTons: 25.0,
      pcpScheduled: false,
    },
    nextBestAction: {
      action: 'Visita',
      reason: 'Apresentar nova linha de barras descascadas de alta precisão.',
      urgency: 'BAIXA',
    },
  },
  {
    id: 'sop-rec-05',
    sellerId: 'qas-vendedor_teste',
    sellerName: 'Carlos Mendonça',
    customerId: 'CLI-1005',
    customerName: 'Serralheria & Esquadrias Universal',
    productId: 'MAT-CAN-1.1/2',
    productName: 'Cantoneira Abas Iguais 1.1/2" x 1/8"',
    productFamily: 'Perfis Leves & Cantoneiras',
    yearMonth: '2026-03',
    unit: 't',
    f0Statistical: 30.0,
    f1AiEnriched: 32.0,
    f2SellerAdjusted: 35.0,
    f3ManagementAdjusted: 35.0,
    f4SopConsensual: 35.0,
    rActual: 0,
    targetSuggested: 30.0,
    targetProposed: 35.0,
    targetApproved: 35.0,
    targetFinal: 35.0,
    championModel: 'WEIGHTED_MOVING_AVERAGE',
    challengerModel: 'EXPONENTIAL_SMOOTHING',
    modelConfidence: 'ALTA',
    historicalMonthsAnalyzed: 36,
    fvaAi: 1.8,
    fvaSeller: 1.5,
    fvaManagement: 0.0,
    fvaConsensual: 0.8,
    biasType: 'NEUTRAL',
    accuracyScore: 95.0,
    status: 'PUBLICADO',
    revisionCode: 'V0',
    sourceSystem: 'QLIK_SAP_COMBO',
    qlikTimestamp: QLIK_LAST_SYNC,
    nextPurchaseEstimate: {
      lastPurchaseDate: '2026-02-01',
      historicalIntervalDays: 30,
      probableWindowStart: '2026-03-01',
      probableWindowEnd: '2026-03-08',
      confidence: 'ALTA',
    },
    nextBestProduct: {
      productName: 'Ferro Chato 1" x 1/8"',
      reason: 'Utilização em grades e portões.',
      stockAvailableTons: 38.0,
      pcpScheduled: true,
    },
    nextBestAction: {
      action: 'Catálogo',
      reason: 'Disponibilidade de lotes pronta entrega com desconto progressivo.',
      urgency: 'MEDIA',
    },
  },
]

// Histórico de Fevereiro 2026 para Backtest e Feedback Loop Realizado
const PAST_COMPLETED_RECORDS: SopForecastRecord[] = [
  {
    ...BASE_SOP_RECORDS[0],
    id: 'sop-past-01',
    yearMonth: '2026-02',
    f0Statistical: 115.0,
    f1AiEnriched: 128.0,
    f2SellerAdjusted: 145.0,
    f3ManagementAdjusted: 138.0,
    f4SopConsensual: 135.0,
    rActual: 132.5,
    accuracyScore: 97.4,
  },
  {
    ...BASE_SOP_RECORDS[1],
    id: 'sop-past-02',
    yearMonth: '2026-02',
    f0Statistical: 60.0,
    f1AiEnriched: 64.0,
    f2SellerAdjusted: 68.0,
    f3ManagementAdjusted: 65.0,
    f4SopConsensual: 65.0,
    rActual: 63.8,
    accuracyScore: 98.1,
  },
  {
    ...BASE_SOP_RECORDS[2],
    id: 'sop-past-03',
    yearMonth: '2026-02',
    f0Statistical: 195.0,
    f1AiEnriched: 210.0,
    f2SellerAdjusted: 235.0,
    f3ManagementAdjusted: 215.0,
    f4SopConsensual: 215.0,
    rActual: 218.0,
    accuracyScore: 98.6,
  },
]

// Plano Executivo Oficial S&OP
const BASE_EXECUTIVE_PLAN: SopExecutivePlan = {
  id: 'sop-exec-2026-03',
  cycleYearMonth: '2026-03',
  status: 'ATIVO',
  targetTotalTons: 12500.0,
  targetTotalBrl: 81250000.0,
  forecastTotalTons: 12850.0,
  forecastTotalBrl: 83525000.0,
  sapBacklogTons: 8420.0, // Demanda Confirmada (Carteira SAP)
  sapBacklogBrl: 54730000.0,
  unconvertedForecastTons: 4430.0, // Demanda Prevista (Forecast não convertido)
  sopTotalDemandTons: 12850.0, // Total Consensual S&OP
  wmsStockTons: 4120.0, // Estoque Disponível WMS
  scheduledProductionTons: 6800.0, // PCP já programado
  netProductionRequirementTons: 1930.0, // Demanda (12.850) - Estoque (4.120) - Programado (6.800)
  pcpCapacityTons: 2200.0, // Capacidade Disponível PCP
  industrialGapTons: 270.0, // Capacidade (2.200) - Necessidade (1.930) -> Folga positiva de 270 t
  industrialStatus: 'ATENDIDO',
  expeditionCapacityTons: 13500.0,
  tmsProgrammedTons: 8200.0,
  logisticsGapTons: 5300.0, // Capacidade livre de transporte
  revenueForecastBrl: 82800000.0,
  actualBilledBrl: 0,
  actualBilledTons: 0,
  gapCauses: {
    commercialGapTons: 210.0,
    creditBlockGapTons: 140.0,
    stockShortageGapTons: 85.0,
    pcpCapacityGapTons: 0.0,
    logisticsTmsGapTons: 0.0,
    customerPostponedGapTons: 65.0,
    otherGapTons: 20.0,
  },
  waterfallSteps: [
    {
      name: 'Meta Inicial (Plano)',
      value: 81250000,
      type: 'initial',
      unit: 'R$',
      description: 'Objetivo de faturamento comercial',
    },
    {
      name: 'Upside Comercial Forecast',
      value: 2275000,
      type: 'positive',
      unit: 'R$',
      description: 'Demanda consensual acima da meta',
    },
    {
      name: 'Restrição de Crédito SAP',
      value: -910000,
      type: 'negative',
      unit: 'R$',
      description: 'Clientes com pendência cadastral/limite',
    },
    {
      name: 'Ruptura de Estoque WMS',
      value: -552500,
      type: 'negative',
      unit: 'R$',
      description: 'Itens com estoque zerado no WMS',
    },
    {
      name: 'Adiantamentos / Postergações',
      value: -422500,
      type: 'negative',
      unit: 'R$',
      description: 'Remessas reagendadas para Abril',
    },
    {
      name: 'Previsão Factível Faturamento',
      value: 81640000,
      type: 'total',
      unit: 'R$',
      description: 'Forecast Faturável Líquido CIAFAL',
    },
  ],
  idleCapacityOpportunities: [
    {
      id: 'idle-01',
      productFamily: 'Chapas Grossas & Cortadas',
      idleTons: 350.0,
      targetCustomers: [
        {
          customerId: 'CLI-1001',
          customerName: 'Aço Forte Estruturas',
          historicalVolumeTons: 180,
          potentialTons: 80,
          confidence: 'ALTA',
          suggestedAction: 'Cotação',
        },
        {
          customerId: 'CLI-1009',
          customerName: 'Estruturas Metálicas Paulistas',
          historicalVolumeTons: 140,
          potentialTons: 60,
          confidence: 'ALTA',
          suggestedAction: 'WhatsApp',
        },
      ],
    },
    {
      id: 'idle-02',
      productFamily: 'Perfis Laminados Pesados',
      idleTons: 270.0,
      targetCustomers: [
        {
          customerId: 'CLI-1002',
          customerName: 'Metalúrgica Rio Claro',
          historicalVolumeTons: 95,
          potentialTons: 45,
          confidence: 'MEDIA',
          suggestedAction: 'Ligar',
        },
      ],
    },
  ],
}

// Reunião Oficial de S&OP
const BASE_SOP_MEETING: SopMeeting = {
  id: 'sop-meet-2026-03',
  cycleYearMonth: '2026-03',
  title: 'Reunião Mensal Executiva S&OP — Ciclo Março/2026',
  meetingDate: '2026-02-27T10:00:00Z',
  locationType: 'HIBRIDO',
  status: 'AGENDADA',
  participants: [
    { name: 'Roberto Silveira', role: 'Gerente Comercial', area: 'Comercial', confirmed: true },
    { name: 'Carlos Mendonça', role: 'Supervisor de Vendas', area: 'Comercial', confirmed: true },
    { name: 'Eng. Fernando Diniz', role: 'Gerente Industrial & PCP', area: 'PCP', confirmed: true },
    { name: 'Marcos Vinicius', role: 'Coordenador WMS', area: 'WMS', confirmed: true },
    {
      name: 'Luciana Ramos',
      role: 'Gerente Logística TMS',
      area: 'Logística TMS',
      confirmed: true,
    },
    {
      name: 'Eduardo Falcão',
      role: 'Diretor Comercial & Operações',
      area: 'Diretoria',
      confirmed: true,
    },
  ],
  agendaTopics: [
    '1. Validação do Histórico QLIK & Faturamento Consolidado de Fevereiro',
    '2. Aderência Planejado x Realizado & Desempenho FVA por Camada',
    '3. Apresentação do Forecast Comercial Consensual F4 (12.850 t)',
    '4. Análise de Carteira SAP (8.420 t) e Demanda Não Convertida (4.430 t)',
    '5. Validação de Estoque WMS e Necessidade Líquida PCP (1.930 t)',
    '6. Capacidade de Expedição TMS e Restrições Logísticas',
    '7. Waterfall de Faturamento Factível (R$ 81.64M) e Mitigação de Gaps',
    '8. Deliberação de Cenários e Aprovação da ATA Executiva',
  ],
  aiBriefing: {
    summary:
      'O ciclo de Março/2026 apresenta crescimento de demanda de +2,8% acima da Meta Inicial (12.850 t vs 12.500 t). A intervenção da IA agregou +3,6% de FVA médio.',
    whatChanged: [
      'Demanda de Perfis Estruturais cresceu 12% em relação a Jan/Fev.',
      'Carteira confirmada SAP já atinge 65,5% do forecast total.',
      'Capacidade PCP absorve a necessidade líquida com folga industrial de 270 t.',
    ],
    fvaHighlights:
      'Gestão Comercial e IA tiveram os maiores FVAs positivos (+3,9% e +3,6%). Ajustes de vendedores individuais tiveram viés otimista (+1,8 t em média).',
    identifiedBiases:
      'Vendedores do segmento da Construção Civil apresentam Optimism Bias consistente nas últimas 3 rodadas.',
    keyRisks: [
      'Risco de R$ 910k retidos por limite de crédito pendente no SAP.',
      'Ruptura de 85 t em chapas grossas se novas remessas não chegarem até 10/03.',
    ],
    strategicOpportunities: [
      'Capacidade ociosa de 350 t em chapas grossas cortadas para venda rápida com margem de contribuição 18%.',
      'Janela de recompra de 14 clientes classe A identificada para primeira quinzena.',
    ],
    recommendedDecisions: [
      'Aprovar o número oficial consensual S&OP em 12.850 t / R$ 81.64M.',
      'Autorizar comitê de crédito emergencial para liberar pedidos retidos.',
      'Disparar campanha via Meu Dia para consumir capacidade ociosa de corte.',
    ],
  },
  meetingMinutesAta: {
    recordedAt: '2026-02-27T11:45:00Z',
    summary:
      'Consenso atingido entre Comercial, PCP, WMS e Logística. Forecast oficial fixado em 12.850 t.',
    decisions: [
      {
        topic: 'Plano Consensual F4',
        decision: 'Aprovado volume de 12.850 t como balizador industrial do PCP e WMS.',
        rationale: 'Demanda confirmada de 8.420 t garante cobertura segura.',
        responsible: 'Diretoria Comercial & PCP',
        deadline: '2026-03-01',
      },
      {
        topic: 'Comitê de Crédito',
        decision: 'Revisar limites de 5 grandes clientes retidos.',
        rationale: 'Evitar perda de faturamento de R$ 910k.',
        responsible: 'Financeiro & Roberto Silveira',
        deadline: '2026-03-03',
      },
    ],
    actionItems: [
      {
        task: 'Programar bateladas de laminação de W200 no PCP Robotizado',
        owner: 'Fernando Diniz (PCP)',
        dueDate: '2026-03-02',
        status: 'PENDENTE',
      },
      {
        task: 'Notificar vendedores das oportunidades de sobra de estoque no Meu Dia',
        owner: 'IA Copiloto & Carlos Mendonça',
        dueDate: '2026-03-01',
        status: 'PENDENTE',
      },
    ],
    memoryBaseline: {
      finalConsensualTons: 12850.0,
      revenueForecastBrl: 81640000.0,
      acceptedIndustrialGapTons: 270.0,
    },
  },
}

// Simulações de Cenários
const BASE_SCENARIOS: SopScenarioSimulation[] = [
  {
    id: 'sim-01',
    title: 'Cenário Base Consensual S&OP',
    scenarioType: 'CONSENSUAL',
    cycleYearMonth: '2026-03',
    description: 'Projeção oficial acordada no comitê multidisciplinar.',
    deltaTons: 0,
    deltaRevenueBrl: 0,
    industrialImpact: 'Capacidade nominal suficiente (Folga de 270 t no PCP).',
    logisticsImpact: 'Expedição 100% coberta pela frota e transportadores TMS.',
    authorName: 'Comitê S&OP CIAFAL',
    isFavorite: true,
    createdAt: '2026-02-25T10:00:00Z',
  },
  {
    id: 'sim-02',
    title: 'Cenário Otimista: Expansão de Estruturas (+15%)',
    scenarioType: 'OTIMISTA',
    cycleYearMonth: '2026-03',
    description: 'Simulação com aceleração das obras de galpões logísticos em SP.',
    deltaTons: 1920.0,
    deltaRevenueBrl: 12480000.0,
    industrialImpact: 'Exige abertura de 3º turno no PCP para vigas e perfis.',
    logisticsImpact: 'Necessidade de contratação de 28 carretas spot no TMS.',
    authorName: 'Roberto Silveira',
    isFavorite: false,
    createdAt: '2026-02-25T14:20:00Z',
  },
  {
    id: 'sim-03',
    title: 'Cenário Conservador: Risco de Crédito & Atraso de Obras (-10%)',
    scenarioType: 'CONSERVADOR',
    cycleYearMonth: '2026-03',
    description: 'Impacto de postergações de clientes de infraestrutura.',
    deltaTons: -1280.0,
    deltaRevenueBrl: -8320000.0,
    industrialImpact: 'Gera sobra de 1.550 t no estoque WMS; redução de ritmo no PCP.',
    logisticsImpact: 'Subutilização de 12% da capacidade da frota contratada.',
    authorName: 'Diretoria Financeira',
    isFavorite: false,
    createdAt: '2026-02-25T16:00:00Z',
  },
]

class SopDataService {
  private memoryRecords: SopForecastRecord[] = [...BASE_SOP_RECORDS, ...PAST_COMPLETED_RECORDS]
  private executivePlan: SopExecutivePlan = { ...BASE_EXECUTIVE_PLAN }
  private meeting: SopMeeting = { ...BASE_SOP_MEETING }
  private scenarios: SopScenarioSimulation[] = [...BASE_SCENARIOS]

  // 1. Obter Registros de Forecast com Filtros & RLS
  async getForecastRecords(
    filters?: Partial<SopGlobalFilter>,
    currentUserRole?: string,
    currentUserId?: string,
  ): Promise<SopForecastRecord[]> {
    try {
      // Tenta carregar do PocketBase
      const records = await pb.collection('sop_forecast_records').getFullList({
        sort: '-year_month',
      })
      if (records && records.length > 0) {
        // Mapeia registros do PocketBase
        this.memoryRecords = records.map((r: any) => ({
          id: r.id,
          sellerId: r.seller_id,
          sellerName: r.seller_name,
          customerId: r.customer_id,
          customerName: r.customer_name,
          productId: r.product_id,
          productName: r.product_name,
          productFamily: r.product_family,
          yearMonth: r.year_month,
          unit: r.unit || 't',
          f0Statistical: r.f0_statistical || 0,
          f1AiEnriched: r.f1_ai_enriched || 0,
          f2SellerAdjusted: r.f2_seller_adjusted || 0,
          f3ManagementAdjusted: r.f3_management_adjusted || 0,
          f4SopConsensual: r.f4_sop_consensual || 0,
          rActual: r.r_actual || 0,
          targetSuggested: r.target_suggested || 0,
          targetProposed: r.target_proposed || 0,
          targetApproved: r.target_approved || 0,
          targetFinal: r.target_final || 0,
          championModel: r.champion_model || 'ENSEMBLE_PROPHET_ARIMA',
          challengerModel: r.challenger_model || 'HOLT_WINTERS_DAMPED',
          modelConfidence: r.model_confidence || 'ALTA',
          historicalMonthsAnalyzed: r.historical_months_analyzed || 36,
          f2Justification: r.f2_justification,
          f2AdjustedBy: r.f2_adjusted_by,
          f2AdjustedAt: r.f2_adjusted_at,
          f3Justification: r.f3_justification,
          f3PreviousValue: r.f3_previous_value,
          f3AdjustedBy: r.f3_adjusted_by,
          f3AdjustedAt: r.f3_adjusted_at,
          f3ImpactSummary: r.f3_impact_summary,
          fvaAi: r.fva_ai || 0,
          fvaSeller: r.fva_seller || 0,
          fvaManagement: r.fva_management || 0,
          fvaConsensual: r.fva_consensual || 0,
          biasType: r.bias_type || 'NEUTRAL',
          accuracyScore: r.accuracy_score || 94,
          status: r.status || 'PUBLICADO',
          revisionCode: r.revision_code || 'V0',
          sourceSystem: r.source_system || 'QLIK_SAP_COMBO',
          qlikTimestamp: r.qlik_timestamp || QLIK_LAST_SYNC,
        }))
      }
    } catch {
      // Fallback gracioso para memória persistida
    }

    let result = [...this.memoryRecords]

    // RLS: Vendedor só vê seus próprios registros
    if (currentUserRole === 'vendedor' && currentUserId) {
      result = result.filter(
        (r) =>
          r.sellerId === currentUserId || r.sellerId.includes(currentUserId.replace('qas-', '')),
      )
    }

    if (filters?.cycleYearMonth && filters.cycleYearMonth !== 'ALL') {
      result = result.filter((r) => r.yearMonth === filters.cycleYearMonth)
    }

    if (filters?.sellerId && filters.sellerId !== 'ALL') {
      result = result.filter((r) => r.sellerId === filters.sellerId)
    }

    if (filters?.productFamily && filters.productFamily !== 'ALL') {
      result = result.filter((r) => r.productFamily === filters.productFamily)
    }

    if (filters?.customerId && filters.customerId !== 'ALL') {
      result = result.filter((r) => r.customerId === filters.customerId)
    }

    return result
  }

  // 2. Salvar Ajuste do Vendedor (F2) ou Ajuste da Gestão (F3)
  async saveForecastAdjustment(
    recordId: string,
    layer: 'F2' | 'F3' | 'TARGET_PROPOSED' | 'TARGET_APPROVED',
    newValue: number,
    justification: string,
    authorName: string,
  ): Promise<SopForecastRecord> {
    const idx = this.memoryRecords.findIndex((r) => r.id === recordId)
    if (idx === -1) throw new Error('Registro de forecast não encontrado')

    const record = { ...this.memoryRecords[idx] }
    const nowIso = new Date().toISOString()

    if (layer === 'F2') {
      record.f2SellerAdjusted = newValue
      record.f2Justification = justification
      record.f2AdjustedBy = authorName
      record.f2AdjustedAt = nowIso
      record.revisionCode = 'V1'
      record.status = 'EM_REVISAO'
    } else if (layer === 'F3') {
      record.f3PreviousValue = record.f3ManagementAdjusted || record.f2SellerAdjusted
      record.f3ManagementAdjusted = newValue
      record.f3Justification = justification
      record.f3AdjustedBy = authorName
      record.f3AdjustedAt = nowIso
      record.f3ImpactSummary = `Ajuste gerencial de ${record.f3PreviousValue} t para ${newValue} t.`
      record.revisionCode = 'V2'
      record.status = 'APROVADO'
    } else if (layer === 'TARGET_PROPOSED') {
      record.targetProposed = newValue
    } else if (layer === 'TARGET_APPROVED') {
      record.targetApproved = newValue
      record.targetFinal = newValue
    }

    this.memoryRecords[idx] = record

    // Tenta persistir no PocketBase
    try {
      await pb.collection('sop_forecast_records').update(recordId, {
        f2_seller_adjusted: record.f2SellerAdjusted,
        f2_justification: record.f2Justification,
        f2_adjusted_by: record.f2AdjustedBy,
        f2_adjusted_at: record.f2AdjustedAt,
        f3_management_adjusted: record.f3ManagementAdjusted,
        f3_previous_value: record.f3PreviousValue,
        f3_justification: record.f3Justification,
        f3_adjusted_by: record.f3AdjustedBy,
        f3_adjusted_at: record.f3AdjustedAt,
        f3_impact_summary: record.f3ImpactSummary,
        target_proposed: record.targetProposed,
        target_approved: record.targetApproved,
        target_final: record.targetFinal,
        revision_code: record.revisionCode,
        status: record.status,
      })
    } catch {
      // Ignora erro de PocketBase offline
    }

    return record
  }

  // 3. Obter S&OP Executivo Plan
  async getExecutivePlan(cycleYearMonth = '2026-03'): Promise<SopExecutivePlan> {
    try {
      const rec = await pb
        .collection('sop_executive_plans')
        .getFirstListItem(`cycle_year_month = "${cycleYearMonth}"`)
      if (rec) {
        this.executivePlan = {
          id: rec.id,
          cycleYearMonth: rec.cycle_year_month,
          status: rec.status || 'ATIVO',
          targetTotalTons: rec.target_total_tons || 12500,
          targetTotalBrl: rec.target_total_brl || 81250000,
          forecastTotalTons: rec.forecast_total_tons || 12850,
          forecastTotalBrl: rec.forecast_total_brl || 83525000,
          sapBacklogTons: rec.sap_backlog_tons || 8420,
          sapBacklogBrl: rec.sap_backlog_brl || 54730000,
          unconvertedForecastTons: rec.unconverted_forecast_tons || 4430,
          sopTotalDemandTons: rec.sop_total_demand_tons || 12850,
          wmsStockTons: rec.wms_stock_tons || 4120,
          scheduledProductionTons: rec.scheduled_production_tons || 6800,
          netProductionRequirementTons: rec.net_production_requirement_tons || 1930,
          pcpCapacityTons: rec.pcp_capacity_tons || 2200,
          industrialGapTons: rec.industrial_gap_tons || 270,
          industrialStatus: rec.industrial_status || 'ATENDIDO',
          expeditionCapacityTons: rec.expedition_capacity_tons || 13500,
          tmsProgrammedTons: rec.tms_programmed_tons || 8200,
          logisticsGapTons: rec.logistics_gap_tons || 5300,
          revenueForecastBrl: rec.revenue_forecast_brl || 82800000,
          actualBilledBrl: rec.actual_billed_brl || 0,
          actualBilledTons: rec.actual_billed_tons || 0,
          gapCauses: rec.gap_causes_json || BASE_EXECUTIVE_PLAN.gapCauses,
          waterfallSteps: rec.waterfall_steps_json || BASE_EXECUTIVE_PLAN.waterfallSteps,
          idleCapacityOpportunities:
            rec.idle_capacity_opportunities_json || BASE_EXECUTIVE_PLAN.idleCapacityOpportunities,
        }
      }
    } catch {
      // Retorna fallback
    }
    return this.executivePlan
  }

  // 4. Obter Resumo de Métricas FVA
  async getFvaSummary(): Promise<FvaMetricSummary[]> {
    const all = await this.getForecastRecords()
    return calculateFvaMetrics(all)
  }

  // 5. Reunião de S&OP & ATA
  async getSopMeeting(cycleYearMonth = '2026-03'): Promise<SopMeeting> {
    try {
      const rec = await pb
        .collection('sop_meetings')
        .getFirstListItem(`cycle_year_month = "${cycleYearMonth}"`)
      if (rec) {
        this.meeting = {
          id: rec.id,
          cycleYearMonth: rec.cycle_year_month,
          title: rec.title,
          meetingDate: rec.meeting_date || BASE_SOP_MEETING.meetingDate,
          locationType: rec.location_type || 'HIBRIDO',
          status: rec.status || 'AGENDADA',
          participants: rec.participants_json || BASE_SOP_MEETING.participants,
          agendaTopics: rec.agenda_topics_json || BASE_SOP_MEETING.agendaTopics,
          aiBriefing: {
            summary: rec.ai_briefing_summary || BASE_SOP_MEETING.aiBriefing.summary,
            whatChanged: rec.ai_briefing_changes
              ? JSON.parse(rec.ai_briefing_changes)
              : BASE_SOP_MEETING.aiBriefing.whatChanged,
            fvaHighlights:
              rec.ai_briefing_bias_insights || BASE_SOP_MEETING.aiBriefing.fvaHighlights,
            identifiedBiases:
              rec.ai_briefing_bias_insights || BASE_SOP_MEETING.aiBriefing.identifiedBiases,
            keyRisks: rec.ai_briefing_risks
              ? JSON.parse(rec.ai_briefing_risks)
              : BASE_SOP_MEETING.aiBriefing.keyRisks,
            strategicOpportunities: rec.ai_briefing_opportunities
              ? JSON.parse(rec.ai_briefing_opportunities)
              : BASE_SOP_MEETING.aiBriefing.strategicOpportunities,
            recommendedDecisions: rec.ai_briefing_recommendations
              ? JSON.parse(rec.ai_briefing_recommendations)
              : BASE_SOP_MEETING.aiBriefing.recommendedDecisions,
          },
          meetingMinutesAta: rec.meeting_minutes_ata
            ? JSON.parse(rec.meeting_minutes_ata)
            : BASE_SOP_MEETING.meetingMinutesAta,
          transcriptionSnippet: rec.transcription_snippet,
          recordingUrl: rec.recording_url,
        }
      }
    } catch {
      // Fallback
    }
    return this.meeting
  }

  // 6. Cenários de Simulação
  async getScenarios(): Promise<SopScenarioSimulation[]> {
    return this.scenarios
  }

  async createScenario(
    scenario: Omit<SopScenarioSimulation, 'id' | 'createdAt'>,
  ): Promise<SopScenarioSimulation> {
    const newSim: SopScenarioSimulation = {
      ...scenario,
      id: `sim-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    this.scenarios.unshift(newSim)
    return newSim
  }
}

export const sopService = new SopDataService()
