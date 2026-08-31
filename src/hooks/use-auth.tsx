/**
 * QAS AUTH BYPASS — TEMPORARY — MUST NEVER RUN IN PRODUCTION
 *
 * Módulo de Autenticação do CRM 360º CIAFAL.
 * Suporta o modo de homologação sem login (QAS Auth Bypass) quando ativado,
 * preservando integralmente o fluxo de autenticação real (signIn, signUp, resetPassword, MFA)
 * para reativação futura simples (apenas alterando AUTH_BYPASS_ENABLED=false).
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'
import { isFixedTestOtpEnabled } from '@/services/mfa_service'
import {
  QASProfile,
  QAS_PROFILES,
  shouldUseQASAuthBypass,
  isAuthBypassEnabled,
  getAppEnvironment,
  logQASAudit,
} from '@/config/qas-auth-config'

export interface CiafalAuthUser {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'SUPERVISOR' | 'VENDEDOR' | 'REPRESENTANTE_EXTERNO' | string
  display_role?: string
  employee_id?: string
  seller_code?: string
  ramal?: string
  telefone_corporativo?: string
  active?: boolean
  is_test_user?: boolean
  is_test_session?: boolean
  session_id?: string
  login_timestamp?: string
  environment?: string
  avatar?: string
  account_id?: string
  department?: string
  cargo?: string
  profile?: string
  cost_center?: string
  manager_id?: string
  manager_name?: string
  permissions?: string[]
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
  signInAsQASProfile: (profileIdOrEmail: string) => CiafalAuthUser | null
  switchQASProfile: () => void
  resetPassword: (email: string) => Promise<{ error: any }>
  signOut: () => void
  loading: boolean
  isBypassActive: boolean
  availableQASProfiles: QASProfile[]
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

const SESSION_STORAGE_KEY = 'ciafal_crm_session'
const QAS_STORAGE_KEY = 'qas_session'
const JWT_STORAGE_KEY = 'ciafal_jwt_token'

/**
 * Cria um objeto CiafalAuthUser estruturado a partir de um perfil oficial QAS
 */
