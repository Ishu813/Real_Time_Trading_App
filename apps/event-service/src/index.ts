import "dotenv/config";
import { createClient } from "redis";
import WebSocket, { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";

const redisUrl = process.env.REDIS_URL;
const JWT_SECRET = process.env.JWT_SECRET!;
if (!redisUrl) throw new Error("REDIS_URL missing");

const redis = createClient({
  url: redisUrl,
});

redis.on("error", console.error);
await redis.connect();

const subscriber = redis.duplicate();
await subscriber.connect();

const wss = new WebSocketServer({ port: 8080 });

const clients = new Map<string, WebSocket>();
console.log("Event Service WS running on ws://localhost:8080");

wss.on("connection", (ws, req) => {
  try {
    const url = new URL(req.url!, "http://localhost");
    const token = url.searchParams.get("token");

    if (!token) {
      ws.close(1008, "Missing token");
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      email: string;
    };

    console.log("WS connected user:", decoded.id);

    // attach userId to socket
    (ws as any).userId = decoded.id;
  } catch (err) {
    console.error("WS auth error:", err);
    ws.close(1008, "Invalid token");
  }
});

await subscriber.subscribe("events:order:status", (message) => {
  const event = JSON.parse(message);
  console.log("Order update:", event.orderId, event.status);

  // NEXT STEP: send via WebSocket to user
  const ws = clients.get(event.userId);

  if (!ws || ws.readyState !== WebSocket.OPEN) return;

  ws.send(
    JSON.stringify({
      type: "ORDER_UPDATE",
      data: event,
    })
  );
});
