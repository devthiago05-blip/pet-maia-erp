import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  calls: [] as Array<{ table: string; method: string; args: unknown[] }>,
  pages: {} as Record<
    string,
    Array<{ data: unknown; error: null | { message: string } }>
  >,
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from(table: string) {
      const builder: Record<string, unknown> = {};
      for (const method of [
        "select",
        "eq",
        "in",
        "order",
        "range",
        "single",
        "returns",
      ]) {
        builder[method] = (...args: unknown[]) => {
          state.calls.push({ table, method, args });
          return builder;
        };
      }
      builder.then = (resolve: (result: unknown) => unknown) =>
        Promise.resolve(
          state.pages[table]?.shift() || { data: [], error: null },
        ).then(resolve);
      return builder;
    },
  },
}));

import { fetchTutorDetails } from "@/services/tutor-history";

beforeEach(() => {
  state.calls = [];
  state.pages = {
    tutors: [{ data: { id: 1, nome: "Tutor de teste" }, error: null }],
    pets: [
      { data: [{ id: 7, tutor_id: 1, nome: "Pet de teste" }], error: null },
    ],
    appointments: [{ data: [{ id: 15, pet_id: 7 }], error: null }],
    financial_entries: [{ data: [], error: null }],
  };
});

describe("Consulta da ficha do tutor", () => {
  it("restringe consultas ao tutor, seus pets e aos atendimentos encontrados", async () => {
    await fetchTutorDetails(1, {
      history: true,
      services: true,
      financial: true,
    });
    expect(state.calls).toEqual(
      expect.arrayContaining([
        { table: "tutors", method: "eq", args: ["id", 1] },
        { table: "pets", method: "eq", args: ["tutor_id", 1] },
        { table: "appointments", method: "in", args: ["pet_id", [7]] },
        {
          table: "financial_entries",
          method: "in",
          args: ["referencia_id", [15]],
        },
        {
          table: "financial_entries",
          method: "eq",
          args: ["origem", "appointment"],
        },
      ]),
    );
  });

  it("não consulta atendimentos quando o perfil só pode ver tutores", async () => {
    const result = await fetchTutorDetails(1, {
      history: false,
      services: false,
      financial: false,
    });
    expect(result.appointments).toEqual([]);
    expect(state.calls.some((call) => call.table === "appointments")).toBe(
      false,
    );
    expect(state.calls.some((call) => call.table === "financial_entries")).toBe(
      false,
    );
  });

  it("não consulta valores ou serviços detalhados sem permissão", async () => {
    await fetchTutorDetails(1, {
      history: true,
      services: false,
      financial: false,
    });
    expect(state.calls).toContainEqual({
      table: "appointments",
      method: "select",
      args: ["*"],
    });
    expect(state.calls.some((call) => call.table === "financial_entries")).toBe(
      false,
    );
  });

  it("busca a próxima página sem perder atendimentos antigos", async () => {
    state.pages.appointments = [
      {
        data: Array.from({ length: 500 }, (_, i) => ({ id: i + 1, pet_id: 7 })),
        error: null,
      },
      { data: [{ id: 501, pet_id: 7 }], error: null },
    ];
    const result = await fetchTutorDetails(1, {
      history: true,
      services: true,
      financial: false,
    });
    expect(result.appointments).toHaveLength(501);
    expect(state.calls).toContainEqual({
      table: "appointments",
      method: "range",
      args: [500, 999],
    });
  });

  it("não apresenta histórico incompleto como sucesso após erro de consulta", async () => {
    state.pages.appointments = [
      { data: null, error: { message: "Falha de rede" } },
    ];
    await expect(
      fetchTutorDetails(1, { history: true, services: true, financial: false }),
    ).rejects.toThrow("Falha de rede");
  });

  it("não realiza consultas abertas quando não há pets", async () => {
    state.pages.pets = [{ data: [], error: null }];
    const result = await fetchTutorDetails(1, {
      history: true,
      services: true,
      financial: true,
    });
    expect(result.appointments).toEqual([]);
    expect(state.calls.some((call) => call.method === "in")).toBe(false);
  });
});
