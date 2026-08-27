migrate(
  (app) => {
    try {
      const db = app.dao ? app.dao().db() : app.db ? app.db() : null
      if (!db) return

      // Criar tabela de geolocalização dos clientes com cache e auditoria de override manual
      db.newQuery(`
        CREATE TABLE IF NOT EXISTS customer_geo_locations (
          id TEXT PRIMARY KEY,
          account_id TEXT DEFAULT '',
          customer_id TEXT NOT NULL,
          sap_customer_code TEXT NOT NULL,
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          geocoding_source TEXT DEFAULT 'OpenStreetMap Nominatim',
          accuracy_level TEXT DEFAULT 'CITY',
          formatted_address TEXT DEFAULT '',
          geocoded_at TEXT NOT NULL DEFAULT (datetime('now')),
          last_validated_at TEXT NOT NULL DEFAULT (datetime('now')),
          status TEXT DEFAULT 'GEOCODED',
          is_manual_override INTEGER DEFAULT 0,
          manual_override_reason TEXT DEFAULT '',
          manual_override_by TEXT DEFAULT '',
          manual_override_at TEXT DEFAULT '',
          created TEXT NOT NULL DEFAULT (datetime('now')),
          updated TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `).execute()

      // Tabela de log de auditoria para ajustes manuais no mapa
      db.newQuery(`
        CREATE TABLE IF NOT EXISTS geo_location_override_logs (
          id TEXT PRIMARY KEY,
          customer_id TEXT NOT NULL,
          previous_lat REAL NOT NULL,
          previous_lng REAL NOT NULL,
          new_lat REAL NOT NULL,
          new_lng REAL NOT NULL,
          reason TEXT NOT NULL,
          user_id TEXT NOT NULL,
          user_name TEXT DEFAULT '',
          created TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `).execute()

      // Criar índices de performance para busca geográfica
      try {
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_cust_geo_custid ON customer_geo_locations (customer_id)`,
        ).execute()
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_cust_geo_sap ON customer_geo_locations (sap_customer_code)`,
        ).execute()
      } catch (_) {}
    } catch (e) {
      console.log('0067_create_customer_geo_locations migration error:', e)
    }
  },
  (app) => {
    /* No-op downgrade seguro */
  },
)
