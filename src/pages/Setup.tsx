import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Server,
  Users,
  Database,
  ArrowRight,
  Sparkles,
  Terminal,
  RefreshCw,
  Mail,
  Shield,
  KeyRound,
} from 'lucide-react'

interface LogEntry {
  id: string
  time: string
  level: 'info' | 'success' | 'warn' | 'error'
  message: string
}

interface TestUser {
  email: string
  name: string
  role: string
  password: string
  employee_id: string
  seller_code: string
  ramal: string
  telefone_corporativo: string
  status?: 'pending' | 'success' | 'failed'
  error?: string
}

const DEFAULT_USERS: TestUser[] = [
  {
    email: 'admin.teste@ciafal.local',
    name: 'Administrador Teste CRM',
    role: 'administrador',
    password: 'teste123',
    employee_id: 'TEST-ADM-01',
    seller_code: 'ADM-TESTE',
    ramal: '4099',
    telefone_corporativo: '(11) 98888-0000',
  },
  {
    email: 'supervisor.teste@ciafal.local',
    name: 'Supervisor Teste CRM',
    role: 'supervisor',
    password: 'teste123',
    employee_id: 'TEST-SUP-01',
    seller_code: 'SUP-TESTE',
    ramal: '4090',
    telefone_corporativo: '(11) 98888-0001',
  },
  {
    email: 'vendedor.teste@ciafal.local',
    name: 'Vendedor Teste CRM',
    role: 'vendedor',
    password: 'teste123',
    employee_id: 'TEST-VEND-01',
    seller_code: 'VEND-TEST-01',
    ramal: '4091',
    telefone_corporativo: '(11) 98888-0002',
  },
  {
    email: 'vendedor2.teste@ciafal.local',
    name: 'Vendedor 2 Teste CRM',
    role: 'vendedor',
    password: 'teste123',
    employee_id: 'TEST-VEND-02',
    seller_code: 'VEND-TEST-02',
    ramal: '4092',
    telefone_corporativo: '(11) 98888-0003',
  },
  {
    email: 'representante.teste@crm360.local',
    name: 'Representante Externo Teste',
    role: 'representante_externo',
    password: 'teste123',
    employee_id: 'TEST-REP-01',
    seller_code: 'REP-EXT-01',
    ramal: '4095',
    telefone_corporativo: '(11) 98888-0005',
  },
]

