import type { ChangeEvent } from 'react';

interface CategoryAmountInputProps {
  category: string;
  value: string;
  onChange: (category: string, value: string) => void;
}

export function CategoryAmountInput({
  category,
  value,
  onChange,
}: CategoryAmountInputProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    // Only allow digits
    if (newValue === '' || /^\d+$/.test(newValue)) {
      onChange(category, newValue);
    }
  };

  return (
    <div className="category-amount-row">
      <label className="category-label">{category}</label>
      <div className="amount-input-wrapper">
        <input
          type="text"
          inputMode="numeric"
          pattern="\d*"
          placeholder="0"
          value={value}
          onChange={handleChange}
          className="amount-field"
        />
        <span className="currency">円</span>
      </div>
    </div>
  );
}
