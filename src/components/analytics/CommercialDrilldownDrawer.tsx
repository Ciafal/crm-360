import React from 'react'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ChevronRight,
  Package,
  Layers,
  User,
  FileText,
  ShoppingCart,
  TrendingUp,
  CreditCard,
  Truck,
  ExternalLink,
} from 'lucide-react'
import { cn, formatNumberBR, formatCurrency, formatWeight } from '@/lib/utils'

export type DrilldownLevel = 'GERAL' | 'VENDEDOR' | 'CLIENTE' | 'PRODUTO' | 'COTACAO' | 'PEDIDO'

export interface DrilldownContextData {
  level: DrilldownLevel
  title: string
  subtitle?: string
  entityId?: string
  entityName?: string
  realizadoTons?: number
  metaTons?: number
  faturamentoBrl?: number
  margemPct?: number
  precoMedioKg?: number
  itensRelacionados?: Array<{
    id: string
    title: string
    subtitle: string
    tons?: number
    faturamento?: number
    status?: string
    levelTarget: DrilldownLevel
  }>
}

export interface CommercialDrilldownDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: DrilldownContextData | null
  onDrillNext?: (targetLevel: DrilldownLevel, item: any) => void
  onNavigateToEntity?: (level: DrilldownLevel, id: string) => void
}

export function CommercialDrilldownDrawer({
  open,
  onOpenChange,
  data,
  onDrillNext,
  onNavigateToEntity,
}: CommercialDrilldownDrawerProps) {
  if (!data) return null

  const getBreadcrumbs = () => {
    const steps: DrilldownLevel[] = ['GERAL', 'VENDEDOR', 'CLIENTE', 'PRODUTO', 'COTACAO', 'PEDIDO']
    const currentIndex = steps.indexOf(data.level)
    return steps.slice(0, Math.max(currentIndex + 1, 1))
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-w-4xl mx-auto max-h-[85vh] p-4 sm:p-6 bg-white rounded-t-3xl border-t">
        <DrawerHeader className="px-0 pt-0 pb-3 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground mb-1.5 font-medium">
            {getBreadcrumbs().map((b, idx) => (
              <React.Fragment key={b}>
                {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-400" />}
                <span
                  className={cn(b === data.level ? 'text-primary font-bold' : 'text-slate-600')}
                >
                  {b}
                </span>
              </React.Fragment>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <DrawerTitle className="font-serif text-xl font-bold text-primary">
                {data.title}
              </DrawerTitle>
              {data.subtitle && (
                <DrawerDescription className="text-xs text-muted-foreground mt-0.5">
                  {data.subtitle}
                </DrawerDescription>
              )}
            </div>

            <Badge variant="outline" className="text-xs font-mono bg-slate-50 text-slate-700">
              SAP ECC Analytics Drill-down
            </Badge>
          </div>
        </DrawerHeader>

        {/* INDICADORES CONTEXTUAIS DA ENTIDADE (VOLUME, FATURAMENTO, PREÇO MÉDIO, MARGEM) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4">
          {data.realizadoTons !== undefined && (
            <div className="p-3 bg-slate-50 rounded-2xl border text-xs">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                Volume Total
              </span>
              <strong className="text-slate-900 font-serif text-base block mt-0.5">
                {formatWeight(data.realizadoTons, 0)}
              </strong>
            </div>
          )}

          {data.faturamentoBrl !== undefined && (
            <div className="p-3 bg-slate-50 rounded-2xl border text-xs">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                Faturamento
              </span>
              <strong className="text-primary font-serif text-base block mt-0.5">
                {formatCurrency(data.faturamentoBrl)}
              </strong>
            </div>
          )}

          {data.precoMedioKg !== undefined && (
            <div className="p-3 bg-slate-50 rounded-2xl border text-xs">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                Preço Médio / kg
              </span>
              <strong className="text-slate-900 font-serif text-base block mt-0.5">
                R$ {formatNumberBR(data.precoMedioKg, 2)}/kg
              </strong>
            </div>
          )}

          {data.margemPct !== undefined && (
            <div className="p-3 bg-slate-50 rounded-2xl border text-xs">
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                Margem Contribuição
              </span>
              <strong className="text-emerald-700 font-serif text-base block mt-0.5">
                {formatNumberBR(data.margemPct, 1)}%
              </strong>
            </div>
          )}
        </div>

        {/* LISTAGEM DE ENTIDADES ANINHADAS (Ex: Produtos dentro do Cliente, Cotações dentro do Produto) */}
        <div className="space-y-2 overflow-y-auto max-h-[35vh] pr-1">
          <span className="text-[11px] uppercase font-bold text-slate-700 tracking-wider block">
            Detalhamento & Sub-itens Relacionados:
          </span>

          {data.itensRelacionados && data.itensRelacionados.length > 0 ? (
            <div className="space-y-1.5">
              {data.itensRelacionados.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onDrillNext?.(item.levelTarget, item)}
                  className="p-3 bg-slate-50/80 hover:bg-slate-100 rounded-xl border border-slate-200/80 cursor-pointer transition-all flex items-center justify-between text-xs"
                >
                  <div>
                    <strong className="text-slate-900 block">{item.title}</strong>
                    <span className="text-[11px] text-muted-foreground">{item.subtitle}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {item.tons !== undefined && (
                      <span className="font-mono font-bold text-slate-800">
                        {formatWeight(item.tons, 0)}
                      </span>
                    )}
                    {item.faturamento !== undefined && (
                      <span className="font-mono text-primary font-semibold">
                        {formatCurrency(item.faturamento)}
                      </span>
                    )}
                    {item.status && (
                      <Badge className="text-[9px] bg-slate-200 text-slate-800 border-none">
                        {item.status}
                      </Badge>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-muted-foreground border rounded-2xl bg-slate-50">
              Nenhum sub-registro adicional encontrado no nível atual.
            </div>
          )}
        </div>

        <DrawerFooter className="px-0 pb-0 pt-4 border-t flex flex-row items-center justify-between">
          <DrawerClose asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs rounded-xl">
              Fechar Drill-down
            </Button>
          </DrawerClose>

          {data.entityId && onNavigateToEntity && (
            <Button
              size="sm"
              onClick={() => onNavigateToEntity(data.level, data.entityId!)}
              className="h-8 text-xs bg-primary hover:bg-primary/90 text-white gap-1.5 rounded-xl shadow-xs"
            >
              <span>Abrir Cadastro 360º</span>
              <ExternalLink className="w-3 h-3" />
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
