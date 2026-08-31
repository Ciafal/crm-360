import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'
import {
  isFixedTestOtpEnabled,
  HOMOLOGATION_ACCOUNTS,
  isOfficialTestAccount,
} from '@/services/mfa_service'

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
  account_id?: string
  department?: string
  cargo?: string
  profile?: string
  cost_center?: string
  manager_id?: string
  manager_name?: string
  [key: string]: any
}

interface AuthContextType {
  user: CiafalAuthUser | null
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
  const [user, setUser] = useState<CiafalAuthUser | null>(() => {
    try {
      const qasSession =
        localStorage.getItem('ciafal_crm_session') || localStorage.getItem('qas_session')
      if (qasSession) {
        const parsed = JSON.parse(qasSession)
        if (parsed && parsed.email) {
          const role = (parsed.role || 'VENDEDOR').toUpperCase()
          return { ...parsed, role }
        }
      }
    } catch {
      /* ignore parse error */
    }

    const rec = pb.authStore.record
    if (rec) {
      return {
        id: rec.id,
        email: rec.email,
        name: rec.name || 'Colaborador CIAFAL',
        role: (rec.role || 'ADMIN').toUpperCase(),
        employee_id: rec.employee_id,
        seller_code: rec.seller_code,
        ramal: rec.ramal,
        telefone_corporativo: rec.telefone_corporativo,
        active: rec.active !== false,
        is_test_user: rec.is_test_user === true,
      }
    }
    return null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Se existir sessão no localStorage, restaurá-la imediatamente
    const savedSession =
      localStorage.getItem('ciafal_crm_session') || localStorage.getItem('qas_session')
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession)
        if (parsed && parsed.email) {
          const email = (parsed.email || '').trim().toLowerCase()
          // Se for usuário oficial de homologação, garantir perfil canônico restrito
          if (HOMOLOGATION_ACCOUNTS[email]) {
            const acc = HOMOLOGATION_ACCOUNTS[email]
            const safeUser: CiafalAuthUser = {
              id: acc.id,
              email: email,
              name: acc.name,
              role: acc.role,
              employee_id: acc.employee_id,
              seller_code: acc.seller_code,
              ramal: acc.ramal,
              telefone_corporativo: acc.telefone_corporativo,
              active: true,
              is_test_user: true,
              environment: 'HOMOLOGAÇÃO',
            }
            setUser(safeUser)
          } else {
            const role = (parsed.role || 'VENDEDOR').toUpperCase()
            setUser({ ...parsed, role })
          }
          setLoading(false)
          return
        }
      } catch {
        /* ignore parse error */
      }
    }

    // 2. Se houver backend PocketBase configurado e token JWT, validar sessão ativa via backend
    const hasConfiguredBackend = Boolean(
      pb.baseUrl && pb.baseUrl !== '/' && pb.baseUrl !== window?.location?.origin,
    )
    const token = localStorage.getItem('ciafal_jwt_token')
    if (hasConfiguredBackend && token) {
      pb.send('/backend/v1/auth/me', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res: any) => {
          if (res?.authenticated && res?.user) {
            const safeUser: CiafalAuthUser = {
              ...res.user,
              role: (res.user.role || 'VENDEDOR').toUpperCase(),
            }
            setUser(safeUser)
            localStorage.setItem('ciafal_crm_session', JSON.stringify(safeUser))
          }
        })
        .catch(() => {
          // Em caso de falha de token expirado
        })
    }

    // 3. Se houver autenticação PocketBase nativa
    let unsubscribe = () => {}
    if (hasConfiguredBackend) {
      unsubscribe = pb.authStore.onChange((_token, record) => {
        if (record) {
          const mappedRole = (record.role || 'ADMIN').toUpperCase()
          setUser({
            id: record.id,
            email: record.email,
            name: record.name || 'Colaborador CIAFAL',
            role: mappedRole,
            employee_id: record.employee_id,
            seller_code: record.seller_code,
            ramal: record.ramal,
            telefone_corporativo: record.telefone_corporativo,
            active: record.active !== false,
            is_test_user: record.is_test_user === true,
          })
        } else {
          const fallback = localStorage.getItem('ciafal_crm_session')
          if (fallback) {
            try {
              const parsed = JSON.parse(fallback)
              setUser(parsed)
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
            setUser({
              id: rec.id,
              email: rec.email,
              name: rec.name || 'Colaborador CIAFAL',
              role: mappedRole,
              employee_id: rec.employee_id,
              seller_code: rec.seller_code,
              ramal: rec.ramal,
              telefone_corporativo: rec.telefone_corporativo,
              active: rec.active !== false,
              is_test_user: rec.is_test_user === true,
            })
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

    // Se já recebemos o usuário autenticado e autorizado (após validação de MFA)
    if (preValidatedUser) {
      // Se for uma conta oficial de homologação, garantir role e dados canônicos da tabela autoritativa
      let authUser: CiafalAuthUser
      if (HOMOLOGATION_ACCOUNTS[normalizedEmail]) {
        const acc = HOMOLOGATION_ACCOUNTS[normalizedEmail]
        authUser = {
          id: acc.id,
          email: normalizedEmail,
          name: acc.name,
          role: acc.role,
          employee_id: acc.employee_id,
          seller_code: acc.seller_code,
          ramal: acc.ramal,
          telefone_corporativo: acc.telefone_corporativo,
          active: true,
          is_test_user: true,
          environment: 'HOMOLOGAÇÃO',
        }
      } else {
        authUser = {
          id: preValidatedUser.id || `usr-${normalizedEmail.split('@')[0]}`,
          email: normalizedEmail,
          name: preValidatedUser.name || 'Usuário CIAFAL',
          role: (preValidatedUser.role || 'VENDEDOR').toUpperCase(),
          employee_id: preValidatedUser.employee_id,
          seller_code: preValidatedUser.seller_code,
          ramal: preValidatedUser.ramal,
          telefone_corporativo: preValidatedUser.telefone_corporativo,
          active: true,
          is_test_user:
            preValidatedUser.is_test_user === true || isOfficialTestAccount(normalizedEmail),
          environment: isFixedTestOtpEnabled() ? 'HOMOLOGAÇÃO' : 'PRODUÇÃO',
        }
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

    // Fluxo de autenticação via PocketBase SDK se houver backend configurado
    const hasConfiguredBackend = Boolean(
      pb.baseUrl && pb.baseUrl !== '/' && pb.baseUrl !== window?.location?.origin,
    )
    if (hasConfiguredBackend) {
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

    return { error: new Error('Usuário ou senha inválidos.') }
  }

  const resetPassword = async (email: string) => {
    const normalizedEmail = (email || '').trim().toLowerCase()
    const isTestDomain =
      normalizedEmail.endsWith('@ciafal.local') || normalizedEmail.endsWith('@crm360.local')

    if (isTestDomain) {
      return { error: null }
    }

    const hasConfiguredBackend = Boolean(
      pb.baseUrl && pb.baseUrl !== '/' && pb.baseUrl !== window?.location?.origin,
    )
    if (hasConfiguredBackend) {
      try {
        await pb.collection('users').requestPasswordReset(email)
        return { error: null }
      } catch (error: any) {
        return { error }
      }
    }
    return { error: null }
  }

  const signOut = () => {
    const hasConfiguredBackend = Boolean(
      pb.baseUrl && pb.baseUrl !== '/' && pb.baseUrl !== window?.location?.origin,
    )
    if (hasConfiguredBackend) {
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
