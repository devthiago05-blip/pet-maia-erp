"use client";

import { PackageCheck, Plus, Send, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { formatCurrency, formatDate, formatProductName } from "@/lib/formatters";
import type { Product, PurchaseOrder, Supplier } from "@/types/domain";

interface OrderLine { key: string; productId: string; quantity: string; cost: string }
export interface NewPurchaseOrderInput { supplierId: number; expectedDate: string | null; notes: string; items: Array<{ product_id: number; quantidade: number; custo_unitario: number }> }

export function PurchaseOrdersPanel({ orders, products, suppliers, onCreate, onStatus, onReceive }: {
  orders: PurchaseOrder[]; products: Product[]; suppliers: Supplier[];
  onCreate: (input: NewPurchaseOrderInput) => Promise<void>;
  onStatus: (id: number, status: "Enviado" | "Cancelado") => Promise<void>;
  onReceive: (id: number, receipts: Array<{ item_id: number; quantidade: number }>) => Promise<void>;
}) {
  const [creating, setCreating] = useState(false);
  const [receiving, setReceiving] = useState<PurchaseOrder | null>(null);
  const [supplierId, setSupplierId] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<OrderLine[]>([{ key: "1", productId: "", quantity: "1", cost: "" }]);
  const [receiptQty, setReceiptQty] = useState<Record<number, string>>({});
  const [processing, setProcessing] = useState(false);
  const total = useMemo(() => lines.reduce((sum, line) => sum + Number(line.quantity || 0) * Number(line.cost || 0), 0), [lines]);

  async function create() {
    const items = lines.map((line) => ({ product_id: Number(line.productId), quantidade: Number(line.quantity), custo_unitario: Number(line.cost) }));
    if (!supplierId || items.some((item) => !item.product_id || !Number.isInteger(item.quantidade) || item.quantidade <= 0 || !Number.isFinite(item.custo_unitario) || item.custo_unitario < 0)) { toast.error("Confira fornecedor e produtos"); return; }
    if (new Set(items.map((item) => item.product_id)).size !== items.length) { toast.error("Não repita o mesmo produto no pedido"); return; }
    setProcessing(true);
    try { await onCreate({ supplierId: Number(supplierId), expectedDate: expectedDate || null, notes, items }); setCreating(false); setLines([{ key: "1", productId: "", quantity: "1", cost: "" }]); setNotes(""); }
    finally { setProcessing(false); }
  }

  function openReceipt(order: PurchaseOrder) {
    setReceiving(order);
    setReceiptQty(Object.fromEntries((order.purchase_order_items || []).map((item) => [item.id, String(item.ordered_quantity - item.received_quantity)])));
  }

  async function receive() {
    if (!receiving) return;
    const receipts = (receiving.purchase_order_items || []).map((item) => ({ item_id: item.id, quantidade: Number(receiptQty[item.id] || 0) })).filter((item) => item.quantidade > 0);
    if (receipts.length === 0) { toast.error("Informe ao menos uma quantidade recebida"); return; }
    setProcessing(true); try { await onReceive(receiving.id, receipts); setReceiving(null); } finally { setProcessing(false); }
  }

  return <section className="space-y-4 rounded-2xl border bg-white p-4 sm:p-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold">Pedidos de compra</h2><p className="text-sm text-slate-500">O estoque só muda quando os produtos são recebidos.</p></div><button type="button" onClick={() => setCreating(true)} className="rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white">Novo pedido</button></div>
    <div className="grid gap-3 lg:grid-cols-2">{orders.length === 0 ? <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Nenhum pedido criado.</p> : orders.map((order) => {
      const items=order.purchase_order_items||[]; const ordered=items.reduce((s,i)=>s+i.ordered_quantity,0); const received=items.reduce((s,i)=>s+i.received_quantity,0); const orderTotal=items.reduce((s,i)=>s+i.ordered_quantity*Number(i.unit_cost),0);
      return <article key={order.id} className="rounded-xl border p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-slate-400">PEDIDO #{String(order.id).padStart(6,"0")}</p><h3 className="font-bold">{order.suppliers?.nome||"Fornecedor"}</h3><p className="text-xs text-slate-500">Criado {formatDate(order.created_at)}{order.expected_date?` · Previsto ${formatDate(order.expected_date)}`:""}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColor(order.status)}`}>{order.status}</span></div><div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-center text-sm"><div><p className="text-xs text-slate-500">Itens</p><strong>{items.length}</strong></div><div><p className="text-xs text-slate-500">Recebido</p><strong>{received}/{ordered}</strong></div><div><p className="text-xs text-slate-500">Total</p><strong>{formatCurrency(orderTotal)}</strong></div></div><div className="mt-3 flex flex-wrap gap-2">{order.status==="Rascunho"&&<button type="button" onClick={()=>void onStatus(order.id,"Enviado")} className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700"><Send size={15}/>Marcar enviado</button>}{!["Concluído","Cancelado"].includes(order.status)&&<button type="button" onClick={()=>openReceipt(order)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700"><PackageCheck size={15}/>Receber</button>}{["Rascunho","Enviado"].includes(order.status)&&<button type="button" onClick={()=>void onStatus(order.id,"Cancelado")} className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">Cancelar</button>}</div></article>;
    })}</div>

    {creating&&<Modal title="Novo pedido de compra" onClose={()=>setCreating(false)}><div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-2 text-sm font-medium">Fornecedor<select value={supplierId} onChange={e=>setSupplierId(e.target.value)} className="rounded-xl border p-3 font-normal"><option value="">Selecione</option>{suppliers.filter(s=>s.ativo).map(s=><option key={s.id} value={s.id}>{s.nome}</option>)}</select></label><label className="grid gap-2 text-sm font-medium">Previsão<input type="date" value={expectedDate} onChange={e=>setExpectedDate(e.target.value)} className="rounded-xl border p-3 font-normal"/></label></div><div className="mt-4 space-y-3">{lines.map(line=><div key={line.key} className="grid gap-2 rounded-xl border p-3 sm:grid-cols-[1fr_100px_130px_auto]"><select value={line.productId} onChange={e=>{const value=e.target.value;const product=products.find(p=>String(p.id)===value);setLines(c=>c.map(x=>x.key===line.key?{...x,productId:value,cost:product?String(product.preco_custo):x.cost}:x));}} className="rounded-lg border p-2"><option value="">Produto</option>{products.filter(p=>p.ativo).map(p=><option key={p.id} value={p.id}>{formatProductName(p)}</option>)}</select><input type="number" min="1" value={line.quantity} onChange={e=>setLines(c=>c.map(x=>x.key===line.key?{...x,quantity:e.target.value}:x))} aria-label="Quantidade" className="rounded-lg border p-2"/><input type="number" min="0" step="0.01" value={line.cost} onChange={e=>setLines(c=>c.map(x=>x.key===line.key?{...x,cost:e.target.value}:x))} placeholder="Custo" className="rounded-lg border p-2"/><button type="button" onClick={()=>setLines(c=>c.filter(x=>x.key!==line.key))} disabled={lines.length===1} className="rounded-lg border p-2 text-red-600 disabled:opacity-40"><Trash2 size={17}/></button></div>)}</div><button type="button" onClick={()=>setLines(c=>[...c,{key:String(Date.now()),productId:"",quantity:"1",cost:""}])} className="mt-3 inline-flex items-center gap-1 font-semibold text-[#8A0EEA]"><Plus size={16}/>Adicionar produto</button><textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Observações" rows={2} className="mt-4 w-full rounded-xl border p-3"/><div className="mt-4 flex justify-between font-bold"><span>Total estimado</span><span className="text-[#8A0EEA]">{formatCurrency(total)}</span></div><ActionButtons processing={processing} onCancel={()=>setCreating(false)} onConfirm={()=>void create()} confirm="Criar pedido"/></Modal>}

    {receiving&&<Modal title={`Receber pedido #${String(receiving.id).padStart(6,"0")}`} onClose={()=>setReceiving(null)}><p className="text-sm text-slate-500">Informe somente o que chegou agora. O restante continuará pendente.</p><div className="mt-4 space-y-3">{(receiving.purchase_order_items||[]).map(item=>{const remaining=item.ordered_quantity-item.received_quantity;return <div key={item.id} className="grid gap-2 rounded-xl border p-3 sm:grid-cols-[1fr_120px]"><div><p className="font-semibold">{item.products?formatProductName(item.products as Product):`Produto #${item.product_id}`}</p><p className="text-xs text-slate-500">Pedido {item.ordered_quantity} · já recebido {item.received_quantity} · falta {remaining}</p></div><input type="number" min="0" max={remaining} value={receiptQty[item.id]||""} onChange={e=>setReceiptQty(c=>({...c,[item.id]:e.target.value}))} aria-label="Recebido agora" className="rounded-lg border p-3"/></div>})}</div><ActionButtons processing={processing} onCancel={()=>setReceiving(null)} onConfirm={()=>void receive()} confirm="Confirmar recebimento"/></Modal>}
  </section>;
}

function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}){return <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center"><div className="max-h-[calc(100dvh-2rem)] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-4 sm:p-6"><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-bold">{title}</h2><button type="button" onClick={onClose} className="rounded-lg border p-2"><X size={18}/></button></div>{children}</div></div>}
function ActionButtons({processing,onCancel,onConfirm,confirm}:{processing:boolean;onCancel:()=>void;onConfirm:()=>void;confirm:string}){return <div className="mt-6 grid gap-3 sm:grid-cols-2"><button type="button" onClick={onCancel} className="rounded-xl border py-3">Cancelar</button><button type="button" onClick={onConfirm} disabled={processing} className="rounded-xl bg-[#8A0EEA] py-3 font-semibold text-white disabled:opacity-60">{processing?"Salvando...":confirm}</button></div>}
function statusColor(status:string){if(status==="Concluído")return"bg-emerald-100 text-emerald-700";if(status==="Cancelado")return"bg-red-100 text-red-700";if(status==="Recebido parcialmente")return"bg-amber-100 text-amber-800";if(status==="Enviado")return"bg-blue-100 text-blue-700";return"bg-slate-100 text-slate-700"}
