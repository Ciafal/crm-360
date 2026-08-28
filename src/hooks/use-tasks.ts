import { useState, useEffect, useCallback } from 'react'
import { Task } from '@/types/models'
import { getTasks } from '@/services/tasks'
import { useAuth } from './use-auth'
import pb from '@/lib/pocketbase/client'

const FALLBACK_TASKS: Task[] = [
  {
    id: 'mock-quote-task-01',
    title: 'Follow-up de Cotação COT-98104 (6.0t Tubos Inox)',
    description:
      'Cotação enviada via WhatsApp para Roberto Antunes (Metalúrgica Santa Rita). Aguarda PO formal para integração SAP.',
    status: 'pendente',
    priority: 'alta',
    source_type: 'COTACAO',
    customer_id: 'CLI-8041',
    customer_name: 'Metalúrgica Santa Rita Ltda',
    impact_meta_tons: 6.0,
    due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    created: '2024-10-24T17:15:00Z',
    updated: '2024-10-24T17:15:00Z',
  },
  {
    id: 'mock-quote-task-02',
    title: 'Aprovação Comercial Gerencial COT-98105 (Desvio -10.06%)',
    description:
      'Proposta para Caldeiraria & Tanques Paulista excede limite de vendedor. Requer liberação gerencial de preço.',
    status: 'em_andamento',
    priority: 'urgente',
    source_type: 'QUOTE',
    customer_id: 'CLI-7910',
    customer_name: 'Caldeiraria & Tanques Industrial Paulista',
    impact_meta_tons: 4.5,
    due_date: new Date().toISOString(),
    created: '2024-10-24T17:20:00Z',
    updated: '2024-10-24T17:20:00Z',
  },
  {
    id: 'mock-quote-task-03',
    title: 'Confirmação de Saldo Físico WMS/Pátio (CH-304-3MM)',
    description:
      'Saldo sistêmico abaixo de 5t (3.2t disponível). PCP e Pátio Contagem devem confirmar disponibilidade física de 4.5t.',
    status: 'pendente',
    priority: 'urgente',
    source_type: 'WMS',
    customer_id: 'CLI-7910',
    customer_name: 'Caldeiraria & Tanques Industrial Paulista',
    impact_meta_tons: 4.5,
    due_date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    created: '2024-10-24T17:25:00Z',
    updated: '2024-10-24T17:25:00Z',
  },
]

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const loadTasks = useCallback(async () => {
    try {
      const data = await getTasks()
      if (data && data.length > 0) {
        setTasks(data)
      } else {
        setTasks(FALLBACK_TASKS)
      }
    } catch (err) {
      console.error('Failed to fetch tasks', err)
      setTasks(FALLBACK_TASKS)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  useRealtime<Task>('tasks', (e) => {
    if (e.action === 'create') {
      setTasks((prev) => [e.record, ...prev])
    } else if (e.action === 'update') {
      setTasks((prev) => prev.map((t) => (t.id === e.record.id ? e.record : t)))
    } else if (e.action === 'delete') {
      setTasks((prev) => prev.filter((t) => t.id !== e.record.id))
    }
  })

  return { tasks, loading, loadTasks }
}
