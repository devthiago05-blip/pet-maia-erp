import { describe, expect, it } from "vitest";

import {
  formatTutorPhoneInput,
  isTutorWithoutPhone,
  normalizeTutorPhone,
  tutorPhonesMatch,
} from "@/lib/tutor-phone";
import { normalizeBrazilianWhatsAppPhone } from "@/lib/whatsapp";

describe("tutor phone rules", () => {
  it("normalizes formatted and country-code phone numbers", () => {
    expect(normalizeTutorPhone("(85) 98825-0021")).toBe("85988250021");
    expect(normalizeTutorPhone("+55 85 98825-0021")).toBe("85988250021");
    expect(formatTutorPhoneInput("85988250021")).toBe("(85) 98825-0021");
  });

  it("detects the same phone even with different formatting", () => {
    expect(tutorPhonesMatch("(85) 98825-0021", "5585988250021")).toBe(true);
    expect(tutorPhonesMatch("(85) 98825-0021", "(85) 99999-9998")).toBe(false);
  });

  it("treats blank and legacy placeholder phones as missing", () => {
    expect(isTutorWithoutPhone("")).toBe(true);
    expect(isTutorWithoutPhone(null)).toBe(true);
    expect(isTutorWithoutPhone("85999999999")).toBe(true);
    expect(tutorPhonesMatch("85999999999", "85999999999")).toBe(false);
    expect(normalizeBrazilianWhatsAppPhone("85999999999")).toBe("");
  });
});
