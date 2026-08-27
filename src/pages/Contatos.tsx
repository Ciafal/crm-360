import React, { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  MessageSquare,
  Phone,
  Mail,
  Search,
  Filter,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Clock,
  UserCheck,
  Building,
  CheckCircle2,
  AlertCircle,
  Play,
  FileText,
  Send,
} from 'lucide-react'
import { mockCommercialContacts } from '@/data/mockCommercialContacts'
import { CommercialContactInteraction, CommercialContactChannel } from '@/types/models'
import { Customer360Sheet } from '@/components/inativos/Customer360Sheet'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

export function ContatosPage() {
  const { toast } = useToast()
  const [contacts, setContacts] = useState<CommercialContactInteraction[]>(mockCommercialContacts)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedChannel, setSelectedChannel] = useState<string>('TODOS')
  const [selectedStatus, setSelectedStatus] = useState<string>('TODOS')
  const [selectedSeller, setSelectedSeller] = useState<string>('TODOS')
  const [selectedCustomerFor360, setSelectedCustomerFor360] = useState<string | null>(null)
  const [selectedContactDetail, setSelectedContactDetail] =
    useState<CommercialContactInteraction | null>(null)

  // Disparo simulado de nova mensagem/ligação
  const [newSimulatedDialogOpen, setNewSimulatedDialogOpen] = useState(false)
  const [simChannel, setSimChannel] = useState<CommercialContactChannel>('WhatsApp')
  const [simCustomer, setSimCustomer] = useState('Metalúrgica Santa Rita Ltda')
  const [simText, setSimText] = useState('')

  // Estatísticas de Contatos
  const stats = useMemo(() => {
    const total = contacts.length
    const whatsapps = contacts.filter((c) => c.channel === 'WhatsApp').length
    const ligacoes = contacts.filter((c) => c.channel === 'Telefone').length
    const emails = contacts.filter((c) => c.channel === 'E-mail').length
    const respondidos = contacts.filter((c) => c.status === 'RESPONDIDO').length
    const semResposta = contacts.filter(
      (c) => c.status === 'SEM_RESPOSTA' || c.status === 'AGUARDANDO_RETORNO',
    ).length
    const comProximaAcao = contacts.filter((c) => !!c.next_action).length

    return { total, whatsapps, ligacoes, emails, respondidos, semResposta, comProximaAcao }
  }, [contacts])

  // Filtragem
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      const matchesSearch =
        c.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.opportunity_title &&
          c.opportunity_title.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesChannel = selectedChannel === 'TODOS' || c.channel === selectedChannel
      const matchesStatus =
        selectedStatus === 'TODOS' ||
        (selectedStatus === 'RESPONDIDOS' && c.status === 'RESPONDIDO') ||
        (selectedStatus === 'SEM_RESPOSTA' &&
          (c.status === 'SEM_RESPOSTA' || c.status === 'AGUARDANDO_RETORNO')) ||
        (selectedStatus === 'COM_OPORTUNIDADE' && !!c.opportunity_id)

      const matchesSeller = selectedSeller === 'TODOS' || c.seller_name.includes(selectedSeller)

      return matchesSearch && matchesChannel && matchesStatus && matchesSeller
    })
  }, [contacts, searchTerm, selectedChannel, selectedStatus, selectedSeller])

  const handleSimulateNewContact = () => {
    if (!simText.trim()) return

    const newContact: CommercialContactInteraction = {
      id: `cnt-${Date.now()}`,
      customer_id: 'cli-100001',
      customer_name: simCustomer,
      contact_name: 'Eduardo Silveira (Compras)',
      seller_id: 'qas-vendedor_teste',
      seller_name: 'Carlos Mendonça',
      channel: simChannel,
      direction: 'SAIDA',
      date_time: 'Agora mesmo',
      summary: simText.slice(0, 90),
      detailed_content: simText,
      result: 'INTERESSADO',
      opportunity_id: 'op-01',
      opportunity_title: 'Safra Estrutural Galpões 2025 (16.5t)',
      next_action: 'Acompanhar retorno comercial',
      next_action_date: 'Hoje 17:00',
      status: 'AGUARDANDO_RETORNO',
      created_at: new Date().toISOString(),
    }

    setContacts([newContact, ...contacts])
    setNewSimulatedDialogOpen(false)
    setSimText('')
    toast({
      title: `Contato Capturado via ${simChannel}!`,
      description:
        'O CRM registrou a interação omnichannel automaticamente e atualizou o histórico.',
    })
  }

  return (
    <div className="space-y-6 animate-fade-in p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header com Título Corporativo e Badges de Integração */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-primary">
              Contatos & Interações Comerciais
            </h1>
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs">
              Omnichannel Automático
            </Badge>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Captura contínua de conversas WhatsApp (Meta/COEX), Telefonia VoIP e E-mails comerciais
            (Microsoft Graph / Google Workspace). "O vendedor conversa. O CRM registra."
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="bg-primary text-white text-xs h-9"
            onClick={() => setNewSimulatedDialogOpen(true)}
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Simular Captura de Canal
          </Button>
        </div>
      </div>

      {/* CARDS DE RESUMO OPERACIONAL */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        <Card className="p-3 rounded-2xl bg-white border border-border/70 space-y-1">
          <span className="text-[10px] uppercase font-bold text-muted-foreground">
            Contatos Hoje
          </span>
          <div className="text-xl font-serif font-bold text-slate-900">{stats.total}</div>
          <span className="text-[10px] text-emerald-700 font-semibold">100% monitorados</span>
        </Card>

        <Card className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-emerald-800">WhatsApp</span>
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-serif font-bold text-emerald-900">{stats.whatsapps}</div>
          <span className="text-[10px] text-emerald-700">Meta / COEX</span>
        </Card>

        <Card className="p-3 rounded-2xl bg-sky-50/60 border border-sky-200 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-sky-800">Ligações VoIP</span>
            <Phone className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <div className="text-xl font-serif font-bold text-sky-900">{stats.ligacoes}</div>
          <span className="text-[10px] text-sky-700">Com transcrição IA</span>
        </Card>

        <Card className="p-3 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-blue-800">E-mails</span>
            <Mail className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-xl font-serif font-bold text-blue-900">{stats.emails}</div>
          <span className="text-[10px] text-blue-700">Microsoft Graph</span>
        </Card>

        <Card className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-emerald-800">Responderam</span>
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-serif font-bold text-emerald-900">{stats.respondidos}</div>
          <span className="text-[10px] text-emerald-700 font-semibold">
            Taxa retorno: {Math.round((stats.respondidos / stats.total) * 100)}%
          </span>
        </Card>

        <Card className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-amber-800">Sem Resposta</span>
            <Clock className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-xl font-serif font-bold text-amber-900">{stats.semResposta}</div>
          <span className="text-[10px] text-amber-700">Latência monitorada</span>
        </Card>

        <Card className="p-3 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-purple-800">Follow-ups</span>
            <AlertCircle className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <div className="text-xl font-serif font-bold text-purple-900">{stats.comProximaAcao}</div>
          <span className="text-[10px] text-purple-700">Com próxima ação</span>
        </Card>
      </div>

      {/* BARRA DE PESQUISA & FILTROS AVANÇADOS */}
      <Card className="p-4 rounded-2xl border border-border/60 bg-white space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por cliente, comprador, conteúdo ou cotação..."
              className="pl-9 text-xs h-9 rounded-xl"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 shrink-0">Canal:</span>
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="w-full text-xs h-9 rounded-xl border border-input bg-background px-2"
            >
              <option value="TODOS">Todos os Canais</option>
              <option value="WhatsApp">WhatsApp (Meta)</option>
              <option value="Telefone">Telefonia VoIP</option>
              <option value="E-mail">E-mail (Graph)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 shrink-0">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs h-9 rounded-xl border border-input bg-background px-2"
            >
              <option value="TODOS">Todos os Status</option>
              <option value="RESPONDIDOS">Apenas Respondidos</option>
              <option value="SEM_RESPOSTA">Sem Resposta / Aguardando</option>
              <option value="COM_OPORTUNIDADE">Com Oportunidade Vinculada</option>
            </select>
          </div>
        </div>
      </Card>

      {/* TABELA / TIMELINE DE CONTATOS */}
      <Card className="rounded-2xl border border-border/60 bg-white overflow-hidden shadow-xs">
        <div className="p-4 border-b border-border/40 flex items-center justify-between">
          <h3 className="font-serif font-bold text-base text-primary">
            Timeline de Contatos em Tempo Real ({filteredContacts.length})
          </h3>
          <span className="text-xs text-muted-foreground">
            Sincronização com SAP ECC & Histórico de Oportunidades
          </span>
        </div>

        <div className="divide-y divide-border/40">
          {filteredContacts.map((contact) => {
            const isWhatsApp = contact.channel === 'WhatsApp'
            const isTelefone = contact.channel === 'Telefone'
            const isEmail = contact.channel === 'E-mail'
            const isEntrada = contact.direction === 'ENTRADA' || contact.direction === 'INBOUND'

            return (
              <div
                key={contact.id}
                className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Canal & Identificação */}
                <div className="flex items-start gap-3 min-w-[280px]">
                  <div
                    className={cn(
                      'p-2.5 rounded-xl shrink-0 mt-0.5',
                      isWhatsApp
                        ? 'bg-emerald-100 text-emerald-800'
                        : isTelefone
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-blue-100 text-blue-800',
                    )}
                  >
                    {isWhatsApp && <MessageSquare className="w-4 h-4" />}
                    {isTelefone && <Phone className="w-4 h-4" />}
                    {isEmail && <Mail className="w-4 h-4" />}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => setSelectedCustomerFor360(contact.customer_id)}
                        className="font-serif font-bold text-sm text-primary hover:underline text-left"
                      >
                        {contact.customer_name}
                      </button>
                      <Badge variant="outline" className="text-[10px] py-0 font-mono">
                        {contact.channel}
                      </Badge>
                      <Badge
                        className={cn(
                          'text-[9px] py-0 font-medium',
                          isEntrada
                            ? 'bg-sky-100 text-sky-800 border-sky-300'
                            : 'bg-slate-100 text-slate-800 border-slate-300',
                        )}
                      >
                        {isEntrada ? '← Entrada (Inbound)' : '→ Saída (Outbound)'}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-700">
                      <strong>Contato:</strong> {contact.contact_name}{' '}
                      <span className="text-muted-foreground">({contact.seller_name})</span>
                    </p>

                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {contact.date_time}
                    </span>
                  </div>
                </div>

                {/* Resumo & Detalhe Comercial */}
                <div className="flex-1 space-y-1 max-w-xl">
                  <p className="text-xs text-slate-800 font-medium leading-relaxed">
                    {contact.summary}
                  </p>

                  {contact.opportunity_title && (
                    <div className="flex items-center gap-1.5 text-[11px] text-primary">
                      <span className="font-semibold">Oportunidade SAP:</span>
                      <span className="bg-primary/5 px-2 py-0.5 rounded-md border border-primary/10">
                        {contact.opportunity_title}
                      </span>
                    </div>
                  )}

                  {contact.next_action && (
                    <div className="text-[11px] text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60 inline-flex items-center gap-1.5">
                      <strong>Próxima Ação:</strong> {contact.next_action}{' '}
                      <span className="font-mono text-amber-900">({contact.next_action_date})</span>
                    </div>
                  )}
                </div>

                {/* Resultado & Botão de Ação */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <Badge
                    className={cn(
                      'text-xs font-semibold px-2.5 py-1',
                      contact.status === 'RESPONDIDO'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300',
                    )}
                  >
                    {contact.result}
                  </Badge>

                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-8"
                    onClick={() => setSelectedContactDetail(contact)}
                  >
                    Ver Conteúdo
                  </Button>

                  <Button
                    size="sm"
                    className="text-xs h-8 bg-primary text-white"
                    onClick={() => setSelectedCustomerFor360(contact.customer_id)}
                  >
                    Cliente 360º
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* DIALOG DETALHE DO CONTATO COM TRANSCRIÇÃO IA OU THREAD */}
      <Dialog
        open={!!selectedContactDetail}
        onOpenChange={(open) => !open && setSelectedContactDetail(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg text-primary flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Detalhes da Interação Comercial
            </DialogTitle>
          </DialogHeader>

          {selectedContactDetail && (
            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border space-y-1">
                <div className="flex justify-between">
                  <strong className="text-slate-900">{selectedContactDetail.customer_name}</strong>
                  <Badge variant="outline">{selectedContactDetail.channel}</Badge>
                </div>
                <p className="text-muted-foreground">
                  Comprador: {selectedContactDetail.contact_name} · Vendedor:{' '}
                  {selectedContactDetail.seller_name}
                </p>
                <p className="text-muted-foreground">{selectedContactDetail.date_time}</p>
              </div>

              {selectedContactDetail.email_subject && (
                <div>
                  <strong className="text-slate-800 block">Assunto do E-mail:</strong>
                  <p className="p-2 bg-slate-100 rounded-lg text-slate-800 font-medium">
                    {selectedContactDetail.email_subject}
                  </p>
                </div>
              )}

              <div>
                <strong className="text-slate-800 block">Conteúdo Completo Registrado:</strong>
                <p className="p-3 bg-slate-50 rounded-xl border text-slate-700 leading-relaxed">
                  {selectedContactDetail.detailed_content || selectedContactDetail.summary}
                </p>
              </div>

              {selectedContactDetail.transcription && (
                <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 space-y-1">
                  <strong className="text-sky-900 block flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-sky-600" /> Transcrição VoIP Gravada:
                  </strong>
                  <p className="text-sky-950 italic text-[11px] leading-relaxed">
                    "{selectedContactDetail.transcription}"
                  </p>
                </div>
              )}

              {selectedContactDetail.ai_summary && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-1">
                  <strong className="text-amber-900 block flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Resumo IA:
                  </strong>
                  <p className="text-amber-950 text-[11px]">{selectedContactDetail.ai_summary}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              size="sm"
              onClick={() => {
                const custId = selectedContactDetail?.customer_id
                setSelectedContactDetail(null)
                if (custId) setSelectedCustomerFor360(custId)
              }}
              className="bg-primary text-white text-xs"
            >
              Abrir no Cliente 360º
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG SIMULAÇÃO DE NOVO CONTATO */}
      <Dialog open={newSimulatedDialogOpen} onOpenChange={setNewSimulatedDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Simular Captura Automática de Canal
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <p className="text-muted-foreground leading-relaxed">
              O CRM 360º capta conversas do WhatsApp, VoIP ou E-mail e registra na timeline do
              cliente sem necessidade de preenchimento manual por formulário.
            </p>

            <div className="space-y-1">
              <label className="font-bold text-slate-800">Canal Integrado:</label>
              <div className="flex gap-2">
                {(['WhatsApp', 'Telefone', 'E-mail'] as CommercialContactChannel[]).map((ch) => (
                  <Button
                    key={ch}
                    type="button"
                    size="sm"
                    variant={simChannel === ch ? 'default' : 'outline'}
                    className="text-xs flex-1"
                    onClick={() => setSimChannel(ch)}
                  >
                    {ch}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-800">Cliente:</label>
              <Input
                value={simCustomer}
                onChange={(e) => setSimCustomer(e.target.value)}
                className="text-xs h-8"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-800">
                Texto da Mensagem / Resumo do Contato:
              </label>
              <Textarea
                rows={3}
                value={simText}
                onChange={(e) => setSimText(e.target.value)}
                placeholder="Ex: Cliente confirmou o recebimento da cotação e solicitou faturamento para dia 25..."
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setNewSimulatedDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              size="sm"
              className="bg-primary text-white text-xs"
              onClick={handleSimulateNewContact}
            >
              <Send className="w-3.5 h-3.5 mr-1" /> Capturar Contato
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customer 360 Sheet */}
      {selectedCustomerFor360 && (
        <Customer360Sheet
          customerId={selectedCustomerFor360}
          open={!!selectedCustomerFor360}
          onOpenChange={(open) => !open && setSelectedCustomerFor360(null)}
        />
      )}
    </div>
  )
}
