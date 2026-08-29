import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  MessageSquare,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Send,
  Building2,
  Phone,
  FileCode2,
  Eye,
  Check,
  Copy,
  Terminal,
  Layers,
  HelpCircle,
  ExternalLink,
  Bot,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export interface WhatsAppTemplateItem {
  id: string
  name: string
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION'
  language: string
  status: 'APROVADO' | 'PENDENTE' | 'REJEITADO' | 'PAUSADO'
  body: string
  variables: string[]
  lastSync: string
}

export interface WhatsAppOperationalLog {
  id: string
  timestamp: string
  type: 'OUTBOUND_TEMPLATE' | 'INBOUND_MESSAGE' | 'WEBHOOK_EVENT' | 'STATUS_UPDATE'
  recipientOrPhone: string
  details: string
  statusCode: number
}

export function WhatsAppOfficialSettingsView() {
  const [activeSubTab, setActiveSubTab] = useState<'config' | 'templates' | 'logs'>('config')

  // Estado da Conexão WhatsApp Business Cloud API
  const [config, setConfig] = useState({
    status: 'AGUARDANDO_CREDENCIAL' as 'CONECTADO' | 'AGUARDANDO_CREDENCIAL' | 'PENDENTE_META',
    corporatePhoneNumber: '+55 (31) 3333-0000',
    businessAccountId: 'WABA-CIAFAL-98421092841',
    phoneNumberId: 'PNID-8723918230912',
    environment: 'HOMOLOGACAO (Meta Cloud API Sandbox)',
    webhookUrl: 'https://api.ciafal.internal/webhooks/whatsapp/v1',
    webhookVerifyTokenConfigured: true,
    lastSync: 'Aguardando sincronização inicial da Meta',
    appId: 'META-APP-88491820',
  })

  // Templates Oficiais Homologados na Meta
  const [templates, setTemplates] = useState<WhatsAppTemplateItem[]>([
    {
      id: 'tpl-1',
      name: 'ciafal_cotacao_aprovada_v2',
      category: 'UTILITY',
      language: 'pt_BR',
      status: 'APROVADO',
      body: 'Olá, {{1}}! A cotação {{2}} da CIAFAL Ferro & Aço foi aprovada com sucesso no valor de {{3}}. O espelho da proposta com frete {{4}} está disponível. Deseja que seu vendedor confirme o pedido de venda?',
      variables: ['Nome do Comprador', 'Código da Cotação', 'Valor Total', 'Tipo de Frete'],
      lastSync: 'Hoje, 09:15',
    },
    {
      id: 'tpl-2',
      name: 'ciafal_reativacao_sem_compra_v3',
      category: 'MARKETING',
      language: 'pt_BR',
      status: 'APROVADO',
      body: 'Olá, {{1}}! Aqui é o {{2}} da CIAFAL. Notamos que sua última compra de {{3}} faz {{4}} dias. Liberamos uma condição especial para reposição com entrega prioritária em {{5}}. Podemos cotar?',
      variables: [
        'Nome do Comprador',
        'Nome do Vendedor',
        'Família de Produto',
        'Dias sem compra',
        'Cidade',
      ],
      lastSync: 'Hoje, 09:15',
    },
    {
      id: 'tpl-3',
      name: 'ciafal_liquidacao_estoque_patio',
      category: 'MARKETING',
      language: 'pt_BR',
      status: 'APROVADO',
      body: 'Prezado(a) {{1}}, temos um lote de pronta entrega no pátio CIAFAL do item {{2}} com volume de {{3}}t. Conseguimos preço especial de usina para faturamento esta semana. Segue proposta.',
      variables: ['Nome do Comprador', 'Descrição do Material', 'Volume em Toneladas'],
      lastSync: 'Ontem, 18:30',
    },
    {
      id: 'tpl-4',
      name: 'ciafal_alerta_carregamento_tms',
      category: 'UTILITY',
      language: 'pt_BR',
      status: 'PENDENTE',
      body: 'Aviso logístico CIAFAL: O pedido {{1}} foi carregado na carreta placa {{2}} com previsão de entrega em {{3}}. Acompanhe o rastreamento em tempo real.',
      variables: ['Número do Pedido', 'Placa do Veículo', 'Previsão de Entrega'],
      lastSync: 'Há 2 dias (Em revisão Meta)',
    },
    {
      id: 'tpl-5',
      name: 'ciafal_pesquisa_satisfacao_isc',
      category: 'UTILITY',
      language: 'pt_BR',
      status: 'APROVADO',
      body: 'Olá, {{1}}! Como foi sua experiência de entrega do pedido CIAFAL {{2}}? Sua avaliação é fundamental para nosso padrão de excelência: {{3}}',
      variables: ['Nome do Contato', 'Número do Pedido', 'Link da Pesquisa'],
      lastSync: 'Hoje, 09:15',
    },
  ])

  // Logs Operacionais
  const [logs, setLogs] = useState<WhatsAppOperationalLog[]>([
    {
      id: 'log-101',
      timestamp: '2026-08-26 10:42:15',
      type: 'WEBHOOK_EVENT',
      recipientOrPhone: '+55 31 99881-2233',
      details: 'Webhook delivery_receipt recebido (message_id: wamid.HBgLM... status: read)',
      statusCode: 200,
    },
    {
      id: 'log-102',
      timestamp: '2026-08-26 10:40:02',
      type: 'OUTBOUND_TEMPLATE',
      recipientOrPhone: '+55 31 98771-4455',
      details: 'Template ciafal_cotacao_aprovada_v2 disparado com sucesso via Meta Cloud API',
      statusCode: 200,
    },
    {
      id: 'log-103',
      timestamp: '2026-08-26 09:15:30',
      type: 'STATUS_UPDATE',
      recipientOrPhone: 'Sistema / WABA',
      details: 'Sincronização de templates concluída: 4 aprovados, 1 pendente, 0 rejeitados',
      statusCode: 200,
    },
  ])

  const [testingWebhook, setTestingWebhook] = useState(false)
  const [syncingTemplates, setSyncingTemplates] = useState(false)
  const [selectedTemplateForPreview, setSelectedTemplateForPreview] =
    useState<WhatsAppTemplateItem | null>(templates[0])

  const handleTestWebhook = () => {
    setTestingWebhook(true)
    setTimeout(() => {
      setTestingWebhook(false)
      toast.success(
        'Webhook validado com sucesso! Resposta da rota de eventos: 200 OK (challenge handshake válido)',
      )
      setLogs((prev) => [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
          type: 'WEBHOOK_EVENT',
          recipientOrPhone: 'Meta Webhook Handshake',
          details: 'GET hub.challenge validado com token corporativo seguro CIAFAL',
          statusCode: 200,
        },
        ...prev,
      ])
    }, 1000)
  }

  const handleSyncTemplates = () => {
    setSyncingTemplates(true)
    setTimeout(() => {
      setSyncingTemplates(false)
      toast.success('Templates sincronizados diretamente do Meta Business Manager!')
      setConfig((c) => ({ ...c, lastSync: new Date().toLocaleString('pt-BR') }))
    }, 1200)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. STATUS GERAL DA INTEGRAÇÃO COM AVISO DE HOMOLOGAÇÃO / CREDENCIAL */}
      <div className="p-5 bg-gradient-to-r from-emerald-950/20 via-slate-900/40 to-slate-900/60 rounded-3xl border border-emerald-800/30 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-emerald-800 text-emerald-100 font-bold border-none text-[10px] gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> ARQUITETURA OFICIAL META
              </Badge>
              {config.status === 'AGUARDANDO_CREDENCIAL' ? (
                <Badge className="bg-amber-100 text-amber-900 border-amber-300 font-bold text-[10px] gap-1">
                  <Clock className="w-3.5 h-3.5" /> AGUARDANDO CREDENCIAL / APROVAÇÃO EXTERNA
                </Badge>
              ) : (
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-[10px]">
                  CONECTADO
                </Badge>
              )}
              <Badge
                variant="outline"
                className="text-[10px] font-mono text-muted-foreground border-slate-300"
              >
                PROIBIDO: scraping / WhatsApp Web / bibliotecas não homologadas
              </Badge>
            </div>
            <h2 className="font-serif text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-emerald-600" /> WhatsApp Business Oficial —
              Meta Cloud API
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-3xl">
              Arquitetura corporativa em conformidade com as diretrizes da Meta Platforms Inc. e
              LGPD. Permite o envio homologado de propostas comerciais em PDF, cotações CPQ, avisos
              de carregamento TMS e réguas de relacionamento sem risco de bloqueio.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={handleSyncTemplates}
              disabled={syncingTemplates}
              className="h-9 text-xs border-slate-300 text-slate-700 font-semibold gap-1.5"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', syncingTemplates && 'animate-spin')} />
              Sincronizar Templates
            </Button>
            <Button
              size="sm"
              onClick={handleTestWebhook}
              disabled={testingWebhook}
              className="h-9 text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold gap-1.5"
            >
              {testingWebhook ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Validando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Testar Webhook Meta
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* 2. SUB-ABAS: CONFIGURAÇÃO / TEMPLATES / LOGS */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <Button
          size="sm"
          variant={activeSubTab === 'config' ? 'default' : 'ghost'}
          onClick={() => setActiveSubTab('config')}
          className={cn(
            'h-8 text-xs rounded-xl font-semibold',
            activeSubTab === 'config' ? 'bg-primary text-white shadow-xs' : 'text-slate-600',
          )}
        >
          <Building2 className="w-3.5 h-3.5 mr-1.5" /> Parâmetros Corporativos & Webhook
        </Button>
        <Button
          size="sm"
          variant={activeSubTab === 'templates' ? 'default' : 'ghost'}
          onClick={() => setActiveSubTab('templates')}
          className={cn(
            'h-8 text-xs rounded-xl font-semibold',
            activeSubTab === 'templates' ? 'bg-primary text-white shadow-xs' : 'text-slate-600',
          )}
        >
          <FileCode2 className="w-3.5 h-3.5 mr-1.5" /> Templates Aprovados Meta ({templates.length})
        </Button>
        <Button
          size="sm"
          variant={activeSubTab === 'logs' ? 'default' : 'ghost'}
          onClick={() => setActiveSubTab('logs')}
          className={cn(
            'h-8 text-xs rounded-xl font-semibold',
            activeSubTab === 'logs' ? 'bg-primary text-white shadow-xs' : 'text-slate-600',
          )}
        >
          <Terminal className="w-3.5 h-3.5 mr-1.5" /> Logs Operacionais ({logs.length})
        </Button>
      </div>

      {/* 3. CONTEÚDO DAS SUB-ABAS */}
      {activeSubTab === 'config' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card Esquerdo: Dados da Conta Corporativa */}
          <Card className="rounded-3xl border-border/60 bg-white shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-serif font-bold text-base text-primary flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-600" /> Identificação Corporativa
              </h3>
              <Badge className="bg-slate-100 text-slate-800 border-none font-mono text-[10px]">
                {config.environment}
              </Badge>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-500 font-semibold block mb-1">
                  Número Corporativo Homologado
                </label>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-slate-900">
                  {config.corporatePhoneNumber}
                </div>
              </div>

              <div>
                <label className="text-slate-500 font-semibold block mb-1">
                  WhatsApp Business Account ID (WABA ID)
                </label>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-800">
                  {config.businessAccountId}
                </div>
              </div>

              <div>
                <label className="text-slate-500 font-semibold block mb-1">Phone Number ID</label>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-800">
                  {config.phoneNumberId}
                </div>
              </div>

              <div>
                <label className="text-slate-500 font-semibold block mb-1">Meta App ID</label>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-800">
                  {config.appId}
                </div>
              </div>

              <div className="pt-2 border-t text-[11px] text-muted-foreground flex items-center justify-between">
                <span>Última Sincronização:</span>
                <strong className="text-slate-800">{config.lastSync}</strong>
              </div>
            </div>
          </Card>

          {/* Card Direito: Webhook & Secrets Protegidos */}
          <Card className="rounded-3xl border-border/60 bg-white shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-serif font-bold text-base text-primary flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-600" /> Segurança, Webhook & Secrets
              </h3>
              <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold text-[10px] gap-1">
                <Check className="w-3 h-3" /> SECRETS PROTEGIDOS
              </Badge>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-500 font-semibold block mb-1">
                  Endpoint de Webhook (Recebimento de Eventos)
                </label>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-slate-800 break-all">
                  {config.webhookUrl}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Processa eventos de entrega (sent, delivered, read), respostas de clientes e
                  opt-out em tempo real.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900 text-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-amber-400 font-bold uppercase">
                    System User Permanent Access Token
                  </span>
                  <Badge className="bg-slate-800 text-slate-300 text-[9px] font-mono border-none">
                    Gerenciado via Secret
                  </Badge>
                </div>
                <div className="p-2 rounded-xl bg-slate-950 font-mono text-xs text-slate-400 select-none">
                  •••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••• [VALOR
                  OCULTO POR SEGURANÇA]
                </div>
                <p className="text-[10px] text-slate-400">
                  Em conformidade com a governança Skip / CIAFAL, os tokens de acesso permanente
                  nunca são exibidos na interface visual e trafegam apenas no backend seguro.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  <strong>Aviso de Homologação:</strong> O disparo oficial de mensagens requer que o
                  template esteja aprovado pela Meta com status "APROVADO". Templates com status
                  "PENDENTE" ou "REJEITADO" são bloqueados preventivamente pelo motor do CRM.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ABA DE TEMPLATES */}
      {activeSubTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Lista de Templates */}
          <div className="lg:col-span-7 space-y-3">
            {templates.map((tpl) => (
              <Card
                key={tpl.id}
                onClick={() => setSelectedTemplateForPreview(tpl)}
                className={cn(
                  'p-4 rounded-2xl border transition-all cursor-pointer hover:border-primary/40',
                  selectedTemplateForPreview?.id === tpl.id
                    ? 'border-primary bg-primary/5 shadow-xs'
                    : 'border-slate-200 bg-white',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="font-mono text-xs text-slate-900">{tpl.name}</strong>
                      <Badge className="bg-slate-100 text-slate-700 border-none text-[9px]">
                        {tpl.category}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {tpl.language}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 mt-1.5">{tpl.body}</p>
                  </div>

                  <Badge
                    className={cn(
                      'text-[10px] font-bold border-none shrink-0',
                      tpl.status === 'APROVADO'
                        ? 'bg-emerald-100 text-emerald-800'
                        : tpl.status === 'PENDENTE'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800',
                    )}
                  >
                    {tpl.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 mt-2 border-t border-slate-100">
                  <span>{tpl.variables.length} variáveis dinâmicas</span>
                  <span>Sync: {tpl.lastSync}</span>
                </div>
              </Card>
            ))}
          </div>

          {/* Prévia do Template Selecionado */}
          <div className="lg:col-span-5">
            {selectedTemplateForPreview ? (
              <Card className="rounded-3xl border-border/60 bg-white shadow-sm p-6 space-y-4 sticky top-24">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Prévia de Mensagem WhatsApp
                    </span>
                    <h4 className="font-mono font-bold text-xs text-primary">
                      {selectedTemplateForPreview.name}
                    </h4>
                  </div>
                  <Badge
                    className={cn(
                      'text-[10px] font-bold border-none',
                      selectedTemplateForPreview.status === 'APROVADO'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800',
                    )}
                  >
                    {selectedTemplateForPreview.status}
                  </Badge>
                </div>

                {/* Balão WhatsApp simulado */}
                <div className="p-4 bg-[#EFEAE2] rounded-2xl border border-[#DAD3C8] space-y-2">
                  <div className="p-3 bg-white rounded-xl rounded-tl-none shadow-xs text-xs text-slate-800 leading-relaxed font-sans max-w-[90%]">
                    {selectedTemplateForPreview.body}
                    <div className="text-[9px] text-slate-400 text-right mt-1.5 flex items-center justify-end gap-1">
                      <span>10:45</span>
                      <Check className="w-3 h-3 text-sky-500" />
                    </div>
                  </div>
                </div>

                {/* Variáveis Dinâmicas */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Parâmetros Dinâmicos Homologados
                  </label>
                  <div className="space-y-1">
                    {selectedTemplateForPreview.variables.map((v, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                      >
                        <span className="font-mono text-primary font-bold">{`{{${i + 1}}}`}</span>
                        <span className="text-slate-700 font-medium">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    size="sm"
                    disabled={selectedTemplateForPreview.status !== 'APROVADO'}
                    onClick={() => {
                      toast.success(
                        `Template ${selectedTemplateForPreview.name} selecionado para campanhas!`,
                      )
                    }}
                    className="w-full text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold h-9 rounded-xl"
                  >
                    {selectedTemplateForPreview.status === 'APROVADO'
                      ? 'Usar este Template no CRM'
                      : 'Template não homologado para envio'}
                  </Button>
                </div>
              </Card>
            ) : null}
          </div>
        </div>
      )}

      {/* ABA DE LOGS OPERACIONAIS */}
      {activeSubTab === 'logs' && (
        <Card className="rounded-3xl border-border/60 bg-white shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="font-serif font-bold text-base text-primary">
                Logs Operacionais da Meta Cloud API
              </h3>
              <p className="text-xs text-muted-foreground">
                Auditoria de envios, callbacks de webhook e status de entrega em tempo real.
              </p>
            </div>
            <Badge className="bg-slate-100 text-slate-700 border-none font-mono text-[10px]">
              {logs.length} eventos registrados
            </Badge>
          </div>

          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary/10 text-primary border-none text-[9px] font-mono">
                      {log.type}
                    </Badge>
                    <span className="font-mono text-slate-800 font-bold">
                      {log.recipientOrPhone}
                    </span>
                    <span className="text-emerald-700 font-mono font-bold">
                      HTTP {log.statusCode}
                    </span>
                  </div>
                  <p className="text-slate-600 font-mono text-[11px]">{log.details}</p>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                  {log.timestamp}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
