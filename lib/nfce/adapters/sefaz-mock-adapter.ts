import type { SefazAdapter } from "@/lib/nfce/adapters/sefaz-adapter";
import type {
  SefazMockScenario,
  SefazRequest,
  SefazResponse,
} from "@/lib/nfce/types";

const responses: Record<
  Exclude<SefazMockScenario, "timeout" | "unavailable">,
  Pick<SefazResponse, "status" | "cStat" | "message">
> = {
  authorized: {
    status: "authorized",
    cStat: 100,
    message: "Autorizado o uso da NF-e",
  },
  duplicate: {
    status: "rejected",
    cStat: 204,
    message: "Duplicidade de NF-e",
  },
  invalid_schema: {
    status: "rejected",
    cStat: 215,
    message: "Falha no schema XML",
  },
  issuer_disabled: {
    status: "rejected",
    cStat: 203,
    message: "Emitente não habilitado",
  },
  payment_rejected: {
    status: "rejected",
    cStat: 391,
    message: "Rejeição: Não informados os dados do cartão de crédito/débito",
  },
};

export class SefazMockAdapter implements SefazAdapter {
  private readonly documents = new Map<string, SefazResponse>();

  constructor(private readonly scenario: SefazMockScenario = "authorized") {}

  async authorize(request: SefazRequest): Promise<SefazResponse> {
    if (this.scenario === "timeout") {
      throw new Error("[NFCE][TEST][SEND] Timeout simulado da SEFAZ");
    }
    if (this.scenario === "unavailable") {
      throw new Error("[NFCE][TEST][SEND] SEFAZ indisponível (simulação)");
    }

    const base = responses[this.scenario];
    const response: SefazResponse = {
      ...base,
      protocol:
        base.status === "authorized"
          ? `TEST${request.accessKey.slice(-12)}`
          : undefined,
      receivedAt: new Date().toISOString(),
    };
    this.documents.set(request.accessKey, response);
    return response;
  }

  async query(accessKey: string): Promise<SefazResponse> {
    return (
      this.documents.get(accessKey) || {
        status: "rejected",
        cStat: 217,
        message: "NF-e não consta na base de dados da SEFAZ",
        receivedAt: new Date().toISOString(),
      }
    );
  }

  async cancel(input: {
    accessKey: string;
    protocol: string;
    justification: string;
  }): Promise<SefazResponse> {
    if (input.justification.trim().length < 15) {
      return {
        status: "rejected",
        cStat: 220,
        message: "Prazo de Cancelamento Superior ao Previsto na Legislação",
        receivedAt: new Date().toISOString(),
      };
    }
    const response: SefazResponse = {
      status: "cancelled",
      cStat: 135,
      message: "Evento registrado e vinculado a NF-e",
      protocol: `CANCEL-${input.protocol}`,
      receivedAt: new Date().toISOString(),
    };
    this.documents.set(input.accessKey, response);
    return response;
  }

  async inutilize(): Promise<SefazResponse> {
    return {
      status: "inutilized",
      cStat: 102,
      message: "Inutilização de número homologado",
      protocol: `INUT-${Date.now()}`,
      receivedAt: new Date().toISOString(),
    };
  }
}
