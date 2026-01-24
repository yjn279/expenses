import type { ChangeEvent } from 'react';

/**
 * カテゴリ別金額入力コンポーネントのプロパティ
 */
interface CategoryAmountInputProps {
  /** カテゴリ名 */
  category: string;
  /** 入力値（文字列） */
  value: string;
  /** 値が変更されたときに呼ばれるコールバック関数 */
  onChange: (category: string, value: string) => void;
}

export function CategoryAmountInput({
  category,
  value,
  onChange,
}: CategoryAmountInputProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
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
