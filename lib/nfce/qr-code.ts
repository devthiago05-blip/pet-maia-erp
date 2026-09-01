import QRCode from "qrcode";

export function buildMockQrCodePayload(accessKey: string) {
  if (!/^\d{44}$/.test(accessKey)) throw new Error("Chave de acesso inválida.");
  return `https://nfce.mock.local/consulta?p=${accessKey}|2|2|MOCK`;
}

export async function generateMockQrCode(accessKey: string) {
  const payload = buildMockQrCodePayload(accessKey);
  return {
    payload,
    dataUrl: await QRCode.toDataURL(payload, { margin: 1, width: 280 }),
  };
}
