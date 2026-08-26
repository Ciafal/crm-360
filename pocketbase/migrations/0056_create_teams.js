migrate(
  (app) => {
    const accountsCol = app.findCollectionByNameOrId('accounts')
    let exists = false
    try {
      app.findCollectionByNameOrId('teams')
      exists = true
    } catch (_) {
      exists = false
    }

    if (!exists) {
      const teams = new Collection({
        name: 'teams',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'name', type: 'text', required: true, min: 1, max: 100 },
          {
            name: 'account_id',
            type: 'relation',
            required: false,
            collectionId: accountsCol.id,
            cascadeDelete: true,
            maxSelect: 1,
          },
          {
            name: 'manager_id',
            type: 'relation',
            required: false,
            collectionId: '_pb_users_auth_',
            cascadeDelete: false,
            maxSelect: 1,
          },
          { name: 'parent_team_id', type: 'text', required: false, max: 100 },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE INDEX idx_teams_account ON teams (account_id)'],
      })
      app.save(teams)
    }
  },
  (app) => {
    try {
      const teams = app.findCollectionByNameOrId('teams')
      app.delete(teams)
    } catch (_) {}
  },
)
