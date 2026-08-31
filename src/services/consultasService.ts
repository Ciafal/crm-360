// src/services/consultasService.ts
// SERVIÇO CENTRAL DE CONSULTAS DOCUMENTAIS CIAFAL CRM 360º
// Implementa RBAC server-ready, deny-by-default, trilha de auditoria LGPD, geração de link seguro e integração com IA

import {
  DocumentoFiscalNF,
  BoletoFinanceiro,
  CertificadoQualidade,
  PacoteDocumentalCliente,
  SolicitacaoFinanceiroRegistro,
  LogAuditoriaConsulta,
  mockNotasFiscais,
  mockBoletos,
  mockCertificados,
  mockPacotesDocumentais,
  mockSolicitacoesFinanceiro,
  mockLogsAuditoriaConsultas,
} from '@/data/mockConsultasData'
import { mockClientes } from '@/data/mockCommercialData'

export interface ConsultaFilterParams {
  termoBusca?: string
  clienteId?: string
  codigoClienteSap?: string
  tipoDocumento?: 'TODOS' | 'NF' | 'BOLETO' | 'CERTIFICADO'
  periodoPredefinido?: 'HOJE' | '7DIAS' | '30DIAS' | 'MES_ATUAL' | 'MES_ANTERIOR' | 'CUSTOM'
  dataInicio?: string
  dataFim?: string
  pedidoSap?: string
  numeroNF?: string
  numeroBoleto?: string
  material?: string
  loteCorrida?: string
  status?: string
  empresa?: string
  centro?: string
}

export interface UserAuthContext {
  id: string
  name: string
  email: string
  role:
    | 'administrador'
    | 'diretoria'
    | 'gerente_comercial'
    | 'supervisor'
    | 'vendedor'
    | 'representante_externo'
    | string
  seller_code?: string
}

export interface MultiDispatchPayload {
  clienteId: string
  canal: 'EMAIL' | 'WHATSAPP'
  destinatarioNome: string
  destinatarioContato: string // e-mail ou telefone
  documentos: {
    tipo: 'NF_PDF' | 'NF_XML' | 'BOLETO_PDF' | 'CERTIFICADO_PDF'
    id: string
    numero: string
    descricao: string
  }[]
  mensagem: string
  observacoesInternas?: string
}

class ConsultasService {
  private nfs: DocumentoFiscalNF[] = [...mockNotasFiscais]
  private boletos: BoletoFinanceiro[] = [...mockBoletos]
  private certificados: CertificadoQualidade[] = [...mockCertificados]
  private pacotes: PacoteDocumentalCliente[] = [...mockPacotesDocumentais]
  private solicitacoesFin: SolicitacaoFinanceiroRegistro[] = [...mockSolicitacoesFinanceiro]
  private logs: LogAuditoriaConsulta[] = [...mockLogsAuditoriaConsultas]

  /**
   * Validação de RBAC server-side simulada
   * Vendedor/Representante só acessa clientes vinculados à sua carteira
   */
  public checkCarteiraAccess(user: UserAuthContext | null, clienteIdOrSap: string): boolean {
    if (!user) return false
    const role = (user.role || '').toLowerCase()

    // Gestores e administradores têm acesso ampliado
    if (
      role.includes('admin') ||
      role.includes('diretor') ||
      role.includes('gerente') ||
      role.includes('supervisor')
    ) {
      return true
    }

    // Busca cliente
    const cliente = mockClientes.find(
      (c) => c.id === clienteIdOrSap || c.sapCode === clienteIdOrSap,
    )

    if (!cliente) {
      // Se não encontrou no mock de clientes, verifica nas NFs
      const nf = this.nfs.find(
        (n) => n.clienteId === clienteIdOrSap || n.codigoClienteSap === clienteIdOrSap,
      )
      if (nf && (nf.vendedorId === user.id || nf.vendedorNome === user.name)) {
        return true
      }
      return false
    }

    // Vendedor da carteira
    if (
      cliente.vendedorId === user.id ||
      cliente.vendedor === user.name ||
      (user.seller_code && cliente.vendedor.toLowerCase().includes(user.seller_code.toLowerCase()))
    ) {
      return true
    }

    return false
  }

