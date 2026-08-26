// Endpoint para validar OTP Mock de MFA
// POST /api/auth/mfa/verify-otp

routerAdd('POST', '/api/auth/mfa/verify-otp', (e) => {
  const body = e.requestInfo().body || {}
  const email = (body.email || '').trim().toLowerCase()
  const code = (body.code || '').trim()

  if (!email || !code) {
    return e.json(400, { error: 'E-mail e código OTP são obrigatórios' })
  }

  try {
    const records = $app.findRecordsByFilter(
      'mock_emails',
      `recipient = {:email} && status = 'VALID'`,
      '-created',
      5,
      0,
    )

    let matching = null
    const now = new Date().getTime()

    for (let i = 0; i < records.length; i++) {
      const r = records[i]
      const expStr = r.getString('expires_at')
      const expTime = expStr ? new Date(expStr).getTime() : 0

      if (expTime > 0 && expTime < now) {
        r.set('status', 'EXPIRED')
        $app.save(r)
        continue
      }

      if (r.getString('otp_code') === code) {
        matching = r
        break
      }
    }

    if (!matching) {
      return e.json(400, {
        valid: false,
        error: 'Código de verificação incorreto ou expirado.',
      })
    }

    // Marca como usado
    matching.set('status', 'USED')
    $app.save(matching)

    return e.json(200, {
      valid: true,
      message: 'MFA validado com sucesso.',
    })
  } catch (err) {
    return e.json(500, { error: 'Erro ao validar código OTP: ' + err })
  }
})
