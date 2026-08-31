// pocketbase/hooks/auth_verify_mfa.js
// POST /backend/v1/auth/verify-mfa
// Valida o código OTP (tratado estritamente como string), invalida o challenge e emite sessão/JWT

routerAdd('POST', '/backend/v1/auth/verify-mfa', (e) => {
  const body = e.requestInfo().body || {}
  const rawEmail = (body.email || '').toString().trim().toLowerCase()
  const rawOtp = (body.otp || '').toString().trim()
  const challengeToken = (body.challenge_id || '').toString().trim()

  if (!rawEmail || !rawOtp) {
    return e.json(400, {
      authenticated: false,
      error: 'Código de verificação inválido.',
    })
  }

  // Validação estrita de formato: exatamente 6 dígitos numéricos
  if (rawOtp.length !== 6 || !/^\d{6}$/.test(rawOtp)) {
    return e.json(400, {
      authenticated: false,
      error: 'Código de verificação inválido.',
    })
  }

  // 1. Detecção de ambiente
  const envVar = ($os.getenv('APP_ENV') || $secrets.get('APP_ENV') || '')
    .toString()
    .trim()
    .toLowerCase()
  const isProduction = envVar === 'production' || envVar === 'prod'
  const isHomologation = !isProduction

  // 2. Busca do usuário
  let authRecord = null
  try {
    authRecord = $app.findAuthRecordByEmail('_pb_users_auth_', rawEmail)
  } catch (_) {}

  if (!authRecord) {
    return e.json(401, {
      authenticated: false,
      error: 'Usuário ou senha inválidos.',
    })
  }

  const isTestDomain = rawEmail.endsWith('@ciafal.local') || rawEmail.endsWith('@crm360.local')
  const isTestUser = authRecord.get('is_test_user') === true || isTestDomain

  // 3. Validação do MFA Challenge
  let challengeRec = null
  if (challengeToken) {
    try {
      challengeRec = $app.findFirstRecordByData('mfa_challenges', 'challenge_token', challengeToken)
    } catch (_) {}
  }

  if (!challengeRec) {
    // Buscar challenge PENDING mais recente para o email
    try {
      const records = $app.findRecordsByFilter(
        'mfa_challenges',
        "email = '" + rawEmail + "' && status = 'PENDING'",
        '-created',
        1,
        0,
      )
      if (records && records.length > 0) {
        challengeRec = records[0]
      }
    } catch (_) {}
  }

  let isValidOtp = false

  if (challengeRec) {
    const attempts = challengeRec.getInt('attempts') || 0
    if (attempts >= 5) {
      challengeRec.set('status', 'LOCKED')
      $app.save(challengeRec)
      return e.json(429, {
        authenticated: false,
        error:
          'Limite de tentativas de MFA excedido. Por segurança, tente novamente em 15 minutos.',
      })
    }

    // Verificar se expirou
    const expiresAtStr = challengeRec.getString('expires_at')
    if (expiresAtStr && new Date(expiresAtStr).getTime() < Date.now()) {
      challengeRec.set('status', 'EXPIRED')
      $app.save(challengeRec)
      return e.json(400, {
        authenticated: false,
        error: 'O código expirou. Solicite um novo código.',
      })
    }

    // Validação do hash do OTP
    const expectedHash = challengeRec.getString('otp_hash')
    const token = challengeRec.getString('challenge_token')
    const calculatedHash = $security.sha256(rawOtp + token)

    if (expectedHash && expectedHash === calculatedHash) {
      isValidOtp = true
    } else if (isHomologation && isTestUser && rawOtp === '123456') {
      // Em homologação para usuários de teste
      isValidOtp = true
    } else {
      challengeRec.set('attempts', attempts + 1)
      $app.save(challengeRec)
    }
  } else {
    // Se não há challenge no banco, mas estamos em homologação com usuário de teste
    if (isHomologation && isTestUser && rawOtp === '123456') {
      isValidOtp = true
    }
  }

  // Em produção explícita, nunca aceitar OTP se falhou
  if (!isValidOtp) {
    return e.json(400, {
      authenticated: false,
      error: 'Código de verificação inválido.',
    })
  }

  // 4. Marcar challenge como USED
  if (challengeRec) {
    try {
      challengeRec.set('status', 'USED')
      challengeRec.set('used_at', new Date().toISOString())
      $app.save(challengeRec)
    } catch (_) {}
  }

  // 5. Gerar token JWT de sessão autenticada (duração 24 horas)
  const jwtSecret =
    $os.getenv('AUTH_JWT_SECRET') ||
    $secrets.get('AUTH_JWT_SECRET') ||
    'ciafal_secure_mfa_jwt_secret_token_2025'
  const jwtPayload = {
    sub: authRecord.id,
    email: rawEmail,
    role: (authRecord.getString('role') || 'VENDEDOR').toUpperCase(),
    name: authRecord.getString('name') || 'Colaborador CIAFAL',
    exp: Math.floor(Date.now() / 1000) + 24 * 3600,
  }
  const sessionToken = $security.createJWT(jwtPayload, jwtSecret, 24 * 3600)

  // 6. Dados seguros do usuário para a sessão do frontend
  const safeUser = {
    id: authRecord.id,
    email: authRecord.email(),
    name: authRecord.getString('name') || 'Colaborador CIAFAL',
    role: (authRecord.getString('role') || 'VENDEDOR').toUpperCase(),
    employee_id: authRecord.getString('employee_id') || '',
    seller_code: authRecord.getString('seller_code') || '',
    ramal: authRecord.getString('ramal') || '',
    telefone_corporativo: authRecord.getString('telefone_corporativo') || '',
    active: authRecord.get('active') !== false,
    is_test_user: authRecord.get('is_test_user') === true,
  }

  return e.json(200, {
    authenticated: true,
    token: sessionToken,
    user: safeUser,
    message: 'Acesso autorizado.',
  })
})
