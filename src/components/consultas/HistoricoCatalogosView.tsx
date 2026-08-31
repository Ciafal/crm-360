// src/components/consultas/HistoricoCatalogosView.tsx
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  BookOpen,
  Search,
  Plus,
  Eye,
  FileDown,
  Share2,
  Mail,
  ShoppingCart,
  Copy,
  Sparkles,
  TrendingUp,
  Package,
  Users,
  Building2,
  CheckCircle2,
  Clock,
  Send,
  Layers,
} from 'lucide-react'
import { CatalogoGerado } from '@/types/catalogo'
import { catalogoService } from '@/services/catalogoService'
import { useAuth } from '@/hooks/use-auth'
import { CatalogoPdfPreviewModal } from './CatalogoPdfPreviewModal'
import { GerarCatalogoWizardModal } from './GerarCatalogoWizardModal'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

export function HistoricoCatalogosView() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [busca, setBusca] = useState('')
  const [selectedCatalogo, setSelectedCatalogo] = useState<CatalogoGerado | null>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [showWizardModal, setShowWizardModal] = useState(false)
  const [refreshCount, setRefreshCount] = useState(0)

  const metricas = catalogoService.getMetricasGestao()
  const authCtx = {
    id: user?.id || 'qas-vendedor_teste',
    name: user?.name || 'Carlos Mendonça',
    email: user?.email || 'carlos.mendonca@ciafal.com.br',
    role: (user?.role as any) || 'vendedor',
    carteiraId: 'CART-01',
  }

  const catalogos = catalogoService.getHistoricoCatalogos(authCtx)

  const catalogosFiltrados = catalogos.filter((c) => {
    const t = busca.toLowerCase()
    return (
      c.codigoVersao.toLowerCase().includes(t) ||
      (c.clienteNome && c.clienteNome.toLowerCase().includes(t)) ||
      c.tipo.toLowerCase().includes(t) ||
      c.vendedorNome.toLowerCase().includes(t)
    )
  })

  const handleVisualizar = (cat: CatalogoGerado) => {
    setSelectedCatalogo(cat)
    setShowPreviewModal(true)
  }

  const handleDuplicar = async (cat: CatalogoGerado) => {
    try {
      const novaVersao = await catalogoService.criarNovaVersaoCatalogo(
        authCtx,
        cat.id,
        cat.produtos,
      )
      toast.success(`Nova versão gerada com sucesso: ${novaVersao.codigoVersao}!`)
      setRefreshCount((c) => c + 1)
      setSelectedCatalogo(novaVersao)
      setShowPreviewModal(true)
    } catch (err: any) {
      toast.error('Erro ao duplicar catálogo: ' + err.message)
    }
  }

  const handleCriarCotacao = async (cat: CatalogoGerado) => {
    try {
      const cotacao = await catalogoService.criarCotacaoAPartirDoCatalogo(authCtx, cat.id)
      toast.success(`Cotação ${cotacao.code} criada com sucesso a partir do catálogo!`, {
        description: 'Redirecionando para cotações...',
      })
      navigate('/crm/cotacoes')
    } catch (err: any) {
      toast.error('Erro ao criar cotação: ' + err.message)
    }
  }

  return (
    <div className="space-y-6">
      {/* 4 Cards de Métricas Comerciais de Gestão de Catálogos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-slate-200 shadow-2xs bg-white">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase">
                Catálogos Enviados
              </span>
              <Send className="w-4 h-4 text-[#003A70]" />
            </div>
            <div className="text-xl font-black text-slate-900">
              {metricas.totalCatalogosEnviados}{' '}
              <span className="text-xs font-normal text-slate-500">
                / {metricas.totalCatalogosGerados} gerados
              </span>
            </div>
            <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> {metricas.clientesAlcancados} clientes alcançados
            </span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-2xs bg-white">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase">
                Cotações Originadas
              </span>
              <ShoppingCart className="w-4 h-4 text-sky-600" />
            </div>
            <div className="text-xl font-black text-[#003A70]">
              {metricas.cotacoesOriginadas}{' '}
              <span className="text-xs font-normal text-slate-500">cotações</span>
            </div>
            <span className="text-[10px] text-slate-600 font-medium">
              Taxa de conversão: <strong>{metricas.taxaConversaoCotacaoPct}%</strong>
            </span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-2xs bg-white">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase">
                Pedidos Originados
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-black text-emerald-700">
              {metricas.pedidosOriginados}{' '}
              <span className="text-xs font-normal text-slate-500">pedidos faturados</span>
            </div>
            <span className="text-[10px] text-slate-600 font-medium">
              Conversão: <strong>{metricas.taxaConversaoPedidoPct}%</strong> dos orçamentos
            </span>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-2xs bg-white">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase">
                Receita Originada
              </span>
              <TrendingUp className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-xl font-black text-slate-900">
              R${' '}
              {metricas.receitaOriginadaBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-600 font-medium">
              Volume:{' '}
              <strong>
                {metricas.tonelagemOriginadaTons.toLocaleString('pt-BR', {
                  minimumFractionDigits: 1,
                })}{' '}
                t
              </strong>{' '}
              de aço
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Título da Seção & Ação de Novo Catálogo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
        <div>
          <h2 className="text-base font-bold font-serif text-[#003A70] flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Histórico de Catálogos Comerciais Emitidos
          </h2>
          <p className="text-xs text-slate-500">
            Catálogos enviados são congelados por versão e rastreados na timeline de cada cliente.
          </p>
        </div>

        <Button
          onClick={() => setShowWizardModal(true)}
          className="h-9 text-xs font-bold bg-[#003A70] hover:bg-[#002850] text-white gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Gerar Novo Catálogo
        </Button>
      </div>

      {/* Tabela / Lista de Catálogos */}
      <Card className="border-slate-200 shadow-xs bg-white overflow-hidden">
        <div className="p-3 border-b border-slate-100 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por código, cliente, tipo ou vendedor..."
              className="pl-9 h-8 text-xs bg-slate-50 border-slate-200"
            />
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {catalogosFiltrados.length} catálogos
          </span>
        </div>

        <div className="divide-y divide-slate-100 overflow-x-auto">
          {catalogosFiltrados.map((cat) => (
            <div
              key={cat.id}
              className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors text-xs"
            >
              {/* Informações Principais */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[#003A70] text-xs">
                    {cat.codigoVersao}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] bg-sky-50 text-[#003A70] border-sky-200 font-bold"
                  >
                    {cat.tipo}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] bg-slate-100">
                    {cat.modo}
                  </Badge>
                  {cat.status === 'ENVIADO_WHATSAPP' && (
                    <Badge className="bg-emerald-100 text-emerald-800 border-none text-[10px] font-bold">
                      WhatsApp
                    </Badge>
                  )}
                  {cat.status === 'ENVIADO_EMAIL' && (
                    <Badge className="bg-sky-100 text-sky-800 border-none text-[10px] font-bold">
                      E-mail
                    </Badge>
                  )}
                  {cat.status === 'COTACAO_CRIADA' && (
                    <Badge className="bg-purple-100 text-purple-800 border-none text-[10px] font-bold">
                      Cotação Gerada ({cat.cotacaoRelacionadaCodigo})
                    </Badge>
                  )}
                </div>

                <h3 className="font-bold text-slate-900 text-sm">{cat.configuracao.titulo}</h3>

                <div className="flex flex-wrap items-center gap-2 text-slate-500 text-[11px]">
                  {cat.clienteNome ? (
                    <span className="font-semibold text-slate-700">Cliente: {cat.clienteNome}</span>
                  ) : (
                    <span>Catálogo Geral</span>
                  )}
                  <span>•</span>
                  <span>{cat.quantidadeProdutos} produtos</span>
                  <span>•</span>
                  <span>{cat.quantidadePaginas} páginas</span>
                  <span>•</span>
                  <span>Criado em: {cat.dataCriacao}</span>
                  <span>•</span>
                  <span>Vendedor: {cat.vendedorNome}</span>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleVisualizar(cat)}
                  className="h-8 text-xs font-bold text-[#003A70] border-sky-200 hover:bg-sky-50 gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Visualizar / Enviar
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDuplicar(cat)}
                  className="h-8 text-xs text-slate-600 hover:text-slate-900 gap-1"
                  title="Criar nova versão a partir deste modelo"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Nova Versão
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCriarCotacao(cat)}
                  className="h-8 text-xs text-purple-700 border-purple-200 hover:bg-purple-50 gap-1"
                  title="Transformar itens em cotação comercial"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  Cotar
                </Button>
              </div>
            </div>
          ))}

          {catalogosFiltrados.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-xs">
              Nenhum catálogo comercial encontrado para o filtro pesquisado.
            </div>
          )}
        </div>
      </Card>

      {/* Modais */}
      {showWizardModal && (
        <GerarCatalogoWizardModal
          open={showWizardModal}
          onOpenChange={setShowWizardModal}
          onCatalogoCriado={() => setRefreshCount((c) => c + 1)}
        />
      )}

      {selectedCatalogo && (
        <CatalogoPdfPreviewModal
          open={showPreviewModal}
          onOpenChange={setShowPreviewModal}
          catalogo={selectedCatalogo}
          onCatalogoAtualizado={() => setRefreshCount((c) => c + 1)}
        />
      )}
    </div>
  )
}