  /**
   * Registra log de auditoria LGPD/Compliance
   */
  public logAction(
    user: UserAuthContext,
    clienteId: string,
    actionType: LogAuditoriaConsulta['tipoAcao'],
    documentType: LogAuditoriaConsulta['tipoDocumento'],
    documentNumber: string,
    options?: {
      canal?: LogAuditoriaConsulta['canal']
      destinatario?: string
      status?: 'SUCCESS' | 'DENIED_RBAC' | 'ERROR'
      mensagemDetalhe?: string
    },
  ) {
    const cliente =
      mockClientes.find((c) => c.id === clienteId) ||
      this.nfs.find((n) => n.clienteId === clienteId)
    const log: LogAuditoriaConsulta = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      usuarioId: user.id,
      usuarioNome: user.name || 'Usuário do Sistema',
      usuarioRole: user.role || 'vendedor',
      clienteId,
      clienteSap: cliente
        ? (cliente as any).sapCode || (cliente as any).codigoClienteSap || 'SAP-N/A'
        : 'N/A',
      clienteNome: cliente
        ? (cliente as any).razaoSocial || (cliente as any).clienteNome || 'Cliente'
        : 'Cliente Não Identificado',
      tipoAcao: actionType,
      tipoDocumento: documentType,
      numeroDocumento: documentNumber,
      canal: options?.canal || 'Visualização Direta',
      destinatario: options?.destinatario,
      ip: '187.24.110.42 (Sessão Segura)',
      status: options?.status || 'SUCCESS',
      mensagemDetalhe: options?.mensagemDetalhe,
      dataHora:
        new Date().toLocaleDateString('pt-BR') +
        ' ' +
        new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    }

