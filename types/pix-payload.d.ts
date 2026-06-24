declare module "pix-payload" {
  interface PixPayloadOptions {
    key: string;
    name: string;
    city: string;
    amount?: number;
    transactionId?: string;
  }

  export function payload(options: PixPayloadOptions): string;
}
