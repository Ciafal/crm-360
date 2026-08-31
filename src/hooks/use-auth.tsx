import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'
import { isFixedTestOtpEnabled } from '@/services/mfa_service'

export interface CiafalAuthUser {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'SUPERVISOR' | 'VENDEDOR' | 'REPRESENTANTE_EXTERNO' | string
  employee_id?: string
  seller_code?: string
  ramal?: string
  telefone_corporativo?: string
  active?: boolean
  is_test_user?: boolean
  environment?: string
  avatar?: string
}

interface AuthContextType {
  user: any
  signUp: (
    name: string,
    email: string,
    password: string,
  ) => Promise<{ error: any; status?: number }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  resetPassword: (email: string) => Promise<{ error: any }>
  signOut: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

// Mapa unificado dos usuários oficiais de homologação
const OFFICIAL_HOMOLOGATION_USERS: Record<string, Partial<CiafalAuthUser>> = {
  'admin.teste@ciafal.local': {
    id: 'usr-admin-teste',
    name: 'Administrador Teste CRM',
    role: 'ADMIN',
    employee_id: 'TEST-ADM-01',
    seller_code: 'ADM-TESTE',
    ramal: '4099',
    telefone_corporativo: '(11) 98888-0000',
    active: true,
    is_test_user: true,
  },
  'supervisor.teste@ciafal.local': {
    id: 'usr-supervisor-teste',
    name: 'Supervisor Teste CRM',
    role: 'SUPERVISOR',
    employee_id: 'TEST-SUP-01',
    seller_code: 'SUP-TESTE',
    ramal: '4090',
    telefone_corporativo: '(11) 98888-0001',
    active: true,
    is_test_user: true,
  },
  'vendedor.teste@ciafal.local': {
    id: 'usr-vendedor-teste',
    name: 'Vendedor Teste CRM',
    role: 'VENDEDOR',
    employee_id: 'TEST-VEND-01',
    seller_code: 'VEND-TEST-01',
    ramal: '4091',
    telefone_corporativo: '(11) 98888-0002',
    active: true,
    is_test_user: true,
  },
  'vendedor2.teste@ciafal.local': {
    id: 'usr-vendedor2-teste',
    name: 'Vendedor 2 Teste CRM',
    role: 'VENDEDOR',
    employee_id: 'TEST-VEND-02',
    seller_code: 'VEND-TEST-02',
    ramal: '4092',
    telefone_corporativo: '(11) 98888-0003',
    active: true,
    is_test_user: true,
  },
  'representante.teste@crm360.local': {
    id: 'usr-rep-teste',
    name: 'Representante Externo Teste',
    role: 'REPRESENTANTE_EXTERNO',
    employee_id: 'TEST-REP-01',
    seller_code: 'REP-EXT-01',
    ramal: '4095',
    telefone_corporativo: '(11) 98888-0005',
    active: true,
    is_test_user: true,
  },
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(() => {
    try {
      const qasSession =
        localStorage.getItem('ciafal_crm_session') || localStorage.getItem('qas_session')
      if (qasSession) {
        const parsed = JSON.parse(qasSession)
        if (parsed) return parsed
      }
    } catch {
      /* ignore parse error */
    }

    const rec = pb.authStore.record
    if (rec && !rec.role) {
      return { ...rec, role: 'ADMIN' }
    }
    return rec
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Se existir sessão no localStorage
    const savedSession =
      localStorage.getItem('ciafal_crm_session') || localStorage.getItem('qas_session')
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession)
        if (parsed) {
          setUser(parsed)
          setLoading(false)
          return
        }
      } catch {
        /* ignore */
      }
    }

    // 2. Se houver autenticação PocketBase válida
    const unsubscribe = pb.authStore.onChange((_token, record) => {
      if (record) {
        const mappedRole = (record.role || 'ADMIN').toUpperCase()
        setUser({ ...record, role: mappedRole })
      } else {
        const fallback = localStorage.getItem('ciafal_crm_session')
        if (fallback) {
          try {
            setUser(JSON.parse(fallback))
          } catch {
            setUser(null)
          }
        } else {
          setUser(null)
        }
      }
    })

