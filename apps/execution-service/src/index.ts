import "dotenv/config";
import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error("REDIS_URL is not defined");
}

const redis = createClient({
  url: redisUrl,
});

redis.on("error", (err) => {
  console.error("Redis error", err);
});

await redis.connect();

const subscriber = redis.duplicate();
await subscriber.connect();

async function fetchMarkPrice(symbol: string): Promise<number> {
  const res = await fetch(
    `https://testnet.binance.vision/api/v3/ticker/price?symbol=${symbol}`
  );
  const data = await res.json();
  return Number(data.price);
}

await subscriber.subscribe("commands:order:submit", async (message) => {
  const command = JSON.parse(message);

  const { orderId, userId, symbol, side, quantity, timestamp } = command;

  // TODO:
  // - Fetch user's Binance API keys from backend DB
  // - Execute order via Binance Testnet
  // - Handle partial fills / failures
  console.log("⚡ Executing order:", orderId);

  const price = await fetchMarkPrice(symbol);
  console.log("📈 Mark price used:", price);

  const executionEvent = {
    orderId,
    userId,
    symbol,
    side,
    status: "FILLED",
    price,
    quantity,
    timestamp: new Date(timestamp).toISOString(),
  };

  await redis.publish("events:order:status", JSON.stringify(executionEvent));
});
