import { pb } from '@/lib/pocketbase/client'
import { toast } from 'sonner'

export interface FredDeliveryException {
  id: string
  transportNumber: string
  orderNumber: string
  customerSapCode: string
  customerName: string
  destinationCity: string
  destinationUf: string
  carrierName: string
  driverName?: string
  driverPhone?: string
  vehiclePlate?: string
  status:
    | 'EM_TRANSITO'
    | 'EM_SEPARACAO'
    | 'ATRASO_DETECTADO'
    | 'OCORRENCIA_DESCARGA'
    | 'MDFe_RETIDO'
    | 'ENTREGUE'
  severity: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA'
  exceptionReason: string
  etaOriginal: string
  etaAtualizado: string
  firstDeviationArea: 'TMS' | 'WMS' | 'TRANSPORTADORA' | 'SEFAZ' | 'CLIENTE' | 'PCP'
  evidenceLogs: string[]
  suggestedAction: string
  lastSyncAt: string
}

export interface FredTmsMessageContext {
  transportNumber?: string
  orderNumber?: string
  customerSapCode?: string
  customerName?: string
  carrierName?: string
  driverName?: string
  vehiclePlate?: string
  destinationCity?: string
  destinationUf?: string
}

class FredTmsService {
  /**
   * Cargas com exceções logísticas ativas monitoradas pelo Fred no TMS
   */
  private mockExceptions: FredDeliveryException[] = [
    {
      id: 'fred-exc-1',
      transportNumber: 'TMS-CARGA-9912',
      orderNumber: 'PED-2024-8800',
      customerSapCode: '100001',
      customerName: 'AÇOCON ESTRUTURAS METÁLICAS S/A',
      destinationCity: 'Contagem',
      destinationUf: 'MG',
      carrierName: 'TransAço Logística Rodoviária Ltda',
      driverName: 'Marcos Silveira',
      driverPhone: '(31) 99872-1102',
      vehiclePlate: 'ABC-7000',
      status: 'MDFe_RETIDO',
      severity: 'ALTA',
      exceptionReason:
        'Retenção temporária no posto fiscal SEFAZ MG (BR-381 km 488) para conferência documental.',
      etaOriginal: 'Hoje 14:00',
      etaAtualizado: 'Hoje 17:30 (+3h30m)',
      firstDeviationArea: 'SEFAZ',
      evidenceLogs: [
        '07:15 - Portaria CD Contagem: Saída liberada com MDFe 31240988172819',
        '09:40 - Telemetria Omnilink: Parada identificada no Posto Fiscal Betim',
        '10:45 - Alerta SEFAZ MG: Verificação física de manifesto em fila de pesagem',
      ],
      suggestedAction:
        'Notificar comprador da AçoCon sobre novo ETA (17h30) e alinhar janela estendida de descarga.',
      lastSyncAt: new Date().toISOString(),
    },
    {
      id: 'fred-exc-2',
      transportNumber: 'TMS-CARGA-9935',
      orderNumber: 'PED-2024-8824',
      customerSapCode: '100004',
      customerName: 'ENGEMINAS OBRAS & INFRAESTRUTURA',
      destinationCity: 'Divinópolis',
      destinationUf: 'MG',
      carrierName: 'Expresso Minas Cargas',
      driverName: 'Carlos Eduardo',
      driverPhone: '(37) 98822-4411',
      vehiclePlate: 'MTO-4921',
      status: 'OCORRENCIA_DESCARGA',
      severity: 'MEDIA',
      exceptionReason:
        'Fila de espera para descarga de perfil pesado no canteiro de obras (Doca 2 ocupada).',
      etaOriginal: 'Hoje 11:30',
      etaAtualizado: 'Hoje 15:00',
      firstDeviationArea: 'CLIENTE',
      evidenceLogs: [
        '11:15 - Chegada no geofence da obra',
        '11:35 - Motorista reportou fila de guindaste excedendo janela de 40 min',
      ],
      suggestedAction:
        'Acionar engenheiro residente para priorizar descarregamento da carreta CIAFAL.',
      lastSyncAt: new Date().toISOString(),
    },
    {
      id: 'fred-exc-3',
      transportNumber: 'TMS-CARGA-9951',
      orderNumber: 'PED-2024-8836',
      customerSapCode: '100006',
      customerName: 'ESTRUTURAS METÁLICAS TRIÂNGULO',
      destinationCity: 'Juiz de Fora',
      destinationUf: 'MG',
      carrierName: 'Rodoviário Triângulo',
      driverName: 'Roberto Dias',
      driverPhone: '(32) 99112-9900',
      vehiclePlate: 'KLP-8819',
      status: 'ATRASO_DETECTADO',
      severity: 'MEDIA',
      exceptionReason: 'Interdição parcial na BR-040 devido a obras de recapeamento asfáltico.',
      etaOriginal: 'Amanhã 09:00',
      etaAtualizado: 'Amanhã 13:30',
      firstDeviationArea: 'TRANSPORTADORA',
      evidenceLogs: [
        '14:20 - Telemetria Sascar: Velocidade média caiu para 18 km/h no trecho Santos Dumont',
      ],
      suggestedAction: 'Informar almoxarifado do cliente sobre postergação para período da tarde.',
      lastSyncAt: new Date().toISOString(),
    },
  ]

  /**
   * Obtém as exceções e cargas que exigem atenção para o Meu Dia
   */
  async getDeliveryExceptions(): Promise<FredDeliveryException[]> {
    return this.mockExceptions
  }

  /**
   * Obtém entregas específicas de um cliente pelo código SAP ou ID
   */
  async getDeliveriesByCustomer(customerSapCode: string): Promise<FredDeliveryException[]> {
    return this.mockExceptions.filter((e) => e.customerSapCode === customerSapCode)
  }

  /**
   * Deep link contextual para o Agente Fred no TMS
   */
  getFredDeepLink(context: FredTmsMessageContext): string {
    const params = new URLSearchParams()
    if (context.transportNumber) params.set('transporte', context.transportNumber)
    if (context.orderNumber) params.set('pedido', context.orderNumber)
    if (context.customerSapCode) params.set('sap', context.customerSapCode)
    if (context.customerName) params.set('cliente', context.customerName)
    if (context.carrierName) params.set('transportadora', context.carrierName)
    if (context.vehiclePlate) params.set('placa', context.vehiclePlate)
    if (context.destinationCity)
      params.set('destino', `${context.destinationCity}/${context.destinationUf || 'MG'}`)
    return `/agente-fred?${params.toString()}`
  }

  /**
   * Deep link contextual para o Portal TMS
   */
  getTmsDeepLink(transportNumber: string): string {
    return `https://tms.ciafal.local/cargas/${encodeURIComponent(transportNumber)}`
  }

  /**
   * Registra log de auditoria ao consultar ou interagir com o Fred
   */
  async logFredInteraction(action: string, context: FredTmsMessageContext) {
    try {
      const user = pb.authStore.record
      const userId = user?.id || 'anonymous'
      console.log(
        `[AUDIT FRED TMS] User: ${userId} | Action: ${action} | Transporte: ${context.transportNumber || 'N/A'}`,
      )
    } catch (e) {
      console.warn('Erro ao gravar log do Fred:', e)
    }
  }
}

export const fredTmsService = new FredTmsService()
