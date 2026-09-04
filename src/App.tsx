import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppProvider } from '@/stores/useAppStore'
import { AuthProvider, useAuth } from '@/hooks/use-auth'

import Layout from '@/components/Layout'
import Index from '@/pages/Index'
import Home from '@/pages/Home'
import Conversas from '@/pages/Conversas'
import CRM from '@/pages/CRM'
import CotacoesPage from '@/pages/CotacoesPage'
import NovaCotacao from '@/pages/NovaCotacao'
import { CotacoesModule } from '@/components/cotacoes/CotacoesModule'
import SapOrdersMonitor from '@/pages/SapOrdersMonitor'
import Agentes from '@/pages/Agentes'
import Tarefas from '@/pages/Tarefas'
import Equipe from '@/pages/Equipe'
import GestaoInativos from '@/pages/GestaoInativos'
import Cliente360 from '@/pages/Cliente360'
import GestaoDoDia from '@/pages/GestaoDoDia'
import Visitas from '@/pages/Visitas'
import Administracao from '@/pages/Administracao'
import Setup from '@/pages/Setup'
import SolicitacoesCorporativas from '@/pages/SolicitacoesCorporativas'
import HCMCompliance from '@/pages/HCMCompliance'
import ImportacaoPlanejamentoEstrategico from '@/pages/ImportacaoPE'
import { ContatosPage } from '@/pages/Contatos'
import IndicadoresComerciais from '@/pages/IndicadoresComerciais'
import Hypercare from '@/pages/Hypercare'
import RelatorioRelease from '@/pages/RelatorioRelease'
import ParametrosSapPage from '@/pages/ParametrosSapPage'
import { ProtectedAdminRoute } from '@/components/auth/ProtectedAdminRoute'
import CentralIntegracoes from '@/pages/CentralIntegracoes'
import AgenteFredPage from '@/pages/AgenteFredPage'
import SatisfacaoClientes from '@/pages/SatisfacaoClientes'
import EstoquePage from '@/pages/EstoquePage'
import CentralAcoesPage from '@/pages/CentralAcoesPage'
import GestaoClientesPage from '@/pages/GestaoClientesPage'
import PlanejamentoSop from '@/pages/PlanejamentoSop'
import ConsultasPage from '@/pages/ConsultasPage'
import NotFound from '@/pages/NotFound'
import UnauthorizedPage from '@/pages/UnauthorizedPage'

interface ProtectedRouteProps {
  allowedRoles?: string[]
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/crm360/login" replace />

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = (user.role || '').toString().toUpperCase()
    const isAllowed = allowedRoles.some((r) => r.toUpperCase() === userRole)
    if (!isAllowed) {
      return <Navigate to="/crm360/nao-autorizado" replace />
    }
  }

  return <Outlet />
}

