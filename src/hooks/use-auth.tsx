import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'
import { isFixedTestOtpEnabled, OFFICIAL_HOMOLOGATION_USERS } from '@/services/mfa_service'

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
  signIn: (email: string, password: string, preValidatedUser?: any) => Promise<{ error: any }>
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
    // 1. Tentar validar sessão ativa via GET /backend/v1/auth/me se houver token JWT
    const token = localStorage.getItem('ciafal_jwt_token')
    if (token) {
      pb.send('/backend/v1/auth/me', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res: any) => {
          if (res?.authenticated && res?.user) {
            setUser(res.user)
            localStorage.setItem('ciafal_crm_session', JSON.stringify(res.user))
          }
        })
        .catch(() => {
          // Em caso de falha do token, mantém sessão persistida em homologação ou limpa
        })
    }

    // 2. Se existir sessão no localStorage
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

    // 3. Se houver autenticação PocketBase padrão válida
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

  const signIn = async (email: string, password: string, preValidatedUser?: any) => {
    const normalizedEmail = (email || '').trim().toLowerCase()

    // Se já recebemos o usuário autenticado e autorizado do passo de verificação MFA
    if (preValidatedUser) {
      const authUser: CiafalAuthUser = {
        id: preValidatedUser.id || `usr-${normalizedEmail.split('@')[0]}`,
        email: normalizedEmail,
        name: preValidatedUser.name || 'Usuário CIAFAL',
        role: (preValidatedUser.role || 'VENDEDOR').toUpperCase(),
        employee_id: preValidatedUser.employee_id,
        seller_code: preValidatedUser.seller_code,
        ramal: preValidatedUser.ramal,
        telefone_corporativo: preValidatedUser.telefone_corporativo,
        active: true,
        is_test_user: Boolean(OFFICIAL_HOMOLOGATION_USERS[normalizedEmail]),
        environment: isFixedTestOtpEnabled() ? 'HOMOLOGAÇÃO' : 'PRODUÇÃO',
      }

      try {
        localStorage.setItem('ciafal_crm_session', JSON.stringify(authUser))
        localStorage.setItem('qas_session', JSON.stringify(authUser))
      } catch {
        /* ignore */
      }

      setUser(authUser)
      return { error: null }
    }

    const isTestDomain =
      normalizedEmail.endsWith('@ciafal.local') || normalizedEmail.endsWith('@crm360.local')
    const isTestPassword = password === 'teste123'

    // Para credenciais de teste homologação
    if (isTestDomain && isFixedTestOtpEnabled()) {
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
          role: (official.role || 'VENDEDOR').toUpperCase(),
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
    } catch {
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
      const token = localStorage.getItem('ciafal_jwt_token')
      if (token) {
        pb.send('/backend/v1/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {})
      }
    } catch {
      /* intentionally ignored */
    }

    try {
      localStorage.removeItem('ciafal_crm_session')
      localStorage.removeItem('qas_session')
      localStorage.removeItem('ciafal_jwt_token')
      sessionStorage.clear()
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
