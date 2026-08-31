// pocketbase/migrations/0075_create_consultas_module.js
migrate(
  (app) => {
    try {
      const db = app.dao ? app.dao().db() : app.db ? app.db() : null
      if (!db) return

      // 1. Tabela crm_consultas_audit_logs: Trilha de auditoria LGPD/Compliance para consultas, downloads e envios
      db.newQuery(`
        CREATE TABLE IF NOT EXISTS crm_consultas_audit_logs (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          user_name TEXT NOT NULL,
          user_role TEXT NOT NULL,
          customer_id TEXT NOT NULL,
          customer_sap_code TEXT NOT NULL,
          customer_name TEXT NOT NULL,
          action_type TEXT NOT NULL, /* 'SEARCH', 'VIEW_NF', 'VIEW_BOLETO', 'VIEW_CERTIFICADO', 'DOWNLOAD_PDF', 'DOWNLOAD_XML', 'DISPATCH_EMAIL', 'DISPATCH_WHATSAPP', 'COPY_SECURE_LINK', 'REQUEST_FINANCIAL_DUPLICATE' */
          document_type TEXT NOT NULL, /* 'NF', 'BOLETO', 'CERTIFICADO', 'TMS', 'MULTI_PACKAGE' */
          document_number TEXT NOT NULL,
          channel TEXT DEFAULT '',
          recipient TEXT DEFAULT '',
          ip_address TEXT DEFAULT '',
          user_agent TEXT DEFAULT '',
          metadata_json TEXT DEFAULT '{}',
          status_result TEXT NOT NULL DEFAULT 'SUCCESS', /* 'SUCCESS', 'DENIED_RBAC', 'ERROR' */
          created TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `).execute()

      // 2. Tabela crm_financial_duplicate_requests: Solicitações de 2ª via enviadas ao Financeiro (SAP FI / Bancário)
      db.newQuery(`
        CREATE TABLE IF NOT EXISTS crm_financial_duplicate_requests (
          id TEXT PRIMARY KEY,
          protocol TEXT UNIQUE NOT NULL,
          customer_id TEXT NOT NULL,
          customer_sap_code TEXT NOT NULL,
          customer_name TEXT NOT NULL,
          customer_cnpj TEXT NOT NULL,
          boleto_number TEXT NOT NULL,
          invoice_number TEXT NOT NULL,
          original_due_date TEXT NOT NULL,
          original_amount REAL NOT NULL,
          requested_new_due_date TEXT DEFAULT '',
          request_reason TEXT NOT NULL,
          seller_id TEXT NOT NULL,
          seller_name TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'PENDENTE', /* 'PENDENTE', 'EM_ANALISE_FINANCEIRO', 'APROVADO_ATUALIZADO', 'RECUSADO', 'CONCLUIDO' */
          financial_analyst TEXT DEFAULT '',
          sla_hours INTEGER DEFAULT 4,
          deadline TEXT NOT NULL DEFAULT (datetime('now', '+4 hours')),
          updated_boleto_number TEXT DEFAULT '',
          updated_barcode TEXT DEFAULT '',
          updated_amount REAL DEFAULT 0,
          updated_due_date TEXT DEFAULT '',
          financial_notes TEXT DEFAULT '',
          created TEXT NOT NULL DEFAULT (datetime('now')),
          updated TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `).execute()

      // 3. Tabela crm_secure_document_links: Links seguros e temporários para acesso externo auditado
      db.newQuery(`
        CREATE TABLE IF NOT EXISTS crm_secure_document_links (
          id TEXT PRIMARY KEY,
          token TEXT UNIQUE NOT NULL,
          document_type TEXT NOT NULL,
          document_id TEXT NOT NULL,
          customer_id TEXT NOT NULL,
          created_by_user_id TEXT NOT NULL,
          expires_at TEXT NOT NULL,
          revoked INTEGER DEFAULT 0,
          access_count INTEGER DEFAULT 0,
          max_accesses INTEGER DEFAULT 10,
          last_accessed_at TEXT DEFAULT '',
          created TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `).execute()

      // Índices para performance e integridade
      try {
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_cons_audit_user ON crm_consultas_audit_logs (user_id)`,
        ).execute()
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_cons_audit_cust ON crm_consultas_audit_logs (customer_id)`,
        ).execute()
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_cons_audit_action ON crm_consultas_audit_logs (action_type)`,
        ).execute()
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_cons_audit_created ON crm_consultas_audit_logs (created DESC)`,
        ).execute()

        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_fin_req_proto ON crm_financial_duplicate_requests (protocol)`,
        ).execute()
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_fin_req_cust ON crm_financial_duplicate_requests (customer_id)`,
        ).execute()
        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_fin_req_status ON crm_financial_duplicate_requests (status)`,
        ).execute()

        db.newQuery(
          `CREATE INDEX IF NOT EXISTS idx_sec_link_token ON crm_secure_document_links (token)`,
        ).execute()
      } catch (errIdx) {
        console.log('0075_create_consultas_module index notice:', errIdx)
      }
    } catch (e) {
      console.log('0075_create_consultas_module migration error:', e)
    }
  },
  (_app) => {
    /* No-op rollback seguro */
  },
)
