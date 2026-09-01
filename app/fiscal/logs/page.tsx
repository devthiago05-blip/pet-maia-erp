"use client";

import { useEffect, useState } from "react";

import { FiscalShell } from "@/components/fiscal/FiscalShell";
import { fiscalApi } from "@/services/fiscal-module";

interface FiscalEventRow {
  id: number;
  environment: string;
  event_type: string;
  status_code?: number;
  message: string;
  created_at: string;
}

interface FiscalEventsResponse {
  events: FiscalEventRow[];
  warning?: string;
}

export default function FiscalLogsPage() {
  const [events, setEvents] = useState<FiscalEventRow[]>([]);
  const [warning, setWarning] = useState("");
  useEffect(() => {
    fiscalApi<FiscalEventsResponse>("/api/fiscal/events")
      .then((data) => {
        setEvents(data.events || []);
        setWarning(data.warning || "");
      })
      .catch((error) => setWarning(error.message));
  }, []);
  return (
    <FiscalShell
      title="Logs fiscais"
      description="Histórico estruturado e sem segredos"
    >
      <div className="rounded-2xl border bg-white p-5">
        {warning && (
          <p className="mb-4 rounded-xl bg-amber-50 p-3 text-amber-800">
            {warning}
          </p>
        )}
        <div className="space-y-3">
          {events.map((event) => (
            <div key={event.id} className="rounded-xl border p-4">
              <div className="flex flex-wrap justify-between gap-2">
                <strong>
                  [NFCE][{String(event.environment).toUpperCase()}][
                  {String(event.event_type).toUpperCase()}]
                </strong>
                <span className="text-xs text-slate-500">
                  {new Date(event.created_at).toLocaleString("pt-BR")}
                </span>
              </div>
              <p className="mt-1 text-sm">
                {event.status_code ? `${event.status_code} — ` : ""}
                {event.message}
              </p>
            </div>
          ))}
          {!events.length && (
            <p className="py-8 text-center text-slate-500">
              Nenhum evento fiscal registrado.
            </p>
          )}
        </div>
      </div>
    </FiscalShell>
  );
}
