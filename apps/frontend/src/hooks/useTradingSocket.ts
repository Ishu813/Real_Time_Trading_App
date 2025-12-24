"use client";

import {
  OrderUpdateMessage,
  PriceTickPayload,
  OrderUpdatePayload,
} from "@/types/trading";
import { useEffect, useRef } from "react";

type SocketMessage = OrderUpdateMessage | PriceTickPayload;

type Props = {
  symbol: string;
  onOrderUpdate: (data: OrderUpdatePayload) => void;
  onPriceTick: (symbol: string, price: number) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
};

export function useTradingSocket({
  symbol,
  onOrderUpdate,
  onPriceTick,
  onConnect,
  onDisconnect,
}: Props) {
  const socketRef = useRef<WebSocket | null>(null);

  const callbacksRef = useRef({
    onOrderUpdate,
    onPriceTick,
    onConnect,
    onDisconnect,
  });

  // ✅ update refs AFTER render
  useEffect(() => {
    callbacksRef.current = {
      onOrderUpdate,
      onPriceTick,
      onConnect,
      onDisconnect,
    };
  }, [onOrderUpdate, onPriceTick, onConnect, onDisconnect]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    socketRef.current?.close();

    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL}?token=${token}&symbol=${symbol}`;
    const ws = new WebSocket(wsUrl);

    socketRef.current = ws;

    ws.onopen = () => {
      console.log("✅ WebSocket connected");
      callbacksRef.current.onConnect?.();
    };

    ws.onmessage = (event) => {
      const msg: SocketMessage = JSON.parse(event.data);

      if (msg.type === "ORDER_UPDATE") {
        callbacksRef.current.onOrderUpdate(msg.data);
      }

      if (msg.type === "PRICE_TICK") {
        callbacksRef.current.onPriceTick(msg.symbol, msg.price);
      }
    };

    ws.onerror = (err) => {
      console.error("WebSocket error", err);
    };

    ws.onclose = () => {
      console.log("🔌 WebSocket disconnected");
      callbacksRef.current.onDisconnect?.();
    };

    return () => {
      ws.close();
    };
  }, [symbol]); // 🔑 reconnect ONLY when symbol changes
}
