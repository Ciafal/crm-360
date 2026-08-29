// pocketbase/migrations/0073_create_crm_party_core.js
/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    try {
      const db = app.db ? app.db() : null
      if (!db) return

      // Tabela CRM_PARTY: Registro Comercial Único Mestre
      // (Lead -> Lead Qualificado -> Prospect -> Cliente SAP na mesma entidade)
      db.newQuery(`
        CREATE TABLE IF NOT EXISTS crm_parties (
          id TEXT PRIMARY KEY,
          crm_party_id TEXT UNIQUE NOT NULL,
          friendly_code TEXT NOT NULL,
          sap_customer_id TEXT DEFAULT '',
          razao_social TEXT NOT NULL,
          nome_fantasia TEXT DEFAULT '',
          cnpj_cpf TEXT DEFAULT '',
          inscricao_estadual TEXT DEFAULT '',
          cnae TEXT DEFAULT '',
          regime_tributario TEXT DEFAULT 'Lucro Presumido',
          website TEXT DEFAULT '',
          cidade TEXT NOT NULL,
          uf TEXT NOT NULL,
          regiao TEXT DEFAULT 'Minas Gerais',
          segmento TEXT NOT NULL,
          subsegmento TEXT DEFAULT '',
          grupo_economico_id TEXT DEFAULT '',
          grupo_economico_nome TEXT DEFAULT '',
          commercial_stage TEXT NOT NULL DEFAULT 'LEAD',
          registration_status TEXT NOT NULL DEFAULT 'NAO_INICIADO',
          credit_status TEXT NOT NULL DEFAULT 'NAO_SOLICITADO',
          business_status TEXT NOT NULL DEFAULT 'SEM_OPORTUNIDADE',
          origem_comercial TEXT NOT NULL DEFAULT 'Prospecção Ativa',
          campanha_origem TEXT DEFAULT '',
          vendedor_captador_id TEXT DEFAULT '',
          vendedor_captador_nome TEXT NOT NULL DEFAULT 'Carlos Mendonça',
          vendedor_atual_id TEXT DEFAULT '',
          vendedor_atual_nome TEXT NOT NULL DEFAULT 'Carlos Mendonça',
          regional TEXT DEFAULT 'Minas Centro',
          potencial_mensal_tons REAL DEFAULT 0,
          potencial_anual_tons REAL DEFAULT 0,
          potencial_mensal_valor REAL DEFAULT 0,
          produto_interesse TEXT DEFAULT '',
          aplicacao_produto TEXT DEFAULT '',
          frequencia_estimada_dias INTEGER DEFAULT 30,
          concorrentes TEXT DEFAULT '',
          probabilidade_comercial INTEGER DEFAULT 50,
          previsao_primeira_compra TEXT DEFAULT '',
          lead_score INTEGER DEFAULT 50,
          proxima_acao TEXT DEFAULT '',
          proxima_acao_prazo TEXT DEFAULT '',
          proxima_acao_tipo TEXT DEFAULT '',
          dias_sem_contato INTEGER DEFAULT 0,
          data_primeira_cotacao TEXT DEFAULT '',
          data_primeiro_pedido TEXT DEFAULT '',
          data_primeiro_faturamento TEXT DEFAULT '',
          valor_primeiro_faturamento REAL DEFAULT 0,
          tons_primeiro_faturamento REAL DEFAULT 0,
          tempo_lead_para_cliente_dias INTEGER DEFAULT 0,
          tempo_cliente_para_pedido_dias INTEGER DEFAULT 0,
          tempo_pedido_para_faturamento_dias INTEGER DEFAULT 0,
          created TEXT NOT NULL DEFAULT (datetime('now')),
          updated TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `).execute()

      // Tabela CRM_CONTACT: Contatos do Cliente Mestre
      db.newQuery(`
        CREATE TABLE IF NOT EXISTS crm_contacts (
          id TEXT PRIMARY KEY,
          crm_party_id TEXT NOT NULL,
          nome TEXT NOT NULL,
          cargo TEXT DEFAULT '',
          departamento TEXT DEFAULT '',
          funcao_classificacao TEXT NOT NULL DEFAULT 'Compras',
          telefone TEXT DEFAULT '',
          whatsapp TEXT DEFAULT '',
          email TEXT DEFAULT '',
          is_principal INTEGER DEFAULT 0,
          observacoes TEXT DEFAULT '',
          created TEXT NOT NULL DEFAULT (datetime('now')),
          updated TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `).execute()

      // Tabela CRM_ADDRESS: Endereços múltiplos (Sede, Cobrança, Entrega)
      db.newQuery(`
        CREATE TABLE IF NOT EXISTS crm_addresses (
          id TEXT PRIMARY KEY,
          crm_party_id TEXT NOT NULL,
          tipo TEXT NOT NULL DEFAULT 'SEDE',
          logradouro TEXT NOT NULL,
          numero TEXT DEFAULT '',
          complemento TEXT DEFAULT '',
          bairro TEXT DEFAULT '',
          cidade TEXT NOT NULL,
          uf TEXT NOT NULL,
          cep TEXT DEFAULT '',
          ponto_referencia TEXT DEFAULT '',
          restricoes_descarga TEXT DEFAULT '',
          janela_recebimento TEXT DEFAULT '',
          is_padrao INTEGER DEFAULT 0,
          created TEXT NOT NULL DEFAULT (datetime('now')),
          updated TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `).execute()

      // Tabela CRM_OPPORTUNITY: Ciclos Comerciais e Oportunidades do Party
      db.newQuery(`
        CREATE TABLE IF NOT EXISTS crm_opportunities (
          id TEXT PRIMARY KEY,
          crm_party_id TEXT NOT NULL,
          titulo TEXT NOT NULL,
          fase TEXT NOT NULL DEFAULT 'QUALIFICACAO',
          valor_estimado REAL DEFAULT 0,
          toneladas_estimadas REAL DEFAULT 0,
          produto_familia TEXT DEFAULT '',
          probabilidade INTEGER DEFAULT 50,
          status TEXT NOT NULL DEFAULT 'ABERTA',
          motivo_perda TEXT DEFAULT '',
          vendedor_id TEXT DEFAULT '',
          vendedor_nome TEXT DEFAULT '',
          created TEXT NOT NULL DEFAULT (datetime('now')),
          updated TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `).execute()

      // Tabela CRM_SAP_MAPPING: Mapeamento ECC do Cliente
      db.newQuery(`
        CREATE TABLE IF NOT EXISTS crm_sap_mappings (
          id TEXT PRIMARY KEY,
          crm_party_id TEXT NOT NULL,
          sap_customer_id TEXT NOT NULL,
          empresa TEXT DEFAULT 'CIAFAL 1000',
          organizacao_vendas TEXT DEFAULT 'BR01',
          canal_distribuicao TEXT DEFAULT '10',
          setor_atividade TEXT DEFAULT '01',
          centro_fornecedor TEXT DEFAULT '1000 - Betim Matriz',
          condicao_pagamento TEXT DEFAULT '30 DDL',
          limite_credito REAL DEFAULT 0,
          bloqueio_ordem_venda INTEGER DEFAULT 0,
          bloqueio_faturamento INTEGER DEFAULT 0,
          bloqueio_entrega INTEGER DEFAULT 0,
          status_integracao TEXT NOT NULL DEFAULT 'PROCESSADO',
          created TEXT NOT NULL DEFAULT (datetime('now')),
          updated TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `).execute()

      // Índices
      try {
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_crm_party_id ON crm_parties (crm_party_id)`,
        ).execute()
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_crm_party_friendly ON crm_parties (friendly_code)`,
        ).execute()
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_crm_party_sap ON crm_parties (sap_customer_id)`,
        ).execute()
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_crm_party_cnpj ON crm_parties (cnpj_cpf)`,
        ).execute()
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_crm_party_stage ON crm_parties (commercial_stage)`,
        ).execute()
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_crm_party_seller ON crm_parties (vendedor_atual_id)`,
        ).execute()

        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_crm_contact_party ON crm_contacts (crm_party_id)`,
        ).execute()
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_crm_addr_party ON crm_addresses (crm_party_id)`,
        ).execute()
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_crm_opp_party ON crm_opportunities (crm_party_id)`,
        ).execute()
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_crm_sap_map_party ON crm_sap_mappings (crm_party_id)`,
        ).execute()
      } catch (errIdx) {
        console.log('0073_create_crm_party_core index notice:', errIdx)
      }
    } catch (e) {
      console.log('0073_create_crm_party_core migration error:', e)
    }
  },
  (_app) => {
    /* No-op downgrade seguro */
  },
)
