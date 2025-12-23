import "dotenv/config";
import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) throw new Error("REDIS_URL missing");

const redis = createClient({
  url: redisUrl,
});

redis.on("error", console.error);
await redis.connect();

const subscriber = redis.duplicate();
await subscriber.connect();

await subscriber.subscribe("events:order:status", (message) => {
  const event = JSON.parse(message);
  console.log("Order update:", event.orderId, event.status);

  // NEXT STEP: send via WebSocket to user
});
