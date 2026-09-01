import { generateNfceAccessKey } from "@/lib/nfce/access-key";
import { calculateNfceTotals, formatXmlDecimal } from "@/lib/nfce/money";
import type { NfceBuildInput, NfcePaymentInput } from "@/lib/nfce/types";
import { validateNfceInput } from "@/lib/nfce/validation";

function xml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const paymentCodes: Record<NfcePaymentInput["method"], string> = {
  Dinheiro: "01",
  Crédito: "03",
  Débito: "04",
  Voucher: "05",
  PIX: "17",
  Outros: "99",
};

function paymentXml(payment: NfcePaymentInput) {
  const card = payment.integrated
    ? `<card><tpIntegra>1</tpIntegra>${payment.acquirerCnpj ? `<CNPJ>${xml(payment.acquirerCnpj)}</CNPJ>` : ""}${payment.authorizationCode ? `<cAut>${xml(payment.authorizationCode)}</cAut>` : ""}</card>`
    : "";
  return `<detPag><tPag>${paymentCodes[payment.method]}</tPag><vPag>${formatXmlDecimal(payment.amount)}</vPag>${card}</detPag>`;
}

export function buildNfceXml(input: NfceBuildInput) {
  const errors = validateNfceInput(input);
  if (errors.length) {
    throw new Error(errors.map((error) => error.message).join(" | "));
  }
  const accessKey = generateNfceAccessKey({
    ufCode: input.ufCode,
    issuedAt: input.issuedAt,
    cnpj: input.issuer.cnpj,
    series: input.series,
    number: input.number,
  });
  const totals = calculateNfceTotals(input.items);
  const environmentCode = input.environment === "producao" ? "1" : "2";
  const homologation = input.environment !== "producao";
  const consumerName = homologation
    ? "NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL"
    : input.customerName;
  const items = input.items
    .map((item, index) => {
      const gross = item.quantity * item.unitPrice;
      const profile = item.profile;
      const icms =
        input.issuer.taxRegime === "1"
          ? `<ICMSSN102><orig>${xml(profile.origin)}</orig><CSOSN>${xml(profile.csosn)}</CSOSN></ICMSSN102>`
          : `<ICMS00><orig>${xml(profile.origin)}</orig><CST>${xml(profile.cstIcms)}</CST><modBC>3</modBC><vBC>${formatXmlDecimal(gross)}</vBC><pICMS>${formatXmlDecimal(profile.icmsRate || 0, 4)}</pICMS><vICMS>${formatXmlDecimal((gross * (profile.icmsRate || 0)) / 100)}</vICMS></ICMS00>`;
      return `<det nItem="${index + 1}"><prod><cProd>${xml(item.code)}</cProd><cEAN>${xml(profile.gtin || "SEM GTIN")}</cEAN><xProd>${xml(item.description)}</xProd><NCM>${xml(profile.ncm)}</NCM>${profile.cest ? `<CEST>${xml(profile.cest)}</CEST>` : ""}<CFOP>${xml(profile.cfop)}</CFOP><uCom>${xml(profile.commercialUnit)}</uCom><qCom>${formatXmlDecimal(item.quantity, 4)}</qCom><vUnCom>${formatXmlDecimal(item.unitPrice, 4)}</vUnCom><vProd>${formatXmlDecimal(gross)}</vProd><cEANTrib>${xml(profile.gtin || "SEM GTIN")}</cEANTrib><uTrib>${xml(profile.taxUnit)}</uTrib><qTrib>${formatXmlDecimal(item.quantity, 4)}</qTrib><vUnTrib>${formatXmlDecimal(item.unitPrice, 4)}</vUnTrib>${item.discount ? `<vDesc>${formatXmlDecimal(item.discount)}</vDesc>` : ""}<indTot>1</indTot></prod><imposto><ICMS>${icms}</ICMS><PIS><PISAliq><CST>${xml(profile.pisCst)}</CST><vBC>${formatXmlDecimal(gross)}</vBC><pPIS>${formatXmlDecimal(profile.pisRate || 0, 4)}</pPIS><vPIS>${formatXmlDecimal((gross * (profile.pisRate || 0)) / 100)}</vPIS></PISAliq></PIS><COFINS><COFINSAliq><CST>${xml(profile.cofinsCst)}</CST><vBC>${formatXmlDecimal(gross)}</vBC><pCOFINS>${formatXmlDecimal(profile.cofinsRate || 0, 4)}</pCOFINS><vCOFINS>${formatXmlDecimal((gross * (profile.cofinsRate || 0)) / 100)}</vCOFINS></COFINSAliq></COFINS></imposto></det>`;
    })
    .join("");
  const date = input.issuedAt.toISOString().replace("Z", "-03:00");
  const output = `<?xml version="1.0" encoding="UTF-8"?><NFe xmlns="http://www.portalfiscal.inf.br/nfe"><infNFe Id="NFe${accessKey}" versao="4.00"><ide><cUF>${xml(input.ufCode)}</cUF><cNF>${accessKey.slice(35, 43)}</cNF><natOp>VENDA</natOp><mod>65</mod><serie>${input.series}</serie><nNF>${input.number}</nNF><dhEmi>${date}</dhEmi><tpNF>1</tpNF><idDest>1</idDest><cMunFG>${xml(input.municipalityCode)}</cMunFG><tpImp>4</tpImp><tpEmis>1</tpEmis><cDV>${accessKey.slice(-1)}</cDV><tpAmb>${environmentCode}</tpAmb><finNFe>1</finNFe><indFinal>1</indFinal><indPres>1</indPres><procEmi>0</procEmi><verProc>PetMaia-1.0</verProc></ide><emit><CNPJ>${input.issuer.cnpj}</CNPJ><xNome>${xml(input.issuer.legalName)}</xNome><xFant>${xml(input.issuer.tradeName || input.issuer.legalName)}</xFant><enderEmit><xLgr>${xml(input.issuer.address)}</xLgr><nro>${xml(input.issuer.number)}</nro><xBairro>${xml(input.issuer.district)}</xBairro><cMun>${input.municipalityCode}</cMun><xMun>${xml(input.issuer.city)}</xMun><UF>${xml(input.issuer.state)}</UF><CEP>${xml(input.issuer.postalCode.replace(/\D/g, ""))}</CEP><cPais>1058</cPais><xPais>BRASIL</xPais></enderEmit><IE>${xml(input.issuer.stateRegistration)}</IE><CRT>${input.issuer.taxRegime}</CRT></emit>${input.customerCpf ? `<dest><CPF>${xml(input.customerCpf.replace(/\D/g, ""))}</CPF>${consumerName ? `<xNome>${xml(consumerName)}</xNome>` : ""}<indIEDest>9</indIEDest></dest>` : ""}${items}<total><ICMSTot><vBC>0.00</vBC><vICMS>0.00</vICMS><vICMSDeson>0.00</vICMSDeson><vFCP>0.00</vFCP><vBCST>0.00</vBCST><vST>0.00</vST><vFCPST>0.00</vFCPST><vFCPSTRet>0.00</vFCPSTRet><vProd>${formatXmlDecimal(totals.subtotal)}</vProd><vFrete>0.00</vFrete><vSeg>0.00</vSeg><vDesc>${formatXmlDecimal(totals.discount)}</vDesc><vII>0.00</vII><vIPI>0.00</vIPI><vIPIDevol>0.00</vIPIDevol><vPIS>0.00</vPIS><vCOFINS>0.00</vCOFINS><vOutro>0.00</vOutro><vNF>${formatXmlDecimal(totals.total)}</vNF></ICMSTot></total><pag>${input.payments.map(paymentXml).join("")}${input.changeAmount ? `<vTroco>${formatXmlDecimal(input.changeAmount)}</vTroco>` : ""}</pag><infAdic><infCpl>${homologation ? "DOCUMENTO DE TESTE - SEM VALIDADE FISCAL" : ""}</infCpl></infAdic></infNFe></NFe>`;
  return { accessKey, xml: output, totals };
}
