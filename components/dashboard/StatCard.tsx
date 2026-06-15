import { ReactNode } from "react";

interface StatCardProps {
title: string;
value: string;
icon: ReactNode;
}

export function StatCard({
title,
value,
icon,
}: StatCardProps) {
return ( <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200"> <div className="flex items-center justify-between"> <div> <p className="text-slate-500 text-sm">
{title} </p>


      <h2 className="text-3xl font-bold mt-2">
        {value}
      </h2>
    </div>

    <div className="bg-purple-100 p-3 rounded-xl text-[#8A0EEA]">
      {icon}
    </div>
  </div>
</div>


);
}
