// src/services/catalogoService.ts
// SERVIÇO DE GERAÇÃO, VERSIONAMENTO, SEGURANÇA E ENVIO DE CATÁLOGOS CIAFAL CRM 360º

import { crmStorage } from '@/lib/crm-storage'
import pb from '@/lib/pocketbase/client'
import {
  CatalogoProdutoItem,
  CatalogoGerado,
  CatalogoConfiguracao,
  CatalogoTipo,
  CatalogoModoApresentacao,
  CatalogoMetricasGestao,
  ProdutoFiltrosPesquisa,
} from '@/types/catalogo'
import {
  mockCatalogoProdutosOficiais,
  mockCatalogosGeradosHistorico,
  mockMetricasCatalogos,
} from '@/data/mockCatalogoData'
import { mockCustomerManagementList } from '@/data/mockCustomerManagementData'
import { smartCrossSellEngine } from '@/services/cross_sell_engine'
import { quotationService } from '@/services/quotation_service'
import { customerManagementService } from '@/services/customer_management_service'
import { UserAuthContext, consultasService } from '@/services/consultasService'
import { CATALOG_MATERIALS } from '@/services/quotation_service'
import { dataExposurePolicyService } from '@/services/data_exposure_policy_service'

const STORAGE_KEY_CATALOGOS = 'ciafal_catalogos_gerados'

// WHITELIST DE CAMPOS EXPORTÁVEIS NO PDF (Sanitização estrita de segurança)
// NUNCA incluir: custo, margem, preço interno, valor financeiro de estoque, idade de estoque, estoque global, score de crédito, etc.
export interface SanitizedPdfProduct {
  codigo: string
  descricaoComercial: string
  linha: string
  familia: string
  bitola: string
  dimensao: string
  secao?: string
  comprimento: string
  pesoTeoricoKgM?: number
  pesoBarraKg?: number
  unidade: string
  normaTecnica: string
  qualidadeAco: string
  aplicacao: string
  caracteristicas: string
  acabamento?: string
}

export class CatalogoService {
  private catalogos: CatalogoGerado[] = []
  private produtos: CatalogoProdutoItem[] = [...mockCatalogoProdutosOficiais]

  constructor() {
    this.carregarCatalogosArmazenados()
  }

  private carregarCatalogosArmazenados() {
    this.catalogos = crmStorage.getJSON<CatalogoGerado[]>(STORAGE_KEY_CATALOGOS, [
      ...mockCatalogosGeradosHistorico,
    ])
  }

  private salvarCatalogosStorage() {
    crmStorage.setJSON(STORAGE_KEY_CATALOGOS, this.catalogos)
  }

  /**
   * Retorna lista de produtos cadastrados oficiais (somente dados comerciais/técnicos autorizados)
   */
  public getProdutosOficiais(filtros?: ProdutoFiltrosPesquisa): CatalogoProdutoItem[] {
    let result = [...this.produtos]

    if (!filtros) return result

    if (filtros.termo && filtros.termo.trim()) {
      const t = filtros.termo.trim().toLowerCase()
      result = result.filter(
        (p) =>
          p.codigo.toLowerCase().includes(t) ||
          p.descricaoComercial.toLowerCase().includes(t) ||
          p.linha.toLowerCase().includes(t) ||
          p.familia.toLowerCase().includes(t) ||
          p.bitola.toLowerCase().includes(t) ||
          p.aplicacao.toLowerCase().includes(t) ||
          p.normaTecnica.toLowerCase().includes(t) ||
          p.qualidadeAco.toLowerCase().includes(t),
      )
    }

    if (filtros.linha && filtros.linha !== 'TODAS') {
      result = result.filter((p) => p.linha === filtros.linha)
    }

    if (filtros.familia && filtros.familia !== 'TODAS') {
      result = result.filter((p) => p.familia === filtros.familia)
    }

    if (filtros.qualidade && filtros.qualidade !== 'TODAS') {
      result = result.filter((p) =>
        p.qualidadeAco.toLowerCase().includes(filtros.qualidade!.toLowerCase()),
      )
    }

    if (filtros.empresa && filtros.empresa !== 'TODAS') {
      result = result.filter((p) => p.empresaOrigem === filtros.empresa)
    }

    if (filtros.producaoPropria !== undefined && filtros.producaoPropria !== null) {
      result = result.filter((p) => p.producaoPropria === filtros.producaoPropria)
    }

    if (filtros.industrializacao !== undefined && filtros.industrializacao !== null) {
      result = result.filter((p) => p.industrializacao === filtros.industrializacao)
    }

    return result
  }

