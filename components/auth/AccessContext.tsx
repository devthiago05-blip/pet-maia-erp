"use client";

import { createContext, ReactNode, useContext } from "react";

import type { AccessModule } from "@/lib/access-control";
import type { UserProfile } from "@/types/domain";

interface AccessContextValue {
  profile: UserProfile | null;
  permissions: AccessModule[];
  canAccess: (module: AccessModule) => boolean;
}

const AccessContext = createContext<AccessContextValue>({
  profile: null,
  permissions: [],
  canAccess: () => false,
});

export function AccessProvider({
  children,
  profile,
  permissions,
}: {
  children: ReactNode;
  profile: UserProfile;
  permissions: AccessModule[];
}) {
  return (
    <AccessContext.Provider
      value={{
        profile,
        permissions,
        canAccess: (module) => profile.is_admin || permissions.includes(module),
      }}
    >
      {children}
    </AccessContext.Provider>
  );
}

export function useAccess() {
  return useContext(AccessContext);
}
