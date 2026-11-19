import type { Metadata, Viewport } from "next";
import "@fontsource-variable/plus-jakarta-sans";
import "./globals.css";
import { AppProviders } from "@/providers/app-providers";
import { getSettings } from "@/server/services/settings.service";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const allowIndexing = process.env.ALLOW_INDEXING === "true";
  return {
    metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
    title: { default: `${s.storeName} — ${s.tagline}`, template: `%s | ${s.storeName}` },
    description: `${s.storeName}: e-commerce farmacêutico fictício desenvolvido como projeto de portfólio full stack (Next.js, TypeScript, Prisma e PostgreSQL).`,
    applicationName: s.storeName,
    openGraph: { type: "website", locale: "pt_BR", siteName: s.storeName },
    // Loja fictícia: por padrão não é indexada para não ser confundida com farmácia real.
    robots: allowIndexing ? { index: true, follow: true } : { index: false, follow: false },
  };
}

export const viewport: Viewport = { themeColor: "#059669", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  // Cores já validadas como #RRGGBB no backend — seguras para CSS variables.
  const themeVars = { "--primary": settings.primaryColor, "--secondary": settings.secondaryColor } as React.CSSProperties;
  return (
    <html lang="pt-BR" style={themeVars}>
      <body className="min-h-dvh">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