    if (pb.authStore.isValid) {
      pb.collection('users')
        .authRefresh()
        .then((authData) => {
          const rec = authData.record
          const mappedRole = (rec?.role || 'ADMIN').toUpperCase()
          setUser({ ...rec, role: mappedRole })
        })
        .catch(() => {
          if (!localStorage.getItem('ciafal_crm_session')) {
            pb.authStore.clear()
            setUser(null)
          }
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }

    return () => {
      unsubscribe()
    }
  }, [])

  const signUp = async (name: string, email: string, password: string) => {
    try {
      await pb.collection('users').create({ name, email, password, passwordConfirm: password })
      await pb.collection('users').authWithPassword(email, password)
      return { error: null }
    } catch (error: any) {
      return { error, status: error.status }
    }
  }

  const signIn = async (email: string, password: string) => {
    const normalizedEmail = (email || '').trim().toLowerCase()
    const isTestDomain =
      normalizedEmail.endsWith('@ciafal.local') || normalizedEmail.endsWith('@crm360.local')
    const isTestPassword = password === 'teste123'

    // Para credenciais de teste homologação
    if (isTestDomain) {
      if (isTestPassword) {
        const official = OFFICIAL_HOMOLOGATION_USERS[normalizedEmail] || {
          id: `usr-${normalizedEmail.split('@')[0]}`,
          name: 'Usuário Homologação',
          role: 'VENDEDOR',
        }

        const authUser: CiafalAuthUser = {
          id: official.id || `usr-${normalizedEmail.split('@')[0]}`,
          email: normalizedEmail,
          name: official.name || 'Usuário CRM',
          role: official.role || 'VENDEDOR',
          employee_id: official.employee_id,
          seller_code: official.seller_code,
          ramal: official.ramal,
          telefone_corporativo: official.telefone_corporativo,
          active: true,
          is_test_user: true,
          environment: 'HOMOLOGAÇÃO',
        }

        try {
          localStorage.setItem('ciafal_crm_session', JSON.stringify(authUser))
          localStorage.setItem('qas_session', JSON.stringify(authUser))
        } catch {
          /* ignore storage error */
        }

        setUser(authUser)

        // Tentar autenticar silenciosamente no PocketBase para token de API se existir
        try {
          await pb.collection('users').authWithPassword(email, password)
        } catch {
          /* PocketBase auth opcional em homologação */
        }

        return { error: null }
      } else {
        return { error: new Error('Usuário ou senha inválidos.') }
      }
    }

    // Fluxo padrão para usuários institucionais (@ciafal.com.br)
    try {
      const res = await pb.collection('users').authWithPassword(email, password)
      const rec = res.record
      const mappedRole = (rec?.role || 'VENDEDOR').toUpperCase()

      const authUser: CiafalAuthUser = {
        id: rec.id,
        email: rec.email,
        name: rec.name || rec.username || 'Colaborador CIAFAL',
        role: mappedRole,
        employee_id: rec.employee_id,
        seller_code: rec.seller_code,
        ramal: rec.ramal,
        telefone_corporativo: rec.telefone_corporativo,
        active: rec.active !== false,
        environment: isFixedTestOtpEnabled() ? 'HOMOLOGAÇÃO' : 'PRODUÇÃO',
      }

      try {
        localStorage.setItem('ciafal_crm_session', JSON.stringify(authUser))
      } catch {
        /* ignore */
      }

      setUser(authUser)
      return { error: null }
    } catch (error: any) {
      return { error: new Error('Usuário ou senha inválidos.') }
    }
  }

  const resetPassword = async (email: string) => {
    const normalizedEmail = (email || '').trim().toLowerCase()
    const isTestDomain =
      normalizedEmail.endsWith('@ciafal.local') || normalizedEmail.endsWith('@crm360.local')

    if (isTestDomain) {
      return { error: null }
    }

    try {
      await pb.collection('users').requestPasswordReset(email)
      return { error: null }
    } catch (error: any) {
      return { error }
    }
  }

  const signOut = () => {
    try {
      localStorage.removeItem('ciafal_crm_session')
      localStorage.removeItem('qas_session')
    } catch {
      /* ignore */
    }
    try {
      pb.authStore.clear()
    } catch {
      /* ignore */
    }
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, signUp, signIn, resetPassword, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
