import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppProvider } from '@/stores/useAppStore'
import { AuthProvider, useAuth } from '@/hooks/use-auth'
import { Navigate, Outlet } from 'react-router-dom'

import Layout from './components/Layout'
import Index from './pages/Index'
import Home from './pages/Home'
import Conversas from './pages/Conversas'
import CRM from './pages/CRM'
import CotacoesPage from './pages/CotacoesPage'
import NovaCotacao from './pages/NovaCotacao'
import { CotacoesModule } from './components/cotacoes/CotacoesModule'
import SapOrdersMonitor from './pages/SapOrdersMonitor'
import Agentes from './pages/Agentes'
import Tarefas from './pages/Tarefas'
import Equipe from './pages/Equipe'
import GestaoInativos from './pages/GestaoInativos'
import Cliente360 from './pages/Cliente360'
import GestaoDoDia from './pages/GestaoDoDia'
import Visitas from './pages/Visitas'
import Administracao from './pages/Administracao'
import Setup from './pages/Setup'
import SolicitacoesCorporativas from './pages/SolicitacoesCorporativas'
import HCMCompliance from './pages/HCMCompliance'
import ImportacaoPlanejamentoEstrategico from './pages/ImportacaoPE'
import { ContatosPage } from './pages/Contatos'
import IndicadoresComerciais from './pages/IndicadoresComerciais'
import Hypercare from './pages/Hypercare'
import RelatorioRelease from './pages/RelatorioRelease'
import CentralIntegracoes from './pages/CentralIntegracoes'
import AgenteFredPage from './pages/AgenteFredPage'
import SatisfacaoClientes from './pages/SatisfacaoClientes'
import EstoquePage from './pages/EstoquePage'
import CentralAcoesPage from './pages/CentralAcoesPage'
import GestaoClientesPage from './pages/GestaoClientesPage'
import PlanejamentoSop from './pages/PlanejamentoSop'
import NotFound from './pages/NotFound'

const ProtectedRoute = () => {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/" replace />
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
            {/* Routes without Global Layout */}
            <Route path="/" element={<Index />} />
            <Route path="/setup" element={<Setup />} />

            {/* Routes with Global Layout */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/home" element={<Home />} />
                <Route path="/meu-dia" element={<Home />} />
                <Route path="/central-acoes" element={<CentralAcoesPage />} />
                <Route path="/acoes" element={<CentralAcoesPage />} />
                <Route path="/campanhas" element={<CentralAcoesPage />} />
                <Route path="/gestao-clientes" element={<GestaoClientesPage />} />
                <Route path="/clientes" element={<GestaoClientesPage />} />
                <Route path="/carteira" element={<GestaoClientesPage />} />
                <Route path="/cobertura" element={<GestaoClientesPage />} />
                <Route path="/cliente/:id" element={<Cliente360 />} />
                <Route path="/crm/:id" element={<Cliente360 />} />
                <Route path="/conversas" element={<Conversas />} />
                <Route path="/crm" element={<CRM />} />
                <Route path="/crm/cotacoes" element={<CotacoesModule />} />
                <Route path="/crm/cotacoes/nova" element={<NovaCotacao />} />
                <Route path="/crm/cotacoes/:id" element={<NovaCotacao />} />
                <Route path="/crm/integracoes/sap/pedidos" element={<SapOrdersMonitor />} />
                <Route path="/cotacoes" element={<CotacoesModule />} />
                <Route path="/cotacoes/nova" element={<NovaCotacao />} />
                <Route path="/cotacoes/:id" element={<NovaCotacao />} />
                <Route path="/inativos" element={<GestaoInativos />} />{' '}
                <Route path="/gestao-inativos" element={<GestaoInativos />} />
                <Route path="/gestao-do-dia" element={<GestaoDoDia />} />
                <Route path="/contatos" element={<ContatosPage />} />
                <Route path="/visitas" element={<Visitas />} />
                <Route path="/agentes" element={<Agentes />} />
                <Route path="/tarefas" element={<Tarefas />} />
                <Route path="/equipe" element={<Equipe />} />
                <Route path="/administracao" element={<Administracao />} />
                <Route path="/solicitacoes" element={<SolicitacoesCorporativas />} />
                <Route path="/hcm" element={<HCMCompliance />} />
                <Route path="/hcm/compliance" element={<HCMCompliance />} />
                <Route path="/importar-pe" element={<ImportacaoPlanejamentoEstrategico />} />
                <Route path="/kpis-comerciais" element={<IndicadoresComerciais />} />
                <Route path="/hypercare" element={<Hypercare />} />
                <Route path="/relatorio-release" element={<RelatorioRelease />} />
                <Route path="/estoque" element={<EstoquePage />} />
                <Route path="/gestao-estoque" element={<EstoquePage />} />
                <Route path="/central-integracoes" element={<CentralIntegracoes />} />
                <Route path="/agente-fred" element={<AgenteFredPage />} />
                <Route path="/fred" element={<AgenteFredPage />} />
                <Route path="/satisfacao-clientes" element={<SatisfacaoClientes />} />
                <Route path="/satisfacao" element={<SatisfacaoClientes />} />
                <Route path="/setup" element={<Setup />} />
                <Route path="/kpis" element={<IndicadoresComerciais />} />
                <Route path="/indicadores" element={<IndicadoresComerciais />} />
                <Route path="/metas" element={<ImportacaoPlanejamentoEstrategico />} />
                <Route
                  path="/planejamento-estrategico"
                  element={<ImportacaoPlanejamentoEstrategico />}
                />
                <Route path="/planejamento-sop" element={<PlanejamentoSop />} />
                <Route path="/sop" element={<PlanejamentoSop />} />
                <Route path="/forecast" element={<PlanejamentoSop />} />
                <Route path="/compliance" element={<HCMCompliance />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </BrowserRouter>
    </AppProvider>
  </AuthProvider>
)

export default App
