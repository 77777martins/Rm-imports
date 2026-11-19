"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import { api } from "@/lib/api-client";
import { formatCents, formatDate } from "@/lib/utils";
import { PageTitle } from "@/components/ui/misc";
import { Pagination } from "@/components/ui/pagination";
import { Table, Td, Th, TableEmpty, TableSkeleton } from "@/components/admin/table";
import { SearchInput } from "@/components/admin/search-input";

interface Row {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  state: string | null;
  createdAt: string;
  ordersCount: number;
  totalSpentCents: number;
}

const PAGE_SIZE = 15;

export default function AdminCustomersPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const filters = { page, pageSize: PAGE_SIZE, q: q || undefined };
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin", "customers", filters],
    queryFn: async () => (await api.get<{ total: number; items: Row[] }>("/admin/customers", { params: filters })).data,
    placeholderData: keepPreviousData,
  });
  const onSearch = useCallback((v: string) => { setQ(v); setPage(1); }, []);

  return (
    <div>
      <PageTitle title="Clientes" description={data ? `${data.total} clientes cadastrados` : "Consulte cadastros e histórico."} />
      <SearchInput onSearch={onSearch} placeholder="Buscar por nome ou e-mail" className="mb-4 max-w-md" />
      <Table className={isFetching && !isLoading ? "opacity-70" : ""}>
        <thead>
          <tr><Th>Cliente</Th><Th>Telefone</Th><Th>Cidade</Th><Th>Cadastro</Th><Th className="text-right">Pedidos</Th><Th className="text-right">Total gasto</Th><Th /></tr>
        </thead>
        <tbody>
          {isLoading ? <TableSkeleton cols={7} /> : !data?.items.length ? <TableEmpty cols={7} message="Nenhum cliente encontrado." /> : data.items.map((c) => (
            <tr key={c.id} className="hover:bg-slate-50/60">
              <Td>
                <div className="flex items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-secondary text-sm font-bold text-white">{c.name.charAt(0)}</span>
                  <div><Link href={`/admin/clientes/${c.id}`} className="font-semibold text-slate-900 hover:text-primary">{c.name}</Link><p className="text-xs text-slate-400">{c.email}</p></div>
                </div>
              </Td>
              <Td>{c.phone ?? "—"}</Td>
              <Td>{c.city ? `${c.city}/${c.state}` : "—"}</Td>
              <Td>{formatDate(c.createdAt)}</Td>
              <Td className="text-right">{c.ordersCount}</Td>
              <Td className="text-right font-semibold">{formatCents(c.totalSpentCents)}</Td>
              <Td><Link href={`/admin/clientes/${c.id}`} className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-primary-50 hover:text-primary" aria-label={`Ver ${c.name}`}><Eye className="size-4" /></Link></Td>
            </tr>
          ))}
        </tbody>
      </Table>
      <div className="mt-6"><Pagination page={page} totalPages={Math.ceil((data?.total ?? 0) / PAGE_SIZE)} onPageChange={setPage} /></div>
    </div>
  );
}
