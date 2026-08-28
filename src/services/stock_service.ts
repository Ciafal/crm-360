import type {
  StockItem,
  StockCheckRequest,
  CommercialOpportunity,
  StockAuditLog,
  StockGovernanceParam,
  StockFilterState,
  StockOverviewKpis,
  OpportunityFitScore,
  CheckPriority,
} from '@/types/stock'
import pb from '@/lib/pocketbase/client'

const STORAGE_KEY_STOCK_ITEMS = 'ciafal_stock_staging_items_v2'
const STORAGE_KEY_STOCK_CHECKS = 'ciafal_stock_check_requests_v2'
const STORAGE_KEY_STOCK_AUDIT = 'ciafal_stock_audit_logs_v2'
const STORAGE_KEY_STOCK_PARAMS = 'ciafal_stock_governance_params_v2'
const STORAGE_KEY_SAVED_VIEWS = 'ciafal_stock_saved_views_v2'

// Seed Inicial de Itens de Estoque CIAFAL
export const INITIAL_STOCK_ITEMS: StockItem[] = [
  {
    id: 'stk-001',
    materialCode: 'PERF-W-200X26',
    description: 'Perfil W 200 x 26.6 kg/m Aço ASTM A572 Gr50 - Barra 12m',
    family: 'Perfis Estruturais',
    groupCode: 'PERFIS_LAMINADOS',
    line: 'Linha Pesada',
    bitola: '200x26.6mm',
    quality: 'ASTM A572 Gr50',
    plantCode: '1000',
    plantName: 'Matriz Contagem - CD Principal',
    storageLocation: 'DEP-01',
    storageLocationName: 'Pátio Central de Perfis',
    batchNumber: 'LOTE-A572-8891',
    unit: 't',
    physicalTons: 142.5,
    committedTons: 38.0,
    availableTons: 98.5,
    blockedTons: 0.0,
    inspectionTons: 2.0,
    inCheckTons: 4.0,
    projectedPcpTons: 60.0,
    costPricePerTon: 5800,
    estimatedTotalValue: 826500,
    minStockTons: 40.0,
    maxStockTons: 200.0,
    criticalStockTons: 25.0,
    strategicSafetyTons: 30.0,
    entryDate: '12/04/2024',
    ageDays: 190,
    ageBracket: '>180',
    lastMovementDate: '28/05/2024',
    daysWithoutMovement: 144,
    lastSaleDate: '15/05/2024',
    lastCustomerSap: '100001',
    lastCustomerName: 'Metalúrgica Santa Rita Ltda',
    lastSellerId: 'qas-vendedor_teste',
    lastSellerName: 'Carlos Mendonça',
    historicAvgPriceKg: 6.45,
    historicTurnoverRate: 1.8,
    classification: 'PARADO',
    allowedSellerIds: [
      'qas-admin_teste',
      'qas-supervisor_teste',
      'qas-vendedor_teste',
      'qas-vendedor2_teste',
    ],
    allowedRegions: ['Grande BH', 'Triângulo Mineiro', 'Sul de Minas', 'Zona da Mata'],
    assignedSellerId: 'qas-vendedor_teste',
    assignedSellerName: 'Carlos Mendonça',
    sapSyncStatus: 'SINCRONIZADO',
    sapLastSync: '19/10/2024 08:30',
    wmsSyncStatus: 'ONLINE',
    tmsComplementAvailable: true,
    tmsRegionDest: 'Grande BH / Contagem / Betim',
    tmsNextLoadingWindow: '21/10/2024 14:00 (Carreta Rota MG-050)',
    tmsPlannedTripCode: 'TMS-CARGA-9912',
    pcpNextProductionDate: '28/10/2024',
    pcpLine: 'Laminador Perfis 2',
    pcpConfidenceLevel: 'ALTO',
    pcpStatus: 'EM_PROGRAMACAO',
  },
  {
    id: 'stk-002',
    materialCode: 'TUB-SCH40-4POL',
    description: 'Tubo de Aço Carbono Sem Costura Schedule 40 4" NBR 5590',
    family: 'Tubos Industriais',
    groupCode: 'TUBOS_CONDUCAO',
    line: 'Tubos Schedule',
    bitola: '4" (114.3mm) x 6.02mm',
    quality: 'ASTM A106 Gr B / API 5L',
    plantCode: '2000',
    plantName: 'Unidade Industrial Betim',
    storageLocation: 'DEP-03',
    storageLocationName: 'Galpão Fechado Tubos Especiais',
    batchNumber: 'LOTE-SCH-4091',
    unit: 't',
    physicalTons: 64.0,
    committedTons: 52.0,
    availableTons: 8.5,
    blockedTons: 0.0,
    inspectionTons: 0.0,
    inCheckTons: 3.5,
    projectedPcpTons: 40.0,
    costPricePerTon: 7200,
    estimatedTotalValue: 460800,
    minStockTons: 20.0,
    maxStockTons: 80.0,
    criticalStockTons: 10.0,
    strategicSafetyTons: 15.0,
    entryDate: '10/08/2024',
    ageDays: 70,
    ageBracket: '61-90',
    lastMovementDate: '08/10/2024',
    daysWithoutMovement: 11,
    lastSaleDate: '05/10/2024',
    lastCustomerSap: '100002',
    lastCustomerName: 'Aços & Caldeiraria Betim S.A.',
    lastSellerId: 'qas-vendedor_teste',
    lastSellerName: 'Carlos Mendonça',
    historicAvgPriceKg: 8.1,
    historicTurnoverRate: 4.6,
    classification: 'CRITICO',
    allowedSellerIds: [
      'qas-admin_teste',
      'qas-supervisor_teste',
      'qas-vendedor_teste',
      'qas-representante_teste',
    ],
    allowedRegions: ['Grande BH', 'Triângulo Mineiro', 'Alto Paranaíba'],
    assignedSellerId: 'qas-vendedor_teste',
    assignedSellerName: 'Carlos Mendonça',
    sapSyncStatus: 'SINCRONIZADO',
    sapLastSync: '19/10/2024 08:30',
    wmsSyncStatus: 'ONLINE',
    tmsComplementAvailable: false,
    pcpNextProductionDate: '28/10/2024',
    pcpLine: 'Laminador Tubos Sch Betim',
    pcpConfidenceLevel: 'ALTO',
    pcpStatus: 'LAMINACAO_INICIADA',
  },
  {
    id: 'stk-003',
    materialCode: 'CHP-A36-12MM',
    description: 'Chapa Grossa de Aço Carbono ASTM A36 12.70mm x 2440 x 6000mm',
    family: 'Chapas Grossas',
    groupCode: 'LAMINADOS_PLANO',
    line: 'Chapas Pesadas',
    bitola: '1/2" (12.70mm)',
    quality: 'ASTM A36 / USI-SAC 350',
    plantCode: '1000',
    plantName: 'Matriz Contagem - CD Principal',
    storageLocation: 'DEP-02',
    storageLocationName: 'Pátio de Chapas & Bobinas',
    batchNumber: 'LOTE-CHP-7712',
    unit: 't',
    physicalTons: 210.0,
    committedTons: 45.0,
    availableTons: 165.0,
    blockedTons: 0.0,
    inspectionTons: 0.0,
    inCheckTons: 0.0,
    projectedPcpTons: 100.0,
    costPricePerTon: 5400,
    estimatedTotalValue: 1134000,
    minStockTons: 50.0,
    maxStockTons: 250.0,
    criticalStockTons: 35.0,
    strategicSafetyTons: 40.0,
    entryDate: '15/09/2024',
    ageDays: 34,
    ageBracket: '31-60',
    lastMovementDate: '12/10/2024',
    daysWithoutMovement: 7,
    lastSaleDate: '12/10/2024',
    lastCustomerSap: '100002',
    lastCustomerName: 'Aços & Caldeiraria Betim S.A.',
    lastSellerId: 'qas-vendedor_teste',
    lastSellerName: 'Carlos Mendonça',
    historicAvgPriceKg: 5.95,
    historicTurnoverRate: 5.2,
    classification: 'NORMAL',
    allowedSellerIds: [
      'qas-admin_teste',
      'qas-supervisor_teste',
      'qas-vendedor_teste',
      'qas-vendedor2_teste',
      'qas-representante_teste',
    ],
    allowedRegions: ['Grande BH', 'Sul de Minas', 'Triângulo Mineiro', 'Zona da Mata'],
    assignedSellerId: 'qas-vendedor_teste',
    assignedSellerName: 'Carlos Mendonça',
    sapSyncStatus: 'SINCRONIZADO',
    sapLastSync: '19/10/2024 08:30',
    wmsSyncStatus: 'ONLINE',
    tmsComplementAvailable: true,
    tmsRegionDest: 'Região Metropolitana BH / Betim',
    tmsNextLoadingWindow: '20/10/2024 07:00 (Frota Própria CIAFAL)',
    tmsPlannedTripCode: 'TMS-CARGA-9920',
    pcpNextProductionDate: '05/11/2024',
    pcpLine: 'Tesoura Guilhotina Industrial 1',
    pcpConfidenceLevel: 'MEDIO',
    pcpStatus: 'PREVISTO',
  },
  {
    id: 'stk-004',
    materialCode: 'BOB-GLV-AZ150',
    description: 'Bobina de Aço Galvalume AZ150 0.50mm x 1200mm CSN/Arcelor',
    family: 'Aços Revestidos',
    groupCode: 'LAMINADOS_REVESTIDOS',
    line: 'Galvalume / Telhas',
    bitola: '0.50mm x 1200mm',
    quality: 'AZ150 Z-275',
    plantCode: '1000',
    plantName: 'Matriz Contagem - CD Principal',
    storageLocation: 'DEP-04',
    storageLocationName: 'Armazém Fechado de Bobinas',
    batchNumber: 'LOTE-GLV-9931',
    unit: 't',
    physicalTons: 88.0,
    committedTons: 12.0,
    availableTons: 76.0,
    blockedTons: 0.0,
    inspectionTons: 0.0,
    inCheckTons: 0.0,
    projectedPcpTons: 30.0,
    costPricePerTon: 6900,
    estimatedTotalValue: 607200,
    minStockTons: 30.0,
    maxStockTons: 120.0,
    criticalStockTons: 20.0,
    strategicSafetyTons: 25.0,
    entryDate: '15/06/2024',
    ageDays: 126,
    ageBracket: '121-180',
    lastMovementDate: '20/07/2024',
    daysWithoutMovement: 91,
    lastSaleDate: '20/06/2024',
    lastCustomerSap: '100011',
    lastCustomerName: 'Oeste Minas Galpões & Coberturas Ltda',
    lastSellerId: 'qas-vendedor2_teste',
    lastSellerName: 'Mariana Azevedo',
    historicAvgPriceKg: 7.65,
    historicTurnoverRate: 2.1,
    classification: 'BAIXA_MOVIMENTACAO',
    allowedSellerIds: ['qas-admin_teste', 'qas-supervisor_teste', 'qas-vendedor2_teste'],
    allowedRegions: ['Centro-Oeste MG', 'Sul de Minas', 'Grande BH'],
    assignedSellerId: 'qas-vendedor2_teste',
    assignedSellerName: 'Mariana Azevedo',
    sapSyncStatus: 'SINCRONIZADO',
    sapLastSync: '19/10/2024 08:30',
    wmsSyncStatus: 'ONLINE',
    tmsComplementAvailable: true,
    tmsRegionDest: 'Pará de Minas / Itaúna / Divinópolis',
    tmsNextLoadingWindow: '22/10/2024 09:00',
    tmsPlannedTripCode: 'TMS-CARGA-9935',
    pcpNextProductionDate: '12/11/2024',
    pcpLine: 'Slitter 1 Betim',
    pcpConfidenceLevel: 'MEDIO',
    pcpStatus: 'PREVISTO',
  },
  {
    id: 'stk-005',
    materialCode: 'BAR-INOX-304-2POL',
    description: 'Barra Redonda de Aço Inox 304 Trefilada h9 2" (50.8mm) x 6m',
    family: 'Aços Especiais & Inox',
    groupCode: 'INOX_TREFILADOS',
    line: 'Barras Especiais',
    bitola: '2" (50.80mm)',
    quality: 'AISI 304 Polido h9',
    plantCode: '2000',
    plantName: 'Unidade Industrial Betim',
    storageLocation: 'DEP-03',
    storageLocationName: 'Galpão Climatizado Inox & Ligas',
    batchNumber: 'LOTE-INX-3048',
    unit: 't',
    physicalTons: 32.5,
    committedTons: 4.5,
    availableTons: 28.0,
    blockedTons: 0.0,
    inspectionTons: 0.0,
    inCheckTons: 0.0,
    projectedPcpTons: 15.0,
    costPricePerTon: 24500,
    estimatedTotalValue: 796250,
    minStockTons: 10.0,
    maxStockTons: 40.0,
    criticalStockTons: 6.0,
    strategicSafetyTons: 8.0,
    entryDate: '01/03/2024',
    ageDays: 232,
    ageBracket: '>180',
    lastMovementDate: '15/04/2024',
    daysWithoutMovement: 187,
    lastSaleDate: '10/04/2024',
    lastCustomerSap: '100006',
    lastCustomerName: 'Inox Vale do Aço Tubos Especiais Ltda',
    lastSellerId: 'qas-vendedor_teste',
    lastSellerName: 'Carlos Mendonça',
    historicAvgPriceKg: 28.9,
    historicTurnoverRate: 0.9,
    classification: 'PARADO',
    allowedSellerIds: [
      'qas-admin_teste',
      'qas-supervisor_teste',
      'qas-vendedor_teste',
      'qas-representante_teste',
    ],
    allowedRegions: ['Vale do Aço', 'Grande BH', 'Zona da Mata'],
    assignedSellerId: 'qas-vendedor_teste',
    assignedSellerName: 'Carlos Mendonça',
    sapSyncStatus: 'SINCRONIZADO',
    sapLastSync: '19/10/2024 08:30',
    wmsSyncStatus: 'ONLINE',
    tmsComplementAvailable: true,
    tmsRegionDest: 'Ipatinga / Cel. Fabriciano / Timóteo',
    tmsNextLoadingWindow: '23/10/2024 06:00',
    tmsPlannedTripCode: 'TMS-CARGA-9940',
    pcpNextProductionDate: '20/11/2024',
    pcpLine: 'Trefiladeira Pesada 2',
    pcpConfidenceLevel: 'PROJETADO',
    pcpStatus: 'PREVISTO',
  },
  {
    id: 'stk-006',
    materialCode: 'VERG-CA50-10MM',
    description: 'Vergalhão de Aço CA-50 Nervurado 10.0mm (3/8") Gerdau/Arcelor Feixe 2t',
    family: 'Construção Civil / Vergalhões',
    groupCode: 'ACO_LONGO_CONSTRUCAO',
    line: 'Vergalhões Gerdau',
    bitola: '10.0mm (3/8")',
    quality: 'CA-50 NBR 7480',
    plantCode: '1000',
    plantName: 'Matriz Contagem - CD Principal',
    storageLocation: 'DEP-01',
    storageLocationName: 'Pátio Central Construção Civil',
    batchNumber: 'LOTE-CA50-1002',
    unit: 't',
    physicalTons: 380.0,
    committedTons: 110.0,
    availableTons: 270.0,
    blockedTons: 0.0,
    inspectionTons: 0.0,
    inCheckTons: 0.0,
    projectedPcpTons: 150.0,
    costPricePerTon: 4600,
    estimatedTotalValue: 1748000,
    minStockTons: 80.0,
    maxStockTons: 450.0,
    criticalStockTons: 50.0,
    strategicSafetyTons: 60.0,
    entryDate: '20/09/2024',
    ageDays: 29,
    ageBracket: '0-30',
    lastMovementDate: '18/10/2024',
    daysWithoutMovement: 1,
    lastSaleDate: '18/10/2024',
    lastCustomerSap: '100009',
    lastCustomerName: 'Engenharia & Pré-Moldados Juiz de Fora Ltda',
    lastSellerId: 'qas-vendedor2_teste',
    lastSellerName: 'Mariana Azevedo',
    historicAvgPriceKg: 5.15,
    historicTurnoverRate: 6.8,
    classification: 'NORMAL',
    allowedSellerIds: [
      'qas-admin_teste',
      'qas-supervisor_teste',
      'qas-vendedor_teste',
      'qas-vendedor2_teste',
      'qas-representante_teste',
    ],
    allowedRegions: [
      'Grande BH',
      'Zona da Mata',
      'Sul de Minas',
      'Triângulo Mineiro',
      'Alto Paranaíba',
    ],
    assignedSellerId: 'qas-vendedor2_teste',
    assignedSellerName: 'Mariana Azevedo',
    sapSyncStatus: 'SINCRONIZADO',
    sapLastSync: '19/10/2024 08:30',
    wmsSyncStatus: 'ONLINE',
    tmsComplementAvailable: true,
    tmsRegionDest: 'Juiz de Fora / Barbacena / Santos Dumont',
    tmsNextLoadingWindow: '21/10/2024 10:00',
    tmsPlannedTripCode: 'TMS-CARGA-9951',
    pcpNextProductionDate: '30/10/2024',
    pcpLine: 'Laminação Gerdau Ouro Branco',
    pcpConfidenceLevel: 'ALTO',
    pcpStatus: 'EM_PROGRAMACAO',
  },
  {
    id: 'stk-007',
    materialCode: 'PERF-U-DOBR-150X50',
    description: 'Perfil U Dobrado de Chapa 150 x 50 x 3.00mm x 6m Aço SAE 1010',
    family: 'Perfis Estruturais',
    groupCode: 'PERFIS_DOBRADOS',
    line: 'Perfis Conformados',
    bitola: '150x50x3.00mm',
    quality: 'SAE 1008/1010',
    plantCode: '1000',
    plantName: 'Matriz Contagem - CD Principal',
    storageLocation: 'DEP-01',
    storageLocationName: 'Pátio Perfiladeiras & Leves',
    batchNumber: 'LOTE-PUD-3310',
    unit: 't',
    physicalTons: 46.0,
    committedTons: 6.0,
    availableTons: 40.0,
    blockedTons: 0.0,
    inspectionTons: 0.0,
    inCheckTons: 0.0,
    projectedPcpTons: 20.0,
    costPricePerTon: 5200,
    estimatedTotalValue: 239200,
    minStockTons: 15.0,
    maxStockTons: 60.0,
    criticalStockTons: 10.0,
    strategicSafetyTons: 12.0,
    entryDate: '25/05/2024',
    ageDays: 147,
    ageBracket: '121-180',
    lastMovementDate: '12/07/2024',
    daysWithoutMovement: 99,
    lastSaleDate: '12/03/2024',
    lastCustomerSap: '100008',
    lastCustomerName: 'Estruturas Metálicas Sete Lagoas Ltda',
    lastSellerId: 'qas-vendedor_teste',
    lastSellerName: 'Carlos Mendonça',
    historicAvgPriceKg: 5.8,
    historicTurnoverRate: 1.6,
    classification: 'PARADO',
    allowedSellerIds: [
      'qas-admin_teste',
      'qas-supervisor_teste',
      'qas-vendedor_teste',
      'qas-representante_teste',
    ],
    allowedRegions: ['Grande BH', 'Sete Lagoas / Centro', 'Norte de Minas'],
    assignedSellerId: 'qas-vendedor_teste',
    assignedSellerName: 'Carlos Mendonça',
    sapSyncStatus: 'SINCRONIZADO',
    sapLastSync: '19/10/2024 08:30',
    wmsSyncStatus: 'ONLINE',
    tmsComplementAvailable: true,
    tmsRegionDest: 'Sete Lagoas / Curvelo / Montes Claros',
    tmsNextLoadingWindow: '22/10/2024 13:00',
    tmsPlannedTripCode: 'TMS-CARGA-9960',
    pcpNextProductionDate: '15/11/2024',
    pcpLine: 'Perfiladeira U 1 Betim',
    pcpConfidenceLevel: 'MEDIO',
    pcpStatus: 'PREVISTO',
  },
  {
    id: 'stk-008',
    materialCode: 'TUB-MET-50X50-2MM',
    description: 'Tubo Metalon Quadrado 50 x 50 x 2.00mm x 6m Aço Carbono NBR 6591',
    family: 'Tubos Industriais',
    groupCode: 'TUBOS_ESTRUTURAIS',
    line: 'Metalon Serralheria',
    bitola: '50x50x2.00mm',
    quality: 'SAE 1008/1012',
    plantCode: '1000',
    plantName: 'Matriz Contagem - CD Principal',
    storageLocation: 'DEP-01',
    storageLocationName: 'Pátio Serralheria & Perfis',
    batchNumber: 'LOTE-MET-2201',
    unit: 't',
    physicalTons: 72.0,
    committedTons: 8.0,
    availableTons: 64.0,
    blockedTons: 0.0,
    inspectionTons: 0.0,
    inCheckTons: 0.0,
    projectedPcpTons: 35.0,
    costPricePerTon: 5350,
    estimatedTotalValue: 385200,
    minStockTons: 25.0,
    maxStockTons: 90.0,
    criticalStockTons: 15.0,
    strategicSafetyTons: 20.0,
    entryDate: '10/07/2024',
    ageDays: 101,
    ageBracket: '91-120',
    lastMovementDate: '14/09/2024',
    daysWithoutMovement: 35,
    lastSaleDate: '12/04/2024',
    lastCustomerSap: '100017',
    lastCustomerName: 'Serralheria & Coberturas Montes Claros Ltda',
    lastSellerId: 'qas-representante_teste',
    lastSellerName: 'João Pedro Representações',
    historicAvgPriceKg: 6.1,
    historicTurnoverRate: 2.8,
    classification: 'ATENCAO',
    allowedSellerIds: [
      'qas-admin_teste',
      'qas-supervisor_teste',
      'qas-representante_teste',
      'qas-vendedor_teste',
    ],
    allowedRegions: ['Norte de Minas', 'Alto Paranaíba', 'Grande BH'],
    assignedSellerId: 'qas-representante_teste',
    assignedSellerName: 'João Pedro Representações',
    sapSyncStatus: 'SINCRONIZADO',
    sapLastSync: '19/10/2024 08:30',
    wmsSyncStatus: 'ONLINE',
    tmsComplementAvailable: true,
    tmsRegionDest: 'Montes Claros / Bocaiuva / Januária',
    tmsNextLoadingWindow: '24/10/2024 05:00',
    tmsPlannedTripCode: 'TMS-CARGA-9972',
    pcpNextProductionDate: '08/11/2024',
    pcpLine: 'Formadora de Tubos 3 Contagem',
    pcpConfidenceLevel: 'ALTO',
    pcpStatus: 'EM_PROGRAMACAO',
  },
]

