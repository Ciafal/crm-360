routerAdd('GET', '/backend/v1/auth/me', (e) => {
  const authHeader = e.requestInfo().headers['authorization'] || ''
  let token = ''

  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim()
  }

  if (!token) {
    return e.json(401, {
      authenticated: false,
      error: 'Token não fornecido ou inválido.',
    })
  }

  const jwtSecret = $secrets.get('JWT_SECRET') || 'ciafal_crm_session_jwt_secret_key_2025'
  let payload = null

  try {
    payload = $security.parseJWT(token, jwtSecret)
  } catch (_) {
    payload = null
  }

  if (!payload || !payload.sub || !payload.email) {
    return e.json(401, {
      authenticated: false,
      error: 'Sessão inválida ou expirada.',
    })
  }

  // Verificar se a sessão está ativa no banco
  if (payload.session_id) {
    try {
      const sess = $app.findFirstRecordByData('sessions', 'session_id', payload.session_id)
      if (
        sess &&
        (!sess.getBool('is_active') ||
          new Date(sess.getString('expires_at')).getTime() < Date.now())
      ) {
        return e.json(401, {
          authenticated: false,
          error: 'Sessão revogada ou expirada.',
        })
      }
    } catch (_) {}
  }

  let user = null
  try {
    user = $app.findRecordById('_pb_users_auth_', payload.sub)
  } catch (_) {
    try {
      user = $app.findAuthRecordByEmail('_pb_users_auth_', payload.email)
    } catch (_) {
      user = null
    }
  }

  if (!user || user.getBool('active') === false) {
    return e.json(401, {
      authenticated: false,
      error: 'Usuário não encontrado ou inativo.',
    })
  }

  const rawRole = (user.getString('role') || payload.role || 'VENDEDOR').toUpperCase()
  let normalizedRole = 'VENDEDOR'
  if (rawRole === 'ADMIN' || rawRole === 'ADMINISTRADOR') normalizedRole = 'ADMIN'
  else if (rawRole === 'SUPERVISOR') normalizedRole = 'SUPERVISOR'
  else if (rawRole === 'REPRESENTANTE_EXTERNO' || rawRole === 'REPRESENTANTE')
    normalizedRole = 'REPRESENTANTE_EXTERNO'
  else normalizedRole = rawRole

  let permissions = []
  if (normalizedRole === 'ADMIN') {
    permissions = ['ALL', 'USERS_MANAGE', 'PORTFOLIO_ALL', 'REPORTS_ALL', 'SETTINGS', 'AUDIT']
  } else if (normalizedRole === 'SUPERVISOR') {
    permissions = ['PORTFOLIO_TEAM', 'QUOTATIONS_APPROVE', 'REPORTS_TEAM', 'DASHBOARD_TEAM']
  } else if (normalizedRole === 'REPRESENTANTE_EXTERNO') {
    permissions = ['PORTFOLIO_EXTERNAL', 'QUOTATIONS_OWN', 'CONSULTAS_OWN']
  } else {
    permissions = ['PORTFOLIO_OWN', 'QUOTATIONS_OWN', 'CONSULTAS_OWN', 'TASKS_OWN']
  }

  const appEnv = ($os.getenv('APP_ENV') || $secrets.get('APP_ENV') || 'homologation').toLowerCase()
  const isHomologation =
    appEnv === 'homologation' ||
    appEnv === 'qas' ||
    appEnv === 'test' ||
    appEnv === 'preview' ||
    appEnv === 'development'

  const safeUser = {
    id: user.id,
    email: user.email(),
    name: user.getString('name') || 'Colaborador CIAFAL',
    role: normalizedRole,
    employee_id: user.getString('employee_id') || '',
    seller_code: user.getString('seller_code') || '',
    ramal: user.getString('ramal') || '',
    telefone_corporativo: user.getString('telefone_corporativo') || '',
    department: user.getString('department') || '',
    cargo: user.getString('cargo') || '',
    cost_center: user.getString('cost_center') || '',
    manager_id: user.getString('manager_id') || '',
    manager_name: user.getString('manager_name') || '',
    active: user.getBool('active') !== false,
    is_test_user: user.getBool('is_test_user'),
    environment: isHomologation ? 'HOMOLOGAÇÃO' : 'PRODUÇÃO',
    permissions: permissions,
  }

  return e.json(200, {
    authenticated: true,
    user: safeUser,
  })
})
