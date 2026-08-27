import type {
  CommercialPlaybook,
  CommercialArchetype,
  CustomerComplaint,
  RelationshipEvent,
  CommercialAutomationRule,
  DynamicFormField,
  CPQCommercialQuote,
} from '@/types/models'

// Playbooks Comerciais por Arquétipo
export const initialCommercialPlaybooks: CommercialPlaybook[] = [
  {
    id: 'pb-industria',
    customer_archetype: 'INDÚSTRIA',
    name: 'Playbook Indústria — Programação Produtiva & Homologação Técnica',
    objectives: [
      'Garantir previsibilidade de consumo e abastecimento contínuo',
      'Homologação de usinas e certificados de qualidade (análise química e mecânica)',
      'Contratos anuais com entregas parceladas/programadas CIF',
      'Manter SLA de entrega rigoroso para evitar parada de linha de produção',
    ],
    recommended_approach:
      'Consultiva, técnica, planejada e estruturada. Evitar abordagem oportunista ou foco exclusivo em promoção pontual. Focar em segurança de suprimento e lead time.',
    questions_to_ask: [
      'Qual é o cronograma de consumo previsto para os próximos 60 e 90 dias?',
      'Existe alguma exigência de certificado específico da usina (ex: CSN, Gerdau, ArcelorMittal)?',
      'Como estão os lotes mínimos e a capacidade de armazenagem no seu pátio fabril?',
      'Qual o impacto financeiro de uma eventual ruptura de matéria-prima na sua linha?',
    ],
    signals_to_watch: [
      'Abertura de nova linha fabril ou novo turno de trabalho',
      'Oscilação no lead time de importação de tubos ou aços especiais',
      'Vencimento de contratos vigentes de suprimento com concorrentes',
      'Reclamações sobre qualidade superficial ou dimensional de outro distribuidor',
    ],
    objections: [
      {
        objection: 'O concorrente ofereceu R$ 0,15 a menos por quilo.',
        recommended_response:
          'Compreendemos a pressão de custo, mas nosso compromisso inclui certificação de usina de 1ª linha, garantia de lote rastreado e estoque pulmão em Contagem para evitar parada de fábrica.',
      },
      {
        objection: 'Nosso estoque ainda está com cobertura para 45 dias.',
        recommended_response:
          'Excelente. Vamos alinhar a programação para que o próximo lote esteja faturado e agendado exatamente na data de reabastecimento ideal.',
      },
    ],
    recommended_channels: ['Visita', 'E-mail', 'Ligação', 'WhatsApp'],
    recommended_cadence: 'Visita técnica mensal + alinhamento quinzenal por e-mail/WhatsApp',
    forbidden_patterns: [
      'Enviar mensagens promocionais genéricas de "queima de estoque"',
      'Mudar prazos ou lotes sem alinhamento prévio com PCP/Engenharia do cliente',
      'Omitir certificados de qualidade ou tolerâncias dimensionais',
    ],
    created_by: 'Carlos Alberto (Diretoria Comercial)',
    version: '1.2.0',
    status: 'ATIVO',
    updated_at: '2024-10-10',
    change_reason: 'Refinamento de argumentos de lead time e tolerâncias de usina.',
  },
  {
    id: 'pb-revenda',
    customer_archetype: 'REVENDA',
    name: 'Playbook Revenda — Giro de Estoque, Mix e Pronta-Entrega',
    objectives: [
      'Maximizar o giro de estoque do distribuidor/loja',
      'Garantir mix completo de bitolas e famílias mais vendidas',
      'Prevenir ruptura em itens de alto giro (tubos, perfis, chapas finas)',
      'Apoiar a formação de margem e condição competitiva de revenda',
    ],
    recommended_approach:
      'Objetiva, comercial, orientada a giro de mercadoria, condições de pagamento atrativas e entregas rápidas e fracionadas.',
    questions_to_ask: [
      'Quais bitolas apresentaram maior velocidade de saída nos últimos 15 dias?',
      'Está havendo perda de vendas no balcão por falta de algum perfil específico?',
      'Qual prazo médio seus clientes de balcão estão exigindo?',
    ],
    signals_to_watch: [
      'Aumento da demanda regional por obras residenciais e comerciais',
      'Desabastecimento em concorrentes locais',
      'Datas sazonais de pagamento da construção civil',
    ],
    objections: [
      {
        objection: 'Preciso de mais prazo para pagar após a venda no balcão.',
        recommended_response:
          'Podemos avaliar a condição de 35 a 42 DDL para pedidos com mix consolidado acima de 15 toneladas.',
      },
    ],
    recommended_channels: ['WhatsApp', 'Ligação', 'Visita'],
    recommended_cadence: 'Follow-up semanal via WhatsApp + visita comercial bimestral',
    forbidden_patterns: [
      'Propor volumes gigantescos de itens de baixo giro sem estudo de demanda',
      'Demorar mais de 2 horas para responder cotações de balcão',
    ],
    created_by: 'Marcos Vinícius (Supervisor)',
    version: '1.1.0',
    status: 'ATIVO',
    updated_at: '2024-10-08',
  },
  {
    id: 'pb-serralheria',
    customer_archetype: 'SERRALHERIA',
    name: 'Playbook Serralheria — Praticidade, Aplicação e Necessidade Imediata',
    objectives: [
      'Atender demandas imediatas de projetos, portões, mezaninos e estruturas leves',
      'Orientação técnica simples sobre aplicação de tubos, perfis e chapas dobradas',
      'Garantir retirada rápida ou entrega ágil em obra/oficina',
    ],
    recommended_approach:
      'Prática, direta, prestativa e ágil. Foco na facilidade de compra, corte sob medida e pronto atendimento.',
    questions_to_ask: [
      'Qual o prazo de entrega da obra que você está executando agora?',
      'Precisa do material cortado nas medidas exatas do projeto?',
      'Vai retirar no balcão de Contagem ou precisa de entrega na obra?',
    ],
    signals_to_watch: [
      'Fechamento de contratos de condomínios ou galpões pequenos na região',
      'Fidelização via canal rápido de WhatsApp',
    ],
    objections: [
      {
        objection: 'O frete encarece muito meu pedido pequeno.',
        recommended_response:
          'Agrupamos sua entrega na rota de amanhã da sua cidade, reduzindo o custo de frete a quase zero.',
      },
    ],
    recommended_channels: ['WhatsApp', 'Ligação'],
    recommended_cadence: 'Contato quinzenal ágil via WhatsApp',
    forbidden_patterns: [
      'Exigir documentação excessiva para pedidos pequenos',
      'Usar jargões corporativos burocráticos',
    ],
    created_by: 'Carlos Mendonça',
    version: '1.0.0',
    status: 'ATIVO',
    updated_at: '2024-09-25',
  },
  {
    id: 'pb-consumidor-final',
    customer_archetype: 'CONSUMIDOR_FINAL',
    name: 'Playbook Consumidor Final — Clareza de Necessidade & Orientação Comercial',
    objectives: [
      'Esclarecer especificações técnicas com linguagem simples e acessível',
      'Garantir segurança no pagamento e opções claras de retirada ou frete',
      'Proporcionar experiência ágil sem complicação desnecessária',
    ],
    recommended_approach:
      'Didática, segura, cordial e transparente. Evitar jargões pesados da indústria siderúrgica.',
    questions_to_ask: [
      'Qual estrutura ou reforma você pretende construir?',
      'O serralheiro ou pedreiro já passou a lista exata de barras e espessuras?',
      'Como prefere receber o material (retirada ou entrega no local)?',
    ],
    signals_to_watch: [
      'Obras residenciais em andamento, reformas de sítios ou condomínios',
      'Dúvidas sobre durabilidade de aços galvanizados vs preto',
    ],
    objections: [
      {
        objection: 'Não sei a diferença entre galvanizado e aço carbono natural.',
        recommended_response:
          'O galvanizado possui camada de zinco que protege contra ferrugem em áreas externas e chuvas, durando muito mais tempo.',
      },
    ],
    recommended_channels: ['WhatsApp', 'Ligação'],
    recommended_cadence: 'Atendimento sob demanda com follow-up em 24h',
    forbidden_patterns: [
      'Usar termos excessivamente técnicos sem explicação',
      'Abandonar o contato sem confirmação de recebimento do orçamento',
    ],
    created_by: 'Mariana Azevedo',
    version: '1.0.0',
    status: 'ATIVO',
    updated_at: '2024-09-20',
  },
]

