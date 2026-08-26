routerAdd('GET', '/bi/sellers/{id}/daily-summary', (e) => {
  const sellerId = e.request.pathValue('id') || 'current'
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const syncedAt = now.toISOString()
  const sourceUpdatedAt = new Date(now.getTime() - 15 * 60 * 1000).toISOString()

  // Retorna resumo comercial diário para o vendedor
  const summary = {
    seller_id: sellerId,
    date: today,
    active_clients: 42,
    inactive_clients: 18,
    recoverable_potential: 4670000,
    eligible_for_contact: 14,
    reactivated_this_month: 5,
    revenue_recovered: 312500,
    tons_recovered: 41.8,
    reactivation_rate: 27.7,
    pending_actions: 8,
    completed_actions: 12,
    is_demo_data: true,
    data_source: 'Qlik Cloud (Mock)',
    source_updated_at: sourceUpdatedAt,
    synced_at: syncedAt,
  }

  return e.json(200, summary)
})
