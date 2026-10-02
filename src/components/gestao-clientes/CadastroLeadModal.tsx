// src/components/gestao-clientes/CadastroLeadModal.tsx
import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  UserPlus,
  AlertTriangle,
  Building2,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'
import { crmPartyService } from '@/services/crm_party_service'
import type { CrmPartyMaster } from '@/types/crm_party'
import { toast } from 'sonner'
import { StatusBadge, AlertBlock } from './shared/GestaoClientesUiKit'

interface CadastroLeadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLeadCreated: (lead: CrmPartyMaster) => void
  onOpenExistingParty?: (partyId: string) => void
}

export function CadastroLeadModal({
  open,
  onOpenChange,
  onLeadCreated,
  onOpenExistingParty,
}: CadastroLeadModalProps) {
  const [razaoSocial, setRazaoSocial] = useState('')
  const [nomeFantasia, setNomeFantasia] = useState('')
  const [cnpjCpf, setCnpjCpf] = useState('')
  const [nomeContato, setNomeContato] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [cidade, setCidade] = useState('Contagem')
  const [uf, setUf] = useState('MG')
  const [segmento, setSegmento] = useState('Construção Civil')
  const [produtoInteresse, setProdutoInteresse] = useState('Perfis Estruturais & Vigas')
  const [aplicacao, setAplicacao] = useState('Galpões e Estruturas Metálicas')
  const [potencialMensalTons, setPotencialMensalTons] = useState('15')
  const [vendedorNome, setVendedorNome] = useState('Carlos Mendonça')
  const [origem, setOrigem] = useState('Prospecção Ativa')
  const [observacao, setObservacao] = useState('')

  // Deduplicação
  const [duplicateWarning, setDuplicateWarning] = useState<{
    hasDuplicate: boolean
    reason?: string
    details?: any
  } | null>(null)

  // Disparo de deduplicação em tempo real ao digitar CNPJ ou Razão Social
  const handleCnpjChange = (val: string) => {
    setCnpjCpf(val)
    if (val.replace(/[^0-9]/g, '').length >= 11) {
      const check = crmPartyService.checkDuplicates({
        cnpjCpf: val,
        razaoSocial,
        email,
      })
      if (check.hasDuplicate) {
        setDuplicateWarning(check)
      } else {
        setDuplicateWarning(null)
      }
    } else {
      setDuplicateWarning(null)
    }
  }

  const handleRazaoChange = (val: string) => {
    setRazaoSocial(val)
    if (val.length >= 6) {
      const check = crmPartyService.checkDuplicates({
        razaoSocial: val,
        cnpjCpf,
        email,
      })
      if (check.hasDuplicate) {
        setDuplicateWarning(check)
      } else {
        setDuplicateWarning(null)
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!razaoSocial.trim()) {
      toast.error('Informe a Razão Social ou Nome da Empresa')
      return
    }
    if (!nomeContato.trim()) {
      toast.error('Informe o Nome do Contato Principal')
      return
    }
    if (!whatsapp.trim() && !telefone.trim()) {
      toast.error('Informe ao menos um telefone ou WhatsApp')
      return
    }

    // Validação final de duplicidade
    const check = crmPartyService.checkDuplicates({
      cnpjCpf,
      razaoSocial,
      email,
    })

    if (check.hasDuplicate && !duplicateWarning?.hasDuplicate) {
      setDuplicateWarning(check)
      toast.warning('Atenção: Possível cadastro já existente detectado pelo motor de deduplicação.')
      return
    }

    const tonsNum = parseFloat(potencialMensalTons.replace(',', '.')) || 10

    const newLead = crmPartyService.createLead({
      razaoSocial,
      nomeFantasia,
      cnpjCpf,
      nomeContato,
      whatsapp: whatsapp || telefone,
      telefone,
      email,
      cidade,
      uf,
      segmento,
      produtoInteresse,
      aplicacao,
      potencialMensalTons: tonsNum,
      vendedorNome,
      origem,
      observacao,
    })

    toast.success(`Lead comercial ${newLead.friendly_code} criado com sucesso!`, {
      description: `Identificador Mestre: ${newLead.crm_party_id.slice(0, 12)}... (UUID Imutável)`,
    })

    // Reset
    setRazaoSocial('')
    setNomeFantasia('')
    setCnpjCpf('')
    setNomeContato('')
    setWhatsapp('')
    setTelefone('')
    setEmail('')
    setObservacao('')
    setDuplicateWarning(null)
    onOpenChange(false)
    onLeadCreated(newLead)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white text-slate-900 border border-slate-200 rounded-2xl shadow-xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        {/* Header fixo */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#003A70]/10 text-[#003A70] rounded-xl border border-[#003A70]/20">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="font-serif text-lg font-bold text-[#003A70] tracking-tight">
                Cadastrar Novo Lead Comercial
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                Registro Comercial Único (UUID + Friendly Code) sem burocracia na prospecção.
              </DialogDescription>
            </div>
          </div>
          <StatusBadge label="Lead Novo" variant="default" />
        </div>

        {/* Corpo rolável com formulário */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs">
            {/* ALERTA DE DEDUPLICAÇÃO INTELIGENTE (Regra 7) */}
            {duplicateWarning?.hasDuplicate && duplicateWarning.details && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-2.5">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 flex-1">
                    <strong className="text-xs font-bold text-amber-900 block uppercase tracking-wider">
                      Possível Cadastro Já Existente no CRM / SAP ECC
                    </strong>
                    <p className="text-xs text-amber-800">{duplicateWarning.reason}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-white p-2.5 rounded-lg border border-amber-200">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">
                      Empresa
                    </span>
                    <strong className="text-slate-900 truncate block">
                      {duplicateWarning.details.empresa}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">
                      CNPJ / SAP
                    </span>
                    <span className="font-mono text-slate-700">
                      {duplicateWarning.details.cnpj || 'Sem CNPJ'} ·{' '}
                      {duplicateWarning.details.codigoSap || 'Sem SAP'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">
                      Vendedor
                    </span>
                    <span className="text-slate-700">{duplicateWarning.details.vendedor}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">
                      Estágio
                    </span>
                    <StatusBadge label={duplicateWarning.details.situacao} variant="warning" />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs border-amber-300 text-amber-900 bg-white hover:bg-amber-100 rounded-lg gap-1"
                    onClick={() => {
                      if (onOpenExistingParty) {
                        onOpenExistingParty(duplicateWarning.details.crmPartyId)
                        onOpenChange(false)
                      }
                    }}
                  >
                    <ExternalLink className="w-3 h-3" /> Abrir Registro Existente
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-7 text-xs bg-amber-700 hover:bg-amber-800 text-white rounded-lg"
                    onClick={() => setDuplicateWarning(null)}
                  >
                    Prosseguir Mesmo Assim
                  </Button>
                </div>
              </div>
            )}
            {/* BLOCO 1: IDENTIFICAÇÃO DA EMPRESA */}
            <div className="space-y-3">
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
                1. Identificação da Empresa & Localização
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-700 font-semibold">
                    Razão Social / Nome da Empresa *
                  </Label>
                  <Input
                    required
                    value={razaoSocial}
                    onChange={(e) => handleRazaoChange(e.target.value)}
                    placeholder="Ex: Siderúrgica & Estruturas Alvorada Ltda"
                    className="h-9 bg-white border-border text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-slate-700 font-semibold">Nome Fantasia</Label>
                  <Input
                    value={nomeFantasia}
                    onChange={(e) => setNomeFantasia(e.target.value)}
                    placeholder="Ex: Alvorada Estruturas"
                    className="h-9 bg-white border-border text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-700 font-semibold">
                    CNPJ / CPF (Opcional nesta fase)
                  </Label>
                  <Input
                    value={cnpjCpf}
                    onChange={(e) => handleCnpjChange(e.target.value)}
                    placeholder="00.000.000/0000-00"
                    className="h-9 bg-white border-border text-xs rounded-xl font-mono"
                  />
                  <span className="text-[10px] text-muted-foreground block">
                    Pode ser complementado depois no onboarding
                  </span>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-slate-700 font-semibold">Cidade *</Label>
                  <Input
                    required
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    placeholder="Ex: Contagem"
                    className="h-9 bg-white border-border text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-slate-700 font-semibold">UF *</Label>
                  <Select value={uf} onValueChange={setUf}>
                    <SelectTrigger className="h-9 bg-white border-border text-xs rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-border text-slate-900 text-xs">
                      <SelectItem value="MG">MG - Minas Gerais</SelectItem>
                      <SelectItem value="SP">SP - São Paulo</SelectItem>
                      <SelectItem value="RJ">RJ - Rio de Janeiro</SelectItem>
                      <SelectItem value="ES">ES - Espírito Santo</SelectItem>
                      <SelectItem value="GO">GO - Goiás</SelectItem>
                      <SelectItem value="DF">DF - Distrito Federal</SelectItem>
                      <SelectItem value="PR">PR - Paraná</SelectItem>
                      <SelectItem value="SC">SC - Santa Catarina</SelectItem>
                      <SelectItem value="RS">RS - Rio Grande do Sul</SelectItem>
                      <SelectItem value="BA">BA - Bahia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* BLOCO 2: CONTATO PRINCIPAL */}
            <div className="space-y-3 pt-2 border-t border-border/60">
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
                2. Contato Comercial Direto
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-700 font-semibold">Nome do Contato *</Label>
                  <Input
                    required
                    value={nomeContato}
                    onChange={(e) => setNomeContato(e.target.value)}
                    placeholder="Ex: Rodrigo Mendonça (Compras)"
                    className="h-9 bg-white border-border text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-slate-700 font-semibold">WhatsApp Oficial *</Label>
                  <Input
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="(31) 99999-9999"
                    className="h-9 bg-white border-border text-xs rounded-xl font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-slate-700 font-semibold">E-mail Comercial</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="compras@empresa.com.br"
                    className="h-9 bg-white border-border text-xs rounded-xl"
                  />
                </div>
              </div>
            </div>

            {/* BLOCO 3: POTENCIAL & INTERESSE TÉCNICO */}
            <div className="space-y-3 pt-2 border-t border-border/60">
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
                3. Potencial Técnico & Comercial
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-700 font-semibold">Segmento</Label>
                  <Select value={segmento} onValueChange={setSegmento}>
                    <SelectTrigger className="h-9 bg-white border-border text-xs rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-border text-slate-900 text-xs">
                      <SelectItem value="Construção Civil">
                        Construção Civil & Estruturas
                      </SelectItem>
                      <SelectItem value="Indústria">Indústria Metalmecânica</SelectItem>
                      <SelectItem value="Agronegócio">Agronegócio & Implementos</SelectItem>
                      <SelectItem value="Revenda & Serralheria">Revenda & Serralheria</SelectItem>
                      <SelectItem value="Indústria Naval & Offshore">
                        Indústria Naval & Offshore
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-slate-700 font-semibold">
                    Volume Potencial (t/mês) *
                  </Label>
                  <Input
                    type="number"
                    step="0.5"
                    required
                    value={potencialMensalTons}
                    onChange={(e) => setPotencialMensalTons(e.target.value)}
                    className="h-9 bg-white border-border text-xs rounded-xl font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-slate-700 font-semibold">Origem do Lead</Label>
                  <Select value={origem} onValueChange={setOrigem}>
                    <SelectTrigger className="h-9 bg-white border-border text-xs rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-border text-slate-900 text-xs">
                      <SelectItem value="Prospecção Ativa">Prospecção Ativa (Vendedor)</SelectItem>
                      <SelectItem value="Feira / Evento">Feira / Evento do Setor</SelectItem>
                      <SelectItem value="Indicação de Cliente">Indicação de Cliente</SelectItem>
                      <SelectItem value="Inbound / WhatsApp Site">
                        Inbound / WhatsApp Site
                      </SelectItem>
                      <SelectItem value="Campanha de Marketing">Campanha de Marketing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-700 font-semibold">
                    Produto de Interesse Principal
                  </Label>
                  <Input
                    value={produtoInteresse}
                    onChange={(e) => setProdutoInteresse(e.target.value)}
                    placeholder="Ex: Perfis W 200, Chapas Grossas A36, Tubos Sch40"
                    className="h-9 bg-white border-border text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-slate-700 font-semibold">
                    Aplicação / Projeto
                  </Label>
                  <Input
                    value={aplicacao}
                    onChange={(e) => setAplicacao(e.target.value)}
                    placeholder="Ex: Fabricação de galpões logísticos e pontes rolantes"
                    className="h-9 bg-white border-border text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-700 font-semibold">
                  Observações Comerciais
                </Label>
                <textarea
                  rows={2}
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Ex: Cliente solicita entrega fracionada em Betim e prefere cotação com frete CIF..."
                  className="w-full bg-white border border-border rounded-xl p-2.5 text-xs text-slate-900 placeholder:text-muted-foreground focus:outline-hidden focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Footer fixo */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
            <span className="text-[11px] text-slate-500">
              Vendedor: <strong className="text-slate-800">{vendedorNome}</strong>
            </span>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 text-xs border-slate-200 bg-white text-slate-700 rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-8 text-xs bg-[#003A70] hover:bg-[#002850] text-white font-semibold rounded-xl gap-1.5 shadow-2xs"
              >
                <CheckCircle2 className="w-4 h-4" /> Cadastrar Lead Comercial
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