// Seed Inicial de Solicitações de Checagem Física
export const INITIAL_STOCK_CHECKS: StockCheckRequest[] = [
  {
    id: 'chk-1001',
    protocol: 'CHK-2024-00891',
    materialCode: 'TUB-SCH40-4POL',
    materialDescription: 'Tubo de Aço Carbono Sem Costura Schedule 40 4" NBR 5590',
    plantCode: '2000',
    plantName: 'Unidade Industrial Betim',
    storageLocation: 'DEP-03',
    batchNumber: 'LOTE-SCH-4091',
    systemicBalanceTons: 8.5,
    requestedTons: 6.0,
    confirmedPhysicalTons: 6.0,
    divergenceTons: 0.0,
    divergenceFound: false,
    status: 'CONFIRMADA',
    priority: 'ALTA',
    quotationId: 'cot-001',
    quotationCode: 'COT-SAP-98104',
    customerId: 'cli-100002',
    customerName: 'Aços & Caldeiraria Betim S.A.',
    requesterId: 'qas-vendedor_teste',
    requesterName: 'Carlos Mendonça',
    requesterRole: 'vendedor',
    requesterNotes:
      'Cliente necessita faturamento imediato para obra de tanques. Saldo sistêmico < 10 t.',
    wmsRequestId: 'WMS-REQ-4819',
    wmsIntegrationStatus: 'CONFERENCIA_CONCLUIDA',
    inspectorName: 'Marcelo Ribeiro (Supervisor de Pátio WMS)',
    inspectedDatetime: '18/10/2024 16:45',
    inspectorNotes:
      'Lote fisicamente conferido na rua B-04. Barras íntegras com certificado de usina anexado.',
    slaDeadline: '19/10/2024 12:00',
    closedAt: '18/10/2024 16:50',
    historyLog: [
      {
        datetime: '18/10/2024 14:10',
        actor: 'Carlos Mendonça (Vendedor)',
        action: 'SOLICITADA',
        comment: 'Solicitação gerada a partir da Cotação COT-SAP-98104',
      },
      {
        datetime: '18/10/2024 14:15',
        actor: 'Sistema WMS CIAFAL',
        action: 'RECEBIDA',
        comment: 'Protocolo WMS-REQ-4819 despachado para coletor de dados',
      },
      {
        datetime: '18/10/2024 16:45',
        actor: 'Marcelo Ribeiro (Inspetor WMS)',
        action: 'CONFIRMADA',
        comment: '6.0 t conferidas fisicamente sem divergência',
      },
    ],
    createdAt: '18/10/2024 14:10',
    updatedAt: '18/10/2024 16:50',
  },
  {
    id: 'chk-1002',
    protocol: 'CHK-2024-00892',
    materialCode: 'PERF-W-200X26',
    materialDescription: 'Perfil W 200 x 26.6 kg/m Aço ASTM A572 Gr50 - Barra 12m',
    plantCode: '1000',
    plantName: 'Matriz Contagem - CD Principal',
    storageLocation: 'DEP-01',
    batchNumber: 'LOTE-A572-8891',
    systemicBalanceTons: 98.5,
    requestedTons: 25.0,
    confirmedPhysicalTons: 22.0,
    divergenceTons: 3.0,
    divergenceFound: true,
    divergenceReason:
      '3 barras (3.0 t) com avaria mecânica de empilhadeira no topo, segregadas para refugo.',
    occurrenceNumber: 'OC-WMS-2024-0412',
    status: 'DIVERGENCIA_ENCONTRADA',
    priority: 'URGENTE',
    quotationId: 'cot-002',
    quotationCode: 'COT-SAP-98105',
    customerId: 'cli-100001',
    customerName: 'Metalúrgica Santa Rita Ltda',
    requesterId: 'qas-vendedor_teste',
    requesterName: 'Carlos Mendonça',
    requesterRole: 'vendedor',
    requesterNotes:
      'Pedido grande de 25 t para galpão. Validar se lote envelhecido está sem oxidação superficial.',
    wmsRequestId: 'WMS-REQ-4822',
    wmsIntegrationStatus: 'CONFERENCIA_CONCLUIDA',
    inspectorName: 'Renato Silveira (Encarregado CD Contagem)',
    inspectedDatetime: '19/10/2024 09:15',
    inspectorNotes:
      'Disponíveis 22.0 t sadias. 3.0 t avariadas transferidas para depósito de avaria (DEP-99).',
    slaDeadline: '19/10/2024 18:00',
    historyLog: [
      {
        datetime: '19/10/2024 08:00',
        actor: 'Carlos Mendonça (Vendedor)',
        action: 'SOLICITADA',
        comment: 'Solicitação urgente para liberação de lote parado há 190 dias',
      },
      {
        datetime: '19/10/2024 09:15',
        actor: 'Renato Silveira (Inspetor WMS)',
        action: 'DIVERGENCIA_ENCONTRADA',
        comment:
          'Divergência de 3.0 t por avaria de movimentação. Ocorrência OC-WMS-2024-0412 aberta.',
      },
    ],
    createdAt: '19/10/2024 08:00',
    updatedAt: '19/10/2024 09:20',
  },
  {
    id: 'chk-1003',
    protocol: 'CHK-2024-00893',
    materialCode: 'BAR-INOX-304-2POL',
    materialDescription: 'Barra Redonda de Aço Inox 304 Trefilada h9 2" (50.8mm) x 6m',
    plantCode: '2000',
    plantName: 'Unidade Industrial Betim',
    storageLocation: 'DEP-03',
    batchNumber: 'LOTE-INX-3048',
    systemicBalanceTons: 28.0,
    requestedTons: 8.0,
    status: 'EM_VERIFICACAO',
    priority: 'NORMAL',
    customerId: 'cli-100006',
    customerName: 'Inox Vale do Aço Tubos Especiais Ltda',
    requesterId: 'qas-vendedor_teste',
    requesterName: 'Carlos Mendonça',
    requesterRole: 'vendedor',
    requesterNotes:
      'Checar acabamento superficial h9 e certificado de usina para aplicação sanitária.',
    wmsRequestId: 'WMS-REQ-4830',
    wmsIntegrationStatus: 'PROCESSADO',
    inspectorName: 'Equipe de Inspeção Betim',
    slaDeadline: '21/10/2024 16:00',
    historyLog: [
      {
        datetime: '19/10/2024 10:30',
        actor: 'Carlos Mendonça (Vendedor)',
        action: 'SOLICITADA',
        comment: 'Checagem preventiva para oportunidade comercial IA',
      },
      {
        datetime: '19/10/2024 10:45',
        actor: 'WMS Integrator',
        action: 'EM_VERIFICACAO',
        comment: 'Ordem de contagem alocada ao inspetor de turno',
      },
    ],
    createdAt: '19/10/2024 10:30',
    updatedAt: '19/10/2024 10:45',
  },
]

