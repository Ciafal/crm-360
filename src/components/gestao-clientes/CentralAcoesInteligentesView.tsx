// src/components/gestao-clientes/CentralAcoesInteligentesView.tsx
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Flame,
  AlertTriangle,
  FileText,
  DollarSign,
  Clock,
  Package,
  BarChart3,
  Sparkles,
  ArrowRight,
  PhoneCall,
  FileSpreadsheet,
  ChevronRight,
  MessageSquare,
} from 'lucide-react'
import type { CrmPartyMaster } from '@/types/crm_party'
import { toast } from 'sonner'

interface CentralAcoesInteligentesViewProps {
  parties: CrmPartyMaster[]
  onOpenParty: (partyId: string) => void
  onOpenNovaCotacao: (party: CrmPartyMaster) => void
  onOpenQualificarModal: (party: CrmPartyMaster) => void
}

type AcaoCategory =
  | 'TODAS'
  | 'LEAD_QUENTE'
  | 'LEAD_SEM_CONTATO'
  | 'CADASTRO_PENDENTE'
  | 'CREDITO_PENDENTE'
  | 'SLA_EXCEDIDO'
  | 'CLIENTE_SEM_COMPRA'
  | 'COTACAO_SEM_PEDIDO'
  | 'OPORTUNIDADE_IA'

