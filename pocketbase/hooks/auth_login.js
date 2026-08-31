// pocketbase/hooks/auth_login.js
// POST /backend/v1/auth/login
// Valida credenciais (email e senha), detecta ambiente e gera MFA challenge

routerAdd('POST', '/backend/v1/auth/login', (e) => {
  const body = e.requestInfo().body || {}
  const rawEmail = (body.email || '').toString().trim().toLowerCase()
  const rawPassword = (body.password || '').toString().trim()

  if (!rawEmail || !rawPassword) {
    return e.json(400, {
      success: false,
      error: 'Usuário ou senha inválidos.',
    })
  }

  // 1. Detecção de ambiente no BACKEND
  const envVar = ($os.getenv('APP_ENV') || $secrets.get('APP_ENV') || '')
    .toString()
    .trim()
    .toLowerCase()
  const isProduction = envVar === 'production' || envVar === 'prod'
  const isHomologation = !isProduction // Se não for produção explícita, trata como homologação para testes

  // 2. Busca do usuário na base de dados
  let authRecord = null
  try {
    authRecord = $app.findAuthRecordByEmail('_pb_users_auth_', rawEmail)
  } catch (_) {
    // Se não encontrou o usuário
  }

  // Se o usuário não existir no banco
  if (!authRecord) {
    return e.json(401, {
      success: false,
      error: 'Usuário ou senha inválidos.',
    })
  }

  // 3. Validação de senha segura via PocketBase validatePassword
  const passwordValid = authRecord.validatePassword(rawPassword)
  if (!passwordValid) {
    return e.json(401, {
      success: false,
      error: 'Usuário ou senha inválidos.',
    })
  }

  // Verificar se usuário está ativo
  const isActive = authRecord.get('active')
  if (isActive === false) {
    return e.json(403, {
      success: false,
      error: 'Usuário desativado ou sem permissão de acesso.',
    })
  }

  // 4. Determinação do modo MFA (TEST_FIXED para homologação dos 5 usuários de teste; REAL_OTP para produção/outros)
  const isTestDomain = rawEmail.endsWith('@ciafal.local') || rawEmail.endsWith('@crm360.local')
  const isTestUser = authRecord.get('is_test_user') === true || isTestDomain

  let mfaMode = 'REAL_OTP'
  let expectedOtp = ''

  if (isHomologation && isTestUser) {
    mfaMode = 'TEST_FIXED'
    expectedOtp = '123456'
  } else {
    mfaMode = 'REAL_OTP'
    // Gerar OTP aleatório de 6 dígitos numéricos
    const randomNum = Math.floor(100000 + Math.random() * 900000)
    expectedOtp = String(randomNum)
  }

  // 5. Criação do challenge MFA no backend
  const challengeToken = 'mfa_' + $security.randomString(32)
  const otpHash = $security.sha256(expectedOtp + challengeToken)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutos de expiração

  try {
    const mfaCol = $app.findCollectionByNameOrId('mfa_challenges')
    const challengeRec = new Record(mfaCol)
    challengeRec.set('user_id', authRecord.id)
    challengeRec.set('email', rawEmail)
    challengeRec.set('challenge_token', challengeToken)
    challengeRec.set('otp_hash', otpHash)
    challengeRec.set('mode', mfaMode)
    challengeRec.set('status', 'PENDING')
    challengeRec.set('attempts', 0)
    challengeRec.set('expires_at', expiresAt)
    $app.save(challengeRec)
  } catch (errCol) {
    // Fallback se mfa_challenges não tiver tabela dedicada
    try {
      $app
        .db()
        .newQuery(`
        INSERT INTO mfa_challenges (id, user_id, email, challenge_token, otp_hash, mode, status, attempts, expires_at, created, updated)
        VALUES ({:id}, {:userId}, {:email}, {:token}, {:hash}, {:mode}, 'PENDING', 0, {:expires}, datetime('now'), datetime('now'))
      `)
        .bind({
          id: 'ch_' + $security.randomString(15),
          userId: authRecord.id,
          email: rawEmail,
          token: challengeToken,
          hash: otpHash,
          mode: mfaMode,
          expires: expiresAt,
        })
        .execute()
    } catch (_) {}
  }

  // Em modo REAL_OTP, salvar/enviar OTP para o canal seguro / mock_emails
  if (mfaMode === 'REAL_OTP') {
    try {
      const mockCol = $app.findCollectionByNameOrId('mock_emails')
      const mockRec = new Record(mockCol)
      mockRec.set('recipient', rawEmail)
      mockRec.set('subject', 'Seu código de verificação MFA — CRM 360º CIAFAL')
      mockRec.set('otp_code', expectedOtp)
      mockRec.set('status', 'VALID')
      mockRec.set('expires_at', expiresAt)
      $app.save(mockRec)
    } catch (_) {}
  }

  // 6. Resposta sem expor senhas, hashes ou o código OTP
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
    success: true,
    mfa_required: true,
    challenge_id: challengeToken,
    mfa_mode: mfaMode,
    user: safeUser,
    expires_at: expiresAt,
  })
})