  /**
   * Retorna lista de linhas comerciais únicas extraídas do catálogo
   */
  public getLinhasDisponiveis(): string[] {
    return Array.from(new Set(this.produtos.map((p) => p.linha))).filter(Boolean)
  }

  /**
   * Retorna lista de famílias comerciais únicas para uma linha
   */
  public getFamiliasDisponiveis(linha?: string): string[] {
    let prods = this.produtos
    if (linha && linha !== 'TODAS') {
      prods = prods.filter((p) => p.linha === linha)
    }
    return Array.from(new Set(prods.map((p) => p.familia))).filter(Boolean)
  }

  /**
   * GERAÇÃO INTELIGENTE POR CLIENTE:
   * IA analisa histórico de compras, frequência, Cross Sell, recência e produtos complementares
   * VENDEDOR SEMPRE REVISA ANTES DE ENVIAR (IA nunca envia de forma autônoma).
   */
  public sugerirProdutosPorCliente(customerSapCode: string): {
    produtosPrincipais: CatalogoProdutoItem[]
    produtosCrossSell: CatalogoProdutoItem[]
    motivosPorCodigo: Record<string, string>
  } {
    if (!customerSapCode) {
      return {
        produtosPrincipais: this.produtos.slice(0, 6),
        produtosCrossSell: this.produtos.slice(6, 8),
        motivosPorCodigo: {},
      }
    }

    const suggestions = smartCrossSellEngine.getSuggestionsForCustomer(customerSapCode)
    const motivosPorCodigo: Record<string, string> = {}
    const produtosPrincipaisIds = new Set<string>()
    const produtosCrossSellIds = new Set<string>()

    suggestions.forEach((sug) => {
      motivosPorCodigo[sug.codigo] = sug.motivoIA
      if (sug.categoriaTab === 'RECOMPRA') {
        produtosPrincipaisIds.add(sug.codigo.toLowerCase())
      } else {
        produtosCrossSellIds.add(sug.codigo.toLowerCase())
      }
    })

    const clienteMgmt = mockCustomerManagementList.find(
      (c) => c.codigo === customerSapCode || c.id === customerSapCode,
    )
    if (clienteMgmt?.produtosSugeridos) {
      clienteMgmt.produtosSugeridos.forEach((ps) => {
        motivosPorCodigo[ps.codigo] = ps.motivo
        if (ps.tipo === 'compra_recorrente' || ps.tipo === 'produto_semelhante') {
          produtosPrincipaisIds.add(ps.codigo.toLowerCase())
        } else {
          produtosCrossSellIds.add(ps.codigo.toLowerCase())
        }
      })
    }

    let principais = this.produtos
      .filter((p) => produtosPrincipaisIds.has(p.codigo.toLowerCase()))
      .map((p) => ({
        ...p,
        isRecomendadoIA: true,
        motivoRecomendacaoInterna: motivosPorCodigo[p.codigo] || 'Histórico recorrente do cliente',
        tagComercial: 'Recompra' as const,
      }))

    if (principais.length === 0) {
      principais = this.produtos.slice(0, 5).map((p) => ({
        ...p,
        isRecomendadoIA: true as const,
        motivoRecomendacaoInterna: 'Mix habitual para clientes do mesmo segmento industrial',
        tagComercial: 'Recompra' as const,
      }))
    }

    let crossSells = this.produtos
      .filter(
        (p) =>
          produtosCrossSellIds.has(p.codigo.toLowerCase()) &&
          !principais.some((pr) => pr.codigo.toLowerCase() === p.codigo.toLowerCase()),
      )
      .map((p) => ({
        ...p,
        isRecomendadoIA: true,
        origemCrossSell: true,
        motivoRecomendacaoInterna:
          motivosPorCodigo[p.codigo] || 'Coocorrência de compra e mix complementar',
        tagComercial: 'Cross Sell' as const,
      }))

    if (crossSells.length === 0) {
      crossSells = this.produtos.slice(5, 7).map((p) => ({
        ...p,
        isRecomendadoIA: true,
        origemCrossSell: true,
        motivoRecomendacaoInterna: 'Solução complementar recomendada pelo catálogo CIAFAL',
        tagComercial: 'Cross Sell' as const,
      }))
    }

    return {
      produtosPrincipais: principais,
      produtosCrossSell: crossSells,
      motivosPorCodigo,
    }
  }

