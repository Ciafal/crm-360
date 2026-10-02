// src/components/gestao-clientes/shared/GestaoClientesUiKit.tsx
// Componentes reutilizáveis padronizados do Design System CIAFAL para o CRM 360º / Gestão de Clientes.
import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LucideIcon, AlertTriangle, CheckCircle2, Info, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SemanticVariant = 'default' | 'positive' | 'warning' | 'critical' | 'neutral'

/**
 * Mapeamento Semântico CIAFAL (Diretriz 3):
 * - normal / informativo = azul CIAFAL (#003A70 / sky)
 * - positivo / meta atingida = verde discreto (emerald-700 / #15803d)
 * - atenção = âmbar corporativo (amber-700 / #b45309)
 * - crítico = vermelho corporativo (red-700 / #b91c1c)
 * - neutro / inativo = slate corporativo (slate-600 / slate-100)
 */
export const SEMANTIC_STYLES: Record<
  SemanticVariant,
  {
    badge: string
    borderHover: string
    text: string
    bgLight: string
    iconBg: string
    iconText: string
    progressFill: string
  }
> = {
  default: {
    badge: 'bg-[#003A70]/10 text-[#003A70] border-[#003A70]/30',
    borderHover: 'hover:border-[#003A70]/50',
    text: 'text-[#003A70]',
    bgLight: 'bg-[#EBF3FA]',
    iconBg: 'bg-[#003A70]/10 border-[#003A70]/20',
    iconText: 'text-[#003A70]',
    progressFill: 'bg-[#003A70]',
  },
  positive: {
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    borderHover: 'hover:border-emerald-300',
    text: 'text-emerald-800',
    bgLight: 'bg-emerald-50/70',
    iconBg: 'bg-emerald-100 border-emerald-200',
    iconText: 'text-emerald-700',
    progressFill: 'bg-emerald-700',
  },
  warning: {
    badge: 'bg-amber-50 text-amber-800 border-amber-200',
    borderHover: 'hover:border-amber-300',
    text: 'text-amber-800',
    bgLight: 'bg-amber-50/70',
    iconBg: 'bg-amber-100 border-amber-200',
    iconText: 'text-amber-700',
    progressFill: 'bg-amber-600',
  },
  critical: {
    badge: 'bg-red-50 text-red-800 border-red-200',
    borderHover: 'hover:border-red-300',
    text: 'text-red-800',
    bgLight: 'bg-red-50/70',
    iconBg: 'bg-red-100 border-red-200',
    iconText: 'text-red-700',
    progressFill: 'bg-red-700',
  },
  neutral: {
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    borderHover: 'hover:border-slate-300',
    text: 'text-slate-700',
    bgLight: 'bg-slate-50',
    iconBg: 'bg-slate-100 border-slate-200',
    iconText: 'text-slate-600',
    progressFill: 'bg-slate-500',
  },
}

/**
 * 1. KpiCard Padronizado (Diretrizes 2, 4):
 * Mesma altura, mesmo raio, mesmo padding, título + ícone, KPI corporativo legível,
 * descrição e rodapé padronizados.
 */
export interface KpiCardProps {
  title: string
  kpi: string | number
  description?: string
  metaText?: string
  progressValue?: number
  variant?: SemanticVariant
  icon?: LucideIcon
  badgeLabel?: string
  footerInfo?: React.ReactNode
  onClick?: () => void
  className?: string
  active?: boolean
}

