routerAdd('POST', '/backend/v1/auth/verify-mfa', (e) => {
  const body = e.requestInfo().body || {}
  const rawEmail = body.email || ''
  const rawOtp = body.otp || ''
  const challengeId = (body.challenge_id || '').trim()

  const email = (rawEmail + '').trim().toLowerCase()
  const otp = (rawOtp + '').trim()

  // Validação estrita: 6 dígitos numéricos
  if (!email || !otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
    return e.json(400, {
      authenticated: false,
      error: 'Código de verificação inválido.',
    })
  }

  const now = new Date()

  // 1. Localizar usuário
  let user = null
  try {
    user = $app.findAuthRecordByEmail('_pb_users_auth_', email)
  } catch (_) {
    user = null
  }

  if (!user) {
    return e.json(401, {
      authenticated: false,
      error: 'Usuário não encontrado.',
    })
  }

  if (user.getBool('active') === false) {
    return e.json(403, {
      authenticated: false,
      error: 'Conta inativa ou bloqueada.',
    })
  }

  // 2. Localizar e validar challenge
  const appEnv = ($os.getenv('APP_ENV') || $secrets.get('APP_ENV') || 'homologation').toLowerCase()
  const isHomologation =
    appEnv === 'homologation' ||
    appEnv === 'qas' ||
    appEnv === 'test' ||
    appEnv === 'preview' ||
    appEnv === 'development'

  const officialTestEmails = [
    'admin.teste@ciafal.local',
    'supervisor.teste@ciafal.local',
    'vendedor.teste@ciafal.local',
    'vendedor2.teste@ciafal.local',
    'representante.teste@crm360.local',
  ]
  const isTestUser = officialTestEmails.indexOf(email) !== -1 || user.getBool('is_test_user')

  const otpSalt = 'ciafal_mfa_secret_salt_2025'
  const providedOtpHash = $security.sha256(otp + ':' + email + ':' + otpSalt)

  let challenge = null
  let isOtpValid = false

  if (challengeId) {
    try {
      challenge = $app.findFirstRecordByData('mfa_challenges', 'challenge_id', challengeId)
    } catch (_) {
      challenge = null
    }
  }

  if (challenge) {
    // Validar status e expiração
    const status = challenge.getString('status')
    const expiresAt = new Date(challenge.getString('expires_at'))
    const attempts = challenge.getInt('attempts') || 0

    if (status !== 'PENDING' || expiresAt.getTime() < now.getTime() || attempts >= 5) {
      if (status === 'PENDING' && expiresAt.getTime() < now.getTime()) {
        challenge.set('status', 'EXPIRED')
        $app.save(challenge)
      }
      return e.json(400, {
        authenticated: false,
        error: 'Código de verificação expirado ou inválido.',
      })
    }

    const storedHash = challenge.getString('otp_hash')
    if (storedHash === providedOtpHash) {
      isOtpValid = true
      challenge.set('status', 'USED')
      challenge.set('used_at', now.toISOString())
      $app.save(challenge)
    } else {
      challenge.set('attempts', attempts + 1)
      if (attempts + 1 >= 5) {
        challenge.set('status', 'FAILED')
      }
      $app.save(challenge)
    }
  } else {
    // Fallback se o challenge não estiver no banco (ex: migração pendente)
    // Em homologação para test users, aceita 123456
    if (isHomologation && isTestUser && otp === '123456') {
      isOtpValid = true
    }
  }

  if (!isOtpValid) {
    // Log de falha de MFA
    try {
      const auditCol = $app.findCollectionByNameOrId('auth_audit_logs')
      const logRec = new Record(auditCol)
      logRec.set('user_id', user.id)
      logRec.set('email', email)
      logRec.set('action', 'MFA_FAILED')
      logRec.set('status', 'FAILURE')
      logRec.set('ip_address', e.requestInfo().headers['x-forwarded-for'] || '')
      logRec.set('user_agent', e.requestInfo().headers['user-agent'] || '')
      logRec.set('details', { challenge_id: challengeId, reason: 'INVALID_OTP' })
      $app.save(logRec)
    } catch (_) {}

    return e.json(400, {
      authenticated: false,
      error: 'Código de verificação inválido.',
    })
  }

  // 3. Gerar Sessão Real e Token JWT
  const rawRole = (user.getString('role') || 'VENDEDOR').toUpperCase()
  let normalizedRole = 'VENDEDOR'
  if (rawRole === 'ADMIN' || rawRole === 'ADMINISTRADOR') normalizedRole = 'ADMIN'
  else if (rawRole === 'SUPERVISOR') normalizedRole = 'SUPERVISOR'
  else if (rawRole === 'REPRESENTANTE_EXTERNO' || rawRole === 'REPRESENTANTE')
    normalizedRole = 'REPRESENTANTE_EXTERNO'
  else normalizedRole = rawRole

  // Definir matriz de permissões RBAC com base no papel
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

  const jwtSecret = $secrets.get('JWT_SECRET') || 'ciafal_crm_session_jwt_secret_key_2025'
  const durationSecs = 86400 * 7 // 7 dias
  const sessionId = 'sess_' + $security.randomString(32) + '_' + Date.now()
  const expiresAt = new Date(now.getTime() + durationSecs * 1000)

  const jwtPayload = {
    sub: user.id,
    email: email,
    role: normalizedRole,
    session_id: sessionId,
    exp: Math.floor(expiresAt.getTime() / 1000),
  }

  const token = $security.createJWT(jwtPayload, jwtSecret, durationSecs)

  // Persistir sessão
  try {
    const sessCol = $app.findCollectionByNameOrId('sessions')
    const sessRec = new Record(sessCol)
    sessRec.set('session_id', sessionId)
    sessRec.set('user_id', user.id)
    sessRec.set('email', email)
    sessRec.set('role', normalizedRole)
    sessRec.set('permissions', permissions)
    sessRec.set('expires_at', expiresAt.toISOString())
    sessRec.set('is_active', true)
    sessRec.set('token_hash', $security.sha256(token))
    sessRec.set('ip_address', e.requestInfo().headers['x-forwarded-for'] || '')
    sessRec.set('user_agent', e.requestInfo().headers['user-agent'] || '')
    $app.save(sessRec)
  } catch (_) {}

  // Log de auditoria de sucesso
  try {
    const auditCol = $app.findCollectionByNameOrId('auth_audit_logs')
    const logRec = new Record(auditCol)
    logRec.set('user_id', user.id)
    logRec.set('email', email)
    logRec.set('action', 'LOGIN_SUCCESS')
    logRec.set('status', 'SUCCESS')
    logRec.set('ip_address', e.requestInfo().headers['x-forwarded-for'] || '')
    logRec.set('user_agent', e.requestInfo().headers['user-agent'] || '')
    logRec.set('details', { session_id: sessionId, role: normalizedRole })
    $app.save(logRec)
  } catch (_) {}

  const safeUser = {
    id: user.id,
    email: email,
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
    is_test_user: isTestUser,
    environment: isHomologation ? 'HOMOLOGAÇÃO' : 'PRODUÇÃO',
    permissions: permissions,
  }

  return e.json(200, {
    authenticated: true,
    token: token,
    session_id: sessionId,
    user: safeUser,
    message: 'Acesso autorizado com sucesso.',
  })
})
