migrate(
  (app) => {
    const accountsCol = app.findCollectionByNameOrId('accounts')

    // 1. customer_scores
    let existsScores = false
    try {
      app.findCollectionByNameOrId('customer_scores')
      existsScores = true
    } catch (_) {
      existsScores = false
    }

    if (!existsScores) {
      const customerScores = new Collection({
        name: 'customer_scores',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'customer_id', type: 'text', required: true, min: 1, max: 100 },
          {
            name: 'seller_id',
            type: 'relation',
            required: false,
            collectionId: '_pb_users_auth_',
            cascadeDelete: false,
            maxSelect: 1,
          },
          {
            name: 'account_id',
            type: 'relation',
            required: false,
            collectionId: accountsCol.id,
            cascadeDelete: true,
            maxSelect: 1,
          },
          { name: 'rfm_recency_score', type: 'number', required: false },
          { name: 'rfm_frequency_score', type: 'number', required: false },
          { name: 'rfm_monetary_score', type: 'number', required: false },
          { name: 'rfm_segment', type: 'text', required: false, max: 100 },
          { name: 'bg_nbd_p_alive', type: 'number', required: false },
          { name: 'bg_nbd_expected_frequency', type: 'number', required: false },
          { name: 'gamma_gamma_expected_value', type: 'number', required: false },
          { name: 'predicted_next_purchase_days', type: 'number', required: false },
          { name: 'reactivation_score', type: 'number', required: false },
          { name: 'model_version', type: 'text', required: false, max: 50 },
          { name: 'calculated_at', type: 'date', required: false },
          { name: 'source', type: 'text', required: false, max: 50 },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_customer_scores_cust_seller ON customer_scores (customer_id, seller_id)',
          'CREATE INDEX idx_customer_scores_account ON customer_scores (account_id)',
        ],
      })
      app.save(customerScores)
    }

    // 2. purchase_recurrence
    let existsRecurrence = false
    try {
      app.findCollectionByNameOrId('purchase_recurrence')
      existsRecurrence = true
    } catch (_) {
      existsRecurrence = false
    }

    if (!existsRecurrence) {
      const purchaseRecurrence = new Collection({
        name: 'purchase_recurrence',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'customer_id', type: 'text', required: true, min: 1, max: 100 },
          { name: 'year_month', type: 'text', required: true, min: 7, max: 7 },
          { name: 'has_purchase', type: 'bool', required: false },
          { name: 'revenue', type: 'number', required: false },
          { name: 'tons', type: 'number', required: false },
          { name: 'product_family', type: 'text', required: false, max: 100 },
          {
            name: 'account_id',
            type: 'relation',
            required: false,
            collectionId: accountsCol.id,
            cascadeDelete: true,
            maxSelect: 1,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_purchase_rec_cust_ym ON purchase_recurrence (customer_id, year_month)',
          'CREATE INDEX idx_purchase_rec_account ON purchase_recurrence (account_id)',
        ],
      })
      app.save(purchaseRecurrence)
    }

    // 3. ai_recommendations
    let existsAiRec = false
    try {
      app.findCollectionByNameOrId('ai_recommendations')
      existsAiRec = true
    } catch (_) {
      existsAiRec = false
    }

    if (!existsAiRec) {
      const aiRecommendations = new Collection({
        name: 'ai_recommendations',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'seller_id',
            type: 'relation',
            required: false,
            collectionId: '_pb_users_auth_',
            cascadeDelete: false,
            maxSelect: 1,
          },
          { name: 'customer_id', type: 'text', required: true, min: 1, max: 100 },
          { name: 'action_type', type: 'text', required: false, max: 100 },
          { name: 'recommendation', type: 'text', required: false, max: 2000 },
          { name: 'rationale', type: 'text', required: false, max: 2000 },
          { name: 'evidence', type: 'json', required: false },
          { name: 'confidence', type: 'number', required: false },
          { name: 'source', type: 'text', required: false, max: 100 },
          { name: 'model_version', type: 'text', required: false, max: 50 },
          { name: 'ai_run_id', type: 'text', required: false, max: 100 },
          { name: 'accepted', type: 'bool', required: false },
          { name: 'executed', type: 'bool', required: false },
          { name: 'result', type: 'text', required: false, max: 1000 },
          {
            name: 'account_id',
            type: 'relation',
            required: false,
            collectionId: accountsCol.id,
            cascadeDelete: true,
            maxSelect: 1,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_ai_rec_seller_cust ON ai_recommendations (seller_id, customer_id)',
          'CREATE INDEX idx_ai_rec_account ON ai_recommendations (account_id)',
        ],
      })
      app.save(aiRecommendations)
    }

    // 4. bi_sync_state
    let existsSync = false
    try {
      app.findCollectionByNameOrId('bi_sync_state')
      existsSync = true
    } catch (_) {
      existsSync = false
    }

    if (!existsSync) {
      const biSyncState = new Collection({
        name: 'bi_sync_state',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'provider', type: 'text', required: true, min: 1, max: 50 },
          { name: 'entity_type', type: 'text', required: false, max: 50 },
          { name: 'last_synced_at', type: 'date', required: false },
          { name: 'source_updated_at', type: 'date', required: false },
          {
            name: 'status',
            type: 'select',
            required: true,
            maxSelect: 1,
            values: ['idle', 'syncing', 'error'],
          },
          { name: 'error_message', type: 'text', required: false, max: 1000 },
          { name: 'records_count', type: 'number', required: false },
          {
            name: 'account_id',
            type: 'relation',
            required: false,
            collectionId: accountsCol.id,
            cascadeDelete: true,
            maxSelect: 1,
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE INDEX idx_bi_sync_provider ON bi_sync_state (provider)'],
      })
      app.save(biSyncState)
    }
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('bi_sync_state'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('ai_recommendations'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('purchase_recurrence'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('customer_scores'))
    } catch (_) {}
  },
)
