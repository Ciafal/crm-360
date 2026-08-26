migrate(
  (app) => {
    const accountsCol = app.findCollectionByNameOrId('accounts')
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const teamsCol = app.findCollectionByNameOrId('teams')

    // 1. user_hierarchy
    // id, user_id, manager_id, team_id, hierarchy_level, valid_from, valid_to, created, updated
    let existsHierarchy = false
    try {
      app.findCollectionByNameOrId('user_hierarchy')
      existsHierarchy = true
    } catch (_) {
      existsHierarchy = false
    }

    if (!existsHierarchy) {
      const userHierarchy = new Collection({
        name: 'user_hierarchy',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'user_id',
            type: 'relation',
            required: true,
            collectionId: usersCol.id,
            cascadeDelete: true,
            maxSelect: 1,
          },
          {
            name: 'manager_id',
            type: 'relation',
            required: false,
            collectionId: usersCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          {
            name: 'team_id',
            type: 'relation',
            required: false,
            collectionId: teamsCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          { name: 'hierarchy_level', type: 'number', required: false },
          { name: 'valid_from', type: 'date', required: false },
          { name: 'valid_to', type: 'date', required: false },
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
          'CREATE INDEX idx_user_hier_user ON user_hierarchy (user_id)',
          'CREATE INDEX idx_user_hier_manager ON user_hierarchy (manager_id)',
          'CREATE INDEX idx_user_hier_account ON user_hierarchy (account_id)',
        ],
      })
      app.save(userHierarchy)
    }

    // 2. reactivation_runs
    // id, run_date, model_version, total_candidates, priority_candidates, actions_generated, parameters_json, status, created, updated
    let existsRuns = false
    try {
      app.findCollectionByNameOrId('reactivation_runs')
      existsRuns = true
    } catch (_) {
      existsRuns = false
    }

    if (!existsRuns) {
      const reactivationRuns = new Collection({
        name: 'reactivation_runs',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'run_date', type: 'date', required: false },
          { name: 'model_version', type: 'text', required: false, max: 100 },
          { name: 'total_candidates', type: 'number', required: false },
          { name: 'priority_candidates', type: 'number', required: false },
          { name: 'actions_generated', type: 'number', required: false },
          { name: 'parameters_json', type: 'json', required: false },
          {
            name: 'status',
            type: 'select',
            required: false,
            maxSelect: 1,
            values: ['pending', 'processing', 'completed', 'failed'],
          },
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
        indexes: ['CREATE INDEX idx_react_runs_account ON reactivation_runs (account_id)'],
      })
      app.save(reactivationRuns)
    }

    // 3. reactivation_candidates
    // id, customer_id, seller_id, days_inactive, last_purchase_date, historical_revenue, historical_tons, recurrence_frequency_days, p_alive, rfm_score, rfm_segment, bg_nbd_expected_frequency, gamma_gamma_expected_value, stock_compatible (bool), credit_available (bool), priority_score, recommended_action, recommended_channel, contact_window_start, contact_window_end, status, created, updated
    let existsCandidates = false
    try {
      app.findCollectionByNameOrId('reactivation_candidates')
      existsCandidates = true
    } catch (_) {
      existsCandidates = false
    }

    if (!existsCandidates) {
      const reactivationCandidates = new Collection({
        name: 'reactivation_candidates',
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
            collectionId: usersCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          { name: 'customer_name', type: 'text', required: false, max: 200 },
          { name: 'days_inactive', type: 'number', required: false },
          { name: 'last_purchase_date', type: 'date', required: false },
          { name: 'historical_revenue', type: 'number', required: false },
          { name: 'historical_tons', type: 'number', required: false },
          { name: 'recurrence_frequency_days', type: 'number', required: false },
          { name: 'p_alive', type: 'number', required: false },
          { name: 'rfm_score', type: 'number', required: false },
          { name: 'rfm_segment', type: 'text', required: false, max: 100 },
          { name: 'bg_nbd_expected_frequency', type: 'number', required: false },
          { name: 'gamma_gamma_expected_value', type: 'number', required: false },
          { name: 'stock_compatible', type: 'bool', required: false },
          { name: 'credit_available', type: 'bool', required: false },
          { name: 'priority_score', type: 'number', required: false },
          { name: 'recommended_action', type: 'text', required: false, max: 2000 },
          { name: 'recommended_channel', type: 'text', required: false, max: 50 },
          { name: 'contact_window_start', type: 'date', required: false },
          { name: 'contact_window_end', type: 'date', required: false },
          {
            name: 'status',
            type: 'select',
            required: false,
            maxSelect: 1,
            values: ['elegivel', 'em_contato', 'recuperado', 'descartado', 'pendente'],
          },
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
          'CREATE INDEX idx_react_cand_seller_cust ON reactivation_candidates (seller_id, customer_id)',
          'CREATE INDEX idx_react_cand_account ON reactivation_candidates (account_id)',
        ],
      })
      app.save(reactivationCandidates)
    }

    // 4. rfm_scores
    // id, customer_id, recency_value, recency_score (1-5), frequency_value, frequency_score (1-5), monetary_value, monetary_score (1-5), rfm_segment, calculated_at
    let existsRfm = false
    try {
      app.findCollectionByNameOrId('rfm_scores')
      existsRfm = true
    } catch (_) {
      existsRfm = false
    }

    if (!existsRfm) {
      const rfmScores = new Collection({
        name: 'rfm_scores',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'customer_id', type: 'text', required: true, min: 1, max: 100 },
          { name: 'recency_value', type: 'number', required: false },
          { name: 'recency_score', type: 'number', required: false },
          { name: 'frequency_value', type: 'number', required: false },
          { name: 'frequency_score', type: 'number', required: false },
          { name: 'monetary_value', type: 'number', required: false },
          { name: 'monetary_score', type: 'number', required: false },
          { name: 'rfm_segment', type: 'text', required: false, max: 100 },
          { name: 'calculated_at', type: 'date', required: false },
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
          'CREATE INDEX idx_rfm_scores_cust ON rfm_scores (customer_id)',
          'CREATE INDEX idx_rfm_scores_account ON rfm_scores (account_id)',
        ],
      })
      app.save(rfmScores)
    }

    // 5. customer_predictions
    // id, customer_id, model_type (bg_nbd/gamma_gamma), p_alive, expected_frequency, expected_value, model_version, calculated_at
    let existsPred = false
    try {
      app.findCollectionByNameOrId('customer_predictions')
      existsPred = true
    } catch (_) {
      existsPred = false
    }

    if (!existsPred) {
      const customerPredictions = new Collection({
        name: 'customer_predictions',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'customer_id', type: 'text', required: true, min: 1, max: 100 },
          {
            name: 'model_type',
            type: 'select',
            required: false,
            maxSelect: 1,
            values: ['bg_nbd', 'gamma_gamma', 'hybrid'],
          },
          { name: 'p_alive', type: 'number', required: false },
          { name: 'expected_frequency', type: 'number', required: false },
          { name: 'expected_value', type: 'number', required: false },
          { name: 'model_version', type: 'text', required: false, max: 100 },
          { name: 'calculated_at', type: 'date', required: false },
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
          'CREATE INDEX idx_cust_pred_cust ON customer_predictions (customer_id)',
          'CREATE INDEX idx_cust_pred_account ON customer_predictions (account_id)',
        ],
      })
      app.save(customerPredictions)
    }

    // 6. action_execution_events
    // id, daily_action_id, event_type (whatsapp_sent/call_made/quote_created/order_created/manual_completion), external_id, occurred_at, source_system, metadata_json, created, updated
    const dailyActionsCol = app.findCollectionByNameOrId('daily_commercial_actions')
    let existsEvents = false
    try {
      app.findCollectionByNameOrId('action_execution_events')
      existsEvents = true
    } catch (_) {
      existsEvents = false
    }

    if (!existsEvents) {
      const actionExecutionEvents = new Collection({
        name: 'action_execution_events',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'daily_action_id',
            type: 'relation',
            required: false,
            collectionId: dailyActionsCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          {
            name: 'event_type',
            type: 'select',
            required: true,
            maxSelect: 1,
            values: [
              'whatsapp_sent',
              'call_made',
              'quote_created',
              'order_created',
              'manual_completion',
            ],
          },
          { name: 'external_id', type: 'text', required: false, max: 200 },
          { name: 'occurred_at', type: 'date', required: false },
          { name: 'source_system', type: 'text', required: false, max: 100 },
          { name: 'metadata_json', type: 'json', required: false },
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
          'CREATE INDEX idx_action_events_action ON action_execution_events (daily_action_id)',
          'CREATE INDEX idx_action_events_ext ON action_execution_events (external_id)',
          'CREATE INDEX idx_action_events_account ON action_execution_events (account_id)',
        ],
      })
      app.save(actionExecutionEvents)
    }

    // 7. interactions
    // id, customer_id, contact_id, seller_id, opportunity_id, channel (whatsapp/phone/visit/email/sap_quote/sap_order/sap_billing/task/follow_up/annotation), direction (inbound/outbound/internal), occurred_at, source, external_id, raw_content_reference, transcription, summary, detected_intent, sentiment, product_mentions, quantity_mentions, competitor, competitor_price, objections, next_action, ai_confidence, created_by_system (bool), audit_metadata_json, created, updated
    let existsInteractions = false
    try {
      app.findCollectionByNameOrId('interactions')
      existsInteractions = true
    } catch (_) {
      existsInteractions = false
    }

    if (!existsInteractions) {
      const interactions = new Collection({
        name: 'interactions',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'customer_id', type: 'text', required: true, min: 1, max: 100 },
          { name: 'contact_id', type: 'text', required: false, max: 100 },
          {
            name: 'seller_id',
            type: 'relation',
            required: false,
            collectionId: usersCol.id,
            cascadeDelete: false,
            maxSelect: 1,
          },
          { name: 'opportunity_id', type: 'text', required: false, max: 100 },
          {
            name: 'channel',
            type: 'select',
            required: true,
            maxSelect: 1,
            values: [
              'whatsapp',
              'phone',
              'visit',
              'email',
              'sap_quote',
              'sap_order',
              'sap_billing',
              'task',
              'follow_up',
              'annotation',
            ],
          },
          {
            name: 'direction',
            type: 'select',
            required: false,
            maxSelect: 1,
            values: ['inbound', 'outbound', 'internal'],
          },
          { name: 'occurred_at', type: 'date', required: false },
          { name: 'source', type: 'text', required: false, max: 100 },
          { name: 'external_id', type: 'text', required: false, max: 200 },
          { name: 'raw_content_reference', type: 'text', required: false, max: 500 },
          { name: 'transcription', type: 'text', required: false, max: 5000 },
          { name: 'summary', type: 'text', required: false, max: 2000 },
          { name: 'detected_intent', type: 'text', required: false, max: 200 },
          { name: 'sentiment', type: 'text', required: false, max: 100 },
          { name: 'product_mentions', type: 'text', required: false, max: 500 },
          { name: 'quantity_mentions', type: 'text', required: false, max: 500 },
          { name: 'competitor', type: 'text', required: false, max: 200 },
          { name: 'competitor_price', type: 'text', required: false, max: 200 },
          { name: 'objections', type: 'text', required: false, max: 500 },
          { name: 'next_action', type: 'text', required: false, max: 500 },
          { name: 'ai_confidence', type: 'number', required: false },
          { name: 'created_by_system', type: 'bool', required: false },
          { name: 'audit_metadata_json', type: 'json', required: false },
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
          'CREATE INDEX idx_interactions_cust ON interactions (customer_id)',
          'CREATE INDEX idx_interactions_seller ON interactions (seller_id)',
          'CREATE INDEX idx_interactions_channel ON interactions (channel)',
          'CREATE INDEX idx_interactions_ext ON interactions (external_id)',
          'CREATE INDEX idx_interactions_account ON interactions (account_id)',
        ],
      })
      app.save(interactions)
    }
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('interactions'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('action_execution_events'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('customer_predictions'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('rfm_scores'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('reactivation_candidates'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('reactivation_runs'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('user_hierarchy'))
    } catch (_) {}
  },
)
