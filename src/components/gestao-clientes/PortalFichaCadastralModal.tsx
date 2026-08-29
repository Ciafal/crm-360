// src/components/gestao-clientes/PortalFichaCadastralModal.tsx
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
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Building2,
  MapPin,
  Users,
  Briefcase,
  FileText,
  CheckCircle2,
  AlertCircle,
  Upload,
  Sparkles,
  Link2,
  QrCode,
  Send,
  Eye,
  ShieldCheck,
  FileCheck2,
} from 'lucide-react'
import { crmPartyService } from '@/services/crm_party_service'
import type { CrmPartyMaster, CrmOnboardingProcess, CrmDocumentItem } from '@/types/crm_party'
import { toast } from 'sonner'

interface PortalFichaCadastralModalProps {
  party: CrmPartyMaster | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: (party: CrmPartyMaster) => void
}

export function PortalFichaCadastralModal({
  party,
  open,
  onOpenChange,
  onSaved,
}: PortalFichaCadastralModalProps) {
  const [activeStep, setActiveStep] = useState<number>(1)

  // Estados dos passos da ficha cadastral
  const [razaoSocial, setRazaoSocial] = useState(party?.razao_social || '')
  const [nomeFantasia, setNomeFantasia] = useState(party?.nome_fantasia || '')
  const [cnpj, setCnpj] = useState(party?.cnpj_cpf || '')
  const [inscricaoEstadual, setInscricaoEstadual] = useState(
    party?.inscricao_estadual || '001.234.567.0099',
  )
  const [cnae, setCnae] = useState(party?.cnae || '25.11-0-00 - Fabricação de estruturas metálicas')
  const [regimeTributario, setRegimeTributario] = useState(party?.regime_tributario || 'Lucro Real')
  const [website, setWebsite] = useState(party?.website || '')

  // Endereços
  const [enderecos, setEnderecos] = useState(
    party?.enderecos && party.enderecos.length > 0
      ? party.enderecos
      : [
          {
            id: 'addr-01',
            crm_party_id: party?.crm_party_id || 'temp',
            tipo: 'SEDE' as const,
            logradouro: 'Av. Industrial CIAFAL',
            numero: '1500',
            bairro: 'Distrito Industrial',
            cidade: party?.cidade || 'Contagem',
            uf: party?.uf || 'MG',
            cep: '32000-000',
            is_padrao: true,
          },
        ],
  )

  // Contatos
  const [contatos, setContatos] = useState(
    party?.contatos && party.contatos.length > 0
      ? party.contatos
      : [
          {
            id: 'cont-01',
            crm_party_id: party?.crm_party_id || 'temp',
            nome: 'Contato Principal',
            cargo: 'Comprador',
            departamento: 'Compras',
            funcao_classificacao: 'Compras' as const,
            telefone: party?.telefone || '(31) 3399-4000',
            whatsapp: party?.whatsapp || '(31) 98765-4321',
            email: party?.email || 'compras@cliente.com.br',
            is_principal: true,
          },
        ],
  )

  // Informações Comerciais
  const [condicaoPretendida, setCondicaoPretendida] = useState('30/60 DDL (Boleto Faturado)')
  const [modalidadeFrete, setModalidadeFrete] = useState('CIF - Entregue na Obra/Fábrica')
  const [restricoesDescarga, setRestricoesDescarga] = useState(
    'Descarregamento apenas com ponte rolante até 17h',
  )
  const [janelaRecebimento, setJanelaRecebimento] = useState('Segunda a Sexta, das 08h às 16h30')

  if (!party) return null

  const activeOnboarding = party.onboardings?.[0]
  const protocolo = activeOnboarding?.protocolo || 'CAD-2024-001283'
  const portalUrl =
    activeOnboarding?.portal_url || `https://portal.ciafal.com.br/onboarding?proto=${protocolo}`

  // Alertas IA Mockados sobre inconsistência de dados (Regra 16)
  const aiAlerts = [
    {
      tipo: 'divergencia',
      msg: 'Endereço informado confere com Sintegra / Receita Federal.',
      status: 'ok',
    },
    {
      tipo: 'documento',
      msg: 'Contrato Social Consolidado analisado pela IA: Quadro societário sem restrições.',
      status: 'ok',
    },
  ]

  const calculateProgress = () => {
    let p = 20
    if (activeStep >= 2) p += 15
    if (activeStep >= 3) p += 15
    if (activeStep >= 4) p += 15
    if (activeStep >= 5) p += 20
    if (activeStep >= 6) p += 15
    return Math.min(100, p)
  }

  const handleSaveStep = (nextStep?: number) => {
    try {
      const updated = crmPartyService.saveOnboardingStep(
        party.crm_party_id,
        activeOnboarding?.id || 'legacy',
        {
          etapa: (`PASSO${activeStep}_EMPRESA` as any) || 'PASSO1_EMPRESA',
          empresa: {
            razao_social: razaoSocial,
            nome_fantasia: nomeFantasia,
            cnpj_cpf: cnpj,
            inscricao_estadual: inscricaoEstadual,
            cnae,
            regime_tributario: regimeTributario,
            website,
          },
          enderecos,
          contatos,
          comercial: {
            aplicacao: party.aplicacao_produto,
            produtos: party.produto_interesse,
            condicaoPretendida,
            modalidadeFrete,
            restricoesDescarga,
            janelaRecebimento,
          },
          progressoPct: calculateProgress(),
        },
      )

      toast.success('Ficha cadastral salva com sucesso!', {
        description: 'Dados sincronizados no Registro Comercial Único.',
      })
      onSaved(updated)

      if (nextStep) {
        setActiveStep(nextStep)
      }
    } catch (e: any) {
      toast.error(e.message || 'Erro ao salvar ficha')
    }
  }

  const handleSimulateDocUpload = (tipo: CrmDocumentItem['tipo_documento']) => {
    try {
      const updated = crmPartyService.uploadDocument(
        party.crm_party_id,
        activeOnboarding?.id || 'onb-01',
        {
          tipoDocumento: tipo,
          nomeArquivo: `${tipo.toLowerCase()}_anexo_comprovante.pdf`,
          tamanhoBytes: 850000,
          mimetype: 'application/pdf',
          origem: 'PORTAL_CLIENTE',
          uploadedBy: 'Cliente Portal (Compras)',
        },
      )
      toast.success(`Documento ${tipo} anexado com versionamento!`)
      onSaved(updated)
    } catch (e: any) {
      toast.error(e.message || 'Erro no envio do documento')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-slate-950 text-slate-100 border border-slate-800 rounded-3xl p-6 max-h-[92vh] overflow-y-auto">
        <DialogHeader className="border-b border-slate-800 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="font-serif text-xl font-bold text-white tracking-tight">
                    Ficha Cadastral & Onboarding
                  </DialogTitle>
                  <Badge className="bg-sky-950 text-sky-300 border-sky-800 font-mono text-xs">
                    {protocolo}
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-slate-400">
                  {party.friendly_code} · {party.razao_social} (CRM Party ID:{' '}
                  <span className="font-mono text-sky-400">
                    {party.crm_party_id.slice(0, 8)}...
                  </span>
                  )
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-900/80 p-2 rounded-2xl border border-slate-800">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 text-[11px] border-emerald-600/40 text-emerald-400 hover:bg-emerald-950/40 rounded-xl gap-1.5"
                onClick={() => {
                  navigator.clipboard.writeText(portalUrl)
                  toast.success('Link do Portal do Cliente copiado!', {
                    description: 'Token seguro de acesso com validade de 15 dias.',
                  })
                }}
              >
                <Link2 className="w-3.5 h-3.5" /> Copiar Link do Portal
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-8 text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl gap-1.5"
                onClick={() => {
                  toast.success('Ficha enviada via WhatsApp Business e E-mail!', {
                    description: `Destinatário: ${party.whatsapp} / ${party.email}`,
                  })
                }}
              >
                <Send className="w-3.5 h-3.5" /> Enviar p/ WhatsApp
              </Button>
            </div>
          </div>

          {/* CHECKLIST VISUAL DE PROGRESSO (Regra 17) */}
          <div className="pt-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-semibold">
                Progresso do Cadastramento ({calculateProgress()}%)
              </span>
              <span className="text-emerald-400 font-mono text-xs font-bold">
                Passo {activeStep} de 6
              </span>
            </div>
            <Progress value={calculateProgress()} className="h-2 bg-slate-900" />
          </div>
        </DialogHeader>

        {/* NAVEGAÇÃO ENTRE PASSOS DO WIZARD (Regra 14) */}
        <div className="flex items-center gap-1.5 border-b border-slate-800/80 pb-2 overflow-x-auto text-xs">
          {[
            { step: 1, label: '1. Empresa', icon: Building2 },
            { step: 2, label: '2. Endereços', icon: MapPin },
            { step: 3, label: '3. Contatos', icon: Users },
            { step: 4, label: '4. Comercial', icon: Briefcase },
            { step: 5, label: '5. Documentos', icon: FileCheck2 },
            { step: 6, label: '6. Revisão & Envio', icon: ShieldCheck },
          ].map((item) => {
            const Icon = item.icon
            const isCurrent = activeStep === item.step
            const isPassed = activeStep > item.step
            return (
              <button
                key={item.step}
                type="button"
                onClick={() => setActiveStep(item.step)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  isCurrent
                    ? 'bg-sky-600 text-white shadow-sm'
                    : isPassed
                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            )
          })}
        </div>

        {/* CONTEÚDO DOS PASSOS */}
        <div className="py-2 text-xs space-y-4">
          {/* PASSO 1: DADOS DA EMPRESA */}
          {activeStep === 1 && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider block">
                Dados Fiscais & Cadastrais da Empresa
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-300 font-semibold">Razão Social</Label>
                  <Input
                    value={razaoSocial}
                    onChange={(e) => setRazaoSocial(e.target.value)}
                    className="h-9 bg-slate-900 border-slate-800 text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-300 font-semibold">Nome Fantasia</Label>
                  <Input
                    value={nomeFantasia}
                    onChange={(e) => setNomeFantasia(e.target.value)}
                    className="h-9 bg-slate-900 border-slate-800 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-300 font-semibold">CNPJ</Label>
                  <Input
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    placeholder="00.000.000/0000-00"
                    className="h-9 bg-slate-900 border-slate-800 text-xs rounded-xl font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-300 font-semibold">
                    Inscrição Estadual (IE)
                  </Label>
                  <Input
                    value={inscricaoEstadual}
                    onChange={(e) => setInscricaoEstadual(e.target.value)}
                    className="h-9 bg-slate-900 border-slate-800 text-xs rounded-xl font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-300 font-semibold">Regime Tributário</Label>
                  <Select value={regimeTributario} onValueChange={setRegimeTributario}>
                    <SelectTrigger className="h-9 bg-slate-900 border-slate-800 text-xs rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-100 text-xs">
                      <SelectItem value="Lucro Real">Lucro Real</SelectItem>
                      <SelectItem value="Lucro Presumido">Lucro Presumido</SelectItem>
                      <SelectItem value="Simples Nacional">Simples Nacional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-300 font-semibold">CNAE Principal</Label>
                  <Input
                    value={cnae}
                    onChange={(e) => setCnae(e.target.value)}
                    className="h-9 bg-slate-900 border-slate-800 text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-300 font-semibold">
                    Website / Portal Corporativo
                  </Label>
                  <Input
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://suaempresa.com.br"
                    className="h-9 bg-slate-900 border-slate-800 text-xs rounded-xl"
                  />
                </div>
              </div>
            </div>
          )}

          {/* PASSO 2: ENDEREÇOS (SEDE, COBRANÇA, ENTREGA MÚLTIPLOS) */}
          {activeStep === 2 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                  Endereços (Sede, Cobrança e Entrega)
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11px] border-slate-800 bg-slate-900 text-slate-300 rounded-lg"
                  onClick={() => {
                    const newAddr = {
                      id: `addr-${Date.now()}`,
                      crm_party_id: party.crm_party_id,
                      tipo: 'ENTREGA' as const,
                      logradouro: 'Canteiro de Obras / Filial',
                      numero: '100',
                      bairro: 'Industrial',
                      cidade: party.cidade,
                      uf: party.uf,
                      cep: '32000-000',
                      is_padrao: false,
                    }
                    setEnderecos([...enderecos, newAddr])
                  }}
                >
                  + Adicionar Endereço de Entrega
                </Button>
              </div>

              <div className="space-y-2">
                {enderecos.map((addr, i) => (
                  <div
                    key={addr.id || i}
                    className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <Badge className="bg-sky-950 text-sky-300 border-sky-800 text-[10px]">
                        Tipo: {addr.tipo}
                      </Badge>
                      {addr.is_padrao && (
                        <span className="text-[10px] text-emerald-400 font-semibold">
                          Endereço Principal
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <Input
                        value={addr.logradouro}
                        onChange={(e) => {
                          const cp = [...enderecos]
                          cp[i].logradouro = e.target.value
                          setEnderecos(cp)
                        }}
                        placeholder="Logradouro"
                        className="h-8 bg-slate-950 border-slate-800 text-xs sm:col-span-2 rounded-xl"
                      />
                      <Input
                        value={addr.cidade}
                        onChange={(e) => {
                          const cp = [...enderecos]
                          cp[i].cidade = e.target.value
                          setEnderecos(cp)
                        }}
                        placeholder="Cidade"
                        className="h-8 bg-slate-950 border-slate-800 text-xs rounded-xl"
                      />
                      <Input
                        value={addr.uf}
                        onChange={(e) => {
                          const cp = [...enderecos]
                          cp[i].uf = e.target.value
                          setEnderecos(cp)
                        }}
                        placeholder="UF"
                        className="h-8 bg-slate-950 border-slate-800 text-xs rounded-xl"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PASSO 3: CONTATOS POR CLASSIFICAÇÃO (Compras, Financeiro, Fiscal, Logística) */}
          {activeStep === 3 && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider block">
                Contatos Classificados (Compras, Financeiro, Fiscal, Logística)
              </span>

              <div className="space-y-2">
                {contatos.map((cont, i) => (
                  <div
                    key={cont.id || i}
                    className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-2"
                  >
                    <Input
                      value={cont.nome}
                      onChange={(e) => {
                        const cp = [...contatos]
                        cp[i].nome = e.target.value
                        setContatos(cp)
                      }}
                      placeholder="Nome completo"
                      className="h-8 bg-slate-950 border-slate-800 text-xs rounded-xl"
                    />
                    <Select
                      value={cont.funcao_classificacao}
                      onValueChange={(val: any) => {
                        const cp = [...contatos]
                        cp[i].funcao_classificacao = val
                        setContatos(cp)
                      }}
                    >
                      <SelectTrigger className="h-8 bg-slate-950 border-slate-800 text-xs rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-100 text-xs">
                        <SelectItem value="Compras">Compras</SelectItem>
                        <SelectItem value="Financeiro">Financeiro</SelectItem>
                        <SelectItem value="Fiscal">Fiscal</SelectItem>
                        <SelectItem value="Logística">Logística / Descarga</SelectItem>
                        <SelectItem value="Qualidade">Qualidade</SelectItem>
                        <SelectItem value="Diretoria">Diretoria</SelectItem>
                        <SelectItem value="Comercial">Comercial</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={cont.whatsapp}
                      onChange={(e) => {
                        const cp = [...contatos]
                        cp[i].whatsapp = e.target.value
                        setContatos(cp)
                      }}
                      placeholder="WhatsApp"
                      className="h-8 bg-slate-950 border-slate-800 text-xs rounded-xl font-mono"
                    />
                    <Input
                      value={cont.email}
                      onChange={(e) => {
                        const cp = [...contatos]
                        cp[i].email = e.target.value
                        setContatos(cp)
                      }}
                      placeholder="E-mail"
                      className="h-8 bg-slate-950 border-slate-800 text-xs rounded-xl"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PASSO 4: INFORMAÇÕES COMERCIAIS & LOGÍSTICAS */}
          {activeStep === 4 && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider block">
                Condições Comerciais, Modalidade de Frete & Logística
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-300 font-semibold">
                    Condição de Pagamento Pretendida
                  </Label>
                  <Input
                    value={condicaoPretendida}
                    onChange={(e) => setCondicaoPretendida(e.target.value)}
                    className="h-9 bg-slate-900 border-slate-800 text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-300 font-semibold">
                    Modalidade de Frete
                  </Label>
                  <Input
                    value={modalidadeFrete}
                    onChange={(e) => setModalidadeFrete(e.target.value)}
                    className="h-9 bg-slate-900 border-slate-800 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-300 font-semibold">
                  Restrições de Descarregamento / Veículo
                </Label>
                <Input
                  value={restricoesDescarga}
                  onChange={(e) => setRestricoesDescarga(e.target.value)}
                  placeholder="Ex: Apenas carreta prancha ou caminhão truck..."
                  className="h-9 bg-slate-900 border-slate-800 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-slate-300 font-semibold">
                  Janela de Recebimento
                </Label>
                <Input
                  value={janelaRecebimento}
                  onChange={(e) => setJanelaRecebimento(e.target.value)}
                  placeholder="Ex: Segunda a Sexta, 08h às 16h"
                  className="h-9 bg-slate-900 border-slate-800 text-xs rounded-xl"
                />
              </div>
            </div>
          )}

          {/* PASSO 5: DOCUMENTOS COM VERSIONAMENTO (Regra 15) */}
          {activeStep === 5 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                  Documentação Cadastral (Versionada V1, V2...)
                </span>
                <span className="text-[11px] text-slate-400">
                  Documentos não são apagados; mantêm versões e auditoria.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { tipo: 'CARTAO_CNPJ' as const, label: 'Cartão CNPJ Atualizado' },
                  { tipo: 'CONTRATO_SOCIAL' as const, label: 'Contrato Social / Última Alteração' },
                  {
                    tipo: 'COMPROVANTE_ENDERECO' as const,
                    label: 'Comprovante de Endereço da Sede',
                  },
                  {
                    tipo: 'BALANCO_PATRIMONIAL' as const,
                    label: 'Balanço Patrimonial / DRE Recente',
                  },
                  {
                    tipo: 'REFERENCIAS_BANCARIAS' as const,
                    label: 'Referências Bancárias & Comerciais',
                  },
                  {
                    tipo: 'DOC_REPRESENTANTES' as const,
                    label: 'Documentos dos Representantes Legais',
                  },
                ].map((docItem) => {
                  const docVersions = party.documentos.filter(
                    (d) => d.tipo_documento === docItem.tipo,
                  )
                  const hasDoc = docVersions.length > 0
                  const latest = docVersions[0]

                  return (
                    <div
                      key={docItem.tipo}
                      className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 flex items-center justify-between"
                    >
                      <div className="space-y-1 pr-2">
                        <span className="font-semibold text-slate-200 block text-xs">
                          {docItem.label}
                        </span>
                        {hasDoc ? (
                          <div className="flex items-center gap-1.5">
                            <Badge className="bg-emerald-950 text-emerald-300 border-emerald-800 text-[10px]">
                              V{latest.versao} · {latest.status}
                            </Badge>
                            <span className="text-[10px] text-slate-400">
                              {latest.nome_arquivo}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-amber-400">Pendente de anexo</span>
                        )}
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleSimulateDocUpload(docItem.tipo)}
                        className="h-8 text-xs border-slate-700 bg-slate-950 text-sky-300 hover:bg-sky-950/40 rounded-xl gap-1 shrink-0"
                      >
                        <Upload className="w-3.5 h-3.5" /> Anexar V{hasDoc ? latest.versao + 1 : 1}
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* PASSO 6: REVISÃO & ENVIO COM IA VALIDATION (Regra 16) */}
          {activeStep === 6 && (
            <div className="space-y-3">
              <div className="p-4 bg-sky-950/40 rounded-2xl border border-sky-800/40 space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-sky-400" />
                  <strong className="text-xs font-bold text-sky-300 uppercase tracking-wider">
                    Validação Inteligente IA (Alertas Preventivos)
                  </strong>
                </div>
                <div className="space-y-1.5">
                  {aiAlerts.map((al, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-[11px] text-slate-300 bg-slate-950/60 p-2 rounded-xl"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{al.msg}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <strong className="text-slate-300 block font-bold">
                  Resumo do Cadastro Mestre
                </strong>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Razão Social</span>
                    <span className="text-white font-semibold">{razaoSocial}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">CNPJ</span>
                    <span className="font-mono text-sky-300">{cnpj}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Cidade / UF</span>
                    <span className="text-slate-200">
                      {party.cidade} / {party.uf}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Documentos</span>
                    <span className="text-emerald-400 font-bold">
                      {party.documentos?.length || 0} versões anexadas
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-slate-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleSaveStep()}
            className="h-9 text-xs border-slate-800 bg-slate-900 text-slate-300 hover:text-white rounded-xl"
          >
            [ Salvar e Continuar Depois ]
          </Button>

          <div className="flex gap-2">
            {activeStep > 1 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveStep(activeStep - 1)}
                className="h-9 text-xs border-slate-800 text-slate-300 rounded-xl"
              >
                Passo Anterior
              </Button>
            )}

            {activeStep < 6 ? (
              <Button
                type="button"
                size="sm"
                onClick={() => handleSaveStep(activeStep + 1)}
                className="h-9 text-xs bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl"
              >
                Salvar e Avançar
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  handleSaveStep()
                  toast.success('Ficha cadastral finalizada e enviada para o Financeiro CIAFAL!', {
                    description: `Protocolo ${protocolo} em análise.`,
                  })
                  onOpenChange(false)
                }}
                className="h-9 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" /> Enviar Cadastro para Análise Financeira
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
