"use client";

import { forwardRef, useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Input } from "@/components/ui/field";

type Props = React.ComponentProps<typeof Input>;

export const PasswordInput = forwardRef<HTMLInputElement, Props>(function PasswordInput(props, ref) {
  const [visible, setVisible] = useState(false);
  return (
    <Input
      ref={ref}
      type={visible ? "text" : "password"}
      leftIcon={<Lock className="size-4" />}
      rightSlot={
        <button type="button" onClick={() => setVisible((v) => !v)} className="grid size-8 place-items-center rounded-lg text-slate-400 hover:text-slate-700" aria-label={visible ? "Ocultar senha" : "Mostrar senha"}>
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      }
      {...props}
    />
  );
});
