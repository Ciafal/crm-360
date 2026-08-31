// pocketbase/hooks/auth_logout.js
// POST /backend/v1/auth/logout
// Invalida sessões e tokens no backend

routerAdd('POST', '/backend/v1/auth/logout', (e) => {
  const authHeader = (
    e.requestInfo().headers['authorization'] ||
    e.requestInfo().headers['Authorization'] ||
    ''
  )
    .toString()
    .trim()
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()

  if (token) {
    const jwtSecret =
      $os.getenv('AUTH_JWT_SECRET') ||
      $secrets.get('AUTH_JWT_SECRET') ||
      'ciafal_secure_mfa_jwt_secret_token_2025'
    try {
      const payload = $security.parseJWT(token, jwtSecret)
      if (payload && payload.email) {
        // Expirar challenges pendentes do usuário
        try {
          $app
            .db()
            .newQuery(
              "UPDATE mfa_challenges SET status = 'EXPIRED' WHERE email = {:email} AND status = 'PENDING'",
            )
            .bind({ email: payload.email })
            .execute()
        } catch (_) {}
      }
    } catch (_) {}
  }

  return e.json(200, {
    success: true,
    message: 'Sessão encerrada com sucesso.',
  })
})
