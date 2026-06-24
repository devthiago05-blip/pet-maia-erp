export const accessModules = [
  "dashboard",
  "tutores",
  "pets",
  "servicos",
  "agenda",
  "financeiro",
  "recibos",
  "relatorios",
  "pdv",
  "configuracoes",
  "usuarios",
] as const;

export type AccessModule = (typeof accessModules)[number];

export const accessModuleLabels: Record<AccessModule, string> = {
  dashboard: "Dashboard",
  tutores: "Tutores",
  pets: "Pets",
  servicos: "Serviços",
  agenda: "Agenda",
  financeiro: "Financeiro",
  recibos: "Recibos",
  relatorios: "Relatórios",
  pdv: "PDV",
  configuracoes: "Configurações",
  usuarios: "Usuários",
};

export const routeAccess: Record<string, AccessModule> = {
  "/": "dashboard",
  "/tutors": "tutores",
  "/pets": "pets",
  "/services": "servicos",
  "/agenda": "agenda",
  "/financeiro": "financeiro",
  "/receipts": "recibos",
  "/relatorios": "relatorios",
  "/pdv": "pdv",
  "/settings": "configuracoes",
  "/usuarios": "usuarios",
};

export function getRouteModule(pathname: string) {
  const route = Object.keys(routeAccess)
    .filter((item) => item !== "/")
    .find((item) => pathname === item || pathname.startsWith(`${item}/`));

  return route ? routeAccess[route] : routeAccess[pathname];
}
