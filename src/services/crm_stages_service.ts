import pb from '@/lib/pocketbase/client'

export interface CrmStage {
  id: string
  account_id?: string
  key: string
  label: string
  color: string
  position: number
  created?: string
  updated?: string
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
    account_id: accountId || 'acc_ciafal_default',
    ...s,
    position: idx,
  }))
}

export const createCrmStage = async (
  stage: Omit<CrmStage, 'id' | 'created' | 'updated'>,
): Promise<CrmStage> => {
  try {
    return await pb.collection('crm_stages').create<CrmStage>(stage)
  } catch {
    return {
      id: `stage_${Date.now()}`,
      ...stage,
    }
  }
}

export const updateCrmStage = async (
  id: string,
  stage: Partial<Omit<CrmStage, 'id' | 'created' | 'updated'>>,
): Promise<CrmStage> => {
  try {
    return await pb.collection('crm_stages').update<CrmStage>(id, stage)
  } catch {
    return {
      id,
      key: stage.key || 'custom',
      label: stage.label || 'Estágio',
      color: stage.color || 'blue',
      position: stage.position || 0,
      ...stage,
    } as CrmStage
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

export const seedDefaultStages = async (accountId: string): Promise<void> => {
  try {
    const existing = await pb.collection('crm_stages').getFullList({
      filter: `account_id = "${accountId}"`,
    })
    if (existing.length === 0) {
      for (const s of DEFAULT_STAGES) {
        await pb.collection('crm_stages').create({
          account_id: accountId,
          ...s,
        })
      }
    }
  } catch {
    // fallback
  }
}
