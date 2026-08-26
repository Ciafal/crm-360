export type CiafalRole =
  | 'vendedor'
  | 'supervisor'
  | 'gerente_comercial'
  | 'diretoria'
  | 'administrativo'
  | 'ti'
  | 'administrador'
  | 'auditor'

export interface CiafalUser {
  id: string
  name: string
  email: string
  role: CiafalRole
  teamId?: string
  supervisorId?: string
  employeeId?: string
  sellerCode?: string
  ramal?: string
  telefoneCorporativo?: string
  active?: boolean
  avatar?: string
}

export interface SellerPortfolio {
  sellerId: string
  customerIds: string[]
}

export interface IdentityProvider {
  readonly name: string
  authenticate(credentials: unknown): Promise<CiafalUser>
  validateSession(token: string): Promise<CiafalUser | null>
  getUsersByRole(role: CiafalRole): Promise<CiafalUser[]>
  getTeamMembers(teamId: string): Promise<CiafalUser[]>
  getSubordinates(supervisorId: string): Promise<CiafalUser[]>
  getPortfolio(sellerId: string): Promise<SellerPortfolio>
  getHierarchy(userId: string): Promise<CiafalUser[]>
  getCurrentUser?(): Promise<CiafalUser | null>
  getUserRole?(userId: string): Promise<CiafalRole | null>
  canAccessCustomer?(userId: string, userRole: CiafalRole, customerSellerId?: string): boolean
  canAccessOpportunity?(userId: string, userRole: CiafalRole, opportunitySellerId?: string): boolean
}

export class LocalIdentityProvider implements IdentityProvider {
  readonly name = 'CIAFAL Local Identity Provider (RBAC)'

  async authenticate(credentials: unknown): Promise<CiafalUser> {
    return {
      id: 'ciafal-seller-01',
      name: 'Carlos Mendonça',
      email: 'carlos.mendonca@ciafal.com.br',
      role: 'vendedor',
      sellerCode: 'VEND-01',
      ramal: '4012',
      telefoneCorporativo: '(11) 98765-4321',
      active: true,
    }
  }

  async validateSession(token: string): Promise<CiafalUser | null> {
    return {
      id: 'ciafal-seller-01',
      name: 'Carlos Mendonça',
      email: 'carlos.mendonca@ciafal.com.br',
      role: 'vendedor',
      sellerCode: 'VEND-01',
      ramal: '4012',
      telefoneCorporativo: '(11) 98765-4321',
      active: true,
    }
  }

  async getUsersByRole(role: CiafalRole): Promise<CiafalUser[]> {
    return [
      {
        id: 'ciafal-seller-01',
        name: 'Carlos Mendonça',
        email: 'carlos.mendonca@ciafal.com.br',
        role: 'vendedor',
      },
      {
        id: 'ciafal-sup-01',
        name: 'Mariana Duarte',
        email: 'mariana.duarte@ciafal.com.br',
        role: 'supervisor',
      },
    ]
  }

  async getTeamMembers(teamId: string): Promise<CiafalUser[]> {
    return [
      {
        id: 'ciafal-seller-01',
        name: 'Carlos Mendonça',
        email: 'carlos.mendonca@ciafal.com.br',
        role: 'vendedor',
      },
      {
        id: 'ciafal-seller-02',
        name: 'Lucas Ferreira',
        email: 'lucas.ferreira@ciafal.com.br',
        role: 'vendedor',
      },
    ]
  }

  async getSubordinates(supervisorId: string): Promise<CiafalUser[]> {
    return [
      {
        id: 'ciafal-seller-01',
        name: 'Carlos Mendonça',
        email: 'carlos.mendonca@ciafal.com.br',
        role: 'vendedor',
        supervisorId,
      },
    ]
  }

  async getPortfolio(sellerId: string): Promise<SellerPortfolio> {
    return {
      sellerId,
      customerIds: [
        'CLI-8041',
        'CLI-7910',
        'CLI-6523',
        'CLI-5120',
        'CLI-4309',
        'CLI-3180',
        'CLI-2940',
        'CLI-1822',
        'CLI-1055',
        'CLI-0941',
        'CLI-0712',
        'CLI-0550',
      ],
    }
  }

  async getHierarchy(userId: string): Promise<CiafalUser[]> {
    return [
      {
        id: 'ciafal-seller-01',
        name: 'Carlos Mendonça',
        email: 'carlos.mendonca@ciafal.com.br',
        role: 'vendedor',
      },
      {
        id: 'ciafal-sup-01',
        name: 'Mariana Duarte',
        email: 'mariana.duarte@ciafal.com.br',
        role: 'supervisor',
      },
      {
        id: 'ciafal-ger-01',
        name: 'Roberto Silveira',
        email: 'roberto.silveira@ciafal.com.br',
        role: 'gerente_comercial',
      },
    ]
  }

  canAccessCustomer(userId: string, userRole: CiafalRole, customerSellerId?: string): boolean {
    if (
      userRole === 'diretoria' ||
      userRole === 'gerente_comercial' ||
      userRole === 'administrador' ||
      userRole === 'auditor' ||
      userRole === 'ti'
    ) {
      return true
    }
    if (userRole === 'supervisor') {
      // Supervisors can access team portfolios
      return true
    }
    // Vendedor only sees own portfolio
    // Representante externo só acessa própria carteira e nunca carteiras de vendedores internos
    if (userRole === ('representante_externo' as CiafalRole)) {
      return !customerSellerId || customerSellerId === userId
    }

    // Vendedor só vê própria carteira
    return !customerSellerId || customerSellerId === userId
  }

  canAccessOpportunity(
    userId: string,
    userRole: CiafalRole,
    opportunitySellerId?: string,
  ): boolean {
    return this.canAccessCustomer(userId, userRole, opportunitySellerId)
  }
}

export const defaultIdentityProvider = new LocalIdentityProvider()
