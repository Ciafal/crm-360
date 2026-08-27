import type { TMSDeliveryLoad, TMSLoadStatus } from '@/types/models'

class TMSProviderService {
  private loadsMap: Map<string, TMSDeliveryLoad[]> = new Map()

  constructor() {
    this.seedMockLoads()
  }

  private seedMockLoads() {
    const clients = [
      'cli-100001',
      'cli-100002',
      'cli-100003',
      'cli-100004',
      'cli-100006',
      'cli-100009',
      'cli-100013',
      'cli-100019',
    ]

    clients.forEach((cid, index) => {
      const loads: TMSDeliveryLoad[] = [
        {
          id: `tms-load-${cid}-1`,
          customerId: cid,
          orderNumber: `PED-2024-${8800 + index * 4}`,
          nfNumber: `NF-0098${400 + index}`,
          carrierName: 'TransAço Logística Rodoviária Ltda',
          vehiclePlate: `ABC-${7000 + index}`,
          driverName: 'Marcos Silveira (Rastreador Omnilink)',
          tons: 14.5 + (index % 5) * 3,
          itemsDescription: 'Perfis W 200x26.6 e Chapas Grossas A36',
          status:
            index === 0
              ? 'LOGISTICS_EXCEPTION'
              : index % 2 === 0
                ? 'LOAD_IN_TRANSIT'
                : 'IN_DISPATCH',
          originCD: 'CD Contagem',
          destinationCity: 'Contagem',
          destinationUF: 'MG',
          estimatedDeliveryDate: 'Hoje 16:30',
          hasLogisticsException: index === 0,
          exceptionReason:
            index === 0
              ? 'Retenção temporária no posto fiscal SEFAZ MG para conferência de manifesto (MDFe).'
              : undefined,
          trackingUrl: `https://rastreamento.tms.ciafal.local/tracking/NF-0098${400 + index}`,
          timelineEvents: [
            {
              id: 'ev-1',
              event: 'ORDER_PREPARATION',
              timestamp: 'Ontem 14:00',
              description: 'Separação e conferência de fardos no CD Contagem',
              location: 'CD Contagem',
            },
            {
              id: 'ev-2',
              event: 'LOAD_FORMED',
              timestamp: 'Ontem 17:30',
              description: 'Carga fechada e amarração concluída',
              location: 'Doca 04',
            },
            {
              id: 'ev-3',
              event: 'LOAD_DISPATCHED',
              timestamp: 'Hoje 07:15',
              description: 'Caminhão liberado na portaria da fábrica',
              location: 'Portaria Principal Contagem',
            },
            ...(index === 0
              ? [
                  {
                    id: 'ev-4',
                    event: 'LOGISTICS_EXCEPTION' as TMSLoadStatus,
                    timestamp: 'Hoje 10:45',
                    description: 'Alerta SEFAZ MG: Verificação de manifesto em trânsito',
                    location: 'BR-381 km 488',
                  },
                ]
              : [
                  {
                    id: 'ev-4',
                    event: 'LOAD_IN_TRANSIT' as TMSLoadStatus,
                    timestamp: 'Hoje 09:20',
                    description: 'Veículo em deslocamento com telemetria ativa',
                    location: 'Via Expressa de Contagem',
                  },
                ]),
          ],
        },
        {
          id: `tms-load-${cid}-2`,
          customerId: cid,
          orderNumber: `PED-2024-${8750 + index * 4}`,
          nfNumber: `NF-0097${800 + index}`,
          carrierName: 'Expresso Minas Cargas Pesadas',
          vehiclePlate: `XYZ-${5000 + index}`,
          driverName: 'Antônio Ferreira',
          tons: 22.0,
          itemsDescription: 'Tubos Schedule 40 e Barras Trefiladas',
          status: 'LOAD_DELIVERED',
          originCD: 'CD Betim',
          destinationCity: 'Belo Horizonte',
          destinationUF: 'MG',
          estimatedDeliveryDate: '10/10/2024 11:00',
          actualDeliveryDate: '10/10/2024 10:42',
          hasLogisticsException: false,
          trackingUrl: `https://rastreamento.tms.ciafal.local/tracking/NF-0097${800 + index}`,
          timelineEvents: [
            {
              id: 'ev-1',
              event: 'LOAD_DISPATCHED',
              timestamp: '10/10/2024 06:30',
              description: 'Expedido do CD Betim',
            },
            {
              id: 'ev-2',
              event: 'LOAD_DELIVERED',
              timestamp: '10/10/2024 10:42',
              description: 'Entregue e canhoto digital assinado',
            },
          ],
        },
      ]

      this.loadsMap.set(cid, loads)
    })
  }

  async getCustomerLoads(customerId: string): Promise<TMSDeliveryLoad[]> {
    await new Promise((resolve) => setTimeout(resolve, 150))
    return this.loadsMap.get(customerId) || this.loadsMap.get('cli-100001') || []
  }
}

export const tmsProvider = new TMSProviderService()
