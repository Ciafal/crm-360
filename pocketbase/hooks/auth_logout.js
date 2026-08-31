routerAdd('POST', '/backend/v1/auth/logout', (e) => {
  const authHeader = e.requestInfo().headers['authorization'] || ''
  let token = ''

  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim()
  }

  if (token) {
    const jwtSecret = $secrets.get('JWT_SECRET') || 'ciafal_crm_session_jwt_secret_key_2025'
    try {
      const payload = $security.parseJWT(token, jwtSecret)
      if (payload && payload.session_id) {
        try {
          const sess = $app.findFirstRecordByData('sessions', 'session_id', payload.session_id)
          if (sess) {
            sess.set('is_active', false)
            $app.save(sess)
          }
        } catch (_) {}

        try {
          const auditCol = $app.findCollectionByNameOrId('auth_audit_logs')
          const logRec = new Record(auditCol)
          logRec.set('user_id', payload.sub || null)
          logRec.set('email', payload.email || '')
          logRec.set('action', 'LOGOUT')
          logRec.set('status', 'SUCCESS')
          logRec.set('ip_address', e.requestInfo().headers['x-forwarded-for'] || '')
          logRec.set('user_agent', e.requestInfo().headers['user-agent'] || '')
          logRec.set('details', { session_id: payload.session_id })
          $app.save(logRec)
        } catch (_) {}
      }
    } catch (_) {}
  }

  return e.json(200, {
    success: true,
    message: 'Logout realizado com sucesso.',
  })
})
