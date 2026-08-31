// src/components/consultas/IndicadoresConsultasPanel.tsx
import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  CreditCard,
  Award,
  Share2,
  Clock,
  Search,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'
import { consultasService } from '@/services/consultasService'

export const IndicadoresConsultasPanel: React.FC = () => {
  const indic = consultasService.getIndicadoresGestao()
  const logs = consultasService.getLogsAuditoria()
  const solicitacoes = consultasService.getSolicitacoesFinanceiro()

  return (
    <div className="space-y-6">
      {/* Banner Superior de Governança */}
      <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary text-white rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Painel Executivo de Autosserviço & Trilha de Auditoria LGPD
            </h3>
            <p className="text-xs text-muted-foreground">
              Monitoramento em tempo real de consultas de Notas Fiscais, Boletos Bancários e
              Certificados de Qualidade.
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="bg-white text-primary border-primary/30 font-bold px-3 py-1 text-xs"
        >
          RBAC Ativo · Deny by Default
        </Badge>
      </div>

      {/* Grid de KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-slate-200/80 shadow-xs bg-white rounded-2xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground font-medium block">
                Consultas Realizadas
              </span>
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {indic.totalConsultas}
              </span>
              <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                <TrendingUp className="w-3 h-3" /> +18% esta semana
              </span>
            </div>
            <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
              <Search className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 shadow-xs bg-white rounded-2xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground font-medium block">
                Documentos Reenviados
              </span>
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {indic.totalEnvios}
              </span>
              <span className="text-[11px] text-muted-foreground block mt-0.5">
                WhatsApp: {indic.consultasPorCanal.whatsapp} · E-mail:{' '}
                {indic.consultasPorCanal.email}
              </span>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
              <Share2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 shadow-xs bg-white rounded-2xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground font-medium block">
                Tempo Médio de Busca
              </span>
              <span className="text-2xl font-black text-primary tracking-tight">
                {indic.tempoMedioLocalizarSegundos} s
              </span>
              <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">
                -85% tempo vs manual SAP
              </span>
            </div>
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200/80 shadow-xs bg-white rounded-2xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground font-medium block">
                Solicitações ao Financeiro
              </span>
              <span className="text-2xl font-black text-amber-600 tracking-tight">
                {indic.totalSolicitacoesFin}
              </span>
              <span className="text-[11px] text-muted-foreground block mt-0.5">
                SLA Médio de Atendimento: {indic.slaMedioHoras} h
              </span>
            </div>
            <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
              <CreditCard className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grid Inferior: Solicitações Financeiras + Trilha de Auditoria */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Solicitações ao Financeiro */}
        <Card className="border border-slate-200/80 shadow-xs bg-white rounded-2xl">
          <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-600" />
              Fila de 2ª Via no Financeiro (SAP FI / Bancário)
            </CardTitle>
            <Badge
              variant="outline"
              className="bg-amber-50 text-amber-800 border-amber-300 text-xs"
            >
              {solicitacoes.length} ativa(s)
            </Badge>
          </CardHeader>
          <CardContent className="p-5 space-y-3">
            {solicitacoes.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground">
                Nenhuma solicitação pendente no momento.
              </div>
            ) : (
              solicitacoes.map((sol) => (
                <div
                  key={sol.id}
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-slate-900 mr-2">{sol.protocolo}</span>
                      <span className="text-slate-600">{sol.clienteNome}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-amber-100 text-amber-900 border-amber-300 font-bold"
                    >
                      {sol.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1 border-t border-slate-200">
                    <div>
                      <span className="text-slate-400 block">Título / NF:</span>
                      <strong className="text-slate-800">
                        {sol.numeroBoleto} (NF {sol.numeroNF})
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Valor Original:</span>
                      <strong className="text-primary">
                        {sol.valorOriginal.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </strong>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 bg-white p-2 rounded border border-slate-200">
                    <strong>Motivo:</strong> {sol.motivo}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>
                      Solicitante: {sol.solicitanteNome} em {sol.dataCriacao}
                    </span>
                    <span className="font-semibold text-slate-700">SLA: {sol.prazoLimite}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Trilha de Auditoria LGPD Recente */}
        <Card className="border border-slate-200/80 shadow-xs bg-white rounded-2xl">
          <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Últimos Registros de Auditoria & LGPD
            </CardTitle>
            <Badge variant="outline" className="bg-slate-50 text-slate-700 text-xs font-mono">
              Imutável
            </Badge>
          </CardHeader>
          <CardContent className="p-5 space-y-2.5">
            {logs.slice(0, 5).map((log) => (
              <div
                key={log.id}
                className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl flex items-start justify-between text-xs gap-3"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="bg-white text-slate-800 text-[10px] font-bold"
                    >
                      {log.tipoAcao}
                    </Badge>
                    <span className="font-bold text-slate-900">{log.clienteNome}</span>
                  </div>
                  <p className="text-[11px] text-slate-600">{log.mensagemDetalhe}</p>
                  <span className="text-[10px] text-slate-400 block">
                    Por <strong>{log.usuarioNome}</strong> ({log.usuarioRole}) · IP: {log.ip}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap font-mono">
                  {log.dataHora}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
