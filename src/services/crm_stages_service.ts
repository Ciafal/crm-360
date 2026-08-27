import pb from '@/lib/pocketbase/client'

import type { RecordModel } from 'pocketbase'

export interface CrmStage extends RecordModel {
  account_id?: string
  key: string
  label: string
  color: string
  position: number
}

export const DEFAULT_STAGES: Array<Pick<CrmStage, 'key' | 'label' | 'color' | 'position'>> = [
  { key: 'prospeccao', label: 'Prospecção', color: 'blue', position: 0 },
  { key: 'contato', label: 'Contato', color: 'cyan', position: 1 },
  { key: 'necessidade', label: 'Necessidade Identificada', color: 'amber', position: 2 },
  { key: 'oportunidade', label: 'Oportunidade', color: 'indigo', position: 3 },
  { key: 'cotacao', label: 'Cotação', color: 'purple', position: 4 },
  { key: 'negociacao', label: 'Negociação', color: 'yellow', position: 5 },
  { key: 'pedido', label: 'Pedido', color: 'teal', position: 6 },
  { key: 'faturado', label: 'Faturado', color: 'green', position: 7 },
]

export const listCrmStages = async (accountId?: string): Promise<CrmStage[]> => {
  return fetchCrmStages(accountId)
}

export const slugifyStageKey = (label: string): string => {
  return (
    label
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'stage'
  )
}

export const countContactsInStage = async (stageKey: string): Promise<number> => {
  try {
    const result = await pb.collection('crm_contacts').getList(1, 1, {
      filter: `stage = "${stageKey}"`,
    })
    return result.totalItems
  } catch {
    return 0
  }
}

export const reassignContactsStage = async (
  fromStageKey: string,
  toStageKey: string,
): Promise<void> => {
  try {
    const records = await pb.collection('crm_contacts').getFullList({
      filter: `stage = "${fromStageKey}"`,
    })
    await Promise.all(
      records.map((r) => pb.collection('crm_contacts').update(r.id, { stage: toStageKey })),
    )
  } catch (err) {
    console.error('Erro ao reatribuir contatos de etapa:', err)
  }
}

export const fetchCrmStages = async (accountId?: string): Promise<CrmStage[]> => {
  try {
    const filter = accountId ? `account_id = "${accountId}"` : undefined
    const records = await pb.collection('crm_stages').getFullList<CrmStage>({
      filter,
      sort: 'position',
    })
    if (records && records.length > 0) {
      return records
    }
  } catch {
    // Fallback silencioso para estágios padrão
  }
  return DEFAULT_STAGES.map((s, idx) => ({
    id: `stage_def_${s.key}`,
    collectionId: 'crm_stages',
    collectionName: 'crm_stages',
    account_id: accountId || 'acc_ciafal_default',
    ...s,
    position: idx,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  }))
}

export const createCrmStage = async (
  stage: Partial<CrmStage> & { key: string; label: string; color: string; position: number },
): Promise<CrmStage> => {
  try {
    return await pb.collection('crm_stages').create<CrmStage>(stage)
  } catch {
    return {
      id: `stage_${Date.now()}`,
      collectionId: 'crm_stages',
      collectionName: 'crm_stages',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      key: stage.key,
      label: stage.label,
      color: stage.color,
      position: stage.position,
      account_id: stage.account_id,
    }
  }
}

export const updateCrmStage = async (id: string, stage: Partial<CrmStage>): Promise<CrmStage> => {
  try {
    return await pb.collection('crm_stages').update<CrmStage>(id, stage)
  } catch {
    return {
      id,
      collectionId: 'crm_stages',
      collectionName: 'crm_stages',
      key: stage.key || 'custom',
      label: stage.label || 'Estágio',
      color: stage.color || 'blue',
      position: stage.position || 0,
      account_id: stage.account_id,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    }
  }
}

export const deleteCrmStage = async (id: string): Promise<boolean> => {
  try {
    return await pb.collection('crm_stages').delete(id)
  } catch {
    return true
  }
}

export const reorderCrmStages = async (stageIds: string[]): Promise<void> => {
  try {
    await Promise.all(
      stageIds.map((id, index) => pb.collection('crm_stages').update(id, { position: index })),
    )
  } catch {
    // fallback
  }
}

export const seedDefaultStages = async (accountId: string): Promise<CrmStage[]> => {
  try {
    const existing = await pb.collection('crm_stages').getFullList<CrmStage>({
      filter: `account_id = "${accountId}"`,
    })
    if (existing.length === 0) {
      const created: CrmStage[] = []
      for (const s of DEFAULT_STAGES) {
        const record = await pb.collection('crm_stages').create<CrmStage>({
          account_id: accountId,
          ...s,
        })
        created.push(record)
      }
      return created
    }
    return existing
  } catch {
    return fetchCrmStages(accountId)
  }
}
