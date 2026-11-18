import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { parseNum } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Props extends Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> {
  value: number | null;
  onValueChange: (value: number | null) => void;
  prefix?: string;
}

/** Text-backed numeric input that accepts "1,5" or "1.5" and reports null when empty. */
export function NumberInput({ value, onValueChange, prefix, className, ...props }: Props) {
  const [text, setText] = useState(value == null ? "" : String(value).replace(".", ","));

  useEffect(() => {
    const current = parseNum(text);
    if (value == null && text !== "" && Number.isNaN(current)) return;
    if (value == null ? text !== "" : current !== value) {
      setText(value == null ? "" : String(value).replace(".", ","));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative">
      {prefix ? (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          {prefix}
        </span>
      ) : null}
      <Input
        inputMode="decimal"
        autoComplete="off"
        value={text}
        onChange={(e) => {
          const next = e.target.value.replace(/[^\d.,-]/g, "");
          setText(next);
          const n = parseNum(next);
          onValueChange(Number.isNaN(n) ? null : n);
        }}
        className={cn("tabular", prefix && "pl-7", className)}
        {...props}
      />
    </div>
  );
}
