migrate(
  (app) => {
    // Seed default role/details for current admin if exists
    try {
      const user = app.findAuthRecordByEmail('_pb_users_auth_', 'ciafal@ciafal.com.br')
      user.set('role', 'gerente_comercial')
      user.set('employee_id', 'MAT-1001')
      user.set('seller_code', 'VEND-01')
      user.set('ramal', '4001')
      user.set('telefone_corporativo', '(11) 98765-4321')
      user.set('active', true)
      app.save(user)
    } catch (_) {}
  },
  (app) => {},
)
