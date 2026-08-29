import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Truck,
  AlertTriangle,
  Clock,
  MapPin,
  Bot,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { fredTmsService, type FredDeliveryException } from '@/services/fred_tms_service'

interface LogisticsAttentionBlockProps {
  exceptions: FredDeliveryException[]
}

export function LogisticsAttentionBlock({ exceptions }: LogisticsAttentionBlockProps) {
  const navigate = useNavigate()

  if (!exceptions || exceptions.length === 0) {
    return null
  }

  return (
    <Card className="border-amber-200/80 bg-gradient-to-br from-amber-50/40 via-white to-orange-50/20 shadow-xs rounded-3xl overflow-hidden">
      <CardHeader className="p-5 pb-3 border-b border-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 text-amber-700 rounded-2xl">
            <Truck className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-bold text-slate-900 font-serif">
                Entregas & Logística com Atenção (TMS CIAFAL)
              </CardTitle>
              <Badge className="bg-amber-100 text-amber-900 border-amber-300 font-mono text-[10px]">
                {exceptions.length} Exceções Ativas
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Monitoramento automatizado integrado ao Agente Fred e telemetria do TMS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/agente-fred')}
            className="h-8 text-xs bg-white text-blue-700 border-blue-200 hover:bg-blue-50 rounded-xl gap-1.5"
          >
            <Bot className="w-3.5 h-3.5" />
            Fred — Acompanhar Entregas
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {exceptions.map((exc) => {
            const deepLink = fredTmsService.getFredDeepLink({
              transportNumber: exc.transportNumber,
              orderNumber: exc.orderNumber,
              customerSapCode: exc.customerSapCode,
              customerName: exc.customerName,
              carrierName: exc.carrierName,
              vehiclePlate: exc.vehiclePlate,
              destinationCity: exc.destinationCity,
              destinationUf: exc.destinationUf,
            })

            return (
              <div
                key={exc.id}
                className="p-3.5 rounded-2xl bg-white border border-amber-200/70 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                      {exc.transportNumber}
                    </span>
                    <Badge
                      className={`text-[9px] font-bold ${
                        exc.severity === 'ALTA'
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}
                    >
                      {exc.status === 'MDFe_RETIDO'
                        ? 'SEFAZ Retido'
                        : exc.status === 'OCORRENCIA_DESCARGA'
                          ? 'Fila Descarga'
                          : 'Atraso em Rota'}
                    </Badge>
                  </div>

                  <div>
                    <strong className="text-xs text-slate-900 line-clamp-1">
                      {exc.customerName}
                    </strong>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                      <span>Pedido: {exc.orderNumber}</span>
                      <span>·</span>
                      <span>
                        {exc.destinationCity}/{exc.destinationUf}
                      </span>
                    </div>
                  </div>

                  <div className="p-2 bg-amber-50/70 rounded-xl border border-amber-200/50 text-[11px] text-amber-950 space-y-1">
                    <div className="flex items-center gap-1 font-semibold text-amber-900">
                      <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                      <span>{exc.exceptionReason}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-amber-800 pt-1 border-t border-amber-200/40">
                      <span>ETA Original: {exc.etaOriginal}</span>
                      <strong className="text-rose-700">Novo ETA: {exc.etaAtualizado}</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      toast.info(`Abrindo TMS da carga ${exc.transportNumber}...`)
                      window.open(fredTmsService.getTmsDeepLink(exc.transportNumber), '_blank')
                    }}
                    className="h-7 text-[11px] text-slate-600 hover:text-slate-900 gap-1 px-2"
                  >
                    <ExternalLink className="w-3 h-3" /> Ver TMS
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => navigate(deepLink)}
                    className="h-7 text-[11px] bg-blue-600 hover:bg-blue-700 text-white gap-1 rounded-lg px-2.5"
                  >
                    <Bot className="w-3 h-3" /> Consultar Fred
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
