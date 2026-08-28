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
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Download,
  Printer,
  CheckCircle2,
  ShieldCheck,
  QrCode,
  FileCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency, formatWeight } from '@/lib/utils'

export type DocumentType = 'NF' | 'BOLETO' | 'CERTIFICADO'

export interface ClientDocumentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  docType: DocumentType
  docData: {
    number: string
    date?: string
    clientName: string
    cnpj?: string
    sapCode?: string
    value?: number
    tons?: number
    items?: string[]
    dueDate?: string
    bankCode?: string
    barcode?: string
    normaTecnica?: string
    loteUsinagem?: string
    status?: string
  }
}

export function ClientDocumentViewerModal({
  open,
  onOpenChange,
  docType,
  docData,
}: ClientDocumentModalProps) {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = () => {
    setDownloading(true)
    setTimeout(() => {
      setDownloading(false)
      toast.success(`Download do PDF ${docType} #${docData.number} concluído com sucesso!`)
    }, 600)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-2xl bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-4">
            <DialogTitle className="font-serif text-lg text-primary flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {docType === 'NF'
                ? `DANFE — Nota Fiscal Eletrônica #${docData.number}`
                : docType === 'BOLETO'
                  ? `Boleto Bancário Registrado #${docData.number}`
                  : `Certificado de Qualidade & Conformidade Metalúrgica #${docData.number}`}
            </DialogTitle>
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-mono">
              {docData.status || 'AUTORIZADO'}
            </Badge>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Documento oficial gerado via integração SAP ECC / Sefaz / Banco Itaú / Laboratório de
            Qualidade CIAFAL.
          </DialogDescription>
        </DialogHeader>

        {/* CORPO DO DOCUMENTO (EMULAÇÃO VISUAL CLEAN DO PDF) */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4 text-xs font-sans">
          {/* CABEÇALHO DO DOCUMENTO */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-3">
            <div>
              <span className="font-serif text-sm font-bold text-primary block">
                CIAFAL COMÉRCIO E INDÚSTRIA DE AÇO S/A
              </span>
              <span className="text-[11px] text-muted-foreground block">
                CNPJ: 18.442.981/0001-09 · Inscrição Estadual: 062.884.219.00-84
              </span>
              <span className="text-[11px] text-muted-foreground block">
                Av. General David Sarnoff, 2400 — Cidade Industrial, Contagem - MG
              </span>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="text-[11px] font-mono font-bold bg-white">
                DOC: {docData.number}
              </Badge>
              <span className="text-[11px] text-muted-foreground block mt-1">
                Emissão: {docData.date || new Date().toLocaleDateString('pt-BR')}
              </span>
            </div>
          </div>

          {/* DADOS DO DESTINATÁRIO */}
          <div className="p-3 bg-white rounded-lg border border-slate-200 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                Destinatário / Pagador:
              </span>
              <strong className="text-slate-900 block">{docData.clientName}</strong>
              <span className="text-[11px] text-slate-600 block">
                CNPJ: {docData.cnpj || '33.918.271/0001-82'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                Código SAP / Conta:
              </span>
              <strong className="text-primary font-mono block">
                SAP #{docData.sapCode || '100492'}
              </strong>
              <span className="text-[11px] text-slate-600 block">
                Condição: 28 DDL (Boleto Bancário)
              </span>
            </div>
          </div>

          {/* CONTEÚDO ESPECÍFICO POR TIPO DE DOCUMENTO */}
          {docType === 'NF' && (
            <div className="space-y-3">
              <div className="p-2.5 bg-sky-50 rounded-lg border border-sky-100 flex justify-between items-center text-xs">
                <div>
                  <span className="text-muted-foreground block text-[10px]">
                    Chave de Acesso NF-e (Sefaz MG):
                  </span>
                  <span className="font-mono text-[11px] text-slate-800 font-bold">
                    3124 0918 4429 8100 0109 5500 1000 {docData.number} 1928 4712 9011
                  </span>
                </div>
                <Badge className="bg-emerald-600 text-white text-[10px]">
                  Protocolo Autorizado
                </Badge>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 text-[10px] font-bold uppercase">
                    <tr>
                      <th className="p-2">Item / Material</th>
                      <th className="p-2 text-center">NCM</th>
                      <th className="p-2 text-center">Peso Líquido</th>
                      <th className="p-2 text-right">Valor Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="p-2">
                        <strong className="block text-slate-800">
                          {docData.items?.[0] || 'Viga Laminada I / W ASTM A572 Grau 50'}
                        </strong>
                        <span className="text-[10px] text-muted-foreground">
                          Lote Usina Gerdau: 99428-A
                        </span>
                      </td>
                      <td className="p-2 text-center font-mono text-[11px]">7216.33.00</td>
                      <td className="p-2 text-center font-mono font-bold">
                        {formatWeight(docData.tons || 8.5, 1)}
                      </td>
                      <td className="p-2 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(docData.value || 52700)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {docType === 'BOLETO' && (
            <div className="space-y-3">
              <div className="p-3 bg-white rounded-lg border border-slate-300 space-y-2">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-bold text-sm text-slate-900 font-mono">
                    BANCO ITAÚ 341-7
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-800">
                    {docData.barcode || '34191.79001 01043.510047 91020.150008 4 98120000527000'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      Data de Vencimento:
                    </span>
                    <strong className="text-rose-700 text-sm block">
                      {docData.dueDate || '28/10/2024'}
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      Valor do Documento:
                    </span>
                    <strong className="text-emerald-700 text-base font-serif block">
                      {formatCurrency(docData.value || 52700)}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {docType === 'CERTIFICADO' && (
            <div className="space-y-3">
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Certificado de Conformidade Técnica — Aço Estrutural Normatizado
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
                  <div>
                    <span className="text-muted-foreground block">Norma:</span>
                    <strong>{docData.normaTecnica || 'NBR 7007 / ASTM A572 Gr50'}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Corrida / Lote:</span>
                    <strong className="font-mono">
                      {docData.loteUsinagem || 'CORR-2024-9182'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Laboratório:</span>
                    <strong>Controle de Qualidade CIAFAL</strong>
                  </div>
                </div>
                <div className="p-2 bg-slate-50 rounded border text-[10px] text-slate-600">
                  Composição Química: C (0.18%) | Mn (1.25%) | Si (0.22%) | P (0.015%) | S (0.010%)
                  | Limite de Escoamento: 375 MPa
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between gap-2 pt-2">
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Assinatura digital válida
            (ICP-Brasil)
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="h-8 text-xs gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" /> Imprimir
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={downloading}
              onClick={handleDownload}
              className="h-8 text-xs bg-primary text-white gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> {downloading ? 'Baixando...' : 'Baixar PDF'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
