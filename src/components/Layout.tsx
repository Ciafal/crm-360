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

  // Atalhos rápidos no TopNav na ordem exata solicitada (Regra 3 da especificação):
  // 1. Meu Dia; 2. Contatos; 3. Gestão Clientes; 4. Cotações; 5. CRM 360; 6. Tarefas; 7. KPI's; 8. Estoque; 9. Satisfação Clientes.
  const QUICK_TOP_NAV = [
    { name: 'Meu Dia', path: '/home' },
    { name: 'Central de Ações', path: '/central-acoes', badge: 'IA Ação' },
    { name: 'Contatos', path: '/contatos', badge: 'Omnichannel' },
    { name: 'Gestão Clientes', path: '/gestao-clientes' },
    { name: 'Cotações', path: '/crm/cotacoes' },
    { name: 'CRM 360', path: '/crm' },
    { name: 'Tarefas', path: '/tarefas' },
    { name: "KPI's", path: '/kpis-comerciais' },
    { name: 'Estoque', path: '/estoque' },
    { name: 'S&OP / Forecast', path: '/planejamento-sop', badge: 'S&OP' },
    { name: 'Satisfação Clientes', path: '/satisfacao-clientes' },
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
      <div className="fixed top-0 inset-x-0 z-50 p-4 flex justify-center">
        <nav className="glass-nav w-full max-w-6xl px-4 py-2 flex items-center justify-between transition-all duration-300">
          {/* Lado Esquerdo: Botão Menu Sidebar + Logo CIAFAL */}
          <div className="flex items-center gap-2">
            {/* Logo CRM 360º */}
            <Link to="/home" className="flex items-center gap-2.5 px-2 shrink-0 group">
              <div className="bg-primary text-primary-foreground p-1.5 rounded-lg shadow-sm group-hover:bg-primary/90 transition-colors">
                <Building2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-serif font-bold text-lg text-primary tracking-tight">
                  CRM 360º
                </span>
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">
                  CIAFAL FERRO & AÇO
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Links Principais */}
          <div className="hidden lg:flex items-center gap-1 px-2">
            {QUICK_TOP_NAV.map((link) => {
              const isActive =
                link.path === '/home'
                  ? location.pathname === '/home' || location.pathname === '/meu-dia'
                  : location.pathname.startsWith(link.path)

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    'px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5',
                    isActive
                      ? 'bg-white shadow-sm text-primary font-bold'
                      : 'text-muted-foreground hover:text-primary hover:bg-white/60',
                  )}
                >
                  <span>{link.name}</span>
                  {link.badge && (
                    <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                      {link.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>

          {/* Dropdown Módulos do CRM no TopNav */}
          <div className="hidden md:flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs font-semibold rounded-full gap-1 text-slate-700 hover:text-primary"
                >
                  <span>Módulos</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-72 p-3 rounded-2xl shadow-lg border border-border/60 bg-white"
              >
                <DropdownMenuLabel className="font-serif text-xs font-bold text-primary uppercase tracking-wider">
                  Módulos CRM 360º
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="grid grid-cols-2 gap-1.5 py-1">
                  <Link
                    to="/cotacoes"
                    className="p-2 rounded-xl text-xs hover:bg-slate-50 transition-colors flex flex-col bg-amber-50/60 border border-amber-300/60"
                  >
                    <strong className="text-amber-900 font-bold flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-amber-600" /> COTAÇÕES
                    </strong>
                    <span className="text-[10px] text-amber-800/80">
                      Propostas, Aprovações & Cross Sell
                    </span>
                  </Link>
                  <Link
                    to="/planejamento-sop"
                    className="p-2 rounded-xl text-xs hover:bg-slate-50 transition-colors flex flex-col bg-emerald-50/60 border border-emerald-300/60"
                  >
                    <strong className="text-emerald-900 font-bold flex items-center gap-1">
                      S&OP / FORECAST
                    </strong>
                    <span className="text-[10px] text-emerald-800/80">
                      Demanda F0-F4, FVA & Waterfall
                    </span>
                  </Link>
                  <Link
                    to="/gestao-clientes"
                    className="p-2 rounded-xl text-xs hover:bg-slate-50 transition-colors flex flex-col bg-primary/5 border border-primary/20"
                  >
                    <strong className="text-primary font-bold">Gestão de Clientes</strong>
                    <span className="text-[10px] text-muted-foreground">
                      Carteira, Cobertura, IA 360, Catálogo
                    </span>
                  </Link>
                  <Link
                    to="/estoque"
                    className="p-2 rounded-xl text-xs hover:bg-slate-50 transition-colors flex flex-col"
                  >
                    <strong className="text-slate-900 font-bold">Gestão de Estoque</strong>
                    <span className="text-[10px] text-muted-foreground">
                      Aging, Parados, Oportunidades
                    </span>
                  </Link>
                  <Link
                    to="/equipe"
                    className="p-2 rounded-xl text-xs hover:bg-slate-50 transition-colors flex flex-col"
                  >
                    <strong className="text-slate-900">Equipe</strong>
                    <span className="text-[10px] text-muted-foreground">Vendedores & Metas</span>
                  </Link>
                  <Link
                    to="/visitas"
                    className="p-2 rounded-xl text-xs hover:bg-slate-50 transition-colors flex flex-col"
                  >
                    <strong className="text-slate-900">Visitas & Rotas</strong>
                    <span className="text-[10px] text-muted-foreground">Geolocalização</span>
                  </Link>
                  <Link
                    to="/agentes"
                    className="p-2 rounded-xl text-xs hover:bg-slate-50 transition-colors flex flex-col"
                  >
                    <strong className="text-slate-900">Agentes de IA</strong>
                    <span className="text-[10px] text-muted-foreground">Copilotos Comerciais</span>
                  </Link>
                  <Link
                    to="/gestao-inativos"
                    className="p-2 rounded-xl text-xs hover:bg-slate-50 transition-colors flex flex-col"
                  >
                    <strong className="text-slate-900">Inativos</strong>
                    <span className="text-[10px] text-muted-foreground">Reativação Comercial</span>
                  </Link>
                  <Link
                    to="/conversas"
                    className="p-2 rounded-xl text-xs hover:bg-slate-50 transition-colors flex flex-col"
                  >
                    <strong className="text-slate-900">Omnichannel</strong>
                    <span className="text-[10px] text-muted-foreground">WhatsApp & VoIP</span>
                  </Link>
                  <Link
                    to="/agente-fred"
                    className="p-2 rounded-xl text-xs hover:bg-slate-50 transition-colors flex flex-col bg-blue-50/40 border border-blue-200/50"
                  >
                    <strong className="text-blue-900 font-bold">Agente Fred (TMS)</strong>
                    <span className="text-[10px] text-muted-foreground">
                      Rastreamento & Logística
                    </span>
                  </Link>
                  <Link
                    to="/central-integracoes"
                    className="p-2 rounded-xl text-xs hover:bg-slate-50 transition-colors flex flex-col"
                  >
                    <strong className="text-slate-900">Integrações</strong>
                    <span className="text-[10px] text-muted-foreground">SAP ECC, Qlik, TMS</span>
                  </Link>
                  <Link
                    to="/administracao"
                    className="p-2 rounded-xl text-xs hover:bg-slate-50 transition-colors flex flex-col"
                  >
                    <strong className="text-slate-900">Configurações</strong>
                    <span className="text-[10px] text-muted-foreground">Parâmetros & Acessos</span>
                  </Link>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Lado Direito: Ações & Usuário */}
          <div className="flex items-center gap-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-8 w-8 border-2 border-white shadow-xs">
                      <AvatarImage src={avatarUrl} alt={user.name || 'User'} />
                      <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 rounded-2xl p-2 shadow-lg"
                  align="end"
                  forceMount
                >
                  <DropdownMenuLabel className="font-normal p-2">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground truncate">
                        {user.email}
                      </p>
                      {user.role && (
                        <Badge
                          variant="outline"
                          className="w-fit text-[9px] mt-1 uppercase font-mono"
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
              className="md:hidden text-primary"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </nav>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-background/95 backdrop-blur-sm md:hidden pt-24 px-4 flex flex-col gap-3 animate-fade-in-down overflow-y-auto pb-12">
          <div className="p-3 bg-primary/10 rounded-2xl flex items-center justify-between">
            <span className="font-serif font-bold text-sm text-primary">CRM 360º CIAFAL</span>
            <Badge variant="outline" className="text-xs bg-white text-primary">
              Módulos CRM
            </Badge>
          </div>

          <div className="space-y-1">
            {QUICK_TOP_NAV.map((link) => {
              const active =
                link.path === '/home'
                  ? location.pathname === '/home' || location.pathname === '/meu-dia'
                  : location.pathname.startsWith(link.path)

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-colors',
                    active
                      ? 'bg-white shadow-sm text-primary border border-border font-bold'
                      : 'text-muted-foreground hover:bg-white/50',
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

            <div className="pt-2 border-t border-border/40 mt-2 space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground px-3 block">
                Outros Módulos
              </span>
              <Link
                to="/estoque"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl text-sm text-primary bg-primary/10 font-semibold"
              >
                <span>Gestão Comercial de Estoque</span>
              </Link>
              <Link
                to="/equipe"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl text-sm text-muted-foreground hover:bg-white/50"
              >
                <span>Equipe Comercial</span>
              </Link>
              <Link
                to="/visitas"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl text-sm text-muted-foreground hover:bg-white/50"
              >
                <span>Visitas & Rotas</span>
              </Link>
              <Link
                to="/agentes"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl text-sm text-muted-foreground hover:bg-white/50"
              >
                <span>Agentes de IA</span>
              </Link>
              <Link
                to="/gestao-inativos"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl text-sm text-muted-foreground hover:bg-white/50"
              >
                <span>Gestão de Inativos</span>
              </Link>
              <Link
                to="/central-integracoes"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl text-sm text-muted-foreground hover:bg-white/50"
              >
                <span>Central de Integrações</span>
              </Link>
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
