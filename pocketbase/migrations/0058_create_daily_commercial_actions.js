migrate(
  (app) => {
    const accountsCol = app.findCollectionByNameOrId('accounts')
    let exists = false
    try {
      app.findCollectionByNameOrId('daily_commercial_actions')
      exists = true
    } catch (_) {
      exists = false
    }

    if (!exists) {
      const dailyCommercialActions = new Collection({
        name: 'daily_commercial_actions',
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
            required: true,
            collectionId: '_pb_users_auth_',
            cascadeDelete: true,
            maxSelect: 1,
          },
          { name: 'customer_id', type: 'text', required: true, min: 1, max: 100 },
          { name: 'customer_name', type: 'text', required: false, max: 200 },
          { name: 'opportunity_id', type: 'text', required: false, max: 100 },
          { name: 'date', type: 'date', required: false },
          {
            name: 'action_type',
            type: 'select',
            required: true,
            maxSelect: 1,
            values: [
              'atacar_agora',
              'follow_up',
              'recuperar',
              'resolver_impedimento',
              'nao_priorizar',
            ],
          },
          { name: 'priority', type: 'number', required: false },
          { name: 'recommendation', type: 'text', required: false, max: 2000 },
          { name: 'rationale', type: 'text', required: false, max: 2000 },
          { name: 'source', type: 'text', required: false, max: 100 },
          { name: 'confidence', type: 'number', required: false },
          {
            name: 'status',
            type: 'select',
            required: true,
            maxSelect: 1,
            values: [
              'pendente',
              'em_andamento',
              'concluida',
              'reagendada',
              'nao_realizada',
              'cancelada',
            ],
          },
          { name: 'due_at', type: 'date', required: false },
          { name: 'completed_at', type: 'date', required: false },
          { name: 'completion_channel', type: 'text', required: false, max: 50 },
          { name: 'result', type: 'text', required: false, max: 1000 },
          { name: 'rescheduled_to', type: 'date', required: false },
          { name: 'justification', type: 'text', required: false, max: 2000 },
          { name: 'generated_by', type: 'text', required: false, max: 50 },
          { name: 'ai_run_id', type: 'text', required: false, max: 100 },
          { name: 'potential_revenue', type: 'number', required: false },
          { name: 'potential_tons', type: 'number', required: false },
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
          'CREATE INDEX idx_daily_actions_seller_date_st ON daily_commercial_actions (seller_id, date, status)',
          'CREATE INDEX idx_daily_actions_account ON daily_commercial_actions (account_id)',
        ],
      })
      app.save(dailyCommercialActions)
    }
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('daily_commercial_actions')
      app.delete(col)
    } catch (_) {}
  },
)
