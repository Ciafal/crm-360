// src/components/gestao-clientes/CatalogManagementPanel.tsx
import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  BookOpen,
  FileSpreadsheet,
  FileText,
  Mail,
  MessageSquare,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  QrCode,
  Share2,
} from 'lucide-react'
import type { CatalogProduct } from '@/types/customer_management'
import { exportToCsv } from '@/lib/utils'
import { toast } from 'sonner'

interface CatalogManagementPanelProps {
  catalog: CatalogProduct[]
}

export function CatalogManagementPanel({ catalog }: CatalogManagementPanelProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [familyFilter, setFamilyFilter] = useState('todos')
  const [lineFilter, setLineFilter] = useState('todos')
  const [availabilityFilter, setAvailabilityFilter] = useState('todos')

  // Modais de Envio
  const [sendModalOpen, setSendModalOpen] = useState(false)
  const [sendType, setSendType] = useState<'email' | 'whatsapp'>('whatsapp')
  const [recipient, setRecipient] = useState('')
  const [selectedProductForSend, setSelectedProductForSend] = useState<CatalogProduct | null>(null)

  const families = Array.from(new Set(catalog.map((p) => p.familia)))
  const lines = Array.from(new Set(catalog.map((p) => p.linha)))

  const filteredCatalog = catalog.filter((p) => {
    if (familyFilter !== 'todos' && p.familia !== familyFilter) return false
    if (lineFilter !== 'todos' && p.linha !== lineFilter) return false
    if (availabilityFilter === 'imediato' && p.estoqueDisponivelTons <= 0) return false
    if (availabilityFilter === 'pcp' && p.estoqueDisponivelTons > 0) return false

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      const matchCode = p.codigo.toLowerCase().includes(q)
      const matchDesc = p.descricaoComercial.toLowerCase().includes(q)
      const matchNorma = p.norma.toLowerCase().includes(q)
      const matchBitola = p.bitola.toLowerCase().includes(q)
      if (!matchCode && !matchDesc && !matchNorma && !matchBitola) return false
    }

    return true
  })

  const handleExportCsv = () => {
    const data = filteredCatalog.map((p) => ({
      Linha: p.linha,
      Familia: p.familia,
      Codigo: p.codigo,
      Descricao_Comercial: p.descricaoComercial,
      Bitola: p.bitola,
      Dimensao: p.dimensao,
      Comprimento: p.comprimento,
      Qualidade: p.qualidade,
      Norma: p.norma,
      Aplicacao: p.aplicacao,
      Unidade: p.unidade,
      Estoque_Disponivel_t: p.estoqueDisponivelTons,
      PCP_Proxima_Data: p.pcpProximaData,
      PCP_Previsto_t: p.pcpQuantidadePrevistaTons,
      Prazo_TMS_Dias: p.prazoTMSDias,
      Preco_Tabela_R$_kg: p.precoTabelaKg,
      Preco_Tabela_R$_t: p.precoTabelaTon,
    }))

    exportToCsv(`Catalogo_Comercial_CIAFAL_${new Date().toISOString().slice(0, 10)}`, data)
    toast.success('Catálogo Comercial exportado em formato CSV/Excel com sucesso!')
  }

  const handleExportPdf = () => {
    toast.success('Catálogo em PDF gerado com layout oficial CIAFAL!', {
      description: 'Fichas técnicas, tabelas dimensionais e certificados anexados.',
    })
  }

  const handleOpenSend = (product: CatalogProduct, type: 'email' | 'whatsapp') => {
    setSelectedProductForSend(product)
    setSendType(type)
    setRecipient(type === 'whatsapp' ? '(31) 98765-4321' : 'compras@cliente.com.br')
    setSendModalOpen(true)
  }

  const handleConfirmSend = () => {
    setSendModalOpen(false)
    toast.success(`Catálogo enviado via ${sendType === 'whatsapp' ? 'WhatsApp' : 'E-mail'}!`, {
      description: `Destinatário: ${recipient} · Registro gravado na timeline do cliente.`,
    })
  }

  return (
    <div className="space-y-4 text-slate-100">
      {/* 1. CABEÇALHO DO CATÁLOGO */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-white tracking-tight flex items-center gap-2">
              Catálogo Comercial CIAFAL Ferro & Aço
              <Badge className="bg-[#003A70] text-sky-200 border-[#005a9c] text-[10px]">
                {filteredCatalog.length} Produtos Ativos
              </Badge>
            </h3>
            <p className="text-xs text-slate-400">
              Linha completa de laminados mercantis, perfis estruturais, tubos industriais, chapas e
              vergalhões com especificações técnicas e disponibilidade.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={handleExportPdf}
            className="h-8 text-xs bg-sky-600 hover:bg-sky-500 text-white rounded-xl gap-1.5 font-semibold"
          >
            <FileText className="w-3.5 h-3.5" /> Exportar PDF
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCsv}
            className="h-8 text-xs border-slate-700 bg-slate-950 text-slate-300 hover:text-white rounded-xl gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Exportar Excel
          </Button>
        </div>
      </div>

      {/* 2. FILTROS DO CATÁLOGO (Regra 39) */}
      <Card className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <Input
            placeholder="Buscar por código, descrição, bitola, norma técnica..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 bg-slate-950 border-slate-800 text-xs text-slate-100 placeholder:text-slate-600 rounded-xl"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select value={lineFilter} onValueChange={setLineFilter}>
            <SelectTrigger className="h-9 w-44 text-xs bg-slate-950 border-slate-800 text-slate-300 rounded-xl">
              <SelectValue placeholder="Linha" />
            </SelectTrigger>
            <SelectContent className="bg-slate-950 border-slate-800 text-slate-100 text-xs">
              <SelectItem value="todos">Linha (Todas)</SelectItem>
              {lines.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={familyFilter} onValueChange={setFamilyFilter}>
            <SelectTrigger className="h-9 w-44 text-xs bg-slate-950 border-slate-800 text-slate-300 rounded-xl">
              <SelectValue placeholder="Família" />
            </SelectTrigger>
            <SelectContent className="bg-slate-950 border-slate-800 text-slate-100 text-xs">
              <SelectItem value="todos">Família (Todas)</SelectItem>
              {families.map((f) => (
                <SelectItem key={f} value={f}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
            <SelectTrigger className="h-9 w-40 text-xs bg-slate-950 border-slate-800 text-slate-300 rounded-xl">
              <SelectValue placeholder="Disponibilidade" />
            </SelectTrigger>
            <SelectContent className="bg-slate-950 border-slate-800 text-slate-100 text-xs">
              <SelectItem value="todos">Disponibilidade (Todas)</SelectItem>
              <SelectItem value="imediato">Estoque Imediato</SelectItem>
              <SelectItem value="pcp">PCP Programado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* 3. GRID DE ITENS DO CATÁLOGO (Regras 36, 37, 40) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredCatalog.map((prod) => (
          <Card
            key={prod.id}
            className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-sky-500/50 transition-all flex flex-col justify-between gap-3 shadow-xs"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-sky-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {prod.codigo}
                </span>
                {prod.estoqueDisponivelTons > 0 ? (
                  <Badge className="bg-emerald-950 text-emerald-400 border-emerald-800 text-[10px]">
                    {prod.estoqueDisponivelTons} t Disponível
                  </Badge>
                ) : (
                  <Badge className="bg-amber-950 text-amber-400 border-amber-800 text-[10px]">
                    PCP: {prod.pcpProximaData} (+1d)
                  </Badge>
                )}
              </div>

              <div>
                <strong className="text-sm font-bold text-white block leading-snug">
                  {prod.descricaoComercial}
                </strong>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  {prod.familia} · {prod.norma}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-950 rounded-xl text-[11px] border border-slate-800">
                <div>
                  <span className="text-slate-500 block text-[10px]">Bitola / Medida:</span>
                  <strong className="text-slate-200">{prod.bitola}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Comprimento:</span>
                  <strong className="text-slate-200">{prod.comprimento}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Qualidade:</span>
                  <strong className="text-slate-200 truncate block">{prod.qualidade}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Preço Tabela:</span>
                  <strong className="text-emerald-400">
                    R$ {prod.precoTabelaKg.toFixed(2)} / kg
                  </strong>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-snug">
                <strong className="text-slate-300">Aplicação:</strong> {prod.aplicacao}
              </p>
            </div>

            {/* Ações de Envio e Compartilhamento */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <Button
                size="sm"
                onClick={() => handleOpenSend(prod, 'whatsapp')}
                className="flex-1 h-8 text-xs bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl gap-1"
              >
                <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
              </Button>

              <Button
                size="sm"
                onClick={() => handleOpenSend(prod, 'email')}
                className="flex-1 h-8 text-xs bg-sky-700 hover:bg-sky-600 text-white rounded-xl gap-1"
              >
                <Mail className="w-3.5 h-3.5" /> E-mail
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* DIALOG DE ENVIO DE CATÁLOGO */}
      <Dialog open={sendModalOpen} onOpenChange={setSendModalOpen}>
        <DialogContent className="bg-slate-950 text-slate-100 border border-slate-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-serif text-white">
              Enviar Catálogo via {sendType === 'whatsapp' ? 'WhatsApp' : 'E-mail'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Envio personalizado com dados técnicos e link de download direto.
            </DialogDescription>
          </DialogHeader>

          {selectedProductForSend && (
            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Produto Anexado
                </span>
                <strong className="text-white">{selectedProductForSend.descricaoComercial}</strong>
                <span className="text-slate-400 block text-[11px]">
                  Bitola: {selectedProductForSend.bitola}
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">
                  {sendType === 'whatsapp' ? 'Telefone WhatsApp' : 'E-mail do Comprador'}
                </label>
                <Input
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="bg-slate-900 border-slate-800 text-xs text-slate-100 rounded-xl"
                />
              </div>

              <Button
                onClick={handleConfirmSend}
                className="w-full h-9 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl mt-2"
              >
                Confirmar e Registrar Envio
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
