// src/tests/consultas-module.test.ts
import { describe, it, expect } from 'vitest'
import { consultasService } from '@/services/consultasService'
import {
  mockNotasFiscais,
  mockBoletos,
  mockCertificados,
  mockPacotesDocumentais,
} from '@/data/mockConsultasData'

describe('Submódulo Consultas CRM 360º CIAFAL', () => {
  const mockUserVendedor = {
    id: 'qas-vendedor_teste',
    name: 'Carlos Mendonça',
    email: 'vendedor.teste@ciafal.local',
    role: 'vendedor',
    seller_code: 'VEND-TEST-01',
  }

  const mockUserAdmin = {
    id: 'qas-admin_teste',
    name: 'Carlos Alberto (Diretoria & Adm)',
    email: 'admin.teste@ciafal.local',
    role: 'administrador',
  }

  it('deve carregar dados demonstrativos de homologação para NFs, Boletos, Certificados e Pacotes', () => {
    expect(mockNotasFiscais.length).toBeGreaterThan(0)
    expect(mockBoletos.length).toBeGreaterThan(0)
    expect(mockCertificados.length).toBeGreaterThan(0)
    expect(mockPacotesDocumentais.length).toBeGreaterThan(0)
  })

  it('deve formatar valores em moeda BRL e peso em "t" (toneladas SI/ABNT)', () => {
    const nf = mockNotasFiscais[0]
    expect(nf.pesoTon).toBe(27.85)
    expect(nf.valorTotal).toBe(162172.5)
    expect(nf.materiais[0].unidade).toBe('t')
  })

  it('deve validar regra de RBAC: vendedor consulta sua carteira e administrador tem acesso ampliado', async () => {
    const resVendedor = await consultasService.buscarDocumentos(mockUserVendedor, {
      termoBusca: '',
    })
    expect(resVendedor.nfs.length).toBeGreaterThan(0)

    const resAdmin = await consultasService.buscarDocumentos(mockUserAdmin, {
      termoBusca: '',
    })
    expect(resAdmin.nfs.length).toBeGreaterThanOrEqual(resVendedor.nfs.length)
  })

  it('deve gerar link seguro temporário sem expor caminhos internos de arquivos', () => {
    const link = consultasService.gerarLinkSeguro(
      mockUserVendedor,
      'cli-1',
      'NF',
      '123456',
    )
    expect(link).toContain('portal.ciafal.com.br/doc-view')
    expect(link).toContain('token=sec_')
    expect(link).not.toContain('/internal/storage')
  })

  it('deve permitir abertura de solicitação de 2ª via ao Financeiro quando boleto estiver vencido', async () => {
    const boletoVencido = mockBoletos.find((b) => b.status === 'Vencido')
    expect(boletoVencido).toBeDefined()

    if (boletoVencido) {
      const sol = await consultasService.solicitarSegundaViaFinanceiro(
        mockUserVendedor,
        boletoVencido,
        'Cliente solicitou prorrogação',
        '2026-09-10',
      )
      expect(sol.protocolo).toContain('SOL-FIN-2026-')
      expect(sol.status).toBe('EM_ANALISE_FINANCEIRO')
      expect(sol.slaHoras).toBe(4)
    }
  })

  it('deve gerar sugestão de mensagem por IA para WhatsApp e E-mail sem alterar dados oficiais', () => {
    const msgWhatsApp = consultasService.gerarSugestaoMensagemIA(
      'Construtora Vale do Aço',
      'Eng. Marcos',
      [{ tipo: 'NF_PDF', numero: '123456' }, { tipo: 'BOLETO_PDF', numero: '334101' }],
      'WHATSAPP',
      'Carlos Mendonça',
    )
    expect(msgWhatsApp).toContain('CIAFAL Ferro & Aço')
    expect(msgWhatsApp).toContain('123456')
    expect(msgWhatsApp).toContain('334101')

    const msgEmail = consultasService.gerarSugestaoMensagemIA(
      'Construtora Vale do Aço',
      'Eng. Marcos',
      [{ tipo: 'NF_PDF', numero: '123456' }],
      'EMAIL',
      'Carlos Mendonça',
    )
    expect(msgEmail).toContain('Prezado(a)')
    expect(msgEmail).toContain('CIAFAL Ferro & Aço')
  })

  it('deve registrar trilha de auditoria LGPD ao consultar e enviar documentos', async () => {
    const initialLogsCount = consultasService.getLogsAuditoria().length

    await consultasService.enviarDocumentosMultiplos(mockUserVendedor, {
      clienteId: 'cli-1',
      canal: 'WHATSAPP',
      destinatarioNome: 'Eng. Marcos',
      destinatarioContato: '(31) 98822-1090',
      documentos: [
        {
          id: 'nf-123456',
          tipo: 'NF_PDF',
          numero: '123456',
          descricao: 'DANFE NF 123456',
        },
      ],
      mensagem: 'Teste de auditoria',
    })

    const finalLogs = consultasService.getLogsAuditoria()
    expect(finalLogs.length).toBeGreaterThan(initialLogsCount)
    expect(finalLogs[0].usuarioId).toBe(mockUserVendedor.id)
    expect(finalLogs[0].tipoAcao).toBe('DISPATCH_WHATSAPP')
  })
})
