migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    // 1. Atualizar SelectField 'role' para incluir 'representante_externo' se ainda não estiver na lista
    const roleField = users.fields.getByName('role')
    if (roleField) {
      const currentValues = roleField.values || []
      if (!currentValues.includes('representante_externo')) {
        roleField.values = [...currentValues, 'representante_externo']
        app.save(users)
      }
    }

    // 2. Adicionar campo 'is_test_user' booleano aos users para identificação transparente
    if (!users.fields.getByName('is_test_user')) {
      users.fields.add(new BoolField({ name: 'is_test_user', required: false }))
      app.save(users)
    }

    // 3. Criar coleção mock_emails para MFA e notificações mock em DEV/HML
    let existsMockEmails = false
    try {
      app.findCollectionByNameOrId('mock_emails')
      existsMockEmails = true
    } catch (_) {
      existsMockEmails = false
    }

    if (!existsMockEmails) {
      const mockEmails = new Collection({
        name: 'mock_emails',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: '',
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          { name: 'recipient', type: 'text', required: true, min: 1, max: 200 },
          { name: 'subject', type: 'text', required: false, max: 300 },
          { name: 'otp_code', type: 'text', required: false, max: 20 },
          {
            name: 'status',
            type: 'select',
            required: true,
            maxSelect: 1,
            values: ['VALID', 'EXPIRED', 'USED'],
          },
          { name: 'expires_at', type: 'date', required: false },
          { name: 'metadata_json', type: 'json', required: false },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE INDEX idx_mock_emails_rec_st ON mock_emails (recipient, status)',
          'CREATE INDEX idx_mock_emails_created ON mock_emails (created DESC)',
        ],
      })
      app.save(mockEmails)
    }

    // 4. Obter conta comercial principal ou criar uma se não existir
    let mainAccountId = ''
    try {
      const acc = app.findFirstRecordByData('accounts', 'name', 'CIAFAL Gestão Comercial')
      mainAccountId = acc.id
    } catch (_) {
      try {
        const anyAcc = app.findRecordsByFilter('accounts', '', '-created', 1, 0)
        if (anyAcc.length > 0) {
          mainAccountId = anyAcc[0].id
        }
      } catch (_) {}
    }

    // 5. Seed dos Usuários de Teste (Idempotente)
    // Senhas salvas com hash automático do PocketBase via setPassword()

    // 5.1 Supervisor Teste CRM
    let supervisorId = ''
    try {
      const sup = app.findAuthRecordByEmail('_pb_users_auth_', 'supervisor.teste@ciafal.local')
      supervisorId = sup.id
    } catch (_) {
      const sup = new Record(users)
      sup.setEmail('supervisor.teste@ciafal.local')
      sup.setPassword('CRM360@Teste2026!')
      sup.setVerified(true)
      sup.set('name', 'Supervisor Teste CRM')
      sup.set('role', 'supervisor')
      sup.set('employee_id', 'TEST-SUP-01')
      sup.set('seller_code', 'SUP-TESTE')
      sup.set('ramal', '4090')
      sup.set('telefone_corporativo', '(11) 98888-0001')
      sup.set('active', true)
      sup.set('is_test_user', true)
      app.save(sup)
      supervisorId = sup.id
    }

    // 5.2 Vendedor Teste CRM
    let vendedor1Id = ''
    try {
      const v1 = app.findAuthRecordByEmail('_pb_users_auth_', 'vendedor.teste@ciafal.local')
      vendedor1Id = v1.id
    } catch (_) {
      const v1 = new Record(users)
      v1.setEmail('vendedor.teste@ciafal.local')
      v1.setPassword('CRM360@Teste2026!')
      v1.setVerified(true)
      v1.set('name', 'Vendedor Teste CRM')
      v1.set('role', 'vendedor')
      v1.set('employee_id', 'TEST-VEND-01')
      v1.set('seller_code', 'VEND-TEST-01')
      v1.set('manager_id', supervisorId)
      v1.set('ramal', '4091')
      v1.set('telefone_corporativo', '(11) 98888-0002')
      v1.set('active', true)
      v1.set('is_test_user', true)
      app.save(v1)
      vendedor1Id = v1.id
    }

    // 5.3 Vendedor 2 Teste
    let vendedor2Id = ''
    try {
      const v2 = app.findAuthRecordByEmail('_pb_users_auth_', 'vendedor2.teste@ciafal.local')
      vendedor2Id = v2.id
    } catch (_) {
      const v2 = new Record(users)
      v2.setEmail('vendedor2.teste@ciafal.local')
      v2.setPassword('CRM360@Teste2026!')
      v2.setVerified(true)
      v2.set('name', 'Vendedor 2 Teste')
      v2.set('role', 'vendedor')
      v2.set('employee_id', 'TEST-VEND-02')
      v2.set('seller_code', 'VEND-TEST-02')
      v2.set('manager_id', supervisorId)
      v2.set('ramal', '4092')
      v2.set('telefone_corporativo', '(11) 98888-0003')
      v2.set('active', true)
      v2.set('is_test_user', true)
      app.save(v2)
      vendedor2Id = v2.id
    }

    // 5.4 Vendedor 3 Teste
    let vendedor3Id = ''
    try {
      const v3 = app.findAuthRecordByEmail('_pb_users_auth_', 'vendedor3.teste@ciafal.local')
      vendedor3Id = v3.id
    } catch (_) {
      const v3 = new Record(users)
      v3.setEmail('vendedor3.teste@ciafal.local')
      v3.setPassword('CRM360@Teste2026!')
      v3.setVerified(true)
      v3.set('name', 'Vendedor 3 Teste')
      v3.set('role', 'vendedor')
      v3.set('employee_id', 'TEST-VEND-03')
      v3.set('seller_code', 'VEND-TEST-03')
      v3.set('manager_id', supervisorId)
      v3.set('ramal', '4093')
      v3.set('telefone_corporativo', '(11) 98888-0004')
      v3.set('active', true)
      v3.set('is_test_user', true)
      app.save(v3)
      vendedor3Id = v3.id
    }

    // 5.5 Administrador Teste CRM
    let adminId = ''
    try {
      const adm = app.findAuthRecordByEmail('_pb_users_auth_', 'admin.teste@ciafal.local')
      adminId = adm.id
    } catch (_) {
      const adm = new Record(users)
      adm.setEmail('admin.teste@ciafal.local')
      adm.setPassword('CRM360@Admin2026!')
      adm.setVerified(true)
      adm.set('name', 'Administrador Teste CRM')
      adm.set('role', 'administrador')
      adm.set('employee_id', 'TEST-ADM-01')
      adm.set('seller_code', 'ADM-TESTE')
      adm.set('ramal', '4099')
      adm.set('telefone_corporativo', '(11) 98888-0000')
      adm.set('active', true)
      adm.set('is_test_user', true)
      app.save(adm)
      adminId = adm.id
    }

    // 5.6 Representante Externo Teste
    let repId = ''
    try {
      const rep = app.findAuthRecordByEmail('_pb_users_auth_', 'representante.teste@crm360.local')
      repId = rep.id
    } catch (_) {
      const rep = new Record(users)
      rep.setEmail('representante.teste@crm360.local')
      rep.setPassword('CRM360@Externo2026!')
      rep.setVerified(true)
      rep.set('name', 'Representante Externo Teste')
      rep.set('role', 'representante_externo')
      rep.set('employee_id', 'TEST-REP-01')
      rep.set('seller_code', 'REP-EXT-01')
      rep.set('ramal', '4095')
      rep.set('telefone_corporativo', '(11) 98888-0005')
      rep.set('active', true)
      rep.set('is_test_user', true)
      app.save(rep)
      repId = rep.id
    }

    // 6. Vincular usuários à conta comercial nos account_members se houver conta
    if (mainAccountId) {
      const testUserIds = [supervisorId, vendedor1Id, vendedor2Id, vendedor3Id, adminId, repId]
      const accMembersCol = app.findCollectionByNameOrId('account_members')

      testUserIds.forEach((uId) => {
        if (!uId) return
        try {
          app.findFirstRecordByData('account_members', 'user_id', uId)
        } catch (_) {
          const m = new Record(accMembersCol)
          m.set('account_id', mainAccountId)
          m.set('user_id', uId)
          m.set('role', uId === adminId ? 'owner' : 'member')
          m.set('joined_at', new Date().toISOString())
          app.save(m)
        }
      })
    }
  },
  (app) => {
    // Reverter remoção de seeds de teste
    const emails = [
      'vendedor.teste@ciafal.local',
      'vendedor2.teste@ciafal.local',
      'vendedor3.teste@ciafal.local',
      'supervisor.teste@ciafal.local',
      'admin.teste@ciafal.local',
      'representante.teste@crm360.local',
    ]
    emails.forEach((em) => {
      try {
        const u = app.findAuthRecordByEmail('_pb_users_auth_', em)
        app.delete(u)
      } catch (_) {}
    })
  },
)