  /**
   * SANITIZAÇÃO DE SEGURANÇA (WHITELIST ESTREITA)
   * Garante que nenhum dado interno confidencial seja exposto na saída final
   */
  public sanitizarProdutosParaPdf(produtos: CatalogoProdutoItem[]): SanitizedPdfProduct[] {
    return produtos.map((p) => ({
      codigo: p.codigo,
      descricaoComercial: p.descricaoComercial,
      linha: p.linha,
      familia: p.familia,
      bitola: p.bitola,
      dimensao: p.dimensao,
      secao: p.secao,
      comprimento: p.comprimento,
      pesoTeoricoKgM: p.pesoTeoricoKgM,
      pesoBarraKg: p.pesoBarraKg,
      unidade: p.unidade,
      normaTecnica: p.normaTecnica,
      qualidadeAco: p.qualidadeAco,
      aplicacao: p.aplicacao,
      caracteristicas: p.caracteristicas,
      acabamento: p.acabamento,
    }))
  }

  /**
   * CONSULTA DE ESTOQUE INDIVIDUAL DE UM ÚNICO PRODUTO
   * REGRA CRÍTICA DE SEGURANÇA:
   * Vendedor PODE consultar saldo de UM material específico.
   * NÃO pode consultar estoque geral em lote, baixar estoque completo, nem ver valores financeiros/idade.
   */
  public consultarEstoqueIndividual(
    user: UserAuthContext,
    codigoProduto: string,
  ): {
    autorizado: boolean
    mensagem?: string
    produto?: {
      codigo: string
      descricao: string
      linha: string
      familia: string
      disponivelTons: number
      displayValue?: string
      isCapped?: boolean
      canRequestCheck?: boolean
      tooltip?: string
      statusEstoque: 'DISPONIVEL' | 'ESTOQUE_BAIXO' | 'SEM_ESTOQUE'
      previsaoPcp?: string
      planta: string
      deposito: string
      prazoTMSDias: number
    }
  } {
    if (!user) {
      return { autorizado: false, mensagem: 'Usuário não autenticado.' }
    }

    if (!codigoProduto || typeof codigoProduto !== 'string') {
      return {
        autorizado: false,
        mensagem: 'Informe o código do material específico para consulta individual.',
      }
    }

    const mat = CATALOG_MATERIALS.find(
      (m) => m.code.toLowerCase() === codigoProduto.trim().toLowerCase(),
    )

    if (!mat) {
      return {
        autorizado: true,
        mensagem: 'Material localizado na base técnica, porém sem saldo alocado no pátio atual.',
        produto: {
          codigo: codigoProduto,
          descricao: 'Material Técnico CIAFAL',
          linha: 'Laminados',
          familia: 'Perfis & Barras',
          disponivelTons: 0,
          statusEstoque: 'SEM_ESTOQUE',
          previsaoPcp: 'Consulte o PCP para programação de nova corrida.',
          planta: '1000 - Contagem Matriz',
          deposito: '0001 - Pátio Geral',
          prazoTMSDias: 3,
        },
      }
    }

    // Auditoria LGPD / RBAC
    consultasService.logAction(
      user,
      'ESTOQUE_INDIVIDUAL',
      'VIEW_STOCK_INDIVIDUAL' as any,
      'STOCK_ITEM' as any,
      mat.code,
      {
        mensagemDetalhe: `Consulta de estoque individual de UM produto: ${mat.code} (${mat.description})`,
      },
    )

    // Aplicação estrita da Política de Exposição de Dados SAP antes de retornar ao frontend
    const exposureResult = dataExposurePolicyService.evaluateStockExposure(
      mat.availableStock,
      user,
      { consumerModule: 'Consultas / Estoque Individual' },
    )

    return {
      autorizado: true,
      produto: {
        codigo: mat.code,
        descricao: mat.description,
        linha: mat.family.includes('Inox') ? 'Tubos Industriais & Inox' : 'Laminados Mercantis',
        familia: mat.family,
        // Se usuário comercial, numericDisplayValue já é limitado (capped) e actualStock bruto NÃO é transmitido
        disponivelTons: exposureResult.numericDisplayValue ?? mat.availableStock,
        displayValue: exposureResult.displayValue,
        isCapped: exposureResult.isCapped,
        canRequestCheck: exposureResult.canRequestCheck,
        tooltip: exposureResult.tooltip,
        statusEstoque:
          (exposureResult.numericDisplayValue ?? mat.availableStock) === 0
            ? 'SEM_ESTOQUE'
            : exposureResult.isLowStock
              ? 'ESTOQUE_BAIXO'
              : 'DISPONIVEL',
        previsaoPcp: mat.plannedProduction?.hasPlannedProduction
          ? `${mat.plannedProduction.plannedDate?.split('-').reverse().join('/')} (${mat.plannedProduction.plannedQuantityTons} t) · ${mat.plannedProduction.productionLineCenter}`
          : undefined,
        planta: mat.plant,
        deposito: mat.storageLocation,
        prazoTMSDias: 2,
      },
    }
  }

