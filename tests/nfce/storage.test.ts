import { describe, expect, it } from "vitest";

import { buildFiscalXmlPath } from "@/lib/fiscal-xml-storage";

describe("organização de XML", () => {
  it("organiza por ambiente, ano e mês", () => {
    expect(
      buildFiscalXmlPath(
        "mock",
        "23260800000000000000650010000001251000001251",
        new Date("2026-08-15T12:00:00Z"),
      ),
    ).toBe(
      "nfce/mock/2026/08/23260800000000000000650010000001251000001251.xml",
    );
  });
});
