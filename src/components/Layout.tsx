import React, { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Building2, Menu, X, LogOut, ChevronDown, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
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
  const { user, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    signOut()
    navigate('/')
  }

  const avatarUrl = user?.avatar
    ? pb.files.getUrl(user, user.avatar, { thumb: '100x100' })
    : undefined

  const isTestEnvironment =
    import.meta.env.VITE_ENABLE_TEST_USERS === 'true' ||
    import.meta.env.MODE !== 'production' ||
    true // Ativado por padrão em DEV/HML

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

      {/* Banner Discreto de Ambiente de Teste */}
      {isTestEnvironment && (
        <div
          data-testid="test-environment-banner"
          className="fixed bottom-2 right-3 z-50 pointer-events-none select-none bg-amber-500/10 text-amber-900 border border-amber-400/30 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase tracking-wider flex items-center gap-1.5 shadow-xs"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          AMBIENTE DE TESTE / HOMOLOGAÇÃO
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
                <span className="font-serif font-bold text-base sm:text-lg text-[#003A70] tracking-tight whitespace-nowrap">
                  CRM 360º
                </span>
                <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-slate-500 font-bold whitespace-nowrap">
                  CIAFAL FERRO & AÇO
                </span>
              </div>
            </Link>
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
          <div className="flex items-center gap-1.5 shrink-0">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full p-0 hover:bg-sky-50"
                  >
                    <Avatar className="h-8 w-8 border border-slate-200 shadow-2xs">
                      <AvatarImage src={avatarUrl} alt={user.name || 'User'} />
                      <AvatarFallback className="bg-[#003A70] text-white text-xs font-bold">
                        {user.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 rounded-2xl p-2 shadow-lg border border-slate-200 bg-white"
                  align="end"
                  forceMount
                >
                  <DropdownMenuLabel className="font-normal p-2">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold leading-none text-slate-800">
                        {user.name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground truncate">
                        {user.email}
                      </p>
                      {user.role && (
                        <Badge
                          variant="outline"
                          className="w-fit text-[9px] mt-1 uppercase font-mono bg-sky-50 text-[#003A70] border-sky-200"
                        >
                          {user.role}
                        </Badge>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => navigate('/administracao')}
                    className="cursor-pointer text-xs rounded-lg"
                  >
                    Administração & Acessos
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate('/hypercare')}
                    className="cursor-pointer text-xs rounded-lg"
                  >
                    Cockpit de Hypercare
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => navigate('/relatorio-release')}
                    className="cursor-pointer text-xs rounded-lg"
                  >
                    Relatório da Release
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive focus:bg-destructive focus:text-destructive-foreground cursor-pointer text-xs rounded-lg"
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
            <Button
              variant="destructive"
              className="mt-4 w-full py-5 text-sm rounded-xl"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" /> Sair da conta
            </Button>
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
