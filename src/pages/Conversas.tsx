import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInstanciaAtiva, useConversas, useMensagens } from '@/hooks/use-whatsapp'
import {
  enviarTexto,
  enviarMidia,
  desconectarInstancia,
  diagnosticarWebhook,
  reimportarHistorico,
} from '@/services/whatsapp_service'
import { useAuth } from '@/hooks/use-auth'
import { useCategories } from '@/hooks/use-categories'
import { ChatList } from '@/components/chat/ChatList'
import { ChatArea } from '@/components/chat/ChatArea'
import { useIsMobile } from '@/hooks/use-mobile'
import { useQrConnection } from '@/hooks/use-qr-connection'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { QrCode, Loader2, RefreshCw, MessageSquare, Radio, Settings } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useCurrentAccount } from '@/hooks/use-current-account'
import { useHistorySync } from '@/hooks/use-history-sync'
import { useCrmContatos } from '@/hooks/use-crm'
import { PageLoadingState, PageEmptyState, PageErrorState } from '@/components/shared/StateFeedback'
import { conversationsToChats, whatsappMessagesToMessages } from '@/lib/whatsapp-mappers'
import { initialChats } from '@/lib/mock-data'

export default function Conversas() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const { user } = useAuth()
  const { account, accountId, role } = useCurrentAccount()
  const { instance, loading: loadingInstance } = useInstanciaAtiva()
  const isImportingHistory = instance?.is_importing_history === true
  const [showArchived, setShowArchived] = useState(false)

  const effectiveInstanceName = instance?.instance_name || 'ciafal_default_inst'

  const {
    conversations,
    loading: loadingChats,
    hasMore: hasMoreChats,
    loadMore: loadMoreChats,
    reload: reloadConversas,
  } = useConversas(effectiveInstanceName, isImportingHistory, showArchived)

  const { categories } = useCategories(accountId || account?.id || undefined)
  const { contacts: crmContacts } = useCrmContatos(effectiveInstanceName)

  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [showQrModal, setShowQrModal] = useState(false)
  const [showDiagnostic, setShowDiagnostic] = useState(false)
  const [diagnosticData, setDiagnosticData] = useState<any>(null)
  const [diagnosing, setDiagnosing] = useState(false)
  const [showReimportModal, setShowReimportModal] = useState(false)
  const [reimportPeriod, setReimportPeriod] = useState<30 | 90>(30)
  const [reimporting, setReimporting] = useState(false)

  const { toast } = useToast()

  const { qrCodeBase64, isGenerating, pollErrors, generateQrCode } = useQrConnection(
    undefined,
    instance,
  )

  // Sincronização de histórico para conversa ativa selecionada
  const activeConversation = React.useMemo(() => {
    return conversations.find((c) => c.id === activeChatId) || null
  }, [conversations, activeChatId])

  useHistorySync(activeConversation)

  // Mapeia conversas do PocketBase para o formato do Chat / ChatList
  const mappedChats = React.useMemo(() => {
    if (conversations && conversations.length > 0) {
      return conversationsToChats(conversations)
    }
    // Se não houver conversas do banco mas houver fallback demonstrativo
    if (!instance?.instance_name || instance?.status !== 'connected') {
      return initialChats
    }
    return []
  }, [conversations, instance?.instance_name, instance?.status])

  // URL chat param handler & search param handler
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const chatParam = params.get('chat')
    if (chatParam) {
      const match = mappedChats.find((c: any) => c.remote_jid === chatParam || c.id === chatParam)
      if (match) {
        setActiveChatId(match.id)
      }
    }
  }, [mappedChats])

  const handleDiagnose = async (instanceName: string) => {
    setDiagnosing(true)
    setShowDiagnostic(true)
    try {
      const result = await diagnosticarWebhook(instanceName)
      setDiagnosticData(result)
    } catch {
      toast({
        title: 'Erro no Diagnóstico',
        description: 'Não foi possível verificar a conectividade do webhook.',
        variant: 'destructive',
      })
    } finally {
      setDiagnosing(false)
    }
  }

  const handleReimport = async () => {
    if (!instance?.instance_name) {
      toast({
        title: 'Canal não conectado',
        description: 'Conecte um canal de mensagens para reimportar.',
      })
      return
    }
    setReimporting(true)
    try {
      await reimportarHistorico(instance.instance_name, reimportPeriod)
      setShowReimportModal(false)
      toast({
        title: 'Reimportação iniciada',
        description: 'O histórico está sendo sincronizado em segundo plano.',
      })
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível iniciar a reimportação do histórico.',
        variant: 'destructive',
      })
    } finally {
      setReimporting(false)
    }
  }

  const disconnect = async (name: string) => {
    try {
      await desconectarInstancia(name)
      setActiveChatId(null)
      setShowQrModal(true)
      generateQrCode()
      toast({
        title: 'Desconectado',
        description: 'A instância de mensagens foi desconectada.',
      })
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível desconectar a instância.',
        variant: 'destructive',
      })
    }
  }

  const activeChat = React.useMemo(() => {
    return mappedChats.find((c: any) => c.id === activeChatId) || null
  }, [mappedChats, activeChatId])

  const {
    messages: rawMessages,
    loading: loadingMessages,
    reload: reloadMessages,
  } = useMensagens(effectiveInstanceName, activeChat?.remote_jid || activeConversation?.remote_jid)

  const mappedMessages = React.useMemo(() => {
    if (rawMessages && rawMessages.length > 0) {
      return whatsappMessagesToMessages(rawMessages)
    }
    if (activeChat?.messages && activeChat.messages.length > 0) {
      return activeChat.messages
    }
    return []
  }, [rawMessages, activeChat])

  // Injetar mensagens mapeadas no objeto chat para ChatArea
  const chatForArea = React.useMemo(() => {
    if (!activeChat) return null
    return {
      ...activeChat,
      messages: mappedMessages,
    }
  }, [activeChat, mappedMessages])

  const handleSendMessage = async (text: string) => {
    const remoteJid = activeChat?.remote_jid || activeConversation?.remote_jid
    if (!remoteJid) return
    try {
      if (instance?.status === 'connected' && instance.instance_name) {
        await enviarTexto(instance.instance_name, remoteJid, text)
      } else {
        // Envio local demonstrativo
        toast({
          title: 'Modo Demonstrativo',
          description: 'Mensagem enviada localmente na simulação.',
        })
      }
    } catch {
      toast({
        title: 'Erro ao enviar mensagem',
        description: 'Não foi possível entregar a mensagem.',
        variant: 'destructive',
      })
    }
  }

  const handleSendMedia = async (file: File, mediatype: string, caption?: string) => {
    const remoteJid = activeChat?.remote_jid || activeConversation?.remote_jid
    if (!remoteJid) return
    try {
      if (instance?.status === 'connected' && instance.instance_name) {
        await enviarMidia(instance.instance_name, remoteJid, file, caption)
      } else {
        toast({
          title: 'Modo Demonstrativo',
          description: 'Mídia anexada localmente no modo simulado.',
        })
      }
    } catch {
      toast({
        title: 'Erro ao enviar arquivo',
        description: 'Não foi possível realizar o envio de mídia.',
        variant: 'destructive',
      })
    }
  }

  const isConnected = instance?.status === 'connected'
  const isInitialLoading = loadingInstance && loadingChats && mappedChats.length === 0

  // Estado Loading completo
  if (isInitialLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-950 p-6">
        <PageLoadingState
          message="Carregando conversas..."
          className="w-full max-w-md shadow-sm border-none bg-white dark:bg-slate-900"
        />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Banner de status do canal / integração */}
      <div className="bg-white dark:bg-slate-900 border-b px-4 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          />
          <span className="font-semibold text-foreground">
            {isConnected
              ? `Canal WhatsApp Conectado (${instance?.phone_number || instance?.instance_name})`
              : 'Modo Demonstrativo (Integração de mensagens não conectada)'}
          </span>
          {!isConnected && (
            <span className="text-muted-foreground hidden sm:inline">
              · Histórico local demonstrativo ativo
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isConnected ? (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10"
              onClick={() => {
                setShowQrModal(true)
                generateQrCode()
              }}
            >
              <QrCode className="w-3.5 h-3.5" />
              Conectar WhatsApp
            </Button>
          ) : (
            <>
              {role === 'owner' && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                  onClick={() => handleDiagnose(instance?.instance_name || '')}
                >
                  <Radio className="w-3.5 h-3.5" />
                  Diagnóstico
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs gap-1 text-muted-foreground hover:text-destructive"
                onClick={() => disconnect(instance?.instance_name || '')}
              >
                Desconectar
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs gap-1 text-muted-foreground"
            onClick={() => reloadConversas()}
            title="Atualizar conversas"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Main chat layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat List (Sidebar) */}
        {(!isMobile || !activeChatId) && (
          <div className="w-full sm:w-80 md:w-96 border-r flex flex-col bg-white dark:bg-slate-900 shrink-0">
            {loadingChats && mappedChats.length === 0 ? (
              <div className="p-4">
                <PageLoadingState
                  message="Carregando conversas..."
                  className="border-none shadow-none bg-transparent"
                />
              </div>
            ) : mappedChats.length === 0 ? (
              <div className="p-4 flex-1 flex flex-col justify-center">
                <PageEmptyState
                  icon={MessageSquare}
                  title="Integração de mensagens ainda não configurada."
                  description="Conecte um canal de comunicação para começar a usar as conversas."
                  action={
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setShowQrModal(true)
                          generateQrCode()
                        }}
                        className="gap-2 text-xs"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        Conectar WhatsApp
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate('/administracao')}
                        className="gap-2 text-xs"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        Configurar integração
                      </Button>
                    </div>
                  }
                />
              </div>
            ) : (
              <ChatList
                chats={mappedChats as any}
                activeChatId={activeChatId}
                onSelectChat={(id) => setActiveChatId(id)}
                hasMore={hasMoreChats}
                onLoadMore={loadMoreChats}
                showArchived={showArchived}
                onToggleArchived={() => setShowArchived(!showArchived)}
                onRefresh={reloadConversas}
                onDisconnect={
                  isConnected ? () => disconnect(instance?.instance_name || '') : undefined
                }
                onDiagnose={
                  isConnected && role === 'owner'
                    ? () => handleDiagnose(instance?.instance_name || '')
                    : undefined
                }
                onReimportHistory={isConnected ? () => setShowReimportModal(true) : undefined}
              />
            )}
          </div>
        )}

        {/* Chat Area (Main viewport) */}
        {(!isMobile || activeChatId) && (
          <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
            {chatForArea ? (
              <ChatArea
                chat={chatForArea}
                onBack={() => setActiveChatId(null)}
                onSendMessage={handleSendMessage}
                onSendMedia={handleSendMedia}
                isMobile={isMobile}
              />
            ) : mappedChats.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <PageEmptyState
                  icon={MessageSquare}
                  title="Integração de mensagens ainda não configurada."
                  description="Conecte um canal de comunicação para começar a usar as conversas."
                  action={
                    <Button
                      size="sm"
                      onClick={() => {
                        setShowQrModal(true)
                        generateQrCode()
                      }}
                      className="gap-2 text-xs"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      Conectar canal agora
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-serif font-bold text-foreground">
                  Selecione uma conversa
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mt-1">
                  Escolha um contato na barra lateral para visualizar as mensagens, históricos de
                  propostas e tarefas comerciais integradas.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal QR Code */}
      <Dialog open={showQrModal} onOpenChange={setShowQrModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Conectar WhatsApp Corporativo</DialogTitle>
            <DialogDescription>
              Escaneie o QR Code abaixo no WhatsApp do aparelho corporativo para sincronizar as
              conversas em tempo real.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-4">
            <div className="w-60 h-60 bg-white rounded-2xl border p-3 flex items-center justify-center shadow-inner">
              {isGenerating ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground">Gerando QR Code seguro...</p>
                </div>
              ) : qrCodeBase64 ? (
                <img
                  src={
                    qrCodeBase64.startsWith('data:')
                      ? qrCodeBase64
                      : `data:image/png;base64,${qrCodeBase64}`
                  }
                  alt="QR Code WhatsApp"
                  className="w-full h-full object-contain"
                />
              ) : pollErrors >= 1 ? (
                <div className="flex flex-col items-center gap-3 text-center p-4">
                  <p className="text-xs text-destructive font-medium">Instabilidade ao gerar QR</p>
                  <Button size="sm" variant="outline" onClick={generateQrCode}>
                    Tentar novamente
                  </Button>
                </div>
              ) : (
                <QrCode className="w-16 h-16 text-muted-foreground/40" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center max-w-xs">
              No WhatsApp, acesse <strong className="text-foreground">Aparelhos Conectados</strong>{' '}
              → <strong className="text-foreground">Conectar Aparelho</strong> e aponte a câmera.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Diagnóstico */}
      <Dialog open={showDiagnostic} onOpenChange={setShowDiagnostic}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif">Diagnóstico do Canal</DialogTitle>
            <DialogDescription>
              Verificação de conectividade com os servidores de mensageria.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            {diagnosing ? (
              <PageLoadingState message="Executando testes de conectividade..." />
            ) : diagnosticData ? (
              <pre className="text-xs bg-slate-900 text-slate-100 p-4 rounded-xl overflow-x-auto">
                {JSON.stringify(diagnosticData, null, 2)}
              </pre>
            ) : (
              <p className="text-xs text-muted-foreground">Nenhum dado retornado no diagnóstico.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
