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
  avatar?: string
}

export interface IdentityProvider {
  readonly name: string
  authenticate(credentials: unknown): Promise<CiafalUser>
  validateSession(token: string): Promise<CiafalUser | null>
  getUsersByRole(role: CiafalRole): Promise<CiafalUser[]>
  getTeamMembers(teamId: string): Promise<CiafalUser[]>
  getSubordinates(supervisorId: string): Promise<CiafalUser[]>
}
