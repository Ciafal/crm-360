/* General utility functions (exposes cn) */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges multiple class names into a single string
 * @param inputs - Array of class names
 * @returns Merged class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function exportToCsv(filename: string, rows: Record<string, any>[]): void {
  if (!rows || !rows.length) return
  const separator = ';'
  const keys = Object.keys(rows[0])
  const csvContent =
    '\uFEFF' +
    keys.join(separator) +
    '\n' +
    rows
      .map((row) =>
        keys
          .map((k) => {
            let cell = row[k] === null || row[k] === undefined ? '' : String(row[k])
            cell = cell.replace(/"/g, '""')
            if (cell.search(/([",\n;])/g) >= 0) {
              cell = `"${cell}"`
            }
            return cell
          })
          .join(separator),
      )
      .join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.setAttribute('download', `${filename}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatCurrencyCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    const mi = value / 1_000_000
    return `R$ ${mi.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} mi`
  }
  if (Math.abs(value) >= 1_000) {
    const mil = value / 1_000
    return `R$ ${mil.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })} mil`
  }
  return formatCurrency(value)
}

export function formatNumberBR(value: number, decimals = 0): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function formatWeight(valueInTons: number, decimals = 1): string {
  return `${valueInTons.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals === 0 ? 0 : 1,
    maximumFractionDigits: decimals,
  })} t`
}

export function formatPace(value: number, unit: 't/dia' | 'R$/dia' = 't/dia'): string {
  if (unit === 'R$/dia') {
    if (Math.abs(value) >= 1_000) {
      return `R$ ${formatNumberBR(value / 1000, 1)} mil/dia`
    }
    return `R$ ${formatNumberBR(value, 0)}/dia`
  }
  return `${formatNumberBR(value, 1)} t/dia`
}
