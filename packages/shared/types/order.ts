export interface OrderCommand {
  orderId: string;
  userId: string;
  symbol: string;
  side: "BUY" | "SELL";
  type: "MARKET";
  quantity: number;
  timestamp: string;
}
