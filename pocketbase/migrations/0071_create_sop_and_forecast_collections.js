migrate(
  (app) => {
    try {
      const db = app.db ? app.db() : app.dao ? app.dao().db() : null
      if (!db) return

      db.newQuery(`
        CREATE TABLE IF NOT EXISTS sop_forecast_records (
          id TEXT PRIMARY KEY,
          seller_id TEXT NOT NULL,
          seller_name TEXT,
          customer_id TEXT NOT NULL,
          customer_name TEXT,
          product_id TEXT NOT NULL,
          product_name TEXT,
          product_family TEXT,
          year_month TEXT NOT NULL,
          unit TEXT DEFAULT 't',
          f0_statistical REAL DEFAULT 0,
          f1_ai_enriched REAL DEFAULT 0,
          f2_seller_adjusted REAL DEFAULT 0,
          f3_management_adjusted REAL DEFAULT 0,
          f4_sop_consensual REAL DEFAULT 0,
          r_actual REAL DEFAULT 0,
          target_suggested REAL DEFAULT 0,
          target_proposed REAL DEFAULT 0,
          target_approved REAL DEFAULT 0,
          target_final REAL DEFAULT 0,
          champion_model TEXT DEFAULT 'ENSEMBLE_PROPHET_ARIMA',
          challenger_model TEXT DEFAULT 'HOLT_WINTERS_DAMPED',
          model_confidence TEXT DEFAULT 'ALTA',
          historical_months_analyzed INTEGER DEFAULT 36,
          f2_justification TEXT,
          f2_adjusted_by TEXT,
          f2_adjusted_at TEXT,
          f3_justification TEXT,
          f3_previous_value REAL DEFAULT 0,
          f3_adjusted_by TEXT,
          f3_adjusted_at TEXT,
          f3_impact_summary TEXT,
          fva_ai REAL DEFAULT 0,
          fva_seller REAL DEFAULT 0,
          fva_management REAL DEFAULT 0,
          fva_consensual REAL DEFAULT 0,
          bias_type TEXT DEFAULT 'NEUTRAL',
          accuracy_score REAL DEFAULT 0,
          status TEXT DEFAULT 'PUBLICADO',
          revision_code TEXT DEFAULT 'V0',
          source_system TEXT DEFAULT 'QLIK_SAP_COMBO',
          qlik_timestamp TEXT,
          created TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ', 'now')),
          updated TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ', 'now'))
        );
      `).execute()

      db.newQuery(`
        CREATE TABLE IF NOT EXISTS sop_executive_plans (
          id TEXT PRIMARY KEY,
          cycle_year_month TEXT NOT NULL,
          status TEXT DEFAULT 'ATIVO',
          target_total_tons REAL DEFAULT 0,
          target_total_brl REAL DEFAULT 0,
          forecast_total_tons REAL DEFAULT 0,
          forecast_total_brl REAL DEFAULT 0,
          sap_backlog_tons REAL DEFAULT 0,
          sap_backlog_brl REAL DEFAULT 0,
          unconverted_forecast_tons REAL DEFAULT 0,
          sop_total_demand_tons REAL DEFAULT 0,
          wms_stock_tons REAL DEFAULT 0,
          scheduled_production_tons REAL DEFAULT 0,
          net_production_requirement_tons REAL DEFAULT 0,
          pcp_capacity_tons REAL DEFAULT 0,
          industrial_gap_tons REAL DEFAULT 0,
          industrial_status TEXT DEFAULT 'ATENDIDO',
          expedition_capacity_tons REAL DEFAULT 0,
          tms_programmed_tons REAL DEFAULT 0,
          logistics_gap_tons REAL DEFAULT 0,
          revenue_forecast_brl REAL DEFAULT 0,
          actual_billed_brl REAL DEFAULT 0,
          actual_billed_tons REAL DEFAULT 0,
          gap_causes_json TEXT DEFAULT '{}',
          waterfall_steps_json TEXT DEFAULT '[]',
          idle_capacity_opportunities_json TEXT DEFAULT '[]',
          created_by TEXT,
          approved_by TEXT,
          published_at TEXT,
          created TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ', 'now')),
          updated TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ', 'now'))
        );
      `).execute()

      db.newQuery(`
        CREATE TABLE IF NOT EXISTS sop_meetings (
          id TEXT PRIMARY KEY,
          cycle_year_month TEXT NOT NULL,
          title TEXT NOT NULL,
          meeting_date TEXT,
          location_type TEXT DEFAULT 'HIBRIDO',
          status TEXT DEFAULT 'AGENDADA',
          participants_json TEXT DEFAULT '[]',
          agenda_topics_json TEXT DEFAULT '[]',
          ai_briefing_summary TEXT,
          ai_briefing_changes TEXT,
          ai_briefing_bias_insights TEXT,
          ai_briefing_risks TEXT,
          ai_briefing_opportunities TEXT,
          ai_briefing_recommendations TEXT,
          meeting_minutes_ata TEXT,
          decisions_json TEXT DEFAULT '[]',
          action_items_json TEXT DEFAULT '[]',
          transcription_snippet TEXT,
          recording_url TEXT,
          created_by TEXT,
          created TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ', 'now')),
          updated TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ', 'now'))
        );
      `).execute()

      db.newQuery(`
        CREATE TABLE IF NOT EXISTS sop_scenario_simulations (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          scenario_type TEXT DEFAULT 'CUSTOM',
          cycle_year_month TEXT NOT NULL,
          description TEXT,
          parameters_json TEXT DEFAULT '{}',
          delta_tons REAL DEFAULT 0,
          delta_revenue_brl REAL DEFAULT 0,
          industrial_impact TEXT,
          logistics_impact TEXT,
          author_id TEXT,
          author_name TEXT,
          is_favorite INTEGER DEFAULT 0,
          created TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ', 'now')),
          updated TEXT DEFAULT (strftime('%Y-%m-%d %H:%M:%fZ', 'now'))
        );
      `).execute()
    } catch (e) {
      console.log('0071_create_sop_and_forecast_collections error:', e)
    }
  },
  (_app) => {},
)