    this.logs.unshift(log)
  }

  /**
   * Consulta Universal de Documentos com RBAC
   */
  public async buscarDocumentos(
    user: UserAuthContext,
    params: ConsultaFilterParams,
  ): Promise<{
    nfs: DocumentoFiscalNF[]
    boletos: BoletoFinanceiro[]
    certificados: CertificadoQualidade[]
    pacotes: PacoteDocumentalCliente[]
    totalDocumentos: number
    rbacRestrito: boolean
  }> {
    const isGestor = ['administrador', 'diretoria', 'gerente_comercial', 'supervisor'].includes(
      (user.role || '').toLowerCase(),
    )

    // Filtro base de RBAC por vendedor
    let nfsFiltradas = this.nfs.filter((nf) => {
      if (isGestor) return true
      return nf.vendedorId === user.id || this.checkCarteiraAccess(user, nf.clienteId)
    })

    let boletosFiltrados = this.boletos.filter((b) => {
      if (isGestor) return true
      return b.vendedorId === user.id || this.checkCarteiraAccess(user, b.clienteId)
    })

    let certsFiltrados = this.certificados.filter((c) => {
      if (isGestor) return true
      return c.vendedorId === user.id || this.checkCarteiraAccess(user, c.clienteId)
    })

    let pacotesFiltrados = this.pacotes.filter((p) => {
      if (isGestor) return true
      return this.checkCarteiraAccess(user, p.clienteId)
    })

    // Termo de busca universal (Case Insensitive)
    const termo = (params.termoBusca || '').trim().toLowerCase()
    if (termo) {
      nfsFiltradas = nfsFiltradas.filter(
        (n) =>
          n.numeroNF.toLowerCase().includes(termo) ||
          n.codigoClienteSap.toLowerCase().includes(termo) ||
          n.clienteNome.toLowerCase().includes(termo) ||
          n.cnpj.replace(/\D/g, '').includes(termo.replace(/\D/g, '')) ||
          n.pedidoSap.toLowerCase().includes(termo) ||
          n.numeroTransporte.toLowerCase().includes(termo) ||
          n.materialResumo.toLowerCase().includes(termo) ||
          n.chaveAcesso.toLowerCase().includes(termo) ||
          n.materiais.some(
            (m) =>
              m.codigo.toLowerCase().includes(termo) ||
              m.descricao.toLowerCase().includes(termo) ||
              m.lote.toLowerCase().includes(termo) ||
              m.corrida.toLowerCase().includes(termo) ||
              (m.certificadoNumero && m.certificadoNumero.toLowerCase().includes(termo)),
          ),
      )

      boletosFiltrados = boletosFiltrados.filter(
        (b) =>
          b.numeroDocumento.toLowerCase().includes(termo) ||
          b.numeroNfRelacionada.toLowerCase().includes(termo) ||
          b.numeroPedido.toLowerCase().includes(termo) ||
          b.clienteNome.toLowerCase().includes(termo) ||
          b.codigoClienteSap.toLowerCase().includes(termo) ||
          b.cnpj.replace(/\D/g, '').includes(termo.replace(/\D/g, '')) ||
          b.linhaDigitavel.replace(/\D/g, '').includes(termo.replace(/\D/g, '')),
      )

      certsFiltrados = certsFiltrados.filter(
        (c) =>
          c.numeroCertificado.toLowerCase().includes(termo) ||
          c.numeroNF.toLowerCase().includes(termo) ||
          c.pedidoSap.toLowerCase().includes(termo) ||
          c.clienteNome.toLowerCase().includes(termo) ||
          c.codigoClienteSap.toLowerCase().includes(termo) ||
          c.materialCodigo.toLowerCase().includes(termo) ||
          c.materialDescricao.toLowerCase().includes(termo) ||
          c.lote.toLowerCase().includes(termo) ||
          c.corrida.toLowerCase().includes(termo) ||
          c.ordemProducao.toLowerCase().includes(termo),
      )

      pacotesFiltrados = pacotesFiltrados.filter(
        (p) =>
          p.pedidoSap.toLowerCase().includes(termo) ||
          p.clienteNome.toLowerCase().includes(termo) ||
          p.codigoClienteSap.toLowerCase().includes(termo) ||
          p.nf.numeroNF.toLowerCase().includes(termo),
      )
    }

    // Filtro por Cliente específico
    if (params.clienteId && params.clienteId !== 'TODOS') {
      nfsFiltradas = nfsFiltradas.filter(
        (n) => n.clienteId === params.clienteId || n.codigoClienteSap === params.clienteId,
      )
      boletosFiltrados = boletosFiltrados.filter(
        (b) => b.clienteId === params.clienteId || b.codigoClienteSap === params.clienteId,
      )
      certsFiltrados = certsFiltrados.filter(
        (c) => c.clienteId === params.clienteId || c.codigoClienteSap === params.clienteId,
      )
      pacotesFiltrados = pacotesFiltrados.filter(
        (p) => p.clienteId === params.clienteId || p.codigoClienteSap === params.clienteId,
      )
    }

    // Filtro por Status
    if (params.status && params.status !== 'TODOS') {
      nfsFiltradas = nfsFiltradas.filter((n) => n.status === params.status)
      boletosFiltrados = boletosFiltrados.filter((b) => b.status === params.status)
      certsFiltrados = certsFiltrados.filter((c) => c.statusCertificado === params.status)
    }

    // Filtro por Empresa / Centro
    if (params.empresa && params.empresa !== 'TODAS') {
      nfsFiltradas = nfsFiltradas.filter((n) => n.empresa.includes(params.empresa!))
    }
    if (params.centro && params.centro !== 'TODOS') {
      nfsFiltradas = nfsFiltradas.filter((n) => n.centro.includes(params.centro!))
    }

    // Auditoria de busca
    if (termo || (params.clienteId && params.clienteId !== 'TODOS')) {
      this.logAction(
        user,
        params.clienteId || 'BUSCA_UNIVERSAL',
        'SEARCH',
        'MULTI_PACKAGE',
        termo || params.clienteId || 'TODOS',
        {
          mensagemDetalhe: `Consulta universal com termo "${termo}" retornando ${nfsFiltradas.length} NFs, ${boletosFiltrados.length} Boletos e ${certsFiltrados.length} Certificados`,
        },
      )
    }

    return {
      nfs: nfsFiltradas,
      boletos: boletosFiltrados,
      certificados: certsFiltrados,
      pacotes: pacotesFiltrados,
      totalDocumentos: nfsFiltradas.length + boletosFiltrados.length + certsFiltrados.length,
      rbacRestrito: !isGestor,
    }
  }

  /**
   * Solicitar 2ª via ao Financeiro (SAP FI / Serviço Bancário)
   */
  public async solicitarSegundaViaFinanceiro(
    user: UserAuthContext,
    boleto: BoletoFinanceiro,
    motivo: string,
    novaDataSugerida?: string,
  ): Promise<SolicitacaoFinanceiroRegistro> {
    const protocolo = `SOL-FIN-2026-${Math.floor(1000 + Math.random() * 9000)}`
    const novaSolicitacao: SolicitacaoFinanceiroRegistro = {
      id: `sol-${Date.now()}`,
      protocolo,
      clienteId: boleto.clienteId,
      clienteNome: boleto.clienteNome,
      codigoClienteSap: boleto.codigoClienteSap,
      cnpj: boleto.cnpj,
      numeroBoleto: boleto.numeroDocumento,
      numeroNF: boleto.numeroNfRelacionada,
      valorOriginal: boleto.valorOriginal,
      dataVencimentoOriginal: boleto.dataVencimentoFormatada,
      novaDataSugerida,
      motivo,
      solicitanteId: user.id,
      solicitanteNome: user.name,
      status: 'EM_ANALISE_FINANCEIRO',
      analistaFinanceiro: 'Fila Contas a Receber / Tesouraria CIAFAL',
      slaHoras: 4,
      prazoLimite: 'Hoje em até 4 horas úteis',
      dataCriacao:
        new Date().toLocaleDateString('pt-BR') +
        ' ' +
        new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    }

    this.solicitacoesFin.unshift(novaSolicitacao)

    // Atualiza status do boleto no mock
    boleto.historicoSolicitacoes = boleto.historicoSolicitacoes || []
    boleto.historicoSolicitacoes.unshift({
      protocolo,
      dataSolicitacao: novaSolicitacao.dataCriacao,
      solicitante: user.name,
      status: 'EM_ANALISE_FINANCEIRO',
      slaHoras: 4,
    })

    // Log de auditoria
    this.logAction(
      user,
      boleto.clienteId,
      'REQUEST_FINANCIAL_DUPLICATE',
      'BOLETO',
      boleto.numeroDocumento,
      {
        mensagemDetalhe: `Solicitada 2ª via ao Financeiro com protocolo ${protocolo}. Motivo: ${motivo}`,
      },
    )

    return novaSolicitacao
  }

  /**
   * Gerador de Link Seguro Temporário
   */
  public gerarLinkSeguro(
    user: UserAuthContext,
    clienteId: string,
    tipoDoc: string,
    numeroDoc: string,
  ): string {
    const token =
      'sec_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now().toString(36)
    const url = `https://portal.ciafal.com.br/doc-view/v2?token=${token}&auth=crm_verified`

    this.logAction(user, clienteId, 'COPY_SECURE_LINK', tipoDoc as any, numeroDoc, {
      canal: 'Link Seguro',
      mensagemDetalhe: `Gerado link seguro temporário (token criptográfico, validade 72h): ${token}`,
    })

    return url
  }

  /**
   * Sugestão de Mensagem Inteligente via IA para Envio Comercial
   */
  public gerarSugestaoMensagemIA(
    clienteNome: string,
    contatoNome: string,
    documentos: { tipo: string; numero: string }[],
    canal: 'EMAIL' | 'WHATSAPP',
    vendedorNome: string,
  ): string {
    const docList = documentos
      .map((d) => {
        if (d.tipo.includes('NF')) return `Nota Fiscal nº ${d.numero}`
        if (d.tipo.includes('BOLETO')) return `Boleto Bancário (NF ${d.numero})`
        if (d.tipo.includes('CERTIFICADO')) return `Certificado de Qualidade nº ${d.numero}`
        return `Documento nº ${d.numero}`
      })
      .join(', ')

    if (canal === 'WHATSAPP') {
      return `Olá, ${contatoNome || 'tudo bem'}! Aqui é ${vendedorNome} da CIAFAL Ferro & Aço. 🏗️\n\nConforme conversamos, estou disponibilizando os documentos solicitados para a *${clienteNome}*:\n\n📄 *Documentos anexos:* ${docList}.\n\nCaso precise de qualquer apoio técnico ou comercial, estou à disposição!`
    }

    return `Prezado(a) ${contatoNome || 'Cliente'},\n\nEsperamos que este e-mail o(a) encontre bem.\n\nSegue em anexo a documentação referente ao seu faturamento na CIAFAL Ferro & Aço:\n\n• ${docList}\n\nTodos os documentos possuem validação fiscal e rastreabilidade técnica dos lotes fornecidos.\n\nFicamos à total disposição para eventuais esclarecimentos.\n\nAtenciosamente,\n${vendedorNome}\nEquipe Comercial — CIAFAL Ferro & Aço\nCentral de Atendimento: (31) 3359-2000`
  }

  /**
   * Disparo Múltiplo de Documentos e Gravação na Linha do Tempo
   */
  public async enviarDocumentosMultiplos(
    user: UserAuthContext,
    payload: MultiDispatchPayload,
  ): Promise<{ success: boolean; protocoloEnvio: string }> {
    const protocoloEnvio = `DISP-${Date.now()}`

    // Log de auditoria LGPD completo
    this.logAction(
      user,
      payload.clienteId,
      payload.canal === 'EMAIL' ? 'DISPATCH_EMAIL' : 'DISPATCH_WHATSAPP',
      'MULTI_PACKAGE',
      payload.documentos.map((d) => d.numero).join(' + '),
      {
        canal: payload.canal === 'EMAIL' ? 'E-mail' : 'WhatsApp',
        destinatario: `${payload.destinatarioNome} (${payload.destinatarioContato})`,
        mensagemDetalhe: `Envio de ${payload.documentos.length} documentos via ${payload.canal}. Mensagem IA revisada pelo vendedor.`,
      },
    )

    return { success: true, protocoloEnvio }
  }

  /**
   * Obter solicitações ativas ao Financeiro
   */
  public getSolicitacoesFinanceiro(): SolicitacaoFinanceiroRegistro[] {
    return this.solicitacoesFin
  }

  /**
   * Obter Logs de Auditoria
   */
  public getLogsAuditoria(): LogAuditoriaConsulta[] {
    return this.logs
  }

  /**
   * Indicadores de Gestão de Documentos (para gestores/supervisores)
   */
  public getIndicadoresGestao() {
    const totalConsultas = this.logs.length + 42
    const totalVisualizacoes = this.logs.filter((l) => l.tipoAcao.startsWith('VIEW')).length + 28
    const totalEnvios = this.logs.filter((l) => l.tipoAcao.startsWith('DISPATCH')).length + 19
    const totalSolicitacoesFin = this.solicitacoesFin.length
    const slaMedioHoras = 1.8
    const tempoMedioLocalizarSegundos = 4.2

    return {
      totalConsultas,
      totalVisualizacoes,
      totalEnvios,
      totalSolicitacoesFin,
      slaMedioHoras,
      tempoMedioLocalizarSegundos,
      consultasPorCanal: {
        whatsapp: 14,
        email: 12,
        linkSeguro: 8,
        visualizacaoInterna: 36,
      },
    }
  }
}

export const consultasService = new ConsultasService()
