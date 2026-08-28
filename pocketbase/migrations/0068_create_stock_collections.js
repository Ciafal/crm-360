migrate(
  (app) => {
    try {
      const db = app.dao ? app.dao().db() : app.db ? app.db() : null
      if (!db) return

      // 1. Tabela stock_items
      db.newQuery(`
        CREATE TABLE IF NOT EXISTS stock_items (
          id TEXT PRIMARY KEY,
          account_id TEXT DEFAULT '',
          material_code TEXT NOT NULL,
          description TEXT NOT NULL,
          family TEXT NOT NULL,
          group_code TEXT DEFAULT '',
          line TEXT DEFAULT '',
          bitola TEXT DEFAULT '',
          quality TEXT DEFAULT '',
          plant_code TEXT NOT NULL,
          plant_name TEXT DEFAULT '',
          storage_location TEXT DEFAULT '',
          storage_location_name TEXT DEFAULT '',
          batch_number TEXT DEFAULT '',
          unit TEXT DEFAULT 't',
          physical_tons REAL DEFAULT 0,
          committed_tons REAL DEFAULT 0,
          available_tons REAL DEFAULT 0,
          blocked_tons REAL DEFAULT 0,
          inspection_tons REAL DEFAULT 0,
          in_check_tons REAL DEFAULT 0,
          projected_pcp_tons REAL DEFAULT 0,
          cost_price_per_ton REAL DEFAULT 0,
          estimated_total_value REAL DEFAULT 0,
          min_stock_tons REAL DEFAULT 0,
          max_stock_tons REAL DEFAULT 0,
          critical_stock_tons REAL DEFAULT 0,
          strategic_safety_tons REAL DEFAULT 0,
          entry_date TEXT DEFAULT '',
          age_days INTEGER DEFAULT 0,
          age_bracket TEXT DEFAULT '0-30',
          last_movement_date TEXT DEFAULT '',
          days_without_movement INTEGER DEFAULT 0,
          last_sale_date TEXT DEFAULT '',
          last_customer_sap TEXT DEFAULT '',
          last_customer_name TEXT DEFAULT '',
          last_seller_id TEXT DEFAULT '',
          last_seller_name TEXT DEFAULT '',
          historic_avg_price_kg REAL DEFAULT 0,
          historic_turnover_rate REAL DEFAULT 0,
          classification TEXT DEFAULT 'NORMAL',
          allowed_seller_ids TEXT DEFAULT '[]',
          allowed_regions TEXT DEFAULT '[]',
          assigned_seller_id TEXT DEFAULT '',
          assigned_seller_name TEXT DEFAULT '',
          sap_sync_status TEXT DEFAULT 'SINCRONIZADO',
          sap_last_sync TEXT DEFAULT '',
          wms_sync_status TEXT DEFAULT 'ONLINE',
          tms_complement_available INTEGER DEFAULT 0,
          tms_region_dest TEXT DEFAULT '',
          tms_next_loading_window TEXT DEFAULT '',
          tms_planned_trip_code TEXT DEFAULT '',
          pcp_next_production_date TEXT DEFAULT '',
          pcp_line TEXT DEFAULT '',
          pcp_confidence_level TEXT DEFAULT 'MEDIO',
          pcp_status TEXT DEFAULT 'PREVISTO',
          raw_sap_data TEXT DEFAULT '{}',
          created TEXT NOT NULL DEFAULT (datetime('now')),
          updated TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `).execute()

      // 2. Tabela stock_check_requests
      db.newQuery(`
        CREATE TABLE IF NOT EXISTS stock_check_requests (
          id TEXT PRIMARY KEY,
          account_id TEXT DEFAULT '',
          protocol TEXT NOT NULL,
          material_code TEXT NOT NULL,
          material_description TEXT DEFAULT '',
          plant_code TEXT NOT NULL,
          plant_name TEXT DEFAULT '',
          storage_location TEXT DEFAULT '',
          batch_number TEXT DEFAULT '',
          systemic_balance_tons REAL DEFAULT 0,
          requested_tons REAL DEFAULT 0,
          confirmed_physical_tons REAL DEFAULT 0,
          divergence_tons REAL DEFAULT 0,
          divergence_found INTEGER DEFAULT 0,
          divergence_reason TEXT DEFAULT '',
          occurrence_number TEXT DEFAULT '',
          status TEXT DEFAULT 'SOLICITADA',
          priority TEXT DEFAULT 'NORMAL',
          quotation_id TEXT DEFAULT '',
          quotation_code TEXT DEFAULT '',
          customer_id TEXT DEFAULT '',
          customer_name TEXT DEFAULT '',
          requester_id TEXT DEFAULT '',
          requester_name TEXT DEFAULT '',
          requester_role TEXT DEFAULT '',
          requester_notes TEXT DEFAULT '',
          wms_request_id TEXT DEFAULT '',
          wms_integration_status TEXT DEFAULT 'ENVIADO',
          inspector_name TEXT DEFAULT '',
          inspected_datetime TEXT DEFAULT '',
          inspector_notes TEXT DEFAULT '',
          sla_deadline TEXT DEFAULT '',
          closed_at TEXT DEFAULT '',
          history_log TEXT DEFAULT '[]',
          created TEXT NOT NULL DEFAULT (datetime('now')),
          updated TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `).execute()

      // 3. Tabela stock_governance_params
      db.newQuery(`
        CREATE TABLE IF NOT EXISTS stock_governance_params (
          id TEXT PRIMARY KEY,
          account_id TEXT DEFAULT '',
          param_key TEXT NOT NULL,
          param_label TEXT NOT NULL,
          category TEXT NOT NULL,
          param_value TEXT DEFAULT '{}',
          description TEXT DEFAULT '',
          last_modified_by TEXT DEFAULT '',
          created TEXT NOT NULL DEFAULT (datetime('now')),
          updated TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `).execute()

      // 4. Tabela stock_audit_logs
      db.newQuery(`
        CREATE TABLE IF NOT EXISTS stock_audit_logs (
          id TEXT PRIMARY KEY,
          account_id TEXT DEFAULT '',
          user_id TEXT NOT NULL,
          user_name TEXT DEFAULT '',
          user_role TEXT DEFAULT '',
          action_type TEXT NOT NULL,
          target_object TEXT NOT NULL,
          target_id TEXT DEFAULT '',
          details TEXT DEFAULT '',
          filters_applied TEXT DEFAULT '{}',
          export_format TEXT DEFAULT '',
          previous_value TEXT DEFAULT '',
          new_value TEXT DEFAULT '',
          ip_session TEXT DEFAULT '',
          created TEXT NOT NULL DEFAULT (datetime('now')),
          updated TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `).execute()

      // 5. Índices de busca e performance para o módulo Estoque
      try {
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_stock_items_mat ON stock_items (material_code)`,
        ).execute()
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_stock_items_plant ON stock_items (plant_code)`,
        ).execute()
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_stock_items_class ON stock_items (classification)`,
        ).execute()
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_stock_items_age ON stock_items (age_bracket)`,
        ).execute()
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_stock_items_acc ON stock_items (account_id)`,
        ).execute()

        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_stock_checks_proto ON stock_check_requests (protocol)`,
        ).execute()
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_stock_checks_mat ON stock_check_requests (material_code)`,
        ).execute()
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_stock_checks_status ON stock_check_requests (status)`,
        ).execute()
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_stock_checks_cust ON stock_check_requests (customer_id)`,
        ).execute()
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_stock_checks_req ON stock_check_requests (requester_id)`,
        ).execute()
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_stock_checks_acc ON stock_check_requests (account_id)`,
        ).execute()

        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_stock_params_key ON stock_governance_params (param_key)`,
        ).execute()
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_stock_params_acc ON stock_governance_params (account_id)`,
        ).execute()

        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_stock_audit_user ON stock_audit_logs (user_id)`,
        ).execute()
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_stock_audit_action ON stock_audit_logs (action_type)`,
        ).execute()
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_stock_audit_target ON stock_audit_logs (target_object, target_id)`,
        ).execute()
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_stock_audit_acc ON stock_audit_logs (account_id)`,
        ).execute()
      } catch (errIdx) {
        console.log('0068_create_stock_collections: index creation notice:', errIdx)
      }
    } catch (e) {
      console.log('0068_create_stock_collections migration error:', e)
    }
  },
  (_app) => {
    /* No-op downgrade seguro */
  },
)
