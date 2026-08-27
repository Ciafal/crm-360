import React from 'react'
import { ReferenceLine } from 'recharts'
import { formatNumberBR } from '@/lib/utils'

export interface AverageReferenceLineProps {
  value: number
  label?: string
  yAxisId?: string | number
  stroke?: string
  strokeDasharray?: string
  unit?: string
  isCurrency?: boolean
  orientation?: 'horizontal' | 'vertical'
}

/**
 * AverageReferenceLine:
 * Linha auxiliar de Média (mensal, histórica, YTD ou diária) desenhada no gráfico Recharts.
 */
export function AverageReferenceLine({
  value,
  label = 'Média',
  yAxisId = 'principal',
  stroke = '#0ea5e9', // Sky blue / ciano elegante
  strokeDasharray = '4 4',
  unit = 't',
  isCurrency = false,
}: AverageReferenceLineProps) {
  if (value === undefined || value === null || isNaN(value) || value <= 0) {
    return null
  }

  const formattedValue = isCurrency
    ? value >= 1_000_000
      ? `R$ ${(value / 1_000_000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} mi`
      : `R$ ${(value / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} mil`
    : `${formatNumberBR(value, value % 1 === 0 ? 0 : 1)} ${unit}`

  return (
    <ReferenceLine
      y={value}
      yAxisId={yAxisId}
      stroke={stroke}
      strokeWidth={1.8}
      strokeDasharray={strokeDasharray}
      label={{
        value: `${label}: ${formattedValue}`,
        position: 'insideTopRight',
        fill: stroke,
        fontSize: 10,
        fontWeight: 600,
      }}
    />
  )
}

export interface PaceReferenceLineProps {
  value: number
  label?: string
  yAxisId?: string | number
  stroke?: string
  strokeDasharray?: string
  unit?: string
  isCurrency?: boolean
}

/**
 * PaceReferenceLine:
 * Linha de Ritmo calculado projetado no gráfico Recharts.
 */
export function PaceReferenceLine({
  value,
  label = 'Ritmo Projetado',
  yAxisId = 'secundario',
  stroke = '#8b5cf6', // Violet
  strokeDasharray = '2 2',
  unit = 't',
  isCurrency = false,
}: PaceReferenceLineProps) {
  if (value === undefined || value === null || isNaN(value) || value <= 0) {
    return null
  }

  const formattedValue = isCurrency
    ? value >= 1_000_000
      ? `R$ ${(value / 1_000_000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} mi`
      : `R$ ${(value / 1_000).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} mil`
    : `${formatNumberBR(value, value % 1 === 0 ? 0 : 1)} ${unit}`

  return (
    <ReferenceLine
      y={value}
      yAxisId={yAxisId}
      stroke={stroke}
      strokeWidth={1.8}
      strokeDasharray={strokeDasharray}
      label={{
        value: `${label}: ${formattedValue}`,
        position: 'insideBottomRight',
        fill: stroke,
        fontSize: 10,
        fontWeight: 600,
      }}
    />
  )
}
