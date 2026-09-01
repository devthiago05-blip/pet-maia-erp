import { describe, expect, it } from "vitest";

import { assertNfceEnvironmentIsSafe, getNfceConfig } from "@/lib/nfce/config";

describe("configuração NFC-e", () => {
  it("usa ambiente e provider mock como padrões seguros", () => {
    const config = getNfceConfig({});
    expect(config.environment).toBe("mock");
    expect(config.provider).toBe("mock");
    expect(config.certificateMode).toBe("mock");
  });

  it("permite mock somente fora de produção", () => {
    const config = getNfceConfig({ NFCE_ENV: "homologacao" });
    expect(() => assertNfceEnvironmentIsSafe(config)).not.toThrow();
  });

  it("bloqueia produção sem configuração completa", () => {
    const config = getNfceConfig({ NFCE_ENV: "producao" });
    expect(() => assertNfceEnvironmentIsSafe(config)).toThrow(
      "Emissão NFC-e em produção bloqueada",
    );
  });
});
