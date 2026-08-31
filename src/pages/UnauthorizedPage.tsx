import { useNavigate } from 'react-router-dom'
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'

export default function UnauthorizedPage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const handleLogout = () => {
    signOut()
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50/20 to-slate-100 flex flex-col justify-between text-slate-800">
      {/* Top Header */}
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

        <div className="text-xs text-slate-500 font-medium">Controle de Acesso & RBAC</div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 max-w-lg mx-auto w-full">
        <Card className="border-red-200/80 shadow-xl bg-white/95 backdrop-blur overflow-hidden rounded-2xl w-full">
          <div className="h-2 bg-gradient-to-r from-red-600 via-amber-600 to-red-700" />

          <CardHeader className="space-y-2 text-center pb-4 pt-8">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shadow-inner">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <CardTitle className="text-2xl font-extrabold text-slate-900 pt-2">
              Acesso Não Autorizado
            </CardTitle>
            <CardDescription className="text-sm text-slate-600 max-w-sm mx-auto">
              Você não possui as permissões necessárias (HTTP 403) para acessar este recurso com seu
              perfil atual.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-0">
            {user && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Usuário conectado:</span>
                  <span className="font-semibold text-slate-800">{user.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Perfil atribuído:</span>
                  <span className="font-bold uppercase text-blue-700 px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
                    {user.role || 'VENDEDOR'}
                  </span>
                </div>
              </div>
            )}

            <div className="text-xs text-slate-500 leading-relaxed text-center">
              Se você acredita que deveria ter acesso a este módulo, solicite a alteração de
              privilégios ao seu Supervisor ou à Administração de TI CIAFAL.
            </div>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row gap-2.5 pt-2 pb-6 px-6">
            <Button
              variant="outline"
              onClick={() => navigate('/home')}
              className="w-full sm:flex-1 h-10 border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Meu Dia
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
              className="w-full sm:flex-1 h-10 bg-red-600 hover:bg-red-700 flex items-center justify-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Encerrar Sessão
            </Button>
          </CardFooter>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white/80 backdrop-blur py-3 px-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} CIAFAL — Todos os direitos reservados.
      </footer>
    </div>
  )
}
