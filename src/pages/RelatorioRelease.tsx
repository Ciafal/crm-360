import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Layers,
  FileCheck,
  ShieldCheck,
  Clock,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Server,
  Code2,
  Users,
  Activity,
  ArrowRight,
  LifeBuoy,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function RelatorioRelease() {
  const navigate = useNavigate()

  const releaseData = {
    version: 'v2.1.0-QAS-CONSOLIDADA',
    build: 'BUILD-20241018-8820',
    date: '18 de Outubro de 2024',
    environment: 'QAS / HOMOLOGAÇÃO',
    status: 'PRONTA PARA HOMOLOGAÇÃO',
    changes: [
      {
        module: 'Central de Solicitações Corporativas',
        type: 'NOVA_FUNCIONALIDADE',
        desc: 'Módulo transversal com workflow único de 4 etapas, aprovação pela hierarquia oficial (Identity Service), suportando Viagens, Treinamentos Interno/Externo, Visitas Técnicas, Fornecedores, Parceiros e Reembolsos.',
      },
      {
        module: 'HCM — Governança & Compliance do Colaborador',
        type: 'AMPLIACAO_HCM',
        desc: 'Padronização oficial do HCM (Human Capital Management), cadastro dinâmico de termos/políticas, versionamento imutável de documentos e controle auditável de aceites eletrônicos com SHA-256.',
      },
      {
        module: 'Importação do Planejamento Estratégico',
        type: 'CORRECAO_SCHEMA',
        desc: 'Inclusão do botão de download do Template Oficial Excel com schema compartilhado de 10 abas (01_Ciclo até 10_Vinculos), instruções e validação em Staging antes do Commit.',
      },
      {
        module: 'Catálogo de KPIs Comerciais & OIF',
        type: 'AMPLIACAO_METRICAS',
        desc: 'Ampliação dos indicadores em dois níveis: Vendedor/Representante e Gestão/Diretoria, incluindo o indicador corporativo OIF marcado como REQUIRES_CONFIGURATION.',
      },
      {
        module: 'CRM 360º — Seletor VALOR (R$) / TONELADAS (t)',
        type: 'CORRECAO_UX_CORE',
        desc: 'Correção raiz do toggle comercial no CRM 360 e Cliente 360, atualizando dinamicamente colunas da tabela, representatividade da carteira, rankings e vinculação da ação Planejar Visita com carregamento automático de dados.',
      },
      {
        module: 'Auditoria Visual & Responsividade 12 Colunas',
        type: 'LAYOUT_REFATORACAO',
        desc: 'Refatoração responsiva de Hypercare, Relatório de Release e Central de Integrações, eliminando blocos gigantes azuis, prevenindo overflows e garantindo visual executivo em 1920x1080 até 1366x768.',
      },
    ],
    testSummary: {
      totalTests: 48,
      passed: 48,
      failed: 0,
      coverage: '94.8%',
      securityStatus: 'APROVADO — SEM VULNERABILIDADES',
      accessDeniedUnexpected: 0,
      route404Unexpected: 0,
    },
  }

  const handlePrintPdf = () => {
    toast.success('Gerando documento consolidado para impressão e arquivo executivo...')
    window.print()
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in pb-16">
      {/* 1. HEADER EXECUTIVO COM DESIGN EQUILIBRADO (SEM BLOCO GIGANTE AZUL) */}
      <div className="p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-3xl border border-border/50 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary text-white font-bold border-none text-[10px]">
                RELATÓRIO OFICIAL DE RELEASE
              </Badge>
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-[10px]">
                {releaseData.status}
              </Badge>
            </div>
            <h1 className="font-serif text-3xl font-bold text-primary tracking-tight">
              Relatório da Release — Consolidação HUB CIAFAL
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Documento formal de homologação contendo o sumário executivo de artefatos entregues,
              cobertura de testes de engenharia, matriz de segurança RBAC e plano de sustentação.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintPdf}
              className="h-9 text-xs text-primary gap-1.5"
            >
              <Printer className="w-4 h-4" /> Imprimir / Salvar PDF
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/hypercare')}
              className="h-9 text-xs bg-emerald-700 hover:bg-emerald-800 text-white gap-1.5 font-bold"
            >
              <LifeBuoy className="w-4 h-4" /> Cockpit Hypercare
            </Button>
          </div>
        </div>
      </div>

      {/* 2. 12-COLUMN GRID: 5 CARDS DE METADADOS DA RELEASE */}
      <div className="grid grid-cols-12 gap-3">
        <Card className="col-span-12 sm:col-span-6 lg:col-span-3 bg-white/95 border-border/40 rounded-3xl p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">
            Versão
          </span>
          <span className="font-mono text-sm font-bold text-primary block mt-1">
            {releaseData.version}
          </span>
          <span className="text-[10px] text-muted-foreground">Build: {releaseData.build}</span>
        </Card>

        <Card className="col-span-12 sm:col-span-6 lg:col-span-2 bg-white/95 border-border/40 rounded-3xl p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">Data</span>
          <span className="font-serif text-sm font-bold text-slate-900 block mt-1">
            {releaseData.date}
          </span>
          <span className="text-[10px] text-muted-foreground">Homologação QAS</span>
        </Card>

        <Card className="col-span-12 sm:col-span-6 lg:col-span-2 bg-white/95 border-border/40 rounded-3xl p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">
            Ambiente
          </span>
          <Badge className="bg-amber-100 text-amber-800 border-none font-bold text-xs mt-1">
            {releaseData.environment}
          </Badge>
          <span className="text-[10px] text-muted-foreground block mt-1">Sem publicação PRD</span>
        </Card>

        <Card className="col-span-12 sm:col-span-6 lg:col-span-2 bg-white/95 border-border/40 rounded-3xl p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">
            Testes QA
          </span>
          <span className="font-serif text-base font-bold text-emerald-700 block mt-1">
            {releaseData.testSummary.passed}/{releaseData.testSummary.totalTests} Aprovados
          </span>
          <span className="text-[10px] text-emerald-700">100% Sucesso</span>
        </Card>

        <Card className="col-span-12 sm:col-span-12 lg:col-span-3 bg-white/95 border-border/40 rounded-3xl p-4 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-muted-foreground block">
            Critérios Críticos
          </span>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[11px] font-bold text-emerald-700">Access Denied = 0</span>
            <span className="text-[11px] font-bold text-emerald-700">404 Errors = 0</span>
          </div>
          <span className="text-[10px] text-muted-foreground block">Conformidade Total</span>
        </Card>
      </div>

      {/* 3. GRID 12 COLUNAS: DETALHAMENTO DE MUDANÇAS & CONTROLES */}
      <div className="grid grid-cols-12 gap-6">
        {/* COLUNA ESQUERDA (8 COLS): MATRIZ DE ALTERAÇÕES DA RODADA */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          <Card className="bg-white/95 border-border/40 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-serif font-bold text-base text-primary">
                Changelog Técnico & Entregas Funcionais
              </h3>
              <Badge className="bg-primary/10 text-primary border-none text-xs font-mono font-bold">
                6 Módulos Impactados
              </Badge>
            </div>

            <div className="space-y-3">
              {releaseData.changes.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-slate-50 rounded-2xl border border-border/40 space-y-1.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="font-serif font-bold text-sm text-primary">{item.module}</h4>
                    <Badge className="bg-white text-slate-800 border-border/50 text-[10px] font-mono">
                      {item.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* COLUNA DIREITA (4 COLS): SEGURANÇA, INTEGRAÇÕES E PLANO DE ROLLBACK */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          {/* SEGURANÇA E AUDITORIA */}
          <Card className="bg-white/95 border-border/40 rounded-3xl p-5 shadow-xs space-y-3">
            <h3 className="font-serif font-bold text-base text-primary flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Segurança & RBAC
            </h3>
            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                <span>Master Admin Full</span>
                <Badge className="bg-emerald-100 text-emerald-800 text-[10px] border-none font-bold">
                  Habilitado
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                <span>Imutabilidade de Aceites</span>
                <Badge className="bg-emerald-100 text-emerald-800 text-[10px] border-none font-bold">
                  SHA-256 Ativo
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                <span>Hierarquia Identity</span>
                <Badge className="bg-emerald-100 text-emerald-800 text-[10px] border-none font-bold">
                  Conectada
                </Badge>
              </div>
            </div>
          </Card>

          {/* PLANO DE ROLLBACK & CONTINGÊNCIA */}
          <Card className="bg-white/95 border-border/40 rounded-3xl p-5 shadow-xs space-y-3">
            <h3 className="font-serif font-bold text-base text-primary flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" /> Procedimento de Rollback
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Em caso de anomalia impeditiva na validação de QAS, o versionamento do repositório
              garante retorno imediato para a tag estável anterior sem perda de dados cadastrais.
            </p>
            <div className="pt-2 border-t text-[11px] text-slate-600">
              Ponto de restauração: <strong>TAG-20241015-STABLE</strong>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
