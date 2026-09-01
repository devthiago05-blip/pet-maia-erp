import type { SefazRequest, SefazResponse } from "@/lib/nfce/types";

export interface SefazAdapter {
  authorize(request: SefazRequest): Promise<SefazResponse>;
  query(accessKey: string): Promise<SefazResponse>;
  cancel(input: {
    accessKey: string;
    protocol: string;
    justification: string;
  }): Promise<SefazResponse>;
  inutilize(input: {
    year: number;
    series: number;
    initialNumber: number;
    finalNumber: number;
    justification: string;
  }): Promise<SefazResponse>;
}
