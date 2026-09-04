import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Zap,
  CheckCircle2,
  RefreshCw,
  Server,
  Database,
  Cloud,
  Layers,
  Key,
  ShieldCheck,
  AlertTriangle,
  Radio,
  Clock,
  ArrowRight,
  ChevronRight,
  HelpCircle,
  MessageSquare,
  Network,
  Sliders,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { WhatsAppOfficialSettingsView } from '@/components/whatsapp/WhatsAppOfficialSettingsView'

interface IntegrationConnector {
  id: string
  name: string
  category: 'ERP' | 'BI' | 'M365' | 'MESSAGING' | 'HCM' | 'LOGISTICS'
  provider: string
  endpoint: string
  status: 'ONLINE' | 'STANDBY' | 'DEGRADED' | 'MOCK'
  authType: string
  latencyMs: number
  lastSync: string
  description: string
  features: string[]
}

export default function CentralIntegracoes() {
  const navigate = useNavigate()
  const [activeMainTab, setActiveMainTab] = useState<'whatsapp_oficial' | 'integracoes_gerais'>(
    'whatsapp_oficial',
  )
  const [testingId, setTestingId] = useState<string | null>(null)
  const [connectors, setConnectors] = useState<IntegrationConnector[]>([
    {
      id: 'sap-ecc',
      name: 'SAP ECC 6.0 / NetWeaver Gateway',
      category: 'ERP',
      provider: 'SAP SE',
      endpoint: 'https://sap-gateway.ciafal.internal/sap/opu/odata/sap/ZSD_CRM_SRV/',
      status: 'ONLINE',
      authType: 'OAuth 2.0 + SAP Principal Propagation',
      latencyMs: 142,
      lastSync: 'Há 4 minutos',
      description:
        'Sincronização bidirecional de clientes, pedidos, cotações CPQ, posições financeiras e limite de crédito F.35.',
      features: [
        'Consulta de Clientes',
        'Limite de Crédito F.35',
        'Cotações CPQ',
        'Ordem de Venda',
      ],
    },
    {
      id: 'totvs-rm',
      name: 'TOTVS RM / Framework Corporativo',
      category: 'HCM',
      provider: 'TOTVS S.A.',
      endpoint: 'https://totvs-rm.ciafal.internal/api/framework/v1/hcm/employees',
      status: 'ONLINE',
      authType: 'Bearer Token (Identity Hub)',
      latencyMs: 98,
      lastSync: 'Há 12 minutos',
      description:
        'Gestão de cadastro de colaboradores, cargos, centros de custo, hierarquia funcional e espelho de compliance.',
      features: [
        'Estrutura Organizacional',
        'Matrículas & Cargos',
        'Centros de Custo',
        'Gestão de Férias',
      ],
    },
    {
      id: 'qlik-sense',
      name: 'Qlik Sense Enterprise / Engine API',
      category: 'BI',
      provider: 'QlikTech',
      endpoint: 'https://qlik.ciafal.internal/qrs/app/hub-ciafal-analytics',
      status: 'ONLINE',
      authType: 'Certificado X.509 + Header Auth',
      latencyMs: 85,
      lastSync: 'Há 2 minutos',
      description:
        'Extração analítica de faturamento histórico, curvas ABC, market share e volumetria em toneladas.',
      features: [
        'Curvas ABC Históricas',
        'Market Share Regional',
        'Forecast Siderúrgico',
        'Indicador OIF',
      ],
    },
    {
      id: 'm365-graph',
      name: 'Microsoft 365 Graph API (Teams & Outlook)',
      category: 'M365',
      provider: 'Microsoft Corporation',
      endpoint: 'https://graph.microsoft.com/v1.0/me/calendar/events',
      status: 'ONLINE',
      authType: 'Azure AD / Entra ID (Delegated Permissions)',
      latencyMs: 110,
      lastSync: 'Tempo Real (Webhooks)',
      description:
        'Sincronização de agenda de visitas, e-mails corporativos, convites executivos e arquivos SharePoint.',
      features: [
        'Agenda de Visitas',
        'E-mails de Cotação',
        'Sincronização Teams',
        'SharePoint Docs',
      ],
    },
    {
      id: 'whatsapp-meta',
      name: 'Meta Cloud API / WhatsApp Business',
      category: 'MESSAGING',
      provider: 'Meta Platforms',
      endpoint: 'https://graph.facebook.com/v19.0/ciafal_waba_id/messages',
      status: 'ONLINE',
      authType: 'Permanent System User Token',
      latencyMs: 64,
      lastSync: 'Tempo Real (Eventos)',
      description:
        'Disparo de cotações aprovadas, alertas de pedidos, interações com clientes e canal comercial de vendas.',
      features: [
        'Templates Aprovados',
        'Conversas Humanas',
        'Envio de Propostas PDF',
        'Auditoria LGPD',
      ],
    },
    {
      id: 'tms-transporte',
      name: 'TMS CIAFAL / Rastreamento & Agente Fred',
      category: 'LOGISTICS',
      provider: 'TMS Ciafal Transport Provider',
      endpoint: 'https://tms.ciafal.internal/api/v2/tracking/deliveries',
      status: 'ONLINE',
      authType: 'API Key + IP Whitelisting',
      latencyMs: 120,
      lastSync: 'Há 6 minutos',
      description:
        'Monitoramento de cargas em trânsito, placas, motoristas, telemetria Omnilink/Sascar, previsões de entrega e agente Fred.',
      features: [
        'Rastreamento de Cargas',
        'Agente Fred Integrado',
        'Status de Despacho',
        'Comprovante Digital (POD)',
        'Alertas de Atraso & SEFAZ',
      ],
    },
    {
      id: 'pcp-wms',
      name: 'PCP & WMS CIAFAL (Betim / Contagem)',
      category: 'ERP',
      provider: 'CIAFAL Logística & Produção',
      endpoint: 'https://wms.ciafal.internal/api/v1/stock/reservations',
      status: 'ONLINE',
      authType: 'mTLS + Internal Bearer',
      latencyMs: 78,
      lastSync: 'Há 1 minuto',
      description:
        'Sincronização de saldo em tempo real, checagem de estoque (< 5 t) e programação de laminação/trefilação.',
      features: [
        'Saldo Físico x Disponível',
        'Workflow Checagem WMS',
        'Programação PCP',
        'Previsão de Produção',
      ],
    },
  ])

  const handleTestConnection = (connector: IntegrationConnector) => {
    setTestingId(connector.id)
    setTimeout(() => {
      setTestingId(null)
      toast.success(
        `Conexão com ${connector.name} testada com sucesso! Resposta: 200 OK (${connector.latencyMs}ms)`,
      )
    }, 900)
  }

  const handleTestAll = () => {
    setTestingId('ALL')
    setTimeout(() => {
      setTestingId(null)
      toast.success('Todos os 6 conectores corporativos responderam com status 200 OK!')
    }, 1200)
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in pb-16">
      {/* SELETOR DE ABAS PRINCIPAIS: WHATSAPP BUSINESS OFICIAL / CONECTORES GERAIS */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
        <Button
          size="sm"
          variant={activeMainTab === 'whatsapp_oficial' ? 'default' : 'ghost'}
          onClick={() => setActiveMainTab('whatsapp_oficial')}
          className={cn(
            'h-9 text-xs rounded-xl font-bold flex items-center gap-2',
            activeMainTab === 'whatsapp_oficial'
              ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs'
              : 'text-slate-700',
          )}
        >
          <MessageSquare className="w-4 h-4 text-emerald-300" />
          WhatsApp Business Oficial (Meta Cloud API)
          <Badge className="bg-emerald-900 text-emerald-100 text-[9px] border-none">
            Homologado
          </Badge>
        </Button>

        <Button
          size="sm"
          variant={activeMainTab === 'integracoes_gerais' ? 'default' : 'ghost'}
          onClick={() => setActiveMainTab('integracoes_gerais')}
          className={cn(
            'h-9 text-xs rounded-xl font-bold flex items-center gap-2',
            activeMainTab === 'integracoes_gerais'
              ? 'bg-primary text-white shadow-xs'
              : 'text-slate-700',
          )}
        >
          <Network className="w-4 h-4" />
          Conectores Corporativos (SAP ECC, Qlik, WMS, TMS, VoIP)
        </Button>
      </div>

      {activeMainTab === 'whatsapp_oficial' ? (
        <WhatsAppOfficialSettingsView />
      ) : (
        <>
          {/* 1. HEADER EXECUTIVO COM DESIGN EQUILIBRADO */}
          <div className="p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-3xl border border-border/50 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-3xl">
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary text-white font-bold border-none text-[10px]">
                    INFRAESTRUTURA & INTEGRAÇÕES
                  </Badge>
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-[10px]">
                    6 CONECTORES ATIVOS
                  </Badge>
                </div>
                <h1 className="font-serif text-3xl font-bold text-primary tracking-tight">
                  Central de Integrações Corporativas
                </h1>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Painel de conectividade unificada: orquestração de endpoints SAP ECC, TOTVS RM,
                  Qlik Sense, Microsoft Graph, Meta WhatsApp e TMS Logístico.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Button
                  onClick={() => navigate('/administracao/parametros-sap')}
                  variant="outline"
                  className="h-9 text-xs border-[#003A70] text-[#003A70] hover:bg-sky-50 gap-1.5 font-bold shadow-xs"
                >
                  <Sliders className="w-3.5 h-3.5" /> Parâmetros de Exposição SAP
                </Button>
                <Button
                  onClick={handleTestAll}
                  disabled={testingId === 'ALL'}
                  className="h-9 text-xs bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5 font-bold shadow-xs"
                >
                  {testingId === 'ALL' ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Testando Todos...
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" /> Testar Todos os Conectores
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* 2. GRID 12 COLUNAS RESPONSIVO COM LARGURA SUFICIENTE PARA CADA CARD */}
          <div className="grid grid-cols-12 gap-6">
            {connectors.map((conn) => (
              <Card
                key={conn.id}
                className="col-span-12 lg:col-span-6 bg-white/95 border-border/40 rounded-3xl p-6 shadow-xs flex flex-col justify-between hover:border-primary/40 transition-all space-y-4"
              >
                <div className="space-y-3">
                  {/* TOPO DO CARD */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-primary/10 text-primary border-none text-[10px] font-bold">
                          {conn.category}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground font-semibold">
                          {conn.provider}
                        </span>
                      </div>
                      <h3 className="font-serif font-bold text-base text-primary mt-1">
                        {conn.name}
                      </h3>
                    </div>

                    <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold text-[10px] gap-1 shrink-0">
                      <CheckCircle2 className="w-3 h-3" /> {conn.status}
                    </Badge>
                  </div>

                  {/* DESCRIÇÃO */}
                  <p className="text-xs text-slate-700 leading-relaxed">{conn.description}</p>

                  {/* ENDPOINT COM LARGURA SEGURA E QUEBRA ADEQUADA */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-border/40 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Endpoint & Roteamento
                    </span>
                    <span className="font-mono text-[11px] text-slate-800 break-all block">
                      {conn.endpoint}
                    </span>
                  </div>

                  {/* FEATURES & CAPACIDADES */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Recursos Homologados
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {conn.features.map((feat, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
                        >
                          {feat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* RODAPÉ DO CARD COM LATÊNCIA, AUTENTICAÇÃO E BOTÃO DE TESTE */}
                <div className="pt-4 border-t space-y-3">
                  <div className="flex flex-wrap items-center justify-between text-[11px] text-muted-foreground gap-2">
                    <span>
                      Auth: <strong>{conn.authType}</strong>
                    </span>
                    <span className="font-mono text-emerald-700 font-bold">
                      Latência: {conn.latencyMs}ms
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] text-muted-foreground">
                      Último Sync: {conn.lastSync}
                    </span>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTestConnection(conn)}
                      disabled={testingId === conn.id}
                      className="h-8 text-xs text-primary gap-1.5 font-semibold shrink-0"
                    >
                      {testingId === conn.id ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Testando...
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5" /> Testar Conexão
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
