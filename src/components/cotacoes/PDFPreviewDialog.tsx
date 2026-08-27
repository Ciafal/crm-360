import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Printer, Download, Building2, CheckCircle2 } from 'lucide-react'
import type { Quotation } from '@/types/quotation'

interface PDFPreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  quotation: Quotation | null
}

export function PDFPreviewDialog({ open, onOpenChange, quotation }: PDFPreviewDialogProps) {
  if (!quotation) return null

  const formatBRL = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] bg-white rounded-3xl p-6 flex flex-col justify-between overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-3">
          <div>
            <DialogTitle className="font-serif text-lg font-bold text-primary">
              Proposta Comercial Oficial — {quotation.code} (v{quotation.version})
            </DialogTitle>
            <span className="text-xs text-muted-foreground">
              Documento gerado para visualização e impressão do cliente
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePrint}
              className="h-8 text-xs gap-1.5 rounded-xl text-primary font-semibold"
            >
              <Printer className="w-3.5 h-3.5" /> Imprimir
            </Button>
          </div>
        </DialogHeader>

        {/* CORPO DO PDF PROFISSIONAL COM IDENTIDADE VISUAL CIAFAL */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 rounded-2xl my-3 border border-border/40 font-sans text-xs space-y-6 print:m-0 print:p-0 print:border-none print:bg-white">
          {/* TOPO COM LOGO E DADOS DA EMPRESA */}
          <div className="flex items-start justify-between border-b border-primary/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="bg-[#003A70] text-white p-3 rounded-2xl shadow-sm">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-serif text-xl font-bold text-[#003A70] tracking-tight">
                  CIAFAL FERRO & AÇO
                </h2>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold block">
                  Companhia Industrial de Aços e Ferragens
                </span>
                <span className="text-[10px] text-slate-600 block">
                  CNPJ: 17.284.902/0001-85 · Contagem / MG · (31) 3399-4000
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                Cotação Comercial
              </span>
              <span className="font-mono text-lg font-bold text-[#003A70] block">
                {quotation.code}
              </span>
              <span className="text-[11px] text-slate-600">
                Emissão: <strong>{quotation.issue_date}</strong>
              </span>
              <span className="text-[11px] text-amber-800 block">
                Validade: <strong>{quotation.valid_until}</strong>
              </span>
            </div>
          </div>

          {/* DADOS DO CLIENTE & VENDEDOR */}
          <div className="grid grid-cols-2 gap-4 p-3 bg-white rounded-xl border border-border/30">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Dados do Cliente
              </span>
              <p className="font-bold text-slate-900 text-xs">{quotation.customer_name}</p>
              <p className="text-[11px] text-slate-600">
                CNPJ: {quotation.customer_cnpj || 'Consulte cadastro'} · SAP:{' '}
                {quotation.customer_sap_code}
              </p>
              <p className="text-[11px] text-slate-600">
                Contato: <strong>{quotation.contact_name}</strong>{' '}
                {quotation.contact_phone && `(${quotation.contact_phone})`}
              </p>
              {quotation.ship_to_address && (
                <p className="text-[11px] text-slate-600">
                  Local de Entrega: {quotation.ship_to_address}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                Condições Gerais & Vendedor
              </span>
              <p className="text-[11px] text-slate-800">
                Vendedor: <strong>{quotation.seller_name}</strong>
              </p>
              <p className="text-[11px] text-slate-800">
                Condição de Pagamento: <strong>{quotation.payment_terms}</strong>
              </p>
              <p className="text-[11px] text-slate-800">
                Frete: <strong>{quotation.incoterm}</strong> ({quotation.freight_type})
              </p>
              <p className="text-[11px] text-slate-800">
                Moeda: <strong>{quotation.currency || 'BRL (R$)'}</strong>
              </p>
            </div>
          </div>

          {/* TABELA DE PRODUTOS */}
          <div className="space-y-2">
            <h3 className="font-serif text-xs font-bold uppercase tracking-wider text-[#003A70]">
              Itens da Proposta Comercial
            </h3>

            <table className="w-full text-left text-xs border-collapse bg-white rounded-xl overflow-hidden border border-border/40">
              <thead className="bg-[#003A70] text-white text-[10px] uppercase">
                <tr>
                  <th className="py-2.5 px-3">Item</th>
                  <th className="py-2.5 px-3">Material & Descrição</th>
                  <th className="py-2.5 px-3 text-center">Qtd</th>
                  <th className="py-2.5 px-3 text-center">UM</th>
                  <th className="py-2.5 px-3 text-right">Preço Unit. (R$)</th>
                  <th className="py-2.5 px-3 text-right">Total (R$)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {quotation.items.map((it, idx) => (
                  <tr key={it.id || idx}>
                    <td className="py-2.5 px-3 font-mono text-muted-foreground">
                      {(idx + 1) * 10}
                    </td>
                    <td className="py-2.5 px-3">
                      <strong className="text-slate-900 block">{it.material_code}</strong>
                      <span className="text-[11px] text-muted-foreground">{it.description}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold">{it.quantity}</td>
                    <td className="py-2.5 px-3 text-center uppercase">{it.unit}</td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      {formatBRL(it.final_price)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-serif font-bold text-slate-900">
                      {formatBRL(it.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* TOTAIS DA COTAÇÃO */}
          <div className="flex justify-end">
            <div className="w-72 p-3 bg-white rounded-xl border border-border/30 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal dos Produtos:</span>
                <span className="font-mono">{formatBRL(quotation.subtotal)}</span>
              </div>
              {quotation.freight_value > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Frete ({quotation.incoterm}):</span>
                  <span className="font-mono">{formatBRL(quotation.freight_value)}</span>
                </div>
              )}
              {quotation.discount_total > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Desconto Comercial:</span>
                  <span className="font-mono">-{formatBRL(quotation.discount_total)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border/40 pt-2 font-bold text-sm text-[#003A70]">
                <span>TOTAL GERAL:</span>
                <span className="font-serif text-base text-emerald-700">
                  {formatBRL(quotation.total_value)}
                </span>
              </div>
            </div>
          </div>

          {/* OBSERVAÇÕES E NOTAS */}
          <div className="p-3 bg-white rounded-xl border border-border/30 space-y-1 text-[11px] text-slate-600">
            <span className="font-bold text-slate-900">Observações & Prazos:</span>
            <p>
              1. Preços válidos até a data limite indicada nesta proposta, sujeitos à
              disponibilidade de estoque no momento do fechamento formal.
            </p>
            <p>
              2. Faturamento via CIAFAL Matriz Contagem/MG. O pedido oficial será implantado após
              confirmação e aceite deste documento.
            </p>
            {quotation.notes && (
              <p className="text-slate-800 font-medium pt-1">{quotation.notes}</p>
            )}
          </div>
        </div>

        <DialogFooter className="border-t pt-3 flex items-center justify-between sm:justify-between">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> CIAFAL Document Engine v2.1
          </span>
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs bg-[#003A70] text-white rounded-xl font-bold"
          >
            Fechar Visualização
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
