import type { Order } from "@/types/trading";

type Props = {
  symbol: string;
  orders: Order[];
};

export function OrdersTable({ symbol, orders }: Props) {
  const filteredOrders = orders.filter((o) => o.symbol === symbol);
  return (
    <table className="w-full text-sm">
      <thead className="text-neutral-400">
        <tr>
          <th>Symbol</th>
          <th>Side</th>
          <th>Qty</th>
          <th>Price</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {filteredOrders.map((o) => (
          <tr
            key={o.orderId}
            className="border-t border-neutral-800 text-center"
          >
            <td>{o.symbol}</td>
            <td
              className={o.side === "BUY" ? "text-green-500" : "text-red-500"}
            >
              {o.side}
            </td>
            <td>{o.quantity}</td>
            <td>{o.price ?? "-"}</td>
            <td
              className={
                o.status === "FILLED"
                  ? "text-green-500"
                  : o.status === "REJECTED"
                  ? "text-red-500"
                  : "text-neutral-400"
              }
            >
              {o.status}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
