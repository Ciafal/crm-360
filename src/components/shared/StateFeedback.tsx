import React from 'react'
import { Loader2, AlertCircle, Inbox, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PageLoadingStateProps {
  message?: string
  className?: string
}

export function PageLoadingState({
  message = 'Carregando informações...',
  className,
}: PageLoadingStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center min-h-[320px] p-8 text-center rounded-2xl bg-white/60 dark:bg-slate-900/40 border border-border/40 backdrop-blur-sm',
        className,
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 text-primary animate-pulse">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
      <p className="text-sm font-medium text-foreground/80">{message}</p>
      <p className="text-xs text-muted-foreground mt-1">Aguarde um instante</p>
    </div>
  )
}

interface PageEmptyStateProps {
  title?: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  action?: React.ReactNode
  className?: string
}

export function PageEmptyState({
  title = 'Não existem dados disponíveis para este período.',
  description,
  icon: Icon = Inbox,
  action,
  className,
}: PageEmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center min-h-[320px] p-8 text-center rounded-2xl bg-white/60 dark:bg-slate-900/40 border border-dashed border-border/60 backdrop-blur-sm',
        className,
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-4 text-muted-foreground">
        <Icon className="w-6 h-6" />
      </div>
      <p className="text-sm font-semibold text-foreground/90 max-w-md">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground mt-1 max-w-sm leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

interface PageErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
}

export function PageErrorState({
  title = 'Não foi possível carregar os dados.',
  description = 'Ocorreu uma instabilidade momentânea ou o serviço está temporariamente indisponível.',
  onRetry,
  className,
}: PageErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center min-h-[320px] p-8 text-center rounded-2xl bg-destructive/5 border border-destructive/20 backdrop-blur-sm',
        className,
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4 text-destructive">
        <AlertCircle className="w-6 h-6" />
      </div>
      <p className="text-sm font-semibold text-destructive max-w-md">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground mt-1 max-w-sm leading-relaxed">{description}</p>
      )}
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-4 gap-2 border-destructive/30 hover:bg-destructive/10 hover:text-destructive text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Tentar novamente
        </Button>
      )}
    </div>
  )
}