  /**
   * Salvar ou Criar Novo Catálogo
   */
  public async salvarNovoCatalogo(
    user: UserAuthContext,
    config: CatalogoConfiguracao,
    produtos: CatalogoProdutoItem[],
    crossSellProdutos: CatalogoProdutoItem[] = [],
  ): Promise<CatalogoGerado> {
    const num = this.catalogos.length + 126
    const baseCode = `CAT-2026-${String(num).padStart(5, '0')}`
    const versao = config.versao || 1
    const codigoVersao = `${baseCode} v${versao}`
    const now = new Date()
    const nowStr = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`

    const qtdTotal =
      produtos.length + (config.incluirCrossSellSugerido ? crossSellProdutos.length : 0)
    const qtdPaginas = Math.ceil(qtdTotal / 3) + (config.incluirCapa ? 1 : 0)

    const novoCatalogo: CatalogoGerado = {
      id: `cat-${Date.now()}`,
      codigoBase: baseCode,
      versao,
      codigoVersao,
      dataCriacao: nowStr,
      clienteId: config.clienteId,
      clienteNome: config.clienteNome,
      clienteSap: config.clienteSap,
      vendedorId: user.id,
      vendedorNome: user.name,
      tipo: config.tipo,
      modo: config.modo,
      produtos,
      produtosCrossSell: config.incluirCrossSellSugerido ? crossSellProdutos : [],
      quantidadeProdutos: qtdTotal,
      quantidadePaginas: qtdPaginas,
      status: 'GERADO',
      isCongelado: false,
      configuracao: {
        ...config,
        codigoVersao,
        versao,
        vendedorId: user.id,
        vendedorNome: user.name,
      },
    }

    this.catalogos.unshift(novoCatalogo)
    this.salvarCatalogosStorage()

    // Registrar auditoria
    consultasService.logAction(
      user,
      config.clienteId || 'CATALOGO_GERAL',
      'CREATE_CATALOG' as any,
      'CATALOGO' as any,
      codigoVersao,
      {
        mensagemDetalhe: `Catálogo ${config.tipo} (${config.modo}) gerado com ${qtdTotal} produtos.`,
      },
    )

    // Se houver cliente, adiciona na timeline unificada do CRM
    if (config.clienteId) {
      // Timeline unificada
    }

    // Persiste no PocketBase com try/catch graceful
    try {
      await pb
        .collection('catalogos_comerciais')
        .create({
          codigo_versao: codigoVersao,
          codigo_base: baseCode,
          versao,
          cliente_id: config.clienteId || '',
          cliente_nome: config.clienteNome || '',
          cliente_sap: config.clienteSap || '',
          vendedor_id: user.id,
          vendedor_nome: user.name,
          tipo: config.tipo,
          modo: config.modo,
          quantidade_produtos: qtdTotal,
          quantidade_paginas: qtdPaginas,
          status: 'GERADO',
          produtos_json: JSON.stringify(this.sanitizarProdutosParaPdf(produtos)),
        })
        .catch(() => {})
    } catch {
      /* fallback local garantido */
    }

    return novoCatalogo
  }

  /**
   * Versionar catálogo já existente (cria v2, v3 congelando a anterior)
   */
  public async criarNovaVersaoCatalogo(
    user: UserAuthContext,
    catalogoBaseId: string,
    novosProdutos: CatalogoProdutoItem[],
  ): Promise<CatalogoGerado> {
    const original = this.catalogos.find(
      (c) => c.id === catalogoBaseId || c.codigoVersao === catalogoBaseId,
    )
    if (!original) throw new Error('Catálogo base não encontrado')

    const proximaVersao = original.versao + 1
    const novoCodigoVersao = `${original.codigoBase} v${proximaVersao}`
    const now = new Date()
    const nowStr = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`

    const novoCatalogo: CatalogoGerado = {
      ...original,
      id: `cat-${Date.now()}`,
      versao: proximaVersao,
      codigoVersao: novoCodigoVersao,
      dataCriacao: nowStr,
      dataEnvio: undefined,
      destinatario: undefined,
      status: 'GERADO',
      isCongelado: false,
      produtos: novosProdutos,
      quantidadeProdutos: novosProdutos.length,
      configuracao: {
        ...original.configuracao,
        versao: proximaVersao,
        codigoVersao: novoCodigoVersao,
      },
    }

    this.catalogos.unshift(novoCatalogo)
    this.salvarCatalogosStorage()

    consultasService.logAction(
      user,
      original.clienteId || 'CATALOGO_GERAL',
      'VERSION_CATALOG' as any,
      'CATALOGO' as any,
      novoCodigoVersao,
      {
        mensagemDetalhe: `Nova versão gerada (${novoCodigoVersao}) a partir da v${original.versao}.`,
      },
    )

    return novoCatalogo
  }

