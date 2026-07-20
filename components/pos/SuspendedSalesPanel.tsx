"use client";

/* eslint-disable react-hooks/purity -- timestamp only labels sales older than 24 hours */

import { Clock3, PauseCircle, Play, Trash2, X } from "lucide-react";
import { useState } from "react";

import { formatCurrency, formatProductName } from "@/lib/formatters";
import type { Product, SuspendedPosSale } from "@/types/domain";

export function SuspendedSalesPanel({ sales, cartCount, customerName, processing, onSuspend, onRecover, onDelete }: {
  sales: SuspendedPosSale[];
  cartCount: number;
  customerName: string;
  processing: boolean;
  onSuspend: (notes: string) => Promise<void>;
  onRecover: (sale: SuspendedPosSale) => Promise<void>;
  onDelete: (sale: SuspendedPosSale) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [suspending, setSuspending] = useState(false);
  const [notes, setNotes] = useState("");

  async function suspend() {
    setSuspending(true);
    try { await onSuspend(notes); setNotes(""); }
    catch { return; }
    finally { setSuspending(false); }
  }

  return <>
    <section className="overflow-hidden rounded-2xl border border-purple-100 bg-gradient-to-r from-purple-50 via-white to-white shadow-sm">
      <button type="button" onClick={()=>setOpen(true)} className="flex w-full items-center justify-between gap-3 p-4 text-left">
        <div className="flex min-w-0 items-center gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#8A0EEA] text-white"><PauseCircle size={22}/></span><div className="min-w-0"><h2 className="font-bold text-slate-900">Vendas suspensas</h2><p className="truncate text-sm text-slate-500">Guarde um atendimento e continue depois</p></div></div>
        <span className="grid min-w-9 place-items-center rounded-full bg-purple-100 px-2 py-1 text-sm font-black text-[#8A0EEA]">{sales.length}</span>
      </button>
      {cartCount>0&&<div className="border-t border-purple-100 px-4 py-3"><button type="button" onClick={()=>void suspend()} disabled={processing||suspending} className="w-full rounded-xl border border-[#8A0EEA] py-2.5 font-semibold text-[#8A0EEA] transition hover:bg-purple-50 disabled:opacity-50">{suspending?"Suspendendo...":`Suspender carrinho (${cartCount})`}</button></div>}
    </section>

    {open&&<div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"><div className="max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-t-2xl bg-slate-50 p-4 shadow-2xl sm:rounded-2xl sm:p-6"><div className="flex items-start justify-between"><div><h2 className="text-xl font-black">Vendas suspensas</h2><p className="text-sm text-slate-500">{sales.length} atendimento(s) aguardando</p></div><button type="button" onClick={()=>setOpen(false)} className="rounded-xl border bg-white p-2"><X size={18}/></button></div>
      {cartCount>0&&<div className="mt-5 rounded-xl border bg-white p-4"><p className="font-bold">Suspender carrinho atual</p><p className="text-sm text-slate-500">{customerName||"Consumidor"} · {cartCount} item(ns)</p><textarea value={notes} onChange={e=>setNotes(e.target.value)} rows={2} placeholder="Observação para lembrar depois" className="mt-3 w-full rounded-xl border p-3 text-sm"/><button type="button" onClick={()=>void suspend()} disabled={processing||suspending} className="mt-3 w-full rounded-xl bg-[#8A0EEA] py-3 font-bold text-white disabled:opacity-50">{suspending?"Suspendendo...":"Suspender e liberar o PDV"}</button></div>}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">{sales.length===0?<p className="rounded-xl border border-dashed bg-white p-6 text-center text-sm text-slate-500 sm:col-span-2">Nenhuma venda suspensa.</p>:sales.map(sale=>{const items=sale.suspended_pos_sale_items||[];const total=items.reduce((sum,item)=>sum+item.quantity*Number(item.unit_price),0);const overdue=Date.now()-new Date(sale.created_at).getTime()>86400000;return <article key={sale.id} className={`rounded-2xl border bg-white p-4 ${overdue?"border-amber-300":"border-slate-200"}`}><div className="flex items-start justify-between gap-2"><div><p className="text-xs font-bold text-slate-400">#{String(sale.id).padStart(5,"0")}</p><h3 className="font-black">{sale.tutors?.nome||sale.customer_name}</h3></div><span className={`rounded-full px-2 py-1 text-xs font-bold ${overdue?"bg-amber-100 text-amber-700":"bg-purple-100 text-[#8A0EEA]"}`}>{overdue?"Há mais de 24h":"Aguardando"}</span></div><div className="mt-3 space-y-1 text-sm text-slate-600">{items.slice(0,3).map(item=><p key={item.id} className="truncate">{item.quantity}x {item.products?formatProductName(item.products as Product):`Produto #${item.product_id}`}</p>)}{items.length>3&&<p>+ {items.length-3} produto(s)</p>}</div>{sale.notes&&<p className="mt-3 rounded-lg bg-slate-50 p-2 text-xs text-slate-500">{sale.notes}</p>}<div className="mt-4 flex items-end justify-between"><div><p className="flex items-center gap-1 text-xs text-slate-400"><Clock3 size={12}/>{new Date(sale.created_at).toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"})}</p><strong className="text-lg text-[#8A0EEA]">{formatCurrency(total)}</strong></div><div className="flex gap-2"><button type="button" onClick={()=>void onDelete(sale)} className="rounded-xl border p-2.5 text-red-600" aria-label="Excluir venda suspensa"><Trash2 size={17}/></button><button type="button" onClick={()=>void onRecover(sale)} className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-2.5 text-sm font-bold text-white"><Play size={16}/>Recuperar</button></div></div></article>})}</div>
    </div></div>}
  </>;
}
