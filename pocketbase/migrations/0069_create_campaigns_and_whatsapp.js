migrate(
  (app) => {
    try {
      const db = app.dao ? app.dao().db() : app.db ? app.db() : null
      if (!db) return

      // 1. Tabela commercial_campaigns
      db.newQuery(`
        CREATE TABLE IF NOT EXISTS commercial_campaigns (
          id TEXT PRIMARY KEY,
          account_id TEXT DEFAULT '',
          codigo TEXT NOT NULL,
          titulo TEXT NOT NULL,
          descricao TEXT DEFAULT '',
          tipo TEXT NOT NULL,
          canal TEXT NOT NULL,
          status TEXT DEFAULT 'rascunho',
          segmento_alvo TEXT DEFAULT '',
          regional_alvo TEXT DEFAULT '',
          dias_sem_compra_min INTEGER DEFAULT 0,
          dias_sem_compra_max INTEGER DEFAULT 0,
          vendedor_id TEXT DEFAULT '',
          vendedor_nome TEXT DEFAULT '',
          produtos_vinculados TEXT DEFAULT '[]',
          catalogo_tipo TEXT DEFAULT '',
          template_mensagem_a TEXT DEFAULT '',
          template_mensagem_b TEXT DEFAULT '',
          is_ab_test_active INTEGER DEFAULT 0,
          criado_por TEXT DEFAULT '',
          criado_por_id TEXT DEFAULT '',
          criado_em TEXT DEFAULT '',
          aprovado_por TEXT DEFAULT '',
          aprovado_em TEXT DEFAULT '',
          disparado_por TEXT DEFAULT '',
          disparado_em TEXT DEFAULT '',
          publico_total INTEGER DEFAULT 0,
          publico_elegivel INTEGER DEFAULT 0,
          publico_supresso INTEGER DEFAULT 0,
          motivos_supressao TEXT DEFAULT '{}',
          metricas TEXT DEFAULT '{}',
          analise_ia TEXT DEFAULT '{}',
          is_mock INTEGER DEFAULT 0,
          created TEXT NOT NULL DEFAULT (datetime('now')),
          updated TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `).execute()

      // 2. Tabela campaign_dispatch_queue
      db.newQuery(`
        CREATE TABLE IF NOT EXISTS campaign_dispatch_queue (
          id TEXT PRIMARY KEY,
          account_id TEXT DEFAULT '',
          campanha_id TEXT NOT NULL,
          campanha_titulo TEXT NOT NULL,
          cliente_id TEXT NOT NULL,
          cliente_nome TEXT NOT NULL,
          canal TEXT NOT NULL,
          destinatario TEXT NOT NULL,
          mensagem_final TEXT NOT NULL,
          variante TEXT DEFAULT 'A',
          status TEXT DEFAULT 'pendente',
          motivo_supressao TEXT DEFAULT '',
          tentativas INTEGER DEFAULT 0,
          max_tentativas INTEGER DEFAULT 3,
          enviado_em TEXT DEFAULT '',
          respondido_em TEXT DEFAULT '',
          resposta_recebida TEXT DEFAULT '',
          sentimento TEXT DEFAULT '',
          idempotency_key TEXT NOT NULL,
          is_mock INTEGER DEFAULT 0,
          created TEXT NOT NULL DEFAULT (datetime('now')),
          updated TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `).execute()

      // 3. Tabela lgpd_consent_records
      db.newQuery(`
        CREATE TABLE IF NOT EXISTS lgpd_consent_records (
          id TEXT PRIMARY KEY,
          account_id TEXT DEFAULT '',
          cliente_id TEXT NOT NULL,
          cliente_nome TEXT NOT NULL,
          canal TEXT NOT NULL,
          status TEXT NOT NULL,
          motivo TEXT DEFAULT '',
          registrado_por TEXT DEFAULT '',
          registrado_em TEXT DEFAULT '',
          created TEXT NOT NULL DEFAULT (datetime('now')),
          updated TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `).execute()

      // 4. Índices para performance e idempotência
      try {
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_campaigns_code ON commercial_campaigns (codigo)`,
        ).execute()
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_campaigns_status ON commercial_campaigns (status)`,
        ).execute()
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_campaigns_acc ON commercial_campaigns (account_id)`,
        ).execute()

        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_dispatch_campaign ON campaign_dispatch_queue (campanha_id)`,
        ).execute()
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_dispatch_client ON campaign_dispatch_queue (cliente_id)`,
        ).execute()
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_dispatch_status ON campaign_dispatch_queue (status)`,
        ).execute()
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_dispatch_idempotency ON campaign_dispatch_queue (idempotency_key)`,
        ).execute()
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_dispatch_acc ON campaign_dispatch_queue (account_id)`,
        ).execute()

        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_lgpd_client ON lgpd_consent_records (cliente_id)`,
        ).execute()
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_lgpd_canal ON lgpd_consent_records (canal)`,
        ).execute()
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_lgpd_acc ON lgpd_consent_records (account_id)`,
        ).execute()
      } catch (errIdx) {
        console.log('0069_create_campaigns_and_whatsapp: index creation notice:', errIdx)
      }
    } catch (e) {
      console.log('0069_create_campaigns_and_whatsapp migration error:', e)
    }
  },
  (_app) => {
    /* No-op downgrade seguro */
  },
)
