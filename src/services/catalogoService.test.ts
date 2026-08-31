import { describe, it, expect, beforeEach } from 'vitest'
import { catalogoService } from './catalogoService'
import { mockCatalogoProdutosOficiais } from '@/data/mockCatalogoData'
import { CatalogoConfiguracao } from '@/types/catalogo'

describe('Módulo de Catálogos Comerciais CIAFAL CRM 360º', () => {
  const userTeste = {
    id: 'vendedor_01',
    name: 'Carlos Mendonça',
    email: 'carlos.mendonca@ciafal.com.br',
    role: 'vendedor' as const,
    carteiraId: 'CART-01',
  }

  it('1. Deve listar produtos oficiais com filtros de linha e busca textual', () => {
    const produtos = catalogoService.getProdutosOficiais({ linha: 'Laminados Mercantis' })
    expect(produtos.length).toBeGreaterThan(0)
    produtos.forEach((p) => {
      expect(p.linha).toBe('Laminados Mercantis')
      expect(p.codigo).toBeDefined()
      expect(p.normaTecnica).toBeDefined()
    })
  })

  it('2. Deve sugerir produtos inteligentes para cliente com Cross Sell', () => {
    const sugestao = catalogoService.sugerirProdutosPorCliente('0001088041')
    expect(sugestao.produtosPrincipais.length).toBeGreaterThan(0)
    expect(sugestao.produtosCrossSell.length).toBeGreaterThan(0)
    // Produtos devem possuir tags comerciais de recomendação
    expect(sugestao.produtosPrincipais[0].isRecomendadoIA).toBe(true)
  })

  it('3. Deve sanitizar produtos para PDF via Whitelist (nunca expor dados confidenciais)', () => {
    const sanitizados = catalogoService.sanitizarProdutosParaPdf(mockCatalogoProdutosOficiais)
    expect(sanitizados.length).toBe(mockCatalogoProdutosOficiais.length)

    sanitizados.forEach((p: any) => {
      // Dados técnicos autorizados
      expect(p.codigo).toBeDefined()
      expect(p.descricaoComercial).toBeDefined()
      expect(p.normaTecnica).toBeDefined()

      // NUNCA expor:
      expect(p.custo).toBeUndefined()
      expect(p.margem).toBeUndefined()
      expect(p.precoInterno).toBeUndefined()
      expect(p.scoreIA).toBeUndefined()
      expect(p.estoqueGlobal).toBeUndefined()
      expect(p.idadeEstoque).toBeUndefined()
    })
  })

  it('4. Deve gerar e salvar novo catálogo comercial com versionamento', async () => {
    const config: CatalogoConfiguracao = {
      titulo: 'Catálogo de Teste Vitest',
      tipo: 'PERSONALIZADO',
      modo: 'TECNICO',
      clienteId: 'CLI-8041',
      clienteNome: 'Metalúrgica Santa Rita Ltda',
      clienteSap: '0001088041',
      vendedorId: userTeste.id,
      vendedorNome: userTeste.name,
      vendedorEmail: userTeste.email,
      vendedorTelefone: '(31) 3359-2040',
      vendedorWhatsapp: '(31) 99811-0044',
      incluirCapa: true,
      incluirDadosTecnicos: true,
      incluirNormas: true,
      incluirPesosTeoricos: true,
      incluirCrossSellSugerido: true,
      dataGeracao: '29/08/2026',
      validadeDias: 15,
      versao: 1,
      codigoVersao: 'CAT-2026-99999 v1',
    }

    const produtos = mockCatalogoProdutosOficiais.slice(0, 3)
    const novoCat = await catalogoService.salvarNovoCatalogo(userTeste, config, produtos)

    expect(novoCat.id).toBeDefined()
    expect(novoCat.versao).toBe(1)
    expect(novoCat.codigoVersao).toContain('v1')
    expect(novoCat.produtos.length).toBe(3)
    expect(novoCat.status).toBe('GERADO')
  })

  it('5. Deve versionar catálogo congelando o original e criando v2', async () => {
    const historico = catalogoService.getHistoricoCatalogos(userTeste)
    const base = historico[0]

    const novaVersao = await catalogoService.criarNovaVersaoCatalogo(
      userTeste,
      base.id,
      mockCatalogoProdutosOficiais.slice(0, 2),
    )

    expect(novaVersao.versao).toBe(base.versao + 1)
    expect(novaVersao.codigoVersao).toContain(`v${base.versao + 1}`)
    expect(novaVersao.produtos.length).toBe(2)
  })

  it('6. Deve enviar catálogo congelando a versão e registrando canal', async () => {
    const historico恒 = catalogoService.getHistoricoCatalogos(userTeste)
    const cat = historico恒[0]

    const enviado = await catalogoService.enviarCatalogo(
      userTeste,
      cat.id,
      'WHATSAPP',
      'Roberto Antunes',
      '(19) 99872-4411',
      'Mensagem de teste',
    )

    expect(enviado.isCongelado).toBe(true)
    expect(enviado.status).toBe('ENVIADO_WHATSAPP')
    expect(enviado.destinatario).toContain('Roberto Antunes')
  })

  it('7. Deve criar cotação a partir do catálogo sem redigitação', async () => {
    const historico = catalogoService.getHistoricoCatalogos(userTeste)
    const cat = historico[0]

    const cotacao = await catalogoService.criarCotacaoAPartirDoCatalogo(
      userTeste,
      cat.id,
      cat.produtos.slice(0, 2),
    )

    expect(cotacao.id).toBeDefined()
    expect(cotacao.code).toBeDefined()
    expect(cotacao.items.length).toBe(2)
    expect(cotacao.notes).toContain(cat.codigoVersao)
  })

  it('8. Consulta de Estoque Individual: Permite consultar UM produto por código', () => {
    const res = catalogoService.consultarEstoqueIndividual(userTeste, 'V20200360600')
    expect(res.autorizado).toBe(true)
    expect(res.produto?.codigo).toBe('V20200360600')
    expect(res.produto?.disponivelTons).toBeDefined()
  })

  it('9. Consulta de Estoque Individual: Bloqueia chamadas inválidas sem código', () => {
    const res = catalogoService.consultarEstoqueIndividual(userTeste, '')
    expect(res.autorizado).toBe(false)
  })

  it('10. Deve fornecer métricas de gestão com taxas de conversão de catálogo', () => {
    const metricas提高 = catalogoService.getMetricasGestao()
    expect(metricas提高.totalCatalogosGerados).toBeGreaterThan(0)
    expect(metricas提高.totalCatalogosEnviados).toBeGreaterThan(0)
    expect(metricas提高.taxaConversaoCotacaoPct).toBeGreaterThan(0)
    expect(metricas提高.receitaOriginadaBRL).toBeGreaterThan(0)
  })
})
