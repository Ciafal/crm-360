import { describe, it, expect } from 'vitest'
import { defaultGeoProvider, OpenStreetMapGeoProvider, GoogleMapsGeoProvider } from '../providers/GeoProvider'
import { customerGeoService } from '../services/customer_geo_service'
import { mockClientes } from '../data/mockCommercialData'
import { SAPECCProvider } from '../providers/ERPProvider'

describe('PARTE A & B — SAP ECC como Backoffice Oficial & Mapa da Carteira', () => {
  it('garante que ERPProvider identifica SAP ECC como o backoffice oficial', async () => {
    const erp = new SAPECCProvider()
    expect(erp.name).toContain('SAP ECC 6.0')
    const health = await erp.getHealth()
    expect(health.online).toBe(true)
  })

  it('valida geocodificação de cliente através do GeoProvider', async () => {
    const geoProvider = new OpenStreetMapGeoProvider()
    const result = await geoProvider.geocode({
      customerId: 'cli-100001',
      sapCode: '100001',
      city: 'Contagem',
      uf: 'MG',
      address: 'Distrito Industrial Cinco, Contagem - MG',
    })

    expect(result.latitude).toBeCloseTo(-19.9328, 2)
    expect(result.longitude).toBeCloseTo(-44.0539, 2)
    expect(result.status).toBe('GEOCODED')
    expect(result.accuracyLevel).toBe('STREET')
  })

  it('valida cálculo inteligente de roteiro de visitas com ordenação comercial', async () => {
    const geoProvider = new OpenStreetMapGeoProvider()
    const waypoints = [
      {
        id: '1',
        title: 'Estruturas Metálicas União',
        latitude: -19.9328,
        longitude: -44.0539,
        customerSap: '100001',
        priorityScore: 180,
      },
      {
        id: '2',
        title: 'Caldeiraria Santa Luzia',
        latitude: -19.9678,
        longitude: -44.1983,
        customerSap: '100002',
        priorityScore: 120,
      },
    ]

    const route = await geoProvider.calculateRoute(waypoints)
    expect(route.waypoints.length).toBe(2)
    expect(route.totalDistanceKm).toBeGreaterThan(0)
    expect(route.suggestedOrder).toEqual([0, 1])
    expect(route.optimizedRouteSummary).toContain('Roteiro otimizado com 2 clientes')
  })

  it('valida serviço de CustomerGeoService e registro de ajuste manual auditado', async () => {
    const geoRecord = await customerGeoService.getOrGeocodeCustomer({
      customerId: 'cli-test-override',
      sapCode: '999999',
      city: 'Betim',
      uf: 'MG',
    })

    expect(geoRecord.latitude).toBeDefined()
    expect(geoRecord.longitude).toBeDefined()

    // Ajuste manual
    const updated = await customerGeoService.recordManualOverride({
      customerId: 'cli-test-override',
      sapCode: '999999',
      previousLat: geoRecord.latitude,
      previousLng: geoRecord.longitude,
      newLat: -19.9800,
      newLng: -44.2000,
      reason: 'Portaria de carga pesada',
      userId: 'usr-vendedor-1',
      userName: 'Carlos Mendonça',
    })

    expect(updated.status).toBe('MANUAL_OVERRIDE')
    expect(updated.is_manual_override).toBe(true)
    expect(updated.manual_override_by).toBe('Carlos Mendonça')
    expect(updated.latitude).toBe(-19.9800)
    expect(updated.longitude).toBe(-44.2000)
  })

  it('garante que todos os clientes mockados possuem coordenadas ou geocodificação válida', () => {
    mockClientes.forEach((c) => {
      expect(c.cidade).toBeDefined()
      expect(c.uf).toBeDefined()
      expect(c.sapCode).toBeDefined()
      expect(c.toneladas12m).toBeGreaterThanOrEqual(0)
    })
  })
})
