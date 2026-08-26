migrate(
  (app) => {
    const usersCollection = app.findCollectionByNameOrId('_pb_users_auth_')
    const usersId = usersCollection.id

    let accountsId = '_pb_users_auth_'
    try {
      accountsId = app.findCollectionByNameOrId('accounts').id
    } catch (_) {}

    let crmContactsId = '_pb_users_auth_'
    try {
      crmContactsId = app.findCollectionByNameOrId('crm_contacts').id
    } catch (_) {}

    // 1. Expand interactions with email metadata fields if not present
    try {
      const interactions = app.findCollectionByNameOrId('interactions')
      if (!interactions.fields.getByName('subject')) {
        interactions.fields.add(new TextField({ name: 'subject' }))
      }
      if (!interactions.fields.getByName('email_from')) {
        interactions.fields.add(new TextField({ name: 'email_from' }))
      }
      if (!interactions.fields.getByName('email_to')) {
        interactions.fields.add(new TextField({ name: 'email_to' }))
      }
      if (!interactions.fields.getByName('email_cc')) {
        interactions.fields.add(new TextField({ name: 'email_cc' }))
      }
      if (!interactions.fields.getByName('body_preview')) {
        interactions.fields.add(new TextField({ name: 'body_preview' }))
      }
      if (!interactions.fields.getByName('body_reference')) {
        interactions.fields.add(new TextField({ name: 'body_reference' }))
      }
      if (!interactions.fields.getByName('message_id')) {
        interactions.fields.add(new TextField({ name: 'message_id' }))
      }
      if (!interactions.fields.getByName('conversation_id')) {
        interactions.fields.add(new TextField({ name: 'conversation_id' }))
      }
      if (!interactions.fields.getByName('internet_message_id')) {
        interactions.fields.add(new TextField({ name: 'internet_message_id' }))
      }
      if (!interactions.fields.getByName('has_attachments')) {
        interactions.fields.add(new BoolField({ name: 'has_attachments' }))
      }
      if (!interactions.fields.getByName('email_classification')) {
        interactions.fields.add(new TextField({ name: 'email_classification' }))
      }
      if (!interactions.fields.getByName('quote_id')) {
        interactions.fields.add(new TextField({ name: 'quote_id' }))
      }
      app.save(interactions)
    } catch (err) {
      console.log('Error updating interactions schema: ' + err)
    }

    // 2. Add ms_contact_id to crm_contacts if not present
    try {
      const contacts = app.findCollectionByNameOrId('crm_contacts')
      if (!contacts.fields.getByName('ms_contact_id')) {
        contacts.fields.add(new TextField({ name: 'ms_contact_id' }))
        app.save(contacts)
      }
    } catch (err) {
      console.log('Error adding ms_contact_id to crm_contacts: ' + err)
    }

    // 3. Create contact_update_suggestions collection
    let existsSuggestions = false
    try {
      app.findCollectionByNameOrId('contact_update_suggestions')
      existsSuggestions = true
    } catch (_) {
      existsSuggestions = false
    }

    if (!existsSuggestions) {
      const suggestions = new Collection({
        name: 'contact_update_suggestions',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'contact_id', type: 'relation', collectionId: crmContactsId, maxSelect: 1 },
          { name: 'field_name', type: 'text', required: true },
          { name: 'ms_value', type: 'text' },
          { name: 'crm_value', type: 'text' },
          {
            name: 'status',
            type: 'select',
            values: ['PENDING', 'ACCEPTED', 'REJECTED'],
            maxSelect: 1,
          },
          { name: 'resolved_at', type: 'date' },
          { name: 'account_id', type: 'relation', collectionId: accountsId, maxSelect: 1 },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_contact_sugg_contact ON contact_update_suggestions (contact_id)',
          'CREATE INDEX idx_contact_sugg_status ON contact_update_suggestions (status)',
        ],
      })
      app.save(suggestions)
    }

    // 4. Create ms_sync_state collection
    let existsMsSync = false
    try {
      app.findCollectionByNameOrId('ms_sync_state')
      existsMsSync = true
    } catch (_) {
      existsMsSync = false
    }

    if (!existsMsSync) {
      const syncState = new Collection({
        name: 'ms_sync_state',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'resource_type',
            type: 'select',
            values: ['contacts', 'emails', 'calendar'],
            maxSelect: 1,
          },
          { name: 'last_synced_at', type: 'date' },
          { name: 'last_subscription_renewal', type: 'date' },
          {
            name: 'sync_status',
            type: 'select',
            values: ['idle', 'syncing', 'success', 'error'],
            maxSelect: 1,
          },
          { name: 'error_message', type: 'text' },
          { name: 'account_id', type: 'relation', collectionId: accountsId, maxSelect: 1 },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: ['CREATE INDEX idx_ms_sync_resource ON ms_sync_state (resource_type)'],
      })
      app.save(syncState)
    }
  },
  (app) => {
    try {
      app.delete(app.findCollectionByNameOrId('contact_update_suggestions'))
    } catch (_) {}
    try {
      app.delete(app.findCollectionByNameOrId('ms_sync_state'))
    } catch (_) {}
  },
)
