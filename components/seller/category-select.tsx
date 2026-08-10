"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useT } from "@/components/providers/i18n-provider";
import { useCategories } from "@/lib/api/categories";

/**
 * Выбор категории товара. Список плоский, но сгруппирован по разделам каталога:
 * подкатегории повторяются («Игровые» есть и у ноутбуков, и у мышей), и без
 * заголовка раздела продавец не поймёт, какую из них берёт.
 *
 * Значение — строка, потому что Radix Select работает только со строками;
 * наружу отдаём id числом.
 */
export function CategorySelect({
  value,
  onChange,
  disabled,
}: {
  value: number | null;
  onChange: (id: number | null) => void;
  disabled?: boolean;
}) {
  const { locale } = useT();
  const { roots, isLoading } = useCategories();

  return (
    <Select
      value={value ? String(value) : undefined}
      onValueChange={(v) => onChange(Number(v))}
      disabled={disabled || isLoading}
    >
      <SelectTrigger className="w-full">
        <SelectValue
          placeholder={isLoading ? "Загружаем категории…" : "Выберите категорию"}
        />
      </SelectTrigger>
      <SelectContent>
        {roots.map((root) => (
          <SelectGroup key={root.id}>
            <SelectLabel>{root.name[locale]}</SelectLabel>
            {root.children.length > 0 ? (
              root.children.map((child) => (
                <SelectItem key={child.id} value={String(child.id)}>
                  {child.name[locale]}
                </SelectItem>
              ))
            ) : (
              // Раздел без подкатегорий выбирается сам — иначе он был бы
              // виден в списке, но недоступен.
              <SelectItem value={String(root.id)}>
                {root.name[locale]}
              </SelectItem>
            )}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}
