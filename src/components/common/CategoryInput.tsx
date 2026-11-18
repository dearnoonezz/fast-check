import { useId } from "react";
import { Input } from "@/components/ui/input";

export function CategoryInput({
  value,
  onChange,
  suggestions,
  id,
  placeholder = "Ex.: Bebidas",
}: {
  value: string;
  onChange: (v: string) => void;
  suggestions: string[];
  id?: string;
  placeholder?: string;
}) {
  const listId = useId();
  return (
    <>
      <Input id={id} list={listId} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      <datalist id={listId}>
        {suggestions.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </>
  );
}

export function uniqueCategories(items: { category: string }[]): string[] {
  return [...new Set(items.map((i) => i.category.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );
}
