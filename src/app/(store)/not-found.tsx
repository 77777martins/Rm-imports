import { PackageSearch } from "lucide-react";
import { EmptyState } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-page py-16">
      <EmptyState
        icon={<PackageSearch className="size-7" />}
        title="Página não encontrada"
        description="O conteúdo que você procura não existe ou foi removido."
        action={<ButtonLink href="/produtos">Ir para o catálogo</ButtonLink>}
      />
    </div>
  );
}
