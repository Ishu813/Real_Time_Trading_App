"use client";

import { useEffect, useState, useCallback } from "react";
import { apiRequest } from "@/lib/api";
import type {
  Order,
  Position,
  OrderPayload,
  OrderUpdatePayload,
  RealizedTrade,
} from "@/types/trading";
import { useTradingSocket } from "@/hooks/useTradingSocket";
import { OrdersTable } from "@/components/OrdersTable";
import { PositionsTable } from "@/components/PositionsTable";
import { CandlestickChart } from "@/components/CandlestickChart";
import type { CandlestickData, UTCTimestamp } from "lightweight-charts";
import { Header } from "@/components/Header";
import { SymbolSelector } from "@/components/SymbolSelector";
import { TradesTable } from "@/components/TradesTable";

type Tab = "ORDERS" | "POSITIONS" | "TRADES";
type OrderType = "MARKET" | "LIMIT" | "STOP_MARKET";

export default function TradePage() {
  /* -------------------- core state -------------------- */
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [orders, setOrders] = useState<Order[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("ORDERS");
  const [realizedTrades, setRealizedTrades] = useState<RealizedTrade[]>([]);

  /* -------------------- market state -------------------- */
  const [candles, setCandles] = useState<CandlestickData[]>([]);
  const [interval, setInterval] = useState("1m");
  const [markPrice, setMarkPrice] = useState(0);
  const [connected, setConnected] = useState(false);

  /* -------------------- order entry -------------------- */
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [orderType, setOrderType] = useState<OrderType>("MARKET");
  const [quantity, setQuantity] = useState(0.01);
  const [limitPrice, setLimitPrice] = useState<number | null>(null);
  const [stopPrice, setStopPrice] = useState<number | null>(null);

  const executionPrice =
    orderType === "MARKET"
      ? markPrice
      : orderType === "LIMIT"
      ? limitPrice ?? 0
      : stopPrice ?? 0;

  const total = quantity * executionPrice;

  /* -------------------- initial fetch -------------------- */
  useEffect(() => {
    apiRequest<Order[]>("/api/trading/orders").then(setOrders);

    apiRequest<Record<string, Position>>("/api/trading/positions").then(
      (data) => {
        const arr = Object.entries(data).map(([symbol, pos]) => ({
          symbol,
          quantity: pos.quantity,
          avgPrice: pos.avgPrice,
          realizedPnl: pos.realizedPnl ?? 0,
        }));
        setPositions(arr);
      }
    );

    apiRequest<RealizedTrade[]>("/api/trading/pnl/realized").then(
      setRealizedTrades
    );
  }, []);

  /* -------------------- order update handler (MEMOIZED) -------------------- */
  const handleOrderUpdate = useCallback((update: OrderUpdatePayload) => {
    // Orders
    setOrders((prev) => {
      const exists = prev.find((o) => o.orderId === update.orderId);

      if (exists) {
        return prev.map((o) =>
          o.orderId === update.orderId
            ? { ...o, status: update.status, price: update.price }
            : o
        );
      }

      return [
        {
          id: update.orderId,
          orderId: update.orderId,
          symbol: update.symbol,
          side: update.side,
          status: update.status,
          quantity: update.quantity,
          price: update.price,
          realizedPnl: 0,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ];
    });

    // Positions
    setPositions((prev) => {
      const existing = prev.find((p) => p.symbol === update.symbol);
      if (!existing) return prev;

      // const qtyDelta =
      //   update.side === "BUY" ? update.quantity : -update.quantity;

      // SELL → realize PnL
      if (update.side === "SELL") {
        const closedQty = Math.min(existing.quantity, update.quantity);
        const realized = (update.price - existing.avgPrice) * closedQty;

        const remainingQty = existing.quantity - closedQty;

        // fully closed
        if (remainingQty <= 0) {
          return prev.filter((p) => p.symbol !== update.symbol);
        }

        return prev.map((p) =>
          p.symbol === update.symbol
            ? {
                ...p,
                quantity: remainingQty,
                realizedPnl: p.realizedPnl + realized,
              }
            : p
        );
      }

      // BUY → update avg price
      const totalQty = existing.quantity + update.quantity;
      const avgPrice =
        (existing.avgPrice * existing.quantity +
          update.price * update.quantity) /
        totalQty;

      return prev.map((p) =>
        p.symbol === update.symbol ? { ...p, quantity: totalQty, avgPrice } : p
      );
    });
  }, []);

  /* -------------------- websocket -------------------- */
  useTradingSocket({
    symbol,
    onOrderUpdate: handleOrderUpdate,
    onPriceTick: (tickSymbol, price) => {
      if (tickSymbol === symbol) setMarkPrice(price);
    },
    onConnect: () => setConnected(true),
    onDisconnect: () => setConnected(false),
  });

  /* -------------------- candles -------------------- */
  type BinanceKline = [
    number,
    string,
    string,
    string,
    string,
    string,
    number,
    string,
    string,
    string,
    string,
    string
  ];

  useEffect(() => {
    async function fetchCandles() {
      const res = await fetch(
        `https://testnet.binance.vision/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=100`
      );
      const data: BinanceKline[] = await res.json();

      setCandles(
        data.map((c) => ({
          time: (c[0] / 1000) as UTCTimestamp,
          open: Number(c[1]),
          high: Number(c[2]),
          low: Number(c[3]),
          close: Number(c[4]),
        }))
      );
    }

    fetchCandles();
  }, [symbol, interval]);

  useEffect(() => {
    async function fetchMarkPrice() {
      const res = await fetch(
        `https://testnet.binance.vision/api/v3/ticker/price?symbol=${symbol}`
      );
      const data: { price: string } = await res.json();
      setMarkPrice(Number(data.price));
    }

    fetchMarkPrice();
  }, [symbol]);

  /* -------------------- place order -------------------- */
  async function placeOrder() {
    let payload: OrderPayload;

    if (orderType === "MARKET") {
      payload = {
        symbol,
        side,
        type: "MARKET",
        quantity,
      };
    } else if (orderType === "LIMIT") {
      if (!limitPrice) return;
      payload = {
        symbol,
        side,
        type: "LIMIT",
        quantity,
        price: limitPrice,
      };
    } else {
      if (!stopPrice) return;
      payload = {
        symbol,
        side,
        type: "STOP_MARKET",
        quantity,
        stopPrice,
      };
    }

    const res = await apiRequest<{ orderId: string }>("/api/trading/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    setOrders((prev) => [
      {
        id: res.orderId,
        orderId: res.orderId,
        symbol,
        side,
        status: "PENDING",
        quantity,
        price:
          orderType === "MARKET"
            ? markPrice
            : orderType === "LIMIT"
            ? limitPrice
            : null,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  }

  /* -------------------- derived -------------------- */
  const visibleOrders = orders.filter((o) => o.symbol === symbol);
  // const trades = visibleOrders.filter(
  //   (o) => o.status === "FILLED" && o.price !== null
  // );
  const visiblePositions = positions.filter((p) => p.symbol === symbol);

  /* -------------------- UI -------------------- */
  return (
    <div className="h-screen flex flex-col">
      <Header symbol={symbol} connected={connected} />

      <div className="flex flex-1">
        {/* Left Panel */}
        <div className="w-80 border-r p-4 space-y-3">
          <SymbolSelector value={symbol} onChange={setSymbol} />

          <div className="flex">
            {(["BUY", "SELL"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSide(s)}
                className={`flex-1 p-2 ${
                  side === s
                    ? s === "BUY"
                      ? "bg-green-600 text-white"
                      : "bg-red-600 text-white"
                    : "bg-gray-100"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <select
            value={orderType}
            onChange={(e) => setOrderType(e.target.value as OrderType)}
            className="w-full border p-2"
          >
            <option value="MARKET">Market</option>
            <option value="LIMIT">Limit</option>
            <option value="STOP_MARKET">Stop Market</option>
          </select>

          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-full border p-2"
            placeholder="Quantity"
          />

          {orderType === "LIMIT" && (
            <input
              type="number"
              value={limitPrice ?? ""}
              onChange={(e) => setLimitPrice(Number(e.target.value))}
              className="w-full border p-2"
              placeholder="Limit Price"
            />
          )}

          {orderType === "STOP_MARKET" && (
            <input
              type="number"
              value={stopPrice ?? ""}
              onChange={(e) => setStopPrice(Number(e.target.value))}
              className="w-full border p-2"
              placeholder="Stop Price"
            />
          )}

          <div className="text-sm text-gray-600">
            Total: <span className="font-semibold">{total.toFixed(2)}</span>
          </div>

          <button
            onClick={placeOrder}
            className="w-full bg-black text-white p-2"
          >
            Place Order
          </button>
        </div>

        {/* Right Panel */}
        <div className="flex-1 p-4">
          <CandlestickChart data={candles} />

          <div className="flex gap-2 my-3">
            {["1m", "5m", "15m", "1h", "1d"].map((i) => (
              <button
                key={i}
                onClick={() => setInterval(i)}
                className={`px-3 py-1 border rounded ${
                  interval === i ? "bg-black text-white" : ""
                }`}
              >
                {i}
              </button>
            ))}
          </div>

          <div className="flex gap-4 border-b my-4">
            {(["ORDERS", "POSITIONS", "TRADES"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`pb-2 ${
                  activeTab === t
                    ? "border-b-2 border-black font-semibold"
                    : "text-gray-500"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {activeTab === "ORDERS" && (
            <OrdersTable symbol={symbol} orders={visibleOrders} />
          )}
          {activeTab === "POSITIONS" && (
            <PositionsTable
              symbol={symbol}
              positions={visiblePositions}
              markPrice={markPrice}
            />
          )}
          {activeTab === "TRADES" && (
            <TradesTable
              trades={realizedTrades.filter((t) => t.symbol === symbol)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
