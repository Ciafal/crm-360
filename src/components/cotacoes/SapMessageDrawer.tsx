import React from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, AlertTriangle, XCircle, Info, Server, Terminal } from 'lucide-react'
import type { SapOrderMessage } from '@/types/quotation'

interface SapMessageDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  integrationId?: string
  messages?: SapOrderMessage[]
  quotation?: any
}

export function SapMessageDrawer({
  open,
  onOpenChange,
  integrationId = 'ALL',
  messages = [],
}: SapMessageDrawerProps) {
  const safeMessages = Array.isArray(messages) ? messages : []
  const filtered = safeMessages.filter(
    (m) => Boolean(m) && (m.integration_id === integrationId || integrationId === 'ALL'),
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[380px] sm:w-[500px] bg-slate-900 text-slate-100 border-l border-slate-800 p-6 flex flex-col justify-between"
      >
        <div className="space-y-4 overflow-y-auto pr-1">
          <SheetHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-slate-800 text-slate-100 rounded-xl">
                <Terminal className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <SheetTitle className="text-white font-serif text-lg font-bold tracking-tight">
                  Log de Mensagens SAP ECC
                </SheetTitle>
                <SheetDescription className="text-slate-400 text-xs">
                  Integração: {integrationId}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {/* Lista de Mensagens */}
          <div className="space-y-2.5">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                Nenhuma mensagem registrada na fila para este integration_id.
              </div>
            ) : (
              filtered.map((msg) => (
                <div
                  key={msg.id}
                  className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {msg.message_type === 'SUCCESS' && (
                        <Badge className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-mono">
                          SUCCESS (S)
                        </Badge>
                      )}
                      {msg.message_type === 'WARNING' && (
                        <Badge className="bg-amber-950 text-amber-400 border border-amber-800 text-[10px] font-mono">
                          WARNING (W)
                        </Badge>
                      )}
                      {msg.message_type === 'ERROR' && (
                        <Badge className="bg-rose-950 text-rose-400 border border-rose-800 text-[10px] font-mono">
                          ERROR (E)
                        </Badge>
                      )}
                      {msg.message_type === 'INFO' && (
                        <Badge className="bg-blue-950 text-blue-400 border border-blue-800 text-[10px] font-mono">
                          INFO (I)
                        </Badge>
                      )}
                      <span className="font-mono text-[10px] text-slate-400">
                        {msg.message_class} {msg.message_number}
                      </span>
                    </div>

                    <span className="font-mono text-[10px] text-slate-500">{msg.created_at}</span>
                  </div>

                  <p className="text-slate-200 font-mono text-[11px] leading-relaxed">
                    {msg.message_text}
                  </p>

                  <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                    Origem: <strong>{msg.source}</strong>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 text-center">
          Tabela auditável <code>crm_sap_order_messages</code> · RFC BAPI Listener
        </div>
      </SheetContent>
    </Sheet>
  )
}
