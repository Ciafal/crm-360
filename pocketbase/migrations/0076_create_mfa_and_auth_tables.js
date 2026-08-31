migrate(
  (app) => {
    // 1. Atualizar campos da coleção nativa _pb_users_auth_ (users)
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    if (!users.fields.getByName('name')) {
      users.fields.add(new TextField({ name: 'name' }))
    }
    if (!users.fields.getByName('role')) {
      users.fields.add(
        new SelectField({
          name: 'role',
          values: [
            'ADMIN',
            'SUPERVISOR',
            'VENDEDOR',
            'REPRESENTANTE_EXTERNO',
            'GERENTE_COMERCIAL',
            'DIRETORIA',
            'AUDITOR',
            'TI',
            'ADMINISTRATIVO',
          ],
          maxSelect: 1,
        }),
      )
    }
    if (!users.fields.getByName('active')) {
      users.fields.add(new BoolField({ name: 'active' }))
    }
    if (!users.fields.getByName('is_test_user')) {
      users.fields.add(new BoolField({ name: 'is_test_user' }))
    }
    if (!users.fields.getByName('mfa_enabled')) {
      users.fields.add(new BoolField({ name: 'mfa_enabled' }))
    }
    if (!users.fields.getByName('employee_id')) {
      users.fields.add(new TextField({ name: 'employee_id' }))
    }
    if (!users.fields.getByName('seller_code')) {
      users.fields.add(new TextField({ name: 'seller_code' }))
    }
    if (!users.fields.getByName('ramal')) {
      users.fields.add(new TextField({ name: 'ramal' }))
    }
    if (!users.fields.getByName('telefone_corporativo')) {
      users.fields.add(new TextField({ name: 'telefone_corporativo' }))
    }
    if (!users.fields.getByName('department')) {
      users.fields.add(new TextField({ name: 'department' }))
    }
    if (!users.fields.getByName('cargo')) {
      users.fields.add(new TextField({ name: 'cargo' }))
    }
    if (!users.fields.getByName('cost_center')) {
      users.fields.add(new TextField({ name: 'cost_center' }))
    }
    if (!users.fields.getByName('manager_id')) {
      users.fields.add(new TextField({ name: 'manager_id' }))
    }
    if (!users.fields.getByName('manager_name')) {
      users.fields.add(new TextField({ name: 'manager_name' }))
    }
    if (!users.fields.getByName('avatar')) {
      users.fields.add(new FileField({ name: 'avatar', maxSelect: 1 }))
    }
    if (!users.fields.getByName('account_id')) {
      users.fields.add(new TextField({ name: 'account_id' }))
    }
    if (!users.fields.getByName('environment')) {
      users.fields.add(new TextField({ name: 'environment' }))
    }
    if (!users.fields.getByName('failed_login_attempts')) {
      users.fields.add(new NumberField({ name: 'failed_login_attempts' }))
    }
    if (!users.fields.getByName('locked_until')) {
      users.fields.add(new DateField({ name: 'locked_until' }))
    }

    app.save(users)

    // 2. Criar coleção mfa_challenges
    if (!app.hasTable('mfa_challenges')) {
      app.save(
        new Collection({
          name: 'mfa_challenges',
          type: 'base',
          listRule: null,
          viewRule: null,
          createRule: null,
          updateRule: null,
          deleteRule: null,
          fields: [
            { name: 'challenge_id', type: 'text', required: true },
            {
              name: 'user_id',
              type: 'relation',
              collectionId: '_pb_users_auth_',
              required: true,
              maxSelect: 1,
            },
            { name: 'email', type: 'email', required: true },
            { name: 'otp_hash', type: 'text', required: true },
            { name: 'expires_at', type: 'date', required: true },
            { name: 'used_at', type: 'date' },
            {
              name: 'status',
              type: 'select',
              values: ['PENDING', 'USED', 'EXPIRED', 'FAILED'],
              maxSelect: 1,
            },
            { name: 'environment', type: 'text' },
            { name: 'mode', type: 'text' },
            { name: 'attempts', type: 'number' },
            { name: 'ip_address', type: 'text' },
            { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
            { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
          ],
          indexes: [
            'CREATE UNIQUE INDEX idx_mfa_challenge_id ON mfa_challenges (challenge_id)',
            'CREATE INDEX idx_mfa_user_status ON mfa_challenges (user_id, status)',
            'CREATE INDEX idx_mfa_email ON mfa_challenges (email)',
          ],
        }),
      )
    }

    // 3. Criar coleção sessions
    if (!app.hasTable('sessions')) {
      app.save(
        new Collection({
          name: 'sessions',
          type: 'base',
          listRule: null,
          viewRule: null,
          createRule: null,
          updateRule: null,
          deleteRule: null,
          fields: [
            { name: 'session_id', type: 'text', required: true },
            {
              name: 'user_id',
              type: 'relation',
              collectionId: '_pb_users_auth_',
              required: true,
              maxSelect: 1,
            },
            { name: 'email', type: 'email', required: true },
            { name: 'role', type: 'text', required: true },
            { name: 'permissions', type: 'json' },
            { name: 'expires_at', type: 'date', required: true },
            { name: 'is_active', type: 'bool' },
            { name: 'token_hash', type: 'text' },
            { name: 'user_agent', type: 'text' },
            { name: 'ip_address', type: 'text' },
            { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
            { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
          ],
          indexes: [
            'CREATE UNIQUE INDEX idx_sessions_session_id ON sessions (session_id)',
            'CREATE INDEX idx_sessions_user_active ON sessions (user_id, is_active)',
          ],
        }),
      )
    }

    // 4. Criar coleção auth_audit_logs
    if (!app.hasTable('auth_audit_logs')) {
      app.save(
        new Collection({
          name: 'auth_audit_logs',
          type: 'base',
          listRule: null,
          viewRule: null,
          createRule: null,
          updateRule: null,
          deleteRule: null,
          fields: [
            { name: 'user_id', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
            { name: 'email', type: 'email' },
            { name: 'action', type: 'text', required: true },
            { name: 'status', type: 'text', required: true },
            { name: 'ip_address', type: 'text' },
            { name: 'user_agent', type: 'text' },
            { name: 'details', type: 'json' },
            { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
            { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
          ],
          indexes: [
            'CREATE INDEX idx_auth_audit_email ON auth_audit_logs (email)',
            'CREATE INDEX idx_auth_audit_created ON auth_audit_logs (created DESC)',
          ],
        }),
      )
    }

    // 5. Seed idempotente dos 5 usuários oficiais de homologação
    const testUsers = [
      {
        email: 'admin.teste@ciafal.local',
        name: 'Carlos Alberto (Diretoria & Adm)',
        role: 'ADMIN',
        employee_id: 'TEST-ADM-01',
        seller_code: 'ADM-TESTE',
        ramal: '4099',
        telefone_corporativo: '(11) 98888-0000',
        department: 'Diretoria e Tecnologia',
        cargo: 'Administrador Executivo',
        cost_center: 'CC-0100',
        manager_id: '',
        manager_name: '',
      },
      {
        email: 'supervisor.teste@ciafal.local',
        name: 'Marcos Vinícius (Supervisor)',
        role: 'SUPERVISOR',
        employee_id: 'TEST-SUP-01',
        seller_code: 'SUP-TESTE',
        ramal: '4090',
        telefone_corporativo: '(11) 98888-0001',
        department: 'Vendas Corporativas',
        cargo: 'Supervisor de Contas Industriais',
        cost_center: 'CC-0200',
        manager_id: '',
        manager_name: 'Carlos Alberto (Diretoria & Adm)',
      },
      {
        email: 'vendedor.teste@ciafal.local',
        name: 'Carlos Mendonça',
        role: 'VENDEDOR',
        employee_id: 'TEST-VEND-01',
        seller_code: 'VEND-TEST-01',
        ramal: '4091',
        telefone_corporativo: '(11) 98888-0002',
        department: 'Comercial Interno',
        cargo: 'Vendedor Industrial Sênior',
        cost_center: 'CC-0210',
        manager_id: '',
        manager_name: 'Marcos Vinícius (Supervisor)',
      },
      {
        email: 'vendedor2.teste@ciafal.local',
        name: 'Mariana Azevedo',
        role: 'VENDEDOR',
        employee_id: 'TEST-VEND-02',
        seller_code: 'VEND-TEST-02',
        ramal: '4092',
        telefone_corporativo: '(11) 98888-0003',
        department: 'Comercial Interno',
        cargo: 'Vendedora Pleno (Grande BH)',
        cost_center: 'CC-0210',
        manager_id: '',
        manager_name: 'Marcos Vinícius (Supervisor)',
      },
      {
        email: 'representante.teste@crm360.local',
        name: 'João Pedro Representações',
        role: 'REPRESENTANTE_EXTERNO',
        employee_id: 'TEST-REP-01',
        seller_code: 'REP-EXT-01',
        ramal: '4095',
        telefone_corporativo: '(11) 98888-0005',
        department: 'Rede Externa',
        cargo: 'Representante Comercial Autônomo',
        cost_center: 'CC-0300',
        manager_id: '',
        manager_name: 'Marcos Vinícius (Supervisor)',
      },
    ]

    for (let i = 0; i < testUsers.length; i++) {
      const u = testUsers[i]
      const cleanEmail = u.email.trim().toLowerCase()
      let userRecord = null

      try {
        userRecord = app.findAuthRecordByEmail('_pb_users_auth_', cleanEmail)
      } catch (_) {
        userRecord = null
      }

      if (!userRecord) {
        userRecord = new Record(users)
        userRecord.setEmail(cleanEmail)
      }

      userRecord.setPassword('teste123')
      userRecord.setVerified(true)
      userRecord.set('name', u.name)
      userRecord.set('role', u.role)
      userRecord.set('active', true)
      userRecord.set('is_test_user', true)
      userRecord.set('mfa_enabled', true)
      userRecord.set('employee_id', u.employee_id)
      userRecord.set('seller_code', u.seller_code)
      userRecord.set('ramal', u.ramal)
      userRecord.set('telefone_corporativo', u.telefone_corporativo)
      userRecord.set('department', u.department)
      userRecord.set('cargo', u.cargo)
      userRecord.set('cost_center', u.cost_center)
      userRecord.set('manager_id', u.manager_id)
      userRecord.set('manager_name', u.manager_name)
      userRecord.set('environment', 'HOMOLOGAÇÃO')
      userRecord.set('failed_login_attempts', 0)

      app.save(userRecord)
    }
  },
  (app) => {
    try {
      const mfaCol = app.findCollectionByNameOrId('mfa_challenges')
      app.delete(mfaCol)
    } catch (_) {}
    try {
      const sessCol = app.findCollectionByNameOrId('sessions')
      app.delete(sessCol)
    } catch (_) {}
    try {
      const auditCol = app.findCollectionByNameOrId('auth_audit_logs')
      app.delete(auditCol)
    } catch (_) {}
  },
)
