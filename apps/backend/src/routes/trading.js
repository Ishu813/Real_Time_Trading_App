import { Router } from "express";
import { randomUUID } from "crypto";
import { redis } from "../lib/redis.js";
import { authMiddleware } from "../middlewares/auth.js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({
    adapter: new PrismaPg(pool),
});
const router = Router();
// 🔐 Protect this route
router.post("/orders", authMiddleware, async (req, res) => {
    const orderId = randomUUID();
    const { symbol, side, quantity } = req.body;
    const userId = req.user.id;
    const type = "MARKET";
    const command = {
        orderId,
        userId,
        symbol,
        side,
        type,
        quantity,
        timestamp: new Date().toISOString(),
    };
    // 1️⃣ Fetch existing position
    const filledOrders = await prisma.orderEvent.findMany({
        where: {
            userId,
            symbol,
            status: "FILLED",
        },
    });
    const currentQuantity = filledOrders.reduce((acc, o) => {
        if (!o.quantity)
            return acc;
        return o.side === "BUY" ? acc + o.quantity : acc - o.quantity;
    }, 0);
    // 2️⃣ Validate SELL
    if (side === "SELL") {
        if (currentQuantity < quantity) {
            const rejectEvent = {
                orderId,
                userId,
                symbol,
                side,
                status: "REJECTED",
                price: null,
                quantity,
                timestamp: new Date().toISOString(),
                reason: "INSUFFICIENT_POSITION",
            };
            await redis.publish("events:order:status", JSON.stringify(rejectEvent));
            return res.status(200).json({
                message: "Insufficient position to sell",
            });
        }
    }
    // 1️⃣ Publish command to Redis
    await redis.publish("commands:order:submit", JSON.stringify(command));
    // 2️⃣ Persist order command (intent)
    await prisma.orderCommand.create({
        data: {
            orderId,
            userId,
            symbol,
            side,
            type,
            quantity,
            status: "PENDING",
        },
    });
    return res.json({
        orderId,
        status: "PENDING",
    });
});
router.get("/orders", authMiddleware, async (req, res) => {
    const orders = await prisma.orderEvent.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: "desc" },
    });
    res.json(orders);
});
router.get("/orders", authMiddleware, async (req, res) => {
    try {
        const orders = await prisma.orderEvent.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: "desc" },
        });
        res.json(orders);
    }
    catch (err) {
        console.error("FETCH ORDERS ERROR:", err);
        res.status(500).json({ message: "Failed to fetch orders" });
    }
});
router.get("/positions", authMiddleware, async (req, res) => {
    const events = await prisma.orderEvent.findMany({
        where: {
            userId: req.user.id,
            status: "FILLED",
        },
        orderBy: { createdAt: "asc" },
    });
    const positions = {};
    for (const e of events) {
        if (!e.price || !e.quantity)
            continue;
        let pos = positions[e.symbol];
        if (!pos) {
            pos = positions[e.symbol] = {
                quantity: 0,
                avgPrice: 0,
                realizedPnl: 0,
            };
        }
        if (e.side === "BUY") {
            const totalCost = pos.avgPrice * pos.quantity + e.price * e.quantity;
            pos.quantity += e.quantity;
            pos.avgPrice = totalCost / pos.quantity;
        }
        if (e.side === "SELL") {
            const pnl = (e.price - pos.avgPrice) * e.quantity;
            pos.realizedPnl += pnl;
            pos.quantity -= e.quantity;
            if (pos.quantity <= 0) {
                pos.avgPrice = 0;
            }
        }
    }
    res.json(positions);
});
router.get("/pnl/realized", authMiddleware, async (req, res) => {
    const rows = await prisma.realizedPnl.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: "desc" },
    });
    res.json(rows);
});
export default router;
//# sourceMappingURL=trading.js.map