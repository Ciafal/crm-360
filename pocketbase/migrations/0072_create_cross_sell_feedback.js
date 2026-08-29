migrate(
  (app) => {
    try {
      const db = app.dao ? app.dao().db() : app.db ? app.db() : null
      if (!db) return

      // Tabela cross_sell_feedback
      db.newQuery(`
        CREATE TABLE IF NOT EXISTS cross_sell_feedback (
          id TEXT PRIMARY KEY,
          account_id TEXT DEFAULT '',
          quotation_code TEXT NOT NULL,
          customer_sap_code TEXT NOT NULL,
          customer_name TEXT DEFAULT '',
          material_code TEXT NOT NULL,
          material_description TEXT DEFAULT '',
          material_family TEXT DEFAULT '',
          suggestion_type TEXT NOT NULL,
          action TEXT NOT NULL,
          seller_id TEXT DEFAULT '',
          seller_name TEXT DEFAULT '',
          value_brl REAL DEFAULT 0,
          tons REAL DEFAULT 0,
          score_ia INTEGER DEFAULT 0,
          motivo_ia TEXT DEFAULT '',
          created TEXT NOT NULL DEFAULT (datetime('now')),
          updated TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `).execute()

      // Tabela stock_check_logs
      db.newQuery(`
        CREATE TABLE IF NOT EXISTS stock_check_logs (
          id TEXT PRIMARY KEY,
          account_id TEXT DEFAULT '',
          protocol TEXT NOT NULL,
          quotation_code TEXT DEFAULT '',
          customer_sap_code TEXT DEFAULT '',
          customer_name TEXT DEFAULT '',
          material_code TEXT NOT NULL,
          material_description TEXT DEFAULT '',
          requested_qty_tons REAL DEFAULT 0,
          systemic_stock_tons REAL DEFAULT 0,
          status TEXT DEFAULT 'SOLICITADA',
          assigned_area TEXT DEFAULT 'PCP / Pátio Betim',
          requester_user TEXT DEFAULT '',
          response_notes TEXT DEFAULT '',
          confirmed_tons REAL DEFAULT 0,
          created TEXT NOT NULL DEFAULT (datetime('now')),
          updated TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `).execute()

      try {
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_cs_fb_quote ON cross_sell_feedback (quotation_code)`,
        ).execute()
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_cs_fb_cust ON cross_sell_feedback (customer_sap_code)`,
        ).execute()
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_cs_fb_seller ON cross_sell_feedback (seller_id)`,
        ).execute()
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_cs_fb_action ON cross_sell_feedback (action)`,
        ).execute()
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_cs_fb_family ON cross_sell_feedback (material_family)`,
        ).execute()

        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_stk_chk_proto ON stock_check_logs (protocol)`,
        ).execute()
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_stk_chk_mat ON stock_check_logs (material_code)`,
        ).execute()
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_stk_chk_status ON stock_check_logs (status)`,
        ).execute()
      } catch (errIdx) {
        console.log('0072_create_cross_sell_feedback index notice:', errIdx)
      }
    } catch (e) {
      console.log('0072_create_cross_sell_feedback migration error:', e)
    }
  },
  (_app) => {
    /* No-op downgrade seguro */
  },
)
