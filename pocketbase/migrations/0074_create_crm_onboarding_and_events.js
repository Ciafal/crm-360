migrate(
  (app) => {
    try {
      const db = app.dao ? app.dao().db() : app.db ? app.db() : null
      if (!db) return

      // Tabela CRM_ONBOARDING: Processos de Cadastramento e Checklist
      db.newQuery(`
        CREATE TABLE IF NOT EXISTS crm_onboardings (
          id TEXT PRIMARY KEY,
          crm_party_id TEXT NOT NULL,
          protocolo TEXT UNIQUE NOT NULL,
          tipo_processo TEXT NOT NULL DEFAULT 'CADASTRO_INICIAL',
          status TEXT NOT NULL DEFAULT 'AGUARDANDO_CLIENTE',
          etapa_atual TEXT NOT NULL DEFAULT 'PASSO1_EMPRESA',
          progresso_pct INTEGER DEFAULT 0,
          portal_token TEXT DEFAULT '',
          portal_url TEXT DEFAULT '',
          token_expira_em TEXT DEFAULT '',
          token_usado INTEGER DEFAULT 0,
          solicitante_nome TEXT DEFAULT '',
          analista_responsavel TEXT DEFAULT '',
          parecer_analise TEXT DEFAULT '',
          sla_horas INTEGER DEFAULT 24,
          data_inicio TEXT NOT NULL DEFAULT (datetime('now')),
          data_conclusao TEXT DEFAULT '',
          ai_validacao_score INTEGER DEFAULT 0,
          ai_alertas_json TEXT DEFAULT '[]',
          created TEXT NOT NULL DEFAULT (datetime('now')),
          updated TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `).execute()

      // Tabela CRM_DOCUMENT: Documentação Cadastral Versionada (V1, V2, V3...)
      db.newQuery(`
        CREATE TABLE IF NOT EXISTS crm_documents (
          id TEXT PRIMARY KEY,
          crm_party_id TEXT NOT NULL,
          onboarding_id TEXT DEFAULT '',
          tipo_documento TEXT NOT NULL,
          nome_arquivo TEXT NOT NULL,
          url_arquivo TEXT DEFAULT '',
          tamanho_bytes INTEGER DEFAULT 0,
          mimetype TEXT DEFAULT 'application/pdf',
          versao INTEGER DEFAULT 1,
          status TEXT NOT NULL DEFAULT 'EM_ANALISE',
          motivo_rejeicao TEXT DEFAULT '',
          origem TEXT NOT NULL DEFAULT 'PORTAL_CLIENTE',
          uploaded_by TEXT DEFAULT '',
          ai_valido INTEGER DEFAULT 1,
          ai_parecer TEXT DEFAULT '',
          created TEXT NOT NULL DEFAULT (datetime('now')),
          updated TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `).execute()

      // Tabela CRM_CREDIT_ANALYSIS: Análise de Crédito & Limites
      db.newQuery(`
        CREATE TABLE IF NOT EXISTS crm_credit_analyses (
          id TEXT PRIMARY KEY,
          crm_party_id TEXT NOT NULL,
          limite_solicitado REAL DEFAULT 0,
          limite_aprovado REAL DEFAULT 0,
          limite_utilizado REAL DEFAULT 0,
          limite_disponivel REAL DEFAULT 0,
          condicao_pagamento_recomendada TEXT DEFAULT '30 DDL',
          parecer_ia TEXT DEFAULT '',
          score_credito_ia INTEGER DEFAULT 0,
          decisao_humana_por TEXT DEFAULT '',
          decisao_humana_em TEXT DEFAULT '',
          motivo_decisao TEXT DEFAULT '',
          titulos_vencidos REAL DEFAULT 0,
          titulos_a_vencer REAL DEFAULT 0,
          exposicao_total REAL DEFAULT 0,
          bloqueio_credito INTEGER DEFAULT 0,
          motivo_bloqueio TEXT DEFAULT '',
          created TEXT NOT NULL DEFAULT (datetime('now')),
          updated TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `).execute()

      // Tabela CRM_TIMELINE_EVENT: Timeline 360º Unificada
      db.newQuery(`
        CREATE TABLE IF NOT EXISTS crm_timeline_events (
          id TEXT PRIMARY KEY,
          crm_party_id TEXT NOT NULL,
          tipo_evento TEXT NOT NULL,
          titulo TEXT NOT NULL,
          descricao TEXT DEFAULT '',
          modulo_origem TEXT NOT NULL,
          usuario_id TEXT DEFAULT '',
          usuario_nome TEXT DEFAULT '',
          detalhes_json TEXT DEFAULT '{}',
          created TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `).execute()

      // Tabela CRM_AUDIT_LOG: Trilha de Auditoria sem exclusão física (LGPD e Compliance)
      db.newQuery(`
        CREATE TABLE IF NOT EXISTS crm_audit_logs (
          id TEXT PRIMARY KEY,
          crm_party_id TEXT NOT NULL,
          acao TEXT NOT NULL,
          campo_alterado TEXT DEFAULT '',
          valor_anterior TEXT DEFAULT '',
          valor_novo TEXT DEFAULT '',
          usuario_id TEXT DEFAULT '',
          usuario_nome TEXT DEFAULT '',
          ip_origem TEXT DEFAULT '',
          created TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `).execute()

      // Tabela CRM_SCORE_HISTORY: Histórico de Evolução do IA Score
      db.newQuery(`
        CREATE TABLE IF NOT EXISTS crm_score_histories (
          id TEXT PRIMARY KEY,
          crm_party_id TEXT NOT NULL,
          score INTEGER NOT NULL,
          motivo TEXT NOT NULL,
          variaveis_json TEXT DEFAULT '{}',
          calculado_por TEXT DEFAULT 'IA_ENGINE_V2',
          created TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `).execute()

      // Índices
      try {
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_crm_onb_party ON crm_onboardings (crm_party_id)`,
        ).execute()
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_crm_onb_proto ON crm_onboardings (protocolo)`,
        ).execute()
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_crm_onb_status ON crm_onboardings (status)`,
        ).execute()

        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_crm_doc_party ON crm_documents (crm_party_id)`,
        ).execute()
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_crm_doc_type ON crm_documents (tipo_documento)`,
        ).execute()

        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_crm_credit_party ON crm_credit_analyses (crm_party_id)`,
        ).execute()
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_crm_timeline_party ON crm_timeline_events (crm_party_id)`,
        ).execute()
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_crm_audit_party ON crm_audit_logs (crm_party_id)`,
        ).execute()
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_crm_score_party ON crm_score_histories (crm_party_id)`,
        ).execute()
      } catch (errIdx) {
        console.log('0074_create_crm_onboarding_and_events index notice:', errIdx)
      }
    } catch (e) {
      console.log('0074_create_crm_onboarding_and_events migration error:', e)
    }
  },
  (_app) => {
    /* No-op downgrade seguro */
  },
)
