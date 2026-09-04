/**
 * QAS AUTH BYPASS — TEMPORARY — MUST NEVER RUN IN PRODUCTION
 *
 * Tela de Seleção de Perfis de Homologação (Rota `/` quando bypass ativo).
 * Apresenta 5 botões de perfis oficiais sem campos de login, senha ou MFA.
 * Ao clicar, cria a sessão de homologação instantânea com RBAC e redireciona ao CRM.
 */

import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ShieldCheck,
  Shield,
  Users,
  UserCheck,
  Briefcase,
  Layers,
  Sparkles,
  Zap,
  BarChart3,
  Building2,
  ArrowRight,
  Info,
  CheckCircle2,
  Globe,
} from 'lucide-react'
import { QAS_PROFILES, QASProfile } from '@/config/qas-auth-config'
import { toast } from 'sonner'

export default function QASProfileSelectionScreen() {
  const { signInAsQASProfile } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [loadingProfileId, setLoadingProfileId] = useState<string | null>(null)

  const handleSelectProfile = (profile: QASProfile) => {
    setLoadingProfileId(profile.id)
    try {
      const loggedUser = signInAsQASProfile(profile.id)
      if (loggedUser) {
        toast.success(`Acesso liberado como ${profile.displayRole} (${profile.name})!`, {
          description: 'Sessão de homologação inicializada com sucesso.',
        })
        const from = (location.state as any)?.from?.pathname || '/crm360/home'
        setTimeout(() => {
          navigate(from, { replace: true })
        }, 150)
      } else {
        toast.error('Não foi possível iniciar a sessão de teste.')
        setLoadingProfileId(null)
      }
    } catch {
      toast.error('Erro ao inicializar perfil de homologação.')
      setLoadingProfileId(null)
    }
  }

  const getProfileIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Shield className="h-5 w-5 text-purple-600 shrink-0" />
      case 'SUPERVISOR':
        return <UserCheck className="h-5 w-5 text-indigo-600 shrink-0" />
      case 'VENDEDOR':
        return <Briefcase className="h-5 w-5 text-blue-600 shrink-0" />
      case 'REPRESENTANTE_EXTERNO':
        return <Globe className="h-5 w-5 text-amber-600 shrink-0" />
      default:
        return <Users className="h-5 w-5 text-slate-600 shrink-0" />
    }
  }

  const getProfileBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'SUPERVISOR':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      case 'VENDEDOR':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'REPRESENTANTE_EXTERNO':
        return 'bg-amber-100 text-amber-900 border-amber-200'
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/40 to-slate-100 flex flex-col justify-between text-slate-800">
      {/* Barra de Topo Institucional */}
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur px-6 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-[#003A70] flex items-center justify-center text-white font-black text-xl shadow-sm tracking-wider">
            C
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-lg tracking-tight">CIAFAL</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                CRM 360º
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Aços Planos, Tubos e Soluções Siderúrgicas Industriais
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span>AMBIENTE DE HOMOLOGAÇÃO</span>
          </div>
          <div className="text-xs text-slate-500 font-medium hidden md:block">
            Acesso Rápido para Testes
          </div>
        </div>
      </header>

      {/* Conteúdo Central */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full">
          {/* Coluna Esquerda: Apresentação Institucional CIAFAL */}
          <div className="lg:col-span-6 space-y-6 lg:pr-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              Plataforma Comercial Unificada de Alta Performance
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                CRM 360º CIAFAL
              </h1>
              <p className="text-lg text-slate-600 font-normal leading-relaxed">
                Relacionamento, inteligência comercial e execução de vendas em uma única plataforma
                integrada.
              </p>
            </div>

            {/* Grid de Benefícios Organizados */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">Inbox Omnichannel</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    WhatsApp Oficial & Mensageria centralizada com histórico.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">CRM 360º</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Visão completa da carteira, RFV, NPS e risco de churn.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">Equipe Comercial</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Cockpit individual do vendedor e supervisão em tempo real.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-violet-50 text-violet-700 flex items-center justify-center shrink-0">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">Inteligência com IA</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Recomendações preditivas, Smart Cross-Sell e pricing dinâmico.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">Execução Comercial</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Cotações ágeis com cálculo de peso teórico e margem líquida.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-cyan-50 text-cyan-700 flex items-center justify-center shrink-0">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">Integração Corporativa</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Conexão nativa com SAP ERP, TMS e rastreabilidade total.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Direita: Card de Seleção de Perfis QAS */}
          <div className="lg:col-span-6 w-full max-w-xl mx-auto">
            <Card className="border-slate-200/90 shadow-xl bg-white/95 backdrop-blur overflow-hidden rounded-2xl">
              <div className="h-2 bg-gradient-to-r from-[#003A70] via-blue-600 to-indigo-600" />

              <CardHeader className="space-y-2 pb-3 pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#003A70]">
                      <ShieldCheck className="h-5 w-5 text-[#003A70]" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                        AMBIENTE DE HOMOLOGAÇÃO
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-blue-200 text-[#003A70] bg-blue-50/50 text-[11px]"
                  >
                    Modo Sem Login
                  </Badge>
                </div>

                <CardTitle className="text-2xl font-bold text-slate-900 pt-1">
                  CRM 360º CIAFAL
                </CardTitle>

                {/* Aviso Obrigatório */}
                <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200/90 flex items-start gap-2.5 text-xs text-amber-900">
                  <Info className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Aviso de Homologação:</span>
                    <span className="text-amber-800">
                      A autenticação está temporariamente desativada para testes funcionais.
                    </span>
                  </div>
                </div>

                <CardDescription className="text-sm font-semibold text-slate-800 pt-1">
                  Selecione o perfil:
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 pt-0 pb-5">
                {/* 5 Botões Exatos por Perfil */}
                {QAS_PROFILES.map((profile) => {
                  const isLoading = loadingProfileId === profile.id

                  return (
                    <div
                      key={profile.id}
                      className="group p-3 rounded-xl border border-slate-200 hover:border-[#003A70] hover:bg-sky-50/40 transition-all bg-white shadow-2xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-slate-50 group-hover:bg-white border border-slate-200/80 shrink-0 mt-0.5">
                            {getProfileIcon(profile.role)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 text-sm">
                                {profile.name}
                              </span>
                              <span
                                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getProfileBadgeColor(
                                  profile.role,
                                )}`}
                              >
                                {profile.role}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">
                              {profile.email}
                            </p>
                            <p className="text-[11px] text-slate-600 mt-1">{profile.description}</p>
                          </div>
                        </div>

                        <Button
                          onClick={() => handleSelectProfile(profile)}
                          disabled={Boolean(loadingProfileId)}
                          className="w-full sm:w-auto bg-[#003A70] hover:bg-[#002850] text-white font-semibold text-xs h-9 px-4 shrink-0 shadow-xs group-hover:shadow-sm"
                        >
                          {isLoading ? (
                            <span className="flex items-center gap-1.5">
                              <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Entrando...
                            </span>
                          ) : (
                            <span className="flex items-center gap-1.5 whitespace-nowrap">
                              {profile.buttonText}
                              <ArrowRight className="h-3.5 w-3.5 ml-1" />
                            </span>
                          )}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </CardContent>

              <CardFooter className="bg-slate-50/90 border-t border-slate-100 px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Sessão de Teste com RBAC Oficial Preservado</span>
                </div>
                <span className="font-mono text-[10px] text-slate-400">
                  QAS_AUTH_BYPASS · CIAFAL CRM
                </span>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>

      {/* Rodapé Corporativo */}
      <footer className="border-t border-slate-200/80 bg-white/80 backdrop-blur py-3 px-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} CIAFAL — Todos os direitos reservados. Sistema Corporativo
        Integrado de Gestão Comercial.
      </footer>
    </div>
  )
}
