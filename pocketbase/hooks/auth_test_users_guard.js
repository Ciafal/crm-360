// Hook: Verificação de Feature Flag e Autenticação de Usuários de Teste
// Se o usuário autenticado for um usuário de teste (@ciafal.local ou @crm360.local ou is_test_user=true),
// o login deve ser recusado caso ENABLE_TEST_USERS !== 'true' ou APP_ENV === 'production'

onRecordAuthRequest((e) => {
  const record = e.record
  if (!record) return

  const email = (record.email() || '').toLowerCase()
  const isTestAccount =
    email.endsWith('@ciafal.local') ||
    email.endsWith('@crm360.local') ||
    record.getBool('is_test_user') === true

  if (isTestAccount) {
    const enableTestUsers = ($os.getenv('ENABLE_TEST_USERS') || '').toLowerCase() === 'true'
    const appEnv = ($os.getenv('APP_ENV') || '').toLowerCase()

    if (!enableTestUsers || appEnv === 'production') {
      throw new ForbiddenError(
        'Ambiente de produção ou feature flag ENABLE_TEST_USERS desativada. Acesso de teste bloqueado.',
      )
    }
  }
})
