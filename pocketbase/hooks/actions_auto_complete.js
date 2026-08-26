routerAdd('POST', '/actions/auto-complete', (e) => {
  let body = {}
  try {
    body = e.requestInfo().body || {}
  } catch (_) {
    body = {}
  }

  const sellerId = body.seller_id || ''
  const customerId = body.customer_id || ''
  const channel = body.channel || 'whatsapp'
  const externalId = body.external_id || ''
  const occurredAt = body.occurred_at || new Date().toISOString()
  const metadata = body.metadata || {}

  let updatedCount = 0
  const completedActionIds = []

  // 1. Localiza ações pendentes/em andamento para esse seller e cliente
  try {
    let filter = "(status = 'pendente' || status = 'em_andamento')"
    if (customerId) {
      filter += " && customer_id = '" + customerId.replace(/'/g, "''") + "'"
    }
    if (sellerId) {
      filter += " && seller_id = '" + sellerId.replace(/'/g, "''") + "'"
    }

    const actions = $app.findRecordsByFilter('daily_commercial_actions', filter, '-created', 10, 0)

    for (let i = 0; i < actions.length; i++) {
      const act = actions[i]
      act.set('status', 'concluida')
      act.set('completed_at', occurredAt)
      act.set('completion_channel', channel)
      act.set('result', 'Concluída automaticamente via interação registrada (' + channel + ')')
      $app.save(act)

      updatedCount++
      completedActionIds.push(act.id)

      // Registra evento de execução
      try {
        const eventsCol = $app.findCollectionByNameOrId('action_execution_events')
        const eventRec = new Record(eventsCol)
        eventRec.set('daily_action_id', act.id)
        let eventType = 'whatsapp_sent'
        if (channel === 'phone' || channel === 'call') eventType = 'call_made'
        else if (channel === 'sap_quote') eventType = 'quote_created'
        else if (channel === 'sap_order') eventType = 'order_created'
        else if (channel === 'manual') eventType = 'manual_completion'

        eventRec.set('event_type', eventType)
        eventRec.set('external_id', externalId)
        eventRec.set('occurred_at', occurredAt)
        eventRec.set('source_system', channel)
        eventRec.set('metadata_json', metadata)
        if (act.getString('account_id')) {
          eventRec.set('account_id', act.getString('account_id'))
        }
        $app.save(eventRec)
      } catch (evtErr) {
        console.log('Error creating action execution event: ' + evtErr)
      }
    }
  } catch (err) {
    console.log('Error in auto-complete query: ' + err)
  }

  // 2. Registra a interação na tabela interactions
  try {
    const interactionsCol = $app.findCollectionByNameOrId('interactions')
    const interaction = new Record(interactionsCol)
    interaction.set('customer_id', customerId || 'UNKNOWN')
    if (sellerId) interaction.set('seller_id', sellerId)
    interaction.set('channel', channel === 'call' ? 'phone' : channel)
    interaction.set('direction', body.direction || 'outbound')
    interaction.set('occurred_at', occurredAt)
    interaction.set('source', body.source || 'crm_auto')
    interaction.set('external_id', externalId)
    interaction.set('summary', body.summary || 'Interação registrada no canal ' + channel)
    interaction.set('created_by_system', true)
    if (body.account_id) interaction.set('account_id', body.account_id)
    $app.save(interaction)
  } catch (intErr) {
    console.log('Error creating interaction record: ' + intErr)
  }

  return e.json(200, {
    success: true,
    completed_actions_count: updatedCount,
    action_ids: completedActionIds,
    customer_id: customerId,
    channel: channel,
  })
})
