// src/components/consultas/CertificadoPreviewModal.tsx
import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Award,
  Download,
  Share2,
  ShieldCheck,
  Building2,
  CheckCircle2,
  AlertOctagon,
  Copy,
} from 'lucide-react'
import { CertificadoQualidade } from '@/data/mockConsultasData'
import { consultasService } from '@/services/consultasService'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

interface CertificadoPreviewModalProps {
  certificado: CertificadoQualidade | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenSendModal?: (cert: CertificadoQualidade) => void
}

export const CertificadoPreviewModal: React.FC<CertificadoPreviewModalProps> = ({
  certificado,
  open,
  onOpenChange,
  onOpenSendModal,
}) => {
  const { user } = useAuth()

  if (!certificado) return null

  const isAprovado = certificado.statusCertificado === 'Aprovado'

  const handleDownloadPdf = () => {
    if (!isAprovado) {
      toast.error(
        'O certificado relacionado a este lote ainda não está disponível para distribuição.',
      )
      return
    }
    if (user) {
      consultasService.logAction(
        user,
        certificado.clienteId,
        'DOWNLOAD_PDF',
        'CERTIFICADO',
        certificado.numeroCertificado,
        {
          mensagemDetalhe: `Download do Certificado de Qualidade ${certificado.numeroCertificado} (Lote: ${certificado.lote})`,
        },
      )
    }
    toast.success(`Download do Certificado ${certificado.numeroCertificado} iniciado com sucesso!`)
  }

  const handleCopyLink = () => {
    if (!isAprovado) {
      toast.error('Certificado bloqueado para compartilhamento.')
      return
    }
    if (user) {
      const link = consultasService.gerarLinkSeguro(
        user,
        certificado.clienteId,
        'CERTIFICADO',
        certificado.numeroCertificado,
      )
      navigator.clipboard.writeText(link)
      toast.success('Link seguro do certificado copiado!')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 bg-slate-50">
        {/* Header */}
        <DialogHeader className="p-4 bg-white border-b border-slate-200 sticky top-0 z-20 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                Certificado de Qualidade / Análise Técnica nº {certificado.numeroCertificado}
                <Badge
                  variant="outline"
                  className={
                    isAprovado
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold'
                      : 'bg-amber-50 text-amber-700 border-amber-300 font-bold'
                  }
                >
                  {certificado.statusCertificado}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                NF nº {certificado.numeroNF} (Item {certificado.itemNF}) · Pedido:{' '}
                {certificado.pedidoSap} · Lote: {certificado.lote} · Corrida: {certificado.corrida}
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              disabled={!isAprovado}
              className="h-8 text-xs gap-1.5 border-slate-300"
            >
              <Copy className="w-3.5 h-3.5" />
              Copiar Link
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPdf}
              disabled={!isAprovado}
              className="h-8 text-xs gap-1.5 border-slate-300"
            >
              <Download className="w-3.5 h-3.5" />
              Baixar PDF
            </Button>
            {onOpenSendModal && (
              <Button
                size="sm"
                onClick={() => onOpenSendModal(certificado)}
                disabled={!isAprovado}
                className="h-8 text-xs gap-1.5 bg-primary text-white hover:bg-primary/90"
              >
                <Share2 className="w-3.5 h-3.5" />
                Enviar ao Cliente
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="p-6">
          {!isAprovado && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r text-red-900 text-xs flex items-center gap-3">
              <AlertOctagon className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <strong>Atenção: Certificado com Bloqueio de Distribuição</strong>
                <p className="mt-0.5">
                  Este certificado encontra-se em <strong>{certificado.statusCertificado}</strong>{' '}
                  pelo Departamento de Qualidade. O CRM bloqueia o envio externo até que haja
                  liberação técnica oficial no laboratório.
                </p>
              </div>
            </div>
          )}

          {/* Certificado Padrão de Engenharia e Metalurgia */}
          <div className="bg-white border-2 border-slate-800 p-6 rounded shadow-sm text-xs text-slate-800 space-y-4">
            {/* Topo do Certificado */}
            <div className="grid grid-cols-12 border-b-2 border-slate-800 pb-3 items-center">
              <div className="col-span-6">
                <h3 className="font-extrabold text-base text-primary uppercase font-serif">
                  CIAFAL FERRO & AÇO
                </h3>
                <span className="text-[11px] text-slate-600 block">
                  Gerência de Garantia da Qualidade & Metalurgia
                </span>
                <span className="text-[10px] text-slate-500">{certificado.unidadeProdutora}</span>
              </div>
              <div className="col-span-6 text-right">
                <div className="text-sm font-extrabold text-slate-900">
                  CERTIFICADO DE INSPEÇÃO E QUALIDADE
                </div>
                <div className="text-xs font-bold text-primary">
                  {certificado.numeroCertificado}
                </div>
                <div className="text-[10px] text-slate-500">
                  Data de Emissão: {certificado.dataEmissao}
                </div>
              </div>
            </div>

            {/* Rastreabilidade Geral */}
            <div className="grid grid-cols-4 gap-3 bg-slate-50 border border-slate-300 p-3 rounded">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-500 block">
                  Cliente Faturado
                </span>
                <span className="font-bold text-slate-900 block">{certificado.clienteNome}</span>
                <span className="text-[10px] text-slate-600">
                  SAP: {certificado.codigoClienteSap}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-500 block">
                  Nota Fiscal / Pedido
                </span>
                <span className="font-semibold block">
                  NF: {certificado.numeroNF} (Item {certificado.itemNF})
                </span>
                <span className="text-[10px] text-slate-600">Pedido: {certificado.pedidoSap}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-500 block">
                  Ordem de Produção / Lote
                </span>
                <span className="font-semibold block">{certificado.ordemProducao}</span>
                <span className="text-[10px] text-slate-600">
                  Lote: <strong>{certificado.lote}</strong>
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-500 block">
                  Corrida / Quantidade
                </span>
                <span className="font-bold text-primary block">Corrida: {certificado.corrida}</span>
                <span className="text-[10px] text-slate-800">
                  {certificado.pesoTon.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} t
                </span>
              </div>
            </div>

            {/* Especificação do Material */}
            <div className="border border-slate-300 p-3 rounded space-y-1">
              <span className="text-[9px] uppercase font-bold text-slate-500 block">
                Material & Norma Técnica Aplicável
              </span>
              <div className="text-sm font-bold text-slate-900">
                {certificado.materialDescricao}
              </div>
              <div className="text-[11px] text-slate-600 font-medium">
                {certificado.especificacaoTecnica}
              </div>
            </div>

            {/* Composição Química */}
            <div className="border border-slate-300 p-3 rounded space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-700 block">
                Composição Química do Aço (% em Massa - Análise de Panela / Corrida{' '}
                {certificado.corrida})
              </span>
              <div className="grid grid-cols-6 gap-2 text-center text-xs">
                <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[10px] font-bold text-slate-500 block">C (Carbono)</span>
                  <span className="font-extrabold text-slate-900">
                    {certificado.composicaoQuimica.c.toFixed(2)} %
                  </span>
                </div>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[10px] font-bold text-slate-500 block">Mn (Manganês)</span>
                  <span className="font-extrabold text-slate-900">
                    {certificado.composicaoQuimica.mn.toFixed(2)} %
                  </span>
                </div>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[10px] font-bold text-slate-500 block">Si (Silício)</span>
                  <span className="font-extrabold text-slate-900">
                    {certificado.composicaoQuimica.si.toFixed(2)} %
                  </span>
                </div>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[10px] font-bold text-slate-500 block">P (Fósforo)</span>
                  <span className="font-extrabold text-slate-900">
                    {certificado.composicaoQuimica.p.toFixed(3)} %
                  </span>
                </div>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[10px] font-bold text-slate-500 block">S (Enxofre)</span>
                  <span className="font-extrabold text-slate-900">
                    {certificado.composicaoQuimica.s.toFixed(3)} %
                  </span>
                </div>
                <div className="p-2 bg-primary/10 border border-primary/30 rounded">
                  <span className="text-[10px] font-bold text-primary block">C.E. (Equiv.)</span>
                  <span className="font-extrabold text-primary">
                    {certificado.composicaoQuimica.ce.toFixed(2)} %
                  </span>
                </div>
              </div>
            </div>

            {/* Ensaios Mecânicos */}
            <div className="border border-slate-300 p-3 rounded space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-700 block">
                Resultados de Ensaios Mecânicos Laboratoriais (Tração & Dobramento)
              </span>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[10px] font-bold text-slate-500 block">
                    Limite de Escoamento
                  </span>
                  <span className="font-extrabold text-slate-900">
                    {certificado.propriedadesMecanicas.escoamentoMpa} MPa
                  </span>
                </div>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[10px] font-bold text-slate-500 block">
                    Resistência à Tração
                  </span>
                  <span className="font-extrabold text-slate-900">
                    {certificado.propriedadesMecanicas.resistenciaMpa} MPa
                  </span>
                </div>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-[10px] font-bold text-slate-500 block">
                    Alongamento Após Ruptura
                  </span>
                  <span className="font-extrabold text-slate-900">
                    {certificado.propriedadesMecanicas.alongamentoPct.toFixed(1)} %
                  </span>
                </div>
                <div className="p-2 bg-emerald-50 border border-emerald-200 rounded">
                  <span className="text-[10px] font-bold text-emerald-700 block">
                    Ensaio de Dobramento
                  </span>
                  <span className="font-bold text-emerald-900 text-[11px]">
                    {certificado.propriedadesMecanicas.dobramento}
                  </span>
                </div>
              </div>
            </div>

            {/* Assinatura do Responsável Técnico */}
            <div className="grid grid-cols-12 border-t border-slate-300 pt-3 items-center">
              <div className="col-span-8 text-[10px] text-slate-600">
                Certificamos que o material acima especificado foi inspecionado, amostrado e
                ensaiado conforme os métodos estabelecidos nas normas ABNT / ASTM pertinentes,
                atendendo a todos os requisitos técnicos de conformidade.
              </div>
              <div className="col-span-4 text-center border-l border-slate-300 pl-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 mx-auto" />
                <span className="font-bold text-[11px] block text-slate-900 mt-0.5">
                  {certificado.responsavelTecnico}
                </span>
                <span className="text-[9px] text-slate-500 font-mono block">
                  {certificado.crqResponsavel}
                </span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
