// src/components/consultas/DanfePreviewModal.tsx
import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Download,
  Share2,
  Mail,
  Printer,
  Copy,
  CheckCircle2,
  Truck,
  Building2,
  ExternalLink,
} from 'lucide-react'
import { DocumentoFiscalNF } from '@/data/mockConsultasData'
import { consultasService } from '@/services/consultasService'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

interface DanfePreviewModalProps {
  nf: DocumentoFiscalNF | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenSendModal?: (nf: DocumentoFiscalNF) => void
  onOpenTmsModal?: (nf: DocumentoFiscalNF) => void
}

export const DanfePreviewModal: React.FC<DanfePreviewModalProps> = ({
  nf,
  open,
  onOpenChange,
  onOpenSendModal,
  onOpenTmsModal,
}) => {
  const { user } = useAuth()

  if (!nf) return null

  const handleDownloadPdf = () => {
    if (user) {
      consultasService.logAction(user, nf.clienteId, 'DOWNLOAD_PDF', 'NF', nf.numeroNF, {
        mensagemDetalhe: `Download do DANFE/PDF da NF ${nf.numeroNF}`,
      })
    }
    toast.success(`Download do DANFE (NF ${nf.numeroNF}) iniciado com sucesso!`)
  }

  const handleDownloadXml = () => {
    if (user) {
      consultasService.logAction(user, nf.clienteId, 'DOWNLOAD_XML', 'NF', nf.numeroNF, {
        mensagemDetalhe: `Download do arquivo XML da NF-e ${nf.numeroNF}`,
      })
    }
    toast.success(`Download do XML da NF-e ${nf.numeroNF} realizado!`)
  }

  const handleCopyLink = () => {
    if (user) {
      const link = consultasService.gerarLinkSeguro(user, nf.clienteId, 'NF', nf.numeroNF)
      navigator.clipboard.writeText(link)
      toast.success('Link seguro de visualização copiado para a área de transferência!', {
        description: 'Válido por 72h com autenticação e trilha de auditoria LGPD.',
      })
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 bg-slate-50">
        {/* Header Superior com Ações Rápidas */}
        <DialogHeader className="p-4 bg-white border-b border-slate-200 sticky top-0 z-20 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                DANFE — Documento Auxiliar da Nota Fiscal Eletrônica nº {nf.numeroNF}
                <Badge
                  variant="outline"
                  className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs font-semibold"
                >
                  {nf.status}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Série {nf.serie} · Emissão: {nf.dataEmissaoFormatada} · Fonte Oficial SAP SD / SEFAZ
                MG
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="h-8 text-xs gap-1.5 border-slate-300"
            >
              <Copy className="w-3.5 h-3.5" />
              Copiar Link Seguro
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadXml}
              className="h-8 text-xs gap-1.5 border-slate-300"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              Baixar XML
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPdf}
              className="h-8 text-xs gap-1.5 border-slate-300"
            >
              <Download className="w-3.5 h-3.5" />
              Baixar PDF
            </Button>
            {onOpenSendModal && (
              <Button
                size="sm"
                onClick={() => onOpenSendModal(nf)}
                className="h-8 text-xs gap-1.5 bg-primary text-white hover:bg-primary/90"
              >
                <Share2 className="w-3.5 h-3.5" />
                Enviar ao Cliente
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Visualizador DANFE Formatado Padrão SEFAZ */}
        <div className="p-6">
          <div className="bg-white border-2 border-slate-800 p-5 rounded-sm shadow-md font-sans text-slate-900 text-xs leading-tight space-y-4">
            {/* Topo DANFE */}
            <div className="grid grid-cols-12 border-b-2 border-slate-800 pb-3 gap-3 items-center">
              <div className="col-span-5 border-r border-slate-300 pr-3">
                <h2 className="font-extrabold text-sm tracking-tight text-primary uppercase">
                  CIAFAL FERRO & AÇO LTDA.
                </h2>
                <p className="text-[11px] text-slate-600">
                  Av. General David Sarnoff, 3800 - Cidade Industrial, Contagem - MG
                </p>
                <p className="text-[11px] text-slate-600">
                  CNPJ: 17.234.567/0001-88 · IE: 062.998.112.0091
                </p>
                <p className="text-[11px] text-slate-600">
                  Tel: (31) 3359-2000 · www.ciafal.com.br
                </p>
              </div>
              <div className="col-span-3 text-center border-r border-slate-300 px-2">
                <div className="font-extrabold text-lg tracking-wider">DANFE</div>
                <div className="text-[10px] text-slate-600 font-medium">
                  DOCUMENTO AUXILIAR DA NOTA FISCAL ELETRÔNICA
                </div>
                <div className="text-[11px] font-bold mt-1">
                  0 - ENTRADA / 1 - SAÍDA:{' '}
                  <span className="text-sm font-extrabold px-1 border border-slate-800">1</span>
                </div>
                <div className="text-xs font-bold mt-1">Nº: {nf.numeroNF}</div>
                <div className="text-[11px] text-slate-600">SÉRIE: {nf.serie} · FOLHA 1/1</div>
              </div>
              <div className="col-span-4 pl-2 space-y-1">
                <div className="text-[10px] font-bold uppercase text-slate-500">
                  Chave de Acesso SEFAZ
                </div>
                <div className="font-mono text-[11px] font-bold tracking-tight bg-slate-100 p-1.5 rounded border border-slate-300 select-all">
                  {nf.chaveAcesso}
                </div>
                <div className="text-[10px] text-slate-500">
                  Consulta de autenticidade no portal nacional da NF-e www.nfe.fazenda.gov.br
                </div>
              </div>
            </div>

            {/* Dados do Destinatário / Remetente */}
            <div className="border border-slate-800 rounded-xs p-2.5">
              <div className="text-[10px] font-bold uppercase bg-slate-100 -mt-2.5 -mx-2.5 px-2.5 py-0.5 border-b border-slate-800 mb-2">
                Destinatário / Remetente
              </div>
              <div className="grid grid-cols-12 gap-2 text-[11px]">
                <div className="col-span-7">
                  <span className="text-slate-500 block text-[9px] uppercase">
                    Nome / Razão Social
                  </span>
                  <span className="font-bold">{nf.clienteNome}</span>
                </div>
                <div className="col-span-3">
                  <span className="text-slate-500 block text-[9px] uppercase">CNPJ / CPF</span>
                  <span className="font-semibold">{nf.cnpj}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 block text-[9px] uppercase">Data Emissão</span>
                  <span className="font-semibold">{nf.dataEmissaoFormatada}</span>
                </div>

                <div className="col-span-6">
                  <span className="text-slate-500 block text-[9px] uppercase">
                    Código Cliente SAP
                  </span>
                  <span className="font-semibold font-mono">{nf.codigoClienteSap}</span>
                </div>
                <div className="col-span-3">
                  <span className="text-slate-500 block text-[9px] uppercase">
                    Pedido de Venda SAP
                  </span>
                  <span className="font-bold text-primary">{nf.pedidoSap}</span>
                </div>
                <div className="col-span-3">
                  <span className="text-slate-500 block text-[9px] uppercase">
                    Data Saída / Transporte
                  </span>
                  <span>{nf.dataSaida}</span>
                </div>
              </div>
            </div>

            {/* Cálculo do Imposto e Totais */}
            <div className="border border-slate-800 rounded-xs p-2.5">
              <div className="text-[10px] font-bold uppercase bg-slate-100 -mt-2.5 -mx-2.5 px-2.5 py-0.5 border-b border-slate-800 mb-2">
                Totais da Nota Fiscal
              </div>
              <div className="grid grid-cols-5 gap-2 text-center text-[11px]">
                <div className="p-1.5 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-slate-500 block text-[9px] uppercase">
                    Peso Líquido Total
                  </span>
                  <span className="font-extrabold text-slate-800">
                    {nf.pesoTon.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} t
                  </span>
                </div>
                <div className="p-1.5 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-slate-500 block text-[9px] uppercase">Peso Bruto (kg)</span>
                  <span className="font-bold">{nf.pesoKg.toLocaleString('pt-BR')} kg</span>
                </div>
                <div className="p-1.5 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-slate-500 block text-[9px] uppercase">
                    Empresa / Centro
                  </span>
                  <span className="font-semibold">{nf.centro}</span>
                </div>
                <div className="p-1.5 bg-slate-50 border border-slate-200 rounded">
                  <span className="text-slate-500 block text-[9px] uppercase">Frete por Conta</span>
                  <span className="font-semibold">0-CIF Remetente</span>
                </div>
                <div className="p-1.5 bg-primary/10 border border-primary/30 rounded">
                  <span className="text-primary block text-[9px] uppercase font-bold">
                    Valor Total da Nota
                  </span>
                  <span className="font-extrabold text-primary text-sm">
                    {nf.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Itens e Materiais Faturados */}
            <div className="border border-slate-800 rounded-xs p-2.5">
              <div className="text-[10px] font-bold uppercase bg-slate-100 -mt-2.5 -mx-2.5 px-2.5 py-0.5 border-b border-slate-800 mb-2 flex justify-between items-center">
                <span>Dados dos Produtos / Serviços (Rastreabilidade Qualidade & Lotes)</span>
                <span className="text-[9px] text-slate-500 font-normal">
                  {nf.materiais.length} item(ns) faturado(s)
                </span>
              </div>
              <table className="w-full text-left text-[11px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-300 text-slate-600 text-[10px] uppercase font-bold bg-slate-50">
                    <th className="p-1.5">Item</th>
                    <th className="p-1.5">Código / Descrição do Material</th>
                    <th className="p-1.5">NCM</th>
                    <th className="p-1.5">Lote / Corrida</th>
                    <th className="p-1.5 text-right">Qtd (t)</th>
                    <th className="p-1.5 text-right">Vlr Unitário</th>
                    <th className="p-1.5 text-right">Vlr Total</th>
                    <th className="p-1.5 text-center">Certificado</th>
                  </tr>
                </thead>
                <tbody>
                  {nf.materiais.map((mat) => (
                    <tr key={mat.item} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-1.5 font-bold">{mat.item}</td>
                      <td className="p-1.5">
                        <div className="font-bold text-slate-900">{mat.codigo}</div>
                        <div className="text-slate-600 text-[10px]">{mat.descricao}</div>
                      </td>
                      <td className="p-1.5 font-mono text-[10px]">{mat.ncm}</td>
                      <td className="p-1.5">
                        <div className="font-medium text-slate-800">Lote: {mat.lote}</div>
                        <div className="text-slate-500 text-[10px]">Corrida: {mat.corrida}</div>
                      </td>
                      <td className="p-1.5 text-right font-bold text-slate-900">
                        {mat.quantidade.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} t
                      </td>
                      <td className="p-1.5 text-right">
                        {mat.valorUnitario.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </td>
                      <td className="p-1.5 text-right font-bold">
                        {mat.valorTotal.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </td>
                      <td className="p-1.5 text-center">
                        {mat.certificadoNumero ? (
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]"
                          >
                            {mat.certificadoNumero}
                          </Badge>
                        ) : (
                          <span className="text-slate-400 text-[10px]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Dados Adicionais */}
            <div className="border border-slate-800 rounded-xs p-2.5">
              <div className="text-[10px] font-bold uppercase bg-slate-100 -mt-2.5 -mx-2.5 px-2.5 py-0.5 border-b border-slate-800 mb-1">
                Informações Complementares / Observações Fiscais
              </div>
              <p className="text-[10px] text-slate-700 leading-normal">
                {nf.informacoesComplementares}
              </p>
            </div>

            {/* Transporte Integrado TMS */}
            {nf.transporteInfo && (
              <div className="p-3 bg-blue-50/50 border border-blue-200 rounded flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-700" />
                  <div className="text-xs">
                    <span className="font-bold text-blue-950">
                      Transporte Vinculado: {nf.transporteInfo.numeroTransporte}
                    </span>
                    <span className="text-slate-600 block text-[10px]">
                      {nf.transporteInfo.transportadora} · Status:{' '}
                      <strong>{nf.transporteInfo.statusCarga}</strong> · Previsão/Entrega:{' '}
                      {nf.transporteInfo.previsaoEntrega}
                    </span>
                  </div>
                </div>
                {onOpenTmsModal && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onOpenTmsModal(nf)}
                    className="h-7 text-xs border-blue-300 text-blue-800 hover:bg-blue-100"
                  >
                    Ver Transporte & Fred
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
