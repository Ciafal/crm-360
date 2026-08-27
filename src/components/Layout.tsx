import React, { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Building2,
  Search,
  Menu,
  X,
  LogOut,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Grid,
  Layers,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react'
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import pb from '@/lib/pocketbase/client'
import {
  HUB_CATEGORIES,
  HUB_APPLICATION_REGISTRY,
  getModulesByCategory,
  HubModule,
} from '@/services/application_registry'

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    GESTAO_ESTRATEGIA: true,
    COMERCIAL_LOGISTICA: true,
    OPERACOES_INDUSTRIAIS: false,
    PESSOAS_GOVERNANCA: true,
    DADOS_ATIVOS: true,
  })

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

  const toggleCategory = (catId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }))
  }

  const isLinkActive = (path: string, subItems?: HubModule['subItems']) => {
    const cleanPath = path.split('?')[0]
    if (location.pathname === cleanPath) return true
    if (cleanPath !== '/' && cleanPath !== '/home' && location.pathname.startsWith(cleanPath)) {
      return true
    }
    if (subItems?.some((sub) => location.pathname === sub.path.split('?')[0])) {
      return true
    }
    return false
  }

  // Atalhos rápidos no TopNav
  const QUICK_TOP_NAV = [
    { name: 'Meu Dia', path: '/home' },
    { name: 'CRM 360º', path: '/crm' },
    { name: 'KPIs Comerciais', path: '/kpis-comerciais', badge: 'Novo' },
    { name: 'Solicitações', path: '/solicitacoes', badge: 'Novo' },
    { name: 'HCM & Compliance', path: '/hcm' },
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
            {/* Botão de Abertura da Sidebar Completa do HUB CIAFAL */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-2.5 gap-2 rounded-xl text-primary font-semibold hover:bg-primary/10 transition-colors"
                  title="Abrir Menu Completo do HUB CIAFAL"
                >
                  <Grid className="w-4 h-4 text-primary" />
                  <span className="hidden sm:inline text-xs">HUB CIAFAL</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[340px] sm:w-[380px] p-0 flex flex-col bg-slate-900 text-slate-100 border-r border-slate-800"
              >
                {/* Cabeçalho da Sidebar */}
                <div className="p-5 border-b border-slate-800 bg-slate-950/60">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary text-primary-foreground p-2 rounded-xl shadow-xs">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <SheetTitle className="text-white font-serif text-lg font-bold tracking-tight">
                        HUB CIAFAL
                      </SheetTitle>
                      <SheetDescription className="text-slate-400 text-xs">
                        Ecossistema Corporativo Integrado
                      </SheetDescription>
                    </div>
                  </div>
                </div>

                {/* Lista com as 5 Categorias Oficiais */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {HUB_CATEGORIES.map((category) => {
                    const modules = getModulesByCategory(category.id)
                    const isExpanded = !!expandedCategories[category.id]

                    return (
                      <div
                        key={category.id}
                        className="rounded-2xl border border-slate-800/80 bg-slate-950/40 overflow-hidden"
                      >
                        {/* Header da Categoria com Toggle de Expansão */}
                        <button
                          type="button"
                          onClick={() => toggleCategory(category.id)}
                          className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-800/40 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-serif font-bold text-xs uppercase tracking-wider text-slate-200">
                              {category.label}
                            </span>
                            <Badge className="bg-slate-800 text-slate-300 text-[9px] px-1.5 py-0 border-none font-mono">
                              {modules.length}
                            </Badge>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )}
                        </button>

                        {/* Módulos da Categoria */}
                        {isExpanded && (
                          <div className="p-2 pt-0 space-y-1">
                            {modules.map((mod) => {
                              const Icon = mod.icon
                              const active = isLinkActive(mod.path, mod.subItems)

                              return (
                                <div key={mod.id} className="space-y-1">
                                  <Link
                                    to={mod.path}
                                    onClick={() => setSidebarOpen(false)}
                                    className={cn(
                                      'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group',
                                      active
                                        ? 'bg-primary text-white font-semibold shadow-xs'
                                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white',
                                    )}
                                  >
                                    <div className="flex items-center gap-2.5 truncate">
                                      <Icon
                                        className={cn(
                                          'w-4 h-4 shrink-0',
                                          active
                                            ? 'text-white'
                                            : 'text-slate-400 group-hover:text-primary',
                                        )}
                                      />
                                      <span className="truncate">{mod.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      {mod.badge && (
                                        <Badge
                                          className={cn(
                                            'text-[9px] px-1.5 py-0 border-none font-bold',
                                            mod.isNew
                                              ? 'bg-emerald-500 text-white'
                                              : 'bg-slate-800 text-slate-300',
                                          )}
                                        >
                                          {mod.badge}
                                        </Badge>
                                      )}
                                    </div>
                                  </Link>

                                  {/* Subitens (Ex: HCM, CRM, IMS) */}
                                  {mod.subItems && (
                                    <div className="pl-6 pr-2 py-0.5 space-y-0.5 border-l border-slate-800 ml-4">
                                      {mod.subItems.map((sub) => {
                                        const isSubActive =
                                          location.pathname === sub.path.split('?')[0]
                                        return (
                                          <Link
                                            key={sub.id}
                                            to={sub.path}
                                            onClick={() => setSidebarOpen(false)}
                                            className={cn(
                                              'block px-2.5 py-1 rounded-lg text-[11px] transition-colors truncate',
                                              isSubActive
                                                ? 'text-amber-300 font-semibold bg-white/5'
                                                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5',
                                            )}
                                          >
                                            • {sub.name}
                                          </Link>
                                        )
                                      })}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Rodapé da Sidebar */}
                <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>QAS v2.1.0</span>
                  </div>
                  <Link
                    to="/relatorio-release"
                    onClick={() => setSidebarOpen(false)}
                    className="text-[11px] text-primary-foreground/70 hover:text-white underline"
                  >
                    Changelog
                  </Link>
                </div>
              </SheetContent>
            </Sheet>

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
                  HUB CIAFAL
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

          {/* Dropdown Geral do HUB no TopNav */}
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
                className="w-80 p-3 rounded-2xl shadow-lg border border-border/60 bg-white"
              >
                <DropdownMenuLabel className="font-serif text-xs font-bold text-primary uppercase tracking-wider">
                  Módulos Rápidos do HUB
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="grid grid-cols-2 gap-1.5 py-1">
                  <Link
                    to="/kpis-comerciais"
                    className="p-2 rounded-xl text-xs hover:bg-slate-50 transition-colors flex flex-col"
                  >
                    <strong className="text-slate-900">KPIs Comerciais</strong>
                    <span className="text-[10px] text-muted-foreground">Catálogo & OIF</span>
                  </Link>
                  <Link
                    to="/solicitacoes"
                    className="p-2 rounded-xl text-xs hover:bg-slate-50 transition-colors flex flex-col"
                  >
                    <strong className="text-slate-900">Solicitações</strong>
                    <span className="text-[10px] text-muted-foreground">Central de Workflow</span>
                  </Link>
                  <Link
                    to="/hcm"
                    className="p-2 rounded-xl text-xs hover:bg-slate-50 transition-colors flex flex-col"
                  >
                    <strong className="text-slate-900">HCM Compliance</strong>
                    <span className="text-[10px] text-muted-foreground">Termos & Aceites</span>
                  </Link>
                  <Link
                    to="/importar-pe"
                    className="p-2 rounded-xl text-xs hover:bg-slate-50 transition-colors flex flex-col"
                  >
                    <strong className="text-slate-900">Plano de Metas</strong>
                    <span className="text-[10px] text-muted-foreground">Importação PE</span>
                  </Link>
                  <Link
                    to="/hypercare"
                    className="p-2 rounded-xl text-xs hover:bg-slate-50 transition-colors flex flex-col"
                  >
                    <strong className="text-slate-900">Hypercare</strong>
                    <span className="text-[10px] text-muted-foreground">Cockpit QAS</span>
                  </Link>
                  <Link
                    to="/central-integracoes"
                    className="p-2 rounded-xl text-xs hover:bg-slate-50 transition-colors flex flex-col"
                  >
                    <strong className="text-slate-900">Integrações</strong>
                    <span className="text-[10px] text-muted-foreground">SAP, TOTVS, TMS</span>
                  </Link>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Lado Direito: Ações & Usuário */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="text-muted-foreground hover:text-primary rounded-full hidden sm:flex"
              title="Abrir Catálogo de Aplicações"
            >
              <Search className="w-4 h-4" />
            </Button>

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
                    <span>Sair do HUB</span>
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
            <span className="font-serif font-bold text-sm text-primary">Navegação HUB CIAFAL</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setMobileMenuOpen(false)
                setSidebarOpen(true)
              }}
              className="h-7 text-xs bg-white text-primary"
            >
              Ver Todas as 5 Áreas
            </Button>
          </div>

          <div className="space-y-1">
            {HUB_APPLICATION_REGISTRY.map((mod) => {
              const Icon = mod.icon
              const active = isLinkActive(mod.path, mod.subItems)

              return (
                <Link
                  key={mod.id}
                  to={mod.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-colors',
                    active
                      ? 'bg-white shadow-sm text-primary border border-border font-bold'
                      : 'text-muted-foreground hover:bg-white/50',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-primary" />
                    <span>{mod.name}</span>
                  </div>
                  {mod.badge && (
                    <Badge className="bg-emerald-100 text-emerald-800 text-[10px] border-none">
                      {mod.badge}
                    </Badge>
                  )}
                </Link>
              )
            })}
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