// Reclamações de Qualidade Mock por Cliente
export const mockComplaints: Record<string, CustomerComplaint[]> = {
  'cli-100001': [
    {
      id: 'nc-8801',
      customerId: 'cli-100001',
      customerName: 'Metalúrgica Santa Rita Ltda',
      protocolNumber: 'NC-2024-0412',
      title: 'Variação dimensional na espessura de Perfis W (Lote W-9812)',
      category: 'DIMENSIONAL',
      severity: 'MEDIA',
      status: 'EM_ANALISE',
      isRecurrent: true,
      recurrentCount: 2,
      openedAt: '08/10/2024',
      assignedTechnician: 'Eng. Maurício Ramos (Qualidade CIAFAL)',
      actionPlanSummary:
        'Coleta de amostra em pátio e aferição micrométrica com calibrador aferido pelo INMETRO.',
      performanceManagementId: 'pm-rec-0412',
    },
    {
      id: 'nc-8802',
      customerId: 'cli-100001',
      customerName: 'Metalúrgica Santa Rita Ltda',
      protocolNumber: 'NC-2024-0298',
      title: 'Oxidação superficial leve em feixe de barras descarregado sob chuva',
      category: 'SUPERFICIAL',
      severity: 'BAIXA',
      status: 'CONCLUIDA',
      isRecurrent: false,
      openedAt: '15/06/2024',
      concludedAt: '22/06/2024',
      assignedTechnician: 'Maurício Ramos',
      actionPlanSummary:
        'Substituição de 2 feixes e aplicação de lona protetora reforçada na frota TransAço.',
      rootCause: 'Lona danificada durante percurso rodoviário sob tempestade.',
      performanceManagementId: 'pm-rec-0298',
    },
  ],
  'cli-100002': [
    {
      id: 'nc-8803',
      customerId: 'cli-100002',
      customerName: 'Aços & Caldeiraria Betim S.A.',
      protocolNumber: 'NC-2024-0370',
      title: 'Divergência de certificado usina para Chapas Grossas A36',
      category: 'DIVERGENCIA_FATURA',
      severity: 'BAIXA',
      status: 'CONCLUIDA',
      isRecurrent: false,
      openedAt: '20/08/2024',
      concludedAt: '21/08/2024',
      assignedTechnician: 'Camila Duarte',
      actionPlanSummary: 'Reemissão imediata do laudo rastreável do fornecedor Gerdau Açominas.',
      performanceManagementId: 'pm-rec-0370',
    },
  ],
  'cli-100004': [
    {
      id: 'nc-8804',
      customerId: 'cli-100004',
      customerName: 'Agronorte Equipamentos & Silos S.A.',
      protocolNumber: 'NC-2024-0440',
      title: 'Atraso na entrega programada de Bobinas Z275 (1 dia de atraso na obra)',
      category: 'ENTREGA_ATRASO',
      severity: 'ALTA',
      status: 'PLANO_DE_ACAO',
      isRecurrent: false,
      openedAt: '02/10/2024',
      assignedTechnician: 'Roberto Lima (Logística & Gestão de Performance)',
      actionPlanSummary:
        'Redirecionamento de frota dedicada expressa e bonificação de frete na próxima fatura.',
      performanceManagementId: 'pm-rec-0440',
    },
  ],
}

