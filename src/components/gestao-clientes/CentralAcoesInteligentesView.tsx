// src/components/gestao-clientes/CentralAcoesInteligentesView.tsx
import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sparkles, Flame, AlertTriangle, FileText, Package, ArrowRight } from 'lucide-react'
import type { CrmPartyRecord } from '@/types/crm_party'
import { toast } from 'sonner'
import { StatusBadge, SemanticVariant } from './shared/GestaoClientesUiKit'

interface CentralAcoesInteligentesViewProps {
  parties: CrmPartyRecord[]
  onOpenParty: (partyId: string) => void
  onOpenNovaCotacao: (party: CrmPartyRecord) => void
  onOpenQualificarModal: (party: CrmPartyRecord) => void
}

type ActionCategory =
  | 'TODAS'
  | 'LEAD_QUENTE'
  | 'LEAD_SEM_CONTATO'
  | 'CADASTRO_PENDENTE'
  | 'CLIENTE_SEM_COMPRA'
  | 'OPORTUNIDADE_IA'

export function CentralAcoesInteligentesView({
  parties,
  onOpenParty,
  onOpenNovaCotacao,
  onOpenQualificarModal,
}: CentralAcoesInteligentesViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<ActionCategory>('TODAS')

  // GERAÇÃO DE PRÓXIMAS MELHORES AÇÕES (Regra 26 de negócio intocada)
  const actionItems = parties.flatMap((p) => {
    const list: Array<{
      id: string
      party: CrmPartyRecord
      category: ActionCategory
      categoryLabel: string
      variant: SemanticVariant
      icon: React.ComponentType<{ className?: string }>
      titulo: string
      motivo: string
      impactoComercial: string
      acaoSugerida: string
      acaoTipo: 'COTAR' | 'QUALIFICAR' | 'CONTATAR' | 'VER_CRM'
    }> = []

    // 1. 🔥 Lead Quente com Alta Pontuação
    if (p.commercial_stage === 'LEAD' && p.ia_qualification_score >= 80) {
      list.push({
        id: `act-hot-${p.crm_party_id}`,
        party: p,
        category: 'LEAD_QUENTE',
        categoryLabel: 'Lead Quente',
        variant: 'positive',
        icon: Flame,
        titulo: `${p.razao_social} pronto para qualificação formal`,
        motivo: `IA calculou score ${p.ia_qualification_score} baseado em demanda prevista de ${p.potencial_mensal_tons} t/mês de ${p.produto_interesse}.`,
        impactoComercial: `Potencial de ~R$ ${(p.potencial_mensal_tons * 7500).toLocaleString('pt-BR')}/mês`,
        acaoSugerida: 'Qualificar Lead',
        acaoTipo: 'QUALIFICAR',
      })
    }

    // 2. ⚠️ Lead Sem Contato Recente
    if (p.commercial_stage === 'LEAD' && p.dias_sem_contato > 2) {
      list.push({
        id: `act-nocontact-${p.crm_party_id}`,
        party: p,
        category: 'LEAD_SEM_CONTATO',
        categoryLabel: 'Lead sem Contato',
        variant: 'warning',
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
        categoryLabel: 'Cadastro Pendente',
        variant: 'default',
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
        categoryLabel: 'Novo Cliente sem Compra',
        variant: 'default',
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
        categoryLabel: 'Oportunidade IA',
        variant: 'default',
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

  const categoryCounts: Record<ActionCategory, number> = {
    TODAS: actionItems.length,
    LEAD_QUENTE: actionItems.filter((a) => a.category === 'LEAD_QUENTE').length,
    LEAD_SEM_CONTATO: actionItems.filter((a) => a.category === 'LEAD_SEM_CONTATO').length,
    CADASTRO_PENDENTE: actionItems.filter((a) => a.category === 'CADASTRO_PENDENTE').length,
    CLIENTE_SEM_COMPRA: actionItems.filter((a) => a.category === 'CLIENTE_SEM_COMPRA').length,
    OPORTUNIDADE_IA: actionItems.filter((a) => a.category === 'OPORTUNIDADE_IA').length,
  }

  const categories: Array<{ id: ActionCategory; label: string }> = [
    { id: 'TODAS', label: 'Todas as Ações' },
    { id: 'LEAD_QUENTE', label: 'Lead Quente' },
    { id: 'LEAD_SEM_CONTATO', label: 'Sem Contato' },
    { id: 'CADASTRO_PENDENTE', label: 'Cadastro Pendente' },
    { id: 'CLIENTE_SEM_COMPRA', label: 'Sem 1ª Compra' },
    { id: 'OPORTUNIDADE_IA', label: 'Oportunidade IA' },
  ]

  return (
    <div className="space-y-4">
      {/* CABEÇALHO DA CENTRAL DE AÇÕES INTELIGENTES (Diretriz 10: Fundo claro/institucional) */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#003A70]/10 text-[#003A70] rounded-xl border border-[#003A70]/20 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#003A70] tracking-tight">
              Central de Ações Comerciais & Próxima Melhor Ação (IA)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cruzamento de estágio, contatos, potencial, crédito e comportamento de compra
              ordenados por impacto.
            </p>
          </div>
        </div>

        <Badge
          variant="outline"
          className="bg-[#EBF3FA] text-[#003A70] border-[#003A70]/30 font-mono text-xs font-semibold self-start sm:self-auto"
        >
          {actionItems.length} ações recomendadas
        </Badge>
      </div>

      {/* CATEGORIAS FILTRÁVEIS (Padronizado CIAFAL: ativo em #003A70, inativo neutro) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 border select-none ${
                isSelected
                  ? 'bg-[#003A70] text-white border-[#003A70] font-bold shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:text-[#003A70] hover:bg-slate-50'
              }`}
            >
              <span>{cat.label}</span>
              <Badge
                className={`text-[10px] px-1.5 py-0 rounded-md font-mono border-none ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {categoryCounts[cat.id]}
              </Badge>
            </button>
          )
        })}
      </div>

      {/* CARDS DE AÇÕES INTELIGENTES (Design Corporativo CIAFAL, tipografia clara, sem rainbow) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredItems.map((item) => {
          return (
            <div
              key={item.id}
              className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-[#003A70]/40 transition-all flex flex-col justify-between gap-3 text-xs shadow-2xs"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <StatusBadge label={item.categoryLabel} variant={item.variant} dot />
                  <span className="font-mono text-[11px] text-slate-500 font-semibold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60">
                    {item.party.friendly_code}
                  </span>
                </div>

                <strong className="text-sm font-bold text-slate-900 block leading-snug">
                  {item.titulo}
                </strong>

                <p className="text-xs text-slate-600 leading-relaxed">{item.motivo}</p>
              </div>

              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">
                    Impacto Estimado
                  </span>
                  <span className="text-xs font-semibold text-emerald-800">
                    {item.impactoComercial}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onOpenParty(item.party.crm_party_id)}
                    className="h-8 text-xs text-slate-600 hover:text-[#003A70] hover:bg-slate-100 rounded-xl"
                  >
                    Ver CRM
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleActionClick(item)}
                    className="h-8 text-xs bg-[#003A70] hover:bg-[#002850] text-white font-semibold rounded-xl gap-1.5 shadow-2xs"
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
          <div className="col-span-2 p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs">
            Nenhuma ação pendente na categoria selecionada.
          </div>
        )}
      </div>
    </div>
  )
}
