"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [binanceApiKey, setBinanceApiKey] = useState("");
  const [binanceSecretKey, setBinanceSecretKey] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    setLoading(true);
    try {
      const res = await apiRequest<{
        token: string;
      }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          binanceApiKey,
          binanceSecretKey,
        }),
      });

      localStorage.setItem("token", res.token);
      router.push("/trade/BTCUSDT");
    } catch (err) {
      alert("Registration failed");
      console.log(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white">
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-semibold">Create Account</h1>

        <input
          className="w-full p-2 bg-neutral-800 rounded"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full p-2 bg-neutral-800 rounded"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          className="w-full p-2 bg-neutral-800 rounded"
          placeholder="Binance API Key (Testnet)"
          value={binanceApiKey}
          onChange={(e) => setBinanceApiKey(e.target.value)}
        />

        <input
          className="w-full p-2 bg-neutral-800 rounded"
          placeholder="Binance Secret Key (Testnet)"
          value={binanceSecretKey}
          onChange={(e) => setBinanceSecretKey(e.target.value)}
        />

        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 p-2 rounded"
        >
          {loading ? "Creating..." : "Register"}
        </button>
      </div>
    </div>
  );
}
