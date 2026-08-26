routerAdd('GET', '/bi/customers/{id}/product-history', (e) => {
  const customerId = e.request.pathValue('id') || ''
  const now = new Date()
  const syncedAt = now.toISOString()
  const sourceUpdatedAt = new Date(now.getTime() - 12 * 60 * 1000).toISOString()

  const products = [
    {
      code: 'TB-304-SCH10',
      description: 'Tubo Inox AISI 304 Redondo SCH 10 2"',
      family: 'Tubos Inox',
      last_purchase_date: '2024-08-14',
      historical_tons: 28.4,
      historical_revenue: 220000,
      stopped: true,
      stock_available: true,
      stock_coverage_days: 120,
      price_kg: 34.5,
    },
    {
      code: 'CH-304-3MM',
      description: 'Chapa Inox AISI 304 3.00mm Escovada',
      family: 'Chapas Inox',
      last_purchase_date: '2024-07-02',
      historical_tons: 34.1,
      historical_revenue: 265000,
      stopped: true,
      stock_available: true,
      stock_coverage_days: 95,
      price_kg: 32.8,
    },
  ]

  return e.json(200, {
    customer_id: customerId,
    total_products: products.length,
    items: products,
    is_demo_data: true,
    data_source: 'SAP & Qlik Cloud (Mock)',
    source_updated_at: sourceUpdatedAt,
    synced_at: syncedAt,
  })
})
