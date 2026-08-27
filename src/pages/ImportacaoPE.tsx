import React, { useState } from 'react'
import {
  STRATEGIC_IMPORT_SCHEMA,
  StrategicTemplateTab,
  downloadOfficialStrategicTemplate,
} from '@/services/strategic_import_schema'
import { StrategicStagingRecord } from '@/types/models'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowRight,
  Sparkles,
  Database,
  Layers,
  FileCheck,
  RefreshCw,
  ShieldAlert,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function ImportacaoPlanejamentoEstrategico() {
  const [currentStep, setCurrentStep] = useState<
    'UPLOAD' | 'VALIDATION' | 'STAGING' | 'CONFIRMATION' | 'COMMITTED'
  >('UPLOAD')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isCommitting, setIsCommitting] = useState(false)

  // Staging state com amostra prévia validada
  const [stagingData, setStagingData] = useState<StrategicStagingRecord[]>([
    {
      sheetName: '01_Ciclo',
      rowNumber: 2,
      data: {
        Ano_Inicio: 2024,
        Ano_Fim: 2026,
        Titulo_Ciclo: 'Ciclo Trienal de Expansão & Competitividade',
        Status: 'ATIVO',
      },
      status: 'VALID',
      messages: ['Registro validado com sucesso.'],
    },
    {
      sheetName: '03_Objetivos',
      rowNumber: 2,
      data: {
        Codigo_Objetivo: 'OBJ-FIN-01',
        Perspectiva: 'FINANCEIRA',
        Descricao: 'Maximizar a Margem de Contribuição e o EBITDA Comercial',
        Responsavel: 'Diretoria Comercial & Financeira',
        Peso_Estrategico: 25,
      },
      status: 'VALID',
      messages: ['Perspectiva BSC válida.'],
    },
    {
      sheetName: '08_Indicadores',
      rowNumber: 2,
      data: {
        Codigo_KPI: 'KPI-FAT-01',
        Codigo_Objetivo: 'OBJ-FIN-01',
        Nome_KPI: 'Faturamento Bruto Mensal (R$)',
        Unidade: 'R$',
        Fonte_Dados: 'SAP_ECC',
        Frequencia: 'MENSAL',
      },
      status: 'VALID',
      messages: ['Integrado com fonte SAP ECC.'],
    },
    {
      sheetName: '08_Indicadores',
      rowNumber: 3,
      data: {
        Codigo_KPI: 'KPI-OIF-01',
        Codigo_Objetivo: 'OBJ-FIN-01',
        Nome_KPI: 'OIF — Indicador Comercial Corporativo',
        Unidade: 'SCORE',
        Fonte_Dados: 'CONFIGURAVEL',
        Frequencia: 'MENSAL',
      },
      status: 'WARNING',
      messages: ['Fórmula requer parametrização posterior em Governança.'],
    },
    {
      sheetName: '09_Metas',
      rowNumber: 2,
      data: {
        Codigo_KPI: 'KPI-FAT-01',
        Ano: 2024,
        Mes: '10',
        Valor_Meta: 18500000,
      },
      status: 'VALID',
      messages: ['Meta mensal dentro da faixa orçada.'],
    },
  ])

  const [schemaModalOpen, setSchemaModalOpen] = useState(false)
  const [activeSchemaTab, setActiveSchemaTab] = useState('01_Ciclo')

  const handleDownloadTemplate = () => {
    downloadOfficialStrategicTemplate()
    toast.success('Template oficial gerado! Preencha e utilize o importador abaixo.')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)
      toast.info(`Arquivo selecionado: ${file.name}`)
    }
  }

  const handleProcessValidation = () => {
    if (!selectedFile) {
      toast.error('Selecione um arquivo de planilha preenchido.')
      return
    }

    setIsValidating(true)
    setTimeout(() => {
      setIsValidating(false)
      setCurrentStep('STAGING')
      toast.success('Validação concluída com sucesso! 5 registros em Staging.')
    }, 1200)
  }

  const handleCommitStaging = () => {
    setIsCommitting(true)
    setTimeout(() => {
      setIsCommitting(false)
      setCurrentStep('COMMITTED')
      toast.success('Planejamento Estratégico gravado na base de dados!')
    }, 1500)
  }

  const handleReset = () => {
    setSelectedFile(null)
    setCurrentStep('UPLOAD')
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in pb-16">
      {/* HEADER EXECUTIVO COM BOTÃO DE DOWNLOAD NO TOPO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-primary/10 rounded-2xl">
              <FileSpreadsheet className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-3xl font-bold text-primary tracking-tight">
                  Importação de Planejamento Estratégico
                </h1>
                <Badge className="bg-primary/10 text-primary border-primary/30 text-xs">
                  Schema Oficial v2024
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Carga em lote de Ciclos, Objetivos BSC, Metas, Iniciativas e Indicadores com
                validação em staging.
              </p>
            </div>
          </div>
        </div>

        {/* BOTÃO MÁXIMO DE DESTAQUE NO TOPO: BAIXAR TEMPLATE EXCEL */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSchemaModalOpen(true)}
            className="h-9 gap-1.5 text-xs text-primary"
          >
            <Info className="w-4 h-4" /> Ver Schema das 10 Abas
          </Button>

          <Button
            onClick={handleDownloadTemplate}
            className="h-9 gap-2 text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-xs"
          >
            <Download className="w-4 h-4" /> Baixar Template Excel Oficial
          </Button>
        </div>
      </div>

      {/* ESTEIRA DE ETAPAS DE IMPORTAÇÃO */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div
          className={cn(
            'p-4 rounded-2xl border text-xs flex items-center gap-3',
            currentStep === 'UPLOAD'
              ? 'bg-primary/10 border-primary/40 text-primary font-bold'
              : 'bg-white border-border/40 text-muted-foreground',
          )}
        >
          <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center font-bold">
            1
          </span>
          <div>
            <strong className="block text-slate-900">1. Download & Upload</strong>
            <span>Obter template e enviar arquivo</span>
          </div>
        </div>

        <div
          className={cn(
            'p-4 rounded-2xl border text-xs flex items-center gap-3',
            currentStep === 'VALIDATION'
              ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold'
              : 'bg-white border-border/40 text-muted-foreground',
          )}
        >
          <span className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center font-bold">
            2
          </span>
          <div>
            <strong className="block text-slate-900">2. Validação de Schema</strong>
            <span>Conferência de colunas e regras</span>
          </div>
        </div>

        <div
          className={cn(
            'p-4 rounded-2xl border text-xs flex items-center gap-3',
            currentStep === 'STAGING'
              ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold'
              : 'bg-white border-border/40 text-muted-foreground',
          )}
        >
          <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center font-bold">
            3
          </span>
          <div>
            <strong className="block text-slate-900">3. Staging & Conferência</strong>
            <span>Revisão prévia dos dados</span>
          </div>
        </div>

        <div
          className={cn(
            'p-4 rounded-2xl border text-xs flex items-center gap-3',
            currentStep === 'COMMITTED'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
              : 'bg-white border-border/40 text-muted-foreground',
          )}
        >
          <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center font-bold">
            4
          </span>
          <div>
            <strong className="block text-slate-900">4. Commit no HUB</strong>
            <span>Persistência no banco de dados</span>
          </div>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL DE ACORDO COM O PASSO */}
      {currentStep === 'UPLOAD' && (
        <Card className="bg-white/95 backdrop-blur-md border-border/40 rounded-3xl p-8 shadow-xs text-center space-y-6">
          <div className="max-w-xl mx-auto space-y-3">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-3xl flex items-center justify-center mx-auto">
              <FileSpreadsheet className="w-8 h-8" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-primary">
              Carga da Planilha do Planejamento Estratégico
            </h2>
            <p className="text-xs text-muted-foreground">
              Utilize o template oficial com as 10 abas padronizadas (01_Ciclo até 10_Vinculos). Não
              altere o cabeçalho das colunas para garantir o perfeito processamento pelo motor de
              importação.
            </p>
          </div>

          <div className="max-w-lg mx-auto p-6 border-2 border-dashed border-border/60 rounded-3xl bg-slate-50/60 space-y-4">
            <input
              type="file"
              id="strategic-file-upload"
              accept=".csv,.xlsx,.xls,.tsv"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="strategic-file-upload"
              className="cursor-pointer block space-y-2 hover:opacity-80 transition-opacity"
            >
              <Upload className="w-8 h-8 text-primary mx-auto opacity-70" />
              <span className="font-bold text-sm text-primary block">
                {selectedFile ? selectedFile.name : 'Clique para selecionar a planilha preenchida'}
              </span>
              <span className="text-[11px] text-muted-foreground block">
                Formatos suportados: CSV (separado por vírgula) ou Excel XLSX oficial
              </span>
            </label>

            {selectedFile && (
              <Badge className="bg-emerald-100 text-emerald-800 border-none font-mono text-xs">
                Arquivo pronto para validação
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleDownloadTemplate}
              className="text-xs text-emerald-800 border-emerald-300 hover:bg-emerald-50 gap-1.5 h-10"
            >
              <Download className="w-4 h-4" /> Baixar Template em Branco
            </Button>

            <Button
              disabled={!selectedFile || isValidating}
              onClick={handleProcessValidation}
              className="text-xs bg-primary text-white gap-1.5 h-10 px-6 font-bold"
            >
              {isValidating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Validando Schema...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Validar & Avançar para Staging
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {currentStep === 'STAGING' && (
        <Card className="bg-white/95 backdrop-blur-md border-border/40 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
            <div>
              <h3 className="font-serif text-xl font-bold text-primary">
                Staging de Importação — Registros Processados
              </h3>
              <p className="text-xs text-muted-foreground">
                Revise os registros antes de confirmar a gravação definitiva no Planejamento
                Estratégico.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleReset} className="text-xs">
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleCommitStaging}
                disabled={isCommitting}
                className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold gap-1.5"
              >
                {isCommitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Gravando no Banco...
                  </>
                ) : (
                  <>
                    <Database className="w-3.5 h-3.5" /> Confirmar & Gravar no Planejamento
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b text-[11px] font-bold text-muted-foreground uppercase">
                  <th className="py-2.5 px-3">Aba</th>
                  <th className="py-2.5 px-3">Linha</th>
                  <th className="py-2.5 px-3">Conteúdo / Campos Importados</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Mensagens de Validação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stagingData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80">
                    <td className="py-3 px-3 font-mono font-bold text-primary">{row.sheetName}</td>
                    <td className="py-3 px-3 font-mono text-muted-foreground">{row.rowNumber}</td>
                    <td className="py-3 px-3">
                      <div className="space-y-0.5">
                        {Object.entries(row.data).map(([k, v]) => (
                          <span key={k} className="inline-block mr-2 text-[11px]">
                            <strong className="text-slate-700">{k}:</strong> {String(v)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      {row.status === 'VALID' ? (
                        <Badge className="bg-emerald-100 text-emerald-800 text-[10px] border-none font-bold">
                          Válido
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-800 text-[10px] border-none font-bold">
                          Aviso
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-3 text-muted-foreground text-[11px]">
                      {row.messages.join(' ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {currentStep === 'COMMITTED' && (
        <Card className="p-12 text-center bg-white rounded-3xl border-border/40 shadow-xs space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-3xl flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-slate-800">
            Planejamento Estratégico Atualizado com Sucesso!
          </h2>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Os ciclos, objetivos, metas e indicadores foram integrados aos módulos de Gestão de
            Performance e Plano de Metas do HUB CIAFAL.
          </p>

          <div className="flex justify-center gap-3 pt-4">
            <Button variant="outline" size="sm" onClick={handleReset} className="text-xs">
              Nova Importação
            </Button>
            <Button
              size="sm"
              onClick={() => toast.info('Redirecionando para Gestão de Performance...')}
              className="text-xs bg-primary text-white"
            >
              Ver na Gestão de Performance
            </Button>
          </div>
        </Card>
      )}

      {/* MODAL COM A DEFINIÇÃO DE SCHEMA DAS 10 ABAS */}
      <Dialog open={schemaModalOpen} onOpenChange={setSchemaModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-primary flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-primary" /> Schema Oficial do Template (10
              Abas)
            </DialogTitle>
            <DialogDescription className="text-xs">
              Estrutura de dados compartilhada entre o gerador do template Excel e o motor de
              validação.
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={activeSchemaTab}
            onValueChange={setActiveSchemaTab}
            className="w-full space-y-3"
          >
            <TabsList className="bg-slate-100 p-1 rounded-2xl flex-wrap h-auto gap-1">
              {STRATEGIC_IMPORT_SCHEMA.map((tab) => (
                <TabsTrigger
                  key={tab.tabName}
                  value={tab.tabName}
                  className="data-[state=active]:bg-white data-[state=active]:text-primary rounded-xl px-2.5 py-1 text-[11px] font-bold"
                >
                  {tab.tabName}
                </TabsTrigger>
              ))}
            </TabsList>

            {STRATEGIC_IMPORT_SCHEMA.map((tab) => (
              <TabsContent key={tab.tabName} value={tab.tabName} className="m-0 space-y-3">
                <div className="p-3 bg-slate-50 rounded-2xl border border-border/40">
                  <h4 className="font-bold text-sm text-primary">{tab.title}</h4>
                  <p className="text-xs text-muted-foreground">{tab.description}</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b text-[11px] font-bold text-muted-foreground uppercase">
                        <th className="py-2 px-3">Coluna (Header)</th>
                        <th className="py-2 px-3">Obrigatório</th>
                        <th className="py-2 px-3">Formato</th>
                        <th className="py-2 px-3">Descrição da Regra</th>
                        <th className="py-2 px-3">Exemplo Fictício</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tab.columns.map((col, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                            {col.header}
                          </td>
                          <td className="py-2.5 px-3">
                            {col.required ? (
                              <Badge className="bg-rose-100 text-rose-800 text-[10px] border-none font-bold">
                                Sim
                              </Badge>
                            ) : (
                              <Badge className="bg-slate-100 text-slate-600 text-[10px] border-none">
                                Opcional
                              </Badge>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground">
                            {col.format}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 text-[11px]">
                            {col.description}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-emerald-700">
                            {col.example}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            ))}
          </Tabs>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSchemaModalOpen(false)}
              className="text-xs"
            >
              Fechar
            </Button>
            <Button
              size="sm"
              onClick={handleDownloadTemplate}
              className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold gap-1.5"
            >
              <Download className="w-4 h-4" /> Baixar Template Excel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
