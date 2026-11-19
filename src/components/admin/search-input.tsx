"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import { Input } from "@/components/ui/field";

/** Campo de busca com debounce para listagens do admin. */
export function SearchInput({ onSearch, placeholder, className }: { onSearch: (q: string) => void; placeholder: string; className?: string }) {
  const [value, setValue] = useState("");
  const debounced = useDebounce(value.trim(), 350);
  useEffect(() => onSearch(debounced), [debounced, onSearch]);
  return (
    <Input
      type="search"
      value={value}
      maxLength={80}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      leftIcon={<Search className="size-4" />}
      wrapperClassName={className}
    />
  );
}
