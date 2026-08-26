migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const usersId = usersCol.id
    let accountsId = null
    try {
      accountsId = app.findCollectionByNameOrId('accounts').id
    } catch (_) {}

    // 1. Tabela daily_commercial_plans (Snapshot e Versionamento do Plano Diário)
    const plansFields = [
      {
        name: 'seller_id',
        type: 'relation',
        required: true,
        collectionId: usersId,
        maxSelect: 1,
        cascadeDelete: false,
      },
      { name: 'date', type: 'date', required: true },
      { name: 'version', type: 'number', required: false },
      { name: 'generated_at', type: 'date', required: false },
      { name: 'generated_by', type: 'text', required: false },
      { name: 'source_version', type: 'text', required: false },
      { name: 'score_version', type: 'text', required: false },
      { name: 'ai_model_version', type: 'text', required: false },
      { name: 'rules_version', type: 'text', required: false },
      { name: 'source_updated_at', type: 'date', required: false },
      { name: 'summary', type: 'text', required: false },
      { name: 'strategic_summary', type: 'json', required: false },
      { name: 'actions_snapshot', type: 'json', required: false },
      { name: 'total_actions', type: 'number', required: false },
      { name: 'potential_value', type: 'number', required: false },
      { name: 'potential_tons', type: 'number', required: false },
      {
        name: 'status',
        type: 'select',
        values: ['active', 'superseded', 'draft', 'archived'],
        maxSelect: 1,
        required: false,
      },
      { name: 'superseded_at', type: 'date', required: false },
      {
        name: 'superseded_by',
        type: 'relation',
        collectionId: usersId,
        maxSelect: 1,
        cascadeDelete: false,
        required: false,
      },
    ]

    if (accountsId) {
      plansFields.push({
        name: 'account_id',
        type: 'relation',
        collectionId: accountsId,
        maxSelect: 1,
        cascadeDelete: false,
        required: false,
      })
    }

    plansFields.push(
      { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
      { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
    )

    const plansCol = new Collection({
      name: 'daily_commercial_plans',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: plansFields,
      indexes: [],
    })

    app.save(plansCol)

    // 2. Adicionar manager_note e manager_id a daily_commercial_actions para Cockpit do Supervisor
    try {
      const actionsCol = app.findCollectionByNameOrId('daily_commercial_actions')
      if (!actionsCol.fields.getByName('manager_note')) {
        actionsCol.fields.add(new TextField({ name: 'manager_note' }))
      }
      if (!actionsCol.fields.getByName('manager_note_at')) {
        actionsCol.fields.add(new DateField({ name: 'manager_note_at' }))
      }
      if (!actionsCol.fields.getByName('manager_id')) {
        actionsCol.fields.add(
          new RelationField({
            name: 'manager_id',
            collectionId: usersId,
            maxSelect: 1,
            cascadeDelete: false,
          }),
        )
      }
      if (!actionsCol.fields.getByName('plan_id')) {
        actionsCol.fields.add(
          new RelationField({
            name: 'plan_id',
            collectionId: plansCol.id,
            maxSelect: 1,
            cascadeDelete: false,
          }),
        )
      }
      app.save(actionsCol)
    } catch (e) {
      console.log('Error updating daily_commercial_actions fields: ' + e)
    }
  },
  (app) => {
    try {
      const plansCol = app.findCollectionByNameOrId('daily_commercial_plans')
      app.delete(plansCol)
    } catch (_) {}
  },
)
