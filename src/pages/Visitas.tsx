import React, { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  MapPin,
  Calendar,
  Clock,
  Play,
  Square,
  CheckCircle2,
  AlertTriangle,
  Mic,
  MicOff,
  Sparkles,
  Search,
  Filter,
  Plus,
  ArrowRight,
  Building2,
  User,
  Wrench,
  Briefcase,
  FileText,
  Navigation,
  ShieldCheck,
  RefreshCw,
  Edit,
  Trash2,
  Eye,
  Check,
  X,
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { mockVisitas, mockClientes, mockEquipe } from '@/data/mockCommercialData'
import type {
  Visit,
  VisitType,
  VisitStatus,
  CommercialVisitFormData,
  TechnicalVisitFormData,
} from '@/types/models'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PageLoadingState, PageEmptyState, PageErrorState } from '@/components/shared/StateFeedback'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const VISIT_GEOFENCE_RADIUS_METERS = 300

// Helper para calcular distância Haversine em metros
function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3 // metros
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c)
}

export default function Visitas() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [visits, setVisits] = useState<Visit[]>(mockVisitas)
  const [activeTab, setActiveTab] = useState<string>(searchParams.get('tab') || 'hoje')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [vendedorFilter, setVendedorFilter] = useState('todos')
  const [tipoFilter, setTipoFilter] = useState('todos')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [cidadeFilter, setCidadeFilter] = useState('todos')

  // Estado da Visita em Andamento (cronômetro)
  const [activeVisitId, setActiveVisitId] = useState<string | null>(null)
  const [activeStartTime, setActiveStartTime] = useState<number | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0)

  // Modal de Finalização & Formulário
  const [finishModalOpen, setFinishModalOpen] = useState(false)
  const [selectedVisitForModal, setSelectedVisitForModal] = useState<Visit | null>(null)
  const [formCommercial, setFormCommercial] = useState<CommercialVisitFormData>({})
  const [formTechnical, setFormTechnical] = useState<TechnicalVisitFormData>({})

  // Modal de Nova Visita
  const [newVisitModalOpen, setNewVisitModalOpen] = useState(false)
  const [newVisitData, setNewVisitData] = useState({
    customerId: '',
    type: 'COMMERCIAL_VISIT' as VisitType,
    planned_date: new Date().toISOString().split('T')[0],
    planned_time: '10:00',
    objective: '',
    participants: '',
  })

  // Áudio & IA
  const [isRecording, setIsRecording] = useState(false)
  const [audioTranscription, setAudioTranscription] = useState('')
  const [aiSummarySuggested, setAiSummarySuggested] = useState('')
  const [aiSummaryStatus, setAiSummaryStatus] = useState<
    'SUGGESTED' | 'ACCEPTED' | 'REJECTED' | 'EDITED' | null
  >(null)
  const [isAiLoading, setIsAiLoading] = useState(false)

  const timerRef = useRef<any>(null)

  // Cronômetro da Visita Ativa
  useEffect(() => {
    if (activeVisitId && activeStartTime) {
      timerRef.current = setInterval(() => {
        const now = Date.now()
        setElapsedSeconds(Math.floor((now - activeStartTime) / 1000))
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [activeVisitId, activeStartTime])

  const formatTimer = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Filtragem de visitas por aba e filtros
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])

  const filteredVisits = useMemo(() => {
    return visits.filter((v) => {
      const matchSearch =
        v.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.sap_code.includes(searchTerm) ||
        v.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.objective.toLowerCase().includes(searchTerm.toLowerCase())

      const matchVendedor =
        vendedorFilter === 'todos' ||
        (v.seller_name && v.seller_name.toLowerCase().includes(vendedorFilter.toLowerCase()))

      const matchTipo = tipoFilter === 'todos' || v.type === tipoFilter
      const matchStatus = statusFilter === 'todos' || v.status === statusFilter
      const matchCidade = cidadeFilter === 'todos' || v.city === cidadeFilter

      return matchSearch && matchVendedor && matchTipo && matchStatus && matchCidade
    })
  }, [visits, searchTerm, vendedorFilter, tipoFilter, statusFilter, cidadeFilter])

  // Divisão por abas
  const visitsHoje = useMemo(() => {
    return filteredVisits.filter(
      (v) =>
        (v.planned_date === todayStr || v.status === 'EM_ANDAMENTO' || v.status === 'CHECK_IN') &&
        v.status !== 'CONCLUIDA',
    )
  }, [filteredVisits, todayStr])

  const visitsProximas = useMemo(() => {
    return filteredVisits.filter(
      (v) => v.planned_date > todayStr && v.status !== 'CONCLUIDA' && v.status !== 'CANCELADA',
    )
  }, [filteredVisits, todayStr])

  const visitsRealizadas = useMemo(() => {
    return filteredVisits.filter((v) => v.status === 'CONCLUIDA')
  }, [filteredVisits])

  const visitsPendentes = useMemo(() => {
    return filteredVisits.filter(
      (v) => (v.status === 'PLANEJADA' || v.status === 'REAGENDADA') && v.planned_date >= todayStr,
    )
  }, [filteredVisits, todayStr])

  const visitsAtrasadas = useMemo(() => {
    return filteredVisits.filter(
      (v) => v.planned_date < todayStr && v.status !== 'CONCLUIDA' && v.status !== 'CANCELADA',
    )
  }, [filteredVisits, todayStr])

  // Ações de Início de Visita (Check-in + GPS + Geofence)
  const handleStartVisit = (visit: Visit) => {
    if (activeVisitId && activeVisitId !== visit.id) {
      toast.warning('Já existe uma visita em andamento! Finalize-a antes de iniciar outra.')
      return
    }

    toast.info('Obtendo localização GPS para check-in...')

    const simulateCheckIn = (lat: number, lon: number, accuracy: number) => {
      const targetLat = visit.target_latitude || -19.9328
      const targetLon = visit.target_longitude || -44.0539
      const distance = calculateDistanceMeters(lat, lon, targetLat, targetLon)
      const withinGeofence = distance <= VISIT_GEOFENCE_RADIUS_METERS

      const startTime = Date.now()
      setActiveVisitId(visit.id)
      setActiveStartTime(startTime)
      setElapsedSeconds(0)

      setVisits((prev) =>
        prev.map((v) =>
          v.id === visit.id
            ? {
                ...v,
                status: 'EM_ANDAMENTO',
                latitude: lat,
                longitude: lon,
                gps_accuracy: accuracy,
                is_within_geofence: withinGeofence,
                geofence_distance_meters: distance,
                started_at: new Date().toISOString(),
              }
            : v,
        ),
      )

      if (withinGeofence) {
        toast.success(
          `Check-in realizado no local (${distance}m do cliente)! Status: EM ANDAMENTO.`,
          {
            icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
          },
        )
      } else {
        toast.warning(
          `Check-in realizado fora do raio esperado (${distance}m do cliente, limite ${VISIT_GEOFENCE_RADIUS_METERS}m). Visita iniciada normalmente.`,
          {
            icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
          },
        )
      }
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          simulateCheckIn(
            pos.coords.latitude,
            pos.coords.longitude,
            Math.round(pos.coords.accuracy || 10),
          )
        },
        (err) => {
          // Fallback gracioso com coordenadas simuladas próximas
          simulateCheckIn(
            (visit.target_latitude || -19.9328) + 0.0012,
            (visit.target_longitude || -44.0539) + 0.001,
            15,
          )
        },
        { enableHighAccuracy: true, timeout: 5000 },
      )
    } else {
      simulateCheckIn(visit.target_latitude || -19.9328, visit.target_longitude || -44.0539, 15)
    }
  }

  // Ação de Finalizar Visita (Check-out + Form + Modal)
  const handleOpenFinishModal = (visit: Visit) => {
    setSelectedVisitForModal(visit)
    if (visit.type === 'COMMERCIAL_VISIT') {
      setFormCommercial(
        (visit.form_data as CommercialVisitFormData) || {
          objective: visit.objective,
          customer_contact: visit.contact_name,
          participants: visit.participants || '',
          next_action: visit.next_action || '',
        },
      )
    } else {
      setFormTechnical(
        (visit.form_data as TechnicalVisitFormData) || {
          technical_objective: visit.objective,
          problem_description: '',
          technical_need: '',
          responsible_person: visit.contact_name,
          next_action: visit.next_action || '',
        },
      )
    }
    setAudioTranscription(visit.audio_transcription || '')
    setAiSummarySuggested(visit.ai_summary || '')
    setAiSummaryStatus(visit.ai_summary_status || null)
    setFinishModalOpen(true)
  }

  const handleFinishVisitConfirm = () => {
    if (!selectedVisitForModal) return

    const now = new Date()
    const durationMins = activeStartTime
      ? Math.max(1, Math.round((Date.now() - activeStartTime) / 60000))
      : selectedVisitForModal.duration_minutes || 45

    const updatedFormData =
      selectedVisitForModal.type === 'COMMERCIAL_VISIT' ? formCommercial : formTechnical

    const nextAction =
      selectedVisitForModal.type === 'COMMERCIAL_VISIT'
        ? formCommercial.next_action || 'Follow-up com cotação formal'
        : formTechnical.next_action || 'Emitir laudo técnico'

    const nextActionDate =
      selectedVisitForModal.type === 'COMMERCIAL_VISIT'
        ? formCommercial.next_action_date || '18/10/2024'
        : formTechnical.next_action_date || '18/10/2024'

    setVisits((prev) =>
      prev.map((v) =>
        v.id === selectedVisitForModal.id
          ? {
              ...v,
              status: 'CONCLUIDA',
              ended_at: now.toISOString(),
              duration_minutes: durationMins,
              checkout_latitude: v.latitude || -19.9328,
              checkout_longitude: v.longitude || -44.0539,
              form_data: updatedFormData,
              audio_transcription: audioTranscription,
              ai_summary: aiSummarySuggested,
              ai_summary_status: aiSummaryStatus || 'ACCEPTED',
              next_action: nextAction,
              next_action_date: nextActionDate,
            }
          : v,
      ),
    )

    // Se a visita finalizada era a ativa no cronômetro
    if (activeVisitId === selectedVisitForModal.id) {
      setActiveVisitId(null)
      setActiveStartTime(null)
      setElapsedSeconds(0)
    }

    setFinishModalOpen(false)
    toast.success('Visita finalizada com sucesso!', {
      description: `Duração: ${durationMins} min. Interação criada na Timeline do Cliente 360º e Ação registrada no Meu Dia.`,
    })
  }

  // Simulação de Ditado por Áudio (Speech-to-Text) e Resumo IA
  const handleToggleRecordAudio = () => {
    if (isRecording) {
      setIsRecording(false)
      setIsAiLoading(true)
      toast.info('Processando transcrição e gerando resumo com IA...')

      setTimeout(() => {
        const mockTrans =
          selectedVisitForModal?.type === 'COMMERCIAL_VISIT'
            ? 'Reunião realizada com o gerente de compras Eduardo. Discutimos a entrega de 16.5 toneladas de Perfis W 200x26.6 para a safra modular de galpões. O cliente solicitou condição CIF e prazo 28/42 DDL. Concorrente ofereceu prazo menor, mas temos garantia de entrega em 48h pelo CD Contagem. Ficou acertado envio da cotação formal até amanhã.'
            : 'Inspeção técnica realizada no pátio de caldeiraria com o engenheiro Roberto. Testamos amostras de chapas grossas ASTM A36 12.5mm quanto à conformabilidade e solda MIG. Material 100% aprovado sem trincas. Pendência: anexar certificado de análise química de usina Gerdau. Próxima ação: liberar cotação de 22 toneladas.'

        const mockSummary =
          selectedVisitForModal?.type === 'COMMERCIAL_VISIT'
            ? 'Cliente com demanda imediata de 16.5t Perfis W. Objeção superada com entrega em 48h. Condição negociada CIF 28/42 DDL. Próxima ação: emitir cotação SAP COT-98104.'
            : 'Inspeção de conformabilidade e soldabilidade das Chapas Grossas A36 aprovada. Sem não-conformidades. Próxima ação: anexar certificado de usina e emitir cotação de 22t.'

        setAudioTranscription(mockTrans)
        setAiSummarySuggested(mockSummary)
        setAiSummaryStatus('SUGGESTED')
        setIsAiLoading(false)
        toast.success('Transcrição e Resumo Sugerido pela IA gerados com sucesso!')
      }, 1500)
    } else {
      setIsRecording(true)
      toast.info('Gravando áudio do resumo da visita (fale pelo microfone)...')
    }
  }

  const handleAcceptAiSummary = () => {
    setAiSummaryStatus('ACCEPTED')
    if (selectedVisitForModal?.type === 'COMMERCIAL_VISIT') {
      setFormCommercial((prev) => ({
        ...prev,
        identified_need: 'Demanda de 16.5t Perfis W para novos galpões modulares.',
        product: 'Perfil W Laminado 200 x 26.6',
        product_family: 'Perfis Laminados',
        quantity: '16.5 toneladas',
        discussed_price: 'R$ 6,85 / kg',
        potential_volume: '95000',
        commercial_conditions: 'Frete CIF incluso / Prazo 28/42 DDL',
        competitors: 'Distribuidor Regional (prazo menor)',
        next_action: 'Emitir cotação formal COT-SAP-98104',
        next_action_date: '18/10/2024',
        observations: aiSummarySuggested,
      }))
    } else {
      setFormTechnical((prev) => ({
        ...prev,
        application: 'Caldeiraria pesada / Tanques 50m³',
        product: 'Chapa Grossa A36 12.5mm',
        material: 'ASTM A36',
        tests_performed: 'Ensaio de dobra e solda MIG/MAG',
        technical_recommendation: 'Material 100% aprovado para calandragem',
        pendency: 'Certificado de usina Gerdau',
        next_action: 'Emitir laudo técnico e liberar cotação de 22t',
        next_action_date: '18/10/2024',
        observations: aiSummarySuggested,
      }))
    }
    toast.success('Campos do formulário preenchidos automaticamente pela IA!')
  }

  const handleCreateNewVisit = () => {
    if (!newVisitData.customerId || !newVisitData.objective) {
      toast.error('Selecione um cliente e informe o objetivo da visita.')
      return
    }

    const cliente = mockClientes.find((c) => c.id === newVisitData.customerId)
    if (!cliente) return

    const newV: Visit = {
      id: `vis-${Date.now()}`,
      customer_id: cliente.id,
      customer_name: cliente.razaoSocial,
      sap_code: cliente.sapCode,
      city: cliente.cidade,
      uf: cliente.uf,
      contact_name: cliente.nomeFantasia || 'Contato Principal',
      type: newVisitData.type,
      status: 'PLANEJADA',
      planned_date: newVisitData.planned_date,
      planned_time: newVisitData.planned_time,
      objective: newVisitData.objective,
      participants: newVisitData.participants || user?.name || 'Vendedor',
      user_id: user?.id || 'qas-vendedor_teste',
      seller_name: user?.name || 'Carlos Mendonça',
      supervisor_id: 'qas-supervisor_teste',
      target_latitude: cliente.latitude || -19.9328,
      target_longitude: cliente.longitude || -44.0539,
      next_action: 'Preparar material de apresentação',
      created_at: new Date().toISOString(),
    }

    setVisits((prev) => [newV, ...prev])
    setNewVisitModalOpen(false)
    setNewVisitData({
      customerId: '',
      type: 'COMMERCIAL_VISIT',
      planned_date: todayStr,
      planned_time: '10:00',
      objective: '',
      participants: '',
    })
    toast.success('Visita agendada com sucesso!')
  }

  // Renderizador de Card da Visita
  const renderVisitCard = (visit: Visit) => {
    const isCommercial = visit.type === 'COMMERCIAL_VISIT'
    const isOngoing = visit.status === 'EM_ANDAMENTO' || visit.status === 'CHECK_IN'
    const isCompleted = visit.status === 'CONCLUIDA'
    const isDelayed = visit.planned_date < todayStr && !isCompleted

    return (
      <Card
        key={visit.id}
        className={cn(
          'rounded-2xl border transition-all hover:shadow-md p-4 flex flex-col justify-between gap-3',
          isOngoing
            ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400'
            : isDelayed
              ? 'bg-rose-50/40 border-rose-200'
              : 'bg-white border-border/60',
        )}
      >
        <div className="space-y-2">
          {/* Top Header do Card */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge
                  className={cn(
                    'text-[10px] font-bold border-none gap-1',
                    isCommercial ? 'bg-primary/10 text-primary' : 'bg-amber-100 text-amber-900',
                  )}
                >
                  {isCommercial ? (
                    <Briefcase className="w-3 h-3" />
                  ) : (
                    <Wrench className="w-3 h-3" />
                  )}
                  {isCommercial ? 'VISITA COMERCIAL' : 'VISITA TÉCNICA'}
                </Badge>

                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px] font-bold',
                    visit.status === 'CONCLUIDA'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : isOngoing
                        ? 'bg-emerald-600 text-white border-none animate-pulse'
                        : isDelayed
                          ? 'bg-rose-50 text-rose-700 border-rose-300'
                          : 'bg-slate-50 text-slate-700 border-slate-300',
                  )}
                >
                  {visit.status === 'EM_ANDAMENTO' ? 'EM ANDAMENTO' : visit.status}
                </Badge>
              </div>

              <h4
                onClick={() => navigate(`/crm/${visit.customer_id}`)}
                className="font-bold text-sm text-primary hover:underline cursor-pointer mt-1.5 line-clamp-1"
              >
                {visit.customer_name}
              </h4>
              <span className="text-xs text-muted-foreground font-mono">
                SAP #{visit.sap_code} · {visit.city}/{visit.uf}
              </span>
            </div>

            {/* Geofence Status Badge */}
            {visit.geofence_distance_meters !== undefined && (
              <Badge
                className={cn(
                  'text-[9px] font-bold border-none shrink-0',
                  visit.is_within_geofence
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800',
                )}
              >
                {visit.is_within_geofence
                  ? '📍 No local'
                  : `⚠ Fora raio (${visit.geofence_distance_meters}m)`}
              </Badge>
            )}
          </div>

          {/* Dados de Contato e Horário */}
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 bg-slate-50/80 p-2.5 rounded-xl border border-border/30">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span>
                {visit.planned_date} às <strong>{visit.planned_time}</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">{visit.contact_name}</span>
            </div>
          </div>

          {/* Objetivo */}
          <p className="text-xs text-slate-800 font-medium line-clamp-2">
            <strong className="text-primary">Objetivo:</strong> {visit.objective}
          </p>

          {/* Próxima Ação ou Resumo IA */}
          {visit.next_action && (
            <div className="text-[11px] text-slate-600 bg-amber-50/60 border border-amber-200/60 p-2 rounded-lg flex items-start gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Próxima Ação:</strong> {visit.next_action}
                {visit.next_action_date && (
                  <span className="text-muted-foreground block text-[10px]">
                    Prazo: {visit.next_action_date}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Duração se finalizada ou em andamento */}
          {isOngoing && (
            <div className="flex items-center justify-between bg-emerald-100/70 text-emerald-900 px-3 py-1.5 rounded-xl font-mono text-xs font-bold">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 animate-spin" /> TEMPO EM VISITA:
              </span>
              <span className="text-sm text-emerald-800">{formatTimer(elapsedSeconds)}</span>
            </div>
          )}

          {isCompleted && visit.duration_minutes && (
            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
              <span>
                Duração total: <strong>{visit.duration_minutes} min</strong>
              </span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Concluída
              </span>
            </div>
          )}
        </div>

        {/* Rodapé de Ações do Card */}
        <div className="pt-2 border-t border-border/30 flex items-center justify-between gap-2">
          <span className="text-[10px] text-muted-foreground truncate">
            Resp: <strong>{visit.seller_name || 'Carlos Mendonça'}</strong>
          </span>

          <div className="flex items-center gap-1.5">
            {/* Botão de Iniciar Check-in */}
            {!isCompleted && !isOngoing && (
              <Button
                size="sm"
                onClick={() => handleStartVisit(visit)}
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1 font-semibold"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> INICIAR VISITA
              </Button>
            )}

            {/* Botão de Finalizar Visita */}
            {isOngoing && (
              <Button
                size="sm"
                onClick={() => handleOpenFinishModal(visit)}
                className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white gap-1 font-semibold animate-pulse"
              >
                <Square className="w-3.5 h-3.5 fill-current" /> FINALIZAR VISITA
              </Button>
            )}

            {/* Botão de Ver Detalhes / Formulário */}
            {isCompleted && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleOpenFinishModal(visit)}
                className="h-8 text-xs text-primary border-primary/30 hover:bg-primary/10 gap-1"
              >
                <FileText className="w-3.5 h-3.5" /> Ver Relatório
              </Button>
            )}
          </div>
        </div>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-8">
        <PageLoadingState message="Carregando módulo de visitas..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-8">
        <PageErrorState
          title="Erro ao carregar visitas comerciais."
          description={error}
          onRetry={() => {
            setError(null)
            setLoading(false)
          }}
        />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in pb-16">
      {/* BANNER FLUTUANTE DE VISITA ATIVA COM CRONÔMETRO */}
      {activeVisitId && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xl sticky top-20 z-30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl animate-pulse">
              <Navigation className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-200 block">
                CHECK-IN ATIVO NO CLIENTE
              </span>
              <p className="text-sm font-semibold text-white">
                Visita em andamento:{' '}
                <strong>{visits.find((v) => v.id === activeVisitId)?.customer_name}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-black/20 px-3.5 py-1.5 rounded-xl border border-white/20 text-center font-mono">
              <span className="text-[9px] uppercase tracking-wider text-emerald-200 block">
                TEMPO DE VISITA
              </span>
              <span className="text-lg font-bold text-white tracking-widest">
                {formatTimer(elapsedSeconds)}
              </span>
            </div>

            <Button
              size="sm"
              onClick={() => {
                const v = visits.find((item) => item.id === activeVisitId)
                if (v) handleOpenFinishModal(v)
              }}
              className="bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-bold shadow-md gap-1"
            >
              <Square className="w-3.5 h-3.5 fill-current text-rose-600" /> FINALIZAR AGORA
            </Button>
          </div>
        </div>
      )}

      {/* CABEÇALHO DO MÓDULO DE VISITAS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-primary/10 rounded-2xl">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-3xl font-bold text-primary tracking-tight">
                  Visitas Comerciais & Técnicas
                </h1>
                <Badge
                  variant="outline"
                  className="text-xs bg-emerald-50 text-emerald-700 border-emerald-300"
                >
                  Check-in com Geofence (300m)
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground font-sans mt-0.5">
                Gestão de deslocamento, registro de presenças em campo, ditado com IA e integração
                360º.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/crm?tab=mapa')}
            className="h-9 gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/5 font-semibold"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Abrir no Mapa da Carteira
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLoading(true)
              setTimeout(() => setLoading(false), 200)
            }}
            className="h-9 gap-1.5 text-xs text-muted-foreground"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Atualizar
          </Button>

          <Button
            size="sm"
            onClick={() => setNewVisitModalOpen(true)}
            className="h-9 gap-1.5 text-xs bg-primary text-white font-semibold"
          >
            <Plus className="w-3.5 h-3.5" /> Agendar Nova Visita
          </Button>
        </div>
      </div>

      {/* CARDS DE RESUMO DE VISITAS (KPIS SUPERIORES) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card
          onClick={() => setActiveTab('hoje')}
          className={cn(
            'p-3.5 rounded-2xl border cursor-pointer transition-all shadow-xs',
            activeTab === 'hoje' ? 'bg-primary text-white' : 'bg-white/80 hover:bg-slate-50',
          )}
        >
          <span
            className={cn(
              'text-[10px] font-bold uppercase tracking-wider block',
              activeTab === 'hoje' ? 'text-blue-100' : 'text-muted-foreground',
            )}
          >
            Hoje
          </span>
          <span className="font-serif text-2xl font-bold block mt-1">{visitsHoje.length}</span>
          <span
            className={cn(
              'text-[10px] block',
              activeTab === 'hoje' ? 'text-blue-200' : 'text-emerald-600 font-semibold',
            )}
          >
            Planejadas / Em campo
          </span>
        </Card>

        <Card
          onClick={() => setActiveTab('proximas')}
          className={cn(
            'p-3.5 rounded-2xl border cursor-pointer transition-all shadow-xs',
            activeTab === 'proximas' ? 'bg-primary text-white' : 'bg-white/80 hover:bg-slate-50',
          )}
        >
          <span
            className={cn(
              'text-[10px] font-bold uppercase tracking-wider block',
              activeTab === 'proximas' ? 'text-blue-100' : 'text-muted-foreground',
            )}
          >
            Próximas
          </span>
          <span className="font-serif text-2xl font-bold block mt-1">{visitsProximas.length}</span>
          <span
            className={cn(
              'text-[10px] block',
              activeTab === 'proximas' ? 'text-blue-200' : 'text-slate-500',
            )}
          >
            Amanhã em diante
          </span>
        </Card>

        <Card
          onClick={() => setActiveTab('realizadas')}
          className={cn(
            'p-3.5 rounded-2xl border cursor-pointer transition-all shadow-xs',
            activeTab === 'realizadas' ? 'bg-primary text-white' : 'bg-white/80 hover:bg-slate-50',
          )}
        >
          <span
            className={cn(
              'text-[10px] font-bold uppercase tracking-wider block',
              activeTab === 'realizadas' ? 'text-blue-100' : 'text-emerald-700',
            )}
          >
            Realizadas
          </span>
          <span
            className={cn(
              'font-serif text-2xl font-bold block mt-1',
              activeTab === 'realizadas' ? 'text-white' : 'text-emerald-600',
            )}
          >
            {visitsRealizadas.length}
          </span>
          <span
            className={cn(
              'text-[10px] block',
              activeTab === 'realizadas' ? 'text-blue-200' : 'text-emerald-600 font-semibold',
            )}
          >
            Com laudo & transcrição
          </span>
        </Card>

        <Card
          onClick={() => setActiveTab('pendentes')}
          className={cn(
            'p-3.5 rounded-2xl border cursor-pointer transition-all shadow-xs',
            activeTab === 'pendentes' ? 'bg-primary text-white' : 'bg-white/80 hover:bg-slate-50',
          )}
        >
          <span
            className={cn(
              'text-[10px] font-bold uppercase tracking-wider block',
              activeTab === 'pendentes' ? 'text-blue-100' : 'text-amber-700',
            )}
          >
            Pendentes
          </span>
          <span
            className={cn(
              'font-serif text-2xl font-bold block mt-1',
              activeTab === 'pendentes' ? 'text-white' : 'text-amber-600',
            )}
          >
            {visitsPendentes.length}
          </span>
          <span
            className={cn(
              'text-[10px] block',
              activeTab === 'pendentes' ? 'text-blue-200' : 'text-muted-foreground',
            )}
          >
            Aguardando check-in
          </span>
        </Card>

        <Card
          onClick={() => setActiveTab('atrasadas')}
          className={cn(
            'p-3.5 rounded-2xl border cursor-pointer transition-all shadow-xs',
            activeTab === 'atrasadas'
              ? 'bg-rose-700 text-white'
              : 'bg-rose-50/70 border-rose-200 hover:bg-rose-100/50',
          )}
        >
          <span
            className={cn(
              'text-[10px] font-bold uppercase tracking-wider block',
              activeTab === 'atrasadas' ? 'text-rose-200' : 'text-rose-700',
            )}
          >
            Atrasadas
          </span>
          <span
            className={cn(
              'font-serif text-2xl font-bold block mt-1',
              activeTab === 'atrasadas' ? 'text-white' : 'text-rose-600',
            )}
          >
            {visitsAtrasadas.length}
          </span>
          <span
            className={cn(
              'text-[10px] block',
              activeTab === 'atrasadas' ? 'text-rose-200' : 'text-rose-600 font-semibold',
            )}
          >
            Requer reagendamento
          </span>
        </Card>
      </div>

      {/* BARRA DE FILTROS */}
      <Card className="bg-white/80 backdrop-blur-md border-border/40 shadow-xs rounded-2xl p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente, SAP, cidade, contato ou objetivo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 text-xs rounded-xl"
            />
          </div>

          <div>
            <Select value={vendedorFilter} onValueChange={setVendedorFilter}>
              <SelectTrigger className="h-10 text-xs rounded-xl">
                <SelectValue placeholder="Vendedor / Resp." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Vendedores</SelectItem>
                <SelectItem value="Carlos Mendonça">Carlos Mendonça</SelectItem>
                <SelectItem value="Mariana Azevedo">Mariana Azevedo</SelectItem>
                <SelectItem value="João Pedro">João Pedro Representações</SelectItem>
                <SelectItem value="Marcos Vinícius">Marcos Vinícius (Supervisor)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="h-10 text-xs rounded-xl">
                <SelectValue placeholder="Tipo de Visita" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Tipos</SelectItem>
                <SelectItem value="COMMERCIAL_VISIT">Comercial</SelectItem>
                <SelectItem value="TECHNICAL_VISIT">Técnica</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select value={cidadeFilter} onValueChange={setCidadeFilter}>
              <SelectTrigger className="h-10 text-xs rounded-xl">
                <SelectValue placeholder="Cidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas Cidades</SelectItem>
                <SelectItem value="Contagem">Contagem / MG</SelectItem>
                <SelectItem value="Betim">Betim / MG</SelectItem>
                <SelectItem value="Belo Horizonte">Belo Horizonte / MG</SelectItem>
                <SelectItem value="Juiz de Fora">Juiz de Fora / MG</SelectItem>
                <SelectItem value="Ipatinga">Ipatinga / MG</SelectItem>
                <SelectItem value="Itaúna">Itaúna / MG</SelectItem>
                <SelectItem value="Sete Lagoas">Sete Lagoas / MG</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* ABAS DE VISITAS */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <div className="border-b border-border/40 pb-px">
          <TabsList className="bg-transparent p-0 h-auto gap-2 flex-wrap">
            <TabsTrigger
              value="hoje"
              className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl px-4 py-2.5 text-xs font-semibold gap-1.5"
            >
              <Calendar className="w-4 h-4" /> Visitas de Hoje ({visitsHoje.length})
            </TabsTrigger>
            <TabsTrigger
              value="proximas"
              className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl px-4 py-2.5 text-xs font-semibold gap-1.5"
            >
              <Clock className="w-4 h-4" /> Próximas Visitas ({visitsProximas.length})
            </TabsTrigger>
            <TabsTrigger
              value="realizadas"
              className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl px-4 py-2.5 text-xs font-semibold gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> Visitas Realizadas ({visitsRealizadas.length})
            </TabsTrigger>
            <TabsTrigger
              value="pendentes"
              className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl px-4 py-2.5 text-xs font-semibold gap-1.5"
            >
              <Clock className="w-4 h-4" /> Visitas Pendentes ({visitsPendentes.length})
            </TabsTrigger>
            <TabsTrigger
              value="atrasadas"
              className="data-[state=active]:bg-rose-700 data-[state=active]:text-white rounded-xl px-4 py-2.5 text-xs font-semibold gap-1.5 text-rose-700"
            >
              <AlertTriangle className="w-4 h-4" /> Visitas Atrasadas ({visitsAtrasadas.length})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ABA: HOJE */}
        <TabsContent value="hoje" className="space-y-4 m-0">
          {visitsHoje.length === 0 ? (
            <Card className="p-8">
              <PageEmptyState
                title="Nenhuma visita planejada para hoje."
                description="Você não possui compromissos presenciais agendados para a data de hoje."
                actionLabel="Agendar Visita"
                onAction={() => setNewVisitModalOpen(true)}
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visitsHoje.map((v) => renderVisitCard(v))}
            </div>
          )}
        </TabsContent>

        {/* ABA: PRÓXIMAS */}
        <TabsContent value="proximas" className="space-y-4 m-0">
          {visitsProximas.length === 0 ? (
            <Card className="p-8">
              <PageEmptyState
                title="Nenhuma próxima visita agendada."
                description="Planeje sua rota e visitas presenciais com antecedência."
                actionLabel="Agendar Visita"
                onAction={() => setNewVisitModalOpen(true)}
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visitsProximas.map((v) => renderVisitCard(v))}
            </div>
          )}
        </TabsContent>

        {/* ABA: REALIZADAS */}
        <TabsContent value="realizadas" className="space-y-4 m-0">
          {visitsRealizadas.length === 0 ? (
            <Card className="p-8">
              <PageEmptyState
                title="Nenhuma visita realizada encontrada."
                description="As visitas concluídas com laudos e resumos de áudio aparecerão aqui."
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visitsRealizadas.map((v) => renderVisitCard(v))}
            </div>
          )}
        </TabsContent>

        {/* ABA: PENDENTES */}
        <TabsContent value="pendentes" className="space-y-4 m-0">
          {visitsPendentes.length === 0 ? (
            <Card className="p-8">
              <PageEmptyState
                title="Nenhuma visita pendente."
                description="Todas as visitas foram realizadas ou estão em dia."
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visitsPendentes.map((v) => renderVisitCard(v))}
            </div>
          )}
        </TabsContent>

        {/* ABA: ATRASADAS */}
        <TabsContent value="atrasadas" className="space-y-4 m-0">
          {visitsAtrasadas.length === 0 ? (
            <Card className="p-8">
              <PageEmptyState
                title="Nenhuma visita atrasada!"
                description="Excelente! Toda a sua agenda de campo está atualizada e em dia."
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visitsAtrasadas.map((v) => renderVisitCard(v))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* MODAL DE FINALIZAÇÃO DA VISITA / FORMULÁRIO COMERCIAL / TÉCNICO & ÁUDIO IA */}
      <Dialog open={finishModalOpen} onOpenChange={setFinishModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Badge
                className={cn(
                  'text-[10px] font-bold border-none',
                  selectedVisitForModal?.type === 'COMMERCIAL_VISIT'
                    ? 'bg-primary text-white'
                    : 'bg-amber-600 text-white',
                )}
              >
                {selectedVisitForModal?.type === 'COMMERCIAL_VISIT'
                  ? 'FORMULÁRIO VISITA COMERCIAL'
                  : 'FORMULÁRIO VISITA TÉCNICA'}
              </Badge>
              <DialogTitle className="font-serif text-lg text-primary">
                {selectedVisitForModal?.status === 'CONCLUIDA'
                  ? 'Relatório da Visita'
                  : 'Finalizar Visita & Registrar Resumo'}
              </DialogTitle>
            </div>
            <DialogDescription>
              {selectedVisitForModal?.customer_name} (SAP #{selectedVisitForModal?.sap_code}) ·{' '}
              {selectedVisitForModal?.city}/{selectedVisitForModal?.uf}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-3">
            {/* SEÇÃO DE DITADO POR ÁUDIO & IA */}
            <Card className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-4 rounded-2xl border-primary/30 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  <span className="font-serif font-bold text-sm text-white">
                    Ditar Resumo com Inteligência Artificial
                  </span>
                </div>

                <Button
                  size="sm"
                  onClick={handleToggleRecordAudio}
                  className={cn(
                    'h-8 text-xs font-bold gap-1.5 transition-all',
                    isRecording
                      ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                      : 'bg-amber-500 hover:bg-amber-600 text-slate-950',
                  )}
                >
                  {isRecording ? (
                    <MicOff className="w-3.5 h-3.5" />
                  ) : (
                    <Mic className="w-3.5 h-3.5" />
                  )}
                  {isRecording ? 'PARAR GRAVAÇÃO' : 'DITAR RESUMO'}
                </Button>
              </div>

              {isRecording && (
                <div className="bg-rose-500/20 border border-rose-500/40 p-2.5 rounded-xl text-xs text-rose-200 flex items-center gap-2 animate-pulse">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  Gravando áudio... Descreva os detalhes discutidos, produtos, preços e próxima
                  ação.
                </div>
              )}

              {audioTranscription && (
                <div className="space-y-1.5 bg-white/10 p-3 rounded-xl text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    TRANSCRIÇÃO DE ÁUDIO (MOCK SPEECH-TO-TEXT):
                  </span>
                  <p className="text-slate-200 leading-relaxed italic">"{audioTranscription}"</p>
                </div>
              )}

              {aiSummarySuggested && (
                <div className="bg-amber-500/10 border border-amber-400/30 p-3 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-amber-300">
                      RESUMO SUGERIDO PELA IA (CIAFAL AI):
                    </span>
                    <Badge className="bg-amber-400 text-slate-950 text-[9px] font-bold border-none">
                      Confiança 96%
                    </Badge>
                  </div>
                  <p className="text-white font-medium">{aiSummarySuggested}</p>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-amber-400/20">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setAiSummaryStatus('REJECTED')}
                      className="h-7 text-[11px] text-slate-300 hover:text-white"
                    >
                      <X className="w-3 h-3 mr-1" /> Descartar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAiSummaryStatus('EDITED')}
                      className="h-7 text-[11px] bg-white/10 text-white border-white/20"
                    >
                      <Edit className="w-3 h-3 mr-1" /> Editar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAcceptAiSummary}
                      className="h-7 text-[11px] bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
                    >
                      <Check className="w-3 h-3 mr-1" /> Aceitar & Preencher Formulário
                    </Button>
                  </div>
                </div>
              )}
            </Card>

            {/* FORMULÁRIO ESPECÍFICO CONFORME TIPO DE VISITA */}
            {selectedVisitForModal?.type === 'COMMERCIAL_VISIT' ? (
              /* FORMULÁRIO VISITA COMERCIAL */
              <div className="space-y-4">
                <h4 className="font-serif font-bold text-sm text-primary border-b pb-1">
                  Campos Comerciais da Visita
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      Objetivo da Visita
                    </label>
                    <Input
                      value={formCommercial.objective || ''}
                      onChange={(e) =>
                        setFormCommercial({ ...formCommercial, objective: e.target.value })
                      }
                      className="h-9 text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      Contato do Cliente
                    </label>
                    <Input
                      value={formCommercial.customer_contact || ''}
                      onChange={(e) =>
                        setFormCommercial({ ...formCommercial, customer_contact: e.target.value })
                      }
                      className="h-9 text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      Participantes
                    </label>
                    <Input
                      value={formCommercial.participants || ''}
                      onChange={(e) =>
                        setFormCommercial({ ...formCommercial, participants: e.target.value })
                      }
                      className="h-9 text-xs"
                      placeholder="Ex: Carlos, Eduardo, Roberto"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      Necessidade Identificada
                    </label>
                    <Input
                      value={formCommercial.identified_need || ''}
                      onChange={(e) =>
                        setFormCommercial({ ...formCommercial, identified_need: e.target.value })
                      }
                      className="h-9 text-xs"
                      placeholder="Ex: Ampliação de galpão"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      Produto Principal
                    </label>
                    <Input
                      value={formCommercial.product || ''}
                      onChange={(e) =>
                        setFormCommercial({ ...formCommercial, product: e.target.value })
                      }
                      className="h-9 text-xs"
                      placeholder="Ex: Perfil W 200x26.6"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      Família do Produto
                    </label>
                    <Input
                      value={formCommercial.product_family || ''}
                      onChange={(e) =>
                        setFormCommercial({ ...formCommercial, product_family: e.target.value })
                      }
                      className="h-9 text-xs"
                      placeholder="Ex: Perfis Laminados"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      Quantidade / Volume
                    </label>
                    <Input
                      value={formCommercial.quantity || ''}
                      onChange={(e) =>
                        setFormCommercial({ ...formCommercial, quantity: e.target.value })
                      }
                      className="h-9 text-xs"
                      placeholder="Ex: 16.5 toneladas"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      Preço Discutido
                    </label>
                    <Input
                      value={formCommercial.discussed_price || ''}
                      onChange={(e) =>
                        setFormCommercial({ ...formCommercial, discussed_price: e.target.value })
                      }
                      className="h-9 text-xs"
                      placeholder="Ex: R$ 6,85 / kg"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      Volume Potencial (R$)
                    </label>
                    <Input
                      value={formCommercial.potential_volume || ''}
                      onChange={(e) =>
                        setFormCommercial({ ...formCommercial, potential_volume: e.target.value })
                      }
                      className="h-9 text-xs"
                      placeholder="Ex: 95000"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      Prazo Requerido
                    </label>
                    <Input
                      value={formCommercial.deadline || ''}
                      onChange={(e) =>
                        setFormCommercial({ ...formCommercial, deadline: e.target.value })
                      }
                      className="h-9 text-xs"
                      placeholder="Ex: Entrega até 10/11/2024"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      Concorrentes Mencionados
                    </label>
                    <Input
                      value={formCommercial.competitors || ''}
                      onChange={(e) =>
                        setFormCommercial({ ...formCommercial, competitors: e.target.value })
                      }
                      className="h-9 text-xs"
                      placeholder="Ex: Distribuidor Regional"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      Objeções Levantadas
                    </label>
                    <Input
                      value={formCommercial.objections || ''}
                      onChange={(e) =>
                        setFormCommercial({ ...formCommercial, objections: e.target.value })
                      }
                      className="h-9 text-xs"
                      placeholder="Ex: Preço de frete CIF"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      Condições Comerciais Acordadas
                    </label>
                    <Input
                      value={formCommercial.commercial_conditions || ''}
                      onChange={(e) =>
                        setFormCommercial({
                          ...formCommercial,
                          commercial_conditions: e.target.value,
                        })
                      }
                      className="h-9 text-xs"
                      placeholder="Ex: 28/42 DDL CIF"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      Oportunidade Vinculada
                    </label>
                    <Input
                      value={formCommercial.opportunity_title || ''}
                      onChange={(e) =>
                        setFormCommercial({ ...formCommercial, opportunity_title: e.target.value })
                      }
                      className="h-9 text-xs"
                      placeholder="Ex: Safra Estrutural 2025"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-primary block mb-1 font-bold">
                      Próxima Ação Comercial *
                    </label>
                    <Input
                      value={formCommercial.next_action || ''}
                      onChange={(e) =>
                        setFormCommercial({ ...formCommercial, next_action: e.target.value })
                      }
                      className="h-9 text-xs border-primary/40 font-semibold"
                      placeholder="Ex: Emitir cotação formal no SAP"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-primary block mb-1 font-bold">
                      Data da Próxima Ação *
                    </label>
                    <Input
                      type="date"
                      value={formCommercial.next_action_date || '2024-10-18'}
                      onChange={(e) =>
                        setFormCommercial({ ...formCommercial, next_action_date: e.target.value })
                      }
                      className="h-9 text-xs border-primary/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-muted-foreground block mb-1 text-xs">
                    Observações Gerais
                  </label>
                  <Textarea
                    value={formCommercial.observations || ''}
                    onChange={(e) =>
                      setFormCommercial({ ...formCommercial, observations: e.target.value })
                    }
                    rows={2}
                    className="text-xs"
                    placeholder="Comentários adicionais sobre a visita..."
                  />
                </div>
              </div>
            ) : (
              /* FORMULÁRIO VISITA TÉCNICA */
              <div className="space-y-4">
                <h4 className="font-serif font-bold text-sm text-amber-900 border-b pb-1">
                  Campos de Avaliação Técnica & Qualidade
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      Objetivo Técnico
                    </label>
                    <Input
                      value={formTechnical.technical_objective || ''}
                      onChange={(e) =>
                        setFormTechnical({ ...formTechnical, technical_objective: e.target.value })
                      }
                      className="h-9 text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      Aplicação do Material
                    </label>
                    <Input
                      value={formTechnical.application || ''}
                      onChange={(e) =>
                        setFormTechnical({ ...formTechnical, application: e.target.value })
                      }
                      className="h-9 text-xs"
                      placeholder="Ex: Tanques de armazenagem 50m³"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      Produto
                    </label>
                    <Input
                      value={formTechnical.product || ''}
                      onChange={(e) =>
                        setFormTechnical({ ...formTechnical, product: e.target.value })
                      }
                      className="h-9 text-xs"
                      placeholder="Ex: Chapa Grossa A36"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      Material / Norma
                    </label>
                    <Input
                      value={formTechnical.material || ''}
                      onChange={(e) =>
                        setFormTechnical({ ...formTechnical, material: e.target.value })
                      }
                      className="h-9 text-xs"
                      placeholder="Ex: ASTM A36 / SAE 1020"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      Dimensões & Bitola
                    </label>
                    <Input
                      value={formTechnical.dimension || ''}
                      onChange={(e) =>
                        setFormTechnical({ ...formTechnical, dimension: e.target.value })
                      }
                      className="h-9 text-xs"
                      placeholder="Ex: 12.50mm x 1500 x 6000"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      Especificação Técnica
                    </label>
                    <Input
                      value={formTechnical.specification || ''}
                      onChange={(e) =>
                        setFormTechnical({ ...formTechnical, specification: e.target.value })
                      }
                      className="h-9 text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      Problema / Sintoma Relatado
                    </label>
                    <Input
                      value={formTechnical.problem_description || ''}
                      onChange={(e) =>
                        setFormTechnical({ ...formTechnical, problem_description: e.target.value })
                      }
                      className="h-9 text-xs"
                      placeholder="Ex: Dificuldade em solda / Conformação"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      Amostra Coletada?
                    </label>
                    <Input
                      value={formTechnical.sample_collected || ''}
                      onChange={(e) =>
                        setFormTechnical({ ...formTechnical, sample_collected: e.target.value })
                      }
                      className="h-9 text-xs"
                      placeholder="Ex: Sim (lote 04 - 2 corpos de prova)"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      Testes Realizados em Campo
                    </label>
                    <Input
                      value={formTechnical.tests_performed || ''}
                      onChange={(e) =>
                        setFormTechnical({ ...formTechnical, tests_performed: e.target.value })
                      }
                      className="h-9 text-xs"
                      placeholder="Ex: Rugosimetria Ra, Ensaio visual e dobra"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      Recomendação Técnica
                    </label>
                    <Input
                      value={formTechnical.technical_recommendation || ''}
                      onChange={(e) =>
                        setFormTechnical({
                          ...formTechnical,
                          technical_recommendation: e.target.value,
                        })
                      }
                      className="h-9 text-xs"
                      placeholder="Ex: Aprovado para calandragem"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      Pendência Técnica
                    </label>
                    <Input
                      value={formTechnical.pendency || ''}
                      onChange={(e) =>
                        setFormTechnical({ ...formTechnical, pendency: e.target.value })
                      }
                      className="h-9 text-xs"
                      placeholder="Ex: Enviar laudo de usina Gerdau"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-muted-foreground block mb-1">
                      Responsável do Cliente
                    </label>
                    <Input
                      value={formTechnical.responsible_person || ''}
                      onChange={(e) =>
                        setFormTechnical({ ...formTechnical, responsible_person: e.target.value })
                      }
                      className="h-9 text-xs"
                      placeholder="Ex: Eng. Roberto"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-semibold text-amber-900 block mb-1 font-bold">
                      Próxima Ação Técnica *
                    </label>
                    <Input
                      value={formTechnical.next_action || ''}
                      onChange={(e) =>
                        setFormTechnical({ ...formTechnical, next_action: e.target.value })
                      }
                      className="h-9 text-xs border-amber-400 font-semibold"
                      placeholder="Ex: Emitir laudo técnico e liberar cotação"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-amber-900 block mb-1 font-bold">
                      Prazo da Próxima Ação *
                    </label>
                    <Input
                      type="date"
                      value={formTechnical.next_action_date || '2024-10-18'}
                      onChange={(e) =>
                        setFormTechnical({ ...formTechnical, next_action_date: e.target.value })
                      }
                      className="h-9 text-xs border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-muted-foreground block mb-1 text-xs">
                    Observações Técnicas Adicionais
                  </label>
                  <Textarea
                    value={formTechnical.observations || ''}
                    onChange={(e) =>
                      setFormTechnical({ ...formTechnical, observations: e.target.value })
                    }
                    rows={2}
                    className="text-xs"
                    placeholder="Detalhes laboratoriais e ensaios..."
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setFinishModalOpen(false)}>
              Fechar
            </Button>
            <Button
              onClick={handleFinishVisitConfirm}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              {selectedVisitForModal?.status === 'CONCLUIDA'
                ? 'Salvar Alterações'
                : 'Salvar & Finalizar Visita'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE AGENDAR NOVA VISITA */}
      <Dialog open={newVisitModalOpen} onOpenChange={setNewVisitModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-primary">Agendar Nova Visita</DialogTitle>
            <DialogDescription>
              Planeje uma visita comercial ou técnica para sua carteira.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div>
              <label className="font-semibold text-muted-foreground block mb-1">Cliente *</label>
              <Select
                value={newVisitData.customerId}
                onValueChange={(val) => setNewVisitData({ ...newVisitData, customerId: val })}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Selecione o cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {mockClientes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.razaoSocial} ({c.cidade}/{c.uf})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="font-semibold text-muted-foreground block mb-1">
                Tipo de Visita *
              </label>
              <Select
                value={newVisitData.type}
                onValueChange={(val: VisitType) => setNewVisitData({ ...newVisitData, type: val })}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COMMERCIAL_VISIT">
                    Comercial (Proposta / Negociação)
                  </SelectItem>
                  <SelectItem value="TECHNICAL_VISIT">Técnica (Inspeção / Qualidade)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Data *</label>
                <Input
                  type="date"
                  value={newVisitData.planned_date}
                  onChange={(e) =>
                    setNewVisitData({ ...newVisitData, planned_date: e.target.value })
                  }
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <label className="font-semibold text-muted-foreground block mb-1">Horário *</label>
                <Input
                  type="time"
                  value={newVisitData.planned_time}
                  onChange={(e) =>
                    setNewVisitData({ ...newVisitData, planned_time: e.target.value })
                  }
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-muted-foreground block mb-1">
                Objetivo da Visita *
              </label>
              <Textarea
                value={newVisitData.objective}
                onChange={(e) => setNewVisitData({ ...newVisitData, objective: e.target.value })}
                rows={2}
                className="text-xs"
                placeholder="Ex: Apresentar cotação de tubos e validar espessura de parede"
              />
            </div>

            <div>
              <label className="font-semibold text-muted-foreground block mb-1">
                Participantes
              </label>
              <Input
                value={newVisitData.participants}
                onChange={(e) => setNewVisitData({ ...newVisitData, participants: e.target.value })}
                className="h-9 text-xs"
                placeholder="Ex: Carlos Mendonça, Roberto"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setNewVisitModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateNewVisit} className="bg-primary text-white font-semibold">
              Agendar Visita
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
