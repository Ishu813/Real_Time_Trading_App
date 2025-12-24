type Position = {
  symbol: string;
  quantity: number;
  avgPrice: number;
  realizedPnl: number;
};

type Props = {
  symbol: string;
  positions: Position[];
  markPrice: number;
};

export function PositionsTable({ symbol, positions, markPrice }: Props) {
  const filteredPositions = positions.filter((p) => p.symbol === symbol);
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-center text-gray-500">
          <th>Symbol</th>
          <th>Size</th>
          <th>Entry</th>
          <th>Mark</th>
          <th>Realized PnL</th>
          <th>Unrealized PnL</th>
        </tr>
      </thead>

      <tbody>
        {filteredPositions.map((pos) => {
          const unrealizedPnl = (markPrice - pos.avgPrice) * pos.quantity;

          return (
            <tr key={pos.symbol} className="border-t text-center">
              <td>{pos.symbol}</td>
              <td>{pos.quantity}</td>
              <td>{pos.avgPrice.toFixed(2)}</td>
              <td>{markPrice.toFixed(2)}</td>

              <td
                className={
                  pos.realizedPnl >= 0 ? "text-green-600" : "text-red-600"
                }
              >
                {pos.realizedPnl.toFixed(2)}
              </td>

              <td
                className={
                  unrealizedPnl >= 0 ? "text-green-600" : "text-red-600"
                }
              >
                {unrealizedPnl.toFixed(2)}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