// Réguas de Relacionamento Iniciais
export const initialRelationshipEvents: RelationshipEvent[] = [
  {
    id: 'rel-1',
    name: 'Aniversário do Decisor / Comprador',
    type: 'ANIVERSARIO_CONTATO',
    date_rule: 'Dia e mês de nascimento do contato cadastrado',
    audience: 'Contatos primários e decisores com opt-in ativo',
    template:
      'Olá {nome_contato}, parabéns pelo seu dia! Toda a equipe da CIAFAL deseja muito sucesso e realizações!',
    channel: 'WhatsApp',
    owner: 'Carlos Mendonça',
    status: 'ATIVO',
    requires_approval: false,
    lgpd_opt_in_required: true,
  },
  {
    id: 'rel-2',
    name: 'Aniversário de Fundação da Empresa Cliente',
    type: 'ANIVERSARIO_EMPRESA',
    date_rule: 'Data de abertura do CNPJ',
    audience: 'Clientes Ativos A e B',
    template:
      'Parabéns à {razao_social} por mais um ano de história e protagonismo na indústria mineira! É uma honra sermos parceiros nessa trajetória.',
    channel: 'E-mail',
    owner: 'Equipe de Marketing & CRM CIAFAL',
    status: 'ATIVO',
    requires_approval: true,
    lgpd_opt_in_required: false,
  },
  {
    id: 'rel-3',
    name: 'Pós-Venda Técnico & Chegada de Carga',
    type: 'POS_VENDA',
    date_rule: 'D+2 após confirmação de entrega no TMS',
    audience: 'Clientes que receberam entrega recente',
    archetype: 'INDÚSTRIA',
    template:
      'Olá {nome_contato}, confirmamos a entrega do pedido {pedido}. O material já foi inspecionado pela sua equipe? Precisa de algum certificado adicional?',
    channel: 'WhatsApp',
    owner: 'Vendedor Responsável',
    status: 'ATIVO',
    requires_approval: false,
    lgpd_opt_in_required: false,
  },
  {
    id: 'rel-4',
    name: 'Campanha de Recompra — Janela de Ciclo de Consumo',
    type: 'RECOMPRA',
    date_rule: 'D-5 antes da data prevista de recompra calculada pelo modelo P(vivo)',
    audience: 'Revendas e Indústrias em janela de consumo',
    template:
      'Olá {nome_contato}, identificamos que seu ciclo habitual de reposição está próximo. Temos lotes de pronta-entrega reservados no CD Contagem.',
    channel: 'WhatsApp',
    owner: 'Vendedor Responsável',
    status: 'ATIVO',
    requires_approval: true,
    lgpd_opt_in_required: true,
  },
]

