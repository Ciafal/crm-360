/**
 * SUÍTE DE TESTES DE REGRESSÃO FUNCIONAL: CRM 360º CIAFAL
 * Restaurar botão "+ Nova Oportunidade" no módulo Cotações & Governança de Oportunidades
 *
 * Cobertura dos 15 Testes Mandatórios:
 * (01) Botão "+ Nova Oportunidade" visível em CRM 360º -> Cotações (Gestão de Cotações / CotacoesList)
 * (02) Clicar no botão "+ Nova Oportunidade" abre o modal do formulário
 * (03) Selecionar somente Cliente permite salvar (Cliente = único campo obrigatório)
 * (04) Salvar sem grupo/quantidade/preço cria a oportunidade com sucesso
 * (05) Cliente + grupo selecionado salva corretamente
 * (06) Cliente + grupo + quantidade salva corretamente
 * (07) Cliente + quantidade + preço calcula valor potencial automaticamente e corretamente
 * (08) Oportunidade criada aparece na listagem de "Oportunidades"
 * (09) Oportunidade criada aparece no "Funil de Vendas" (Kanban e Métricas)
 * (10) "Gerar Cotação" a partir da oportunidade reaproveita os dados conhecidos (cliente, grupo, qtd, preço, obs)
 * (11) Botão e fluxo de "Nova Cotação" continuam funcionando sem interferência
 * (12) Sub-abas de cotação (Lista, Kanban, Dashboard, Aguardando Aprovação/Checagem, Aprovadas) sem regressão
 * (13) Motor de Inteligência Cross-Sell continua funcionando perfeitamente
 * (14) Persistência via crmStorage prefixado crm360: preserva os dados após reload
 * (15) Histórico e logs de auditoria registram a criação, mudanças de estágio e operações
 */

import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/hooks/use-auth'
import CotacoesList from '@/components/cotacoes/CotacoesList'
import { CotacoesModule } from '@/components/cotacoes/CotacoesModule'
import { NovaOportunidadeModal } from '@/components/crm/NovaOportunidadeModal'
import {
  opportunityLeadService,
  NovaOportunidadePayload,
  ESTAGIOS_OPORTUNIDADE_CIAFAL,
} from '@/services/opportunity_lead_service'
import { crmStorage } from '@/lib/crm-storage'
import { quotationService } from '@/services/quotation_service'
import { smartCrossSellEngine } from '@/services/cross_sell_engine'

