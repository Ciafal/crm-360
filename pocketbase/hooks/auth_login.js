routerAdd('POST', '/backend/v1/auth/login', (e) => {
  const body = e.requestInfo().body || {}
  const rawEmail = body.email || ''
  const rawPassword = body.password || ''

  const email = (rawEmail + '').trim().toLowerCase()
  const password = (rawPassword + '').trim()

  if (!email || !password) {
    return e.json(400, {
      success: false,
      error: 'Usuário ou senha inválidos.',
    })
  }

  // 1. Rate Limiting Check no banco / em memória
  const now = new Date()
  let user = null
  try {
    user = $app.findAuthRecordByEmail('_pb_users_auth_', email)
  } catch (_) {
    user = null
  }

  // Se o usuário não existir na base de dados nativa
  if (!user) {
    return e.json(401, {
      success: false,
      error: 'Usuário ou senha inválidos.',
    })
  }

  // Checar se a conta está ativa
  if (user.getBool('active') === false) {
    return e.json(403, {
      success: false,
      error: 'Conta inativa ou bloqueada. Contate o suporte da TI.',
    })
  }

  // Checar lock temporário por tentativas
  const lockedUntil = user.getString('locked_until')
  if (lockedUntil) {
    const lockDate = new Date(lockedUntil)
    if (lockDate.getTime() > now.getTime()) {
      return e.json(429, {
        success: false,
        error: 'Limite de tentativas de login excedido. Por segurança, aguarde alguns minutos.',
      })
    }
  }

  // 2. Validar senha contra hash seguro do PocketBase
  const isValidPassword = user.validatePassword(password)
  if (!isValidPassword) {
    const failedAttempts = (user.getInt('failed_login_attempts') || 0) + 1
    user.set('failed_login_attempts', failedAttempts)
    if (failedAttempts >= 5) {
      const lockTime = new Date(now.getTime() + 15 * 60 * 1000)
      user.set('locked_until', lockTime.toISOString())
    }
    $app.save(user)

    // Log de auditoria
    try {
      const auditCol = $app.findCollectionByNameOrId('auth_audit_logs')
      const logRec = new Record(auditCol)
      logRec.set('user_id', user.id)
      logRec.set('email', email)
      logRec.set('action', 'LOGIN_FAILED')
      logRec.set('status', 'FAILURE')
      logRec.set('ip_address', e.requestInfo().headers['x-forwarded-for'] || '')
      logRec.set('user_agent', e.requestInfo().headers['user-agent'] || '')
      logRec.set('details', { reason: 'INVALID_PASSWORD', failed_attempts: failedAttempts })
      $app.save(logRec)
    } catch (_) {}

    return e.json(401, {
      success: false,
      error: 'Usuário ou senha inválidos.',
    })
  }

  // Reset de falhas de login após sucesso
  user.set('failed_login_attempts', 0)
  user.set('locked_until', '')
  $app.save(user)

  // 3. Regra MFA: Homologação vs Produção & Test Users
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

  let expectedOtp = ''
  let mfaMode = 'REAL_OTP'

  if (isHomologation && isTestUser) {
    expectedOtp = '123456'
    mfaMode = 'TEST_FIXED'
  } else {
    // Gerar OTP aleatório seguro de 6 dígitos
    const randomNum = Math.floor(100000 + Math.random() * 900000)
    expectedOtp = String(randomNum)
    mfaMode = 'REAL_OTP'
  }

  // Hash seguro do OTP (SHA-256 + salt fixo ou HMAC)
  const otpSalt = 'ciafal_mfa_secret_salt_2025'
  const otpHash = $security.sha256(expectedOtp + ':' + email + ':' + otpSalt)

  // Criar challenge_id único
  const challengeId = 'mfa_' + $security.randomString(24) + '_' + Date.now()
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000) // 10 minutos

  try {
    const mfaCol = $app.findCollectionByNameOrId('mfa_challenges')
    const challengeRec = new Record(mfaCol)
    challengeRec.set('challenge_id', challengeId)
    challengeRec.set('user_id', user.id)
    challengeRec.set('email', email)
    challengeRec.set('otp_hash', otpHash)
    challengeRec.set('expires_at', expiresAt.toISOString())
    challengeRec.set('status', 'PENDING')
    challengeRec.set('environment', isHomologation ? 'HOMOLOGATION' : 'PRODUCTION')
    challengeRec.set('mode', mfaMode)
    challengeRec.set('attempts', 0)
    challengeRec.set('ip_address', e.requestInfo().headers['x-forwarded-for'] || '')
    $app.save(challengeRec)
  } catch (errMfa) {
    // Se tabela ainda não foi criada fisicamente
  }

  // Log de auditoria
  try {
    const auditCol = $app.findCollectionByNameOrId('auth_audit_logs')
    const logRec = new Record(auditCol)
    logRec.set('user_id', user.id)
    logRec.set('email', email)
    logRec.set('action', 'MFA_CHALLENGE_CREATED')
    logRec.set('status', 'SUCCESS')
    logRec.set('ip_address', e.requestInfo().headers['x-forwarded-for'] || '')
    logRec.set('user_agent', e.requestInfo().headers['user-agent'] || '')
    logRec.set('details', { challenge_id: challengeId, mode: mfaMode })
    $app.save(logRec)
  } catch (_) {}

  // Montar objeto seguro de usuário sem senhas ou segredos
  const rawRole = (user.getString('role') || 'VENDEDOR').toUpperCase()
  let normalizedRole = 'VENDEDOR'
  if (rawRole === 'ADMIN' || rawRole === 'ADMINISTRADOR') normalizedRole = 'ADMIN'
  else if (rawRole === 'SUPERVISOR') normalizedRole = 'SUPERVISOR'
  else if (rawRole === 'REPRESENTANTE_EXTERNO' || rawRole === 'REPRESENTANTE')
    normalizedRole = 'REPRESENTANTE_EXTERNO'
  else normalizedRole = rawRole

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
  }

  return e.json(200, {
    success: true,
    mfa_required: true,
    challenge_id: challengeId,
    mfa_mode: mfaMode,
    user: safeUser,
  })
})
