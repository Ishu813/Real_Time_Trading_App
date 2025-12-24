export type Order = {
  id: string;
  orderId: string;
  symbol: string;
  side: "BUY" | "SELL";
  status: OrderStatus;
  quantity: number;
  price: number | null;
  createdAt: string;
};

export type Position = {
  symbol: string;
  quantity: number;
  avgPrice: number;
  realizedPnl: number;
};

export type OrderPayload =
  | {
      symbol: string;
      side: "BUY" | "SELL";
      type: "MARKET";
      quantity: number;
    }
  | {
      symbol: string;
      side: "BUY" | "SELL";
      type: "LIMIT";
      quantity: number;
      price: number;
    }
  | {
      symbol: string;
      side: "BUY" | "SELL";
      type: "STOP_MARKET";
      quantity: number;
      stopPrice: number;
    };

export type OrderStatus =
  | "PENDING"
  | "PARTIALLY_FILLED"
  | "FILLED"
  | "CANCELLED"
  | "REJECTED";

export type OrderUpdatePayload = {
  orderId: string;
  symbol: string;
  side: "BUY" | "SELL";
  status: OrderStatus;
  price: number;
  quantity: number;
};

export type PriceTickPayload = {
  type: "PRICE_TICK";
  symbol: string;
  price: number;
};

export type OrderUpdateMessage = {
  type: "ORDER_UPDATE";
  data: OrderUpdatePayload;
};

export type RealizedTrade = {
  id: string;
  symbol: string;
  orderId: string;
  pnl: number;
  createdAt: string;
};
