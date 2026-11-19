import { describe, expect, it } from "vitest";

import { getGoogleMapsRouteUrl } from "@/components/maps/MapsRouteLink";
import {
  getAddressFromObservation,
  getAppointmentTutorAddress,
  stripAppointmentAddressLine,
} from "@/lib/appointment-observation";
import type { Appointment } from "@/types/domain";

describe("appointment address links", () => {
  it("prefers the tutor address and creates a Google Maps route", () => {
    const appointment = {
      pets: {
        nome: "AKIRA",
        tutors: {
          nome: "DALILA",
          endereco: "RUA FRANCISCO MACHADO 271",
        },
      },
    } as Appointment;

    const address = getAppointmentTutorAddress(appointment);
    expect(address).toBe("RUA FRANCISCO MACHADO 271");
    expect(getGoogleMapsRouteUrl(address)).toContain(
      "destination=RUA%20FRANCISCO%20MACHADO%20271",
    );
  });

  it("supports an address stored in an appointment observation", () => {
    const observation =
      "Tutor: CLIENTE AVULSO\nEndereco: RUA DAS FLORES 10\nTelefone: 85999999999";

    expect(getAddressFromObservation(observation)).toBe("RUA DAS FLORES 10");
    expect(stripAppointmentAddressLine(observation)).toBe(
      "Tutor: CLIENTE AVULSO\nTelefone: 85999999999",
    );
  });
});
