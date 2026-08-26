routerAdd('GET', '/bi/sellers/{id}/reactivation-priority', (e) => {
  const sellerId = e.request.pathValue('id') || 'current'
  const now = new Date()
  const syncedAt = now.toISOString()
  const sourceUpdatedAt = new Date(now.getTime() - 15 * 60 * 1000).toISOString()

  const list = [
    {
      customerId: 'CLI-8041',
      customerName: 'Metalúrgica Santa Rita Ltda',
      cnpj: '45.182.903/0001-44',
      reactivationScore: 94,
      pAlive: 0.82,
      expectedValue: 54000,
      daysSinceLastPurchase: 74,
      recommendedAction: 'Ofertar Tubos Inox 304 com pronta-entrega (preço FOB especial)',
      sellerId: sellerId,
    },
    {
      customerId: 'CLI-7910',
      customerName: 'Caldeiraria & Tanques Industrial Paulista',
      cnpj: '12.894.210/0001-92',
      reactivationScore: 91,
      pAlive: 0.78,
      expectedValue: 98000,
      daysSinceLastPurchase: 102,
      recommendedAction: 'Ligar para Diretor de Suprimentos: pacote Chapas Inox 316L para safra',
      sellerId: sellerId,
    },
    {
      customerId: 'CLI-6523',
      customerName: 'Indústria Mecânica Alvorada S/A',
      cnpj: '03.771.820/0002-18',
      reactivationScore: 89,
      pAlive: 0.85,
      expectedValue: 42000,
      daysSinceLastPurchase: 61,
      recommendedAction: 'Apresentar condições de Barras Laminadas 1045 e Inox 410',
      sellerId: sellerId,
    },
  ]

  return e.json(200, {
    seller_id: sellerId,
    items: list,
    is_demo_data: true,
    data_source: 'Qlik Cloud (Mock)',
    source_updated_at: sourceUpdatedAt,
    synced_at: syncedAt,
  })
})
