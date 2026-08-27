export interface StrategicTemplateTab {
  tabName: string
  title: string
  description: string
  columns: {
    header: string
    required: boolean
    format: string
    description: string
    example: string
  }[]
}

export const STRATEGIC_IMPORT_SCHEMA: StrategicTemplateTab[] = [
  {
    tabName: '00_Instrucoes',
    title: 'Instruções Gerais de Preenchimento',
    description:
      'Orientações mandatórias sobre o preenchimento do template oficial de Planejamento Estratégico.',
    columns: [
      {
        header: 'Aba_Origem',
        required: true,
        format: 'Texto',
        description: 'Nome da aba de destino dos dados',
        example: '01_Ciclo',
      },
      {
        header: 'Regra_Validacao',
        required: true,
        format: 'Texto',
        description: 'Requisito de integridade referencial',
        example: 'Ano início menor que ano fim',
      },
      {
        header: 'Exemplo_Valido',
        required: true,
        format: 'Texto',
        description: 'Padrão esperado pelo importador',
        example: '2024 / 2026',
      },
    ],
  },
  {
    tabName: '01_Ciclo',
    title: 'Ciclo Estratégico & Horizontes',
    description: 'Definição dos anos do ciclo estratégico corporativo CIAFAL.',
    columns: [
      {
        header: 'Ano_Inicio',
        required: true,
        format: 'YYYY (Numérico)',
        description: 'Ano de início do ciclo',
        example: '2024',
      },
      {
        header: 'Ano_Fim',
        required: true,
        format: 'YYYY (Numérico)',
        description: 'Ano final do ciclo',
        example: '2026',
      },
      {
        header: 'Titulo_Ciclo',
        required: true,
        format: 'Texto',
        description: 'Denominação do ciclo',
        example: 'Ciclo Trienal de Expansão & Competitividade',
      },
      {
        header: 'Status',
        required: true,
        format: 'ATIVO / RASCUNHO',
        description: 'Status do ciclo',
        example: 'ATIVO',
      },
    ],
  },
  {
    tabName: '02_Ideologia',
    title: 'Missão, Visão e Valores',
    description: 'Pilares institucionais e propósito empresarial.',
    columns: [
      {
        header: 'Codigo_Ciclo',
        required: true,
        format: 'Texto',
        description: 'Código do ciclo relacionado',
        example: 'CICLO-2024-2026',
      },
      {
        header: 'Missao',
        required: true,
        format: 'Texto longo',
        description: 'Propósito fundamental da CIAFAL',
        example: 'Fornecer soluções em aços com excelência operacional e agilidade logística.',
      },
      {
        header: 'Visao',
        required: true,
        format: 'Texto longo',
        description: 'Aspiração de longo prazo',
        example:
          'Ser a distribuidora e processadora de aço referência em rentabilidade e serviço em MG e SP.',
      },
      {
        header: 'Valores',
        required: true,
        format: 'Texto separado por vírgula',
        description: 'Valores inegociáveis',
        example:
          'Segurança, Integridade, Foco no Cliente, Excelência Operacional, Valorização das Pessoas',
      },
    ],
  },
  {
    tabName: '03_Objetivos',
    title: 'Objetivos Estratégicos (BSC)',
    description: 'Objetivos organizados pelas perspectivas do Balanced Scorecard.',
    columns: [
      {
        header: 'Codigo_Objetivo',
        required: true,
        format: 'Texto (ex: OBJ-FIN-01)',
        description: 'Código único do objetivo',
        example: 'OBJ-FIN-01',
      },
      {
        header: 'Perspectiva',
        required: true,
        format: 'FINANCEIRA / CLIENTES / PROCESSOS / PESSOAS / ESG',
        description: 'Dimensão do BSC',
        example: 'FINANCEIRA',
      },
      {
        header: 'Descricao',
        required: true,
        format: 'Texto',
        description: 'Enunciado do objetivo estratégico',
        example: 'Maximizar a Margem de Contribuição e o EBITDA Comercial',
      },
      {
        header: 'Responsavel',
        required: true,
        format: 'Nome / Área',
        description: 'Diretoria ou Gerência responsável',
        example: 'Diretoria Comercial & Financeira',
      },
      {
        header: 'Peso_Estrategico',
        required: true,
        format: 'Percentual (0 a 100)',
        description: 'Peso na composição global',
        example: '25',
      },
    ],
  },
  {
    tabName: '04_SWOT',
    title: 'Matriz SWOT / FOFA',
    description: 'Forças, Fraquezas, Oportunidades e Ameaças.',
    columns: [
      {
        header: 'Tipo_Fator',
        required: true,
        format: 'FORCA / FRAQUEZA / OPORTUNIDADE / AMEACA',
        description: 'Categoria do fator',
        example: 'FORCA',
      },
      {
        header: 'Descricao_Fator',
        required: true,
        format: 'Texto',
        description: 'Detalhamento do ponto forte ou fraco',
        example: 'Localização estratégica dos CDs Betim e Contagem',
      },
      {
        header: 'Impacto',
        required: true,
        format: 'ALTO / MEDIO / BAIXO',
        description: 'Grau de relevância',
        example: 'ALTO',
      },
    ],
  },
  {
    tabName: '05_Ameacas_Oportunidades',
    title: 'Análise de Cenários & Riscos de Mercado',
    description: 'Mapeamento de riscos do setor siderúrgico e variações cambiais/preço do minério.',
    columns: [
      {
        header: 'Cenario',
        required: true,
        format: 'Texto',
        description: 'Descrição do cenário econômico',
        example: 'Volatilidade do Preço da Bobina Quente / Usinas Nacionais',
      },
      {
        header: 'Probabilidade',
        required: true,
        format: 'ALTA / MEDIA / BAIXA',
        description: 'Probabilidade de ocorrência',
        example: 'MEDIA',
      },
      {
        header: 'Plano_Mitigacao',
        required: true,
        format: 'Texto',
        description: 'Ação preventiva planejada',
        example:
          'Contratos de fornecimento programado com a Gerdau e política dinâmica de preços no CRM',
      },
    ],
  },
  {
    tabName: '06_Expansao_Inovacao',
    title: 'Frentes de Expansão e Inovação',
    description: 'Projetos de novos produtos, serviços e transformação digital.',
    columns: [
      {
        header: 'Frente',
        required: true,
        format: 'Texto',
        description: 'Nome da frente estratégica',
        example: 'HUB CIAFAL & CRM 360',
      },
      {
        header: 'Lider_Projeto',
        required: true,
        format: 'Nome',
        description: 'Responsável executivo',
        example: 'Gerência de TI & Inovação',
      },
      {
        header: 'Capex_Estimado',
        required: false,
        format: 'Numérico (R$)',
        description: 'Investimento previsto',
        example: '350000',
      },
    ],
  },
  {
    tabName: '07_Iniciativas',
    title: 'Iniciativas & Projetos Estratégicos',
    description: 'Planos de ação atrelados aos objetivos do BSC.',
    columns: [
      {
        header: 'Codigo_Iniciativa',
        required: true,
        format: 'Texto (ex: INI-01)',
        description: 'Código único',
        example: 'INI-01',
      },
      {
        header: 'Codigo_Objetivo',
        required: true,
        format: 'Texto referencial',
        description: 'Objetivo BSC pai',
        example: 'OBJ-FIN-01',
      },
      {
        header: 'Nome_Iniciativa',
        required: true,
        format: 'Texto',
        description: 'Nome do projeto',
        example: 'Impedir perda de margem por corte indevido de bobinas',
      },
      {
        header: 'Data_Inicio',
        required: true,
        format: 'YYYY-MM-DD',
        description: 'Início',
        example: '2024-02-01',
      },
      {
        header: 'Data_Termino',
        required: true,
        format: 'YYYY-MM-DD',
        description: 'Conclusão prevista',
        example: '2024-12-31',
      },
    ],
  },
  {
    tabName: '08_Indicadores',
    title: 'Catálogo de Indicadores (KPIs Estratégicos)',
    description: 'Métricas de medição e fórmulas corporativas.',
    columns: [
      {
        header: 'Codigo_KPI',
        required: true,
        format: 'Texto (ex: KPI-FAT-01)',
        description: 'Código do indicador',
        example: 'KPI-FAT-01',
      },
      {
        header: 'Codigo_Objetivo',
        required: true,
        format: 'Texto referencial',
        description: 'Objetivo BSC',
        example: 'OBJ-FIN-01',
      },
      {
        header: 'Nome_KPI',
        required: true,
        format: 'Texto',
        description: 'Nome comercial/estratégico',
        example: 'Faturamento Bruto Mensal',
      },
      {
        header: 'Unidade',
        required: true,
        format: 'R$ / TON / % / DIAS',
        description: 'Unidade de medida',
        example: 'R$',
      },
      {
        header: 'Fonte_Dados',
        required: true,
        format: 'SAP_ECC / QLIK / CRM_360 / MANUAL',
        description: 'Sistema de origem',
        example: 'SAP_ECC',
      },
      {
        header: 'Frequencia',
        required: true,
        format: 'MENSAL / TRIMESTRAL / ANUAL',
        description: 'Periodicidade de apuração',
        example: 'MENSAL',
      },
    ],
  },
  {
    tabName: '09_Metas',
    title: 'Metas Anuais e Mensalizadas',
    description: 'Valores alvo por período para cada indicador.',
    columns: [
      {
        header: 'Codigo_KPI',
        required: true,
        format: 'Texto referencial',
        description: 'KPI associado',
        example: 'KPI-FAT-01',
      },
      {
        header: 'Ano',
        required: true,
        format: 'YYYY',
        description: 'Ano de referência',
        example: '2024',
      },
      {
        header: 'Mes',
        required: true,
        format: '1 a 12 ou ANUAL',
        description: 'Mês da meta',
        example: '10',
      },
      {
        header: 'Valor_Meta',
        required: true,
        format: 'Numérico',
        description: 'Valor esperado',
        example: '18500000',
      },
    ],
  },
  {
    tabName: '10_Vinculos',
    title: 'Matriz de Vínculos & Rastreabilidade',
    description: 'Conexão entre Objetivos, Iniciativas, Indicadores e Centros de Custo.',
    columns: [
      {
        header: 'Codigo_Objetivo',
        required: true,
        format: 'Texto',
        description: 'Objetivo',
        example: 'OBJ-FIN-01',
      },
      {
        header: 'Codigo_Iniciativa',
        required: true,
        format: 'Texto',
        description: 'Iniciativa',
        example: 'INI-01',
      },
      {
        header: 'Codigo_KPI',
        required: true,
        format: 'Texto',
        description: 'KPI',
        example: 'KPI-FAT-01',
      },
      {
        header: 'Centro_Custo',
        required: true,
        format: 'Texto',
        description: 'Centro de custo responsável',
        example: 'CC-1020 — Vendas Indústria',
      },
    ],
  },
]

/**
 * Gera e dispara o download do Template Oficial Excel em formato CSV/TSV multi-aba compatível
 * com o schema oficial do Planejamento Estratégico.
 */
export function downloadOfficialStrategicTemplate() {
  let content = `sep=,\n`
  content += `# TEMPLATE OFICIAL — PLANEJAMENTO ESTRATÉGICO CIAFAL\n`
  content += `# Ambiente: QAS / HOMOLOGAÇÃO\n`
  content += `# Instrução: Preencha os campos obrigatórios respeitando os formatos indicados em cada seção.\n\n`

  for (const tab of STRATEGIC_IMPORT_SCHEMA) {
    content += `=== ABA: ${tab.tabName} | ${tab.title} ===\n`
    content += `# Descrição: ${tab.description}\n`

    // Headers
    const headers = tab.columns.map((c) => c.header).join(',')
    content += `${headers}\n`

    // Linha de Exemplo Fictício (Não usa dados reais)
    const examples = tab.columns.map((c) => `"${c.example}"`).join(',')
    content += `${examples}\n\n`
  }

  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `Template_Oficial_Planejamento_Estrategico_CIAFAL_v2024.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
