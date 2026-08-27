routerAdd('GET', '/bi/customers/{id}/purchase-history', (e) => {
  const customerId = e.request.pathValue('id') || ''
  const now = new Date()
  const syncedAt = now.toISOString()
  const sourceUpdatedAt = new Date(now.getTime() - 10 * 60 * 1000).toISOString()

  const purchases = [
    {
      invoice_number: 'NF-90821',
      date: '2024-08-14',
      value: 48500,
      tons: 6.2,
      product_family: 'Tubos Inox',
      status: 'faturado',
    },
    {
      invoice_number: 'NF-88410',
      date: '2024-07-02',
      value: 52000,
      tons: 7.1,
      product_family: 'Chapas Inox',
      status: 'faturado',
    },
    {
      invoice_number: 'NF-85210',
      date: '2024-05-18',
      value: 41000,
      tons: 5.5,
      product_family: 'Tubos Inox',
      status: 'faturado',
    },
  ]

  return e.json(200, {
    customer_id: customerId,
    total_invoices: purchases.length,
    items: purchases,
    is_demo_data: true,
    data_source: 'SAP ECC & Qlik Cloud (Mock)',
    source_updated_at: sourceUpdatedAt,
    synced_at: syncedAt,
  })
})
