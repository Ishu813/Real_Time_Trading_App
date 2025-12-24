import express from "express";
import authRouter from "./routes/auth.js";
import tradingRouter from "./routes/trading.js";
import { startOrderEventSubscriber } from "./subscribers/orderEvent.js";
import cors from "cors";
const app = express();
app.use(express.json());
const origin_url = process.env.CORS_ORIGIN_URL ?? "http://localhost:3000";
app.use(cors({
    origin: origin_url,
    credentials: true,
}));
app.use("/auth", authRouter);
app.use("/api/trading", tradingRouter);
await startOrderEventSubscriber();
app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log("API Gateway running on port 4000");
});
//# sourceMappingURL=index.js.map