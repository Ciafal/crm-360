// src/components/consultas/TmsTransporteModal.tsx
import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Truck,
  Bot,
  User,
  MapPin,
  Calendar,
  CheckCircle2,
  FileCheck,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react'
import { DocumentoFiscalNF } from '@/data/mockConsultasData'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

interface TmsTransporteModalProps {
  nf: DocumentoFiscalNF | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const TmsTransporteModal: React.FC<TmsTransporteModalProps> = ({
  nf,
  open,
  onOpenChange,
}) => {
  const navigate = useNavigate()

  if (!nf || !nf.transporteInfo) return null

  const info = nf.transporteInfo

  const handleConsultarFred = () => {
    onOpenChange(false)
    navigate(
      `/agente-fred?sap=${nf.codigoClienteSap}&transporte=${info.numeroTransporte}&pedido=${nf.pedidoSap}&cliente=${encodeURIComponent(nf.clienteNome)}`,
    )
  }

  const handleVerComprovante = () => {
    toast.success('Comprovante de entrega assinado digitalmente carregado!')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 bg-white">
        <DialogHeader className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                Logística & TMS — Transporte nº {info.numeroTransporte}
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {info.statusCarga}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                NF nº {nf.numeroNF} · Pedido SAP {nf.pedidoSap} · Cliente: {nf.clienteNome}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-5 space-y-4 text-xs text-slate-800">
          {/* Card Resumo do Transporte */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Transportadora Oficial
                </span>
                <span className="font-bold text-slate-900 text-xs block">
                  {info.transportadora}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Status da Carga
                </span>
                <span className="font-extrabold text-blue-900 block">{info.statusCarga}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Motorista / Placa
                </span>
                <span className="font-medium text-slate-800">{info.motorista}</span>
                <span className="text-[10px] text-slate-500 block font-mono">
                  Placa: {info.placa}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Previsão de Entrega (ETA)
                </span>
                <span className="font-bold text-slate-900">{info.previsaoEntrega}</span>
                {info.dataEntregaRealizada && (
                  <span className="text-[10px] text-emerald-700 font-bold block flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Realizada em {info.dataEntregaRealizada}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Comprovante de Entrega */}
          <div className="p-3 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <div>
                <span className="font-bold block text-slate-900">
                  Comprovante de Entrega (Canhoto Digital)
                </span>
                <span className="text-[10px] text-slate-500">
                  {info.comprovanteEntregaDisponivel
                    ? 'Disponível no repositório TMS'
                    : 'Aguardando sincronização do motorista'}
                </span>
              </div>
            </div>
            {info.comprovanteEntregaDisponivel && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleVerComprovante}
                className="h-7 text-xs border-emerald-300 text-emerald-800 hover:bg-emerald-50"
              >
                Visualizar Canhoto
              </Button>
            )}
          </div>

          {/* Integração Agente Fred */}
          <div className="p-4 bg-gradient-to-r from-blue-900 to-indigo-900 rounded-xl text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-xs">
                <Bot className="w-6 h-6 text-cyan-300" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-cyan-100 flex items-center gap-1.5">
                  Fred — Copiloto Logístico & TMS CIAFAL
                </h4>
                <p className="text-[11px] text-blue-100/90 leading-tight">
                  Pergunte sobre telemetria em tempo real, retenções na SEFAZ e previsão precisa de
                  descarga.
                </p>
              </div>
            </div>

            <Button
              size="sm"
              onClick={handleConsultarFred}
              className="bg-cyan-400 hover:bg-cyan-300 text-blue-950 font-bold text-xs h-8 ml-3 shrink-0"
            >
              Consultar Fred
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
