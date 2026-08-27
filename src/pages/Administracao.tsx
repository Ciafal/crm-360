import React, { useState, useEffect } from 'react'
import {
  Mail,
  Shield,
  Key,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Search,
  Users,
  Server,
  Terminal,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { PageLoadingState, PageEmptyState, PageErrorState } from '@/components/shared/StateFeedback'

interface MockEmailItem {
  id: string
  recipient: string
  subject: string
  otp_code: string
  status: 'VALID' | 'EXPIRED' | 'USED' | string
  expires_at?: string
  created: string
}

export default function Administracao() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [emails, setEmails] = useState<MockEmailItem[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const isAdmin =
    user?.role === 'administrador' ||
    user?.role === 'ti' ||
    user?.role === 'diretoria' ||
    user?.email === 'admin.teste@ciafal.local' ||
    user?.email === 'fabiano@adapta.org'

  const loadMockEmails = async () => {
    setLoading(true)
    try {
      // 1. Tentar endpoint customizado /api/mock/emails
      const res = await pb.send('/api/mock/emails', { method: 'GET' })
      if (res && res.items) {
        setEmails(res.items)
      }
    } catch (_) {
      // Fallback via coleção mock_emails se o endpoint falhar
      try {
        const records = await pb.collection('mock_emails').getList(1, 50, {
          sort: '-created',
        })
        const items = records.items.map((r: any) => ({
          id: r.id,
          recipient: r.recipient,
          subject: r.subject,
          otp_code: r.otp_code,
          status: r.status,
          expires_at: r.expires_at,
          created: r.created,
        }))
        setEmails(items)
      } catch (err) {
        console.error('Erro ao carregar e-mails mock:', err)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      loadMockEmails()
    } else {
      setLoading(false)
    }
  }, [isAdmin])

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
    toast({
      title: 'Código OTP Copiado',
      description: `Código ${text} copiado para a área de transferência.`,
    })
  }

  const filteredEmails = emails.filter(
    (e) =>
      e.recipient.toLowerCase().includes(search.toLowerCase()) ||
      e.subject.toLowerCase().includes(search.toLowerCase()) ||
      e.otp_code.includes(search),
  )

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center animate-fade-in">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-200">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-foreground">Acesso Restrito</h2>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto text-sm">
          A seção de Administração e a Caixa de E-mail Mock são restritas ao Administrador do
          sistema.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-3xl font-bold text-primary tracking-tight">
              Administração & Mocks
            </h1>
            <Badge
              variant="outline"
              className="text-xs bg-amber-50 text-amber-700 border-amber-300"
            >
              Modo Teste / HML
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Painel de controle, auditoria de integrações e Caixa de E-mail Mock para códigos de MFA.
          </p>
        </div>

        <Button
          onClick={loadMockEmails}
          variant="outline"
          size="sm"
          className="h-9 gap-2 shadow-xs"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar Caixa
        </Button>
      </div>

      {/* Grid de Métricas de Ambiente de Teste */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-border/60 bg-white shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Ambiente Atual
              </span>
              <span className="font-bold text-primary text-base">DEV / Pré-Homologação</span>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-border/60 bg-white shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Usuários de Teste
              </span>
              <span className="font-bold text-emerald-700 text-base">5 Contas Ativas (v0.0.6)</span>
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border-border/60 bg-white shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                ENABLE_TEST_USERS
              </span>
              <span className="font-bold text-amber-700 text-base">Habilitado (true)</span>
            </div>
          </div>
        </Card>
      </div>

      {/* CAIXA DE E-MAIL MOCK (MFA) */}
      <Card className="rounded-3xl border-border/60 bg-white shadow-sm overflow-hidden">
        <CardHeader className="p-6 border-b bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary text-primary-foreground rounded-xl">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="font-serif text-xl font-bold text-primary">
                Caixa de E-mail Mock (MFA / OTP)
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Códigos de verificação OTP gerados para usuários externos durante o login em teste.
              </CardDescription>
            </div>
          </div>

          <div className="w-full sm:w-64">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por e-mail ou código..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 text-xs pl-9 rounded-xl"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground text-sm flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" /> Carregando mensagens...
            </div>
          ) : filteredEmails.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              <Mail className="w-8 h-8 mx-auto mb-2 opacity-30" />
              Nenhum código OTP foi solicitado ainda.
              <p className="text-xs text-muted-foreground/60 mt-1">
                Faça login com{' '}
                <code className="bg-slate-100 px-1 py-0.5 rounded">
                  representante.teste@crm360.local
                </code>{' '}
                para gerar um OTP.
              </p>
            </div>
          ) : (
            <div className="p-4 bg-muted/20 border-b border-border/40 text-xs text-muted-foreground flex flex-col sm:flex-row justify-between gap-2">
              <span>
                <strong>Como utilizar o OTP:</strong> Quando o Representante Externo (
                <code>representante.teste@crm360.local</code>) tentar logar com{' '}
                <code>teste123</code>, o OTP de 6 dígitos aparece aqui. Copie e informe ao testador
                para concluir o acesso.
              </span>
            </div>
          )}
          {filteredEmails.length > 0 && (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-border/60 text-[11px] uppercase font-bold text-muted-foreground tracking-wider">
                  <th className="p-4">Destinatário</th>
                  <th className="p-4">Assunto</th>
                  <th className="p-4 text-center">Código OTP</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4">Gerado em</th>
                  <th className="p-4">Expira em</th>
                  <th className="p-4 text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filteredEmails.map((item) => {
                  const isExpired =
                    item.status === 'EXPIRED' ||
                    (item.expires_at && new Date(item.expires_at).getTime() < Date.now())

                  return (
                    <tr key={item.id} className="hover:bg-primary/5 transition-colors">
                      <td className="p-4 font-semibold text-foreground">{item.recipient}</td>
                      <td className="p-4 text-muted-foreground">{item.subject}</td>
                      <td className="p-4 text-center">
                        <span className="font-mono font-bold text-sm bg-slate-100 text-primary px-2.5 py-1 rounded-md border border-slate-200 tracking-widest">
                          {item.otp_code}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {item.status === 'USED' ? (
                          <Badge
                            variant="outline"
                            className="bg-slate-100 text-slate-600 border-slate-300 text-[10px]"
                          >
                            Utilizado
                          </Badge>
                        ) : isExpired ? (
                          <Badge
                            variant="outline"
                            className="bg-rose-50 text-rose-700 border-rose-300 text-[10px]"
                          >
                            Expirado
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px] font-bold"
                          >
                            Válido
                          </Badge>
                        )}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {new Date(item.created).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {item.expires_at
                          ? new Date(item.expires_at).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '10 min'}
                      </td>
                      <td className="p-4 text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs"
                          onClick={() => copyToClipboard(item.otp_code, item.id)}
                          title="Copiar código OTP para informar ao testador"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
