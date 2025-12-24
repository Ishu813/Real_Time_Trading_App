"use client";

type Props = {
  symbol: string;
  connected: boolean;
};

export function Header({ symbol, connected }: Props) {
  return (
    <header className="h-14 flex items-center justify-between px-6 bg-neutral-900 border-b border-neutral-800">
      <div className="font-semibold">⚡ TradeX</div>

      <div className="text-sm text-neutral-400">{symbol}</div>

      <div className="flex items-center gap-2 text-sm">
        <span
          className={`h-2 w-2 rounded-full ${
            connected ? "bg-green-500" : "bg-red-500"
          }`}
        />
        {connected ? "Live" : "Disconnected"}
      </div>
    </header>
  );
}
