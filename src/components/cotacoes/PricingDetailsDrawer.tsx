import React from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { DollarSign, Percent, ShieldCheck, Scale, ArrowDownRight, CheckCircle2 } from 'lucide-react'
import type { QuotationItem, QuotationPricingSnapshot } from '@/types/quotation'

interface PricingDetailsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: QuotationItem | null
  pricingSnapshot?: QuotationPricingSnapshot
}

export function PricingDetailsDrawer({
  open,
  onOpenChange,
  item,
  pricingSnapshot,
}: PricingDetailsDrawerProps) {
  if (!item) return null

  const formatBRL = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const taxesPct = pricingSnapshot?.taxes_pct || 18.25
  const rawCost = pricingSnapshot?.raw_cost || item.sap_price * 0.7
  const baseMargin = pricingSnapshot?.standard_margin_pct || 22.5
  const effectiveMargin =
    item.proposed_price > 0
      ? (((item.proposed_price - rawCost) / item.proposed_price) * 100).toFixed(1)
      : '0'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[360px] sm:w-[440px] bg-white text-slate-900 border-l p-6 flex flex-col justify-between"
      >
        <div className="space-y-5 overflow-y-auto pr-1">
          <SheetHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 text-primary rounded-xl">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <SheetTitle className="font-serif text-lg font-bold text-primary">
                  Formação de Preço SAP
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground">
                  Composição analítica do esquema de preços ZCIAFAL
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {/* Dados do Item */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-border/40 space-y-1 text-xs">
            <span className="font-mono font-bold text-primary">{item.material_code}</span>
            <p className="font-medium text-slate-800">{item.description}</p>
            <div className="flex items-center justify-between pt-1 border-t border-border/20 text-[11px] text-muted-foreground">
              <span>
                Quantidade:{' '}
                <strong>
                  {item.quantity} {item.unit}
                </strong>
              </span>
              <span>
                Preço SAP: <strong>{formatBRL(item.sap_price)}</strong>
              </span>
            </div>
          </div>

          {/* Cascata da Composição de Preço */}
          <div className="space-y-2 text-xs">
            <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Condições Comerciais SAP ECC
            </h4>

            <div className="divide-y divide-border/20 border border-border/40 rounded-2xl overflow-hidden bg-white">
              <div className="p-2.5 flex items-center justify-between">
                <span className="text-slate-600">Preço Tabela Oficial (PR00)</span>
                <span className="font-mono font-semibold">{formatBRL(item.sap_price)}</span>
              </div>

              <div className="p-2.5 flex items-center justify-between bg-slate-50/50">
                <div className="flex flex-col">
                  <span className="text-slate-600">Preço Proposto Vendedor</span>
                  <span className="text-[10px] text-muted-foreground">
                    Desvio: {item.deviation_pct.toFixed(2)}%
                  </span>
                </div>
                <span className="font-mono font-bold text-primary">
                  {formatBRL(item.proposed_price)}
                </span>
              </div>

              <div className="p-2.5 flex items-center justify-between">
                <span className="text-slate-600">Custo Base de Reposição Usina</span>
                <span className="font-mono text-muted-foreground">{formatBRL(rawCost)}</span>
              </div>

              <div className="p-2.5 flex items-center justify-between bg-slate-50/50">
                <div className="flex flex-col">
                  <span className="text-slate-600">Tributos & Encargos Fiscais</span>
                  <span className="text-[10px] text-muted-foreground">ICMS + PIS + COFINS</span>
                </div>
                <span className="font-mono text-slate-700">{taxesPct}%</span>
              </div>

              <div className="p-2.5 flex items-center justify-between">
                <span className="text-slate-600">Margem Contribuição Projetada</span>
                <div className="flex items-center gap-1.5">
                  <Badge
                    className={`font-mono text-[10px] font-bold border-none ${
                      Number(effectiveMargin) >= 18
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {effectiveMargin}%
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">(Padrão: {baseMargin}%)</span>
                </div>
              </div>

              <div className="p-2.5 flex items-center justify-between bg-primary/5">
                <span className="font-bold text-primary">
                  Total do Item ({item.quantity} {item.unit})
                </span>
                <span className="font-serif font-bold text-base text-emerald-700">
                  {formatBRL(item.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Justificativa de Desvio (se houver) */}
          {item.price_justification && (
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs space-y-1">
              <span className="font-bold text-amber-900 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-700" /> Justificativa de Exceção
              </span>
              <p className="text-[11px] text-amber-800">{item.price_justification}</p>
            </div>
          )}
        </div>

        <div className="pt-4 border-t text-[11px] text-muted-foreground text-center">
          Snapshot auditável registrado no CRM & SAP NetWeaver
        </div>
      </SheetContent>
    </Sheet>
  )
}
