import { Router } from "express";
import { randomUUID } from "crypto";
import { redis } from "../lib/redis.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();

// 🔐 Protect this route
router.post("/orders", authMiddleware, async (req, res) => {
  const orderId = randomUUID();
  //console.log("AUTH USER:", req.user);
  const command = {
    orderId,
    userId: req.user.id, // now SAFE
    symbol: req.body.symbol,
    side: req.body.side,
    type: "MARKET",
    quantity: req.body.quantity,
    timestamp: new Date().toISOString(),
  };

  await redis.publish("commands:order:submit", JSON.stringify(command));

  res.json({ orderId, status: "PENDING" });
});

export default router;
