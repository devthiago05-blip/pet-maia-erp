import { createHash } from "node:crypto";

export function signXmlMock(xml: string) {
  if (!xml.includes("<infNFe"))
    throw new Error("XML NFC-e inválido para assinatura.");
  const digest = createHash("sha256").update(xml).digest("base64");
  const signature = `<Signature xmlns="http://www.w3.org/2000/09/xmldsig#"><SignedInfo><SignatureMethod Algorithm="MOCK-SHA256"/><DigestValue>${digest}</DigestValue></SignedInfo><SignatureValue>ASSINATURA-MOCK-SEM-VALIDADE-FISCAL</SignatureValue><KeyInfo><KeyName>MOCK-DEVELOPMENT-ONLY</KeyName></KeyInfo></Signature>`;
  return {
    digest,
    signedXml: xml.replace("</NFe>", `${signature}</NFe>`),
    mode: "mock" as const,
  };
}
