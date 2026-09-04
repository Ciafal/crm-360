/**
 * Helper centralizado de Storage para o CRM 360º CIAFAL
 *
 * Garante o namespace `crm360:` em todas as chaves de localStorage usadas pelo CRM.
 * Implementa MIGRAÇÃO AUTOMÁTICA E TRANSPARENTE:
 * - Se a chave prefixada existir: retorna ela.
 * - Se a chave prefixada NÃO existir mas a chave legada existir:
 *   lê o valor legado, grava na chave prefixada, remove a legada e retorna o valor.
 * - Ao gravar (setItem): sempre grava na chave prefixada.
 * - Ao remover (removeItem): remove tanto a chave prefixada quanto a legada (se existir).
 */

const CRM_STORAGE_PREFIX = 'crm360:'

/**
 * Garante que uma chave de armazenamento esteja prefixada com `crm360:`.
 * Se já contiver o prefixo, retorna a chave sem duplicar.
 */
export function formatCrmStorageKey(key: string): string {
  if (key.startsWith(CRM_STORAGE_PREFIX)) {
    return key
  }
  return `${CRM_STORAGE_PREFIX}${key}`
}

/**
 * Remove o prefixo `crm360:` para recuperar a chave legada correspondente.
 */
export function getLegacyStorageKey(namespacedKey: string): string {
  if (namespacedKey.startsWith(CRM_STORAGE_PREFIX)) {
    return namespacedKey.slice(CRM_STORAGE_PREFIX.length)
  }
  return namespacedKey
}

export const crmStorage = {
  /**
   * Obtém um item do localStorage.
   * Se a chave prefixada existir, retorna.
   * Se não existir, verifica a chave legada (sem prefixo). Se existir, migra automaticamente:
   * grava na prefixada, remove a legada e retorna o dado.
   */
  getItem(key: string): string | null {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null
    }

    const namespacedKey = formatCrmStorageKey(key)
    const legacyKey = getLegacyStorageKey(namespacedKey)

    try {
      const namespacedValue = window.localStorage.getItem(namespacedKey)
      if (namespacedValue !== null) {
        return namespacedValue
      }

      // Se a chave com namespace não existe, tenta migrar da chave legada
      if (legacyKey !== namespacedKey) {
        const legacyValue = window.localStorage.getItem(legacyKey)
        if (legacyValue !== null) {
          // Migração atômica: grava na prefixada e remove legada
          window.localStorage.setItem(namespacedKey, legacyValue)
          window.localStorage.removeItem(legacyKey)
          return legacyValue
        }
      }

      // Se passou a chave legada diretamente
      const directLegacyValue = window.localStorage.getItem(key)
      if (directLegacyValue !== null) {
        window.localStorage.setItem(namespacedKey, directLegacyValue)
        if (key !== namespacedKey) {
          window.localStorage.removeItem(key)
        }
        return directLegacyValue
      }

      return null
    } catch {
      return null
    }
  },

  /**
   * Grava um valor sempre com a chave namespacada `crm360:`.
   */
  setItem(key: string, value: string): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return
    }

    const namespacedKey = formatCrmStorageKey(key)
    try {
      window.localStorage.setItem(namespacedKey, value)
    } catch {
      /* intentionally ignored */
    }
  },

  /**
   * Remove a chave namespacada e também a legada por segurança.
   */
  removeItem(key: string): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return
    }

    const namespacedKey = formatCrmStorageKey(key)
    const legacyKey = getLegacyStorageKey(namespacedKey)

    try {
      window.localStorage.removeItem(namespacedKey)
      if (legacyKey !== namespacedKey) {
        window.localStorage.removeItem(legacyKey)
      }
      if (key !== namespacedKey && key !== legacyKey) {
        window.localStorage.removeItem(key)
      }
    } catch {
      /* intentionally ignored */
    }
  },

  /**
   * Helper tipado para obter objeto parseado em JSON com fallback
   */
  getJSON<T>(key: string, fallback: T): T {
    try {
      const raw = this.getItem(key)
      if (!raw) return fallback
      return JSON.parse(raw) as T
    } catch {
      return fallback
    }
  },

  /**
   * Helper tipado para salvar objeto em JSON
   */
  setJSON<T>(key: string, data: T): void {
    try {
      this.setItem(key, JSON.stringify(data))
    } catch {
      /* intentionally ignored */
    }
  },
}
