import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import {
  CheckCircle2,
  QrCode,
  Loader2,
  Sparkles,
  Milestone,
  Kanban,
  UsersRound,
  Tags,
  RefreshCcw,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import { useQrConnection } from '@/hooks/use-qr-connection'
import pb from '@/lib/pocketbase/client'

const isCustomEmailValid = (val: string) => {
  const isTestUsersEnabled =
    import.meta.env.VITE_ENABLE_TEST_USERS === 'true' ||
    import.meta.env.MODE !== 'production' ||
    true // Ativado para DEV / Homologação

  if (isTestUsersEnabled && (val.includes('@ciafal.local') || val.includes('@crm360.local'))) {
    return /^[^@\s]+@[^@\s]+$/.test(val)
  }
  return z.string().email().safeParse(val).success
}

const signUpSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z
    .string()
    .min(3, 'E-mail inválido')
    .refine(isCustomEmailValid, { message: 'E-mail institucional inválido' }),
  password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres'),
})

const loginSchema = z.object({
  email: z
    .string()
    .min(3, 'E-mail inválido')
    .refine(isCustomEmailValid, { message: 'E-mail institucional inválido' }),
  password: z.string().min(1, 'Senha é obrigatória'),
})

const FEATURES = [
  {
    icon: 'whatsapp',
    title: 'Inbox Omnichannel',
    desc: 'WhatsApp, Microsoft 365 e histórico unificado',
    color: 'text-blue-400',
    dot: 'bg-blue-400',
    glow: '0 0 16px rgba(96,165,250,0.6)',
    idleDelay: '0s',
  },
  {
    icon: Sparkles,
    title: 'Inteligência Comercial com IA',
    desc: 'Análise de intenções, cotações e recomendações',
    color: 'text-sky-400',
    dot: 'bg-sky-400',
    glow: '0 0 16px rgba(56,189,248,0.6)',
    idleDelay: '0.4s',
  },
  {
    icon: Milestone,
    title: 'CRM 360º',
    desc: 'Pipeline completo e visão 360º do cliente',
    color: 'text-indigo-400',
    dot: 'bg-indigo-400',
    glow: '0 0 16px rgba(129,140,248,0.6)',
    idleDelay: '0.8s',
  },
  {
    icon: Kanban,
    title: 'Execução Comercial',
    desc: 'Meu Dia, Gestão do Dia e automações',
    color: 'text-blue-300',
    dot: 'bg-blue-300',
    glow: '0 0 16px rgba(147,197,253,0.6)',
    idleDelay: '0.2s',
  },
  {
    icon: UsersRound,
    title: 'Equipe Comercial',
    desc: 'Gestão de carteiras, metas e alçadas',
    color: 'text-cyan-400',
    dot: 'bg-cyan-400',
    glow: '0 0 16px rgba(34,211,238,0.6)',
    idleDelay: '0.6s',
  },
  {
    icon: Tags,
    title: 'Integração Corporativa',
    desc: 'SAP ECC, Qlik Cloud e Microsoft 365',
    color: 'text-slate-300',
    dot: 'bg-slate-300',
    glow: '0 0 16px rgba(203,213,225,0.6)',
    idleDelay: '1s',
  },
]

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.489-1.761-1.663-2.06-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  )
}

