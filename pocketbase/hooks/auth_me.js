// pocketbase/hooks/auth_me.js
// GET /backend/v1/auth/me
// Retorna a sessão ativa a partir do cabeçalho Authorization: Bearer <token> ou pb_auth

routerAdd('GET', '/backend/v1/auth/me', (e) => {
  // 1. Tentar ler do e.auth (caso PocketBase nativo)
  if (e.auth) {
    const authRec = e.auth
    const safeUser = {
      id: authRec.id,
      email: authRec.email(),
      name: authRec.getString('name') || 'Colaborador CIAFAL',
      role: (authRec.getString('role') || 'VENDEDOR').toUpperCase(),
      employee_id: authRec.getString('employee_id') || '',
      seller_code: authRec.getString('seller_code') || '',
      ramal: authRec.getString('ramal') || '',
      telefone_corporativo: authRec.getString('telefone_corporativo') || '',
      active: authRec.get('active') !== false,
      is_test_user: authRec.get('is_test_user') === true,
    }

    return e.json(200, {
      authenticated: true,
      user: safeUser,
    })
  }

  // 2. Tentar validar via Authorization Bearer JWT
  const authHeader = (
    e.requestInfo().headers['authorization'] ||
    e.requestInfo().headers['Authorization'] ||
    ''
  )
    .toString()
    .trim()
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return e.json(401, {
      authenticated: false,
      error: 'Você não possui permissão para acessar este recurso.',
    })
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!token) {
    return e.json(401, {
      authenticated: false,
      error: 'Você não possui permissão para acessar este recurso.',
    })
  }

  const jwtSecret =
    $os.getenv('AUTH_JWT_SECRET') ||
    $secrets.get('AUTH_JWT_SECRET') ||
    'ciafal_secure_mfa_jwt_secret_token_2025'

  try {
    const payload = $security.parseJWT(token, jwtSecret)
    if (!payload || !payload.email) {
      return e.json(401, {
        authenticated: false,
        error: 'Você não possui permissão para acessar este recurso.',
      })
    }

    // Verificar se o usuário ainda existe e está ativo
    let authRecord = null
    try {
      authRecord = $app.findAuthRecordByEmail('_pb_users_auth_', payload.email)
    } catch (_) {}

    if (authRecord) {
      if (authRecord.get('active') === false) {
        return e.json(403, {
          authenticated: false,
          error: 'Você não possui permissão para acessar este recurso.',
        })
      }

      const safeUser = {
        id: authRecord.id,
        email: authRecord.email(),
        name: authRecord.getString('name') || payload.name || 'Colaborador CIAFAL',
        role: (authRecord.getString('role') || payload.role || 'VENDEDOR').toUpperCase(),
        employee_id: authRecord.getString('employee_id') || '',
        seller_code: authRecord.getString('seller_code') || '',
        ramal: authRecord.getString('ramal') || '',
        telefone_corporativo: authRecord.getString('telefone_corporativo') || '',
        active: authRecord.get('active') !== false,
        is_test_user: authRecord.get('is_test_user') === true,
      }

      return e.json(200, {
        authenticated: true,
        user: safeUser,
      })
    }

    // Se o payload do token estiver íntegro
    return e.json(200, {
      authenticated: true,
      user: {
        id: payload.sub || 'usr-jwt',
        email: payload.email,
        name: payload.name || 'Colaborador CIAFAL',
        role: (payload.role || 'VENDEDOR').toUpperCase(),
        active: true,
        is_test_user: payload.email.endsWith('.local'),
      },
    })
  } catch (errJwt) {
    return e.json(401, {
      authenticated: false,
      error: 'Você não possui permissão para acessar este recurso.',
    })
  }
})
