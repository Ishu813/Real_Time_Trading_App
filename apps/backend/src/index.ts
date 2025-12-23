import express from "express";
import authRouter from "./routes/auth.js";
import tradingRouter from "./routes/trading.js";

const app = express();
app.use(express.json());

app.use("/auth", authRouter);
app.use("/api/trading", tradingRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(4000, () => {
  console.log("API Gateway running on port 4000");
});
