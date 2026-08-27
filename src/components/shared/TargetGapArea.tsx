import React from 'react'
import { Area, Bar, Line } from 'recharts'

export interface TargetGapAreaProps {
  dataKey?: string
  yAxisId?: string | number
  positiveGradientId?: string
  negativeGradientId?: string
}

/**
 * TargetGapArea:
 * Renderiza a região sombreada/tracejada de gap entre Realizado/Forecast e Meta.
 * Se o realizado/forecast estiver acima da meta -> área positiva de excedente (superávit verde)
 * Se abaixo -> déficit (alerta âmbar/vermelho)
 */
export function TargetGapArea({
  dataKey = 'gapPositivo',
  yAxisId = 'principal',
  positiveGradientId = 'gapSurplusGradient',
  negativeGradientId = 'gapDeficitGradient',
}: TargetGapAreaProps) {
  return (
    <>
      <Area
        yAxisId={yAxisId}
        type="monotone"
        dataKey="gapPositivo"
        name="Excedente de Meta (Superávit)"
        stroke="#10b981"
        strokeWidth={1}
        strokeDasharray="3 3"
        fill={`url(#${positiveGradientId})`}
      />
      <Area
        yAxisId={yAxisId}
        type="monotone"
        dataKey="gapNegativo"
        name="Déficit de Meta (Gap)"
        stroke="#f59e0b"
        strokeWidth={1}
        strokeDasharray="3 3"
        fill={`url(#${negativeGradientId})`}
      />
    </>
  )
}

/**
 * ActualSeries:
 * Série visual para Realizado (barras sólidas ou linha contínua)
 */
export function ActualSeries({
  yAxisId = 'principal',
  type = 'bar',
}: {
  yAxisId?: string | number
  type?: 'bar' | 'line'
}) {
  if (type === 'line') {
    return (
      <Line
        yAxisId={yAxisId}
        type="monotone"
        dataKey="realizado"
        name="Realizado (Fato)"
        stroke="#1e3a8a"
        strokeWidth={3}
        dot={{ r: 4, fill: '#1e3a8a' }}
        activeDot={{ r: 6 }}
      />
    )
  }
  return (
    <Bar
      yAxisId={yAxisId}
      dataKey="realizado"
      name="Realizado (Fato)"
      fill="url(#realizadoGradient)"
      radius={[4, 4, 0, 0]}
      barSize={24}
    />
  )
}

/**
 * TargetSeries:
 * Série visual para Meta no segundo eixo (linha contínua de referência)
 */
export function TargetSeries({
  yAxisId = 'secundario',
  stroke = '#f59e0b',
}: {
  yAxisId?: string | number
  stroke?: string
}) {
  return (
    <Line
      yAxisId={yAxisId}
      type="monotone"
      dataKey="meta"
      name="Meta (Referência Linha)"
      stroke={stroke}
      strokeWidth={2.5}
      dot={{ r: 4, fill: stroke, strokeWidth: 1, stroke: '#fff' }}
      activeDot={{ r: 6 }}
    />
  )
}

/**
 * ForecastSeries:
 * Série visual para Projeção / Forecast (linha tracejada diferenciada)
 */
export function ForecastSeries({
  yAxisId = 'secundario',
  stroke = '#6366f1',
}: {
  yAxisId?: string | number
  stroke?: string
}) {
  return (
    <Line
      yAxisId={yAxisId}
      type="monotone"
      dataKey="forecast"
      name="Forecast (Projeção Tracejada)"
      stroke={stroke}
      strokeWidth={2}
      strokeDasharray="5 5"
      dot={{ r: 3, fill: stroke }}
    />
  )
}
