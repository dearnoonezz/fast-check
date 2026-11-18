import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NumberInput } from "./NumberInput";

export function QuantityStepper({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <Button type="button" size="icon" variant="outline" className="size-8" aria-label={`Diminuir ${label}`} disabled={value <= 0} onClick={() => onChange(Math.max(0, value - 1))}>
        <Minus />
      </Button>
      <NumberInput
        value={value}
        onValueChange={(v) => onChange(v == null ? 0 : Math.max(0, Math.floor(v)))}
        aria-label={`Quantidade de ${label}`}
        className="h-8 w-16 text-center"
      />
      <Button type="button" size="icon" variant="outline" className="size-8" aria-label={`Aumentar ${label}`} onClick={() => onChange(value + 1)}>
        <Plus />
      </Button>
    </div>
  );
}