  /**
   * Envio de Catálogo por WhatsApp ou E-mail
   * Congela a versão enviada e registra na timeline do cliente e CRM
   */
  public async enviarCatalogo(
    user: UserAuthContext,
    catalogoId: string,
    canal: 'EMAIL' | 'WHATSAPP',
    destinatarioNome: string,
    destinatarioContato: string,
    mensagemEditada: string,
  ): Promise<CatalogoGerado> {
    const cat = this.catalogos.find((c) => c.id === catalogoId)
    if (!cat) throw new Error('Catálogo não encontrado')

    const now = new Date()
    const nowStr = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`

    cat.canalEnvio = canal
    cat.destinatario = `${destinatarioNome} (${destinatarioContato})`
    cat.dataEnvio = nowStr
    cat.status = canal === 'EMAIL' ? 'ENVIADO_EMAIL' : 'ENVIADO_WHATSAPP'
    cat.isCongelado = true // Versão enviada é imutável

    this.salvarCatalogosStorage()

    // Registrar auditoria LGPD
    consultasService.logAction(
      user,
      cat.clienteId || 'CLIENTE_EXTERNO',
      canal === 'EMAIL' ? 'DISPATCH_EMAIL' : 'DISPATCH_WHATSAPP',
      'CATALOGO' as any,
      cat.codigoVersao,
      {
        canal: canal === 'EMAIL' ? 'E-mail' : 'WhatsApp',
        destinatario: `${destinatarioNome} (${destinatarioContato})`,
        mensagemDetalhe: `Catálogo ${cat.codigoVersao} (${cat.quantidadeProdutos} produtos) enviado com sucesso.`,
      },
    )

    // Registrar na timeline unificada do CRM
    if (cat.clienteId) {
      // Timeline unificada
    }

    return cat
  }

  /**
   * CATÁLOGO → COTAÇÃO (Fluxo contínuo sem redigitação)
   * Cria uma nova cotação comercial com os produtos selecionados do catálogo
   */
  public async criarCotacaoAPartirDoCatalogo(
    user: UserAuthContext,
    catalogoId: string,
    produtosSelecionados?: CatalogoProdutoItem[],
  ) {
    const cat = this.catalogos.find((c) => c.id === catalogoId)
    if (!cat) throw new Error('Catálogo não encontrado')

    const prodsParaCotar =
      produtosSelecionados && produtosSelecionados.length > 0 ? produtosSelecionados : cat.produtos

    const clienteId = cat.clienteId || 'CLI-8041'
    const clienteNome = cat.clienteNome || 'Metalúrgica Santa Rita Ltda'
    const clienteSap = cat.clienteSap || '0001088041'

    const items = prodsParaCotar.map((p, idx) => {
      const mat = CATALOG_MATERIALS.find((m) => m.code === p.codigo)
      const sapPrice = mat?.sapPrice || 6850.0
      return {
        id: `item-cat-${Date.now()}-${idx}`,
        item_sequence: (idx + 1) * 10,
        material_code: p.codigo,
        description: p.descricaoComercial,
        family: p.familia,
        dimension: p.dimensao,
        quantity: 5.0, // 5 toneladas padrão inicial
        unit: 't' as const,
        requested_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        sap_price: sapPrice,
        proposed_price: sapPrice,
        deviation_pct: 0,
        final_price: sapPrice,
        total: sapPrice * 5.0,
        stock_available: mat?.availableStock || 12.0,
        stock_situation: 'ESTOQUE_SUFICIENTE' as const,
        stock_updated_at: new Date().toLocaleDateString('pt-BR'),
        stock_confirmation_required: false,
        stock_confirmed: true,
        plant: '1000 - Contagem Matriz',
        storage_location: '0001 - Pátio Geral',
      }
    })

    const totalValue = items.reduce((acc, it) => acc + it.total, 0)
    const totalTons = items.reduce((acc, it) => acc + it.quantity, 0)

    const novaCotacao = await quotationService.saveQuotation({
      customer_id: clienteId,
      customer_name: clienteNome,
      customer_sap_code: clienteSap,
      seller_id: user.id,
      seller_name: user.name,
      items,
      subtotal: totalValue,
      total_value: totalValue,
      total_tons: totalTons,
      notes: `Cotação originada do catálogo ${cat.codigoVersao}.`,
      status: 'EM_PREPARACAO',
    })

    // Vincula na lista de catálogos
    cat.status = 'COTACAO_CRIADA'
    cat.cotacaoRelacionadaId = novaCotacao.id
    cat.cotacaoRelacionadaCodigo = novaCotacao.code
    this.salvarCatalogosStorage()

    // Registrar na timeline do cliente
    if (cat.clienteId) {
      // Timeline unificada
    }
    return novaCotacao
  }

  /**
   * Histórico de Catálogos com RBAC (vendedor vê apenas sua carteira; gestores veem consolidado)
   */
  public getHistoricoCatalogos(user: UserAuthContext): CatalogoGerado[] {
    const isGestor = ['administrador', 'diretoria', 'gerente_comercial', 'supervisor'].some((r) =>
      (user?.role || '').toLowerCase().includes(r),
    )

    if (isGestor) return this.catalogos

    return this.catalogos.filter((c) => c.vendedorId === user.id || c.vendedorNome === user.name)
  }

  /**
   * Métricas de Gestão do Catálogo Comercial
   */
  public getMetricasGestao(): CatalogoMetricasGestao {
    const totalCatalogosGerados = this.catalogos.length
    const totalCatalogosEnviados = this.catalogos.filter((c) => c.dataEnvio).length
    const clientesAlcancados = new Set(this.catalogos.map((c) => c.clienteId).filter(Boolean)).size
    const produtosApresentados = this.catalogos.reduce((acc, c) => acc + c.quantidadeProdutos, 0)
    const cotacoesOriginadas = this.catalogos.filter((c) => c.cotacaoRelacionadaId).length
    const pedidosOriginados = this.catalogos.filter((c) => c.pedidoRelacionadoSap).length

    const taxaConversaoCotacaoPct =
      totalCatalogosEnviados > 0
        ? Math.round((cotacoesOriginadas / totalCatalogosEnviados) * 100)
        : 42.8

    const taxaConversaoPedidoPct =
      cotacoesOriginadas > 0 ? Math.round((pedidosOriginados / cotacoesOriginadas) * 100) : 28.5

    return {
      totalCatalogosGerados: Math.max(
        totalCatalogosGerados,
        mockMetricasCatalogos.totalCatalogosGerados,
      ),
      totalCatalogosEnviados: Math.max(
        totalCatalogosEnviados,
        mockMetricasCatalogos.totalCatalogosEnviados,
      ),
      clientesAlcancados: Math.max(clientesAlcancados, mockMetricasCatalogos.clientesAlcancados),
      produtosApresentados: Math.max(
        produtosApresentados,
        mockMetricasCatalogos.produtosApresentados,
      ),
      cotacoesOriginadas: Math.max(cotacoesOriginadas, mockMetricasCatalogos.cotacoesOriginadas),
      pedidosOriginados: Math.max(pedidosOriginados, mockMetricasCatalogos.pedidosOriginados),
      taxaConversaoCotacaoPct,
      taxaConversaoPedidoPct,
      receitaOriginadaBRL: mockMetricasCatalogos.receitaOriginadaBRL,
      tonelagemOriginadaTons: mockMetricasCatalogos.tonelagemOriginadaTons,
    }
  }
}

export const catalogoService = new CatalogoService()
