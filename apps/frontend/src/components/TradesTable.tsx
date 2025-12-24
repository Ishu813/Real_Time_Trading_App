import type { RealizedTrade } from "@/types/trading";

type Props = {
  trades: RealizedTrade[];
};

export function TradesTable({ trades }: Props) {
  return (
    <table className="w-full text-sm">
      <thead className="border-b">
        <tr className="text-left text-gray-500">
          <th className="py-2">Symbol</th>
          <th>Order</th>
          <th>Realized PnL</th>
          <th>Time</th>
        </tr>
      </thead>

      <tbody>
        {trades.map((t) => (
          <tr key={t.id} className="border-b">
            <td className="py-2">{t.symbol}</td>
            <td>{t.orderId.slice(0, 8)}…</td>
            <td className={t.pnl >= 0 ? "text-green-600" : "text-red-600"}>
              {t.pnl.toFixed(2)}
            </td>
            <td className="text-gray-500">
              {new Date(t.createdAt).toLocaleTimeString()}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