export function CentralAcoesInteligentesView({
  parties,
  onOpenParty,
  onOpenNovaCotacao,
  onOpenQualificarModal,
}: CentralAcoesInteligentesViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<AcaoCategory>('TODAS')

  // Geração de Recomendações Comerciais Automáticas (Regra 26)
  const actionItems = parties.flatMap((p) => {
    const list: Array<{
      id: string
      party: CrmPartyMaster
      category: AcaoCategory
      categoryLabel: string
      badgeColor: string
      icon: any
      titulo: string
      motivo: string
      impactoComercial: string
      acaoSugerida: string
      acaoTipo: 'COTAR' | 'CONTATAR' | 'QUALIFICAR' | 'VER_CRM'
    }> = []

    // 1. 🔥 Lead Quente com Score Alto
    if (p.commercial_stage === 'LEAD' && p.lead_score >= 75) {
      list.push({
        id: `act-hot-${p.crm_party_id}`,
        party: p,
        category: 'LEAD_QUENTE',
        categoryLabel: '🔥 Lead Quente',
        badgeColor: 'bg-rose-950 text-rose-300 border-rose-800',
        icon: Flame,
        titulo: `${p.razao_social} - Alto Potencial (${p.potencial_mensal_tons} t/mês)`,
        motivo: `Score IA ${p.lead_score}/100 gerado pela demanda de ${p.produto_interesse}. Contato pronto para qualificação.`,
        impactoComercial: `R$ ${(p.potencial_mensal_valor || 120000).toLocaleString('pt-BR')}/mês`,
        acaoSugerida: 'Qualificar e Iniciar Cadastro',
        acaoTipo: 'QUALIFICAR',
      })
    }

    // 2. ⚠️ Lead Sem Contato Recente
    if (p.commercial_stage === 'LEAD' && p.dias_sem_contato > 2) {
      list.push({
        id: `act-nocontact-${p.crm_party_id}`,
        party: p,
        category: 'LEAD_SEM_CONTATO',
        categoryLabel: '⚠️ Lead sem Contato',
        badgeColor: 'bg-amber-950 text-amber-300 border-amber-800',
        icon: AlertTriangle,
        titulo: `${p.razao_social} sem interação há ${p.dias_sem_contato} dias`,
        motivo:
          'Captação recente necessita de primeiro alinhamento técnico antes do esfriamento do interesse.',
        impactoComercial: 'Risco de perda para concorrência',
        acaoSugerida: 'Ligar / WhatsApp',
        acaoTipo: 'CONTATAR',
      })
    }

    // 3. 📄 Cadastro Pendente / Ficha Enviada
    if (
      p.registration_status === 'FICHA_ENVIADA' ||
      p.registration_status === 'DOCUMENTACAO_PENDENTE'
    ) {
      list.push({
        id: `act-onb-${p.crm_party_id}`,
        party: p,
        category: 'CADASTRO_PENDENTE',
        categoryLabel: '📄 Cadastro Pendente',
        badgeColor: 'bg-sky-950 text-sky-300 border-sky-800',
        icon: FileText,
        titulo: `Ficha cadastral pendente: ${p.razao_social}`,
        motivo: 'Ficha enviada via portal aguarda complemento de documentação societária.',
        impactoComercial: 'Desbloqueio de criação de código SAP ECC',
        acaoSugerida: 'Cobrar Documentos',
        acaoTipo: 'VER_CRM',
      })
    }

    // 4. 📦 Cliente Novo sem Primeira Compra (Regra 26)
    if (
      (p.commercial_stage === 'CLIENTE_SAP' || p.sap_customer_id) &&
      !p.data_primeiro_faturamento
    ) {
      list.push({
        id: `act-nocompra-${p.crm_party_id}`,
        party: p,
        category: 'CLIENTE_SEM_COMPRA',
        categoryLabel: '📦 Novo Cliente sem Compra',
        badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800',
        icon: Package,
        titulo: `${p.razao_social} ativo no SAP sem primeira cotação/pedido`,
        motivo: `Cliente cadastrado com código SAP ${p.sap_customer_id}. Oportunidade imediata de cotação de ${p.produto_interesse}.`,
        impactoComercial: `Meta de 1º faturamento: ${p.potencial_mensal_tons} t`,
        acaoSugerida: 'Criar 1ª Cotação',
        acaoTipo: 'COTAR',
      })
    }

    // 5. ✨ Oportunidade IA Cross-Sell
    if (p.commercial_stage === 'CLIENTE_ATIVO') {
      list.push({
        id: `act-ai-${p.crm_party_id}`,
        party: p,
        category: 'OPORTUNIDADE_IA',
        categoryLabel: '✨ Oportunidade IA',
        badgeColor: 'bg-purple-950 text-purple-300 border-purple-800',
        icon: Sparkles,
        titulo: `Recomendação Cross-Sell para ${p.razao_social}`,
        motivo:
          'IA identificou histórico de compra de vigas compatível com tubos estruturais com estoque excedente.',
        impactoComercial: 'Aumento de 18% no share da conta',
        acaoSugerida: 'Gerar Proposta Combinada',
        acaoTipo: 'COTAR',
      })
    }

    return list
  })

  const filteredItems = actionItems.filter((item) => {
    if (selectedCategory === 'TODAS') return true
    return item.category === selectedCategory
  })

  const handleActionClick = (item: (typeof actionItems)[0]) => {
    if (item.acaoTipo === 'COTAR') {
      onOpenNovaCotacao(item.party)
    } else if (item.acaoTipo === 'QUALIFICAR') {
      onOpenQualificarModal(item.party)
    } else if (item.acaoTipo === 'CONTATAR') {
      toast.info(
        `Iniciando contato via WhatsApp com ${item.party.whatsapp || item.party.telefone}...`,
      )
    } else {
      onOpenParty(item.party.crm_party_id)
    }
  }

  return (
    <div className="space-y-4">
      {/* CABEÇALHO DA CENTRAL DE AÇÕES INTELIGENTES (Regra 26) */}
      <div className="p-4 bg-slate-900/90 rounded-3xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Central de Ações Comerciais & Próxima Melhor Ação (IA)
            </h2>
            <p className="text-xs text-slate-400">
              Cruzamento de estágio, contatos, potencial, crédito e comportamento de compra
              ordenados por impacto.
            </p>
          </div>
        </div>

        <Badge className="bg-sky-950 text-sky-300 border-sky-800 font-mono text-xs">
          {actionItems.length} ações recomendadas
        </Badge>
      </div>

      {/* CATEGORIAS FILTRÁVEIS (Regra 26) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'TODAS' as const, label: 'Todas as Ações', count: actionItems.length },
          {
            id: 'LEAD_QUENTE' as const,
            label: '🔥 Lead Quente',
            count: actionItems.filter((a) => a.category === 'LEAD_QUENTE').length,
          },
          {
            id: 'LEAD_SEM_CONTATO' as const,
            label: '⚠️ Sem Contato',
            count: actionItems.filter((a) => a.category === 'LEAD_SEM_CONTATO').length,
          },
          {
            id: 'CADASTRO_PENDENTE' as const,
            label: '📄 Cadastro Pendente',
            count: actionItems.filter((a) => a.category === 'CADASTRO_PENDENTE').length,
          },
          {
            id: 'CLIENTE_SEM_COMPRA' as const,
            label: '📦 Sem 1ª Compra',
            count: actionItems.filter((a) => a.category === 'CLIENTE_SEM_COMPRA').length,
          },
          {
            id: 'OPORTUNIDADE_IA' as const,
            label: '✨ Oportunidade IA',
            count: actionItems.filter((a) => a.category === 'OPORTUNIDADE_IA').length,
          },
        ].map((cat) => {
          const isSelected = selectedCategory === cat.id
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>{cat.label}</span>
              <Badge
                className={`text-[10px] px-1.5 py-0 rounded-md font-mono ${
                  isSelected ? 'bg-sky-800 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {cat.count}
              </Badge>
            </button>
          )
        })}
      </div>

      {/* CARDS DE AÇÕES INTELIGENTES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredItems.map((item) => {
          const Icon = item.icon
          return (
            <div
              key={item.id}
              className="p-4 bg-slate-900/90 rounded-3xl border border-slate-800/90 hover:border-slate-700 transition-all flex flex-col justify-between gap-3 text-xs"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge className={`text-[10px] ${item.badgeColor}`}>{item.categoryLabel}</Badge>
                  <span className="font-mono text-[11px] text-slate-500 font-bold">
                    {item.party.friendly_code}
                  </span>
                </div>

                <strong className="text-sm font-bold text-white block">{item.titulo}</strong>

                <p className="text-xs text-slate-300 leading-relaxed">{item.motivo}</p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">
                    Impacto Estimado
                  </span>
                  <span className="text-xs font-bold text-emerald-400">
                    {item.impactoComercial}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onOpenParty(item.party.crm_party_id)}
                    className="h-8 text-xs text-slate-400 hover:text-white rounded-xl"
                  >
                    Ver CRM
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleActionClick(item)}
                    className="h-8 text-xs bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl gap-1.5 shadow-sm"
                  >
                    <span>{item.acaoSugerida}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          )
        })}

        {filteredItems.length === 0 && (
          <div className="col-span-2 p-8 text-center bg-slate-900/60 rounded-3xl border border-slate-800 text-slate-500 text-xs">
            Nenhuma ação pendente na categoria selecionada.
          </div>
        )}
      </div>
    </div>
  )
}