export function KpiCard({
  title,
  kpi,
  description,
  metaText,
  progressValue,
  variant = 'default',
  icon: Icon,
  badgeLabel,
  footerInfo,
  onClick,
  className,
  active = false,
}: KpiCardProps) {
  const styles = SEMANTIC_STYLES[variant]

  return (
    <Card
      onClick={onClick}
      className={cn(
        'p-3.5 rounded-2xl bg-white border border-slate-200 transition-all flex flex-col justify-between text-left shadow-2xs h-full min-h-[148px]',
        styles.borderHover,
        onClick && 'cursor-pointer hover:shadow-xs active:scale-[0.99]',
        active && 'ring-2 ring-[#003A70] border-transparent shadow-xs',
        className,
      )}
    >
      {/* Topo: Título + Ícone / Badge */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider truncate">
          {title}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {badgeLabel && (
            <Badge
              variant="outline"
              className={cn('text-[10px] px-1.5 py-0 font-medium', styles.badge)}
            >
              {badgeLabel}
            </Badge>
          )}
          {Icon && (
            <div
              className={cn(
                'p-1 rounded-lg border flex items-center justify-center',
                styles.iconBg,
              )}
            >
              <Icon className={cn('w-3.5 h-3.5', styles.iconText)} />
            </div>
          )}
        </div>
      </div>

      {/* Meio: KPI + Meta */}
      <div className="my-1.5">
        <div className="flex items-baseline gap-1.5">
          <span
            className={cn(
              'font-serif text-2xl font-bold tracking-tight',
              variant === 'critical' ? 'text-red-700' : 'text-slate-900',
            )}
          >
            {kpi}
          </span>
          {metaText && <span className="text-[10px] text-slate-500 font-medium">{metaText}</span>}
        </div>
        {description && (
          <span className="text-[11px] text-slate-500 block mt-0.5 line-clamp-1">
            {description}
          </span>
        )}
      </div>

      {/* Rodapé: Progresso ou Info complementar */}
      <div className="space-y-1 pt-1 border-t border-slate-100">
        {typeof progressValue === 'number' && (
          <ProgressBar value={progressValue} variant={variant} height="sm" />
        )}
        {footerInfo && <div className="text-[10px] text-slate-500">{footerInfo}</div>}
      </div>
    </Card>
  )
}

/**
 * 2. StatusBadge Padronizado (Diretriz 3):
 * Badges sem excesso decorativo e com contraste adequado.
 */
export interface StatusBadgeProps {
  label: string
  variant?: SemanticVariant
  className?: string
  dot?: boolean
}

export function StatusBadge({
  label,
  variant = 'default',
  className,
  dot = false,
}: StatusBadgeProps) {
  const styles = SEMANTIC_STYLES[variant]
  return (
    <Badge
      variant="outline"
      className={cn(
        'text-[10px] px-2 py-0.5 font-medium inline-flex items-center gap-1 rounded-md border',
        styles.badge,
        className,
      )}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full shrink-0',
            variant === 'critical'
              ? 'bg-red-700'
              : variant === 'warning'
                ? 'bg-amber-600'
                : variant === 'positive'
                  ? 'bg-emerald-700'
                  : 'bg-[#003A70]',
          )}
        />
      )}
      <span>{label}</span>
    </Badge>
  )
}

/**
 * 3. ProgressBar Padronizada (Diretriz 5):
 * Trilho cinza neutro (slate-100/200), preenchimento azul institucional (#003A70),
 * verde só quando meta atingida (ou explícito), vermelho/âmbar só p/ alerta real.
 */
export interface ProgressBarProps {
  value: number
  max?: number
  variant?: SemanticVariant
  showLabel?: boolean
  labelPrefix?: string
  height?: 'sm' | 'md'
  className?: string
}