// Parâmetros Padrão de Governança
export const DEFAULT_GOVERNANCE_PARAMS: StockGovernanceParam[] = [
  {
    id: 'prm-01',
    paramKey: 'AGING_BRACKETS_DAYS',
    paramLabel: 'Faixas de Idade do Estoque (Aging)',
    category: 'AGING',
    paramValue: [
      { label: '0-30 dias', min: 0, max: 30, color: 'emerald' },
      { label: '31-60 dias', min: 31, max: 60, color: 'teal' },
      { label: '61-90 dias', min: 61, max: 90, color: 'blue' },
      { label: '91-120 dias', min: 91, max: 120, color: 'amber' },
      { label: '121-180 dias', min: 121, max: 180, color: 'orange' },
      { label: '>180 dias', min: 181, max: 9999, color: 'rose' },
    ],
    description: 'Definição das 6 faixas cronológicas de envelhecimento de materiais.',
    lastModifiedBy: 'Administrador Master',
    updatedAt: '18/10/2024 10:00',
  },
  {
    id: 'prm-02',
    paramKey: 'STAGNANT_CLASSIFICATION_RULES',
    paramLabel: 'Regras de Classificação de Parados',
    category: 'PARADOS',
    paramValue: {
      normalDays: 30,
      attentionDays: 60,
      lowMovementDays: 90,
      stagnantDays: 120,
      criticalDays: 180,
    },
    description:
      'Critério em dias sem movimentação para classificar produtos em Atenção, Baixa Movimentação, Parado ou Crítico.',
    lastModifiedBy: 'Administrador Master',
    updatedAt: '18/10/2024 10:00',
  },
  {
    id: 'prm-03',
    paramKey: 'CHECK_SLA_HOURS',
    paramLabel: 'SLA de Resposta de Checagem WMS (horas)',
    category: 'CHECAGEM_WMS',
    paramValue: {
      urgente: 4,
      alta: 12,
      normal: 24,
    },
    description: 'Tempo máximo para conferência física no WMS após solicitação do vendedor.',
    lastModifiedBy: 'Administrador Master',
    updatedAt: '18/10/2024 10:00',
  },
]

