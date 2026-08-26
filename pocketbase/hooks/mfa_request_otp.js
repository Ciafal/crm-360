// Endpoint para gerar ou enviar OTP Mock para Representante Externo
// POST /api/auth/mfa/request-otp

routerAdd('POST', '/api/auth/mfa/request-otp', (e) => {
  const body = e.requestInfo().body || {}
  const email = (body.email || '').trim().toLowerCase()

  if (!email) {
    return e.json(400, { error: 'E-mail obrigatório' })
  }

  // Gera OTP de 6 dígitos aleatórios
  const randomNum = Math.floor(100000 + Math.random() * 900000)
  const otpCode = String(randomNum)

  // Expira em 10 minutos
  const now = new Date()
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString()

  try {
    const col = $app.findCollectionByNameOrId('mock_emails')
    const record = new Record(col)
    record.set('recipient', email)
    record.set('subject', 'Seu código de acesso MFA — CRM 360º')
    record.set('otp_code', otpCode)
    record.set('status', 'VALID')
    record.set('expires_at', expiresAt)
    record.set('metadata_json', { purpose: 'MFA_LOGIN', channel: 'MOCK_EMAIL' })
    $app.save(record)

    return e.json(200, {
      success: true,
      message: 'Código de verificação gerado e enviado para a caixa de e-mail.',
      // ATENÇÃO: NUNCA retornar o OTP code aqui no payload de login
    })
  } catch (err) {
    return e.json(500, { error: 'Erro ao gerar OTP: ' + err })
  }
})
