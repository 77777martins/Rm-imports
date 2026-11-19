import { DemoBar } from "@/components/layout/demo-bar";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";
import { getSettings } from "@/server/services/settings.service";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <>
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow">
        Pular para o conteúdo
      </a>
      <DemoBar />
      <Header />
      <main id="conteudo" className="min-h-[60vh]">{children}</main>
      <Footer />
      <WhatsAppButton storeName={settings.storeName} />
    </>
  );
}
