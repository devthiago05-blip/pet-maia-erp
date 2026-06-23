"use client";

import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

interface AuthGuardProps {
  children: ReactNode;
}

const publicRoutes = ["/login"];

export function AuthGuard({ children }: AuthGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) {
        return;
      }

      if (!data.session && !isPublicRoute) {
        router.replace("/login");
      }

      if (data.session && isPublicRoute) {
        router.replace("/");
      }

      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && !isPublicRoute) {
        router.replace("/login");
      }

      if (session && isPublicRoute) {
        router.replace("/");
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [isPublicRoute, router]);

  if (loading && !isPublicRoute) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="rounded-2xl border bg-white p-6 text-center shadow-sm">
          <p className="font-medium text-slate-800">Carregando...</p>
          <p className="mt-1 text-sm text-slate-500">
            Verificando acesso ao PET MAIA ERP
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
