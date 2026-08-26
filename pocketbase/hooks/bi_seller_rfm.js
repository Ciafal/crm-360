routerAdd('GET', '/bi/sellers/{id}/rfm', (e) => {
  const sellerId = e.request.pathValue('id') || 'current'
  const now = new Date()
  const syncedAt = now.toISOString()
  const sourceUpdatedAt = new Date(now.getTime() - 20 * 60 * 1000).toISOString()

  const segments = [
    { segment: 'Campeões', count: 12, revenue: 1450000, tons: 180 },
    { segment: 'Leais', count: 18, revenue: 980000, tons: 125 },
    { segment: 'Potenciais fiéis', count: 9, revenue: 420000, tons: 55 },
    { segment: 'Em risco', count: 14, revenue: 1120000, tons: 140 },
    { segment: 'Precisam de atenção', count: 8, revenue: 380000, tons: 48 },
    { segment: 'Prestes a hibernar', count: 6, revenue: 290000, tons: 35 },
    { segment: 'Hibernando', count: 11, revenue: 510000, tons: 68 },
  ]

  return e.json(200, {
    seller_id: sellerId,
    total_customers: 78,
    segments: segments,
    is_demo_data: true,
    data_source: 'Qlik Cloud (Mock)',
    source_updated_at: sourceUpdatedAt,
    synced_at: syncedAt,
  })
})
