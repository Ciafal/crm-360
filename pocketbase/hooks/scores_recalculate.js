routerAdd('POST', '/scores/recalculate', (e) => {
  let body = {}
  try {
    body = e.requestInfo().body || {}
  } catch (_) {
    body = {}
  }

  const sellerId = body.seller_id || ''
  const now = new Date()
  const nowIso = now.toISOString()
  const modelVersion = '2.1.0'

  let calculatedCount = 0

  // Clientes industriais de demonstração
  const customers = [
    {
      id: 'CLI-8041',
      name: 'Metalúrgica Santa Rita Ltda',
      rVal: 74,
      rScore: 2,
      fVal: 8,
      fScore: 4,
      mVal: 485000,
      mScore: 5,
      rfmSeg: 'Em risco',
      pAlive: 0.82,
      expFreq: 0.65,
      expVal: 54000,
      reactScore: 94,
    },
    {
      id: 'CLI-7910',
      name: 'Caldeiraria & Tanques Industrial Paulista',
      rVal: 102,
      rScore: 2,
      fVal: 10,
      fScore: 5,
      mVal: 890000,
      mScore: 5,
      rfmSeg: 'Campeões',
      pAlive: 0.78,
      expFreq: 0.85,
      expVal: 98000,
      reactScore: 91,
    },
    {
      id: 'CLI-6523',
      name: 'Indústria Mecânica Alvorada S/A',
      rVal: 61,
      rScore: 3,
      fVal: 9,
      fScore: 4,
      mVal: 340000,
      mScore: 4,
      rfmSeg: 'Leais',
      pAlive: 0.85,
      expFreq: 0.72,
      expVal: 42000,
      reactScore: 89,
    },
    {
      id: 'CLI-5120',
      name: 'Protemax Tubulações & Conexões Eireli',
      rVal: 135,
      rScore: 1,
      fVal: 6,
      fScore: 3,
      mVal: 620000,
      mScore: 4,
      rfmSeg: 'Precisam de atenção',
      pAlive: 0.65,
      expFreq: 0.45,
      expVal: 68000,
      reactScore: 84,
    },
    {
      id: 'CLI-4309',
      name: 'Cozinhas Industriais Aço Forte Ind. e Com.',
      rVal: 93,
      rScore: 2,
      fVal: 5,
      fScore: 3,
      mVal: 275000,
      mScore: 3,
      rfmSeg: 'Em risco',
      pAlive: 0.72,
      expFreq: 0.52,
      expVal: 31000,
      reactScore: 82,
    },
  ]

  try {
    const scoresCol = $app.findCollectionByNameOrId('customer_scores')
    const rfmCol = $app.findCollectionByNameOrId('rfm_scores')
    const predCol = $app.findCollectionByNameOrId('customer_predictions')

    for (let i = 0; i < customers.length; i++) {
      const c = customers[i]

      // Salva / atualiza customer_scores
      let scoreRec
      try {
        const found = $app.findRecordsByFilter(
          'customer_scores',
          "customer_id = '" + c.id + "'",
          '-created',
          1,
          0,
        )
        if (found && found.length > 0) {
          scoreRec = found[0]
        } else {
          scoreRec = new Record(scoresCol)
        }
      } catch (_) {
        scoreRec = new Record(scoresCol)
      }

      scoreRec.set('customer_id', c.id)
      if (sellerId) scoreRec.set('seller_id', sellerId)
      scoreRec.set('rfm_recency_score', c.rScore)
      scoreRec.set('rfm_frequency_score', c.fScore)
      scoreRec.set('rfm_monetary_score', c.mScore)
      scoreRec.set('rfm_segment', c.rfmSeg)
      scoreRec.set('bg_nbd_p_alive', c.pAlive)
      scoreRec.set('bg_nbd_expected_frequency', c.expFreq)
      scoreRec.set('gamma_gamma_expected_value', c.expVal)
      scoreRec.set('reactivation_score', c.reactScore)
      scoreRec.set('model_version', modelVersion)
      scoreRec.set('calculated_at', nowIso)
      scoreRec.set('source', 'bg_nbd_gamma_gamma_v2')
      $app.save(scoreRec)

      // Salva / atualiza rfm_scores
      let rfmRec
      try {
        const foundRfm = $app.findRecordsByFilter(
          'rfm_scores',
          "customer_id = '" + c.id + "'",
          '-created',
          1,
          0,
        )
        if (foundRfm && foundRfm.length > 0) {
          rfmRec = foundRfm[0]
        } else {
          rfmRec = new Record(rfmCol)
        }
      } catch (_) {
        rfmRec = new Record(rfmCol)
      }

      rfmRec.set('customer_id', c.id)
      rfmRec.set('recency_value', c.rVal)
      rfmRec.set('recency_score', c.rScore)
      rfmRec.set('frequency_value', c.fVal)
      rfmRec.set('frequency_score', c.fScore)
      rfmRec.set('monetary_value', c.mVal)
      rfmRec.set('monetary_score', c.mScore)
      rfmRec.set('rfm_segment', c.rfmSeg)
      rfmRec.set('calculated_at', nowIso)
      $app.save(rfmRec)

      // Salva customer_predictions
      let predRec
      try {
        const foundPred = $app.findRecordsByFilter(
          'customer_predictions',
          "customer_id = '" + c.id + "'",
          '-created',
          1,
          0,
        )
        if (foundPred && foundPred.length > 0) {
          predRec = foundPred[0]
        } else {
          predRec = new Record(predCol)
        }
      } catch (_) {
        predRec = new Record(predCol)
      }

      predRec.set('customer_id', c.id)
      predRec.set('model_type', 'hybrid')
      predRec.set('p_alive', c.pAlive)
      predRec.set('expected_frequency', c.expFreq)
      predRec.set('expected_value', c.expVal)
      predRec.set('model_version', modelVersion)
      predRec.set('calculated_at', nowIso)
      $app.save(predRec)

      calculatedCount++
    }
  } catch (err) {
    console.log('Error calculating scores: ' + err)
    return e.json(500, { error: 'Failed to calculate scores', details: '' + err })
  }

  return e.json(200, {
    success: true,
    calculated_customers_count: calculatedCount,
    model_version: modelVersion,
    calculated_at: nowIso,
  })
})