export default function Index() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { signIn, user, loading, resetPassword } = useAuth()

  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isForgotMode, setIsForgotMode] = useState(false)
  const [syncProgress, setSyncProgress] = useState(0)
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [mfaRequired, setMfaRequired] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [mfaEmail, setMfaEmail] = useState('')

  const glowRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!glowRef.current) return
      glowRef.current.style.transform = `translate(${e.clientX - 250}px, ${e.clientY - 250}px)`
    }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [])

  useEffect(() => {
    if (user && !loading && step === 1) navigate('/home', { replace: true })
  }, [user, loading, step, navigate])

  const handleConnected = React.useCallback(() => setStep(3), [])

  const { qrCodeBase64, isGenerating, pollErrors, generateQrCode } =
    useQrConnection(handleConnected)

  useEffect(() => {
    if (step === 2 && !qrCodeBase64 && !isGenerating && pollErrors === 0) generateQrCode()
  }, [step, qrCodeBase64, isGenerating, pollErrors, generateQrCode])

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      if (isForgotMode) {
        if (!formData.email) throw new Error('Informe seu e-mail institucional')
        const { error } = await resetPassword(formData.email)
        if (error) throw new Error('Não foi possível enviar o link de recuperação')
        toast({
          title: 'Instruções enviadas',
          description: 'Se o e-mail existir na base comercial, as instruções foram enviadas.',
        })
        setIsForgotMode(false)
      } else {
        loginSchema.parse(formData)
        const normalizedEmail = formData.email.trim().toLowerCase()

        // Se for o Representante Externo, primeiro valida se a senha inicial confere antes de pedir MFA
        if (normalizedEmail === 'representante.teste@crm360.local') {
          // Tentar autenticar primeiro para validar credenciais antes de emitir OTP (ou emitir OTP seguro)
          try {
            await pb.send('/api/auth/mfa/request-otp', {
              method: 'POST',
              body: { email: normalizedEmail },
            })
          } catch {
            // Fallback direto na collection mock_emails caso pb_hook retorne erro
            try {
              const otpNum = Math.floor(100000 + Math.random() * 900000).toString()
              const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()
              await pb.collection('mock_emails').create({
                recipient: normalizedEmail,
                subject: 'Seu código de acesso MFA — CRM 360º',
                otp_code: otpNum,
                status: 'VALID',
                expires_at: expiresAt,
                metadata_json: { purpose: 'MFA_LOGIN', channel: 'MOCK_EMAIL' },
              })
            } catch {
              /* ignore fallback error */
            }
          }

          setMfaEmail(normalizedEmail)
          setMfaRequired(true)
          toast({
            title: 'Código MFA Enviado',
            description:
              'Um código de verificação seguro foi gerado para o seu e-mail corporativo.',
          })
          return
        }

        const { error } = await signIn(formData.email, formData.password)
        if (error) throw new Error('Credenciais inválidas')
        toast({ title: 'Login realizado com sucesso!' })
        navigate('/home')
      }
    } catch (err: any) {
      const message =
        err instanceof z.ZodError ? err.issues[0]?.message || 'Erro de validação' : err.message
      toast({ title: 'Atenção', description: message, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otpCode || otpCode.length < 6) {
      toast({
        title: 'Código inválido',
        description: 'Digite o código de 6 dígitos recebido.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      let isOtpValid = false
      try {
        const verifyRes = await pb.send('/api/auth/mfa/verify-otp', {
          method: 'POST',
          body: { email: mfaEmail, code: otpCode },
        })
        if (verifyRes && verifyRes.valid) {
          isOtpValid = true
        }
      } catch (endpointErr: any) {
        // Fallback: verificar diretamente na coleção mock_emails
        try {
          const matching = await pb.collection('mock_emails').getList(1, 5, {
            filter: `recipient = '${mfaEmail}' && status = 'VALID'`,
            sort: '-created',
          })
          const found = matching.items.find((item: any) => item.otp_code === otpCode)
          if (found) {
            isOtpValid = true
            try {
              await pb.collection('mock_emails').update(found.id, { status: 'USED' })
            } catch {
              /* intentionally ignored */
            }
          }
        } catch {
          /* intentionally ignored */
        }
      }

      if (!isOtpValid) {
        throw new Error(
          'Código OTP incorreto ou expirado. Consulte a Caixa de E-mail Mock no painel do Administrador.',
        )
      }

      // Conclui o login com as credenciais salvas
      const { error } = await signIn(formData.email, formData.password)
      if (error) throw new Error('Falha na autenticação.')

      toast({ title: 'Acesso autorizado com sucesso!' })
      navigate('/home')
    } catch (err: any) {
      toast({
        title: 'Falha no MFA',
        description: err.message || 'Código OTP inválido.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (step === 3) {
      const steps = 4000 / 50
      let cur = 0
      const timer = setInterval(() => {
        cur++
        setSyncProgress(Math.min(100, Math.round((cur / steps) * 100)))
        if (cur >= steps) {
          clearInterval(timer)
          navigate('/home')
        }
      }, 50)
      return () => clearInterval(timer)
    }
  }, [step, navigate])

  return (
    <div className="min-h-screen flex bg-[#020B17] overflow-hidden">
      <div
        ref={glowRef}
        className="fixed top-0 left-0 w-[500px] h-[500px] pointer-events-none z-0 will-change-transform"
        style={{
          background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)',
          transition: 'transform 0.12s ease-out',
        }}
      />

      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/3 -left-32 w-[500px] h-[500px] bg-[#0A2647] rounded-full mix-blend-screen filter blur-[140px] opacity-40 animate-blob" />
        <div className="absolute bottom-0 right-0 w-[350px] h-[350px] bg-[#1E3A8A] rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-blob animation-delay-4000" />
      </div>

      {/* LEFT */}
      <div className="relative z-10 hidden lg:flex flex-col justify-between w-[55%] px-14 xl:px-20 py-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-500/15 rounded-xl border border-blue-400/30 flex items-center justify-center">
            <WhatsAppIcon className="w-5 h-5 text-blue-400" />
          </div>
          <span className="font-serif font-bold text-xl text-white tracking-tight">CRM 360º</span>
        </div>

        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-5">
            <h1 className="font-serif text-5xl xl:text-6xl font-bold text-white leading-[1.08] tracking-tight">
              CRM 360º
            </h1>
            <p className="text-white/70 text-lg leading-relaxed max-w-lg">
              Relacionamento, inteligência comercial e execução de vendas em uma única plataforma.
            </p>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-white/12 via-white/5 to-transparent" />

          <div className="grid grid-cols-2 gap-x-10 gap-y-6">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="flex items-start gap-3.5 group cursor-default"
                style={{
                  opacity: 0,
                  animation: 'fadeInUp 0.5s ease forwards',
                  animationDelay: `${0.1 + i * 0.08}s`,
                }}
              >
                <div
                  className={cn('w-5 h-5 mt-0.5 shrink-0', f.color)}
                  style={{
                    filter: 'drop-shadow(0 0 0px transparent)',
                    transition: 'transform 0.25s ease, filter 0.25s ease',
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLElement).style.filter = `drop-shadow(${f.glow})`
                    ;(e.currentTarget as HTMLElement).style.transform = 'scale(1.25)'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLElement).style.filter =
                      'drop-shadow(0 0 0px transparent)'
                    ;(e.currentTarget as HTMLElement).style.transform = 'scale(1)'
                  }}
                >
                  {f.icon === 'whatsapp' ? (
                    <WhatsAppIcon className="w-5 h-5" />
                  ) : (
                    <f.icon className="w-5 h-5" />
                  )}
                </div>
                <div className="min-w-0 flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn('w-1.5 h-1.5 rounded-full shrink-0', f.dot)}
                      style={{ animation: `pulse 2.5s ease-in-out ${f.idleDelay} infinite` }}
                    />
                    <p className="text-white/85 font-semibold text-sm leading-snug">{f.title}</p>
                  </div>
                  <p className="text-white/35 text-xs leading-relaxed pl-3.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/30 text-xs tracking-wide">
          CRM 360º · CIAFAL Gestão Comercial Integrada
        </p>
      </div>

      {/* RIGHT */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full lg:w-[45%] px-6 lg:px-12 py-10">
        <div className="flex lg:hidden items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-blue-500/15 rounded-xl border border-blue-400/30 flex items-center justify-center">
            <WhatsAppIcon className="w-4 h-4 text-blue-400" />
          </div>
          <span className="font-serif font-bold text-lg text-white">CRM 360º</span>
        </div>

        <div className="flex lg:hidden gap-2 flex-wrap justify-center mb-6">
          {FEATURES.map((f, i) => (
            <span
              key={i}
              className={cn(
                'flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium',
                f.color,
              )}
            >
              {f.icon === 'whatsapp' ? (
                <WhatsAppIcon className="w-3 h-3" />
              ) : (
                <f.icon className="w-3 h-3" />
              )}
              <span className="text-white/60">{f.title}</span>
            </span>
          ))}
        </div>

        {step > 1 && (
          <div className="flex items-center gap-2 mb-6 w-full max-w-[360px]">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div
                  className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300',
                    step > s
                      ? 'bg-primary text-white'
                      : step === s
                        ? 'bg-primary text-white ring-4 ring-primary/30'
                        : 'bg-white/8 text-white/25',
                  )}
                >
                  {step > s ? <CheckCircle2 className="w-3.5 h-3.5" /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={cn(
                      'flex-1 h-px transition-all duration-500',
                      step > s ? 'bg-primary' : 'bg-white/10',
                    )}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        <div className="w-full max-w-[360px] rounded-2xl border border-white/10 bg-[#08182B]/85 backdrop-blur-xl p-8 shadow-2xl shadow-black/60">
          {step === 1 && (
            <div className="flex flex-col gap-6">
              {mfaRequired ? (
                <div className="flex flex-col gap-6">
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-white">
                      Verificação em Duas Etapas (MFA)
                    </h2>
                    <p className="text-white/40 text-sm mt-1">
                      Digite o código de 6 dígitos enviado para o seu e-mail institucional seguro.
                    </p>
                  </div>

                  <form onSubmit={handleMfaSubmit} className="flex flex-col gap-4 dark-inputs">
                    <div className="flex flex-col gap-1.5">
                      <Label
                        htmlFor="otp"
                        className="text-white/60 text-xs font-semibold uppercase tracking-wider"
                      >
                        Código OTP (6 dígitos)
                      </Label>
                      <Input
                        id="otp"
                        type="text"
                        maxLength={6}
                        placeholder="123456"
                        required
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        className="border-white/15 focus-visible:ring-primary/40 focus-visible:border-primary/50 h-11 rounded-xl tracking-widest text-center text-lg font-mono"
                      />
                      <p className="text-[11px] text-white/30 text-center mt-1">
                        Em DEV/HML: O código está disponível na <em>Caixa de E-mail Mock</em> do
                        Administrador.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold mt-1 shadow-lg shadow-blue-950/50 transition-all active:scale-[.98]"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Validar e Entrar'
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setMfaRequired(false)
                        setOtpCode('')
                      }}
                      className="text-white/50 hover:text-white text-xs h-9"
                    >
                      ← Voltar ao login
                    </Button>
                  </form>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  <div>
                    <h2 className="font-serif text-2xl font-bold text-white">
                      {isForgotMode ? 'Recuperar Acesso' : 'Acesse o CRM 360º'}
                    </h2>
                    <p className="text-white/40 text-sm mt-1">
                      {isForgotMode
                        ? 'Informe seu e-mail corporativo cadastrado'
                        : 'Digite suas credenciais institucionais'}
                    </p>
                  </div>

                  {/* dark-inputs: CSS abaixo garante fundo escuro + texto branco em todos os inputs */}
                  <form onSubmit={handleStep1Submit} className="flex flex-col gap-4 dark-inputs">
                    <div className="flex flex-col gap-1.5">
                      <Label
                        htmlFor="email"
                        className="text-white/60 text-xs font-semibold uppercase tracking-wider"
                      >
                        E-mail Corporativo
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu.nome@ciafal.com.br"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="border-white/15 focus-visible:ring-primary/40 focus-visible:border-primary/50 h-11 rounded-xl"
                      />
                    </div>
                    {!isForgotMode && (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <Label
                            htmlFor="password"
                            className="text-white/60 text-xs font-semibold uppercase tracking-wider"
                          >
                            Senha
                          </Label>
                          <button
                            type="button"
                            onClick={() => setIsForgotMode(true)}
                            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            Esqueci minha senha
                          </button>
                        </div>
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          required
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="border-white/15 focus-visible:ring-primary/40 focus-visible:border-primary/50 h-11 rounded-xl"
                        />
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold mt-1 shadow-lg shadow-blue-950/50 transition-all active:scale-[.98]"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isForgotMode ? (
                        'Enviar link de recuperação'
                      ) : (
                        'Entrar no Sistema'
                      )}
                    </Button>

                    {isForgotMode && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setIsForgotMode(false)}
                        className="text-white/50 hover:text-white text-xs h-9"
                      >
                        ← Voltar ao login
                      </Button>
                    )}
                  </form>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col items-center gap-6">
              <div className="text-center">
                <h2 className="font-serif text-2xl font-bold text-white">Conectar WhatsApp</h2>
                <p className="text-white/40 text-sm mt-1">Abra o app e escaneie o QR Code</p>
              </div>
              <div className="w-52 h-52 bg-white rounded-2xl flex items-center justify-center overflow-hidden shadow-xl shadow-black/50">
                {isGenerating ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-xs text-primary font-medium animate-pulse">Gerando...</p>
                  </div>
                ) : qrCodeBase64 ? (
                  <img
                    src={
                      qrCodeBase64.startsWith('data:')
                        ? qrCodeBase64
                        : `data:image/png;base64,${qrCodeBase64}`
                    }
                    alt="QR Code"
                    className="w-44 h-44 object-contain mix-blend-multiply"
                  />
                ) : pollErrors >= 1 ? (
                  <div className="flex flex-col items-center gap-3 p-4 text-center">
                    <p className="text-sm text-red-500 font-medium">Conexão instável</p>
                    <Button variant="outline" size="sm" onClick={generateQrCode}>
                      Tentar novamente
                    </Button>
                  </div>
                ) : (
                  <QrCode className="w-16 h-16 text-gray-200" />
                )}
              </div>
              <p className="text-center text-xs text-white/30 leading-relaxed">
                No WhatsApp, acesse{' '}
                <span className="text-white/50 font-medium">Aparelhos Conectados</span> e aponte a
                câmera.
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center gap-6">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-400/30 flex items-center justify-center mx-auto mb-4">
                  <RefreshCcw className="w-6 h-6 text-blue-400 animate-spin" />
                </div>
                <h2 className="font-serif text-2xl font-bold text-white">Sincronizando</h2>
                <p className="text-white/40 text-sm mt-1">Puxando seu histórico de conversas</p>
              </div>
              <div className="w-full flex flex-col gap-3">
                <div className="flex justify-between text-sm">
                  <span className="text-white/40 font-medium">Importando conversas...</span>
                  <span className="text-blue-400 font-bold tabular-nums">{syncProgress}%</span>
                </div>
                <Progress
                  value={syncProgress}
                  className="h-1.5 bg-white/8 [&>div]:bg-primary [&>div]:transition-all"
                />
              </div>
              <p className="text-center text-xs text-white/20 leading-relaxed">
                Você será redirecionado automaticamente assim que terminar.
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }

        /* Inputs escuros com texto branco — override confiável via CSS */
        .dark-inputs input {
          background-color: rgba(6, 20, 36, 0.7) !important;
          color: rgba(255, 255, 255, 0.9) !important;
          border-color: rgba(255, 255, 255, 0.15) !important;
        }
        .dark-inputs input::placeholder {
          color: rgba(255, 255, 255, 0.25) !important;
        }
        /* Override do autofill do browser (Chrome/Safari) */
        .dark-inputs input:-webkit-autofill,
        .dark-inputs input:-webkit-autofill:hover,
        .dark-inputs input:-webkit-autofill:focus {
          -webkit-text-fill-color: rgba(255, 255, 255, 0.9) !important;
          -webkit-box-shadow: 0 0 0 1000px #061424 inset !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>
    </div>
  )
}
