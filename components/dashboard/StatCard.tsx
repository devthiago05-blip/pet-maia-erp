import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  onClick?: () => void;
  active?: boolean;
  children?: ReactNode;
}

export function StatCard({
  title,
  value,
  icon,
  onClick,
  active = false,
  children,
}: StatCardProps) {
  return (
    <article
      className={`w-full overflow-hidden rounded-2xl border bg-white shadow-sm transition ${
        active
          ? "col-span-2 border-[#8A0EEA] ring-1 ring-[#8A0EEA]/20 lg:col-span-3 xl:col-span-4"
          : "border-slate-200"
      }`}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex min-h-[104px] w-full p-3 text-left transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#8A0EEA] focus:ring-inset sm:min-h-[128px] sm:p-5"
      >
        <div className="flex w-full items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium leading-snug text-slate-500 sm:text-sm">
              {title}
            </p>

            <h2 className="mt-2 whitespace-nowrap text-xl font-bold leading-tight tracking-tight text-slate-900 sm:mt-3 sm:text-2xl">
              {value}
            </h2>
          </div>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-[#8A0EEA] sm:h-11 sm:w-11">
            {icon}
          </div>
        </div>
      </button>

      {active && children && (
        <div className="max-h-[420px] overflow-y-auto border-t border-slate-100 p-4 sm:p-5">
          {children}
        </div>
      )}
    </article>
  );
}