// Regras de Automação / Workflow Engine
export const initialAutomationRules: CommercialAutomationRule[] = [
  {
    id: 'rule-1',
    name: 'Alerta Preventivo de Reclamação Aberta',
    trigger: 'RECLAMACAO_ABERTA',
    conditions: [{ field: 'severity', operator: 'in', value: ['ALTA', 'CRITICA', 'MEDIA'] }],
    actions: [
      {
        type: 'NOTIFY_USER',
        payload: {
          title: 'Atenção: Reclamação Aberta na Gestão de Performance',
          message:
            'Verifique a ocorrência de qualidade antes de realizar nova abordagem comercial.',
        },
      },
      {
        type: 'CREATE_DAILY_ACTION',
        payload: {
          action_type: 'resolver_impedimento',
          recommendation: 'Alinhar resolução técnica com o cliente antes de cotar',
        },
      },
    ],
    enabled: true,
  },
  {
    id: 'rule-2',
    name: 'Alerta de Ocorrência Logística TMS em Trânsito',
    trigger: 'CARGA_ATRASADA',
    conditions: [{ field: 'hasLogisticsException', operator: 'equals', value: true }],
    actions: [
      {
        type: 'NOTIFY_USER',
        payload: {
          title: 'Alerta TMS: Carga com Ocorrência em Trânsito',
          message: 'Caminhão retido ou atrasado. Notifique o cliente preventivamente.',
        },
      },
      {
        type: 'CREATE_TASK',
        payload: {
          title: 'Acompanhar liberação de carga junto à transportadora',
          priority: 'alta',
        },
      },
    ],
    enabled: true,
  },
  {
    id: 'rule-3',
    name: 'Reativação Automática de Cliente Inativo',
    trigger: 'CLIENTE_INATIVO',
    conditions: [{ field: 'pAlive', operator: 'greater_than', value: 0.6 }],
    actions: [
      {
        type: 'CREATE_DAILY_ACTION',
        payload: {
          action_type: 'recuperar',
          recommendation: 'Apresentar catálogo atualizado de pronta entrega',
        },
      },
    ],
    enabled: true,
  },
]

