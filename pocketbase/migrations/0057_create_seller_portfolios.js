migrate(
  (app) => {
    const accountsCol = app.findCollectionByNameOrId('accounts')
    let exists = false
    try {
      app.findCollectionByNameOrId('seller_portfolios')
      exists = true
    } catch (_) {
      exists = false
    }

    if (!exists) {
      const sellerPortfolios = new Collection({
        name: 'seller_portfolios',
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
          'CREATE UNIQUE INDEX idx_seller_portfolios_seller_cust ON seller_portfolios (seller_id, customer_id, account_id)',
        ],
      })
      app.save(sellerPortfolios)
    }
  },
  (app) => {
    try {
      const sellerPortfolios = app.findCollectionByNameOrId('seller_portfolios')
      app.delete(sellerPortfolios)
    } catch (_) {}
  },
)
