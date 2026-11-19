"use client";

import { useState } from "react";
import { Input, FieldWrapper } from "@/components/ui/field";

function centsToText(cents: number | null | undefined) {
  return cents === null || cents === undefined ? "" : (cents / 100).toFixed(2).replace(".", ",");
}

interface MoneyInputProps {
  label: string;
  value: number | null | undefined;
  onChange: (cents: number | null) => void;
  error?: string;
  hint?: string;
  required?: boolean;
  allowEmpty?: boolean;
  wrapperClassName?: string;
}

/** Campo monetário em reais que expõe o valor em CENTAVOS. */
export function MoneyInput({ label, value, onChange, error, hint, required, allowEmpty, wrapperClassName }: MoneyInputProps) {
  // Enquanto o campo está em foco exibe o texto digitado; fora dele, o valor formatado.
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const display = focused ? text : centsToText(value);

  return (
    <Input
      label={label}
      required={required}
      error={error}
      hint={hint}
      inputMode="decimal"
      placeholder={allowEmpty ? "—" : "0,00"}
      leftIcon={<span className="text-xs font-semibold">R$</span>}
      wrapperClassName={wrapperClassName}
      value={display}
      onFocus={() => {
        setText(centsToText(value));
        setFocused(true);
      }}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^\d,.]/g, "");
        setText(raw);
        if (!raw) return onChange(allowEmpty ? null : 0);
        const n = Number(raw.replace(/\./g, "").replace(",", "."));
        if (Number.isFinite(n)) onChange(Math.round(n * 100));
      }}
      onBlur={() => setFocused(false)}
    />
  );
}

interface ColorInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}

export function ColorInput({ label, value: rawValue, onChange, error }: ColorInputProps) {
  const value = rawValue ?? "";
  const id = `color-${label.replace(/\W/g, "")}`;
  return (
    <FieldWrapper label={label} id={id} error={error}>
      <div className="flex gap-2">
        <input
          type="color"
          aria-label={`${label} (seletor)`}
          value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-14 shrink-0 cursor-pointer rounded-xl border border-slate-200 bg-white p-1"
        />
        <input
          id={id}
          value={value}
          maxLength={7}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-full rounded-xl border border-slate-200 px-3.5 font-mono text-sm uppercase focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary-100"
        />
      </div>
    </FieldWrapper>
  );
}
