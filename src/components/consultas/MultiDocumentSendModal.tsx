// src/components/consultas/MultiDocumentSendModal.tsx
import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Share2,
  Mail,
  Sparkles,
  Send,
  FileText,
  CreditCard,
  Award,
  CheckCircle2,
  User,
  Building2,
  MessageSquare,
} from 'lucide-react'
import { consultasService } from '@/services/consultasService'
import { mockCommercialContacts } from '@/data/mockCommercialContacts'
import { mockClientes } from '@/data/mockCommercialData'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

export interface SelectedDocItem {
  id: string
  tipo: 'NF_PDF' | 'NF_XML' | 'BOLETO_PDF' | 'CERTIFICADO_PDF'
  numero: string
  descricao: string
}

interface MultiDocumentSendModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clienteId: string
  clienteNome: string
  documentos: SelectedDocItem[]
  onSuccess?: () => void
}

export const MultiDocumentSendModal: React.FC<MultiDocumentSendModalProps> = ({
  open,
  onOpenChange,
  clienteId,
  clienteNome,
  documentos,
  onSuccess,
}) => {
  const { user } = useAuth()
  const [canal, setCanal] = useState<'WHATSAPP' | 'EMAIL'>('WHATSAPP')
  const [destinatarioNome, setDestinatarioNome] = useState('')
  const [destinatarioContato, setDestinatarioContato] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [sending, setSending] = useState(false)

  // Carrega contatos do cliente
  const contatos = mockCommercialContacts.filter(
    (c) => c.customer_id === clienteId || c.customer_name === clienteNome,
  )

  useEffect(() => {
    if (contatos.length > 0) {
      setDestinatarioNome(contatos[0].contact_name || 'Contato Comercial')
      setDestinatarioContato(
        canal === 'WHATSAPP'
          ? contatos[0].contact_phone || '(31) 98822-1090'
          : contatos[0].contact_email || 'financeiro@cliente.com.br',
      )
    } else {
      setDestinatarioNome('Responsável Comercial / Financeiro')
      setDestinatarioContato(canal === 'WHATSAPP' ? '(31) 98822-1090' : 'financeiro@empresa.com.br')
    }
  }, [clienteId, canal])

  // Gerar mensagem inicial com IA
  useEffect(() => {
    if (open && documentos.length > 0) {
      const msg = consultasService.gerarSugestaoMensagemIA(
        clienteNome,
        destinatarioNome,
        documentos.map((d) => ({ tipo: d.tipo, numero: d.numero })),
        canal,
        user?.name || 'Vendedor CIAFAL',
      )
      setMensagem(msg)
    }
  }, [open, canal, destinatarioNome, documentos])

  const handleRegenerateIA = () => {
    const msg = consultasService.gerarSugestaoMensagemIA(
      clienteNome,
      destinatarioNome,
      documentos.map((d) => ({ tipo: d.tipo, numero: d.numero })),
      canal,
      user?.name || 'Vendedor CIAFAL',
    )
    setMensagem(msg)
    toast.info('Mensagem reescrita pela IA Comercial!')
  }

  const handleSend = async () => {
    if (!destinatarioContato.trim()) {
      toast.error('Informe o destinatário do envio.')
      return
    }
    if (!mensagem.trim()) {
      toast.error('A mensagem não pode estar vazia.')
      return
    }

    setSending(true)
    try {
      if (user) {
        await consultasService.enviarDocumentosMultiplos(user, {
          clienteId,
          canal,
          destinatarioNome,
          destinatarioContato,
          documentos,
          mensagem,
        })
      }

      toast.success(
        `Pacote com ${documentos.length} documento(s) enviado com sucesso via ${canal === 'WHATSAPP' ? 'WhatsApp Oficial' : 'E-mail'}!`,
        {
          description: `Registrado na Linha do Tempo 360º de ${clienteNome}.`,
        },
      )
      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (err) {
      toast.error('Erro ao registrar envio do pacote documental.')
    } finally {
      setSending(false)
    }
  }

  const getDocIcon = (tipo: SelectedDocItem['tipo']) => {
    if (tipo.startsWith('NF')) return <FileText className="w-4 h-4 text-primary" />
    if (tipo.startsWith('BOLETO')) return <CreditCard className="w-4 h-4 text-emerald-600" />
    return <Award className="w-4 h-4 text-blue-600" />
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-0 bg-white">
        <DialogHeader className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-lg">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">
                Enviar Documentos ao Cliente — Central de Autosserviço
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Cliente: <strong className="text-slate-800">{clienteNome}</strong> · Envio
                multicanal auditado
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-4 text-xs">
          {/* Documentos Anexos Selecionados */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Documentos Selecionados ({documentos.length} anexo(s))
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {documentos.map((doc, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    {getDocIcon(doc.tipo)}
                    <div className="truncate">
                      <span className="font-bold text-slate-900 block truncate">
                        {doc.descricao}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Nº {doc.numero}
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-white shrink-0 ml-2">
                    {doc.tipo.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Seleção do Canal */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Canal de Envio Oficial</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCanal('WHATSAPP')}
                className={`p-3 rounded-xl border flex items-center gap-3 text-left transition-all ${
                  canal === 'WHATSAPP'
                    ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20 text-emerald-950 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs block">WhatsApp Business CIAFAL</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    Envio instantâneo via Cloud API
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setCanal('EMAIL')}
                className={`p-3 rounded-xl border flex items-center gap-3 text-left transition-all ${
                  canal === 'EMAIL'
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20 text-primary font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs block">E-mail Corporativo</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    Envio com anexo oficial PDF/XML
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Dados do Destinatário */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Nome do Destinatário</label>
              <Input
                value={destinatarioNome}
                onChange={(e) => setDestinatarioNome(e.target.value)}
                className="h-9 text-xs"
                placeholder="Nome do contato ou setor"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                {canal === 'WHATSAPP' ? 'Número WhatsApp' : 'E-mail Destinatário'}
              </label>
              <Input
                value={destinatarioContato}
                onChange={(e) => setDestinatarioContato(e.target.value)}
                className="h-9 text-xs"
                placeholder={canal === 'WHATSAPP' ? '(31) 98888-0000' : 'cliente@empresa.com.br'}
              />
            </div>
          </div>

          {/* Mensagem Sugerida por IA */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Mensagem Comercial (Sugerida por IA — Editável)
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRegenerateIA}
                className="h-7 text-[11px] text-primary gap-1 px-2 hover:bg-primary/5"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                Reescrever com IA
              </Button>
            </div>
            <Textarea
              rows={6}
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              className="text-xs font-sans leading-relaxed resize-none bg-slate-50/50 border-slate-300 focus:bg-white"
              placeholder="Digite a mensagem para o cliente..."
            />
            <p className="text-[10px] text-slate-500">
              * A IA atua apenas como suporte à redação comercial. Ela não altera dados fiscais,
              financeiros ou resultados laboratoriais.
            </p>
          </div>
        </div>

        {/* Rodapé com Botão de Disparo */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs border-slate-300"
          >
            Cancelar
          </Button>

          <Button
            size="sm"
            onClick={handleSend}
            disabled={sending}
            className="text-xs bg-primary text-white hover:bg-primary/90 gap-1.5 px-5"
          >
            <Send className="w-3.5 h-3.5" />
            {sending ? 'Enviando pacote...' : `Enviar ${documentos.length} Documento(s)`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
