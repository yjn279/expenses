import type { ChangeEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CategoryAmountInputProps {
  category: string;
  value: string;
  onChange: (category: string, value: string) => void;
  required?: boolean;
}

export function CategoryAmountInput({ category, value, onChange, required = false }: CategoryAmountInputProps) {
  const inputId = `category-${category.replace(/\s+/g, '-')}`;
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    if (nextValue === '' || /^\d+$/.test(nextValue)) onChange(category, nextValue);
  };

  return (
    <div className="flex items-center gap-3">
      <Label htmlFor={inputId} className="min-w-[100px] flex-shrink-0 text-[var(--font-size-body)] font-normal text-foreground">{category}</Label>
      <div className="relative flex-1">
        <Input
          id={inputId}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          placeholder="0"
          value={value}
          onChange={handleChange}
          className="pr-8 text-right"
          required={required}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--font-size-label)] text-muted-foreground">円</span>
      </div>
    </div>
  );
}
