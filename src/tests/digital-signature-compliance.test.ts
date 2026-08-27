import { describe, it, expect } from 'vitest'
import { complianceService } from '@/services/compliance_service'
import { D4SignProvider, DocuSignProvider } from '@/providers'

describe('HCM Compliance & Digital Signature Integration (D4Sign & DocuSign)', () => {
  it('deve carregar políticas com níveis ELECTRONIC e DIGITAL corretamente', async () => {
    const policies = await complianceService.listPolicies()
    expect(policies.length).toBeGreaterThan(0)

    const digitalPolicy = policies.find((p) => p.signature_level === 'DIGITAL')
    expect(digitalPolicy).toBeDefined()
    expect(['D4SIGN', 'DOCUSIGN']).toContain(digitalPolicy?.digital_signature_provider)

    const electronicPolicy = policies.find((p) => p.signature_level === 'ELECTRONIC')
    expect(electronicPolicy).toBeDefined()
  })

  it('D4SignProvider deve criar envelope e responder com status e hash', async () => {
    const provider = new D4SignProvider({ mode: 'mock' })
    expect(provider.isMock).toBe(true)

    const envelope = await provider.createEnvelope(
      {
        name: 'Termo de Confidencialidade NDA',
        documentHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        policyId: 'pol-06',
        policyVersion: 'v2.0',
        deadlineDays: 7,
      },
      [
        {
          name: 'Carlos Mendonça',
          email: 'carlos.mendonca@ciafal.com.br',
          role: 'Signer',
        },
      ],
    )

    expect(envelope.envelopeId).toBeDefined()
    expect(envelope.status).toBe('sent')
    expect(envelope.provider).toBe('D4SIGN')

    const health = await provider.getHealth()
    expect(health.online).toBe(true)
  })

  it('DocuSignProvider deve criar envelope e responder com status e hash', async () => {
    const provider = new DocuSignProvider({ mode: 'mock' })
    expect(provider.isMock).toBe(true)

    const envelope = await provider.createEnvelope(
      {
        name: 'Termo de Responsabilidade por Equipamentos',
        documentHash: 'f0e1d2c3b4a5968778695a4b3c2d1e0f0123456789abcdef0123456789abcdef',
        policyId: 'pol-07',
        policyVersion: 'v1.5',
        deadlineDays: 10,
      },
      [
        {
          name: 'Lucas Ferreira',
          email: 'lucas.ferreira@ciafal.com.br',
          role: 'Signer',
        },
      ],
    )

    expect(envelope.envelopeId).toBeDefined()
    expect(envelope.status).toBe('sent')
    expect(envelope.provider).toBe('DOCUSIGN')

    const health = await provider.getHealth()
    expect(health.online).toBe(true)
  })

  it('deve registrar aceite eletrônico interno mantendo retrocompatibilidade', async () => {
    const acceptance = await complianceService.registerAcceptance(
      'usr-unit-test',
      'TOTVS-9999',
      'Usuário Teste Unitário',
      'teste.unitario@ciafal.com.br',
      'TI & Governança',
      'Analista',
      'pol-01',
      'v2.4',
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    )

    expect(acceptance.status).toBe('EM_CONFORMIDADE')
    expect(acceptance.acceptance_hash).toBeDefined()
  })

  it('deve iniciar envelope digital, listar envelopes e simular assinatura no QAS', async () => {
    const newAcc = await complianceService.initiateDigitalSignatureEnvelope(
      'usr-unit-test-2',
      'TOTVS-9998',
      'Engenheiro Teste',
      'eng.teste@ciafal.com.br',
      'Engenharia',
      'Especialista',
      'pol-06',
      'v2.0',
    )

    expect(newAcc.status).toBe('PENDING_SIGNATURE')
    expect(newAcc.signature_level).toBe('DIGITAL')
    expect(newAcc.envelope_id).toBeDefined()

    // Simula assinatura
    const signedAcc = await complianceService.simulateSignEnvelope(newAcc.envelope_id!)
    expect(signedAcc.status).toBe('SIGNED')
    expect(signedAcc.signature_hash).toBeDefined()
    expect(signedAcc.signed_document_url).toBeDefined()

    // Verifica KPIs calculados
    const kpis = await complianceService.getComplianceKpis()
    expect(kpis.digitalTotal).toBeGreaterThan(0)
    expect(kpis.digitalCompletionRate).toBeGreaterThan(0)
  })

  it('webhook handler deve processar callbacks D4Sign e DocuSign com fidelidade', async () => {
    const d4sProvider = new D4SignProvider()
    const d4sRes = await d4sProvider.webhookHandler({
      uuidDoc: 'd4s-env-test',
      type_post: '1',
      email: 'carlos.mendonca@ciafal.com.br',
      sha256_signature: 'sig-d4s-abc-123',
    })
    expect(d4sRes.event).toBe('signed')
    expect(d4sRes.signatureHash).toBe('sig-d4s-abc-123')

    const dsProvider = new DocuSignProvider()
    const dsRes = await dsProvider.webhookHandler({
      event: 'envelope-completed',
      data: {
        envelopeId: 'ds-env-test',
        recipientEmail: 'lucas.ferreira@ciafal.com.br',
        signatureHash: 'sig-ds-xyz-789',
      },
    })
    expect(dsRes.event).toBe('signed')
    expect(dsRes.signatureHash).toBe('sig-ds-xyz-789')
  })
})
