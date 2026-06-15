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
return ( <div className="flex"> <Sidebar />


  <main className="flex-1 bg-slate-50 min-h-screen">
    <Header />

    <div className="p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

        <StatCard
          title="Pets"
          value="320"
          icon={<PawPrint size={24} />}
        />

        <StatCard
          title="Tutores"
          value="125"
          icon={<Users size={24} />}
        />

        <StatCard
          title="Agendamentos"
          value="18"
          icon={<CalendarDays size={24} />}
        />

        <StatCard
          title="Faturamento"
          value="R$ 8.420"
          icon={<Wallet size={24} />}
        />

      </div>
    </div>
  </main>
</div>


);
}
