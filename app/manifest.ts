import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PET MAIA ERP",
    short_name: "PET MAIA",
    description: "Gestão comercial e operacional do PET MAIA",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#8A0EEA",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon.png",
        sizes: "any",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
