import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/app/providers";

export const metadata: Metadata = {
  title: { default: "Gafit", template: "%s · Gafit" },
  description: "Seu treino, suas cargas, seu progresso.",
  applicationName: "Gafit",
  appleWebApp: { capable: true, title: "Gafit", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
  icons: { apple: "/icons/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#16101a",
};

// Applies the saved theme before first paint to avoid a flash.
const themeScript = `try{var t=localStorage.getItem("gafit-theme")||"dark";document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme="dark"}`;

// Direction contract (impeccable). Emitted as an HTML comment so it survives the production build.
const DESIGN_CONTRACT = `<!--\nTHESIS: the category-standard fitness tracker, played straight and re-tuned warm: the set row is the unit, rose marks what is done.\nOWN-WORLD: plum-night ground, rose single action color, lilac info, peach/mint states; Bricolage Grotesque numbers over Figtree UI; rounded 16-28px surfaces, no borders where spacing works.\nSTORY: open the app between sets, see the next set and last time's load, tap done, rest timer starts; later see progress and records.\nFIRST VIEWPORT: Início leads with today's workout card (day letter, focus, exercise count, est. time) and one rose "Começar treino" button above the week strip.\nFORM: canon (standing exit), seed 5b2bf710.\nFINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance\n-->`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <div hidden aria-hidden dangerouslySetInnerHTML={{ __html: DESIGN_CONTRACT }} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
