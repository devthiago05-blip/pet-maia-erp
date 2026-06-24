"use client";

import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

import { AccessProvider } from "@/components/auth/AccessContext";
import {
  type AccessModule,
  accessModules,
  getRouteModule,
  routeAccess,
} from "@/lib/access-control";
import { supabase } from "@/lib/supabase";
import type { UserProfile } from "@/types/domain";

interface AuthGuardProps {
  children: ReactNode;
}

const publicRoutes = ["/login"];

export function AuthGuard({ children }: AuthGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [permissions, setPermissions] = useState<AccessModule[]>([]);

  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    let active = true;

    async function loadAccess() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) {
        return;
      }

      if (!session && !isPublicRoute) {
        router.replace("/login");
        setLoading(false);
        return;
      }

      if (session && isPublicRoute) {
        router.replace("/");
        setLoading(false);
        return;
      }

      if (!session) {
        setLoading(false);
        return;
      }

      const [{ data: profileData }, { data: permissionData }] =
        await Promise.all([
          supabase
            .from("user_profiles")
            .select("*")
            .eq("id", session.user.id)
            .single(),
          supabase
            .from("user_permissions")
            .select("module, can_access")
            .eq("user_id", session.user.id)
            .eq("can_access", true),
        ]);

      if (!active) {
        return;
      }

      if (!profileData?.ativo) {
        await supabase.auth.signOut();
        router.replace("/login");
        setLoading(false);
        return;
      }

      const allowedModules = profileData.is_admin
        ? [...accessModules]
        : ((permissionData || []).map(
            (permission) => permission.module,
          ) as AccessModule[]);
      const requestedModule = getRouteModule(pathname);

      setProfile(profileData as UserProfile);
      setPermissions(allowedModules);

      if (requestedModule && !allowedModules.includes(requestedModule)) {
        const fallbackRoute =
          Object.entries(routeAccess).find(([, module]) =>
            allowedModules.includes(module),
          )?.[0] || "/login";

        router.replace(fallbackRoute);
      }

      setLoading(false);
    }

    loadAccess();

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
  }, [isPublicRoute, pathname, router]);

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

  if (isPublicRoute || !profile) {
    return <>{children}</>;
  }

  return (
    <AccessProvider profile={profile} permissions={permissions}>
      {children}
    </AccessProvider>
  );
}
