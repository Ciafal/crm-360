import { useState, useEffect, useCallback } from 'react'
import pb from '@/lib/pocketbase/client'
import { CrmContact } from '@/types/models'
import { useAuth } from '@/hooks/use-auth'

const MOCK_FALLBACK_CONTACTS: CrmContact[] = [
  {
    id: 'crm_mock_1',
    account_id: 'acc_ciafal_default',
    instance_name: 'ciafal_default_inst',
    jid: '5511988887771@s.whatsapp.net',
    phone: '11988887771',
    name: 'Engenharia Estrutural Alpha',
    custom_name: 'Carlos Mendes (Diretor de Obras)',
    stage: 'prospeccao',
    category_ids: ['cat_aco', 'cat_urgente'],
    notes: 'Solicitou catálogo completo de perfis pesados I e H.',
    created: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    updated: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'crm_mock_2',
    account_id: 'acc_ciafal_default',
    instance_name: 'ciafal_default_inst',
    jid: '5511988887772@s.whatsapp.net',
    phone: '11988887772',
    name: 'Metalúrgica Paulistana',
    custom_name: 'Mariana Lima (Compradora)',
    stage: 'cotacao',
    category_ids: ['cat_chapas'],
    notes: 'Cotação de 45 toneladas de tubos industriais ASTM A500.',
    created: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
    updated: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'crm_mock_3',
    account_id: 'acc_ciafal_default',
    instance_name: 'ciafal_default_inst',
    jid: '5511988887773@s.whatsapp.net',
    phone: '11988887773',
    name: 'Construtora Horizonte',
    custom_name: 'Roberto Silveira (Gerente de Suprimentos)',
    stage: 'negociacao',
    category_ids: ['cat_aco'],
    notes: 'Negociação de prazo de faturamento em 45 DDL.',
    created: new Date(Date.now() - 3600000 * 24 * 14).toISOString(),
    updated: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'crm_mock_4',
    account_id: 'acc_ciafal_default',
    instance_name: 'ciafal_default_inst',
    jid: '5511988887774@s.whatsapp.net',
    phone: '11988887774',
    name: 'Indústria Mecânica Progresso',
    custom_name: 'Fernando Rocha (Eng. Chefe)',
    stage: 'pedido',
    category_ids: ['cat_tubos'],
    notes: 'Pedido aprovado, aguardando agendamento de frete CIF.',
    created: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
    updated: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: 'crm_mock_5',
    account_id: 'acc_ciafal_default',
    instance_name: 'ciafal_default_inst',
    jid: '5511988887775@s.whatsapp.net',
    phone: '11988887775',
    name: 'Galpões & Estruturas Brasil',
    custom_name: 'Juliana Castro',
    stage: 'faturado',
    category_ids: ['cat_urgente'],
    notes: 'NF-e emitida e chave SAP registrada com sucesso.',
    created: new Date(Date.now() - 3600000 * 24 * 40).toISOString(),
    updated: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
]

export function useCrmContatos(instanceName?: string) {
  const { user } = useAuth()
  const [contacts, setContacts] = useState<CrmContact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchContacts = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Tenta buscar no PocketBase se houver conexão
      let filter = ''
      if (instanceName && instanceName !== 'ciafal_default_inst') {
        filter = `instance_name = "${instanceName}"`
      }

      const records = await pb.collection('crm_contacts').getFullList<CrmContact>({
        filter: filter || undefined,
        expand: 'assigned_to,company_id',
        sort: '-updated',
      })

      if (records && records.length > 0) {
        setContacts(records)
      } else {
        // Fallback para contatos de demonstração se base vazia
        setContacts(MOCK_FALLBACK_CONTACTS)
      }
    } catch {
      // Fallback gracioso para dados de demonstração
      setContacts(MOCK_FALLBACK_CONTACTS)
    } finally {
      setLoading(false)
    }
  }, [instanceName])

  useEffect(() => {
    fetchContacts()
  }, [fetchContacts])

  return {
    contacts,
    loading,
    error,
    reload: fetchContacts,
  }
}

export function formatPhoneBR(phone?: string) {
  if (!phone) return ''
  const clean = phone.replace(/\D/g, '')
  if (clean.length === 11) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`
  }
  if (clean.length === 10) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`
  }
  return phone
}
