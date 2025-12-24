import "dotenv/config";
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
const router = Router();
const JWT_SECRET = process.env.JWT_SECRET ??
    (() => {
        throw new Error("JWT_SECRET is not defined");
    })();
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({
    adapter: new PrismaPg(pool),
});
/**
 * POST /auth/register
 */
router.post("/register", async (req, res) => {
    try {
        const { email, password, binanceApiKey, binanceSecretKey } = req.body;
        if (!email || !password || !binanceApiKey || !binanceSecretKey) {
            return res.status(400).json({
                message: "Email, password, Binance API key and secret are required",
            });
        }
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            return res.status(409).json({ message: "User already exists" });
        }
        const passwordHash = await bcrypt.hash(password, 10);
        // ⚠️ Temporary encryption placeholder (replace with real encryption later)
        const binanceApiKeyEnc = Buffer.from(binanceApiKey).toString("base64");
        const binanceSecretKeyEnc = Buffer.from(binanceSecretKey).toString("base64");
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                binanceApiKeyEnc,
                binanceSecretKeyEnc,
            },
        });
        // 🔑 JWT PAYLOAD MUST MATCH authMiddleware
        const token = jwt.sign({
            id: user.id,
            email: user.email,
        }, JWT_SECRET, { expiresIn: "1d" });
        return res.status(201).json({
            token,
            user: {
                id: user.id,
                email: user.email,
            },
        });
    }
    catch (err) {
        console.error("REGISTER ERROR:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
});
/**
 * POST /auth/login
 */
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password required" });
        }
        const user = await prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const token = jwt.sign({
            id: user.id,
            email: user.email,
        }, JWT_SECRET, { expiresIn: "1d" });
        return res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
            },
        });
    }
    catch (err) {
        console.error("LOGIN ERROR:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
});
export default router;
//# sourceMappingURL=auth.js.map