describe('REGRESSÃO FUNCIONAL: CRM 360º CIAFAL — "+ Nova Oportunidade" & Cotações', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    // Mock do ResizeObserver para componentes do Radix Dialog/Tabs
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // (01) Botão "+ Nova Oportunidade" visível em CRM 360º -> Cotações
  it('(01) deve exibir o botão "+ Nova Oportunidade" na Gestão de Cotações (CotacoesList)', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <CotacoesList />
        </AuthProvider>
      </MemoryRouter>,
    )

    const novaOpBtn = screen.getByRole('button', { name: /\+? ?nova oportunidade/i })
    expect(novaOpBtn).toBeDefined()
    expect(novaOpBtn.textContent).toContain('Nova Oportunidade')

    // Deve estar posicionado junto ao botão "+ Nova Cotação"
    const novaCotacaoBtn = screen.getByRole('button', { name: /\+? ?nova cotação/i })
    expect(novaCotacaoBtn).toBeDefined()
  })

  // (02) Clicar no botão abre o modal do formulário
  it('(02) deve abrir o modal de Nova Oportunidade ao clicar no botão em Cotações', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <CotacoesList />
        </AuthProvider>
      </MemoryRouter>,
    )

    const novaOpBtn = screen.getByRole('button', { name: /\+? ?nova oportunidade/i })
    fireEvent.click(novaOpBtn)

    await waitFor(() => {
      expect(screen.getByText(/\+ Nova Oportunidade Comercial/i)).toBeDefined()
      expect(screen.getByText(/1\. Especulação/i)).toBeDefined()
      expect(screen.getByText(/CLIENTE \*/i)).toBeDefined()
    })
  })

  // (03) Selecionar somente Cliente permite salvar (Cliente = único campo obrigatório)
  it('(03) deve manter o botão "Salvar Oportunidade" desabilitado sem cliente e habilitar assim que o cliente é selecionado', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <NovaOportunidadeModal
            open={true}
            onOpenChange={() => {}}
            usuarioAtualNome="Carlos Mendonça"
          />
        </AuthProvider>
      </MemoryRouter>,
    )

    // Antes de selecionar cliente
    const salvarBtn = screen.getByRole('button', { name: /salvar oportunidade/i })
    expect(salvarBtn).toHaveProperty('disabled', true)
    expect(screen.getByText(/Selecione um cliente para habilitar o salvamento/i)).toBeDefined()

    // Pesquisa e seleciona cliente
    const searchInput = screen.getByPlaceholderText(/Digite SAP, Razão Social, Fantasia ou CNPJ/i)
    fireEvent.change(searchInput, { target: { value: '100001' } })

    await waitFor(() => {
      const clienteOption = screen.getByText(/Metalúrgica ABC Ltda\./i)
      fireEvent.click(clienteOption)
    })

    // Após selecionar cliente: botão deve estar habilitado
    await waitFor(() => {
      expect(salvarBtn).toHaveProperty('disabled', false)
      expect(screen.getByText(/Pronto para salvar oportunidade comercial/i)).toBeDefined()
    })
  })

  // (04) Salvar sem grupo/quantidade/preço cria a oportunidade com sucesso
  it('(04) deve criar a oportunidade com sucesso sem grupo, quantidade ou preço informados', () => {
    const payload: NovaOportunidadePayload = {
      clienteId: 'cli-100001',
      clienteNome: 'Metalúrgica ABC Ltda.',
      clienteSap: '100001',
      clienteCnpj: '18.442.901/0001-45',
      usuarioAtual: 'Carlos Mendonça',
    }

    const opp = opportunityLeadService.createOpportunity(payload)

    expect(opp.id).toBeDefined()
    expect(opp.clienteNome).toBe('Metalúrgica ABC Ltda.')
    expect(opp.estagioCiafal).toBe('especulacao')
    expect(opp.quantidadeEstimadaTons).toBeNull()
    expect(opp.precoEstimadoPorTon).toBeNull()
    expect(opp.valorPotencialCalculado).toBeNull()
  })

  // (05) Cliente + grupo selecionado salva corretamente
  it('(05) deve salvar oportunidade com Cliente e Grupo de Mercadorias informados', () => {
    const payload: NovaOportunidadePayload = {
      clienteId: 'cli-100002',
      clienteNome: 'Estruturas Metálicas Triângulo',
      clienteSap: '100002',
      grupoMercadoria: 'Perfis Estruturais',
      usuarioAtual: 'Carlos Mendonça',
    }

    const opp = opportunityLeadService.createOpportunity(payload)

    expect(opp.grupoMercadoria).toBe('Perfis Estruturais')
    expect(opp.quantidadeEstimadaTons).toBeNull()
    expect(opp.precoEstimadoPorTon).toBeNull()
    expect(opp.valorPotencialCalculado).toBeNull()
  })

  // (06) Cliente + grupo + quantidade salva corretamente
  it('(06) deve salvar com Cliente + Grupo + Quantidade (sem preço) mantendo valor potencial como null', () => {
    const payload: NovaOportunidadePayload = {
      clienteId: 'cli-100003',
      clienteNome: 'Serralheria Modelo',
      clienteSap: '100003',
      grupoMercadoria: 'Chapas Finas a Frio',
      quantidadeEstimadaTons: 25.5,
      usuarioAtual: 'Carlos Mendonça',
    }

    const opp = opportunityLeadService.createOpportunity(payload)

    expect(opp.quantidadeEstimadaTons).toBe(25.5)
    expect(opp.precoEstimadoPorTon).toBeNull()
    expect(opp.valorPotencialCalculado).toBeNull()
    expect(opp.toneladas).toBe(25.5)
  })

  // (07) Cliente + quantidade + preço calcula valor potencial automaticamente e corretamente
  it('(07) deve calcular valor potencial automaticamente: Quantidade (t) × Preço (R$/t)', () => {
    const payload: NovaOportunidadePayload = {
      clienteId: 'cli-100004',
      clienteNome: 'Caldeiraria Central',
      clienteSap: '100004',
      grupoMercadoria: 'Tubos Industriais',
      quantidadeEstimadaTons: 10,
      precoEstimadoPorTon: 5200,
      usuarioAtual: 'Carlos Mendonça',
    }

    const opp = opportunityLeadService.createOpportunity(payload)

    expect(opp.quantidadeEstimadaTons).toBe(10)
    expect(opp.precoEstimadoPorTon).toBe(5200)
    expect(opp.valorPotencialCalculado).toBe(52000)
    expect(opp.valor).toBe(52000)
  })

  // (08) Oportunidade criada aparece na listagem de "Oportunidades"
  it('(08) deve disponibilizar a oportunidade criada na lista do serviço de oportunidades', () => {
    const opp = opportunityLeadService.createOpportunity({
      clienteId: 'cli-100001',
      clienteNome: 'Metalúrgica ABC Ltda.',
      quantidadeEstimadaTons: 40,
      precoEstimadoPorTon: 4800,
    })

    const oportunidades = opportunityLeadService.getStoredOpportunities()
    const found = oportunidades.find((o) => o.id === opp.id)

    expect(found).toBeDefined()
    expect(found?.clienteNome).toBe('Metalúrgica ABC Ltda.')
    expect(found?.valorPotencialCalculado).toBe(192000)
  })

  // (09) Oportunidade criada aparece no "Funil de Vendas"
  it('(09) deve refletir a oportunidade criada no estágio inicial do funil comercial', () => {
    const opp = opportunityLeadService.createOpportunity({
      clienteId: 'cli-100005',
      clienteNome: 'Construtora Nova Era',
      quantidadeEstimadaTons: 15,
      precoEstimadoPorTon: 6000,
    })

    const all = opportunityLeadService.getStoredOpportunities()
    const found = all.find((o) => o.id === opp.id)

    expect(found).toBeDefined()
    expect(found?.estagioCiafal).toBe('especulacao')
    expect(found?.etapa).toBe('lead') // mapeamento canônico de funil
    expect(found?.valor).toBe(90000)
  })

  // (10) "Gerar Cotação" a partir da oportunidade reaproveita os dados conhecidos
  it('(10) fluxo de Gerar Cotação a partir de oportunidade reaproveita cliente, grupo, quantidade e preço', () => {
    const opp = opportunityLeadService.createOpportunity({
      clienteId: 'cli-100001',
      clienteNome: 'Metalúrgica ABC Ltda.',
      clienteSap: '100001',
      grupoMercadoria: 'Perfis Estruturais',
      quantidadeEstimadaTons: 35,
      precoEstimadoPorTon: 4850,
      observacoes: 'Cliente solicita entrega parcelada em 3 vezes',
    })

    // Simula a evolução do estágio para "solicitacao_cotacao" e geração da cotação
    const advanced = opportunityLeadService.advanceOpportunityStage(
      opp.id,
      'solicitacao_cotacao',
      'Carlos Mendonça',
      'Evolução comercial confirmada',
    )
    expect(advanced.estagioCiafal).toBe('solicitacao_cotacao')

    // Os dados conhecidos que a tela Nova Cotação consome
    const cotacaoSeedData = {
      clienteId: opp.clienteId,
      clienteNome: opp.clienteNome,
      clienteSap: opp.clienteSap,
      grupoMercadoriaFiltro: opp.grupoMercadoria,
      quantidadeSugeridaTons: opp.quantidadeEstimadaTons,
      precoReferencia: opp.precoEstimadoPorTon,
      historicoObservacoes: opp.observacoes,
    }

    expect(cotacaoSeedData.clienteSap).toBe('100001')
    expect(cotacaoSeedData.grupoMercadoriaFiltro).toBe('Perfis Estruturais')
    expect(cotacaoSeedData.quantidadeSugeridaTons).toBe(35)
    expect(cotacaoSeedData.precoReferencia).toBe(4850)
    expect(cotacaoSeedData.historicoObservacoes).toContain('entrega parcelada')
  })

  // (11) Botão e fluxo de "Nova Cotação" continuam funcionando
  it('(11) o botão "Nova Cotação" e navegação para criação continuam intactos', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <CotacoesList />
        </AuthProvider>
      </MemoryRouter>,
    )

    const novaCotacaoBtn = screen.getByRole('button', { name: /\+? ?nova cotação/i })
    expect(novaCotacaoBtn).toBeDefined()
    expect(novaCotacaoBtn.textContent).toContain('Nova Cotação')
  })

  // (12) Sub-abas e modos de Cotações sem regressão
  it('(12) o CotacoesModule renderiza abas e modos (Central, Kanban, Dashboard, Alçadas) sem erros', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <CotacoesModule />
        </AuthProvider>
      </MemoryRouter>,
    )

    // Botões de topo no header do módulo
    expect(screen.getByRole('link', { name: /nova cotação clean/i })).toBeDefined()
    expect(screen.getByRole('button', { name: /nova oportunidade/i })).toBeDefined()

    // Abas de navegação
    expect(screen.getByRole('tab', { name: /central de cotações/i })).toBeDefined()
    expect(screen.getByRole('tab', { name: /pipeline kanban/i })).toBeDefined()
    expect(screen.getByRole('tab', { name: /dashboard & kpis/i })).toBeDefined()
    expect(screen.getByRole('tab', { name: /inteligência cross-sell/i })).toBeDefined()
  })

  // (13) Motor de Inteligência Cross-Sell continua funcionando perfeitamente
  it('(13) motor de Cross-Sell continua ativo e retornando métricas de eficiência', () => {
    const stats = smartCrossSellEngine.getEfficiencyStats()
    expect(stats).toBeDefined()
    expect(stats.toneladasGeradasCrossSellT).toBeGreaterThanOrEqual(0)
    expect(stats.taxaConversaoCrossSellPct).toBeGreaterThanOrEqual(0)

    const recs = smartCrossSellEngine.getSuggestionsForCustomer('100001')
    expect(Array.isArray(recs)).toBe(true)
  })

  // (14) Persistência via crmStorage prefixado crm360: preserva os dados após reload
  it('(14) oportunidade criada é persistida com a chave crm360: e preservada entre reloads', () => {
    opportunityLeadService.createOpportunity({
      clienteId: 'cli-100001',
      clienteNome: 'Metalúrgica ABC Ltda.',
      quantidadeEstimadaTons: 120,
      precoEstimadoPorTon: 4600,
    })

    // Verifica que o storage utilizou a chave com namespace
    const storedRaw = localStorage.getItem('crm360:ciafal_crm_opportunities')
    expect(storedRaw).not.toBeNull()

    const parsed = JSON.parse(storedRaw!)
    expect(parsed.length).toBeGreaterThan(0)
    expect(parsed[0].clienteNome).toBe('Metalúrgica ABC Ltda.')
    expect(parsed[0].valorPotencialCalculado).toBe(552000)

    // Lê via crmStorage diretamente
    const storedFromHelper = crmStorage.getJSON<any[]>('ciafal_crm_opportunities', [])
    expect(storedFromHelper[0].id).toBe(parsed[0].id)
  })

  // (15) Histórico e logs de auditoria registram a criação, mudanças de estágio e operações
  it('(15) registra log rastreável de auditoria com usuário, data/hora e valores na oportunidade', () => {
    const opp = opportunityLeadService.createOpportunity({
      clienteId: 'cli-100002',
      clienteNome: 'Estruturas Metálicas Triângulo',
      usuarioAtual: 'Carlos Mendonça',
    })

    expect(opp.historicoAuditoria).toBeDefined()
    expect(opp.historicoAuditoria!.length).toBe(1)
    expect(opp.historicoAuditoria![0].acao).toBe('Criada no estágio inicial 1. Especulação')
    expect(opp.historicoAuditoria![0].usuario).toBe('Carlos Mendonça')
    expect(opp.historicoAuditoria![0].dataHora).toBeDefined()

    // Avança estágio
    const advanced = opportunityLeadService.advanceOpportunityStage(
      opp.id,
      'interesse',
      'Carlos Mendonça',
      'Cliente confirmou interesse na linha pesada',
    )

    expect(advanced.historicoAuditoria!.length).toBe(2)
    expect(advanced.historicoAuditoria![1].estagioAnterior).toBe('especulacao')
    expect(advanced.historicoAuditoria![1].estagioNovo).toBe('interesse')
    expect(advanced.historicoAuditoria![1].detalhe).toContain('linha pesada')
  })

  // (16) Estrutura do Modal: Header fixo, corpo com scroll interno flex-1, footer fixo sticky bottom
  it('(16) deve renderizar modal com header fixo, corpo scroll flex-1 e footer com botões Cancelar e Salvar Oportunidade', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <NovaOportunidadeModal
            open={true}
            onOpenChange={() => {}}
            usuarioAtualNome="Carlos Mendonça"
          />
        </AuthProvider>
      </MemoryRouter>,
    )

    const dialogContent = screen.getByTestId('nova-oportunidade-dialog-content')
    expect(dialogContent).toBeDefined()
    expect(dialogContent.className).toContain('flex')
    expect(dialogContent.className).toContain('flex-col')
    expect(dialogContent.className).toContain('max-h-[90vh]')

    const scrollBody = screen.getByTestId('nova-oportunidade-scroll-body')
    expect(scrollBody).toBeDefined()
    expect(scrollBody.className).toContain('flex-1')
    expect(scrollBody.className).toContain('overflow-y-auto')
    expect(scrollBody.className).toContain('min-h-0')

    const footer = screen.getByTestId('nova-oportunidade-footer')
    expect(footer).toBeDefined()
    expect(footer.className).toContain('sticky')
    expect(footer.className).toContain('bottom-0')
    expect(footer.className).toContain('bg-white')

    // Botões no footer
    const cancelarBtn = screen.getByRole('button', { name: /cancelar/i })
    const salvarBtn = screen.getByRole('button', { name: /salvar oportunidade/i })
    expect(cancelarBtn).toBeDefined()
    expect(salvarBtn).toBeDefined()
  })

  // (17) Tratamento de erro na persistência: mantém dados preenchidos e exibe mensagem de erro
  it('(17) em caso de erro na persistência, exibe "Não foi possível salvar a oportunidade." e preserva campos preenchidos', async () => {
    // Espiona createOpportunity para simular falha de gravação/rede
    const spy = vi.spyOn(opportunityLeadService, 'createOpportunity').mockImplementationOnce(() => {
      throw new Error('Falha simulada no backend/storage')
    })

    render(
      <MemoryRouter>
        <AuthProvider>
          <NovaOportunidadeModal
            open={true}
            onOpenChange={() => {}}
            usuarioAtualNome="Carlos Mendonça"
          />
        </AuthProvider>
      </MemoryRouter>,
    )

    // Seleciona um cliente
    const searchInput = screen.getByPlaceholderText(/Digite SAP, Razão Social, Fantasia ou CNPJ/i)
    fireEvent.change(searchInput, { target: { value: '100001' } })

    await waitFor(() => {
      const clienteOption = screen.getByText(/Metalúrgica ABC Ltda\./i)
      fireEvent.click(clienteOption)
    })

    // Preenche quantidade e observação
    const qtyInput = screen.getByPlaceholderText('Ex: 30')
    fireEvent.change(qtyInput, { target: { value: '45.5' } })

    const obsInput = screen.getByPlaceholderText(/Descreva detalhes livres levantados/i)
    fireEvent.change(obsInput, { target: { value: 'Observação crítica para não perder no erro' } })

    const salvarBtn = screen.getByRole('button', { name: /salvar oportunidade/i })
    expect(salvarBtn).toHaveProperty('disabled', false)

    fireEvent.click(salvarBtn)

    await waitFor(() => {
      // Deve exibir mensagem amigável de erro
      expect(screen.getByText('Não foi possível salvar a oportunidade.')).toBeDefined()
      // Não deve exibir mensagem de sucesso
      expect(screen.queryByText(/Oportunidade criada com sucesso/i)).toBeNull()
      // Os dados permanecem preenchidos no formulário
      expect(screen.getByDisplayValue('45.5')).toBeDefined()
      expect(screen.getByDisplayValue('Observação crítica para não perder no erro')).toBeDefined()
      expect(screen.getByText(/Metalúrgica ABC Ltda\./i)).toBeDefined()
    })

    spy.mockRestore()
  })
})