export class StockService {
  // ==========================================
  // 1. CARREGAMENTO E ARMAZENAMENTO
  // ==========================================

  getStoredStockItems(): StockItem[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_STOCK_ITEMS)
      if (stored) return JSON.parse(stored)
    } catch {
      /* ignore */
    }
    localStorage.setItem(STORAGE_KEY_STOCK_ITEMS, JSON.stringify(INITIAL_STOCK_ITEMS))
    return INITIAL_STOCK_ITEMS
  }

  saveStoredStockItems(items: StockItem[]) {
    localStorage.setItem(STORAGE_KEY_STOCK_ITEMS, JSON.stringify(items))
  }

  getStoredStockChecks(): StockCheckRequest[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_STOCK_CHECKS)
      if (stored) return JSON.parse(stored)
    } catch {
      /* ignore */
    }
    localStorage.setItem(STORAGE_KEY_STOCK_CHECKS, JSON.stringify(INITIAL_STOCK_CHECKS))
    return INITIAL_STOCK_CHECKS
  }

  saveStoredStockChecks(checks: StockCheckRequest[]) {
    localStorage.setItem(STORAGE_KEY_STOCK_CHECKS, JSON.stringify(checks))
  }

  getStoredAuditLogs(): StockAuditLog[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_STOCK_AUDIT)
      if (stored) return JSON.parse(stored)
    } catch {
      /* ignore */
    }
    return []
  }

  saveStoredAuditLogs(logs: StockAuditLog[]) {
    localStorage.setItem(STORAGE_KEY_STOCK_AUDIT, JSON.stringify(logs))
  }

  getStoredGovernanceParams(): StockGovernanceParam[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_STOCK_PARAMS)
      if (stored) return JSON.parse(stored)
    } catch {
      /* ignore */
    }
    localStorage.setItem(STORAGE_KEY_STOCK_PARAMS, JSON.stringify(DEFAULT_GOVERNANCE_PARAMS))
    return DEFAULT_GOVERNANCE_PARAMS
  }

  saveStoredGovernanceParams(params: StockGovernanceParam[]) {
    localStorage.setItem(STORAGE_KEY_STOCK_PARAMS, JSON.stringify(params))
  }

  // ==========================================
  // 2. AUDITORIA E LOGS (Regra 25)
  // ==========================================

  async registerAuditLog(entry: Omit<StockAuditLog, 'id' | 'createdAt'>): Promise<StockAuditLog> {
    const logs = this.getStoredAuditLogs()
    const now = new Date()
    const nowStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    const newLog: StockAuditLog = {
      ...entry,
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: nowStr,
    }

    logs.unshift(newLog)
    if (logs.length > 500) logs.pop() // Mantém os últimos 500 logs
    this.saveStoredAuditLogs(logs)
    return newLog
  }

  // ==========================================
  // 3. MOTOR DE REGRAS DE ACESSO RBAC (Regras 10, 11, 12, 13, 14)
  // ==========================================

  filterStockByAccess(
    items: StockItem[],
    currentUser: { id?: string; role?: string; email?: string } | null,
  ): StockItem[] {
    if (!currentUser) return []

    const role = (currentUser.role || '').toLowerCase()

    // 1. Admin Master & Direção Geral: enxergam TODOS os centros, estoques e margens
    if (role === 'administrador' || role === 'admin' || role === 'diretor_comercial') {
      return items
    }

    // 2. Gerente / Supervisor Comercial: enxerga toda a sua equipe / regional
    if (role === 'supervisor' || role === 'gerente_comercial') {
      return items // No mock gerencial supervisiona os centros MG/SP
    }

    // 3. Vendedor / Representante Externo (Isolamento Estrito no BACKEND/API — Regra 14)
    // Vendedor vê APENAS: estoque autorizado p/ venda dos produtos que comercializa e centros permitidos
    const userId = currentUser.id || ''
    return items.filter((item) => {
      const isExplicitlyAllowed = item.allowedSellerIds?.includes(userId)
      const isAssigned = item.assignedSellerId === userId
      // Também permite visualizar se o item for de venda livre multi-vendedor
      const isMultiSeller =
        item.allowedSellerIds?.includes('all') || item.allowedSellerIds?.length > 1
      return isExplicitlyAllowed || isAssigned || isMultiSeller
    })
  }

  // ==========================================
  // 4. CONSULTAS E KPIS EXECUTIVOS (Regra 3)
  // ==========================================

  getOverviewKpis(items: StockItem[]): StockOverviewKpis {
    let totalPhysicalTons = 0
    let totalAvailableTons = 0
    let totalCommittedTons = 0
    let totalBlockedTons = 0
    let totalInspectionTons = 0
    let totalInCheckTons = 0
    let totalProjectedPcpTons = 0
    let totalEstimatedValueBrl = 0
    let availableForSaleValueBrl = 0
    let belowMinStockCount = 0
    let aboveMaxStockCount = 0
    let noMovementCount = 0
    let lowMovementCount = 0
    let criticalProductsCount = 0
    let agingStockTons = 0
    let imobilizedCapitalInStagnantBrl = 0

    items.forEach((item) => {
      totalPhysicalTons += item.physicalTons || 0
      totalAvailableTons += item.availableTons || 0
      totalCommittedTons += item.committedTons || 0
      totalBlockedTons += item.blockedTons || 0
      totalInspectionTons += item.inspectionTons || 0
      totalInCheckTons += item.inCheckTons || 0
      totalProjectedPcpTons += item.projectedPcpTons || 0

      const itemVal = item.estimatedTotalValue || item.physicalTons * item.costPricePerTon || 0
      totalEstimatedValueBrl += itemVal

      const availVal = item.availableTons * item.costPricePerTon || 0
      availableForSaleValueBrl += availVal

      if (item.availableTons < item.minStockTons) {
        belowMinStockCount++
      }
      if (item.availableTons > item.maxStockTons) {
        aboveMaxStockCount++
      }
      if (item.daysWithoutMovement >= 90) {
        noMovementCount++
        imobilizedCapitalInStagnantBrl += itemVal
      } else if (item.daysWithoutMovement >= 45) {
        lowMovementCount++
      }

      if (item.classification === 'CRITICO' || item.classification === 'PARADO') {
        criticalProductsCount++
      }

      if (item.ageDays > 90) {
        agingStockTons += item.physicalTons
      }
    })

    const availableSkusCount = items.length
    const avgStockTons = availableSkusCount > 0 ? totalPhysicalTons / availableSkusCount : 0
    const avgTurnoverRate =
      items.reduce((acc, it) => acc + (it.historicTurnoverRate || 0), 0) / (availableSkusCount || 1)

    // Cobertura estimada em dias (média de saída diária ~ 25 t/dia)
    const dailyPaceTons = 22.5
    const estimatedCoverageDays =
      dailyPaceTons > 0 ? Math.round(totalAvailableTons / dailyPaceTons) : 0
    const agingStockPercent = totalPhysicalTons > 0 ? (agingStockTons / totalPhysicalTons) * 100 : 0

    return {
      totalPhysicalTons,
      totalAvailableTons,
      totalCommittedTons,
      totalBlockedTons,
      totalInspectionTons,
      totalInCheckTons,
      totalProjectedPcpTons,
      totalEstimatedValueBrl,
      availableForSaleValueBrl,
      belowMinStockCount,
      aboveMaxStockCount,
      noMovementCount,
      lowMovementCount,
      availableSkusCount,
      criticalProductsCount,
      avgStockTons,
      avgTurnoverRate,
      estimatedCoverageDays,
      agingStockPercent,
      imobilizedCapitalInStagnantBrl,
    }
  }

  // ==========================================
  // 5. OPORTUNIDADES COMERCIAIS VIA CRUZAMENTO IA (Regra 6)
  // ==========================================

  generateCommercialOpportunities(
    stockItems: StockItem[],
    clientes: any[],
    currentUser: { id?: string; role?: string } | null,
  ): CommercialOpportunity[] {
    const authorizedItems = this.filterStockByAccess(stockItems, currentUser)
    const stagnantOrAging = authorizedItems.filter(
      (item) =>
        item.classification === 'PARADO' ||
        item.classification === 'BAIXA_MOVIMENTACAO' ||
        item.classification === 'ATENCAO' ||
        item.ageDays >= 60,
    )

    const opps: CommercialOpportunity[] = []

    stagnantOrAging.forEach((item) => {
      // Cruzamento inteligente com histórico de consumo dos clientes da carteira
      clientes.forEach((cli) => {
        // Regra de Isolamento: Vendedor só vê oportunidades da sua própria carteira (salvo gestores)
        const isManager =
          currentUser?.role === 'administrador' ||
          currentUser?.role === 'admin' ||
          currentUser?.role === 'supervisor' ||
          currentUser?.role === 'gerente_comercial'

        if (!isManager && cli.vendedorId !== currentUser?.id) {
          return
        }

        let fit: OpportunityFitScore = 'BAIXA'
        let potentialTons = 0
        let rationale = ''
        let suggestedAction = ''

        // Regra 1: Cliente já comprou material idêntico ou da mesma família nos últimos 12 meses
        const isSameFamily =
          (item.family.toLowerCase().includes('perfil') && cli.segmento === 'Construção Civil') ||
          (item.family.toLowerCase().includes('tubo') &&
            (cli.segmento === 'Indústria' || cli.subsegmento?.includes('Caldeiraria'))) ||
          (item.family.toLowerCase().includes('chapa') &&
            cli.subsegmento?.includes('Caldeiraria')) ||
          (item.family.toLowerCase().includes('inox') && cli.subsegmento?.includes('Inox')) ||
          (item.family.toLowerCase().includes('bobina') && cli.subsegmento?.includes('Coberturas'))

        if (cli.sapCode === item.lastCustomerSap) {
          fit = 'MUITO_ALTA'
          potentialTons = Math.min(item.availableTons, 15.0)
          rationale = `Cliente é o último comprador histórico deste lote com pontualidade de pagamento e limite de crédito regular de R$ ${cli.creditoDisponivel.toLocaleString('pt-BR')}.`
          suggestedAction = `Contatar ${cli.nomeFantasia} ofertando lote imediato com frete consolidado TMS.`
        } else if (isSameFamily && cli.statusCredito === 'Regular') {
          fit = 'ALTA'
          potentialTons = Math.min(item.availableTons * 0.4, 10.0)
          rationale = `Perfil de consumo altamente aderente ao segmento ${cli.subsegmento || cli.segmento}. Volume médio de ${cli.mediaMensalTons || 8} t/mês.`
          suggestedAction = `Apresentar cotação especial para o lote ${item.batchNumber || item.materialCode} aproveitando janela logística.`
        } else if (isSameFamily) {
          fit = 'MEDIA'
          potentialTons = Math.min(item.availableTons * 0.2, 5.0)
          rationale = `Consumidor potencial de materiais similares, porém com histórico de compras esporádico.`
          suggestedAction = `Sondar necessidade de reposição no próximo ciclo bimestral.`
        }

        if (fit === 'MUITO_ALTA' || fit === 'ALTA' || (fit === 'MEDIA' && opps.length < 12)) {
          opps.push({
            id: `opp-${item.id}-${cli.id}`,
            stockItemId: item.id,
            materialCode: item.materialCode,
            materialDescription: item.description,
            plantName: item.plantName,
            availableTons: item.availableTons,
            ageDays: item.ageDays,
            classification: item.classification,
            estimatedValue: item.costPricePerTon * item.availableTons,
            customerId: cli.id,
            customerSap: cli.sapCode,
            customerName: cli.nomeFantasia || cli.razaoSocial,
            customerCity: cli.cidade,
            customerUf: cli.uf,
            customerSegment: cli.segmento,
            assignedSellerId: cli.vendedorId,
            assignedSellerName: cli.vendedor,
            creditLimit: cli.limiteCredito,
            availableCredit: cli.creditoDisponivel,
            creditStatus: cli.statusCredito,
            consumptionHistoryTons12m: cli.toneladas12m || 0,
            lastPurchaseDate: cli.ultimaCompraData || 'Não informado',
            lastPurchasePriceKg: item.historicAvgPriceKg,
            daysSinceLastPurchase: cli.diasSemContato || 10,
            ordersInPipeline: cli.pipelineTons || 0,
            purchaseFrequency: cli.recorrencia || 'Mensal',
            fitScore: fit,
            aiRationale: rationale,
            aiSuggestedApproach: `Ofertar via WhatsApp ou ligação direta destacando pronta-entrega física e qualidade certificada ${item.quality}.`,
            recommendedAction: suggestedAction,
            potentialTons: Number(potentialTons.toFixed(1)),
            estimatedMarginScore: 'Excelente (≥ 14.5%)',
          })
        }
      })
    })

    // Ordena por Fit Score (Muito Alta -> Alta -> Média)
    const scoreWeight: Record<OpportunityFitScore, number> = {
      MUITO_ALTA: 4,
      ALTA: 3,
      MEDIA: 2,
      BAIXA: 1,
    }
    return opps.sort((a, b) => scoreWeight[b.fitScore] - scoreWeight[a.fitScore])
  }

  // ==========================================
  // 6. SOLICITAR CHECAGEM FÍSICA / WMS (Regras 7, 8, 9)
  // ==========================================

  async requestStockCheck(params: {
    materialCode: string
    materialDescription: string
    plantCode: string
    plantName: string
    storageLocation: string
    batchNumber?: string
    systemicBalanceTons: number
    requestedTons: number
    priority: CheckPriority
    quotationId?: string
    quotationCode?: string
    customerId?: string
    customerName?: string
    requesterId: string
    requesterName: string
    requesterRole: string
    requesterNotes?: string
  }): Promise<StockCheckRequest> {
    const list = this.getStoredStockChecks()
    const now = new Date()
    const nowStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    const slaHours = params.priority === 'URGENTE' ? 4 : params.priority === 'ALTA' ? 12 : 24
    const slaDate = new Date(now.getTime() + slaHours * 60 * 60 * 1000)
    const slaStr = `${slaDate.getFullYear()}-${String(slaDate.getMonth() + 1).padStart(2, '0')}-${String(slaDate.getDate()).padStart(2, '0')} ${String(slaDate.getHours()).padStart(2, '0')}:${String(slaDate.getMinutes()).padStart(2, '0')}`

    const protocolNum = `CHK-${now.getFullYear()}-${String(Math.floor(10000 + Math.random() * 90000))}`

    const newCheck: StockCheckRequest = {
      id: `chk-${Date.now()}`,
      protocol: protocolNum,
      materialCode: params.materialCode,
      materialDescription: params.materialDescription,
      plantCode: params.plantCode,
      plantName: params.plantName,
      storageLocation: params.storageLocation,
      batchNumber: params.batchNumber,
      systemicBalanceTons: params.systemicBalanceTons,
      requestedTons: params.requestedTons,
      status: 'SOLICITADA',
      priority: params.priority,
      quotationId: params.quotationId,
      quotationCode: params.quotationCode,
      customerId: params.customerId,
      customerName: params.customerName,
      requesterId: params.requesterId,
      requesterName: params.requesterName,
      requesterRole: params.requesterRole,
      requesterNotes: params.requesterNotes,
      wmsRequestId: `WMS-AUTO-${Date.now().toString().slice(-4)}`,
      wmsIntegrationStatus: 'ENVIADO',
      slaDeadline: slaStr,
      historyLog: [
        {
          datetime: nowStr,
          actor: `${params.requesterName} (${params.requesterRole})`,
          action: 'SOLICITADA',
          comment: params.requesterNotes || 'Solicitação criada no CRM 360º',
        },
      ],
      createdAt: nowStr,
      updatedAt: nowStr,
    }

    list.unshift(newCheck)
    this.saveStoredStockChecks(list)

    // Atualiza saldo em checagem no item de estoque
    const stockItems = this.getStoredStockItems()
    const targetItem = stockItems.find(
      (it) => it.materialCode === params.materialCode && it.plantCode === params.plantCode,
    )
    if (targetItem) {
      targetItem.inCheckTons = (targetItem.inCheckTons || 0) + params.requestedTons
      this.saveStoredStockItems(stockItems)
    }

    // Registra Trilha de Auditoria
    await this.registerAuditLog({
      userId: params.requesterId,
      userName: params.requesterName,
      userRole: params.requesterRole,
      actionType: 'SOLICITACAO_CHECAGEM',
      targetObject: 'stock_check_requests',
      targetId: newCheck.id,
      details: `Solicitação ${protocolNum} de checagem física de ${params.requestedTons} t para o material ${params.materialCode} (${params.priority}).`,
    })

    return newCheck
  }

  async respondStockCheck(params: {
    checkId: string
    confirmedPhysicalTons: number
    divergenceReason?: string
    inspectorNotes?: string
    inspectorName: string
    responderUser: { id: string; name: string; role: string }
  }): Promise<StockCheckRequest> {
    const list = this.getStoredStockChecks()
    const idx = list.findIndex((c) => c.id === params.checkId)
    if (idx < 0) throw new Error('Solicitação de checagem não encontrada')

    const check = list[idx]
    const now = new Date()
    const nowStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    const diff = Number((params.confirmedPhysicalTons - check.requestedTons).toFixed(2))
    const divergenceFound = Math.abs(diff) > 0.05

    let newStatus: import('@/types/stock').CheckStatus = 'CONFIRMADA'
    if (divergenceFound) {
      newStatus = params.confirmedPhysicalTons === 0 ? 'INDISPONIVEL' : 'DIVERGENCIA_ENCONTRADA'
    } else if (params.confirmedPhysicalTons < check.requestedTons) {
      newStatus = 'CONFIRMADA_PARCIALMENTE'
    }

    check.confirmedPhysicalTons = params.confirmedPhysicalTons
    check.divergenceTons = diff
    check.divergenceFound = divergenceFound
    check.divergenceReason = params.divergenceReason
    check.inspectorName = params.inspectorName
    check.inspectedDatetime = nowStr
    check.inspectorNotes = params.inspectorNotes
    check.status = newStatus
    check.wmsIntegrationStatus = 'CONFERENCIA_CONCLUIDA'
    check.updatedAt = nowStr
    if (divergenceFound) {
      check.occurrenceNumber = `OC-WMS-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
    }

    check.historyLog.push({
      datetime: nowStr,
      actor: `${params.inspectorName} (${params.responderUser.role})`,
      action: newStatus,
      comment: params.inspectorNotes || params.divergenceReason || 'Conferência física finalizada.',
    })

    list[idx] = check
    this.saveStoredStockChecks(list)

    // Libera saldo em checagem
    const stockItems = this.getStoredStockItems()
    const targetItem = stockItems.find(
      (it) => it.materialCode === check.materialCode && it.plantCode === check.plantCode,
    )
    if (targetItem) {
      targetItem.inCheckTons = Math.max(0, (targetItem.inCheckTons || 0) - check.requestedTons)
      this.saveStoredStockItems(stockItems)
    }

    // Auditoria
    await this.registerAuditLog({
      userId: params.responderUser.id,
      userName: params.responderUser.name,
      userRole: params.responderUser.role,
      actionType: 'RESPOSTA_CHECAGEM',
      targetObject: 'stock_check_requests',
      targetId: check.id,
      details: `Retorno de checagem ${check.protocol}: Status ${newStatus}, Confirmado ${params.confirmedPhysicalTons} t (Divergência: ${diff} t).`,
    })

    return check
  }

  // ==========================================
  // 7. SINCRONIZAÇÃO E STAGING SAP ECC (Regras 18, 26)
  // ==========================================

  async triggerSapSync(currentUser: { id?: string; name?: string; role?: string } | null): Promise<{
    status: 'SUCCESS' | 'ERROR'
    timestamp: string
    updatedRecords: number
    message: string
  }> {
    const now = new Date()
    const nowStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    const items = this.getStoredStockItems()
    items.forEach((it) => {
      it.sapLastSync = nowStr
      it.sapSyncStatus = 'SINCRONIZADO'
    })
    this.saveStoredStockItems(items)

    await this.registerAuditLog({
      userId: currentUser?.id || 'system',
      userName: currentUser?.name || 'Sistema SAP Job',
      userRole: currentUser?.role || 'RFC/BAPI',
      actionType: 'INTEGRACAO_SAP',
      targetObject: 'inventory_staging',
      details: `Carga incremental SAP ECC (RFC/BAPI Staging) executada com sucesso. ${items.length} SKUs sincronizados sem impacto na performance transacional.`,
    })

    return {
      status: 'SUCCESS',
      timestamp: nowStr,
      updatedRecords: items.length,
      message: `Staging de estoque atualizado com sucesso via RFC/BAPI SAP ECC em ${nowStr}.`,
    }
  }

  // ==========================================
  // 8. SALVAR E RESTAURAR VISÕES DE FILTROS (Regra 19)
  // ==========================================

  getSavedViews(): { id: string; name: string; filters: StockFilterState }[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SAVED_VIEWS)
      if (stored) return JSON.parse(stored)
    } catch {
      /* ignore */
    }
    return [
      {
        id: 'view-default-all',
        name: 'Visão Padrão (Todos os Centros)',
        filters: {
          period: 'mes_atual',
          plantCode: 'todos',
          storageLocation: 'todos',
          materialCode: '',
          family: 'todos',
          line: 'todos',
          bitola: 'todos',
          quality: 'todos',
          sellerId: 'todos',
          team: 'todos',
          region: 'todos',
          customerId: 'todos',
          segment: 'todos',
          ageBracket: 'todos',
          classification: 'todos',
          status: 'todos',
          searchTerm: '',
        },
      },
      {
        id: 'view-parados-criticos',
        name: 'Foco: Parados & Críticos (> 90 dias)',
        filters: {
          period: 'mes_atual',
          plantCode: 'todos',
          storageLocation: 'todos',
          materialCode: '',
          family: 'todos',
          line: 'todos',
          bitola: 'todos',
          quality: 'todos',
          sellerId: 'todos',
          team: 'todos',
          region: 'todos',
          customerId: 'todos',
          segment: 'todos',
          ageBracket: '>180',
          classification: 'PARADO',
          status: 'todos',
          searchTerm: '',
        },
      },
    ]
  }

  saveView(name: string, filters: StockFilterState) {
    const list = this.getSavedViews()
    const newView = {
      id: `view-${Date.now()}`,
      name,
      filters,
    }
    list.push(newView)
    localStorage.setItem(STORAGE_KEY_SAVED_VIEWS, JSON.stringify(list))
    return newView
  }
}

export const stockService = new StockService()
