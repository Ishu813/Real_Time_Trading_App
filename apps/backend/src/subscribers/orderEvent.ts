import "dotenv/config";
import { createClient } from "redis";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error("REDIS_URL is not defined");
}

/**
 * Prisma (backend OWNS DB)
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

/**
 * Redis subscriber
 */
const redis = createClient({ url: redisUrl });

redis.on("error", (err) => {
  console.error("Redis error:", err);
});

export async function startOrderEventSubscriber() {
  await redis.connect();

  const subscriber = redis.duplicate();
  await subscriber.connect();

  console.log("📡 Backend subscribed to events:order:status");

  await subscriber.subscribe("events:order:status", async (message) => {
    try {
      const event = JSON.parse(message) as {
        orderId: string;
        userId: string;
        symbol: string;
        side: string;
        status: string;
        price?: number;
        quantity?: number;
        timestamp: string;
      };

      await prisma.orderEvent.create({
        data: {
          orderId: event.orderId,
          userId: event.userId,
          symbol: event.symbol,
          side: event.side,
          status: event.status,
          price: event.price ?? null,
          quantity: event.quantity ?? null,
          timestamp: new Date(event.timestamp),
        },
      });

      await prisma.orderCommand.updateMany({
        where: { orderId: event.orderId },
        data: { status: event.status },
      });

      // 🔥 REALIZED PnL (only on SELL fills)
      if (event.status === "FILLED" && event.side === "SELL") {
        if (!event.price || !event.quantity) return;

        // 1️⃣ Fetch all previous BUY fills
        const buyEvents = await prisma.orderEvent.findMany({
          where: {
            userId: event.userId,
            symbol: event.symbol,
            side: "BUY",
            status: "FILLED",
          },
          orderBy: { createdAt: "asc" },
        });

        let remainingQty = event.quantity;
        let realizedPnl = 0;

        // 2️⃣ FIFO matching
        for (const buy of buyEvents) {
          if (remainingQty <= 0) break;
          if (!buy.price || !buy.quantity) continue;

          const matchedQty = Math.min(buy.quantity, remainingQty);

          realizedPnl += (event.price - buy.price) * matchedQty;
          remainingQty -= matchedQty;
        }

        // 3️⃣ Persist realized PnL
        await prisma.realizedPnl.create({
          data: {
            userId: event.userId,
            symbol: event.symbol,
            orderId: event.orderId,
            pnl: realizedPnl,
          },
        });

        console.log("💰 Realized PnL:", realizedPnl);
      }

      console.log("✅ Order event persisted:", event.orderId);
    } catch (err) {
      console.error("❌ Failed to persist order event:", err);
    }
  });
}
