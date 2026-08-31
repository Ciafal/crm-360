// src/components/consultas/BoletoPreviewModal.tsx
import React, { useState } from 'react'
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
  CreditCard,
  Download,
  Copy,
  Share2,
  AlertTriangle,
  FileQuestion,
  Building2,
  CheckCircle2,
} from 'lucide-react'
import { BoletoFinanceiro } from '@/data/mockConsultasData'
import { consultasService } from '@/services/consultasService'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

interface BoletoPreviewModalProps {
  boleto: BoletoFinanceiro | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenSolicitarFinanceiro?: (boleto: BoletoFinanceiro) => void
  onOpenSendModal?: (boleto: BoletoFinanceiro) => void
}

export const BoletoPreviewModal: React.FC<BoletoPreviewModalProps> = ({
  boleto,
  open,
  onOpenChange,
  onOpenSolicitarFinanceiro,
  onOpenSendModal,
}) => {
  const { user } = useAuth()
  const [copied, setCopied] = useState(false)

  if (!boleto) return null

  const isVencido = boleto.status === 'Vencido'

  const handleCopyLinhaDigitavel = () => {
    navigator.clipboard.writeText(boleto.linhaDigitavel)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
    if (user) {
      consultasService.logAction(
        user,
        boleto.clienteId,
        'VIEW_BOLETO',
        'BOLETO',
        boleto.numeroDocumento,
        {
          canal: 'Link Seguro',
          mensagemDetalhe: `Copiou linha digitável do boleto ${boleto.numeroDocumento}`,
        },
      )
    }
    toast.success('Linha digitável copiada com sucesso!')
  }

  const handleDownloadPdf = () => {
    if (user) {
      consultasService.logAction(
        user,
        boleto.clienteId,
        'DOWNLOAD_PDF',
        'BOLETO',
        boleto.numeroDocumento,
        {
          mensagemDetalhe: `Download do PDF do boleto bancário nº ${boleto.numeroDocumento}`,
        },
      )
    }
    toast.success(`Download do boleto ${boleto.numeroDocumento} iniciado!`)
  }

  const getStatusBadge = () => {
    switch (boleto.status) {
      case 'A vencer':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            A vencer
          </Badge>
        )
      case 'Vence hoje':
        return (
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-700 border-amber-300 font-bold"
          >
            Vence hoje
          </Badge>
        )
      case 'Vencido':
        return (
          <Badge variant="destructive" className="bg-red-600 text-white font-bold">
            Vencido
          </Badge>
        )
      case 'Pago':
        return (
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-700 border-emerald-300 font-bold"
          >
            Pago
          </Badge>
        )
      default:
        return <Badge variant="outline">{boleto.status}</Badge>
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 bg-slate-50">
        <DialogHeader className="p-4 bg-white border-b border-slate-200 sticky top-0 z-20 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                Boleto Bancário / Título nº {boleto.numeroDocumento}
                {getStatusBadge()}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                NF Relacionada: {boleto.numeroNfRelacionada} · Pedido: {boleto.numeroPedido} ·{' '}
                {boleto.banco}
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLinhaDigitavel}
              className="h-8 text-xs gap-1.5 border-slate-300"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? 'Copiado!' : 'Copiar Linha Digitável'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPdf}
              className="h-8 text-xs gap-1.5 border-slate-300"
            >
              <Download className="w-3.5 h-3.5" />
              Baixar PDF
            </Button>
            {onOpenSendModal && (
              <Button
                size="sm"
                onClick={() => onOpenSendModal(boleto)}
                className="h-8 text-xs gap-1.5 bg-primary text-white hover:bg-primary/90"
              >
                <Share2 className="w-3.5 h-3.5" />
                Enviar ao Cliente
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="p-6 space-y-4">
          {/* Alerta de Boleto Vencido (Regra do Financeiro) */}
          {isVencido && (
            <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg text-amber-900 flex items-start justify-between">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-xs">
                  <h4 className="font-bold text-amber-950">
                    Título Vencido — Atualização Obrigatória pelo Financeiro
                  </h4>
                  <p className="text-amber-800 mt-0.5 leading-relaxed">
                    Por conformidade contábil e bancária, o CRM nunca recalcula juros ou multa no
                    frontend. Solicite uma 2ª via atualizada com nova data e encargos oficiais
                    calculados pelo SAP FI / Sistema Bancário.
                  </p>
                </div>
              </div>
              {onOpenSolicitarFinanceiro && (
                <Button
                  size="sm"
                  onClick={() => onOpenSolicitarFinanceiro(boleto)}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-8 ml-3 shrink-0"
                >
                  <FileQuestion className="w-3.5 h-3.5 mr-1.5" />
                  Solicitar 2ª via ao Financeiro
                </Button>
              )}
            </div>
          )}

          {/* Ficha Visual do Boleto Bancário */}
          <div className="bg-white border-2 border-slate-700 p-5 rounded shadow-sm text-xs text-slate-800 space-y-4">
            {/* Topo Banco */}
            <div className="flex items-center justify-between border-b-2 border-slate-700 pb-2.5">
              <div className="flex items-center gap-3">
                <div className="font-black text-xl text-primary font-serif">CIAFAL</div>
                <div className="border-l-2 border-slate-700 pl-3">
                  <span className="font-bold text-sm block">{boleto.banco}</span>
                  <span className="text-[10px] text-slate-500">{boleto.agenciaConta}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Vencimento
                </span>
                <span className="text-base font-extrabold text-slate-900">
                  {boleto.dataVencimentoFormatada}
                </span>
              </div>
            </div>

            {/* Linha Digitável em Destaque */}
            <div className="p-3 bg-slate-100 rounded border border-slate-300 text-center font-mono font-bold text-sm select-all tracking-wider text-slate-900">
              {boleto.linhaDigitavel}
            </div>

            {/* Grid de Informações Financeiras */}
            <div className="grid grid-cols-4 gap-3 border border-slate-300 p-3 rounded bg-slate-50">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-500 block">
                  Pagador (Cliente)
                </span>
                <span className="font-bold text-slate-900">{boleto.clienteNome}</span>
                <span className="text-[10px] text-slate-600 block">CNPJ: {boleto.cnpj}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-500 block">
                  Documento / Título
                </span>
                <span className="font-semibold">{boleto.numeroDocumento}</span>
                <span className="text-[10px] text-slate-600 block">
                  Título: {boleto.numeroTitulo}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-500 block">
                  Data de Emissão
                </span>
                <span className="font-semibold">{boleto.dataEmissao}</span>
                <span className="text-[10px] text-slate-600 block">
                  NF: {boleto.numeroNfRelacionada}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">
                  Valor do Documento
                </span>
                <span className="text-base font-extrabold text-primary">
                  {boleto.valorOriginal.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </span>
              </div>
            </div>

            {/* Instruções de Pagamento */}
            <div className="border border-slate-300 p-3 rounded space-y-1">
              <span className="text-[9px] uppercase font-bold text-slate-500 block">
                Instruções de Pagamento (Texto de Responsabilidade do Beneficiário)
              </span>
              <p className="text-[11px] text-slate-700">
                • Pagável em qualquer agência bancária ou internet banking até o vencimento.
                <br />• Após o vencimento, atualize a 2ª via diretamente pelo portal CRM CIAFAL com
                validação da Tesouraria.
                <br />• Beneficiário: CIAFAL FERRO & AÇO LTDA. — CNPJ: 17.234.567/0001-88.
              </p>
            </div>

            {/* Simulação de Código de Barras */}
            <div className="pt-2 flex flex-col items-center justify-center space-y-1 border-t border-slate-200">
              <div className="w-full h-12 bg-repeating-linear-stripes border border-slate-400 rounded-xs flex items-center justify-center">
                <span className="bg-white/90 px-3 py-0.5 font-mono text-[11px] font-bold text-slate-800 tracking-widest">
                  ||| | |||| | || ||||| |||| | ||| |||| ||||| ||||||| | |||
                </span>
              </div>
              <span className="font-mono text-[10px] text-slate-500 tracking-wider select-all">
                {boleto.codigoBarras}
              </span>
            </div>
          </div>

          {/* Histórico de Solicitações Anteriores */}
          {boleto.historicoSolicitacoes && boleto.historicoSolicitacoes.length > 0 && (
            <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileQuestion className="w-3.5 h-3.5 text-primary" />
                Histórico de Solicitações ao Financeiro para este Título
              </h4>
              <div className="space-y-1.5">
                {boleto.historicoSolicitacoes.map((sol, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-slate-50 rounded border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-primary mr-2">{sol.protocolo}</span>
                      <span className="text-slate-600">
                        Aberto por {sol.solicitante} em {sol.dataSolicitacao}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-amber-50 text-amber-700 border-amber-300"
                    >
                      {sol.status} (SLA: {sol.slaHoras}h)
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