// Formulários Dinâmicos por Arquétipo
export const initialDynamicFormFields: DynamicFormField[] = [
  {
    id: 'df-1',
    name: 'consumo_mensal_estimado_ton',
    label: 'Consumo Mensal Estimado (Toneladas)',
    type: 'number',
    required: true,
    helpText: 'Estimativa média de consumo da planta',
  },
  {
    id: 'df-2',
    name: 'tolerancia_dimensional',
    label: 'Exigência de Tolerância Dimensional Rigorosa',
    type: 'boolean',
    required: false,
    conditionalArchetypes: ['INDÚSTRIA'],
    helpText: 'Se marcado, anexa laudo técnico obrigatório na cotação',
  },
  {
    id: 'df-3',
    name: 'tipo_estrutura_projeto',
    label: 'Tipo de Estrutura / Aplicação do Projeto',
    type: 'select',
    required: true,
    conditionalArchetypes: ['SERRALHERIA', 'CONSUMIDOR_FINAL'],
    options: ['Portão / Grade', 'Mezanino', 'Galpão Leve', 'Cobertura', 'Reforma Geral'],
  },
  {
    id: 'df-4',
    name: 'frequencia_giro_semanal',
    label: 'Meta de Giro Semanal de Balcão',
    type: 'select',
    required: false,
    conditionalArchetypes: ['REVENDA'],
    options: ['Alta (1 a 2 dias)', 'Média (3 a 5 dias)', 'Semanal (7 dias)'],
  },
]

// Propostas CPQ Mock
export const initialCPQQuotes: CPQCommercialQuote[] = [
  {
    id: 'cpq-101',
    quoteNumber: 'PROP-2024-0981',
    sapQuoteId: 'COT-98104',
    customerId: 'cli-100001',
    customerName: 'Metalúrgica Santa Rita Ltda',
    customerSap: '100001',
    customerArchetype: 'INDÚSTRIA',
    sellerId: 'qas-vendedor_teste',
    sellerName: 'Carlos Mendonça',
    items: [
      {
        id: 'item-1',
        materialCode: '100042',
        description: 'Perfil Estrutural W 200x26.6 (Viga W Aço ASTM A572 Gr50)',
        family: 'Perfis Pesados',
        quantityTons: 12.0,
        basePriceKg: 6.2,
        discountPercent: 3.5,
        finalPriceKg: 5.98,
        totalValue: 71760,
        marginPercent: 18.5,
        leadTimeDays: 3,
        freightType: 'CIF',
      },
      {
        id: 'item-2',
        materialCode: '100088',
        description: 'Chapa Grossa ASTM A36 12.5mm (1/2 pol) 2440x6000mm',
        family: 'Chapas Grossas',
        quantityTons: 4.5,
        basePriceKg: 5.8,
        discountPercent: 2.0,
        finalPriceKg: 5.68,
        totalValue: 25560,
        marginPercent: 16.2,
        leadTimeDays: 2,
        freightType: 'CIF',
      },
    ],
    totalTons: 16.5,
    totalValue: 97320,
    averageMarginPercent: 17.8,
    paymentCondition: '35 DDL via Boleto Bancário',
    freightTerms: 'CIF Contagem / Betim incluso',
    validUntil: '2024-10-26',
    version: 2,
    status: 'APROVADA',
    approvalRequired: false,
    approvedBy: 'Marcos Vinícius (Supervisor)',
    approvedAt: '2024-10-12 11:20',
    createdAt: '2024-10-11',
    history: [
      {
        version: 1,
        date: '11/10/2024 10:00',
        author: 'Carlos Mendonça',
        changes: 'Criação inicial da proposta com 16.5 toneladas',
        status: 'RASCUNHO',
      },
      {
        version: 2,
        date: '12/10/2024 11:20',
        author: 'Marcos Vinícius',
        changes: 'Aprovação de desconto especial de 3.5% para Indústria',
        status: 'APROVADA',
      },
    ],
  },
]
