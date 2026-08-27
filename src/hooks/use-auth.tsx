import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'
import { isFixedTestOtpEnabled } from '@/services/mfa_service'

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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(() => {
    try {
      const qasSession = localStorage.getItem('qas_session')
      if (qasSession) {
        const parsed = JSON.parse(qasSession)
        if (parsed && !parsed.role) {
          return { ...parsed, role: 'gerente_comercial' }
        }
        return parsed
      }
    } catch {
      /* ignore JSON parse errors */
    }

    const rec = pb.authStore.record
    if (rec && !rec.role) {
      return { ...rec, role: 'gerente_comercial' }
    }
    return rec
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Se houver sessão sintética QAS no localStorage, não inicializar listeners do PocketBase
    if (localStorage.getItem('qas_session')) {
      setLoading(false)
      return
    }

    const unsubscribe = pb.authStore.onChange((_token, record) => {
      if (record && !record.role) {
        setUser({ ...record, role: 'gerente_comercial' })
      } else {
        setUser(record)
      }
    })

    if (pb.authStore.isValid) {
      pb.collection('users')
        .authRefresh()
        .then((authData) => {
          const rec = authData.record
          if (rec && !rec.role) {
            setUser({ ...rec, role: 'gerente_comercial' })
          } else {
            setUser(rec)
          }
        })
        .catch(() => pb.authStore.clear())
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

    // Para credenciais de teste QAS, autentica diretamente sem consultar PocketBase
    if (isTestDomain) {
      if (isTestPassword) {
        // Mapeamento de Role e Nome a partir do email
        const getRoleAndDetails = (e: string) => {
          if (e.startsWith('admin')) {
            return {
              role: 'administrador',
              name: 'Administrador Teste CRM',
              employee_id: 'TEST-ADM-01',
              seller_code: 'ADM-TESTE',
              ramal: '4099',
              telefone_corporativo: '(11) 98888-0000',
            }
          }
          if (e.startsWith('supervisor')) {
            return {
              role: 'supervisor',
              name: 'Supervisor Teste CRM',
              employee_id: 'TEST-SUP-01',
              seller_code: 'SUP-TESTE',
              ramal: '4090',
              telefone_corporativo: '(11) 98888-0001',
            }
          }
          if (e.startsWith('representante')) {
            return {
              role: 'representante_externo',
              name: 'Representante Externo Teste',
              employee_id: 'TEST-REP-01',
              seller_code: 'REP-EXT-01',
              ramal: '4095',
              telefone_corporativo: '(11) 98888-0005',
            }
          }
          if (e.startsWith('vendedor2')) {
            return {
              role: 'vendedor',
              name: 'Vendedor 2 Teste CRM',
              employee_id: 'TEST-VEND-02',
              seller_code: 'VEND-TEST-02',
              ramal: '4092',
              telefone_corporativo: '(11) 98888-0003',
            }
          }
          // default / vendedor
          return {
            role: 'vendedor',
            name: 'Vendedor Teste CRM',
            employee_id: 'TEST-VEND-01',
            seller_code: 'VEND-TEST-01',
            ramal: '4091',
            telefone_corporativo: '(11) 98888-0002',
          }
        }

        const details = getRoleAndDetails(normalizedEmail)
        const prefix = normalizedEmail.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '_')

        const qasUser = {
          id: `qas-${prefix}`,
          email: normalizedEmail,
          username: prefix,
          name: details.name,
          role: details.role,
          employee_id: details.employee_id,
          seller_code: details.seller_code,
          ramal: details.ramal,
          telefone_corporativo: details.telefone_corporativo,
          active: true,
          is_test_user: true,
          verified: true,
          emailVisibility: true,
        }

        try {
          localStorage.setItem('qas_session', JSON.stringify(qasUser))
        } catch {
          /* ignore storage error */
        }

        setUser(qasUser)
        return { error: null }
      } else {
        return { error: new Error('Credenciais de teste inválidas') }
      }
    }

    try {
      await pb.collection('users').authWithPassword(email, password)
      return { error: null }
    } catch (error: any) {
      return { error }
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
      localStorage.removeItem('qas_session')
    } catch {
      /* ignore storage error */
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