export function ProgressBar({
  value,
  max = 100,
  variant = 'default',
  showLabel = false,
  labelPrefix,
  height = 'sm',
  className,
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, Math.round((value / max) * 100)))
  const styles = SEMANTIC_STYLES[variant]

  return (
    <div className={cn('w-full space-y-1', className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-[10px] text-slate-500">
          <span>{labelPrefix || 'Progresso'}</span>
          <span className="font-mono font-semibold text-slate-700">{pct}%</span>
        </div>
      )}
      <div
        className={cn(
          'w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50',
          height === 'sm' ? 'h-1.5' : 'h-2',
        )}
      >
        <div
          className={cn('h-full transition-all duration-300 rounded-full', styles.progressFill)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

/**
 * 4. SectionHeader Padronizado:
 * Título de seção em azul-marinho institucional com ícone de apoio e descrição clara.
 */
export interface SectionHeaderProps {
  title: string
  subtitle?: string
  icon?: LucideIcon
  badge?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export function SectionHeader({
  title,
  subtitle,
  icon: Icon,
  badge,
  actions,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        'p-4 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="p-2.5 rounded-xl bg-[#003A70]/10 text-[#003A70] border border-[#003A70]/20 shrink-0">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-serif text-base sm:text-lg font-bold text-[#003A70] tracking-tight">
              {title}
            </h3>
            {badge}
          </div>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap shrink-0">{actions}</div>}
    </div>
  )
}

/**
 * 5. TabNavigation Padronizada (Diretriz 7):
 * Abas ativas em azul CIAFAL (#003A70), inativas neutras, hover discreto, responsivas.
 */
export interface TabOption {
  id: string
  label: string
  count?: number
  icon?: LucideIcon
}

export interface TabNavigationProps {
  tabs: TabOption[]
  activeTab: string
  onChange: (id: string) => void
  className?: string
}

export function TabNavigation({ tabs, activeTab, onChange, className }: TabNavigationProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none',
        className,
      )}
    >
      {tabs.map((tab) => {
        const isSelected = activeTab === tab.id
        const Icon = tab.icon
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0 select-none border',
              isSelected
                ? 'bg-[#003A70] text-white border-[#003A70] font-bold shadow-2xs'
                : 'bg-white border-slate-200 text-slate-600 hover:text-[#003A70] hover:bg-slate-50',
            )}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <Badge
                className={cn(
                  'text-[10px] px-1.5 py-0 rounded-md font-mono border-none',
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600',
                )}
              >
                {tab.count}
              </Badge>
            )}
          </button>
        )
      })}
    </div>
  )
}

/**
 * 6. EmptyState Padronizado (Diretrizes 10, 12):
 * Visual limpo em fundo claro, texto conciso, ícone neutro.
 */
export interface EmptyStateProps {
  title: string
  description?: string
  icon?: LucideIcon
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  title,
  description,
  icon: Icon = Info,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center gap-2',
        className,
      )}
    >
      <div className="p-3 rounded-full bg-slate-50 text-slate-400 border border-slate-200">
        <Icon className="w-5 h-5" />
      </div>
      <strong className="text-xs font-bold text-slate-800">{title}</strong>
      {description && (
        <p className="text-[11px] text-slate-500 max-w-sm text-balance">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

/**
 * 7. AlertBlock Corporativo (Diretrizes 2, 12):
 * Alertas não-estridentes com ícone + texto corporativo legível.
 */
export interface AlertBlockProps {
  title?: string
  message: React.ReactNode
  variant?: 'info' | 'warning' | 'critical' | 'positive'
  className?: string
  icon?: LucideIcon
}

export function AlertBlock({ title, message, variant = 'info', className, icon }: AlertBlockProps) {
  const Icon =
    icon ||
    (variant === 'critical'
      ? AlertCircle
      : variant === 'warning'
        ? AlertTriangle
        : variant === 'positive'
          ? CheckCircle2
          : Info)

  const styles = {
    info: 'bg-[#EBF3FA] border-[#003A70]/20 text-[#003A70]',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    critical: 'bg-red-50 border-red-200 text-red-900',
    positive: 'bg-emerald-50 border-emerald-200 text-emerald-900',
  }[variant]

  const iconColor = {
    info: 'text-[#003A70]',
    warning: 'text-amber-700',
    critical: 'text-red-700',
    positive: 'text-emerald-700',
  }[variant]

  return (
    <div
      className={cn('p-3 rounded-xl border flex items-start gap-2.5 text-xs', styles, className)}
    >
      <Icon className={cn('w-4 h-4 shrink-0 mt-0.5', iconColor)} />
      <div className="space-y-0.5 flex-1">
        {title && <strong className="font-bold block">{title}</strong>}
        <div className="text-[11px] leading-relaxed text-slate-700">{message}</div>
      </div>
    </div>
  )
}
