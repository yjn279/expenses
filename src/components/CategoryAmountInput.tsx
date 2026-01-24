import type { ChangeEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CategoryAmountInputProps {
  category: string;
  value: string;
  onChange: (category: string, value: string) => void;
  required?: boolean;
}

export function CategoryAmountInput({
  category,
  value,
  onChange,
  required = false,
}: CategoryAmountInputProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (newValue === '' || /^\d+$/.test(newValue)) {
      onChange(category, newValue);
    }
  };

  const inputId = `category-${category.replace(/\s+/g, '-')}`;

  return (
    <div className="flex items-center gap-3">
      <Label
        htmlFor={inputId}
        className="min-w-[100px] flex-shrink-0 text-sm font-normal text-foreground"
      >
        {category}
      </Label>
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
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          円
        </span>
      </div>
    </div>
  );
}
