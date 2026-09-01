import "server-only";

import type { SefazAdapter } from "@/lib/nfce/adapters/sefaz-adapter";
import { SefazMockAdapter } from "@/lib/nfce/adapters/sefaz-mock-adapter";
import { assertNfceEnvironmentIsSafe, getNfceConfig } from "@/lib/nfce/config";
import type { SefazMockScenario } from "@/lib/nfce/types";

export function createSefazAdapter(
  scenario: SefazMockScenario = "authorized",
): SefazAdapter {
  const config = getNfceConfig();
  assertNfceEnvironmentIsSafe(config);

  if (config.provider === "mock" && config.environment !== "producao") {
    return new SefazMockAdapter(scenario);
  }

  throw new Error(
    "Adapter oficial da SEFAZ permanece desativado nesta fase. Use NFCE_ENV=test e NFCE_PROVIDER=mock.",
  );
}