export function createQASTestSessionUser(profile: QASProfile): CiafalAuthUser {
  const sessionId = `qas_sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
  const timestamp = new Date().toISOString()

  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    role: profile.role,
    display_role: profile.displayRole,
    employee_id: profile.employee_id,
    seller_code: profile.seller_code,
    ramal: profile.ramal,
    telefone_corporativo: profile.telefone_corporativo,
    department: profile.department,
    cargo: profile.cargo,
    cost_center: profile.cost_center,
    manager_id: profile.manager_id,
    manager_name: profile.manager_name,
    active: true,
    is_test_user: true,
    is_test_session: true,
    session_id: sessionId,
    login_timestamp: timestamp,
    environment: 'HOMOLOGAÇÃO',
    permissions: [...profile.permissions],
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const isBypassActive = shouldUseQASAuthBypass()

  // Inicialização síncrona do estado a partir do localStorage
  const [user, setUser] = useState<CiafalAuthUser | null>(() => {
    try {
      const savedSession =
        localStorage.getItem(SESSION_STORAGE_KEY) || localStorage.getItem(QAS_STORAGE_KEY)
      if (savedSession) {
        const parsed = JSON.parse(savedSession)
        if (parsed && parsed.email) {
          const role = (parsed.role || 'VENDEDOR').toUpperCase()
          return { ...parsed, role }
        }
      }
    } catch {
      /* ignore parse error */
    }
    return null
  })

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem(JWT_STORAGE_KEY)
    const savedSession =
      localStorage.getItem(SESSION_STORAGE_KEY) || localStorage.getItem(QAS_STORAGE_KEY)

    // Se estiver em modo bypass e houver uma sessão salva, mantê-la sem validar no backend Skip Cloud
    if (isBypassActive && savedSession) {
      try {
        const parsed = JSON.parse(savedSession)
        if (parsed && parsed.email) {
          const role = (parsed.role || 'VENDEDOR').toUpperCase()
          const validUser: CiafalAuthUser = {
            ...parsed,
            role,
            is_test_session: true,
            environment: 'HOMOLOGAÇÃO',
          }
          setUser(validUser)
          setLoading(false)
          return
        }
      } catch {
        /* ignore */
      }
    }

    // Fluxo normal com token JWT se existir
    if (token) {
      pb.send<{
        authenticated: boolean
        user?: any
      }>('/backend/v1/auth/me', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (res?.authenticated && res?.user) {
            const safeUser: CiafalAuthUser = {
              ...res.user,
              role: (res.user.role || 'VENDEDOR').toUpperCase(),
            }
            setUser(safeUser)
            try {
              localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(safeUser))
            } catch {
              /* ignore */
            }
          } else {
            // Sessão inválida no backend
            localStorage.removeItem(SESSION_STORAGE_KEY)
            localStorage.removeItem(QAS_STORAGE_KEY)
            localStorage.removeItem(JWT_STORAGE_KEY)
            setUser(null)
          }
        })
        .catch(() => {
          if (savedSession) {
            try {
              const parsed = JSON.parse(savedSession)
              if (parsed && parsed.email) {
                setUser(parsed)
              }
            } catch {
              setUser(null)
            }
          }
        })
        .finally(() => {
          setLoading(false)
        })
    } else if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession)
        if (parsed && parsed.email) {
          const role = (parsed.role || 'VENDEDOR').toUpperCase()
          setUser({ ...parsed, role })
        }
      } catch {
        setUser(null)
      }
      setLoading(false)
    } else {
      setLoading(false)
    }
  }, [isBypassActive])

  /**
   * Entrada instantânea em perfil oficial de homologação (Auth Bypass QAS)
   */
  const signInAsQASProfile = (profileIdOrEmail: string): CiafalAuthUser | null => {
    // Proteção estrita contra execução indevida em produção
    if (getAppEnvironment() === 'production') {
      console.error('CRITICAL: signInAsQASProfile cannot run in production environment!')
      return null
    }

    const cleanInput = (profileIdOrEmail || '').trim().toLowerCase()
    const targetProfile = QAS_PROFILES.find(
      (p) =>
        p.id.toLowerCase() === cleanInput ||
        p.email.toLowerCase() === cleanInput ||
        p.role.toLowerCase() === cleanInput,
    )

    if (!targetProfile) {
      console.warn('[QAS] Perfil não encontrado para entrada rápida:', profileIdOrEmail)
      return null
    }

    const testUser = createQASTestSessionUser(targetProfile)

    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(testUser))
      localStorage.setItem(QAS_STORAGE_KEY, JSON.stringify(testUser))
    } catch {
      /* ignore */
    }

    setUser(testUser)

    // Audit log
    logQASAudit('SELECT_PROFILE', {
      user_id: testUser.id,
      user_email: testUser.email,
      user_name: testUser.name,
      role: testUser.role,
      session_id: testUser.session_id,
      login_timestamp: testUser.login_timestamp,
      is_test_session: true,
    })

    return testUser
  }

  /**
   * Encerra a sessão QAS atual e permite trocar de perfil
   */
  const switchQASProfile = () => {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY)
      localStorage.removeItem(QAS_STORAGE_KEY)
      localStorage.removeItem(JWT_STORAGE_KEY)
    } catch {
      /* ignore */
    }
    logQASAudit('SWITCH_PROFILE_REQUESTED', {
      previous_user: user?.email,
    })
    setUser(null)
  }

  const signUp = async (name: string, email: string, password: string) => {
    try {
      await pb.collection('users').create({ name, email, password, passwordConfirm: password })
      await pb.collection('users').authWithPassword(email, password)
      return { error: null }
    } catch (error: any) {
      return { error, status: error.status }
    }
  }

  const signIn = async (email: string, _password: string, preValidatedUser?: any) => {
    const normalizedEmail = (email || '').trim().toLowerCase()

    if (preValidatedUser) {
      let role = 'VENDEDOR'
      const rawRole = (preValidatedUser.role || '').toUpperCase()
      if (rawRole === 'ADMIN' || rawRole === 'ADMINISTRADOR') role = 'ADMIN'
      else if (rawRole === 'SUPERVISOR') role = 'SUPERVISOR'
      else if (rawRole === 'REPRESENTANTE_EXTERNO' || rawRole === 'REPRESENTANTE')
        role = 'REPRESENTANTE_EXTERNO'
      else role = rawRole || 'VENDEDOR'

      const authUser: CiafalAuthUser = {
        id: preValidatedUser.id || `usr-${normalizedEmail.split('@')[0]}`,
        email: normalizedEmail,
        name: preValidatedUser.name || 'Colaborador CIAFAL',
        role: role,
        employee_id: preValidatedUser.employee_id || '',
        seller_code: preValidatedUser.seller_code || '',
        ramal: preValidatedUser.ramal || '',
        telefone_corporativo: preValidatedUser.telefone_corporativo || '',
        department: preValidatedUser.department || '',
        cargo: preValidatedUser.cargo || '',
        cost_center: preValidatedUser.cost_center || '',
        manager_id: preValidatedUser.manager_id || '',
        manager_name: preValidatedUser.manager_name || '',
        active: preValidatedUser.active !== false,
        is_test_user: preValidatedUser.is_test_user === true,
        environment: isFixedTestOtpEnabled() ? 'HOMOLOGAÇÃO' : 'PRODUÇÃO',
        permissions: preValidatedUser.permissions || [],
      }

      try {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(authUser))
        localStorage.setItem(QAS_STORAGE_KEY, JSON.stringify(authUser))
      } catch {
        /* ignore */
      }

      setUser(authUser)
      return { error: null }
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
    try {
      const token = localStorage.getItem(JWT_STORAGE_KEY)
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
      localStorage.removeItem(SESSION_STORAGE_KEY)
      localStorage.removeItem(QAS_STORAGE_KEY)
      localStorage.removeItem(JWT_STORAGE_KEY)
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
    <AuthContext.Provider
      value={{
        user,
        signUp,
        signIn,
        signInAsQASProfile,
        switchQASProfile,
        resetPassword,
        signOut,
        loading,
        isBypassActive,
        availableQASProfiles: QAS_PROFILES,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
