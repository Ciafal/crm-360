migrate(
  (app) => {
    try {
      const db = app.dao ? app.dao().db() : app.db ? app.db() : null
      if (!db) return

      // 1. Tabela crm_quotations (garante schema nativo do módulo de cotações)
      db.newQuery(`
        CREATE TABLE IF NOT EXISTS crm_quotations (
          id TEXT PRIMARY KEY,
          account_id TEXT DEFAULT '',
          code TEXT NOT NULL,
          customer_id TEXT DEFAULT '',
          customer_sap_code TEXT NOT NULL,
          customer_name TEXT NOT NULL,
          customer_cnpj TEXT DEFAULT '',
          customer_city TEXT DEFAULT '',
          customer_uf TEXT DEFAULT '',
          customer_archetype TEXT DEFAULT '',
          customer_abc TEXT DEFAULT 'A',
          contact_name TEXT DEFAULT '',
          contact_role TEXT DEFAULT '',
          contact_email TEXT DEFAULT '',
          contact_phone TEXT DEFAULT '',
          ship_to_code TEXT DEFAULT '',
          ship_to_address TEXT DEFAULT '',
          seller_id TEXT NOT NULL,
          seller_name TEXT NOT NULL,
          valid_until TEXT NOT NULL,
          payment_terms TEXT NOT NULL,
          incoterm TEXT DEFAULT 'CIF',
          freight_type TEXT DEFAULT 'CIF',
          freight_value REAL DEFAULT 0,
          sales_org TEXT DEFAULT '1000',
          distribution_channel TEXT DEFAULT '10',
          division TEXT DEFAULT '00',
          items TEXT DEFAULT '[]',
          subtotal REAL DEFAULT 0,
          total_tons REAL DEFAULT 0,
          total_value REAL DEFAULT 0,
          price_status TEXT DEFAULT 'PADRAO_TABELA',
          approval_status TEXT DEFAULT 'NOT_REQUIRED',
          approval_level_required TEXT DEFAULT 'NONE',
          status TEXT DEFAULT 'RASCUNHO',
          notes TEXT DEFAULT '',
          created TEXT NOT NULL DEFAULT (datetime('now')),
          updated TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `).execute()

      // 2. Tabela cross_sell_interactions (Feedback e aprendizado contínuo da IA)
      db.newQuery(`
        CREATE TABLE IF NOT EXISTS cross_sell_interactions (
          id TEXT PRIMARY KEY,
          account_id TEXT DEFAULT '',
          quotation_code TEXT NOT NULL,
          customer_sap_code TEXT NOT NULL,
          material_code TEXT NOT NULL,
          suggestion_type TEXT NOT NULL,
          action TEXT NOT NULL,
          seller_id TEXT DEFAULT '',
          created TEXT NOT NULL DEFAULT (datetime('now')),
          updated TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `).execute()

      // 3. Tabela integration_observability_logs (Rastreamento de performance e latência)
      db.newQuery(`
        CREATE TABLE IF NOT EXISTS integration_observability_logs (
          id TEXT PRIMARY KEY,
          account_id TEXT DEFAULT '',
          request_id TEXT NOT NULL,
          user_id TEXT DEFAULT '',
          quotation_code TEXT DEFAULT '',
          customer_code TEXT DEFAULT '',
          material_code TEXT DEFAULT '',
          integration_name TEXT NOT NULL,
          duration_ms INTEGER DEFAULT 0,
          status TEXT NOT NULL,
          error_message TEXT DEFAULT '',
          created TEXT NOT NULL DEFAULT (datetime('now')),
          updated TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `).execute()

      // 4. Índices para performance e consultas instantâneas
      try {
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_quotations_code ON crm_quotations (code)`,
        ).execute()
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_quotations_customer ON crm_quotations (customer_sap_code)`,
        ).execute()
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_quotations_seller ON crm_quotations (seller_id)`,
        ).execute()
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_quotations_status ON crm_quotations (status)`,
        ).execute()

        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_cross_sell_quote ON cross_sell_interactions (quotation_code)`,
        ).execute()
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_cross_sell_cust ON cross_sell_interactions (customer_sap_code)`,
        ).execute()
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_cross_sell_mat ON cross_sell_interactions (material_code)`,
        ).execute()
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_cross_sell_action ON cross_sell_interactions (action)`,
        ).execute()

        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_obs_log_integ ON integration_observability_logs (integration_name)`,
        ).execute()
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_obs_log_status ON integration_observability_logs (status)`,
        ).execute()
      } catch (errIdx) {
        console.log('0070_create_quotations_and_cross_sell: index notice:', errIdx)
      }
    } catch (e) {
      console.log('0070_create_quotations_and_cross_sell migration error:', e)
    }
  },
  (_app) => {
    /* No-op downgrade seguro */
  },
)
