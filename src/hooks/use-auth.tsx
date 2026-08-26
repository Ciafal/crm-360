import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'

interface AuthContextType {
  user: any
  signUp: (
    name: string,
    email: string,
    password: string,
  ) => Promise<{ error: any; status?: number }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
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
    const rec = pb.authStore.record
    if (rec && !rec.role) {
      return { ...rec, role: 'gerente_comercial' }
    }
    return rec
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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
    try {
      await pb.collection('users').authWithPassword(email, password)
      return { error: null }
    } catch (error: any) {
      return { error }
    }
  }

  const signOut = () => {
    pb.authStore.clear()
  }

  return (
    <AuthContext.Provider value={{ user, signUp, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
