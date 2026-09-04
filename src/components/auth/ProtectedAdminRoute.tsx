import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { dataExposurePolicyService } from '@/services/data_exposure_policy_service'
import UnauthorizedPage from '@/pages/UnauthorizedPage'

interface ProtectedAdminRouteProps {
  children: React.ReactNode
}

/**
 * Route guard que protege as rotas administrativas de Governança e Parâmetros SAP.
 * Conforme Requisito 2:
 * "somente ADMINISTRADOR e GERENTE podem visualizar/criar/editar/ativar/inativar parâmetros.
 * Vendedor, Representante e demais perfis NÃO acessam a tela — devem receber 403 — Acesso não autorizado se tentarem rota direta."
 */
export const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003A70]" />
      </div>
    )
  }

  // Deny-by-default: se não autenticado ou sem perfil com alçada
  const isAuthorized = dataExposurePolicyService.isUserAuthorizedToManage(user)

  if (!isAuthorized) {
    return <UnauthorizedPage />
  }

  return <>{children}</>
}
