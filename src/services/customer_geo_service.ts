import pb from '@/lib/pocketbase/client'
import type { CustomerGeoLocation, GeoLocationOverrideLog } from '@/types/models'
import { defaultGeoProvider } from '@/providers/GeoProvider'

export class CustomerGeoService {
  private memoryCache: Map<string, CustomerGeoLocation> = new Map()

  /**
   * Obtém ou gera a geocodificação do cliente (com cache em banco/memória)
   */
  async getOrGeocodeCustomer(params: {
    customerId: string
    sapCode: string
    address?: string
    city: string
    uf: string
    cep?: string
    fallbackLat?: number
    fallbackLng?: number
  }): Promise<CustomerGeoLocation> {
    const { customerId, sapCode, address, city, uf, cep, fallbackLat, fallbackLng } = params

    // 1. Tentar memória local
    if (this.memoryCache.has(customerId)) {
      return this.memoryCache.get(customerId)!
    }

    // 2. Tentar buscar no PocketBase
    try {
      const records = await pb.collection('customer_geo_locations').getList(1, 1, {
        filter: `customer_id = '${customerId}' || sap_customer_code = '${sapCode}'`,
      })

      if (records.items && records.items.length > 0) {
        const item = records.items[0] as unknown as CustomerGeoLocation
        this.memoryCache.set(customerId, item)
        return item
      }
    } catch (_) {
      // Falha graciosa ou tabela vazia/offline
    }

    // 3. Se tiver coordenadas diretas mockadas ou fornecidas
    if (fallbackLat && fallbackLng) {
      const geoObj: CustomerGeoLocation = {
        id: `geo-${customerId}`,
        collectionId: 'customer_geo_locations',
        collectionName: 'customer_geo_locations',
        customer_id: customerId,
        sap_customer_code: sapCode,
        latitude: fallbackLat,
        longitude: fallbackLng,
        geocoding_source: 'Dados Cadastrais SAP ECC',
        accuracy_level: 'STREET',
        formatted_address: `${address ? address + ', ' : ''}${city} - ${uf}`,
        geocoded_at: new Date().toISOString(),
        last_validated_at: new Date().toISOString(),
        status: 'GEOCODED',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      }
      this.memoryCache.set(customerId, geoObj)
      return geoObj
    }

    // 4. Se não tiver, executar geocodificação via GeoProvider
    const geocoded = await defaultGeoProvider.geocode({
      customerId,
      sapCode,
      address,
      city,
      uf,
      cep,
    })

    const newRecord: CustomerGeoLocation = {
      id: `geo-${customerId}`,
      collectionId: 'customer_geo_locations',
      collectionName: 'customer_geo_locations',
      customer_id: customerId,
      sap_customer_code: sapCode,
      latitude: geocoded.latitude,
      longitude: geocoded.longitude,
      geocoding_source: geocoded.source,
      accuracy_level: geocoded.accuracyLevel,
      formatted_address: geocoded.formattedAddress,
      geocoded_at: new Date().toISOString(),
      last_validated_at: new Date().toISOString(),
      status: geocoded.status,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    }

    // Tentar persistir assincronamente no PB sem bloquear o render
    try {
      await pb.collection('customer_geo_locations').create({
        customer_id: customerId,
        sap_customer_code: sapCode,
        latitude: geocoded.latitude,
        longitude: geocoded.longitude,
        geocoding_source: geocoded.source,
        accuracy_level: geocoded.accuracyLevel,
        formatted_address: geocoded.formattedAddress,
        status: geocoded.status,
      })
    } catch {
      /* intentionally ignored */
    }

    this.memoryCache.set(customerId, newRecord)
    return newRecord
  }

  /**
   * Registro de correção manual da posição do cliente no mapa
   */
  async recordManualOverride(params: {
    customerId: string
    sapCode: string
    previousLat: number
    previousLng: number
    newLat: number
    newLng: number
    reason: string
    userId: string
    userName: string
  }): Promise<CustomerGeoLocation> {
    const {
      customerId,
      sapCode,
      previousLat,
      previousLng,
      newLat,
      newLng,
      reason,
      userId,
      userName,
    } = params

    const updatedGeo: CustomerGeoLocation = {
      id: `geo-${customerId}`,
      collectionId: 'customer_geo_locations',
      collectionName: 'customer_geo_locations',
      customer_id: customerId,
      sap_customer_code: sapCode,
      latitude: newLat,
      longitude: newLng,
      geocoding_source: 'Manual Override (Ajuste Autorizado CRM)',
      accuracy_level: 'MANUAL',
      formatted_address: `Localização ajustada manualmente por ${userName}`,
      geocoded_at: new Date().toISOString(),
      last_validated_at: new Date().toISOString(),
      status: 'MANUAL_OVERRIDE',
      is_manual_override: true,
      manual_override_reason: reason,
      manual_override_by: userName,
      manual_override_at: new Date().toISOString(),
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    }

    this.memoryCache.set(customerId, updatedGeo)

    // Log de auditoria
    try {
      await pb.collection('geo_location_override_logs').create({
        customer_id: customerId,
        previous_lat: previousLat,
        previous_lng: previousLng,
        new_lat: newLat,
        new_lng: newLng,
        reason,
        user_id: userId,
        user_name: userName,
      })
    } catch {
      /* intentionally ignored */
    }

    return updatedGeo
  }
}

export const customerGeoService = new CustomerGeoService()
