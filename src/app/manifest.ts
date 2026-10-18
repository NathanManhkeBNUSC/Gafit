import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gafit",
    short_name: "Gafit",
    description: "Sua ficha, suas cargas e seu progresso.",
    lang: "pt-BR",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#16101a",
    theme_color: "#16101a",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Treinar", url: "/treino", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Progresso", url: "/progresso", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
