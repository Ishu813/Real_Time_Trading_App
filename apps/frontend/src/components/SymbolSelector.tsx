"use client";

type Props = {
  value: string;
  onChange: (symbol: string) => void;
};

const SYMBOLS = [
  { symbol: "BTCUSDT" },
  { symbol: "ETHUSDT" },
  { symbol: "BNBUSDT" },
  { symbol: "SOLUSDT" },
];

export function SymbolSelector({ value, onChange }: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border p-2 rounded bg-white"
    >
      {SYMBOLS.map((s) => (
        <option key={s.symbol} value={s.symbol}>
          {s.symbol}
        </option>
      ))}
    </select>
  );
}
