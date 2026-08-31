// pocketbase/migrations/0076_create_mfa_and_auth_tables.js
migrate(
  (app) => {
    // 1. Criar ou garantir a coleção de challenges MFA (`mfa_challenges`)
    var hasMfaCol = false
    try {
      app.findCollectionByNameOrId('mfa_challenges')
      hasMfaCol = true
    } catch (_) {
      hasMfaCol = false
    }

    if (!hasMfaCol) {
      var mfaChallenges = new Collection({
        name: 'mfa_challenges',
        type: 'base',
        listRule: null, // Superuser / backend hooks only
        viewRule: null,
        createRule: null,
        updateRule: null,
        deleteRule: null,
        fields: [
          {
            name: 'user_id',
            type: 'relation',
            collectionId: '_pb_users_auth_',
            required: false,
            maxSelect: 1,
          },
          { name: 'email', type: 'email', required: true },
          { name: 'challenge_token', type: 'text', required: true },
          { name: 'otp_hash', type: 'text', required: true },
          { name: 'mode', type: 'text', required: true }, // 'TEST_FIXED' | 'REAL_OTP'
          { name: 'status', type: 'text', required: true }, // 'PENDING' | 'USED' | 'EXPIRED' | 'LOCKED'
          { name: 'attempts', type: 'number', required: false },
          { name: 'expires_at', type: 'text', required: true },
          { name: 'used_at', type: 'text', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_mfa_token ON mfa_challenges (challenge_token)',
          'CREATE INDEX idx_mfa_email_status ON mfa_challenges (email, status)',
          'CREATE INDEX idx_mfa_expires ON mfa_challenges (expires_at)',
        ],
      })
      app.save(mfaChallenges)
    }

    // 2. Criar ou garantir a coleção mock_emails se ainda não existir
    var hasMockEmails = false
    try {
      app.findCollectionByNameOrId('mock_emails')
      hasMockEmails = true
    } catch (_) {
      hasMockEmails = false
    }

    if (!hasMockEmails) {
      var mockEmails = new Collection({
        name: 'mock_emails',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: '',
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'recipient', type: 'email', required: true },
          { name: 'subject', type: 'text', required: false },
          { name: 'otp_code', type: 'text', required: false },
          { name: 'status', type: 'text', required: false },
          { name: 'expires_at', type: 'text', required: false },
          { name: 'metadata_json', type: 'json', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_mock_emails_rec ON mock_emails (recipient)',
          'CREATE INDEX idx_mock_emails_status ON mock_emails (status)',
        ],
      })
      app.save(mockEmails)
    }

    // 3. Garantir campos customizados na coleção users (role, employee_id, seller_code, ramal, telefone_corporativo, manager_id, active, is_test_user)
    var usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    var userFieldsToAdd = [
      { name: 'role', type: 'text' },
      { name: 'employee_id', type: 'text' },
      { name: 'seller_code', type: 'text' },
      { name: 'ramal', type: 'text' },
      { name: 'telefone_corporativo', type: 'text' },
      { name: 'manager_id', type: 'text' },
      { name: 'active', type: 'bool' },
      { name: 'is_test_user', type: 'bool' },
    ]

    var updatedUserCol = false
    for (var f = 0; f < userFieldsToAdd.length; f++) {
      var fieldDef = userFieldsToAdd[f]
      if (!usersCol.fields.getByName(fieldDef.name)) {
        if (fieldDef.type === 'bool') {
          usersCol.fields.add(new BoolField({ name: fieldDef.name, required: false }))
        } else {
          usersCol.fields.add(new TextField({ name: fieldDef.name, required: false }))
        }
        updatedUserCol = true
      }
    }
    if (updatedUserCol) {
      app.save(usersCol)
    }

    // 4. Seed idempotente dos 5 usuários de homologação
    // Regra: Em APP_ENV=production NUNCA criar usuários de teste
    var env = ($os.getenv('APP_ENV') || $secrets.get('APP_ENV') || '').trim().toLowerCase()
    var isProduction = env === 'production' || env === 'prod'

    if (!isProduction) {
      var seedUsers = [
        {
          email: 'admin.teste@ciafal.local',
          name: 'Carlos Alberto (Diretoria & Adm)',
          role: 'ADMIN',
          employee_id: 'TEST-ADM-01',
          seller_code: 'ADM-TESTE',
          ramal: '4099',
          telefone_corporativo: '(11) 98888-0000',
          manager_id: '',
        },
        {
          email: 'supervisor.teste@ciafal.local',
          name: 'Marcos Vinícius (Supervisor)',
          role: 'SUPERVISOR',
          employee_id: 'TEST-SUP-01',
          seller_code: 'SUP-TESTE',
          ramal: '4090',
          telefone_corporativo: '(11) 98888-0001',
          manager_id: '',
        },
        {
          email: 'vendedor.teste@ciafal.local',
          name: 'Carlos Mendonça',
          role: 'VENDEDOR',
          employee_id: 'TEST-VEND-01',
          seller_code: 'VEND-TEST-01',
          ramal: '4091',
          telefone_corporativo: '(11) 98888-0002',
          manager_id: 'supervisor.teste@ciafal.local',
        },
        {
          email: 'vendedor2.teste@ciafal.local',
          name: 'Mariana Azevedo',
          role: 'VENDEDOR',
          employee_id: 'TEST-VEND-02',
          seller_code: 'VEND-TEST-02',
          ramal: '4092',
          telefone_corporativo: '(11) 98888-0003',
          manager_id: 'supervisor.teste@ciafal.local',
        },
        {
          email: 'representante.teste@crm360.local',
          name: 'João Pedro Representações',
          role: 'REPRESENTANTE_EXTERNO',
          employee_id: 'TEST-REP-01',
          seller_code: 'REP-EXT-01',
          ramal: '4095',
          telefone_corporativo: '(11) 98888-0005',
          manager_id: '',
        },
      ]

      for (var u = 0; u < seedUsers.length; u++) {
        var userItem = seedUsers[u]
        var record
        var isNew = false

        try {
          record = app.findAuthRecordByEmail('_pb_users_auth_', userItem.email)
        } catch (_) {
          record = new Record(usersCol)
          isNew = true
        }

        record.setEmail(userItem.email)
        record.setPassword('teste123')
        record.setVerified(true)
        record.set('name', userItem.name)
        record.set('role', userItem.role)
        record.set('employee_id', userItem.employee_id)
        record.set('seller_code', userItem.seller_code)
        record.set('ramal', userItem.ramal)
        record.set('telefone_corporativo', userItem.telefone_corporativo)
        record.set('manager_id', userItem.manager_id)
        record.set('active', true)
        record.set('is_test_user', true)

        try {
          app.save(record)
        } catch (saveErr) {
          console.log('0076: Error saving user ' + userItem.email + ': ' + saveErr)
        }
      }
    }
  },
  (app) => {
    try {
      var mfaChallenges = app.findCollectionByNameOrId('mfa_challenges')
      app.delete(mfaChallenges)
    } catch (_) {}
  },
)
