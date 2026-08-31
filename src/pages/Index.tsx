import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  RefreshCw,
  Info,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Zap,
  Users,
  Sparkles,
  BarChart3,
  Layers,
} from 'lucide-react'
import {
  initiateLoginAndMfa,
  requestMfaOtp,
  verifyMfaOtp,
  isFixedTestOtpEnabled,
} from '@/services/mfa_service'

export default function Index() {
  const { user, signIn, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [step, setStep] = useState<'LOGIN' | 'MFA'>('LOGIN')
  const [otp, setOtp] = useState('')
  const [challengeToken, setChallengeToken] = useState<string | null>(null)
  const [mfaMode, setMfaMode] = useState<string>('TEST_FIXED')
  const [preAuthUser, setPreAuthUser] = useState<any>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [successNotice, setSuccessNotice] = useState<string | null>(null)

  const otpInputRef = useRef<HTMLInputElement>(null)

  // Se já autenticado, redireciona uma única vez para o Meu Dia (/home)
  useEffect(() => {
    if (!authLoading && user) {
      const from = (location.state as any)?.from?.pathname || '/home'
      navigate(from, { replace: true })
    }
  }, [user, authLoading, navigate, location])

  // Foco automático no campo OTP quando passar para etapa MFA
  useEffect(() => {
    if (step === 'MFA') {
      setTimeout(() => {
        otpInputRef.current?.focus()
      }, 150)
    }
  }, [step])

  // Temporizador de reenvio
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  // Etapa 1: Validação de Credenciais
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setError(null)
    setSuccessNotice(null)

    const cleanEmail = email.trim().toLowerCase()
    const cleanPass = password.trim()
    if (!cleanEmail || !cleanPass) {
      setError('Por favor, preencha o e-mail e a senha corporativa.')
      return
    }

    setLoading(true)

    try {
      // Inicia login e gera MFA challenge no backend
      const loginRes = await initiateLoginAndMfa(cleanEmail, cleanPass)

      if (loginRes.success && loginRes.mfa_required) {
        setChallengeToken(loginRes.challenge_id || null)
        setMfaMode(loginRes.mfa_mode || 'TEST_FIXED')
        setPreAuthUser(loginRes.user || null)
        setStep('MFA')
        setResendCooldown(30)
      } else {
        setError(loginRes.error || 'Usuário ou senha inválidos.')
      }
    } catch {
      setError('Usuário ou senha inválidos.')
    } finally {
      setLoading(false)
    }
  }

  // Etapa 2: Validação do Código OTP
  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setError(null)
    setSuccessNotice(null)

    const cleanEmail = email.trim().toLowerCase()
    // Tratamento estrito como string de 6 caracteres (sem conversão para Number)
    const cleanOtp = (otp || '').toString().trim()

    if (!cleanOtp) {
      setError('Por favor, digite o código de 6 dígitos.')
      return
    }

    if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      setError('Código de verificação inválido.')
      return
    }

    setLoading(true)

    try {
      const verifyResult = await verifyMfaOtp(cleanEmail, cleanOtp, challengeToken || undefined)

      if (verifyResult.valid) {
        // Armazenar JWT se retornado
        if (verifyResult.token) {
          try {
            localStorage.setItem('ciafal_jwt_token', verifyResult.token)
          } catch {
            /* intentionally ignored */
          }
        }

        // Efetiva a sessão autenticada com as credenciais/usuário autorizado
        const authenticatedUserData = verifyResult.user_details || preAuthUser
        const { error: authErr } = await signIn(cleanEmail, password, authenticatedUserData)
        if (authErr) {
          setError('Falha ao autenticar sessão. Tente novamente.')
          setLoading(false)
          return
        }

        setSuccessNotice('Acesso autorizado! Redirecionando para o Meu Dia...')
        setTimeout(() => {
          navigate('/home', { replace: true })
        }, 200)
      } else {
        setError(verifyResult.error || 'Código de verificação inválido.')
      }
    } catch {
      setError('Código de verificação inválido.')
    } finally {
      setLoading(false)
    }
  }

  // Reenviar código OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return
    setError(null)
    setLoading(true)

    try {
      const cleanEmail = email.trim().toLowerCase()
      const req = await requestMfaOtp(cleanEmail)
      if (req.success) {
        setChallengeToken(req.challenge_token || null)
        setResendCooldown(30)
        setSuccessNotice(
          mfaMode === 'TEST_FIXED'
            ? 'Desafio de homologação renovado.'
            : 'Um novo código de verificação foi emitido.',
        )
        setTimeout(() => setSuccessNotice(null), 4000)
      } else {
        setError(req.error || 'Não foi possível reenviar o código.')
      }
    } catch {
      setError('Não foi possível reenviar o código.')
    } finally {
      setLoading(false)
    }
  }

  const isHomologation = isFixedTestOtpEnabled()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/40 to-slate-100 flex flex-col justify-between text-slate-800">
      {/* Barra de Topo Institucional */}
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur px-6 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-blue-700 flex items-center justify-center text-white font-black text-xl shadow-sm tracking-wider">
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
          {isHomologation && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Ambiente de Homologação</span>
            </div>
          )}
          <div className="text-xs text-slate-500 font-medium">Portal Corporativo Seguro</div>
        </div>
      </header>

      {/* Conteúdo Central */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center w-full">
          {/* Coluna Esquerda: Apresentação Institucional CIAFAL */}
          <div className="lg:col-span-7 space-y-6 lg:pr-6">
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

          {/* Coluna Direita: Card de Autenticação / MFA */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto">
            <Card className="border-slate-200/90 shadow-xl bg-white/95 backdrop-blur overflow-hidden rounded-2xl">
              <div className="h-2 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600" />

              <CardHeader className="space-y-1.5 pb-4 pt-6">
                <div className="flex items-center justify-between">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700">
                    {step === 'LOGIN' ? (
                      <Lock className="h-5 w-5" />
                    ) : (
                      <ShieldCheck className="h-5 w-5 text-emerald-600" />
                    )}
                  </div>
                  {isHomologation && (
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-blue-100/80 text-blue-900 border border-blue-200">
                      Homologação QAS
                    </span>
                  )}
                </div>

                <CardTitle className="text-xl font-bold text-slate-900 pt-2">
                  {step === 'LOGIN' ? 'Acesso ao Sistema' : 'Verificação em Duas Etapas'}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  {step === 'LOGIN'
                    ? 'Informe seu e-mail corporativo institucional e senha.'
                    : mfaMode === 'TEST_FIXED'
                      ? 'Validação MFA do ambiente de homologação.'
                      : 'Digite o código de 6 dígitos enviado para seu e-mail institucional seguro.'}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 pt-0">
                {/* Alertas de Erro ou Sucesso */}
                {error && (
                  <Alert
                    variant="destructive"
                    className="bg-red-50/90 border-red-200 text-red-900 text-xs py-2.5"
                  >
                    <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                    <div>
                      <AlertTitle className="font-semibold text-red-800 text-xs">
                        Atenção
                      </AlertTitle>
                      <AlertDescription className="text-red-700 text-xs mt-0.5">
                        {error}
                      </AlertDescription>
                    </div>
                  </Alert>
                )}

                {successNotice && (
                  <Alert className="bg-emerald-50 border-emerald-200 text-emerald-900 text-xs py-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <div>
                      <AlertDescription className="text-emerald-800 text-xs font-medium">
                        {successNotice}
                      </AlertDescription>
                    </div>
                  </Alert>
                )}

                {/* ETAPA 1: Login */}
                {step === 'LOGIN' && (
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs font-medium text-slate-700">
                        E-mail Institucional
                      </Label>
                      <div className="relative">
                        <Mail className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="usuario@ciafal.local"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-9 text-sm h-10 border-slate-200 focus:border-blue-600 focus:ring-blue-600"
                          required
                          disabled={loading}
                          autoComplete="username"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="password" className="text-xs font-medium text-slate-700">
                        Senha de Acesso
                      </Label>
                      <div className="relative">
                        <Lock className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-9 text-sm h-10 border-slate-200 focus:border-blue-600 focus:ring-blue-600"
                          required
                          disabled={loading}
                          autoComplete="current-password"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold h-10 shadow-sm transition-all text-sm mt-2"
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Validando credenciais...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          Continuar para Verificação
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      )}
                    </Button>
                  </form>
                )}

                {/* ETAPA 2: MFA / OTP */}
                {step === 'MFA' && (
                  <form onSubmit={handleMfaSubmit} className="space-y-4">
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1">
                      <div className="flex items-center justify-between font-medium text-slate-700">
                        <span>Usuário autenticado:</span>
                        <span className="text-blue-700 font-semibold">{email}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {mfaMode === 'TEST_FIXED'
                          ? 'Informe o código MFA configurado para seu usuário de homologação.'
                          : 'Um código numérico de 6 dígitos foi gerado para confirmação do seu acesso.'}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="otp" className="text-xs font-semibold text-slate-800">
                        CÓDIGO OTP (6 DÍGITOS)
                      </Label>
                      <Input
                        ref={otpInputRef}
                        id="otp"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        placeholder="••••••"
                        value={otp}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                          setOtp(val)
                        }}
                        onPaste={(e) => {
                          e.preventDefault()
                          const pastedData = e.clipboardData.getData('text')
                          const cleanPasted = pastedData.replace(/\D/g, '').slice(0, 6)
                          setOtp(cleanPasted)
                        }}
                        className="text-center font-mono text-xl tracking-[0.4em] font-bold h-12 border-slate-300 focus:border-blue-700 focus:ring-blue-700 bg-white"
                        required
                        disabled={loading}
                      />
                      <p className="text-[11px] text-slate-400">
                        Digite os 6 números ou cole diretamente o código.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold h-11 shadow-sm transition-all text-sm"
                      disabled={loading || otp.length !== 6}
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Validando...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <ShieldCheck className="h-4 w-4" />
                          Validar e Entrar
                        </span>
                      )}
                    </Button>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setStep('LOGIN')
                          setOtp('')
                          setError(null)
                        }}
                        className="text-slate-500 hover:text-slate-800 transition-colors font-medium"
                      >
                        ← Voltar ao login
                      </button>

                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={resendCooldown > 0 || loading}
                        className="text-blue-700 hover:text-blue-800 font-semibold disabled:text-slate-400 disabled:cursor-not-allowed"
                      >
                        {resendCooldown > 0
                          ? `Reenviar código em ${resendCooldown}s`
                          : 'Reenviar código'}
                      </button>
                    </div>
                  </form>
                )}
              </CardContent>

              <CardFooter className="bg-slate-50/80 border-t border-slate-100 px-6 py-3.5 flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Sessão Protegida por Criptografia</span>
                </div>
                <span>CIAFAL v2.4</span>
              </CardFooter>
            </Card>

            {/* Guia Informativo Discreto de Homologação */}
            {isHomologation && (
              <div className="mt-4 p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 text-[11px] text-blue-900/90 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-blue-900">
                  <Info className="h-3.5 w-3.5 text-blue-700" />
                  <span>Ambiente de Testes / Homologação:</span>
                </div>
                <p className="text-slate-600 leading-normal">
                  Usuários oficiais de teste aceitam a senha institucional de homologação e o código
                  OTP configurado para o ambiente.
                </p>
              </div>
            )}
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
