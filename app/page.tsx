"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { StatCard } from "@/components/dashboard/StatCard";

import {
PawPrint,
Users,
CalendarDays,
Wallet,
} from "lucide-react";

export default function HomePage() {

  const [pets, setPets] =
    useState(0);

  const [tutors, setTutors] =
    useState(0);

  const [
    appointments,
    setAppointments,
  ] = useState(0);

  const [recebido, setRecebido] =
    useState(0);

  const [receber, setReceber] =
    useState(0);
  const [
  ultimosAgendamentos,
  setUltimosAgendamentos,
] = useState<any[]>([]);

const [
  ultimosRecebimentos,
  setUltimosRecebimentos,
] = useState<any[]>([]);
  useEffect(() => {
  async function loadData() {

    const {
  data: recebimentosData,
} = await supabase
  .from("financial_entries")
  .select("*")
  .order("id", {
    ascending: false,
  })
  .limit(5);

    const {
      count: petsCount,
    } = await supabase
      .from("pets")
      .select("*", {
        count: "exact",
        head: true,
      });

    const {
      count: tutorsCount,
    } = await supabase
      .from("tutors")
      .select("*", {
        count: "exact",
        head: true,
      });

   const {
  count: appointmentsCount,
} = await supabase
  .from("appointments")
  .select("*", {
    count: "exact",
    head: true,
  });

const {
  data: appointmentsData,
} = await supabase
  .from("appointments")
  .select(`
    *,
    pets (
      nome
    )
  `)
  .order("id", {
    ascending: false,
  })
  .limit(5);

  const {
  data: receitas,
} = await supabase
  .from("financial_entries")
  .select("valor")
  .eq(
    "status_pagamento",
    "Pago"
  )
  .eq(
    "tipo",
    "Receita"
  );

const {
  data: pendentes,
} = await supabase
  .from("financial_entries")
  .select("valor")
  .eq(
    "status_pagamento",
    "Pendente"
  )
  .eq(
    "tipo",
    "Receita"
  );

const totalRecebido =
  receitas?.reduce(
    (total, item) =>
      total + Number(item.valor),
    0
  ) || 0;

const totalReceber =
  pendentes?.reduce(
    (total, item) =>
      total + Number(item.valor),
    0
  ) || 0;

setPets(
  petsCount || 0
);

setTutors(
  tutorsCount || 0
);

setAppointments(
  appointmentsCount || 0
);

  setUltimosAgendamentos(
  appointmentsData || []
);

setUltimosRecebimentos(
  recebimentosData || []
);

setRecebido(
  totalRecebido
);

setReceber(
  totalReceber
);
  }

  loadData();
}, []);
return ( <div className="flex"> <Sidebar />


  <main className="flex-1 bg-slate-50 min-h-screen">
    <Header />

    <div className="p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">

        

        <StatCard
          title="Pets"
          value={String(pets)}
          icon={<PawPrint size={24} />}
        />

        <StatCard
          title="Tutores"
          value={String(tutors)}
          icon={<Users size={24} />}
        />

        <StatCard
          title="Agendamentos"
          value={String(appointments)}
          icon={<CalendarDays size={24} />}
        />

        <StatCard
        title="A Receber"
        value={`R$ ${receber.toFixed(2)}`}
        icon={<Wallet size={24} />}
/>

        <StatCard
          title="Faturamento"
          value={`R$ ${recebido.toFixed(2)}`}
          icon={<Wallet size={24} />}
        />

      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">

  <div className="bg-white rounded-2xl border p-6">

    <h2 className="text-xl font-bold mb-4">
      Últimos Agendamentos
    </h2>

    <div className="space-y-3">

      {ultimosAgendamentos.map(
        (appointment) => (

          <div
            key={appointment.id}
            className="flex justify-between border-b pb-2"
          >

            <div>

              <p className="font-medium">
                {appointment.pets?.nome ||
                  "-"}
              </p>

              <p className="text-sm text-slate-500">
                {appointment.servico}
              </p>

            </div>
                    
            <div className="text-right">

              <p>
                {appointment.hora}
              </p>

              <p className="text-sm text-slate-500">
                {appointment.status}
              </p>

            </div>
                  
          </div>
          
        )
      )}
      
    </div>
      
  </div>
      <div className="bg-white rounded-2xl border p-6">

  <h2 className="text-xl font-bold mb-4">
    Últimos Recebimentos
  </h2>

  <div className="space-y-3">

    {ultimosRecebimentos.map(
      (item) => (

        <div
          key={item.id}
          className="flex justify-between border-b pb-2"
        >

          <div>

            <p className="font-medium">
              {item.descricao}
            </p>

            <p className="text-sm text-slate-500">
              {item.forma_pagamento}
            </p>

          </div>

          <div className="text-right">

            <p>
              R$ {item.valor}
            </p>

            <p
              className={`text-sm ${
                item.status_pagamento ===
                "Pago"
                  ? "text-green-600"
                  : "text-yellow-600"
              }`}
            >
              {item.status_pagamento}
            </p>

          </div>

        </div>

      )
    )}

  </div>

</div>
</div>
    </div>
  </main>
</div>


);
}