const App = () => (
  <AuthProvider>
    <AppProvider>
      <BrowserRouter>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            {/* Rota Raiz Canônica: Redireciona diretamente para /crm360/home.
                Se o usuário não estiver autenticado (ou com bypass ativo),
                a proteção de rota interna ProtectedRoute redireciona para /crm360/login. */}
            <Route path="/" element={<Navigate to="/crm360/home" replace />} />

            {/* Rotas Públicas / Autenticação sob namespace /crm360 */}
            <Route path="/crm360/login" element={<Index />} />
            <Route path="/crm360/setup" element={<Setup />} />
            <Route path="/crm360/nao-autorizado" element={<UnauthorizedPage />} />
            <Route path="/crm360/unauthorized" element={<UnauthorizedPage />} />

            {/* Redirecionamentos de rotas públicas legadas */}
            <Route path="/login" element={<Navigate to="/crm360/login" replace />} />
            <Route path="/setup" element={<Navigate to="/crm360/setup" replace />} />
            <Route
              path="/nao-autorizado"
              element={<Navigate to="/crm360/nao-autorizado" replace />}
            />
            <Route path="/unauthorized" element={<Navigate to="/crm360/unauthorized" replace />} />

            {/* Redirecionamento da raiz do CRM para a home canônica */}
            <Route path="/crm360" element={<Navigate to="/crm360/home" replace />} />

            {/* ========================================================================= */}
            {/* ROTAS OFICIAIS DO MÓDULO CRM 360º CIAFAL (PREFIXADAS SOB /crm360/*)       */}
            {/* ========================================================================= */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                {/* 1. Meu Dia / Home */}
                <Route path="/crm360/home" element={<Home />} />
                <Route path="/crm360/meu-dia" element={<Home />} />
                <Route path="/crm360/gestao-do-dia" element={<GestaoDoDia />} />

                {/* 2. Contatos (Omnichannel) */}
                <Route path="/crm360/contatos" element={<ContatosPage />} />
                <Route path="/crm360/conversas" element={<Conversas />} />
                <Route path="/crm360/whatsapp" element={<Conversas />} />

                {/* 3. Cotações */}
                <Route path="/crm360/cotacoes" element={<CotacoesModule />} />
                <Route path="/crm360/cotacoes/nova" element={<NovaCotacao />} />
                <Route path="/crm360/cotacoes/:id" element={<NovaCotacao />} />
                <Route path="/crm360/crm/cotacoes" element={<CotacoesModule />} />
                <Route path="/crm360/crm/cotacoes/nova" element={<NovaCotacao />} />
                <Route path="/crm360/crm/cotacoes/:id" element={<NovaCotacao />} />

                {/* 4. CRM 360 / Pipeline / Oportunidades */}
                <Route path="/crm360/crm" element={<CRM />} />
                <Route path="/crm360/crm/oportunidades" element={<CRM />} />
                <Route path="/crm360/oportunidades" element={<CRM />} />
                <Route path="/crm360/cliente/:id" element={<Cliente360 />} />
                <Route path="/crm360/crm/:id" element={<Cliente360 />} />

                {/* 5. Tarefas */}
                <Route path="/crm360/tarefas" element={<Tarefas />} />

                {/* 6. KPIs Comerciais / Indicadores / Metas */}
                <Route path="/crm360/kpis" element={<IndicadoresComerciais />} />
                <Route path="/crm360/kpis-comerciais" element={<IndicadoresComerciais />} />
                <Route path="/crm360/indicadores" element={<IndicadoresComerciais />} />
                <Route path="/crm360/metas" element={<ImportacaoPlanejamentoEstrategico />} />
                <Route
                  path="/crm360/planejamento-estrategico"
                  element={<ImportacaoPlanejamentoEstrategico />}
                />
                <Route path="/crm360/importar-pe" element={<ImportacaoPlanejamentoEstrategico />} />

                {/* 7. Gestão de Clientes / Carteira / Cobertura */}
                <Route path="/crm360/gestao-clientes" element={<GestaoClientesPage />} />
                <Route path="/crm360/clientes" element={<GestaoClientesPage />} />
                <Route path="/crm360/carteira" element={<GestaoClientesPage />} />
                <Route path="/crm360/cobertura" element={<GestaoClientesPage />} />

                {/* 8. Satisfação de Clientes (ISC / OTIF / NPS) */}
                <Route path="/crm360/satisfacao" element={<SatisfacaoClientes />} />
                <Route path="/crm360/satisfacao-clientes" element={<SatisfacaoClientes />} />

                {/* 9. Consultas (Autosserviço de Documentos Fiscais) */}
                <Route path="/crm360/consultas" element={<ConsultasPage />} />
                <Route path="/crm360/consultas/nfs" element={<ConsultasPage />} />
                <Route path="/crm360/consultas/boletos" element={<ConsultasPage />} />
                <Route path="/crm360/consultas/certificados" element={<ConsultasPage />} />
                <Route path="/crm360/consultas/documentos" element={<ConsultasPage />} />

                {/* 10. Central de Ações Inteligentes / Campanhas / Cross-Sell */}
                <Route path="/crm360/central-acoes" element={<CentralAcoesPage />} />
                <Route path="/crm360/acoes" element={<CentralAcoesPage />} />
                <Route path="/crm360/campanhas" element={<CentralAcoesPage />} />
                <Route path="/crm360/cross-sell" element={<CentralAcoesPage />} />

                {/* 11. Estoque */}
                <Route path="/crm360/estoque" element={<EstoquePage />} />
                <Route path="/crm360/gestao-estoque" element={<EstoquePage />} />
                <Route path="/crm360/catalogo" element={<EstoquePage />} />

                {/* Módulos Complementares ("Mais") */}
                {/* S&OP / Demanda / Forecast */}
                <Route path="/crm360/planejamento-sop" element={<PlanejamentoSop />} />
                <Route path="/crm360/planejamento" element={<PlanejamentoSop />} />
                <Route path="/crm360/sop" element={<PlanejamentoSop />} />
                <Route path="/crm360/forecast" element={<PlanejamentoSop />} />

                {/* Equipe Comercial */}
                <Route path="/crm360/equipe" element={<Equipe />} />

                {/* Visitas & Rotas / Agenda */}
                <Route path="/crm360/visitas" element={<Visitas />} />
                <Route path="/crm360/agenda" element={<Visitas />} />

                {/* Agentes de IA */}
                <Route path="/crm360/agentes" element={<Agentes />} />

                {/* Gestão de Inativos */}
                <Route path="/crm360/gestao-inativos" element={<GestaoInativos />} />
                <Route path="/crm360/inativos" element={<GestaoInativos />} />

                {/* Agente Fred (TMS) */}
                <Route path="/crm360/agente-fred" element={<AgenteFredPage />} />
                <Route path="/crm360/fred" element={<AgenteFredPage />} />

                {/* Parâmetros SAP (Governança com Guard de Administrador) */}
                <Route
                  path="/crm360/parametros-sap"
                  element={
                    <ProtectedAdminRoute>
                      <ParametrosSapPage />
                    </ProtectedAdminRoute>
                  }
                />
                <Route
                  path="/crm360/administracao/parametros-sap"
                  element={
                    <ProtectedAdminRoute>
                      <ParametrosSapPage />
                    </ProtectedAdminRoute>
                  }
                />
                <Route
                  path="/crm360/integracoes/parametros-sap"
                  element={
                    <ProtectedAdminRoute>
                      <ParametrosSapPage />
                    </ProtectedAdminRoute>
                  }
                />

                {/* Central de Integrações */}
                <Route path="/crm360/central-integracoes" element={<CentralIntegracoes />} />
                <Route path="/crm360/integracoes" element={<CentralIntegracoes />} />
                <Route path="/crm360/crm/integracoes/sap/pedidos" element={<SapOrdersMonitor />} />
                <Route path="/crm360/integracoes/sap/pedidos" element={<SapOrdersMonitor />} />

                {/* Administração & Parâmetros */}
                <Route path="/crm360/administracao" element={<Administracao />} />

                {/* Demais Módulos Corporativos */}
                <Route path="/crm360/solicitacoes" element={<SolicitacoesCorporativas />} />
                <Route path="/crm360/hcm" element={<HCMCompliance />} />
                <Route path="/crm360/hcm/compliance" element={<HCMCompliance />} />
                <Route path="/crm360/compliance" element={<HCMCompliance />} />
                <Route path="/crm360/hypercare" element={<Hypercare />} />
                <Route path="/crm360/relatorio-release" element={<RelatorioRelease />} />
              </Route>
            </Route>

            {/* ========================================================================= */}
            {/* REDIRECIONAMENTOS DE COMPATIBILIDADE DAS ROTAS LEGADAS PARA /crm360/*    */}
            {/* ========================================================================= */}
            <Route path="/home" element={<Navigate to="/crm360/home" replace />} />
            <Route path="/meu-dia" element={<Navigate to="/crm360/meu-dia" replace />} />
            <Route
              path="/gestao-do-dia"
              element={<Navigate to="/crm360/gestao-do-dia" replace />}
            />

            <Route path="/contatos" element={<Navigate to="/crm360/contatos" replace />} />
            <Route path="/conversas" element={<Navigate to="/crm360/conversas" replace />} />
            <Route path="/whatsapp" element={<Navigate to="/crm360/whatsapp" replace />} />

            <Route path="/cotacoes" element={<Navigate to="/crm360/cotacoes" replace />} />
            <Route
              path="/cotacoes/nova"
              element={<Navigate to="/crm360/cotacoes/nova" replace />}
            />
            <Route path="/cotacoes/:id" element={<Navigate to="/crm360/cotacoes/:id" replace />} />
            <Route path="/crm/cotacoes" element={<Navigate to="/crm360/crm/cotacoes" replace />} />
            <Route
              path="/crm/cotacoes/nova"
              element={<Navigate to="/crm360/crm/cotacoes/nova" replace />}
            />
            <Route
              path="/crm/cotacoes/:id"
              element={<Navigate to="/crm360/crm/cotacoes/:id" replace />}
            />

            <Route path="/crm" element={<Navigate to="/crm360/crm" replace />} />
            <Route
              path="/crm/oportunidades"
              element={<Navigate to="/crm360/oportunidades" replace />}
            />
            <Route
              path="/oportunidades"
              element={<Navigate to="/crm360/oportunidades" replace />}
            />
            <Route path="/cliente/:id" element={<Navigate to="/crm360/cliente/:id" replace />} />
            <Route path="/crm/:id" element={<Navigate to="/crm360/crm/:id" replace />} />

            <Route path="/tarefas" element={<Navigate to="/crm360/tarefas" replace />} />

            <Route path="/kpis" element={<Navigate to="/crm360/kpis" replace />} />
            <Route
              path="/kpis-comerciais"
              element={<Navigate to="/crm360/kpis-comerciais" replace />}
            />
            <Route path="/indicadores" element={<Navigate to="/crm360/indicadores" replace />} />
            <Route path="/metas" element={<Navigate to="/crm360/metas" replace />} />
            <Route
              path="/planejamento-estrategico"
              element={<Navigate to="/crm360/planejamento-estrategico" replace />}
            />
            <Route path="/importar-pe" element={<Navigate to="/crm360/importar-pe" replace />} />

            <Route
              path="/gestao-clientes"
              element={<Navigate to="/crm360/gestao-clientes" replace />}
            />
            <Route path="/clientes" element={<Navigate to="/crm360/clientes" replace />} />
            <Route path="/carteira" element={<Navigate to="/crm360/carteira" replace />} />
            <Route path="/cobertura" element={<Navigate to="/crm360/cobertura" replace />} />

            <Route path="/satisfacao" element={<Navigate to="/crm360/satisfacao" replace />} />
            <Route
              path="/satisfacao-clientes"
              element={<Navigate to="/crm360/satisfacao-clientes" replace />}
            />

            <Route path="/consultas" element={<Navigate to="/crm360/consultas" replace />} />
            <Route
              path="/consultas/nfs"
              element={<Navigate to="/crm360/consultas/nfs" replace />}
            />
            <Route
              path="/consultas/boletos"
              element={<Navigate to="/crm360/consultas/boletos" replace />}
            />
            <Route
              path="/consultas/certificados"
              element={<Navigate to="/crm360/consultas/certificados" replace />}
            />
            <Route
              path="/consultas/documentos"
              element={<Navigate to="/crm360/consultas/documentos" replace />}
            />

            <Route
              path="/central-acoes"
              element={<Navigate to="/crm360/central-acoes" replace />}
            />
            <Route path="/acoes" element={<Navigate to="/crm360/acoes" replace />} />
            <Route path="/campanhas" element={<Navigate to="/crm360/campanhas" replace />} />
            <Route path="/cross-sell" element={<Navigate to="/crm360/cross-sell" replace />} />

            <Route path="/estoque" element={<Navigate to="/crm360/estoque" replace />} />
            <Route
              path="/gestao-estoque"
              element={<Navigate to="/crm360/gestao-estoque" replace />}
            />
            <Route path="/catalogo" element={<Navigate to="/crm360/catalogo" replace />} />

            <Route
              path="/planejamento-sop"
              element={<Navigate to="/crm360/planejamento-sop" replace />}
            />
            <Route path="/planejamento" element={<Navigate to="/crm360/planejamento" replace />} />
            <Route path="/sop" element={<Navigate to="/crm360/sop" replace />} />
            <Route path="/forecast" element={<Navigate to="/crm360/forecast" replace />} />

            <Route path="/equipe" element={<Navigate to="/crm360/equipe" replace />} />
            <Route path="/visitas" element={<Navigate to="/crm360/visitas" replace />} />
            <Route path="/agenda" element={<Navigate to="/crm360/agenda" replace />} />
            <Route path="/agentes" element={<Navigate to="/crm360/agentes" replace />} />

            <Route
              path="/gestao-inativos"
              element={<Navigate to="/crm360/gestao-inativos" replace />}
            />
            <Route path="/inativos" element={<Navigate to="/crm360/inativos" replace />} />

            <Route path="/agente-fred" element={<Navigate to="/crm360/agente-fred" replace />} />
            <Route path="/fred" element={<Navigate to="/crm360/fred" replace />} />

            <Route
              path="/parametros-sap"
              element={<Navigate to="/crm360/parametros-sap" replace />}
            />
            <Route
              path="/administracao/parametros-sap"
              element={<Navigate to="/crm360/administracao/parametros-sap" replace />}
            />
            <Route
              path="/integracoes/parametros-sap"
              element={<Navigate to="/crm360/integracoes/parametros-sap" replace />}
            />

            <Route
              path="/central-integracoes"
              element={<Navigate to="/crm360/central-integracoes" replace />}
            />
            <Route path="/integracoes" element={<Navigate to="/crm360/integracoes" replace />} />
            <Route
              path="/crm/integracoes/sap/pedidos"
              element={<Navigate to="/crm360/crm/integracoes/sap/pedidos" replace />}
            />

            <Route
              path="/administracao"
              element={<Navigate to="/crm360/administracao" replace />}
            />
            <Route path="/solicitacoes" element={<Navigate to="/crm360/solicitacoes" replace />} />
            <Route path="/hcm" element={<Navigate to="/crm360/hcm" replace />} />
            <Route
              path="/hcm/compliance"
              element={<Navigate to="/crm360/hcm/compliance" replace />}
            />
            <Route path="/compliance" element={<Navigate to="/crm360/compliance" replace />} />
            <Route path="/hypercare" element={<Navigate to="/crm360/hypercare" replace />} />
            <Route
              path="/relatorio-release"
              element={<Navigate to="/crm360/relatorio-release" replace />}
            />

            {/* Rota 404 Não Encontrado */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </BrowserRouter>
    </AppProvider>
  </AuthProvider>
)

export default App
