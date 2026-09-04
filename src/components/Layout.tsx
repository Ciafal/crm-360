import React, { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Building2,
  Menu,
  X,
  LogOut,
  ChevronDown,
  FileText,
  UserCheck,
  ShieldAlert,
  Sparkles,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { shouldUseQASAuthBypass } from '@/config/qas-auth-config'
import { GlobalAssistant } from '@/components/shared/GlobalAssistant'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import pb from '@/lib/pocketbase/client'
export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut, switchQASProfile, isBypassActive } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isBypass = isBypassActive ?? shouldUseQASAuthBypass()

  const handleLogout = () => {
    signOut()
    navigate('/')
  }

  const handleSwitchProfile = () => {
    switchQASProfile()
    navigate('/')
  }

  const avatarUrl = user?.avatar
    ? pb.files.getUrl(user, user.avatar, { thumb: '100x100' })
    : undefined

  const isTestEnvironment =
    import.meta.env.VITE_ENABLE_TEST_USERS === 'true' ||
    import.meta.env.MODE !== 'production' ||
    true // Ativado por padrão em DEV/HML

  const getProfileLabel = () => {
    const role = (user?.role || '').toUpperCase()
    if (role === 'ADMIN' || role === 'ADMINISTRADOR') return 'Perfil de teste: Administrador'
    if (role === 'SUPERVISOR') return 'Perfil de teste: Supervisor'
    if (role === 'REPRESENTANTE_EXTERNO' || role === 'REPRESENTANTE')
      return 'Perfil de teste: Representante Externo'
    if (user?.email?.includes('vendedor2')) return 'Perfil de teste: Vendedor 2'
    return 'Perfil de teste: Vendedor'
  }

  // Ordem principal do menu corporativo CIAFAL (1 a 11):
  // 1 Meu Dia, 2 Contatos, 3 Cotações, 4 CRM 360, 5 Tarefas, 6 KPIs, 7 Gestão de Clientes, 8 Satisfação de Clientes, 9 Consultas, 10 Central de Ações, 11 Estoque.
  const MAIN_NAV_ITEMS = [
    { id: 'meu-dia', name: 'Meu Dia', path: '/home', priority: 1 },
    {
      id: 'contatos',
      name: 'Contatos',
      path: '/contatos',
      badge: 'Omnichannel',
      badgeType: 'omni',
      priority: 2,
    },
    { id: 'cotacoes', name: 'Cotações', path: '/crm/cotacoes', priority: 3 },
    { id: 'crm', name: 'CRM 360', path: '/crm', priority: 4 },
    { id: 'tarefas', name: 'Tarefas', path: '/tarefas', priority: 5 },
    { id: 'kpis', name: 'KPIs', path: '/kpis-comerciais', priority: 6 },
    { id: 'gestao-clientes', name: 'Gestão de Clientes', path: '/gestao-clientes', priority: 7 },
    { id: 'satisfacao', name: 'Satisfação de Clientes', path: '/satisfacao-clientes', priority: 8 },
    {
      id: 'consultas',
      name: 'Consultas',
      path: '/consultas',
      badge: 'Autosserviço',
      badgeType: 'auto',
      priority: 9,
    },
    {
      id: 'central-acoes',
      name: 'Central de Ações',
      path: '/central-acoes',
      badge: 'IA',
      badgeType: 'ia',
      priority: 10,
    },
    { id: 'estoque', name: 'Estoque', path: '/estoque', priority: 11 },
  ]

  // Módulos complementares para o menu "Mais"
  const SECONDARY_NAV_ITEMS = [
    { name: 'S&OP / Forecast', path: '/planejamento-sop', desc: 'Demanda F0-F4, FVA & Waterfall' },
    { name: 'Equipe Comercial', path: '/equipe', desc: 'Vendedores, Metas & Hierarquia' },
    { name: 'Visitas & Rotas', path: '/visitas', desc: 'Roteirização & Geolocalização' },
    { name: 'Agentes de IA', path: '/agentes', desc: 'Copilotos & Automações' },
    { name: 'Gestão de Inativos', path: '/gestao-inativos', desc: 'Reativação Comercial' },
    { name: 'Agente Fred (TMS)', path: '/agente-fred', desc: 'Rastreabilidade Logística' },
    {
      name: 'Parâmetros SAP (Governança)',
      path: '/administracao/parametros-sap',
      desc: 'Regras de Exposição & Limites SAP',
    },
    {
      name: 'Central de Integrações',
      path: '/central-integracoes',
      desc: 'SAP ECC, Qlik, TMS & SAC',
    },
    { name: 'Parâmetros & Acessos', path: '/administracao', desc: 'Configurações do CRM' },
  ]

  return (
    <main className="flex flex-col min-h-screen bg-background relative overflow-x-hidden">
      {/* Background Noise */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-multiply bg-noise z-0" />

      {/* Banner Discreto de Ambiente de Teste / Bypass QAS */}
      {isTestEnvironment && (
        <div
          data-testid="test-environment-banner"
          className="fixed bottom-2 right-3 z-50 pointer-events-none select-none bg-amber-500/15 text-amber-950 border border-amber-400/40 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider flex items-center gap-2 shadow-xs"
        >
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span>AMBIENTE DE HOMOLOGAÇÃO</span>
          {isBypass && (
            <span className="text-[9px] text-amber-800 lowercase font-normal hidden sm:inline">
              • autenticação temporariamente desativada para homologação
            </span>
          )}
        </div>
      )}

      {/* TopNav */}
      <div className="fixed top-0 inset-x-0 z-50 p-2 sm:p-3 flex justify-center">
        <header className="glass-nav w-full max-w-[1600px] px-3 sm:px-4 py-2 flex items-center justify-between transition-all duration-300 rounded-2xl shadow-sm border border-slate-200/80 bg-white/95 backdrop-blur-md">
          {/* Lado Esquerdo: Logo CIAFAL + Identificação */}
          <div className="flex items-center gap-2 shrink-0">
            <Link to="/home" className="flex items-center gap-2.5 px-1.5 shrink-0 group">
              <div className="bg-[#003A70] text-white p-1.5 rounded-lg shadow-xs group-hover:bg-[#002850] transition-colors">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col leading-none">
                <div className="flex items-center gap-1.5">
                  <span className="font-serif font-bold text-base sm:text-lg text-[#003A70] tracking-tight whitespace-nowrap">
                    CRM 360º
                  </span>
                  <span className="hidden xl:inline-flex items-center px-1.5 py-0.2 text-[9px] font-bold uppercase rounded bg-amber-100 text-amber-900 border border-amber-300">
                    HOMOLOGAÇÃO
                  </span>
                </div>
                <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-slate-500 font-bold whitespace-nowrap">
                  CIAFAL FERRO & AÇO
                </span>
              </div>
            </Link>

            {/* Identificação do Perfil de Teste Ativo no TopNav */}
            {user && (
              <div className="hidden 2xl:flex items-center gap-1.5 ml-2 px-2.5 py-1 rounded-full bg-slate-100/90 border border-slate-200 text-slate-700 text-[11px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                <span>{getProfileLabel()}</span>
              </div>
            )}
          </div>

          {/* Centro: Menu Principal Responsivo com Overflow "Mais ▾" */}
          <div className="hidden xl:flex items-center gap-0.5 2xl:gap-1 px-1">
            {MAIN_NAV_ITEMS.map((link) => {
              const isActive =
                link.path === '/home'
                  ? location.pathname === '/home' || location.pathname === '/meu-dia'
                  : location.pathname.startsWith(link.path)

              return (
                <Link
                  key={link.id}
                  to={link.path}
                  className={cn(
                    'px-2.5 2xl:px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0 select-none',
                    isActive
                      ? 'bg-sky-50 text-[#003A70] font-bold border border-sky-200/80 shadow-2xs'
                      : 'text-slate-600 hover:text-[#003A70] hover:bg-slate-100/70',
                  )}
                >
                  <span className="whitespace-nowrap">{link.name}</span>
                  {link.badge && (
                    <span className="px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 text-[9px] font-bold leading-none shrink-0">
                      {link.badge}
                    </span>
                  )}
                </Link>
              )
            })}

            {/* Menu "Mais ▾" para módulos secundários no Desktop Amplo */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs font-semibold rounded-lg gap-1 text-slate-600 hover:text-[#003A70] hover:bg-slate-100/70 shrink-0"
                >
                  <span className="whitespace-nowrap">Mais</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-72 p-2.5 rounded-2xl shadow-lg border border-slate-200 bg-white"
              >
                <DropdownMenuLabel className="font-serif text-xs font-bold text-[#003A70] uppercase tracking-wider">
                  Módulos Complementares
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="grid grid-cols-1 gap-1 py-1">
                  {SECONDARY_NAV_ITEMS.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="p-2 rounded-xl text-xs hover:bg-sky-50/70 transition-colors flex flex-col group"
                    >
                      <strong className="text-slate-800 font-bold group-hover:text-[#003A70]">
                        {item.name}
                      </strong>
                      <span className="text-[10px] text-slate-500">{item.desc}</span>
                    </Link>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Desktop Médio (lg até xl): Itens Prioritários (1-8) + "Mais ▾" com os demais */}
          <div className="hidden lg:flex xl:hidden items-center gap-0.5 px-1">
            {MAIN_NAV_ITEMS.slice(0, 8).map((link) => {
              const isActive =
                link.path === '/home'
                  ? location.pathname === '/home' || location.pathname === '/meu-dia'
                  : location.pathname.startsWith(link.path)

              return (
                <Link
                  key={link.id}
                  to={link.path}
                  className={cn(
                    'px-2 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1 shrink-0 select-none',
                    isActive
                      ? 'bg-sky-50 text-[#003A70] font-bold border border-sky-200/80 shadow-2xs'
                      : 'text-slate-600 hover:text-[#003A70] hover:bg-slate-100/70',
                  )}
                >
                  <span className="whitespace-nowrap">{link.name}</span>
                </Link>
              )
            })}

            {/* Menu "Mais ▾" no Desktop Médio com Consultas, Central de Ações, Estoque e secundários */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs font-semibold rounded-lg gap-1 text-slate-600 hover:text-[#003A70] hover:bg-slate-100/70 shrink-0"
                >
                  <span className="whitespace-nowrap">Mais</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-80 p-2.5 rounded-2xl shadow-lg border border-slate-200 bg-white"
              >
                <DropdownMenuLabel className="font-serif text-xs font-bold text-[#003A70] uppercase tracking-wider">
                  Módulos do Sistema
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="grid grid-cols-2 gap-1.5 py-1">
                  {MAIN_NAV_ITEMS.slice(8).map((link) => (
                    <Link
                      key={link.id}
                      to={link.path}
                      className="p-2 rounded-xl text-xs hover:bg-sky-50/70 bg-slate-50/60 border border-slate-200/70 transition-colors flex flex-col"
                    >
                      <strong className="text-slate-800 font-bold text-[11px] flex items-center gap-1">
                        {link.name}
                        {link.badge && (
                          <span className="px-1 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[8px] font-bold">
                            {link.badge}
                          </span>
                        )}
                      </strong>
                    </Link>
                  ))}
                </div>
                <DropdownMenuSeparator className="my-1.5" />
                <DropdownMenuLabel className="font-serif text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Demais Módulos
                </DropdownMenuLabel>
                <div className="grid grid-cols-1 gap-1 py-1">
                  {SECONDARY_NAV_ITEMS.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="p-1.5 rounded-lg text-xs hover:bg-sky-50/70 transition-colors flex items-center justify-between group"
                    >
                      <span className="text-slate-700 font-medium text-xs group-hover:text-[#003A70]">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {item.desc.slice(0, 24)}...
                      </span>
                    </Link>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Desktop Compacto / Tablet (md até lg): Itens Top 5 + "Menu Módulos ▾" */}
          <div className="hidden md:flex lg:hidden items-center gap-0.5 px-1">
            {MAIN_NAV_ITEMS.slice(0, 5).map((link) => {
              const isActive =
                link.path === '/home'
                  ? location.pathname === '/home' || location.pathname === '/meu-dia'
                  : location.pathname.startsWith(link.path)

              return (
                <Link
                  key={link.id}
                  to={link.path}
                  className={cn(
                    'px-2 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1 shrink-0 select-none',
                    isActive
                      ? 'bg-sky-50 text-[#003A70] font-bold border border-sky-200/80 shadow-2xs'
                      : 'text-slate-600 hover:text-[#003A70] hover:bg-slate-100/70',
                  )}
                >
                  <span className="whitespace-nowrap">{link.name}</span>
                </Link>
              )
            })}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs font-semibold rounded-lg gap-1 text-slate-600 hover:text-[#003A70] hover:bg-slate-100/70 shrink-0"
                >
                  <span className="whitespace-nowrap">Módulos ▾</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-80 p-2.5 rounded-2xl shadow-lg border border-slate-200 bg-white"
              >
                <DropdownMenuLabel className="font-serif text-xs font-bold text-[#003A70] uppercase tracking-wider">
                  Todos os Módulos CIAFAL
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="grid grid-cols-2 gap-1.5 py-1">
                  {MAIN_NAV_ITEMS.slice(5).map((link) => (
                    <Link
                      key={link.id}
                      to={link.path}
                      className="p-2 rounded-xl text-xs hover:bg-sky-50/70 bg-slate-50/60 border border-slate-200/70 transition-colors flex flex-col"
                    >
                      <strong className="text-slate-800 font-bold text-[11px] flex items-center gap-1">
                        {link.name}
                        {link.badge && (
                          <span className="px-1 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[8px] font-bold">
                            {link.badge}
                          </span>
                        )}
                      </strong>
                    </Link>
                  ))}
                </div>
                <DropdownMenuSeparator className="my-1.5" />
                <div className="grid grid-cols-1 gap-1 py-1">
                  {SECONDARY_NAV_ITEMS.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="p-1.5 rounded-lg text-xs hover:bg-sky-50/70 transition-colors flex items-center justify-between group"
                    >
                      <span className="text-slate-700 font-medium text-xs group-hover:text-[#003A70]">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {item.desc.slice(0, 24)}...
                      </span>
                    </Link>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Lado Direito: Perfil & Menu Mobile */}
          <div className="flex items-center gap-2 shrink-0">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 h-10 px-2.5 rounded-full hover:bg-sky-50 border border-slate-200/80 bg-white/60 transition-all"
                  >
                    <Avatar className="h-7 w-7 border border-slate-200 shadow-2xs">
                      <AvatarImage src={avatarUrl} alt={user.name || 'User'} />
                      <AvatarFallback className="bg-[#003A70] text-white text-xs font-bold">
                        {user.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:flex flex-col text-left leading-tight">
                      <span className="text-xs font-bold text-slate-800 max-w-[120px] truncate">
                        {user.name || user.email}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium capitalize">
                        {user.role?.toLowerCase() || 'Vendedor'}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-64 rounded-2xl p-2.5 shadow-xl border border-slate-200 bg-white"
                  align="end"
                  forceMount
                >
                  <DropdownMenuLabel className="font-normal p-2 bg-slate-50 rounded-xl mb-1 border border-slate-100">
                    <div className="flex flex-col space-y-1.5">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold leading-none text-slate-900">
                          {user.name || 'Usuário CRM'}
                        </p>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-100/90 text-amber-900 border border-amber-300 text-[9px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          HOMOLOGAÇÃO
                        </span>
                      </div>
                      <p className="text-[11px] leading-none text-slate-500 truncate">
                        {user.email}
                      </p>
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-slate-500 font-semibold">Perfil:</span>
                        <Badge
                          variant="outline"
                          className="w-fit text-[9px] px-1.5 py-0 uppercase font-mono bg-sky-50 text-[#003A70] border-sky-200"
                        >
                          {user.role || 'VENDEDOR'}
                        </Badge>
                      </div>
                    </div>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator />

                  {/* ITEM OBRIGATÓRIO: Trocar perfil de homologação */}
                  {isBypass && (
                    <DropdownMenuItem
                      onClick={handleSwitchProfile}
                      className="cursor-pointer text-xs rounded-lg py-2 font-bold text-[#003A70] bg-sky-50/80 hover:bg-sky-100 border border-sky-200 my-1 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-3.5 w-3.5 text-[#003A70]" />
                        <span>[Trocar perfil de homologação]</span>
                      </div>
                      <Badge className="text-[8px] bg-[#003A70] text-white px-1.5 py-0 font-mono">
                        QAS
                      </Badge>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem
                    onClick={() => navigate('/home')}
                    className="cursor-pointer text-xs rounded-lg py-1.5"
                  >
                    Meu Painel (Meu Dia)
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => navigate('/administracao')}
                    className="cursor-pointer text-xs rounded-lg py-1.5"
                  >
                    Perfil de Acesso & Configurações
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => navigate('/administracao/parametros-sap')}
                    className="cursor-pointer text-xs rounded-lg py-1.5 text-[#003A70] font-semibold"
                  >
                    Parâmetros de Exposição SAP
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    onClick={() => navigate('/hypercare')}
                    className="cursor-pointer text-xs rounded-lg py-1.5"
                  >
                    Cockpit de Hypercare
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive focus:bg-destructive focus:text-destructive-foreground cursor-pointer text-xs rounded-lg py-1.5 font-semibold"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair da conta</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-[#003A70] hover:bg-sky-50"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5 text-[#003A70]" />
              )}
            </Button>
          </div>
        </header>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white/95 backdrop-blur-md md:hidden pt-20 px-4 flex flex-col gap-3 animate-fade-in-down overflow-y-auto pb-12">
          <div className="p-3 bg-sky-50 rounded-2xl flex items-center justify-between border border-sky-100">
            <span className="font-serif font-bold text-sm text-[#003A70]">CRM 360º CIAFAL</span>
            <Badge variant="outline" className="text-xs bg-white text-[#003A70] border-sky-200">
              Navegação
            </Badge>
          </div>

          <div className="space-y-1">
            {MAIN_NAV_ITEMS.map((link) => {
              const active =
                link.path === '/home'
                  ? location.pathname === '/home' || location.pathname === '/meu-dia'
                  : location.pathname.startsWith(link.path)

              return (
                <Link
                  key={link.id}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-colors',
                    active
                      ? 'bg-sky-100/80 text-[#003A70] border border-sky-200 font-bold'
                      : 'text-slate-700 hover:bg-slate-100',
                  )}
                >
                  <span className="font-semibold">{link.name}</span>
                  {link.badge && (
                    <Badge className="bg-emerald-100 text-emerald-800 text-[10px] border-none">
                      {link.badge}
                    </Badge>
                  )}
                </Link>
              )
            })}

            <div className="pt-2 border-t border-slate-200 mt-2 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 px-3 block">
                Módulos Complementares
              </span>
              {SECONDARY_NAV_ITEMS.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between p-2.5 rounded-xl text-xs text-slate-600 hover:bg-slate-100"
                >
                  <span className="font-medium">{item.name}</span>
                  <span className="text-[10px] text-slate-400">{item.desc}</span>
                </Link>
              ))}
            </div>
          </div>

          {user && (
            <div className="space-y-2 mt-4">
              {isBypass && (
                <Button
                  variant="outline"
                  className="w-full py-4 text-xs font-bold rounded-xl border-[#003A70] text-[#003A70] bg-sky-50 flex items-center justify-center gap-2"
                  onClick={handleSwitchProfile}
                >
                  <RefreshCw className="h-3.5 w-3.5" /> [Trocar perfil de homologação]
                </Button>
              )}
              <Button
                variant="destructive"
                className="w-full py-4 text-sm rounded-xl"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" /> Sair da conta
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 pt-24 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full z-10">
        <Outlet />
      </div>
      <GlobalAssistant />
    </main>
  )
}