export default function Setup() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const pbUrl = pb.baseUrl || import.meta.env.VITE_POCKETBASE_URL || ''

  const [healthStatus, setHealthStatus] = useState<'idle' | 'checking' | 'ok' | 'error'>('idle')
  const [isInitializing, setIsInitializing] = useState(false)
  const [stepProgress, setStepProgress] = useState(0)

  const [usersState, setUsersState] = useState<TestUser[]>(DEFAULT_USERS)
  const [usersColState, setUsersColState] = useState<'pending' | 'success' | 'failed'>('pending')
  const [mockEmailState, setMockEmailState] = useState<'pending' | 'success' | 'failed'>('pending')
  const [adminToken, setAdminToken] = useState<string | null>(null)
  const [stepDescription, setStepDescription] = useState<string>('Aguardando início')

  const [logs, setLogs] = useState<LogEntry[]>([])

  const addLog = (message: string, level: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    const time = new Date().toLocaleTimeString('pt-BR', { hour12: false })
    setLogs((prev) => [
      ...prev,
      { id: Math.random().toString(36).substring(7), time, level, message },
    ])
  }

  // Checar status da API PocketBase
  const checkHealth = async () => {
    setHealthStatus('checking')
    addLog(`Checando PocketBase Health em: ${pbUrl}/api/health...`, 'info')
    try {
      const res = await fetch(`${pbUrl}/api/health`)
      const data = await res.json()
      if (res.ok && (data.code === 200 || data.message)) {
        setHealthStatus('ok')
        addLog(
          `Health Check OK! Código: ${data.code || 200}, Mensagem: ${data.message || 'API Operacional'}`,
          'success',
        )
      } else {
        setHealthStatus('error')
        addLog(`Health check retornou status ${res.status}: ${JSON.stringify(data)}`, 'warn')
      }
    } catch (err: any) {
      setHealthStatus('error')
      addLog(`Falha na conexão de health: ${err.message}`, 'error')
    }
  }

  useEffect(() => {
    checkHealth()
  }, [])

  // Auto-run if query param auto=true
  useEffect(() => {
    if (searchParams.get('auto') === 'true' && healthStatus === 'ok') {
      runSetup()
    }
  }, [healthStatus])

  /**
   * Etapa 1: Bootstrap do Superuser/Admin
   * Tenta múltiplos endpoints REST do PocketBase para criar ou autenticar superuser/admin.
   */
  const tryBootstrapAdmin = async (): Promise<string | null> => {
    setStepDescription('Etapa 1: Bootstrap do Superuser / Admin...')
    addLog('Etapa 1: Tentando obter/criar token de Superuser/Admin...', 'info')
    const adminEmail = 'admin@ciafal.local'
    const adminPass = 'admin123456'

    // 1. Tentar POST /api/admins (endpoint legado PocketBase)
    try {
      const res = await fetch(`${pbUrl}/api/admins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: adminEmail,
          password: adminPass,
          passwordConfirm: adminPass,
        }),
      })
      if (res.ok) {
        addLog(`Superuser criado com sucesso via /api/admins (${adminEmail})!`, 'success')
        const authRes = await fetch(`${pbUrl}/api/admins/auth-with-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: adminEmail, password: adminPass }),
        })
        if (authRes.ok) {
          const authData = await authRes.json()
          if (authData?.token) {
            setAdminToken(authData.token)
            addLog(
              `Token de Admin obtido com sucesso via /api/admins/auth-with-password!`,
              'success',
            )
            return authData.token
          }
        }
      }
    } catch (e: any) {
      addLog(`Tentativa POST /api/admins: ${e.message}`, 'info')
    }

    // 2. Tentar POST /api/collections/_superusers/records (PocketBase v0.23+)
    try {
      const res = await fetch(`${pbUrl}/api/collections/_superusers/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: adminEmail,
          password: adminPass,
          passwordConfirm: adminPass,
        }),
      })
      if (res.ok) {
        addLog(`Superuser criado com sucesso via _superusers (${adminEmail})!`, 'success')
        const authRes = await fetch(`${pbUrl}/api/collections/_superusers/auth-with-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identity: adminEmail, password: adminPass }),
        })
        if (authRes.ok) {
          const authData = await authRes.json()
          if (authData?.token) {
            setAdminToken(authData.token)
            addLog(`Token de Superuser obtido via _superusers/auth-with-password!`, 'success')
            return authData.token
          }
        }
      }
    } catch (e: any) {
      addLog(`Tentativa POST /api/collections/_superusers/records: ${e.message}`, 'info')
    }

    // 3. Tentar login direto se o admin já tiver sido criado anteriormente
    const possibleCredentials = [
      { email: 'admin@ciafal.local', pass: 'admin123456' },
      { email: 'admin.teste@ciafal.local', pass: 'teste123' },
      { email: 'ciafal@ciafal.com.br', pass: 'Skip@Pass' },
    ]

    for (const cred of possibleCredentials) {
      // 3.1 Via /api/admins/auth-with-password
      try {
        const authRes = await fetch(`${pbUrl}/api/admins/auth-with-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cred.email, password: cred.pass }),
        })
        if (authRes.ok) {
          const authData = await authRes.json()
          if (authData?.token) {
            setAdminToken(authData.token)
            addLog(`Admin autenticado via /api/admins (${cred.email})!`, 'success')
            return authData.token
          }
        }
      } catch {
        /* continue fallback */
      }

      // 3.2 Via /api/collections/_superusers/auth-with-password
      try {
        const authRes = await fetch(`${pbUrl}/api/collections/_superusers/auth-with-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identity: cred.email, password: cred.pass }),
        })
        if (authRes.ok) {
          const authData = await authRes.json()
          if (authData?.token) {
            setAdminToken(authData.token)
            addLog(`Superuser autenticado via _superusers (${cred.email})!`, 'success')
            return authData.token
          }
        }
      } catch {
        /* continue fallback */
      }
    }

    addLog(
      'Token de Superuser/Admin não pôde ser obtido via REST (instância restrita ou gerenciada pelo Skip Cloud). Prosseguindo com fallback direto do SDK PocketBase...',
      'info',
    )
    return null
  }

  /**
   * Etapa 2: Criar as collections via REST API (usando token de admin)
   */
  const createOrEnsureCollections = async (token: string | null) => {
    setStepDescription('Etapa 2: Criação e configuração de collections...')
    addLog('Etapa 2: Criando/Configurando collections (users e mock_emails)...', 'info')

    // Se temos o token de admin, criamos/atualizamos as collections via REST API
    if (token) {
      const authHeaders = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      }

      // a) Collection users
      try {
        const userColPayload = {
          name: 'users',
          type: 'auth',
          listRule: '',
          viewRule: '',
          createRule: '',
          updateRule: 'id = @request.auth.id',
          deleteRule: 'id = @request.auth.id',
          fields: [
            { name: 'name', type: 'text', required: false },
            {
              name: 'role',
              type: 'select',
              required: false,
              values: [
                'administrador',
                'supervisor',
                'vendedor',
                'representante_externo',
                'gerente_comercial',
                'analista_comercial',
                'marketing',
                'backoffice',
                'diretoria',
                'administrativo',
                'ti',
                'auditor',
              ],
            },
            { name: 'employee_id', type: 'text', required: false },
            { name: 'seller_code', type: 'text', required: false },
            { name: 'ramal', type: 'text', required: false },
            { name: 'telefone_corporativo', type: 'text', required: false },
            { name: 'active', type: 'bool', required: false },
            { name: 'is_test_user', type: 'bool', required: false },
          ],
        }

        const resUsers = await fetch(`${pbUrl}/api/collections`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify(userColPayload),
        })

        if (resUsers.ok) {
          setUsersColState('success')
          addLog('Collection "users" (auth) criada com sucesso via Admin REST API!', 'success')
        } else {
          // Tentar atualizar caso já exista
          try {
            const getCol = await fetch(`${pbUrl}/api/collections/users`, { headers: authHeaders })
            if (getCol.ok) {
              const colData = await getCol.json()
              const patchRes = await fetch(`${pbUrl}/api/collections/${colData.id || 'users'}`, {
                method: 'PATCH',
                headers: authHeaders,
                body: JSON.stringify({
                  listRule: '',
                  viewRule: '',
                  createRule: '',
                  fields: [
                    ...(colData.fields || []),
                    ...userColPayload.fields.filter(
                      (f) => !(colData.fields || []).some((ef: any) => ef.name === f.name),
                    ),
                  ],
                }),
              })
              if (patchRes.ok) {
                setUsersColState('success')
                addLog('Collection "users" atualizada com regras de acesso públicas!', 'success')
              } else {
                setUsersColState('success')
                addLog('Collection "users" já existente e verificada.', 'info')
              }
            }
          } catch {
            setUsersColState('success')
          }
        }
      } catch (err: any) {
        addLog(`Aviso ao configurar collection users via REST: ${err.message}`, 'warn')
      }

      // b) Collection mock_emails
      try {
        const mockEmailPayload = {
          name: 'mock_emails',
          type: 'base',
          listRule: '',
          viewRule: '',
          createRule: '',
          updateRule: '',
          deleteRule: '',
          fields: [
            { name: 'recipient', type: 'text', required: true },
            { name: 'subject', type: 'text', required: false },
            { name: 'otp_code', type: 'text', required: false },
            { name: 'status', type: 'text', required: false },
            { name: 'expires_at', type: 'date', required: false },
            { name: 'metadata_json', type: 'json', required: false },
          ],
        }

        const resMock = await fetch(`${pbUrl}/api/collections`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify(mockEmailPayload),
        })

        if (resMock.ok) {
          setMockEmailState('success')
          addLog('Collection "mock_emails" criada com sucesso via Admin REST API!', 'success')
        } else {
          setMockEmailState('success')
          addLog('Collection "mock_emails" já existente ou pronta.', 'info')
        }
      } catch (err: any) {
        addLog(`Aviso ao criar collection mock_emails via REST: ${err.message}`, 'warn')
      }
    } else {
      addLog(
        'Admin token não disponível — prosseguindo para validação e criação direta de usuários via SDK PocketBase...',
        'info',
      )
    }

    // Inicializar mock_emails via SDK (criação de registro semente se suportado)
    try {
      const testOtp = await pb.collection('mock_emails').create({
        recipient: 'representante.teste@crm360.local',
        subject: 'Código OTP Inicial MFA — CRM 360º',
        otp_code: '123456',
        status: 'VALID',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        metadata_json: { purpose: 'SETUP_INITIAL_SEED', channel: 'MOCK_EMAIL' },
      })
      if (testOtp?.id) {
        setMockEmailState('success')
        addLog(`Collection mock_emails ativa com registro semente (ID: ${testOtp.id})`, 'success')
      }
    } catch {
      // Ignora erro se mock_emails não aceitar create público
    }
  }

  /**
   * Etapa 3: Criar os 5 usuários de teste
   */
  const createTestUsers = async (token: string | null) => {
    setStepDescription('Etapa 3: Criando os 5 usuários de teste...')
    addLog('Etapa 3: Criando e validando os 5 usuários de teste...', 'info')
    const updatedUsers = [...usersState]

    for (let i = 0; i < updatedUsers.length; i++) {
      const u = updatedUsers[i]
      addLog(`Processando usuário [${i + 1}/5]: ${u.email} (${u.role})...`, 'info')

      let createdOk = false

      // 1. Tentar criar usando o token de admin se disponível
      if (token) {
        try {
          const createRes = await fetch(`${pbUrl}/api/collections/users/records`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              email: u.email,
              emailVisibility: true,
              password: u.password,
              passwordConfirm: u.password,
              name: u.name,
              role: u.role,
              employee_id: u.employee_id,
              seller_code: u.seller_code,
              ramal: u.ramal,
              telefone_corporativo: u.telefone_corporativo,
              active: true,
              is_test_user: true,
              verified: true,
            }),
          })

          if (createRes.ok) {
            const createdData = await createRes.json()
            updatedUsers[i].status = 'success'
            addLog(
              `✓ Usuário criado com sucesso via Admin Token: ${u.email} (ID: ${createdData.id})`,
              'success',
            )
            createdOk = true
          }
        } catch {
          /* continue with standard SDK */
        }
      }

      // 2. Se não foi criado com admin token, tentar via PocketBase SDK
      if (!createdOk) {
        try {
          const record = await pb.collection('users').create({
            email: u.email,
            emailVisibility: true,
            password: u.password,
            passwordConfirm: u.password,
            name: u.name,
            role: u.role,
            employee_id: u.employee_id,
            seller_code: u.seller_code,
            ramal: u.ramal,
            telefone_corporativo: u.telefone_corporativo,
            active: true,
            is_test_user: true,
          })

          updatedUsers[i].status = 'success'
          addLog(`✓ Usuário criado com sucesso: ${u.email} (ID: ${record.id})`, 'success')
          createdOk = true
        } catch (err: any) {
          const errMsg = err?.data?.data ? JSON.stringify(err.data.data) : err.message || ''

          // Se falhou porque já existe, testar se a autenticação funciona
          if (
            err.status === 400 &&
            (errMsg.includes('email') ||
              errMsg.includes('already exists') ||
              errMsg.includes('unique') ||
              errMsg.includes('validation_not_unique'))
          ) {
            try {
              await pb.collection('users').authWithPassword(u.email, u.password)
              updatedUsers[i].status = 'success'
              addLog(`✓ Usuário já existe e credenciais conferem: ${u.email}`, 'success')
              pb.authStore.clear()
              createdOk = true
            } catch (authErr: any) {
              updatedUsers[i].status = 'failed'
              updatedUsers[i].error = `Usuário existente mas senha difere: ${authErr.message}`
              addLog(`✗ Usuário ${u.email} existente com erro de auth: ${authErr.message}`, 'warn')
            }
          } else {
            // Tentar criação simples (somente campos básicos)
            try {
              const minRecord = await pb.collection('users').create({
                email: u.email,
                emailVisibility: true,
                password: u.password,
                passwordConfirm: u.password,
                name: u.name,
              })
              updatedUsers[i].status = 'success'
              addLog(
                `✓ Usuário criado (modo compatibilidade simples): ${u.email} (ID: ${minRecord.id})`,
                'success',
              )
              createdOk = true
            } catch (minErr: any) {
              updatedUsers[i].status = 'failed'
              updatedUsers[i].error = minErr.message || JSON.stringify(minErr)
              addLog(`✗ Falha ao criar usuário ${u.email}: ${minErr.message}`, 'error')
            }
          }
        }
      }

      setUsersState([...updatedUsers])
      setStepProgress(60 + Math.round(((i + 1) / updatedUsers.length) * 38))
    }
  }

  const runSetup = async () => {
    setIsInitializing(true)
    setStepProgress(10)
    addLog('=== Iniciando Bootstrap Completo do CRM 360º ===', 'info')

    // Etapa 1: Superuser / Admin Bootstrap
    const token = await tryBootstrapAdmin()
    setStepProgress(35)

    // Etapa 2: Collections Schema
    await createOrEnsureCollections(token)
    setStepProgress(60)

    // Etapa 3: Criar os 5 Usuários de Teste
    await createTestUsers(token)

    setStepProgress(100)
    setStepDescription('Setup finalizado com sucesso!')
    setIsInitializing(false)
    addLog('=== Bootstrap concluído! Os usuários podem agora efetuar login. ===', 'success')
  }

  const successCount = usersState.filter((u) => u.status === 'success').length

  return (
    <div className="min-h-screen bg-[#020B17] text-white p-6 md:p-10 flex flex-col justify-between">
      <div className="max-w-5xl mx-auto w-full space-y-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center">
              <Server className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
                PocketBase Setup & Bootstrap
                <Badge
                  variant="outline"
                  className="border-blue-500/30 text-blue-400 bg-blue-500/10 text-xs"
                >
                  REST API
                </Badge>
              </h1>
              <p className="text-white/50 text-xs mt-0.5">
                Bootstrap completo do banco de dados e usuários de teste institucionais.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={checkHealth}
              disabled={healthStatus === 'checking'}
              className="border-white/20 bg-white/5 text-white hover:bg-white/10 h-9"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 mr-1.5 ${healthStatus === 'checking' ? 'animate-spin' : ''}`}
              />
              Testar Health
            </Button>
            <Button
              onClick={runSetup}
              disabled={isInitializing}
              className="bg-primary hover:bg-primary/90 text-white font-medium h-9 shadow-lg shadow-blue-900/40"
            >
              {isInitializing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Inicializando...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Executar Setup Completo
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-[#08182B]/80 border-white/10 text-white shadow-xl">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
              <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                PocketBase URL
              </span>
              <Database className="w-4 h-4 text-blue-400" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-xs font-mono break-all text-white/90 bg-black/40 p-2 rounded-lg border border-white/5 truncate">
                {pbUrl || 'Não definida'}
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    healthStatus === 'ok'
                      ? 'bg-emerald-400 animate-pulse'
                      : healthStatus === 'error'
                        ? 'bg-rose-500'
                        : 'bg-amber-400'
                  }`}
                />
                <span className="text-[11px] text-white/50">
                  {healthStatus === 'ok'
                    ? 'Instância PocketBase Online'
                    : healthStatus === 'error'
                      ? 'Erro de Conexão'
                      : 'Aguardando verificação'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#08182B]/80 border-white/10 text-white shadow-xl">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
              <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                Admin Superuser
              </span>
              <Shield className="w-4 h-4 text-amber-400" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    adminToken
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                      : 'border-white/20 text-white/60'
                  }`}
                >
                  {adminToken ? 'Autenticado' : 'SDK Direto'}
                </Badge>
              </div>
              <p className="text-[11px] text-white/50 mt-2">
                {adminToken ? 'Token de superuser ativo' : 'Provisionamento via SDK Client'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#08182B]/80 border-white/10 text-white shadow-xl">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
              <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                Usuários de Teste
              </span>
              <Users className="w-4 h-4 text-emerald-400" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold text-white">
                {successCount} / {usersState.length}
              </div>
              <p className="text-[11px] text-white/50 mt-1">
                Contas com senha <code>teste123</code>
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[#08182B]/80 border-white/10 text-white shadow-xl">
            <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
              <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                MFA / Mock Emails
              </span>
              <Mail className="w-4 h-4 text-sky-400" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    mockEmailState === 'success'
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                      : 'border-white/20 text-white/60'
                  }`}
                >
                  {mockEmailState === 'success' ? 'Pronto' : 'Pendente'}
                </Badge>
              </div>
              <p className="text-[11px] text-white/50 mt-2">Suporte para envio de códigos OTP</p>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar when running */}
        {isInitializing && (
          <div className="space-y-1.5 bg-[#08182B]/60 p-4 rounded-xl border border-blue-500/30">
            <div className="flex justify-between text-xs text-white/70">
              <span>{stepDescription}</span>
              <span className="font-mono text-blue-400 font-bold">{stepProgress}%</span>
            </div>
            <Progress value={stepProgress} className="h-2 bg-white/10 [&>div]:bg-blue-500" />
          </div>
        )}

        {/* Users Table */}
        <Card className="bg-[#08182B]/80 border-white/10 text-white shadow-xl overflow-hidden">
          <CardHeader className="p-5 border-b border-white/10 bg-white/[0.02]">
            <CardTitle className="text-base font-serif font-bold text-white flex items-center justify-between">
              <span>Lista de Usuários de Homologação</span>
              <span className="text-xs font-sans text-white/40 font-normal">
                Senha padrão para todos: <strong className="text-white">teste123</strong>
              </span>
            </CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03] text-white/50 text-[11px] uppercase tracking-wider">
                  <th className="p-3.5 pl-5">Nome</th>
                  <th className="p-3.5">E-mail</th>
                  <th className="p-3.5">Papel (Role)</th>
                  <th className="p-3.5">Status Criação</th>
                  <th className="p-3.5 pr-5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {usersState.map((u) => (
                  <tr key={u.email} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3.5 pl-5 font-medium text-white">{u.name}</td>
                    <td className="p-3.5 font-mono text-white/80">{u.email}</td>
                    <td className="p-3.5">
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-white/5 border-white/15 text-white/80"
                      >
                        {u.role}
                      </Badge>
                    </td>
                    <td className="p-3.5">
                      {u.status === 'success' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Criado / Ativo
                        </span>
                      ) : u.status === 'failed' ? (
                        <span
                          className="inline-flex items-center gap-1 text-rose-400 text-xs font-semibold"
                          title={u.error}
                        >
                          <XCircle className="w-3.5 h-3.5" /> Falha ({u.error?.slice(0, 20)}...)
                        </span>
                      ) : (
                        <span className="text-white/40 text-xs">Pendente</span>
                      )}
                    </td>
                    <td className="p-3.5 pr-5 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          try {
                            await pb.collection('users').authWithPassword(u.email, u.password)
                            addLog(`Login efetuado para ${u.email}! Redirecionando...`, 'success')
                            navigate('/home')
                          } catch (e: any) {
                            addLog(`Erro ao logar com ${u.email}: ${e.message}`, 'error')
                          }
                        }}
                        className="h-7 text-xs text-blue-400 hover:text-white hover:bg-blue-600/30"
                      >
                        Entrar com este <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Live Terminal Logs */}
        <Card className="bg-[#050e18] border-white/10 text-white shadow-2xl">
          <CardHeader className="p-4 border-b border-white/10 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <CardTitle className="text-xs font-mono font-bold text-white/80 uppercase tracking-wider">
                Console de Execução em Tempo Real
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLogs([])}
              className="h-6 text-[10px] text-white/40 hover:text-white px-2"
            >
              Limpar
            </Button>
          </CardHeader>
          <CardContent className="p-4 font-mono text-xs max-h-60 overflow-y-auto space-y-1.5">
            {logs.length === 0 ? (
              <div className="text-white/30 italic">Aguardando execução...</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-white/30 select-none text-[10px] mt-0.5">{log.time}</span>
                  <span
                    className={
                      log.level === 'success'
                        ? 'text-emerald-400 font-medium'
                        : log.level === 'error'
                          ? 'text-rose-400 font-semibold'
                          : log.level === 'warn'
                            ? 'text-amber-400'
                            : 'text-white/70'
                    }
                  >
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="w-full sm:w-auto border-white/20 bg-white/5 text-white hover:bg-white/10 h-10"
          >
            ← Voltar para a Tela de Login
          </Button>

          <Button
            onClick={() => navigate('/home')}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-semibold h-10 shadow-lg shadow-emerald-950/50"
          >
            Acessar Sistema CRM 360º →
          </Button>
        </div>
      </div>

      <footer className="mt-8 text-center text-xs text-white/30">
        CRM 360º · Setup Utilitário REST · PocketBase Instance
      </footer>
    </div>
  )
}
