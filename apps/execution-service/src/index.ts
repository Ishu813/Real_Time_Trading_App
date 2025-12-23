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

await subscriber.subscribe("commands:order:submit", async (message) => {
  const command = JSON.parse(message);

  console.log("Executing order:", command.orderId);

  // TODO: Call Binance Testnet API here

  const event = {
    orderId: command.orderId,
    userId: command.userId,
    status: "FILLED",
    symbol: command.symbol,
    price: 67000,
    quantity: command.quantity,
    timestamp: new Date().toISOString(),
  };

  await redis.publish("events:order:status", JSON.stringify(event));
});
