import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string;
  icon: ReactNode;
}

export function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <div className="h-full w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:p-6">
      <div className="flex h-full items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm leading-snug text-slate-500">
            {title}
          </p>

          <h2 className="mt-2 break-words text-2xl font-bold text-slate-900 sm:text-3xl">
            {value}
          </h2>
        </div>

        <div className="shrink-0 rounded-xl bg-purple-100 p-3 text-[#8A0EEA]">
          {icon}
        </div>
      </div>
    </div>
  );
}