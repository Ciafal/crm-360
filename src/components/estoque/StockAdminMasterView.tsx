import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ShieldAlert,
  Sliders,
  Building2,
  Lock,
  Clock,
  History,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
} from 'lucide-react'
import { stockService } from '@/services/stock_service'
import type { StockGovernanceParam, StockAuditLog } from '@/types/stock'
import { useToast } from '@/hooks/use-toast'

interface StockAdminMasterViewProps {
  governanceParams: StockGovernanceParam[]
  auditLogs: StockAuditLog[]
  userRole?: string
  onSaveParams?: () => void
}

export function StockAdminMasterView({
  governanceParams,
  auditLogs,
  userRole,
  onSaveParams,
}: StockAdminMasterViewProps) {
  const { toast } = useToast()
  const [paramsList, setParamsList] = useState<StockGovernanceParam[]>(governanceParams)
  const [selectedAuditTab, setSelectedAuditTab] = useState<'AUDIT' | 'PARAMS'>('PARAMS')

  const handleUpdateParam = (paramId: string, updatedValue: any) => {
    const updated = paramsList.map((p) => {
      if (p.id === paramId) {
        return {
          ...p,
          paramValue: updatedValue,
          updatedAt: 'Agora',
          lastModifiedBy: 'Administrador Master',
        }
      }
      return p
    })
    setParamsList(updated)
    stockService.saveStoredGovernanceParams(updated)

    stockService.registerAuditLog({
      userId: 'qas-admin_teste',
      userName: 'Administrador Master',
      userRole: 'administrador',
      actionType: 'ALTERACAO_PARAMETRO',
      targetObject: 'stock_governance_params',
      targetId: paramId,
      details: `Parâmetro de governança ${paramId} atualizado com novas regras de estoque.`,
    })

    toast({
      title: 'Parâmetro Atualizado!',
      description: 'As novas regras de estoque e governança já estão ativas no sistema.',
    })
    if (onSaveParams) onSaveParams()
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. CABEÇALHO ADMIN MASTER */}
      <Card className="p-6 bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-rose-600 text-white font-bold text-xs border-none">
                ADMIN MASTER CIAFAL
              </Badge>
              <Badge
                variant="outline"
                className="text-xs text-slate-300 border-slate-700 font-mono"
              >
                PARAMETRIZAÇÃO & AUDITORIA
              </Badge>
            </div>
            <h3 className="font-serif text-2xl font-bold text-white">
              Governança de Estoque, Centros e Trilha de Auditoria
            </h3>
            <p className="text-xs text-slate-400 max-w-2xl">
              Configuração central de faixas de aging, critérios de parados, centros de distribuição
              autorizados, regras de isolamento de vendedores e monitoramento de logs.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-800 p-1.5 rounded-2xl">
            <button
              onClick={() => setSelectedAuditTab('PARAMS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedAuditTab === 'PARAMS'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Parâmetros de Governança
            </button>
            <button
              onClick={() => setSelectedAuditTab('AUDIT')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedAuditTab === 'AUDIT'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Trilha de Auditoria ({auditLogs.length})
            </button>
          </div>
        </div>
      </Card>

      {/* 2. TAB DE PARÂMETROS */}
      {selectedAuditTab === 'PARAMS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
          {/* Card: Critérios de Parados */}
          <Card className="p-5 bg-white/95 backdrop-blur-md rounded-3xl border border-border/60 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 rounded-xl text-amber-800">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif text-base font-bold text-slate-900">
                    Critérios de Classificação de Parados
                  </h4>
                  <span className="text-[10px] text-muted-foreground">
                    Dias sem movimentação para alteração de status
                  </span>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] bg-slate-50">
                Ativo
              </Badge>
            </div>

            <div className="space-y-3 pt-2 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] font-bold text-slate-700">Atenção (dias)</Label>
                  <Input
                    type="number"
                    defaultValue="30"
                    className="h-8 text-xs rounded-xl mt-1 bg-white"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-bold text-slate-700">
                    Baixa Movimentação (dias)
                  </Label>
                  <Input
                    type="number"
                    defaultValue="60"
                    className="h-8 text-xs rounded-xl mt-1 bg-white"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-bold text-slate-700">
                    Estoque Parado (dias)
                  </Label>
                  <Input
                    type="number"
                    defaultValue="120"
                    className="h-8 text-xs rounded-xl mt-1 bg-white"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-bold text-slate-700">
                    Crítico / Liquidação (dias)
                  </Label>
                  <Input
                    type="number"
                    defaultValue="180"
                    className="h-8 text-xs rounded-xl mt-1 bg-white"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <Button
                  size="sm"
                  onClick={() => handleUpdateParam('prm-02', { updated: true })}
                  className="h-8 text-xs rounded-xl bg-primary hover:bg-primary/90 text-white font-bold"
                >
                  Salvar Regras de Parados
                </Button>
              </div>
            </div>
          </Card>

          {/* Card: SLA de Checagem WMS */}
          <Card className="p-5 bg-white/95 backdrop-blur-md rounded-3xl border border-border/60 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 rounded-xl text-primary">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif text-base font-bold text-slate-900">
                    SLA de Atendimento WMS / Pátio
                  </h4>
                  <span className="text-[10px] text-muted-foreground">
                    Prazos máximos para retorno de checagem física
                  </span>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] bg-slate-50">
                Ativo
              </Badge>
            </div>

            <div className="space-y-3 pt-2 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-[11px] font-bold text-rose-700">Urgente (horas)</Label>
                  <Input
                    type="number"
                    defaultValue="4"
                    className="h-8 text-xs rounded-xl mt-1 bg-white"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-bold text-amber-700">Alta (horas)</Label>
                  <Input
                    type="number"
                    defaultValue="12"
                    className="h-8 text-xs rounded-xl mt-1 bg-white"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-bold text-slate-700">Normal (horas)</Label>
                  <Input
                    type="number"
                    defaultValue="24"
                    className="h-8 text-xs rounded-xl mt-1 bg-white"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <Button
                  size="sm"
                  onClick={() => handleUpdateParam('prm-03', { updated: true })}
                  className="h-8 text-xs rounded-xl bg-primary hover:bg-primary/90 text-white font-bold"
                >
                  Salvar SLAs de Checagem
                </Button>
              </div>
            </div>
          </Card>

          {/* Card: Isolamento & Centros Habilitados */}
          <Card className="p-5 bg-white/95 backdrop-blur-md rounded-3xl border border-border/60 shadow-xs space-y-4 md:col-span-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 rounded-xl text-emerald-800">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif text-base font-bold text-slate-900">
                    Matriz de Visibilidade de Centros e Famílias
                  </h4>
                  <span className="text-[10px] text-muted-foreground">
                    Regras de isolamento RBAC por centro SAP e grupo de mercadorias
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <strong className="text-slate-900 block text-xs">1000 - Contagem Matriz</strong>
                <p className="text-[11px] text-muted-foreground">
                  Pátio Central, Perfis, Chapas, Bobinas e Vergalhões CA-50.
                </p>
                <Badge className="bg-emerald-100 text-emerald-800 border-none text-[9px] font-bold">
                  Livre para Vendedores MG
                </Badge>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <strong className="text-slate-900 block text-xs">2000 - Betim Industrial</strong>
                <p className="text-[11px] text-muted-foreground">
                  Tubos Schedule, Trefilados, Inox 304 e Aços Especiais.
                </p>
                <Badge className="bg-blue-100 text-blue-800 border-none text-[9px] font-bold">
                  Restrito a Vendedores Industriais
                </Badge>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <strong className="text-slate-900 block text-xs">3000 - Filial SP</strong>
                <p className="text-[11px] text-muted-foreground">
                  Centro de Distribuição Regional São Paulo / Interior.
                </p>
                <Badge className="bg-purple-100 text-purple-800 border-none text-[9px] font-bold">
                  Exclusivo Carteira SP
                </Badge>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 3. TAB DE TRILHA DE AUDITORIA */}
      {selectedAuditTab === 'AUDIT' && (
        <Card className="p-5 bg-white/95 backdrop-blur-md rounded-3xl border border-border/60 shadow-xs space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-slate-100 rounded-xl text-slate-800">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-serif text-base font-bold text-slate-900">
                  Trilha de Auditoria em Tempo Real (Logs Imutáveis)
                </h4>
                <p className="text-xs text-muted-foreground">
                  Registro de todas as consultas, checagens, exportações, chamadas de IA e
                  integrações.
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs font-mono">
              Total: {auditLogs.length} eventos
            </Badge>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary/10 text-primary border-none text-[9px] font-bold">
                      {log.actionType}
                    </Badge>
                    <strong className="text-slate-900">{log.userName}</strong>
                    <span className="text-[10px] text-muted-foreground">({log.userRole})</span>
                  </div>
                  <p className="text-slate-700 text-xs">{log.details}</p>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono text-[10px] text-muted-foreground block">
                    {log.createdAt}
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono">
                    Objeto: {log.targetObject}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
