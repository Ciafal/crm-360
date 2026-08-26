migrate(
  (app) => {
    // 1. Obter referências de coleções e usuários de teste
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const teamsCol = app.findCollectionByNameOrId('teams')
    const portfoliosCol = app.findCollectionByNameOrId('seller_portfolios')
    const crmCompaniesCol = app.findCollectionByNameOrId('crm_companies')
    const crmContactsCol = app.findCollectionByNameOrId('crm_contacts')
    const dailyActionsCol = app.findCollectionByNameOrId('daily_commercial_actions')
    const dailyPlansCol = app.findCollectionByNameOrId('daily_commercial_plans')
    const customerScoresCol = app.findCollectionByNameOrId('customer_scores')
    const rfmScoresCol = app.findCollectionByNameOrId('rfm_scores')
    const reactivationCandCol = app.findCollectionByNameOrId('reactivation_candidates')
    const purchaseRecurrenceCol = app.findCollectionByNameOrId('purchase_recurrence')
    const interactionsCol = app.findCollectionByNameOrId('interactions')
    const userHierarchyCol = app.findCollectionByNameOrId('user_hierarchy')

    let accountId = null
    try {
      accountId = app.findCollectionByNameOrId('accounts').id
      const acc = app.findRecordsByFilter('accounts', '', '-created', 1, 0)
      if (acc.length > 0) accountId = acc[0].id
    } catch (_) {}

    // Buscar IDs dos usuários de teste
    let supId = null
    let v1Id = null
    let v2Id = null
    let v3Id = null
    let repId = null

    try {
      supId = app.findAuthRecordByEmail('_pb_users_auth_', 'supervisor.teste@ciafal.local').id
    } catch (_) {}
    try {
      v1Id = app.findAuthRecordByEmail('_pb_users_auth_', 'vendedor.teste@ciafal.local').id
    } catch (_) {}
    try {
      v2Id = app.findAuthRecordByEmail('_pb_users_auth_', 'vendedor2.teste@ciafal.local').id
    } catch (_) {}
    try {
      v3Id = app.findAuthRecordByEmail('_pb_users_auth_', 'vendedor3.teste@ciafal.local').id
    } catch (_) {}
    try {
      repId = app.findAuthRecordByEmail('_pb_users_auth_', 'representante.teste@crm360.local').id
    } catch (_) {}

    // 2. Criar / Obter Equipe: "Equipe Comercial Teste"
    let teamId = null
    try {
      const t = app.findFirstRecordByData('teams', 'name', 'Equipe Comercial Teste')
      teamId = t.id
    } catch (_) {
      const team = new Record(teamsCol)
      team.set('name', 'Equipe Comercial Teste')
      if (accountId) team.set('account_id', accountId)
      if (supId) team.set('manager_id', supId)
      app.save(team)
      teamId = team.id
    }

    // 3. Atualizar Hierarchy e Team IDs dos usuários
    if (teamId && supId) {
      const subordinates = [
        { id: v1Id, level: 1 },
        { id: v2Id, level: 1 },
        { id: v3Id, level: 1 },
      ]
      subordinates.forEach((sub) => {
        if (!sub.id) return
        try {
          app.findFirstRecordByData('user_hierarchy', 'user_id', sub.id)
        } catch (_) {
          const hier = new Record(userHierarchyCol)
          hier.set('user_id', sub.id)
          hier.set('manager_id', supId)
          hier.set('team_id', teamId)
          hier.set('hierarchy_level', sub.level)
          if (accountId) hier.set('account_id', accountId)
          app.save(hier)
        }
      })
    }

    // 4. Clientes Fictícios (10 clientes distribuídos com dados de carteira)
    const mockCustomers = [
      // Vendedor 1 (v1Id)
      {
        id: 'CLI-MOCK-101',
        sapCode: 'SAP-10001',
        name: 'Metalúrgica Horizonte Ltda',
        cnpj: '12.345.678/0001-90',
        city: 'Campinas',
        state: 'SP',
        industry: 'Metalmecânico',
        sellerId: v1Id,
        status: 'ATIVO',
        active: true,
        contactName: 'Carlos Eduardo Ramos',
        contactEmail: 'compras@metalurgicahorizonte.mock',
        contactPhone: '+55 19 99876-1001',
        scoreRfm: 'Campeões',
        pAlive: 0.94,
      },
      {
        id: 'CLI-MOCK-102',
        sapCode: 'SAP-10002',
        name: 'Distribuidora São Lucas S.A.',
        cnpj: '23.456.789/0001-01',
        city: 'Ribeirão Preto',
        state: 'SP',
        industry: 'Distribuição de Aços',
        sellerId: v1Id,
        status: 'INATIVO',
        active: false,
        contactName: 'Fernanda Lima',
        contactEmail: 'suprimentos@saolucasdist.mock',
        contactPhone: '+55 16 99876-1002',
        scoreRfm: 'Em risco',
        pAlive: 0.65,
      },
      {
        id: 'CLI-MOCK-103',
        sapCode: 'SAP-10003',
        name: 'Comercial Platina Eireli',
        cnpj: '34.567.890/0001-12',
        city: 'Sorocaba',
        state: 'SP',
        industry: 'Comércio Industrial',
        sellerId: v1Id,
        status: 'ATIVO',
        active: true,
        contactName: 'Marcos Vinicius Silva',
        contactEmail: 'marcos@comercialplatina.mock',
        contactPhone: '+55 15 99876-1003',
        scoreRfm: 'Leais',
        pAlive: 0.89,
      },
      {
        id: 'CLI-MOCK-104',
        sapCode: 'SAP-10004',
        name: 'Indústria Nacional de Embalagens',
        cnpj: '45.678.901/0001-23',
        city: 'Jundiaí',
        state: 'SP',
        industry: 'Embalagens Metálicas',
        sellerId: v1Id,
        status: 'INATIVO',
        active: false,
        contactName: 'Luciana Prado',
        contactEmail: 'compras@nacionalembalagens.mock',
        contactPhone: '+55 11 99876-1004',
        scoreRfm: 'Hibernando',
        pAlive: 0.42,
      },

      // Vendedor 2 (v2Id) - Carteira estritamente separada
      {
        id: 'CLI-MOCK-201',
        sapCode: 'SAP-20001',
        name: 'Ferragens Centro-Oeste Ltda',
        cnpj: '56.789.012/0001-34',
        city: 'Goiânia',
        state: 'GO',
        industry: 'Construção Civil / Ferragens',
        sellerId: v2Id,
        status: 'ATIVO',
        active: true,
        contactName: 'Roberto Alves',
        contactEmail: 'roberto@ferragensco.mock',
        contactPhone: '+55 62 99876-2001',
        scoreRfm: 'Campeões',
        pAlive: 0.92,
      },
      {
        id: 'CLI-MOCK-202',
        sapCode: 'SAP-20002',
        name: 'Construtora Eixo Ltda',
        cnpj: '67.890.123/0001-45',
        city: 'Brasília',
        state: 'DF',
        industry: 'Estruturas Metálicas',
        sellerId: v2Id,
        status: 'INATIVO',
        active: false,
        contactName: 'Patrícia Guimarães',
        contactEmail: 'suprimentos@construtoraeixo.mock',
        contactPhone: '+55 61 99876-2002',
        scoreRfm: 'Perdidos',
        pAlive: 0.28,
      },
      {
        id: 'CLI-MOCK-203',
        sapCode: 'SAP-20003',
        name: 'Tubos e Conexões Bandeirantes',
        cnpj: '78.901.234/0001-56',
        city: 'Anápolis',
        state: 'GO',
        industry: 'Tubulações Industriais',
        sellerId: v2Id,
        status: 'ATIVO',
        active: true,
        contactName: 'José Geraldo Santos',
        contactEmail: 'geraldo@tubosbandeirantes.mock',
        contactPhone: '+55 62 99876-2003',
        scoreRfm: 'Leais',
        pAlive: 0.88,
      },

      // Vendedor 3 (v3Id) - Carteira separada
      {
        id: 'CLI-MOCK-301',
        sapCode: 'SAP-30001',
        name: 'Siderúrgica Vale Verde S.A.',
        cnpj: '89.012.345/0001-67',
        city: 'Belo Horizonte',
        state: 'MG',
        industry: 'Siderurgia & Transformação',
        sellerId: v3Id,
        status: 'ATIVO',
        active: true,
        contactName: 'Antônio Fagundes Filho',
        contactEmail: 'antonio@valeverdesiderurgia.mock',
        contactPhone: '+55 31 99876-3001',
        scoreRfm: 'Campeões',
        pAlive: 0.96,
      },
      {
        id: 'CLI-MOCK-302',
        sapCode: 'SAP-30002',
        name: 'Equipamentos Industriais Mantiqueira',
        cnpj: '90.123.456/0001-78',
        city: 'Pouso Alegre',
        state: 'MG',
        industry: 'Bens de Capital',
        sellerId: v3Id,
        status: 'INATIVO',
        active: false,
        contactName: 'Beatriz Vasconcelos',
        contactEmail: 'beatriz@mantiqueiramaquinas.mock',
        contactPhone: '+55 35 99876-3002',
        scoreRfm: 'Em risco',
        pAlive: 0.58,
      },

      // Representante Externo (repId)
      {
        id: 'CLI-MOCK-401',
        sapCode: 'SAP-40001',
        name: 'AgroInox Representações do Sul',
        cnpj: '01.234.567/0001-89',
        city: 'Passo Fundo',
        state: 'RS',
        industry: 'Implementos Agrícolas',
        sellerId: repId,
        status: 'ATIVO',
        active: true,
        contactName: 'Darci Scherer',
        contactEmail: 'darci@agroinoxsul.mock',
        contactPhone: '+55 54 99876-4001',
        scoreRfm: 'Campeões',
        pAlive: 0.91,
      },
    ]

    // Criar CRM Companies e Contacts para os clientes de teste
    mockCustomers.forEach((c) => {
      let compId = null
      try {
        const existingComp = app.findFirstRecordByData('crm_companies', 'name', c.name)
        compId = existingComp.id
      } catch (_) {
        const comp = new Record(crmCompaniesCol)
        comp.set('name', c.name)
        comp.set('cnpj', c.cnpj)
        comp.set('industry', c.industry)
        if (c.sellerId) comp.set('user_id', c.sellerId)
        if (accountId) comp.set('account_id', accountId)
        app.save(comp)
        compId = comp.id
      }

      // CRM Contact
      try {
        app.findFirstRecordByData('crm_contacts', 'email', c.contactEmail)
      } catch (_) {
        const contact = new Record(crmContactsCol)
        contact.set('instance_name', 'ciafal-mock-instance')
        contact.set('jid', c.id.toLowerCase() + '@s.whatsapp.net')
        contact.set('contact_name', c.contactName)
        contact.set('email', c.contactEmail)
        contact.set('phone', c.contactPhone)
        contact.set('stage', c.status === 'ATIVO' ? 'cliente' : 'lead')
        if (compId) contact.set('company_id', compId)
        if (c.sellerId) {
          contact.set('user_id', c.sellerId)
          contact.set('assigned_to', c.sellerId)
        }
        if (accountId) contact.set('account_id', accountId)
        app.save(contact)
      }

      // Seller Portfolio
      if (c.sellerId) {
        try {
          app.findFirstRecordByData('seller_portfolios', 'customer_id', c.id)
        } catch (_) {
          const port = new Record(portfoliosCol)
          port.set('seller_id', c.sellerId)
          port.set('customer_id', c.id)
          if (accountId) port.set('account_id', accountId)
          app.save(port)
        }
      }

      // Customer Scores (RFM & BG/NBD)
      try {
        app.findFirstRecordByData('customer_scores', 'customer_id', c.id)
      } catch (_) {
        const cs = new Record(customerScoresCol)
        cs.set('customer_id', c.id)
        if (c.sellerId) cs.set('seller_id', c.sellerId)
        if (accountId) cs.set('account_id', accountId)
        cs.set('rfm_recency_score', c.status === 'ATIVO' ? 5 : 2)
        cs.set('rfm_frequency_score', c.status === 'ATIVO' ? 4 : 2)
        cs.set('rfm_monetary_score', c.status === 'ATIVO' ? 5 : 3)
        cs.set('rfm_segment', c.scoreRfm)
        cs.set('bg_nbd_p_alive', c.pAlive)
        cs.set('bg_nbd_expected_frequency', c.status === 'ATIVO' ? 3.4 : 0.8)
        cs.set('gamma_gamma_expected_value', 85000)
        cs.set('reactivation_score', c.status === 'INATIVO' ? 78 : 15)
        cs.set('source', 'QLIK_MOCK')
        cs.set('calculated_at', new Date().toISOString())
        app.save(cs)
      }

      // RFM Scores
      try {
        app.findFirstRecordByData('rfm_scores', 'customer_id', c.id)
      } catch (_) {
        const rfm = new Record(rfmScoresCol)
        rfm.set('customer_id', c.id)
        rfm.set('recency_value', c.status === 'ATIVO' ? 18 : 115)
        rfm.set('recency_score', c.status === 'ATIVO' ? 5 : 2)
        rfm.set('frequency_value', c.status === 'ATIVO' ? 8 : 2)
        rfm.set('frequency_score', c.status === 'ATIVO' ? 4 : 2)
        rfm.set('monetary_value', 340000)
        rfm.set('monetary_score', 4)
        rfm.set('rfm_segment', c.scoreRfm)
        rfm.set('calculated_at', new Date().toISOString())
        if (accountId) rfm.set('account_id', accountId)
        app.save(rfm)
      }

      // Histórico de Compras / Recorrência
      const months = ['2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-01', '2026-02']
      months.forEach((ym, idx) => {
        try {
          const key = c.id + '_' + ym
          const rec = new Record(purchaseRecurrenceCol)
          rec.set('customer_id', c.id)
          rec.set('year_month', ym)
          const isPurch = c.status === 'ATIVO' ? true : idx < 3
          rec.set('has_purchase', isPurch)
          rec.set('revenue', isPurch ? 45000 + idx * 3000 : 0)
          rec.set('tons', isPurch ? 6.5 + idx * 0.4 : 0)
          rec.set('product_family', 'Tubos e Chapas Inox')
          if (accountId) rec.set('account_id', accountId)
          app.save(rec)
        } catch (_) {}
      })
    })

    // 5. Daily Commercial Actions para os vendedores
    const today = new Date().toISOString().split('T')[0]
    const mockActions = [
      // Vendedor 1
      {
        seller_id: v1Id,
        customer_id: 'CLI-MOCK-101',
        customer_name: 'Metalúrgica Horizonte Ltda',
        action_type: 'atacar_agora',
        priority: 95,
        recommendation: 'Ofertar Bobina Laminada a Frio 0.5mm com pronta-entrega',
        rationale: 'Estoque disponível e cliente em ciclo de compra favorável',
        source: 'AI_GENERATED',
        status: 'pendente',
        potential_revenue: 85000,
        potential_tons: 12.0,
        product_family: 'Bobina Laminada',
      },
      {
        seller_id: v1Id,
        customer_id: 'CLI-MOCK-102',
        customer_name: 'Distribuidora São Lucas S.A.',
        action_type: 'recuperar',
        priority: 90,
        recommendation: 'Reativação: Tubo Industrial 2" com condição especial',
        rationale: '95 dias sem compra. P(vivo) de 65%. Crédito aprovado de R$ 150k.',
        source: 'REACTIVATION_AI',
        status: 'pendente',
        potential_revenue: 62000,
        potential_tons: 8.5,
        product_family: 'Tubos Industriais',
      },
      {
        seller_id: v1Id,
        customer_id: 'CLI-MOCK-103',
        customer_name: 'Comercial Platina Eireli',
        action_type: 'follow_up',
        priority: 85,
        recommendation: 'Follow-up cotação Q-2026-001 de Chapas Galvanizadas',
        rationale: 'Cotação enviada via e-mail há 3 dias.',
        source: 'SELLER_CREATED',
        status: 'concluida',
        completion_channel: 'whatsapp',
        result: 'Cliente confirmou fechamento de pedido de 15 toneladas',
        potential_revenue: 110000,
        potential_tons: 15.0,
        product_family: 'Chapa Galvanizada',
      },
      {
        seller_id: v1Id,
        customer_id: 'CLI-MOCK-104',
        customer_name: 'Indústria Nacional de Embalagens',
        action_type: 'resolver_impedimento',
        priority: 80,
        recommendation: 'Alinhar com financeiro liberação de crédito para retomada',
        rationale: 'Limite de crédito expirado travando pedido de R$ 45k.',
        source: 'MANAGER_ASSIGNED',
        status: 'reagendada',
        justification: 'Aguardando parecer do comitê de crédito amanhã às 14h',
        potential_revenue: 45000,
        potential_tons: 5.0,
        product_family: 'Folha de Flandres',
      },

      // Vendedor 2
      {
        seller_id: v2Id,
        customer_id: 'CLI-MOCK-201',
        customer_name: 'Ferragens Centro-Oeste Ltda',
        action_type: 'atacar_agora',
        priority: 92,
        recommendation: 'Apresentar lote de Perfil Estrutural W150 com frete CIF',
        rationale: 'Oportunidade de expansão de obra regional.',
        source: 'AI_GENERATED',
        status: 'pendente',
        potential_revenue: 140000,
        potential_tons: 18.0,
        product_family: 'Perfis Estruturais',
      },
      {
        seller_id: v2Id,
        customer_id: 'CLI-MOCK-202',
        customer_name: 'Construtora Eixo Ltda',
        action_type: 'recuperar',
        priority: 88,
        recommendation: 'Visita técnica para entender motivo de queda de compras',
        rationale: 'Cliente inativo há 140 dias. Perfil de alta margem.',
        source: 'REACTIVATION_AI',
        status: 'em_andamento',
        potential_revenue: 95000,
        potential_tons: 11.5,
        product_family: 'Vigas e Perfis',
      },

      // Vendedor 3
      {
        seller_id: v3Id,
        customer_id: 'CLI-MOCK-301',
        customer_name: 'Siderúrgica Vale Verde S.A.',
        action_type: 'atacar_agora',
        priority: 96,
        recommendation: 'Negociar contrato trimestral de Barra Redonda 1/2"',
        rationale: 'Consumo contínuo de 25 ton/mês.',
        source: 'SELLER_CREATED',
        status: 'pendente',
        potential_revenue: 185000,
        potential_tons: 25.0,
        product_family: 'Barras Redondas',
      },
    ]

    mockActions.forEach((act) => {
      if (!act.seller_id) return
      try {
        const rec = new Record(dailyActionsCol)
        rec.set('seller_id', act.seller_id)
        rec.set('customer_id', act.customer_id)
        rec.set('customer_name', act.customer_name)
        rec.set('action_type', act.action_type)
        rec.set('priority', act.priority)
        rec.set('recommendation', act.recommendation)
        rec.set('rationale', act.rationale)
        rec.set('source', act.source)
        rec.set('status', act.status)
        rec.set('date', today)
        rec.set('due_at', new Date().toISOString())
        if (act.completion_channel) rec.set('completion_channel', act.completion_channel)
        if (act.result) rec.set('result', act.result)
        if (act.justification) rec.set('justification', act.justification)
        rec.set('potential_revenue', act.potential_revenue)
        rec.set('potential_tons', act.potential_tons)
        rec.set('product_family', act.product_family)
        if (accountId) rec.set('account_id', accountId)
        app.save(rec)
      } catch (_) {}
    })

    // 6. Histórico de Daily Commercial Plans (Plano Snapshot)
    const sellersForPlans = [v1Id, v2Id, v3Id]
    sellersForPlans.forEach((sId) => {
      if (!sId) return
      try {
        const plan = new Record(dailyPlansCol)
        plan.set('seller_id', sId)
        plan.set('date', today)
        plan.set('version', 1)
        plan.set('status', 'active')
        plan.set('total_actions', 4)
        plan.set('potential_value', 302000)
        plan.set('potential_tons', 40.5)
        plan.set('generated_by', 'AI_PLANNER_AGENT')
        plan.set(
          'summary',
          'Plano comercial focado em 2 ações prioritárias e 1 recuperação de inativo.',
        )
        if (accountId) plan.set('account_id', accountId)
        app.save(plan)
      } catch (_) {}
    })

    // 7. Interactions / Timeline Omnichannel Mock
    const mockInteractions = [
      {
        customer_id: 'CLI-MOCK-101',
        seller_id: v1Id,
        channel: 'whatsapp',
        direction: 'inbound',
        subject: 'Mensagem WhatsApp',
        summary: 'Cliente solicitou cotação urgente de 50 barras de Tubo Industrial.',
        occurred_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        source: 'Meta WhatsApp Mock',
      },
      {
        customer_id: 'CLI-MOCK-101',
        seller_id: v1Id,
        channel: 'email',
        direction: 'outbound',
        subject: 'Proposta Comercial - Cotação Q-2026-001',
        body_preview: 'Segue em anexo a proposta comercial para fornecimento de Bobinas...',
        occurred_at: new Date(Date.now() - 3600000 * 5).toISOString(),
        source: 'Microsoft Graph 365 Mock',
        quote_id: 'Q-2026-001',
      },
      {
        customer_id: 'CLI-MOCK-101',
        seller_id: v1Id,
        channel: 'phone',
        direction: 'outbound',
        subject: 'Ligação Telefônica VoIP',
        summary: 'Alinhamento de prazo de entrega com o encarregado de compras.',
        transcription:
          'Vendedor: Bom dia Carlos, tudo bem? Cliente: Tudo certo, recebemos a proposta e vamos aprovar hoje à tarde.',
        occurred_at: new Date(Date.now() - 3600000 * 24).toISOString(),
        source: 'VoIP Telefonia Mock',
      },
      {
        customer_id: 'CLI-MOCK-102',
        seller_id: v1Id,
        channel: 'sap_quote',
        direction: 'internal',
        subject: 'Cotação SAP Q-2026-002 Emitida',
        summary: 'Cotação emitida no SAP ECC no valor de R$ 62.000,00.',
        occurred_at: new Date(Date.now() - 3600000 * 48).toISOString(),
        source: 'SAP S/4HANA Mock',
      },
      {
        customer_id: 'CLI-MOCK-103',
        seller_id: v1Id,
        channel: 'sap_order',
        direction: 'internal',
        subject: 'Pedido SAP PED-2026-088 Confirmado',
        summary: 'Pedido faturado e liberado para expedição no CD Central.',
        occurred_at: new Date(Date.now() - 3600000 * 72).toISOString(),
        source: 'SAP S/4HANA Mock',
      },
    ]

    mockInteractions.forEach((inter) => {
      try {
        const rec = new Record(interactionsCol)
        rec.set('customer_id', inter.customer_id)
        if (inter.seller_id) rec.set('seller_id', inter.seller_id)
        rec.set('channel', inter.channel)
        rec.set('direction', inter.direction)
        rec.set('subject', inter.subject)
        if (inter.summary) rec.set('summary', inter.summary)
        if (inter.body_preview) rec.set('body_preview', inter.body_preview)
        if (inter.transcription) rec.set('transcription', inter.transcription)
        if (inter.quote_id) rec.set('quote_id', inter.quote_id)
        rec.set('occurred_at', inter.occurred_at)
        rec.set('source', inter.source)
        rec.set('created_by_system', true)
        if (accountId) rec.set('account_id', accountId)
        app.save(rec)
      } catch (_) {}
    })
  },
  (app) => {
    // Reverter seeds de dados
  },
)
