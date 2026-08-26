// Endpoint para listar os e-mails/OTPs mock (Apenas Administrador de Teste / Owner)
// GET /api/mock/emails

routerAdd('GET', '/api/mock/emails', (e) => {
  const auth = e.auth
  if (!auth) {
    return e.json(401, { error: 'Autenticação necessária' })
  }

  const role = auth.getString('role')
  const email = (auth.email() || '').toLowerCase()

  // Somente administrador ou admin de teste
  const isAdmin =
    role === 'administrador' ||
    role === 'ti' ||
    role === 'diretoria' ||
    email === 'admin.teste@ciafal.local' ||
    email === 'fabiano@adapta.org'

  if (!isAdmin) {
    return e.json(403, {
      error: 'Acesso restrito a Administradores de Teste.',
    })
  }

  try {
    const records = $app.findRecordsByFilter('mock_emails', '', '-created', 50, 0)

    const list = records.map((r) => ({
      id: r.id,
      recipient: r.getString('recipient'),
      subject: r.getString('subject'),
      otp_code: r.getString('otp_code'),
      status: r.getString('status'),
      expires_at: r.getString('expires_at'),
      metadata: r.get('metadata_json'),
      created: r.getString('created'),
      updated: r.getString('updated'),
    }))

    return e.json(200, { items: list })
  } catch (err) {
    return e.json(500, { error: 'Erro ao buscar e-mails mock: ' + err })
  }
})
