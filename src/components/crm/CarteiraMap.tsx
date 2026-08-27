import React, { useState, useMemo } from 'react'
import { ClienteCarteira, LeadItem } from '@/data/mockCommercialData'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ABCBadge } from '@/components/shared/ABCBadge'
import {
  MapPin,
  Navigation,
  Compass,
  Building2,
  Phone,
  MessageSquare,
  Calendar,
  Sparkles,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

interface CarteiraMapProps {
  clientes: ClienteCarteira[]
  leads?: LeadItem[]
}

export function CarteiraMap({ clientes, leads = [] }: CarteiraMapProps) {
  const navigate = useNavigate()
  const [selectedUf, setSelectedUf] = useState<string>('todos')
  const [selectedAbc, setSelectedAbc] = useState<string>('todos')
  const [selectedCluster, setSelectedCluster] = useState<string>('todos')
  const [selectedPoint, setSelectedPoint] = useState<ClienteCarteira | null>(null)

  // Clusters regionais sugeridos por IA para visitas em rota
  const regionalClusters = [
    {
      id: 'bh-contagem',
      name: 'Região Metropolitana BH / Contagem / Betim',
      count: 4,
      tons: 338.5,
    },
    {
      id: 'triangulo',
      name: 'Triângulo Mineiro (Uberlândia, Uberaba, Araguari)',
      count: 3,
      tons: 236.0,
    },
    {
      id: 'sul-minas',
      name: 'Sul de Minas (Pouso Alegre, Varginha, Lavras)',
      count: 4,
      tons: 304.5,
    },
    {
      id: 'zona-mata',
      name: 'Zona da Mata & Vertentes (JF, Ubá, São João del-Rei)',
      count: 3,
      tons: 279.0,
    },
    {
      id: 'vale-aco',
      name: 'Vale do Aço & Rio Doce (Ipatinga, GV, Ouro Preto)',
      count: 3,
      tons: 170.5,
    },
  ]

  const filteredClientes = useMemo(() => {
    return clientes.filter((c) => {
      const matchUf = selectedUf === 'todos' || c.uf === selectedUf
      const matchAbc =
        selectedAbc === 'todos' || c.abcHistorico === selectedAbc || c.abcPotencial === selectedAbc
      return matchUf && matchAbc
    })
  }, [clientes, selectedUf, selectedAbc])

  return (
    <div className="space-y-4">
      {/* Header com sugestão de rota IA */}
      <Card className="bg-gradient-to-r from-blue-900 via-[#003A70] to-slate-900 text-white rounded-3xl p-5 border-none shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Compass className="h-5 w-5 text-blue-300 animate-pulse" />
              <h3 className="font-serif text-lg font-bold">
                Mapa Estratégico da Carteira & Rotas Regionais
              </h3>
              <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px]">
                Otimização Geográfica IA
              </Badge>
            </div>
            <p className="text-xs text-blue-100 max-w-2xl">
              Agrupamento inteligente por polos industriais de Minas Gerais. O tamanho do marcador
              representa o volume em toneladas (12m/potencial).
              <span className="text-amber-300 font-medium block mt-0.5">
                • Respeito à privacidade comercial: sem rastreamento em tempo real do vendedor.
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Select value={selectedAbc} onValueChange={setSelectedAbc}>
              <SelectTrigger className="w-36 h-8 text-xs bg-white/10 border-white/20 text-white rounded-xl">
                <SelectValue placeholder="Filtro ABC" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos ABC</SelectItem>
                <SelectItem value="A">Classe A</SelectItem>
                <SelectItem value="B">Classe B</SelectItem>
                <SelectItem value="C">Classe C</SelectItem>
              </SelectContent>
            </Select>

            <Button
              size="sm"
              variant="secondary"
              className="h-8 text-xs font-semibold gap-1.5 bg-white text-[#003A70] hover:bg-slate-100"
              onClick={() =>
                toast.success(
                  'Rota sugerida gerada: 3 visitas agrupadas na região de Contagem/Betim!',
                )
              }
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              Sugerir Rota do Dia
            </Button>
          </div>
        </div>
      </Card>

      {/* Grid: Clusters Regionais + Canvas do Mapa Interativo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Painel lateral: Clusters recomendados */}
        <Card className="bg-white/90 backdrop-blur-md rounded-2xl border-border/40 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h4 className="font-bold text-xs text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Navigation className="h-3.5 w-3.5" /> Polos & Agrupamentos
            </h4>
            <span className="text-[10px] text-muted-foreground">
              {filteredClientes.length} clientes plotados
            </span>
          </div>

          <div className="space-y-2 max-h-[480px] overflow-y-auto">
            {regionalClusters.map((cluster) => (
              <div
                key={cluster.id}
                onClick={() => {
                  setSelectedCluster(cluster.id)
                  toast.info(`Foco no polo: ${cluster.name}`)
                }}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  selectedCluster === cluster.id
                    ? 'border-primary bg-primary/5 shadow-xs'
                    : 'border-border/50 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="font-semibold text-xs text-slate-900 line-clamp-1">
                    {cluster.name}
                  </span>
                  <Badge variant="outline" className="text-[10px] font-bold bg-white">
                    {cluster.count} clientes
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1">
                  <span>Volume Polo:</span>
                  <strong className="text-primary font-mono">{cluster.tons.toFixed(1)} t</strong>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Canvas Visual de Mapa e Pontos Geográficos */}
        <Card className="lg:col-span-2 bg-slate-950 text-white rounded-3xl border-border/40 p-5 shadow-inner relative overflow-hidden flex flex-col justify-between min-h-[480px]">
          {/* Fundo simulado de grade cartográfica */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          {/* Topo do canvas */}
          <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-semibold text-slate-200">
                Dispersão Geográfica — Minas Gerais (Hub Contagem / CD Principal)
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> ABC A
                (&gt;100t)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> ABC B (40-100t)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block" /> ABC C
                (&lt;40t)
              </span>
            </div>
          </div>

          {/* Plotagem dos clientes como marcadores com tamanho proporcional */}
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 gap-3 my-4">
            {filteredClientes.slice(0, 9).map((c) => {
              const size = c.toneladas12m > 100 ? 'h-14' : c.toneladas12m > 50 ? 'h-12' : 'h-10'
              const color =
                c.abcHistorico === 'A'
                  ? 'border-blue-400 bg-blue-900/50 text-blue-200'
                  : c.abcHistorico === 'B'
                    ? 'border-amber-400 bg-amber-900/40 text-amber-200'
                    : 'border-slate-500 bg-slate-800/60 text-slate-300'

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedPoint(c)}
                  className={`p-2.5 rounded-2xl border transition-all cursor-pointer hover:scale-[1.02] flex flex-col justify-between ${color} ${
                    selectedPoint?.id === c.id ? 'ring-2 ring-emerald-400 shadow-lg' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[11px] truncate max-w-[120px]">
                      {c.nomeFantasia}
                    </span>
                    <ABCBadge category={c.abcHistorico} className="h-4 text-[9px] px-1" />
                  </div>
                  <div className="flex items-center justify-between text-[10px] mt-1 text-slate-300">
                    <span>{c.cidade}</span>
                    <strong className="font-mono text-white">{c.toneladas12m} t</strong>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Detalhe do Ponto Selecionado */}
          {selectedPoint ? (
            <div className="relative z-10 bg-slate-900/90 border border-white/20 p-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-white">{selectedPoint.razaoSocial}</span>
                  <Badge
                    variant="outline"
                    className="text-[10px] border-emerald-400 text-emerald-300"
                  >
                    {selectedPoint.segmento}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Localização: {selectedPoint.cidade}/{selectedPoint.uf} · Vendedor:{' '}
                  {selectedPoint.vendedor} · Última visita:{' '}
                  {selectedPoint.ultimaVisitaData || 'Sem registro recente'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs border-white/20 text-white hover:bg-white/10"
                  onClick={() => navigate(`/crm/${selectedPoint.id}`)}
                >
                  Abrir 360º
                </Button>
                <Button
                  size="sm"
                  className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white gap-1"
                  onClick={() =>
                    toast.success(`Visita agendada para ${selectedPoint.nomeFantasia}!`)
                  }
                >
                  <Calendar className="h-3.5 w-3.5" />
                  Agendar Visita
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative z-10 text-center py-2 text-[11px] text-slate-400">
              Clique em qualquer cliente no mapa para ver resumo geográfico e agendar visita em
              rota.
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
